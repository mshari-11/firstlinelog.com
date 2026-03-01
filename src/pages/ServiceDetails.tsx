import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROUTE_PATHS } from "@/lib/index";
import {
  Truck, Package, Clock, Shield, MapPin, BarChart3,
  ArrowLeft, CheckCircle2, Zap, Users, HeadphonesIcon,
  Building2
} from "lucide-react";

const servicesData: Record<string, {
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  color: string;
  features: string[];
  benefits: { title: string; description: string; icon: any }[];
  stats: { label: string; value: string }[];
  useCases: string[];
}> = {
  "last-mile": {
    title: "توصيل الميل الأخير",
    subtitle: "توصيل سريع وموثوق من المستودع إلى باب العميل",
    description: "نقدم خدمة توصيل الميل الأخير بأعلى معايير الجودة والسرعة. فريقنا من السائقين المحترفين مجهز بأحدث التقنيات لضمان وصول الطلبات في الوقت المحدد وبحالة ممتازة. نغطي جميع المدن الرئيسية في المملكة العربية السعودية مع خيارات توصيل مرنة تناسب احتياجات عملائك.",
    icon: Truck,
    color: "from-primary to-primary/80",
    features: [
      "توصيل في نفس اليوم",
      "تتبع مباشر للشحنات",
      "إشعارات فورية للعملاء",
      "تأمين شامل على الشحنات",
      "خيارات توصيل مرنة",
      "تغطية جميع المدن الرئيسية"
    ],
    benefits: [
      { title: "سرعة التوصيل", description: "متوسط وقت التوصيل أقل من 45 دقيقة داخل المدينة", icon: Zap },
      { title: "رضا العملاء", description: "نسبة رضا العملاء تتجاوز 98% مع تقييم 4.8 من 5", icon: Users },
      { title: "تتبع ذكي", description: "تتبع مباشر مع تحديثات لحظية عبر التطبيق والرسائل", icon: MapPin },
      { title: "دعم متواصل", description: "فريق دعم متاح على مدار الساعة لحل أي مشكلة", icon: HeadphonesIcon }
    ],
    stats: [
      { label: "طلب يومياً", value: "+5,000" },
      { label: "نسبة التوصيل في الوقت", value: "97%" },
      { label: "مدينة مغطاة", value: "+15" },
      { label: "رضا العملاء", value: "98%" }
    ],
    useCases: ["المطاعم والمقاهي", "متاجر التجزئة", "الصيدليات", "محلات البقالة", "المتاجر الإلكترونية"]
  },
  "fleet-management": {
    title: "إدارة الأسطول",
    subtitle: "حلول متكاملة لإدارة وتشغيل أسطول التوصيل",
    description: "نوفر منظومة إدارة أسطول شاملة تمكّن الشركات من تحسين عمليات التوصيل وزيادة الكفاءة التشغيلية. من التوظيف والتدريب إلى المراقبة والتقارير، نتولى كل جوانب إدارة الأسطول لتتمكن من التركيز على نمو أعمالك.",
    icon: BarChart3,
    color: "from-blue-600 to-blue-500",
    features: [
      "توظيف وتدريب السائقين",
      "مراقبة الأداء اللحظي",
      "تقارير تحليلية متقدمة",
      "إدارة المركبات والصيانة",
      "جدولة ذكية للمهام",
      "تحسين المسارات آلياً"
    ],
    benefits: [
      { title: "خفض التكاليف", description: "توفير حتى 30% من تكاليف التشغيل عبر الأتمتة والتحسين", icon: BarChart3 },
      { title: "زيادة الإنتاجية", description: "رفع عدد التوصيلات لكل سائق بنسبة 40%", icon: Zap },
      { title: "مراقبة شاملة", description: "لوحة تحكم متكاملة لمتابعة جميع العمليات لحظياً", icon: Shield },
      { title: "مرونة التوسع", description: "سهولة التوسع في مدن جديدة خلال أسبوع واحد", icon: Building2 }
    ],
    stats: [
      { label: "سائق نشط", value: "+2,000" },
      { label: "خفض التكاليف", value: "30%" },
      { label: "زيادة الكفاءة", value: "40%" },
      { label: "مدينة تشغيلية", value: "+15" }
    ],
    useCases: ["منصات التوصيل", "شركات التجارة الإلكترونية", "سلاسل المطاعم", "شركات اللوجستيات", "قطاع التجزئة"]
  },
  "express-delivery": {
    title: "التوصيل السريع",
    subtitle: "توصيل عاجل خلال ساعة واحدة أو أقل",
    description: "خدمة التوصيل السريع مصممة للطلبات العاجلة التي لا تحتمل التأخير. سواء كانت وجبة ساخنة أو دواء ضروري أو مستند مهم، فريقنا جاهز لتوصيله في أسرع وقت ممكن مع الحفاظ على أعلى معايير الجودة والأمان.",
    icon: Zap,
    color: "from-amber-600 to-amber-500",
    features: [
      "توصيل خلال 30-60 دقيقة",
      "أولوية في التخصيص",
      "تتبع مباشر مع وقت وصول تقديري",
      "ضمان التوصيل في الوقت المحدد",
      "خدمة متاحة على مدار الساعة",
      "تعامل خاص مع الطلبات الحساسة"
    ],
    benefits: [
      { title: "سرعة فائقة", description: "متوسط وقت التوصيل 35 دقيقة داخل النطاق الحضري", icon: Clock },
      { title: "موثوقية عالية", description: "ضمان التوصيل في الوقت المحدد أو تعويض فوري", icon: Shield },
      { title: "تغطية واسعة", description: "متوفر في جميع المدن الرئيسية مع توسع مستمر", icon: MapPin },
      { title: "تعامل احترافي", description: "سائقون مدربون على التعامل مع مختلف أنواع الطلبات", icon: Users }
    ],
    stats: [
      { label: "متوسط وقت التوصيل", value: "35 دقيقة" },
      { label: "نسبة الالتزام بالوقت", value: "95%" },
      { label: "طلب سريع يومياً", value: "+1,200" },
      { label: "تقييم الخدمة", value: "4.9/5" }
    ],
    useCases: ["توصيل الطعام الساخن", "الأدوية والمستلزمات الطبية", "المستندات العاجلة", "الهدايا والمناسبات", "قطع الغيار الطارئة"]
  },
  "cold-chain": {
    title: "سلسلة التبريد",
    subtitle: "نقل وتوصيل المنتجات المبردة والمجمدة بأمان",
    description: "خدمة سلسلة التبريد المتخصصة لنقل المنتجات الحساسة لدرجة الحرارة. نستخدم مركبات مجهزة بأنظمة تبريد متقدمة مع مراقبة مستمرة لدرجة الحرارة لضمان وصول المنتجات في حالتها المثالية، سواء كانت أغذية طازجة أو منتجات صيدلانية.",
    icon: Package,
    color: "from-cyan-600 to-cyan-500",
    features: [
      "مركبات مبردة ومجمدة",
      "مراقبة درجة الحرارة لحظياً",
      "حاويات عازلة متخصصة",
      "شهادات سلامة الغذاء",
      "تقارير سلسلة التبريد",
      "التزام بمعايير SFDA"
    ],
    benefits: [
      { title: "حفظ الجودة", description: "ضمان الحفاظ على سلسلة التبريد من الاستلام حتى التسليم", icon: Shield },
      { title: "مراقبة ذكية", description: "أجهزة استشعار IoT لمراقبة الحرارة والرطوبة لحظياً", icon: BarChart3 },
      { title: "امتثال تنظيمي", description: "التزام كامل بمعايير هيئة الغذاء والدواء السعودية", icon: CheckCircle2 },
      { title: "تنوع الحلول", description: "خيارات متعددة من -25°م إلى +8°م حسب المنتج", icon: Package }
    ],
    stats: [
      { label: "مركبة مبردة", value: "+200" },
      { label: "نطاق الحرارة", value: "-25° إلى +8°" },
      { label: "نسبة سلامة المنتجات", value: "99.5%" },
      { label: "عميل في قطاع الأغذية", value: "+50" }
    ],
    useCases: ["المطاعم وخدمات التموين", "الصيدليات والمنتجات الطبية", "محلات البقالة والسوبرماركت", "مصانع الأغذية", "شركات الألبان واللحوم"]
  }
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function ServiceDetails() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const service = serviceId ? servicesData[serviceId] : null;

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <div className="text-center space-y-4">
          <Package className="w-16 h-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">الخدمة غير موجودة</h1>
          <p className="text-muted-foreground">عذراً، لم نتمكن من العثور على الخدمة المطلوبة</p>
          <Button asChild>
            <Link to={ROUTE_PATHS.SERVICES}>العودة للخدمات</Link>
          </Button>
        </div>
      </div>
    );
  }

  const IconComponent = service.icon;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Hero Section */}
      <section className={`relative bg-gradient-to-br ${service.color} text-white py-20 md:py-28 overflow-hidden`}>
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div {...fadeInUp} className="max-w-3xl">
            <Link
              to={ROUTE_PATHS.SERVICES}
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-6 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة للخدمات
            </Link>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <IconComponent className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-bold">{service.title}</h1>
              </div>
            </div>
            <p className="text-xl md:text-2xl text-white/90 font-medium mb-4">{service.subtitle}</p>
            <p className="text-white/75 text-lg leading-relaxed">{service.description}</p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-card border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {service.stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <Badge variant="outline" className="mb-4">المميزات</Badge>
            <h2 className="text-3xl font-bold">مميزات الخدمة</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {service.features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-6 flex items-center gap-4">
                    <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                    <span className="font-medium">{feature}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <Badge variant="outline" className="mb-4">الفوائد</Badge>
            <h2 className="text-3xl font-bold">لماذا تختار هذه الخدمة؟</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {service.benefits.map((benefit, i) => {
              const BenefitIcon = benefit.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                >
                  <Card className="h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <BenefitIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
                          <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <Badge variant="outline" className="mb-4">القطاعات</Badge>
            <h2 className="text-3xl font-bold">القطاعات المستفيدة</h2>
          </motion.div>
          <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
            {service.useCases.map((useCase, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
              >
                <Badge variant="secondary" className="text-base px-5 py-2.5">
                  {useCase}
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">مهتم بهذه الخدمة؟</h2>
            <p className="text-muted-foreground text-lg mb-8">
              تواصل معنا اليوم للحصول على عرض مخصص يناسب احتياجات عملك
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to={ROUTE_PATHS.CONTACT}>تواصل معنا</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to={ROUTE_PATHS.PLATFORMS}>شراكات المنصات</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
