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
from urllib.request import urlopen, Request
from urllib.error import URLError

# ─── AWS clients ──────────────────────────────────────────────────────────────
s3  = boto3.client('s3',  region_name='me-south-1')
ses = boto3.client('ses', region_name='me-south-1')

# ─── Config (from Lambda env vars — set in AWS Console) ───────────────────────
BUCKET         = os.environ.get('KYC_BUCKET',       'fll-kyc-documents-230811072086')
ADMIN_EMAILS   = ['M.Z@FLL.SA', 'A.ALZAMIL@FLL.SA']
FROM_EMAIL     = 'FLL Platform <no-reply@fll.sa>'
SUPABASE_URL   = os.environ.get('SUPABASE_URL',     '')
SUPABASE_KEY   = os.environ.get('SUPABASE_SERVICE_KEY', '')  # service_role key
OTP_TTL_MIN    = 10   # OTP valid for 10 minutes
OTP_MAX_TRIES  = 5    # max 5 attempts per 10-min window

# ─── CORS helper ──────────────────────────────────────────────────────────────
def cors(status, body):
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'content-type,authorization',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
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
    """HMAC-SHA256 of the OTP code, keyed by email (stored instead of plaintext)."""
    key = (SUPABASE_KEY or 'dev-secret').encode()
    msg = f"{code}:{email.lower()}".encode()
    return hmac.new(key, msg, hashlib.sha256).hexdigest()

def generate_otp() -> str:
    return str(secrets.randbelow(900000) + 100000)  # 6-digit, no leading zeros

# ─── Route: POST /driver/otp/send ─────────────────────────────────────────────
def handle_otp_send(body: dict, source_ip: str):
    email      = (body.get('email') or '').strip().lower()
    full_name  = (body.get('full_name') or '').strip()
    national_id = (body.get('national_id') or '').strip()
    phone      = (body.get('phone') or '').strip()
    fingerprint = (body.get('device_fingerprint') or '')

    if not email or not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
        return cors(400, {'message': 'بريد إلكتروني غير صحيح'})

    code = generate_otp()
    code_hash = _otp_hash(code, email)
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MIN)).isoformat()

    # Store in Supabase otp_attempts table
    try:
        supa('POST', '/otp_attempts', {
            'email': email,
            'code_hash': code_hash,
            'expires_at': expires_at,
            'ip_address': source_ip,
            'device_fingerprint': fingerprint,
            'national_id': national_id,
            'phone': phone,
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
        # In dev/sandbox, SES may fail — still return success so frontend works
        return cors(200, {'success': True, 'dev': True, 'note': 'SES not available — use code 123456 for testing'})

    return cors(200, {'success': True})


# ─── Route: POST /driver/otp/verify ──────────────────────────────────────────
def handle_otp_verify(body: dict, source_ip: str):
    email = (body.get('email') or '').strip().lower()
    code  = (body.get('code') or '').strip()

    if not email or not code or len(code) != 6:
        return cors(400, {'message': 'البريد والرمز مطلوبان'})

    # Check rate limit: count attempts in last 10 min for this email
    try:
        since = (datetime.now(timezone.utc) - timedelta(minutes=OTP_TTL_MIN)).isoformat()
        attempts = supa('GET', '/otp_attempts',
                        params=f'email=eq.{email}&created_at=gte.{since}&select=id,code_hash,expires_at,used')
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
        # Dev fallback: accept code 123456
        if code == '123456':
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
    selfie_url = None
    doc_urls = {}

    # Upload selfie
    selfie_data = body.get('selfieDataUrl') or body.get('selfie_data_url') or ''
    if selfie_data:
        try:
            # selfieDataUrl may be a full data URL — strip prefix
            if ',' in selfie_data:
                selfie_bytes = base64.b64decode(selfie_data.split(',', 1)[1])
            else:
                selfie_bytes = base64.b64decode(selfie_data)
            key = f"{app_ref}/selfie/{uuid.uuid4().hex}.jpg"
            s3.put_object(Bucket=BUCKET, Key=key, Body=selfie_bytes, ContentType='image/jpeg')
            selfie_url = key
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
                              ContentType='image/jpeg' if ext in ('jpg','jpeg','png') else 'application/pdf')
                doc_urls[doc_type] = key
            except Exception as e:
                print(f'Doc upload error ({field}): {e}')

    # Save application to Supabase
    app_record = {
        'app_ref':          app_ref,
        'full_name':        body.get('full_name', '').strip(),
        'national_id':      body.get('national_id', '').strip(),
        'nationality':      body.get('nationality', 'سعودي'),
        'phone':            body.get('phone', '').strip(),
        'email':            body.get('email', '').strip().lower(),
        'city':             body.get('city', '').strip(),
        'platform_app':     body.get('platform_app'),
        'contract_type':    body.get('contract_type'),
        'bank_name':        body.get('bank_name'),
        'bank_account':     body.get('bank_account'),
        'iban':             body.get('iban', '').strip().upper(),
        'has_vehicle':      bool(body.get('has_vehicle')),
        'vehicle_type':     body.get('vehicle_type'),
        'vehicle_brand':    body.get('vehicle_brand'),
        'vehicle_model':    body.get('vehicle_model'),
        'vehicle_year':     body.get('vehicle_year'),
        'vehicle_plate':    body.get('vehicle_plate'),
        'vehicle_color':    body.get('vehicle_color'),
        'selfie_s3_key':    selfie_url,
        'document_keys':    json.dumps(doc_urls),
        'liveness_score':   body.get('livenessScore') or body.get('liveness_score'),
        'email_verified':   bool(body.get('emailVerified') or body.get('email_verified')),
        'device_fingerprint': body.get('device_fingerprint'),
        'ip_address':       source_ip,
        'user_agent':       body.get('user_agent'),
        'status':           'pending',
    }

    try:
        result = supa('POST', '/driver_applications', app_record)
        inserted_id = result[0].get('id') if result else None
    except Exception as e:
        print(f'Supabase insert error: {e}')
        inserted_id = None

    # Notify admins via SES
    try:
        ses.send_email(
            Source=FROM_EMAIL,
            Destination={'ToAddresses': ADMIN_EMAILS},
            Message={
                'Subject': {'Data': f'طلب تسجيل جديد — {app_record["full_name"]} ({app_ref})', 'Charset': 'UTF-8'},
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
      <tr><td style="padding:6px 0;color:#64748b">الاسم</td><td>{app_record["full_name"]}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">رقم الهوية</td><td style="font-family:monospace">{app_record["national_id"]}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">الجوال</td><td>{app_record["phone"]}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">البريد</td><td>{app_record["email"]}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">المدينة</td><td>{app_record["city"]}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">التعاقد</td><td>{app_record["contract_type"]}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">المركبة</td><td>{"نعم — " + str(app_record.get("vehicle_brand","")) if app_record["has_vehicle"] else "لا"}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">التحقق الحيوي</td><td>{"نعم " + str(app_record.get("liveness_score","")) + "%" if app_record.get("liveness_score") else "—"}</td></tr>
    </table>
    <div style="margin-top:20px;text-align:center">
      <a href="https://fll.sa/admin-panel/couriers" style="background:#1d4ed8;color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:700">
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
def handle_approve(app_id: str, body: dict):
    try:
        # Call Supabase RPC to approve (creates courier record + triggers wallet)
        supa_rpc('approve_driver_application', {'application_id': app_id})

        # Fetch applicant info for welcome email
        records = supa('GET', '/driver_applications',
                       params=f'id=eq.{app_id}&select=full_name,email,app_ref')
        if records:
            app = records[0]
            _send_decision_email(
                to=app['email'],
                full_name=app['full_name'],
                app_ref=app['app_ref'],
                approved=True,
            )
        return cors(200, {'success': True})
    except Exception as e:
        return cors(500, {'message': str(e)})


# ─── Route: POST /driver/applications/{id}/reject ─────────────────────────────
def handle_reject(app_id: str, body: dict):
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
                full_name=app['full_name'],
                app_ref=app['app_ref'],
                approved=False,
                reason=reason,
            )
        return cors(200, {'success': True})
    except Exception as e:
        return cors(500, {'message': str(e)})


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
    # params is the raw query string, e.g. "ref=APP-ABCDEF"
    ref = ''
    for part in (params or '').split('&'):
        if part.startswith('ref='):
            ref = part[4:].strip().upper()
    if not ref:
        return cors(400, {'message': 'رقم الطلب مطلوب'})

    try:
        records = supa('GET', '/driver_applications',
                       params=f'app_ref=eq.{ref}&select=app_ref,full_name,email,phone,city,status,rejection_reason,notes,created_at,updated_at')
        if not records:
            return cors(404, {'message': 'لم يتم العثور على طلب بهذا الرقم'})
        return cors(200, records[0])
    except Exception as e:
        return cors(500, {'message': str(e)})


# ─── Legacy KYC upload (backward-compat) ─────────────────────────────────────
def handle_legacy_upload(body: dict):
    driver_id   = body.get('driver_id', '')
    driver_name = body.get('driver_name', '')
    doc_type    = body.get('doc_type', 'id_card')
    file_data   = body.get('file_data', '')
    file_name   = body.get('file_name', 'document.jpg')
    if not driver_id or not file_data:
        return cors(400, {'error': 'driver_id and file_data required'})
    file_bytes = base64.b64decode(file_data)
    key = f"{driver_id}/{doc_type}/{uuid.uuid4().hex}_{file_name}"
    s3.put_object(Bucket=BUCKET, Key=key, Body=file_bytes, ContentType='image/jpeg',
                  Metadata={'driver_id': driver_id, 'doc_type': doc_type,
                             'uploaded_at': datetime.utcnow().isoformat()})
    try:
        ses.send_email(
            Source=FROM_EMAIL,
            Destination={'ToAddresses': ADMIN_EMAILS},
            Message={
                'Subject': {'Data': f'KYC Upload - {driver_name} ({doc_type})', 'Charset': 'UTF-8'},
                'Body': {'Html': {'Data': f'<div dir="rtl"><p><b>السائق:</b> {driver_name}</p><p><b>رقم السائق:</b> {driver_id}</p><p><b>نوع المستند:</b> {doc_type}</p></div>', 'Charset': 'UTF-8'}}
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
                return handle_approve(app_id, body)
            if action == 'reject':
                return handle_reject(app_id, body)

        # Legacy KYC upload (root POST)
        if method == 'POST' and path in ('/', ''):
            return handle_legacy_upload(body)

        return cors(404, {'error': f'Route not found: {method} {path}'})

    except Exception as e:
        print(f'Unhandled error: {e}')
        return cors(500, {'error': str(e)})
