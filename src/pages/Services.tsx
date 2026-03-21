import React from "react";
import { motion } from "framer-motion";
import { 
  Truck, 
  Users, 
  MapPin, 
  BarChart3, 
  Zap, 
  ShieldCheck,
  ArrowLeft,
  CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";
import { IMAGES } from "@/assets/images";
import { ROUTE_PATHS } from "@/lib/index";
import { Button } from "@/components/ui/button";

const springPresets = {
  gentle: { stiffness: 300, damping: 35 },
  smooth: { stiffness: 200, damping: 40 },
};

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const services = [
  {
    title: "تشغيل المدن وإطلاق التوسع",
    description: "إطلاق وتشغيل مدن جديدة بسرعة، مع جاهزية موارد وخطة تشغيل وإدارة جودة منذ اليوم الأول.",
    includes: ["فرق ميدانية", "توزيع مناطق", "خطط ذروة", "إدارة يومية"],
    icon: MapPin,
  },
  {
    title: "إدارة السائقين والموارد البشرية التشغيلية",
    description: "استقطاب، تدريب، جدولة، وتحفيز السائقين وفق مؤشرات أداء واضحة.",
    includes: ["التزام سلوكي", "جودة تسليم", "تقليل الإلغاءات"],
    icon: Users,
  },
  {
    title: "إدارة الأسطول والتشغيل اليومي",
    description: "تشغيل مركبات ضمن نموذج مرن (تأجير/تشغيل) مع ضبط التكاليف والجاهزية.",
    includes: ["جاهزية يومية", "متابعة تشغيل", "تنظيم احتياج المدينة"],
    icon: Truck,
  },
  {
    title: "إدارة الذروة والمواسم",
    description: "خطط موارد للذروة (رمضان/عطل/مواسم) لضمان الاستمرارية وعدم تدهور SLA.",
    includes: ["سعة إضافية", "توزيع مناوبات", "متابعة دقيقة"],
    icon: Zap,
  },
  {
    title: "مؤشرات الأداء والجودة (SLA & Quality)",
    description: "إطار جودة وتشغيل قابل للقياس والتحسين.",
    includes: ["تقارير", "مراقبة يومية", "إجراءات تصحيح"],
    icon: ShieldCheck,
  },
  {
    title: "التقارير والحوكمة التشغيلية",
    description: "شفافية تشغيلية ترفع ثقة الشريك وتسرّع القرارات.",
    includes: ["تقارير دورية", "متابعة التزام", "تحليل مشاكل"],
    icon: BarChart3,
  },
];

const targetClients = [
  "منصات توصيل الطعام والتجارة السريعة",
  "شركات تحتاج ذراع تنفيذ ميداني",
  "شركاء لوجستيين (عند الحاجة لتغطية مدن)",
];

const Services: React.FC = () => {
  return (
    <div className="flex flex-col w-full overflow-hidden page-with-logo-bg" dir="rtl">
      {/* قسم البطل (Hero Section) */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-36 bg-slate-950">
        <div className="absolute inset-0 z-0">
          <img
            src={IMAGES.WAREHOUSE_OPS_6}
            alt="خدمات التشغيل"
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
              خدمات تشغيل مصممة للمنصات… وليس للاستخدام الفردي.
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 leading-relaxed font-light">
              نقدم حزمة تشغيل متكاملة للميل الأخير تركز على الاستقرار، الجودة، والقدرة على التوسع عبر مدن متعددة.
            </p>
          </motion.div>
        </div>
      </section>

      {/* قسم الخدمات الأساسية */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">الخدمات الأساسية</h2>
            <p className="text-lg text-muted-foreground">
              حلول تشغيلية شاملة مصممة خصيصاً لاحتياجات المنصات والشركات الكبيرة.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                variants={fadeInUp}
                transition={{ ...springPresets.gentle, delay: index * 0.1 }}
                className="bg-card p-8 rounded-xl border border-border shadow-sm hover:shadow-lg transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                  <service.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                </div>
                
                <h3 className="text-xl font-semibold mb-4 text-right">{service.title}</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed text-right">
                  {service.description}
                </p>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-primary mb-3">يشمل:</p>
                  {service.includes.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* قسم العملاء المستهدفين */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={springPresets.gentle}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">لمن نقدم هذه الخدمات؟</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  خدماتنا مصممة خصيصاً للشركات والمنصات التي تحتاج شريك تنفيذ موثوق وقابل للتوسع.
                </p>
              </div>

              <div className="space-y-4">
                {targetClients.map((client, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-card rounded-lg border border-border">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground font-medium">{client}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={springPresets.smooth}
              className="relative rounded-2xl overflow-hidden shadow-2xl"
            >
              <img
                src={IMAGES.CORPORATE_MEETING_2}
                alt="شراكات الأعمال"
                className="w-full aspect-[4/3] object-cover"
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
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={springPresets.smooth}
            className="max-w-3xl mx-auto space-y-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold">
              جاهز لرفع جودة التنفيذ؟
            </h2>
            <p className="text-xl opacity-80 leading-relaxed">
              تواصل معنا عبر info@firstlinelog.com أو 0126033133 للحصول على عرض تشغيل مخصص.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-primary text-white hover:bg-primary/90 px-8">
                <Link to={ROUTE_PATHS.CONTACT}>
                  اطلب عرض تشغيل مخصص
                </Link>
              </Button>
              <Button 
                asChild 
                size="lg" 
                variant="outline" 
                className="border-white/20 text-white hover:bg-white/10 px-8"
              >
                <Link to={ROUTE_PATHS.ABOUT} className="flex items-center gap-2">
                  تعرف على قصتنا
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Services;