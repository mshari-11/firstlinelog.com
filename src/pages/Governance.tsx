import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, BarChart3, Lock, ClipboardCheck, ChevronLeft, ShieldAlert, Eye, ArrowLeft } from 'lucide-react';
import { IMAGES } from '@/assets/images';
import { ROUTE_PATHS } from '@/lib/index';
import { Link } from 'react-router-dom';

/**
 * صفحة الحوكمة والامتثال - فيرست لاين لوجستيكس
 * تسلط الضوء على العمليات ذات المستوى المؤسسي والجاهزية للمراجعة
 */
export default function Governance() {
  const governancePillars = [{
    icon: <BarChart3 className="w-6 h-6" />,
    title: "إطار موحد لمؤشرات الأداء (KPIs)",
    description: "مجموعة موحدة من المعايير التشغيلية المطبقة في أكثر من 16 مدينة، مما يضمن قياس أداء متسق بغض النظر عن المنصة أو المنطقة."
  }, {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "سياسات السلامة والامتثال",
    description: "التزام صارم بلوائح النقل المحلية ومعايير السلامة الدولية. يخضع سائقونا وشركاء الأساطيل لتدريب مستمر على السلامة."
  }, {
    icon: <Lock className="w-6 h-6" />,
    title: "الرقابة الداخلية وإدارة المخاطر",
    description: "أنظمة إدارة مخاطر متعددة الطبقات تكتشف الانحرافات التشغيلية في الوقت الفعلي، مما يمنع تراجع جودة الخدمة قبل تأثيرها على الشريك."
  }, {
    icon: <ClipboardCheck className="w-6 h-6" />,
    title: "عمليات جاهزة للتدقيق المالي",
    description: "جميع مسارات العمل التشغيلية موثقة ومسجلة، مما يخلق مساراً شفافاً مناسباً لعمليات التدقيق المالي والتشغيلي ذات المستوى المؤسسي."
  }];
  const auditEntities = ["EY", "KPMG", "PwC", "Deloitte"];
  return <div className="flex flex-col min-h-screen bg-background" dir="rtl">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="hero-background absolute inset-0 z-0">
          <img src={IMAGES.CORPORATE_MEETING_3} alt="الحوكمة والامتثال" className="w-full h-full object-cover opacity-20" />
          <div className="hero-overlay absolute inset-0 bg-gradient-to-b from-background/80 via-transparent to-background bg-[rgb(0,0,0)]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }} className="max-w-3xl text-right">
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-mono font-bold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20 rounded-full">
              الانضباط التشغيلي
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight leading-tight">
              عمليات بمعايير <br />
              <span className="text-primary">مؤسسية عالمية</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
              تأسست فيرست لاين لوجستيكس على أساس متين من الحوكمة يعكس دقة الاستثمار المؤسسي. نحن لا نكتفي بالتنفيذ فحسب، بل نوفر التقارير والرقابة اللازمة للاستقرار على نطاق الشركات الكبرى.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {governancePillars.map((pillar, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.1
          }} className="p-8 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {pillar.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{pillar.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {pillar.description}
                </p>
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Audit Readiness */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 order-2 lg:order-1">
              <img src="https://static-us-img.skywork.ai/prod/user/head_picture/2022661412076568576_First_Line_Logistics_Infographic_2025.png?image_process=quality,q_90/resize,w_1280/format,webp" alt="جاهزية المراجعة والتدقيق" className="rounded-3xl shadow-2xl border border-border grayscale hover:grayscale-0 transition-all duration-500 h-[395.328125px] object-cover" />
            </div>
            <div className="lg:w-1/2 order-1 lg:order-2 text-right">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">الاستعداد الدائم للمعايير العالمية</h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                تم تصميم منهجيتنا التشغيلية لتتحمل المراجعات الصارمة من قبل أطراف ثالثة. نحن نحافظ على وضعية «التدقيق الدائم»، مما يضمن عدم المساومة أبداً على سلامة البيانات والامتثال للعمليات.
              </p>
              
              <div className="space-y-6 mb-10">
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 rounded-lg bg-primary/10 text-primary">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">منهجية إدارة المخاطر</h4>
                    <p className="text-sm text-muted-foreground">تحديد استباقي للمخاطر التشغيلية على مستوى المناطق والمدن قبل وقوعها.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 rounded-lg bg-primary/10 text-primary">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">لوحات الشفافية المباشرة</h4>
                    <p className="text-sm text-muted-foreground">أدوات إعداد تقارير حية للشركاء لمراقبة أداء اتفاقية مستوى الخدمة (SLA) في الوقت الفعلي.</p>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-border">
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-6">معدّة وفق منهجيات مراجعة عالمية</p>
                <div className="flex flex-wrap gap-8 items-center opacity-40 grayscale hover:grayscale-0 transition-all">
                  {auditEntities.map(name => <span key={name} className="text-2xl font-black tracking-tighter">{name}</span>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{
          opacity: 0,
          scale: 0.95
        }} whileInView={{
          opacity: 1,
          scale: 1
        }} viewport={{
          once: true
        }}>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">الشفافية هي ركيزتنا الأساسية</h2>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-10 text-lg leading-relaxed">
              اكتشف كيف يساهم إطار الحوكمة لدينا في خلق نظام بيئي للتوصيل أكثر استقراراً لمنصتك أو محفظتك الاستثمارية.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={ROUTE_PATHS.CONTACT} className="px-8 py-4 bg-background text-foreground font-bold rounded-full hover:bg-muted transition-all hover:scale-105 flex items-center justify-center gap-2">
                <span>طلب استعراض الحوكمة</span>
                <ChevronLeft className="w-4 h-4" />
              </Link>
              <Link to={ROUTE_PATHS.INVESTORS} className="px-8 py-4 bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground font-bold rounded-full hover:bg-primary-foreground/20 transition-all hover:scale-105">
                عرض نظرة المستثمرين
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Legal Disclaimer Footer */}
      <section className="py-12 border-t border-border bg-muted/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 text-primary mb-4">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">تنويه قانوني</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              إخلاء مسؤولية: الأرقام والأطر المعروضة هي تقديرات تشغيلية مستمدة بناءً على بيانات داخلية مدعومة من المنصات ومعايير السوق المتاحة للجمهور. تعمل فيرست لاين لوجستيكس كطبقة تنفيذ مستقلة (3PL) ولا تشكل هيئة اعتماد حكومية رسمية. جميع الحقوق محفوظة © 2026.
            </p>
          </div>
        </div>
      </section>
    </div>;
}