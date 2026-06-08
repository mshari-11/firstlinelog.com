import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Download,
  Printer,
  RotateCcw,
} from "lucide-react";
import { API_BASE } from "@/lib/api";
import { toast } from "sonner";
import { PageWrapper, PageHeader } from "@/components/admin/ui";

function downloadCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [
    keys.join(","),
    ...rows.map((r) =>
      keys.map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","),
    ),
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

type EmailStatus = "sent" | "failed";
type EmailType = "otp" | "notification" | "confirmation" | "report";
interface EmailLog {
  id: string;
  date: string;
  recipient: string;
  type: EmailType;
  subject: string;
  status: EmailStatus;
}

const STATUS: Record<
  EmailStatus,
  { label: string; cls: string; icon: JSX.Element }
> = {
  sent: {
    label: "مرسل",
    cls: "con-badge-success",
    icon: <CheckCircle2 size={12} />,
  },
  failed: {
    label: "فاشل",
    cls: "con-badge-danger",
    icon: <XCircle size={12} />,
  },
};

const TYPE_LABELS: Record<EmailType, string> = {
  otp: "OTP",
  notification: "إشعار",
  confirmation: "تأكيد",
  report: "تقرير",
};


export default function EmailLogs() {
  const navigate = useNavigate();
  const [data, setData] = useState<EmailLog[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<EmailType | "all">("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);
  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/email-logs`);
      if (res.ok) {
        const d = await res.json();
        if (Array.isArray(d) && d.length) setData(d);
      }
    } catch {
      /* keep mock */
    }
    setLoading(false);
  }

  const filtered = data.filter((a) => {
    const matchSearch =
      a.recipient.includes(search) ||
      a.subject.includes(search) ||
      a.id.includes(search);
    const matchFilter = typeFilter === "all" || a.type === typeFilter;
    return matchSearch && matchFilter;
  });

  const today = data.filter((e) => e.date.startsWith("2026-03-21")).length;
  const thisWeek = data.length;
  const failedCount = data.filter((e) => e.status === "failed").length;
  const total = data.length;

  return (
    <PageWrapper>
      <PageHeader
        icon={Mail}
        title="سجل الإيميلات"
        subtitle="متابعة حالة الرسائل الإلكترونية المرسلة"
        actions={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className="con-btn-ghost"
              onClick={() =>
                downloadCSV(
                  filtered.map((a) => ({
                    الرقم: a.id,
                    التاريخ: a.date,
                    المستلم: a.recipient,
                    النوع: TYPE_LABELS[a.type],
                    الموضوع: a.subject,
                    الحالة: STATUS[a.status].label,
                  })),
                  "email-logs.csv",
                )
              }
            >
              <Download size={14} /> تصدير CSV
            </button>
            <button className="con-btn-ghost" onClick={() => window.print()}>
              <Printer size={14} /> طباعة
            </button>
            <button
              className="con-btn-ghost"
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw
                size={14}
                style={{
                  animation: loading ? "spin 1s linear infinite" : "none",
                }}
              />{" "}
              تحديث
            </button>
          </div>
        }
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
        }}
      >
        {[
          {
            label: "مرسلة اليوم",
            value: today,
            icon: Mail,
            accent: "var(--con-brand)",
            onClick: () => {},
          },
          {
            label: "هذا الأسبوع",
            value: thisWeek,
            icon: Clock,
            accent: "var(--con-success)",
            onClick: () => navigate("/admin-panel/settings"),
          },
          {
            label: "فاشلة",
            value: failedCount,
            icon: XCircle,
            accent: "var(--con-danger)",
            onClick: () => navigate("/admin-panel/staff"),
          },
          {
            label: "الإجمالي",
            value: total,
            icon: CheckCircle2,
            accent: "var(--con-warning)",
            onClick: () => {},
          },
        ].map((k) => (
          <div
            key={k.label}
            className="con-kpi-card"
            onClick={k.onClick}
            style={{ cursor: "pointer" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: "var(--con-text-caption)",
                  color: "var(--con-text-muted)",
                }}
              >
                {k.label}
              </span>
              <k.icon size={14} style={{ color: k.accent }} />
            </div>
            <div
              className="con-kpi-value"
              style={{ fontSize: 26, color: k.accent }}
            >
              {k.value}
            </div>
          </div>
        ))}
      </div>

      <div className="con-toolbar" style={{ flexWrap: "wrap", gap: 10 }}>
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
          <Search
            size={14}
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالمستلم أو الموضوع..."
            className="con-input"
            style={{ paddingInlineEnd: 32, width: "100%" }}
          />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(
            ["all", "otp", "notification", "confirmation", "report"] as const
          ).map((s) => (
            <button
              key={s}
              onClick={() => setTypeFilter(s)}
              style={{
                padding: "4px 12px",
                borderRadius: 6,
                fontSize: "var(--con-text-caption)",
                fontWeight: 500,
                border: "1px solid",
                cursor: "pointer",
                background:
                  typeFilter === s ? "var(--con-brand)" : "transparent",
                borderColor:
                  typeFilter === s
                    ? "var(--con-brand)"
                    : "var(--con-border-strong)",
                color: typeFilter === s ? "#fff" : "var(--con-text-muted)",
              }}
            >
              {s === "all" ? "الكل" : TYPE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          background: "var(--con-bg-surface-1)",
          border: "1px solid var(--con-border-default)",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {filtered.length === 0 ? (
          <div className="con-empty">
            <AlertCircle
              size={32}
              style={{ opacity: 0.25, marginBottom: 10 }}
            />
            <div>لا توجد رسائل مطابقة</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="con-table">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>المستلم</th>
                  <th>النوع</th>
                  <th>الموضوع</th>
                  <th>الحالة</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <span
                        style={{
                          fontFamily: "var(--con-font-mono)",
                          fontSize: 12,
                        }}
                      >
                        {new Date(a.date).toLocaleString("ar-SA")}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{ cursor: "pointer", color: "var(--con-brand)" }}
                        onClick={() => navigate("/admin-panel/staff")}
                      >
                        {a.recipient}
                      </span>
                    </td>
                    <td>
                      <span className={`con-badge con-badge-sm con-badge-info`}>
                        {TYPE_LABELS[a.type]}
                      </span>
                    </td>
                    <td>{a.subject}</td>
                    <td>
                      <span
                        className={`con-badge con-badge-sm ${STATUS[a.status].cls}`}
                      >
                        {STATUS[a.status].icon} {STATUS[a.status].label}
                      </span>
                    </td>
                    <td>
                      {a.status === "failed" ? (
                        <button
                          className="con-btn-ghost"
                          style={{
                            padding: "4px 8px",
                            fontSize: 11,
                            color: "var(--con-warning)",
                          }}
                          onClick={async () => {
                            try {
                              await fetch(`${API_BASE}/api/email-resend`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: a.id }),
                              });
                            } catch {
                              toast.error("تعذّر إعادة الإرسال");
                            }
                            setData((prev) =>
                              prev.map((e) =>
                                e.id === a.id
                                  ? { ...e, status: "sent" as EmailStatus }
                                  : e,
                              ),
                            );
                            toast.success(`تم إعادة إرسال ${a.id}`);
                          }}
                        >
                          <RotateCcw size={12} /> إعادة إرسال
                        </button>
                      ) : (
                        <span
                          style={{
                            color: "var(--con-text-muted)",
                            fontSize: 11,
                          }}
                        >
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
