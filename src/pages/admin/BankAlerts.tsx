/**
 * صفحة التنبيهات البنكية — Bank Account Alerts
 * تنبيهات وإشعارات الحسابات البنكية للمناديب
 */
import { useState, useEffect, useCallback } from "react";
import { Search, RefreshCw, AlertCircle, CheckCircle2, Bell, Landmark, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface BankAlert {
  id: string;
  courier_id: string;
  alert_type: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  sent_by?: string;
  created_at: string;
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  invalid_iban:       "IBAN غير صحيح",
  account_frozen:     "حساب مجمّد",
  transfer_failed:    "فشل التحويل",
  bank_update:        "تحديث بيانات",
  account_changed:    "تغيير الحساب",
  verification_required: "يتطلب توثيق",
};

const ALERT_COLORS: Record<string, string> = {
  invalid_iban: "var(--con-danger)",
  account_frozen: "var(--con-danger)",
  transfer_failed: "var(--con-danger)",
  bank_update: "var(--con-warning)",
  account_changed: "var(--con-warning)",
  verification_required: "var(--con-info)",
};

export default function BankAlerts() {
  const [data, setData] = useState<BankAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (!supabase) throw new Error("Supabase غير متاح");
      const { data: rows, error: err } = await supabase
        .from("bank_account_alerts")
        .select("*")
        .order("created_at", { ascending: false });
      if (err) throw err;
      setData(rows || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function markAsRead(id: string) {
    if (!supabase) return;
    const update = { is_read: true, read_at: new Date().toISOString() };
    await supabase.from("bank_account_alerts").update(update).eq("id", id);
    setData(prev => prev.map(a => a.id === id ? { ...a, ...update } : a));
  }

  async function markAllRead() {
    if (!supabase) return;
    const unread = data.filter(a => !a.is_read);
    const update = { is_read: true, read_at: new Date().toISOString() };
    await supabase.from("bank_account_alerts").update(update).in("id", unread.map(a => a.id));
    setData(prev => prev.map(a => ({ ...a, ...update })));
  }

  const filtered = data.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.message?.toLowerCase().includes(q) || a.courier_id?.includes(q) || ALERT_TYPE_LABELS[a.alert_type]?.includes(q);
    const matchRead = readFilter === "all" || (readFilter === "unread" && !a.is_read) || (readFilter === "read" && a.is_read);
    return matchSearch && matchRead;
  });

  const unreadCount = data.filter(a => !a.is_read).length;

  return (
    <div dir="rtl" style={{ padding: "1.5rem", fontFamily: "var(--con-font-arabic)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--con-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Landmark size={18} style={{ color: "var(--con-accent)" }} /> التنبيهات البنكية
            {unreadCount > 0 && (
              <span style={{ background: "var(--con-danger)", color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "2px 8px" }}>{unreadCount}</span>
            )}
          </h1>
          <p style={{ fontSize: 12, color: "var(--con-text-muted)", margin: "4px 0 0" }}>تنبيهات الحسابات البنكية للمناديب</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="con-btn con-btn-ghost" style={{ gap: 6, fontSize: 12 }}>
              <CheckCircle2 size={13} /> تحديد الكل كمقروء
            </button>
          )}
          <button onClick={fetchData} disabled={loading} className="con-btn con-btn-ghost" style={{ gap: 6 }}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> تحديث
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: "الكل", value: data.length, color: "var(--con-text-secondary)" },
          { label: "غير مقروء", value: unreadCount, color: "var(--con-danger)" },
          { label: "مقروء", value: data.length - unreadCount, color: "var(--con-success)" },
        ].map(s => (
          <div key={s.label} className="con-card" style={{ padding: "0.75rem", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--con-text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--con-text-muted)" }} />
          <input className="con-input" placeholder="بحث برسالة التنبيه أو معرف المندوب..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingRight: 30, width: "100%" }} />
        </div>
        <select className="con-input" value={readFilter} onChange={e => setReadFilter(e.target.value as any)} style={{ width: 130 }}>
          <option value="all">الكل</option>
          <option value="unread">غير مقروء</option>
          <option value="read">مقروء</option>
        </select>
      </div>

      {error && <div className="con-card" style={{ padding: "1rem", color: "var(--con-danger)", display: "flex", gap: 8, marginBottom: "1rem" }}><AlertCircle size={16} />{error}</div>}

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--con-text-muted)" }}>
          <RefreshCw size={20} className="animate-spin" style={{ margin: "0 auto 8px", display: "block" }} /> جاري التحميل...
        </div>
      ) : filtered.length === 0 ? (
        <div className="con-card" style={{ padding: "3rem", textAlign: "center", color: "var(--con-text-muted)" }}>
          <Bell size={32} style={{ margin: "0 auto 12px", display: "block", opacity: 0.3 }} />
          لا توجد تنبيهات
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {filtered.map(alert => (
            <div key={alert.id} className="con-card" style={{
              padding: "1rem 1.25rem",
              borderRight: `3px solid ${ALERT_COLORS[alert.alert_type] || "var(--con-accent)"}`,
              opacity: alert.is_read ? 0.65 : 1,
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: ALERT_COLORS[alert.alert_type] || "var(--con-accent)" }}>
                    {ALERT_TYPE_LABELS[alert.alert_type] || alert.alert_type}
                  </span>
                  {!alert.is_read && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--con-danger)", display: "inline-block" }} />}
                </div>
                <p style={{ fontSize: 13, color: "var(--con-text-primary)", margin: "0 0 4px" }}>{alert.message}</p>
                <div style={{ fontSize: 11, color: "var(--con-text-muted)", display: "flex", gap: 12 }}>
                  <span>معرف المندوب: {alert.courier_id?.slice(0, 12)}…</span>
                  <span>{new Date(alert.created_at).toLocaleString("ar-SA")}</span>
                </div>
              </div>
              {!alert.is_read && (
                <button onClick={() => markAsRead(alert.id)} className="con-btn con-btn-ghost" style={{ padding: "4px 8px", fontSize: 11, flexShrink: 0 }}>
                  <CheckCircle2 size={13} /> قراءة
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
