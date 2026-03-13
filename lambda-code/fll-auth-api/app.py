"""
FLL Auth API v3.0
- Login with EMAIL_OTP MFA support
OTP temporarily disabled — will be re-enabled later
- Login with EMAIL_OTP MFA support (DISABLED)
- Register with email verification
- Forgot password with OTP
- Verify OTP code
- Reset password
- Custom OTP via AWS SES (no-reply@fll.sa)
- Custom OTP via AWS SES (no-reply@fll.sa) (DISABLED)
"""
import json
import boto3
import os
import hmac
import hashlib
import base64
import secrets
import time
import urllib.request
import urllib.parse

region = os.environ.get('REGION', 'me-south-1')
user_pool_id = os.environ.get('USER_POOL_ID', 'me-south-1_aJtmQ0QrN')
client_id = os.environ.get('COGNITO_CLIENT_ID', '6n49ej8fl92i9rtotbk5o9o0d1')
client_secret = os.environ.get('COGNITO_CLIENT_SECRET', '')

# SES + Supabase config for custom OTP
ses = boto3.client('ses', region_name=region)
SES_FROM = os.environ.get('SES_FROM_EMAIL', 'FLL <no-reply@fll.sa>')
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://djebhztfewjfyyoortvv.supabase.co')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')
OTP_EXPIRY_SECONDS = 300  # 5 minutes
OTP_MAX_ATTEMPTS = 5

cognito = boto3.client('cognito-idp', region_name=region)

def get_secret_hash(username):
    if not client_secret:
        return None
    msg = username + client_id
    dig = hmac.new(client_secret.encode('utf-8'), msg.encode('utf-8'), hashlib.sha256).digest()
    return base64.b64encode(dig).decode()

def cors(status, body):
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'content-type,authorization',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        },
        'body': json.dumps(body, ensure_ascii=False)
    }

# ─── Supabase REST helper ─────────────────────────────────────────────────────
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

def handler(event, context):
    method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
    path = event.get('rawPath', event.get('path', ''))
    
    if method == 'OPTIONS':
        return cors(200, {})
    
    try:
        body = json.loads(event.get('body', '{}')) if event.get('body') else {}
    except:
        body = {}
    
    # Route handling
    if path == '/auth/login' and method == 'POST':
        return login(body)
    elif path == '/auth/register' and method == 'POST':
        return register(body)
    elif path == '/auth/verify' and method == 'POST':
        return verify_code(body)
    elif path == '/auth/forgot' and method == 'POST':
        return forgot_password(body)
    elif path == '/auth/forgot-password' and method == 'POST':
        return forgot_password(body)
    elif path == '/auth/reset' and method == 'POST':
        return reset_password(body)
    elif path == '/auth/reset-password' and method == 'POST':
        return reset_password(body)
    elif path == '/auth/resend' and method == 'POST':
        return resend_code(body)
    elif path == '/auth/respond-mfa' and method == 'POST':
        return respond_mfa(body)
    elif path == '/auth/me' and method == 'GET':
        return get_me(event)
    # ── Custom OTP via SES ──
    elif path == '/auth/send-otp' and method == 'POST':
        return send_custom_otp(body)
    elif path == '/auth/verify-custom-otp' and method == 'POST':
        return verify_custom_otp(body)
    else:
        return cors(404, {'message': 'Not found'})

def login(body):
    username = body.get('username', body.get('email', ''))
    password = body.get('password', '')
    
    if not username or not password:
        return cors(400, {'message': 'البريد الإلكتروني وكلمة المرور مطلوبة'})
    
    try:
        params = {
            'UserPoolId': user_pool_id,
            'ClientId': client_id,
            'AuthFlow': 'ADMIN_USER_PASSWORD_AUTH',
            'AuthParameters': {
                'USERNAME': username,
                'PASSWORD': password
            }
        }
        
        secret_hash = get_secret_hash(username)
        if secret_hash:
            params['AuthParameters']['SECRET_HASH'] = secret_hash
        
        result = cognito.admin_initiate_auth(**params)
        
        # Check if MFA challenge
        challenge = result.get('ChallengeName')
        if challenge == 'EMAIL_OTP':
            return cors(200, {
                'challenge': 'EMAIL_OTP',
                'session': result.get('Session'),
                'message': 'تم إرسال رمز التحقق إلى بريدك الإلكتروني'
            })
        elif challenge == 'SMS_MFA':
            return cors(200, {
                'challenge': 'SMS_MFA',
                'session': result.get('Session'),
                'message': 'تم إرسال رمز التحقق إلى جوالك'
            })
        elif challenge == 'NEW_PASSWORD_REQUIRED':
            return cors(200, {
                'challenge': 'NEW_PASSWORD_REQUIRED',
                'session': result.get('Session'),
                'message': 'يجب تغيير كلمة المرور'
            })
        
        # No challenge - return tokens
        auth = result.get('AuthenticationResult', {})
        
        # Get user info
        user_info = cognito.admin_get_user(UserPoolId=user_pool_id, Username=username)
        attrs = {a['Name']: a['Value'] for a in user_info.get('UserAttributes', [])}
        
        # Get groups
        groups_resp = cognito.admin_list_groups_for_user(UserPoolId=user_pool_id, Username=username)
        groups = [g['GroupName'] for g in groups_resp.get('Groups', [])]
        
        return cors(200, {
            'token': auth.get('AccessToken'),
            'idToken': auth.get('IdToken'),
            'refreshToken': auth.get('RefreshToken'),
            'user': {
                'email': attrs.get('email', username),
                'name': attrs.get('name', ''),
                'groups': groups,
                'sub': attrs.get('sub', '')
            }
        })
        
    except cognito.exceptions.NotAuthorizedException:
        return cors(401, {'message': 'البريد الإلكتروني أو كلمة المرور غير صحيحة'})
    except cognito.exceptions.UserNotFoundException:
        return cors(401, {'message': 'البريد الإلكتروني أو كلمة المرور غير صحيحة'})
    except cognito.exceptions.UserNotConfirmedException:
        return cors(403, {'message': 'الحساب غير مؤكد. يرجى تأكيد البريد الإلكتروني أولاً', 'needsConfirmation': True})
    except Exception as e:
        print(f"Login error: {e}")
        return cors(500, {'message': 'خطأ في النظام', 'error': str(e)})

def respond_mfa(body):
    """Handle MFA code verification after login"""
    session = body.get('session', '')
    code = body.get('code', '')
    username = body.get('username', body.get('email', ''))
    challenge = body.get('challenge', 'EMAIL_OTP')
    
    if not session or not code or not username:
        return cors(400, {'message': 'البيانات المطلوبة ناقصة'})
    
    try:
        params = {
            'UserPoolId': user_pool_id,
            'ClientId': client_id,
            'ChallengeName': challenge,
            'ChallengeResponses': {
                'USERNAME': username,
                'EMAIL_OTP_CODE': code
            },
            'Session': session
        }
        
        secret_hash = get_secret_hash(username)
        if secret_hash:
            params['ChallengeResponses']['SECRET_HASH'] = secret_hash
        
        result = cognito.admin_respond_to_auth_challenge(**params)
        auth = result.get('AuthenticationResult', {})
        
        if not auth:
            return cors(400, {'message': 'رمز التحقق غير صحيح'})
        
        # Get user info + groups
        user_info = cognito.admin_get_user(UserPoolId=user_pool_id, Username=username)
        attrs = {a['Name']: a['Value'] for a in user_info.get('UserAttributes', [])}
        groups_resp = cognito.admin_list_groups_for_user(UserPoolId=user_pool_id, Username=username)
        groups = [g['GroupName'] for g in groups_resp.get('Groups', [])]
        
        return cors(200, {
            'token': auth.get('AccessToken'),
            'idToken': auth.get('IdToken'),
            'refreshToken': auth.get('RefreshToken'),
            'user': {
                'email': attrs.get('email', username),
                'name': attrs.get('name', ''),
                'groups': groups,
                'sub': attrs.get('sub', '')
            }
        })
    except cognito.exceptions.CodeMismatchException:
        return cors(400, {'message': 'رمز التحقق غير صحيح'})
    except cognito.exceptions.ExpiredCodeException:
        return cors(400, {'message': 'انتهت صلاحية رمز التحقق'})
    except Exception as e:
        print(f"MFA error: {e}")
        return cors(500, {'message': 'خطأ في النظام', 'error': str(e)})

def register(body):
    email = body.get('email', '')
    password = body.get('password', '')
    name = body.get('name', '')
    
    if not email or not password:
        return cors(400, {'message': 'البريد الإلكتروني وكلمة المرور مطلوبة'})
    
    try:
        params = {
            'ClientId': client_id,
            'Username': email,
            'Password': password,
            'UserAttributes': [
                {'Name': 'email', 'Value': email},
                {'Name': 'name', 'Value': name}
            ]
        }
        secret_hash = get_secret_hash(email)
        if secret_hash:
            params['SecretHash'] = secret_hash
            
        cognito.sign_up(**params)
        return cors(200, {'message': 'تم إنشاء الحساب. يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب', 'needsConfirmation': True})
    except cognito.exceptions.UsernameExistsException:
        return cors(409, {'message': 'البريد الإلكتروني مسجل مسبقاً'})
    except cognito.exceptions.InvalidPasswordException as e:
        return cors(400, {'message': 'كلمة المرور ضعيفة. يجب أن تحتوي على 8 أحرف على الأقل مع أرقام وحروف كبيرة وصغيرة'})
    except Exception as e:
        print(f"Register error: {e}")
        return cors(500, {'message': 'خطأ في التسجيل', 'error': str(e)})

def verify_code(body):
    email = body.get('email', body.get('username', ''))
    code = body.get('code', '')
    
    if not email or not code:
        return cors(400, {'message': 'البريد الإلكتروني والرمز مطلوبين'})
    
    try:
        params = {
            'ClientId': client_id,
            'Username': email,
            'ConfirmationCode': code
        }
        secret_hash = get_secret_hash(email)
        if secret_hash:
            params['SecretHash'] = secret_hash
            
        cognito.confirm_sign_up(**params)
        return cors(200, {'message': 'تم تأكيد الحساب بنجاح! يمكنك الآن تسجيل الدخول'})
    except cognito.exceptions.CodeMismatchException:
        return cors(400, {'message': 'رمز التحقق غير صحيح'})
    except cognito.exceptions.ExpiredCodeException:
        return cors(400, {'message': 'انتهت صلاحية رمز التحقق. اطلب رمز جديد'})
    except Exception as e:
        print(f"Verify error: {e}")
        return cors(500, {'message': 'خطأ في التحقق', 'error': str(e)})

def forgot_password(body):
    email = body.get('email', body.get('username', ''))
    
    if not email:
        return cors(400, {'message': 'البريد الإلكتروني مطلوب'})
    
    try:
        params = {
            'ClientId': client_id,
            'Username': email
        }
        secret_hash = get_secret_hash(email)
        if secret_hash:
            params['SecretHash'] = secret_hash
            
        cognito.forgot_password(**params)
        return cors(200, {'message': 'إذا كان الحساب موجوداً، سيصلك رمز على البريد الإلكتروني'})
    except Exception as e:
        # Don't reveal if account exists
        return cors(200, {'message': 'إذا كان الحساب موجوداً، سيصلك رمز على البريد الإلكتروني'})

def reset_password(body):
    email = body.get('email', body.get('username', ''))
    code = body.get('code', '')
    new_password = body.get('password', body.get('new_password', ''))
    
    if not email or not code or not new_password:
        return cors(400, {'message': 'جميع الحقول مطلوبة'})
    
    try:
        params = {
            'ClientId': client_id,
            'Username': email,
            'ConfirmationCode': code,
            'Password': new_password
        }
        secret_hash = get_secret_hash(email)
        if secret_hash:
            params['SecretHash'] = secret_hash
            
        cognito.confirm_forgot_password(**params)
        return cors(200, {'message': 'تم تغيير كلمة المرور بنجاح'})
    except cognito.exceptions.CodeMismatchException:
        return cors(400, {'message': 'رمز التحقق غير صحيح'})
    except cognito.exceptions.ExpiredCodeException:
        return cors(400, {'message': 'انتهت صلاحية رمز التحقق'})
    except cognito.exceptions.InvalidPasswordException:
        return cors(400, {'message': 'كلمة المرور الجديدة ضعيفة'})
    except Exception as e:
        print(f"Reset error: {e}")
        return cors(500, {'message': 'خطأ في إعادة تعيين كلمة المرور', 'error': str(e)})

def resend_code(body):
    email = body.get('email', body.get('username', ''))
    
    if not email:
        return cors(400, {'message': 'البريد الإلكتروني مطلوب'})
    
    try:
        params = {
            'ClientId': client_id,
            'Username': email
        }
        secret_hash = get_secret_hash(email)
        if secret_hash:
            params['SecretHash'] = secret_hash
            
        cognito.resend_confirmation_code(**params)
        return cors(200, {'message': 'تم إرسال رمز التحقق مرة أخرى'})
    except Exception as e:
        return cors(200, {'message': 'تم إرسال رمز التحقق مرة أخرى'})

def get_me(event):
    auth_header = event.get('headers', {}).get('authorization', '')
    token = auth_header.replace('Bearer ', '') if auth_header else ''
    
    if not token:
        return cors(401, {'message': 'غير مصرح'})
    
    try:
        result = cognito.get_user(AccessToken=token)
        attrs = {a['Name']: a['Value'] for a in result.get('UserAttributes', [])}
        username = result.get('Username', '')
        
        groups_resp = cognito.admin_list_groups_for_user(UserPoolId=user_pool_id, Username=username)
        groups = [g['GroupName'] for g in groups_resp.get('Groups', [])]
        
        return cors(200, {
            'user': {
                'username': username,
                'email': attrs.get('email', ''),
                'name': attrs.get('name', ''),
                'groups': groups,
                'sub': attrs.get('sub', '')
            }
        })
    except Exception as e:
        return cors(401, {'message': 'الجلسة منتهية أو غير صالحة'})

# ═══════════════════════════════════════════════════════════════════════════════
# Custom OTP System — sends via AWS SES from no-reply@fll.sa
# Stores codes in Supabase table: admin_otp_codes
# ═══════════════════════════════════════════════════════════════════════════════

def send_custom_otp(body):
    """Generate 6-digit OTP, store in Supabase, send via SES."""
    email = (body.get('email', '') or '').strip().lower()
    
    if not email:
        return cors(400, {'message': 'البريد الإلكتروني مطلوب'})
    
    if not SUPABASE_SERVICE_KEY:
        print("ERROR: SUPABASE_SERVICE_KEY not configured")
        return cors(500, {'message': 'خطأ في إعداد النظام'})
    
    try:
        # 1) Check if user exists in Supabase users table
        users = supabase_request('GET', 'users', filters=[
            f'email=ilike.{urllib.parse.quote(email)}',
            'select=id,email,role'
        ])
        
        if not users or len(users) == 0:
            return cors(404, {'message': 'البريد الإلكتروني غير مسجّل في النظام'})
        
        # 2) Rate limit: check recent OTPs (max 5 in 10 minutes)
        ten_min_ago = int(time.time()) - 600
        recent = supabase_request('GET', 'admin_otp_codes', filters=[
            f'email=eq.{urllib.parse.quote(email)}',
            f'created_at=gte.{ten_min_ago}',
            'select=id'
        ])
        
        if recent and len(recent) >= OTP_MAX_ATTEMPTS:
            return cors(429, {'message': 'تم تجاوز الحد الأقصى للمحاولات. حاول بعد 10 دقائق'})
        
        # 3) Invalidate any existing unused OTPs for this email
        supabase_request('PATCH', 'admin_otp_codes', 
            filters=[
                f'email=eq.{urllib.parse.quote(email)}',
                'used=eq.false'
            ],
            body_data={'used': True}
        )
        
        # 4) Generate 6-digit code
        code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
        expires_at = int(time.time()) + OTP_EXPIRY_SECONDS
        
        # 5) Store in Supabase
        result = supabase_request('POST', 'admin_otp_codes', body_data={
            'email': email,
            'code': code,
            'expires_at': expires_at,
            'used': False,
            'created_at': int(time.time())
        })
        
        if result is None:
            return cors(500, {'message': 'خطأ في حفظ رمز التحقق'})
        
        # 6) Send via SES
        ses.send_email(
            Source=SES_FROM,
            Destination={'ToAddresses': [email]},
            Message={
                'Subject': {
                    'Data': f'رمز التحقق — FLL | {code}',
                    'Charset': 'UTF-8'
                },
                'Body': {
                    'Html': {
                        'Data': _build_otp_email_html(code, email),
                        'Charset': 'UTF-8'
                    },
                    'Text': {
                        'Data': f'رمز التحقق الخاص بك هو: {code}\n\nصالح لمدة 5 دقائق.\n\nFirst Line Logistics',
                        'Charset': 'UTF-8'
                    }
                }
            }
        )
        
        return cors(200, {
            'message': 'تم إرسال رمز التحقق إلى بريدك الإلكتروني',
            'expires_in': OTP_EXPIRY_SECONDS
        })
        
    except Exception as e:
        print(f"send_custom_otp error: {e}")
        return cors(500, {'message': 'خطأ في إرسال رمز التحقق', 'error': str(e)})


def verify_custom_otp(body):
    """Verify the custom OTP code."""
    email = (body.get('email', '') or '').strip().lower()
    code = (body.get('code', '') or '').strip()
    
    if not email or not code:
        return cors(400, {'message': 'البريد الإلكتروني والرمز مطلوبين'})
    
    if len(code) != 6 or not code.isdigit():
        return cors(400, {'message': 'رمز التحقق يجب أن يكون 6 أرقام'})
    
    if not SUPABASE_SERVICE_KEY:
        return cors(500, {'message': 'خطأ في إعداد النظام'})
    
    try:
        now = int(time.time())
        
        # Find matching unused, non-expired OTP
        records = supabase_request('GET', 'admin_otp_codes', filters=[
            f'email=eq.{urllib.parse.quote(email)}',
            f'code=eq.{code}',
            'used=eq.false',
            f'expires_at=gte.{now}',
            'select=id,code',
            'order=created_at.desc',
            'limit=1'
        ])
        
        if not records or len(records) == 0:
            return cors(401, {'message': 'رمز التحقق غير صحيح أو منتهي الصلاحية'})
        
        # Mark as used
        otp_id = records[0]['id']
        supabase_request('PATCH', 'admin_otp_codes',
            filters=[f'id=eq.{otp_id}'],
            body_data={'used': True}
        )
        
        return cors(200, {
            'verified': True,
            'email': email,
            'message': 'تم التحقق بنجاح'
        })
        
    except Exception as e:
        print(f"verify_custom_otp error: {e}")
        return cors(500, {'message': 'خطأ في التحقق', 'error': str(e)})


def _build_otp_email_html(code, email):
    """Build a professional OTP email in Arabic."""
    digits = ''.join([
        f'<td style="width:44px;height:52px;background:#f4f4f5;border:2px solid #e4e4e7;'
        f'border-radius:8px;text-align:center;font-size:24px;font-weight:700;'
        f'font-family:\'JetBrains Mono\',monospace;color:#18181b;letter-spacing:2px">{d}</td>'
        for d in code
    ])
    
    return f'''<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'IBM Plex Sans Arabic',Tahoma,sans-serif">
<div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
  
  <!-- Header -->
  <div style="background:#0f172a;padding:24px 32px;text-align:center">
    <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.5px">
      First Line Logistics
    </h1>
    <p style="margin:4px 0 0;color:#94a3b8;font-size:12px">لوحة الإدارة التشغيلية</p>
  </div>
  
  <!-- Body -->
  <div style="padding:32px">
    <h2 style="margin:0 0 8px;color:#18181b;font-size:16px;font-weight:700;text-align:center">
      رمز التحقق
    </h2>
    <p style="margin:0 0 24px;color:#71717a;font-size:13px;text-align:center;line-height:1.6">
      استخدم الرمز التالي لتسجيل الدخول إلى لوحة الإدارة
    </p>
    
    <!-- OTP Code -->
    <table cellpadding="0" cellspacing="8" style="margin:0 auto 24px">
      <tr>{digits}</tr>
    </table>
    
    <div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:12px 16px;margin-bottom:24px">
      <p style="margin:0;color:#854d0e;font-size:12px;text-align:center">
        ⏱ هذا الرمز صالح لمدة <strong>5 دقائق</strong> فقط
      </p>
    </div>
    
    <p style="margin:0;color:#a1a1aa;font-size:11px;text-align:center;line-height:1.6">
      إذا لم تطلب هذا الرمز، تجاهل هذا البريد.<br>
      لا تشارك هذا الرمز مع أي شخص.
    </p>
  </div>
  
  <!-- Footer -->
  <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e4e4e7;text-align:center">
    <p style="margin:0;color:#a1a1aa;font-size:10px">
      © {int(time.strftime('%Y'))} First Line Logistics — جميع الحقوق محفوظة
    </p>
    <p style="margin:4px 0 0;color:#a1a1aa;font-size:10px">
      المملكة العربية السعودية | fll.sa
    </p>
  </div>
</div>
</body>
</html>'''
