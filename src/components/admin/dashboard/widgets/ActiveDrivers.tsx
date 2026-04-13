/**
 * Active Drivers Widget — Live list of Active + Online drivers
 * Sources: couriers (status=active|on_delivery) + jahez_drivers (Active+Online)
 */
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bike,
  RefreshCw,
  Circle,
  ExternalLink,
  Search,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ActiveDriver {
  id: string;
  name: string;
  phone: string;
  source: "own" | "jahez";
  status: string;
  vehicle?: string;
}

export function ActiveDrivers() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<ActiveDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchActiveDrivers = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [ownRes, jahezRes] = await Promise.all([
        supabase
          .from("couriers")
          .select("id, full_name, phone, status, vehicle_type")
          .in("status", ["active", "on_delivery"])
          .limit(500),
        supabase
          .from("jahez_drivers")
          .select("external_id, name, phone, vehicle_type, status, availability")
          .eq("status", "Active")
          .eq("availability", "Online")
          .limit(500),
      ]);

      const ownMapped: ActiveDriver[] = (ownRes.data || []).map((c: any) => ({
        id: String(c.id),
        name: c.full_name || "—",
        phone: c.phone || "",
        source: "own",
        status: c.status,
        vehicle: c.vehicle_type,
      }));

      const jahezMapped: ActiveDriver[] = (jahezRes.data || []).map((d: any) => ({
        id: `jahez:${d.external_id}`,
        name: d.name || "—",
        phone: d.phone || "",
        source: "jahez",
        status: "on_delivery",
        vehicle: String(d.vehicle_type || ""),
      }));

      setDrivers([...ownMapped, ...jahezMapped]);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("[ActiveDrivers] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveDrivers();
    // Auto-refresh every 60s
    const interval = setInterval(fetchActiveDrivers, 60_000);
    return () => clearInterval(interval);
  }, [fetchActiveDrivers]);

  const filtered = search
    ? drivers.filter(
        (d) =>
          d.name.includes(search) || d.phone.includes(search),
      )
    : drivers;

  const jahezCount = drivers.filter((d) => d.source === "jahez").length;
  const ownCount = drivers.filter((d) => d.source === "own").length;

  return (
    <div
      dir="rtl"
      style={{
        background: "var(--con-bg-surface-1)",
        border: "1px solid var(--con-border-default)",
        borderRadius: 10,
        padding: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              background: "rgba(34,197,94,0.12)",
              borderRadius: 8,
              padding: 6,
              display: "flex",
            }}
          >
            <Bike size={16} style={{ color: "var(--con-success)" }} />
          </div>
          <div>
            <div
              style={{
                fontSize: "var(--con-text-card-title)",
                fontWeight: 600,
                color: "var(--con-text-primary)",
              }}
            >
              المناديب النشطون الآن
            </div>
            <div
              style={{
                fontSize: "var(--con-text-caption)",
                color: "var(--con-text-muted)",
                marginTop: 2,
              }}
            >
              {drivers.length.toLocaleString("ar-SA")} يعملون حالياً •{" "}
              FLL: {ownCount} • جاهز: {jahezCount}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className="con-btn-ghost"
            onClick={fetchActiveDrivers}
            disabled={loading}
            title="تحديث"
            style={{ padding: "6px 8px" }}
          >
            <RefreshCw
              size={13}
              style={{ animation: loading ? "spin 1s linear infinite" : "none" }}
            />
          </button>
          <button
            className="con-btn-ghost"
            onClick={() => navigate("/admin-panel/dispatch")}
            title="فتح لوحة الإرسال"
            style={{ padding: "6px 8px" }}
          >
            <ExternalLink size={13} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div
        style={{
          position: "relative",
          marginBottom: 10,
        }}
      >
        <Search
          size={13}
          style={{
            position: "absolute",
            insetInlineEnd: 10,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--con-text-muted)",
            pointerEvents: "none",
          }}
        />
        <input
          type="text"
          placeholder="ابحث بالاسم أو الجوال..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="con-input"
          style={{
            paddingInlineEnd: 30,
            width: "100%",
            fontSize: 12,
          }}
        />
      </div>

      {/* List */}
      <div
        style={{
          maxHeight: 380,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {loading && drivers.length === 0 ? (
          <div style={{ textAlign: "center", padding: 30, color: "var(--con-text-muted)" }}>
            جاري التحميل...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 30, color: "var(--con-text-muted)" }}>
            {drivers.length === 0 ? "لا يوجد مناديب نشطون" : "لا توجد نتائج"}
          </div>
        ) : (
          filtered.slice(0, 100).map((d) => (
            <div
              key={d.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: 6,
                background: "var(--con-bg-surface-2)",
                border: "1px solid var(--con-border-default)",
              }}
            >
              <Circle
                size={8}
                style={{ color: "#22c55e", fill: "#22c55e", flexShrink: 0 }}
              />
              <div
                style={{
                  width: 26,
                  height: 26,
                  background: "var(--con-brand-subtle)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--con-brand)",
                  flexShrink: 0,
                }}
              >
                {d.name.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--con-text-primary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {d.name}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--con-text-muted)",
                    fontFamily: "var(--con-font-mono)",
                  }}
                >
                  {d.phone || "—"}
                </div>
              </div>
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 9,
                  fontWeight: 600,
                  background:
                    d.source === "jahez"
                      ? "rgba(59,130,246,0.12)"
                      : "rgba(34,197,94,0.12)",
                  color:
                    d.source === "jahez"
                      ? "var(--con-info)"
                      : "var(--con-success)",
                  border: `1px solid ${
                    d.source === "jahez"
                      ? "rgba(59,130,246,0.25)"
                      : "rgba(34,197,94,0.25)"
                  }`,
                  flexShrink: 0,
                }}
              >
                {d.source === "jahez" ? "جاهز" : "FLL"}
              </span>
            </div>
          ))
        )}
        {filtered.length > 100 && (
          <div
            style={{
              textAlign: "center",
              padding: 8,
              fontSize: 11,
              color: "var(--con-text-muted)",
            }}
          >
            + {filtered.length - 100} أكثر... (استخدم البحث للتصفية)
          </div>
        )}
      </div>

      {/* Footer */}
      {lastRefresh && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 8,
            borderTop: "1px solid var(--con-border-default)",
            fontSize: 10,
            color: "var(--con-text-muted)",
            textAlign: "center",
          }}
        >
          آخر تحديث: {lastRefresh.toLocaleTimeString("ar-SA")} • يتحدث تلقائياً كل دقيقة
        </div>
      )}
    </div>
  );
}
