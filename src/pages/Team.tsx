import React from "react";
import { motion } from "framer-motion";
import { Linkedin, Mail, Award, Users, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTE_PATHS } from "@/lib/index";
import { IMAGES } from "@/assets/images";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const springPresets = {
  gentle: { stiffness: 300, damping: 35 },
  smooth: { stiffness: 200, damping: 40 },
};

const leadership = [
  {
    name: "مشاري الدوسري",
    role: "المؤسس والرئيس التنفيذي",
    bio: "أكثر من 10 سنوات خبرة في قطاع اللوجستيات والتوصيل. قاد عمليات التوسع لتغطية أكثر من 18 مدينة سعودية.",
    avatar: "م",
    color: "bg-primary",
  },
  {
    name: "عبدالله المالكي",
    role: "المدير التنفيذي للعمليات",
    bio: "متخصص في إدارة الأساطيل وتحسين كفاءة التشغيل. أدار فرق تشغيل تتجاوز 2000 سائق.",
    avatar: "ع",
    color: "bg-blue-600",
  },
  {
    name: "فهد القحطاني",
    role: "مدير تطوير الأعمال",
    bio: "خبرة واسعة في بناء الشراكات الاستراتيجية مع منصات التوصيل الرائدة في المملكة.",
    avatar: "ف",
    color: "bg-emerald-600",
  },
  {
    name: "سارة الحربي",
    role: "مديرة الجودة والامتثال",
    bio: "متخصصة في أنظمة الجودة ومعايير SLA. تقود فريق مراقبة الأداء عبر جميع المدن التشغيلية.",
    avatar: "س",
    color: "bg-purple-600",
  },
  {
    name: "خالد العتيبي",
    role: "مدير التقنية",
    bio: "يقود التحول الرقمي لعمليات الشركة وبناء أنظمة المراقبة والتقارير الذكية.",
    avatar: "خ",
    color: "bg-orange-600",
  },
  {
    name: "نورة الشمري",
    role: "مديرة الموارد البشرية",
    bio: "تدير استقطاب وتدريب وتأهيل السائقين وفرق العمل الميدانية على مستوى المملكة.",
    avatar: "ن",
    color: "bg-pink-600",
  },
];

const companyValues = [
  {
    title: "الانضباط التشغيلي",
    description: "نلتزم بأعلى معايير الأداء والجودة في كل عملية تسليم.",
  },
  {
    title: "الشفافية",
    description: "نؤمن بالإفصاح الكامل ووضوح العمليات مع جميع شركائنا.",
  },
  {
    title: "الابتكار المستمر",
    description: "نستثمر في التقنية والأتمتة لتحسين كفاءة التشغيل باستمرار.",
  },
  {
    title: "العمل الجماعي",
    description: "نجاحنا مبني على التعاون والتنسيق بين فرقنا المنتشرة في أكثر من 18 مدينة.",
  },
];

const Team: React.FC = () => {
  return (
    <div className="flex flex-col w-full overflow-hidden" dir="rtl">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-36 bg-slate-950">
        <div className="absolute inset-0 z-0">
          <img
            src={IMAGES.CORPORATE_MEETING_1}
            alt="فريق القيادة"
            className="w-full h-full object-cover opacity-20"
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
            <Badge variant="outline" className="mb-6 border-primary/50 text-primary bg-primary/5 px-4 py-1">
              <Users className="w-3 h-3 ml-2" />
              فريق القيادة
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              خبرات تشغيلية تقود <br />
              <span className="text-primary">الميل الأخير</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 leading-relaxed font-light">
              فريق قيادي يجمع بين الخبرة العميقة في اللوجستيات والرؤية الاستراتيجية لبناء أكبر شبكة تنفيذ في المملكة.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Leadership Grid */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">فريق القيادة التنفيذية</h2>
            <p className="text-lg text-muted-foreground">
              قادة يمتلكون رؤية واضحة وخبرة عملية في بناء وتشغيل شبكات التوصيل على نطاق واسع.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {leadership.map((member, index) => (
              <motion.div
                key={member.name}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                variants={fadeInUp}
                transition={{ ...springPresets.gentle, delay: index * 0.1 }}
                className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-lg hover:border-primary/30 transition-all group"
              >
                {/* Avatar */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-16 h-16 rounded-2xl ${member.color} flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                    {member.avatar}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{member.name}</h3>
                    <p className="text-sm text-primary font-semibold">{member.role}</p>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {member.bio}
                </p>

                {/* Social Links */}
                <div className="flex gap-3">
                  <button className="p-2 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-colors">
                    <Linkedin className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-colors">
                    <Mail className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Values */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={springPresets.gentle}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">قيمنا التي نعمل بها</h2>
              <p className="text-lg text-muted-foreground mb-10">
                القيم التي تحرك فريقنا وتوجه قراراتنا اليومية في كل مدينة نعمل بها.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {companyValues.map((value, index) => (
                  <motion.div
                    key={value.title}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                    variants={fadeInUp}
                    transition={{ ...springPresets.gentle, delay: index * 0.1 }}
                    className="p-6 bg-card rounded-xl border border-border"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Award className="w-5 h-5 text-primary" />
                    </div>
                    <h4 className="font-bold mb-2">{value.title}</h4>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </motion.div>
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
                src={IMAGES.CORPORATE_MEETING_5}
                alt="فريق العمل"
                className="w-full aspect-[4/3] object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Join Team CTA */}
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
              انضم إلى فريقنا المتنامي
            </h2>
            <p className="text-xl opacity-80 leading-relaxed">
              نبحث دائماً عن كفاءات استثنائية تشاركنا الشغف ببناء مستقبل اللوجستيات في المملكة.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-primary text-white hover:bg-primary/90 px-8">
                <Link to={ROUTE_PATHS.JOIN_US}>
                  استعرض الفرص المتاحة
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8">
                <Link to={ROUTE_PATHS.CONTACT} className="flex items-center gap-2">
                  تواصل معنا
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

export default Team;
