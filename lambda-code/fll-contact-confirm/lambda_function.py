"""
FLL Contact Confirmation Lambda
يرسل رسالة تأكيد عند استلام استفسار من الموقع
"""
import json
import boto3
import os

ses = boto3.client('ses', region_name='me-south-1')


def fll_email_template(subject_ar, intro_html, body_html, footer_note=None):
    footer_note = footer_note or 'هذه رسالة تلقائية من نظام FLL — الرجاء عدم الرد عليها.'
    return f'''<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
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
      <div style="margin-top:22px;background:#020817;border:1px solid #0f2744;border-radius:12px;padding:18px 16px;">
        <div style="font-size:15px;line-height:1.9;color:#e5e7eb;">
          <strong>التواصل المباشر:</strong>
          <a href="tel:920014948" style="color:#2563eb;text-decoration:none;font-weight:700;">920014948</a>
        </div>
        <div style="font-size:15px;line-height:1.9;color:#e5e7eb;">
          <strong>البريد:</strong>
          <a href="mailto:support@fll.sa" style="color:#2563eb;text-decoration:none;font-weight:700;">support@fll.sa</a>
        </div>
      </div>
      <div style="margin-top:18px;font-size:12px;line-height:1.8;color:#94a3b8;text-align:center;">{footer_note}</div>
    </div>
    <div style="background:#12315f;padding:22px 20px;text-align:center;">
      <div style="width:54px;height:54px;margin:0 auto 12px;background:#062b45;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;letter-spacing:1px;">FLL</div>
      <div style="font-size:13px;color:#d1d5db;">fll.sa — First Line Logistics {__import__('datetime').datetime.utcnow().year} &copy;</div>
    </div>
  </div>
</body>
</html>'''

def lambda_handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
        sender_email = body.get('sender_email', '')
        sender_name = body.get('name', body.get('sender_name', 'عميل'))
        
        if not sender_email or '@' not in sender_email:
            return {'statusCode': 400, 'body': json.dumps({'error': 'البريد الإلكتروني مطلوب'})}
        
        confirmation_html = fll_email_template(
            'تم استقبال رسالتكم - فيرست لاين لوجستكس',
            f'مرحباً {sender_name}،',
            'تم استقبال رسالتكم بنجاح وسيتم الرد عليكم في أقرب وقت ممكن.'
        )

        ses.send_email(
            Source='FLL Platform <no-reply@fll.sa>',
            Destination={'ToAddresses': [sender_email]},
            Message={
                'Subject': {'Data': 'تم استقبال رسالتكم — فيرست لاين لوجستيكس', 'Charset': 'UTF-8'},
                'Body': {
                    'Html': {
                        'Data': confirmation_html,
                        'Charset': 'UTF-8'
                    }
                }
            }
        )
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type':'application/json','Access-Control-Allow-Origin':'https://fll.sa'},
            'body': json.dumps({'success': True, 'message': 'تم إرسال رسالة التأكيد'}, ensure_ascii=False)
        }
    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type':'application/json','Access-Control-Allow-Origin':'https://fll.sa'},
            'body': json.dumps({'error': 'حدث خطأ في إرسال التأكيد'})
        }
