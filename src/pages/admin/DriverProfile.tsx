/**
 * صفحة ملف المندوب — Comprehensive Driver Profile Page
 * Shows everything about a contracted delivery driver in one place.
 * Accessible when admin clicks a driver name anywhere in the system.
 * Backend: Supabase `couriers` table with fallback to mock data.
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Phone,
  Mail,
  IdCard,
  MapPin,
  Calendar,
  CreditCard,
  Truck,
  AlertTriangle,
  MessageSquare,
  Edit,
  Ban,
  Send,
  Package,
  DollarSign,
  TrendingUp,
  ShieldAlert,
  Wrench,
  Clock,
  CheckCircle2,
  XCircle,
  UserCheck,
  ChevronLeft,
  FileText,
  Gauge,
  CircleDot,
  Fuel,
  Smartphone,
  Banknote,
  ArrowDownCircle,
  ArrowUpCircle,
  Activity,
  BadgeCheck,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────

type DriverStatus = "active" | "inactive" | "suspended";
type PerformanceRating = "A" | "B" | "C";
type ViolationType = "تأخر" | "غياب" | "مخالفة مرورية" | "سوء استخدام مركبة";
type TicketStatus = "new" | "in_progress" | "resolved" | "closed";
type VehicleStatus = "active" | "maintenance";
type TabId = "details" | "performance" | "financial" | "vehicle" | "tickets" | "violations";

interface DriverData {
  id: string;
  name: string;
  phone: string;
  email: string;
  nationalId: string;
  city: string;
  status: DriverStatus;
  platform: string;
  joinDate: string;
  rating: PerformanceRating;
  contractStartDate: string;
  contractType: string;
  iban: string;
  emergencyContact: string;
  emergencyPhone: string;
  monthlyOrders: number;
  monthlyTarget: number;
  monthlyEarnings: number;
  ratingScore: number;
  violationCount: number;
  weeklyBreakdown: { week: string; orders: number; target: number }[];
  performanceTrend: { month: string; score: number }[];
  attendance: { present: number; absent: number; late: number };
  baseSalary: number;
  fuelAllowance: number;
  phoneAllowance: number;
  absenceDeduction: number;
  violationDeduction: number;
  maintenanceDeduction: number;
  advanceRepayment: number;
  salaryHistory: { month: string; base: number; allowances: number; deductions: number; net: number }[];
  advances: { id: string; amount: number; date: string; remaining: number; status: string }[];
  vehicle: {
    plate: string;
    type: string;
    brand: string;
    year: number;
    status: VehicleStatus;
    lastService: string;
    nextService: string;
    totalKm: number;
    history: { vehicle: string; from: string; to: string }[];
  };
  tickets: {
    id: string;
    title: string;
    category: string;
    status: TicketStatus;
    date: string;
    department: string;
  }[];
  violations: {
    id: string;
    date: string;
    type: ViolationType;
    description: string;
    penalty: number;
  }[];
}

// ─── Mock Data ──────────────────────────────────────────────────────────────────

const MOCK_DRIVER: DriverData = {
  id: "DRV-001",
  name: "عبدالرحمن محمد الشهري",
  phone: "0551234567",
  email: "abdulrahman@fll.sa",
  nationalId: "1098765432",
  city: "الرياض",
  status: "active",
  platform: "جاهز",
  joinDate: "2025-06-15",
  rating: "A",
  contractStartDate: "2025-06-15",
  contractType: "دوام كامل",
  iban: "SA0380000000608010167519",
  emergencyContact: "محمد الشهري",
  emergencyPhone: "0559876543",
  monthlyOrders: 342,
  monthlyTarget: 400,
  monthlyEarnings: 8750,
  ratingScore: 4.7,
  violationCount: 1,
  weeklyBreakdown: [
    { week: "الأسبوع 1", orders: 78, target: 100 },
    { week: "الأسبوع 2", orders: 92, target: 100 },
    { week: "الأسبوع 3", orders: 88, target: 100 },
    { week: "الأسبوع 4", orders: 84, target: 100 },
  ],
  performanceTrend: [
    { month: "يناير", score: 82 },
    { month: "فبراير", score: 88 },
    { month: "مارس", score: 85 },
    { month: "أبريل", score: 91 },
  ],
  attendance: { present: 24, absent: 1, late: 3 },
  baseSalary: 6500,
  fuelAllowance: 800,
  phoneAllowance: 200,
  absenceDeduction: 250,
  violationDeduction: 150,
  maintenanceDeduction: 0,
  advanceRepayment: 500,
  salaryHistory: [
    { month: "يناير 2026", base: 6200, allowances: 1000, deductions: 400, net: 6800 },
    { month: "فبراير 2026", base: 6400, allowances: 1000, deductions: 200, net: 7200 },
    { month: "مارس 2026", base: 6500, allowances: 1000, deductions: 900, net: 6600 },
  ],
  advances: [
    { id: "ADV-001", amount: 3000, date: "2026-01-15", remaining: 1500, status: "قيد السداد" },
    { id: "ADV-002", amount: 1000, date: "2025-11-01", remaining: 0, status: "مسدد بالكامل" },
  ],
  vehicle: {
    plate: "أ ب د 1234",
    type: "دباب",
    brand: "هوندا PCX",
    year: 2024,
    status: "active",
    lastService: "2026-03-10",
    nextService: "2026-04-10",
    totalKm: 18450,
    history: [
      { vehicle: "هوندا PCX 2024 — أ ب د 1234", from: "2025-06-15", to: "حالياً" },
      { vehicle: "ياماها NMAX 2023 — ح ع ر 5678", from: "2025-01-01", to: "2025-06-14" },
    ],
  },
  tickets: [
    { id: "TKT-045", title: "طلب صيانة دباب", category: "صيانة", status: "resolved", date: "2026-03-20", department: "الأسطول" },
    { id: "TKT-067", title: "مشكلة في تطبيق التوصيل", category: "تقنية", status: "in_progress", date: "2026-03-28", department: "تقنية المعلومات" },
    { id: "TKT-012", title: "استفسار عن الراتب", category: "مالية", status: "closed", date: "2026-02-15", department: "المالية" },
  ],
  violations: [
    { id: "VIO-001", date: "2026-03-05", type: "تأخر", description: "تأخر عن الدوام بساعة", penalty: 150 },
    { id: "VIO-002", date: "2026-01-20", type: "مخالفة مرورية", description: "تجاوز إشارة حمراء", penalty: 500 },
    { id: "VIO-003", date: "2025-12-10", type: "غياب", description: "غياب يوم كامل بدون إذن", penalty: 250 },
  ],
};

// ─── Status Config ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<DriverStatus, { label: string; cls: string }> = {
  active: { label: "نشط", cls: "con-badge-success" },
  inactive: { label: "غير نشط", cls: "con-badge-muted" },
  suspended: { label: "موقوف", cls: "con-badge-danger" },
};

const TICKET_STATUS: Record<TicketStatus, { label: string; cls: string }> = {
  new: { label: "جديد", cls: "con-badge-info" },
  in_progress: { label: "قيد المعالجة", cls: "con-badge-warning" },
  resolved: { label: "محلول", cls: "con-badge-success" },
  closed: { label: "مغلق", cls: "con-badge-muted" },
};

const VEHICLE_STATUS: Record<VehicleStatus, { label: string; cls: string }> = {
  active: { label: "نشط", cls: "con-badge-success" },
  maintenance: { label: "في الصيانة", cls: "con-badge-warning" },
};

const TABS: { id: TabId; label: string; icon: JSX.Element }[] = [
  { id: "details", label: "تفاصيل", icon: <IdCard size={16} /> },
  { id: "performance", label: "الأداء", icon: <TrendingUp size={16} /> },
  { id: "financial", label: "المالية", icon: <DollarSign size={16} /> },
  { id: "vehicle", label: "المركبة", icon: <Truck size={16} /> },
  { id: "tickets", label: "التذاكر", icon: <MessageSquare size={16} /> },
  { id: "violations", label: "المخالفات", icon: <ShieldAlert size={16} /> },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
}

function formatCurrency(n: number) {
  return n.toLocaleString("ar-SA") + " ر.س";
}

function getInitials(name: string) {
  const parts = name.split(" ");
  if (parts.length >= 2) return parts[0][0] + parts[parts.length - 1][0];
  return parts[0][0];
}

// ─── Shared Styles ──────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: "var(--con-bg-surface-1)",
  borderRadius: "var(--con-radius-lg)",
  border: "1px solid var(--con-border-default)",
  boxShadow: "var(--con-shadow-card)",
  padding: "1.5rem",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const thStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  fontSize: "var(--con-text-caption)",
  fontWeight: 600,
  color: "var(--con-text-muted)",
  textAlign: "right" as const,
  borderBottom: "1px solid var(--con-border-default)",
  whiteSpace: "nowrap" as const,
};

const tdStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  fontSize: "var(--con-text-body)",
  color: "var(--con-text-secondary)",
  borderBottom: "1px solid var(--con-border-default)",
};

// ─── Sub-Components ─────────────────────────────────────────────────────────────

function DetailRow({ label, value, icon }: { label: string; value: string; icon?: JSX.Element }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 0", borderBottom: "1px solid var(--con-border-default)" }}>
      {icon && <span style={{ color: "var(--con-text-muted)", flexShrink: 0 }}>{icon}</span>}
      <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", minWidth: 120, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-primary)", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ width: "100%", height: 8, background: "var(--con-bg-overlay)", borderRadius: 4, overflow: "hidden" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ height: "100%", borderRadius: 4, background: color || "var(--con-brand)" }}
      />
    </div>
  );
}

// ─── Tab: تفاصيل (Details) ──────────────────────────────────────────────────────

function DetailsTab({ d }: { d: DriverData }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
        {/* Personal Info */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <IdCard size={16} style={{ color: "var(--con-brand)" }} /> البيانات الشخصية
          </h3>
          <DetailRow label="الاسم الكامل" value={d.name} />
          <DetailRow label="رقم الجوال" value={d.phone} icon={<Phone size={14} />} />
          <DetailRow label="البريد الإلكتروني" value={d.email} icon={<Mail size={14} />} />
          <DetailRow label="رقم الهوية" value={d.nationalId} icon={<IdCard size={14} />} />
          <DetailRow label="المدينة" value={d.city} icon={<MapPin size={14} />} />
        </div>
        {/* Contract Info */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FileText size={16} style={{ color: "var(--con-brand)" }} /> بيانات العقد
          </h3>
          <DetailRow label="تاريخ بداية العقد" value={formatDate(d.contractStartDate)} icon={<Calendar size={14} />} />
          <DetailRow label="نوع العقد" value={d.contractType} icon={<FileText size={14} />} />
          <DetailRow label="IBAN" value={d.iban} icon={<CreditCard size={14} />} />
          <DetailRow label="جهة اتصال الطوارئ" value={d.emergencyContact} icon={<Phone size={14} />} />
          <DetailRow label="رقم الطوارئ" value={d.emergencyPhone} icon={<Phone size={14} />} />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Tab: الأداء (Performance) ──────────────────────────────────────────────────

function PerformanceTab({ d }: { d: DriverData }) {
  const targetPct = Math.round((d.monthlyOrders / d.monthlyTarget) * 100);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ display: "grid", gap: "1.5rem" }}>
        {/* Target vs Achieved */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Gauge size={16} style={{ color: "var(--con-brand)" }} /> الهدف الشهري مقابل المحقق
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-secondary)" }}>
              {d.monthlyOrders} / {d.monthlyTarget} طلب
            </span>
            <span style={{
              fontSize: "var(--con-text-caption)", fontWeight: 700,
              color: targetPct >= 85 ? "var(--con-success)" : targetPct >= 60 ? "var(--con-warning)" : "var(--con-danger)",
            }}>
              {targetPct}%
            </span>
          </div>
          <ProgressBar value={d.monthlyOrders} max={d.monthlyTarget} color={targetPct >= 85 ? "var(--con-success)" : targetPct >= 60 ? "var(--con-warning)" : "var(--con-danger)"} />
        </div>

        {/* Weekly Breakdown */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", marginBottom: "1rem" }}>
            التفصيل الأسبوعي (آخر 4 أسابيع)
          </h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>الأسبوع</th>
                <th style={thStyle}>الطلبات</th>
                <th style={thStyle}>الهدف</th>
                <th style={thStyle}>النسبة</th>
                <th style={{ ...thStyle, width: "30%" }}>التقدم</th>
              </tr>
            </thead>
            <tbody>
              {d.weeklyBreakdown.map((w, i) => {
                const pct = Math.round((w.orders / w.target) * 100);
                return (
                  <tr key={i}>
                    <td style={tdStyle}>{w.week}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: "var(--con-text-primary)" }}>{w.orders}</td>
                    <td style={tdStyle}>{w.target}</td>
                    <td style={{ ...tdStyle, color: pct >= 85 ? "var(--con-success)" : pct >= 60 ? "var(--con-warning)" : "var(--con-danger)", fontWeight: 600 }}>{pct}%</td>
                    <td style={tdStyle}><ProgressBar value={w.orders} max={w.target} color={pct >= 85 ? "var(--con-success)" : pct >= 60 ? "var(--con-warning)" : "var(--con-danger)"} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Performance Trend */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Activity size={16} style={{ color: "var(--con-brand)" }} /> مؤشر الأداء الشهري
          </h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem", height: 120 }}>
            {d.performanceTrend.map((m, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: "0.5rem" }}>
                <span style={{ fontSize: "var(--con-text-caption)", fontWeight: 600, color: m.score >= 85 ? "var(--con-success)" : m.score >= 70 ? "var(--con-warning)" : "var(--con-danger)" }}>
                  {m.score}%
                </span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${m.score}%` }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  style={{
                    width: "100%", maxWidth: 48,
                    borderRadius: "var(--con-radius-sm)",
                    background: m.score >= 85 ? "var(--con-success)" : m.score >= 70 ? "var(--con-warning)" : "var(--con-danger)",
                    opacity: 0.8,
                  }}
                />
                <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <UserCheck size={16} style={{ color: "var(--con-brand)" }} /> سجل الحضور (الشهر الحالي)
          </h3>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle2 size={16} style={{ color: "var(--con-success)" }} />
              <span style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-secondary)" }}>حضور:</span>
              <span style={{ fontWeight: 700, color: "var(--con-success)" }}>{d.attendance.present}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <XCircle size={16} style={{ color: "var(--con-danger)" }} />
              <span style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-secondary)" }}>غياب:</span>
              <span style={{ fontWeight: 700, color: "var(--con-danger)" }}>{d.attendance.absent}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Clock size={16} style={{ color: "var(--con-warning)" }} />
              <span style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-secondary)" }}>تأخر:</span>
              <span style={{ fontWeight: 700, color: "var(--con-warning)" }}>{d.attendance.late}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Tab: المالية (Financial) ───────────────────────────────────────────────────

function FinancialTab({ d }: { d: DriverData }) {
  const totalAllowances = d.fuelAllowance + d.phoneAllowance;
  const totalDeductions = d.absenceDeduction + d.violationDeduction + d.maintenanceDeduction + d.advanceRepayment;
  const netSalary = d.baseSalary + totalAllowances - totalDeductions;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ display: "grid", gap: "1.5rem" }}>
        {/* Current Month Breakdown */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Banknote size={16} style={{ color: "var(--con-brand)" }} /> تفصيل راتب الشهر الحالي
          </h3>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {/* Base */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", background: "var(--con-bg-surface-2)", borderRadius: "var(--con-radius)" }}>
              <span style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-secondary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Package size={14} /> أساسي (من الطلبات)
              </span>
              <span style={{ fontWeight: 600, color: "var(--con-text-primary)" }}>{formatCurrency(d.baseSalary)}</span>
            </div>
            {/* Allowances */}
            <div style={{ padding: "0.75rem 1rem", background: "var(--con-success-subtle)", borderRadius: "var(--con-radius)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "var(--con-text-body)", color: "var(--con-success)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <ArrowUpCircle size={14} /> البدلات
                </span>
                <span style={{ fontWeight: 600, color: "var(--con-success)" }}>+{formatCurrency(totalAllowances)}</span>
              </div>
              <div style={{ display: "flex", gap: "2rem", fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
                <span><Fuel size={12} style={{ display: "inline", verticalAlign: "middle" }} /> وقود: {formatCurrency(d.fuelAllowance)}</span>
                <span><Smartphone size={12} style={{ display: "inline", verticalAlign: "middle" }} /> جوال: {formatCurrency(d.phoneAllowance)}</span>
              </div>
            </div>
            {/* Deductions */}
            <div style={{ padding: "0.75rem 1rem", background: "var(--con-danger-subtle)", borderRadius: "var(--con-radius)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "var(--con-text-body)", color: "var(--con-danger)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <ArrowDownCircle size={14} /> الخصومات
                </span>
                <span style={{ fontWeight: 600, color: "var(--con-danger)" }}>-{formatCurrency(totalDeductions)}</span>
              </div>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
                {d.absenceDeduction > 0 && <span>غياب: {formatCurrency(d.absenceDeduction)}</span>}
                {d.violationDeduction > 0 && <span>مخالفات: {formatCurrency(d.violationDeduction)}</span>}
                {d.maintenanceDeduction > 0 && <span>صيانة: {formatCurrency(d.maintenanceDeduction)}</span>}
                {d.advanceRepayment > 0 && <span>سلفة: {formatCurrency(d.advanceRepayment)}</span>}
              </div>
            </div>
            {/* Net */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "1rem", background: "var(--con-brand-subtle)", borderRadius: "var(--con-radius)",
              border: "1px solid var(--con-brand-border)",
            }}>
              <span style={{ fontSize: "var(--con-text-body)", fontWeight: 700, color: "var(--con-brand)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <BadgeCheck size={16} /> صافي المستحق
              </span>
              <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--con-brand)" }}>{formatCurrency(netSalary)}</span>
            </div>
          </div>
        </div>

        {/* Salary History */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", marginBottom: "1rem" }}>
            سجل الرواتب (آخر 3 أشهر)
          </h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>الشهر</th>
                <th style={thStyle}>الأساسي</th>
                <th style={thStyle}>البدلات</th>
                <th style={thStyle}>الخصومات</th>
                <th style={thStyle}>الصافي</th>
              </tr>
            </thead>
            <tbody>
              {d.salaryHistory.map((s, i) => (
                <tr key={i}>
                  <td style={tdStyle}>{s.month}</td>
                  <td style={tdStyle}>{formatCurrency(s.base)}</td>
                  <td style={{ ...tdStyle, color: "var(--con-success)" }}>+{formatCurrency(s.allowances)}</td>
                  <td style={{ ...tdStyle, color: "var(--con-danger)" }}>-{formatCurrency(s.deductions)}</td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: "var(--con-text-primary)" }}>{formatCurrency(s.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Advances */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CreditCard size={16} style={{ color: "var(--con-brand)" }} /> السلف المستحقة
          </h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>رقم السلفة</th>
                <th style={thStyle}>المبلغ</th>
                <th style={thStyle}>التاريخ</th>
                <th style={thStyle}>المتبقي</th>
                <th style={thStyle}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {d.advances.map((a) => (
                <tr key={a.id}>
                  <td style={{ ...tdStyle, fontFamily: "var(--con-font-mono)", fontSize: "var(--con-text-caption)" }}>{a.id}</td>
                  <td style={tdStyle}>{formatCurrency(a.amount)}</td>
                  <td style={tdStyle}>{formatDate(a.date)}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: a.remaining > 0 ? "var(--con-warning)" : "var(--con-success)" }}>{formatCurrency(a.remaining)}</td>
                  <td style={tdStyle}>
                    <span className={a.remaining > 0 ? "con-badge con-badge-warning" : "con-badge con-badge-success"} style={{ fontSize: "var(--con-text-caption)" }}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Tab: المركبة (Vehicle) ─────────────────────────────────────────────────────

function VehicleTab({ d }: { d: DriverData }) {
  const v = d.vehicle;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ display: "grid", gap: "1.5rem" }}>
        <div style={cardStyle}>
          <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Truck size={16} style={{ color: "var(--con-brand)" }} /> بيانات المركبة الحالية
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <DetailRow label="رقم اللوحة" value={v.plate} />
            <DetailRow label="النوع" value={v.type} />
            <DetailRow label="العلامة التجارية" value={v.brand} />
            <DetailRow label="سنة الصنع" value={String(v.year)} />
            <DetailRow label="الحالة" value={VEHICLE_STATUS[v.status].label} />
            <DetailRow label="آخر صيانة" value={formatDate(v.lastService)} icon={<Wrench size={14} />} />
            <DetailRow label="الصيانة القادمة" value={formatDate(v.nextService)} icon={<Calendar size={14} />} />
            <DetailRow label="إجمالي الكيلومترات" value={v.totalKm.toLocaleString("ar-SA") + " كم"} icon={<Gauge size={14} />} />
          </div>
        </div>

        {/* Assignment History */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", marginBottom: "1rem" }}>
            سجل تعيين المركبات
          </h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>المركبة</th>
                <th style={thStyle}>من</th>
                <th style={thStyle}>إلى</th>
              </tr>
            </thead>
            <tbody>
              {v.history.map((h, i) => (
                <tr key={i}>
                  <td style={{ ...tdStyle, fontWeight: 500, color: "var(--con-text-primary)" }}>{h.vehicle}</td>
                  <td style={tdStyle}>{formatDate(h.from)}</td>
                  <td style={tdStyle}>{h.to === "حالياً" ? <span className="con-badge con-badge-success" style={{ fontSize: "var(--con-text-caption)" }}>حالياً</span> : formatDate(h.to)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Tab: التذاكر (Tickets) ─────────────────────────────────────────────────────

function TicketsTab({ d }: { d: DriverData }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={cardStyle}>
        <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <MessageSquare size={16} style={{ color: "var(--con-brand)" }} /> تذاكر المندوب
        </h3>
        {d.tickets.length === 0 ? (
          <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)", textAlign: "center", padding: "2rem 0" }}>لا توجد تذاكر</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>رقم التذكرة</th>
                <th style={thStyle}>العنوان</th>
                <th style={thStyle}>التصنيف</th>
                <th style={thStyle}>القسم</th>
                <th style={thStyle}>التاريخ</th>
                <th style={thStyle}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {d.tickets.map((t) => (
                <tr key={t.id}>
                  <td style={{ ...tdStyle, fontFamily: "var(--con-font-mono)", fontSize: "var(--con-text-caption)" }}>{t.id}</td>
                  <td style={{ ...tdStyle, fontWeight: 500, color: "var(--con-text-primary)" }}>{t.title}</td>
                  <td style={tdStyle}>{t.category}</td>
                  <td style={tdStyle}>{t.department}</td>
                  <td style={tdStyle}>{formatDate(t.date)}</td>
                  <td style={tdStyle}>
                    <span className={`con-badge ${TICKET_STATUS[t.status].cls}`} style={{ fontSize: "var(--con-text-caption)" }}>
                      {TICKET_STATUS[t.status].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}

// ─── Tab: المخالفات (Violations) ────────────────────────────────────────────────

function ViolationsTab({ d }: { d: DriverData }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={cardStyle}>
        <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ShieldAlert size={16} style={{ color: "var(--con-danger)" }} /> سجل المخالفات
        </h3>
        {d.violations.length === 0 ? (
          <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)", textAlign: "center", padding: "2rem 0" }}>لا توجد مخالفات</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>الرقم</th>
                <th style={thStyle}>التاريخ</th>
                <th style={thStyle}>النوع</th>
                <th style={thStyle}>الوصف</th>
                <th style={thStyle}>الغرامة</th>
              </tr>
            </thead>
            <tbody>
              {d.violations.map((v) => (
                <tr key={v.id}>
                  <td style={{ ...tdStyle, fontFamily: "var(--con-font-mono)", fontSize: "var(--con-text-caption)" }}>{v.id}</td>
                  <td style={tdStyle}>{formatDate(v.date)}</td>
                  <td style={tdStyle}>
                    <span className="con-badge con-badge-danger" style={{ fontSize: "var(--con-text-caption)" }}>{v.type}</span>
                  </td>
                  <td style={{ ...tdStyle, color: "var(--con-text-primary)" }}>{v.description}</td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: "var(--con-danger)" }}>{formatCurrency(v.penalty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function DriverProfilePage() {
  const { driverId } = useParams<{ driverId: string }>();
  const navigate = useNavigate();
  const [driver, setDriver] = useState<DriverData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<DriverData | null>(null);

  useEffect(() => {
    async function fetchDriver() {
      setLoading(true);
      try {
        if (supabase) {
          const { data, error } = await supabase
            .from("couriers")
            .select("*")
            .eq("id", driverId)
            .single();
          if (!error && data) {
            setDriver(data);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Supabase fetch failed — fall back to mock
      }
      // Fallback to mock data
      setDriver({ ...MOCK_DRIVER, id: driverId || "DRV-001" });
      setLoading(false);
    }
    fetchDriver();
  }, [driverId]);

  if (loading) {
    return (
      <div dir="rtl" style={{ padding: "3rem", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{ width: 32, height: 32, border: "3px solid var(--con-border-default)", borderTop: "3px solid var(--con-brand)", borderRadius: "50%" }}
        />
      </div>
    );
  }

  if (!driver) return null;

  const targetPct = Math.round((driver.monthlyOrders / driver.monthlyTarget) * 100);

  return (
    <div dir="rtl" style={{ padding: "1.5rem", maxWidth: 1400, margin: "0 auto" }}>
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate(-1)}
        style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          background: "none", border: "none", color: "var(--con-text-muted)",
          cursor: "pointer", fontSize: "var(--con-text-body)", marginBottom: "1rem",
          padding: "0.5rem 0", fontFamily: "var(--con-font-primary)",
        }}
      >
        <ChevronLeft size={18} /> العودة
      </motion.button>

      {/* ─── Section 1: Header Card ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          ...cardStyle,
          display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap",
          marginBottom: "1.5rem",
          background: "linear-gradient(135deg, var(--con-bg-surface-1) 0%, var(--con-bg-surface-2) 100%)",
        }}
      >
        {/* Avatar */}
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "var(--con-brand-subtle)", border: "2px solid var(--con-brand-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.5rem", fontWeight: 700, color: "var(--con-brand)",
          flexShrink: 0,
        }}>
          {getInitials(driver.name)}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
            <h1 style={{ fontSize: "var(--con-text-page-title)", fontWeight: 700, color: "var(--con-text-primary)", margin: 0 }}>
              {driver.name}
            </h1>
            <span className={`con-badge ${STATUS_CONFIG[driver.status].cls}`}>
              {STATUS_CONFIG[driver.status].label}
            </span>
            <span className="con-badge con-badge-brand" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Star size={12} /> {driver.rating}
            </span>
          </div>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "var(--con-text-body)", color: "var(--con-text-secondary)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}><Phone size={14} /> {driver.phone}</span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}><IdCard size={14} /> {driver.nationalId}</span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}><CircleDot size={14} /> {driver.platform}</span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}><Calendar size={14} /> انضم {formatDate(driver.joinDate)}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            className="con-btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", fontSize: "var(--con-text-caption)", borderRadius: "var(--con-radius)", border: "none", cursor: "pointer" }}
            onClick={() => { setEditData(driver ? { ...driver } : null); setEditMode(true); }}
          >
            <Edit size={14} /> تعديل البيانات
          </button>
          <button
            className="con-btn-danger"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", fontSize: "var(--con-text-caption)", borderRadius: "var(--con-radius)", border: "none", cursor: "pointer" }}
            onClick={async () => {
              if (!driver) return;
              try {
                if (supabase) {
                  await supabase.from("couriers").update({ status: "suspended" }).eq("id", driver.id);
                }
                setDriver((prev) => prev ? { ...prev, status: "suspended" } : prev);
                toast.success("تم إيقاف المندوب");
              } catch { toast.error("فشل إيقاف المندوب"); }
            }}
          >
            <Ban size={14} /> إيقاف المندوب
          </button>
          <button
            className="con-btn-ghost"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", fontSize: "var(--con-text-caption)", borderRadius: "var(--con-radius)", border: "1px solid var(--con-border-default)", cursor: "pointer", background: "transparent", color: "var(--con-text-secondary)" }}
            onClick={() => {
              if (!driver) return;
              const phone = driver.phone?.replace(/[^0-9]/g, "") || "";
              const intl = phone.startsWith("0") ? "966" + phone.slice(1) : phone;
              window.open(`https://wa.me/${intl}?text=${encodeURIComponent(`مرحباً ${driver.name}`)}`, "_blank");
            }}
          >
            <Send size={14} /> إرسال رسالة
          </button>
        </div>
      </motion.div>

      {/* ─── Section 2: KPI Cards Row ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}
      >
        {/* Orders */}
        <div className="con-kpi-card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginBottom: "0.5rem" }}>طلبات الشهر</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--con-text-primary)" }}>{driver.monthlyOrders}</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: "var(--con-radius)", background: "var(--con-brand-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Package size={20} style={{ color: "var(--con-brand)" }} />
            </div>
          </div>
          <div style={{ marginTop: "0.75rem" }}>
            <ProgressBar value={driver.monthlyOrders} max={driver.monthlyTarget} />
            <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginTop: "0.25rem", display: "block" }}>
              {targetPct}% من الهدف ({driver.monthlyTarget})
            </span>
          </div>
        </div>

        {/* Earnings */}
        <div className="con-kpi-card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginBottom: "0.5rem" }}>الإيرادات</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--con-text-primary)" }}>{formatCurrency(driver.monthlyEarnings)}</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: "var(--con-radius)", background: "var(--con-success-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DollarSign size={20} style={{ color: "var(--con-success)" }} />
            </div>
          </div>
          <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginTop: "0.75rem", display: "block" }}>
            إجمالي الشهر الحالي
          </span>
        </div>

        {/* Rating */}
        <div className="con-kpi-card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginBottom: "0.5rem" }}>التقييم</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--con-text-primary)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                {driver.ratingScore} <Star size={18} style={{ color: "var(--con-warning)", fill: "var(--con-warning)" }} />
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: "var(--con-radius)", background: "var(--con-warning-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={20} style={{ color: "var(--con-warning)" }} />
            </div>
          </div>
          <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginTop: "0.75rem", display: "block" }}>
            من 5.0
          </span>
        </div>

        {/* Violations */}
        <div className="con-kpi-card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginBottom: "0.5rem" }}>المخالفات</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: driver.violationCount > 0 ? "var(--con-danger)" : "var(--con-success)" }}>
                {driver.violationCount}
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: "var(--con-radius)", background: driver.violationCount > 0 ? "var(--con-danger-subtle)" : "var(--con-success-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertTriangle size={20} style={{ color: driver.violationCount > 0 ? "var(--con-danger)" : "var(--con-success)" }} />
            </div>
          </div>
          <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginTop: "0.75rem", display: "block" }}>
            هذا الشهر
          </span>
        </div>
      </motion.div>

      {/* ─── Section 3: Tabs ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {/* Tab Bar */}
        <div style={{
          display: "flex", gap: "0.25rem", marginBottom: "1.5rem",
          background: "var(--con-bg-surface-1)",
          borderRadius: "var(--con-radius-lg)",
          padding: "0.25rem",
          border: "1px solid var(--con-border-default)",
          overflowX: "auto",
        }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.65rem 1.25rem",
                fontSize: "var(--con-text-caption)",
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? "var(--con-brand)" : "var(--con-text-muted)",
                background: activeTab === tab.id ? "var(--con-brand-subtle)" : "transparent",
                border: activeTab === tab.id ? "1px solid var(--con-brand-border)" : "1px solid transparent",
                borderRadius: "var(--con-radius)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all var(--con-duration) var(--con-ease)",
                fontFamily: "var(--con-font-primary)",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "details" && <DetailsTab key="details" d={driver} />}
          {activeTab === "performance" && <PerformanceTab key="performance" d={driver} />}
          {activeTab === "financial" && <FinancialTab key="financial" d={driver} />}
          {activeTab === "vehicle" && <VehicleTab key="vehicle" d={driver} />}
          {activeTab === "tickets" && <TicketsTab key="tickets" d={driver} />}
          {activeTab === "violations" && <ViolationsTab key="violations" d={driver} />}
        </AnimatePresence>
      </motion.div>

      {/* ─── Edit Modal ─── */}
      {editMode && editData && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={() => setEditMode(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
          <div style={{ position: "relative", background: "var(--con-bg-surface, #0d1926)", border: "1px solid var(--con-border-default, #1a3a52)", borderRadius: 12, padding: 24, width: "90%", maxWidth: 650, maxHeight: "85vh", overflowY: "auto", zIndex: 1001 }} dir="rtl">
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--con-text-primary)", marginBottom: 16 }}>تعديل بيانات {editData.name}</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {/* الاسم */}
              <div>
                <label style={{ fontSize: 12, color: "var(--con-text-muted)", marginBottom: 4, display: "block" }}>الاسم</label>
                <input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} style={{ background: "var(--con-bg-elevated, #0a1628)", border: "1px solid var(--con-border-default, #1a3a52)", borderRadius: 8, padding: "8px 12px", color: "var(--con-text-primary, #e2e8f0)", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" }} />
              </div>
              {/* الجوال */}
              <div>
                <label style={{ fontSize: 12, color: "var(--con-text-muted)", marginBottom: 4, display: "block" }}>الجوال</label>
                <input value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} style={{ background: "var(--con-bg-elevated, #0a1628)", border: "1px solid var(--con-border-default, #1a3a52)", borderRadius: 8, padding: "8px 12px", color: "var(--con-text-primary, #e2e8f0)", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" }} />
              </div>
              {/* الإيميل */}
              <div>
                <label style={{ fontSize: 12, color: "var(--con-text-muted)", marginBottom: 4, display: "block" }}>الإيميل</label>
                <input value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} style={{ background: "var(--con-bg-elevated, #0a1628)", border: "1px solid var(--con-border-default, #1a3a52)", borderRadius: 8, padding: "8px 12px", color: "var(--con-text-primary, #e2e8f0)", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" }} />
              </div>
              {/* المدينة */}
              <div>
                <label style={{ fontSize: 12, color: "var(--con-text-muted)", marginBottom: 4, display: "block" }}>المدينة</label>
                <input value={editData.city} onChange={(e) => setEditData({ ...editData, city: e.target.value })} style={{ background: "var(--con-bg-elevated, #0a1628)", border: "1px solid var(--con-border-default, #1a3a52)", borderRadius: 8, padding: "8px 12px", color: "var(--con-text-primary, #e2e8f0)", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" }} />
              </div>
              {/* رقم الهوية */}
              <div>
                <label style={{ fontSize: 12, color: "var(--con-text-muted)", marginBottom: 4, display: "block" }}>رقم الهوية</label>
                <input value={editData.nationalId} onChange={(e) => setEditData({ ...editData, nationalId: e.target.value })} style={{ background: "var(--con-bg-elevated, #0a1628)", border: "1px solid var(--con-border-default, #1a3a52)", borderRadius: 8, padding: "8px 12px", color: "var(--con-text-primary, #e2e8f0)", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" }} />
              </div>
              {/* المنصة */}
              <div>
                <label style={{ fontSize: 12, color: "var(--con-text-muted)", marginBottom: 4, display: "block" }}>المنصة</label>
                <input value={editData.platform} onChange={(e) => setEditData({ ...editData, platform: e.target.value })} style={{ background: "var(--con-bg-elevated, #0a1628)", border: "1px solid var(--con-border-default, #1a3a52)", borderRadius: 8, padding: "8px 12px", color: "var(--con-text-primary, #e2e8f0)", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" }} />
              </div>
              {/* نوع التعاقد */}
              <div>
                <label style={{ fontSize: 12, color: "var(--con-text-muted)", marginBottom: 4, display: "block" }}>نوع التعاقد</label>
                <select value={editData.contractType} onChange={(e) => setEditData({ ...editData, contractType: e.target.value })} style={{ background: "var(--con-bg-elevated, #0a1628)", border: "1px solid var(--con-border-default, #1a3a52)", borderRadius: 8, padding: "8px 12px", color: "var(--con-text-primary, #e2e8f0)", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" }}>
                  <option value="دوام كامل">دوام كامل</option>
                  <option value="دوام جزئي">دوام جزئي</option>
                  <option value="عقد مؤقت">عقد مؤقت</option>
                  <option value="حر">حر</option>
                </select>
              </div>
              {/* الحالة */}
              <div>
                <label style={{ fontSize: 12, color: "var(--con-text-muted)", marginBottom: 4, display: "block" }}>الحالة</label>
                <select value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value as DriverStatus })} style={{ background: "var(--con-bg-elevated, #0a1628)", border: "1px solid var(--con-border-default, #1a3a52)", borderRadius: 8, padding: "8px 12px", color: "var(--con-text-primary, #e2e8f0)", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" }}>
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                  <option value="suspended">suspended</option>
                </select>
              </div>
              {/* IBAN */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 12, color: "var(--con-text-muted)", marginBottom: 4, display: "block" }}>IBAN</label>
                <input value={editData.iban} onChange={(e) => setEditData({ ...editData, iban: e.target.value })} style={{ background: "var(--con-bg-elevated, #0a1628)", border: "1px solid var(--con-border-default, #1a3a52)", borderRadius: 8, padding: "8px 12px", color: "var(--con-text-primary, #e2e8f0)", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" }} />
              </div>
              {/* جهة الطوارئ */}
              <div>
                <label style={{ fontSize: 12, color: "var(--con-text-muted)", marginBottom: 4, display: "block" }}>جهة الطوارئ</label>
                <input value={editData.emergencyContact} onChange={(e) => setEditData({ ...editData, emergencyContact: e.target.value })} style={{ background: "var(--con-bg-elevated, #0a1628)", border: "1px solid var(--con-border-default, #1a3a52)", borderRadius: 8, padding: "8px 12px", color: "var(--con-text-primary, #e2e8f0)", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" }} />
              </div>
              {/* رقم الطوارئ */}
              <div>
                <label style={{ fontSize: 12, color: "var(--con-text-muted)", marginBottom: 4, display: "block" }}>رقم الطوارئ</label>
                <input value={editData.emergencyPhone} onChange={(e) => setEditData({ ...editData, emergencyPhone: e.target.value })} style={{ background: "var(--con-bg-elevated, #0a1628)", border: "1px solid var(--con-border-default, #1a3a52)", borderRadius: 8, padding: "8px 12px", color: "var(--con-text-primary, #e2e8f0)", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" }} />
              </div>
            </div>

            {/* Save / Cancel */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
              <button
                onClick={() => setEditMode(false)}
                style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid var(--con-border-default, #1a3a52)", background: "transparent", color: "var(--con-text-secondary, #94a3b8)", fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}
              >
                إلغاء
              </button>
              <button
                onClick={async () => {
                  try {
                    if (supabase) {
                      await supabase.from("couriers").update(editData).eq("id", editData.id);
                    }
                    setDriver(editData);
                    toast.success("تم تحديث البيانات بنجاح");
                    setEditMode(false);
                  } catch {
                    toast.error("فشل تحديث البيانات");
                  }
                }}
                className="con-btn-primary"
                style={{ padding: "8px 20px", borderRadius: 8, border: "none", fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}
              >
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
