/**
 * صفحة التقرير المالي الشهري — Monthly Finance Report
 * توليد ومتابعة التقارير المالية الشهرية عبر Lambda fll-monthly-finance-report
 */
import { useState, useEffect, useCallback } from "react";
import { RefreshCw, AlertCircle, FileText, Download, Play, Calendar, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { API_BASE } from "@/lib/api";

interface MonthlyReport {
  id: string;
  month: string; // "2026-03"
  year: number;
  status: "pending" | "generating" | "ready" | "failed";
  total_revenue: number;
  total_expenses: number;
  total_payouts: number;
  net_profit: number;
  total_orders: number;
  active_couriers: number;
  avg_order_value: number;
  generated_at?: string;
  pdf_url?: string;
  created_at: string;
}

const STATUS_MAP = {
  pending:    { label: "لم يُولَّد",    cls: "con-badge-warning" },
  generating: { label: "جاري التوليد", cls: "con-badge-info" },
  ready:      { label: "جاهز",          cls: "con-badge-success" },
  failed:     { label: "فشل",           cls: "con-badge-danger" },
};

const MONTH_NAMES: Record<string, string> = {
  "01": "يناير", "02": "فبراير", "03": "مارس", "04": "أبريل",
  "05": "مايو",  "06": "يونيو",  "07": "يوليو", "08": "أغسطس",
  "09": "سبتمبر","10": "أكتوبر","11": "نوفمبر","12": "ديسمبر",
};

const MOCK_REPORTS: MonthlyReport[] = [
  { id: "mr-1", month: "2026-03", year: 2026, status: "ready", total_revenue: 1245000, total_expenses: 342000, total_payouts: 456000, net_profit: 447000, total_orders: 6789, active_couriers: 187, avg_order_value: 183, generated_at: "2026-03-01T06:00:00Z", created_at: "2026-03-01T00:00:00Z" },
  { id: "mr-2", month: "2026-02", year: 2026, status: "ready", total_revenue: 1134000, total_expenses: 310000, total_payouts: 412000, net_profit: 412000, total_orders: 6123, active_couriers: 175, avg_order_value: 185, generated_at: "2026-02-01T06:00:00Z", created_at: "2026-02-01T00:00:00Z" },
  { id: "mr-3", month: "2026-01", year: 2026, status: "ready", total_revenue: 987000, total_expenses: 287000, total_payouts: 367000, net_profit: 333000, total_orders: 5432, active_couriers: 162, avg_order_value: 182, generated_at: "2026-01-01T06:00:00Z", created_at: "2026-01-01T00:00:00Z" },
];

export default function MonthlyReport() {
  const [reports, setReports] = useState<MonthlyReport[]>(MOCK_REPORTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selected, setSelected] = useState<MonthlyReport | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/finance/monthly-reports`);
      if (res.ok) { const d = await res.json(); if (d.reports?.length) setReports(d.reports); }
    } catch { /* keep mock */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function generateReport() {
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/api/finance/monthly-report/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: selectedMonth }),
      });
      if (res.ok) {
        setReports(prev => {
          const exists = prev.find(r => r.month === selectedMonth);
          if (exists) return prev.map(r => r.month === selectedMonth ? { ...r, status: "generating" } : r);
          return [{ id: `mr-new-${Date.now()}`, month: selectedMonth, year: parseInt(selectedMonth.split("-")[0]), status: "generating", total_revenue: 0, total_expenses: 0, total_payouts: 0, net_profit: 0, total_orders: 0, active_couriers: 0, avg_order_value: 0, created_at: new Date().toISOString() }, ...prev];
        });
        setTimeout(fetchData, 5000);
      }
    } catch (e: any) { setError(e.message); }
    finally { setGenerating(false); }
  }

  function fmt(n: number) { return n.toLocaleString("ar-SA"); }
  function monthLabel(m: string) {
    const [y, mo] = m.split("-");
    return `${MONTH_NAMES[mo] || mo} ${y}`;
  }

  const latest = reports[0];
  const prev = reports[1];

  return (
    <div dir="rtl" style={{ padding: "1.5rem", fontFamily: "var(--con-font-arabic)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--con-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={18} style={{ color: "var(--con-accent)" }} /> التقارير المالية الشهرية
          </h1>
          <p style={{ fontSize: 12, color: "var(--con-text-muted)", margin: "4px 0 0" }}>توليد ومراجعة التقارير المالية الشهرية التلقائية</p>
        </div>
        <button onClick={fetchData} disabled={loading} className="con-btn con-btn-ghost" style={{ gap: 6 }}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> تحديث
        </button>
      </div>

      {/* Generate Section */}
      <div className="con-card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--con-text-secondary)", marginBottom: 12 }}>توليد تقرير جديد</div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <input type="month" className="con-input" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ width: 160 }} />
          <button onClick={generateReport} disabled={generating} className="con-btn con-btn-primary" style={{ gap: 6 }}>
            {generating ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
            {generating ? "جاري التوليد..." : "توليد التقرير"}
          </button>
          <span style={{ fontSize: 11, color: "var(--con-text-muted)" }}>سيتم تشغيل Lambda التوليد التلقائي</span>
        </div>
      </div>

      {/* Latest Report Highlight */}
      {latest && latest.status === "ready" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {[
            { label: "إجمالي الإيرادات", value: `${fmt(latest.total_revenue)} ر.س`, color: "var(--con-success)", sub: prev ? (latest.total_revenue - prev.total_revenue > 0 ? `+${fmt(latest.total_revenue - prev.total_revenue)} عن الشهر السابق` : `${fmt(latest.total_revenue - prev.total_revenue)} عن الشهر السابق`) : undefined },
            { label: "صافي الربح", value: `${fmt(latest.net_profit)} ر.س`, color: "var(--con-accent)", sub: `هامش ${Math.round((latest.net_profit / latest.total_revenue) * 100)}%` },
            { label: "إجمالي الطلبات", value: fmt(latest.total_orders), color: "var(--con-text-primary)", sub: `متوسط قيمة ${fmt(latest.avg_order_value)} ر.س` },
            { label: "المناديب النشطون", value: latest.active_couriers, color: "var(--con-info)", sub: monthLabel(latest.month) },
          ].map(s => (
            <div key={s.label} className="con-card" style={{ padding: "1rem" }}>
              <div style={{ fontSize: 10, color: "var(--con-text-muted)", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
              {s.sub && <div style={{ fontSize: 10, color: "var(--con-text-muted)", marginTop: 2 }}>{s.sub}</div>}
            </div>
          ))}
        </div>
      )}

      {error && <div className="con-card" style={{ padding: "1rem", color: "var(--con-danger)", display: "flex", gap: 8, marginBottom: "1rem" }}><AlertCircle size={16} />{error}</div>}

      {/* Reports Table */}
      <div className="con-card" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--con-border-default)" }}>
              {["الشهر", "الإيرادات", "المصروفات", "الدفعات", "الصافي", "الطلبات", "المناديب", "الحالة", ""].map(h => (
                <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "right", fontSize: 11, fontWeight: 600, color: "var(--con-text-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding: "3rem", textAlign: "center", color: "var(--con-text-muted)" }}>
                <RefreshCw size={20} className="animate-spin" style={{ margin: "0 auto 8px", display: "block" }} /> جاري التحميل...
              </td></tr>
            ) : reports.map((r, idx) => {
              const sm = STATUS_MAP[r.status];
              const prevReport = reports[idx + 1];
              const revChange = prevReport ? ((r.total_revenue - prevReport.total_revenue) / prevReport.total_revenue * 100) : null;
              return (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--con-border-subtle)", cursor: "pointer" }} onClick={() => setSelected(r)}>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--con-text-primary)" }}>{monthLabel(r.month)}</div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ fontSize: 12, color: "var(--con-success)", fontWeight: 500 }}>{r.total_revenue ? `${fmt(r.total_revenue)} ر.س` : "—"}</div>
                    {revChange !== null && (
                      <div style={{ fontSize: 10, color: revChange >= 0 ? "var(--con-success)" : "var(--con-danger)", display: "flex", alignItems: "center", gap: 2 }}>
                        {revChange >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                        {Math.abs(revChange).toFixed(1)}%
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: 12, color: "var(--con-danger)" }}>{r.total_expenses ? `${fmt(r.total_expenses)} ر.س` : "—"}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: 12, color: "var(--con-warning)" }}>{r.total_payouts ? `${fmt(r.total_payouts)} ر.س` : "—"}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: 12, fontWeight: 600, color: r.net_profit >= 0 ? "var(--con-success)" : "var(--con-danger)" }}>
                    {r.net_profit ? `${fmt(r.net_profit)} ر.س` : "—"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: 12, color: "var(--con-text-secondary)" }}>{r.total_orders ? fmt(r.total_orders) : "—"}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: 12, color: "var(--con-text-secondary)" }}>{r.active_couriers || "—"}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span className={`con-badge ${sm.cls}`}>{sm.label}</span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    {r.status === "ready" && r.pdf_url && (
                      <a href={r.pdf_url} target="_blank" rel="noreferrer" className="con-btn con-btn-ghost" style={{ padding: "4px 8px", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4 }} onClick={e => e.stopPropagation()}>
                        <Download size={12} /> PDF
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
