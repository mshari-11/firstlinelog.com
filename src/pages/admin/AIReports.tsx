import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Search, RefreshCw, CheckCircle2, Clock, AlertCircle, FileText, BarChart3, LayoutDashboard, Lightbulb, Eye, Loader2 } from "lucide-react";
import { API_BASE } from "@/lib/api";

const AI_API = "https://51n1gng40f.execute-api.me-south-1.amazonaws.com";

type ReportStatus = "ready" | "processing" | "failed";
type ReportType = "financial" | "operational" | "performance";
interface AIReport { id: string; title: string; type: ReportType; date: string; status: ReportStatus; recommendations: number; }

const STATUS: Record<ReportStatus, { label: string; cls: string; icon: JSX.Element }> = {
  ready: { label: "جاهز", cls: "con-badge-success", icon: <CheckCircle2 size={12} /> },
  processing: { label: "قيد المعالجة", cls: "con-badge-warning", icon: <Loader2 size={12} /> },
  failed: { label: "فشل", cls: "con-badge-danger", icon: <AlertCircle size={12} /> },
};

const TYPE_LABELS: Record<ReportType, string> = { financial: "مالي", operational: "تشغيلي", performance: "أداء" };

const MOCK: AIReport[] = [
  { id: "AI-001", title: "تحليل الإيرادات الشهرية", type: "financial", date: "2026-03-21", status: "ready", recommendations: 5 },
  { id: "AI-002", title: "تقرير كفاءة التوصيل", type: "operational", date: "2026-03-20", status: "ready", recommendations: 3 },
  { id: "AI-003", title: "تقييم أداء السائقين", type: "performance", date: "2026-03-19", status: "ready", recommendations: 7 },
  { id: "AI-004", title: "توقعات الطلب للربع القادم", type: "financial", date: "2026-03-21", status: "processing", recommendations: 0 },
  { id: "AI-005", title: "تحليل مسارات التوصيل", type: "operational", date: "2026-03-18", status: "ready", recommendations: 4 },
];

export default function AIReports() {
  const navigate = useNavigate();
  const [data, setData] = useState<AIReport[]>(MOCK);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ReportType | "all">("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);
  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`${AI_API}/runs`);
      if (res.ok) { const d = await res.json(); if (Array.isArray(d) && d.length) setData(d); }
    } catch { /* keep mock */ }
    setLoading(false);
  }

  const filtered = data.filter(a => {
    const matchSearch = a.title.includes(search) || a.id.includes(search);
    const matchFilter = typeFilter === "all" || a.type === typeFilter;
    return matchSearch && matchFilter;
  });

  const readyCount = data.filter(r => r.status === "ready").length;
  const processingCount = data.filter(r => r.status === "processing").length;
  const thisMonth = data.length;
  const totalRecommendations = data.reduce((s, r) => s + r.recommendations, 0);

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ background: "rgba(59,130,246,0.12)", borderRadius: 8, padding: 7, display: "flex", alignItems: "center", justifyContent: "center" }}><Brain size={18} style={{ color: "var(--con-brand)" }} /></div>
            <h1 style={{ fontSize: "var(--con-text-page-title)", fontWeight: 700, color: "var(--con-text-primary)", margin: 0 }}>تقارير الذكاء الاصطناعي</h1>
          </div>
          <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)", margin: 0, paddingRight: 44 }}>تقارير وتحليلات مولدة بالذكاء الاصطناعي</p>
        </div>
        <button className="con-btn-ghost" onClick={fetchData} disabled={loading}><RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /> تحديث</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "تقارير جاهزة", value: readyCount, icon: CheckCircle2, accent: "var(--con-success)", onClick: () => navigate("/admin-panel/ai-finance") },
          { label: "قيد المعالجة", value: processingCount, icon: Clock, accent: "var(--con-warning)", onClick: () => {} },
          { label: "هذا الشهر", value: thisMonth, icon: BarChart3, accent: "var(--con-brand)", onClick: () => navigate("/admin-panel/dashboard") },
          { label: "التوصيات", value: totalRecommendations, icon: Lightbulb, accent: "#f59e0b", onClick: () => navigate("/admin-panel/reports") },
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
          <Search size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--con-text-muted)", pointerEvents: "none" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالعنوان..." className="con-input" style={{ paddingRight: 32, width: "100%" }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "financial", "operational", "performance"] as const).map(s => (
            <button key={s} onClick={() => setTypeFilter(s)} style={{ padding: "4px 12px", borderRadius: 6, fontSize: "var(--con-text-caption)", fontWeight: 500, border: "1px solid", cursor: "pointer", background: typeFilter === s ? "var(--con-brand)" : "transparent", borderColor: typeFilter === s ? "var(--con-brand)" : "var(--con-border-strong)", color: typeFilter === s ? "#fff" : "var(--con-text-muted)" }}>
              {s === "all" ? "الكل" : TYPE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--con-bg-surface-1)", border: "1px solid var(--con-border-default)", borderRadius: 10, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div className="con-empty"><AlertCircle size={32} style={{ opacity: 0.25, marginBottom: 10 }} /><div>لا توجد تقارير مطابقة</div></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="con-table">
              <thead><tr><th>التقرير</th><th>النوع</th><th>التاريخ</th><th>الحالة</th><th>التوصيات</th><th>إجراء</th></tr></thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td><span style={{ fontWeight: 600 }}>{a.title}</span></td>
                    <td><span className={`con-badge con-badge-sm ${a.type === "financial" ? "con-badge-info" : a.type === "operational" ? "con-badge-warning" : "con-badge-success"}`}>{TYPE_LABELS[a.type]}</span></td>
                    <td>{a.date}</td>
                    <td><span className={`con-badge con-badge-sm ${STATUS[a.status].cls}`}>{STATUS[a.status].icon} {STATUS[a.status].label}</span></td>
                    <td><span style={{ fontFamily: "var(--con-font-mono)", fontWeight: 600 }}>{a.recommendations}</span></td>
                    <td>
                      {a.status === "ready" ? (
                        <button className="con-btn-ghost" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => navigate("/admin-panel/reports")}><Eye size={12} /> عرض</button>
                      ) : <span style={{ fontSize: 11, color: "var(--con-text-muted)" }}>قيد المعالجة</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
