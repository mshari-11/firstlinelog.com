"""
FLL AI Chatbot Lambda — مساعد ذكي مع وصول مباشر للبنية التحتية
يقرأ من: AWS (DynamoDB, Lambda, CloudWatch), GitHub, Vercel
يكتب: فقط تحديث صلاحيات الموظفين في DynamoDB
"""
import json
import boto3
import os
import uuid
import urllib.request
from datetime import datetime
from botocore.exceptions import ClientError

REGION = os.environ.get('AWS_REGION', 'us-east-1')
bedrock = boto3.client('bedrock-runtime', region_name=REGION)
dynamodb = boto3.resource('dynamodb', region_name=REGION)
ddb_client = boto3.client('dynamodb', region_name=REGION)
lambda_client = boto3.client('lambda', region_name=REGION)

CHAT_TABLE = os.environ.get('CHAT_TABLE', 'fll-chat-history')
MODEL_ID = os.environ.get('MODEL_ID', 'us.anthropic.claude-haiku-4-5-20251001-v1:0')
MAX_TOKENS = int(os.environ.get('MAX_TOKENS', '2048'))
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN', '')
GITHUB_REPO = os.environ.get('GITHUB_REPO', 'mshari-11/firstlinelog.com')
VERCEL_TOKEN = os.environ.get('VERCEL_TOKEN', '')
VERCEL_PROJECT = os.environ.get('VERCEL_PROJECT', 'firstlinelog')

SYSTEM_PROMPT = """أنت مساعد ذكي متقدم لشركة فيرست لاين لوجستيكس (FLL) — شركة توصيل سعودية.
لديك وصول مباشر لقراءة البيانات من:
- AWS DynamoDB (39 جدول): السائقين، الطلبات، الموظفين، المالية، الشكاوى، المركبات...
- AWS Lambda: حالة الدوال والأخطاء
- GitHub: الكود، الـ Issues، الـ Pull Requests
- Vercel: حالة النشر والـ Deployments

ولديك صلاحية كتابة واحدة فقط:
- تعديل صلاحيات الموظفين في لوحة التحكم

قواعد:
- تحدث بالعربية السعودية دائماً
- كن مختصراً ومباشراً
- استخدم الأدوات المتاحة لك للإجابة بمعلومات حقيقية
- عند تعديل الصلاحيات: تأكد من المستخدم قبل التنفيذ
- لا تكشف tokens أو مفاتيح أو معلومات حساسة

أقسام الشركة: المالية، الموارد البشرية، العمليات، المركبات، الشكاوى، تقنية المعلومات
المدن: الرياض، جدة، الدمام، مكة، المدينة، الخبر
الموقع: firstlinelog.com
"""

# ── Tool Definitions ──────────────────────────────────────────────────────────
TOOLS = [
    {
        "name": "read_dashboard_stats",
        "description": "قراءة إحصائيات لوحة التحكم: عدد السائقين، الطلبات، الشكاوى، الموظفين، المركبات",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "read_staff_list",
        "description": "قراءة قائمة الموظفين مع صلاحياتهم وأقسامهم",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "read_drivers",
        "description": "قراءة قائمة السائقين/المناديب مع حالتهم",
        "input_schema": {
            "type": "object",
            "properties": {
                "status": {"type": "string", "description": "فلتر حسب الحالة: active, pending, suspended, all", "default": "all"}
            },
            "required": []
        }
    },
    {
        "name": "read_orders",
        "description": "قراءة آخر الطلبات أو إحصائيات الطلبات",
        "input_schema": {
            "type": "object",
            "properties": {
                "limit": {"type": "number", "description": "عدد الطلبات المطلوبة", "default": 10}
            },
            "required": []
        }
    },
    {
        "name": "read_complaints",
        "description": "قراءة الشكاوى المفتوحة أو كل الشكاوى",
        "input_schema": {
            "type": "object",
            "properties": {
                "status": {"type": "string", "description": "open, closed, all", "default": "all"}
            },
            "required": []
        }
    },
    {
        "name": "read_lambda_status",
        "description": "قراءة حالة دوال Lambda في AWS",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "read_github_info",
        "description": "قراءة معلومات من GitHub: آخر commits، issues مفتوحة، pull requests",
        "input_schema": {
            "type": "object",
            "properties": {
                "resource": {"type": "string", "description": "commits, issues, pulls", "default": "commits"}
            },
            "required": []
        }
    },
    {
        "name": "read_vercel_deployments",
        "description": "قراءة حالة النشر على Vercel: آخر deployments وحالتها",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "read_dynamodb_tables",
        "description": "قراءة قائمة جداول DynamoDB مع عدد السجلات",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "update_staff_permissions",
        "description": "تحديث صلاحيات موظف في لوحة التحكم. الصلاحيات المتاحة: couriers, orders, finance, complaints, excel, reports, vehicles, staff, dispatch, wallet",
        "input_schema": {
            "type": "object",
            "properties": {
                "staff_sub": {"type": "string", "description": "معرف الموظف (sub) في DynamoDB"},
                "permissions": {
                    "type": "object",
                    "description": "الصلاحيات المطلوب تحديثها، مثال: {\"finance\": true, \"reports\": true}"
                }
            },
            "required": ["staff_sub", "permissions"]
        }
    },
]


# ── Tool Handlers ─────────────────────────────────────────────────────────────
def handle_tool(name, input_data):
    try:
        if name == "read_dashboard_stats":
            return _read_stats()
        elif name == "read_staff_list":
            return _read_staff()
        elif name == "read_drivers":
            return _read_table("fll-drivers", input_data.get("status", "all"), "status")
        elif name == "read_orders":
            return _read_table("fll-orders", "all", None, input_data.get("limit", 10))
        elif name == "read_complaints":
            return _read_table("fll-complaints", input_data.get("status", "all"), "status")
        elif name == "read_lambda_status":
            return _read_lambdas()
        elif name == "read_github_info":
            return _read_github(input_data.get("resource", "commits"))
        elif name == "read_vercel_deployments":
            return _read_vercel()
        elif name == "read_dynamodb_tables":
            return _read_dynamo_tables()
        elif name == "update_staff_permissions":
            return _update_permissions(input_data["staff_sub"], input_data["permissions"])
        else:
            return {"error": f"Unknown tool: {name}"}
    except Exception as e:
        return {"error": str(e)}


def _read_stats():
    stats = {}
    tables = {"drivers": "fll-drivers", "orders": "fll-orders", "complaints": "fll-complaints",
              "vehicles": "fll-vehicles", "staff": "fll-staff-users", "notifications": "fll-notifications"}
    for key, table in tables.items():
        try:
            r = dynamodb.Table(table).scan(Select='COUNT')
            stats[key] = r.get('Count', 0)
        except:
            stats[key] = "error"
    return stats


def _read_staff():
    try:
        table = dynamodb.Table("fll-staff-users")
        r = table.scan(Limit=50)
        items = r.get('Items', [])
        result = []
        for s in items:
            result.append({
                "sub": s.get("sub"),
                "user_id": s.get("user_id"),
                "job_title": s.get("job_title_ar", ""),
                "department_id": s.get("department_id"),
                "permissions": s.get("permissions", {}),
                "is_active": s.get("is_active", False),
                "can_approve": s.get("can_approve", False),
            })
        return {"staff": result, "total": len(result)}
    except Exception as e:
        return {"error": str(e)}


def _read_table(table_name, status_filter, status_key, limit=20):
    try:
        table = dynamodb.Table(table_name)
        r = table.scan(Limit=min(limit, 50))
        items = r.get('Items', [])
        if status_filter and status_filter != "all" and status_key:
            items = [i for i in items if i.get(status_key) == status_filter]
        # Simplify output
        simplified = []
        for i in items[:limit]:
            entry = {}
            for k, v in i.items():
                if isinstance(v, (str, int, float, bool)):
                    entry[k] = v
            simplified.append(entry)
        return {"items": simplified, "count": len(simplified), "total_scanned": r.get('Count', 0)}
    except Exception as e:
        return {"error": str(e)}


def _read_lambdas():
    try:
        r = lambda_client.list_functions(MaxItems=20)
        funcs = []
        for f in r.get('Functions', []):
            if 'fll' in f['FunctionName'].lower():
                funcs.append({
                    "name": f['FunctionName'],
                    "runtime": f.get('Runtime', ''),
                    "memory": f.get('MemorySize', 0),
                    "timeout": f.get('Timeout', 0),
                    "last_modified": f.get('LastModified', ''),
                })
        return {"functions": funcs, "count": len(funcs)}
    except Exception as e:
        return {"error": str(e)}


def _read_github(resource):
    if not GITHUB_TOKEN:
        return {"error": "GitHub token not configured"}
    try:
        url = f"https://api.github.com/repos/{GITHUB_REPO}/{resource}?per_page=5&state=open"
        req = urllib.request.Request(url, headers={
            "Authorization": f"token {GITHUB_TOKEN}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "FLL-Bot"
        })
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
        results = []
        for item in data[:5]:
            if resource == "commits":
                results.append({
                    "sha": item.get("sha", "")[:7],
                    "message": item.get("commit", {}).get("message", "")[:100],
                    "author": item.get("commit", {}).get("author", {}).get("name", ""),
                    "date": item.get("commit", {}).get("author", {}).get("date", ""),
                })
            else:
                results.append({
                    "number": item.get("number"),
                    "title": item.get("title", "")[:80],
                    "state": item.get("state"),
                    "user": item.get("user", {}).get("login", ""),
                    "created": item.get("created_at", ""),
                })
        return {resource: results, "count": len(results)}
    except Exception as e:
        return {"error": str(e)}


def _read_vercel():
    if not VERCEL_TOKEN:
        return {"error": "Vercel token not configured"}
    try:
        url = f"https://api.vercel.com/v6/deployments?projectId={VERCEL_PROJECT}&limit=5"
        req = urllib.request.Request(url, headers={
            "Authorization": f"Bearer {VERCEL_TOKEN}",
            "User-Agent": "FLL-Bot"
        })
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
        deploys = []
        for d in data.get("deployments", [])[:5]:
            deploys.append({
                "url": d.get("url", ""),
                "state": d.get("state", ""),
                "created": d.get("created", ""),
                "target": d.get("target", ""),
            })
        return {"deployments": deploys, "count": len(deploys)}
    except Exception as e:
        return {"error": str(e)}


def _read_dynamo_tables():
    try:
        r = ddb_client.list_tables()
        tables = [t for t in r.get('TableNames', []) if t.startswith('fll-')]
        return {"tables": tables, "count": len(tables)}
    except Exception as e:
        return {"error": str(e)}


def _update_permissions(staff_sub, permissions):
    VALID_PERMS = {"couriers", "orders", "finance", "complaints", "excel", "reports", "vehicles", "staff", "dispatch", "wallet"}
    invalid = set(permissions.keys()) - VALID_PERMS
    if invalid:
        return {"error": f"صلاحيات غير صالحة: {invalid}. المتاح: {VALID_PERMS}"}

    try:
        table = dynamodb.Table("fll-staff-users")
        # Read current
        r = table.get_item(Key={"sub": staff_sub})
        if "Item" not in r:
            return {"error": f"الموظف {staff_sub} غير موجود"}

        current = r["Item"].get("permissions", {})
        updated = {**current, **permissions}

        table.update_item(
            Key={"sub": staff_sub},
            UpdateExpression="SET permissions = :p, updatedAt = :u",
            ExpressionAttributeValues={":p": updated, ":u": datetime.utcnow().isoformat()},
        )

        return {
            "success": True,
            "staff_sub": staff_sub,
            "previous": current,
            "updated": updated,
            "message": "تم تحديث الصلاحيات بنجاح"
        }
    except Exception as e:
        return {"error": str(e)}


# ── Main Handler ──────────────────────────────────────────────────────────────
def lambda_handler(event, context):
    try:
        method = (event.get('requestContext', {}).get('http', {}).get('method')
                  or event.get('httpMethod', ''))
        if method == 'OPTIONS':
            return cors_response(200, {})

        raw_body = event.get('body', '{}')
        body = json.loads(raw_body) if isinstance(raw_body, str) else (raw_body or {})

        message = body.get('message', '').strip()
        user_id = body.get('user_id', 'anonymous')
        conversation_id = body.get('conversation_id', str(uuid.uuid4()))
        history = body.get('history', [])

        if not message:
            return cors_response(400, {'error': 'الرسالة مطلوبة'})

        # Build messages
        messages = []
        for h in history[-10:]:
            role = h.get('role', 'user')
            content = h.get('content', '').strip()
            if not content:
                continue
            if messages and messages[-1]['role'] == role:
                messages[-1]['content'] += '\n' + content
            else:
                messages.append({'role': role, 'content': content})

        if not messages or messages[-1]['role'] != 'user':
            messages.append({'role': 'user', 'content': message})
        elif messages[-1]['content'] != message:
            messages.append({'role': 'user', 'content': message})

        # Call Bedrock with tools — loop for tool_use
        assistant_message = ""
        max_iterations = 5

        for _ in range(max_iterations):
            response = bedrock.invoke_model(
                modelId=MODEL_ID,
                contentType='application/json',
                accept='application/json',
                body=json.dumps({
                    'anthropic_version': 'bedrock-2023-05-31',
                    'max_tokens': MAX_TOKENS,
                    'system': SYSTEM_PROMPT,
                    'messages': messages,
                    'tools': TOOLS,
                })
            )

            result = json.loads(response['body'].read())
            stop_reason = result.get('stop_reason', 'end_turn')

            # Collect response content
            tool_results = []
            text_parts = []

            for block in result.get('content', []):
                if block['type'] == 'text':
                    text_parts.append(block['text'])
                elif block['type'] == 'tool_use':
                    tool_name = block['name']
                    tool_input = block.get('input', {})
                    tool_id = block['id']
                    tool_output = handle_tool(tool_name, tool_input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": tool_id,
                        "content": json.dumps(tool_output, ensure_ascii=False, default=str)
                    })

            if stop_reason == 'tool_use' and tool_results:
                # Add assistant response + tool results, then loop
                messages.append({"role": "assistant", "content": result['content']})
                messages.append({"role": "user", "content": tool_results})
            else:
                assistant_message = "\n".join(text_parts)
                break

        if not assistant_message:
            assistant_message = "تعذر الحصول على رد."

        # Save to DynamoDB
        try:
            dynamodb.Table(CHAT_TABLE).put_item(Item={
                'conversation_id': conversation_id,
                'timestamp': datetime.utcnow().isoformat(),
                'user_id': user_id,
                'user_message': message,
                'assistant_message': assistant_message,
                'model': MODEL_ID,
                'ttl': int(datetime.utcnow().timestamp()) + 86400 * 30,
            })
        except Exception as e:
            print(f"DynamoDB save error: {e}")

        return cors_response(200, {
            'reply': assistant_message,
            'conversation_id': conversation_id,
            'model': MODEL_ID,
        })

    except ClientError as e:
        code = e.response.get('Error', {}).get('Code', 'Unknown')
        print(f"Bedrock error [{code}]: {e}")
        return cors_response(500, {'error': 'خطأ في خدمة الذكاء الاصطناعي', 'code': code})
    except Exception as e:
        print(f"Error: {e}")
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
