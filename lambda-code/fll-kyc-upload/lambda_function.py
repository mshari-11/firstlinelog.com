import json, boto3, os, base64, uuid
from datetime import datetime

s3 = boto3.client('s3', region_name='me-south-1')
ses = boto3.client('ses', region_name='me-south-1')
BUCKET = 'fll-kyc-documents-230811072086'
ADMIN_EMAILS = ['M.Z@FLL.SA', 'A.ALZAMIL@FLL.SA']


def fll_email_template(subject_ar, intro_html, body_html, footer_note=None):
    footer_note = footer_note or 'هذه رسالة تلقائية من نظام FLL — الرجاء عدم الرد عليها.'
    return f'''<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:24px 0;background:#07111d;font-family:Tahoma,Arial,sans-serif;color:#e5e7eb;">
<div style="max-width:640px;margin:0 auto;background:#08111b;border-radius:18px;overflow:hidden;border:1px solid #16263d;box-shadow:0 12px 40px rgba(0,0,0,0.35);">
  <div style="background:#12315f;padding:28px 24px;text-align:center;">
    <div style="font-size:18px;font-weight:700;letter-spacing:2px;color:#e5e7eb;">FIRST LINE LOGISTICS</div>
    <div style="margin-top:8px;font-size:13px;color:#d1d5db;">شركة الخط الأول للخدمات اللوجستية</div>
  </div>
  <div style="padding:28px 24px;background:#08111b;">
    <div style="font-size:28px;line-height:1.7;color:#f3f4f6;font-weight:700;margin-bottom:14px;">{subject_ar}</div>
    <div style="font-size:16px;line-height:1.9;color:#e5e7eb;margin-bottom:14px;">{intro_html}</div>
    <div style="font-size:15px;line-height:1.9;color:#cbd5e1;">{body_html}</div>
    <div style="margin-top:18px;font-size:12px;line-height:1.8;color:#94a3b8;text-align:center;">{footer_note}</div>
  </div>
  <div style="background:#12315f;padding:22px 20px;text-align:center;">
    <div style="font-size:13px;color:#d1d5db;">fll.sa — First Line Logistics {datetime.utcnow().year} &copy;</div>
  </div>
</div>
</body>
</html>'''

def lambda_handler(event, context):
    method = event.get('requestContext',{}).get('http',{}).get('method','')
    if method == 'OPTIONS':
        return cors(200, {})
    try:
        body = json.loads(event.get('body','{}'))
        driver_id = body.get('driver_id','')
        driver_name = body.get('driver_name','')
        doc_type = body.get('doc_type','id_card')
        file_data = body.get('file_data','')
        file_name = body.get('file_name','document.jpg')
        if not driver_id or not file_data:
            return cors(400, {'error': 'driver_id and file_data required'})
        file_bytes = base64.b64decode(file_data)
        key = f"{driver_id}/{doc_type}/{uuid.uuid4().hex}_{file_name}"
        s3.put_object(Bucket=BUCKET, Key=key, Body=file_bytes, ContentType='image/jpeg',
                     Metadata={'driver_id':driver_id,'doc_type':doc_type,'uploaded_at':datetime.utcnow().isoformat()})
        try:
            html = fll_email_template(
                'تم رفع مستند KYC جديد',
                f'تم استلام مستند جديد للسائق {driver_name}.',
                f'<p><strong>رقم السائق:</strong> {driver_id}</p><p><strong>نوع المستند:</strong> {doc_type}</p><p><strong>الوقت:</strong> {datetime.utcnow().strftime("%Y-%m-%d %H:%M")} UTC</p>'
            )
            ses.send_email(
                Source='FLL Platform <no-reply@fll.sa>',
                Destination={'ToAddresses': ADMIN_EMAILS},
                Message={
                    'Subject':{'Data':f'KYC Upload - {driver_name} ({doc_type})','Charset':'UTF-8'},
                    'Body':{'Html':{'Data':html,'Charset':'UTF-8'}}
                }
            )
        except: pass
        return cors(200, {'success':True,'key':key})
    except Exception as e:
        return cors(500, {'error':'حدث خطأ في رفع المستند'})

def cors(status, body):
    return {'statusCode':status,'headers':{'Content-Type':'application/json','Access-Control-Allow-Origin':'https://www.fll.sa','Access-Control-Allow-Headers':'content-type','Access-Control-Allow-Methods':'POST,OPTIONS'},'body':json.dumps(body,ensure_ascii=False)}
