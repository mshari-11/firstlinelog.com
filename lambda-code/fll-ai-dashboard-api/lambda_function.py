import json
import boto3
import os
from decimal import Decimal

dynamodb = boto3.resource('dynamodb', region_name='me-south-1')
s3_client = boto3.client('s3', region_name='me-south-1')

PAYOUT_TABLE = os.environ.get('PAYOUT_TABLE', 'fll-payout-runs')
REPORTS_BUCKET = os.environ.get('REPORTS_BUCKET', 'fll-ai-reports-230811072086')

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)

def cors_response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization'
        },
        'body': json.dumps(body, cls=DecimalEncoder)
    }

def get_runs(event):
    table = dynamodb.Table(PAYOUT_TABLE)
    response = table.scan(Limit=50)
    items = response.get('Items', [])
    items.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    return cors_response(200, {'runs': items, 'count': len(items)})

def get_run_detail(event, run_id):
    table = dynamodb.Table(PAYOUT_TABLE)
    response = table.get_item(Key={'runId': run_id})
    item = response.get('Item')
    if not item:
        return cors_response(404, {'error': 'Run not found'})
    return cors_response(200, {'run': item})

def get_report(event, run_id):
    try:
        key = 'reports/' + run_id + '/ai_review.json'
        response = s3_client.get_object(Bucket=REPORTS_BUCKET, Key=key)
        content = json.loads(response['Body'].read().decode('utf-8'))
        return cors_response(200, {'report': content})
    except Exception as e:
        return cors_response(404, {'error': 'Report not found'})

def lambda_handler(event, context):
    method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
    path = event.get('rawPath', '')
    if method == 'OPTIONS':
        return cors_response(200, {})
    if path == '/runs' or path == '/ai/runs':
        return get_runs(event)
    if '/runs/' in path:
        run_id = path.split('/')[-1]
        return get_run_detail(event, run_id)
    if '/reports/' in path:
        run_id = path.split('/')[-1]
        return get_report(event, run_id)
    return cors_response(404, {'error': 'Not found', 'path': path})
