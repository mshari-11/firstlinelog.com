import React from "react";
import { motion } from "framer-motion";
import { Shield, Target, Eye, Zap, Search, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { IMAGES } from "@/assets/images";
import { ROUTE_PATHS } from "@/lib/index";

const springPresets = {
  gentle: { stiffness: 300, damping: 35 },
  smooth: { stiffness: 200, damping: 40 },
};

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const values = [
  {
    title: "الانضباط",
    description: "الالتزام الصارم بالبروتوكولات التشغيلية والمواعيد المحددة.",
    icon: Shield,
  },
  {
    title: "الشفافية",
    description: "تقارير مفتوحة وقائمة على البيانات لتعزيز الثقة المؤسسية.",
    icon: Search,
  },
  {
    title: "السلامة التشغيلية",
    description: "نهج لا يقبل المساومة تجاه رفاهية السائقين وسلامة الأسطول.",
    icon: Shield,
  },
  {
    title: "سرعة القرار",
    description: "استجابة مرنة لذروة الطلب وتحولات السوق المتسارعة.",
    icon: Zap,
  },
  {
    title: "جودة الخدمة",
    description: "إنفاذ متسق لاتفاقيات مستوى الخدمة (SLA) في جميع مدن العمل.",
    icon: Target,
  },
];

const About: React.FC = () => {
  return (
    <div className="flex flex-col w-full overflow-hidden page-with-logo-bg" dir="rtl">
      {/* قسم البطل (Hero Section) */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-36 bg-slate-950">
        <div className="absolute inset-0 z-0">
          <img
            src={IMAGES.WAREHOUSE_OPS_7}
            alt="عمليات فيرست لاين"
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
            className="max-w-3xl text-right"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              الخط الأول… طبقة التنفيذ داخل منظومة الاقتصاد الرقمي.
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 leading-relaxed font-light">
              لسنا تطبيقاً ولا منصة تملك الطلب. نحن مشغّل تنفيذ ميداني يضمن أن الطلب الرقمي يتحول إلى تجربة تسليم دقيقة، مستقرة، قابلة للتوسع.
            </p>
          </motion.div>
        </div>
      </section>

      {/* قسم الرسالة والرؤية */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          {/* مقدمة عن الشركة */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">نحن الخط الأول للخدمات اللوجستية</h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              شركة تشغيل لوجستي وطنية، متخصصة في إدارة وتنفيذ عمليات التوصيل بالنيابة عن كبرى تطبيقات التوصيل في المملكة.
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mt-4">
              نُعد شريكًا استراتيجيًا للمنصات الرقمية، نقدم لها بنية تشغيلية موثوقة لإيصال ملايين الطلبات إلى المستهلكين بكفاءة يومًا بعد يوم.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start mb-16">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={springPresets.gentle}
              className="space-y-8"
            >
              <div className="space-y-6">
                <h3 className="text-2xl font-bold flex items-center gap-3 text-foreground">
                  🎯 رؤيتنا
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  أن نكون البنية التشغيلية الأذكى والأكثر موثوقية في قطاع الميل الأخير بالمملكة والخليج.
                </p>
              </div>

              <div className="space-y-6">
                <h3 className="text-2xl font-bold flex items-center gap-3 text-foreground">
                  🛠 ما نقوم به
                </h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>إدارة وتشغيل آلاف عمليات التوصيل اليومية</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>تكامل رقمي مباشر مع تطبيقات التوصيل</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>تشغيل أسطول مركزي بكفاءة تشغيلية عالية</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>تنفيذ الطلبات وفق أعلى معايير الجودة (SLA)</span>
                  </li>
                </ul>
              </div>
            </motion.div>
            
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={{ ...springPresets.gentle, delay: 0.2 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <h3 className="text-2xl font-bold flex items-center gap-3 text-foreground">
                  🤝 من نخدم
                </h3>
                <p className="text-muted-foreground mb-4">نعمل مع أبرز التطبيقات والمنصات في المملكة:</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <span className="bg-muted/50 px-3 py-2 rounded-lg text-center">جاهز</span>
                  <span className="bg-muted/50 px-3 py-2 rounded-lg text-center">هنقرستيشن</span>
                  <span className="bg-muted/50 px-3 py-2 rounded-lg text-center">كيتا</span>
                  <span className="bg-muted/50 px-3 py-2 rounded-lg text-center">مرسول</span>
                  <span className="bg-muted/50 px-3 py-2 rounded-lg text-center">ذا شيفز</span>
                  <span className="bg-muted/50 px-3 py-2 rounded-lg text-center">نينجا</span>
                  <span className="bg-muted/50 px-3 py-2 rounded-lg text-center">تويو</span>
                </div>
                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm font-medium text-primary">
                    وبدءًا من عام 2026: أمازون ضمن عقود تشغيل رسمية
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-2xl font-bold flex items-center gap-3 text-foreground">
                  📍 تغطيتنا الجغرافية
                </h3>
                <p className="text-muted-foreground mb-4">نُدير عملياتنا في أكثر من 15 مدينة رئيسية:</p>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  الرياض، جدة، مكة، المدينة، الطائف، الدمام، الخبر، بريدة، تبوك، نجران، حائل، خميس مشيط، أبها، الخرج، حفر الباطن
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* قسم الإحصائيات */}
          <div className="bg-muted/30 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-center mb-8">📊 ماذا نُقدّم؟</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">35,000+</div>
                <div className="text-sm text-muted-foreground">طلب يوميًا</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">4-6%</div>
                <div className="text-sm text-muted-foreground">حصة سوقية</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">15+</div>
                <div className="text-sm text-muted-foreground">مدينة</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">خفيف</div>
                <div className="text-sm text-muted-foreground">نموذج الأصول</div>
              </div>
            </div>
          </div>
          
          {/* قسم لماذا نحن */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold mb-6">🇸🇦 لماذا نحن؟</h3>
            <p className="text-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              لأننا لا نعمل على هامش الاقتصاد الرقمي، بل نُمثّل الطبقة التشغيلية الحيوية التي تربط التطبيقات بالميدان — ونمكّن آلاف السعوديين من العمل في قطاع واعد ومتسارع النمو.
            </p>
          </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={springPresets.smooth}
              className="relative rounded-2xl overflow-hidden shadow-2xl order-1 lg:order-2"
            >
              <img
                src={IMAGES.CORPORATE_MEETING_1}
                alt="التخطيط المؤسسي"
                className="w-full aspect-[4/3] object-cover"
              />
              <div className="absolute inset-0 border border-primary/10 rounded-2xl pointer-events-none" />
            </motion.div>
        </div>
      </section>

      {/* قسم القيم الجوهرية */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">قيمنا الجوهرية</h2>
            <p className="text-muted-foreground">
              ثقافتنا التشغيلية مبنية على خمسة مبادئ أساسية تقود كل عملية توصيل وكل قرار استراتيجي نتخذه.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                variants={fadeInUp}
                transition={{ ...springPresets.gentle, delay: index * 0.1 }}
                className="bg-card p-8 rounded-xl border border-border shadow-sm hover:shadow-md transition-all group text-right"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                  <value.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* قسم الاستراتيجية المؤسسية */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="bg-slate-900 rounded-3xl overflow-hidden flex flex-col lg:flex-row shadow-2xl">
            <div className="lg:w-1/2 p-12 lg:p-20 flex flex-col justify-center space-y-8 text-right">
              <span className="text-primary font-mono text-sm tracking-wider uppercase">الحياد الاستراتيجي</span>
              <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                شريك تنفيذ لعصر المنصات المتعددة
              </h2>
              <p className="text-slate-400 text-lg">
                تعمل فيرست لاين لوجستيكس كمشغل 3PL سعودي محايد. نحن لا ننافس المنصات على الطلب؛ بل نحل مشكلة ندرة التنفيذ من خلال توفير شبكات سائقين مستقرة وعالية القدرة في أكثر من 16 مدينة.
              </p>
              <div className="pt-4">
                <Link
                  to={ROUTE_PATHS.PLATFORMS}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full font-semibold hover:bg-primary/90 transition-colors"
                >
                  استكشف خدمات المنصات
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="lg:w-1/2 relative min-h-[400px]">
              <img
                src={IMAGES.WAREHOUSE_OPS_7}
                alt="النطاق التشغيلي"
                className="absolute inset-0 w-full h-full object-cover grayscale opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-slate-900 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* قسم الدعوة لاتخاذ إجراء (CTA) */}
      <section className="py-24 border-t border-border bg-card">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">جاهز لتوسيع نطاق عملياتك؟</h2>
          <p className="text-lg text-muted-foreground mb-8">
            تواصل معنا عبر info@firstlinelog.com أو 0126033133 - مقرنا في جدة، المملكة العربية السعودية.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to={ROUTE_PATHS.CONTACT}
              className="bg-primary text-primary-foreground px-10 py-4 rounded-full font-bold hover:shadow-lg hover:shadow-primary/20 transition-all"
            >
              تواصل مع فريقنا
            </Link>
            <Link
              to={ROUTE_PATHS.INVESTORS}
              className="bg-secondary text-secondary-foreground px-10 py-4 rounded-full font-bold hover:bg-secondary/80 transition-all"
            >
              نظرة عامة للمستثمرين
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;