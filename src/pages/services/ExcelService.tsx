/**
 * صفحة خدمة استيراد وتصدير البيانات
 */
import {
  FileSpreadsheet, Upload, Download, Database, RefreshCw, BarChart3,
  Users, ClipboardList, Car, DollarSign, MessageSquare, Shield
} from "lucide-react";
import ServicePageLayout from "./ServicePageLayout";

export default function ExcelService() {
  return (
    <ServicePageLayout
      title="استيراد وتصدير البيانات"
      subtitle="إدارة البيانات والتقارير"
      description="أدوات متقدمة لاستيراد البيانات من ملفات Excel وتصديرها — مع معالجة ذكية وتحقق من البيانات."
      icon={FileSpreadsheet}
      adminPath="/admin/login"
      accentColor="oklch(0.60 0.15 160)"
      stats={[
        { label: "ملف مستورد شهرياً", value: "+150" },
        { label: "سجل معالج", value: "+50K" },
        { label: "دقة المعالجة", value: "99.5%" },
        { label: "نوع تقرير", value: "8" },
      ]}
      features={[
        {
          title: "استيراد Excel",
          description: "رفع ملفات Excel مع معالجة تلقائية وتحقق من صحة البيانات قبل الإدخال.",
          icon: Upload,
        },
        {
          title: "تصدير التقارير",
          description: "تصدير أي بيانات من النظام بصيغة Excel أو PDF مع تنسيق احترافي.",
          icon: Download,
        },
        {
          title: "مزامنة البيانات",
          description: "مزامنة تلقائية مع منصات التوصيل لتحديث البيانات دون تدخل يدوي.",
          icon: RefreshCw,
        },
        {
          title: "قاعدة بيانات مركزية",
          description: "كل البيانات في قاعدة مركزية واحدة مع نسخ احتياطي تلقائي.",
          icon: Database,
        },
        {
          title: "تقارير مخصصة",
          description: "إنشاء تقارير مخصصة حسب الحاجة مع فلاتر وتصنيفات متعددة.",
          icon: BarChart3,
        },
        {
          title: "تدقيق البيانات",
          description: "نظام تدقيق تلقائي يكتشف الأخطاء والتكرارات والبيانات الناقصة.",
          icon: Shield,
        },
      ]}
      relatedLinks={[
        { label: "المناديب", path: "/services/couriers", icon: Users, color: "oklch(0.65 0.18 200)" },
        { label: "الطلبات", path: "/services/orders", icon: ClipboardList, color: "oklch(0.70 0.15 150)" },
        { label: "المركبات", path: "/services/vehicles", icon: Car, color: "oklch(0.65 0.15 50)" },
        { label: "المالية", path: "/services/finance", icon: DollarSign, color: "oklch(0.70 0.15 130)" },
        { label: "الشكاوى", path: "/services/complaints", icon: MessageSquare, color: "oklch(0.65 0.15 300)" },
        { label: "لوحة التحكم", path: "/services/dashboard", icon: BarChart3, color: "oklch(0.65 0.18 200)" },
      ]}
    />
  );
}
