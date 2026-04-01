/**
 * صفحة SLA Scanner — Service Level Agreement Monitoring
 * مراقبة مستويات الخدمة وتتبع الانتهاكات
 */
import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  TrendingDown,
  AlertTriangle,
  Download,
  Printer,
  Plus,
  Pencil,
  X,
  Save,
} from "lucide-react";
import { API_BASE } from "@/lib/api";

interface SLAMetric {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
  status: "ok" | "warning" | "breach";
  trend: "up" | "down" | "stable";
  lastUpdated: string;
}

interface SLAViolation {
  id: string;
  type: string;
  orderId?: string;
  courierId?: string;
  breachMinutes: number;
  severity: "low" | "medium" | "high";
  createdAt: string;
}

const MOCK_METRICS: SLAMetric[] = [
  {
    id: "1",
    name: "متوسط وقت التوصيل",
    target: 45,
    current: 38,
    unit: "دقيقة",
    status: "ok",
    trend: "stable",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "2",
    name: "معدل التوصيل في الوقت",
    target: 95,
    current: 91,
    unit: "%",
    status: "warning",
    trend: "down",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "3",
    name: "وقت استجابة الشكاوى",
    target: 2,
    current: 4.5,
    unit: "ساعة",
    status: "breach",
    trend: "up",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "4",
    name: "تقييم العملاء",
    target: 4.5,
    current: 4.3,
    unit: "/ 5",
    status: "warning",
    trend: "stable",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "5",
    name: "معدل القبول",
    target: 90,
    current: 94,
    unit: "%",
    status: "ok",
    trend: "up",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "6",
    name: "انتهاكات اليوم",
    target: 0,
    current: 7,
    unit: "انتهاك",
    status: "breach",
    trend: "up",
    lastUpdated: new Date().toISOString(),
  },
];

const MOCK_VIOLATIONS: SLAViolation[] = [
  {
    id: "v1",
    type: "تأخير التوصيل",
    orderId: "ORD-1234",
    courierId: "C-001",
    breachMinutes: 23,
    severity: "medium",
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: "v2",
    type: "انتهاك وقت الاستجابة",
    orderId: "CMP-567",
    severity: "high",
    breachMinutes: 180,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "v3",
    type: "تأخير التوصيل",
    orderId: "ORD-9876",
    courierId: "C-004",
    breachMinutes: 12,
    severity: "low",
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: "v4",
    type: "تقييم منخفض",
    courierId: "C-007",
    breachMinutes: 0,
    severity: "medium",
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
];

const STATUS_STYLE: Record<
  string,
  { cls: string; label: string; icon: JSX.Element }
> = {
  ok: {
    cls: "con-badge-success",
    label: "ملتزم",
    icon: <CheckCircle2 size={11} />,
  },
  warning: {
    cls: "con-badge-warning",
    label: "تحذير",
    icon: <AlertTriangle size={11} />,
  },
  breach: {
    cls: "con-badge-danger",
    label: "انتهاك",
    icon: <XCircle size={11} />,
  },
};

const SEV_STYLE: Record<string, { cls: string; label: string }> = {
  low: { cls: "con-badge-info", label: "منخفض" },
  medium: { cls: "con-badge-warning", label: "متوسط" },
  high: { cls: "con-badge-danger", label: "عالٍ" },
};

function downloadCSV(data: Record<string, any>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((r) => headers.map((h) => `"${r[h] ?? ""}"`).join(",")),
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename + ".csv";
  a.click();
}

export default function SLAScanner() {
  const [metrics, setMetrics] = useState<SLAMetric[]>(MOCK_METRICS);
  const [violations, setViolations] = useState<SLAViolation[]>(MOCK_VIOLATIONS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"metrics" | "violations">("metrics");

  // Add/Edit metric modal
  const emptyMetricForm = { name: "", target: "", unit: "دقيقة" };
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMetric, setEditingMetric] = useState<SLAMetric | null>(null);
  const [metricForm, setMetricForm] = useState(emptyMetricForm);

  function openAddMetric() {
    setMetricForm(emptyMetricForm);
    setEditingMetric(null);
    setShowAddModal(true);
  }
  function openEditMetric(m: SLAMetric) {
    setMetricForm({ name: m.name, target: String(m.target), unit: m.unit });
    setEditingMetric(m);
    setShowAddModal(true);
  }
  function handleSaveMetric() {
    if (!metricForm.name.trim() || !metricForm.target.trim()) return;
    const targetVal = parseFloat(metricForm.target);
    if (isNaN(targetVal)) return;
    if (editingMetric) {
      setMetrics((prev) =>
        prev.map((m) =>
          m.id === editingMetric.id
            ? {
                ...m,
                name: metricForm.name,
                target: targetVal,
                unit: metricForm.unit,
              }
            : m,
        ),
      );
    } else {
      const newMetric: SLAMetric = {
        id: `m-${Date.now()}`,
        name: metricForm.name,
        target: targetVal,
        current: 0,
        unit: metricForm.unit,
        status: "ok",
        trend: "stable",
        lastUpdated: new Date().toISOString(),
      };
      setMetrics((prev) => [...prev, newMetric]);
    }
    setShowAddModal(false);
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/sla/metrics`);
      if (res.ok) {
        const d = await res.json();
        if (d.metrics?.length) setMetrics(d.metrics);
        if (d.violations?.length) setViolations(d.violations);
      }
    } catch {
      /* keep mock */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const okCount = metrics.filter((m) => m.status === "ok").length;
  const warnCount = metrics.filter((m) => m.status === "warning").length;
  const breachCount = metrics.filter((m) => m.status === "breach").length;

  function progressColor(m: SLAMetric) {
    if (m.status === "ok") return "var(--con-success)";
    if (m.status === "warning") return "var(--con-warning)";
    return "var(--con-danger)";
  }

  function progressPct(m: SLAMetric) {
    if (m.unit === "%") return Math.min(100, (m.current / m.target) * 100);
    if (m.current <= m.target) return (m.current / m.target) * 100;
    return 100;
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
            <Target size={18} style={{ color: "var(--con-accent)" }} /> مراقبة
            مستويات الخدمة (SLA)
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "var(--con-text-muted)",
              margin: "4px 0 0",
            }}
          >
            تتبع مؤشرات الأداء وانتهاكات مستوى الخدمة
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={openAddMetric}
            className="con-btn"
            style={{
              gap: 6,
              background: "var(--con-accent)",
              color: "#fff",
              border: "none",
            }}
          >
            <Plus size={14} /> إضافة مقياس
          </button>
          <button
            onClick={() => downloadCSV(violations, "sla-violations")}
            className="con-btn con-btn-ghost"
            style={{ gap: 6 }}
          >
            <Download size={14} /> تصدير CSV
          </button>
          <button
            onClick={() => window.print()}
            className="con-btn con-btn-ghost"
            style={{ gap: 6 }}
          >
            <Printer size={14} /> طباعة
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="con-btn con-btn-ghost"
            style={{ gap: 6 }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />{" "}
            تحديث
          </button>
        </div>
      </div>

      {/* Summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "0.75rem",
          marginBottom: "1.5rem",
        }}
      >
        {[
          {
            label: "ملتزم",
            value: okCount,
            color: "var(--con-success)",
            icon: <CheckCircle2 size={16} />,
          },
          {
            label: "تحذير",
            value: warnCount,
            color: "var(--con-warning)",
            icon: <AlertTriangle size={16} />,
          },
          {
            label: "انتهاك",
            value: breachCount,
            color: "var(--con-danger)",
            icon: <XCircle size={16} />,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="con-card"
            style={{
              padding: "1rem",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ color: s.color, opacity: 0.8 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>
                {s.value}
              </div>
              <div style={{ fontSize: 12, color: "var(--con-text-muted)" }}>
                {s.label}
              </div>
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
          { id: "metrics", label: "مؤشرات الأداء" },
          { id: "violations", label: `الانتهاكات (${violations.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
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

      {tab === "metrics" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "0.75rem",
          }}
        >
          {metrics.map((m) => {
            const ss = STATUS_STYLE[m.status];
            const pct = progressPct(m);
            return (
              <div key={m.id} className="con-card" style={{ padding: "1rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--con-text-primary)",
                      }}
                    >
                      {m.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--con-text-muted)",
                        marginTop: 2,
                      }}
                    >
                      الهدف: {m.target} {m.unit}
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <button
                      onClick={() => openEditMetric(m)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--con-text-muted)",
                        padding: 2,
                      }}
                      title="تعديل"
                    >
                      <Pencil size={12} />
                    </button>
                    <span
                      className={`con-badge ${ss.cls}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {ss.icon}
                      {ss.label}
                    </span>
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: progressColor(m),
                      }}
                    >
                      {m.current}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--con-text-muted)",
                        alignSelf: "flex-end",
                      }}
                    >
                      {m.unit}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 5,
                      borderRadius: 3,
                      background: "var(--con-bg-surface-2)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, pct)}%`,
                        height: "100%",
                        background: progressColor(m),
                        borderRadius: 3,
                        transition: "width 0.4s",
                      }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--con-text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {m.trend === "up" ? "↑" : m.trend === "down" ? "↓" : "→"}
                  آخر تحديث:{" "}
                  {new Date(m.lastUpdated).toLocaleTimeString("ar-SA")}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "violations" && (
        <div className="con-card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{ borderBottom: "1px solid var(--con-border-default)" }}
              >
                {[
                  "نوع الانتهاك",
                  "رقم الطلب",
                  "مدة الانتهاك",
                  "الخطورة",
                  "الوقت",
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
              {violations.map((v) => {
                const sev = SEV_STYLE[v.severity];
                return (
                  <tr
                    key={v.id}
                    style={{
                      borderBottom: "1px solid var(--con-border-subtle)",
                    }}
                  >
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--con-text-primary)",
                      }}
                    >
                      {v.type}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        fontSize: 12,
                        color: "var(--con-text-secondary)",
                        fontFamily: "var(--con-font-mono)",
                      }}
                    >
                      {v.orderId || v.courierId || "—"}
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--con-danger)",
                      }}
                    >
                      {v.breachMinutes > 0 ? `${v.breachMinutes} دقيقة` : "—"}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span className={`con-badge ${sev.cls}`}>
                        {sev.label}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        fontSize: 11,
                        color: "var(--con-text-muted)",
                      }}
                    >
                      {new Date(v.createdAt).toLocaleString("ar-SA")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Metric Modal */}
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
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--con-bg-surface-1, #fff)",
              border: "1px solid var(--con-border-default)",
              borderRadius: 12,
              padding: 24,
              width: 400,
              maxWidth: "90vw",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--con-text-primary)",
                  margin: 0,
                }}
              >
                {editingMetric ? "تعديل المقياس" : "إضافة مقياس جديد"}
              </h2>
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
                    color: "var(--con-text-secondary)",
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  اسم المقياس
                </label>
                <input
                  className="con-input"
                  value={metricForm.name}
                  onChange={(e) =>
                    setMetricForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="مثال: متوسط وقت التوصيل"
                  style={{ width: "100%", fontSize: 12 }}
                />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: 12,
                      color: "var(--con-text-secondary)",
                      marginBottom: 4,
                      display: "block",
                    }}
                  >
                    القيمة المستهدفة
                  </label>
                  <input
                    className="con-input"
                    type="number"
                    value={metricForm.target}
                    onChange={(e) =>
                      setMetricForm((f) => ({ ...f, target: e.target.value }))
                    }
                    placeholder="45"
                    style={{ width: "100%", fontSize: 12 }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: 12,
                      color: "var(--con-text-secondary)",
                      marginBottom: 4,
                      display: "block",
                    }}
                  >
                    الوحدة
                  </label>
                  <select
                    value={metricForm.unit}
                    onChange={(e) =>
                      setMetricForm((f) => ({ ...f, unit: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      borderRadius: 7,
                      border: "1px solid var(--con-border-default)",
                      fontSize: 12,
                      background: "var(--con-bg-surface-2)",
                      color: "var(--con-text-primary)",
                    }}
                  >
                    <option value="دقيقة">دقيقة</option>
                    <option value="%">نسبة مئوية (%)</option>
                    <option value="ساعة">ساعة</option>
                    <option value="/ 5">من 5</option>
                    <option value="انتهاك">عدد</option>
                  </select>
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 16,
                justifyContent: "flex-start",
              }}
            >
              <button
                onClick={handleSaveMetric}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 20px",
                  borderRadius: 7,
                  background: "var(--con-accent, #3b82f6)",
                  color: "#fff",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Save size={14} />
                {editingMetric ? "حفظ التعديل" : "إضافة"}
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 7,
                  background: "var(--con-bg-surface-2)",
                  color: "var(--con-text-secondary)",
                  border: "1px solid var(--con-border-default)",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
