import React from "react";

export default function Terms() {
  return (
    <div className="min-h-screen pt-32 pb-16" dir="rtl">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-5xl font-bold mb-8">شروط الاستخدام</h1>
        <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
          <p>باستخدامك لخدمات الخط الأول للخدمات اللوجستية، فإنك توافق على الشروط والأحكام التالية.</p>
          <h2 className="text-2xl font-bold text-foreground mt-8">نطاق الخدمة</h2>
          <p>تقدم الشركة خدمات تشغيل لوجستي للميل الأخير بالنيابة عن منصات التوصيل الرقمية.</p>
          <h2 className="text-2xl font-bold text-foreground mt-8">المسؤولية</h2>
          <p>تلتزم الشركة بتقديم الخدمات وفق معايير الجودة المتفق عليها مع الشركاء.</p>
        </div>
      </div>
    </div>
  );
}
