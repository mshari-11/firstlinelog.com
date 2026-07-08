/**
 * دليل الإرشادات والتعليمات — Help Guide
 * شرح كامل لكل قسم وأيقونة في لوحة التحكم
 */
import { useState } from "react";
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  BookOpen,
  LayoutDashboard,
  Users,
  ClipboardList,
  MessageSquare,
  Map,
  Package,
  Target,
  Plug,
  Wallet,
  TrendingUp,
  Receipt,
  ArrowRightLeft,
  Landmark,
  GitCompare,
  BarChart3,
  FileSpreadsheet,
  CreditCard,
  Car,
  Building2,
  Truck,
  Link2,
  Clock,
  CheckCircle2,
  ListTodo,
  Bell,
  ScrollText,
  Mail,
  ShieldAlert,
  UserCheck,
  Settings2,
  Shield,
  GraduationCap,
  Calculator,
  FileCheck,
} from "lucide-react";

interface GuideSection {
  id: string;
  group: string;
  icon: React.ElementType;
  title: string;
  description: string;
  features: string[];
  tips: string[];
}

const GUIDE_DATA: GuideSection[] = [
  // ── التشغيل ──
  {
    id: "dashboard",
    group: "التشغيل",
    icon: LayoutDashboard,
    title: "الرئيسية (لوحة التحكم)",
    description:
      "نظرة عامة على جميع العمليات — إحصائيات مباشرة، أوامر سريعة، آخر الطلبات، وتوزيع المدن.",
    features: [
      "مؤشرات KPI (طلبات، سائقين، إيرادات، وقت التسليم)",
      "أوامر سريعة لكل الأقسام",
      "جدول آخر الطلبات المباشرة",
      "توزيع الطلبات حسب المدينة",
    ],
    tips: [
      "اضغط على أي مؤشر للانتقال مباشرة للقسم",
      "الأوامر السريعة تختصر عليك الخطوات",
    ],
  },
  {
    id: "couriers",
    group: "التشغيل",
    icon: Users,
    title: "المناديب",
    description:
      "إدارة جميع المناديب — عرض البيانات، تغيير الحالة، مراجعة طلبات التسجيل الجديدة.",
    features: [
      "بحث بالاسم أو الجوال",
      "فلترة بالحالة (نشط/متوقف/في توصيل)",
      "إضافة مندوب جديد",
      "مراجعة واعتماد/رفض طلبات التسجيل",
      "تعديل بيانات المندوب",
      "تعليق أو إيقاف مندوب",
    ],
    tips: [
      "تبويب 'الطلبات' يعرض طلبات التسجيل الجديدة",
      "اضغط على اسم المندوب لعرض التفاصيل الكاملة",
    ],
  },
  {
    id: "orders",
    group: "التشغيل",
    icon: ClipboardList,
    title: "الطلبات",
    description:
      "إدارة جميع الطلبات — تتبع الحالة، البحث، التصدير، إضافة طلبات يدوية.",
    features: [
      "بحث بالرقم، المنصة، السائق، المدينة",
      "فلترة بالحالة (انتظار/في الطريق/مسلّم/ملغي)",
      "إضافة طلب يدوي",
      "تعديل بيانات الطلب",
      "إلغاء طلب مع تأكيد",
      "تصدير إلى Excel/CSV/PDF",
    ],
    tips: [
      "استخدم التصدير لإنشاء تقارير دورية",
      "الفلاتر تتراكم — يمكنك الجمع بين البحث والحالة والمدينة",
    ],
  },
  {
    id: "complaints",
    group: "التشغيل",
    icon: MessageSquare,
    title: "الشكاوى",
    description: "نظام إدارة الشكاوى — استقبال، تصنيف، تعيين، حل، وتصعيد.",
    features: [
      "تسجيل شكوى جديدة",
      "تعيين لموظف مختص",
      "تصنيف حسب النوع والأولوية",
      "حل الشكوى أو تصعيدها",
      "إرسال رسائل للعميل",
      "تعديل بيانات الشكوى",
      "تصدير وطباعة",
    ],
    tips: [
      "الشكاوى ذات الأولوية العالية تظهر أولاً",
      "اضغط على الشكوى لفتح لوحة التفاصيل الجانبية",
    ],
  },
  {
    id: "dispatch",
    group: "التشغيل",
    icon: Map,
    title: "الخريطة والإرسال",
    description:
      "خريطة تفاعلية لتتبع المناديب والطلبات — تعيين الطلبات للسائقين مباشرة.",
    features: [
      "خريطة حية للمناديب المتصلين",
      "عرض الطلبات المعلقة على الخريطة",
      "إنشاء مهمة إرسال جديدة",
      "تعيين طلب لسائق بالنقر",
      "تحديث حالة الطلب",
      "تحديث تلقائي كل 30 ثانية",
    ],
    tips: [
      "اضغط على دبوس السائق لعرض معلوماته",
      "يمكنك إخفاء/إظهار طبقات السائقين والطلبات",
    ],
  },
  {
    id: "shipments",
    group: "التشغيل",
    icon: Package,
    title: "الشحنات",
    description: "تتبع جميع الشحنات — رقم التتبع، الحالة، السائق المسؤول.",
    features: [
      "بحث برقم التتبع أو العميل",
      "فلترة بالحالة",
      "إضافة شحنة جديدة",
      "تصدير وطباعة",
    ],
    tips: ["اضغط على بطاقات KPI للفلترة السريعة بالحالة"],
  },
  {
    id: "sla",
    group: "التشغيل",
    icon: Target,
    title: "مراقبة SLA",
    description:
      "مراقبة اتفاقيات مستوى الخدمة — المقاييس، المخالفات، الالتزام.",
    features: [
      "عرض مقاييس الأداء",
      "جدول المخالفات",
      "إضافة مقياس جديد",
      "تعديل حدود المقاييس",
      "تصدير وطباعة",
    ],
    tips: [
      "المقاييس الحمراء تحتاج تدخل فوري",
      "راجع المخالفات يومياً لتحسين الأداء",
    ],
  },
  {
    id: "marketplace",
    group: "التشغيل",
    icon: Plug,
    title: "تكاملات المنصات",
    description: "ربط وإدارة منصات التوصيل — جاهز، هنقرستيشن، نون، سلة، زد.",
    features: [
      "إضافة منصة جديدة (Webhook + API Key)",
      "تفعيل/إيقاف المنصة",
      "مزامنة يدوية",
      "سجل المزامنة",
      "تصدير وطباعة",
    ],
    tips: ["تأكد من صحة Webhook URL قبل التفعيل", "راقب سجل المزامنة للأخطاء"],
  },

  // ── المالية والموارد ──
  {
    id: "finance-dashboard",
    group: "المالية والموارد",
    icon: LayoutDashboard,
    title: "لوحة المالية",
    description:
      "نظرة شاملة على الوضع المالي — إيرادات، مصروفات، تدفقات نقدية.",
    features: [
      "مؤشرات مالية رئيسية",
      "رسوم بيانية للإيرادات والمصروفات",
      "إنشاء دفعة جديدة",
      "تحميل التقارير",
      "تحليل AI المالي",
    ],
    tips: [
      "استخدم الأوامر السريعة للوصول المباشر",
      "راجع الرسوم البيانية أسبوعياً",
    ],
  },
  {
    id: "revenue",
    group: "المالية والموارد",
    icon: TrendingUp,
    title: "الإيرادات",
    description: "تتبع الإيرادات من جميع المنصات والمصادر.",
    features: [
      "إضافة إيراد يدوي",
      "عرض حسب المنصة",
      "تصدير وطباعة",
      "تحديث البيانات",
    ],
    tips: ["قارن الإيرادات بين المنصات لتحديد الأفضل أداءً"],
  },
  {
    id: "expenses",
    group: "المالية والموارد",
    icon: Receipt,
    title: "المصروفات",
    description: "إدارة المصروفات — إضافة، تصنيف، متابعة الميزانية.",
    features: [
      "إضافة مصروف جديد",
      "تصنيف تلقائي",
      "مقارنة مع الميزانية",
      "تصدير",
    ],
    tips: ["أضف المصروفات يومياً لتقارير أدق"],
  },
  {
    id: "cashflow",
    group: "المالية والموارد",
    icon: ArrowRightLeft,
    title: "التدفقات النقدية",
    description: "متابعة التدفق النقدي — الوارد والصادر والصافي.",
    features: [
      "إضافة معاملة (وارد/صادر)",
      "عرض أسبوعي",
      "توقعات التدفق النقدي",
      "تصدير وطباعة",
    ],
    tips: ["راقب صافي التدفق لتجنب العجز النقدي"],
  },
  {
    id: "finance",
    group: "المالية والموارد",
    icon: Wallet,
    title: "الرواتب والمالية",
    description:
      "إدارة مستحقات المناديب — الإجمالي، الخصومات، الصافي، حالة الدفع.",
    features: [
      "عرض سجل الرواتب لكل مندوب",
      "اعتماد/رفض الدفعات",
      "إضافة سجل جديد",
      "تفاصيل الخصومات",
      "تصدير",
    ],
    tips: [
      "راجع الخصومات قبل الاعتماد",
      "استخدم حاسبة الرواتب للحسابات المعقدة",
    ],
  },
  {
    id: "wallet",
    group: "المالية والموارد",
    icon: Landmark,
    title: "محافظ السائقين",
    description: "إدارة محافظ السائقين — الأرصدة، المعاملات، إنشاء دفعات.",
    features: [
      "عرض أرصدة المحافظ",
      "سجل المعاملات",
      "إنشاء دفعة جديدة",
      "تحميل كشف الحساب",
    ],
    tips: ["تأكد من تطابق الأرصدة مع السجلات"],
  },
  {
    id: "invoices",
    group: "المالية والموارد",
    icon: FileCheck,
    title: "الفواتير",
    description: "إنشاء وإدارة الفواتير — إصدار، متابعة، تحصيل.",
    features: [
      "إنشاء فاتورة جديدة",
      "تحديث حالة الدفع",
      "فلترة بالحالة",
      "تصدير وطباعة",
    ],
    tips: ["تابع الفواتير المتأخرة أسبوعياً"],
  },
  {
    id: "payouts",
    group: "المالية والموارد",
    icon: CreditCard,
    title: "إدارة الدفعات",
    description: "إنشاء واعتماد دفعات الرواتب — المراحل الخمسة.",
    features: [
      "إنشاء دفعة جديدة",
      "اعتماد الدفعة",
      "فلترة بالحالة",
      "تصدير وطباعة",
    ],
    tips: ["الدفعة تمر بـ 5 مراحل اعتماد قبل التنفيذ"],
  },
  {
    id: "payroll-calculator",
    group: "المالية والموارد",
    icon: Calculator,
    title: "حاسبة الرواتب",
    description:
      "حساب مستحقات كل مندوب — الإضافات والخصومات والصافي + تصدير STC Bank.",
    features: [
      "إضافة مندوب مع كامل بياناته المالية",
      "حساب تلقائي: إجمالي = طلبات × سعر",
      "إضافات: وقود، تشغيل، مكافآت",
      "خصومات: عمولة FLL، تأمين، صيانة، جزاءات، ضريبة",
      "خصم تلقائي لتكلفة مركبة الشركة",
      "تصدير STC Bank Excel (3 أعمدة)",
      "تصدير CSV للرواتب",
    ],
    tips: [
      "فعّل 'مركبة من الشركة' لخصم التكلفة تلقائياً",
      "تأكد من صحة رقم الجوال (يبدأ بـ 5 + 8 أرقام)",
      "ملف STC Bank يحتوي: المرجع + الجوال 966+ + المبلغ",
    ],
  },
  {
    id: "reconciliation",
    group: "المالية والموارد",
    icon: GitCompare,
    title: "المطابقة المالية",
    description: "مطابقة الحسابات مع المنصات — رفع ملفات ومقارنة.",
    features: [
      "رفع ملفات المنصات",
      "تشغيل المطابقة التلقائية",
      "إضافة سجل يدوي",
      "عرض الفروقات",
      "تصدير النتائج",
    ],
    tips: ["قم بالمطابقة أسبوعياً لاكتشاف الفروقات مبكراً"],
  },
  {
    id: "excel",
    group: "المالية والموارد",
    icon: FileSpreadsheet,
    title: "استيراد Excel",
    description: "استيراد بيانات من ملفات Excel — طلبات، سائقين، مالية.",
    features: [
      "رفع ملف Excel",
      "معاينة البيانات",
      "تأكيد الاستيراد",
      "سجل الاستيراد",
    ],
    tips: ["تأكد من تطابق الأعمدة مع القالب المطلوب"],
  },
  {
    id: "reports",
    group: "المالية والموارد",
    icon: BarChart3,
    title: "التقارير",
    description: "تقارير تحليلية شاملة — أداء، مالية، تشغيل.",
    features: [
      "فلترة بالفترة (أسبوع/شهر/ربع)",
      "رسوم بيانية تفاعلية",
      "تصدير وطباعة",
    ],
    tips: ["قارن الفترات لاكتشاف الاتجاهات"],
  },

  // ── الأصول والموظفون ──
  {
    id: "vehicles",
    group: "الأصول والموظفون",
    icon: Car,
    title: "المركبات",
    description: "إدارة المركبات — إضافة، تعديل الحالة، متابعة الصيانة.",
    features: [
      "إضافة مركبة جديدة",
      "فلترة بالحالة (نشط/صيانة/متوقف)",
      "عرض سجل الصيانة",
      "تصدير وطباعة",
    ],
    tips: ["تابع جدول الصيانة لتجنب الأعطال"],
  },
  {
    id: "staff",
    group: "الأصول والموظفون",
    icon: Building2,
    title: "الأقسام والموظفين",
    description: "إدارة الهيكل التنظيمي — أقسام، موظفين، صلاحيات.",
    features: [
      "إضافة قسم/موظف",
      "إدارة الصلاحيات لكل موظف",
      "منح/سحب كل الصلاحيات",
      "تفعيل/إيقاف الموظف",
      "تصدير وطباعة",
    ],
    tips: ["امنح الصلاحيات بحذر — كل صلاحية تفتح وصول لقسم معين"],
  },
  {
    id: "fleet",
    group: "الأصول والموظفون",
    icon: Truck,
    title: "إدارة الأسطول",
    description: "إدارة الأسطول — المركبات، الحالة، الموقع.",
    features: [
      "إضافة مركبة للأسطول",
      "طلب صيانة",
      "تعيين سائق",
      "تصدير وطباعة",
    ],
    tips: ["تابع حالة المركبات يومياً"],
  },
  {
    id: "fleet-assignments",
    group: "الأصول والموظفون",
    icon: Link2,
    title: "تعيينات المركبات",
    description: "ربط المركبات بالسائقين — تعيين وإلغاء التعيين.",
    features: [
      "تعيين مركبة لسائق",
      "إلغاء التعيين",
      "تعيين جماعي",
      "تصدير وطباعة",
    ],
    tips: ["تأكد من عدم تعيين مركبة لأكثر من سائق"],
  },
  {
    id: "attendance",
    group: "الأصول والموظفون",
    icon: Clock,
    title: "الحضور والانصراف",
    description: "متابعة حضور وانصراف الموظفين.",
    features: [
      "تسجيل حضور/انصراف يدوي",
      "فلترة بالحالة",
      "عرض حسب القسم",
      "تصدير وطباعة",
    ],
    tips: ["استخدم التسجيل اليدوي للحالات الاستثنائية فقط"],
  },

  // ── النظام ──
  {
    id: "approvals",
    group: "النظام",
    icon: CheckCircle2,
    title: "الاعتمادات",
    description: "نظام الاعتمادات — مراجعة واعتماد أو رفض الطلبات.",
    features: ["طلب اعتماد جديد", "اعتماد/رفض", "اعتماد جماعي", "تصدير وطباعة"],
    tips: ["راجع الطلبات المعلقة يومياً"],
  },
  {
    id: "tasks",
    group: "النظام",
    icon: ListTodo,
    title: "المهام",
    description: "إدارة المهام — إنشاء، تعيين، متابعة الإنجاز.",
    features: [
      "إنشاء مهمة جديدة",
      "إكمال الكل",
      "فلترة بالحالة",
      "تصدير وطباعة",
    ],
    tips: ["حدد أولوية وتاريخ استحقاق لكل مهمة"],
  },
  {
    id: "notifications",
    group: "النظام",
    icon: Bell,
    title: "الإشعارات",
    description: "مركز الإشعارات — شكاوى، طلبات، مالية، نظام.",
    features: [
      "إرسال إشعار",
      "قراءة الكل",
      "حذف المقروء",
      "فلترة بالنوع",
      "تصدير وطباعة",
    ],
    tips: ["تابع إشعارات الشكاوى والمالية بالأولوية"],
  },
  {
    id: "audit-log",
    group: "النظام",
    icon: ScrollText,
    title: "سجل التدقيق",
    description: "سجل كل العمليات — من فعل ماذا ومتى (غير قابل للتعديل).",
    features: [
      "بحث بالمستخدم أو المورد",
      "فلتر بنوع العملية",
      "فلتر بالتاريخ (اليوم/أسبوع/شهر)",
      "تصدير وطباعة",
    ],
    tips: [
      "استخدم سجل التدقيق للتحقيق في المشكلات",
      "السجل لا يمكن تعديله أو حذفه",
    ],
  },
  {
    id: "email-logs",
    group: "النظام",
    icon: Mail,
    title: "سجل الإيميلات",
    description: "سجل جميع الإيميلات المُرسلة — OTP، إشعارات، تأكيدات.",
    features: [
      "بحث بالمستلم أو الموضوع",
      "فلترة بالنوع",
      "إعادة إرسال الإيميل الفاشل",
      "تصدير وطباعة",
    ],
    tips: ["تابع الإيميلات الفاشلة وأعد إرسالها"],
  },
  {
    id: "risk",
    group: "النظام",
    icon: ShieldAlert,
    title: "إدارة المخاطر",
    description: "قواعد كشف المخاطر — احتيال، تجاوز حدود، نشاط مشبوه.",
    features: [
      "إضافة قاعدة جديدة",
      "تفعيل/تعطيل القاعدة",
      "عرض سجل التنبيهات",
      "تصدير وطباعة",
    ],
    tips: ["فعّل القواعد الأساسية على الأقل (احتيال + تجاوز حدود)"],
  },
  {
    id: "settings",
    group: "النظام",
    icon: Settings2,
    title: "الإعدادات",
    description: "إعدادات النظام الشاملة — عام، أمان، إشعارات، متقدم.",
    features: [
      "5 تبويبات: عام، الأمان، الإشعارات، النظام، متقدم",
      "30+ إعداد قابل للتعديل",
      "تفعيل/تعطيل المصادقة الثنائية",
      "وضع الصيانة",
      "تفعيل المحادثة الذكية",
      "روابط سريعة: Vercel/AWS/Supabase",
    ],
    tips: ["غيّر مهلة الجلسة حسب احتياجات الأمان", "فعّل سجل التدقيق دائماً"],
  },

  // ── السائقون ──
  {
    id: "driver-applications",
    group: "السائقون",
    icon: UserCheck,
    title: "طلبات السائقين",
    description: "مراجعة طلبات تسجيل السائقين الجدد — 5 مراحل.",
    features: [
      "عرض تفاصيل الطلب",
      "اعتماد/رفض",
      "اعتماد جماعي",
      "تصدير وطباعة",
    ],
    tips: [
      "تحقق من الوثائق والصورة الشخصية قبل الاعتماد",
      "الاعتماد يُنشئ حساب Cognito تلقائياً",
    ],
  },
  {
    id: "kyc",
    group: "السائقون",
    icon: Shield,
    title: "وثائق KYC",
    description: "إدارة وثائق التحقق — هوية، رخصة، شهادة بنكية.",
    features: [
      "عرض الوثائق",
      "اعتماد/رفض",
      "اعتماد جماعي",
      "طلب إعادة رفع",
      "تصدير وطباعة",
    ],
    tips: ["تحقق من صلاحية الوثائق ووضوح الصور"],
  },
  {
    id: "driver-training",
    group: "السائقون",
    icon: GraduationCap,
    title: "تدريب السائقين",
    description: "إدارة برامج التدريب — إنشاء، متابعة، إكمال.",
    features: [
      "إضافة تدريب جديد",
      "تغيير الحالة",
      "إكمال جماعي",
      "تصدير وطباعة",
    ],
    tips: ["حدد تدريب إلزامي للسائقين الجدد"],
  },
];

const GROUPS = [...new Set(GUIDE_DATA.map((g) => g.group))];

export default function HelpGuide() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const filtered = GUIDE_DATA.filter((g) => {
    const matchSearch =
      !search ||
      g.title.includes(search) ||
      g.description.includes(search) ||
      g.features.some((f) => f.includes(search));
    const matchGroup = !activeGroup || g.group === activeGroup;
    return matchSearch && matchGroup;
  });

  return (
    <div
      dir="rtl"
      style={{
        padding: "1.5rem",
        fontFamily: "var(--con-font-arabic)",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: "rgba(59,130,246,0.1)",
            border: "1px solid rgba(59,130,246,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem",
          }}
        >
          <BookOpen size={28} style={{ color: "var(--con-accent)" }} />
        </div>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "var(--con-text-primary)",
            margin: "0 0 6px",
          }}
        >
          دليل لوحة التحكم
        </h1>
        <p style={{ fontSize: 13, color: "var(--con-text-muted)", margin: 0 }}>
          شرح كامل لكل قسم وأيقونة — للموظفين الجدد والمستخدمين
        </p>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "1rem" }}>
        <Search
          size={16}
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--con-text-muted)",
          }}
        />
        <input
          className="con-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث عن قسم أو ميزة..."
          style={{ width: "100%", paddingRight: 36 }}
        />
      </div>

      {/* Group filter */}
      <div
        style={{
          display: "flex",
          gap: "0.25rem",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setActiveGroup(null)}
          className="con-btn"
          style={{
            background: !activeGroup ? "var(--con-accent)" : "transparent",
            color: !activeGroup ? "#fff" : "var(--con-text-muted)",
            border: !activeGroup
              ? "none"
              : "1px solid var(--con-border-default)",
            fontSize: 11,
          }}
        >
          الكل ({GUIDE_DATA.length})
        </button>
        {GROUPS.map((g) => {
          const count = GUIDE_DATA.filter((d) => d.group === g).length;
          return (
            <button
              key={g}
              onClick={() => setActiveGroup(activeGroup === g ? null : g)}
              className="con-btn"
              style={{
                background:
                  activeGroup === g ? "var(--con-accent)" : "transparent",
                color: activeGroup === g ? "#fff" : "var(--con-text-muted)",
                border:
                  activeGroup === g
                    ? "none"
                    : "1px solid var(--con-border-default)",
                fontSize: 11,
              }}
            >
              {g} ({count})
            </button>
          );
        })}
      </div>

      {/* Guide Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {filtered.map((section) => {
          const Icon = section.icon;
          const isOpen = expandedId === section.id;
          return (
            <div
              key={section.id}
              className="con-card"
              style={{ overflow: "hidden", transition: "all 0.2s" }}
            >
              <button
                onClick={() => setExpandedId(isOpen ? null : section.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "1rem 1.25rem",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "right",
                  fontFamily: "inherit",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: isOpen
                      ? "rgba(59,130,246,0.12)"
                      : "var(--con-bg-elevated)",
                    border: `1px solid ${isOpen ? "rgba(59,130,246,0.3)" : "var(--con-border-default)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.2s",
                  }}
                >
                  <Icon
                    size={18}
                    style={{
                      color: isOpen
                        ? "var(--con-accent)"
                        : "var(--con-text-muted)",
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--con-text-primary)",
                    }}
                  >
                    {section.title}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--con-text-muted)",
                      marginTop: 2,
                    }}
                  >
                    {section.description.slice(0, 60)}...
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--con-text-muted)",
                    background: "var(--con-bg-elevated)",
                    padding: "2px 8px",
                    borderRadius: 4,
                    whiteSpace: "nowrap",
                  }}
                >
                  {section.group}
                </span>
                {isOpen ? (
                  <ChevronUp
                    size={16}
                    style={{ color: "var(--con-text-muted)", flexShrink: 0 }}
                  />
                ) : (
                  <ChevronDown
                    size={16}
                    style={{ color: "var(--con-text-muted)", flexShrink: 0 }}
                  />
                )}
              </button>

              {isOpen && (
                <div
                  style={{
                    padding: "0 1.25rem 1.25rem",
                    borderTop: "1px solid var(--con-border-subtle)",
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--con-text-secondary)",
                      lineHeight: 1.8,
                      margin: "1rem 0",
                    }}
                  >
                    {section.description}
                  </p>

                  <div style={{ marginBottom: "1rem" }}>
                    <h4
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--con-accent)",
                        marginBottom: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <CheckCircle2 size={13} /> المزايا والأوامر المتاحة
                    </h4>
                    <ul
                      style={{
                        margin: 0,
                        padding: "0 1.25rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      {section.features.map((f, i) => (
                        <li
                          key={i}
                          style={{
                            fontSize: 12,
                            color: "var(--con-text-secondary)",
                            lineHeight: 1.7,
                          }}
                        >
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div
                    style={{
                      background: "rgba(234,179,8,0.06)",
                      border: "1px solid rgba(234,179,8,0.2)",
                      borderRadius: 8,
                      padding: "0.75rem 1rem",
                    }}
                  >
                    <h4
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--con-warning)",
                        marginBottom: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <HelpCircle size={13} /> نصائح
                    </h4>
                    <ul
                      style={{
                        margin: 0,
                        padding: "0 1.25rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                      }}
                    >
                      {section.tips.map((t, i) => (
                        <li
                          key={i}
                          style={{
                            fontSize: 11,
                            color: "var(--con-text-muted)",
                            lineHeight: 1.7,
                          }}
                        >
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            color: "var(--con-text-muted)",
          }}
        >
          <Search size={40} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
          <p>لا توجد نتائج لـ "{search}"</p>
        </div>
      )}
    </div>
  );
}
