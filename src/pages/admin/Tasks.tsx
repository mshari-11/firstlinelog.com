import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  RefreshCw,
  AlertCircle,
  ListTodo,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Plus,
  X,
  Download,
  Printer,
  Edit2,
  Trash2,
} from "lucide-react";
import { API_BASE } from "@/lib/api";
import { toast } from "sonner";
import { PageWrapper, PageHeader, Modal } from "@/components/admin/ui";

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

type Priority = "high" | "medium" | "low";
type TaskStatus = "pending" | "in_progress" | "completed" | "overdue";
interface Task {
  id: string;
  title: string;
  assignee: string;
  priority: Priority;
  status: TaskStatus;
  date: string;
  description?: string;
}

const STATUS_MAP: Record<TaskStatus, { label: string; cls: string }> = {
  pending: { label: "معلقة", cls: "con-badge-warning" },
  in_progress: { label: "قيد التنفيذ", cls: "con-badge-info" },
  completed: { label: "مكتملة", cls: "con-badge-success" },
  overdue: { label: "متأخرة", cls: "con-badge-danger" },
};

const PRIORITY_MAP: Record<Priority, { label: string; cls: string }> = {
  high: { label: "عالية", cls: "con-badge-danger" },
  medium: { label: "متوسطة", cls: "con-badge-warning" },
  low: { label: "منخفضة", cls: "con-badge-info" },
};


export default function Tasks() {
  const navigate = useNavigate();
  const [data, setData] = useState<Task[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignee: "",
    priority: "medium" as Priority,
    status: "pending" as TaskStatus,
  });

  useEffect(() => {
    fetchData();
  }, []);
  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/tasks`);
      if (res.ok) {
        const d = await res.json();
        if (Array.isArray(d) && d.length) setData(d);
      }
    } catch {
      /* keep mock */
    }
    setLoading(false);
  }

  function resetForm() {
    setForm({ title: "", description: "", assignee: "", priority: "medium", status: "pending" });
  }

  function openCreate() {
    setEditingTask(null);
    resetForm();
    setShowModal(true);
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || "",
      assignee: task.assignee,
      priority: task.priority,
      status: task.status,
    });
    setShowModal(true);
  }

  async function handleAdd() {
    const newTask: Task = {
      id: `TSK-${String(data.length + 1).padStart(3, "0")}`,
      title: form.title,
      assignee: form.assignee,
      priority: form.priority,
      status: "pending",
      date: new Date().toISOString(),
      description: form.description,
    };
    try {
      await fetch(`${API_BASE}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
    } catch {}
    setData((prev) => [newTask, ...prev]);
    resetForm();
    setShowModal(false);
    toast.success("تم إضافة المهمة");
  }

  async function handleEdit() {
    if (!editingTask) return;
    const updated: Task = {
      ...editingTask,
      title: form.title,
      description: form.description,
      assignee: form.assignee,
      priority: form.priority,
      status: form.status,
    };
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (url && key) {
        const supabase = createClient(url, key);
        if (supabase) {
          await supabase
            .schema("admin" as any)
            .from("tasks")
            .update({
              title: updated.title,
              description: updated.description,
              assignee: updated.assignee,
              priority: updated.priority,
              status: updated.status,
            })
            .eq("id", updated.id);
        }
      }
    } catch { /* keep local */ }
    setData((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    resetForm();
    setEditingTask(null);
    setShowModal(false);
    toast.success("تم تحديث المهمة");
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (url && key) {
        const supabase = createClient(url, key);
        if (supabase) {
          await supabase
            .schema("admin" as any)
            .from("tasks")
            .delete()
            .eq("id", deleteTarget.id);
        }
      }
    } catch { /* keep local */ }
    setData((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success("تم حذف المهمة");
  }

  const filtered = data.filter((a) => {
    const matchSearch = a.title.includes(search) || a.assignee.includes(search);
    const matchFilter = filter === "all" || a.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    pending: data.filter((a) => a.status === "pending").length,
    in_progress: data.filter((a) => a.status === "in_progress").length,
    completed: data.filter((a) => a.status === "completed").length,
    overdue: data.filter((a) => a.status === "overdue").length,
  };

  return (
    <PageWrapper>
      <PageHeader
        icon={ListTodo}
        title="المهام"
        subtitle="إدارة المهام وتتبع التقدم"
        actions={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className="con-btn-primary"
              onClick={openCreate}
            >
              <Plus size={14} /> مهمة جديدة
            </button>
            <button
              className="con-btn-primary"
              style={{
                background: "var(--con-success)",
                borderColor: "var(--con-success)",
              }}
              onClick={() => {
                const targets = filtered.filter((t) => t.status !== "completed");
                if (!targets.length) {
                  toast.info("جميع المهام مكتملة");
                  return;
                }
                setData((prev) =>
                  prev.map((t) =>
                    targets.find((tt) => tt.id === t.id)
                      ? { ...t, status: "completed" as TaskStatus }
                      : t,
                  ),
                );
                toast.success(`تم إكمال ${targets.length} مهمة`);
              }}
            >
              <CheckCircle2 size={14} /> إكمال المعروضة
            </button>
            <button
              className="con-btn-ghost"
              onClick={() =>
                downloadCSV(
                  filtered.map((t) => ({
                    الرقم: t.id,
                    العنوان: t.title,
                    المعيّن: t.assignee,
                    الأولوية: PRIORITY_MAP[t.priority].label,
                    الحالة: STATUS_MAP[t.status].label,
                    التاريخ: t.date,
                  })),
                  "tasks.csv",
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
            label: "معلقة",
            value: stats.pending,
            icon: Clock,
            accent: "var(--con-warning)",
            onClick: () => setFilter("pending"),
          },
          {
            label: "قيد التنفيذ",
            value: stats.in_progress,
            icon: ListTodo,
            accent: "var(--con-brand)",
            onClick: () => setFilter("in_progress"),
          },
          {
            label: "مكتملة",
            value: stats.completed,
            icon: CheckCircle2,
            accent: "var(--con-success)",
            onClick: () => setFilter("completed"),
          },
          {
            label: "متأخرة",
            value: stats.overdue,
            icon: XCircle,
            accent: "var(--con-danger)",
            onClick: () => setFilter("overdue"),
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
          {(
            ["all", "pending", "in_progress", "completed", "overdue"] as const
          ).map((s) => (
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
              {s === "all" ? "الكل" : STATUS_MAP[s].label}
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
            <div>لا توجد مهام مطابقة</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="con-table">
              <thead>
                <tr>
                  <th>العنوان</th>
                  <th>المعيّن</th>
                  <th>الأولوية</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <span style={{ fontWeight: 600 }}>{a.title}</span>
                    </td>
                    <td
                      style={{ cursor: "pointer", color: "var(--con-brand)" }}
                      onClick={() => navigate("/admin-panel/staff")}
                    >
                      {a.assignee}
                    </td>
                    <td>
                      <span
                        className={`con-badge con-badge-sm ${PRIORITY_MAP[a.priority].cls}`}
                      >
                        {PRIORITY_MAP[a.priority].label}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`con-badge con-badge-sm ${STATUS_MAP[a.status].cls}`}
                      >
                        {STATUS_MAP[a.status].label}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: "var(--con-font-mono)",
                          fontSize: 12,
                        }}
                      >
                        {new Date(a.date).toLocaleDateString("ar-SA")}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          className="con-btn-ghost"
                          style={{ padding: 4, borderRadius: 6 }}
                          title="تعديل"
                          onClick={() => openEdit(a)}
                        >
                          <Edit2 size={14} style={{ color: "var(--con-brand)" }} />
                        </button>
                        <button
                          className="con-btn-ghost"
                          style={{ padding: 4, borderRadius: 6 }}
                          title="حذف"
                          onClick={() => setDeleteTarget(a)}
                        >
                          <Trash2 size={14} style={{ color: "var(--con-danger)" }} />
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

      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingTask(null); resetForm(); }}
        title={editingTask ? "تعديل المهمة" : "مهمة جديدة"}
        width={450}
        actions={
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-start" }}>
            <button
              className="con-btn-primary"
              onClick={editingTask ? handleEdit : handleAdd}
              disabled={!form.title || !form.assignee}
            >
              {editingTask ? (
                <><Edit2 size={14} /> حفظ التعديلات</>
              ) : (
                <><Plus size={14} /> إضافة</>
              )}
            </button>
            <button
              className="con-btn-ghost"
              onClick={() => { setShowModal(false); setEditingTask(null); resetForm(); }}
            >
              إلغاء
            </button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginBottom: 4, display: "block" }}>العنوان</label>
            <input
              className="con-input"
              placeholder="العنوان"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginBottom: 4, display: "block" }}>الوصف</label>
            <textarea
              className="con-input"
              placeholder="الوصف"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              style={{ width: "100%", minHeight: 70, resize: "vertical" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginBottom: 4, display: "block" }}>المعيّن</label>
            <input
              className="con-input"
              placeholder="المعيّن"
              value={form.assignee}
              onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginBottom: 4, display: "block" }}>الأولوية</label>
            <select
              className="con-input"
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Priority }))}
              style={{ width: "100%" }}
            >
              <option value="high">عالية</option>
              <option value="medium">متوسطة</option>
              <option value="low">منخفضة</option>
            </select>
          </div>
          {editingTask && (
            <div>
              <label style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginBottom: 4, display: "block" }}>الحالة</label>
              <select
                className="con-input"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TaskStatus }))}
                style={{ width: "100%" }}
              >
                <option value="pending">معلقة</option>
                <option value="in_progress">قيد التنفيذ</option>
                <option value="completed">مكتملة</option>
                <option value="overdue">متأخرة</option>
              </select>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="تأكيد الحذف"
        width={400}
        actions={
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-start" }}>
            <button
              className="con-btn-primary"
              style={{ background: "var(--con-danger)", borderColor: "var(--con-danger)" }}
              onClick={handleDelete}
            >
              <Trash2 size={14} /> حذف
            </button>
            <button
              className="con-btn-ghost"
              onClick={() => setDeleteTarget(null)}
            >
              إلغاء
            </button>
          </div>
        }
      >
        <p style={{ color: "var(--con-text-secondary)", margin: 0, lineHeight: 1.7 }}>
          هل أنت متأكد من حذف المهمة <strong style={{ color: "var(--con-text-primary)" }}>{deleteTarget?.title}</strong>؟
          <br />
          لا يمكن التراجع عن هذا الإجراء.
        </p>
      </Modal>
    </PageWrapper>
  );
}
