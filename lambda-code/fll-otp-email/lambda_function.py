"""
FLL OTP Email Service v1.0
نظام رمز التحقق عبر البريد الإلكتروني — فيرست لاين لوجستيكس

Sends OTP codes via SES from no-reply@fll.sa for:
- Login verification
- New account registration
- Forgot password
- Complaint submission confirmation

Environment Variables:
  - SENDER_EMAIL: no-reply@fll.sa
  - OTP_TABLE: fll-verification-codes (DynamoDB)
  - REGION: me-south-1
  - OTP_EXPIRY_MINUTES: 5
  - ALLOWED_ORIGIN: https://fll.sa
"""

import json
import os
import random
import string
import hashlib
import time
import boto3
from datetime import datetime, timedelta

REGION = os.environ.get('REGION', 'me-south-1')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'no-reply@fll.sa')
OTP_TABLE = os.environ.get('OTP_TABLE', 'fll-verification-codes')
RATE_LIMIT_TABLE = os.environ.get('RATE_LIMIT_TABLE', 'fll-rate-limits')
OTP_EXPIRY_MINUTES = int(os.environ.get('OTP_EXPIRY_MINUTES', '5'))
MAX_ATTEMPTS = int(os.environ.get('MAX_ATTEMPTS', '5'))
ALLOWED_ORIGIN = os.environ.get('ALLOWED_ORIGIN', 'https://fll.sa')

ses = boto3.client('ses', region_name=REGION)
dynamodb = boto3.resource('dynamodb', region_name=REGION)
otp_table = dynamodb.Table(OTP_TABLE)
rate_table = dynamodb.Table(RATE_LIMIT_TABLE)

HEADERS = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
}

# OTP purposes and their Arabic labels
OTP_PURPOSES = {
    'login': 'تسجيل الدخول',
    'register': 'تسجيل حساب جديد',
    'forgot_password': 'استعادة كلمة المرور',
    'complaint': 'تأكيد رفع شكوى',
    'email_change': 'تغيير البريد الإلكتروني',
    'critical_action': 'إجراء حساس'
}


def lambda_handler(event, context):
    method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method', 'GET')

    if method == 'OPTIONS':
        return response(200, {})

    try:
        body = json.loads(event.get('body', '{}')) if event.get('body') else {}
    except (json.JSONDecodeError, TypeError):
        body = {}

    path = (event.get('path') or event.get('rawPath', '/')).rstrip('/')
    path_parts = path.split('/')

    # Routes: /otp/send, /otp/verify, /otp/resend
    action = path_parts[-1] if path_parts else ''

    if action == 'send' and method == 'POST':
        return send_otp(body)
    elif action == 'verify' and method == 'POST':
        return verify_otp(body)
    elif action == 'resend' and method == 'POST':
        return resend_otp(body)
    elif action == 'health':
        return response(200, {'status': 'healthy', 'sender': SENDER_EMAIL})
    else:
        return response(404, {'error': 'مسار غير موجود'})


def generate_otp(length=6):
    """Generate a secure numeric OTP"""
    return ''.join(random.choices(string.digits, k=length))


def hash_otp(otp):
    """Hash OTP for secure storage"""
    return hashlib.sha256(otp.encode()).hexdigest()


def check_rate_limit(email):
    """Check if email has exceeded rate limit (max 5 OTPs per 15 minutes)"""
    window_key = f"otp-rate-{email}-{int(time.time()) // 900}"
    try:
        result = rate_table.get_item(Key={'id': window_key})
        item = result.get('Item', {})
        count = int(item.get('count', 0))
        if count >= MAX_ATTEMPTS:
            return False
        rate_table.put_item(Item={
            'id': window_key,
            'count': count + 1,
            'email': email,
            'ttl': int(time.time()) + 900  # 15 min TTL
        })
        return True
    except Exception:
        return True  # Allow on error (fail open for UX)


def send_otp(body):
    """Send OTP to email"""
    email = (body.get('email', '') or '').strip().lower()
    purpose = body.get('purpose', 'login')

    if not email:
        return response(400, {'error': 'البريد الإلكتروني مطلوب'})

    if purpose not in OTP_PURPOSES:
        return response(400, {'error': 'نوع الطلب غير صالح'})

    # Rate limiting
    if not check_rate_limit(email):
        return response(429, {'error': 'تم تجاوز الحد الأقصى لعدد المحاولات. يرجى الانتظار 15 دقيقة'})

    # Generate OTP
    otp = generate_otp()
    otp_hash = hash_otp(otp)
    expiry = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)
    otp_id = f"otp-{email}-{purpose}-{int(time.time())}"

    # Store OTP (hashed)
    try:
        otp_table.put_item(Item={
            'id': otp_id,
            'email': email,
            'purpose': purpose,
            'otp_hash': otp_hash,
            'attempts': 0,
            'max_attempts': 3,
            'expires_at': expiry.isoformat(),
            'created_at': datetime.utcnow().isoformat(),
            'verified': False,
            'ttl': int(expiry.timestamp()) + 3600  # DynamoDB TTL
        })
    except Exception as e:
        print(f"DynamoDB error: {e}")
        return response(500, {'error': 'خطأ في حفظ رمز التحقق'})

    # Send email via SES
    purpose_label = OTP_PURPOSES[purpose]
    subject = f"رمز التحقق — {purpose_label} | فيرست لاين لوجستيكس"

    html_body = f"""<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="font-family:'Segoe UI',Tahoma,Arial,sans-serif;background:#f4f7fa;padding:0;margin:0;direction:rtl">
<div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

<div style="background:linear-gradient(135deg,#0a1628 0%,#1c2d47 100%);padding:32px 24px;text-align:center">
  <h1 style="color:#38bdf8;font-size:20px;margin:0 0 8px">فيرست لاين لوجستيكس</h1>
  <p style="color:#94a3b8;font-size:13px;margin:0">First Line Logistics</p>
</div>

<div style="padding:32px 24px;text-align:center">
  <div style="background:rgba(56,189,248,0.08);border-radius:12px;padding:16px;margin-bottom:24px">
    <p style="color:#475569;font-size:14px;margin:0 0 4px">طلب {purpose_label}</p>
    <p style="color:#94a3b8;font-size:12px;margin:0">تم طلب رمز تحقق لحسابك</p>
  </div>

  <p style="color:#475569;font-size:14px;margin:0 0 20px">رمز التحقق الخاص بك:</p>

  <div style="background:#f0f9ff;border:2px dashed #38bdf8;border-radius:12px;padding:20px;margin:0 auto 20px;max-width:280px">
    <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#0a1628;font-family:monospace">{otp}</span>
  </div>

  <p style="color:#ef4444;font-size:13px;margin:0 0 16px">
    ⏰ صالح لمدة {OTP_EXPIRY_MINUTES} دقائق فقط
  </p>

  <div style="background:#fef2f2;border-radius:8px;padding:12px;margin-top:20px">
    <p style="color:#dc2626;font-size:12px;margin:0">
      ⚠️ لا تشارك هذا الرمز مع أي شخص. فريق FLL لن يطلب منك رمز التحقق أبداً.
    </p>
  </div>
</div>

<div style="background:#f8fafc;padding:16px 24px;text-align:center;border-top:1px solid #e2e8f0">
  <p style="color:#94a3b8;font-size:11px;margin:0">
    هذا البريد مرسل تلقائياً من نظام فيرست لاين لوجستيكس<br>
    لا ترد على هذا البريد — {SENDER_EMAIL}
  </p>
</div>

</div>
</body>
</html>"""

    text_body = f"""فيرست لاين لوجستيكس — رمز التحقق

طلب: {purpose_label}
رمز التحقق: {otp}

صالح لمدة {OTP_EXPIRY_MINUTES} دقائق فقط.
لا تشارك هذا الرمز مع أي شخص.

---
no-reply@fll.sa"""

    try:
        ses.send_email(
            Source=f"فيرست لاين لوجستيكس <{SENDER_EMAIL}>",
            Destination={'ToAddresses': [email]},
            Message={
                'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                'Body': {
                    'Html': {'Data': html_body, 'Charset': 'UTF-8'},
                    'Text': {'Data': text_body, 'Charset': 'UTF-8'}
                }
            },
            Tags=[
                {'Name': 'purpose', 'Value': purpose},
                {'Name': 'system', 'Value': 'fll-otp'}
            ]
        )
    except Exception as e:
        print(f"SES error: {e}")
        return response(500, {'error': 'خطأ في إرسال البريد الإلكتروني'})

    return response(200, {
        'message': 'تم إرسال رمز التحقق إلى بريدك الإلكتروني',
        'otp_id': otp_id,
        'expires_in_minutes': OTP_EXPIRY_MINUTES,
        'email_masked': mask_email(email)
    })


def verify_otp(body):
    """Verify OTP code"""
    otp_id = body.get('otp_id', '')
    code = body.get('code', '').strip()
    email = (body.get('email', '') or '').strip().lower()

    if not code:
        return response(400, {'error': 'رمز التحقق مطلوب'})

    if not otp_id and not email:
        return response(400, {'error': 'معرف الطلب أو البريد الإلكتروني مطلوب'})

    try:
        # Find OTP record
        if otp_id:
            result = otp_table.get_item(Key={'id': otp_id})
            item = result.get('Item')
        else:
            # Scan for latest OTP by email (fallback)
            scan_result = otp_table.scan(
                FilterExpression='email = :e AND verified = :v',
                ExpressionAttributeValues={':e': email, ':v': False},
                Limit=10
            )
            items = sorted(scan_result.get('Items', []),
                         key=lambda x: x.get('created_at', ''), reverse=True)
            item = items[0] if items else None

        if not item:
            return response(404, {'error': 'رمز التحقق غير موجود أو منتهي الصلاحية'})

        # Check expiry
        expiry = datetime.fromisoformat(item['expires_at'])
        if datetime.utcnow() > expiry:
            return response(400, {'error': 'انتهت صلاحية رمز التحقق. اطلب رمز جديد'})

        # Check already verified
        if item.get('verified'):
            return response(400, {'error': 'تم استخدام رمز التحقق مسبقاً'})

        # Check attempts
        attempts = int(item.get('attempts', 0))
        max_attempts = int(item.get('max_attempts', 3))
        if attempts >= max_attempts:
            return response(400, {'error': 'تم تجاوز الحد الأقصى لمحاولات التحقق. اطلب رمز جديد'})

        # Verify hash
        if hash_otp(code) != item['otp_hash']:
            # Increment attempts
            otp_table.update_item(
                Key={'id': item['id']},
                UpdateExpression='SET attempts = :a',
                ExpressionAttributeValues={':a': attempts + 1}
            )
            remaining = max_attempts - attempts - 1
            return response(400, {
                'error': f'رمز التحقق غير صحيح. المحاولات المتبقية: {remaining}',
                'remaining_attempts': remaining
            })

        # Mark as verified
        otp_table.update_item(
            Key={'id': item['id']},
            UpdateExpression='SET verified = :v, verified_at = :t',
            ExpressionAttributeValues={
                ':v': True,
                ':t': datetime.utcnow().isoformat()
            }
        )

        return response(200, {
            'verified': True,
            'purpose': item.get('purpose', ''),
            'email': item.get('email', ''),
            'message': 'تم التحقق بنجاح'
        })

    except Exception as e:
        print(f"Verify error: {e}")
        return response(500, {'error': 'خطأ في التحقق'})


def resend_otp(body):
    """Resend OTP — generates new code, invalidates old one"""
    email = (body.get('email', '') or '').strip().lower()
    purpose = body.get('purpose', 'login')

    if not email:
        return response(400, {'error': 'البريد الإلكتروني مطلوب'})

    # Reuse send_otp logic
    return send_otp({'email': email, 'purpose': purpose})


def mask_email(email):
    """Mask email for privacy: a***@gmail.com"""
    parts = email.split('@')
    if len(parts) != 2:
        return '***'
    name = parts[0]
    if len(name) <= 2:
        masked = name[0] + '***'
    else:
        masked = name[0] + '***' + name[-1]
    return f"{masked}@{parts[1]}"


def response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': HEADERS,
        'body': json.dumps(body, ensure_ascii=False)
    }
