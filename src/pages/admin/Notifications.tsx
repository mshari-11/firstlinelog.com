import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  RefreshCw,
  AlertCircle,
  Bell,
  Mail,
  MailOpen,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  Settings,
  Clock,
  Download,
  Printer,
  CheckCheck,
  Trash2,
  Plus,
  X,
  Save,
} from "lucide-react";
import { API_BASE } from "@/lib/api";
import { toast } from "sonner";

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

type NotifType = "complaint" | "order" | "finance" | "system";
interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  read: boolean;
  date: string;
  link: string;
}

const TYPE_MAP: Record<
  NotifType,
  { label: string; cls: string; icon: JSX.Element; route: string }
> = {
  complaint: {
    label: "شكوى",
    cls: "con-badge-danger",
    icon: <AlertTriangle size={12} />,
    route: "/admin-panel/complaints",
  },
  order: {
    label: "طلب",
    cls: "con-badge-info",
    icon: <ShoppingCart size={12} />,
    route: "/admin-panel/orders",
  },
  finance: {
    label: "مالي",
    cls: "con-badge-warning",
    icon: <DollarSign size={12} />,
    route: "/admin-panel/finance",
  },
  system: {
    label: "نظام",
    cls: "con-badge-success",
    icon: <Settings size={12} />,
    route: "/admin-panel/settings",
  },
};


export default function Notifications() {
  const navigate = useNavigate();
  const [data, setData] = useState<Notification[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<NotifType | "all">("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newType, setNewType] = useState<NotifType>("system");
  const [newRecipients, setNewRecipients] = useState("");

  function handleAddNotification() {
    if (!newTitle.trim() || !newMessage.trim()) {
      toast.error("يرجى تعبئة العنوان والرسالة");
      return;
    }
    const n: Notification = {
      id: `NTF-${String(data.length + 1).padStart(3, "0")}`,
      type: newType,
      title: newTitle,
      message: newMessage,
      read: false,
      date: new Date().toISOString(),
      link: TYPE_MAP[newType].route,
    };
    setData((prev) => [n, ...prev]);
    setShowAddModal(false);
    setNewTitle("");
    setNewMessage("");
    setNewType("system");
    setNewRecipients("");
    toast.success("تم إرسال الإشعار بنجاح");
  }

  useEffect(() => {
    fetchData();
  }, []);
  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/notifications`);
      if (res.ok) {
        const d = await res.json();
        if (Array.isArray(d) && d.length) setData(d);
      }
    } catch {
      /* keep mock */
    }
    setLoading(false);
  }

  async function markRead(id: string) {
    try {
      await fetch(`${API_BASE}/api/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, read: true }),
      });
    } catch {}
    setData((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  const filtered = data.filter((a) => {
    const matchSearch = a.title.includes(search) || a.message.includes(search);
    const matchFilter = filter === "all" || a.type === filter;
    return matchSearch && matchFilter;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [search, filter]);

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  const stats = {
    unread: data.filter((n) => !n.read).length,
    today: data.filter((n) => n.date.slice(0, 10) === today).length,
    week: data.filter((n) => n.date.slice(0, 10) >= weekAgo).length,
    total: data.length,
  };

  return (
    <div
      dir="rtl"
      style={{ display: "flex", flexDirection: "column", gap: 20 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                background: "rgba(59,130,246,0.12)",
                borderRadius: 8,
                padding: 7,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bell size={18} style={{ color: "var(--con-brand)" }} />
            </div>
            <h1
              style={{
                fontSize: "var(--con-text-page-title)",
                fontWeight: 700,
                color: "var(--con-text-primary)",
                margin: 0,
              }}
            >
              الإشعارات
            </h1>
          </div>
          <p
            style={{
              fontSize: "var(--con-text-body)",
              color: "var(--con-text-muted)",
              margin: 0,
              paddingRight: 44,
            }}
          >
            عرض وإدارة جميع الإشعارات
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className="con-btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={14} /> إرسال إشعار
          </button>
          <button
            className="con-btn-primary"
            onClick={() => {
              const unread = data.filter((n) => !n.read);
              if (!unread.length) {
                toast.info("جميع الإشعارات مقروءة");
                return;
              }
              setData((prev) => prev.map((n) => ({ ...n, read: true })));
              toast.success(`تم قراءة ${unread.length} إشعار`);
            }}
          >
            <CheckCheck size={14} /> قراءة الكل
          </button>
          <button
            className="con-btn-ghost"
            style={{ color: "var(--con-danger)" }}
            onClick={() => {
              const readItems = data.filter((n) => n.read);
              if (!readItems.length) {
                toast.info("لا توجد إشعارات مقروءة للحذف");
                return;
              }
              setData((prev) => prev.filter((n) => !n.read));
              toast.success(`تم حذف ${readItems.length} إشعار مقروء`);
            }}
          >
            <Trash2 size={14} /> حذف المقروءة
          </button>
          <button
            className="con-btn-ghost"
            onClick={() =>
              downloadCSV(
                filtered.map((n) => ({
                  الرقم: n.id,
                  النوع: TYPE_MAP[n.type].label,
                  العنوان: n.title,
                  الرسالة: n.message,
                  الحالة: n.read ? "مقروء" : "غير مقروء",
                  التاريخ: n.date,
                })),
                "notifications.csv",
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
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
        }}
      >
        {[
          {
            label: "غير مقروءة",
            value: stats.unread,
            icon: Mail,
            accent: "var(--con-danger)",
            onClick: () => {},
          },
          {
            label: "اليوم",
            value: stats.today,
            icon: Clock,
            accent: "var(--con-brand)",
            onClick: () => {},
          },
          {
            label: "الأسبوع",
            value: stats.week,
            icon: Bell,
            accent: "var(--con-warning)",
            onClick: () => {},
          },
          {
            label: "الإجمالي",
            value: stats.total,
            icon: MailOpen,
            accent: "var(--con-success)",
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
            placeholder="بحث..."
            className="con-input"
            style={{ paddingInlineEnd: 32, width: "100%" }}
          />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "complaint", "order", "finance", "system"] as const).map(
            (s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{
                  padding: "4px 12px",
                  borderRadius: 6,
                  fontSize: "var(--con-text-caption)",
                  fontWeight: 500,
                  border: "1px solid",
                  cursor: "pointer",
                  background: filter === s ? "var(--con-brand)" : "transparent",
                  borderColor:
                    filter === s
                      ? "var(--con-brand)"
                      : "var(--con-border-strong)",
                  color: filter === s ? "#fff" : "var(--con-text-muted)",
                }}
              >
                {s === "all" ? "الكل" : TYPE_MAP[s].label}
              </button>
            ),
          )}
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
            <div>لا توجد إشعارات مطابقة</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="con-table">
              <thead>
                <tr>
                  <th>الحالة</th>
                  <th>النوع</th>
                  <th>العنوان</th>
                  <th>الرسالة</th>
                  <th>التاريخ</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((a) => (
                  <tr
                    key={a.id}
                    style={{
                      background: !a.read ? "rgba(59,130,246,0.04)" : undefined,
                    }}
                  >
                    <td>
                      {a.read ? (
                        <MailOpen
                          size={14}
                          style={{ color: "var(--con-text-muted)" }}
                        />
                      ) : (
                        <Mail size={14} style={{ color: "var(--con-brand)" }} />
                      )}
                    </td>
                    <td>
                      <span
                        className={`con-badge con-badge-sm ${TYPE_MAP[a.type].cls}`}
                      >
                        {TYPE_MAP[a.type].icon} {TYPE_MAP[a.type].label}
                      </span>
                    </td>
                    <td style={{ fontWeight: a.read ? 400 : 600 }}>
                      {a.title}
                    </td>
                    <td>{a.message}</td>
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
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          className="con-btn-primary"
                          style={{ padding: "4px 8px", fontSize: 11 }}
                          onClick={() => {
                            markRead(a.id);
                            navigate(TYPE_MAP[a.type].route);
                          }}
                        >
                          فتح
                        </button>
                        {!a.read && (
                          <button
                            className="con-btn-ghost"
                            style={{ padding: "4px 8px", fontSize: 11 }}
                            onClick={() => markRead(a.id)}
                          >
                            قراءة
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && totalPages > 1 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 16px", borderTop: "1px solid var(--con-border, #1a3a52)",
          }}>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              صفحة {page} من {totalPages} — إجمالي {filtered.length}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--con-border, #1a3a52)",
                  background: "var(--con-card, #0d1926)", color: page === 1 ? "#475569" : "var(--con-text, #e2e8f0)",
                  cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 12 }}>
                السابق
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--con-border, #1a3a52)",
                  background: "var(--con-card, #0d1926)", color: page === totalPages ? "#475569" : "var(--con-text, #e2e8f0)",
                  cursor: page === totalPages ? "not-allowed" : "pointer", fontSize: 12 }}>
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
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
                إرسال إشعار
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
                  العنوان
                </label>
                <input
                  className="con-input"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="عنوان الإشعار"
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
                  الرسالة
                </label>
                <textarea
                  className="con-input"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="نص الرسالة"
                  rows={3}
                  style={{ width: "100%", resize: "vertical" }}
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
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as NotifType)}
                  style={{ width: "100%" }}
                >
                  {(Object.keys(TYPE_MAP) as NotifType[]).map((t) => (
                    <option key={t} value={t}>
                      {TYPE_MAP[t].label}
                    </option>
                  ))}
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
                  المستلمون
                </label>
                <input
                  className="con-input"
                  value={newRecipients}
                  onChange={(e) => setNewRecipients(e.target.value)}
                  placeholder="الكل، مجموعة، أو بريد محدد"
                  style={{ width: "100%" }}
                />
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
                  className="con-btn-ghost"
                  onClick={() => setShowAddModal(false)}
                >
                  إلغاء
                </button>
                <button
                  className="con-btn-primary"
                  onClick={handleAddNotification}
                >
                  <Save size={14} /> إرسال
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
