import { MetricData, PlatformData, CityData } from "@/lib/index";

/**
 * واجهة بيانات الخدمات المعروضة في الموقع
 */
export interface ServiceData {
  title: string;
  description: string;
  iconName: string;
}

/**
 * واجهة بيانات المزايا التنافسية
 */
export interface BenefitData {
  title: string;
  description: string;
}

/**
/**
 * مقاييس الأداء الرئيسية لشركة فيرست لاين لوجستيكس (أرقام واضحة بدون مبالغة)
 */
export const METRICS: MetricData[] = [
  {
    label: "الطلبات السنوية",
    value: "6.4",
    suffix: "مليون طلب+",
    description: "حجم الطلبات المعالجة سنوياً عبر شبكتنا التشغيلية.",
    icon: "PackageCheck",
  },
  {
    label: "المدن التشغيلية",
    value: "18",
    suffix: "مدينة",
    description: "نطاق التغطية الجغرافية عبر المملكة العربية السعودية.",
    icon: "MapPin",
  },
  {
    label: "المنصات الشريكة",
    value: "7",
    suffix: "منصات+",
    description: "شراكات تشغيلية متعددة المنصات لضمان الاستقرار.",
    icon: "Layers",
  },
  {
    label: "الطلبات اليومية في الذروة",
    value: "35,000",
    suffix: "طلب",
    description: "القدرة التشغيلية القصوى خلال أوقات الذروة والمواسم.",
    icon: "Zap",
  },
];

/**
 * قائمة المنصات الشريكة التي يتم تشغيلها
 */
export const PLATFORMS: PlatformData[] = [
  { id: "p1", name: "هنقرستيشن", category: "توصيل طعام" },
  { id: "p2", name: "جاهز", category: "توصيل طعام" },
  { id: "p3", name: "مرسول", category: "توصيل كل شيء" },
  { id: "p4", name: "تويو", category: "خدمات لوجستية" },
  { id: "p5", name: "نون", category: "تجارة إلكترونية" },
  { id: "p6", name: "نينجا", category: "توصيل سريع" },
  { id: "p7", name: "كريم", category: "نقل ذكي" },
];

/**
 * المدن التي تعمل بها الشركة حالياً
 */
export const CITIES: CityData[] = [
  { name: "الرياض", region: "الوسطى" },
  { name: "جدة", region: "الغربية" },
  { name: "مكة المكرمة", region: "الغربية" },
  { name: "المدينة المنورة", region: "الغربية" },
  { name: "الدمام", region: "الشرقية" },
  { name: "الخبر", region: "الشرقية" },
  { name: "القصيم", region: "الوسطى" },
  { name: "أبها", region: "الجنوبية" },
  { name: "تبوك", region: "الشمالية" },
  { name: "حائل", region: "الشمالية" },
  { name: "جيزان", region: "الجنوبية" },
  { name: "نجران", region: "الجنوبية" },
  { name: "الجبيل", region: "الشرقية" },
  { name: "الهفوف", region: "الشرقية" },
  { name: "الخرج", region: "الوسطى" },
  { name: "ينبع", region: "الغربية" },
];

/**
 * الخدمات اللوجستية الرئيسية
 */
export const SERVICES: ServiceData[] = [
  {
    title: "توصيل الميل الأخير (3PL)",
    description: "حلول تنفيذ شاملة لمنصات التوصيل تضمن السرعة والدقة والاحترافية في الوصول للمستهلك.",
    iconName: "Truck",
  },
  {
    title: "إدارة الأساطيل والسائقين",
    description: "إدارة متكاملة لآلاف السائقين وأساطيل المركبات لضمان استمرارية التشغيل على مدار الساعة.",
    iconName: "Users",
  },
  {
    title: "الجودة والامتثال (SLA)",
    description: "الالتزام الصارم باتفاقيات مستوى الخدمة والمعايير التنظيمية لضمان تجربة مستخدم مثالية.",
    iconName: "ShieldCheck",
  },
  {
    title: "إدارة الذروة والمواسم",
    description: "مرونة تشغيلية عالية وقدرة على التوسع السريع لتغطية الطلب المرتفع خلال المواسم والأعياد.",
    iconName: "Zap",
  },
  {
    title: "دعم التوسع الجغرافي",
    description: "تسهيل دخول المنصات لمدن جديدة عبر بنية تحتية تشغيلية جاهزة وفريق عمل خبير.",
    iconName: "Globe",
  },
];

/**
 * لماذا تختار فيرست لاين لوجستيكس؟
 */
export const WHY_FIRST_LINE: BenefitData[] = [
  {
    title: "التحكم في التنفيذ",
    description: "نحن لا نوسط الطلب - نحن ننفذه. السائقون والأساطيل والمناطق وإدارة الذروة وإنفاذ SLA.",
  },
  {
    title: "استقرار متعدد المنصات",
    description: "العمليات المتزامنة عبر المنصات المتنافسة تقلل مخاطر الاعتماد وتحسن الاستقرار على مستوى المدينة.",
  },
  {
    title: "قدرة جاهزة للذروة",
    description: "مصممة لامتصاص ذروات الطلب دون تدهور في SLA.",
  },
  {
    title: "عمليات بمستوى الحوكمة",
    description: "تقارير وضوابط وانضباط مناسب للشراكات المؤسسية.",
  },
];