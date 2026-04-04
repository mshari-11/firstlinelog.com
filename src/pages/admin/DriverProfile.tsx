/**
 * بطاقة المندوب الشاملة — Driver Profile Page
 * FirstLine Logistics
 */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Star,
  Calendar,
  Edit,
  Ban,
  MessageSquare,
  Package,
  DollarSign,
  AlertTriangle,
  Truck,
  Ticket,
  ClipboardList,
  User,
  CreditCard,
  Shield,
  Wrench,
  Gauge,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

/* ─── CSS var helpers ─── */
const V = {
  bg: "var(--con-bg, #0a0f1a)",
  card: "var(--con-card, #111827)",
  cardBorder: "var(--con-card-border, #1e293b)",
  text: "var(--con-text, #e2e8f0)",
  textDim: "var(--con-text-dim, #94a3b8)",
  accent: "var(--con-accent, #3b82f6)",
  accentLight: "var(--con-accent-light, #60a5fa)",
  success: "var(--con-success, #22c55e)",
  warning: "var(--con-warning, #f59e0b)",
  danger: "var(--con-danger, #ef4444)",
  purple: "#a855f7",
};

/* ─── Types ─── */
interface DriverData {
  id: string;
  name: string;
  phone: string;
  email: string;
  nationalId: string;
  city: string;
  platform: string;
  status: "active" | "inactive" | "suspended";
  rating: "A" | "B" | "C";
  joinDate: string;
  contractType: string;
  contractStart: string;
  iban: string;
  emergencyContact: string;
  emergencyPhone: string;
  monthlyTarget: number;
  monthlyAchieved: number;
  monthlyRevenue: number;
  violations: number;
}

/* ─── Mock data ─── */
const MOCK_DRIVER: DriverData = {
  id: "DRV-001",
  name: "أحمد محمد الغامدي",
  phone: "0512345678",
  email: "ahmed.ghamdi@email.com",
  nationalId: "1234567890",
  city: "جدة",
  platform: "هنقرستيشن",
  status: "active",
  rating: "A",
  joinDate: "2024-03-15",
  contractType: "عقد تشغيل",
  contractStart: "2024-03-15",
  iban: "SA0380000000608010167519",
  emergencyContact: "محمد أحمد الغامدي",
  emergencyPhone: "0598765432",
  monthlyTarget: 300,
  monthlyAchieved: 245,
  monthlyRevenue: 12450,
  violations: 2,
};

const WEEKLY_PERF = [
  { week: "الأسبوع 1", target: 75, achieved: 68, pct: 91 },
  { week: "الأسبوع 2", target: 75, achieved: 62, pct: 83 },
  { week: "الأسبوع 3", target: 75, achieved: 58, pct: 77 },
  { week: "الأسبوع 4", target: 75, achieved: 57, pct: 76 },
];

const FINANCE_BREAKDOWN = [
  { label: "أساسي (إيرادات الطلبات)", amount: 12450 },
  { label: "بدل وقود", amount: 800 },
  { label: "بدل هاتف", amount: 200 },
  { label: "خصم غياب (-1 يوم)", amount: -350 },
  { label: "خصم مخالفة", amount: -200 },
  { label: "خصم سلفة", amount: -500 },
];
const FINANCE_NET = 12400;

const FINANCE_HISTORY = [
  { month: "يناير 2026", gross: 13200, deductions: 950, net: 12250 },
  { month: "فبراير 2026", gross: 11800, deductions: 700, net: 11100 },
  { month: "مارس 2026", gross: 12450, deductions: 1050, net: 11400 },
];

const ADVANCES = [
  { id: "ADV-01", date: "2026-01-10", amount: 2000, paid: 1500, remaining: 500, status: "جارٍ السداد" },
  { id: "ADV-02", date: "2026-03-05", amount: 1000, paid: 0, remaining: 1000, status: "معلّق" },
];

const VEHICLE = {
  plate: "ABC-1234",
  type: "دراجة نارية",
  brand: "هوندا",
  year: 2022,
  status: "نشطة",
  lastService: "2026-03-01",
  nextService: "2026-06-01",
  kmDriven: 15420,
};

const TICKETS = [
  { id: "TKT-101", title: "مستحقات مالية متأخرة", date: "2026-03-20", status: "مفتوحة", priority: "عالية" },
  { id: "TKT-102", title: "طلب بدل وقود إضافي", date: "2026-03-25", status: "قيد المراجعة", priority: "متوسطة" },
  { id: "TKT-103", title: "طلب إجازة", date: "2026-03-28", status: "مغلقة", priority: "منخفضة" },
];

const VIOLATIONS = [
  { id: "VIO-01", type: "تأخر عن الوردية", date: "2026-03-10", penalty: -200, notes: "تأخر 45 دقيقة عن بداية الوردية" },
  { id: "VIO-02", type: "غياب بدون إذن", date: "2026-03-18", penalty: -350, notes: "غياب يوم كامل بدون إشعار مسبق" },
];

const TABS = [
  { key: "details", label: "تفاصيل", icon: User },
  { key: "performance", label: "الأداء", icon: TrendingUp },
  { key: "finance", label: "المالية", icon: DollarSign },
  { key: "vehicle", label: "المركبة", icon: Truck },
  { key: "tickets", label: "التذاكر", icon: Ticket },
  { key: "violations", label: "المخالفات", icon: AlertTriangle },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/* ─── Shared styles ─── */
const cardStyle: React.CSSProperties = {
  background: V.card,
  border: `1px solid ${V.cardBorder}`,
  borderRadius: 12,
  padding: 20,
};

const tableHeaderStyle: React.CSSProperties = {
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 600,
  color: V.textDim,
  borderBottom: `1px solid ${V.cardBorder}`,
  textAlign: "right",
};

const tableCellStyle: React.CSSProperties = {
  padding: "10px 14px",
  fontSize: 14,
  color: V.text,
  borderBottom: `1px solid ${V.cardBorder}`,
};

/* ─── Helpers ─── */
function statusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: "rgba(34,197,94,0.15)", text: V.success, label: "نشط" },
    inactive: { bg: "rgba(148,163,184,0.15)", text: V.textDim, label: "غير نشط" },
    suspended: { bg: "rgba(239,68,68,0.15)", text: V.danger, label: "موقوف" },
  };
  const s = map[status] || map.inactive;
  return (
    <span style={{ background: s.bg, color: s.text, padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
      {s.label}
    </span>
  );
}

function ratingBadge(r: string) {
  const map: Record<string, string> = { A: V.success, B: V.warning, C: V.danger };
  return (
    <span style={{ background: `${map[r] || V.textDim}22`, color: map[r] || V.textDim, padding: "4px 14px", borderRadius: 20, fontSize: 14, fontWeight: 700 }}>
      {r}
    </span>
  );
}

function ticketStatusBadge(status: string) {
  const map: Record<string, { bg: string; color: string }> = {
    "مفتوحة": { bg: "rgba(239,68,68,0.15)", color: V.danger },
    "قيد المراجعة": { bg: "rgba(245,158,11,0.15)", color: V.warning },
    "مغلقة": { bg: "rgba(34,197,94,0.15)", color: V.success },
  };
  const s = map[status] || { bg: "rgba(148,163,184,0.15)", color: V.textDim };
  return <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 16, fontSize: 12, fontWeight: 600 }}>{status}</span>;
}

function priorityBadge(p: string) {
  const map: Record<string, { bg: string; color: string }> = {
    "عالية": { bg: "rgba(239,68,68,0.15)", color: V.danger },
    "متوسطة": { bg: "rgba(245,158,11,0.15)", color: V.warning },
    "منخفضة": { bg: "rgba(34,197,94,0.15)", color: V.success },
  };
  const s = map[p] || { bg: "rgba(148,163,184,0.15)", color: V.textDim };
  return <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 16, fontSize: 12, fontWeight: 600 }}>{p}</span>;
}

function formatNum(n: number) {
  return n.toLocaleString("ar-SA");
}

/* ─── Main Component ─── */
export default function DriverProfilePage() {
  const { driverId } = useParams<{ driverId: string }>();
  const navigate = useNavigate();
  const [driver, setDriver] = useState<DriverData>(MOCK_DRIVER);
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDriver() {
      try {
        if (!supabase) throw new Error("no client");
        const { data, error } = await supabase
          .from("drivers")
          .select("*")
          .eq("driver_id", driverId)
          .single();
        if (error || !data) throw error;
        setDriver({
          id: data.driver_id,
          name: data.full_name || MOCK_DRIVER.name,
          phone: data.phone || MOCK_DRIVER.phone,
          email: data.email || MOCK_DRIVER.email,
          nationalId: data.national_id || MOCK_DRIVER.nationalId,
          city: data.city || MOCK_DRIVER.city,
          platform: data.platform || MOCK_DRIVER.platform,
          status: data.status || MOCK_DRIVER.status,
          rating: data.rating || MOCK_DRIVER.rating,
          joinDate: data.join_date || MOCK_DRIVER.joinDate,
          contractType: data.contract_type || MOCK_DRIVER.contractType,
          contractStart: data.contract_start || MOCK_DRIVER.contractStart,
          iban: data.iban || MOCK_DRIVER.iban,
          emergencyContact: data.emergency_contact || MOCK_DRIVER.emergencyContact,
          emergencyPhone: data.emergency_phone || MOCK_DRIVER.emergencyPhone,
          monthlyTarget: data.monthly_target ?? MOCK_DRIVER.monthlyTarget,
          monthlyAchieved: data.monthly_achieved ?? MOCK_DRIVER.monthlyAchieved,
          monthlyRevenue: data.monthly_revenue ?? MOCK_DRIVER.monthlyRevenue,
          violations: data.violations_count ?? MOCK_DRIVER.violations,
        });
      } catch {
        setDriver({ ...MOCK_DRIVER, id: driverId || MOCK_DRIVER.id });
      } finally {
        setLoading(false);
      }
    }
    fetchDriver();
  }, [driverId]);

  const pct = driver.monthlyTarget > 0 ? Math.round((driver.monthlyAchieved / driver.monthlyTarget) * 100) : 0;

  if (loading) {
    return (
      <div dir="rtl" style={{ padding: 40, color: V.text, background: V.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>
          جارٍ تحميل بيانات المندوب...
        </motion.div>
      </div>
    );
  }

  /* ─── KPI Cards ─── */
  const kpis = [
    { label: "طلبات الشهر", value: `${formatNum(driver.monthlyAchieved)}/${formatNum(driver.monthlyTarget)}`, sub: `${pct}%`, icon: Package, color: V.accent },
    { label: "الإيرادات", value: `${formatNum(driver.monthlyRevenue)} ر.س`, sub: "الشهر الحالي", icon: DollarSign, color: V.success },
    { label: "التقييم", value: driver.rating, sub: "تصنيف الأداء", icon: Star, color: V.warning },
    { label: "المخالفات", value: String(driver.violations), sub: "هذا الشهر", icon: AlertTriangle, color: V.danger },
  ];

  /* ─── Detail rows helper ─── */
  function DetailRow({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${V.cardBorder}` }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: `${V.accent}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={V.accent} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: V.textDim }}>{label}</div>
          <div style={{ fontSize: 14, color: V.text, fontWeight: 500, marginTop: 2 }}>{value}</div>
        </div>
      </div>
    );
  }

  /* ─── Tab Content ─── */
  function renderTab() {
    switch (activeTab) {
      case "details":
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={cardStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: V.text, marginBottom: 16 }}>البيانات الشخصية</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
              <DetailRow label="الاسم الكامل" value={driver.name} icon={User} />
              <DetailRow label="رقم الجوال" value={driver.phone} icon={Phone} />
              <DetailRow label="البريد الإلكتروني" value={driver.email} icon={Mail} />
              <DetailRow label="رقم الهوية" value={driver.nationalId} icon={Shield} />
              <DetailRow label="المدينة" value={driver.city} icon={MapPin} />
              <DetailRow label="تاريخ بداية العقد" value={driver.contractStart} icon={Calendar} />
              <DetailRow label="نوع العقد" value={driver.contractType} icon={FileText} />
              <DetailRow label="IBAN" value={driver.iban} icon={CreditCard} />
              <DetailRow label="جهة اتصال الطوارئ" value={driver.emergencyContact} icon={User} />
              <DetailRow label="هاتف الطوارئ" value={driver.emergencyPhone} icon={Phone} />
            </div>
          </motion.div>
        );

      case "performance":
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Target progress */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: V.text, marginBottom: 16 }}>الهدف الشهري</h3>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: V.textDim }}>التحقيق: {formatNum(driver.monthlyAchieved)} من {formatNum(driver.monthlyTarget)}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: pct >= 80 ? V.success : pct >= 60 ? V.warning : V.danger }}>{pct}%</span>
              </div>
              <div style={{ height: 12, background: `${V.cardBorder}`, borderRadius: 6, overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(pct, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{ height: "100%", borderRadius: 6, background: pct >= 80 ? V.success : pct >= 60 ? V.warning : V.danger }}
                />
              </div>
            </div>

            {/* Weekly table */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: V.text, marginBottom: 16 }}>أداء آخر 4 أسابيع</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>الأسبوع</th>
                    <th style={tableHeaderStyle}>الهدف</th>
                    <th style={tableHeaderStyle}>المحقق</th>
                    <th style={tableHeaderStyle}>النسبة</th>
                  </tr>
                </thead>
                <tbody>
                  {WEEKLY_PERF.map((w) => (
                    <tr key={w.week}>
                      <td style={tableCellStyle}>{w.week}</td>
                      <td style={tableCellStyle}>{w.target}</td>
                      <td style={tableCellStyle}>{w.achieved}</td>
                      <td style={tableCellStyle}>
                        <span style={{ color: w.pct >= 80 ? V.success : w.pct >= 60 ? V.warning : V.danger, fontWeight: 600 }}>{w.pct}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Attendance */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: V.text, marginBottom: 16 }}>الحضور والانصراف</h3>
              <div style={{ display: "flex", gap: 24 }}>
                {[
                  { label: "حاضر", value: 22, icon: CheckCircle2, color: V.success },
                  { label: "متأخر", value: 3, icon: Clock, color: V.warning },
                  { label: "غائب", value: 1, icon: XCircle, color: V.danger },
                ].map((a) => (
                  <div key={a.label} style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, background: `${a.color}10`, padding: "14px 16px", borderRadius: 10 }}>
                    <a.icon size={22} color={a.color} />
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: a.color }}>{a.value}</div>
                      <div style={{ fontSize: 12, color: V.textDim }}>{a.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case "finance":
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Current month breakdown */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: V.text, marginBottom: 16 }}>كشف الشهر الحالي</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>البند</th>
                    <th style={{ ...tableHeaderStyle, textAlign: "left" }}>المبلغ (ر.س)</th>
                  </tr>
                </thead>
                <tbody>
                  {FINANCE_BREAKDOWN.map((f) => (
                    <tr key={f.label}>
                      <td style={tableCellStyle}>{f.label}</td>
                      <td style={{ ...tableCellStyle, textAlign: "left", color: f.amount < 0 ? V.danger : V.success, fontWeight: 600 }}>
                        {f.amount < 0 ? "" : "+"}{formatNum(f.amount)}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ ...tableCellStyle, fontWeight: 700, fontSize: 15, borderTop: `2px solid ${V.accent}` }}>صافي المستحق</td>
                    <td style={{ ...tableCellStyle, textAlign: "left", fontWeight: 700, fontSize: 15, color: V.accent, borderTop: `2px solid ${V.accent}` }}>
                      {formatNum(FINANCE_NET)} ر.س
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* History */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: V.text, marginBottom: 16 }}>سجل آخر 3 أشهر</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>الشهر</th>
                    <th style={tableHeaderStyle}>الإجمالي</th>
                    <th style={tableHeaderStyle}>الخصومات</th>
                    <th style={tableHeaderStyle}>الصافي</th>
                  </tr>
                </thead>
                <tbody>
                  {FINANCE_HISTORY.map((h) => (
                    <tr key={h.month}>
                      <td style={tableCellStyle}>{h.month}</td>
                      <td style={tableCellStyle}>{formatNum(h.gross)}</td>
                      <td style={{ ...tableCellStyle, color: V.danger }}>{formatNum(h.deductions)}-</td>
                      <td style={{ ...tableCellStyle, fontWeight: 600, color: V.accent }}>{formatNum(h.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Advances */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: V.text, marginBottom: 16 }}>السلف المستحقة</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>الرقم</th>
                    <th style={tableHeaderStyle}>التاريخ</th>
                    <th style={tableHeaderStyle}>المبلغ</th>
                    <th style={tableHeaderStyle}>المسدد</th>
                    <th style={tableHeaderStyle}>المتبقي</th>
                    <th style={tableHeaderStyle}>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {ADVANCES.map((a) => (
                    <tr key={a.id}>
                      <td style={tableCellStyle}>{a.id}</td>
                      <td style={tableCellStyle}>{a.date}</td>
                      <td style={tableCellStyle}>{formatNum(a.amount)}</td>
                      <td style={{ ...tableCellStyle, color: V.success }}>{formatNum(a.paid)}</td>
                      <td style={{ ...tableCellStyle, color: V.danger }}>{formatNum(a.remaining)}</td>
                      <td style={tableCellStyle}>
                        <span style={{
                          background: a.status === "جارٍ السداد" ? "rgba(59,130,246,0.15)" : "rgba(245,158,11,0.15)",
                          color: a.status === "جارٍ السداد" ? V.accent : V.warning,
                          padding: "3px 10px",
                          borderRadius: 16,
                          fontSize: 12,
                          fontWeight: 600,
                        }}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        );

      case "vehicle":
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={cardStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: V.text, marginBottom: 16 }}>بيانات المركبة</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
              <DetailRow label="رقم اللوحة" value={VEHICLE.plate} icon={Truck} />
              <DetailRow label="النوع" value={VEHICLE.type} icon={ClipboardList} />
              <DetailRow label="الماركة" value={VEHICLE.brand} icon={Truck} />
              <DetailRow label="سنة الصنع" value={String(VEHICLE.year)} icon={Calendar} />
              <DetailRow label="الحالة" value={VEHICLE.status} icon={CheckCircle2} />
              <DetailRow label="آخر صيانة" value={VEHICLE.lastService} icon={Wrench} />
              <DetailRow label="الصيانة القادمة" value={VEHICLE.nextService} icon={Wrench} />
              <DetailRow label="الكيلومترات" value={`${formatNum(VEHICLE.kmDriven)} كم`} icon={Gauge} />
            </div>
          </motion.div>
        );

      case "tickets":
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={cardStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: V.text, marginBottom: 16 }}>تذاكر المندوب</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>الرقم</th>
                  <th style={tableHeaderStyle}>الموضوع</th>
                  <th style={tableHeaderStyle}>التاريخ</th>
                  <th style={tableHeaderStyle}>الأولوية</th>
                  <th style={tableHeaderStyle}>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {TICKETS.map((t) => (
                  <tr key={t.id}>
                    <td style={{ ...tableCellStyle, fontWeight: 600, color: V.accent }}>{t.id}</td>
                    <td style={tableCellStyle}>{t.title}</td>
                    <td style={{ ...tableCellStyle, color: V.textDim }}>{t.date}</td>
                    <td style={tableCellStyle}>{priorityBadge(t.priority)}</td>
                    <td style={tableCellStyle}>{ticketStatusBadge(t.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        );

      case "violations":
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={cardStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: V.text, marginBottom: 16 }}>سجل المخالفات</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>الرقم</th>
                  <th style={tableHeaderStyle}>النوع</th>
                  <th style={tableHeaderStyle}>التاريخ</th>
                  <th style={tableHeaderStyle}>الخصم (ر.س)</th>
                  <th style={tableHeaderStyle}>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {VIOLATIONS.map((v) => (
                  <tr key={v.id}>
                    <td style={{ ...tableCellStyle, fontWeight: 600, color: V.danger }}>{v.id}</td>
                    <td style={tableCellStyle}>{v.type}</td>
                    <td style={{ ...tableCellStyle, color: V.textDim }}>{v.date}</td>
                    <td style={{ ...tableCellStyle, color: V.danger, fontWeight: 600 }}>{formatNum(v.penalty)}</td>
                    <td style={{ ...tableCellStyle, fontSize: 13, color: V.textDim }}>{v.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        );

      default:
        return null;
    }
  }

  /* ─── Render ─── */
  return (
    <div dir="rtl" style={{ padding: "24px 32px", background: V.bg, minHeight: "100vh", color: V.text, fontFamily: "inherit" }}>
      {/* Back button */}
      <motion.button
        whileHover={{ x: -4 }}
        onClick={() => navigate("/admin-panel/drivers")}
        style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: V.textDim, fontSize: 14, cursor: "pointer", marginBottom: 20, padding: 0 }}
      >
        <ArrowRight size={18} />
        العودة للمناديب
      </motion.button>

      {/* Header card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardStyle, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          {/* Driver info */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${V.accent}, ${V.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#fff" }}>
              {driver.name.charAt(0)}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: V.text, margin: 0 }}>{driver.name}</h1>
                {statusBadge(driver.status)}
                {ratingBadge(driver.rating)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: V.textDim }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Phone size={13} /> {driver.phone}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={13} /> {driver.city}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>{driver.platform}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={13} /> انضم: {driver.joinDate}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { label: "تعديل", icon: Edit, bg: V.accent },
              { label: "إيقاف", icon: Ban, bg: V.danger },
              { label: "إرسال رسالة", icon: MessageSquare, bg: V.success },
            ].map((a) => (
              <motion.button
                key={a.label}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8,
                  background: `${a.bg}20`, color: a.bg, border: `1px solid ${a.bg}40`,
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                <a.icon size={15} />
                {a.label}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            style={cardStyle}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 12, color: V.textDim, marginBottom: 6 }}>{k.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: V.text }}>{k.value}</div>
                <div style={{ fontSize: 12, color: k.color, marginTop: 4 }}>{k.sub}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${k.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <k.icon size={20} color={k.color} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: V.card, borderRadius: 10, padding: 4, border: `1px solid ${V.cardBorder}` }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <motion.button
              key={tab.key}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                background: isActive ? V.accent : "transparent",
                color: isActive ? "#fff" : V.textDim,
                transition: "all 0.2s",
              }}
            >
              <tab.icon size={15} />
              {tab.label}
            </motion.button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <div key={activeTab}>{renderTab()}</div>
      </AnimatePresence>
    </div>
  );
}
