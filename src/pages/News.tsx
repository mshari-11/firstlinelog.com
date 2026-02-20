import React from "react";
import { motion } from "framer-motion";

export default function News() {
  return (
    <div className="min-h-screen pt-32 pb-16" dir="rtl">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-5xl font-bold mb-6">الأخبار</h1>
          <p className="text-xl text-muted-foreground mb-12">
            آخر أخبار وتحديثات الخط الأول للخدمات اللوجستية
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-xl p-8 border"
          >
            <span className="text-sm text-primary font-mono">2025</span>
            <h2 className="text-2xl font-bold mt-2 mb-4">توسع العمليات إلى 16 مدينة</h2>
            <p className="text-muted-foreground leading-relaxed">
              أعلنت فيرست لاين لوجستيكس عن توسيع نطاق عملياتها التشغيلية لتشمل 16 مدينة رئيسية في المملكة العربية السعودية، مما يعزز قدرتها على تقديم خدمات الميل الأخير بكفاءة أكبر.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-xl p-8 border"
          >
            <span className="text-sm text-primary font-mono">2025</span>
            <h2 className="text-2xl font-bold mt-2 mb-4">شراكة جديدة مع منصات التوصيل الرائدة</h2>
            <p className="text-muted-foreground leading-relaxed">
              وقّعت الشركة اتفاقيات شراكة تشغيلية جديدة مع عدد من أبرز منصات التوصيل في المملكة، لتعزيز نموذج التشغيل متعدد المنصات.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
