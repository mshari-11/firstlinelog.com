import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, Search, RefreshCw, CheckCircle2, XCircle, AlertCircle, Clock, Settings, FileText, AlertTriangle, Eye, ToggleLeft, ToggleRight, Download, Printer, Plus, X } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { toast } from "sonner";

function downloadCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(","), ...rows.map(r => keys.map(k => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
}

type RuleStatus = "active" | "disabled";
type RiskType = "fraud" | "limit_exceed" | "suspicious";
interface RiskRule { id: string; name: string; type: RiskType; threshold: string; status: RuleStatus; lastRun: string; }

const STATUS: Record<RuleStatus, { label: string; cls: string; icon: JSX.Element }> = {
  active: { label: "نشطة", cls: "con-badge-success", icon: <CheckCircle2 size={12} /> },
  disabled: { label: "معطلة", cls: "con-badge-warning", icon: <XCircle size={12} /> },
};

const TYPE_LABELS: Record<RiskType, string> = { fraud: "احتيال", limit_exceed: "تجاوز حد", suspicious: "نشاط مشبوه" };

const MOCK: RiskRule[] = [
  { id: "RSK-001", name: "كشف المعاملات المكررة", type: "fraud", threshold: "> 3 معاملات/دقيقة", status: "active", lastRun: "2026-03-21T08:00:00Z" },
  { id: "RSK-002", name: "تجاوز حد السحب اليومي", type: "limit_exceed", threshold: "> 50,000 ر.س", status: "active", lastRun: "2026-03-21T07:30:00Z" },
  { id: "RSK-003", name: "تسجيل دخول من موقع غريب", type: "suspicious", threshold: "IP غير معروف", status: "active", lastRun: "2026-03-21T06:00:00Z" },
  { id: "RSK-004", name: "تغيير بيانات الحساب البنكي", type: "fraud", threshold: "> مرة/أسبوع", status: "disabled", lastRun: "2026-03-20T12:00:00Z" },
  { id: "RSK-005", name: "طلبات مرتجعة متكررة", type: "suspicious", threshold: "> 5 مرتجعات/يوم", status: "active", lastRun: "2026-03-21T09:00:00Z" },
];

export default function RiskManagement() {
  const navigate = useNavigate();
  const [data, setData] = useState<RiskRule[]>(MOCK);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RuleStatus | "all">("all");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [ruleForm, setRuleForm] = useState({ name: "", type: "fraud" as RiskType, threshold: "", status: "active" as RuleStatus });

  useEffect(() => { fetchData(); }, []);
  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/risk-thresholds`);
      if (res.ok) { const d = await res.json(); if (Array.isArray(d) && d.length) setData(d); }
    } catch { /* keep mock */ }
    setLoading(false);
  }

  const filtered = data.filter(a => {
    const matchSearch = a.name.includes(search) || a.id.includes(search) || TYPE_LABELS[a.type].includes(search);
    const matchFilter = filter === "all" || a.status === filter;
    return matchSearch && matchFilter;
  });

  const activeRules = data.filter(r => r.status === "active").length;
  const todayAlerts = 3;
  const suspiciousCases = data.filter(r => r.type === "suspicious").length;
  const disabledRules = data.filter(r => r.status === "disabled").length;

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ background: "rgba(59,130,246,0.12)", borderRadius: 8, padding: 7, display: "flex", alignItems: "center", justifyContent: "center" }}><ShieldAlert size={18} style={{ color: "var(--con-brand)" }} /></div>
            <h1 style={{ fontSize: "var(--con-text-page-title)", fontWeight: 700, color: "var(--con-text-primary)", margin: 0 }}>إدارة المخاطر</h1>
          </div>
          <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)", margin: 0, paddingRight: 44 }}>قواعد الكشف عن المخاطر والتنبيهات</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="con-btn-primary" onClick={() => setShowModal(true)}><Plus size={14} /> قاعدة جديدة</button>
          <button className="con-btn-ghost" onClick={() => downloadCSV(filtered.map(r => ({ الرقم: r.id, القاعدة: r.name, النوع: TYPE_LABELS[r.type], الحد: r.threshold, الحالة: STATUS[r.status].label, آخر_تشغيل: r.lastRun })), "risk-rules.csv")}><Download size={14} /> تصدير CSV</button>
          <button className="con-btn-ghost" onClick={() => window.print()}><Printer size={14} /> طباعة</button>
          <button className="con-btn-ghost" onClick={fetchData} disabled={loading}><RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /> تحديث</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "قواعد نشطة", value: activeRules, icon: CheckCircle2, accent: "var(--con-success)", onClick: () => navigate("/admin-panel/audit-log") },
          { label: "تنبيهات اليوم", value: todayAlerts, icon: AlertTriangle, accent: "var(--con-warning)", onClick: () => navigate("/admin-panel/finance") },
          { label: "حالات مشبوهة", value: suspiciousCases, icon: ShieldAlert, accent: "var(--con-danger)", onClick: () => {} },
          { label: "قواعد معطلة", value: disabledRules, icon: XCircle, accent: "var(--con-text-muted)", onClick: () => navigate("/admin-panel/settings") },
        ].map(k => (
          <div key={k.label} className="con-kpi-card" onClick={k.onClick} style={{ cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>{k.label}</span>
              <k.icon size={14} style={{ color: k.accent }} />
            </div>
            <div className="con-kpi-value" style={{ fontSize: 26, color: k.accent }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="con-toolbar" style={{ flexWrap: "wrap", gap: 10 }}>
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
          <Search size={14} style={{ position: "absolute", insetInlineEnd: 10, top: "50%", transform: "translateY(-50%)", color: "var(--con-text-muted)", pointerEvents: "none" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالقاعدة أو النوع..." className="con-input" style={{ paddingInlineEnd: 32, width: "100%" }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "active", "disabled"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: "4px 12px", borderRadius: 6, fontSize: "var(--con-text-caption)", fontWeight: 500, border: "1px solid", cursor: "pointer", background: filter === s ? "var(--con-brand)" : "transparent", borderColor: filter === s ? "var(--con-brand)" : "var(--con-border-strong)", color: filter === s ? "#fff" : "var(--con-text-muted)" }}>
              {s === "all" ? "الكل" : STATUS[s].label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--con-bg-surface-1)", border: "1px solid var(--con-border-default)", borderRadius: 10, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div className="con-empty"><AlertCircle size={32} style={{ opacity: 0.25, marginBottom: 10 }} /><div>لا توجد قواعد مطابقة</div></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="con-table">
              <thead><tr><th>القاعدة</th><th>النوع</th><th>الحد</th><th>الحالة</th><th>آخر تشغيل</th><th>إجراء</th></tr></thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td><span style={{ fontWeight: 600 }}>{a.name}</span></td>
                    <td><span className={`con-badge con-badge-sm ${a.type === "fraud" ? "con-badge-danger" : a.type === "limit_exceed" ? "con-badge-warning" : "con-badge-info"}`}>{TYPE_LABELS[a.type]}</span></td>
                    <td><span style={{ fontFamily: "var(--con-font-mono)", fontSize: 12 }}>{a.threshold}</span></td>
                    <td><span className={`con-badge con-badge-sm ${STATUS[a.status].cls}`}>{STATUS[a.status].icon} {STATUS[a.status].label}</span></td>
                    <td><span style={{ fontFamily: "var(--con-font-mono)", fontSize: 12 }}>{new Date(a.lastRun).toLocaleString("ar-SA")}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        <button className="con-btn-ghost" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => { setData(prev => prev.map(r => r.id === a.id ? { ...r, status: r.status === "active" ? "disabled" as RuleStatus : "active" as RuleStatus } : r)); toast.success(a.status === "active" ? "تم تعطيل القاعدة" : "تم تفعيل القاعدة"); }}>{a.status === "active" ? <ToggleRight size={16} style={{ color: "var(--con-success)" }} /> : <ToggleLeft size={16} style={{ color: "var(--con-text-muted)" }} />}</button>
                        <button className="con-btn-ghost" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => navigate("/admin-panel/audit-log")}><Eye size={12} /> سجل</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <div style={{ background: "var(--con-bg-surface-1)", borderRadius: 12, padding: 24, width: "90%", maxWidth: 450, border: "1px solid var(--con-border-default)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--con-text-primary)" }}>قاعدة جديدة</h2>
              <button className="con-btn-ghost" onClick={() => setShowModal(false)} style={{ padding: 4 }}><X size={16} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input className="con-input" placeholder="اسم القاعدة" value={ruleForm.name} onChange={e => setRuleForm(f => ({ ...f, name: e.target.value }))} style={{ width: "100%" }} />
              <select className="con-input" value={ruleForm.type} onChange={e => setRuleForm(f => ({ ...f, type: e.target.value as RiskType }))} style={{ width: "100%" }}>
                <option value="fraud">احتيال</option>
                <option value="limit_exceed">تجاوز حد</option>
                <option value="suspicious">نشاط مشبوه</option>
              </select>
              <input className="con-input" placeholder="الحد (مثال: > 5 معاملات/يوم)" value={ruleForm.threshold} onChange={e => setRuleForm(f => ({ ...f, threshold: e.target.value }))} style={{ width: "100%" }} />
              <select className="con-input" value={ruleForm.status} onChange={e => setRuleForm(f => ({ ...f, status: e.target.value as RuleStatus }))} style={{ width: "100%" }}>
                <option value="active">نشطة</option>
                <option value="disabled">معطلة</option>
              </select>
              <button className="con-btn-primary" disabled={!ruleForm.name || !ruleForm.threshold} onClick={() => { const newRule: RiskRule = { id: `RSK-${String(data.length + 1).padStart(3, "0")}`, name: ruleForm.name, type: ruleForm.type, threshold: ruleForm.threshold, status: ruleForm.status, lastRun: new Date().toISOString() }; setData(prev => [newRule, ...prev]); setRuleForm({ name: "", type: "fraud", threshold: "", status: "active" }); setShowModal(false); toast.success("تم إضافة القاعدة"); }} style={{ marginTop: 8 }}><Plus size={14} /> إضافة</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
