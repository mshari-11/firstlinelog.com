/**
 * صفحة التقارير - Admin Reports
 * FirstLine Logistics
 */
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  FileSpreadsheet,
  DollarSign,
  Package,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const monthlyRevenue = [
  { month: "سبتمبر", value: 820000, orders: 9200 },
  { month: "أكتوبر", value: 890000, orders: 9800 },
  { month: "نوفمبر", value: 950000, orders: 10500 },
  { month: "ديسمبر", value: 1100000, orders: 12100 },
  { month: "يناير", value: 1050000, orders: 11800 },
  { month: "فبراير", value: 1200000, orders: 12847 },
];

const platformPerformance = [
  { name: "هنقرستيشن", orders: 4200, revenue: 420000, percentage: 35, growth: 12 },
  { name: "جاهز", orders: 3600, revenue: 360000, percentage: 30, growth: 8 },
  { name: "مرسول", orders: 2400, revenue: 240000, percentage: 20, growth: 15 },
  { name: "نون فود", orders: 1200, revenue: 120000, percentage: 10, growth: 22 },
  { name: "أخرى", orders: 600, revenue: 60000, percentage: 5, growth: 5 },
];

const kpiCards = [
  { title: "إجمالي الإيرادات", value: "1.2M ر.س", change: "+18.3%", trend: "up", icon: DollarSign, period: "هذا الشهر" },
  { title: "إجمالي الطلبات", value: "12,847", change: "+12.5%", trend: "up", icon: Package, period: "هذا الشهر" },
  { title: "السائقين النشطين", value: "2,120", change: "+5.2%", trend: "up", icon: Users, period: "حالياً" },
  { title: "معدل التسليم", value: "94.8%", change: "+2.1%", trend: "up", icon: Clock, period: "هذا الشهر" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function AdminReports() {
  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.value));

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* العنوان */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">التقارير والتحليلات</h1>
          <p className="text-muted-foreground text-sm mt-1">نظرة تحليلية شاملة على أداء العمليات</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 ml-2" />
            طباعة
          </Button>
          <Button variant="outline" size="sm">
            <FileSpreadsheet className="w-4 h-4 ml-2" />
            تصدير Excel
          </Button>
        </div>
      </motion.div>

      {/* مؤشرات الأداء */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <motion.div key={kpi.title} variants={item}>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <kpi.icon className="w-5 h-5 text-primary" />
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{kpi.period}</span>
                </div>
                <p className="text-2xl font-bold font-mono">{kpi.value}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-muted-foreground">{kpi.title}</p>
                  <span className={`text-xs font-bold flex items-center gap-0.5 ${kpi.trend === "up" ? "text-emerald-600" : "text-red-500"}`}>
                    {kpi.trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {kpi.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* الإيرادات الشهرية */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">الإيرادات الشهرية</CardTitle>
              <CardDescription>آخر 6 أشهر</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {monthlyRevenue.map((month) => (
                <div key={month.month} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium w-20">{month.month}</span>
                    <span className="font-mono text-xs text-muted-foreground">{(month.value / 1000).toFixed(0)}K ر.س</span>
                  </div>
                  <div className="relative h-8 bg-muted/50 rounded-lg overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(month.value / maxRevenue) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="absolute inset-y-0 right-0 bg-gradient-to-l from-primary to-primary/60 rounded-lg flex items-center px-3"
                    >
                      <span className="text-[10px] font-bold text-primary-foreground font-mono">
                        {month.orders.toLocaleString("ar-SA")} طلب
                      </span>
                    </motion.div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* أداء المنصات */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">أداء المنصات</CardTitle>
              <CardDescription>توزيع الطلبات والإيرادات حسب المنصة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {platformPerformance.map((platform) => (
                <div key={platform.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold">{platform.name}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {platform.percentage}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">
                        {(platform.revenue / 1000).toFixed(0)}K ر.س
                      </span>
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                        <ArrowUpRight className="w-3 h-3" />
                        {platform.growth}%
                      </span>
                    </div>
                  </div>
                  <Progress value={platform.percentage} className="h-2" />
                  <p className="text-[11px] text-muted-foreground">
                    {platform.orders.toLocaleString("ar-SA")} طلب
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
