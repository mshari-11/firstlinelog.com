/**
 * لوحة التحكم الرئيسية للإدارة - Admin Dashboard
 * FirstLine Logistics
 */
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  { id: "FLL-10847", customer: "مطاعم البيك", driver: "أحمد محمد", status: "delivered", time: "منذ 5 دقائق", city: "جدة" },
  { id: "FLL-10846", customer: "هنقرستيشن", driver: "خالد علي", status: "in_transit", time: "منذ 12 دقيقة", city: "الرياض" },
  { id: "FLL-10845", customer: "جاهز", driver: "سعد ناصر", status: "picked_up", time: "منذ 18 دقيقة", city: "جدة" },
  { id: "FLL-10844", customer: "مرسول", driver: "فهد أحمد", status: "pending", time: "منذ 25 دقيقة", city: "الدمام" },
  { id: "FLL-10843", customer: "نون فود", driver: "عمر سعيد", status: "delivered", time: "منذ 30 دقيقة", city: "مكة" },
];

const topCities = [
  { name: "جدة", orders: 4250, percentage: 33 },
  { name: "الرياض", orders: 3890, percentage: 30 },
  { name: "مكة", orders: 1920, percentage: 15 },
  { name: "الدمام", orders: 1540, percentage: 12 },
  { name: "المدينة", orders: 1247, percentage: 10 },
];

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
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

export default function AdminDashboard() {
  const navigate = useNavigate();
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* العنوان */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">لوحة التحكم</h1>
          <p className="text-muted-foreground text-sm mt-1">نظرة عامة على العمليات اليومية</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-4 py-2">
          <Calendar className="w-4 h-4" />
          <span>اليوم: {new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
        </div>
      </motion.div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
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
                    <div className={`flex items-center gap-1 text-xs font-bold ${stat.trend === "up" ? "text-emerald-600" : "text-amber-600"}`}>
                      {stat.trend === "up" ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {stat.change}
                    </div>
                    {stat.link && <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground/50 rotate-180" />}
                  </div>
                </div>
                <p className="text-2xl font-bold tracking-tight font-mono">{stat.value}</p>
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
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Truck className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-muted-foreground">{order.id}</span>
                        <Badge variant={statusMap[order.status].variant} className="text-[10px] px-2">
                          {statusMap[order.status].label}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium mt-1 truncate">{order.customer}</p>
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-sm font-medium">{order.driver}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {order.city}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{order.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* أعلى المدن */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold">التوزيع حسب المدينة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {topCities.map((city) => (
                <div key={city.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{city.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{city.orders.toLocaleString("ar-SA")} طلب</span>
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
