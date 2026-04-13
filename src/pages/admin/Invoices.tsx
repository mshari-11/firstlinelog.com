import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  Send,
  BarChart3,
  Eye,
  Plus,
  Download,
  Printer,
  Trash2,
  MessageCircle,
  Copy,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE } from "@/lib/api";
import { supabase } from "@/lib/supabase";

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";
interface Invoice {
  id: string;
  customer: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
}

const STATUS: Record<
  InvoiceStatus,
  { label: string; cls: string; icon: JSX.Element }
> = {
  draft: {
    label: "مسودة",
    cls: "con-badge-warning",
    icon: <Clock size={12} />,
  },
  sent: { label: "مرسلة", cls: "con-badge-info", icon: <Send size={12} /> },
  paid: {
    label: "مدفوعة",
    cls: "con-badge-success",
    icon: <CheckCircle2 size={12} />,
  },
  overdue: {
    label: "متأخرة",
    cls: "con-badge-danger",
    icon: <XCircle size={12} />,
  },
};

export default function Invoices() {
  const navigate = useNavigate();
  const [data, setData] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<InvoiceStatus | "all">("all");
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newInv, setNewInv] = useState({
    customer: "",
    amount: "",
    dueDate: "",
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<keyof Invoice>("issueDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll(ids: string[]) {
    setSelectedIds((prev) => {
      if (ids.every((id) => prev.has(id)) && ids.length > 0) return new Set();
      return new Set(ids);
    });
  }

  function toggleSort(key: keyof Invoice) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  function bulkMarkPaid() {
    if (selectedIds.size === 0) return;
    setData((prev) =>
      prev.map((i) => (selectedIds.has(i.id) ? { ...i, status: "paid" as InvoiceStatus } : i)),
    );
    toast.success(`تم تحديد ${selectedIds.size} فاتورة كمدفوعة`);
    setSelectedIds(new Set());
  }

  function bulkDelete() {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`حذف ${selectedIds.size} فاتورة؟`)) return;
    setData((prev) => prev.filter((i) => !selectedIds.has(i.id)));
    toast.success(`تم حذف ${selectedIds.size} فاتورة`);
    setSelectedIds(new Set());
  }

  function sendReminder(inv: Invoice) {
    const msg = encodeURIComponent(
      `مرحباً ${inv.customer}، تذكير بالفاتورة ${inv.id} بمبلغ ${inv.amount.toLocaleString("ar-SA")} ر.س مستحقة ${inv.dueDate}`,
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }

  useEffect(() => {
    fetchData();
  }, []);
  async function fetchData() {
    setLoading(true);

    // 1) Try Supabase first
    if (supabase) {
      try {
        const { data: rows, error } = await supabase
          .from("invoices")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);
        if (!error && rows && rows.length > 0) {
          const mapped: Invoice[] = rows.map((r: any) => ({
            id: r.id ?? r.invoice_id ?? "",
            customer: r.customer ?? r.customer_name ?? "",
            amount: r.amount ?? r.total_amount ?? 0,
            issueDate: r.issue_date ?? r.issueDate ?? "",
            dueDate: r.due_date ?? r.dueDate ?? "",
            status: r.status ?? "draft",
          }));
          setData(mapped);
          setLoading(false);
          return;
        }
      } catch {
        /* fall through to API */
      }
    }

    // 2) Fallback to API
    try {
      const res = await fetch(`${API_BASE}/api/invoices`);
      if (res.ok) {
        const d = await res.json();
        if (Array.isArray(d) && d.length) setData(d);
      }
    } catch {
      /* keep empty */
    }
    setLoading(false);
  }

  const filtered = data
    .filter((a) => {
      const matchSearch = a.customer.includes(search) || a.id.includes(search);
      const matchFilter = filter === "all" || a.status === filter;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return dir * (av - bv);
      return dir * String(av ?? "").localeCompare(String(bv ?? ""), "ar");
    });

  const filteredIds = filtered.map((i) => i.id);
  const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));
  function SortIcon({ col }: { col: keyof Invoice }) {
    if (sortKey !== col) return <ArrowUpDown size={11} style={{ display: "inline", opacity: 0.3 }} />;
    return sortDir === "asc" ? <ArrowUp size={11} style={{ display: "inline" }} /> : <ArrowDown size={11} style={{ display: "inline" }} />;
  }

  const totalAmount = data.reduce((s, i) => s + i.amount, 0);
  const paidAmount = data
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.amount, 0);
  const pendingAmount = data
    .filter((i) => i.status === "sent" || i.status === "draft")
    .reduce((s, i) => s + i.amount, 0);
  const overdueAmount = data
    .filter((i) => i.status === "overdue")
    .reduce((s, i) => s + i.amount, 0);

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
              <FileText size={18} style={{ color: "var(--con-brand)" }} />
            </div>
            <h1
              style={{
                fontSize: "var(--con-text-page-title)",
                fontWeight: 700,
                color: "var(--con-text-primary)",
                margin: 0,
              }}
            >
              الفواتير
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
            إدارة الفواتير والمدفوعات
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button
            className="con-btn-primary"
            onClick={() => setShowCreate(true)}
            style={{ gap: 4 }}
          >
            <Plus size={14} /> إنشاء فاتورة
          </button>
          <button
            className="con-btn-ghost"
            onClick={() => {
              if (!filtered.length) return;
              const headers = Object.keys(filtered[0]);
              const csv = [
                headers.join(","),
                ...filtered.map((r) =>
                  headers.map((h) => `"${(r as any)[h] ?? ""}"`).join(","),
                ),
              ].join("\n");
              const blob = new Blob(["\uFEFF" + csv], {
                type: "text/csv;charset=utf-8",
              });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = "invoices.csv";
              a.click();
            }}
            style={{ gap: 4 }}
          >
            <Download size={14} /> تصدير CSV
          </button>
          <button
            className="con-btn-ghost"
            onClick={() => window.print()}
            style={{ gap: 4 }}
          >
            <Printer size={14} /> طباعة
          </button>
          <button
            className="con-btn-ghost"
            onClick={() => {
              setData((prev) =>
                prev.map((i) =>
                  i.status === "sent" || i.status === "overdue"
                    ? { ...i, status: "paid" as InvoiceStatus }
                    : i,
                ),
              );
            }}
            style={{ gap: 4, color: "var(--con-success)" }}
          >
            <CheckCircle2 size={14} /> تحديد كمدفوعة
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
            label: "إجمالي المبلغ",
            value: totalAmount.toLocaleString("ar-SA") + " ر.س",
            icon: DollarSign,
            accent: "var(--con-brand)",
            onClick: () => navigate("/admin-panel/finance"),
          },
          {
            label: "مدفوع",
            value: paidAmount.toLocaleString("ar-SA") + " ر.س",
            icon: CheckCircle2,
            accent: "var(--con-success)",
            onClick: () => setFilter("paid"),
          },
          {
            label: "معلق",
            value: pendingAmount.toLocaleString("ar-SA") + " ر.س",
            icon: Clock,
            accent: "var(--con-warning)",
            onClick: () => setFilter("sent"),
          },
          {
            label: "متأخر",
            value: overdueAmount.toLocaleString("ar-SA") + " ر.س",
            icon: XCircle,
            accent: "var(--con-danger)",
            onClick: () => navigate("/admin-panel/financial-reports"),
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

      {selectedIds.size > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 16px",
            background: "var(--con-brand-subtle)",
            border: "1px solid var(--con-brand)",
            borderRadius: 8,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontWeight: 600, color: "var(--con-brand)" }}>
            {selectedIds.size} فاتورة محددة
          </span>
          <div style={{ marginInlineStart: "auto", display: "flex", gap: 6 }}>
            <button className="con-btn-ghost" onClick={bulkMarkPaid}>
              <CheckCircle2 size={14} /> تحديد كمدفوعة
            </button>
            <button className="con-btn-ghost" onClick={bulkDelete} style={{ color: "var(--con-danger)" }}>
              <Trash2 size={14} /> حذف
            </button>
            <button className="con-btn-ghost" onClick={() => setSelectedIds(new Set())}>
              <X size={14} /> إلغاء
            </button>
          </div>
        </div>
      )}

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
            placeholder="بحث بالعميل أو رقم الفاتورة..."
            className="con-input"
            style={{ paddingInlineEnd: 32, width: "100%" }}
          />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(["all", "draft", "sent", "paid", "overdue"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "inherit",
                border: filter === s ? "1px solid var(--con-brand, #3b82f6)" : "1px solid var(--con-border, #1a3a52)",
                background: filter === s ? "var(--con-brand-subtle, #1e3a5f)" : "transparent",
                color: filter === s ? "var(--con-brand, #3b82f6)" : "var(--con-text-secondary, #94a3b8)",
                cursor: "pointer",
              }}
            >
              {s === "all" ? "الكل" : STATUS[s].label}
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
            <div>لا توجد فواتير مطابقة</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="con-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => toggleSelectAll(filteredIds)}
                      style={{ cursor: "pointer" }}
                      aria-label="تحديد الكل"
                    />
                  </th>
                  <th onClick={() => toggleSort("id")} style={{ cursor: "pointer", userSelect: "none" }}>
                    رقم الفاتورة <SortIcon col="id" />
                  </th>
                  <th onClick={() => toggleSort("customer")} style={{ cursor: "pointer", userSelect: "none" }}>
                    العميل <SortIcon col="customer" />
                  </th>
                  <th onClick={() => toggleSort("amount")} style={{ cursor: "pointer", userSelect: "none" }}>
                    المبلغ <SortIcon col="amount" />
                  </th>
                  <th onClick={() => toggleSort("issueDate")} style={{ cursor: "pointer", userSelect: "none" }}>
                    تاريخ الإصدار <SortIcon col="issueDate" />
                  </th>
                  <th onClick={() => toggleSort("dueDate")} style={{ cursor: "pointer", userSelect: "none" }}>
                    الاستحقاق <SortIcon col="dueDate" />
                  </th>
                  <th onClick={() => toggleSort("status")} style={{ cursor: "pointer", userSelect: "none" }}>
                    الحالة <SortIcon col="status" />
                  </th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} style={{ background: selectedIds.has(a.id) ? "var(--con-brand-subtle)" : undefined }}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(a.id)}
                        onChange={() => toggleSelect(a.id)}
                        style={{ cursor: "pointer" }}
                        aria-label="تحديد"
                      />
                    </td>
                    <td>
                      <span style={{ fontFamily: "var(--con-font-mono)", fontSize: 12, fontWeight: 600 }}>
                        {a.id}
                      </span>
                    </td>
                    <td>{a.customer}</td>
                    <td>
                      <span style={{ fontFamily: "var(--con-font-mono)" }}>
                        {a.amount.toLocaleString("ar-SA")} ر.س
                      </span>
                    </td>
                    <td>{a.issueDate}</td>
                    <td>{a.dueDate}</td>
                    <td>
                      <span className={`con-badge con-badge-sm ${STATUS[a.status].cls}`}>
                        {STATUS[a.status].icon} {STATUS[a.status].label}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          className="con-btn-ghost"
                          style={{ padding: "4px 6px" }}
                          onClick={() => navigate("/admin-panel/financial-reports")}
                          title="عرض"
                        >
                          <Eye size={13} />
                        </button>
                        {a.status !== "paid" && (
                          <button
                            className="con-btn-ghost"
                            style={{ padding: "4px 6px", color: "var(--con-success)" }}
                            onClick={() => {
                              setData((prev) => prev.map((i) => (i.id === a.id ? { ...i, status: "paid" as InvoiceStatus } : i)));
                              toast.success("تم تحديد الفاتورة كمدفوعة");
                            }}
                            title="تحديد كمدفوعة"
                          >
                            <CheckCircle2 size={13} />
                          </button>
                        )}
                        <button
                          className="con-btn-ghost"
                          style={{ padding: "4px 6px", color: "#25d366" }}
                          onClick={() => sendReminder(a)}
                          title="إرسال تذكير واتساب"
                        >
                          <MessageCircle size={13} />
                        </button>
                        <button
                          className="con-btn-ghost"
                          style={{ padding: "4px 6px" }}
                          onClick={() => {
                            navigator.clipboard?.writeText(a.id);
                            toast.success("تم نسخ رقم الفاتورة");
                          }}
                          title="نسخ الرقم"
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showCreate && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowCreate(false)}
        >
          <div
            style={{
              background: "var(--con-bg-surface-1)",
              border: "1px solid var(--con-border-default)",
              borderRadius: 10,
              padding: "1.5rem",
              width: 400,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--con-text-primary)",
                margin: "0 0 16px",
              }}
            >
              إنشاء فاتورة جديدة
            </h2>
            {[
              { label: "العميل", key: "customer", type: "text" },
              { label: "المبلغ (ر.س)", key: "amount", type: "number" },
              { label: "تاريخ الاستحقاق", key: "dueDate", type: "date" },
            ].map((f) => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label
                  style={{
                    fontSize: 12,
                    color: "var(--con-text-secondary)",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  {f.label}
                </label>
                <input
                  className="con-input"
                  type={f.type}
                  value={(newInv as any)[f.key]}
                  onChange={(e) =>
                    setNewInv((p) => ({ ...p, [f.key]: e.target.value }))
                  }
                  style={{ width: "100%" }}
                />
              </div>
            ))}
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                marginTop: 16,
              }}
            >
              <button
                className="con-btn-ghost"
                onClick={() => setShowCreate(false)}
              >
                إلغاء
              </button>
              <button
                className="con-btn-primary"
                onClick={() => {
                  if (!newInv.customer || !newInv.amount) return;
                  const inv: Invoice = {
                    id: `INV-${String(data.length + 1).padStart(3, "0")}`,
                    customer: newInv.customer,
                    amount: Number(newInv.amount),
                    issueDate: new Date().toISOString().slice(0, 10),
                    dueDate:
                      newInv.dueDate || new Date().toISOString().slice(0, 10),
                    status: "draft",
                  };
                  setData((prev) => [inv, ...prev]);
                  setShowCreate(false);
                  setNewInv({ customer: "", amount: "", dueDate: "" });
                }}
              >
                <Plus size={14} /> إنشاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
