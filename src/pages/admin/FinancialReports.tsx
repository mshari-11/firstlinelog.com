/**
 * التقارير المالية - Financial Reports
 * Income statement, P&L, revenue analysis, city performance reports
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/admin/auth";
import { supabase } from "@/lib/supabase";
import {
  FileText, Download, Filter, Calendar, TrendingUp,
  TrendingDown, BarChart3, PieChart, AlertCircle,
} from "lucide-react";

// ─── Report Types ─────────────────────────────────────────────────────────────
type ReportType = "income-statement" | "pl-report" | "revenue-analysis" | "city-performance";

interface ReportData {
  title: string;
  period: string;
  generatedAt: string;
  data: any;
}

const incomeStatement: ReportData = {
  title: "بيان الدخل",
  period: "فبراير 2026",
  generatedAt: new Date().toLocaleString("ar-SA"),
  data: {
    revenue: { total: 218000, platforms: { jahez: 76300, maroul: 47520, noon: 33320, sahib: 34480, other: 26380 } },
    expenses: {
      driverPayments: 76300,
      platformFees: 21720,
      fuelMaintenance: 21840,
      insurance: 10920,
      admin: 9840,
      other: 1380,
    },
    operatingIncome: 76000,
    otherIncome: 2180,
    incomeBeforeTax: 78180,
    tax: 0,
    netIncome: 78180,
  },
};

const plReport: ReportData = {
  title: "تقرير الأرباح والخسائر",
  period: "فبراير 2026",
  generatedAt: new Date().toLocaleString("ar-SA"),
  data: {
    revenue: 218000,
    cogs: 98000,
    grossProfit: 120000,
    grossMargin: "55%",
    operatingExpenses: 42000,
    operatingIncome: 78000,
    operatingMargin: "36%",
    otherExpenses: 0,
    netIncome: 78000,
    netMargin: "36%",
  },
};

const revenueAnalysis: ReportData = {
  title: "تحليل الإيرادات",
  period: "فبراير 2026",
  generatedAt: new Date().toLocaleString("ar-SA"),
  data: {
    byPlatform: [
      { name: "جاهز", revenue: 76300, percentage: 35, growth: 12 },
      { name: "مرسول", revenue: 47520, percentage: 22, growth: -3 },
      { name: "نون", revenue: 33320, percentage: 15, growth: 18 },
      { name: "صاحب", revenue: 34480, percentage: 16, growth: 8 },
      { name: "أخرى", revenue: 26380, percentage: 12, growth: 5 },
    ],
    byCity: [
      { city: "الرياض", revenue: 98100, percentage: 45, orders: 560 },
      { city: "جدة", revenue: 43600, percentage: 20, orders: 250 },
      { city: "الدمام", revenue: 34800, percentage: 16, orders: 200 },
      { city: "القصيم", revenue: 21800, percentage: 10, orders: 125 },
      { city: "الطائف", revenue: 19700, percentage: 9, orders: 112 },
    ],
    byCourier: [
      { courier: "أحمد محمد", revenue: 19600, orders: 56, rating: 4.8 },
      { courier: "خالد العمري", revenue: 17400, orders: 49, rating: 4.7 },
      { courier: "فهد الغامدي", revenue: 16400, orders: 47, rating: 4.9 },
      { courier: "سعد الزهراني", revenue: 15200, orders: 43, rating: 4.6 },
      { courier: "عمر الشمري", revenue: 14400, orders: 41, rating: 4.8 },
    ],
  },
};

const cityPerformance: ReportData = {
  title: "تقرير أداء المدن",
  period: "فبراير 2026",
  generatedAt: new Date().toLocaleString("ar-SA"),
  data: {
    cities: [
      {
        name: "الرياض",
        revenue: 98100,
        orders: 560,
        avgOrder: 175,
        couriers: 24,
        growth: 8,
        topCourier: "أحمد محمد",
        topPlatform: "جاهز",
      },
      {
        name: "جدة",
        revenue: 43600,
        orders: 250,
        avgOrder: 174,
        couriers: 12,
        growth: 12,
        topCourier: "خالد العمري",
        topPlatform: "جاهز",
      },
      {
        name: "الدمام",
        revenue: 34800,
        orders: 200,
        avgOrder: 174,
        couriers: 10,
        growth: 15,
        topCourier: "فهد الغامدي",
        topPlatform: "مرسول",
      },
      {
        name: "القصيم",
        revenue: 21800,
        orders: 125,
        avgOrder: 174,
        couriers: 6,
        growth: 5,
        topCourier: "سعد الزهراني",
        topPlatform: "نون",
      },
      {
        name: "الطائف",
        revenue: 19700,
        orders: 112,
        avgOrder: 176,
        couriers: 5,
        growth: 3,
        topCourier: "عمر الشمري",
        topPlatform: "صاحب",
      },
    ],
  },
};

// ─── Report Section Component ─────────────────────────────────────────────────
interface ReportSectionProps {
  title: string;
  children: React.ReactNode;
}

function ReportSection({ title, children }: ReportSectionProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 700, color: "var(--con-text-primary)", margin: "0 0 16px 0", paddingBottom: 12, borderBottom: "2px solid var(--con-border-default)" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

// ─── Report Card ──────────────────────────────────────────────────────────────
function ReportCard({ report, onSelect }: { report: ReportData; onSelect: (r: ReportData) => void }) {
  return (
    <div
      onClick={() => onSelect(report)}
      style={{
        background: "var(--con-bg-surface-1)",
        border: "1px solid var(--con-border-default)",
        borderRadius: 10,
        padding: "20px",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--con-bg-surface-2)";
        e.currentTarget.style.borderColor = "var(--con-brand)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--con-bg-surface-1)";
        e.currentTarget.style.borderColor = "var(--con-border-default)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <FileText size={24} style={{ color: "var(--con-brand)" }} />
        <div>
          <h3 style={{ fontSize: "var(--con-text-body)", fontWeight: 600, color: "var(--con-text-primary)", margin: 0 }}>
            {report.title}
          </h3>
          <p style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", margin: 4, marginTop: 0 }}>
            {report.period}
          </p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          style={{
            flex: 1,
            padding: "8px 12px",
            background: "rgba(59,130,246,0.1)",
            border: "1px solid rgba(59,130,246,0.25)",
            borderRadius: 6,
            color: "var(--con-brand)",
            fontSize: "var(--con-text-caption)",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(59,130,246,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(59,130,246,0.1)";
          }}
        >
          <Download size={14} />
          تحميل PDF
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          style={{
            flex: 1,
            padding: "8px 12px",
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.25)",
            borderRadius: 6,
            color: "var(--con-success)",
            fontSize: "var(--con-text-caption)",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(34,197,94,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(34,197,94,0.1)";
          }}
        >
          <Download size={14} />
          تحميل Excel
        </button>
      </div>
    </div>
  );
}

// ─── Income Statement View ────────────────────────────────────────────────────
function IncomeStatementView({ data }: { data: any }) {
  return (
    <div>
      <ReportSection title="الإيرادات">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {Object.entries(data.revenue.platforms).map(([key, value]: [string, any]) => (
            <div key={key} style={{
              background: "var(--con-bg-surface-2)",
              padding: "12px",
              borderRadius: 8,
              textAlign: "center",
            }}>
              <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginBottom: 4 }}>
                {key}
              </div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--con-success)" }}>
                {(value / 1000).toFixed(1)}ك ر.س
              </div>
            </div>
          ))}
        </div>
      </ReportSection>

      <ReportSection title="المصروفات">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {Object.entries(data.expenses).map(([key, value]: [string, any]) => (
              <tr key={key} style={{ borderBottom: "1px solid var(--con-border-default)", height: 44 }}>
                <td style={{ color: "var(--con-text-primary)" }}>
                  {key === "driverPayments" ? "رواتب السائقين" :
                   key === "platformFees" ? "رسوم المنصة" :
                   key === "fuelMaintenance" ? "الوقود والصيانة" :
                   key === "insurance" ? "التأمين" :
                   key === "admin" ? "إداري" : "أخرى"}
                </td>
                <td style={{ textAlign: "right", color: "var(--con-danger)", fontWeight: 600, fontFamily: "var(--con-font-mono)" }}>
                  -{(value / 1000).toFixed(1)}ك ر.س
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportSection>

      <ReportSection title="الدخل الصافي">
        <div style={{
          background: "var(--con-brand-subtle)",
          border: "1px solid rgba(59,130,246,0.25)",
          borderRadius: 8,
          padding: "16px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginBottom: 8 }}>
            صافي الدخل
          </div>
          <div style={{ fontSize: "32px", fontWeight: 700, color: "var(--con-brand)" }}>
            {(data.netIncome / 1000).toFixed(1)}ك ر.س
          </div>
        </div>
      </ReportSection>
    </div>
  );
}

// ─── P&L View ─────────────────────────────────────────────────────────────────
function PLView({ data }: { data: any }) {
  const metrics = [
    { label: "الإيرادات", value: data.revenue, color: "var(--con-success)" },
    { label: "تكلفة البضائع المبيعة", value: -data.cogs, color: "var(--con-danger)" },
    { label: "الربح الإجمالي", value: data.grossProfit, color: "var(--con-info)" },
    { label: "الهامش الإجمالي", value: data.grossMargin, color: "var(--con-info)", isPercent: true },
    { label: "مصروفات التشغيل", value: -data.operatingExpenses, color: "var(--con-danger)" },
    { label: "دخل التشغيل", value: data.operatingIncome, color: "var(--con-brand)" },
    { label: "هامش التشغيل", value: data.operatingMargin, color: "var(--con-brand)", isPercent: true },
    { label: "صافي الدخل", value: data.netIncome, color: "var(--con-success)" },
    { label: "هامش الربح الصافي", value: data.netMargin, color: "var(--con-success)", isPercent: true },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
        {metrics.map((metric) => (
          <div key={metric.label} style={{
            background: "var(--con-bg-surface-2)",
            padding: "16px",
            borderRadius: 8,
            borderLeft: `4px solid ${metric.color}`,
          }}>
            <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginBottom: 6 }}>
              {metric.label}
            </div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: metric.color }}>
              {metric.isPercent ? metric.value : `${(metric.value / 1000).toFixed(1)}ك ر.س`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Revenue Analysis View ────────────────────────────────────────────────────
function RevenueAnalysisView({ data }: { data: any }) {
  return (
    <div>
      <ReportSection title="الإيرادات حسب المنصة">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--con-bg-surface-2)", borderBottom: "1px solid var(--con-border-default)", height: 44 }}>
              <th style={{ textAlign: "right", padding: "12px 16px", color: "var(--con-text-muted)", fontWeight: 600 }}>المنصة</th>
              <th style={{ textAlign: "right", padding: "12px 16px", color: "var(--con-text-muted)", fontWeight: 600 }}>الإيرادات</th>
              <th style={{ textAlign: "center", padding: "12px 16px", color: "var(--con-text-muted)", fontWeight: 600 }}>النسبة</th>
              <th style={{ textAlign: "center", padding: "12px 16px", color: "var(--con-text-muted)", fontWeight: 600 }}>النمو</th>
            </tr>
          </thead>
          <tbody>
            {data.byPlatform.map((p: any) => (
              <tr key={p.name} style={{ borderBottom: "1px solid var(--con-border-default)", height: 44 }}>
                <td style={{ padding: "12px 16px", color: "var(--con-text-primary)" }}>{p.name}</td>
                <td style={{ padding: "12px 16px", color: "var(--con-success)", fontWeight: 600, fontFamily: "var(--con-font-mono)", textAlign: "right" }}>
                  {(p.revenue / 1000).toFixed(1)}ك ر.س
                </td>
                <td style={{ padding: "12px 16px", textAlign: "center", color: "var(--con-text-muted)" }}>
                  {p.percentage}%
                </td>
                <td style={{
                  padding: "12px 16px",
                  textAlign: "center",
                  color: p.growth >= 0 ? "var(--con-success)" : "var(--con-danger)",
                  fontWeight: 600,
                }}>
                  {p.growth >= 0 ? "+" : ""}{p.growth}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportSection>

      <ReportSection title="الإيرادات حسب المدينة">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--con-bg-surface-2)", borderBottom: "1px solid var(--con-border-default)", height: 44 }}>
              <th style={{ textAlign: "right", padding: "12px 16px", color: "var(--con-text-muted)", fontWeight: 600 }}>المدينة</th>
              <th style={{ textAlign: "right", padding: "12px 16px", color: "var(--con-text-muted)", fontWeight: 600 }}>الإيرادات</th>
              <th style={{ textAlign: "center", padding: "12px 16px", color: "var(--con-text-muted)", fontWeight: 600 }}>الطلبات</th>
              <th style={{ textAlign: "center", padding: "12px 16px", color: "var(--con-text-muted)", fontWeight: 600 }}>النسبة</th>
            </tr>
          </thead>
          <tbody>
            {data.byCity.map((c: any) => (
              <tr key={c.city} style={{ borderBottom: "1px solid var(--con-border-default)", height: 44 }}>
                <td style={{ padding: "12px 16px", color: "var(--con-text-primary)" }}>{c.city}</td>
                <td style={{ padding: "12px 16px", color: "var(--con-success)", fontWeight: 600, fontFamily: "var(--con-font-mono)", textAlign: "right" }}>
                  {(c.revenue / 1000).toFixed(1)}ك ر.س
                </td>
                <td style={{ padding: "12px 16px", textAlign: "center", color: "var(--con-text-muted)" }}>
                  {c.orders}
                </td>
                <td style={{ padding: "12px 16px", textAlign: "center", color: "var(--con-text-muted)" }}>
                  {c.percentage}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportSection>
    </div>
  );
}

// ─── City Performance View ────────────────────────────────────────────────────
function CityPerformanceView({ data }: { data: any }) {
  return (
    <div>
      <ReportSection title="ملخص أداء المدن">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--con-bg-surface-2)", borderBottom: "1px solid var(--con-border-default)", height: 44 }}>
                <th style={{ textAlign: "right", padding: "12px 16px", color: "var(--con-text-muted)", fontWeight: 600 }}>المدينة</th>
                <th style={{ textAlign: "right", padding: "12px 16px", color: "var(--con-text-muted)", fontWeight: 600 }}>الإيرادات</th>
                <th style={{ textAlign: "center", padding: "12px 16px", color: "var(--con-text-muted)", fontWeight: 600 }}>الطلبات</th>
                <th style={{ textAlign: "center", padding: "12px 16px", color: "var(--con-text-muted)", fontWeight: 600 }}>متوسط الطلب</th>
                <th style={{ textAlign: "center", padding: "12px 16px", color: "var(--con-text-muted)", fontWeight: 600 }}>المناديب</th>
                <th style={{ textAlign: "center", padding: "12px 16px", color: "var(--con-text-muted)", fontWeight: 600 }}>النمو</th>
              </tr>
            </thead>
            <tbody>
              {data.cities.map((city: any) => (
                <tr key={city.name} style={{ borderBottom: "1px solid var(--con-border-default)", height: 44 }}>
                  <td style={{ padding: "12px 16px", color: "var(--con-text-primary)", fontWeight: 600 }}>{city.name}</td>
                  <td style={{ padding: "12px 16px", color: "var(--con-success)", fontWeight: 600, fontFamily: "var(--con-font-mono)", textAlign: "right" }}>
                    {(city.revenue / 1000).toFixed(1)}ك ر.س
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center", color: "var(--con-text-muted)" }}>
                    {city.orders}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center", color: "var(--con-text-muted)" }}>
                    {city.avgOrder.toFixed(0)} ر.س
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center", color: "var(--con-text-muted)" }}>
                    {city.couriers}
                  </td>
                  <td style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    color: city.growth >= 0 ? "var(--con-success)" : "var(--con-danger)",
                    fontWeight: 600,
                  }}>
                    {city.growth >= 0 ? "+" : ""}{city.growth}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportSection>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FinancialReports() {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);

  const reports: ReportData[] = [
    incomeStatement,
    plReport,
    revenueAnalysis,
    cityPerformance,
  ];

  return (
    <div dir="rtl" style={{ padding: "20px 24px", background: "var(--con-bg-default)", minHeight: "100vh" }}>
      {!selectedReport ? (
        <>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: "32px", fontWeight: 700, color: "var(--con-text-primary)", margin: 0, marginBottom: 4 }}>
              التقارير المالية
            </h1>
            <p style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", margin: 0 }}>
              بيانات وتقارير مالية شاملة للعمليات والإيرادات والمصروفات
            </p>
          </div>

          {/* Reports Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {reports.map((report) => (
              <ReportCard key={report.title} report={report} onSelect={setSelectedReport} />
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Report Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: "32px", fontWeight: 700, color: "var(--con-text-primary)", margin: 0, marginBottom: 4 }}>
                {selectedReport.title}
              </h1>
              <p style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", margin: 0 }}>
                {selectedReport.period} • تم الإنشاء في {selectedReport.generatedAt}
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => {}}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 16px",
                  background: "rgba(59,130,246,0.1)",
                  border: "1px solid rgba(59,130,246,0.25)",
                  borderRadius: 8,
                  color: "var(--con-brand)",
                  fontSize: "var(--con-text-body)",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Download size={18} />
                تحميل PDF
              </button>
              <button
                onClick={() => {}}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 16px",
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.25)",
                  borderRadius: 8,
                  color: "var(--con-success)",
                  fontSize: "var(--con-text-body)",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Download size={18} />
                تحميل Excel
              </button>
              <button
                onClick={() => setSelectedReport(null)}
                style={{
                  padding: "10px 16px",
                  background: "var(--con-bg-surface-1)",
                  border: "1px solid var(--con-border-default)",
                  borderRadius: 8,
                  color: "var(--con-text-primary)",
                  fontSize: "var(--con-text-body)",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                العودة
              </button>
            </div>
          </div>

          {/* Report Content */}
          <div style={{
            background: "var(--con-bg-surface-1)",
            border: "1px solid var(--con-border-default)",
            borderRadius: 10,
            padding: "24px",
          }}>
            {selectedReport.title === "بيان الدخل" && <IncomeStatementView data={selectedReport.data} />}
            {selectedReport.title === "تقرير الأرباح والخسائر" && <PLView data={selectedReport.data} />}
            {selectedReport.title === "تحليل الإيرادات" && <RevenueAnalysisView data={selectedReport.data} />}
            {selectedReport.title === "تقرير أداء المدن" && <CityPerformanceView data={selectedReport.data} />}
          </div>
        </>
      )}
    </div>
  );
}
