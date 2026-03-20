/**
 * صفحة خدمة الموظفين والأقسام
 */
import {
  Building2, UserCheck, Shield, Award, Calendar, BarChart3,
  Users, ClipboardList, Car, DollarSign, MessageSquare, FileSpreadsheet
} from "lucide-react";
import ServicePageLayout from "./ServicePageLayout";

export default function StaffService() {
  return (
    <ServicePageLayout
      title="الموظفين والأقسام"
      subtitle="الموارد البشرية الإدارية"
      description="إدارة الهيكل التنظيمي والموظفين والأقسام — مع نظام صلاحيات متدرج وتقييم أداء."
      icon={Building2}
      adminPath="/admin/login"
      accentColor="oklch(0.60 0.14 270)"
      stats={[
        { label: "موظف إداري", value: "+45" },
        { label: "قسم", value: "12" },
        { label: "مستوى صلاحية", value: "4" },
        { label: "نسبة الرضا", value: "91%" },
      ]}
      features={[
        {
          title: "إدارة الموظفين",
          description: "ملفات كاملة لكل موظف تشمل البيانات الشخصية والوظيفية والأداء.",
          icon: UserCheck,
        },
        {
          title: "الهيكل التنظيمي",
          description: "12 قسم إداري بمسؤوليات واضحة: عمليات، مالية، موارد بشرية، تقنية، وغيرها.",
          icon: Building2,
        },
        {
          title: "نظام الصلاحيات",
          description: "صلاحيات مفصّلة: مالك، مدير نظام، موظف — كل دور بصلاحيات محددة.",
          icon: Shield,
        },
        {
          title: "تقييم الأداء",
          description: "نظام تقييم دوري للموظفين مع مؤشرات أداء واضحة وخطط تطوير.",
          icon: Award,
        },
        {
          title: "الحضور والمناوبات",
          description: "تتبع الحضور وإدارة المناوبات والإجازات بشكل إلكتروني كامل.",
          icon: Calendar,
        },
        {
          title: "تقارير الموارد البشرية",
          description: "تقارير شاملة عن القوى العاملة والأداء ومعدلات الدوران.",
          icon: BarChart3,
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
