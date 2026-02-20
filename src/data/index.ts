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
    value: "16",
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
  {
    label: "متوسط الطلبات اليومية",
    value: "25,000",
    suffix: "طلب",
    description: "متوسط الحجم التشغيلي اليومي عبر شبكتنا اللوجستية.",
    icon: "TrendingUp",
  },
  {
    label: "الحصة السوقية المستهدفة",
    value: "6",
    suffix: "%",
    description: "هدف الحصة السوقية في ذروة الأداء بحلول 2025.",
    icon: "Target",
  },
  {
    label: "مستوى الخدمة",
    value: "TIER-1",
    suffix: "3PL",
    description: "مشغل خدمات لوجستية من الطرف الثالث من الفئة الأولى.",
    icon: "Award",
  },
];

/**
 * قائمة المنصات الشريكة التي يتم تشغيلها
 */
export const PLATFORMS: PlatformData[] = [
  { id: "p1", name: "هنقرستيشن", category: "توصيل طعام", logo: "https://firstlinelog.skywork.website/images/%D8%AE%D8%AF%D9%85%D8%A9-%D8%A7%D9%84%D8%B9%D9%85%D9%84%D8%A7%D8%A1-%D9%87%D9%86%D9%82%D8%B1%D8%B3%D8%AA%D9%8A%D8%B4%D9%86.jpg" },
  { id: "p2", name: "جاهز", category: "توصيل طعام", logo: "https://firstlinelog.skywork.website/images/images_5326.png" },
  { id: "p3", name: "مرسول", category: "توصيل كل شيء", logo: "https://firstlinelog.skywork.website/images/%D8%B4%D8%B1%D9%83%D8%A7%D8%AA-%D8%AA%D9%88%D8%B5%D9%8A%D9%84-%D8%B7%D9%84%D8%A8%D8%A7%D8%AA-%D8%A7%D9%84%D9%85%D8%B7%D8%A7%D8%B9%D9%85-%D9%81%D9%8A-%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8A%D8%A9-1722690188-0.webp" },
  { id: "p4", name: "ذا شيفز", category: "توصيل طعام", logo: "https://firstlinelog.skywork.website/images/%D8%A3%D8%B4%D9%87%D8%B1-10-%D8%AA%D8%B7%D8%A8%D9%8A%D9%82%D8%A7%D8%AA-%D8%AA%D9%88%D8%B5%D9%8A%D9%84-%D8%A7%D9%84%D8%B7%D8%B9%D8%A7%D9%85-%D9%81%D9%8A-%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8A%D8%A9-2025-%D8%AA%D8%B7%D8%A8%D9%8A%D9%82-The-chefz.jpg" },
  { id: "p5", name: "نينجا", category: "توصيل سريع", logo: "https://firstlinelog.skywork.website/images/Gux53J6XkAAKnf4.png" },
  { id: "p6", name: "تويو", category: "خدمات لوجستية", logo: "https://firstlinelog.skywork.website/images/images%20(1).png" },
  { id: "p7", name: "كيتا", category: "توصيل طعام", logo: "https://firstlinelog.skywork.website/images/images.jpg" },
  { id: "p8", name: "أمازون", category: "تجارة إلكترونية", logo: "https://firstlinelog.skywork.website/images/517hY12cdLL.jpg", coming_soon: true },
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