import json, boto3, os, base64, uuid
from datetime import datetime

s3 = boto3.client('s3', region_name='me-south-1')
ses = boto3.client('ses', region_name='me-south-1')
BUCKET = 'fll-kyc-documents-230811072086'
ADMIN_EMAILS = ['M.Z@FLL.SA', 'A.ALZAMIL@FLL.SA']

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
            ses.send_email(
                Source='FLL Platform <no-reply@fll.sa>',
                Destination={'ToAddresses': ADMIN_EMAILS},
                Message={
                    'Subject':{'Data':f'KYC Upload - {driver_name} ({doc_type})','Charset':'UTF-8'},
                    'Body':{'Html':{'Data':f'<div dir="rtl" style="font-family:Tahoma"><div style="background:#0f2744;padding:20px;text-align:center;border-radius:12px 12px 0 0"><h2 style="color:#fff;margin:0">FIRST LINE LOGISTICS</h2></div><div style="background:#fff;padding:24px;border:1px solid #e2e8f0"><p><b>السائق:</b> {driver_name}</p><p><b>رقم السائق:</b> {driver_id}</p><p><b>نوع المستند:</b> {doc_type}</p><p><b>الوقت:</b> {datetime.utcnow().strftime("%Y-%m-%d %H:%M")} UTC</p></div></div>','Charset':'UTF-8'}}
                }
            )
        except: pass
        return cors(200, {'success':True,'key':key})
    except Exception as e:
        return cors(500, {'error':str(e)})

def cors(status, body):
    return {'statusCode':status,'headers':{'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type','Access-Control-Allow-Methods':'POST,OPTIONS'},'body':json.dumps(body,ensure_ascii=False)}
