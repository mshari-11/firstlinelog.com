"""
FLL Contact Confirmation Lambda
يرسل رسالة تأكيد عند استلام استفسار من الموقع
"""
import json
import boto3
import os

ses = boto3.client('ses', region_name='me-south-1')

def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
        sender_email = body.get('sender_email', '')
        sender_name = body.get('name', body.get('sender_name', 'عميل'))
        
        if not sender_email or '@' not in sender_email:
            return {'statusCode': 400, 'body': json.dumps({'error': 'البريد الإلكتروني مطلوب'})}
        
        # Send confirmation email
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
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'},
            'body': json.dumps({'success': True, 'message': 'تم إرسال رسالة التأكيد'}, ensure_ascii=False)
        }
    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'},
            'body': json.dumps({'error': str(e)})
        }
