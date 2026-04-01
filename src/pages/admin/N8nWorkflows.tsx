/**
 * صفحة مراقبة سير العمل — n8n Workflow Monitoring
 * عرض سجلات n8n_workflow_logs والمصادر الخارجية
 */
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Database,
  Download,
  Printer,
  Play,
  Plus,
  X,
  Save,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Globe,
  Bell,
  Mail,
  Truck,
  FileText,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
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

const WF_STATUS: Record<
  WorkflowStatus,
  { label: string; cls: string; icon: JSX.Element }
> = {
  success: {
    label: "نجح",
    cls: "con-badge-success",
    icon: <CheckCircle2 size={11} />,
  },
  error: { label: "خطأ", cls: "con-badge-danger", icon: <XCircle size={11} /> },
  running: {
    label: "يعمل",
    cls: "con-badge-info",
    icon: <RefreshCw size={11} />,
  },
  pending: {
    label: "انتظار",
    cls: "con-badge-warning",
    icon: <Clock size={11} />,
  },
};

const SRC_STATUS: Record<SourceStatus, { label: string; cls: string }> = {
  active: { label: "نشط", cls: "con-badge-success" },
  inactive: { label: "غير نشط", cls: "con-badge-warning" },
  error: { label: "خطأ", cls: "con-badge-danger" },
};

export default function N8nWorkflows() {
  const [logs, setLogs] = useState<WorkflowLog[]>([]);
  const [sources, setSources] = useState<ExternalSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<WorkflowStatus | "all">(
    "all",
  );
  const [tab, setTab] = useState<"logs" | "sources">("logs");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [srcName, setSrcName] = useState("");
  const [srcType, setSrcType] = useState("webhook");
  const [srcUrl, setSrcUrl] = useState("");
  const [srcStatus, setSrcStatus] = useState<SourceStatus>("active");
  const [showGuide, setShowGuide] = useState(true);

  function handleAddSource() {
    if (!srcName.trim()) {
      toast.error("يرجى كتابة اسم المصدر");
      return;
    }
    const s: ExternalSource = {
      id: `src-${Date.now()}`,
      source_name: srcName,
      source_type: srcType,
      config: srcUrl ? { url: srcUrl } : undefined,
      status: srcStatus,
      created_at: new Date().toISOString(),
    };
    setSources((prev) => [s, ...prev]);
    setShowAddModal(false);
    setSrcName("");
    setSrcType("webhook");
    setSrcUrl("");
    setSrcStatus("active");
    toast.success("تم إضافة المصدر بنجاح");
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!supabase) throw new Error("Supabase غير متاح");
      const [logsRes, srcRes] = await Promise.all([
        supabase
          .from("n8n_workflow_logs")
          .select("*")
          .order("started_at", { ascending: false })
          .limit(200),
        supabase
          .from("n8n_external_sources")
          .select("*")
          .order("created_at", { ascending: false }),
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredLogs = logs.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      l.workflow_name?.toLowerCase().includes(q) ||
      l.workflow_id?.includes(q);
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: logs.length,
    success: logs.filter((l) => l.status === "success").length,
    error: logs.filter((l) => l.status === "error").length,
    running: logs.filter((l) => l.status === "running").length,
  };

  function duration(log: WorkflowLog) {
    if (!log.completed_at) return "—";
    const ms =
      new Date(log.completed_at).getTime() - new Date(log.started_at).getTime();
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  }

  return (
    <div
      dir="rtl"
      style={{ padding: "1.5rem", fontFamily: "var(--con-font-arabic)" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--con-text-primary)",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Zap size={18} style={{ color: "var(--con-accent)" }} /> مراقبة سير
            العمل (n8n)
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "var(--con-text-muted)",
              margin: "4px 0 0",
            }}
          >
            سجلات تنفيذ سير العمل التلقائي والمصادر الخارجية
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button
            onClick={() => setShowAddModal(true)}
            className="con-btn con-btn-primary"
            style={{ gap: 6 }}
            title="إضافة مصدر بيانات خارجي جديد (Webhook, Cron, أو يدوي) لاستقبال بيانات من أنظمة أخرى"
          >
            <Plus size={14} /> إضافة مصدر
          </button>
          <button
            onClick={() => {
              toast("جاري تشغيل سير العمل...");
            }}
            className="con-btn con-btn-primary"
            style={{ gap: 6 }}
            title="تشغيل سير عمل يدوياً — يبدأ تنفيذ سير العمل المحدد فوراً بدون انتظار المؤقت أو الـ Webhook"
          >
            <Play size={14} /> تشغيل سير عمل
          </button>
          <button
            onClick={() => {
              if (!filteredLogs.length) return;
              const headers = [
                "workflow_name",
                "workflow_id",
                "trigger_type",
                "status",
                "started_at",
                "completed_at",
              ];
              const csv = [
                headers.join(","),
                ...filteredLogs.map((r) =>
                  headers.map((h) => `"${(r as any)[h] ?? ""}"`).join(","),
                ),
              ].join("\n");
              const blob = new Blob(["\uFEFF" + csv], {
                type: "text/csv;charset=utf-8",
              });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = "n8n_logs.csv";
              a.click();
            }}
            className="con-btn con-btn-ghost"
            style={{ gap: 6 }}
            title="تصدير جميع سجلات التنفيذ المعروضة إلى ملف CSV — يمكن فتحه بـ Excel لتحليل الأخطاء والأداء"
          >
            <Download size={14} /> تصدير CSV
          </button>
          <button
            onClick={() => window.print()}
            className="con-btn con-btn-ghost"
            style={{ gap: 6 }}
            title="طباعة الصفحة الحالية — يُظهر سجلات التنفيذ بتنسيق مناسب للطباعة"
          >
            <Printer size={14} /> طباعة
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="con-btn con-btn-ghost"
            style={{ gap: 6 }}
            title="تحديث البيانات — يجلب آخر سجلات التنفيذ والمصادر من قاعدة البيانات"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />{" "}
            تحديث
          </button>
        </div>
      </div>

      {/* Guide Section */}
      <div
        className="con-card"
        style={{ marginBottom: "1.5rem", overflow: "hidden" }}
      >
        <div
          onClick={() => setShowGuide(!showGuide)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1rem",
            cursor: "pointer",
            background: "var(--con-bg-surface-2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BookOpen size={16} style={{ color: "var(--con-accent)" }} />
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--con-text-primary)",
              }}
            >
              دليل سير العمل والتكاملات
            </span>
          </div>
          {showGuide ? (
            <ChevronUp size={16} style={{ color: "var(--con-text-muted)" }} />
          ) : (
            <ChevronDown size={16} style={{ color: "var(--con-text-muted)" }} />
          )}
        </div>
        {showGuide && (
          <div
            style={{
              padding: "1rem 1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            {/* Section A: ما هو n8n */}
            <div>
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--con-text-primary)",
                  margin: "0 0 6px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Zap size={14} style={{ color: "var(--con-accent)" }} /> ما هو
                n8n؟
              </h3>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--con-text-secondary)",
                  margin: 0,
                  lineHeight: 1.8,
                }}
              >
                n8n هو نظام أتمتة مفتوح المصدر يربط بين الخدمات المختلفة. يمكنك
                إنشاء سير عمل (Workflow) يتفاعل تلقائياً مع أحداث النظام.
              </p>
            </div>

            {/* Section B: أنواع المصادر الخارجية */}
            <div>
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--con-text-primary)",
                  margin: "0 0 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Database size={14} style={{ color: "var(--con-info)" }} />{" "}
                أنواع المصادر الخارجية
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  {
                    type: "Webhook",
                    desc: "رابط يستقبل بيانات من منصات خارجية (مثل: جاهز يرسل طلب جديد)",
                    icon: (
                      <Globe
                        size={13}
                        style={{ color: "var(--con-success)" }}
                      />
                    ),
                    badge: "con-badge-success",
                  },
                  {
                    type: "Cron",
                    desc: "مهام مجدولة تعمل تلقائياً (مثل: تقرير يومي كل صباح الساعة 8)",
                    icon: (
                      <Clock
                        size={13}
                        style={{ color: "var(--con-warning)" }}
                      />
                    ),
                    badge: "con-badge-warning",
                  },
                  {
                    type: "Manual",
                    desc: "يتم تشغيله يدوياً من لوحة التحكم",
                    icon: (
                      <Play size={13} style={{ color: "var(--con-info)" }} />
                    ),
                    badge: "con-badge-info",
                  },
                ].map((item) => (
                  <div
                    key={item.type}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      padding: "8px 10px",
                      borderRadius: 6,
                      background: "var(--con-bg-surface-2)",
                      border: "1px solid var(--con-border-subtle)",
                    }}
                  >
                    {item.icon}
                    <div style={{ flex: 1 }}>
                      <span
                        className={`con-badge ${item.badge}`}
                        style={{
                          fontSize: 10,
                          marginBottom: 4,
                          display: "inline-block",
                        }}
                      >
                        {item.type}
                      </span>
                      <p
                        style={{
                          fontSize: 12,
                          color: "var(--con-text-secondary)",
                          margin: "4px 0 0",
                          lineHeight: 1.6,
                        }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section C: أمثلة عملية */}
            <div>
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--con-text-primary)",
                  margin: "0 0 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <FileText
                  size={14}
                  style={{ color: "var(--con-brand, var(--con-accent))" }}
                />{" "}
                أمثلة عملية
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 10,
                }}
              >
                {[
                  {
                    title: "طلب جديد من جاهز",
                    type: "Webhook",
                    badge: "con-badge-success",
                    icon: (
                      <Truck
                        size={18}
                        style={{ color: "var(--con-success)" }}
                      />
                    ),
                    steps: ["يستقبل الطلب", "ينشئ سجل", "يرسل إشعار للسائق"],
                  },
                  {
                    title: "تقرير يومي تلقائي",
                    type: "Cron (8:00 صباحاً)",
                    badge: "con-badge-warning",
                    icon: (
                      <Mail size={18} style={{ color: "var(--con-warning)" }} />
                    ),
                    steps: [
                      "يجمع إحصائيات اليوم",
                      "يعالج البيانات",
                      "يرسل إيميل للإدارة",
                    ],
                  },
                  {
                    title: "تنبيه شكوى عاجلة",
                    type: "Webhook",
                    badge: "con-badge-success",
                    icon: (
                      <Bell size={18} style={{ color: "var(--con-danger)" }} />
                    ),
                    steps: ["شكوى أولوية عالية", "إشعار فوري", "تصعيد تلقائي"],
                  },
                  {
                    title: "مزامنة بيانات هنقرستيشن",
                    type: "Cron (كل ساعة)",
                    badge: "con-badge-warning",
                    icon: (
                      <RefreshCw
                        size={18}
                        style={{ color: "var(--con-info)" }}
                      />
                    ),
                    steps: ["يسحب الطلبات", "يعالج البيانات", "يحدث القاعدة"],
                  },
                  {
                    title: "إشعار انتهاء رخصة سائق",
                    type: "Cron (يومياً)",
                    badge: "con-badge-warning",
                    icon: (
                      <AlertCircle
                        size={18}
                        style={{ color: "var(--con-warning)" }}
                      />
                    ),
                    steps: [
                      "يفحص تواريخ الانتهاء",
                      "يحدد المنتهية",
                      "ينبّه HR",
                    ],
                  },
                  {
                    title: "تحديث حالة الطلب",
                    type: "Webhook",
                    badge: "con-badge-success",
                    icon: (
                      <Settings
                        size={18}
                        style={{ color: "var(--con-accent)" }}
                      />
                    ),
                    steps: [
                      "المنصة تحدث الحالة",
                      "يُحدَّث في النظام",
                      "يُرسل SMS",
                    ],
                  },
                ].map((ex, i) => (
                  <div
                    key={i}
                    className="con-card"
                    style={{
                      padding: "12px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      border: "1px solid var(--con-border-subtle)",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: "var(--con-bg-surface-2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {ex.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "var(--con-text-primary)",
                          }}
                        >
                          {ex.title}
                        </div>
                        <span
                          className={`con-badge ${ex.badge}`}
                          style={{ fontSize: 9, marginTop: 2 }}
                        >
                          {ex.type}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        flexWrap: "wrap",
                      }}
                    >
                      {ex.steps.map((step, si) => (
                        <span
                          key={si}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            color: "var(--con-text-secondary)",
                          }}
                        >
                          <span
                            style={{
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: "var(--con-bg-surface-2)",
                              border: "1px solid var(--con-border-subtle)",
                              fontSize: 10,
                            }}
                          >
                            {step}
                          </span>
                          {si < ex.steps.length - 1 && (
                            <span
                              style={{
                                color: "var(--con-text-muted)",
                                fontSize: 12,
                              }}
                            >
                              &larr;
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section D: كيف تضيف مصدر جديد */}
            <div>
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--con-text-primary)",
                  margin: "0 0 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Plus size={14} style={{ color: "var(--con-success)" }} /> كيف
                تضيف مصدر جديد؟
              </h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { num: 1, text: 'اضغط "إضافة مصدر"' },
                  { num: 2, text: "اختر النوع" },
                  { num: 3, text: "أدخل رابط Webhook أو جدولة Cron" },
                  { num: 4, text: "فعّل المصدر" },
                ].map((step) => (
                  <div
                    key={step.num}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 12px",
                      borderRadius: 6,
                      background: "var(--con-bg-surface-2)",
                      border: "1px solid var(--con-border-subtle)",
                    }}
                  >
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "var(--con-accent)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {step.num}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--con-text-secondary)",
                      }}
                    >
                      {step.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "0.75rem",
          marginBottom: "1.5rem",
        }}
      >
        {[
          {
            label: "الكل",
            value: stats.total,
            color: "var(--con-text-secondary)",
            tip: "إجمالي عدد عمليات التنفيذ المسجلة",
          },
          {
            label: "نجح",
            value: stats.success,
            color: "var(--con-success)",
            tip: "عمليات اكتملت بنجاح بدون أخطاء",
          },
          {
            label: "خطأ",
            value: stats.error,
            color: "var(--con-danger)",
            tip: "عمليات فشلت — اضغط لعرض تفاصيل الخطأ",
          },
          {
            label: "يعمل",
            value: stats.running,
            color: "var(--con-info)",
            tip: "عمليات قيد التنفيذ الآن",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="con-card"
            style={{
              padding: "0.75rem",
              textAlign: "center",
              cursor: "default",
            }}
            title={s.tip}
          >
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: "var(--con-text-muted)" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1rem",
          borderBottom: "1px solid var(--con-border-default)",
          paddingBottom: "0.5rem",
        }}
      >
        {[
          {
            id: "logs",
            label: "سجلات التنفيذ",
            tip: "عرض جميع عمليات التنفيذ السابقة مع حالتها ومدتها وتفاصيل الأخطاء",
          },
          {
            id: "sources",
            label: "المصادر الخارجية",
            tip: "إدارة مصادر البيانات الخارجية مثل Webhooks و APIs المتصلة بسير العمل",
          },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            title={t.tip}
            className="con-btn"
            style={{
              background: tab === t.id ? "var(--con-accent)" : "transparent",
              color: tab === t.id ? "#fff" : "var(--con-text-muted)",
              border:
                tab === t.id ? "none" : "1px solid var(--con-border-default)",
              fontSize: 12,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "logs" && (
        <>
          <div
            style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}
          >
            <div style={{ position: "relative", flex: 1 }}>
              <Search
                size={13}
                style={{
                  position: "absolute",
                  insetInlineEnd: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--con-text-muted)",
                }}
              />
              <input
                className="con-input"
                placeholder="بحث باسم سير العمل..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingInlineEnd: 30, width: "100%" }}
              />
            </div>
            <select
              className="con-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              style={{ width: 120 }}
            >
              <option value="all">الكل</option>
              {Object.entries(WF_STATUS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div
              className="con-card"
              style={{
                padding: "1rem",
                color: "var(--con-danger)",
                display: "flex",
                gap: 8,
                marginBottom: "1rem",
              }}
            >
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="con-card" style={{ overflow: "hidden" }}>
            {loading ? (
              <div
                style={{
                  padding: "3rem",
                  textAlign: "center",
                  color: "var(--con-text-muted)",
                }}
              >
                <RefreshCw
                  size={20}
                  className="animate-spin"
                  style={{ margin: "0 auto 8px", display: "block" }}
                />{" "}
                جاري التحميل...
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--con-border-default)",
                    }}
                  >
                    {[
                      "اسم سير العمل",
                      "نوع المشغل",
                      "الحالة",
                      "المدة",
                      "وقت البدء",
                      "تفاصيل",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "0.75rem 1rem",
                          textAlign: "right",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--con-text-muted)",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          padding: "2rem",
                          textAlign: "center",
                          color: "var(--con-text-muted)",
                          fontSize: 13,
                        }}
                      >
                        لا توجد سجلات
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const sm = WF_STATUS[log.status] || WF_STATUS.pending;
                      return (
                        <>
                          <tr
                            key={log.id}
                            style={{
                              borderBottom:
                                "1px solid var(--con-border-subtle)",
                              cursor: "pointer",
                            }}
                            onClick={() =>
                              setExpanded(expanded === log.id ? null : log.id)
                            }
                          >
                            <td style={{ padding: "0.75rem 1rem" }}>
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 500,
                                  color: "var(--con-text-primary)",
                                }}
                              >
                                {log.workflow_name || "—"}
                              </div>
                              <div
                                style={{
                                  fontSize: 10,
                                  color: "var(--con-text-muted)",
                                  fontFamily: "var(--con-font-mono)",
                                }}
                              >
                                {log.workflow_id}
                              </div>
                            </td>
                            <td
                              style={{
                                padding: "0.75rem 1rem",
                                fontSize: 12,
                                color: "var(--con-text-secondary)",
                              }}
                            >
                              {log.trigger_type || "—"}
                            </td>
                            <td style={{ padding: "0.75rem 1rem" }}>
                              <span
                                className={`con-badge ${sm.cls}`}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                {sm.icon}
                                {sm.label}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "0.75rem 1rem",
                                fontSize: 12,
                                color: "var(--con-text-secondary)",
                                fontFamily: "var(--con-font-mono)",
                              }}
                            >
                              {duration(log)}
                            </td>
                            <td
                              style={{
                                padding: "0.75rem 1rem",
                                fontSize: 11,
                                color: "var(--con-text-muted)",
                              }}
                            >
                              {new Date(log.started_at).toLocaleString("ar-SA")}
                            </td>
                            <td
                              style={{
                                padding: "0.75rem 1rem",
                                fontSize: 11,
                                color: "var(--con-accent)",
                              }}
                            >
                              {expanded === log.id ? "إخفاء ▲" : "عرض ▼"}
                            </td>
                          </tr>
                          {expanded === log.id && (
                            <tr key={`${log.id}-exp`}>
                              <td
                                colSpan={6}
                                style={{
                                  padding: "0 1rem 0.75rem",
                                  background: "var(--con-bg-surface-2)",
                                }}
                              >
                                {log.error_message && (
                                  <div
                                    style={{
                                      color: "var(--con-danger)",
                                      fontSize: 12,
                                      padding: "0.5rem 0",
                                      fontFamily: "var(--con-font-mono)",
                                    }}
                                  >
                                    <strong>خطأ: </strong>
                                    {log.error_message}
                                  </div>
                                )}
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: 8,
                                  }}
                                >
                                  {log.input_summary && (
                                    <div>
                                      <div
                                        style={{
                                          fontSize: 11,
                                          color: "var(--con-text-muted)",
                                          marginBottom: 4,
                                        }}
                                      >
                                        المدخلات
                                      </div>
                                      <pre
                                        style={{
                                          fontSize: 10,
                                          color: "var(--con-text-secondary)",
                                          margin: 0,
                                          overflow: "auto",
                                          maxHeight: 100,
                                        }}
                                      >
                                        {JSON.stringify(
                                          log.input_summary,
                                          null,
                                          2,
                                        )}
                                      </pre>
                                    </div>
                                  )}
                                  {log.output_summary && (
                                    <div>
                                      <div
                                        style={{
                                          fontSize: 11,
                                          color: "var(--con-text-muted)",
                                          marginBottom: 4,
                                        }}
                                      >
                                        المخرجات
                                      </div>
                                      <pre
                                        style={{
                                          fontSize: 10,
                                          color: "var(--con-text-secondary)",
                                          margin: 0,
                                          overflow: "auto",
                                          maxHeight: 100,
                                        }}
                                      >
                                        {JSON.stringify(
                                          log.output_summary,
                                          null,
                                          2,
                                        )}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="con-card"
            style={{ width: 420, maxWidth: "92vw", padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--con-text-primary)",
                }}
              >
                إضافة مصدر خارجي
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--con-text-muted)",
                }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: "var(--con-text-muted)",
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  اسم المصدر
                </label>
                <input
                  className="con-input"
                  value={srcName}
                  onChange={(e) => setSrcName(e.target.value)}
                  placeholder="مثال: Webhook Orders"
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: "var(--con-text-muted)",
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  النوع
                </label>
                <select
                  className="con-input"
                  value={srcType}
                  onChange={(e) => setSrcType(e.target.value)}
                  style={{ width: "100%" }}
                >
                  <option value="webhook">Webhook</option>
                  <option value="cron">Cron</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: "var(--con-text-muted)",
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  URL (اختياري)
                </label>
                <input
                  className="con-input"
                  value={srcUrl}
                  onChange={(e) => setSrcUrl(e.target.value)}
                  placeholder="https://..."
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: "var(--con-text-muted)",
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  الحالة
                </label>
                <select
                  className="con-input"
                  value={srcStatus}
                  onChange={(e) => setSrcStatus(e.target.value as SourceStatus)}
                  style={{ width: "100%" }}
                >
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                </select>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                  marginTop: 8,
                }}
              >
                <button
                  className="con-btn con-btn-ghost"
                  onClick={() => setShowAddModal(false)}
                >
                  إلغاء
                </button>
                <button
                  className="con-btn con-btn-primary"
                  onClick={handleAddSource}
                >
                  <Save size={14} /> حفظ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "sources" && (
        <div className="con-card" style={{ overflow: "hidden" }}>
          {loading ? (
            <div
              style={{
                padding: "3rem",
                textAlign: "center",
                color: "var(--con-text-muted)",
              }}
            >
              <RefreshCw
                size={20}
                className="animate-spin"
                style={{ margin: "0 auto 8px", display: "block" }}
              />{" "}
              جاري التحميل...
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--con-border-default)",
                  }}
                >
                  {[
                    "اسم المصدر",
                    "النوع",
                    "الحالة",
                    "آخر مزامنة",
                    "تاريخ الإضافة",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "0.75rem 1rem",
                        textAlign: "right",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--con-text-muted)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sources.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: "2rem",
                        textAlign: "center",
                        color: "var(--con-text-muted)",
                        fontSize: 13,
                      }}
                    >
                      لا توجد مصادر خارجية
                    </td>
                  </tr>
                ) : (
                  sources.map((src) => {
                    const sm = SRC_STATUS[src.status] || SRC_STATUS.inactive;
                    return (
                      <tr
                        key={src.id}
                        style={{
                          borderBottom: "1px solid var(--con-border-subtle)",
                        }}
                      >
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <Database
                              size={13}
                              style={{ color: "var(--con-accent)" }}
                            />
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 500,
                                color: "var(--con-text-primary)",
                              }}
                            >
                              {src.source_name}
                            </span>
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "0.75rem 1rem",
                            fontSize: 12,
                            color: "var(--con-text-secondary)",
                          }}
                        >
                          {src.source_type}
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <span className={`con-badge ${sm.cls}`}>
                            {sm.label}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "0.75rem 1rem",
                            fontSize: 11,
                            color: "var(--con-text-muted)",
                          }}
                        >
                          {src.last_sync_at
                            ? new Date(src.last_sync_at).toLocaleString("ar-SA")
                            : "لم تتم"}
                        </td>
                        <td
                          style={{
                            padding: "0.75rem 1rem",
                            fontSize: 11,
                            color: "var(--con-text-muted)",
                          }}
                        >
                          {new Date(src.created_at).toLocaleDateString("ar-SA")}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
