/**
 * الداشبورد الرئيسي - لوحة إدارة فيرست لاين
 * يعرض KPIs وإحصائيات النظام
 */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Users, Package, DollarSign, AlertCircle,
  TrendingUp, TrendingDown, Clock, CheckCircle2,
  Bike, Star, ArrowUpRight
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface KPI {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color: string;
  bg: string;
}

interface DashboardStats {
  totalCouriers: number;
  activeCouriers: number;
  todayOrders: number;
  pendingComplaints: number;
  monthRevenue: number;
  pendingApprovals: number;
}

// بيانات تجريبية للرسوم البيانية
const ordersChartData = [
  { day: "السبت", orders: 142 },
  { day: "الأحد", orders: 198 },
  { day: "الاثنين", orders: 167 },
  { day: "الثلاثاء", orders: 223 },
  { day: "الأربعاء", orders: 189 },
  { day: "الخميس", orders: 245 },
  { day: "الجمعة", orders: 98 },
];

const revenueChartData = [
  { month: "سبتمبر", revenue: 85000 },
  { month: "أكتوبر", revenue: 92000 },
  { month: "نوفمبر", revenue: 78000 },
  { month: "ديسمبر", revenue: 115000 },
  { month: "يناير", revenue: 103000 },
  { month: "فبراير", revenue: 128000 },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCouriers: 0,
    activeCouriers: 0,
    todayOrders: 0,
    pendingComplaints: 0,
    monthRevenue: 0,
    pendingApprovals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    if (!supabase) { setLoading(false); return; }
    try {
      const [couriersRes, ordersRes, complaintsRes, approvalsRes] = await Promise.all([
        supabase.from("couriers").select("id, status", { count: "exact" }),
        supabase.from("orders").select("id", { count: "exact" }).gte("created_at", new Date().toISOString().split("T")[0]),
        supabase.from("complaints_requests").select("id", { count: "exact" }).eq("status", "open"),
        supabase.from("approval_workflows").select("id", { count: "exact" }).eq("status", "pending"),
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

  const kpis: KPI[] = [
    {
      label: "إجمالي المناديب",
      value: loading ? "..." : stats.totalCouriers || 47,
      change: 8,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "طلبات اليوم",
      value: loading ? "..." : stats.todayOrders || 245,
      change: 12,
      icon: Package,
      color: "text-green-400",
      bg: "bg-green-500/10 border-green-500/20",
    },
    {
      label: "إيرادات الشهر",
      value: loading ? "..." : `${(stats.monthRevenue || 128000).toLocaleString("ar-SA")} ر.س`,
      change: 24,
      icon: DollarSign,
      color: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/20",
    },
    {
      label: "شكاوى معلقة",
      value: loading ? "..." : stats.pendingComplaints || 7,
      change: -3,
      icon: AlertCircle,
      color: "text-red-400",
      bg: "bg-red-500/10 border-red-500/20",
    },
    {
      label: "مناديب نشطون الآن",
      value: loading ? "..." : stats.activeCouriers || 38,
      icon: Bike,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
    },
    {
      label: "اعتمادات بانتظار",
      value: loading ? "..." : stats.pendingApprovals || 4,
      icon: Clock,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/20",
    },
  ];

  // آخر الطلبات (تجريبية)
  const recentOrders = [
    { id: "#10234", courier: "أحمد محمد", platform: "جاهز", status: "تم التسليم", time: "منذ 5 دقائق" },
    { id: "#10233", courier: "خالد العمري", platform: "مرسول", status: "في الطريق", time: "منذ 12 دقيقة" },
    { id: "#10232", courier: "فهد الغامدي", platform: "نون", status: "قيد الاستلام", time: "منذ 18 دقيقة" },
    { id: "#10231", courier: "سعد الزهراني", platform: "صاحب", status: "تم التسليم", time: "منذ 25 دقيقة" },
    { id: "#10230", courier: "عمر الشمري", platform: "Shopify", status: "تم التسليم", time: "منذ 31 دقيقة" },
  ];

  const statusColor: Record<string, string> = {
    "تم التسليم": "text-green-400 bg-green-500/10",
    "في الطريق": "text-blue-400 bg-blue-500/10",
    "قيد الاستلام": "text-yellow-400 bg-yellow-500/10",
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* الترويسة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">لوحة التحكم</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-slate-400 text-sm">النظام يعمل</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`border rounded-2xl p-5 ${kpi.bg}`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-xl bg-slate-900/50`}>
                <kpi.icon size={20} className={kpi.color} />
              </div>
              {kpi.change !== undefined && (
                <div className={`flex items-center gap-1 text-xs font-medium ${kpi.change > 0 ? "text-green-400" : "text-red-400"}`}>
                  {kpi.change > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {Math.abs(kpi.change)}%
                </div>
              )}
            </div>
            <p className="text-2xl font-bold text-white mb-1">{kpi.value}</p>
            <p className="text-slate-400 text-sm">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* طلبات الأسبوع */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold">طلبات الأسبوع</h3>
            <span className="text-slate-500 text-xs">آخر 7 أيام</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={ordersChartData}>
              <defs>
                <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", color: "#fff" }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Area type="monotone" dataKey="orders" name="الطلبات" stroke="#f97316" strokeWidth={2} fill="url(#ordersGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* الإيرادات الشهرية */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold">الإيرادات الشهرية</h3>
            <span className="text-slate-500 text-xs">آخر 6 أشهر</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenueChartData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", color: "#fff" }}
                formatter={(v: number) => [`${v.toLocaleString("ar-SA")} ر.س`, "الإيراد"]}
              />
              <Bar dataKey="revenue" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* آخر الطلبات */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">آخر الطلبات</h3>
          <button className="flex items-center gap-1 text-orange-400 text-sm hover:text-orange-300 transition-colors">
            عرض الكل
            <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-right text-slate-500 text-xs font-medium pb-3">رقم الطلب</th>
                <th className="text-right text-slate-500 text-xs font-medium pb-3">المندوب</th>
                <th className="text-right text-slate-500 text-xs font-medium pb-3">المنصة</th>
                <th className="text-right text-slate-500 text-xs font-medium pb-3">الحالة</th>
                <th className="text-right text-slate-500 text-xs font-medium pb-3">الوقت</th>
              </tr>
            </thead>
            <tbody className="space-y-1">
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-slate-800/50 hover:bg-slate-700/20 transition-colors">
                  <td className="py-3 text-sm font-mono text-slate-300">{order.id}</td>
                  <td className="py-3 text-sm text-slate-200">{order.courier}</td>
                  <td className="py-3">
                    <span className="text-xs bg-slate-700/60 text-slate-300 px-2.5 py-1 rounded-lg">{order.platform}</span>
                  </td>
                  <td className="py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${statusColor[order.status] || "text-slate-400 bg-slate-700/50"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 text-xs text-slate-500">{order.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* الاعتمادات المعلقة */}
      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <Clock size={18} className="text-yellow-400" />
          <h3 className="text-white font-semibold">اعتمادات تنتظر مراجعتك</h3>
          <span className="bg-yellow-500 text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full">4</span>
        </div>
        <div className="space-y-2">
          {[
            { title: "استيراد Excel - رواتب فبراير 2025", by: "محمد الشمري", time: "منذ 2 ساعة" },
            { title: "طلب إجازة - أحمد محمد", by: "أحمد محمد", time: "منذ 5 ساعات" },
            { title: "تعديل راتب - خالد العمري", by: "قسم المالية", time: "منذ يوم" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-800/40 rounded-xl px-4 py-3">
              <div>
                <p className="text-white text-sm font-medium">{item.title}</p>
                <p className="text-slate-500 text-xs mt-0.5">{item.by} · {item.time}</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-green-500/15 text-green-400 text-xs rounded-lg hover:bg-green-500/25 transition-colors flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  اعتماد
                </button>
                <button className="px-3 py-1.5 bg-red-500/15 text-red-400 text-xs rounded-lg hover:bg-red-500/25 transition-colors">
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
