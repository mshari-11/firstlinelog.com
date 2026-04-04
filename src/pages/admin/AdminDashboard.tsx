/**
 * لوحة التحكم الرئيسية للإدارة - Admin Dashboard
 * FirstLine Logistics
 */
import * as React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useDashboardStats } from "@/lib/hooks/useDashboardStats";
import {
  Package,
  Users,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  MapPin,
  Calendar,
  Activity,
  ChevronLeft,
  Info,
  Plus,
  ClipboardList,
  MessageSquare,
  Wallet,
  Car,
  BarChart3,
  FileSpreadsheet,
  CreditCard,
  Settings2,
  Shield,
  Bell,
  ScrollText,
  GraduationCap,
  CheckCircle2,
  Building2,
  Plug,
  Map,
  Target,
  Zap,
  Brain,
  UserCheck,
  Mail,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

const stats = [
  {
    title: "إجمالي الطلبات",
    value: "12,847",
    change: "+12.5%",
    trend: "up",
    icon: Package,
    color: "text-blue-600",
    bg: "bg-blue-50",
    link: "/admin/orders",
    tip: "عدد الطلبات الكلي من بداية التشغيل",
  },
  {
    title: "السائقين النشطين",
    value: "2,847",
    change: "+5.2%",
    trend: "up",
    icon: Users,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    link: "/admin/drivers",
    tip: "السائقين الذين أكملوا طلب واحد على الأقل خلال 30 يوم",
  },
  {
    title: "الإيرادات الشهرية",
    value: "1.2M ر.س",
    change: "+18.3%",
    trend: "up",
    icon: TrendingUp,
    color: "text-primary",
    bg: "bg-primary/10",
    link: "/admin-panel/finance",
    tip: "إجمالي الإيرادات للشهر الحالي من جميع المنصات",
  },
  {
    title: "متوسط وقت التسليم",
    value: "28 دقيقة",
    change: "-3.1%",
    trend: "down",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
    link: "/admin/reports",
    tip: "متوسط الوقت من استلام الطلب حتى تسليمه للعميل",
  },
];

const recentOrders = [
  {
    id: "FLL-10847",
    customer: "مطاعم البيك",
    driver: "أحمد محمد",
    status: "delivered",
    time: "منذ 5 دقائق",
    city: "جدة",
  },
  {
    id: "FLL-10846",
    customer: "هنقرستيشن",
    driver: "خالد علي",
    status: "in_transit",
    time: "منذ 12 دقيقة",
    city: "الرياض",
  },
  {
    id: "FLL-10845",
    customer: "جاهز",
    driver: "سعد ناصر",
    status: "picked_up",
    time: "منذ 18 دقيقة",
    city: "جدة",
  },
  {
    id: "FLL-10844",
    customer: "مرسول",
    driver: "فهد أحمد",
    status: "pending",
    time: "منذ 25 دقيقة",
    city: "الدمام",
  },
  {
    id: "FLL-10843",
    customer: "نون فود",
    driver: "عمر سعيد",
    status: "delivered",
    time: "منذ 30 دقيقة",
    city: "مكة",
  },
];

const topCities = [
  { name: "جدة", orders: 4250, percentage: 33 },
  { name: "الرياض", orders: 3890, percentage: 30 },
  { name: "مكة", orders: 1920, percentage: 15 },
  { name: "الدمام", orders: 1540, percentage: 12 },
  { name: "المدينة", orders: 1247, percentage: 10 },
];

const statusMap: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  delivered: { label: "تم التسليم", variant: "default" },
  in_transit: { label: "في الطريق", variant: "secondary" },
  picked_up: { label: "تم الاستلام", variant: "outline" },
  pending: { label: "قيد الانتظار", variant: "destructive" },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function OrderSkeleton() {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/30">
      <Skeleton className="w-10 h-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-3 w-16 hidden sm:block" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

interface QuickAction {
  label: string;
  icon: React.ElementType;
  path: string;
  color: string;
}

function QuickActionGroup({
  title,
  actions,
  navigate,
}: {
  title: string;
  actions: QuickAction[];
  navigate: (p: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-2">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a.path + a.label}
            onClick={() => navigate(a.path)}
            className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-border/60 bg-background hover:bg-muted/60 hover:border-primary/30 transition-all text-sm"
          >
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: a.color + "18" }}
            >
              <a.icon className="w-3.5 h-3.5" style={{ color: a.color }} />
            </div>
            <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground whitespace-nowrap">
              {a.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const dashStats = useDashboardStats();
  const [ordersLoading, setOrdersLoading] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setOrdersLoading(false), dashStats.loading ? 1500 : 800);
    return () => clearTimeout(t);
  }, [dashStats.loading]);

  // Build dynamic stats from hook
  const liveStats = [
    {
      title: "إجمالي الطلبات",
      value: dashStats.totalOrders.toLocaleString("ar-SA"),
      change: `${dashStats.totalOrdersChange > 0 ? "+" : ""}${dashStats.totalOrdersChange}%`,
      trend: dashStats.totalOrdersChange >= 0 ? "up" : "down",
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
      link: "/admin/orders",
      tip: "عدد الطلبات الكلي من بداية التشغيل",
    },
    {
      title: "السائقين النشطين",
      value: dashStats.activeDrivers.toLocaleString("ar-SA"),
      change: `${dashStats.activeDriversChange > 0 ? "+" : ""}${dashStats.activeDriversChange}%`,
      trend: dashStats.activeDriversChange >= 0 ? "up" : "down",
      icon: Users,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      link: "/admin/drivers",
      tip: "السائقين الذين أكملوا طلب واحد على الأقل خلال 30 يوم",
    },
    {
      title: "الإير��دات الشهرية",
      value: dashStats.monthlyRevenue >= 1_000_000
        ? `${(dashStats.monthlyRevenue / 1_000_000).toFixed(1)}M ر.س`
        : `${(dashStats.monthlyRevenue / 1_000).toFixed(0)}K ر.س`,
      change: `${dashStats.monthlyRevenueChange > 0 ? "+" : ""}${dashStats.monthlyRevenueChange}%`,
      trend: dashStats.monthlyRevenueChange >= 0 ? "up" : "down",
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
      link: "/admin-panel/finance",
      tip: "إجمالي الإيرادات للشهر الحالي من جميع المنصات",
    },
    {
      title: "متوسط وقت التسليم",
      value: `${dashStats.avgDeliveryTime} دقيقة`,
      change: `${dashStats.avgDeliveryTimeChange > 0 ? "+" : ""}${dashStats.avgDeliveryTimeChange}%`,
      trend: dashStats.avgDeliveryTimeChange <= 0 ? "up" : "down",
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      link: "/admin/reports",
      tip: "متوسط الوقت من استلام الطلب حتى تسليمه للعميل",
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* العنوان */}
      <motion.div
        variants={item}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold">لوحة التحكم</h1>
          <p className="text-muted-foreground text-sm mt-1">
            نظرة عامة على العمليات اليومية
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-4 py-2">
          <Calendar className="w-4 h-4" />
          <span>
            اليوم:{" "}
            {new Date().toLocaleDateString("ar-SA", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </motion.div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {liveStats.map((stat, i) => (
          <motion.div key={stat.title} variants={item}>
            <Card
              className={`hover:shadow-md transition-shadow ${stat.link ? "cursor-pointer hover:border-primary/40" : ""}`}
              onClick={() => stat.link && navigate(stat.link)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex items-center gap-1 text-xs font-bold ${stat.trend === "up" ? "text-emerald-600" : "text-amber-600"}`}
                    >
                      {stat.trend === "up" ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                      {stat.change}
                    </div>
                    {stat.link && (
                      <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground/50 rotate-180" />
                    )}
                  </div>
                </div>
                <p className="text-2xl font-bold tracking-tight font-mono">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  {stat.title}
                  {stat.tip && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-muted-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs max-w-[200px]">{stat.tip}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ⚡ أوامر سريعة — Quick Actions */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              أوامر سريعة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* التشغيل */}
            <QuickActionGroup
              title="التشغيل"
              actions={[
                {
                  label: "طلب جديد",
                  icon: Plus,
                  path: "/admin-panel/orders",
                  color: "#3b82f6",
                },
                {
                  label: "إضافة مندوب",
                  icon: Users,
                  path: "/admin-panel/couriers",
                  color: "#10b981",
                },
                {
                  label: "تسجيل شكوى",
                  icon: MessageSquare,
                  path: "/admin-panel/complaints",
                  color: "#f59e0b",
                },
                {
                  label: "إرسال شحنة",
                  icon: Package,
                  path: "/admin-panel/shipments",
                  color: "#8b5cf6",
                },
                {
                  label: "خريطة الإرسال",
                  icon: Map,
                  path: "/admin-panel/dispatch",
                  color: "#06b6d4",
                },
                {
                  label: "مراقبة SLA",
                  icon: Target,
                  path: "/admin-panel/sla",
                  color: "#ec4899",
                },
                {
                  label: "تكاملات المنصات",
                  icon: Plug,
                  path: "/admin-panel/marketplace",
                  color: "#6366f1",
                },
              ]}
              navigate={navigate}
            />

            {/* المالية */}
            <QuickActionGroup
              title="المالية والموارد"
              actions={[
                {
                  label: "إنشاء دفعة",
                  icon: CreditCard,
                  path: "/admin-panel/payouts",
                  color: "#10b981",
                },
                {
                  label: "لوحة المالية",
                  icon: Wallet,
                  path: "/admin-panel/finance-dashboard",
                  color: "#3b82f6",
                },
                {
                  label: "تحليل AI",
                  icon: Brain,
                  path: "/admin-panel/ai-finance",
                  color: "#8b5cf6",
                },
                {
                  label: "تقرير مالي",
                  icon: BarChart3,
                  path: "/admin-panel/financial-reports",
                  color: "#f59e0b",
                },
                {
                  label: "استيراد Excel",
                  icon: FileSpreadsheet,
                  path: "/admin-panel/excel",
                  color: "#22c55e",
                },
                {
                  label: "الفواتير",
                  icon: ClipboardList,
                  path: "/admin-panel/invoices",
                  color: "#06b6d4",
                },
              ]}
              navigate={navigate}
            />

            {/* الأصول والموظفون */}
            <QuickActionGroup
              title="الأصول والموظفون"
              actions={[
                {
                  label: "إضافة مركبة",
                  icon: Car,
                  path: "/admin-panel/vehicles",
                  color: "#3b82f6",
                },
                {
                  label: "إدارة الموظفين",
                  icon: Building2,
                  path: "/admin-panel/staff",
                  color: "#10b981",
                },
                {
                  label: "إدارة الأسطول",
                  icon: Truck,
                  path: "/admin-panel/fleet",
                  color: "#f59e0b",
                },
                {
                  label: "الحضور",
                  icon: Clock,
                  path: "/admin-panel/attendance",
                  color: "#8b5cf6",
                },
              ]}
              navigate={navigate}
            />

            {/* النظام */}
            <QuickActionGroup
              title="النظام"
              actions={[
                {
                  label: "الاعتمادات",
                  icon: CheckCircle2,
                  path: "/admin-panel/approvals",
                  color: "#10b981",
                },
                {
                  label: "الإشعارات",
                  icon: Bell,
                  path: "/admin-panel/notifications",
                  color: "#f59e0b",
                },
                {
                  label: "سجل التدقيق",
                  icon: ScrollText,
                  path: "/admin-panel/audit-log",
                  color: "#6366f1",
                },
                {
                  label: "سجل الإيميلات",
                  icon: Mail,
                  path: "/admin-panel/email-logs",
                  color: "#06b6d4",
                },
                {
                  label: "الإعدادات",
                  icon: Settings2,
                  path: "/admin-panel/settings",
                  color: "#64748b",
                },
              ]}
              navigate={navigate}
            />

            {/* السائقون */}
            <QuickActionGroup
              title="السائقون"
              actions={[
                {
                  label: "طلبات التسجيل",
                  icon: UserCheck,
                  path: "/admin-panel/driver-applications",
                  color: "#3b82f6",
                },
                {
                  label: "وثائق KYC",
                  icon: Shield,
                  path: "/admin-panel/kyc",
                  color: "#f59e0b",
                },
                {
                  label: "التدريب",
                  icon: GraduationCap,
                  path: "/admin-panel/driver-training",
                  color: "#10b981",
                },
              ]}
              navigate={navigate}
            />
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* آخر الطلبات */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base font-bold">آخر الطلبات</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  <Activity className="w-3 h-3 ml-1" />
                  مباشر
                </Badge>
                <button
                  onClick={() => navigate("/admin/orders")}
                  className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-0.5"
                >
                  عرض الكل
                  <ChevronLeft className="w-3 h-3 rotate-180" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ordersLoading ? (
                  <>
                    <OrderSkeleton />
                    <OrderSkeleton />
                    <OrderSkeleton />
                    <OrderSkeleton />
                  </>
                ) : (
                  dashStats.recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Truck className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-muted-foreground">
                            {order.id}
                          </span>
                          <Badge
                            variant={statusMap[order.status].variant}
                            className="text-[10px] px-2"
                          >
                            {statusMap[order.status].label}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mt-1 truncate">
                          {order.customer}
                        </p>
                      </div>
                      <div className="text-left hidden sm:block">
                        <p className="text-sm font-medium">{order.driver}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {order.city}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {order.time}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* أعلى المدن */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold">
                التوزيع حسب المدينة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {dashStats.topCities.map((city) => (
                <div key={city.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{city.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {city.orders.toLocaleString("ar-SA")} طلب
                    </span>
                  </div>
                  <Progress value={city.percentage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
