/**
 * صفحة إدارة الشكاوى — Enterprise Complaints Management
 * Ticket lifecycle: new → assigned → in_progress → resolved/escalated
 * Backend: platform-api-prod.js /complaints/ endpoints
 */
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  AlertCircle, Search, RefreshCw, Clock, CheckCircle2,
  XCircle, ArrowUpRight, MessageSquare, User, Send,
  Filter, ChevronDown, ChevronUp, Building2, Tag,
  AlertTriangle, Phone, Mail, PanelRightOpen,
  Download, Printer, Plus, Pencil, X, Save,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ComplaintStatus = "new" | "assigned" | "in_progress" | "escalated" | "resolved" | "closed" | "transferred";

interface Complaint {
  id: string;
  title?: string;
  description?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  category?: string;
  priority?: string;
  status: ComplaintStatus;
  assigned_to?: string;
  department_id?: string;
  platform?: string;
  order_id?: string;
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  escalatedAt?: string;
  escalationReason?: string;
  createdAt: string;
  updatedAt?: string;
}

interface ComplaintMessage {
  id: string;
  complaint_id: string;
  sender_type?: string;
  sender_name?: string;
  message: string;
  createdAt: string;
}

interface ComplaintStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  escalated: number;
  by_category: Record<string, number>;
}

// ─── Constants ──────────────────────────────────────────────────────────────────

import { API_BASE } from "@/lib/api";

const STATUS_META: Record<ComplaintStatus, { label: string; badgeClass: string; icon: JSX.Element }> = {
  new:          { label: "جديدة",      badgeClass: "con-badge-info",    icon: <Clock size={12} /> },
  assigned:     { label: "تم الإسناد", badgeClass: "con-badge-warning", icon: <User size={12} /> },
  in_progress:  { label: "قيد المعالجة", badgeClass: "con-badge-warning", icon: <RefreshCw size={12} /> },
  escalated:    { label: "مصعّدة",     badgeClass: "con-badge-danger",  icon: <AlertTriangle size={12} /> },
  resolved:     { label: "تم الحل",    badgeClass: "con-badge-success", icon: <CheckCircle2 size={12} /> },
  closed:       { label: "مغلقة",      badgeClass: "con-badge-success", icon: <CheckCircle2 size={12} /> },
  transferred:  { label: "محوّلة",     badgeClass: "con-badge-info",    icon: <ArrowUpRight size={12} /> },
};

const PRIORITY_META: Record<string, { label: string; color: string }> = {
  low:    { label: "منخفضة", color: "var(--con-text-muted)" },
  medium: { label: "متوسطة", color: "var(--con-warning)" },
  high:   { label: "عالية",  color: "var(--con-danger)" },
  urgent: { label: "عاجلة",  color: "var(--con-danger)" },
};

const CATEGORY_LABELS: Record<string, string> = {
  delivery:  "مشكلة توصيل",
  payment:   "مشكلة مالية",
  driver:    "سلوك سائق",
  platform:  "مشكلة منصة",
  quality:   "جودة الخدمة",
  other:     "أخرى",
};

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function Complaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<ComplaintStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "all">("all");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [messages, setMessages] = useState<ComplaintMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [assignTo, setAssignTo] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const perPage = 15;

  // Add/Edit complaint modal
  const emptyComplaintForm = { customer_name: "", order_id: "", title: "", category: "delivery", priority: "medium", description: "" };
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Complaint | null>(null);
  const [complaintForm, setComplaintForm] = useState(emptyComplaintForm);

  function openAddComplaint() { setComplaintForm(emptyComplaintForm); setEditingItem(null); setShowAddModal(true); }
  function openEditComplaint(c: Complaint) {
    setComplaintForm({ customer_name: c.customer_name || "", order_id: c.order_id || "", title: c.title || "", category: c.category || "delivery", priority: c.priority || "medium", description: c.description || "" });
    setEditingItem(c); setShowAddModal(true);
  }
  function handleSaveComplaint() {
    if (!complaintForm.customer_name.trim() || !complaintForm.title.trim()) return;
    if (editingItem) {
      setComplaints(prev => prev.map(c => c.id === editingItem.id ? { ...c, customer_name: complaintForm.customer_name, order_id: complaintForm.order_id, title: complaintForm.title, category: complaintForm.category, priority: complaintForm.priority, description: complaintForm.description, updatedAt: new Date().toISOString() } : c));
    } else {
      const newComplaint: Complaint = { id: `CMP-${Date.now().toString().slice(-6)}`, customer_name: complaintForm.customer_name, order_id: complaintForm.order_id, title: complaintForm.title, category: complaintForm.category, priority: complaintForm.priority, description: complaintForm.description, status: "new", createdAt: new Date().toISOString() };
      setComplaints(prev => [newComplaint, ...prev]);
    }
    setShowAddModal(false);
  }

  // ── Export & Print helpers ──────────────────────────────────────────────────
  function exportToCSV() {
    const rows = filtered.length > 0 ? filtered : complaints;
    if (rows.length === 0) { toast.error("لا توجد بيانات للتصدير"); return; }
    const headers = ["رقم الشكوى", "العميل", "التصنيف", "الأولوية", "الحالة", "التاريخ"];
    const csvRows = [
      headers.join(","),
      ...rows.map((c) => [
        c.id,
        `"${(c.customer_name || "—").replace(/"/g, '""')}"`,
        CATEGORY_LABELS[c.category || "other"] || c.category || "أخرى",
        PRIORITY_META[c.priority || "medium"]?.label || c.priority || "—",
        STATUS_META[c.status]?.label || c.status,
        c.createdAt ? new Date(c.createdAt).toLocaleDateString("ar-SA") : "—",
      ].join(",")),
    ];
    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `complaints_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`تم تصدير ${rows.length} شكوى`);
  }

  function printPage() {
    window.print();
  }

  // ── Fetch complaints ──────────────────────────────────────────────────────────
  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [complaintsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/complaints`),
        fetch(`${API_BASE}/api/complaints/stats`),
      ]);

      if (!complaintsRes.ok) throw new Error("فشل تحميل الشكاوى");

      const complaintsData = await complaintsRes.json();
      const items: Complaint[] = Array.isArray(complaintsData)
        ? complaintsData
        : (complaintsData.items ?? complaintsData.data ?? []);
      setComplaints(items);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err: any) {
      setError(err.message || "تعذّر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  // ── Fetch messages for selected complaint ─────────────────────────────────────
  const fetchMessages = useCallback(async (complaintId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/complaint-messages?complaint_id=${complaintId}`);
      if (!res.ok) return;
      const data = await res.json();
      const items: ComplaintMessage[] = Array.isArray(data)
        ? data
        : (data.items ?? []);
      setMessages(items.filter((m) => m.complaint_id === complaintId));
    } catch {
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    if (selectedComplaint) fetchMessages(selectedComplaint.id);
    else setMessages([]);
  }, [selectedComplaint, fetchMessages]);

  // ── Actions ───────────────────────────────────────────────────────────────────

  async function handleAssign(complaintId: string) {
    if (!assignTo.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/complaints/${complaintId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_to: assignTo }),
      });
      if (res.ok) {
        setAssignTo("");
        await fetchComplaints();
        const updated = await res.json();
        setSelectedComplaint(updated);
        toast.success("تم تعيين الشكوى بنجاح");
      } else {
        toast.error("فشل تعيين الشكوى");
      }
    } catch { toast.error("حدث خطأ أثناء التعيين"); }
    setActionLoading(false);
  }

  async function handleResolve(complaintId: string) {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/complaints/${complaintId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution: newMessage || "تم الحل", resolved_by: "admin" }),
      });
      if (res.ok) {
        setNewMessage("");
        await fetchComplaints();
        const updated = await res.json();
        setSelectedComplaint(updated);
        toast.success("تم حل الشكوى بنجاح");
      } else {
        toast.error("فشل حل الشكوى");
      }
    } catch { toast.error("حدث خطأ"); }
    setActionLoading(false);
  }

  async function handleEscalate(complaintId: string) {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/complaints/${complaintId}/escalate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escalated_by: "admin", reason: "يحتاج تدخل إداري" }),
      });
      if (res.ok) {
        await fetchComplaints();
        const updated = await res.json();
        setSelectedComplaint(updated);
        toast.warning("تم تصعيد الشكوى");
      } else {
        toast.error("فشل تصعيد الشكوى");
      }
    } catch { toast.error("حدث خطأ أثناء التصعيد"); }
    setActionLoading(false);
  }

  async function handleSendMessage(complaintId: string) {
    if (!newMessage.trim()) return;
    setActionLoading(true);
    try {
      await fetch(`${API_BASE}/api/complaint-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint_id: complaintId,
          sender_type: "admin",
          sender_name: "مدير النظام",
          message: newMessage,
        }),
      });
      setNewMessage("");
      await fetchMessages(complaintId);
      toast.success("تم إرسال الرسالة");
    } catch { toast.error("فشل إرسال الرسالة"); }
    setActionLoading(false);
  }

  // ── Filtering ─────────────────────────────────────────────────────────────────
  const filtered = complaints.filter((c) => {
    const matchSearch =
      !search ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      (c.customer_name || "").includes(search) ||
      (c.title || "").includes(search) ||
      (c.order_id || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Reset page when filters change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  // ── Stats KPIs ────────────────────────────────────────────────────────────────
  const kpis = stats
    ? [
        { label: "إجمالي الشكاوى", value: stats.total,        accent: "var(--con-text-secondary)", icon: <AlertCircle size={15} /> },
        { label: "مفتوحة",         value: stats.open,          accent: "var(--con-warning)",        icon: <Clock size={15} /> },
        { label: "قيد المعالجة",   value: stats.in_progress,   accent: "var(--con-brand)",          icon: <RefreshCw size={15} /> },
        { label: "مصعّدة",         value: stats.escalated,     accent: "var(--con-danger)",         icon: <AlertTriangle size={15} /> },
        { label: "تم الحل",        value: stats.resolved,      accent: "var(--con-success)",        icon: <CheckCircle2 size={15} /> },
      ]
    : [];

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            background: "rgba(239,68,68,0.12)", borderRadius: 8, padding: 7,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <AlertCircle size={18} style={{ color: "var(--con-danger)" }} />
          </div>
          <h1 style={{
            fontSize: "var(--con-text-page-title, 20px)", fontWeight: 700,
            color: "var(--con-text-primary)", margin: 0,
          }}>
            إدارة الشكاوى
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={openAddComplaint}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 600,
              background: "var(--con-brand)", color: "#fff",
              border: "none", cursor: "pointer",
            }}
          >
            <Plus size={14} />
            تسجيل شكوى
          </button>
          <button
            onClick={exportToCSV}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 500,
              background: "var(--con-bg-surface-1)", color: "var(--con-text-secondary)",
              border: "1px solid var(--con-border-default)", cursor: "pointer",
            }}
          >
            <Download size={14} />
            تصدير CSV
          </button>
          <button
            onClick={printPage}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 500,
              background: "var(--con-bg-surface-1)", color: "var(--con-text-secondary)",
              border: "1px solid var(--con-border-default)", cursor: "pointer",
            }}
          >
            <Printer size={14} />
            طباعة
          </button>
          <button
            onClick={fetchComplaints}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 500,
              background: "var(--con-bg-surface-1)", color: "var(--con-text-secondary)",
              border: "1px solid var(--con-border-default)", cursor: "pointer",
            }}
          >
            <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            تحديث
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
          {kpis.map((kpi) => (
            <div key={kpi.label} className="con-kpi-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: kpi.accent }}>{kpi.icon}</span>
              </div>
              <div className="con-kpi-value" style={{ color: kpi.accent }}>{kpi.value}</div>
              <div style={{ fontSize: "var(--con-text-caption, 11px)", color: "var(--con-text-muted)", marginTop: 4 }}>
                {kpi.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Error Banner ── */}
      {error && (
        <div style={{
          padding: "10px 16px", borderRadius: 8,
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
          color: "var(--con-danger)", fontSize: 13,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
        padding: "10px 16px", borderRadius: 8,
        background: "var(--con-bg-surface-1)", border: "1px solid var(--con-border-default)",
      }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search size={14} style={{ position: "absolute", insetInlineEnd: 10, top: "50%", transform: "translateY(-50%)", color: "var(--con-text-muted)" }} />
          <input
            className="con-input"
            placeholder="بحث برقم الشكوى أو اسم العميل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", paddingInlineEnd: 32, fontSize: 12 }}
          />
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }} className="button-group-filter" role="group">
          {(["all", "new", "assigned", "in_progress", "escalated", "resolved"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${statusFilter === s ? "border-[var(--con-brand)] bg-[var(--con-brand-subtle,rgba(59,130,246,0.1))] text-[var(--con-brand)]" : "border-[var(--con-border-default)] bg-transparent text-[var(--con-text-muted)] hover:border-[var(--con-brand)] hover:text-[var(--con-brand)]"}`}
            >
              {s === "all" ? "الكل" : STATUS_META[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content: Table + Detail Panel ── */}
      <div style={{ display: "flex", gap: 14, minHeight: 400 }}>

        {/* ── Complaints Table ── */}
        <div style={{
          flex: 1,
          background: "var(--con-bg-surface-1)",
          border: "1px solid var(--con-border-default)",
          borderRadius: 10, overflow: "hidden",
        }}>
          <div style={{ overflowX: "auto" }}>
            <table className="con-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>رقم الشكوى</th>
                  <th>العميل</th>
                  <th>التصنيف</th>
                  <th>الأولوية</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--con-text-muted)" }}>
                      <RefreshCw size={16} style={{ animation: "spin 1s linear infinite", marginLeft: 8, display: "inline" }} />
                      جارٍ التحميل...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--con-text-muted)" }}>
                      لا توجد شكاوى
                    </td>
                  </tr>
                ) : (
                  paged.map((c) => {
                    const sm = STATUS_META[c.status] || STATUS_META.new;
                    const pm = PRIORITY_META[c.priority || "medium"] || PRIORITY_META.medium;
                    const isSelected = selectedComplaint?.id === c.id;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedComplaint(isSelected ? null : c)}
                        style={{
                          cursor: "pointer",
                          background: isSelected ? "var(--con-brand-subtle, rgba(59,130,246,0.06))" : undefined,
                          transition: "background 0.1s",
                        }}
                      >
                        <td>
                          <span style={{ fontFamily: "var(--con-font-mono)", fontSize: 12, color: "var(--con-brand)" }}>
                            {c.id}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500, color: "var(--con-text-primary)" }}>
                          {c.customer_name || "—"}
                        </td>
                        <td>
                          <span style={{
                            fontSize: 11, padding: "2px 8px", borderRadius: 5,
                            background: "var(--con-bg-surface-2)",
                            color: "var(--con-text-secondary)",
                            border: "1px solid var(--con-border-default)",
                          }}>
                            {CATEGORY_LABELS[c.category || "other"] || c.category || "أخرى"}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: 11, fontWeight: 600, color: pm.color }}>
                            {pm.label}
                          </span>
                        </td>
                        <td>
                          <span className={`con-badge con-badge-sm ${sm.badgeClass}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            {sm.icon} {sm.label}
                          </span>
                        </td>
                        <td style={{ fontSize: 11, color: "var(--con-text-muted)" }}>
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString("ar-SA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                        </td>
                        <td>
                          <button onClick={(e) => { e.stopPropagation(); openEditComplaint(c); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--con-text-muted)", padding: 4 }} title="تعديل">
                            <Pencil size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ padding: "10px 16px", borderTop: "1px solid var(--con-border-default)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious onClick={() => setPage(p => Math.max(1, p - 1))} style={{ cursor: page === 1 ? "default" : "pointer", opacity: page === 1 ? 0.4 : 1 }} />
                  </PaginationItem>
                  <PaginationItem>
                    <span style={{ fontSize: 12, color: "var(--con-text-muted)", padding: "0 8px" }}>
                      {page} / {totalPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext onClick={() => setPage(p => Math.min(totalPages, p + 1))} style={{ cursor: page === totalPages ? "default" : "pointer", opacity: page === totalPages ? 0.4 : 1 }} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>

        {/* ── Detail Panel ── */}
        {selectedComplaint && (
          <div style={{
            width: 360, flexShrink: 0,
            background: "var(--con-bg-surface-1)",
            border: "1px solid var(--con-border-default)",
            borderRadius: 10,
            display: "flex", flexDirection: "column",
            overflow: "hidden",
          }}>
            {/* Detail Header */}
            <div style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--con-border-default)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: "var(--con-font-mono)", fontSize: 13, fontWeight: 700, color: "var(--con-brand)" }}>
                  {selectedComplaint.id}
                </span>
                <button
                  onClick={() => setSelectedComplaint(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--con-text-muted)", padding: 4 }}
                >
                  <XCircle size={16} />
                </button>
              </div>

              {selectedComplaint.title && (
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--con-text-primary)", margin: "0 0 6px" }}>
                  {selectedComplaint.title}
                </p>
              )}

              {selectedComplaint.description && (
                <p style={{ fontSize: 12, color: "var(--con-text-secondary)", margin: "0 0 10px", lineHeight: 1.6 }}>
                  {selectedComplaint.description}
                </p>
              )}

              {/* Customer Info */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
                {selectedComplaint.customer_name && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--con-text-secondary)" }}>
                    <User size={12} /> {selectedComplaint.customer_name}
                  </div>
                )}
                {selectedComplaint.customer_phone && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--con-text-secondary)" }}>
                    <Phone size={12} /> {selectedComplaint.customer_phone}
                  </div>
                )}
                {selectedComplaint.platform && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--con-text-secondary)" }}>
                    <Tag size={12} /> {selectedComplaint.platform}
                  </div>
                )}
                {selectedComplaint.order_id && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--con-text-secondary)" }}>
                    <MessageSquare size={12} /> طلب: {selectedComplaint.order_id}
                  </div>
                )}
                {selectedComplaint.assigned_to && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--con-brand)" }}>
                    <User size={12} /> مسند إلى: {selectedComplaint.assigned_to}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {selectedComplaint.status !== "resolved" && selectedComplaint.status !== "closed" && (
              <div style={{
                padding: "10px 16px",
                borderBottom: "1px solid var(--con-border-default)",
                display: "flex", flexDirection: "column", gap: 8,
              }}>
                {/* Assign */}
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    className="con-input"
                    placeholder="إسناد إلى..."
                    value={assignTo}
                    onChange={(e) => setAssignTo(e.target.value)}
                    style={{ flex: 1, fontSize: 12 }}
                  />
                  <button
                    onClick={() => handleAssign(selectedComplaint.id)}
                    disabled={actionLoading || !assignTo.trim()}
                    style={{
                      padding: "4px 10px", borderRadius: 5, fontSize: 11, fontWeight: 600,
                      background: "rgba(59,130,246,0.1)", color: "var(--con-brand)",
                      border: "1px solid rgba(59,130,246,0.25)", cursor: "pointer",
                    }}
                  >
                    إسناد
                  </button>
                </div>

                {/* Resolve / Escalate */}
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => handleResolve(selectedComplaint.id)}
                    disabled={actionLoading}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                      padding: "6px 10px", borderRadius: 5, fontSize: 11, fontWeight: 600,
                      background: "rgba(22,163,74,0.1)", color: "var(--con-success)",
                      border: "1px solid rgba(22,163,74,0.25)", cursor: "pointer",
                    }}
                  >
                    <CheckCircle2 size={12} /> حل الشكوى
                  </button>
                  <button
                    onClick={() => handleEscalate(selectedComplaint.id)}
                    disabled={actionLoading}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                      padding: "6px 10px", borderRadius: 5, fontSize: 11, fontWeight: 600,
                      background: "rgba(239,68,68,0.08)", color: "var(--con-danger)",
                      border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer",
                    }}
                  >
                    <AlertTriangle size={12} /> تصعيد
                  </button>
                </div>
              </div>
            )}

            {/* Messages Thread */}
            <div style={{ flex: 1, overflowY: "auto", padding: "10px 16px" }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--con-text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                سجل المحادثات
              </p>
              {messages.length === 0 ? (
                <p style={{ fontSize: 12, color: "var(--con-text-muted)", textAlign: "center", padding: 16 }}>
                  لا توجد رسائل بعد
                </p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} style={{
                    marginBottom: 8, padding: "8px 10px", borderRadius: 8,
                    background: msg.sender_type === "admin" ? "var(--con-brand-subtle, rgba(59,130,246,0.06))" : "var(--con-bg-surface-2)",
                    border: "1px solid var(--con-border-default)",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: msg.sender_type === "admin" ? "var(--con-brand)" : "var(--con-text-secondary)" }}>
                        {msg.sender_name || msg.sender_type || "نظام"}
                      </span>
                      <span style={{ fontSize: 10, color: "var(--con-text-muted)" }}>
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--con-text-primary)", margin: 0, lineHeight: 1.5 }}>
                      {msg.message}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            {selectedComplaint.status !== "resolved" && selectedComplaint.status !== "closed" && (
              <div style={{
                padding: "10px 16px",
                borderTop: "1px solid var(--con-border-default)",
                display: "flex", gap: 6,
              }}>
                <input
                  className="con-input"
                  placeholder="اكتب رسالة..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(selectedComplaint.id); } }}
                  style={{ flex: 1, fontSize: 12 }}
                />
                <button
                  onClick={() => handleSendMessage(selectedComplaint.id)}
                  disabled={actionLoading || !newMessage.trim()}
                  style={{
                    padding: "6px 10px", borderRadius: 5,
                    background: "var(--con-brand)", color: "#fff",
                    border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center",
                  }}
                >
                  <Send size={14} />
                </button>
              </div>
            )}

            {/* Resolution Info */}
            {(selectedComplaint.status === "resolved" || selectedComplaint.status === "closed") && selectedComplaint.resolution && (
              <div style={{
                padding: "10px 16px",
                borderTop: "1px solid var(--con-border-default)",
                background: "rgba(22,163,74,0.05)",
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--con-success)", marginBottom: 4 }}>
                  <CheckCircle2 size={12} style={{ display: "inline", marginLeft: 4 }} />
                  الحل
                </p>
                <p style={{ fontSize: 12, color: "var(--con-text-secondary)", margin: 0 }}>
                  {selectedComplaint.resolution}
                </p>
                {selectedComplaint.resolvedBy && (
                  <p style={{ fontSize: 11, color: "var(--con-text-muted)", marginTop: 4 }}>
                    بواسطة: {selectedComplaint.resolvedBy} — {selectedComplaint.resolvedAt ? new Date(selectedComplaint.resolvedAt).toLocaleDateString("ar-SA") : ""}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Complaint Modal */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowAddModal(false)}>
          <div dir="rtl" onClick={e => e.stopPropagation()} style={{ background: "var(--con-bg-surface-1, #fff)", border: "1px solid var(--con-border-default)", borderRadius: 12, padding: 24, width: 440, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--con-text-primary)", margin: 0 }}>{editingItem ? "تعديل الشكوى" : "تسجيل شكوى جديدة"}</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--con-text-muted)" }}><X size={18} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--con-text-secondary)", marginBottom: 4, display: "block" }}>اسم العميل</label>
                <input className="con-input" value={complaintForm.customer_name} onChange={e => setComplaintForm(f => ({ ...f, customer_name: e.target.value }))} placeholder="اسم العميل" style={{ width: "100%", fontSize: 12 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--con-text-secondary)", marginBottom: 4, display: "block" }}>رقم الطلب</label>
                <input className="con-input" value={complaintForm.order_id} onChange={e => setComplaintForm(f => ({ ...f, order_id: e.target.value }))} placeholder="رقم الطلب (اختياري)" style={{ width: "100%", fontSize: 12 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--con-text-secondary)", marginBottom: 4, display: "block" }}>عنوان الشكوى</label>
                <input className="con-input" value={complaintForm.title} onChange={e => setComplaintForm(f => ({ ...f, title: e.target.value }))} placeholder="عنوان مختصر" style={{ width: "100%", fontSize: 12 }} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: "var(--con-text-secondary)", marginBottom: 4, display: "block" }}>التصنيف</label>
                  <select value={complaintForm.category} onChange={e => setComplaintForm(f => ({ ...f, category: e.target.value }))} style={{ width: "100%", padding: "6px 10px", borderRadius: 7, border: "1px solid var(--con-border-default)", fontSize: 12, background: "var(--con-bg-surface-2)", color: "var(--con-text-primary)" }}>
                    <option value="delivery">مشكلة توصيل</option>
                    <option value="quality">جودة الخدمة</option>
                    <option value="payment">مشكلة مالية</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: "var(--con-text-secondary)", marginBottom: 4, display: "block" }}>الأولوية</label>
                  <select value={complaintForm.priority} onChange={e => setComplaintForm(f => ({ ...f, priority: e.target.value }))} style={{ width: "100%", padding: "6px 10px", borderRadius: 7, border: "1px solid var(--con-border-default)", fontSize: 12, background: "var(--con-bg-surface-2)", color: "var(--con-text-primary)" }}>
                    <option value="low">منخفضة</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">عالية</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--con-text-secondary)", marginBottom: 4, display: "block" }}>الوصف</label>
                <textarea className="con-input" value={complaintForm.description} onChange={e => setComplaintForm(f => ({ ...f, description: e.target.value }))} placeholder="تفاصيل الشكوى..." rows={3} style={{ width: "100%", fontSize: 12, resize: "vertical" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-start" }}>
              <button onClick={handleSaveComplaint} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", borderRadius: 7, background: "var(--con-brand)", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}><Save size={14} />{editingItem ? "حفظ التعديل" : "تسجيل"}</button>
              <button onClick={() => setShowAddModal(false)} style={{ padding: "8px 20px", borderRadius: 7, background: "var(--con-bg-surface-2)", color: "var(--con-text-secondary)", border: "1px solid var(--con-border-default)", fontSize: 13, cursor: "pointer" }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Spinner animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
