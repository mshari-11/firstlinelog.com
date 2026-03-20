import json
import boto3
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

lambda_client = boto3.client('lambda', region_name='me-south-1')

def lambda_handler(event, context):
    """معالج API Gateway للمراجعة المالية بالذكاء الاصطناعي"""
    
    try:
        # تحليل الطلب
        http_method = event.get('httpMethod')
        path = event.get('path', '')
        path_parameters = event.get('pathParameters', {})
        query_parameters = event.get('queryStringParameters') or {}
        
        # استخراج معرف الدفعة
        payout_run_id = path_parameters.get('id')
        if not payout_run_id:
            return {
                'statusCode': 400,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'معرف الدفعة مطلوب'}, ensure_ascii=False)
            }
        
        # توجيه الطلبات
        if http_method == 'POST' and 'ai-review' in path:
            return handle_create_review(event, payout_run_id)
        elif http_method == 'GET' and 'ai-review' in path:
            if 'history' in path:
                return handle_get_review_history(payout_run_id)
            elif 'review-pack' in path:
                return handle_get_review_pack(payout_run_id, query_parameters)
            else:
                return handle_get_review(payout_run_id)
        else:
            return {
                'statusCode': 404,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'المسار غير موجود'}, ensure_ascii=False)
            }
            
    except Exception as e:
        logger.error(f"API handler error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({'error': 'خطأ في الخادم'}, ensure_ascii=False)
        }

def handle_create_review(event, payout_run_id):
    """إنشاء مراجعة جديدة"""
    try:
        body = json.loads(event.get('body', '{}'))
        review_type = body.get('review_type', 'initial')
        
        # استدعاء Lambda الرئيسي
        response = lambda_client.invoke(
            FunctionName='fll-ai-finance-review',
            InvocationType='RequestResponse',
            Payload=json.dumps({
                'payout_run_id': payout_run_id,
                'review_type': review_type
            })
        )
        
        result = json.loads(response['Payload'].read())
        
        return {
            'statusCode': 200,
            'headers': cors_headers(),
            'body': json.dumps(result, ensure_ascii=False)
        }
        
    except Exception as e:
        logger.error(f"Create review error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({'error': str(e)}, ensure_ascii=False)
        }

def handle_get_review(payout_run_id):
    """الحصول على آخر مراجعة"""
    # هنا يجب الاتصال بقاعدة البيانات للحصول على النتائج
    # للآن نرجع استجابة وهمية
    return {
        'statusCode': 200,
        'headers': cors_headers(),
        'body': json.dumps({
            'payout_run_id': payout_run_id,
            'review_type': 'initial',
            'health_score': 85,
            'summary': 'مراجعة تجريبية - قاعدة البيانات غير متصلة',
            'created_at': datetime.now().isoformat()
        }, ensure_ascii=False)
    }

def handle_get_review_history(payout_run_id):
    """الحصول على تاريخ المراجعات"""
    return {
        'statusCode': 200,
        'headers': cors_headers(),
        'body': json.dumps({
            'payout_run_id': payout_run_id,
            'reviews': [
                {
                    'review_type': 'initial',
                    'health_score': 85,
                    'created_at': datetime.now().isoformat()
                }
            ]
        }, ensure_ascii=False)
    }

def handle_get_review_pack(payout_run_id, query_params):
    """الحصول على حزمة المراجعة للقسم"""
    department = query_params.get('department', 'finance')
    
    return {
        'statusCode': 200,
        'headers': cors_headers(),
        'body': json.dumps({
            'payout_run_id': payout_run_id,
            'department': department,
            'system_checks': [],
            'ai_results': {
                'health_score': 85,
                'department_specific_issues': []
            }
        }, ensure_ascii=False)
    }

def cors_headers():
    """CORS headers"""
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Content-Type': 'application/json'
    }
