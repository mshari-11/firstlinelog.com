/**
 * صفحة تكاملات المنصات — Marketplace Integrations
 * إدارة تكاملات المنصات الخارجية عبر Lambda marketplace-integrations
 */
import { useState, useEffect, useCallback } from "react";
import { RefreshCw, AlertCircle, CheckCircle2, XCircle, Link2, Plug, Activity, Settings } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { supabase } from "@/lib/supabase";

interface Integration {
  id: string;
  name: string;
  platform: string;
  status: "active" | "inactive" | "error" | "pending";
  webhook_url?: string;
  api_key_masked?: string;
  last_sync?: string;
  total_orders?: number;
  error_message?: string;
}

interface SyncLog {
  id: string;
  platform: string;
  event_type: string;
  status: "success" | "error";
  records: number;
  created_at: string;
}

const PLATFORM_ICONS: Record<string, string> = {
  jahez: "🍕",
  hungerstation: "🍔",
  noon: "🛒",
  namshi: "👗",
  amazon: "📦",
  salla: "🏪",
  zid: "🛍",
  custom: "🔗",
};

const STATUS_MAP = {
  active:   { label: "نشط",       cls: "con-badge-success" },
  inactive: { label: "غير نشط",  cls: "con-badge-warning" },
  error:    { label: "خطأ",       cls: "con-badge-danger" },
  pending:  { label: "قيد الربط", cls: "con-badge-info" },
};

const MOCK_INTEGRATIONS: Integration[] = [
  { id: "1", name: "جاهز للتوصيل", platform: "jahez", status: "active", last_sync: new Date(Date.now() - 5 * 60000).toISOString(), total_orders: 1243 },
  { id: "2", name: "هنقرستيشن", platform: "hungerstation", status: "active", last_sync: new Date(Date.now() - 15 * 60000).toISOString(), total_orders: 876 },
  { id: "3", name: "نون", platform: "noon", status: "inactive", total_orders: 0 },
  { id: "4", name: "سلة", platform: "salla", status: "error", error_message: "API Key منتهي الصلاحية", total_orders: 234 },
  { id: "5", name: "زد", platform: "zid", status: "pending", total_orders: 0 },
];

const MOCK_LOGS: SyncLog[] = [
  { id: "l1", platform: "jahez", event_type: "new_order", status: "success", records: 12, created_at: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: "l2", platform: "hungerstation", event_type: "status_update", status: "success", records: 8, created_at: new Date(Date.now() - 15 * 60000).toISOString() },
  { id: "l3", platform: "salla", event_type: "new_order", status: "error", records: 0, created_at: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: "l4", platform: "jahez", event_type: "cancel_order", status: "success", records: 2, created_at: new Date(Date.now() - 45 * 60000).toISOString() },
];

export default function MarketplaceIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>(MOCK_INTEGRATIONS);
  const [logs, setLogs] = useState<SyncLog[]>(MOCK_LOGS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"integrations" | "logs">("integrations");
  const [syncing, setSyncing] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/marketplace/integrations`);
      if (res.ok) {
        const d = await res.json();
        if (d.integrations?.length) setIntegrations(d.integrations);
        if (d.logs?.length) setLogs(d.logs);
      }
    } catch { /* keep mock */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function triggerSync(id: string) {
    setSyncing(id);
    try {
      await fetch(`${API_BASE}/api/marketplace/sync/${id}`, { method: "POST" });
      setIntegrations(prev => prev.map(i => i.id === id ? { ...i, last_sync: new Date().toISOString() } : i));
    } catch { /* ignore */ }
    finally { setSyncing(null); }
  }

  async function toggleStatus(id: string, current: string) {
    const newStatus = current === "active" ? "inactive" : "active";
    try {
      await fetch(`${API_BASE}/api/marketplace/integrations/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch { /* ignore */ }
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, status: newStatus as any } : i));
  }

  const activeCount = integrations.filter(i => i.status === "active").length;
  const totalOrders = integrations.reduce((s, i) => s + (i.total_orders || 0), 0);

  return (
    <div dir="rtl" style={{ padding: "1.5rem", fontFamily: "var(--con-font-arabic)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--con-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Plug size={18} style={{ color: "var(--con-accent)" }} /> تكاملات المنصات
          </h1>
          <p style={{ fontSize: 12, color: "var(--con-text-muted)", margin: "4px 0 0" }}>إدارة ربط المنصات الخارجية وتدفق الطلبات</p>
        </div>
        <button onClick={fetchData} disabled={loading} className="con-btn con-btn-ghost" style={{ gap: 6 }}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> تحديث
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: "المنصات المتصلة", value: integrations.length, color: "var(--con-text-secondary)" },
          { label: "نشط", value: activeCount, color: "var(--con-success)" },
          { label: "إجمالي الطلبات", value: totalOrders.toLocaleString("ar-SA"), color: "var(--con-accent)" },
        ].map(s => (
          <div key={s.label} className="con-card" style={{ padding: "0.75rem", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--con-text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", borderBottom: "1px solid var(--con-border-default)", paddingBottom: "0.5rem" }}>
        {[{ id: "integrations", label: "المنصات" }, { id: "logs", label: "سجل المزامنة" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} className="con-btn" style={{
            background: tab === t.id ? "var(--con-accent)" : "transparent",
            color: tab === t.id ? "#fff" : "var(--con-text-muted)",
            border: tab === t.id ? "none" : "1px solid var(--con-border-default)",
            fontSize: 12,
          }}>{t.label}</button>
        ))}
      </div>

      {error && <div className="con-card" style={{ padding: "1rem", color: "var(--con-danger)", display: "flex", gap: 8, marginBottom: "1rem" }}><AlertCircle size={16} />{error}</div>}

      {tab === "integrations" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
          {integrations.map(intg => {
            const sm = STATUS_MAP[intg.status];
            return (
              <div key={intg.id} className="con-card" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 24 }}>{PLATFORM_ICONS[intg.platform] || "🔗"}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--con-text-primary)" }}>{intg.name}</div>
                      <div style={{ fontSize: 11, color: "var(--con-text-muted)" }}>{intg.platform}</div>
                    </div>
                  </div>
                  <span className={`con-badge ${sm.cls}`}>{sm.label}</span>
                </div>

                {intg.error_message && (
                  <div style={{ background: "rgba(239,68,68,0.1)", borderRadius: "var(--con-radius-sm)", padding: "0.5rem 0.75rem", marginBottom: 10, fontSize: 11, color: "var(--con-danger)" }}>
                    {intg.error_message}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--con-text-muted)", marginBottom: 12 }}>
                  <span>الطلبات: <strong style={{ color: "var(--con-text-secondary)" }}>{(intg.total_orders || 0).toLocaleString()}</strong></span>
                  <span>{intg.last_sync ? `آخر مزامنة: ${new Date(intg.last_sync).toLocaleTimeString("ar-SA")}` : "لم تتم مزامنة"}</span>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={() => triggerSync(intg.id)} disabled={syncing === intg.id || intg.status !== "active"} className="con-btn con-btn-ghost" style={{ fontSize: 11, gap: 4, flex: 1 }}>
                    {syncing === intg.id ? <RefreshCw size={12} className="animate-spin" /> : <Activity size={12} />}
                    مزامنة
                  </button>
                  <button onClick={() => toggleStatus(intg.id, intg.status)} className="con-btn con-btn-ghost" style={{ fontSize: 11, gap: 4, flex: 1 }}>
                    {intg.status === "active" ? <XCircle size={12} /> : <CheckCircle2 size={12} />}
                    {intg.status === "active" ? "إيقاف" : "تفعيل"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "logs" && (
        <div className="con-card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--con-border-default)" }}>
                {["المنصة", "نوع الحدث", "الحالة", "السجلات", "الوقت"].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "right", fontSize: 11, fontWeight: 600, color: "var(--con-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: "1px solid var(--con-border-subtle)" }}>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{ fontSize: 16, marginLeft: 6 }}>{PLATFORM_ICONS[log.platform] || "🔗"}</span>
                    <span style={{ fontSize: 12, color: "var(--con-text-primary)" }}>{log.platform}</span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: 12, color: "var(--con-text-secondary)" }}>{log.event_type}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span className={log.status === "success" ? "con-badge con-badge-success" : "con-badge con-badge-danger"}>
                      {log.status === "success" ? "نجح" : "فشل"}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: 13, fontWeight: 600, color: "var(--con-text-primary)" }}>{log.records}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: 11, color: "var(--con-text-muted)" }}>{new Date(log.created_at).toLocaleString("ar-SA")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
