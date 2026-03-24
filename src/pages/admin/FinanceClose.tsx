/**
 * صفحة الإغلاق المالي اليومي — Daily Finance Close
 * إدارة وتتبع عمليات الإغلاق المالي اليومي عبر Lambda fll-daily-finance-close
 */
import { useState, useEffect, useCallback } from "react";
import { RefreshCw, AlertCircle, CheckCircle2, XCircle, Lock, Calendar, DollarSign, Play } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { supabase } from "@/lib/supabase";

interface FinanceCloseRecord {
  id: string;
  close_date: string;
  status: "open" | "in_progress" | "closed" | "failed";
  total_revenue: number;
  total_expenses: number;
  net: number;
  orders_count: number;
  payouts_count: number;
  closed_by?: string;
  closed_at?: string;
  notes?: string;
  created_at: string;
}

const STATUS_MAP = {
  open:        { label: "مفتوح",        cls: "con-badge-info",    icon: <Calendar size={11} /> },
  in_progress: { label: "قيد الإغلاق", cls: "con-badge-warning", icon: <RefreshCw size={11} /> },
  closed:      { label: "مغلق",         cls: "con-badge-success", icon: <Lock size={11} /> },
  failed:      { label: "فشل",           cls: "con-badge-danger",  icon: <XCircle size={11} /> },
};

const MOCK_RECORDS: FinanceCloseRecord[] = [
  { id: "fc-1", close_date: "2026-03-23", status: "closed", total_revenue: 45320, total_expenses: 12400, net: 32920, orders_count: 234, payouts_count: 18, closed_by: "مدير المالية", closed_at: "2026-03-23T22:00:00Z", created_at: "2026-03-23T00:00:00Z" },
  { id: "fc-2", close_date: "2026-03-22", status: "closed", total_revenue: 38900, total_expenses: 10200, net: 28700, orders_count: 198, payouts_count: 15, closed_by: "مدير المالية", closed_at: "2026-03-22T22:30:00Z", created_at: "2026-03-22T00:00:00Z" },
  { id: "fc-3", close_date: "2026-03-21", status: "closed", total_revenue: 52100, total_expenses: 14300, net: 37800, orders_count: 267, payouts_count: 21, closed_by: "مدير المالية", closed_at: "2026-03-21T23:00:00Z", created_at: "2026-03-21T00:00:00Z" },
  { id: "fc-4", close_date: "2026-03-24", status: "open", total_revenue: 0, total_expenses: 0, net: 0, orders_count: 0, payouts_count: 0, created_at: "2026-03-24T00:00:00Z" },
];

export default function FinanceClose() {
  const [records, setRecords] = useState<FinanceCloseRecord[]>(MOCK_RECORDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [selected, setSelected] = useState<FinanceCloseRecord | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data: rows, error: err } = (await supabase?.from("finance").select("*").order("created_at", { ascending: false }).limit(30)) || {};
      if (!err && rows?.length) {
        // Map finance records to close records if available
      }
      const res = await fetch(`${API_BASE}/api/finance/close-history`);
      if (res.ok) { const d = await res.json(); if (d.records?.length) setRecords(d.records); }
    } catch { /* keep mock */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function triggerClose() {
    setTriggering(true); setConfirmClose(false);
    try {
      const res = await fetch(`${API_BASE}/api/finance/daily-close`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: new Date().toISOString().slice(0, 10) }) });
      if (res.ok) {
        setRecords(prev => prev.map(r => r.status === "open" ? { ...r, status: "in_progress" } : r));
        setTimeout(fetchData, 3000);
      }
    } catch (e: any) { setError(e.message); }
    finally { setTriggering(false); }
  }

  const todayRecord = records.find(r => r.close_date === new Date().toISOString().slice(0, 10));
  const totalRevenue = records.filter(r => r.status === "closed").reduce((s, r) => s + r.total_revenue, 0);

  function fmt(n: number) {
    return n.toLocaleString("ar-SA", { minimumFractionDigits: 0 });
  }

  return (
    <div dir="rtl" style={{ padding: "1.5rem", fontFamily: "var(--con-font-arabic)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--con-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Lock size={18} style={{ color: "var(--con-accent)" }} /> الإغلاق المالي اليومي
          </h1>
          <p style={{ fontSize: 12, color: "var(--con-text-muted)", margin: "4px 0 0" }}>تتبع وإدارة عمليات الإغلاق المالي اليومي</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={fetchData} disabled={loading} className="con-btn con-btn-ghost" style={{ gap: 6 }}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> تحديث
          </button>
          {todayRecord?.status === "open" && (
            <button onClick={() => setConfirmClose(true)} disabled={triggering} className="con-btn con-btn-primary" style={{ gap: 6 }}>
              <Play size={14} /> تشغيل الإغلاق اليومي
            </button>
          )}
        </div>
      </div>

      {/* Today's Status */}
      {todayRecord && (
        <div className="con-card" style={{ padding: "1.25rem", marginBottom: "1.5rem", borderRight: `3px solid ${todayRecord.status === "closed" ? "var(--con-success)" : todayRecord.status === "in_progress" ? "var(--con-warning)" : "var(--con-accent)"}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--con-text-primary)" }}>اليوم — {todayRecord.close_date}</span>
              {todayRecord.closed_by && <span style={{ fontSize: 11, color: "var(--con-text-muted)", marginRight: 8 }}>بواسطة: {todayRecord.closed_by}</span>}
            </div>
            {(() => { const sm = STATUS_MAP[todayRecord.status]; return <span className={`con-badge ${sm.cls}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{sm.icon}{sm.label}</span>; })()}
          </div>
          {todayRecord.status === "closed" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "الإيرادات", value: `${fmt(todayRecord.total_revenue)} ر.س`, color: "var(--con-success)" },
                { label: "المصروفات", value: `${fmt(todayRecord.total_expenses)} ر.س`, color: "var(--con-danger)" },
                { label: "الصافي", value: `${fmt(todayRecord.net)} ر.س`, color: "var(--con-accent)" },
                { label: "الطلبات", value: todayRecord.orders_count, color: "var(--con-text-secondary)" },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize: 10, color: "var(--con-text-muted)" }}>{f.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: f.color }}>{f.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <div className="con-card" style={{ padding: "1rem", color: "var(--con-danger)", display: "flex", gap: 8, marginBottom: "1rem" }}><AlertCircle size={16} />{error}</div>}

      {/* History */}
      <div className="con-card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--con-border-default)", fontSize: 12, fontWeight: 600, color: "var(--con-text-secondary)" }}>
          سجل الإغلاق المالي
        </div>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--con-text-muted)" }}>
            <RefreshCw size={20} className="animate-spin" style={{ margin: "0 auto 8px", display: "block" }} /> جاري التحميل...
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--con-border-default)" }}>
                {["التاريخ", "الإيرادات", "المصروفات", "الصافي", "الطلبات", "الدفعات", "الحالة", "مُغلق بواسطة"].map(h => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "right", fontSize: 11, fontWeight: 600, color: "var(--con-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map(r => {
                const sm = STATUS_MAP[r.status];
                return (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--con-border-subtle)", cursor: "pointer" }} onClick={() => setSelected(r)}>
                    <td style={{ padding: "0.75rem 1rem", fontSize: 13, fontWeight: 500, color: "var(--con-text-primary)", fontFamily: "var(--con-font-mono)" }}>{r.close_date}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: 12, color: "var(--con-success)" }}>{r.total_revenue ? `${fmt(r.total_revenue)} ر.س` : "—"}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: 12, color: "var(--con-danger)" }}>{r.total_expenses ? `${fmt(r.total_expenses)} ر.س` : "—"}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: 12, fontWeight: 600, color: r.net >= 0 ? "var(--con-success)" : "var(--con-danger)" }}>{r.net ? `${fmt(r.net)} ر.س` : "—"}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: 12, color: "var(--con-text-secondary)" }}>{r.orders_count || "—"}</td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: 12, color: "var(--con-text-secondary)" }}>{r.payouts_count || "—"}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span className={`con-badge ${sm.cls}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{sm.icon}{sm.label}</span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: 11, color: "var(--con-text-muted)" }}>{r.closed_by || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirm Modal */}
      {confirmClose && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setConfirmClose(false)}>
          <div className="con-card" style={{ width: 380, padding: "1.5rem", textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <Lock size={32} style={{ color: "var(--con-warning)", margin: "0 auto 12px", display: "block" }} />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--con-text-primary)", margin: "0 0 8px" }}>تأكيد الإغلاق اليومي</h2>
            <p style={{ fontSize: 12, color: "var(--con-text-muted)", margin: "0 0 20px" }}>سيتم تشغيل Lambda الإغلاق المالي اليومي لتاريخ اليوم. هل أنت متأكد؟</p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button onClick={() => setConfirmClose(false)} className="con-btn con-btn-ghost">إلغاء</button>
              <button onClick={triggerClose} disabled={triggering} className="con-btn con-btn-primary">
                {triggering ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />} تأكيد التشغيل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
