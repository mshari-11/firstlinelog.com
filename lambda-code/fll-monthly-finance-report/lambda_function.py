"""
FLL Monthly Finance Report — يعمل أول يوم من كل شهر
يُنشئ تقرير مالي شهري شامل ويرسله بالإيميل
EventBridge Schedule: cron(0 3 1 * ? *)  # 1st of month, 6 AM AST = 3 AM UTC
"""
import os
import json
import boto3
from datetime import datetime, timezone, timedelta
from decimal import Decimal

REGION = os.environ.get("AWS_REGION", "me-south-1")
SES_FROM = os.environ.get("SES_FROM_EMAIL", "no-reply@fll.sa")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "m_shaikhi@yahoo.com")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

ses = boto3.client("ses", region_name=REGION)
dynamodb = boto3.resource("dynamodb", region_name=REGION)


class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super().default(o)


def lambda_handler(event, context):
    now = datetime.now(timezone.utc)
    # Previous month
    first_of_current = now.replace(day=1)
    last_of_previous = first_of_current - timedelta(days=1)
    month_str = last_of_previous.strftime("%Y-%m")
    month_name_ar = last_of_previous.strftime("%B %Y")

    report = {
        "month": month_str,
        "generated_at": now.isoformat(),
        "total_orders": 0,
        "completed_orders": 0,
        "cancelled_orders": 0,
        "completion_rate": 0.0,
        "total_revenue": 0.0,
        "total_payouts": 0.0,
        "total_commission": 0.0,
        "net_profit": 0.0,
        "active_drivers": 0,
        "new_drivers": 0,
        "total_complaints": 0,
        "resolved_complaints": 0,
        "avg_resolution_hours": 0.0,
        "top_platforms": [],
    }

    try:
        # === Orders Stats ===
        orders_table = dynamodb.Table("fll-orders")
        orders = orders_table.scan(
            FilterExpression="begins_with(createdAt, :month)",
            ExpressionAttributeValues={":month": month_str},
        )
        all_orders = orders.get("Items", [])
        report["total_orders"] = len(all_orders)
        report["completed_orders"] = sum(1 for o in all_orders if o.get("status") == "completed")
        report["cancelled_orders"] = sum(1 for o in all_orders if o.get("status") == "cancelled")
        if report["total_orders"] > 0:
            report["completion_rate"] = round(report["completed_orders"] / report["total_orders"] * 100, 1)

        # === Payout Stats ===
        payouts_table = dynamodb.Table("fll-payout-runs")
        payouts = payouts_table.scan(
            FilterExpression="begins_with(createdAt, :month)",
            ExpressionAttributeValues={":month": month_str},
        )
        for p in payouts.get("Items", []):
            report["total_payouts"] += float(p.get("totalAmount", 0))

        # === Revenue & Commission ===
        report["total_revenue"] = report["completed_orders"] * 15.0
        report["total_commission"] = report["total_revenue"] * 0.12
        report["net_profit"] = report["total_commission"] - report["total_payouts"]

        # === Complaints ===
        complaints_table = dynamodb.Table("fll-complaints")
        complaints = complaints_table.scan(
            FilterExpression="begins_with(createdAt, :month)",
            ExpressionAttributeValues={":month": month_str},
        )
        all_complaints = complaints.get("Items", [])
        report["total_complaints"] = len(all_complaints)
        report["resolved_complaints"] = sum(1 for c in all_complaints if c.get("status") == "resolved")

        # === Drivers ===
        drivers_table = dynamodb.Table("fll-drivers")
        drivers = drivers_table.scan()
        all_drivers = drivers.get("Items", [])
        report["active_drivers"] = sum(1 for d in all_drivers if d.get("status") == "active")
        report["new_drivers"] = sum(
            1 for d in all_drivers if d.get("createdAt", "").startswith(month_str)
        )

        # === Send Email Report ===
        html_body = f"""
        <div dir="rtl" style="font-family: 'IBM Plex Sans Arabic', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1e3a5f; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0;">التقرير المالي الشهري</h1>
                <p style="margin: 5px 0 0; opacity: 0.8;">{month_str}</p>
            </div>
            <div style="background: #f8f9fb; padding: 20px;">
                <h3>الطلبات</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">إجمالي الطلبات</td><td style="text-align: left; font-weight: bold;">{report['total_orders']}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">مكتملة</td><td style="text-align: left; font-weight: bold; color: #16a34a;">{report['completed_orders']}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">ملغية</td><td style="text-align: left; font-weight: bold; color: #dc2626;">{report['cancelled_orders']}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">نسبة الإنجاز</td><td style="text-align: left; font-weight: bold;">{report['completion_rate']}%</td></tr>
                </table>

                <h3 style="margin-top: 20px;">المالية (ريال)</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">الإيرادات</td><td style="text-align: left; font-weight: bold;">{report['total_revenue']:,.2f}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">العمولات</td><td style="text-align: left; font-weight: bold;">{report['total_commission']:,.2f}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">الدفعات للسائقين</td><td style="text-align: left; font-weight: bold;">{report['total_payouts']:,.2f}</td></tr>
                    <tr style="background: #e0f2fe;"><td style="padding: 8px; font-weight: bold;">صافي الربح</td><td style="text-align: left; font-weight: bold; color: {'#16a34a' if report['net_profit'] >= 0 else '#dc2626'};">{report['net_profit']:,.2f}</td></tr>
                </table>

                <h3 style="margin-top: 20px;">السائقين والشكاوى</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">سائقين نشطين</td><td style="text-align: left; font-weight: bold;">{report['active_drivers']}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">سائقين جدد</td><td style="text-align: left; font-weight: bold;">{report['new_drivers']}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">شكاوى</td><td style="text-align: left; font-weight: bold;">{report['total_complaints']}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">محلولة</td><td style="text-align: left; font-weight: bold; color: #16a34a;">{report['resolved_complaints']}</td></tr>
                </table>
            </div>
            <div style="background: #1e293b; color: #94a3b8; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px;">
                <p>© {now.year} First Line Logistics — تقرير آلي</p>
            </div>
        </div>
        """

        ses.send_email(
            Source=SES_FROM,
            Destination={"ToAddresses": [ADMIN_EMAIL]},
            Message={
                "Subject": {"Data": f"التقرير المالي الشهري — {month_str}", "Charset": "UTF-8"},
                "Body": {"Html": {"Data": html_body, "Charset": "UTF-8"}},
            },
        )
        report["email_sent"] = True

    except Exception as e:
        report["error"] = str(e)

    print(json.dumps(report, cls=DecimalEncoder))
    return {"statusCode": 200, "body": json.dumps(report, cls=DecimalEncoder)}
