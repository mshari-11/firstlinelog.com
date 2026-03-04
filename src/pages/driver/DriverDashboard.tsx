/**
 * الصفحة الرئيسية للسائق - Driver Dashboard
 * FirstLine Logistics
 */
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Package,
  BadgeDollarSign,
  Star,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Truck,
  CheckCircle2,
  MapPin,
  Calendar,
  ChevronLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";

const stats = [
  { title: "طلبات اليوم", value: "12", icon: Package, color: "text-blue-600", bg: "bg-blue-50", link: "/driver/orders" },
  { title: "مستحقاتي", value: "اضغط للتفاصيل", icon: BadgeDollarSign, color: "text-emerald-600", bg: "bg-emerald-50", link: "/driver/entitlements" },
  { title: "التقييم", value: "4.8", icon: Star, color: "text-amber-600", bg: "bg-amber-50", link: null },
  { title: "ساعات العمل", value: "6.5 س", icon: Clock, color: "text-purple-600", bg: "bg-purple-50", link: null },
];

const activeOrders = [
  { id: "FLL-10847", restaurant: "مطاعم البيك", destination: "حي النزهة، جدة", status: "picked_up", time: "منذ 5 دقائق", amount: 45 },
  { id: "FLL-10846", restaurant: "ماكدونالدز", destination: "حي الصفا، جدة", status: "pending", time: "منذ دقيقة", amount: 38 },
  { id: "FLL-10845", restaurant: "شاورمر", destination: "حي الحمراء، جدة", status: "pending", time: "الآن", amount: 29 },
];

const weeklyStats = [
  { day: "الأحد", orders: 15, earnings: 620 },
  { day: "الاثنين", orders: 12, earnings: 485 },
  { day: "الثلاثاء", orders: 18, earnings: 745 },
  { day: "الأربعاء", orders: 14, earnings: 580 },
  { day: "الخميس", orders: 22, earnings: 920 },
  { day: "الجمعة", orders: 8, earnings: 340 },
  { day: "السبت", orders: 16, earnings: 650 },
];

const statusMap: Record<string, { label: string; color: string }> = {
  picked_up: { label: "تم الاستلام", color: "bg-amber-500" },
  pending: { label: "جديد", color: "bg-blue-500" },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DriverDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const maxEarnings = Math.max(...weeklyStats.map((d) => d.earnings));

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* الترحيب */}
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold">مرحباً {user?.name || "بالسائق"} 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </motion.div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <motion.div key={stat.title} variants={item}>
            <Card
              className={stat.link ? "cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all" : ""}
              onClick={() => stat.link && navigate(stat.link)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg ${stat.bg} w-fit mb-3`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  {stat.link && (
                    <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground rotate-180" />
                  )}
                </div>
                <p className="text-xl font-bold font-mono">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.title}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* الطلبات النشطة */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold">الطلبات النشطة</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500 text-white text-[10px]">{activeOrders.length} طلبات</Badge>
                <button
                  onClick={() => navigate("/driver/orders")}
                  className="text-xs text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-0.5"
                >
                  كل الطلبات
                  <ChevronLeft className="w-3 h-3 rotate-180" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeOrders.map((order) => (
                <div key={order.id} className="p-4 rounded-xl border border-border hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-muted-foreground">{order.id}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${statusMap[order.status].color}`} />
                      <span className="text-xs font-medium">{statusMap[order.status].label}</span>
                    </div>
                  </div>
                  <p className="font-medium text-sm">{order.restaurant}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {order.destination}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">{order.time}</span>
                    <span className="font-mono text-sm font-bold text-emerald-600">{order.amount} ر.س</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* ملخص الأسبوع */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">ملخص الأسبوع</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {weeklyStats.map((day) => (
                <div key={day.day} className="flex items-center gap-4">
                  <span className="text-xs font-medium w-16 text-muted-foreground">{day.day}</span>
                  <div className="flex-1">
                    <div className="relative h-6 bg-muted/50 rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(day.earnings / maxEarnings) * 100}%` }}
                        transition={{ duration: 0.6 }}
                        className="absolute inset-y-0 right-0 bg-gradient-to-l from-emerald-500 to-emerald-400 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="text-left w-20">
                    <span className="font-mono text-xs font-bold">{day.earnings} ر.س</span>
                    <p className="text-[10px] text-muted-foreground">{day.orders} طلب</p>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <span className="text-sm font-medium">إجمالي الأسبوع</span>
                <div className="text-left">
                  <span className="font-mono font-bold text-emerald-600">
                    {weeklyStats.reduce((a, b) => a + b.earnings, 0).toLocaleString("ar-SA")} ر.س
                  </span>
                  <p className="text-[10px] text-muted-foreground">
                    {weeklyStats.reduce((a, b) => a + b.orders, 0)} طلب
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
