import React from "react";

export default function Privacy() {
  return (
    <div className="min-h-screen pt-32 pb-16" dir="rtl">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-5xl font-bold mb-8">سياسة الخصوصية</h1>
        <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
          <p>تلتزم شركة الخط الأول للخدمات اللوجستية بحماية خصوصية المستخدمين وبياناتهم الشخصية وفقاً لأنظمة المملكة العربية السعودية.</p>
          <h2 className="text-2xl font-bold text-foreground mt-8">جمع البيانات</h2>
          <p>نجمع البيانات الضرورية لتقديم خدماتنا بما يشمل معلومات الاتصال والبيانات التشغيلية.</p>
          <h2 className="text-2xl font-bold text-foreground mt-8">استخدام البيانات</h2>
          <p>تُستخدم البيانات حصرياً لأغراض تشغيلية وتحسين جودة الخدمة المقدمة.</p>
          <h2 className="text-2xl font-bold text-foreground mt-8">حماية البيانات</h2>
          <p>نطبق أعلى معايير الأمان لحماية البيانات من الوصول غير المصرح به.</p>
        </div>
      </div>
    </div>
  );
}
