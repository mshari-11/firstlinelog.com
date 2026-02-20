/**
 * صفحة خدمة المالية والرواتب
 */
import {
  DollarSign, CreditCard, TrendingUp, Receipt, PieChart, Calculator,
  Users, ClipboardList, Car, MessageSquare, FileSpreadsheet, BarChart3
} from "lucide-react";
import ServicePageLayout from "./ServicePageLayout";

export default function FinanceService() {
  return (
    <ServicePageLayout
      title="المالية والرواتب"
      subtitle="الإدارة المالية والمحاسبية"
      description="إدارة شاملة للرواتب والمستحقات والتقارير المالية — مع شفافية تشغيلية ترفع ثقة الشريك."
      icon={DollarSign}
      adminPath="/admin/login"
      accentColor="oklch(0.70 0.15 130)"
      stats={[
        { label: "مسير رواتب شهري", value: "+2.1M" },
        { label: "مندوب يُصرف له", value: "+620" },
        { label: "دقة الحسابات", value: "99.8%" },
        { label: "يوم صرف", value: "25" },
      ]}
      features={[
        {
          title: "مسيرات الرواتب",
          description: "إعداد مسيرات رواتب شهرية تلقائية بناءً على بيانات التشغيل والأداء.",
          icon: CreditCard,
        },
        {
          title: "حساب المستحقات",
          description: "حساب دقيق لمستحقات كل مندوب حسب عدد التوصيلات والمسافات والحوافز.",
          icon: Calculator,
        },
        {
          title: "التقارير المالية",
          description: "تقارير مالية دورية شاملة: إيرادات، مصروفات، هوامش ربح، ومقارنات.",
          icon: TrendingUp,
        },
        {
          title: "الفواتير والمستندات",
          description: "إدارة الفواتير من وإلى المنصات الشريكة مع أرشفة إلكترونية كاملة.",
          icon: Receipt,
        },
        {
          title: "تحليل التكاليف",
          description: "تحليل تكاليف التشغيل لكل مدينة ومنصة لتحسين الربحية.",
          icon: PieChart,
        },
        {
          title: "لوحة مالية",
          description: "لوحة بيانات مالية لحظية تعرض الوضع المالي العام والتدفقات النقدية.",
          icon: BarChart3,
        },
      ]}
      relatedLinks={[
        { label: "المناديب", path: "/services/couriers", icon: Users, color: "oklch(0.65 0.18 200)" },
        { label: "الطلبات", path: "/services/orders", icon: ClipboardList, color: "oklch(0.70 0.15 150)" },
        { label: "المركبات", path: "/services/vehicles", icon: Car, color: "oklch(0.65 0.15 50)" },
        { label: "الشكاوى", path: "/services/complaints", icon: MessageSquare, color: "oklch(0.65 0.15 300)" },
        { label: "Excel", path: "/services/excel", icon: FileSpreadsheet, color: "oklch(0.60 0.15 160)" },
        { label: "لوحة التحكم", path: "/services/dashboard", icon: BarChart3, color: "oklch(0.65 0.18 200)" },
      ]}
    />
  );
}
