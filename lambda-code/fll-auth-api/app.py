"""
FLL Auth API v2.0
- Login with EMAIL_OTP MFA support
- Register with email verification
- Forgot password with OTP
- Verify OTP code
- Reset password
"""
import json
import boto3
import os
import hmac
import hashlib
import base64

region = os.environ.get('REGION', 'me-south-1')
user_pool_id = os.environ['USER_POOL_ID']
client_id = os.environ['COGNITO_CLIENT_ID']
client_secret = os.environ.get('COGNITO_CLIENT_SECRET', '')

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

def handler(event, context):
    method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
    path = event.get('rawPath', event.get('path', ''))
    
    if method == 'OPTIONS':
        return cors(200, {})
    
    try:
        body = json.loads(event.get('body', '{}')) if event.get('body') else {}
    except (json.JSONDecodeError, TypeError):
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
        return cors(500, {'message': 'خطأ في النظام'})

def respond_mfa(body):
    """Handle MFA code verification after login"""
    session = body.get('session', '')
    code = body.get('code', '')
    username = body.get('username', body.get('email', ''))
    challenge = body.get('challenge', 'EMAIL_OTP')
    
    if not session or not code or not username:
        return cors(400, {'message': 'البيانات المطلوبة ناقصة'})
    
    try:
        # Use correct response key based on challenge type
        challenge_key = 'SMS_MFA_CODE' if challenge == 'SMS_MFA' else 'EMAIL_OTP_CODE'
        params = {
            'UserPoolId': user_pool_id,
            'ClientId': client_id,
            'ChallengeName': challenge,
            'ChallengeResponses': {
                'USERNAME': username,
                challenge_key: code
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
        return cors(500, {'message': 'خطأ في النظام'})

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
        return cors(500, {'message': 'خطأ في التسجيل'})

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
        return cors(500, {'message': 'خطأ في التحقق'})

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
        return cors(500, {'message': 'خطأ في إعادة تعيين كلمة المرور'})

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
