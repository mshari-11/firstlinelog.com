import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  RefreshCw,
  AlertCircle,
  UserCheck,
  UserX,
  Users,
  Clock,
  Building2,
  Download,
  Printer,
  Plus,
  X,
} from "lucide-react";
import { PageWrapper, PageHeader } from "@/components/admin/ui";

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
import { API_BASE } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type AttendanceStatus = "present" | "late" | "absent";
interface AttendanceEntry {
  id: string;
  name: string;
  department: string;
  checkIn: string;
  checkOut: string;
  status: AttendanceStatus;
  date: string;
}

const STATUS_MAP: Record<AttendanceStatus, { label: string; cls: string }> = {
  present: { label: "حاضر", cls: "con-badge-success" },
  late: { label: "متأخر", cls: "con-badge-warning" },
  absent: { label: "غائب", cls: "con-badge-danger" },
};



export default function Attendance() {
  const navigate = useNavigate();
  const [data, setData] = useState<AttendanceEntry[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AttendanceStatus | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinForm, setCheckinForm] = useState({
    name: "",
    time: "",
    type: "check-in" as "check-in" | "check-out",
  });

  useEffect(() => {
    fetchData();
  }, []);
  async function fetchData() {
    setLoading(true);
    // Try Supabase first
    if (supabase) {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const { data: rows, error } = await supabase
          .from("attendance")
          .select("*")
          .gte("date", today)
          .order("check_in", { ascending: true });
        if (!error && rows && rows.length > 0) {
          setData(rows.map((r: any) => ({
            id: r.id || `ATT-${r.id}`,
            name: r.employee_name || r.name || "موظف",
            department: r.department || "غير محدد",
            checkIn: r.check_in || "—",
            checkOut: r.check_out || "—",
            status: r.status || (r.check_in ? (r.check_in > "08:15" ? "late" : "present") : "absent"),
            date: r.date || new Date().toISOString().slice(0, 10),
          })));
          setLoading(false);
          return;
        }
      } catch { /* fall through */ }
    }
    // Fallback to API
    try {
      const res = await fetch(`${API_BASE}/api/attendance`);
      if (res.ok) {
        const d = await res.json();
        if (Array.isArray(d) && d.length) setData(d);
      }
    } catch { /* keep mock */ }
    setLoading(false);
  }

  const filtered = data.filter((a) => {
    const matchSearch =
      a.name.includes(search) || a.department.includes(search);
    const matchFilter = filter === "all" || a.status === filter;
    if (dateFrom && a.date < dateFrom) return false;
    if (dateTo && a.date > dateTo) return false;
    return matchSearch && matchFilter;
  });

  const stats = {
    present: data.filter((a) => a.status === "present").length,
    late: data.filter((a) => a.status === "late").length,
    absent: data.filter((a) => a.status === "absent").length,
    total: data.length,
  };

  return (
    <PageWrapper>
      <PageHeader
        icon={Clock}
        title="الحضور والانصراف"
        subtitle="متابعة حضور وانصراف الموظفين"
        actions={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <button
              className="con-btn-ghost"
              onClick={() => {
                window.print();
              }}
            >
              <Printer size={14} /> طباعة
            </button>
            <button
              className="con-btn-ghost"
              onClick={() => {
                const rows = data.map((a) => ({
                  الاسم: a.name,
                  القسم: a.department,
                  وقت_الحضور: a.checkIn,
                  وقت_الانصراف: a.checkOut,
                  الحالة: STATUS_MAP[a.status].label,
                }));
                downloadCSV(rows, "attendance_export");
              }}
            >
              <Download size={14} /> تصدير CSV
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
            <button
              className="con-btn-primary"
              onClick={() => setShowCheckinModal(true)}
            >
              <Plus size={14} /> تسجيل يدوي
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
            label: "حاضرين",
            value: stats.present,
            icon: UserCheck,
            accent: "var(--con-success)",
            onClick: () => setFilter("present"),
          },
          {
            label: "متأخرين",
            value: stats.late,
            icon: Clock,
            accent: "var(--con-warning)",
            onClick: () => setFilter("late"),
          },
          {
            label: "غائبين",
            value: stats.absent,
            icon: UserX,
            accent: "var(--con-danger)",
            onClick: () => setFilter("absent"),
          },
          {
            label: "الإجمالي",
            value: stats.total,
            icon: Users,
            accent: "var(--con-brand)",
            onClick: () => navigate("/admin-panel/staff"),
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 12, color: "var(--con-text-muted)", whiteSpace: "nowrap" }}>من</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{
              background: "var(--con-bg, #07111d)",
              border: "1px solid var(--con-border, #1a3a52)",
              borderRadius: 8,
              padding: "6px 12px",
              color: "var(--con-text, #e2e8f0)",
              fontSize: 13,
              fontFamily: "inherit",
            }}
          />
          <label style={{ fontSize: 12, color: "var(--con-text-muted)", whiteSpace: "nowrap" }}>إلى</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{
              background: "var(--con-bg, #07111d)",
              border: "1px solid var(--con-border, #1a3a52)",
              borderRadius: 8,
              padding: "6px 12px",
              color: "var(--con-text, #e2e8f0)",
              fontSize: 13,
              fontFamily: "inherit",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "present", "late", "absent"] as const).map((s) => (
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
            <div>لا توجد سجلات مطابقة</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="con-table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>القسم</th>
                  <th>وقت الحضور</th>
                  <th>وقت الانصراف</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td
                      style={{ cursor: "pointer", color: "var(--con-brand)" }}
                      onClick={() => navigate("/admin-panel/staff")}
                    >
                      {a.name}
                    </td>
                    <td
                      style={{ cursor: "pointer", color: "var(--con-brand)" }}
                      onClick={() => navigate("/admin-panel/staff")}
                    >
                      <Building2
                        size={12}
                        style={{ display: "inline", marginLeft: 4 }}
                      />
                      {a.department}
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: "var(--con-font-mono)",
                          fontSize: 12,
                        }}
                      >
                        {a.checkIn}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: "var(--con-font-mono)",
                          fontSize: 12,
                        }}
                      >
                        {a.checkOut}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`con-badge con-badge-sm ${STATUS_MAP[a.status].cls}`}
                      >
                        {STATUS_MAP[a.status].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Check-in Modal */}
      {showCheckinModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCheckinModal(false);
          }}
        >
          <div
            dir="rtl"
            style={{
              background: "var(--con-bg-elevated)",
              border: "1px solid var(--con-border-strong)",
              borderRadius: 12,
              width: "100%",
              maxWidth: 400,
              boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px",
                borderBottom: "1px solid var(--con-border-default)",
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--con-text-primary)",
                  margin: 0,
                }}
              >
                تسجيل حضور يدوي
              </h2>
              <button
                onClick={() => setShowCheckinModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--con-text-muted)",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div
              style={{
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: "var(--con-text-muted)",
                    fontWeight: 600,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  اسم الموظف *
                </label>
                <input
                  className="con-input"
                  value={checkinForm.name}
                  placeholder="اسم الموظف"
                  onChange={(e) =>
                    setCheckinForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: "var(--con-text-muted)",
                    fontWeight: 600,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  الوقت *
                </label>
                <input
                  className="con-input"
                  type="time"
                  value={checkinForm.time}
                  onChange={(e) =>
                    setCheckinForm((prev) => ({
                      ...prev,
                      time: e.target.value,
                    }))
                  }
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: "var(--con-text-muted)",
                    fontWeight: 600,
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  النوع
                </label>
                <select
                  className="con-input"
                  value={checkinForm.type}
                  onChange={(e) =>
                    setCheckinForm((prev) => ({
                      ...prev,
                      type: e.target.value as "check-in" | "check-out",
                    }))
                  }
                  style={{ width: "100%" }}
                >
                  <option value="check-in">تسجيل حضور</option>
                  <option value="check-out">تسجيل انصراف</option>
                </select>
              </div>
              <button
                className="con-btn-primary"
                disabled={!checkinForm.name || !checkinForm.time}
                onClick={() => {
                  const existing = data.find(
                    (a) => a.name === checkinForm.name,
                  );
                  if (existing) {
                    setData((prev) =>
                      prev.map((a) =>
                        a.id === existing.id
                          ? {
                              ...a,
                              ...(checkinForm.type === "check-in"
                                ? {
                                    checkIn: checkinForm.time,
                                    status: "present" as AttendanceStatus,
                                  }
                                : { checkOut: checkinForm.time }),
                            }
                          : a,
                      ),
                    );
                  } else {
                    const next: AttendanceEntry = {
                      id: `ATT-${Date.now()}`,
                      name: checkinForm.name,
                      department: "—",
                      checkIn:
                        checkinForm.type === "check-in"
                          ? checkinForm.time
                          : "—",
                      checkOut:
                        checkinForm.type === "check-out"
                          ? checkinForm.time
                          : "—",
                      status: "present",
                      date: new Date().toISOString().slice(0, 10),
                    };
                    setData((prev) => [next, ...prev]);
                  }
                  // Persist to Supabase
                  if (supabase) {
                    supabase.from("attendance").insert({
                      employee_name: checkinForm.name,
                      check_in: checkinForm.type === "check-in" ? checkinForm.time : null,
                      check_out: checkinForm.type === "check-out" ? checkinForm.time : null,
                      date: new Date().toISOString().slice(0, 10),
                      status: "present",
                    }).then(({ error }) => {
                      if (error) toast.error("فشل حفظ تسجيل الحضور: " + error.message);
                    });
                  }
                  setShowCheckinModal(false);
                  setCheckinForm({ name: "", time: "", type: "check-in" });
                }}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  marginTop: 4,
                }}
              >
                <Plus size={14} /> تسجيل
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
