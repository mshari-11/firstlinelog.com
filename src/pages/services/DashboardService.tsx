/**
 * صفحة خدمة لوحة التحكم والإدارة
 */
import {
  BarChart3, LayoutDashboard, Building2, Bell, Settings, Shield,
  Users, ClipboardList, Car, DollarSign, MessageSquare, FileSpreadsheet
} from "lucide-react";
import ServicePageLayout from "./ServicePageLayout";

export default function DashboardService() {
  return (
    <ServicePageLayout
      title="لوحة التحكم والحوكمة"
      subtitle="الإدارة التشغيلية المركزية"
      description="لوحة تحكم مركزية تجمع كل البيانات والمؤشرات في مكان واحد — مع صلاحيات وأقسام وإشعارات ذكية."
      icon={LayoutDashboard}
      adminPath="/admin/login"
      accentColor="oklch(0.65 0.18 200)"
      stats={[
        { label: "مستخدم نشط", value: "+45" },
        { label: "قسم إداري", value: "12" },
        { label: "صلاحية", value: "18" },
        { label: "تقرير يومي", value: "+30" },
      ]}
      features={[
        {
          title: "لوحة بيانات لحظية",
          description: "رسوم بيانية ومؤشرات أداء محدّثة لحظياً لكل أقسام التشغيل.",
          icon: BarChart3,
        },
        {
          title: "إدارة الأقسام",
          description: "12 قسم إداري مع هيكل تنظيمي واضح وتوزيع مسؤوليات.",
          icon: Building2,
        },
        {
          title: "نظام الصلاحيات",
          description: "صلاحيات دقيقة لكل مستخدم حسب دوره: مالك، مدير، موظف، مندوب.",
          icon: Shield,
        },
        {
          title: "الإشعارات الذكية",
          description: "إشعارات فورية للأحداث المهمة: طلبات جديدة، شكاوى، موافقات.",
          icon: Bell,
        },
        {
          title: "إعدادات النظام",
          description: "تخصيص كامل لإعدادات النظام والمدن والمنصات والسياسات.",
          icon: Settings,
        },
        {
          title: "سجل العمليات",
          description: "سجل كامل لكل العمليات والتعديلات للمراجعة والتدقيق.",
          icon: LayoutDashboard,
        },
      ]}
      relatedLinks={[
        { label: "المناديب", path: "/services/couriers", icon: Users, color: "oklch(0.65 0.18 200)" },
        { label: "الطلبات", path: "/services/orders", icon: ClipboardList, color: "oklch(0.70 0.15 150)" },
        { label: "المركبات", path: "/services/vehicles", icon: Car, color: "oklch(0.65 0.15 50)" },
        { label: "المالية", path: "/services/finance", icon: DollarSign, color: "oklch(0.70 0.15 130)" },
        { label: "الشكاوى", path: "/services/complaints", icon: MessageSquare, color: "oklch(0.65 0.15 300)" },
        { label: "Excel", path: "/services/excel", icon: FileSpreadsheet, color: "oklch(0.60 0.15 160)" },
      ]}
    />
  );
}
