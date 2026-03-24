"""
FLL Daily Backup — يعمل يومياً الساعة 2:00 صباحاً (AST)
ينسخ جداول DynamoDB و Supabase الحرجة إلى S3
EventBridge Schedule: cron(0 23 * * ? *)  # 2 AM AST = 11 PM UTC
"""
import os
import json
import boto3
from datetime import datetime, timezone

REGION = os.environ.get("AWS_REGION", "me-south-1")
BACKUP_BUCKET = os.environ.get("BACKUP_BUCKET", "fll-backups")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

dynamodb = boto3.client("dynamodb", region_name=REGION)
s3 = boto3.client("s3", region_name=REGION)

# الجداول الحرجة للنسخ الاحتياطي
CRITICAL_TABLES = [
    "fll-drivers",
    "fll-orders",
    "fll-payout-runs",
    "fll-payout-lines",
    "fll-complaints",
    "fll-vehicles",
    "fll-staff-users",
    "fll-accounting-rules",
    "fll-audit-log",
]

SUPABASE_TABLES = [
    "users",
    "couriers",
    "orders",
    "complaints",
    "payout_runs",
    "staff_users",
    "fll_vehicles",
]


def lambda_handler(event, context):
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d_%H-%M")
    results = {"dynamodb": [], "supabase": [], "errors": []}

    # === DynamoDB Backups ===
    for table_name in CRITICAL_TABLES:
        try:
            backup_name = f"{table_name}-{timestamp}"
            dynamodb.create_backup(
                TableName=table_name,
                BackupName=backup_name,
            )
            results["dynamodb"].append({"table": table_name, "status": "success", "backup": backup_name})
        except Exception as e:
            results["errors"].append({"table": table_name, "error": str(e)})

    # === Supabase Backups (export to S3) ===
    if SUPABASE_URL and SUPABASE_KEY:
        import urllib.request

        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
        }

        for table in SUPABASE_TABLES:
            try:
                url = f"{SUPABASE_URL}/rest/v1/{table}?select=*&limit=10000"
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=30) as resp:
                    data = resp.read().decode("utf-8")

                s3_key = f"supabase/{timestamp}/{table}.json"
                s3.put_object(
                    Bucket=BACKUP_BUCKET,
                    Key=s3_key,
                    Body=data,
                    ContentType="application/json",
                )
                results["supabase"].append({"table": table, "status": "success", "s3_key": s3_key})
            except Exception as e:
                results["errors"].append({"table": f"supabase.{table}", "error": str(e)})

    # === Log results ===
    summary = {
        "timestamp": timestamp,
        "dynamodb_backed_up": len(results["dynamodb"]),
        "supabase_backed_up": len(results["supabase"]),
        "errors": len(results["errors"]),
        "details": results,
    }

    # Save summary to S3
    try:
        s3.put_object(
            Bucket=BACKUP_BUCKET,
            Key=f"logs/{timestamp}/backup-summary.json",
            Body=json.dumps(summary, ensure_ascii=False, indent=2),
            ContentType="application/json",
        )
    except Exception:
        pass

    print(json.dumps(summary, ensure_ascii=False))
    return {"statusCode": 200, "body": json.dumps(summary, ensure_ascii=False)}
