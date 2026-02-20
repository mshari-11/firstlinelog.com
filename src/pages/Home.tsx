import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, Layers, Zap, BarChart3, Truck, Users, CheckCircle2, TrendingUp, Rocket, Info, Globe, LogIn, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTE_PATHS, MetricData, PlatformData, CityData, ServiceData, BenefitData } from "@/lib/index";
import { useMetrics, usePlatforms, useCities, useServices, useBenefits } from "@/hooks/use-site-data";
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
  const { data: metrics = [] } = useMetrics();
  const { data: platforms = [] } = usePlatforms();
  const { data: cities = [] } = useCities();
  const { data: services = [] } = useServices();
  const { data: benefits = [] } = useBenefits();

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
            {metrics.map((metric: MetricData) => <MetricCard key={metric.label} metric={metric} />)}
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
                {benefits.map((item: BenefitData, index: number) => {
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
            {services.map((service: ServiceData) => <ServiceCard key={service.title} title={service.title} description={service.description} icon={getServiceIcon(service.iconName)} />)}
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
            {platforms.slice(0, 8).map((platform: PlatformData) => <PlatformCard key={platform.id} platform={platform} />)}
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
            {cities.map((city: CityData) => <CityCard key={city.name} city={city} />)}
          </div>
        </div>
      </section>

      {/* منظومة فيرست لاين - Quick Access */}
      <section className="py-20 relative overflow-hidden" style={{ background: "oklch(0.08 0.06 220)" }}>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "oklch(0.92 0.02 220)" }}>
              منظومة فيرست لاين الرقمية
            </h2>
            <p className="text-lg" style={{ color: "oklch(0.55 0.04 210)" }}>
              كل أقسام التشغيل في مكان واحد — اضغط للوصول
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { label: "لوحة التحكم", path: "/services/dashboard", icon: "📊", color: "oklch(0.65 0.18 200)" },
              { label: "المناديب", path: "/services/couriers", icon: "👥", color: "oklch(0.65 0.15 200)" },
              { label: "الطلبات", path: "/services/orders", icon: "📦", color: "oklch(0.70 0.15 150)" },
              { label: "المركبات", path: "/services/vehicles", icon: "🚛", color: "oklch(0.65 0.15 50)" },
              { label: "المالية", path: "/services/finance", icon: "💰", color: "oklch(0.70 0.15 130)" },
              { label: "الشكاوى", path: "/services/complaints", icon: "💬", color: "oklch(0.65 0.15 300)" },
              { label: "Excel", path: "/services/excel", icon: "📋", color: "oklch(0.60 0.15 160)" },
              { label: "الموظفين", path: "/services/staff", icon: "🏢", color: "oklch(0.60 0.14 270)" },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <Link
                  to={item.path}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-xl group"
                  style={{
                    background: "oklch(0.13 0.06 220)",
                    borderColor: "oklch(0.22 0.05 210 / 0.4)",
                  }}
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">{item.icon}</span>
                  <span className="text-sm font-medium" style={{ color: "oklch(0.80 0.02 220)" }}>{item.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <Button asChild size="lg" className="gap-2" style={{ background: "oklch(0.65 0.18 200)" }}>
              <Link to="/admin/login">
                <LogIn className="w-5 h-5" />
                دخول لوحة الإدارة
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10">
              <Link to="/courier/register">
                <UserPlus className="w-5 h-5" />
                تسجيل كمندوب توصيل
              </Link>
            </Button>
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