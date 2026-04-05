"""
FLL Jahez/Saned Auto-Sync — EventBridge scheduled (every 15 min)
Uses Supabase Edge Function proxy to bypass Cloudflare.
Reads token from Supabase platform_tokens table.

Flow:
  1. Get Saned token from Supabase RPC
  2. Call Edge Function proxy for stats, drivers, payments
  3. Save results to Supabase tables
  4. Log sync result
"""

import json
import os
import traceback
from datetime import datetime, timezone
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen

# ─── Configuration ────────────────────────────────────────────────────────────

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
PROXY_URL = f"{SUPABASE_URL}/functions/v1/jahez-proxy"
PROVIDER_ID = os.environ.get("JAHEZ_PROVIDER_ID", "20524")
BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "200"))


def now_utc():
    return datetime.now(timezone.utc)


# ─── Supabase Helpers ────────────────────────────────────────────────────────


def supabase_request(method, path, body=None, params=None):
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
    url = f"{SUPABASE_URL}/rest/v1/rpc/{func_name}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    data = json.dumps(params or {}, ensure_ascii=False).encode()
    req = Request(url, data=data, headers=headers, method="POST")
    try:
        with urlopen(req, timeout=15) as resp:
            raw = resp.read().decode()
            return json.loads(raw) if raw else None
    except HTTPError as e:
        error_body = e.read().decode() if e.fp else str(e)
        raise Exception(f"RPC {func_name}: {e.code} — {error_body}")


# ─── Proxy Fetch ──────────────────────────────────────────────────────────────


def proxy_fetch(action, token, extra=None):
    """Call Supabase Edge Function proxy."""
    body = {"action": action, "token": token}
    if extra:
        body.update(extra)

    data = json.dumps(body).encode()
    req = Request(PROXY_URL, data=data, method="POST")
    req.add_header("Content-Type", "application/json")

    try:
        with urlopen(req, timeout=120) as resp:
            raw = resp.read().decode()
            return json.loads(raw) if raw else {}
    except HTTPError as e:
        error_body = e.read().decode() if e.fp else str(e)
        raise Exception(f"Proxy {action}: {e.code} — {error_body[:200]}")


# ─── Sync Tasks ──────────────────────────────────────────────────────────────


def sync_stats(token):
    """Pull driver stats from Saned."""
    stats = {"errors": 0}
    try:
        result = proxy_fetch("stats", token)
        data = result.get("data", result)
        stats["activeDrivers"] = data.get("activeDrivers", 0)
        stats["inactiveDrivers"] = data.get("inactiveDrivers", 0)
        stats["onlineDrivers"] = data.get("onlineDrivers", 0)
        stats["offlineDrivers"] = data.get("offlineDrivers", 0)

        supabase_request("POST", "jahez_sync_data", body={
            "data_type": "driver_stats",
            "external_id": PROVIDER_ID,
            "data": data,
            "synced_at": now_utc().isoformat(),
        }, params={"on_conflict": "data_type,external_id"})

        print(f"[stats] Active: {stats['activeDrivers']}, Online: {stats['onlineDrivers']}")
    except Exception as e:
        stats["errors"] = 1
        stats["message"] = str(e)
        print(f"[stats] Error: {e}")
    return stats


def sync_drivers(token):
    """Pull first page of drivers (for quick sync)."""
    stats = {"fetched": 0, "upserted": 0, "errors": 0}
    try:
        result = proxy_fetch("drivers", token, {"page": 1, "size": 100})
        data = result.get("data", result)
        drivers = data.get("result", data.get("drivers", []))
        if not isinstance(drivers, list):
            drivers = []
        stats["fetched"] = len(drivers)
        stats["total"] = data.get("rowsCount", len(drivers))

        for d in drivers:
            try:
                record = {
                    "platform": "jahez",
                    "external_id": str(d.get("driverID", d.get("driverId", ""))),
                    "iqama_number": str(d.get("idNumber", "")),
                    "name": d.get("driverName", ""),
                    "phone": d.get("phoneNumber", ""),
                    "status": "Active" if d.get("driverStatus") is True else "Inactive",
                    "availability": "Online" if d.get("availability") is True else "Offline",
                    "vehicle_type": str(d.get("vehicleType", "")),
                    "data": d,
                    "synced_at": now_utc().isoformat(),
                }
                supabase_request("POST", "jahez_drivers", body=record,
                                 params={"on_conflict": "external_id"})
                stats["upserted"] += 1
            except Exception as e:
                stats["errors"] += 1

        print(f"[drivers] Fetched {stats['fetched']}, Upserted {stats['upserted']}")
    except Exception as e:
        stats["errors"] += 1
        stats["message"] = str(e)
        print(f"[drivers] Error: {e}")
    return stats


def sync_payments(token):
    """Pull driver payments."""
    stats = {"fetched": 0, "errors": 0}
    try:
        result = proxy_fetch("driver-payments", token, {"page": 1, "size": 50})
        data = result.get("data", result)
        payments = data.get("result", data.get("payments", []))
        if not isinstance(payments, list):
            payments = []
        stats["fetched"] = len(payments)

        for p in payments:
            try:
                record = {
                    "external_id": str(p.get("paymentId", p.get("id", ""))),
                    "driver_id": str(p.get("driverId", p.get("driverID", ""))),
                    "driver_name": p.get("driverName", ""),
                    "amount": float(p.get("amount", p.get("totalAmount", 0))),
                    "payment_type": p.get("paymentType", p.get("type", "")),
                    "status": p.get("status", ""),
                    "payment_date": p.get("paymentDate", p.get("createdAt", "")),
                    "data": p,
                    "synced_at": now_utc().isoformat(),
                }
                supabase_request("POST", "jahez_payments", body=record,
                                 params={"on_conflict": "external_id"})
            except Exception:
                stats["errors"] += 1

        # Also save summary
        supabase_request("POST", "jahez_sync_data", body={
            "data_type": "driver_payments",
            "external_id": PROVIDER_ID,
            "data": data,
            "synced_at": now_utc().isoformat(),
        }, params={"on_conflict": "data_type,external_id"})

        print(f"[payments] Fetched {stats['fetched']}")
    except Exception as e:
        stats["errors"] += 1
        stats["message"] = str(e)
        print(f"[payments] Error: {e}")
    return stats


# ─── Main Handler ─────────────────────────────────────────────────────────────


def lambda_handler(event, context):
    print(f"[fll-jahez-sync] Started at {now_utc().isoformat()}")

    # Step 1: Get token from Supabase
    try:
        token = supabase_rpc("get_saned_token")
        if isinstance(token, list):
            token = token[0] if token else None
        if isinstance(token, dict):
            token = token.get("get_saned_token", token.get("token", ""))
    except Exception as e:
        print(f"[token] RPC error: {e}")
        token = None

    if not token or (isinstance(token, str) and len(token) < 100):
        print("[token] No valid Saned token found — skipping sync")
        return {
            "status": "skipped",
            "message": "No Saned token available. User must login via admin panel first.",
            "timestamp": now_utc().isoformat(),
        }

    print(f"[token] Got token ({len(token)} chars)")

    # Step 2: Run sync tasks
    results = {}

    # Determine tasks
    requested = None
    if "task" in event:
        requested = [event["task"]]
    elif "tasks" in event:
        requested = event["tasks"]

    tasks = [
        ("sync_stats", sync_stats),
        ("sync_drivers", sync_drivers),
        ("sync_payments", sync_payments),
    ]

    for name, func in tasks:
        if requested and name not in requested:
            continue
        start = now_utc()
        try:
            r = func(token)
            r["duration_s"] = round((now_utc() - start).total_seconds(), 2)
            results[name] = r
        except Exception as e:
            results[name] = {"errors": 1, "message": str(e)}
            traceback.print_exc()

    # Step 3: Log sync
    try:
        total_errors = sum(r.get("errors", 0) for r in results.values())
        supabase_request("POST", "sync_logs", body={
            "sync_type": "jahez_auto_sync",
            "status": "success" if total_errors == 0 else "partial",
            "results": results,
            "synced_at": now_utc().isoformat(),
        })
    except Exception as e:
        print(f"[log] Error: {e}")

    total_errors = sum(r.get("errors", 0) for r in results.values())
    response = {
        "status": "success" if total_errors == 0 else "completed_with_errors",
        "timestamp": now_utc().isoformat(),
        "total_errors": total_errors,
        "results": results,
    }
    print(f"[fll-jahez-sync] Done: {json.dumps(response, default=str)}")
    return response
