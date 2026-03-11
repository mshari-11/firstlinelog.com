"""
FLL Contact Confirmation Lambda
يرسل رسالة تأكيد عند استلام استفسار من الموقع
"""
import json
import boto3
import os
import re
from html import escape as html_escape

ses = boto3.client('ses', region_name='me-south-1')
ALLOWED_ORIGIN = os.environ.get('ALLOWED_ORIGIN', 'https://fll.sa')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'support@fll.sa')

def cors(status, body):
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
            'Access-Control-Allow-Headers': 'content-type',
            'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        'body': json.dumps(body, ensure_ascii=False)
    }

def is_valid_email(email):
    return bool(re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email))

def lambda_handler(event, context):
    method = event.get('requestContext', {}).get('http', {}).get('method', '')
    if method == 'OPTIONS':
        return cors(200, {})

    try:
        body = json.loads(event.get('body', '{}'))
        sender_email = body.get('sender_email', '').strip()
        sender_name = html_escape(body.get('name', body.get('sender_name', 'عميل')))
        message_text = html_escape(body.get('message', body.get('subject', '')))
        sender_phone = html_escape(body.get('phone', body.get('sender_phone', '')))

        if not sender_email or not is_valid_email(sender_email):
            return cors(400, {'error': 'البريد الإلكتروني غير صحيح'})

        # 1. Send confirmation email to sender
        ses.send_email(
            Source='FLL Platform <no-reply@fll.sa>',
            Destination={'ToAddresses': [sender_email]},
            Message={
                'Subject': {'Data': 'تم استقبال رسالتكم — فيرست لاين لوجستيكس', 'Charset': 'UTF-8'},
                'Body': {
                    'Html': {
                        'Data': f'''<div dir="rtl" style="font-family:Tahoma,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
<div style="background:#0f2744;padding:20px;border-radius:12px 12px 0 0;text-align:center;">
<h2 style="color:#fff;margin:0;">فيرست لاين لوجستيكس</h2>
<p style="color:#94a3b8;margin:4px 0 0;">First Line Logistics</p>
</div>
<div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:none;">
<p style="font-size:16px;color:#1e293b;">مرحباً {sender_name}،</p>
<p style="color:#475569;line-height:1.8;">تم استقبال رسالتكم بنجاح وسيتم الرد عليكم في أقرب وقت ممكن.</p>
<p style="color:#475569;line-height:1.8;">في حال الاستعجال يمكنكم التواصل معنا عبر:</p>
<ul style="color:#475569;line-height:2;">
<li>هاتف: <strong>920014948</strong></li>
<li>بريد: <strong>support@fll.sa</strong></li>
</ul>
<p style="color:#94a3b8;font-size:12px;margin-top:24px;">هذه رسالة تلقائية، الرجاء عدم الرد عليها.</p>
</div>
<div style="background:#f8fafc;padding:12px;text-align:center;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none;">
<p style="color:#94a3b8;font-size:11px;margin:0;">© 2026 First Line Logistics — fll.sa</p>
</div>
</div>''',
                        'Charset': 'UTF-8'
                    }
                }
            }
        )

        # 2. Forward the actual message to the business
        try:
            ses.send_email(
                Source='FLL Platform <no-reply@fll.sa>',
                Destination={'ToAddresses': [ADMIN_EMAIL]},
                ReplyToAddresses=[sender_email],
                Message={
                    'Subject': {'Data': f'استفسار جديد من {sender_name} عبر الموقع', 'Charset': 'UTF-8'},
                    'Body': {
                        'Html': {
                            'Data': f'''<div dir="rtl" style="font-family:Tahoma,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
<div style="background:#0f2744;padding:20px;border-radius:12px 12px 0 0;text-align:center;">
<h2 style="color:#fff;margin:0;">استفسار جديد من الموقع</h2>
</div>
<div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:none;">
<p><b>الاسم:</b> {sender_name}</p>
<p><b>البريد:</b> {html_escape(sender_email)}</p>
<p><b>الجوال:</b> {sender_phone or 'غير محدد'}</p>
<p><b>الرسالة:</b></p>
<div style="background:#f1f5f9;padding:16px;border-radius:8px;white-space:pre-wrap;line-height:1.8">{message_text or 'لم يتم إرسال رسالة'}</div>
</div>
</div>''',
                            'Charset': 'UTF-8'
                        }
                    }
                }
            )
        except Exception as e:
            print(f"Admin email error: {e}")

        return cors(200, {'success': True, 'message': 'تم إرسال رسالة التأكيد'})
    except Exception as e:
        print(f"Contact confirm error: {e}")
        return cors(500, {'error': 'خطأ في إرسال الرسالة'})
