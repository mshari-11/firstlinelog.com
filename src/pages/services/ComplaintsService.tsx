/**
 * صفحة خدمة الشكاوى والطلبات
 */
import {
  MessageSquare, AlertCircle, CheckCircle2, Clock, Search, BarChart3,
  Users, ClipboardList, Car, DollarSign, FileSpreadsheet, Shield
} from "lucide-react";
import ServicePageLayout from "./ServicePageLayout";

export default function ComplaintsService() {
  return (
    <ServicePageLayout
      title="الشكاوى والطلبات"
      subtitle="خدمة العملاء والجودة"
      description="نظام متكامل لاستقبال ومتابعة الشكاوى والطلبات — مع تصنيف ذكي وتتبع حتى الإغلاق."
      icon={MessageSquare}
      adminPath="/admin/login"
      accentColor="oklch(0.65 0.15 300)"
      stats={[
        { label: "شكوى مفتوحة", value: "23" },
        { label: "متوسط وقت الحل", value: "4 ساعات" },
        { label: "نسبة الحل", value: "96%" },
        { label: "رضا العملاء", value: "4.7/5" },
      ]}
      features={[
        {
          title: "استقبال الشكاوى",
          description: "قنوات متعددة لاستقبال الشكاوى: النظام المباشر، البريد، الهاتف، والمنصات.",
          icon: AlertCircle,
        },
        {
          title: "تصنيف تلقائي",
          description: "تصنيف ذكي للشكاوى حسب النوع والأولوية مع توجيه للقسم المختص.",
          icon: Search,
        },
        {
          title: "تتبع الحالة",
          description: "تتبع كل شكوى من لحظة الاستلام حتى الإغلاق مع تحديثات مستمرة.",
          icon: Clock,
        },
        {
          title: "الحل والإغلاق",
          description: "إجراءات واضحة للحل مع تأكيد رضا المشتكي قبل إغلاق البلاغ.",
          icon: CheckCircle2,
        },
        {
          title: "تقارير الجودة",
          description: "تقارير دورية عن أنواع الشكاوى المتكررة وخطط التحسين المتبعة.",
          icon: BarChart3,
        },
        {
          title: "ضمان الجودة",
          description: "معايير جودة واضحة (SLA) لأوقات الرد والحل مع مراقبة مستمرة.",
          icon: Shield,
        },
      ]}
      relatedLinks={[
        { label: "المناديب", path: "/services/couriers", icon: Users, color: "oklch(0.65 0.18 200)" },
        { label: "الطلبات", path: "/services/orders", icon: ClipboardList, color: "oklch(0.70 0.15 150)" },
        { label: "المركبات", path: "/services/vehicles", icon: Car, color: "oklch(0.65 0.15 50)" },
        { label: "المالية", path: "/services/finance", icon: DollarSign, color: "oklch(0.70 0.15 130)" },
        { label: "Excel", path: "/services/excel", icon: FileSpreadsheet, color: "oklch(0.60 0.15 160)" },
        { label: "لوحة التحكم", path: "/services/dashboard", icon: BarChart3, color: "oklch(0.65 0.18 200)" },
      ]}
    />
  );
}
