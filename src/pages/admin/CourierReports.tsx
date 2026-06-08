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
} from "lucide-react";
import {
  PageWrapper,
  PageHeader,
  KPIGrid,
  KPICard,
  Card,
  Toolbar,
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

const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export default function CourierReports() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [reports, setReports] = useState<CourierReport[]>([]);
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
