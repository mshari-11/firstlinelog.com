/**
 * الداشبورد الرئيسي - لوحة إدارة فيرست لاين
 * Enterprise Operations Overview
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/admin/auth";
import { supabase } from "@/lib/supabase";
import {
  Users, Package, DollarSign, AlertCircle,
  TrendingUp, TrendingDown, Clock, CheckCircle2,
  Bike, ArrowUpRight, LayoutDashboard,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";

// ─── Chart tooltip style shared ───────────────────────────────────────────────
const chartTooltipStyle = {
  background: "var(--con-bg-elevated)",
  border: "1px solid var(--con-border-strong)",
  borderRadius: 8,
  color: "var(--con-text-primary)",
  fontSize: 12,
};

// ─── Data ──────────────────────────────────────────────────────────────────────
const ordersChartData = [
  { day: "السبت",    orders: 142 },
  { day: "الأحد",   orders: 198 },
  { day: "الاثنين", orders: 167 },
  { day: "الثلاثاء",orders: 223 },
  { day: "الأربعاء",orders: 189 },
  { day: "الخميس",  orders: 245 },
  { day: "الجمعة",  orders: 98  },
];

const revenueChartData = [
  { month: "سبتمبر",  revenue: 85000  },
  { month: "أكتوبر", revenue: 92000  },
  { month: "نوفمبر", revenue: 78000  },
  { month: "ديسمبر", revenue: 115000 },
  { month: "يناير",  revenue: 103000 },
  { month: "فبراير", revenue: 128000 },
];

const recentOrders = [
  { id: "#10234", courier: "أحمد محمد",    platform: "جاهز",   status: "delivered", statusAr: "تم التسليم",    time: "منذ 5 دقائق" },
  { id: "#10233", courier: "خالد العمري",  platform: "مرسول",  status: "on_way",    statusAr: "في الطريق",     time: "منذ 12 دقيقة" },
  { id: "#10232", courier: "فهد الغامدي",  platform: "نون",    status: "picked_up", statusAr: "قيد الاستلام",  time: "منذ 18 دقيقة" },
  { id: "#10231", courier: "سعد الزهراني", platform: "صاحب",   status: "delivered", statusAr: "تم التسليم",    time: "منذ 25 دقيقة" },
  { id: "#10230", courier: "عمر الشمري",   platform: "Shopify", status: "delivered", statusAr: "تم التسليم",   time: "منذ 31 دقيقة" },
];

const orderStatusBadge: Record<string, string> = {
  delivered: "con-badge-success",
  on_way:    "con-badge-info",
  picked_up: "con-badge-warning",
  failed:    "con-badge-danger",
};

interface DashboardStats {
  totalCouriers: number;
  activeCouriers: number;
  todayOrders: number;
  pendingComplaints: number;
  monthRevenue: number;
  pendingApprovals: number;
}

// ─── Chart Card wrapper ────────────────────────────────────────────────────────
function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--con-bg-surface-1)",
      border: "1px solid var(--con-border-default)",
      borderRadius: 10, padding: "18px 20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", margin: 0 }}>
          {title}
        </h3>
        {subtitle && (
          <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>{subtitle}</span>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalCouriers: 0, activeCouriers: 0, todayOrders: 0,
    pendingComplaints: 0, monthRevenue: 128000, pendingApprovals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    if (!supabase) { setLoading(false); return; }
    try {
      const [couriersRes, ordersRes, complaintsRes, approvalsRes] = await Promise.all([
        supabase.from("couriers").select("id, status", { count: "exact" }),
        supabase.from("orders").select("id", { count: "exact" }).gte("created_at", new Date().toISOString().split("T")[0]),
        supabase.from("complaints_requests").select("id", { count: "exact" }).eq("status", "open"),
        supabase.from("couriers").select("id", { count: "exact" }).eq("status", "pending"),
      ]);
      const couriers = couriersRes.data || [];
      setStats({
        totalCouriers: couriersRes.count || 0,
        activeCouriers: couriers.filter((c: { status: string }) => c.status === "active").length,
        todayOrders: ordersRes.count || 0,
        pendingComplaints: complaintsRes.count || 0,
        monthRevenue: 128000,
        pendingApprovals: approvalsRes.count || 0,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const kpis = [
    {
      key: "totalCouriers",   label: "إجمالي المناديب",     icon: Users,        accent: "var(--con-brand)",
      change: 8,  val: stats.totalCouriers   || 47,   format: (v: number) => String(v),
    },
    {
      key: "todayOrders",     label: "طلبات اليوم",          icon: Package,      accent: "var(--con-success)",
      change: 12, val: stats.todayOrders     || 245,  format: (v: number) => String(v),
    },
    {
      key: "monthRevenue",    label: "إيرادات الشهر",        icon: DollarSign,   accent: "var(--con-info)",
      change: 24, val: stats.monthRevenue    || 128000, format: (v: number) => `${v.toLocaleString("ar-SA")} ر.س`,
    },
    {
      key: "pendingComplaints",label: "شكاوى معلقة",         icon: AlertCircle,  accent: "var(--con-danger)",
      change: -3, val: stats.pendingComplaints|| 7,    format: (v: number) => String(v),
    },
    {
      key: "activeCouriers",  label: "مناديب نشطون الآن",   icon: Bike,         accent: "var(--con-warning)",
      val: stats.activeCouriers || 38, format: (v: number) => String(v),
    },
    {
      key: "pendingApprovals",label: "اعتمادات بانتظار",    icon: Clock,        accent: "var(--con-warning)",
      val: stats.pendingApprovals || 4, format: (v: number) => String(v),
    },
  ];

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              background: "rgba(59,130,246,0.12)", borderRadius: 8, padding: "7px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <LayoutDashboard size={18} style={{ color: "var(--con-brand)" }} />
            </div>
            <h1 style={{
              fontSize: "var(--con-text-page-title)", fontWeight: 700,
              color: "var(--con-text-primary)", margin: 0,
              fontFamily: "var(--con-font-primary)",
            }}>
              لوحة التحكم
            </h1>
          </div>
          <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)", margin: 0, paddingRight: 44 }}>
            {new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 12px", borderRadius: 7,
          background: "var(--con-bg-surface-1)",
          border: "1px solid var(--con-border-default)",
        }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--con-success)", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>النظام يعمل</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {kpis.map(kpi => (
          <div key={kpi.key} className="con-kpi-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <kpi.icon size={15} style={{ color: kpi.accent }} />
              {(kpi as any).change !== undefined && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 3,
                  fontSize: "var(--con-text-caption)", fontWeight: 600,
                  color: (kpi as any).change > 0 ? "var(--con-success)" : "var(--con-danger)",
                }}>
                  {(kpi as any).change > 0
                    ? <TrendingUp size={12} />
                    : <TrendingDown size={12} />}
                  {Math.abs((kpi as any).change)}%
                </div>
              )}
            </div>
            {loading
              ? <div className="con-skeleton" style={{ height: 22, width: "60%", borderRadius: 5, marginBottom: 6 }} />
              : <div className="con-kpi-value" style={{ color: kpi.accent }}>{kpi.format(kpi.val)}</div>
            }
            <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginTop: 4 }}>
              {kpi.label}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* Weekly Orders */}
        <ChartCard title="طلبات الأسبوع" subtitle="آخر 7 أيام">
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={ordersChartData}>
              <defs>
                <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: "var(--con-text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--con-text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: "var(--con-text-muted)" }} />
              <Area type="monotone" dataKey="orders" name="الطلبات" stroke="#3B82F6" strokeWidth={2} fill="url(#ordersGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Monthly Revenue */}
        <ChartCard title="الإيرادات الشهرية" subtitle="آخر 6 أشهر">
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={revenueChartData} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "var(--con-text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: "var(--con-text-muted)", fontSize: 10 }}
                axisLine={false} tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(v: number) => [`${v.toLocaleString("ar-SA")} ر.س`, "الإيراد"]}
              />
              <Bar dataKey="revenue" fill="#16A34A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Recent Orders */}
      <div style={{
        background: "var(--con-bg-surface-1)",
        border: "1px solid var(--con-border-default)",
        borderRadius: 10, overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px",
          borderBottom: "1px solid var(--con-border-default)",
        }}>
          <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", margin: 0 }}>
            آخر الطلبات
          </h3>
          <button style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: "var(--con-text-caption)", color: "var(--con-brand)",
            background: "none", border: "none", cursor: "pointer",
          }}>
            عرض الكل <ArrowUpRight size={13} />
          </button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="con-table">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>المندوب</th>
                <th>المنصة</th>
                <th>الحالة</th>
                <th>الوقت</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order.id}>
                  <td>
                    <span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-text-secondary)", fontSize: 12 }}>
                      {order.id}
                    </span>
                  </td>
                  <td style={{ color: "var(--con-text-primary)", fontWeight: 500 }}>{order.courier}</td>
                  <td>
                    <span style={{
                      fontSize: "var(--con-text-caption)", fontWeight: 500,
                      padding: "2px 8px", borderRadius: 5,
                      background: "var(--con-bg-surface-2)",
                      color: "var(--con-text-secondary)",
                      border: "1px solid var(--con-border-default)",
                    }}>
                      {order.platform}
                    </span>
                  </td>
                  <td>
                    <span className={`con-badge con-badge-sm ${orderStatusBadge[order.status] ?? ""}`}>
                      {order.statusAr}
                    </span>
                  </td>
                  <td style={{ color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)" }}>{order.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Approvals */}
      <div style={{
        background: "rgba(217,119,6,0.05)",
        border: "1px solid rgba(217,119,6,0.2)",
        borderRadius: 10, padding: "16px 20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Clock size={16} style={{ color: "var(--con-warning)" }} />
          <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", margin: 0, flex: 1 }}>
            اعتمادات تنتظر مراجعتك
          </h3>
          <span style={{
            fontFamily: "var(--con-font-mono)", fontSize: 11, fontWeight: 700,
            padding: "2px 8px", borderRadius: 10,
            background: "var(--con-warning)", color: "#000",
          }}>4</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { title: "استيراد Excel - رواتب فبراير 2025", by: "محمد الشمري",  time: "منذ 2 ساعة" },
            { title: "طلب إجازة - أحمد محمد",             by: "أحمد محمد",    time: "منذ 5 ساعات" },
            { title: "تعديل راتب - خالد العمري",           by: "قسم المالية", time: "منذ يوم" },
          ].map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", borderRadius: 8,
              background: "var(--con-bg-surface-1)",
              border: "1px solid var(--con-border-default)",
            }}>
              <div>
                <div style={{ fontSize: "var(--con-text-table)", fontWeight: 500, color: "var(--con-text-primary)" }}>
                  {item.title}
                </div>
                <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginTop: 2 }}>
                  {item.by} · {item.time}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "4px 10px", borderRadius: 5, fontSize: 11, fontWeight: 600,
                  background: "rgba(22,163,74,0.1)", color: "var(--con-success)",
                  border: "1px solid rgba(22,163,74,0.25)", cursor: "pointer",
                }}>
                  <CheckCircle2 size={12} /> اعتماد
                </button>
                <button style={{
                  padding: "4px 10px", borderRadius: 5, fontSize: 11, fontWeight: 600,
                  background: "rgba(220,38,38,0.08)", color: "var(--con-danger)",
                  border: "1px solid rgba(220,38,38,0.2)", cursor: "pointer",
                }}>
                  رفض
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
