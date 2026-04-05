/**
 * صفحة تقارير المناديب — Courier Monthly Reports
 * تقارير شهرية شاملة لأداء المناديب
 */
import { useState, useCallback } from "react";
import {
  FileText,
  Download,
  Printer,
  RefreshCw,
  Users,
  UserCheck,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import {
  PageWrapper,
  PageHeader,
  KPIGrid,
  KPICard,
  Card,
  Toolbar,
  Badge,
  Button,
  EmptyState,
} from "@/components/admin/ui";
import { supabase } from "@/lib/supabase";

// ── Types ────────────────────────────────────────────────────────────────────
interface CourierReport {
  id: string;
  courier_name: string;
  courier_id: string;
  rating: number;
  total_orders: number;
  success_rate: number;
  violations: number;
  status: "active" | "inactive" | "suspended";
  notes: string;
}

const STATUS_LABELS: Record<string, string> = {
  active: "نشط",
  inactive: "غير نشط",
  suspended: "موقوف",
};

const STATUS_COLORS: Record<string, string> = {
  active: "var(--con-success)",
  inactive: "var(--con-text-muted)",
  suspended: "var(--con-danger)",
};

// ── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_REPORTS: CourierReport[] = [
  { id: "1", courier_name: "أحمد العتيبي", courier_id: "C001", rating: 4.8, total_orders: 520, success_rate: 97.5, violations: 0, status: "active", notes: "أداء ممتاز - مرشح لمندوب الشهر" },
  { id: "2", courier_name: "فهد القحطاني", courier_id: "C002", rating: 4.6, total_orders: 480, success_rate: 96.2, violations: 1, status: "active", notes: "أداء جيد جداً" },
  { id: "3", courier_name: "سعد الدوسري", courier_id: "C003", rating: 4.2, total_orders: 410, success_rate: 94.0, violations: 2, status: "active", notes: "تحسن ملحوظ عن الشهر السابق" },
  { id: "4", courier_name: "خالد الحربي", courier_id: "C004", rating: 3.9, total_orders: 350, success_rate: 91.5, violations: 3, status: "active", notes: "يحتاج متابعة - تأخيرات متكررة" },
  { id: "5", courier_name: "محمد الشهري", courier_id: "C005", rating: 4.5, total_orders: 460, success_rate: 95.8, violations: 0, status: "active", notes: "ملتزم ومنضبط" },
  { id: "6", courier_name: "عمر المالكي", courier_id: "C006", rating: 3.3, total_orders: 280, success_rate: 87.0, violations: 5, status: "active", notes: "أداء ضعيف - إنذار ثاني" },
  { id: "7", courier_name: "يوسف الغامدي", courier_id: "C007", rating: 4.7, total_orders: 500, success_rate: 98.0, violations: 0, status: "active", notes: "من أفضل المناديب" },
  { id: "8", courier_name: "ناصر السبيعي", courier_id: "C008", rating: 3.1, total_orders: 200, success_rate: 82.5, violations: 7, status: "active", notes: "تحت المراقبة - مخالفات متعددة" },
  { id: "9", courier_name: "بدر الزهراني", courier_id: "C009", rating: 3.6, total_orders: 310, success_rate: 89.0, violations: 4, status: "active", notes: "يحتاج تدريب إضافي" },
  { id: "10", courier_name: "سلطان العنزي", courier_id: "C011", rating: 0, total_orders: 0, success_rate: 0, violations: 0, status: "suspended", notes: "موقوف - غياب بدون إذن" },
  { id: "11", courier_name: "تركي القرني", courier_id: "C012", rating: 0, total_orders: 0, success_rate: 0, violations: 0, status: "inactive", notes: "مفصول - مخالفات متكررة" },
  { id: "12", courier_name: "عبدالرحمن النعيمي", courier_id: "C010", rating: 3.8, total_orders: 340, success_rate: 90.5, violations: 3, status: "active", notes: "أداء مقبول - يحتاج تحسين" },
];

const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export default function CourierReports() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [reports, setReports] = useState<CourierReport[]>(MOCK_REPORTS);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (!supabase) throw new Error("no supabase");
      const { data: rows } = await supabase
        .from("courier_monthly_reports")
        .select("*")
        .eq("month", selectedMonth + 1)
        .eq("year", selectedYear)
        .order("rating", { ascending: false });
      if (rows?.length) setReports(rows);
    } catch {
      // keep mock data
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const totalCouriers = reports.length;
  const activeCouriers = reports.filter((r) => r.status === "active").length;
  const avgRating = activeCouriers > 0
    ? (reports.filter((r) => r.status === "active").reduce((s, r) => s + r.rating, 0) / activeCouriers).toFixed(1)
    : "0";
  const totalViolations = reports.reduce((s, r) => s + r.violations, 0);

  function getRowColor(rating: number): string {
    if (rating >= 4.5) return "rgba(34,197,94,0.08)";
    if (rating >= 3.5) return "rgba(234,179,8,0.08)";
    if (rating > 0) return "rgba(239,68,68,0.08)";
    return "transparent";
  }

  function getRatingColor(rating: number): string {
    if (rating >= 4.5) return "var(--con-success)";
    if (rating >= 3.5) return "var(--con-warning)";
    if (rating > 0) return "var(--con-danger)";
    return "var(--con-text-muted)";
  }

  function exportExcel() {
    // Build Excel-compatible HTML table with RTL and Arabic headers
    const headers = ["المندوب", "التقييم", "الطلبات", "نسبة النجاح", "المخالفات", "الحالة", "الملاحظات"];
    let html = `<html dir="rtl"><head><meta charset="utf-8"><style>
      table { border-collapse: collapse; direction: rtl; font-family: Tahoma, Arial; }
      th { background: #1a3a52; color: #fff; padding: 8px 12px; font-size: 13px; text-align: right; }
      td { border: 1px solid #ddd; padding: 6px 12px; font-size: 12px; text-align: right; }
      tr:nth-child(even) { background: #f9f9f9; }
      .green { background: #dcfce7; }
      .yellow { background: #fef9c3; }
      .red { background: #fee2e2; }
    </style></head><body>`;
    html += `<h2>تقرير المناديب — ${MONTHS[selectedMonth]} ${selectedYear}</h2>`;
    html += `<table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>`;
    reports.forEach((r) => {
      const cls = r.rating >= 4.5 ? "green" : r.rating >= 3.5 ? "yellow" : r.rating > 0 ? "red" : "";
      html += `<tr class="${cls}">`;
      html += `<td>${r.courier_name}</td>`;
      html += `<td>${r.rating || "—"}</td>`;
      html += `<td>${r.total_orders}</td>`;
      html += `<td>${r.success_rate}%</td>`;
      html += `<td>${r.violations}</td>`;
      html += `<td>${STATUS_LABELS[r.status]}</td>`;
      html += `<td>${r.notes}</td>`;
      html += `</tr>`;
    });
    html += `</tbody></table></body></html>`;

    const blob = new Blob(["\uFEFF" + html], { type: "application/vnd.ms-excel;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `courier_report_${selectedYear}_${selectedMonth + 1}.xls`;
    a.click();
  }

  const selectStyle: React.CSSProperties = {
    padding: "6px 12px",
    borderRadius: "var(--con-radius)",
    border: "1px solid var(--con-border)",
    background: "var(--con-bg-input)",
    color: "var(--con-text-primary)",
    fontSize: 13,
    fontFamily: "var(--con-font-primary)",
    cursor: "pointer",
    outline: "none",
  };

  return (
    <PageWrapper>
      <PageHeader
        icon={FileText}
        title="تقارير المناديب"
        subtitle={`التقرير الشهري — ${MONTHS[selectedMonth]} ${selectedYear}`}
        actions={
          <>
            <Button onClick={exportExcel} variant="ghost" icon={Download}>
              تصدير Excel
            </Button>
            <Button onClick={() => window.print()} variant="ghost" icon={Printer}>
              طباعة
            </Button>
            <Button onClick={fetchData} variant="ghost" icon={RefreshCw} loading={loading}>
              تحديث
            </Button>
          </>
        }
      />

      {/* ── Month/Year Selector ── */}
      <Toolbar>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "var(--con-text-secondary)", fontWeight: 600 }}>الفترة:</span>
          <select
            style={selectStyle}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
          <select
            style={selectStyle}
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </Toolbar>

      {/* ── KPIs ── */}
      <KPIGrid>
        <KPICard label="إجمالي المناديب" value={totalCouriers} icon={Users} accent="var(--con-brand)" />
        <KPICard label="نشطين" value={activeCouriers} icon={UserCheck} accent="var(--con-success)" />
        <KPICard label="متوسط الأداء" value={avgRating} icon={TrendingUp} accent="var(--con-warning)" />
        <KPICard label="إجمالي المخالفات" value={totalViolations} icon={AlertTriangle} accent="var(--con-danger)" />
      </KPIGrid>

      {/* ── Report Table ── */}
      <Card>
        {reports.length === 0 ? (
          <EmptyState icon={FileText} title="لا توجد تقارير" message="لا توجد بيانات لهذا الشهر" />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--con-border)" }}>
                  {["المندوب", "التقييم", "الطلبات", "نسبة النجاح", "المخالفات", "الحالة", "الملاحظات"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 12px",
                        textAlign: "right",
                        fontWeight: 700,
                        color: "var(--con-text-secondary)",
                        fontSize: 12,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr
                    key={r.id}
                    style={{
                      background: getRowColor(r.rating),
                      borderBottom: "1px solid var(--con-border)",
                      transition: "background 0.15s",
                    }}
                  >
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--con-text-primary)" }}>
                      {r.courier_name}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: getRatingColor(r.rating),
                          fontFamily: "var(--con-font-mono)",
                        }}
                      >
                        {r.rating > 0 ? r.rating.toFixed(1) : "—"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "var(--con-font-mono)", color: "var(--con-text-primary)" }}>
                      {r.total_orders.toLocaleString()}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        style={{
                          fontFamily: "var(--con-font-mono)",
                          fontWeight: 600,
                          color: r.success_rate >= 95 ? "var(--con-success)" : r.success_rate >= 90 ? "var(--con-warning)" : "var(--con-danger)",
                        }}
                      >
                        {r.success_rate > 0 ? `${r.success_rate}%` : "—"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {r.violations > 0 ? (
                        <span
                          style={{
                            background: r.violations >= 5 ? "var(--con-danger)" : "var(--con-warning)",
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 700,
                            borderRadius: 12,
                            padding: "2px 10px",
                          }}
                        >
                          {r.violations}
                        </span>
                      ) : (
                        <span style={{ color: "var(--con-text-muted)" }}>0</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ color: STATUS_COLORS[r.status], fontWeight: 600, fontSize: 12 }}>
                        {STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "var(--con-text-secondary)", maxWidth: 250 }}>
                      {r.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageWrapper>
  );
}
