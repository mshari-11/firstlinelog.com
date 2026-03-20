"""
FLL Data Sync — Comprehensive Supabase ↔ AWS Synchronization
Triggered by: AWS EventBridge (scheduled rule)
Region: me-south-1 (Bahrain)

Sync Tasks:
  1. cognito_to_supabase   — Sync Cognito user states → Supabase
  2. supabase_to_cognito   — Sync Supabase role changes → Cognito groups
  3. s3_kyc_verification   — Verify S3 docs exist, update Supabase statuses
  4. financial_pipeline     — Process staging → orders_fact → driver_day_fact
  5. wallet_reconciliation  — Verify wallet balances match ledger
  6. location_cleanup       — Archive old driver_locations (>48h)
  7. application_expiry     — Expire stale pending applications (>30 days)
  8. payout_status_sync     — Update payout statuses from bank responses
  9. chat_analytics_sync    — Sync DynamoDB chat stats → Supabase
 10. daily_summary_email    — Send sync report to admins
"""

import json
import os
import traceback
from datetime import datetime, timedelta, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

import boto3

# ─── Configuration ───────────────────────────────────────────────────────────

REGION = os.environ.get("AWS_REGION_NAME", "me-south-1")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
COGNITO_POOL_ID = os.environ.get("USER_POOL_ID", "me-south-1_aJtmQ0QrN")
KYC_BUCKET = os.environ.get("KYC_BUCKET", "fll-kyc-documents-230811072086")
CHAT_TABLE = os.environ.get("CHAT_TABLE", "fll-chat-history")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "FLL Platform <no-reply@fll.sa>")
ADMIN_EMAILS = [
    e.strip()
    for e in os.environ.get("ADMIN_EMAILS", "M.Z@FLL.SA,A.ALZAMIL@FLL.SA").split(",")
    if e.strip()
]

# Sync settings
LOCATION_RETENTION_HOURS = int(os.environ.get("LOCATION_RETENTION_HOURS", "48"))
APPLICATION_EXPIRY_DAYS = int(os.environ.get("APPLICATION_EXPIRY_DAYS", "30"))
BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "100"))

# AWS clients
cognito = boto3.client("cognito-idp", region_name=REGION)
s3 = boto3.client("s3", region_name=REGION)
ses = boto3.client("ses", region_name=REGION)
dynamodb = boto3.resource("dynamodb", region_name=REGION)


def now_utc():
    return datetime.now(timezone.utc)


# ─── Supabase Helpers ────────────────────────────────────────────────────────


def supabase_request(method, path, body=None, params=None):
    """Make authenticated request to Supabase REST API."""
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    if params:
        url += "?" + "&".join(f"{k}={quote(str(v))}" for k, v in params.items())

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

    data = json.dumps(body, ensure_ascii=False).encode() if body else None
    req = Request(url, data=data, headers=headers, method=method)

    try:
        with urlopen(req, timeout=30) as resp:
            raw = resp.read().decode()
            return json.loads(raw) if raw else []
    except HTTPError as e:
        error_body = e.read().decode() if e.fp else str(e)
        raise Exception(f"Supabase {method} {path}: {e.code} — {error_body}")


def supabase_rpc(func_name, params=None):
    """Call a Supabase RPC function."""
    url = f"{SUPABASE_URL}/rest/v1/rpc/{func_name}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    data = json.dumps(params or {}, ensure_ascii=False).encode()
    req = Request(url, data=data, headers=headers, method="POST")

    try:
        with urlopen(req, timeout=30) as resp:
            raw = resp.read().decode()
            return json.loads(raw) if raw else None
    except HTTPError as e:
        error_body = e.read().decode() if e.fp else str(e)
        raise Exception(f"Supabase RPC {func_name}: {e.code} — {error_body}")


# ─── Task 1: Cognito → Supabase User State Sync ─────────────────────────────


def sync_cognito_to_supabase():
    """Sync Cognito user statuses (enabled/disabled/verified) to Supabase."""
    stats = {"synced": 0, "disabled": 0, "errors": 0}
    pagination_token = None

    while True:
        kwargs = {
            "UserPoolId": COGNITO_POOL_ID,
            "Limit": 60,
        }
        if pagination_token:
            kwargs["PaginationToken"] = pagination_token

        resp = cognito.list_users(**kwargs)

        for user in resp.get("Users", []):
            try:
                email = None
                phone = None
                email_verified = False
                for attr in user.get("Attributes", []):
                    if attr["Name"] == "email":
                        email = attr["Value"]
                    elif attr["Name"] == "phone_number":
                        phone = attr["Value"]
                    elif attr["Name"] == "email_verified":
                        email_verified = attr["Value"] == "true"

                if not email:
                    continue

                cognito_status = user.get("UserStatus", "UNKNOWN")
                is_enabled = user.get("Enabled", True)

                # Update Supabase user record
                supabase_request(
                    "PATCH",
                    "users",
                    body={
                        "cognito_status": cognito_status,
                        "cognito_enabled": is_enabled,
                        "email_verified": email_verified,
                        "last_cognito_sync": now_utc().isoformat(),
                    },
                    params={"email": f"eq.{email}"},
                )

                stats["synced"] += 1
                if not is_enabled:
                    stats["disabled"] += 1

            except Exception as e:
                stats["errors"] += 1
                print(f"[cognito_to_supabase] Error for {email}: {e}")

        pagination_token = resp.get("PaginationToken")
        if not pagination_token:
            break

    return stats


# ─── Task 2: Supabase → Cognito Group Sync ──────────────────────────────────


def sync_supabase_to_cognito():
    """Sync staff role changes from Supabase to Cognito groups."""
    stats = {"synced": 0, "added": 0, "removed": 0, "errors": 0}

    # Get all staff profiles with their roles
    staff = supabase_request(
        "GET",
        "staff_profiles",
        params={"select": "id,email,role,is_active"},
    )

    valid_groups = {
        "admin", "owner", "staff", "finance", "hr", "ops", "fleet", "driver", "executive"
    }

    for member in staff:
        email = member.get("email")
        role = member.get("role", "staff")
        is_active = member.get("is_active", True)

        if not email or role not in valid_groups:
            continue

        try:
            # Get current Cognito groups for user
            try:
                groups_resp = cognito.admin_list_groups_for_user(
                    Username=email,
                    UserPoolId=COGNITO_POOL_ID,
                )
                current_groups = {g["GroupName"] for g in groups_resp.get("Groups", [])}
            except cognito.exceptions.UserNotFoundException:
                continue

            desired_groups = {role} if is_active else set()

            # Add missing groups
            for group in desired_groups - current_groups:
                if group in valid_groups:
                    cognito.admin_add_user_to_group(
                        UserPoolId=COGNITO_POOL_ID,
                        Username=email,
                        GroupName=group,
                    )
                    stats["added"] += 1

            # Remove stale groups
            for group in (current_groups & valid_groups) - desired_groups:
                cognito.admin_remove_user_from_group(
                    UserPoolId=COGNITO_POOL_ID,
                    Username=email,
                    GroupName=group,
                )
                stats["removed"] += 1

            # Disable user in Cognito if deactivated in Supabase
            if not is_active:
                cognito.admin_disable_user(
                    UserPoolId=COGNITO_POOL_ID,
                    Username=email,
                )

            stats["synced"] += 1

        except Exception as e:
            stats["errors"] += 1
            print(f"[supabase_to_cognito] Error for {email}: {e}")

    return stats


# ─── Task 3: S3 KYC Document Verification ───────────────────────────────────


def verify_s3_kyc_documents():
    """Verify KYC documents in S3 exist and update Supabase statuses."""
    stats = {"verified": 0, "missing": 0, "errors": 0}

    # Get applications with document references
    apps = supabase_request(
        "GET",
        "driver_applications",
        params={
            "select": "id,documents,status",
            "status": "in.(pending,under_review)",
            "limit": str(BATCH_SIZE),
        },
    )

    for app in apps:
        app_id = app.get("id")
        documents = app.get("documents", {})

        if not documents or not isinstance(documents, dict):
            continue

        all_exist = True
        doc_status = {}

        for doc_type, doc_info in documents.items():
            s3_key = None
            if isinstance(doc_info, str):
                s3_key = doc_info
            elif isinstance(doc_info, dict):
                s3_key = doc_info.get("s3_key") or doc_info.get("path")

            if not s3_key:
                continue

            try:
                s3.head_object(Bucket=KYC_BUCKET, Key=s3_key)
                doc_status[doc_type] = "verified"
                stats["verified"] += 1
            except s3.exceptions.ClientError as e:
                if e.response["Error"]["Code"] == "404":
                    doc_status[doc_type] = "missing"
                    all_exist = False
                    stats["missing"] += 1
                    print(f"[s3_kyc] Missing doc: {s3_key} for app {app_id}")
                else:
                    stats["errors"] += 1

        # Update application with verification results
        try:
            supabase_request(
                "PATCH",
                "driver_applications",
                body={
                    "documents_verified": all_exist,
                    "documents_status": doc_status,
                    "last_doc_check": now_utc().isoformat(),
                },
                params={"id": f"eq.{app_id}"},
            )
        except Exception as e:
            stats["errors"] += 1
            print(f"[s3_kyc] Error updating app {app_id}: {e}")

    return stats


# ─── Task 4: Financial Pipeline Processing ──────────────────────────────────


def process_financial_pipeline():
    """Process staged platform reports through the financial pipeline.

    Flow: staging.platform_reports_staging → finance.platform_orders_fact
          → finance.platform_driver_day_fact → wallet updates
    """
    stats = {"staged_processed": 0, "orders_created": 0, "days_aggregated": 0, "errors": 0}

    # Step 1: Get unprocessed staged records
    staged = supabase_request(
        "GET",
        "platform_reports_staging",
        params={
            "select": "*",
            "processed": "eq.false",
            "validation_status": "eq.valid",
            "limit": str(BATCH_SIZE),
            "order": "created_at.asc",
        },
    )

    if not staged:
        return stats

    for record in staged:
        try:
            record_id = record.get("id")
            data = record.get("normalized_data", {})

            if not data:
                continue

            # Step 2: Get effective rate card for this record
            platform_id = data.get("platform_id")
            driver_id = data.get("driver_id")
            city_id = data.get("city_id")
            report_date = data.get("report_date")

            if not all([platform_id, driver_id, report_date]):
                continue

            # Fetch rate card via RPC
            rate_card = supabase_rpc("get_effective_rate_card", {
                "p_platform_id": platform_id,
                "p_city_id": city_id,
                "p_date": report_date,
            })

            # Step 3: Calculate order financials
            gross_amount = float(data.get("gross_amount", 0))
            order_count = int(data.get("order_count", 0))

            commission_rate = 0
            vat_rate = 0.15  # Saudi VAT 15%

            if rate_card:
                if isinstance(rate_card, list) and rate_card:
                    rate_card = rate_card[0]
                commission_rate = float(rate_card.get("commission_rate", 0))

            commission = gross_amount * commission_rate
            vat = commission * vat_rate
            bonus = float(data.get("bonus_amount", 0))
            penalty = float(data.get("penalty_amount", 0))
            vehicle_cost = float(data.get("vehicle_cost", 0))
            net_amount = gross_amount - commission - vat + bonus - penalty - vehicle_cost

            # Step 4: Upsert into platform_orders_fact
            order_fact = {
                "platform_id": platform_id,
                "driver_id": driver_id,
                "city_id": city_id,
                "report_date": report_date,
                "order_count": order_count,
                "gross_amount": gross_amount,
                "commission_amount": commission,
                "vat_amount": vat,
                "bonus_amount": bonus,
                "penalty_amount": penalty,
                "vehicle_cost": vehicle_cost,
                "net_amount": net_amount,
                "staging_record_id": record_id,
                "processed_at": now_utc().isoformat(),
            }

            supabase_request(
                "POST",
                "platform_orders_fact",
                body=order_fact,
                params={"on_conflict": "staging_record_id"},
            )
            stats["orders_created"] += 1

            # Step 5: Mark staging record as processed
            supabase_request(
                "PATCH",
                "platform_reports_staging",
                body={"processed": True, "processed_at": now_utc().isoformat()},
                params={"id": f"eq.{record_id}"},
            )
            stats["staged_processed"] += 1

        except Exception as e:
            stats["errors"] += 1
            print(f"[financial_pipeline] Error processing record {record.get('id')}: {e}")

    # Step 6: Aggregate into driver_day_fact
    try:
        result = supabase_rpc("aggregate_driver_day_facts", {
            "p_batch_size": BATCH_SIZE,
        })
        if result and isinstance(result, (int, float)):
            stats["days_aggregated"] = int(result)
    except Exception as e:
        # RPC may not exist yet — log but don't fail
        print(f"[financial_pipeline] aggregate_driver_day_facts RPC: {e}")

    return stats


# ─── Task 5: Wallet Reconciliation ──────────────────────────────────────────


def reconcile_wallets():
    """Verify wallet balances match ledger entry totals."""
    stats = {"checked": 0, "mismatches": 0, "errors": 0}

    # Get all active wallets
    wallets = supabase_request(
        "GET",
        "driver_wallets",
        params={
            "select": "id,driver_id,current_balance",
            "limit": str(BATCH_SIZE),
        },
    )

    for wallet in wallets:
        try:
            driver_id = wallet.get("driver_id")
            recorded_balance = float(wallet.get("current_balance", 0))

            # Calculate balance from ledger entries
            ledger_result = supabase_rpc("calculate_wallet_balance", {
                "p_driver_id": driver_id,
            })

            if ledger_result is not None:
                if isinstance(ledger_result, list) and ledger_result:
                    calculated = float(ledger_result[0].get("balance", 0))
                elif isinstance(ledger_result, (int, float)):
                    calculated = float(ledger_result)
                else:
                    stats["checked"] += 1
                    continue

                diff = abs(recorded_balance - calculated)
                if diff > 0.01:  # Allow 1 halalah tolerance
                    stats["mismatches"] += 1
                    print(
                        f"[wallet_recon] Mismatch driver={driver_id}: "
                        f"wallet={recorded_balance}, ledger={calculated}, diff={diff}"
                    )

                    # Log mismatch for manual review
                    supabase_request(
                        "POST",
                        "reconciliation_items",
                        body={
                            "entity_type": "wallet",
                            "entity_id": str(driver_id),
                            "expected_amount": calculated,
                            "actual_amount": recorded_balance,
                            "difference": diff,
                            "status": "pending_review",
                            "notes": f"Auto-detected by sync at {now_utc().isoformat()}",
                        },
                    )

            stats["checked"] += 1

        except Exception as e:
            stats["errors"] += 1
            print(f"[wallet_recon] Error for driver {wallet.get('driver_id')}: {e}")

    return stats


# ─── Task 6: Location Data Cleanup ──────────────────────────────────────────


def cleanup_old_locations():
    """Delete driver location records older than retention period."""
    stats = {"deleted": 0, "errors": 0}

    cutoff = (now_utc() - timedelta(hours=LOCATION_RETENTION_HOURS)).isoformat()

    try:
        # Delete old location records
        result = supabase_request(
            "DELETE",
            "driver_locations",
            params={
                "updated_at": f"lt.{cutoff}",
                "is_online": "eq.false",
            },
        )
        stats["deleted"] = len(result) if isinstance(result, list) else 0
    except Exception as e:
        stats["errors"] += 1
        print(f"[location_cleanup] Error: {e}")

    return stats


# ─── Task 7: Application Expiry ─────────────────────────────────────────────


def expire_stale_applications():
    """Mark applications as expired if pending for too long."""
    stats = {"expired": 0, "errors": 0}

    cutoff = (now_utc() - timedelta(days=APPLICATION_EXPIRY_DAYS)).isoformat()

    try:
        result = supabase_request(
            "PATCH",
            "driver_applications",
            body={
                "status": "expired",
                "status_note": f"Auto-expired after {APPLICATION_EXPIRY_DAYS} days of inactivity",
                "updated_at": now_utc().isoformat(),
            },
            params={
                "status": "eq.pending",
                "created_at": f"lt.{cutoff}",
            },
        )
        stats["expired"] = len(result) if isinstance(result, list) else 0
    except Exception as e:
        stats["errors"] += 1
        print(f"[application_expiry] Error: {e}")

    return stats


# ─── Task 8: Payout Status Sync ─────────────────────────────────────────────


def sync_payout_statuses():
    """Update payout batch statuses and check for completed transfers."""
    stats = {"updated": 0, "completed": 0, "errors": 0}

    # Get processing payout batches
    batches = supabase_request(
        "GET",
        "payout_batches",
        params={
            "select": "id,status,batch_reference,total_amount,created_at",
            "status": "eq.processing",
            "limit": str(BATCH_SIZE),
        },
    )

    for batch in batches:
        try:
            batch_id = batch.get("id")

            # Check individual payout items
            items = supabase_request(
                "GET",
                "driver_payouts",
                params={
                    "select": "id,status",
                    "batch_id": f"eq.{batch_id}",
                },
            )

            if not items:
                continue

            all_completed = all(
                item.get("status") in ("completed", "paid") for item in items
            )
            any_failed = any(item.get("status") == "failed" for item in items)

            new_status = None
            if all_completed:
                new_status = "completed"
                stats["completed"] += 1
            elif any_failed:
                new_status = "partially_failed"

            if new_status:
                supabase_request(
                    "PATCH",
                    "payout_batches",
                    body={
                        "status": new_status,
                        "completed_at": now_utc().isoformat(),
                    },
                    params={"id": f"eq.{batch_id}"},
                )
                stats["updated"] += 1

        except Exception as e:
            stats["errors"] += 1
            print(f"[payout_sync] Error for batch {batch.get('id')}: {e}")

    return stats


# ─── Task 9: Chat Analytics Sync ────────────────────────────────────────────


def sync_chat_analytics():
    """Sync DynamoDB chat statistics to Supabase for admin dashboards."""
    stats = {"conversations": 0, "messages": 0, "errors": 0}

    try:
        table = dynamodb.Table(CHAT_TABLE)

        # Scan for conversations from last 24 hours
        cutoff_ts = int((now_utc() - timedelta(hours=24)).timestamp())

        response = table.scan(
            FilterExpression="last_updated > :cutoff",
            ExpressionAttributeValues={":cutoff": cutoff_ts},
            ProjectionExpression="conversation_id, message_count, last_updated, user_type",
            Limit=BATCH_SIZE,
        )

        items = response.get("Items", [])
        stats["conversations"] = len(items)

        # Aggregate by user_type
        summary = {}
        for item in items:
            user_type = item.get("user_type", "unknown")
            msg_count = int(item.get("message_count", 0))
            summary.setdefault(user_type, {"conversations": 0, "messages": 0})
            summary[user_type]["conversations"] += 1
            summary[user_type]["messages"] += msg_count
            stats["messages"] += msg_count

        # Store daily summary in Supabase (for admin dashboard)
        today = now_utc().strftime("%Y-%m-%d")
        for user_type, data in summary.items():
            try:
                supabase_request(
                    "POST",
                    "chat_analytics_daily",
                    body={
                        "report_date": today,
                        "user_type": user_type,
                        "conversation_count": data["conversations"],
                        "message_count": data["messages"],
                        "synced_at": now_utc().isoformat(),
                    },
                    params={"on_conflict": "report_date,user_type"},
                )
            except Exception as e:
                # Table may not exist yet
                print(f"[chat_analytics] Could not store summary: {e}")
                stats["errors"] += 1

    except Exception as e:
        stats["errors"] += 1
        print(f"[chat_analytics] Error: {e}")

    return stats


# ─── Task 10: Daily Summary Email ────────────────────────────────────────────


def send_summary_email(results):
    """Send sync summary report to admin emails."""
    timestamp = now_utc().strftime("%Y-%m-%d %H:%M UTC")

    total_errors = sum(r.get("errors", 0) for r in results.values())
    status_emoji = "✅" if total_errors == 0 else "⚠️"

    rows_html = ""
    for task_name, task_stats in results.items():
        error_count = task_stats.get("errors", 0)
        row_style = 'style="background:#fff3f3"' if error_count > 0 else ""
        stats_str = " | ".join(f"{k}: {v}" for k, v in task_stats.items())
        rows_html += f"""
        <tr {row_style}>
          <td style="padding:8px;border:1px solid #ddd;font-weight:bold">{task_name}</td>
          <td style="padding:8px;border:1px solid #ddd;direction:ltr">{stats_str}</td>
        </tr>"""

    html_body = f"""
    <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#1a365d">{status_emoji} تقرير مزامنة البيانات</h2>
      <p style="color:#666">التاريخ: {timestamp}</p>

      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <tr style="background:#1a365d;color:white">
          <th style="padding:10px;border:1px solid #ddd;text-align:right">المهمة</th>
          <th style="padding:10px;border:1px solid #ddd;text-align:right">النتائج</th>
        </tr>
        {rows_html}
      </table>

      <p style="color:#666;font-size:12px">
        إجمالي الأخطاء: {total_errors}<br>
        تم إنشاء هذا التقرير تلقائياً بواسطة fll-data-sync
      </p>
    </div>
    """

    try:
        for email in ADMIN_EMAILS:
            ses.send_email(
                Source=FROM_EMAIL,
                Destination={"ToAddresses": [email]},
                Message={
                    "Subject": {
                        "Data": f"{status_emoji} FLL Data Sync Report — {timestamp}",
                        "Charset": "UTF-8",
                    },
                    "Body": {
                        "Html": {"Data": html_body, "Charset": "UTF-8"},
                    },
                },
            )
        return {"sent": len(ADMIN_EMAILS), "errors": 0}
    except Exception as e:
        print(f"[summary_email] Error: {e}")
        return {"sent": 0, "errors": 1}


# ─── Main Handler ────────────────────────────────────────────────────────────

# Task registry — order matters (dependencies first)
SYNC_TASKS = [
    ("cognito_to_supabase", sync_cognito_to_supabase),
    ("supabase_to_cognito", sync_supabase_to_cognito),
    ("s3_kyc_verification", verify_s3_kyc_documents),
    ("financial_pipeline", process_financial_pipeline),
    ("wallet_reconciliation", reconcile_wallets),
    ("location_cleanup", cleanup_old_locations),
    ("application_expiry", expire_stale_applications),
    ("payout_status_sync", sync_payout_statuses),
    ("chat_analytics_sync", sync_chat_analytics),
]


def lambda_handler(event, context):
    """
    EventBridge handler. Supports:
      - Full sync (default): runs all tasks
      - Selective sync: {"tasks": ["cognito_to_supabase", "financial_pipeline"]}
      - Single task: {"task": "wallet_reconciliation"}
    """
    print(f"[fll-data-sync] Started at {now_utc().isoformat()}")
    print(f"[fll-data-sync] Event: {json.dumps(event, default=str)}")

    # Determine which tasks to run
    requested_tasks = None
    if "task" in event:
        requested_tasks = [event["task"]]
    elif "tasks" in event:
        requested_tasks = event["tasks"]

    results = {}
    task_names = {name for name, _ in SYNC_TASKS}

    for task_name, task_func in SYNC_TASKS:
        if requested_tasks and task_name not in requested_tasks:
            continue

        if requested_tasks and task_name not in task_names:
            results[task_name] = {"errors": 1, "message": "Unknown task"}
            continue

        print(f"\n[fll-data-sync] ─── Running: {task_name} ───")
        start = now_utc()

        try:
            task_result = task_func()
            duration = (now_utc() - start).total_seconds()
            task_result["duration_s"] = round(duration, 2)
            results[task_name] = task_result
            print(f"[fll-data-sync] ✓ {task_name}: {task_result}")

        except Exception as e:
            duration = (now_utc() - start).total_seconds()
            results[task_name] = {
                "errors": 1,
                "message": str(e),
                "duration_s": round(duration, 2),
            }
            print(f"[fll-data-sync] ✗ {task_name}: {e}")
            traceback.print_exc()

    # Send summary email
    email_result = send_summary_email(results)
    results["summary_email"] = email_result

    total_errors = sum(r.get("errors", 0) for r in results.values())

    response = {
        "status": "completed_with_errors" if total_errors > 0 else "success",
        "timestamp": now_utc().isoformat(),
        "total_errors": total_errors,
        "results": results,
    }

    print(f"\n[fll-data-sync] Completed: {json.dumps(response, default=str)}")
    return response
