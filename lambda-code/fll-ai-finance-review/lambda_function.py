import json
import boto3
from decimal import Decimal
from datetime import datetime

bedrock = boto3.client("bedrock-runtime", region_name="me-south-1")
dynamodb = boto3.resource("dynamodb", region_name="me-south-1")
s3 = boto3.client("s3")

PAYOUT_TABLE = "fll-payout-runs"
PAYOUT_LINES_TABLE = "fll-payout-lines"
RESULTS_TABLE = "ai_review_results"
REPORTS_BUCKET = "fll-finance-exports-230811072086"

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def get_payout_run(run_id):
    table = dynamodb.Table(PAYOUT_TABLE)
    resp = table.get_item(Key={"runId": run_id})
    return resp.get("Item", {})

def get_payout_lines(payout_run_id):
    table = dynamodb.Table(PAYOUT_LINES_TABLE)
    response = table.scan(
        FilterExpression="payout_run_id = :id",
        ExpressionAttributeValues={":id": payout_run_id}
    )
    return response.get("Items", [])

def update_run_status(run_id, status):
    table = dynamodb.Table(PAYOUT_TABLE)
    table.update_item(
        Key={"runId": run_id},
        UpdateExpression="SET #s = :s, updatedAt = :t",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":s": status, ":t": datetime.now().isoformat()}
    )

def call_claude(payout_run, payout_lines):
    data = {"payout_run": payout_run, "payout_lines": payout_lines}
    prompt = f"""You are a financial risk analyst for First Line Logistics (FLL), a 3PL company in Saudi Arabia with 2000+ drivers.

Analyze this payout batch:
{json.dumps(data, default=decimal_default, ensure_ascii=False)}

Provide your analysis in Arabic and English:
1. Risk flags and anomalies
2. Suspicious patterns
3. Cost anomalies and outliers
4. Executive summary with recommendations
5. Total amounts verification"""

    response = bedrock.invoke_model(
        modelId="global.anthropic.claude-sonnet-4-6",
        contentType="application/json",
        accept="application/json",
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "messages": [{"role": "user", "content": prompt}]
        })
    )
    result = json.loads(response["body"].read())
    return result["content"][0]["text"]

def save_result(payout_run_id, analysis):
    table = dynamodb.Table(RESULTS_TABLE)
    table.put_item(Item={
        "payout_run_id": payout_run_id,
        "analysis": analysis,
        "status": "COMPLETED",
        "timestamp": datetime.now().isoformat()
    })
    s3.put_object(
        Bucket=REPORTS_BUCKET,
        Key=f"ai-reports/{payout_run_id}.json",
        Body=json.dumps({"payout_run_id": payout_run_id, "analysis": analysis, "timestamp": datetime.now().isoformat()}, ensure_ascii=False),
        ContentType="application/json"
    )

def process_review(run_id):
    try:
        update_run_status(run_id, "REVIEW_IN_PROGRESS")
        payout_run = get_payout_run(run_id)
        payout_lines = get_payout_lines(run_id)
        if not payout_lines:
            update_run_status(run_id, "REVIEW_NO_DATA")
            return {"status": "NO_DATA", "message": "No payout lines found"}
        analysis = call_claude(payout_run, payout_lines)
        save_result(run_id, analysis)
        update_run_status(run_id, "REVIEW_COMPLETED")
        print(f"Review completed for run: {run_id}")
        return {"status": "COMPLETED", "runId": run_id, "analysis": analysis}
    except Exception as e:
        print(f"Error processing run {run_id}: {str(e)}")
        update_run_status(run_id, "REVIEW_FAILED")
        raise

def handler(event, context):
    if "Records" in event:
        for record in event["Records"]:
            if record["eventName"] not in ("INSERT", "MODIFY"):
                continue
            new_image = record["dynamodb"].get("NewImage", {})
            run_id = new_image.get("runId", {}).get("S")
            status = new_image.get("status", {}).get("S")
            if not run_id or status != "READY_FOR_REVIEW":
                print(f"Skipping run {run_id} with status: {status}")
                continue
            print(f"Processing payout run: {run_id}")
            process_review(run_id)
    elif "runId" in event:
        run_id = event["runId"]
        print(f"Direct invocation for run: {run_id}")
        result = process_review(run_id)
        return {"statusCode": 200, "headers": {"Content-Type": "application/json"}, "body": json.dumps(result, default=decimal_default)}
    elif "body" in event:
        body = json.loads(event.get("body", "{}"))
        run_id = body.get("runId") or body.get("payout_run_id")
        if run_id:
            print(f"API invocation for run: {run_id}")
            result = process_review(run_id)
            return {"statusCode": 200, "headers": {"Content-Type": "application/json"}, "body": json.dumps(result, default=decimal_default)}
    return {"statusCode": 200, "body": "OK"}
