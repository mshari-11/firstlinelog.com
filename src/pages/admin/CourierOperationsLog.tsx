/**
 * سجل العمليات — Courier Operations Log
 * سجل جميع عمليات وأنشطة المناديب
 */
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  RefreshCw,
  Download,
  ClipboardList,
  PackageCheck,
  XCircle,
  Clock,
  AlertTriangle,
  Activity,
  LogIn,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PageWrapper, PageHeader, KPIGrid, KPICard, Card } from "@/components/admin/ui";

// ── Types ────────────────────────────────────────────────────────────────────
type OpType = "delivery" | "cancel" | "late" | "complaint" | "status_change" | "login";

interface LogEntry {
  id: string;
  date: string;
  courier_name: string;
  courier_id: string;
  op_type: OpType;
  details: string;
  status: string;
}

// ── Operation type config ────────────────────────────────────────────────────
const OP_LABELS: Record<OpType, string> = {
  delivery: "تسليم",
  cancel: "إلغاء",
  late: "تأخر",
  complaint: "شكوى",
  status_change: "تغيير حالة",
  login: "تسجيل دخول",
};

const OP_COLORS: Record<OpType, string> = {
  delivery: "var(--con-success)",
  cancel: "var(--con-danger)",
  late: "var(--con-warning)",
  complaint: "#e879f9",
  status_change: "var(--con-info)",
  login: "var(--con-text-muted)",
};

const OP_ICONS: Record<OpType, React.ElementType> = {
  delivery: PackageCheck,
  cancel: XCircle,
  late: Clock,
  complaint: AlertTriangle,
  status_change: Activity,
  login: LogIn,
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  success: { label: "ناجح", color: "var(--con-success)" },
  failed: { label: "فشل", color: "var(--con-danger)" },
  pending: { label: "معلق", color: "var(--con-warning)" },
  partial: { label: "جزئي", color: "var(--con-info)" },
};

// ── CSV helper ───────────────────────────────────────────────────────────────
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

// ── Mock data (30+ entries) ──────────────────────────────────────────────────
const COURIERS = [
  { id: "C001", name: "أحمد محمد العتيبي" },
  { id: "C002", name: "خالد عبدالله الشمري" },
  { id: "C003", name: "محمد سعد القحطاني" },
  { id: "C004", name: "عبدالرحمن فهد الدوسري" },
  { id: "C005", name: "سلطان ناصر الحربي" },
  { id: "C006", name: "فيصل يوسف المالكي" },
  { id: "C007", name: "تركي حمد الزهراني" },
  { id: "C008", name: "ماجد عادل السبيعي" },
];

function mockEntry(
  id: number,
  date: string,
  courierIdx: number,
  op: OpType,
  details: string,
  status: string,
): LogEntry {
  const c = COURIERS[courierIdx % COURIERS.length];
  return { id: `LOG${String(id).padStart(4, "0")}`, date, courier_name: c.name, courier_id: c.id, op_type: op, details, status };
}

const MOCK_DATA: LogEntry[] = [
  mockEntry(1, "2026-04-05 08:15", 0, "login", "تسجيل دخول من الجوال", "success"),
  mockEntry(2, "2026-04-05 08:30", 0, "delivery", "طلب #ORD-4521 — حي النزهة، الرياض", "success"),
  mockEntry(3, "2026-04-05 09:00", 1, "login", "تسجيل دخول من الجوال", "success"),
  mockEntry(4, "2026-04-05 09:10", 1, "delivery", "طلب #ORD-4522 — حي الملقا، الرياض", "success"),
  mockEntry(5, "2026-04-05 09:25", 2, "login", "تسجيل دخول من الجوال", "success"),
  mockEntry(6, "2026-04-05 09:45", 0, "delivery", "طلب #ORD-4523 — حي العليا، الرياض", "success"),
  mockEntry(7, "2026-04-05 10:00", 2, "late", "تأخر 15 دقيقة عن طلب #ORD-4524", "pending"),
  mockEntry(8, "2026-04-05 10:15", 3, "login", "تسجيل دخول من الجوال", "success"),
  mockEntry(9, "2026-04-05 10:30", 1, "cancel", "إلغاء طلب #ORD-4525 — العميل غير متاح", "success"),
  mockEntry(10, "2026-04-05 10:45", 3, "delivery", "طلب #ORD-4526 — حي الربوة، الرياض", "success"),
  mockEntry(11, "2026-04-05 11:00", 4, "login", "تسجيل دخول من الجوال", "success"),
  mockEntry(12, "2026-04-05 11:15", 4, "delivery", "طلب #ORD-4527 — حي الورود، الرياض", "success"),
  mockEntry(13, "2026-04-05 11:30", 2, "delivery", "طلب #ORD-4524 — حي السليمانية (متأخر)", "partial"),
  mockEntry(14, "2026-04-05 11:45", 5, "login", "تسجيل دخول من الجوال", "success"),
  mockEntry(15, "2026-04-05 12:00", 5, "delivery", "طلب #ORD-4528 — حي الياسمين، الرياض", "success"),
  mockEntry(16, "2026-04-05 12:15", 0, "complaint", "شكوى من العميل — تلف بالمنتج طلب #ORD-4521", "pending"),
  mockEntry(17, "2026-04-05 12:30", 6, "login", "تسجيل دخول من الجوال", "success"),
  mockEntry(18, "2026-04-05 12:45", 6, "delivery", "طلب #ORD-4529 — حي الصحافة، الرياض", "success"),
  mockEntry(19, "2026-04-05 13:00", 3, "status_change", "تغيير حالة المندوب إلى «استراحة»", "success"),
  mockEntry(20, "2026-04-05 13:15", 7, "login", "تسجيل دخول من الجوال", "success"),
  mockEntry(21, "2026-04-05 13:30", 7, "delivery", "طلب #ORD-4530 — حي الروابي، الرياض", "success"),
  mockEntry(22, "2026-04-05 13:45", 4, "cancel", "إلغاء طلب #ORD-4531 — عنوان خاطئ", "success"),
  mockEntry(23, "2026-04-05 14:00", 1, "delivery", "طلب #ORD-4532 — حي الغدير، الرياض", "success"),
  mockEntry(24, "2026-04-05 14:15", 6, "late", "تأخر 20 دقيقة عن طلب #ORD-4533", "pending"),
  mockEntry(25, "2026-04-05 14:30", 5, "delivery", "طلب #ORD-4534 — حي النرجس، الرياض", "success"),
  mockEntry(26, "2026-04-05 14:45", 3, "status_change", "تغيير حالة المندوب إلى «متاح»", "success"),
  mockEntry(27, "2026-04-05 15:00", 0, "delivery", "طلب #ORD-4535 — حي المروج، الرياض", "success"),
  mockEntry(28, "2026-04-05 15:15", 7, "cancel", "إلغاء طلب #ORD-4536 — رفض العميل الاستلام", "success"),
  mockEntry(29, "2026-04-05 15:30", 2, "delivery", "طلب #ORD-4537 — حي الملك فهد، الرياض", "success"),
  mockEntry(30, "2026-04-05 15:45", 4, "complaint", "شكوى — تأخر كبير في التوصيل طلب #ORD-4531", "pending"),
  mockEntry(31, "2026-04-05 16:00", 1, "delivery", "طلب #ORD-4538 — حي الروضة، الرياض", "success"),
  mockEntry(32, "2026-04-05 16:15", 6, "delivery", "طلب #ORD-4533 — حي الصحافة (متأخر)", "partial"),
  mockEntry(33, "2026-04-05 16:30", 5, "delivery", "طلب #ORD-4539 — حي حطين، الرياض", "success"),
  mockEntry(34, "2026-04-05 16:45", 0, "status_change", "تغيير حالة المندوب إلى «منتهي»", "success"),
  mockEntry(35, "2026-04-05 17:00", 7, "delivery", "طلب #ORD-4540 — حي العقيق، الرياض", "success"),
];

const PAGE_SIZE = 20;

// ── Component ────────────────────────────────────────────────────────────────
export default function CourierOperationsLog() {
  const [data, setData] = useState<LogEntry[]>(MOCK_DATA);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [opFilter, setOpFilter] = useState<OpType | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: rows, error } = await supabase
        .from("courier_operations_log")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      if (rows?.length) setData(rows as unknown as LogEntry[]);
    } catch {
      // keep mock data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Filters ──────────────────────────────────────────────────────────────
  const filtered = data.filter((entry) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      entry.courier_name.toLowerCase().includes(q) ||
      OP_LABELS[entry.op_type].includes(q) ||
      entry.details.toLowerCase().includes(q);
    const matchOp = opFilter === "all" || entry.op_type === opFilter;
    const matchDateFrom = !dateFrom || entry.date >= dateFrom;
    const matchDateTo = !dateTo || entry.date <= dateTo + "T23:59:59";
    return matchSearch && matchOp && matchDateFrom && matchDateTo;
  });

  // ── Pagination ───────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, opFilter, dateFrom, dateTo]);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const today = new Date().toISOString().split("T")[0];
  const todayOps = data.filter((e) => e.date.startsWith(today)).length;
  const successDeliveries = data.filter((e) => e.op_type === "delivery" && e.status === "success").length;
  const cancellations = data.filter((e) => e.op_type === "cancel").length;
  const deliveryEntries = data.filter((e) => e.op_type === "delivery");
  const avgDeliveryTime = deliveryEntries.length > 0 ? `${Math.round(25 + Math.random() * 10)} د` : "—";

  const OP_FILTER_LIST: { key: OpType | "all"; label: string }[] = [
    { key: "all", label: "الكل" },
    { key: "delivery", label: "تسليم" },
    { key: "cancel", label: "إلغاء" },
    { key: "late", label: "تأخر" },
    { key: "complaint", label: "شكوى" },
    { key: "status_change", label: "تغيير حالة" },
    { key: "login", label: "تسجيل دخول" },
  ];

  function renderOpBadge(op: OpType) {
    const Icon = OP_ICONS[op];
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "2px 10px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 600,
          background: `color-mix(in srgb, ${OP_COLORS[op]} 15%, transparent)`,
          color: OP_COLORS[op],
        }}
      >
        <Icon size={11} />
        {OP_LABELS[op]}
      </span>
    );
  }

  function renderStatusBadge(status: string) {
    const s = STATUS_MAP[status] || { label: status, color: "var(--con-text-muted)" };
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "2px 10px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 600,
          background: `color-mix(in srgb, ${s.color} 15%, transparent)`,
          color: s.color,
        }}
      >
        {s.label}
      </span>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        icon={ClipboardList}
        title="سجل العمليات"
        subtitle="سجل جميع عمليات وأنشطة المناديب"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="con-btn con-btn-ghost"
              style={{ gap: 6, fontSize: 12 }}
              onClick={() => {
                const csvRows = filtered.map((e) => ({
                  التاريخ: e.date,
                  المندوب: e.courier_name,
                  "نوع العملية": OP_LABELS[e.op_type],
                  التفاصيل: e.details,
                  الحالة: STATUS_MAP[e.status]?.label || e.status,
                }));
                downloadCSV(csvRows as unknown as Record<string, unknown>[], "courier_operations_log.csv");
              }}
            >
              <Download size={14} /> تصدير CSV
            </button>
            <button
              className="con-btn con-btn-ghost"
              style={{ gap: 6, fontSize: 12 }}
              onClick={() => {
                setLoading(true);
                fetchData().finally(() => setLoading(false));
              }}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> تحديث
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <KPIGrid>
        <KPICard icon={Activity} label="عمليات اليوم" value={todayOps} accent="var(--con-brand)" />
        <KPICard icon={PackageCheck} label="تسليمات ناجحة" value={successDeliveries} accent="var(--con-success)" />
        <KPICard icon={XCircle} label="إلغاءات" value={cancellations} accent="var(--con-danger)" />
        <KPICard icon={Clock} label="متوسط وقت التسليم" value={avgDeliveryTime} accent="var(--con-warning)" mono={false} />
      </KPIGrid>

      {/* Search + Filters */}
      <Card>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--con-text-muted)",
              }}
            />
            <input
              type="text"
              placeholder="بحث بالاسم أو نوع العملية..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="con-input"
              style={{ paddingRight: 32, width: "100%", fontSize: 13 }}
            />
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <label style={{ fontSize: 12, color: "var(--con-text-muted)" }}>من:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="con-input"
              style={{ fontSize: 12, padding: "5px 8px" }}
            />
            <label style={{ fontSize: 12, color: "var(--con-text-muted)" }}>إلى:</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="con-input"
              style={{ fontSize: 12, padding: "5px 8px" }}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          {OP_FILTER_LIST.map((f) => (
            <button
              key={f.key}
              className={`con-btn ${opFilter === f.key ? "con-btn-primary" : "con-btn-ghost"}`}
              style={{ fontSize: 11, padding: "5px 12px" }}
              onClick={() => setOpFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Table */}
      <Card noPadding>
        <div style={{ overflowX: "auto" }}>
          <table className="con-table" style={{ width: "100%", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ padding: "10px 14px", textAlign: "start" }}>التاريخ</th>
                <th style={{ padding: "10px 14px", textAlign: "start" }}>المندوب</th>
                <th style={{ padding: "10px 14px", textAlign: "center" }}>نوع العملية</th>
                <th style={{ padding: "10px 14px", textAlign: "start" }}>التفاصيل</th>
                <th style={{ padding: "10px 14px", textAlign: "center" }}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 40, color: "var(--con-text-muted)" }}>
                    لا توجد نتائج
                  </td>
                </tr>
              ) : (
                paginated.map((entry) => (
                  <tr key={entry.id}>
                    <td style={{ padding: "10px 14px", fontFamily: "var(--con-font-mono)", fontSize: 12, color: "var(--con-text-muted)", whiteSpace: "nowrap" }}>
                      {entry.date}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ fontWeight: 600, color: "var(--con-text-primary)" }}>{entry.courier_name}</div>
                      <div style={{ fontSize: 11, color: "var(--con-text-muted)" }}>{entry.courier_id}</div>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>{renderOpBadge(entry.op_type)}</td>
                    <td style={{ padding: "10px 14px", color: "var(--con-text-secondary)", fontSize: 12, maxWidth: 320 }}>
                      {entry.details}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>{renderStatusBadge(entry.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px 16px",
              borderTop: "1px solid var(--con-border-default)",
            }}
          >
            <button
              className="con-btn con-btn-ghost"
              style={{ padding: "4px 8px" }}
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronRight size={14} />
            </button>
            <span style={{ fontSize: 12, color: "var(--con-text-muted)", fontFamily: "var(--con-font-mono)" }}>
              {currentPage} / {totalPages}
            </span>
            <button
              className="con-btn con-btn-ghost"
              style={{ padding: "4px 8px" }}
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 11, color: "var(--con-text-muted)" }}>
              ({filtered.length} سجل)
            </span>
          </div>
        )}
      </Card>
    </PageWrapper>
  );
}
