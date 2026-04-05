"""
FLL ToYou Sync — Odoo XML-RPC Integration
Pulls orders, drivers, and delivery data from ToYou's Odoo instance.
Triggered by: EventBridge schedule or manual invoke from admin panel.

Odoo API: XML-RPC (xmlrpc/2/common + xmlrpc/2/object)
Docs: https://www.odoo.com/documentation/14.0/developer/reference/external_api.html

Environment Variables:
  TOYOU_ODOO_URL       — Odoo server URL (e.g. https://toyou-instance.odoo.com)
  TOYOU_ODOO_DB        — Odoo database name
  TOYOU_ODOO_USER      — Odoo username (email)
  TOYOU_ODOO_API_KEY   — Odoo API key (replaces password)
  SUPABASE_URL         — Supabase project URL
  SUPABASE_SERVICE_KEY  — Supabase service role key
"""

import json
import os
import traceback
from datetime import datetime, timedelta, timezone
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen
from xmlrpc.client import ServerProxy

# ─── Configuration ────────────────────────────────────────────────────────────

ODOO_URL = os.environ.get("TOYOU_ODOO_URL", "").rstrip("/")
ODOO_DB = os.environ.get("TOYOU_ODOO_DB", "")
ODOO_USER = os.environ.get("TOYOU_ODOO_USER", "")
ODOO_API_KEY = os.environ.get("TOYOU_ODOO_API_KEY", "")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "200"))
SYNC_DAYS = int(os.environ.get("SYNC_DAYS", "7"))  # Pull last N days


def now_utc():
    return datetime.now(timezone.utc)


# ─── Odoo XML-RPC Client ─────────────────────────────────────────────────────


class OdooClient:
    """Lightweight Odoo XML-RPC client."""

    def __init__(self, url: str, db: str, username: str, api_key: str):
        self.url = url
        self.db = db
        self.username = username
        self.api_key = api_key
        self.uid = None
        self.common = ServerProxy(f"{url}/xmlrpc/2/common")
        self.models = ServerProxy(f"{url}/xmlrpc/2/object")

    def authenticate(self) -> int:
        """Authenticate and return user ID."""
        version = self.common.version()
        print(f"[odoo] Server version: {version.get('server_version', 'unknown')}")

        self.uid = self.common.authenticate(
            self.db, self.username, self.api_key, {}
        )
        if not self.uid:
            raise Exception("Odoo authentication failed — check credentials")

        print(f"[odoo] Authenticated as uid={self.uid}")
        return self.uid

    def search_read(
        self,
        model: str,
        domain: list,
        fields: list,
        limit: int = 0,
        offset: int = 0,
        order: str = "",
    ) -> list:
        """Search and read records from Odoo model."""
        kwargs = {"fields": fields}
        if limit:
            kwargs["limit"] = limit
        if offset:
            kwargs["offset"] = offset
        if order:
            kwargs["order"] = order

        return self.models.execute_kw(
            self.db, self.uid, self.api_key,
            model, "search_read",
            [domain], kwargs,
        )

    def search_count(self, model: str, domain: list) -> int:
        """Count records matching domain."""
        return self.models.execute_kw(
            self.db, self.uid, self.api_key,
            model, "search_count",
            [domain],
        )

    def fields_get(self, model: str) -> dict:
        """Get model field definitions."""
        return self.models.execute_kw(
            self.db, self.uid, self.api_key,
            model, "fields_get",
            [],
            {"attributes": ["string", "type", "help"]},
        )


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


# ─── Sync Task: Discover Available Models ─────────────────────────────────────


def discover_models(odoo: OdooClient) -> dict:
    """Discover which delivery-related models exist in this Odoo instance."""
    stats = {"models_found": [], "errors": 0}

    # Common Odoo delivery/logistics models to check
    candidate_models = [
        "sale.order",
        "sale.order.line",
        "stock.picking",
        "delivery.carrier",
        "res.partner",
        "fleet.vehicle",
        "fleet.vehicle.log.fuel",
        "fleet.vehicle.log.services",
        "hr.employee",
        "account.move",
        "account.move.line",
        # Custom ToYou models (if any)
        "toyou.order",
        "toyou.delivery",
        "toyou.driver",
        "delivery.order",
    ]

    for model_name in candidate_models:
        try:
            count = odoo.search_count(model_name, [])
            stats["models_found"].append({
                "model": model_name,
                "record_count": count,
            })
            print(f"[discover] ✓ {model_name}: {count} records")
        except Exception:
            # Model doesn't exist — skip silently
            pass

    print(f"[discover] Found {len(stats['models_found'])} accessible models")
    return stats


# ─── Sync Task: Pull Orders ──────────────────────────────────────────────────


def sync_orders(odoo: OdooClient) -> dict:
    """Pull recent orders from Odoo and upsert into Supabase."""
    stats = {"fetched": 0, "upserted": 0, "errors": 0}

    cutoff = (now_utc() - timedelta(days=SYNC_DAYS)).strftime("%Y-%m-%d")

    # Try sale.order first (standard Odoo)
    order_model = "sale.order"
    order_fields = [
        "name", "partner_id", "date_order", "state",
        "amount_total", "amount_untaxed", "amount_tax",
        "delivery_count", "create_date", "write_date",
        "user_id", "team_id", "note",
    ]

    try:
        orders = odoo.search_read(
            order_model,
            [["date_order", ">=", cutoff]],
            order_fields,
            limit=BATCH_SIZE,
            order="date_order desc",
        )
        stats["fetched"] = len(orders)
        print(f"[orders] Fetched {len(orders)} orders since {cutoff}")

        for order in orders:
            try:
                record = {
                    "platform": "toyou",
                    "external_id": str(order.get("id", "")),
                    "order_ref": order.get("name", ""),
                    "customer_name": order["partner_id"][1] if isinstance(order.get("partner_id"), (list, tuple)) else str(order.get("partner_id", "")),
                    "amount": float(order.get("amount_total", 0)),
                    "amount_untaxed": float(order.get("amount_untaxed", 0)),
                    "tax_amount": float(order.get("amount_tax", 0)),
                    "status": _map_odoo_state(order.get("state", "")),
                    "order_date": order.get("date_order", ""),
                    "odoo_state": order.get("state", ""),
                    "notes": order.get("note") or "",
                    "synced_at": now_utc().isoformat(),
                    "source": "odoo_xmlrpc",
                }

                supabase_request(
                    "POST",
                    "toyou_orders",
                    body=record,
                    params={"on_conflict": "external_id"},
                )
                stats["upserted"] += 1

            except Exception as e:
                stats["errors"] += 1
                print(f"[orders] Error upserting order {order.get('name')}: {e}")

    except Exception as e:
        stats["errors"] += 1
        print(f"[orders] Error fetching from {order_model}: {e}")
        # Fallback: try stock.picking for delivery orders
        print("[orders] Trying stock.picking as fallback...")
        try:
            pickings = odoo.search_read(
                "stock.picking",
                [
                    ["scheduled_date", ">=", cutoff],
                    ["picking_type_code", "=", "outgoing"],
                ],
                ["name", "partner_id", "scheduled_date", "state",
                 "origin", "create_date", "date_done"],
                limit=BATCH_SIZE,
                order="scheduled_date desc",
            )
            stats["fetched"] = len(pickings)
            print(f"[orders] Fetched {len(pickings)} pickings as fallback")

            for pick in pickings:
                try:
                    record = {
                        "platform": "toyou",
                        "external_id": f"pick_{pick.get('id', '')}",
                        "order_ref": pick.get("name", ""),
                        "customer_name": pick["partner_id"][1] if isinstance(pick.get("partner_id"), (list, tuple)) else "",
                        "amount": 0,
                        "status": _map_picking_state(pick.get("state", "")),
                        "order_date": pick.get("scheduled_date", ""),
                        "odoo_state": pick.get("state", ""),
                        "synced_at": now_utc().isoformat(),
                        "source": "odoo_xmlrpc",
                    }
                    supabase_request(
                        "POST",
                        "toyou_orders",
                        body=record,
                        params={"on_conflict": "external_id"},
                    )
                    stats["upserted"] += 1
                except Exception as e2:
                    stats["errors"] += 1
                    print(f"[orders] Error upserting picking {pick.get('name')}: {e2}")

        except Exception as e2:
            stats["errors"] += 1
            print(f"[orders] Fallback also failed: {e2}")

    return stats


def _map_odoo_state(state: str) -> str:
    """Map Odoo sale.order state to FLL status."""
    mapping = {
        "draft": "new",
        "sent": "new",
        "sale": "confirmed",
        "done": "delivered",
        "cancel": "cancelled",
    }
    return mapping.get(state, state)


def _map_picking_state(state: str) -> str:
    """Map Odoo stock.picking state to FLL status."""
    mapping = {
        "draft": "new",
        "waiting": "pending",
        "confirmed": "confirmed",
        "assigned": "in_progress",
        "done": "delivered",
        "cancel": "cancelled",
    }
    return mapping.get(state, state)


# ─── Sync Task: Pull Partners (Drivers/Contacts) ─────────────────────────────


def sync_partners(odoo: OdooClient) -> dict:
    """Pull driver/partner records from Odoo."""
    stats = {"fetched": 0, "upserted": 0, "errors": 0}

    partner_fields = [
        "name", "email", "phone", "mobile", "city",
        "street", "country_id", "is_company",
        "create_date", "write_date", "active",
        "comment", "category_id",
    ]

    try:
        # Pull active partners (individuals, not companies)
        partners = odoo.search_read(
            "res.partner",
            [["is_company", "=", False], ["active", "=", True]],
            partner_fields,
            limit=BATCH_SIZE,
            order="write_date desc",
        )
        stats["fetched"] = len(partners)
        print(f"[partners] Fetched {len(partners)} partners")

        for partner in partners:
            try:
                phone = partner.get("mobile") or partner.get("phone") or ""
                record = {
                    "platform": "toyou",
                    "external_id": str(partner.get("id", "")),
                    "name": partner.get("name", ""),
                    "email": partner.get("email") or "",
                    "phone": phone,
                    "city": partner.get("city") or "",
                    "is_active": partner.get("active", True),
                    "notes": partner.get("comment") or "",
                    "synced_at": now_utc().isoformat(),
                    "source": "odoo_xmlrpc",
                }

                supabase_request(
                    "POST",
                    "toyou_partners",
                    body=record,
                    params={"on_conflict": "external_id"},
                )
                stats["upserted"] += 1

            except Exception as e:
                stats["errors"] += 1
                print(f"[partners] Error upserting {partner.get('name')}: {e}")

    except Exception as e:
        stats["errors"] += 1
        print(f"[partners] Error: {e}")

    return stats


# ─── Sync Task: Pull Fleet/Vehicles ──────────────────────────────────────────


def sync_fleet(odoo: OdooClient) -> dict:
    """Pull fleet vehicle data from Odoo (if fleet module installed)."""
    stats = {"fetched": 0, "upserted": 0, "errors": 0}

    try:
        vehicles = odoo.search_read(
            "fleet.vehicle",
            [["active", "=", True]],
            ["name", "license_plate", "model_id", "driver_id",
             "state_id", "odometer", "fuel_type", "create_date"],
            limit=BATCH_SIZE,
        )
        stats["fetched"] = len(vehicles)
        print(f"[fleet] Fetched {len(vehicles)} vehicles")

        for v in vehicles:
            try:
                record = {
                    "platform": "toyou",
                    "external_id": f"veh_{v.get('id', '')}",
                    "name": v.get("name", ""),
                    "plate": v.get("license_plate") or "",
                    "model": v["model_id"][1] if isinstance(v.get("model_id"), (list, tuple)) else "",
                    "driver_name": v["driver_id"][1] if isinstance(v.get("driver_id"), (list, tuple)) else "",
                    "odometer": float(v.get("odometer", 0)),
                    "fuel_type": v.get("fuel_type") or "",
                    "synced_at": now_utc().isoformat(),
                }
                supabase_request(
                    "POST",
                    "toyou_vehicles",
                    body=record,
                    params={"on_conflict": "external_id"},
                )
                stats["upserted"] += 1
            except Exception as e:
                stats["errors"] += 1

    except Exception as e:
        # Fleet module may not be installed
        print(f"[fleet] Fleet module not available or error: {e}")
        stats["errors"] += 1

    return stats


# ─── Main Handler ─────────────────────────────────────────────────────────────

SYNC_TASKS = [
    ("discover_models", discover_models),
    ("sync_orders", sync_orders),
    ("sync_partners", sync_partners),
    ("sync_fleet", sync_fleet),
]


def lambda_handler(event, context):
    """
    Handler for ToYou Odoo sync.

    Supports:
      - Full sync (default): runs all tasks
      - Selective: {"tasks": ["sync_orders"]}
      - Single: {"task": "sync_partners"}
      - Discovery only: {"task": "discover_models"}
      - Override config: {"odoo_url": "...", "odoo_db": "...", ...}
    """
    print(f"[fll-toyou-sync] Started at {now_utc().isoformat()}")

    # Allow runtime config override (from admin panel)
    odoo_url = event.get("odoo_url", ODOO_URL)
    odoo_db = event.get("odoo_db", ODOO_DB)
    odoo_user = event.get("odoo_user", ODOO_USER)
    odoo_key = event.get("odoo_api_key", ODOO_API_KEY)

    if not all([odoo_url, odoo_db, odoo_user, odoo_key]):
        return {
            "status": "error",
            "message": "Missing Odoo configuration. Set TOYOU_ODOO_URL, TOYOU_ODOO_DB, TOYOU_ODOO_USER, TOYOU_ODOO_API_KEY",
        }

    # Initialize Odoo client
    odoo = OdooClient(odoo_url, odoo_db, odoo_user, odoo_key)

    try:
        odoo.authenticate()
    except Exception as e:
        return {
            "status": "error",
            "message": f"Odoo authentication failed: {e}",
        }

    # Determine which tasks to run
    requested = None
    if "task" in event:
        requested = [event["task"]]
    elif "tasks" in event:
        requested = event["tasks"]

    results = {}

    for task_name, task_func in SYNC_TASKS:
        if requested and task_name not in requested:
            continue

        print(f"\n[fll-toyou-sync] ─── Running: {task_name} ───")
        start = now_utc()

        try:
            result = task_func(odoo)
            duration = (now_utc() - start).total_seconds()
            result["duration_s"] = round(duration, 2)
            results[task_name] = result
            print(f"[fll-toyou-sync] ✓ {task_name}: {result}")

        except Exception as e:
            duration = (now_utc() - start).total_seconds()
            results[task_name] = {
                "errors": 1,
                "message": str(e),
                "duration_s": round(duration, 2),
            }
            print(f"[fll-toyou-sync] ✗ {task_name}: {e}")
            traceback.print_exc()

    # Store sync log in Supabase
    try:
        supabase_request("POST", "sync_logs", body={
            "sync_type": "toyou_odoo",
            "status": "success" if all(r.get("errors", 0) == 0 for r in results.values()) else "partial",
            "results": results,
            "synced_at": now_utc().isoformat(),
        })
    except Exception as e:
        print(f"[fll-toyou-sync] Could not log sync: {e}")

    total_errors = sum(r.get("errors", 0) for r in results.values())

    response = {
        "status": "completed_with_errors" if total_errors > 0 else "success",
        "timestamp": now_utc().isoformat(),
        "total_errors": total_errors,
        "results": results,
    }

    print(f"\n[fll-toyou-sync] Completed: {json.dumps(response, default=str)}")
    return response
