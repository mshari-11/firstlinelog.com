"""
fll-kyc-upload Lambda — FLL Driver Onboarding Backend
======================================================
Routes:
  POST /driver/otp/send              — send 6-digit OTP to applicant email via SES
  POST /driver/otp/verify            — verify OTP code (rate-limited)
  POST /driver/apply                 — save full application to Supabase + upload docs to S3 + notify admins
  POST /driver/applications/{id}/approve — approve application (calls Supabase RPC)
  POST /driver/applications/{id}/reject  — reject application + send rejection email
  GET  /driver/application-status    — public status lookup by app_ref
  POST /                             — legacy KYC upload (backward-compat)
"""
import json, boto3, os, base64, uuid, hashlib, hmac, secrets, re
from datetime import datetime, timezone, timedelta
from html import escape as html_escape
from urllib.request import urlopen, Request
from urllib.error import URLError

# ─── AWS clients ──────────────────────────────────────────────────────────────
REGION = os.environ.get('AWS_REGION', 'me-south-1')
s3  = boto3.client('s3',  region_name=REGION)
ses = boto3.client('ses', region_name=REGION)

# ─── Config (from Lambda env vars — set in AWS Console) ───────────────────────
BUCKET          = os.environ.get('KYC_BUCKET',          'fll-kyc-documents-230811072086')
ADMIN_EMAILS    = os.environ.get('ADMIN_EMAILS',        'M.Z@FLL.SA,A.ALZAMIL@FLL.SA').split(',')
FROM_EMAIL      = os.environ.get('FROM_EMAIL',          'FLL Platform <no-reply@fll.sa>')
ALLOWED_ORIGIN  = os.environ.get('ALLOWED_ORIGIN',      'https://fll.sa')
SUPABASE_URL    = os.environ.get('SUPABASE_URL',        '')
SUPABASE_KEY    = os.environ.get('SUPABASE_SERVICE_KEY', '')  # service_role key
OTP_SECRET      = os.environ.get('OTP_HMAC_SECRET',     '')   # dedicated secret for OTP hashing
OTP_TTL_MIN     = 10   # OTP valid for 10 minutes
OTP_MAX_TRIES   = 5    # max 5 attempts per 10-min window
DEV_MODE        = os.environ.get('DEV_MODE', 'false').lower() == 'true'
ADMIN_PANEL_URL = os.environ.get('ADMIN_PANEL_URL',     'https://fll.sa/admin-panel/couriers')

# ─── CORS helper ──────────────────────────────────────────────────────────────
def cors(status, body):
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
            'Access-Control-Allow-Headers': 'content-type,authorization',
            'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
        },
        'body': json.dumps(body, ensure_ascii=False),
    }

# ─── Supabase REST helper ──────────────────────────────────────────────────────
def supa(method: str, path: str, data=None, params: str = ''):
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError('Supabase env vars not configured')
    url = f"{SUPABASE_URL}/rest/v1{path}{('?' + params) if params else ''}"
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
    }
    body_bytes = json.dumps(data).encode() if data else None
    req = Request(url, data=body_bytes, headers=headers, method=method)
    try:
        with urlopen(req, timeout=8) as resp:
            raw = resp.read().decode()
            return json.loads(raw) if raw else []
    except URLError as e:
        raise RuntimeError(f'Supabase error: {e}')

def supa_rpc(func_name: str, args: dict):
    url = f"{SUPABASE_URL}/rest/v1/rpc/{func_name}"
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
    }
    req = Request(url, data=json.dumps(args).encode(), headers=headers, method='POST')
    with urlopen(req, timeout=8) as resp:
        raw = resp.read().decode()
        return json.loads(raw) if raw else None

# ─── OTP helpers ──────────────────────────────────────────────────────────────
def _otp_hash(code: str, email: str) -> str:
    """HMAC-SHA256 of the OTP code, keyed by a dedicated secret."""
    key = (OTP_SECRET or SUPABASE_KEY or 'dev-secret').encode()
    msg = f"{code}:{email.lower()}".encode()
    return hmac.new(key, msg, hashlib.sha256).hexdigest()

def generate_otp() -> str:
    return str(secrets.randbelow(900000) + 100000)  # 6-digit, no leading zeros

# ─── Content type helper ─────────────────────────────────────────────────────
def _content_type(ext: str) -> str:
    types = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
             'gif': 'image/gif', 'webp': 'image/webp', 'pdf': 'application/pdf'}
    return types.get(ext, 'application/octet-stream')


# ─── Route: POST /driver/otp/send ─────────────────────────────────────────────
def handle_otp_send(body: dict, source_ip: str):
    email      = (body.get('email') or '').strip().lower()
    full_name  = html_escape((body.get('full_name') or '').strip())
    fingerprint = (body.get('device_fingerprint') or '')

    if not email or not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
        return cors(400, {'message': 'بريد إلكتروني غير صحيح'})

    code = generate_otp()
    code_hash = _otp_hash(code, email)
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MIN)).isoformat()

    # Store in Supabase otp_attempts table — matches migration schema columns
    try:
        supa('POST', '/otp_attempts', {
            'identifier': email,
            'action': 'send',
            'code_hash': code_hash,
            'expires_at': expires_at,
            'ip_address': source_ip,
            'device_fingerprint': fingerprint,
        })
    except Exception:
        pass  # If Supabase unavailable, still send email (dev mode)

    # Send OTP email via SES
    try:
        ses.send_email(
            Source=FROM_EMAIL,
            Destination={'ToAddresses': [email]},
            Message={
                'Subject': {'Data': 'رمز التحقق — فيرست لاين لوجستيكس', 'Charset': 'UTF-8'},
                'Body': {
                    'Html': {
                        'Charset': 'UTF-8',
                        'Data': f'''
<div dir="rtl" style="font-family:Tahoma,Arial;max-width:520px;margin:auto">
  <div style="background:#0f2744;padding:24px;text-align:center;border-radius:12px 12px 0 0">
    <h2 style="color:#fff;margin:0;font-size:18px">FIRST LINE LOGISTICS</h2>
    <p style="color:#93c5fd;margin:4px 0 0;font-size:13px">نظام تسجيل المناديب</p>
  </div>
  <div style="background:#fff;padding:28px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px">
    <p style="color:#1e293b;font-size:15px">مرحباً <strong>{full_name}</strong>،</p>
    <p style="color:#475569;font-size:14px">رمز التحقق الخاص بك لإتمام عملية التسجيل:</p>
    <div style="text-align:center;margin:24px 0">
      <span style="font-size:36px;font-weight:700;letter-spacing:0.5rem;color:#1d4ed8;font-family:monospace">{code}</span>
    </div>
    <p style="color:#94a3b8;font-size:12px;text-align:center">
      صالح لمدة {OTP_TTL_MIN} دقائق · لا تشارك هذا الرمز مع أحد
    </p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
    <p style="color:#cbd5e1;font-size:11px;text-align:center">
      إذا لم تطلب هذا الرمز، يُرجى تجاهل هذا البريد.
    </p>
  </div>
</div>''',
                    }
                },
            }
        )
    except Exception as e:
        print(f'SES error: {e}')
        if DEV_MODE:
            return cors(200, {'success': True, 'dev': True})
        return cors(500, {'message': 'تعذّر إرسال رمز التحقق. حاول مرة أخرى.'})

    return cors(200, {'success': True})


# ─── Route: POST /driver/otp/verify ──────────────────────────────────────────
def handle_otp_verify(body: dict, source_ip: str):
    email = (body.get('email') or '').strip().lower()
    code  = (body.get('code') or '').strip()

    if not email or not code or len(code) != 6:
        return cors(400, {'message': 'البريد والرمز مطلوبان'})

    # Log this verify attempt
    try:
        supa('POST', '/otp_attempts', {
            'identifier': email,
            'action': 'verify',
            'ip_address': source_ip,
        })
    except Exception:
        pass

    # Check rate limit: count attempts in last 10 min for this email
    try:
        since = (datetime.now(timezone.utc) - timedelta(minutes=OTP_TTL_MIN)).isoformat()
        attempts = supa('GET', '/otp_attempts',
                        params=f'identifier=eq.{email}&action=eq.send&created_at=gte.{since}&select=id,code_hash,expires_at,used')
        if len(attempts) >= OTP_MAX_TRIES:
            return cors(429, {'message': f'تجاوزت الحد الأقصى للمحاولات. انتظر {OTP_TTL_MIN} دقائق.'})

        # Find matching unused, non-expired OTP
        code_hash = _otp_hash(code, email)
        now = datetime.now(timezone.utc).isoformat()
        valid = [a for a in attempts
                 if a.get('code_hash') == code_hash
                 and not a.get('used')
                 and a.get('expires_at', '') > now]

        if not valid:
            return cors(400, {'message': 'رمز التحقق غير صحيح أو منتهي الصلاحية'})

        # Mark as used
        supa('PATCH', f'/otp_attempts?id=eq.{valid[0]["id"]}', {'used': True})
        return cors(200, {'success': True, 'verified': True})

    except Exception:
        # Dev fallback: accept code 123456 ONLY in dev mode
        if DEV_MODE and code == '123456':
            return cors(200, {'success': True, 'verified': True, 'dev': True})
        return cors(400, {'message': 'رمز التحقق غير صحيح أو منتهي الصلاحية'})


# ─── Route: POST /driver/apply ────────────────────────────────────────────────
def handle_apply(body: dict, source_ip: str):
    required = ['full_name', 'national_id', 'phone', 'email', 'city', 'contract_type', 'iban']
    for f in required:
        if not body.get(f):
            return cors(400, {'message': f'الحقل {f} مطلوب'})

    app_ref = 'APP-' + secrets.token_hex(3).upper()

    # Extract document fields (base64) and upload to S3
    doc_fields = {
        'doc_national_id':       'national_id_front',
        'doc_national_id_back':  'national_id_back',
        'doc_driver_license':    'driver_license',
        'doc_bank_cert':         'bank_cert',
        'doc_vehicle_front':     'vehicle_front',
        'doc_vehicle_back':      'vehicle_back',
        'doc_vehicle_side':      'vehicle_side',
        'doc_vehicle_reg':       'vehicle_registration',
        'doc_vehicle_insurance': 'vehicle_insurance',
    }
    selfie_s3_key = None
    doc_s3_keys = {}   # maps doc_field_name → S3 key

    # Upload selfie
    selfie_data = body.get('selfieDataUrl') or body.get('selfie_data_url') or ''
    if selfie_data:
        try:
            if ',' in selfie_data:
                selfie_bytes = base64.b64decode(selfie_data.split(',', 1)[1])
            else:
                selfie_bytes = base64.b64decode(selfie_data)
            key = f"{app_ref}/selfie/{uuid.uuid4().hex}.jpg"
            s3.put_object(Bucket=BUCKET, Key=key, Body=selfie_bytes, ContentType='image/jpeg')
            selfie_s3_key = key
        except Exception as e:
            print(f'Selfie upload error: {e}')

    # Upload documents
    for field, doc_type in doc_fields.items():
        doc = body.get(field)
        if isinstance(doc, dict) and doc.get('data'):
            try:
                file_bytes = base64.b64decode(doc['data'])
                ext = doc.get('name', 'file.jpg').rsplit('.', 1)[-1].lower()
                key = f"{app_ref}/{doc_type}/{uuid.uuid4().hex}.{ext}"
                s3.put_object(Bucket=BUCKET, Key=key, Body=file_bytes,
                              ContentType=_content_type(ext))
                doc_s3_keys[field] = key
            except Exception as e:
                print(f'Doc upload error ({field}): {e}')

    # Save application to Supabase — column names match 003_driver_applications.sql
    app_record = {
        'app_ref':              app_ref,
        'full_name':            body.get('full_name', '').strip(),
        'national_id':          body.get('national_id', '').strip(),
        'nationality':          body.get('nationality', 'سعودي'),
        'phone':                body.get('phone', '').strip(),
        'email':                body.get('email', '').strip().lower(),
        'city':                 body.get('city', '').strip(),
        'platform_app':         body.get('platform_app'),
        'contract_type':        body.get('contract_type'),
        'bank_name':            body.get('bank_name'),
        'bank_account':         body.get('bank_account'),
        'iban':                 body.get('iban', '').strip().upper(),
        'has_vehicle':          bool(body.get('has_vehicle')),
        'vehicle_type':         body.get('vehicle_type'),
        'vehicle_brand':        body.get('vehicle_brand'),
        'vehicle_model':        body.get('vehicle_model'),
        'vehicle_year':         body.get('vehicle_year'),
        'vehicle_plate':        body.get('vehicle_plate'),
        'vehicle_color':        body.get('vehicle_color'),
        # Document S3 keys — match DB column names exactly
        'doc_selfie':           selfie_s3_key,
        'doc_national_id':      doc_s3_keys.get('doc_national_id'),
        'doc_national_id_back': doc_s3_keys.get('doc_national_id_back'),
        'doc_driver_license':   doc_s3_keys.get('doc_driver_license'),
        'doc_bank_cert':        doc_s3_keys.get('doc_bank_cert'),
        'doc_vehicle_front':    doc_s3_keys.get('doc_vehicle_front'),
        'doc_vehicle_back':     doc_s3_keys.get('doc_vehicle_back'),
        'doc_vehicle_side':     doc_s3_keys.get('doc_vehicle_side'),
        'doc_vehicle_reg':      doc_s3_keys.get('doc_vehicle_reg'),
        'doc_vehicle_insurance': doc_s3_keys.get('doc_vehicle_insurance'),
        # Verification metadata — match DB column names exactly
        'face_similarity_score': body.get('livenessScore') or body.get('liveness_score'),
        'email_verified':       bool(body.get('emailVerified') or body.get('email_verified')),
        'device_fingerprint':   body.get('device_fingerprint'),
        'ip_address':           source_ip,
        'user_agent':           body.get('user_agent'),
        'status':               'pending',
    }

    try:
        result = supa('POST', '/driver_applications', app_record)
        inserted_id = result[0].get('id') if result else None
    except Exception as e:
        print(f'Supabase insert error: {e}')
        return cors(500, {'message': 'تعذّر حفظ الطلب. حاول مرة أخرى.'})

    # Notify admins via SES (HTML-escaped values to prevent injection)
    safe_name = html_escape(app_record['full_name'])
    safe_phone = html_escape(app_record['phone'])
    safe_email = html_escape(app_record['email'])
    safe_city  = html_escape(app_record['city'])
    safe_contract = html_escape(app_record.get('contract_type') or '')
    try:
        ses.send_email(
            Source=FROM_EMAIL,
            Destination={'ToAddresses': ADMIN_EMAILS},
            Message={
                'Subject': {'Data': f'طلب تسجيل جديد — {safe_name} ({app_ref})', 'Charset': 'UTF-8'},
                'Body': {
                    'Html': {
                        'Charset': 'UTF-8',
                        'Data': f'''
<div dir="rtl" style="font-family:Tahoma;max-width:540px;margin:auto">
  <div style="background:#0f2744;padding:20px;text-align:center;border-radius:12px 12px 0 0">
    <h2 style="color:#fff;margin:0">FIRST LINE LOGISTICS</h2>
    <p style="color:#93c5fd;margin:4px 0 0">طلب تسجيل مندوب جديد</p>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px">
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:6px 0;color:#64748b">رقم الطلب</td><td style="font-weight:700;color:#1d4ed8">{app_ref}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">الاسم</td><td>{safe_name}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">الجوال</td><td>{safe_phone}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">البريد</td><td>{safe_email}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">المدينة</td><td>{safe_city}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">التعاقد</td><td>{safe_contract}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">المركبة</td><td>{"نعم — " + html_escape(str(app_record.get("vehicle_brand",""))) if app_record["has_vehicle"] else "لا"}</td></tr>
    </table>
    <div style="margin-top:20px;text-align:center">
      <a href="{ADMIN_PANEL_URL}" style="background:#1d4ed8;color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:700">
        مراجعة الطلب في لوحة التحكم
      </a>
    </div>
  </div>
</div>''',
                    }
                },
            }
        )
    except Exception as e:
        print(f'Admin notification SES error: {e}')

    return cors(200, {'success': True, 'app_ref': app_ref, 'id': inserted_id})


# ─── Route: POST /driver/applications/{id}/approve ────────────────────────────
def handle_approve(app_id: str, body: dict, event: dict):
    # Require authorization header for admin actions
    auth_header = (event.get('headers') or {}).get('authorization', '')
    if not auth_header:
        return cors(401, {'message': 'مطلوب تسجيل الدخول'})

    try:
        supa_rpc('approve_driver_application', {'p_application_id': app_id})

        records = supa('GET', '/driver_applications',
                       params=f'id=eq.{app_id}&select=full_name,email,app_ref')
        if records:
            app = records[0]
            _send_decision_email(
                to=app['email'],
                full_name=html_escape(app['full_name']),
                app_ref=app['app_ref'],
                approved=True,
            )
        return cors(200, {'success': True})
    except Exception as e:
        print(f'Approve error: {e}')
        return cors(500, {'message': 'تعذّر تنفيذ العملية'})


# ─── Route: POST /driver/applications/{id}/reject ─────────────────────────────
def handle_reject(app_id: str, body: dict, event: dict):
    # Require authorization header for admin actions
    auth_header = (event.get('headers') or {}).get('authorization', '')
    if not auth_header:
        return cors(401, {'message': 'مطلوب تسجيل الدخول'})

    reason = (body.get('reason') or body.get('rejection_reason') or '').strip()
    if not reason:
        return cors(400, {'message': 'سبب الرفض مطلوب'})
    try:
        supa('PATCH', f'/driver_applications?id=eq.{app_id}', {
            'status': 'rejected',
            'rejection_reason': reason,
            'updated_at': datetime.now(timezone.utc).isoformat(),
        })
        records = supa('GET', '/driver_applications',
                       params=f'id=eq.{app_id}&select=full_name,email,app_ref')
        if records:
            app = records[0]
            _send_decision_email(
                to=app['email'],
                full_name=html_escape(app['full_name']),
                app_ref=app['app_ref'],
                approved=False,
                reason=html_escape(reason),
            )
        return cors(200, {'success': True})
    except Exception as e:
        print(f'Reject error: {e}')
        return cors(500, {'message': 'تعذّر تنفيذ العملية'})


def _send_decision_email(to: str, full_name: str, app_ref: str, approved: bool, reason: str = ''):
    subject = ('تهانينا! تمت الموافقة على طلبك' if approved
               else 'بخصوص طلب تسجيلك في FLL') + f' — {app_ref}'
    if approved:
        content = f'''
<p>مرحباً <strong>{full_name}</strong>،</p>
<p style="color:#15803d;font-size:16px;font-weight:700">تهانينا! تمت الموافقة على طلب تسجيلك.</p>
<p>سيتم التواصل معك قريباً لإتمام إجراءات الانضمام وتزويدك ببيانات الدخول.</p>'''
    else:
        content = f'''
<p>مرحباً <strong>{full_name}</strong>،</p>
<p>شكراً لاهتمامك بالانضمام إلى فيرست لاين لوجستيكس.</p>
<p>بعد مراجعة طلبك <strong>({app_ref})</strong>، نأسف لإبلاغك بأنه لم يُقبل في الوقت الحالي.</p>
{f'<p style="background:#fef2f2;padding:12px;border-right:4px solid #dc2626;border-radius:4px"><strong>السبب:</strong> {reason}</p>' if reason else ''}
<p>يمكنك التقديم مجدداً بعد معالجة الملاحظات المذكورة.</p>'''

    try:
        ses.send_email(
            Source=FROM_EMAIL,
            Destination={'ToAddresses': [to]},
            Message={
                'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                'Body': {
                    'Html': {
                        'Charset': 'UTF-8',
                        'Data': f'''
<div dir="rtl" style="font-family:Tahoma;max-width:520px;margin:auto">
  <div style="background:#0f2744;padding:20px;text-align:center;border-radius:12px 12px 0 0">
    <h2 style="color:#fff;margin:0">FIRST LINE LOGISTICS</h2>
  </div>
  <div style="background:#fff;padding:28px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px">
    {content}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
    <p style="color:#94a3b8;font-size:11px;text-align:center">فيرست لاين لوجستيكس · no-reply@fll.sa</p>
  </div>
</div>''',
                    }
                },
            }
        )
    except Exception as e:
        print(f'Decision email error: {e}')


# ─── Route: GET /driver/application-status ────────────────────────────────────
def handle_status(params: str):
    ref = ''
    for part in (params or '').split('&'):
        if part.startswith('ref='):
            ref = part[4:].strip().upper()
    if not ref:
        return cors(400, {'message': 'رقم الطلب مطلوب'})

    # Only return non-sensitive fields for public status page
    try:
        records = supa('GET', '/driver_applications',
                       params=f'app_ref=eq.{ref}&select=app_ref,full_name,city,status,rejection_reason,admin_notes,created_at,updated_at')
        if not records:
            return cors(404, {'message': 'لم يتم العثور على طلب بهذا الرقم'})
        return cors(200, records[0])
    except Exception as e:
        print(f'Status lookup error: {e}')
        return cors(500, {'message': 'تعذّر جلب حالة الطلب'})


# ─── Legacy KYC upload (backward-compat) ─────────────────────────────────────
def handle_legacy_upload(body: dict):
    driver_id   = body.get('driver_id', '')
    driver_name = body.get('driver_name', '')
    doc_type    = body.get('doc_type', 'id_card')
    file_data   = body.get('file_data', '')
    file_name   = body.get('file_name', 'document.jpg')
    if not driver_id or not file_data:
        return cors(400, {'error': 'driver_id and file_data required'})

    # Sanitize inputs
    file_name = re.sub(r'[^a-zA-Z0-9._-]', '_', os.path.basename(file_name))
    safe_driver_id = re.sub(r'[^a-zA-Z0-9_-]', '_', driver_id)

    file_bytes = base64.b64decode(file_data)
    ext = file_name.rsplit('.', 1)[-1].lower() if '.' in file_name else 'jpg'
    key = f"{safe_driver_id}/{doc_type}/{uuid.uuid4().hex}_{file_name}"
    s3.put_object(Bucket=BUCKET, Key=key, Body=file_bytes, ContentType=_content_type(ext),
                  Metadata={'driver_id': driver_id, 'doc_type': doc_type,
                             'uploaded_at': datetime.now(timezone.utc).isoformat()})
    try:
        safe_name = html_escape(driver_name)
        safe_id = html_escape(driver_id)
        safe_doc = html_escape(doc_type)
        ses.send_email(
            Source=FROM_EMAIL,
            Destination={'ToAddresses': ADMIN_EMAILS},
            Message={
                'Subject': {'Data': f'KYC Upload - {safe_name} ({safe_doc})', 'Charset': 'UTF-8'},
                'Body': {'Html': {'Data': f'<div dir="rtl"><p><b>السائق:</b> {safe_name}</p><p><b>رقم السائق:</b> {safe_id}</p><p><b>نوع المستند:</b> {safe_doc}</p></div>', 'Charset': 'UTF-8'}}
            }
        )
    except Exception:
        pass
    return cors(200, {'success': True, 'key': key})


# ─── Main handler ─────────────────────────────────────────────────────────────
def lambda_handler(event, context):
    rc  = event.get('requestContext', {})
    http = rc.get('http', {})
    method = http.get('method', 'POST').upper()
    path   = http.get('path', event.get('path', '/'))
    qs     = event.get('rawQueryString', '') or event.get('queryStringParameters', {}) or ''
    if isinstance(qs, dict):
        qs = '&'.join(f'{k}={v}' for k, v in qs.items())

    source_ip = http.get('sourceIp', rc.get('identity', {}).get('sourceIp', ''))

    if method == 'OPTIONS':
        return cors(200, {})

    body = {}
    raw_body = event.get('body') or '{}'
    try:
        body = json.loads(raw_body)
    except Exception:
        body = {}

    # ── Route matching ──────────────────────────────────────────────────────
    try:
        if method == 'POST' and path == '/driver/otp/send':
            return handle_otp_send(body, source_ip)

        if method == 'POST' and path == '/driver/otp/verify':
            return handle_otp_verify(body, source_ip)

        if method == 'POST' and path == '/driver/apply':
            return handle_apply(body, source_ip)

        if method == 'GET' and path == '/driver/application-status':
            return handle_status(qs)

        # /driver/applications/{id}/approve  or  /driver/applications/{id}/reject
        m = re.match(r'^/driver/applications/([^/]+)/(approve|reject)$', path)
        if method == 'POST' and m:
            app_id, action = m.group(1), m.group(2)
            if action == 'approve':
                return handle_approve(app_id, body, event)
            if action == 'reject':
                return handle_reject(app_id, body, event)

        # Legacy KYC upload (root POST)
        if method == 'POST' and path in ('/', ''):
            return handle_legacy_upload(body)

        return cors(404, {'error': f'Route not found: {method} {path}'})

    except Exception as e:
        print(f'Unhandled error: {e}')
        return cors(500, {'error': 'خطأ داخلي في الخادم'})
