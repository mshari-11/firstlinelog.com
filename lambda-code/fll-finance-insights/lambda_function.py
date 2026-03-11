"""
FLL AI Financial Report Analyst v1.0
محلل التقارير المالية بالذكاء الاصطناعي — فيرست لاين لوجستيكس

Purpose: Read-only financial insights via AWS Bedrock
- Daily/weekly financial commentary
- Trend analysis
- Anomaly detection suggestions
- Revenue/cost breakdown narratives

Feature flag: FEATURE_AI_FINANCE_INSIGHTS
READ-ONLY: No writes to finance tables
"""

import json
import os
import boto3
from datetime import datetime

REGION = os.environ.get('BEDROCK_REGION', 'me-south-1')
MODEL_ID = os.environ.get('FINANCE_MODEL_ID', 'anthropic.claude-sonnet-4-6-20250514')
ALLOWED_ORIGIN = os.environ.get('ALLOWED_ORIGIN', 'https://fll.sa')

bedrock = boto3.client('bedrock-runtime', region_name=REGION)

HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
}

SYSTEM_PROMPT = """أنت محلل مالي خبير لشركة فيرست لاين لوجستيكس (FLL)، شركة سعودية متخصصة في خدمات الطرف الثالث للميل الأخير.

مهامك:
1. تحليل البيانات المالية المقدمة وتقديم رؤى واضحة بالعربي
2. تحديد الاتجاهات (trends) والأنماط غير الطبيعية (anomalies)
3. حساب مؤشرات الأداء الرئيسية (KPIs)
4. تقديم توصيات تشغيلية مبنية على البيانات

قيود:
- أنت للقراءة فقط — لا تقترح تعديلات مباشرة على قاعدة البيانات
- كل استنتاجاتك استشارية وليست قرارات نهائية
- استخدم الريال السعودي (ر.س) في كل المبالغ
- أجب بالعربي دائماً

المنصات التي تعمل معها FLL: هنقرستيشن، كيتا، نينجا، مرسول، تويو، جاهز، كريم"""


def lambda_handler(event, context):
    method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': '{}'}

    # Auth check
    auth_header = (event.get('headers') or {}).get('authorization') or (event.get('headers') or {}).get('Authorization', '')
    if not auth_header:
        return response(401, {'error': 'غير مصرح'})

    try:
        body = json.loads(event.get('body', '{}')) if event.get('body') else {}
    except json.JSONDecodeError:
        body = {}

    path_parts = (event.get('path') or event.get('rawPath', '/')).strip('/').split('/')
    if path_parts and path_parts[0] == 'finance':
        path_parts.pop(0)
    if path_parts and path_parts[0] == 'insights':
        path_parts.pop(0)

    action = path_parts[0] if path_parts else ''

    if method == 'GET' and action == '':
        return response(200, {
            'service': 'FLL AI Financial Report Analyst v1.0',
            'capabilities': ['daily_commentary', 'trend_analysis', 'anomaly_detection', 'profitability_narrative'],
            'status': 'active',
            'mode': 'read_only'
        })

    if method == 'POST' and action in ('analyze', 'commentary', 'trends', 'anomalies'):
        return handle_analysis(action, body)

    return response(404, {'error': f'مسار غير موجود: {action}'})


def handle_analysis(action, body):
    """Generate AI-powered financial analysis"""
    data = body.get('data', {})
    query = body.get('query', '')
    period = body.get('period', 'daily')

    prompts = {
        'analyze': f"حلل البيانات المالية التالية وقدم ملخصاً شاملاً:\n\n{json.dumps(data, ensure_ascii=False, indent=2)}\n\nالاستفسار: {query}",
        'commentary': f"اكتب تعليقاً مالياً {'يومياً' if period == 'daily' else 'أسبوعياً'} بناءً على:\n\n{json.dumps(data, ensure_ascii=False, indent=2)}",
        'trends': f"حدد الاتجاهات والأنماط في البيانات المالية التالية:\n\n{json.dumps(data, ensure_ascii=False, indent=2)}",
        'anomalies': f"ابحث عن أي قيم شاذة أو أنماط غير طبيعية في:\n\n{json.dumps(data, ensure_ascii=False, indent=2)}"
    }

    user_prompt = prompts.get(action, prompts['analyze'])

    try:
        bedrock_response = bedrock.invoke_model(
            modelId=MODEL_ID,
            contentType='application/json',
            accept='application/json',
            body=json.dumps({
                'anthropic_version': 'bedrock-2023-05-31',
                'max_tokens': 2000,
                'system': SYSTEM_PROMPT,
                'messages': [{'role': 'user', 'content': user_prompt}]
            })
        )

        result = json.loads(bedrock_response['body'].read())
        analysis_text = result.get('content', [{}])[0].get('text', 'لم يتم التحليل')

        return response(200, {
            'analysis': analysis_text,
            'action': action,
            'period': period,
            'mode': 'read_only',
            'disclaimer': 'هذا التحليل استشاري فقط وليس قراراً مالياً نهائياً',
            'generated_at': datetime.utcnow().isoformat() + 'Z'
        })
    except Exception as e:
        return response(500, {
            'error': 'خطأ في تحليل Bedrock',
            'details': str(e) if os.environ.get('DEBUG') else 'Internal error'
        })


def response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': HEADERS,
        'body': json.dumps(body, ensure_ascii=False)
    }
