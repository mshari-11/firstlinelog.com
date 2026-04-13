"""
fll-platform-sync-unified
─────────────────────────
Unified Lambda for syncing orders from all 6 delivery platforms into the
canonical `platform_orders_unified` table in Supabase.

Triggers:
  - EventBridge cron (every 5 minutes per platform, staggered)
  - API Gateway POST /sync/{platform}  (manual + webhook ingress)
  - SQS DLQ replay

Event shape:
  {
    "platform": "hungerstation" | "keeta" | "ninja" | "mrsool" | "toyou" | "careem",
    "mode": "incremental" | "backfill",
    "since": "2026-04-12T00:00:00Z",        // optional override
    "trigger_source": "cron" | "webhook" | "manual"
  }

Environment:
  SUPABASE_URL                  Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY     Service role key (server-side only)
  HUNGERSTATION_API_KEY         Per-platform credentials
  KEETA_API_KEY
  NINJA_API_KEY
  MRSOOL_API_KEY
  TOYOU_API_KEY
  CAREEM_API_KEY
"""

import json
import os
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from typing import Any

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

PLATFORM_CONFIG: dict[str, dict[str, Any]] = {
    "hungerstation": {
        "base_url": "https://api.hungerstation.com/v2",
        "orders_path": "/partner/orders",
        "auth_header": "X-API-Key",
        "env_key": "HUNGERSTATION_API_KEY",
    },
    "keeta": {
        "base_url": "https://partners.keeta.com/api/v1",
        "orders_path": "/orders",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer ",
        "env_key": "KEETA_API_KEY",
    },
    "ninja": {
        "base_url": "https://api.ninja.sa/v1",
        "orders_path": "/merchant/orders",
        "auth_header": "X-Token",
        "env_key": "NINJA_API_KEY",
    },
    "mrsool": {
        "base_url": "https://api.mrsool.co/business/v1",
        "orders_path": "/orders",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer ",
        "env_key": "MRSOOL_API_KEY",
    },
    "toyou": {
        "base_url": "https://api.toyou.sa/partners/v1",
        "orders_path": "/orders",
        "auth_header": "X-Api-Key",
        "env_key": "TOYOU_API_KEY",
    },
    "careem": {
        "base_url": "https://api.careem.com/now/v1",
        "orders_path": "/merchant/orders",
        "auth_header": "Authorization",
        "auth_prefix": "Bearer ",
        "env_key": "CAREEM_API_KEY",
    },
}


# ─── Supabase REST helpers ──────────────────────────────────────────────────

def _sb_request(method: str, path: str, body: Any | None = None) -> Any:
    url = f"{SUPABASE_URL}/rest/v1{path}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "resolution=merge-duplicates,return=minimal")
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = resp.read()
        return json.loads(raw) if raw else None


def start_sync_run(platform: str, run_type: str, trigger_source: str) -> str:
    res = _sb_request(
        "POST",
        "/platform_sync_runs?select=id",
        {"platform": platform, "run_type": run_type, "trigger_source": trigger_source},
    )
    # When Prefer=return=minimal we don't get the row back — fetch it instead
    rows = _sb_request(
        "GET",
        f"/platform_sync_runs?platform=eq.{platform}&order=started_at.desc&limit=1",
    )
    return rows[0]["id"] if rows else ""


def finish_sync_run(run_id: str, fetched: int, upserted: int, failed: int, status: str, err: str | None = None) -> None:
    if not run_id:
        return
    _sb_request(
        "PATCH",
        f"/platform_sync_runs?id=eq.{run_id}",
        {
            "finished_at": datetime.now(timezone.utc).isoformat(),
            "records_fetched": fetched,
            "records_upserted": upserted,
            "records_failed": failed,
            "status": status,
            "error_message": err,
        },
    )


def upsert_orders(rows: list[dict]) -> int:
    if not rows:
        return 0
    _sb_request("POST", "/platform_orders_unified?on_conflict=platform,external_order_id", rows)
    return len(rows)


# ─── Platform fetcher ───────────────────────────────────────────────────────

def fetch_platform_orders(platform: str, since: datetime) -> list[dict]:
    cfg = PLATFORM_CONFIG[platform]
    api_key = os.environ.get(cfg["env_key"])
    if not api_key:
        raise RuntimeError(f"Missing credential env: {cfg['env_key']}")

    url = f"{cfg['base_url']}{cfg['orders_path']}?since={since.isoformat()}"
    req = urllib.request.Request(url, method="GET")
    auth_value = f"{cfg.get('auth_prefix', '')}{api_key}"
    req.add_header(cfg["auth_header"], auth_value)
    req.add_header("Accept", "application/json")

    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            payload = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"{platform} API HTTP {e.code}: {e.reason}") from e

    raw_orders = payload.get("data") or payload.get("orders") or []
    return [normalize_order(platform, raw) for raw in raw_orders]


def normalize_order(platform: str, raw: dict) -> dict:
    """Map platform-specific payload to canonical schema. Override per platform as needed."""
    return {
        "platform": platform,
        "external_order_id": str(raw.get("id") or raw.get("order_id") or raw.get("reference") or ""),
        "external_courier_id": str(raw.get("courier_id") or raw.get("driver_id") or "") or None,
        "customer_name": raw.get("customer_name") or raw.get("customer", {}).get("name"),
        "customer_phone": raw.get("customer_phone") or raw.get("customer", {}).get("phone"),
        "pickup_address": raw.get("pickup") or raw.get("pickup_address"),
        "dropoff_address": raw.get("dropoff") or raw.get("delivery_address"),
        "city": raw.get("city"),
        "status": map_status(raw.get("status", "new")),
        "gross_amount": float(raw.get("total") or raw.get("gross_amount") or 0),
        "commission_amount": float(raw.get("commission") or 0),
        "net_to_courier": float(raw.get("courier_payout") or raw.get("net_to_courier") or 0),
        "placed_at": raw.get("placed_at") or raw.get("created_at"),
        "picked_at": raw.get("picked_at"),
        "delivered_at": raw.get("delivered_at"),
        "cancelled_at": raw.get("cancelled_at"),
        "raw_payload": raw,
        "synced_at": datetime.now(timezone.utc).isoformat(),
    }


STATUS_MAP = {
    "new": "new", "pending": "new", "created": "new",
    "assigned": "assigned", "accepted": "assigned",
    "picked_up": "picked", "picked": "picked", "in_transit": "picked",
    "delivered": "delivered", "completed": "delivered",
    "cancelled": "cancelled", "canceled": "cancelled",
    "failed": "failed", "rejected": "failed",
}


def map_status(raw_status: str) -> str:
    return STATUS_MAP.get((raw_status or "").lower().strip(), "new")


# ─── Lambda handler ─────────────────────────────────────────────────────────

def lambda_handler(event, context):
    platform = (event or {}).get("platform", "").lower()
    if platform not in PLATFORM_CONFIG:
        return {"statusCode": 400, "body": json.dumps({"error": f"unknown platform: {platform}"})}

    mode = (event or {}).get("mode", "incremental")
    trigger_source = (event or {}).get("trigger_source", "cron")

    if (event or {}).get("since"):
        since = datetime.fromisoformat(event["since"].replace("Z", "+00:00"))
    elif mode == "backfill":
        since = datetime.now(timezone.utc) - timedelta(days=30)
    else:
        since = datetime.now(timezone.utc) - timedelta(minutes=10)

    run_id = ""
    fetched = upserted = failed = 0
    try:
        run_id = start_sync_run(platform, "backfill" if mode == "backfill" else trigger_source, trigger_source)
        orders = fetch_platform_orders(platform, since)
        fetched = len(orders)
        # Filter rows missing the idempotency key
        valid = [o for o in orders if o["external_order_id"]]
        failed = fetched - len(valid)
        upserted = upsert_orders(valid)
        finish_sync_run(run_id, fetched, upserted, failed, "success" if failed == 0 else "partial")
        return {
            "statusCode": 200,
            "body": json.dumps({
                "platform": platform,
                "fetched": fetched,
                "upserted": upserted,
                "failed": failed,
                "since": since.isoformat(),
            }),
        }
    except Exception as exc:
        finish_sync_run(run_id, fetched, upserted, failed, "failed", str(exc))
        return {"statusCode": 500, "body": json.dumps({"platform": platform, "error": str(exc)})}
