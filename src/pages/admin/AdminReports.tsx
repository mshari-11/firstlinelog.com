/**
 * صفحة التقارير - Admin Reports
 * FirstLine Logistics
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileSpreadsheet,
  DollarSign,
  Package,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  Download,
  ChevronDown,
  FileText,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";

interface MonthlyRevenue {
  month: string;
  value: number;
  orders: number;
}

interface PlatformPerformance {
  name: string;
  orders: number;
  revenue: number;
  percentage: number;
  growth: number;
}

interface KpiCard {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ElementType;
  period: string;
}

const kpiIconMap: Record<string, React.ElementType> = {
  "إجمالي الإيرادات": DollarSign,
  "إجمالي الطلبات": Package,
  "السائقين النشطين": Users,
  "معدل التسليم": Clock,
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function AdminReports() {
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [platformPerformance, setPlatformPerformance] = useState<PlatformPerformance[]>([]);
  const [kpiCards, setKpiCards] = useState<KpiCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReportsData() {
      if (!supabase) return;
      try {
        const [revenueRes, platformRes, kpiRes] = await Promise.all([
          supabase
            .from("monthly_revenue_report")
            .select("month, value, orders")
            .order("created_at", { ascending: false })
            .limit(6),
          supabase
            .from("platform_performance_report")
            .select("name, orders, revenue, percentage, growth"),
          supabase
            .from("reports_kpi_summary")
            .select("title, value, change, trend, period"),
        ]);

        if (revenueRes.data && revenueRes.data.length > 0) {
          setMonthlyRevenue(revenueRes.data as MonthlyRevenue[]);
        }

        if (platformRes.data && platformRes.data.length > 0) {
          setPlatformPerformance(platformRes.data as PlatformPerformance[]);
        }

        if (kpiRes.data && kpiRes.data.length > 0) {
          setKpiCards(
            kpiRes.data.map((k) => ({
              ...k,
              trend: (k.trend === "up" || k.trend === "down" ? k.trend : "up") as "up" | "down",
              icon: kpiIconMap[k.title] ?? DollarSign,
            }))
          );
        }
      } catch (_err) {
        // بيانات فارغة عند الخطأ
      } finally {
        setLoading(false);
      }
    }

    fetchReportsData();
  }, []);

  const maxRevenue = monthlyRevenue.length > 0
    ? Math.max(...monthlyRevenue.map((m) => m.value))
    : 1;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* العنوان */}
      <motion.div
        variants={item}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold">التقارير والتحليلات</h1>
          <p className="text-muted-foreground text-sm mt-1">
            نظرة تحليلية شاملة على أداء العمليات
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 ml-2" />
                تصدير
                <ChevronDown className="w-3 h-3 mr-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>
                <FileSpreadsheet className="w-3.5 h-3.5 ml-2" />
                تصدير Excel
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="w-3.5 h-3.5 ml-2" />
                تصدير PDF
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="w-3.5 h-3.5 ml-2" />
                تصدير CSV
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Printer className="w-3.5 h-3.5 ml-2" />
                طباعة
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* مؤشرات الأداء */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <motion.div variants={item} className="col-span-4">
            <p className="text-sm text-muted-foreground text-center py-6">جاري التحميل...</p>
          </motion.div>
        ) : kpiCards.length === 0 ? (
          <motion.div variants={item} className="col-span-4">
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                لا توجد بيانات
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          kpiCards.map((kpi) => (
            <motion.div key={kpi.title} variants={item}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <kpi.icon className="w-5 h-5 text-primary" />
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {kpi.period}
                    </span>
                  </div>
                  <p className="text-2xl font-bold font-mono">{kpi.value}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-muted-foreground">{kpi.title}</p>
                    <span
                      className={`text-xs font-bold flex items-center gap-0.5 ${kpi.trend === "up" ? "text-emerald-600" : "text-red-500"}`}
                    >
                      {kpi.trend === "up" ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {kpi.change}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
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
              {monthlyRevenue.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</p>
              ) : (
                monthlyRevenue.map((month) => (
                  <div key={month.month} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium w-20">{month.month}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {(month.value / 1000).toFixed(0)}K ر.س
                      </span>
                    </div>
                    <div className="relative h-8 bg-muted/50 rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(month.value / maxRevenue) * 100}%`,
                        }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="absolute inset-y-0 right-0 bg-gradient-to-l from-primary to-primary/60 rounded-lg flex items-center px-3"
                      >
                        <span className="text-[10px] font-bold text-primary-foreground font-mono">
                          {month.orders.toLocaleString("ar-SA")} طلب
                        </span>
                      </motion.div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* أداء المنصات */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">أداء المنصات</CardTitle>
              <CardDescription>
                توزيع الطلبات والإيرادات حسب المنصة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {platformPerformance.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</p>
              ) : (
                platformPerformance.map((platform) => (
                  <div key={platform.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold">{platform.name}</span>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono"
                        >
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
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
