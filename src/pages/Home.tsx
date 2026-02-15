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
      <section className="relative min-h-[90vh] flex items-center pt-20 first-line-hero-bg">
        <div className="absolute inset-0 z-0 first-line-pattern">
          <img src="https://static-us-img.skywork.ai/prod/user/head_picture/2022649704129810432_First_Line_Logistics_Infographic_2025.png?image_process=quality,q_90/resize,w_1280/format,webp" alt="العمليات اللوجستية" className="w-full opacity-10 mix-blend-overlay h-[814.5px] object-cover" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl">
            <motion.h1 variants={fadeInUp} transition={springPresets.smooth} className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.2]">
              نحن لا نوصّل الطلبات… <br />
              <span className="text-primary">نحن نُدير التنفيذ.</span>
            </motion.h1>

            <motion.p variants={fadeInUp} transition={springPresets.smooth} className="text-xl text-muted-foreground mb-10 max-w-3xl leading-relaxed">
              الخط الأول مشغّل وطني للميل الأخير (3PL) متعدد المنصات، يدير تشغيل الأساطيل والسائقين وتشغيل المدن لمصلحة منصات التوصيل داخل المملكة — بجودة قابلة للقياس، وقابلية توسّع حقيقية.
            </motion.p>

            
          </motion.div>
        </div>
      </section>

      <section className="py-24 first-line-section-bg">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <section className="py-24 border-y border-border rounded-[1111px] bg-[rgb(255,255,255)]">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{
            once: true
          }} variants={staggerContainer}>
              <motion.h2 variants={fadeInUp} className="text-4xl font-bold mb-6">لأن التنفيذ هو ما يحمي سمعة المنصة.</motion.h2>
              <motion.p variants={fadeInUp} className="text-lg text-muted-foreground mb-12">
                نموذجنا: Multi‑Platform 3PL. المنصات تملك الطلب والتجربة الرقمية. نحن نمتلك الانضباط التنفيذي على الأرض.
              </motion.p>
              
              <div className="grid sm:grid-cols-2 gap-8">
                {WHY_FIRST_LINE.map((item: BenefitData, index: number) => {
                const icons = [<ShieldCheck key="1" />, <Layers key="2" />, <Zap key="3" />, <BarChart3 key="4" />];
                return <motion.div key={item.title} variants={fadeInUp} className="space-y-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        {icons[index % icons.length]}
                      </div>
                      <h3 className="font-bold text-lg">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </motion.div>;
              })}
              </div>
            </motion.div>

            
          </div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold mb-4">نموذجنا: Multi‑Platform 3PL</h2>
            <p className="text-lg text-muted-foreground">
              المنصات تملك الطلب والتجربة الرقمية. نحن نمتلك الانضباط التنفيذي على الأرض: تشغيل المدن، إدارة السائقين، تشغيل الأسطول، وضبط مؤشرات SLA.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((service: ServiceData) => <ServiceCard key={service.title} title={service.title} description={service.description} icon={getServiceIcon(service.iconName)} />)}
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-2xl text-right">
              <h2 className="text-4xl font-bold mb-4">شراكات المنصات</h2>
              <p className="text-lg text-muted-foreground">نعمل عبر عدة منصات متنافسة من خلال نموذج تنفيذ موحد يضمن الحيادية والاحترافية.</p>
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
        </div>
      </section>

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

      <section className="py-24 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">هل تبحث عن ذراع تنفيذ يرفع الجودة ويثبت التشغيل؟</h2>
              <p className="text-lg leading-relaxed opacity-80">
                تواصل معنا عبر info@firstlinelog.com أو 0126033133 - مقرنا في جدة. نشارك نطاق التشغيل ومؤشرات الأداء تحت اتفاقية عدم إفصاح.
              </p>
            </div>
            <div className="bg-primary/20 p-8 rounded-3xl border border-primary/30 flex flex-col justify-between min-h-[300px]">
              <div>
                <h3 className="text-2xl font-bold mb-4">احجز اجتماعاً تشغيلياً</h3>
                <p className="opacity-80 mb-8">(30 دقيقة) لمناقشة فرص الشراكة واستراتيجيات التوسع.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="bg-primary text-white hover:bg-primary/90">
                  <Link to={ROUTE_PATHS.CONTACT}>اطلب عرض تشغيل</Link>
                </Button>
                <Button variant="outline" asChild className="border-white/20 text-white hover:bg-white/10">
                  <Link to={ROUTE_PATHS.CONTACT}>تواصل مع فريق الشراكات</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>;
}