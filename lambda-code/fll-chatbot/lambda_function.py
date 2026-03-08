"""
FLL AI Chatbot Lambda — يستخدم AWS Bedrock (Claude) للدعم الذكي
يخدم السائقين والموظفين بالعربي
"""
import json
import boto3
import os
import uuid
from datetime import datetime

bedrock = boto3.client('bedrock-runtime', region_name=os.environ.get('BEDROCK_REGION', 'me-south-1'))
dynamodb = boto3.resource('dynamodb', region_name='me-south-1')

CHAT_TABLE = os.environ.get('CHAT_TABLE', 'fll-chat-history')
MODEL_ID = os.environ.get('MODEL_ID', 'anthropic.claude-sonnet-4-6')
MAX_TOKENS = int(os.environ.get('MAX_TOKENS', '1024'))

SYSTEM_PROMPT = """أنت مساعد ذكي لشركة فيرست لاين لوجستيكس (FLL) — شركة توصيل سعودية تخدم منصات HungerStation, Keeta, Ninja, Mrsool, ToYou, Jahez, Careem.

قواعد مهمة:
- تحدث بالعربية السعودية دائماً
- كن مختصراً ومباشراً
- إذا السؤال عن مستحقات مالية: وجّه للمالية أو بوابة السائق
- إذا السؤال عن شكوى: اشرح كيف يقدم شكوى عبر النظام
- إذا السؤال عن حساب مقفل: وجّه لـ support@fll.sa
- إذا السؤال خارج نطاق الشركة: اعتذر بلطف ووجّه للسؤال المناسب

أقسام الشركة: المالية، الموارد البشرية، العمليات، المركبات، الشكاوى
المدن: الرياض، جدة، الدمام

معلومات الدعم:
- إيميل: support@fll.sa
- بوابة السائقين: fll.sa/login
- بوابة الموظفين: fll.sa/unified-login
"""

def lambda_handler(event, context):
    try:
        # Parse request
        if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
            return cors_response(200, {})
        
        body = json.loads(event.get('body', '{}'))
        message = body.get('message', '').strip()
        user_id = body.get('user_id', 'anonymous')
        conversation_id = body.get('conversation_id', str(uuid.uuid4()))
        history = body.get('history', [])
        
        if not message:
            return cors_response(400, {'error': 'الرسالة مطلوبة'})
        
        # Build messages for Bedrock
        messages = []
        for h in history[-10:]:  # Last 10 messages max
            messages.append({'role': h.get('role', 'user'), 'content': h.get('content', '')})
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
                'messages': messages
            })
        )
        
        result = json.loads(response['body'].read())
        assistant_message = result['content'][0]['text']
        
        # Save to DynamoDB (async, don't fail if it errors)
        try:
            table = dynamodb.Table(CHAT_TABLE)
            table.put_item(Item={
                'conversation_id': conversation_id,
                'timestamp': datetime.utcnow().isoformat(),
                'user_id': user_id,
                'user_message': message,
                'assistant_message': assistant_message,
                'model': MODEL_ID,
                'ttl': int(datetime.utcnow().timestamp()) + 86400 * 30  # 30 days
            })
        except Exception as e:
            print(f"DynamoDB save error: {e}")
        
        return cors_response(200, {
            'reply': assistant_message,
            'conversation_id': conversation_id,
            'model': MODEL_ID
        })
        
    except bedrock.exceptions.ClientError as e:
        print(f"Bedrock error: {e}")
        return cors_response(500, {'error': 'خطأ في خدمة الذكاء الاصطناعي', 'details': str(e)})
    except Exception as e:
        print(f"Error: {e}")
        return cors_response(500, {'error': 'خطأ في النظام', 'details': str(e)})

def cors_response(status, body):
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
