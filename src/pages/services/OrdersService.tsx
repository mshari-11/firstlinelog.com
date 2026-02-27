/**
 * صفحة خدمة إدارة الطلبات
 */
import {
  ClipboardList, Package, Truck, Clock, CheckCircle2, BarChart3,
  Users, Car, DollarSign, MessageSquare, FileSpreadsheet, MapPin
} from "lucide-react";
import ServicePageLayout from "./ServicePageLayout";

export default function OrdersService() {
  return (
    <ServicePageLayout
      title="إدارة الطلبات والتوصيل"
      subtitle="نظام تتبع وإدارة الشحنات"
      description="متابعة دقيقة لكل طلب من لحظة الاستلام حتى التسليم — مع تقارير أداء لحظية وإشعارات تلقائية."
      icon={ClipboardList}
      adminPath="/admin/login"
      accentColor="oklch(0.70 0.15 150)"
      stats={[
        { label: "طلب يومياً", value: "+1,200" },
        { label: "نسبة التسليم", value: "97%" },
        { label: "متوسط وقت التسليم", value: "38 دقيقة" },
        { label: "منصة شريكة", value: "12" },
      ]}
      features={[
        {
          title: "تتبع لحظي",
          description: "تتبع كل طلب لحظياً من الاستلام وحتى التسليم مع حالات واضحة ومحدّثة.",
          icon: Package,
        },
        {
          title: "توزيع ذكي",
          description: "توزيع الطلبات تلقائياً على المناديب حسب الموقع والحمل وحالة النشاط.",
          icon: MapPin,
        },
        {
          title: "إدارة أوقات التسليم",
          description: "مراقبة الالتزام بأوقات التسليم المتفق عليها مع المنصات (SLA).",
          icon: Clock,
        },
        {
          title: "تأكيد التسليم",
          description: "نظام تأكيد إلكتروني عند التسليم مع صور وتوقيع رقمي عند الحاجة.",
          icon: CheckCircle2,
        },
        {
          title: "ربط المنصات",
          description: "تكامل مع منصات التوصيل المختلفة لاستقبال الطلبات وتحديث الحالات آلياً.",
          icon: Truck,
        },
        {
          title: "تقارير الأداء",
          description: "تقارير يومية وأسبوعية لأداء التوصيل مع تحليل نقاط الضعف والقوة.",
          icon: BarChart3,
        },
      ]}
      relatedLinks={[
        { label: "المناديب", path: "/services/couriers", icon: Users, color: "oklch(0.65 0.18 200)" },
        { label: "المركبات", path: "/services/vehicles", icon: Car, color: "oklch(0.65 0.15 50)" },
        { label: "المالية", path: "/services/finance", icon: DollarSign, color: "oklch(0.70 0.15 130)" },
        { label: "الشكاوى", path: "/services/complaints", icon: MessageSquare, color: "oklch(0.65 0.15 300)" },
        { label: "Excel", path: "/services/excel", icon: FileSpreadsheet, color: "oklch(0.60 0.15 160)" },
        { label: "لوحة التحكم", path: "/services/dashboard", icon: BarChart3, color: "oklch(0.65 0.18 200)" },
      ]}
    />
  );
}
