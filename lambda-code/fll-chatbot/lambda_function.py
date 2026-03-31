"""
FLL AI Chatbot Lambda — يستخدم AWS Bedrock (Claude) للدعم الذكي
يخدم السائقين والموظفين بالعربي

Bedrock region: us-east-1 (Claude models not available in me-south-1)
DynamoDB region: me-south-1 (same as Lambda)
"""
import json
import boto3
import os
import uuid
from datetime import datetime
from botocore.exceptions import ClientError

# Bedrock in us-east-1 (Claude not available in me-south-1/Bahrain)
bedrock = boto3.client('bedrock-runtime', region_name=os.environ.get('BEDROCK_REGION', 'us-east-1'))
dynamodb = boto3.resource('dynamodb', region_name='me-south-1')

CHAT_TABLE = os.environ.get('CHAT_TABLE', 'fll-chat-history')
MODEL_ID = os.environ.get('MODEL_ID', 'anthropic.claude-3-haiku-20240307-v1:0')
MAX_TOKENS = int(os.environ.get('MAX_TOKENS', '1024'))

SYSTEM_PROMPT = """أنت مساعد ذكي لشركة فيرست لاين لوجستيكس (FLL) — شركة توصيل سعودية تخدم منصات HungerStation, Keeta, Ninja, Mrsool, ToYou, Jahez, Careem.

قواعد مهمة:
- تحدث بالعربية السعودية دائماً
- كن مختصراً ومباشراً
- إذا السؤال عن مستحقات مالية: وجّه للمالية أو بوابة السائق
- إذا السؤال عن شكوى: اشرح كيف يقدم شكوى عبر النظام
- إذا السؤال عن حساب مقفل: وجّه لـ support@fll.sa
- إذا السؤال خارج نطاق الشركة: اعتذر بلطف ووجّه للسؤال المناسب

أقسام الشركة: المالية، الموارد البشرية، العمليات، المركبات، الشكاوى، تقنية المعلومات
المدن: الرياض، جدة، الدمام، مكة، المدينة، الخبر

معلومات الدعم:
- إيميل: support@fll.sa
- بوابة السائقين: firstlinelog.com/login
- بوابة الموظفين: firstlinelog.com/unified-login
- نسيت كلمة المرور: firstlinelog.com/forgot-password

صفحات لوحة التحكم المتاحة:
- مركز التحكم (Dashboard): نظرة عامة على العمليات
- الطلبات: متابعة وإدارة طلبات التوصيل
- المناديب: إدارة السائقين والأداء
- الشكاوى: استقبال ومتابعة الشكاوى
- Dispatch: خريطة حية لتتبع السائقين
- المالية: إيرادات، مصروفات، رواتب، محافظ السائقين
- الموظفين: إدارة الموظفين والحضور
- المركبات والأسطول: تتبع المركبات
- التقارير: تقارير تشغيلية ومالية
"""


def lambda_handler(event, context):
    try:
        # Handle OPTIONS (CORS preflight)
        method = (event.get('requestContext', {}).get('http', {}).get('method')
                  or event.get('httpMethod', ''))
        if method == 'OPTIONS':
            return cors_response(200, {})

        # Parse request body
        raw_body = event.get('body', '{}')
        if isinstance(raw_body, str):
            body = json.loads(raw_body)
        else:
            body = raw_body or {}

        message = body.get('message', '').strip()
        user_id = body.get('user_id', 'anonymous')
        conversation_id = body.get('conversation_id', str(uuid.uuid4()))
        history = body.get('history', [])

        if not message:
            return cors_response(400, {'error': 'الرسالة مطلوبة'})

        # Build messages for Bedrock — avoid duplicating the current message
        messages = []
        for h in history[-10:]:
            role = h.get('role', 'user')
            content = h.get('content', '').strip()
            if not content:
                continue
            # Bedrock requires alternating roles; skip consecutive same-role messages
            if messages and messages[-1]['role'] == role:
                messages[-1]['content'] += '\n' + content
            else:
                messages.append({'role': role, 'content': content})

        # Ensure the last message is from the user
        if not messages or messages[-1]['role'] != 'user':
            messages.append({'role': 'user', 'content': message})
        elif messages[-1]['content'] != message:
            messages.append({'role': 'user', 'content': message})

        # Call Bedrock
        response = bedrock.invoke_model(
            modelId=MODEL_ID,
            contentType='application/json',
            accept='application/json',
            body=json.dumps({
                'anthropic_version': 'bedrock-2023-05-31',
                'max_tokens': MAX_TOKENS,
                'system': SYSTEM_PROMPT,
                'messages': messages,
            })
        )

        result = json.loads(response['body'].read())
        assistant_message = result['content'][0]['text']

        # Save to DynamoDB (don't fail the response if this errors)
        try:
            table = dynamodb.Table(CHAT_TABLE)
            table.put_item(Item={
                'conversation_id': conversation_id,
                'timestamp': datetime.utcnow().isoformat(),
                'user_id': user_id,
                'user_message': message,
                'assistant_message': assistant_message,
                'model': MODEL_ID,
                'ttl': int(datetime.utcnow().timestamp()) + 86400 * 30,  # 30 days
            })
        except Exception as e:
            print(f"DynamoDB save error (non-fatal): {e}")

        return cors_response(200, {
            'reply': assistant_message,
            'conversation_id': conversation_id,
            'model': MODEL_ID,
        })

    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', 'Unknown')
        print(f"Bedrock ClientError [{error_code}]: {e}")
        return cors_response(500, {
            'error': 'خطأ في خدمة الذكاء الاصطناعي',
            'code': error_code,
        })
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        return cors_response(400, {'error': 'طلب غير صالح'})
    except Exception as e:
        print(f"Unexpected error: {e}")
        return cors_response(500, {'error': 'خطأ في النظام'})


def cors_response(status, body):
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'content-type,authorization',
            'Access-Control-Allow-Methods': 'POST,OPTIONS',
        },
        'body': json.dumps(body, ensure_ascii=False),
    }
