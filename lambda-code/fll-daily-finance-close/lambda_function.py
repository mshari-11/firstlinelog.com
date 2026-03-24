"""
FLL Daily Finance Close — يعمل يومياً الساعة 8:00 مساءً (AST)
يحسب الملخص المالي اليومي: إيرادات، مصروفات، صافي الربح
EventBridge Schedule: cron(0 17 * * ? *)  # 8 PM AST = 5 PM UTC
"""
import os
import json
import boto3
from datetime import datetime, timezone, timedelta
from decimal import Decimal

REGION = os.environ.get("AWS_REGION", "me-south-1")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

dynamodb = boto3.resource("dynamodb", region_name=REGION)


class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super().default(o)


def supabase_request(path, method="GET", body=None):
    """Helper to make Supabase REST API calls."""
    import urllib.request

    url = f"{SUPABASE_URL}/rest/v1/{path}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def lambda_handler(event, context):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")

    summary = {
        "date": today,
        "total_orders": 0,
        "completed_orders": 0,
        "total_revenue": 0.0,
        "total_driver_payouts": 0.0,
        "total_platform_commission": 0.0,
        "total_expenses": 0.0,
        "net_profit": 0.0,
        "active_drivers": 0,
        "new_complaints": 0,
    }

    try:
        # === Count today's orders from DynamoDB ===
        orders_table = dynamodb.Table("fll-orders")
        scan_result = orders_table.scan(
            FilterExpression="begins_with(createdAt, :today)",
            ExpressionAttributeValues={":today": today},
            Select="COUNT",
        )
        summary["total_orders"] = scan_result.get("Count", 0)

        # === Count completed orders ===
        completed = orders_table.scan(
            FilterExpression="begins_with(createdAt, :today) AND #s = :completed",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={":today": today, ":completed": "completed"},
            Select="COUNT",
        )
        summary["completed_orders"] = completed.get("Count", 0)

        # === Count today's complaints ===
        complaints_table = dynamodb.Table("fll-complaints")
        complaints = complaints_table.scan(
            FilterExpression="begins_with(createdAt, :today)",
            ExpressionAttributeValues={":today": today},
            Select="COUNT",
        )
        summary["new_complaints"] = complaints.get("Count", 0)

        # === Count active drivers ===
        drivers_table = dynamodb.Table("fll-drivers")
        drivers = drivers_table.scan(
            FilterExpression="#s = :active",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={":active": "active"},
            Select="COUNT",
        )
        summary["active_drivers"] = drivers.get("Count", 0)

        # === Calculate financials from payout runs ===
        payouts_table = dynamodb.Table("fll-payout-runs")
        payouts = payouts_table.scan(
            FilterExpression="begins_with(createdAt, :today)",
            ExpressionAttributeValues={":today": today},
        )
        for item in payouts.get("Items", []):
            summary["total_driver_payouts"] += float(item.get("totalAmount", 0))

        # === Net calculations ===
        summary["total_revenue"] = summary["completed_orders"] * 15.0  # avg order value
        summary["total_platform_commission"] = summary["total_revenue"] * 0.12
        summary["net_profit"] = (
            summary["total_platform_commission"]
            - summary["total_expenses"]
            - summary["total_driver_payouts"]
        )

        # === Save to Supabase metrics ===
        if SUPABASE_URL and SUPABASE_KEY:
            supabase_request("metrics", "POST", {
                "name": f"daily_close_{today}",
                "value": summary["net_profit"],
                "metadata": json.dumps(summary, cls=DecimalEncoder),
                "created_at": datetime.now(timezone.utc).isoformat(),
            })

    except Exception as e:
        summary["error"] = str(e)

    print(json.dumps(summary, cls=DecimalEncoder))
    return {"statusCode": 200, "body": json.dumps(summary, cls=DecimalEncoder)}
