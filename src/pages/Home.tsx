import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, Layers, Zap, BarChart3, Truck, Users, CheckCircle2, TrendingUp, Rocket, Info, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTE_PATHS, MetricData, PlatformData, CityData, ServiceData, BenefitData } from "@/lib/index";
import { METRICS, PLATFORMS, CITIES, SERVICES, WHY_FIRST_LINE } from "@/data/index";
import { MetricCard, ServiceCard, PlatformCard, CityCard } from "@/components/Cards";
import { IMAGES } from "@/assets/images";
import { Button } from "@/components/ui/button";
const springPresets = {
  gentle: {
    stiffness: 300,
    damping: 35
  },
  smooth: {
    stiffness: 200,
    damping: 40
  }
};
const fadeInUp = {
  hidden: {
    opacity: 0,
    y: 24
  },
  visible: {
    opacity: 1,
    y: 0
  }
};
const staggerContainer = {
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
};
const getServiceIcon = (iconName: string) => {
  switch (iconName) {
    case "Truck":
      return <Truck className="w-6 h-6" />;
    case "Users":
      return <Users className="w-6 h-6" />;
    case "ShieldCheck":
      return <ShieldCheck className="w-6 h-6" />;
    case "Zap":
      return <Zap className="w-6 h-6" />;
    case "Globe":
      return <Globe className="w-6 h-6" />;
    default:
      return <Truck className="w-6 h-6" />;
  }
};
export default function Home() {
  return <div className="flex flex-col w-full overflow-hidden page-with-logo-bg" dir="rtl">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1663900108404-a05e8bf82cda?w=1920&q=80" alt="الرياض" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-background" />
        </div>

        <div className="container mx-auto px-4 relative z-10 pt-24">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl mx-auto md:mx-0 md:mr-auto text-right">
            <motion.h1 variants={fadeInUp} transition={springPresets.smooth} className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-white">
              الخط الأول للخدمات اللوجستية
            </motion.h1>

            <motion.h2 variants={fadeInUp} transition={springPresets.smooth} className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white/90 mb-6">
              شريك التشغيل في الميل الأخير للمنصات الرقمية في المملكة العربية السعودية
            </motion.h2>

            <motion.p variants={fadeInUp} transition={springPresets.smooth} className="mb-10 max-w-3xl text-white/80 text-sm md:text-base text-right leading-relaxed">
              نُدير تنفيذ عمليات التوصيل بالنيابة عن أبرز تطبيقات التوصيل، عبر نموذج تشغيل Multi-Platform 3PL يرفع الكفاءة، يضمن جودة التنفيذ، ويمنح المنصات قدرة توسع أسرع داخل المدن الرئيسية.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-start">
              <Button size="lg" asChild className="px-8">
                <Link to={ROUTE_PATHS.CONTACT} className="flex items-center gap-2">
                  تواصل معنا <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="px-8 bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Link to={ROUTE_PATHS.SERVICES}>
                  اكتشف نموذج التشغيل
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-24 first-line-section-bg">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block">
              <img src="https://static-us-img.skywork.ai/prod/user/head_picture/2022644365418352640_first_line_correct_logos_1.jpg?image_process=quality,q_90/resize,w_1280/format,webp" alt="FIRST LINE LOGISTICS" className="h-8 opacity-20" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {METRICS.map((metric: MetricData) => <MetricCard key={metric.label} metric={metric} />)}
          </div>
          <motion.p initial={{
          opacity: 0
        }} whileInView={{
          opacity: 1
        }} viewport={{
          once: true
        }} className="mt-8 text-xs text-muted-foreground flex items-center gap-2 font-mono justify-end">
            ملاحظة: تقديرات تشغيلية مستمدة من أحجام المنصات المدعومة والمعايير المرجعية للسوق لعام 2025.
            <Info className="w-3 h-3" />
          </motion.p>
        </div>
      </section>

      {/* ماذا نفعل Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="text-center max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-6">ماذا نفعل؟</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              نقدم تشغيلاً ميدانياً متكاملاً لعمليات الميل الأخير للمنصات، يشمل إدارة التشغيل اليومي، مراقبة الأداء، وتطبيق معايير الخدمة (SLA) عبر أسطول موحد ومنهجية تشغيل واضحة.
            </p>
          </motion.div>
        </div>
      </section>

      {/* نموذج تشغيل متعدد المنصات Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-5xl mx-auto mb-16">
            <h2 className="text-4xl font-bold mb-6">نموذج تشغيل متعدد المنصات</h2>
          </div>
          <div className="text-right space-y-6 text-muted-foreground leading-relaxed max-w-5xl mx-auto">
            <p className="text-lg">
              نعمل كشريك تشغيل مستقل يخدم عدة منصات في وقت واحد من خلال بنية تشغيلية موحدة. يتيح هذا النموذج تحقيق كثافة تشغيل أعلى، مرونة أفضل في إدارة الذروة، واستقرار أكبر في الأداء.
            </p>

            <div className="bg-primary/5 rounded-lg p-6 border border-primary/10">
              <h3 className="text-xl font-bold text-foreground mb-4 text-right">نقاط سريعة:</h3>
              <ul className="space-y-3 text-base text-right">
                <li>• تكامل تشغيلي وتقني مع المنصات</li>
                <li>• توزيع مرن للموارد حسب الطلب</li>
                <li>• متابعة يومية لمعايير SLA</li>
                <li>• قابلية توسع عبر المدن</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-muted/30 rounded-lg p-6">
                <h4 className="text-lg font-bold text-foreground mb-3 text-right">هذا النموذج يمنحنا:</h4>
                <ul className="space-y-2 text-sm text-right">
                  <li>• توزيعًا متوازنًا للطلبات بين المنصات</li>
                  <li>• كثافة تشغيلية أعلى في المدن الرئيسية</li>
                  <li>• استقرارًا تشغيليًا يقلل من مخاطر الاعتماد على عميل واحد</li>
                  <li>• مرونة في إدارة الذروة والمواسم</li>
                </ul>
              </div>

              <div className="bg-muted/30 rounded-lg p-6">
                <h4 className="text-lg font-bold text-foreground mb-3 text-right xl:text-[28px]">كيف نخلق القيمة للمنصات؟</h4>
                <ul className="space-y-2 text-sm text-right">
                  <li>• تقليل التكاليف التشغيلية الثابتة</li>
                  <li>• رفع جودة التنفيذ والالتزام بالمواعيد</li>
                  <li>• توفير مرونة في التوسع الجغرافي</li>
                  <li>• تحسين تجربة العميل النهائي</li>
                </ul>
              </div>
            </div>

            <div className="text-right bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-6 border">
              <h4 className="text-xl font-bold text-foreground mb-3 text-right">موقعنا داخل المنظومة الرقمية</h4>
              <p className="text-base font-medium text-primary mb-2 text-right">نحن لا ننافس التطبيقات، بل نُمكّنها.</p>
              <p className="text-sm text-right">نُشكّل حلقة الوصل بين الطلب الرقمي والتنفيذ الفعلي، مما يجعلنا عنصرًا تشغيليًا أساسيًا في سلسلة القيمة.</p>
            </div>
          </div>
        </div>
      </section>

      {/* شركاؤنا Section */}
      <section className="py-16 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
            <div className="max-w-2xl text-right">
              <h2 className="text-3xl font-bold mb-4">شركاؤنا</h2>
            </div>
            <Button variant="link" asChild className="text-primary group">
              <Link to={ROUTE_PATHS.PLATFORMS} className="flex items-center gap-2">
                عرض جميع المنصات <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PLATFORMS.slice(0, 8).map((platform: PlatformData) => <PlatformCard key={platform.id} platform={platform} />)}
          </div>
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">شراكات تشغيلية وفق متطلبات تشغيلية ومعايير خدمة محددة.</p>
          </div>
        </div>
      </section>

      {/* نطاق الانتشار Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10">
          <img src={IMAGES.SAUDI_CITIES_2} alt="خارطة المدن السعودية" className="w-full h-full object-cover" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">نطاق الانتشار التشغيلي</h2>
            <p className="text-lg text-muted-foreground">تنفيذ مباشر عبر 16 مركزاً استراتيجياً في المملكة العربية السعودية.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {CITIES.map((city: CityData) => <CityCard key={city.name} city={city} />)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">هل تبحث عن شريك تشغيل موثوق في الميل الأخير؟</h2>
              <p className="text-lg leading-relaxed opacity-80">
                تواصل معنا لبحث نطاق التشغيل والمدن والمتطلبات.
              </p>
            </div>
            <div className="bg-primary/20 p-8 rounded-3xl border border-primary/30 flex flex-col justify-between min-h-[300px]">
              <div>
                <h3 className="text-2xl font-bold mb-4">اطلب عرض تشغيلي</h3>
                <p className="opacity-80 mb-8">نقدم عروض مخصصة حسب احتياجاتك ونطاق عملك.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="bg-primary text-white hover:bg-primary/90">
                  <Link to={ROUTE_PATHS.CONTACT}>تواصل معنا</Link>
                </Button>
                <Button variant="outline" asChild className="border-white/20 text-white hover:bg-white/10">
                  <Link to={ROUTE_PATHS.ABOUT}>اعرف المزيد</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>;
}
