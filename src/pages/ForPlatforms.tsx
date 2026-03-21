import React from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  Layers, 
  CheckCircle2,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTE_PATHS } from "@/lib/index";
import { IMAGES } from "@/assets/images";
import { ServiceCard } from "@/components/Cards";

const PLATFORM_BENEFITS = [
  {
    title: "فرق تنفيذ على مستوى المدن",
    description: "عمليات ميدانية مخصصة في أكثر من 16 مدينة سعودية لضمان السيطرة المحلية والاستجابة السريعة لمتطلبات المنصة.",
    icon: <Layers className="w-6 h-6" />
  },
  {
    title: "إدارة الطلب في الذروة والمواسم",
    description: "نمذجة سعة متقدمة لاستيعاب طفرات الطلب في رمضان والمواسم دون التأثير على جودة الخدمة (SLA).",
    icon: <Zap className="w-6 h-6" />
  },
  {
    title: "اتفاقيات مستوى خدمة موحدة",
    description: "مقاييس أداء معيارية في جميع مناطق العمل لضمان جودة ثابتة وموثوقة عبر كافة فروع المنصة.",
    icon: <ShieldCheck className="w-6 h-6" />
  },
  {
    title: "تقارير أداء مؤسسية",
    description: "تقارير تفصيلية دورية توفر شفافية كاملة حول العمليات ونقاط البيانات الدقيقة لاتخاذ قرارات مدروسة.",
    icon: <BarChart3 className="w-6 h-6" />
  },
  {
    title: "تحسين مستمر للتكلفة والجودة",
    description: "عمليات تحسين متكررة مدفوعة بالبيانات لتقليل تكاليف التوصيل وزيادة الكفاءة التشغيلية بشكل مستدام.",
    icon: <TrendingUp className="w-6 h-6" />
  }
];

const CAPABILITIES = [
  {
    id: "dedicated-fleet",
    title: "عمليات الأسطول المخصص",
    description: "إدارة احترافية للسائقين مع التزام صارم بالبروتوكولات الخاصة بالمنصة ومعايير الخدمة المعتمدة."
  },
  {
    id: "city-scaling",
    title: "توسع جغرافي فوري",
    description: "استفد من بنيتنا التحتية الحالية في 16 مدينة للتوسع السريع دون الحاجة لاستثمارات رأسمالية ضخمة."
  },
  {
    id: "sla-governance",
    title: "حوكمة مؤسسية للخدمة",
    description: "أنظمة مراقبة متطورة تضمن الالتزام بنسبة 99.8% بمتطلبات التوصيل الخاصة بمنصتكم."
  }
];

const ForPlatforms: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background" dir="rtl">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-15">
          <img 
            src={IMAGES.WAREHOUSE_OPS_8} 
            alt="Operations Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wider text-primary uppercase bg-primary/10 rounded-full border border-primary/20">
                تميز الشراكة الاستراتيجية
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                شريك التنفيذ الذي <br />
                <span className="text-primary">لا يمكن استبداله بسهولة</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
                توفر فيرست لاين لوجستيكس طبقة التنفيذ الحيوية لاقتصاد التوصيل الرقمي في المملكة العربية السعودية. نحن لا نقدم مجرد سائقين؛ بل نقدم منظومة متكاملة، محوكمة وقابلة للتوسع مصممة لنجاح منصتكم.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to={ROUTE_PATHS.CONTACT}
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-primary-foreground bg-primary rounded-lg transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
                >
                  طلب مقترح شراكة
                  <ArrowLeft className="mr-2 w-5 h-5 flip-rtl" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Value Proposition Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">لماذا تختار المنصات الكبرى فيرست لاين؟</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">نحن نبني جسور الثقة من خلال الانضباط التشغيلي والنتائج الملموسة.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {PLATFORM_BENEFITS.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-primary/10 text-primary mb-6 group-hover:scale-110 transition-transform">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{benefit.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Split Content Section: Operations */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative order-2 lg:order-1"
            >
              <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl border border-border">
                <img 
                  src={IMAGES.CORPORATE_MEETING_2} 
                  alt="Strategic Planning"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 p-6 bg-primary text-primary-foreground rounded-2xl shadow-xl hidden md:block">
                <div className="font-mono text-3xl font-bold text-left">99.8%</div>
                <div className="text-sm opacity-90">معدل الالتزام بـ SLA</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                مصممة خصيصاً لسوق <br /> التوصيل السعودي الفريد
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                تمتلك المنصات الطلب - ولكن التنفيذ هو المورد النادر. نحن نسد هذه الفجوة بطبقة تنفيذ محايدة تعطي الأولوية للانضباط التشغيلي، مما يضمن الاستقرار والنمو المستدام في بيئة تنافسية.
              </p>
              
              <ul className="space-y-4">
                {[
                  "مؤشرات أداء موحدة عبر مناطق التوصيل المختلفة",
                  "إدارة مباشرة لانضباط الأسطول ومعايير السلامة",
                  "إعادة تخصيص السعة في الوقت الفعلي بناءً على الطلب",
                  "عمليات تشغيلية وسجلات جاهزة للمراجعة والتدقيق"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle2 className="w-6 h-6 text-primary shrink-0 ml-3" />
                    <span className="text-foreground font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Grid (Subset for Platforms) */}
      <section className="py-24 bg-secondary/10">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">إطار القدرات الأساسية</h2>
            <p className="text-muted-foreground">تم تصميم بنية خدماتنا للتعامل مع تعقيدات عمليات المنصات واسعة النطاق لضمان سلاسة التنفيذ.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CAPABILITIES.map((service) => (
              <ServiceCard 
                key={service.id} 
                title={service.title} 
                description={service.description} 
                icon={<Zap className="w-5 h-5" />} 
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-primary p-12 md:p-16 rounded-[2rem] text-primary-foreground text-center relative overflow-hidden"
          >
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">هل أنتم جاهزون لتعزيز <br /> استقرار طبقة التنفيذ لديكم؟</h2>
              <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
                شاركوا الشبكة الأكثر انضباطاً في المنطقة. دعونا نناقش متطلباتكم على مستوى المدن واستراتيجية إدارة الذروة.
              </p>
              <Link
                to={ROUTE_PATHS.CONTACT}
                className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-primary bg-white rounded-xl transition-all hover:scale-105 active:scale-95 shadow-xl"
              >
                طلب عرض شراكة مفصل
                <ArrowLeft className="mr-2 w-5 h-5 flip-rtl" />
              </Link>
            </div>
            {/* Decorative circles */}
            <div className="absolute top-0 left-0 -translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 translate-y-1/2 translate-x-1/2 w-96 h-96 bg-black/10 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ForPlatforms;
