import json, boto3, os, base64, uuid, re
from datetime import datetime
from html import escape as html_escape

s3 = boto3.client('s3', region_name='me-south-1')
ses = boto3.client('ses', region_name='me-south-1')
cognito = boto3.client('cognito-idp', region_name='me-south-1')

BUCKET = os.environ.get('KYC_BUCKET', 'fll-kyc-documents-230811072086')
ADMIN_EMAILS = os.environ.get('ADMIN_EMAILS', 'M.Z@FLL.SA,A.ALZAMIL@FLL.SA').split(',')
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_DOC_TYPES = ['id_card', 'driving_license', 'vehicle_registration', 'insurance', 'iban', 'profile_photo']
ALLOWED_ORIGIN = os.environ.get('ALLOWED_ORIGIN', 'https://fll.sa')

def verify_token(event):
    """Verify Cognito access token"""
    auth_header = (event.get('headers') or {}).get('authorization', '')
    token = auth_header.replace('Bearer ', '')
    if not token:
        return None
    try:
        result = cognito.get_user(AccessToken=token)
        return result.get('Username')
    except Exception:
        return None

def lambda_handler(event, context):
    method = event.get('requestContext',{}).get('http',{}).get('method','')
    if method == 'OPTIONS':
        return cors(200, {})

    # Verify authentication
    user = verify_token(event)
    if not user:
        return cors(401, {'error': 'غير مصرح — يرجى تسجيل الدخول'})

    try:
        body = json.loads(event.get('body','{}'))
        driver_id = body.get('driver_id','').strip()
        driver_name = body.get('driver_name','').strip()
        doc_type = body.get('doc_type','id_card')
        file_data = body.get('file_data','')
        file_name = body.get('file_name','document.jpg')

        if not driver_id or not file_data:
            return cors(400, {'error': 'driver_id and file_data required'})

        # Validate doc_type
        if doc_type not in ALLOWED_DOC_TYPES:
            return cors(400, {'error': f'نوع المستند غير مدعوم. الأنواع المتاحة: {", ".join(ALLOWED_DOC_TYPES)}'})

        # Sanitize file_name (prevent path traversal)
        file_name = re.sub(r'[^a-zA-Z0-9._-]', '_', os.path.basename(file_name))

        # Decode and validate file size
        try:
            file_bytes = base64.b64decode(file_data)
        except Exception:
            return cors(400, {'error': 'بيانات الملف غير صالحة'})

        if len(file_bytes) > MAX_FILE_SIZE:
            return cors(400, {'error': f'حجم الملف يتجاوز الحد المسموح ({MAX_FILE_SIZE // (1024*1024)}MB)'})

        if len(file_bytes) == 0:
            return cors(400, {'error': 'الملف فارغ'})

        # Sanitize driver_id for S3 key
        safe_driver_id = re.sub(r'[^a-zA-Z0-9_-]', '_', driver_id)
        key = f"{safe_driver_id}/{doc_type}/{uuid.uuid4().hex}_{file_name}"

        s3.put_object(
            Bucket=BUCKET, Key=key, Body=file_bytes, ContentType='image/jpeg',
            Metadata={'driver_id': driver_id, 'doc_type': doc_type, 'uploaded_at': datetime.utcnow().isoformat(), 'uploaded_by': user}
        )

        # Notify admins (non-blocking)
        try:
            safe_name = html_escape(driver_name)
            safe_id = html_escape(driver_id)
            safe_doc = html_escape(doc_type)
            ses.send_email(
                Source='FLL Platform <no-reply@fll.sa>',
                Destination={'ToAddresses': ADMIN_EMAILS},
                Message={
                    'Subject': {'Data': f'KYC Upload - {safe_name} ({safe_doc})', 'Charset': 'UTF-8'},
                    'Body': {'Html': {'Data': f'<div dir="rtl" style="font-family:Tahoma"><div style="background:#0f2744;padding:20px;text-align:center;border-radius:12px 12px 0 0"><h2 style="color:#fff;margin:0">FIRST LINE LOGISTICS</h2></div><div style="background:#fff;padding:24px;border:1px solid #e2e8f0"><p><b>السائق:</b> {safe_name}</p><p><b>رقم السائق:</b> {safe_id}</p><p><b>نوع المستند:</b> {safe_doc}</p><p><b>الوقت:</b> {datetime.utcnow().strftime("%Y-%m-%d %H:%M")} UTC</p></div></div>', 'Charset': 'UTF-8'}}
                }
            )
        except Exception as e:
            print(f"SES notification error: {e}")

        return cors(200, {'success': True, 'key': key})
    except Exception as e:
        print(f"KYC upload error: {e}")
        return cors(500, {'error': 'خطأ في رفع المستند'})

def cors(status, body):
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
            'Access-Control-Allow-Headers': 'content-type,authorization',
            'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        'body': json.dumps(body, ensure_ascii=False)
    }
