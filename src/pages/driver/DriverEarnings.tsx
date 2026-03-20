/**
 * صفحة أرباح السائق - Driver Earnings
 * FirstLine Logistics
 */
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  Calendar,
  Download,
  CreditCard,
  Clock,
  Package,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const earningsSummary = [
  { title: "أرباح اليوم", value: "485 ر.س", icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50" },
  { title: "أرباح الأسبوع", value: "4,340 ر.س", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
  { title: "أرباح الشهر", value: "18,250 ر.س", icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
  { title: "الرصيد المعلق", value: "1,200 ر.س", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
];

const dailyBreakdown = [
  { date: "٢٠ فبراير", day: "الخميس", orders: 12, earnings: 485, bonus: 50, tips: 35 },
  { date: "١٩ فبراير", day: "الأربعاء", orders: 14, earnings: 580, bonus: 0, tips: 45 },
  { date: "١٨ فبراير", day: "الثلاثاء", orders: 18, earnings: 745, bonus: 100, tips: 60 },
  { date: "١٧ فبراير", day: "الاثنين", orders: 12, earnings: 485, bonus: 0, tips: 30 },
  { date: "١٦ فبراير", day: "الأحد", orders: 15, earnings: 620, bonus: 75, tips: 40 },
  { date: "١٥ فبراير", day: "السبت", orders: 16, earnings: 650, bonus: 0, tips: 55 },
  { date: "١٤ فبراير", day: "الجمعة", orders: 8, earnings: 340, bonus: 0, tips: 20 },
];

const paymentHistory = [
  { id: "PAY-001", date: "١٥ فبراير", amount: 8500, method: "تحويل بنكي", status: "completed" },
  { id: "PAY-002", date: "١ فبراير", amount: 9200, method: "تحويل بنكي", status: "completed" },
  { id: "PAY-003", date: "١٥ يناير", amount: 7800, method: "تحويل بنكي", status: "completed" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DriverEarnings() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">أرباحي</h1>
          <p className="text-muted-foreground text-sm mt-1">تتبع أرباحك ومدفوعاتك</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 ml-2" />
          تصدير كشف حساب
        </Button>
      </motion.div>

      {/* ملخص الأرباح */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {earningsSummary.map((stat) => (
          <motion.div key={stat.title} variants={item}>
            <Card>
              <CardContent className="p-4">
                <div className={`p-2 rounded-lg ${stat.bg} w-fit mb-3`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className="text-lg font-bold font-mono">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.title}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* التفاصيل اليومية */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">تفاصيل الأسبوع</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dailyBreakdown.map((day) => (
                  <div key={day.date} className="p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-medium">{day.day}</span>
                        <span className="text-xs text-muted-foreground mr-2">{day.date}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-600">{day.earnings} ر.س</span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {day.orders} طلب
                      </span>
                      {day.bonus > 0 && (
                        <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50">
                          مكافأة +{day.bonus}
                        </Badge>
                      )}
                      {day.tips > 0 && (
                        <span className="text-amber-600">إكرامية +{day.tips}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* سجل المدفوعات */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">سجل المدفوعات</CardTitle>
              <CardDescription>آخر التحويلات البنكية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentHistory.map((payment) => (
                <div key={payment.id} className="flex items-center gap-4 p-4 rounded-xl border border-border">
                  <div className="p-2.5 rounded-lg bg-emerald-50">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{payment.id}</span>
                      <Badge variant="default" className="text-[10px]">مكتمل</Badge>
                    </div>
                    <p className="text-sm mt-1">{payment.method}</p>
                    <p className="text-xs text-muted-foreground">{payment.date}</p>
                  </div>
                  <span className="font-mono font-bold text-lg">{payment.amount.toLocaleString("ar-SA")} ر.س</span>
                </div>
              ))}

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">هدف الشهر</span>
                  <span className="font-mono font-bold">18,250 / 25,000 ر.س</span>
                </div>
                <Progress value={73} className="h-3" />
                <p className="text-xs text-muted-foreground mt-2">أنت على بعد 6,750 ر.س من تحقيق هدفك الشهري</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
