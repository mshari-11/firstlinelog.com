import React from "react";
import { motion } from "framer-motion";
import { Target, Eye, Users, Shield, Zap, TrendingUp, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTE_PATHS } from "@/lib/index";
import { IMAGES } from "@/assets/images";
import { Button } from "@/components/ui/button";

const springPresets = {
  gentle: {
    type: "spring",
    stiffness: 120,
    damping: 20,
  },
  smooth: {
    type: "spring", 
    stiffness: 100,
    damping: 15,
  },
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const coreValues = [
  {
    icon: Shield,
    title: "الموثوقية",
    description: "نضمن تنفيذ العمليات بأعلى معايير الجودة والانضباط.",
  },
  {
    icon: Users,
    title: "الشراكة",
    description: "نبني علاقات استراتيجية طويلة المدى مع عملائنا.",
  },
  {
    icon: Zap,
    title: "الكفاءة",
    description: "نحسن العمليات باستمرار لتحقيق أفضل النتائج.",
  },
  {
    icon: TrendingUp,
    title: "النمو المستدام",
    description: "نركز على النمو المتوازن والمستدام للجميع.",
  },
];

const About: React.FC = () => {
  return (
    <div className="flex flex-col w-full overflow-hidden page-with-logo-bg" dir="rtl">
      {/* قسم البطل (Hero Section) */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-36 bg-slate-950">
        <div className="absolute inset-0 z-0">
          <img
            src={IMAGES.CORPORATE_MEETING_2}
            alt="فريق فيرست لاين"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-transparent to-background/90" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="text-center text-white max-w-4xl mx-auto"
          >
            <motion.h1
              variants={fadeInUp}
              transition={springPresets.gentle}
              className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
            >
              من نحن
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              transition={{ ...springPresets.gentle, delay: 0.1 }}
              className="text-xl opacity-90 leading-relaxed"
            >
              الخط الأول للخدمات اللوجستية - شريكك الاستراتيجي في عالم التوصيل الرقمي
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* قسم معلومات الشركة */}
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
          <div className="bg-muted/30 rounded-2xl p-8 mb-16">
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
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-6">🇸🇦 لماذا نحن؟</h3>
            <p className="text-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              لأننا لا نعمل على هامش الاقتصاد الرقمي، بل نُمثّل الطبقة التشغيلية الحيوية التي تربط التطبيقات بالميدان — ونمكّن آلاف السعوديين من العمل في قطاع واعد ومتسارع النمو.
            </p>
            <p className="text-lg text-muted-foreground mb-8">
              تواصل معنا عبر info@firstlinelog.com أو 0126033133 - مقرنا في جدة، المملكة العربية السعودية.
            </p>
          </div>
        </div>
      </section>

      {/* قسم القيم الجوهرية */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">قيمنا الجوهرية</h2>
            <p className="text-muted-foreground">
              القيم التي توجه عملنا وتحدد هويتنا كشركة رائدة في قطاع اللوجستيات.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {coreValues.map((value, index) => (
              <motion.div
                key={value.title}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                variants={fadeInUp}
                transition={{
                  ...springPresets.gentle,
                  delay: index * 0.1,
                }}
                className="text-center space-y-4"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                  <value.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">{value.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* قسم الدعوة للعمل */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={springPresets.gentle}
            >
              <img
                src={IMAGES.CORPORATE_MEETING_1}
                alt="التخطيط المؤسسي"
                className="w-full aspect-[4/3] object-cover rounded-2xl mb-8"
              />
            </motion.div>
            
            <h2 className="text-3xl font-bold mb-8">جاهز لتوسيع نطاق عملياتك؟</h2>
            <p className="text-lg text-muted-foreground mb-8">
              تواصل معنا عبر info@firstlinelog.com أو 0126033133 - مقرنا في جدة، المملكة العربية السعودية.
            </p>
            <Button asChild size="lg" className="px-8">
              <Link to={ROUTE_PATHS.INVESTORS} className="flex items-center gap-2">
                نظرة عامة للمستثمرين
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
