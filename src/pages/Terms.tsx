import React from "react";
import { motion } from "framer-motion";
import { FileText, Scale, AlertTriangle, Handshake, Clock, Ban, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTE_PATHS } from "@/lib/index";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const sections = [
  {
    icon: <Handshake className="w-5 h-5" />,
    title: "نطاق الخدمة",
    content: "تقدم فيرست لاين لوجستيكس خدمات تشغيل لوجستي للطرف الثالث (3PL) لمنصات التوصيل، تشمل إدارة الأساطيل والسائقين، تنفيذ عمليات التوصيل، وإدارة الجودة التشغيلية. تنطبق هذه الشروط على جميع المستخدمين بما في ذلك السائقين وشركاء الأساطيل والمنصات.",
  },
  {
    icon: <Scale className="w-5 h-5" />,
    title: "الالتزامات والمسؤوليات",
    content: "يلتزم المستخدم بتقديم معلومات صحيحة ودقيقة، والامتثال لجميع الأنظمة واللوائح المحلية، والحفاظ على معايير الجودة المتفق عليها. تلتزم الشركة بتوفير الدعم التشغيلي والأدوات اللازمة لتنفيذ العمليات بكفاءة.",
  },
  {
    icon: <Clock className="w-5 h-5" />,
    title: "مدة الاتفاقية وإنهاؤها",
    content: "تسري هذه الشروط من تاريخ قبولها وتستمر طوال فترة استخدام الخدمة. يحق لأي طرف إنهاء الاتفاقية بإشعار كتابي مسبق وفقاً للمدة المحددة في العقد الفردي. لا يؤثر الإنهاء على الالتزامات المالية المستحقة.",
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    title: "حدود المسؤولية",
    content: "لا تتحمل فيرست لاين لوجستيكس المسؤولية عن الأضرار غير المباشرة أو التبعية. تقتصر مسؤولية الشركة على قيمة الخدمات المقدمة خلال فترة المطالبة. جميع الأرقام والإحصائيات المعروضة هي تقديرات تشغيلية وليست ضمانات.",
  },
  {
    icon: <Ban className="w-5 h-5" />,
    title: "الاستخدامات المحظورة",
    content: "يُحظر استخدام المنصة لأي أغراض غير قانونية، أو محاولة الوصول غير المصرح به للأنظمة، أو مشاركة بيانات الدخول مع أطراف ثالثة، أو أي سلوك يضر بسمعة الشركة أو شركائها.",
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: "القانون الواجب التطبيق",
    content: "تخضع هذه الشروط وتُفسر وفقاً لأنظمة المملكة العربية السعودية. يُحال أي نزاع ينشأ عن هذه الشروط إلى المحاكم المختصة في مدينة جدة، المملكة العربية السعودية.",
  },
];

const Terms: React.FC = () => {
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
              <FileText className="w-3 h-3" />
              الشروط القانونية
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              شروط الخدمة
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              الشروط والأحكام التي تنظم استخدام خدمات فيرست لاين لوجستيكس والعلاقة التعاقدية مع جميع الأطراف.
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

          {/* Disclaimer */}
          <div className="max-w-4xl mt-12 p-6 bg-muted/50 rounded-xl border border-border">
            <p className="text-xs text-muted-foreground leading-relaxed">
              إخلاء مسؤولية: هذه الشروط هي نسخة مبسطة للعرض العام. الشروط التعاقدية التفصيلية تُحدد في العقود الفردية مع كل شريك. تحتفظ فيرست لاين لوجستيكس بالحق في تعديل هذه الشروط في أي وقت مع إشعار مسبق. © 2026 جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Terms;
