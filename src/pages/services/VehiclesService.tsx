/**
 * صفحة خدمة إدارة المركبات والأسطول
 */
import {
  Car, Wrench, Shield, Fuel, MapPin, BarChart3,
  Users, ClipboardList, DollarSign, MessageSquare, FileSpreadsheet, Clock
} from "lucide-react";
import ServicePageLayout from "./ServicePageLayout";

export default function VehiclesService() {
  return (
    <ServicePageLayout
      title="إدارة الأسطول والمركبات"
      subtitle="تشغيل وصيانة المركبات"
      description="تشغيل مركبات ضمن نموذج مرن (تأجير/تشغيل) مع ضبط التكاليف والجاهزية — ومتابعة يومية لحالة كل مركبة."
      icon={Car}
      adminPath="/admin/login"
      accentColor="oklch(0.65 0.15 50)"
      stats={[
        { label: "مركبة في الأسطول", value: "+340" },
        { label: "نسبة الجاهزية", value: "96%" },
        { label: "كم يومياً", value: "+45,000" },
        { label: "مدينة", value: "21" },
      ]}
      features={[
        {
          title: "سجل المركبات",
          description: "قاعدة بيانات شاملة لكل مركبة: النوع، الموديل، اللوحة، حالة التشغيل، والمندوب المسؤول.",
          icon: Car,
        },
        {
          title: "جدولة الصيانة",
          description: "تنبيهات صيانة دورية وتتبع حالة كل مركبة لضمان الجاهزية المستمرة.",
          icon: Wrench,
        },
        {
          title: "التأمين والتراخيص",
          description: "متابعة انتهاء التأمين والرخص والفحص الدوري مع تنبيهات مبكرة.",
          icon: Shield,
        },
        {
          title: "استهلاك الوقود",
          description: "مراقبة استهلاك الوقود لكل مركبة وتحليل الكفاءة التشغيلية.",
          icon: Fuel,
        },
        {
          title: "توزيع على المدن",
          description: "إدارة توزيع المركبات حسب احتياج كل مدينة مع مرونة النقل بين الفروع.",
          icon: MapPin,
        },
        {
          title: "تقارير التشغيل",
          description: "تقارير شاملة عن أداء الأسطول والتكاليف ومعدلات الاستخدام.",
          icon: BarChart3,
        },
      ]}
      relatedLinks={[
        { label: "المناديب", path: "/services/couriers", icon: Users, color: "oklch(0.65 0.18 200)" },
        { label: "الطلبات", path: "/services/orders", icon: ClipboardList, color: "oklch(0.70 0.15 150)" },
        { label: "المالية", path: "/services/finance", icon: DollarSign, color: "oklch(0.70 0.15 130)" },
        { label: "الشكاوى", path: "/services/complaints", icon: MessageSquare, color: "oklch(0.65 0.15 300)" },
        { label: "Excel", path: "/services/excel", icon: FileSpreadsheet, color: "oklch(0.60 0.15 160)" },
        { label: "لوحة التحكم", path: "/services/dashboard", icon: BarChart3, color: "oklch(0.65 0.18 200)" },
      ]}
    />
  );
}
