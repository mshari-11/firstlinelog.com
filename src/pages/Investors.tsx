import React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Target,
  Shield,
  Globe,
  BarChart3,
  Users,
  Building2,
  ArrowRight,
  FileText,
  Lock,
  Zap,
  Layers,
} from "lucide-react";
import { Link } from "react-router-dom";
import { IMAGES } from "@/assets/images";
import { ROUTE_PATHS, MetricData } from "@/lib/index";
import { METRICS } from "@/data/index";
import { MetricCard } from "@/components/Cards";
import { Button } from "@/components/ui/button";
const springPresets = {
  gentle: {
    stiffness: 300,
    damping: 35,
  },
  smooth: {
    stiffness: 200,
    damping: 40,
  },
};
const fadeInUp = {
  initial: {
    opacity: 0,
    y: 24,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
};
const whyThisSector = [
  {
    title: "سوق عالي التكرار",
    description: "طلبات يومية متكررة تضمن استقرار الإيرادات",
    icon: TrendingUp,
  },
  {
    title: "توسع التجارة الرقمية",
    description: "نمو مستمر في حجم الطلبات الرقمية",
    icon: Globe,
  },
  {
    title: "جودة التنفيذ عامل تنافسي",
    description: "التنفيذ الموثوق يحدد نجاح المنصات",
    icon: Shield,
  },
  {
    title: "فرص تجميع وتشغيل وطني",
    description: "إمكانية بناء منصة تنفيذ وطنية موحدة",
    icon: Building2,
  },
];
const investmentThesis = [
  {
    title: "توسيع جغرافي منظم",
    description: "خطة واضحة لتغطية مدن جديدة بنموذج مثبت",
    icon: Globe,
  },
  {
    title: "رفع الهامش",
    description: "تحسين اقتصاديات الوحدة عبر الكفاءة التشغيلية",
    icon: TrendingUp,
  },
  {
    title: "تنويع المنصات",
    description: "تقليل مخاطر التركّز عبر التوسع المنصاتي والقطاعي",
    icon: Layers,
  },
  {
    title: "حوكمة تشغيلية مؤسسية",
    description: "أنظمة وعمليات قابلة للتدقيق والتوسع",
    icon: Shield,
  },
];
const Investors: React.FC = () => {
  return (
    <div
      className="flex flex-col w-full overflow-hidden page-with-logo-bg"
      dir="rtl"
    >
      {/* قسم البطل (Hero Section) */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-36 bg-slate-950">
        <div className="absolute inset-0 z-0">
          <img
            src={IMAGES.SAUDI_CITIES_4}
            alt="فرص الاستثمار"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-background" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="initial"
            animate="animate"
            variants={fadeInUp}
            transition={springPresets.smooth}
            className="max-w-4xl text-right"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              فرصة استثمار في منصة تنفيذ تشغيلي داخل سوق عالي التكرار.
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 leading-relaxed font-light">
              الخط الأول مشغّل 3PL متعدد المنصات داخل المملكة. نعمل كطبقة تنفيذ
              ميداني لمنصات التوصيل، مع تشغيل في 18 مدينة وأكثر من 6.4 مليون طلب
              ناجح في 2025.
            </p>
          </motion.div>
        </div>
      </section>

      {/* قسم نموذج العمل */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              💼 نموذج العمل – الخط الأول للخدمات اللوجستية
            </h2>
            <p className="text-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              تعمل "الخط الأول" كمنصة تشغيل لوجستي ميداني تدير عمليات الميل
              الأخير بالنيابة عن كبرى تطبيقات التوصيل في المملكة.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  🎯 تركيزنا:
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• توصيل طلبات الطعام والسلع اليومية</li>
                  <li>• خدمة الميل الأخير (Last-Mile Delivery)</li>
                  <li>• نموذج تشغيل خفيف الأصول (Asset-Light)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  ⚙️ كيف نعمل؟
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  نُدير شبكة تشغيل مرنة موزعة على أكثر من 15 مدينة في المملكة،
                  ونعتمد على تكامل مباشر مع تطبيقات التوصيل لإدارة الطلبات في
                  الوقت الفعلي.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  🧦 نموذج الإيرادات:
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• رسوم تنفيذ لكل طلب من تطبيقات التوصيل</li>
                  <li>• عقود تشغيل مرنة تتناسب مع مواسم الذروة</li>
                  <li>• خدمات تشغيلية إضافية حسب الطلب</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  🤝 عملاؤنا:
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  جاهز – هنقرستيشن – كيتا – مرسول – ذا شيفز – تويو – نينجا
                </p>
                <p className="text-sm text-primary font-medium">
                  وبداية من 2026: أمازون ضمن عقود تشغيل رسمية
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              🚀 فرص النمو:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold">🏢</span>
                </div>
                <p className="font-medium">توسع في مدن إضافية</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold">🌍</span>
                </div>
                <p className="font-medium">أسواق خليجية مجاورة</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold">📦</span>
                </div>
                <p className="font-medium">تنويع الخدمات</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* قسم المؤشرات المختصرة */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              مؤشرات مختصرة
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              أرقام حقيقية تعكس نمو تشغيلي متدرج ومستقر من 2021-2025.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {METRICS.map((metric: MetricData) => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
          </div>
        </div>
      </section>

      {/* قسم لماذا هذا القطاع */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              لماذا هذا القطاع؟
            </h2>
            <p className="text-lg text-muted-foreground">
              قطاع الميل الأخير يشهد نمواً مستمراً مع تزايد الاعتماد على التجارة
              الرقمية والتوصيل السريع.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyThisSector.map((item, index) => (
              <motion.div
                key={item.title}
                initial="initial"
                whileInView="animate"
                viewport={{
                  once: true,
                }}
                variants={fadeInUp}
                transition={{
                  ...springPresets.gentle,
                  delay: index * 0.1,
                }}
                className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all text-right"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* قسم أطروحة الاستثمار */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              أطروحة الاستثمار
            </h2>
            <p className="text-lg text-muted-foreground">
              القيمة ليست في "طلب واحد"… بل في شبكة تنفيذ قابلة للتوسع.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {investmentThesis.map((item, index) => (
              <motion.div
                key={item.title}
                initial="initial"
                whileInView="animate"
                viewport={{
                  once: true,
                }}
                variants={fadeInUp}
                transition={{
                  ...springPresets.gentle,
                  delay: index * 0.1,
                }}
                className="bg-card p-8 rounded-xl border border-border shadow-sm hover:shadow-lg transition-all group text-right"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors">
                    <item.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* قسم ما الذي نبحث عنه */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{
                once: true,
              }}
              variants={fadeInUp}
              transition={springPresets.gentle}
              className="space-y-8 order-2 lg:order-1"
            >
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  شراكة استراتيجية — وليست تمويلاً تقليدياً.
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                  نرحب بالمستثمر الاستراتيجي الذي يضيف: رأس مال نمو، حوكمة،
                  وتسريع توسع — مع مشاركة معلومات تفصيلية عبر Data Room تحت NDA.
                </p>
              </div>

              <div className="bg-muted/50 p-6 rounded-xl border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">سرية المعلومات</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  المعلومات التفصيلية (العقود، التقارير المالية، بيانات التشغيل)
                  تُشارك تحت اتفاقية عدم إفصاح.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
              }}
              whileInView={{
                opacity: 1,
                scale: 1,
              }}
              viewport={{
                once: true,
              }}
              transition={springPresets.smooth}
              className="relative rounded-2xl overflow-hidden shadow-2xl order-1 lg:order-2"
            >
              <img
                src="https://static-us-img.skywork.ai/prod/user/head_picture/2022659175958761472_WhatsApp Image 2026-02-08 at 10.11.22 PM.jpeg?image_process=quality,q_90/resize,w_1280/format,webp"
                alt="اجتماع المستثمرين"
                className="w-full aspect-[4/3] h-[444px] object-contain"
              />
              <div className="absolute inset-0 border border-primary/10 rounded-2xl pointer-events-none" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* قسم الدعوة لاتخاذ إجراء */}
      <section className="py-24 bg-foreground text-background">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{
              once: true,
            }}
            variants={fadeInUp}
            transition={springPresets.smooth}
            className="max-w-3xl mx-auto space-y-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold">
              مهتم بالانضمام إلى رحلة النمو؟
            </h2>
            <p className="text-xl opacity-80 leading-relaxed">
              تواصل مع فريق الاستثمار عبر info@firstlinelog.com أو 0126033133
              لمناقشة الفرص المتاحة.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-primary text-white hover:bg-primary/90 px-8"
              >
                <Link to={ROUTE_PATHS.CONTACT}>تواصل مع فريق الاستثمار</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 px-8"
              >
                <Link
                  to={ROUTE_PATHS.CONTACT}
                  className="flex items-center gap-2"
                >
                  طلب NDA وفتح Data Room
                  <FileText className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
export default Investors;
