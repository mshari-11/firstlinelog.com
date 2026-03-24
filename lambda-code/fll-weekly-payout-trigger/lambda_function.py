"""
FLL Weekly Payout Trigger — يعمل كل أحد الساعة 6:00 صباحاً (AST)
يُنشئ دفعة أسبوعية جديدة لكل السائقين النشطين
EventBridge Schedule: cron(0 3 ? * SUN *)  # Sunday 6 AM AST = 3 AM UTC
"""
import os
import json
import boto3
import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal

REGION = os.environ.get("AWS_REGION", "me-south-1")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
SES_FROM = os.environ.get("SES_FROM_EMAIL", "no-reply@fll.sa")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "m_shaikhi@yahoo.com")

dynamodb = boto3.resource("dynamodb", region_name=REGION)
ses = boto3.client("ses", region_name=REGION)


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
    now = datetime.now(timezone.utc)
    week_end = now.strftime("%Y-%m-%d")
    week_start = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    run_id = f"payout-{week_end}-{uuid.uuid4().hex[:8]}"

    result = {
        "run_id": run_id,
        "week_start": week_start,
        "week_end": week_end,
        "drivers_processed": 0,
        "total_amount": 0.0,
        "payout_lines": 0,
        "status": "pending_review",
    }

    try:
        # === Get active drivers ===
        drivers_table = dynamodb.Table("fll-drivers")
        drivers_scan = drivers_table.scan(
            FilterExpression="#s = :active",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={":active": "active"},
        )
        active_drivers = drivers_scan.get("Items", [])

        # === Get this week's completed orders per driver ===
        orders_table = dynamodb.Table("fll-orders")
        payout_lines = []
        total_amount = Decimal("0")

        for driver in active_drivers:
            driver_id = driver.get("id")
            if not driver_id:
                continue

            # Scan orders for this driver this week
            orders = orders_table.scan(
                FilterExpression="driverId = :did AND #s = :completed AND createdAt BETWEEN :start AND :end",
                ExpressionAttributeNames={"#s": "status"},
                ExpressionAttributeValues={
                    ":did": driver_id,
                    ":completed": "completed",
                    ":start": week_start,
                    ":end": week_end + "T23:59:59Z",
                },
            )

            driver_orders = orders.get("Items", [])
            order_count = len(driver_orders)

            if order_count == 0:
                continue

            # Calculate payout (base per order + bonuses)
            base_per_order = Decimal("12.0")  # SAR per delivery
            bonus = Decimal("0")
            if order_count >= 50:
                bonus = Decimal("200")  # Weekly bonus for 50+ orders
            elif order_count >= 30:
                bonus = Decimal("100")

            driver_total = (base_per_order * order_count) + bonus
            total_amount += driver_total

            line = {
                "id": f"line-{driver_id}-{uuid.uuid4().hex[:6]}",
                "runId": run_id,
                "driverId": driver_id,
                "driverName": driver.get("name", ""),
                "orderCount": order_count,
                "baseAmount": float(base_per_order * order_count),
                "bonus": float(bonus),
                "totalAmount": float(driver_total),
                "status": "pending",
                "createdAt": now.isoformat(),
            }
            payout_lines.append(line)

        # === Save payout run to DynamoDB ===
        payouts_table = dynamodb.Table("fll-payout-runs")
        payouts_table.put_item(Item={
            "id": run_id,
            "weekStart": week_start,
            "weekEnd": week_end,
            "totalAmount": total_amount,
            "driverCount": len(payout_lines),
            "lineCount": len(payout_lines),
            "status": "pending_review",
            "createdAt": now.isoformat(),
            "updatedAt": now.isoformat(),
        })

        # === Save payout lines ===
        lines_table = dynamodb.Table("fll-payout-lines")
        for line in payout_lines:
            lines_table.put_item(Item=line)

        # === Also save to Supabase ===
        if SUPABASE_URL and SUPABASE_KEY:
            try:
                supabase_request("payout_runs", "POST", {
                    "id": run_id,
                    "week_start": week_start,
                    "week_end": week_end,
                    "total_amount": float(total_amount),
                    "driver_count": len(payout_lines),
                    "status": "pending_review",
                })
            except Exception:
                pass

        result["drivers_processed"] = len(payout_lines)
        result["total_amount"] = float(total_amount)
        result["payout_lines"] = len(payout_lines)

        # === Send notification email ===
        try:
            ses.send_email(
                Source=SES_FROM,
                Destination={"ToAddresses": [ADMIN_EMAIL]},
                Message={
                    "Subject": {
                        "Data": f"دفعة أسبوعية جديدة — {week_start} إلى {week_end}",
                        "Charset": "UTF-8",
                    },
                    "Body": {
                        "Html": {
                            "Data": f"""
                            <div dir="rtl" style="font-family: Arial, sans-serif;">
                                <h2>دفعة أسبوعية جديدة</h2>
                                <p><strong>الفترة:</strong> {week_start} — {week_end}</p>
                                <p><strong>عدد السائقين:</strong> {len(payout_lines)}</p>
                                <p><strong>المبلغ الإجمالي:</strong> {float(total_amount):,.2f} ريال</p>
                                <p><strong>الحالة:</strong> بانتظار المراجعة</p>
                                <p><a href="https://fll.sa/admin-panel/payouts">مراجعة الدفعة</a></p>
                            </div>
                            """,
                            "Charset": "UTF-8",
                        }
                    },
                },
            )
            result["email_sent"] = True
        except Exception:
            result["email_sent"] = False

    except Exception as e:
        result["error"] = str(e)
        result["status"] = "failed"

    print(json.dumps(result, cls=DecimalEncoder))
    return {"statusCode": 200, "body": json.dumps(result, cls=DecimalEncoder)}
