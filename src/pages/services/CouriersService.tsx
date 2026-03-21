/**
 * صفحة خدمة إدارة المناديب والسائقين
 */
import {
  Users, UserCheck, UserPlus, Star, Clock, MapPin,
  ClipboardList, Car, DollarSign, MessageSquare, FileSpreadsheet, BarChart3
} from "lucide-react";
import ServicePageLayout from "./ServicePageLayout";

export default function CouriersService() {
  return (
    <ServicePageLayout
      title="إدارة المناديب والسائقين"
      subtitle="قسم الموارد البشرية التشغيلية"
      description="استقطاب، تدريب، جدولة، وتحفيز السائقين وفق مؤشرات أداء واضحة — مع نظام تسجيل ذاتي وموافقة إدارية."
      icon={Users}
      adminPath="/admin/login"
      accentColor="oklch(0.65 0.18 200)"
      stats={[
        { label: "مندوب مسجل", value: "+850" },
        { label: "مندوب نشط", value: "+620" },
        { label: "مدينة مغطاة", value: "21" },
        { label: "نسبة الالتزام", value: "94%" },
      ]}
      features={[
        {
          title: "تسجيل ذاتي للمناديب",
          description: "المندوب يسجل بياناته (اسم، جوال، هوية، مدينة) ويُنشأ حسابه تلقائياً بانتظار الموافقة.",
          icon: UserPlus,
        },
        {
          title: "الموافقة والتفعيل",
          description: "الإدارة تراجع طلبات التسجيل وتوافق أو ترفض مع إشعار فوري للمندوب.",
          icon: UserCheck,
        },
        {
          title: "بوابة المندوب",
          description: "لوحة شخصية للمندوب يرى فيها بياناته وطلباته وحالة حسابه ومستحقاته.",
          icon: Star,
        },
        {
          title: "تتبع الأداء",
          description: "مؤشرات أداء لكل مندوب: نسبة التسليم، الالتزام بالمواعيد، تقييم العملاء.",
          icon: BarChart3,
        },
        {
          title: "جدولة المناوبات",
          description: "نظام مناوبات ذكي يوزع العمل حسب المدينة والأوقات المطلوبة.",
          icon: Clock,
        },
        {
          title: "تغطية المدن",
          description: "إدارة توزيع المناديب على 21 مدينة سعودية مع مراعاة الكثافة والطلب.",
          icon: MapPin,
        },
      ]}
      relatedLinks={[
        { label: "الطلبات", path: "/services/orders", icon: ClipboardList, color: "oklch(0.70 0.15 150)" },
        { label: "المركبات", path: "/services/vehicles", icon: Car, color: "oklch(0.65 0.15 50)" },
        { label: "المالية", path: "/services/finance", icon: DollarSign, color: "oklch(0.70 0.15 130)" },
        { label: "الشكاوى", path: "/services/complaints", icon: MessageSquare, color: "oklch(0.65 0.15 300)" },
        { label: "Excel", path: "/services/excel", icon: FileSpreadsheet, color: "oklch(0.60 0.15 160)" },
        { label: "لوحة التحكم", path: "/services/dashboard", icon: BarChart3, color: "oklch(0.65 0.18 200)" },
      ]}
    />
  );
}
