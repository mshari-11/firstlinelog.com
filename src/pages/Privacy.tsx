import React from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, Database, UserCheck, Globe, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTE_PATHS } from "@/lib/index";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const sections = [
  {
    icon: <Database className="w-5 h-5" />,
    title: "البيانات التي نجمعها",
    content: "نقوم بجمع المعلومات الشخصية الأساسية مثل الاسم، رقم الهاتف، البريد الإلكتروني، وبيانات الموقع الجغرافي اللازمة لتقديم خدمات التوصيل. كما نجمع بيانات تشغيلية تشمل سجل الطلبات ومؤشرات الأداء.",
  },
  {
    icon: <Eye className="w-5 h-5" />,
    title: "كيف نستخدم بياناتك",
    content: "نستخدم البيانات المجمعة لتشغيل وتحسين خدمات التوصيل، إدارة العلاقة التعاقدية مع السائقين والشركاء، تحليل الأداء التشغيلي، والامتثال للمتطلبات التنظيمية في المملكة العربية السعودية.",
  },
  {
    icon: <Lock className="w-5 h-5" />,
    title: "حماية البيانات",
    content: "نطبق إجراءات أمنية صارمة تشمل التشفير أثناء النقل والتخزين، التحكم في الوصول المبني على الأدوار، والمراجعة الدورية للأنظمة. نلتزم بنظام حماية البيانات الشخصية في المملكة العربية السعودية.",
  },
  {
    icon: <UserCheck className="w-5 h-5" />,
    title: "حقوقك",
    content: "يحق لك الوصول إلى بياناتك الشخصية وطلب تصحيحها أو حذفها. يمكنك أيضاً طلب نسخة من بياناتك أو الاعتراض على معالجتها في حالات معينة وفقاً للأنظمة المعمول بها.",
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: "مشاركة البيانات",
    content: "لا نبيع بياناتك الشخصية لأطراف ثالثة. قد نشارك بيانات محدودة مع منصات التوصيل الشريكة بالقدر اللازم لتنفيذ الطلبات، ومع الجهات الحكومية عند الاقتضاء بموجب القانون.",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "الاحتفاظ بالبيانات",
    content: "نحتفظ ببياناتك الشخصية للمدة اللازمة لتحقيق الأغراض المحددة في هذه السياسة أو وفقاً لمتطلبات الأنظمة المحلية. بعد انتهاء فترة الاحتفاظ، يتم حذف البيانات بشكل آمن.",
  },
];

const Privacy: React.FC = () => {
  return (
    <div className="flex flex-col w-full" dir="rtl">
      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-44 md:pb-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            animate="animate"
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="max-w-3xl text-right"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-xs font-mono font-bold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20 rounded-full">
              <Shield className="w-3 h-3" />
              حماية البيانات
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              سياسة الخصوصية
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              نلتزم بحماية خصوصية بياناتك الشخصية وفقاً لأعلى المعايير ونظام حماية البيانات الشخصية في المملكة العربية السعودية.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              آخر تحديث: فبراير 2026
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl space-y-8">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                variants={fadeInUp}
                transition={{ delay: index * 0.05 }}
                className="p-8 bg-card rounded-2xl border border-border"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    {section.icon}
                  </div>
                  <h2 className="text-xl font-bold">{section.title}</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed pr-13">
                  {section.content}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Contact for Privacy */}
          <div className="max-w-4xl mt-12 p-8 bg-primary/5 rounded-2xl border border-primary/20">
            <h3 className="text-lg font-bold mb-3">للاستفسارات المتعلقة بالخصوصية</h3>
            <p className="text-muted-foreground mb-4">
              إذا كان لديك أي استفسار حول سياسة الخصوصية أو كيفية معالجة بياناتك، يمكنك التواصل معنا عبر:
            </p>
            <p className="text-sm font-semibold text-primary">info@firstlinelog.com</p>
            <Link
              to={ROUTE_PATHS.CONTACT}
              className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-primary hover:underline"
            >
              صفحة التواصل
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Privacy;
