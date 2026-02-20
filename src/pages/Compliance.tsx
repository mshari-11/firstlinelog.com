import React from "react";

export default function Compliance() {
  return (
    <div className="min-h-screen pt-32 pb-16" dir="rtl">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-5xl font-bold mb-8">الامتثال والحوكمة</h1>
        <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
          <p>تلتزم شركة الخط الأول للخدمات اللوجستية بأعلى معايير الحوكمة والامتثال التنظيمي.</p>
          <h2 className="text-2xl font-bold text-foreground mt-8">الإطار التنظيمي</h2>
          <p>نعمل وفق الأنظمة واللوائح المعمول بها في المملكة العربية السعودية.</p>
          <h2 className="text-2xl font-bold text-foreground mt-8">الشفافية</h2>
          <p>نلتزم بالشفافية في عملياتنا ونقدم تقارير دورية لشركائنا.</p>
        </div>
      </div>
    </div>
  );
}
