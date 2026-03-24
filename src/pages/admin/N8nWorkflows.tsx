/**
 * صفحة مراقبة سير العمل — n8n Workflow Monitoring
 * عرض سجلات n8n_workflow_logs والمصادر الخارجية
 */
import { useState, useEffect, useCallback } from "react";
import { Search, RefreshCw, AlertCircle, CheckCircle2, XCircle, Clock, Zap, Database } from "lucide-react";
import { supabase } from "@/lib/supabase";

type WorkflowStatus = "success" | "error" | "running" | "pending";
type SourceStatus = "active" | "inactive" | "error";

interface WorkflowLog {
  id: string;
  workflow_id: string;
  workflow_name: string;
  trigger_type: string;
  status: WorkflowStatus;
  input_summary?: any;
  output_summary?: any;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

interface ExternalSource {
  id: string;
  source_name: string;
  source_type: string;
  config?: any;
  last_sync_at?: string;
  status: SourceStatus;
  created_at: string;
}

const WF_STATUS: Record<WorkflowStatus, { label: string; cls: string; icon: JSX.Element }> = {
  success: { label: "نجح",     cls: "con-badge-success", icon: <CheckCircle2 size={11} /> },
  error:   { label: "خطأ",     cls: "con-badge-danger",  icon: <XCircle size={11} /> },
  running: { label: "يعمل",    cls: "con-badge-info",    icon: <RefreshCw size={11} /> },
  pending: { label: "انتظار",  cls: "con-badge-warning", icon: <Clock size={11} /> },
};

const SRC_STATUS: Record<SourceStatus, { label: string; cls: string }> = {
  active:   { label: "نشط", cls: "con-badge-success" },
  inactive: { label: "غير نشط", cls: "con-badge-warning" },
  error:    { label: "خطأ", cls: "con-badge-danger" },
};

export default function N8nWorkflows() {
  const [logs, setLogs] = useState<WorkflowLog[]>([]);
  const [sources, setSources] = useState<ExternalSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<WorkflowStatus | "all">("all");
  const [tab, setTab] = useState<"logs" | "sources">("logs");
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (!supabase) throw new Error("Supabase غير متاح");
      const [logsRes, srcRes] = await Promise.all([
        supabase.from("n8n_workflow_logs").select("*").order("started_at", { ascending: false }).limit(200),
        supabase.from("n8n_external_sources").select("*").order("created_at", { ascending: false }),
      ]);
      if (logsRes.error) throw logsRes.error;
      if (srcRes.error) throw srcRes.error;
      setLogs(logsRes.data || []);
      setSources(srcRes.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredLogs = logs.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.workflow_name?.toLowerCase().includes(q) || l.workflow_id?.includes(q);
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.status === "success").length,
    error: logs.filter(l => l.status === "error").length,
    running: logs.filter(l => l.status === "running").length,
  };

  function duration(log: WorkflowLog) {
    if (!log.completed_at) return "—";
    const ms = new Date(log.completed_at).getTime() - new Date(log.started_at).getTime();
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  }

  return (
    <div dir="rtl" style={{ padding: "1.5rem", fontFamily: "var(--con-font-arabic)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--con-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Zap size={18} style={{ color: "var(--con-accent)" }} /> مراقبة سير العمل (n8n)
          </h1>
          <p style={{ fontSize: 12, color: "var(--con-text-muted)", margin: "4px 0 0" }}>سجلات تنفيذ سير العمل التلقائي والمصادر الخارجية</p>
        </div>
        <button onClick={fetchData} disabled={loading} className="con-btn con-btn-ghost" style={{ gap: 6 }}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> تحديث
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { label: "الكل", value: stats.total, color: "var(--con-text-secondary)" },
          { label: "نجح", value: stats.success, color: "var(--con-success)" },
          { label: "خطأ", value: stats.error, color: "var(--con-danger)" },
          { label: "يعمل", value: stats.running, color: "var(--con-info)" },
        ].map(s => (
          <div key={s.label} className="con-card" style={{ padding: "0.75rem", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--con-text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", borderBottom: "1px solid var(--con-border-default)", paddingBottom: "0.5rem" }}>
        {[{ id: "logs", label: "سجلات التنفيذ" }, { id: "sources", label: "المصادر الخارجية" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} className="con-btn" style={{
            background: tab === t.id ? "var(--con-accent)" : "transparent",
            color: tab === t.id ? "#fff" : "var(--con-text-muted)",
            border: tab === t.id ? "none" : "1px solid var(--con-border-default)",
            fontSize: 12,
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "logs" && (
        <>
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--con-text-muted)" }} />
              <input className="con-input" placeholder="بحث باسم سير العمل..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingRight: 30, width: "100%" }} />
            </div>
            <select className="con-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} style={{ width: 120 }}>
              <option value="all">الكل</option>
              {Object.entries(WF_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          {error && <div className="con-card" style={{ padding: "1rem", color: "var(--con-danger)", display: "flex", gap: 8, marginBottom: "1rem" }}><AlertCircle size={16} />{error}</div>}

          <div className="con-card" style={{ overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--con-text-muted)" }}>
                <RefreshCw size={20} className="animate-spin" style={{ margin: "0 auto 8px", display: "block" }} /> جاري التحميل...
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--con-border-default)" }}>
                    {["اسم سير العمل", "نوع المشغل", "الحالة", "المدة", "وقت البدء", "تفاصيل"].map(h => (
                      <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "right", fontSize: 11, fontWeight: 600, color: "var(--con-text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--con-text-muted)", fontSize: 13 }}>لا توجد سجلات</td></tr>
                  ) : filteredLogs.map(log => {
                    const sm = WF_STATUS[log.status] || WF_STATUS.pending;
                    return (
                      <>
                        <tr key={log.id} style={{ borderBottom: "1px solid var(--con-border-subtle)", cursor: "pointer" }} onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                          <td style={{ padding: "0.75rem 1rem" }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--con-text-primary)" }}>{log.workflow_name || "—"}</div>
                            <div style={{ fontSize: 10, color: "var(--con-text-muted)", fontFamily: "var(--con-font-mono)" }}>{log.workflow_id}</div>
                          </td>
                          <td style={{ padding: "0.75rem 1rem", fontSize: 12, color: "var(--con-text-secondary)" }}>{log.trigger_type || "—"}</td>
                          <td style={{ padding: "0.75rem 1rem" }}>
                            <span className={`con-badge ${sm.cls}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{sm.icon}{sm.label}</span>
                          </td>
                          <td style={{ padding: "0.75rem 1rem", fontSize: 12, color: "var(--con-text-secondary)", fontFamily: "var(--con-font-mono)" }}>{duration(log)}</td>
                          <td style={{ padding: "0.75rem 1rem", fontSize: 11, color: "var(--con-text-muted)" }}>{new Date(log.started_at).toLocaleString("ar-SA")}</td>
                          <td style={{ padding: "0.75rem 1rem", fontSize: 11, color: "var(--con-accent)" }}>{expanded === log.id ? "إخفاء ▲" : "عرض ▼"}</td>
                        </tr>
                        {expanded === log.id && (
                          <tr key={`${log.id}-exp`}>
                            <td colSpan={6} style={{ padding: "0 1rem 0.75rem", background: "var(--con-bg-surface-2)" }}>
                              {log.error_message && (
                                <div style={{ color: "var(--con-danger)", fontSize: 12, padding: "0.5rem 0", fontFamily: "var(--con-font-mono)" }}>
                                  <strong>خطأ: </strong>{log.error_message}
                                </div>
                              )}
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                {log.input_summary && (
                                  <div>
                                    <div style={{ fontSize: 11, color: "var(--con-text-muted)", marginBottom: 4 }}>المدخلات</div>
                                    <pre style={{ fontSize: 10, color: "var(--con-text-secondary)", margin: 0, overflow: "auto", maxHeight: 100 }}>
                                      {JSON.stringify(log.input_summary, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.output_summary && (
                                  <div>
                                    <div style={{ fontSize: 11, color: "var(--con-text-muted)", marginBottom: 4 }}>المخرجات</div>
                                    <pre style={{ fontSize: 10, color: "var(--con-text-secondary)", margin: 0, overflow: "auto", maxHeight: 100 }}>
                                      {JSON.stringify(log.output_summary, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tab === "sources" && (
        <div className="con-card" style={{ overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--con-text-muted)" }}>
              <RefreshCw size={20} className="animate-spin" style={{ margin: "0 auto 8px", display: "block" }} /> جاري التحميل...
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--con-border-default)" }}>
                  {["اسم المصدر", "النوع", "الحالة", "آخر مزامنة", "تاريخ الإضافة"].map(h => (
                    <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "right", fontSize: 11, fontWeight: 600, color: "var(--con-text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sources.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--con-text-muted)", fontSize: 13 }}>لا توجد مصادر خارجية</td></tr>
                ) : sources.map(src => {
                  const sm = SRC_STATUS[src.status] || SRC_STATUS.inactive;
                  return (
                    <tr key={src.id} style={{ borderBottom: "1px solid var(--con-border-subtle)" }}>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Database size={13} style={{ color: "var(--con-accent)" }} />
                          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--con-text-primary)" }}>{src.source_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", fontSize: 12, color: "var(--con-text-secondary)" }}>{src.source_type}</td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span className={`con-badge ${sm.cls}`}>{sm.label}</span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", fontSize: 11, color: "var(--con-text-muted)" }}>
                        {src.last_sync_at ? new Date(src.last_sync_at).toLocaleString("ar-SA") : "لم تتم"}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", fontSize: 11, color: "var(--con-text-muted)" }}>{new Date(src.created_at).toLocaleDateString("ar-SA")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
