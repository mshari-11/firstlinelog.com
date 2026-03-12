"""
FLL OTP Service v1.0
Handles OTP generation, sending via AWS SES, and verification.

Endpoints:
- POST /send-otp: Generate and send OTP to email
- POST /verify-otp: Verify OTP code
"""
import json
import boto3
import random
import string
from datetime import datetime, timedelta, timezone
import os
import urllib.request
import urllib.parse
import time

# Configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://djebhztfewjfyyoortvv.supabase.co")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
SES_REGION = "me-south-1"
FROM_EMAIL = "no-reply@fll.sa"
FROM_NAME = "First Line Logistics"
OTP_EXPIRY_MINUTES = 10
MAX_ATTEMPTS = 5
MAX_REQUESTS_PER_HOUR = 5

# AWS clients
ses = boto3.client('ses', region_name=SES_REGION)


def cors(status, body):
    """Return response with CORS headers."""
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'content-type,authorization',
            'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        'body': json.dumps(body, ensure_ascii=False)
    }


def supabase_request(method, table, params=None, body_data=None, filters=None):
    """Make a request to Supabase REST API using service role key."""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    if filters:
        url += '?' + '&'.join(filters)
    elif params:
        url += '?' + urllib.parse.urlencode(params)

    headers = {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
    }

    data = json.dumps(body_data).encode('utf-8') if body_data else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as resp:
            resp_body = resp.read().decode('utf-8')
            return json.loads(resp_body) if resp_body else []
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8') if e.fp else ''
        print(f"Supabase error {e.code}: {err_body}")
        return None


def generate_otp():
    """Generate a 6-digit OTP."""
    return ''.join(random.choices(string.digits, k=6))


def get_otp_message(otp_type):
    """Get Arabic message for OTP type."""
    messages = {
        'login': 'رمز التحقق لتسجيل الدخول إلى حسابك',
        'register': 'رمز التحقق لإنشاء حسابك الجديد',
        'reset_password': 'رمز التحقق لإعادة تعيين كلمة المرور',
        'verify_email': 'رمز التحقق لتأكيد بريدك الإلكتروني',
        'driver_register': 'رمز التحقق لتسجيل حساب المندوب',
        'sensitive_action': 'رمز التحقق لتأكيد العملية الحساسة'
    }
    return messages.get(otp_type, messages['login'])


def get_email_template(otp_code, otp_type, email):
    """Generate professional HTML email template with FLL branding."""
    message_ar = get_otp_message(otp_type)
    
    html = f"""<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: 'Segoe UI', 'Arabic Typesetting', Arial, sans-serif;
            direction: rtl;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }}
        .container {{
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }}
        .header {{
            background: linear-gradient(135deg, #1a3a52 0%, #2c5aa0 100%);
            padding: 30px 20px;
            text-align: center;
            color: white;
        }}
        .logo {{
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }}
        .body {{
            padding: 40px 30px;
            text-align: right;
        }}
        .greeting {{
            font-size: 18px;
            color: #1a3a52;
            margin-bottom: 20px;
            font-weight: 600;
        }}
        .message {{
            font-size: 14px;
            color: #333;
            line-height: 1.6;
            margin-bottom: 30px;
        }}
        .otp-section {{
            background-color: #f9f9f9;
            border: 2px solid #2c5aa0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
        }}
        .otp-label {{
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }}
        .otp-code {{
            font-size: 48px;
            font-weight: bold;
            color: #2c5aa0;
            font-family: 'Courier New', monospace;
            letter-spacing: 8px;
            margin: 10px 0;
        }}
        .expiry {{
            font-size: 12px;
            color: #999;
            margin-top: 10px;
        }}
        .warning {{
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 13px;
            color: #856404;
            text-align: right;
        }}
        .footer {{
            background-color: #f5f5f5;
            padding: 20px 30px;
            text-align: right;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
        }}
        .footer-link {{
            color: #2c5aa0;
            text-decoration: none;
        }}
        .support-info {{
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
        }}
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="logo">🚚 First Line Logistics</div>
            <div style="font-size: 14px; opacity: 0.9;">التحقق الآمن لحسابك</div>
        </div>

        <!-- Body -->
        <div class="body">
            <div class="greeting">مرحباً بك</div>
            
            <div class="message">
                {message_ar}
            </div>

            <!-- OTP Display -->
            <div class="otp-section">
                <div class="otp-label">رمز التحقق الخاص بك</div>
                <div class="otp-code">{otp_code}</div>
                <div class="expiry">ينتهي الصلاحية بعد {OTP_EXPIRY_MINUTES} دقائق</div>
            </div>

            <!-- Warning -->
            <div class="warning">
                ⚠️ لا تشارك هذا الرمز مع أحد. فريقنا لن يطلب منك هذا الرمز أبداً.
            </div>

            <div class="message" style="margin-top: 30px; font-size: 13px; color: #666;">
                إذا لم تطلب هذا الرمز، يرجى تجاهل هذا البريد أو
                <a href="https://fll.sa/security" class="footer-link">الإبلاغ عن مشكلة أمان</a>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div>© 2026 First Line Logistics. جميع الحقوق محفوظة.</div>
            <div class="support-info">
                للدعم: <a href="mailto:support@fll.sa" class="footer-link">support@fll.sa</a><br>
                هاتف: +966 11 4567890
            </div>
        </div>
    </div>
</body>
</html>"""
    return html


def check_rate_limit(email):
    """Check if email has exceeded rate limit (5 OTPs per hour)."""
    now = datetime.now(timezone.utc)
    one_hour_ago = now - timedelta(hours=1)
    
    filters = [
        f"email=eq.{email}",
        f"created_at=gte.{one_hour_ago.isoformat()}"
    ]
    
    results = supabase_request('GET', 'otp_requests', filters=filters)
    
    if results is None:
        print(f"Error checking rate limit for {email}")
        return False
    
    count = len(results) if isinstance(results, list) else 0
    return count >= MAX_REQUESTS_PER_HOUR


def send_otp(email, otp_type):
    """Generate OTP and send via SES. Returns OTP or error."""
    
    # Validate otp_type
    valid_types = ['login', 'register', 'reset_password', 'verify_email', 'driver_register', 'sensitive_action']
    if otp_type not in valid_types:
        return {'error': 'Invalid OTP type', 'code': 400}
    
    # Check rate limit
    if check_rate_limit(email):
        return {'error': 'Too many OTP requests. Please try again in 1 hour.', 'code': 429}
    
    # Generate OTP
    otp_code = generate_otp()
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)).isoformat()
    
    # Save to Supabase
    otp_record = {
        'email': email,
        'otp_type': otp_type,
        'code': otp_code,
        'attempts': 0,
        'expires_at': expires_at,
        'verified_at': None
    }
    
    result = supabase_request('POST', 'otp_requests', body_data=otp_record)
    if result is None:
        return {'error': 'Failed to save OTP', 'code': 500}
    
    # Send email via SES
    html_body = get_email_template(otp_code, otp_type, email)
    
    try:
        ses.send_email(
            Source=f'{FROM_NAME} <{FROM_EMAIL}>',
            Destination={'ToAddresses': [email]},
            Message={
                'Subject': {
                    'Data': 'رمز التحقق من First Line Logistics',
                    'Charset': 'UTF-8'
                },
                'Body': {
                    'Html': {
                        'Data': html_body,
                        'Charset': 'UTF-8'
                    }
                }
            }
        )
        print(f"OTP sent successfully to {email}")
        return {'success': True, 'message': 'OTP sent to email', 'code': 200}
    except Exception as e:
        print(f"SES error: {str(e)}")
        return {'error': f'Failed to send email: {str(e)}', 'code': 500}


def verify_otp(email, code, otp_type):
    """Verify OTP code."""
    
    # Find latest OTP for this email and type
    filters = [
        f"email=eq.{email}",
        f"otp_type=eq.{otp_type}"
    ]
    
    results = supabase_request('GET', 'otp_requests', filters=filters)
    
    if results is None or not isinstance(results, list) or len(results) == 0:
        return {'error': 'No OTP found for this email', 'code': 404}
    
    # Get the most recent OTP
    otp_record = results[-1]
    otp_id = otp_record.get('id')
    
    # Check if already verified
    if otp_record.get('verified_at') is not None:
        return {'error': 'OTP already verified', 'code': 400}
    
    # Check expiry
    expires_at = datetime.fromisoformat(otp_record.get('expires_at', ''))
    if datetime.now(timezone.utc) > expires_at:
        return {'error': 'OTP has expired', 'code': 400}
    
    # Check attempts
    attempts = otp_record.get('attempts', 0)
    if attempts >= MAX_ATTEMPTS:
        return {'error': 'Maximum verification attempts exceeded', 'code': 400}
    
    # Verify code
    if otp_record.get('code') != code:
        # Increment attempts
        new_attempts = attempts + 1
        supabase_request('PATCH', 'otp_requests', 
                        filters=[f"id=eq.{otp_id}"],
                        body_data={'attempts': new_attempts})
        remaining = MAX_ATTEMPTS - new_attempts
        return {'error': f'Invalid OTP. {remaining} attempts remaining.', 'code': 400}
    
    # Mark as verified
    verified_result = supabase_request('PATCH', 'otp_requests',
                                      filters=[f"id=eq.{otp_id}"],
                                      body_data={'verified_at': datetime.now(timezone.utc).isoformat()})
    
    if verified_result is None:
        return {'error': 'Failed to verify OTP', 'code': 500}
    
    return {'success': True, 'message': 'OTP verified successfully', 'code': 200}


def handler(event, context):
    """Lambda handler."""
    method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
    path = event.get('rawPath', event.get('path', ''))
    
    if method == 'OPTIONS':
        return cors(200, {})
    
    try:
        body = json.loads(event.get('body', '{}')) if event.get('body') else {}
    except:
        body = {}
    
    # Route handling
    if path == '/send-otp' and method == 'POST':
        email = body.get('email', '').strip().lower()
        otp_type = body.get('type', 'login').strip().lower()
        
        if not email:
            return cors(400, {'error': 'Email is required'})
        if not otp_type:
            return cors(400, {'error': 'OTP type is required'})
        
        result = send_otp(email, otp_type)
        return cors(result.pop('code'), result)
    
    elif path == '/verify-otp' and method == 'POST':
        email = body.get('email', '').strip().lower()
        code = body.get('code', '').strip()
        otp_type = body.get('type', 'login').strip().lower()
        
        if not email or not code:
            return cors(400, {'error': 'Email and code are required'})
        
        result = verify_otp(email, code, otp_type)
        return cors(result.pop('code'), result)
    
    else:
        return cors(404, {'error': 'Endpoint not found'})
