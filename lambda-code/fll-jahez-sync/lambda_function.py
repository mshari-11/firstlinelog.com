"""
FLL Jahez/Saned Sync — Pull drivers, analytics, and provider data from Saned API.
Triggered by: EventBridge schedule or manual invoke from admin panel.

Saned API Gateway: https://gateway.saned.io/api/v1/drivers-management-portal/
Auth: Keycloak SSO (https://sso.jahez.net/auth/realms/merchant)
Client: saned-merchant
Provider ID: 20524

Environment Variables:
  JAHEZ_USERNAME       — Keycloak username (e.g. firstlinelogistic@outlook.sa)
  JAHEZ_PASSWORD       — Keycloak password
  JAHEZ_PROVIDER_ID    — Delivery provider ID (20524)
  SUPABASE_URL         — Supabase project URL
  SUPABASE_SERVICE_KEY — Supabase service role key
"""

import json
import os
import traceback
from datetime import datetime, timezone
from urllib.error import HTTPError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

# ─── Configuration ────────────────────────────────────────────────────────────

KEYCLOAK_URL = "https://sso.jahez.net/auth/realms/merchant/protocol/openid-connect/token"
KEYCLOAK_CLIENT = "saned-merchant"
GATEWAY_BASE = "https://gateway.saned.io/api/v1/drivers-management-portal"
GATEWAY_V3 = "https://gateway.saned.io/api/v3/admin"

JAHEZ_USERNAME = os.environ.get("JAHEZ_USERNAME", "")
JAHEZ_PASSWORD = os.environ.get("JAHEZ_PASSWORD", "")
PROVIDER_ID = os.environ.get("JAHEZ_PROVIDER_ID", "20524")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "500"))


def now_utc():
    return datetime.now(timezone.utc)


# ─── Keycloak Auth ────────────────────────────────────────────────────────────


class JahezClient:
    """Client for Saned/Jahez API with Keycloak authentication."""

    def __init__(self, username: str, password: str):
        self.username = username
        self.password = password
        self.access_token = None
        self.refresh_token = None

    def authenticate(self) -> str:
        """Get access token from Keycloak."""
        body = urlencode({
            "grant_type": "password",
            "client_id": KEYCLOAK_CLIENT,
            "username": self.username,
            "password": self.password,
        }).encode()

        req = Request(KEYCLOAK_URL, data=body, method="POST")
        req.add_header("Content-Type", "application/x-www-form-urlencoded")

        try:
            with urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode())
                self.access_token = data["access_token"]
                self.refresh_token = data.get("refresh_token", "")
                print(f"[jahez] Authenticated as {self.username}")
                return self.access_token
        except HTTPError as e:
            body = e.read().decode() if e.fp else str(e)
            raise Exception(f"Keycloak auth failed: {e.code} — {body}")

    def _request(self, method: str, url: str, body=None, params=None) -> dict:
        """Make authenticated request to Saned gateway."""
        if params:
            url += "?" + urlencode(params)

        data = json.dumps(body).encode() if body else None
        req = Request(url, data=data, method=method)
        req.add_header("Authorization", f"Bearer {self.access_token}")
        req.add_header("Content-Type", "application/json")
        req.add_header("Accept", "application/json")

        try:
            with urlopen(req, timeout=30) as resp:
                raw = resp.read().decode()
                return json.loads(raw) if raw else {}
        except HTTPError as e:
            body_text = e.read().decode() if e.fp else str(e)
            raise Exception(f"Saned API {method} {url}: {e.code} — {body_text}")

    def get_provider_details(self) -> dict:
        """Get delivery provider profile details."""
        return self._request("GET", f"{GATEWAY_BASE}/delivery-providers/{PROVIDER_ID}/details")

    def get_driver_list(self, page: int = 0, size: int = 100, status: str = None) -> dict:
        """Get paginated driver list."""
        params = {"page": page, "size": size}
        if status:
            params["status"] = status
        return self._request("GET", f"{GATEWAY_BASE}/delivery-providers/driver-list", params=params)

    def get_active_inactive_stats(self) -> dict:
        """Get active vs inactive driver stats."""
        return self._request("GET", f"{GATEWAY_BASE}/delivery-providers/active-inactive")

    def get_vehicle_types(self) -> list:
        """Get available vehicle types."""
        return self._request("GET", f"{GATEWAY_BASE}/lookups/vehicle-types")

    def get_cities(self, country_code: str = "SA") -> list:
        """Get cities by country."""
        return self._request("GET", f"{GATEWAY_BASE}/lookups/cities-by-country-codes",
                             params={"countryCodes": country_code})

    def get_dispatch_config(self) -> dict:
        """Get dispatch configuration."""
        return self._request("GET", f"{GATEWAY_V3}/dispatch/config-values")


# ─── Supabase Helpers ────────────────────────────────────────────────────────


def supabase_request(method: str, path: str, body=None, params=None):
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


# ─── Sync Tasks ──────────────────────────────────────────────────────────────


def sync_provider_profile(client: JahezClient) -> dict:
    """Pull provider profile and stats."""
    stats = {"errors": 0}

    try:
        profile = client.get_provider_details()
        stats["provider_name"] = profile.get("name", "")
        stats["provider_id"] = profile.get("id", PROVIDER_ID)
        stats["status"] = profile.get("status", "")
        stats["total_drivers"] = profile.get("totalDrivers", 0)

        # Store in Supabase
        supabase_request("POST", "jahez_sync_data", body={
            "data_type": "provider_profile",
            "external_id": str(PROVIDER_ID),
            "data": profile,
            "synced_at": now_utc().isoformat(),
        }, params={"on_conflict": "data_type,external_id"})

    except Exception as e:
        stats["errors"] += 1
        print(f"[provider_profile] Error: {e}")

    # Active/Inactive stats
    try:
        ai_stats = client.get_active_inactive_stats()
        stats["active_drivers"] = ai_stats.get("activeDrivers", 0)
        stats["inactive_drivers"] = ai_stats.get("inactiveDrivers", 0)
        stats["online_drivers"] = ai_stats.get("onlineDrivers", 0)
        stats["offline_drivers"] = ai_stats.get("offlineDrivers", 0)

        supabase_request("POST", "jahez_sync_data", body={
            "data_type": "driver_stats",
            "external_id": str(PROVIDER_ID),
            "data": ai_stats,
            "synced_at": now_utc().isoformat(),
        }, params={"on_conflict": "data_type,external_id"})

    except Exception as e:
        stats["errors"] += 1
        print(f"[active_inactive] Error: {e}")

    return stats


def sync_drivers(client: JahezClient) -> dict:
    """Pull all drivers from Saned and upsert into Supabase."""
    stats = {"fetched": 0, "upserted": 0, "errors": 0, "pages": 0}

    page = 0
    page_size = min(BATCH_SIZE, 100)  # Saned might limit page size

    while True:
        try:
            result = client.get_driver_list(page=page, size=page_size)

            # Handle different response structures
            drivers = []
            if isinstance(result, list):
                drivers = result
            elif isinstance(result, dict):
                drivers = result.get("content", result.get("drivers", result.get("data", [])))
                if not isinstance(drivers, list):
                    drivers = []

            if not drivers:
                break

            stats["fetched"] += len(drivers)
            stats["pages"] += 1

            for driver in drivers:
                try:
                    driver_id = str(driver.get("driverId", driver.get("id", "")))
                    if not driver_id:
                        continue

                    record = {
                        "platform": "jahez",
                        "external_id": driver_id,
                        "iqama_number": str(driver.get("iqamaNumber", driver.get("nationalId", ""))),
                        "name": driver.get("driverName", driver.get("name", "")),
                        "phone": driver.get("phoneNumber", driver.get("phone", "")),
                        "status": driver.get("driverStatus", driver.get("status", "")),
                        "availability": driver.get("availability", ""),
                        "vehicle_type": driver.get("vehicleType", ""),
                        "city": driver.get("city", ""),
                        "data": driver,  # Store full raw data
                        "synced_at": now_utc().isoformat(),
                    }

                    supabase_request("POST", "jahez_drivers", body=record,
                                     params={"on_conflict": "external_id"})
                    stats["upserted"] += 1

                except Exception as e:
                    stats["errors"] += 1
                    print(f"[drivers] Error upserting driver {driver.get('driverId')}: {e}")

            # Check if there are more pages
            total_elements = 0
            if isinstance(result, dict):
                total_elements = result.get("totalElements", result.get("total", 0))

            if stats["fetched"] >= total_elements or len(drivers) < page_size:
                break

            page += 1

        except Exception as e:
            stats["errors"] += 1
            print(f"[drivers] Error fetching page {page}: {e}")
            break

    print(f"[drivers] Fetched {stats['fetched']} drivers in {stats['pages']} pages")
    return stats


def sync_lookups(client: JahezClient) -> dict:
    """Pull lookup data (vehicle types, cities)."""
    stats = {"vehicle_types": 0, "cities": 0, "errors": 0}

    try:
        vtypes = client.get_vehicle_types()
        if isinstance(vtypes, list):
            stats["vehicle_types"] = len(vtypes)
        supabase_request("POST", "jahez_sync_data", body={
            "data_type": "vehicle_types",
            "external_id": "global",
            "data": vtypes,
            "synced_at": now_utc().isoformat(),
        }, params={"on_conflict": "data_type,external_id"})
    except Exception as e:
        stats["errors"] += 1
        print(f"[lookups] vehicle_types error: {e}")

    try:
        cities = client.get_cities("SA")
        if isinstance(cities, list):
            stats["cities"] = len(cities)
        supabase_request("POST", "jahez_sync_data", body={
            "data_type": "cities_SA",
            "external_id": "global",
            "data": cities,
            "synced_at": now_utc().isoformat(),
        }, params={"on_conflict": "data_type,external_id"})
    except Exception as e:
        stats["errors"] += 1
        print(f"[lookups] cities error: {e}")

    return stats


# ─── Main Handler ─────────────────────────────────────────────────────────────

SYNC_TASKS = [
    ("sync_provider_profile", sync_provider_profile),
    ("sync_drivers", sync_drivers),
    ("sync_lookups", sync_lookups),
]


def lambda_handler(event, context):
    """
    Handler for Jahez/Saned sync.

    Supports:
      - Full sync (default)
      - Selective: {"tasks": ["sync_drivers"]}
      - Single: {"task": "sync_provider_profile"}
      - Runtime credentials: {"username": "...", "password": "..."}
    """
    print(f"[fll-jahez-sync] Started at {now_utc().isoformat()}")

    username = event.get("username", JAHEZ_USERNAME)
    password = event.get("password", JAHEZ_PASSWORD)

    if not username or not password:
        return {
            "status": "error",
            "message": "Missing credentials. Set JAHEZ_USERNAME and JAHEZ_PASSWORD.",
        }

    # Authenticate
    client = JahezClient(username, password)
    try:
        client.authenticate()
    except Exception as e:
        return {"status": "error", "message": f"Authentication failed: {e}"}

    # Determine tasks
    requested = None
    if "task" in event:
        requested = [event["task"]]
    elif "tasks" in event:
        requested = event["tasks"]

    results = {}

    for task_name, task_func in SYNC_TASKS:
        if requested and task_name not in requested:
            continue

        print(f"\n[fll-jahez-sync] ─── Running: {task_name} ───")
        start = now_utc()

        try:
            result = task_func(client)
            duration = (now_utc() - start).total_seconds()
            result["duration_s"] = round(duration, 2)
            results[task_name] = result
            print(f"[fll-jahez-sync] ✓ {task_name}: {result}")

        except Exception as e:
            duration = (now_utc() - start).total_seconds()
            results[task_name] = {
                "errors": 1,
                "message": str(e),
                "duration_s": round(duration, 2),
            }
            print(f"[fll-jahez-sync] ✗ {task_name}: {e}")
            traceback.print_exc()

    # Log sync
    try:
        supabase_request("POST", "sync_logs", body={
            "sync_type": "jahez_saned",
            "status": "success" if all(r.get("errors", 0) == 0 for r in results.values()) else "partial",
            "results": results,
            "synced_at": now_utc().isoformat(),
        })
    except Exception as e:
        print(f"[fll-jahez-sync] Could not log sync: {e}")

    total_errors = sum(r.get("errors", 0) for r in results.values())

    return {
        "status": "completed_with_errors" if total_errors > 0 else "success",
        "timestamp": now_utc().isoformat(),
        "total_errors": total_errors,
        "results": results,
    }
