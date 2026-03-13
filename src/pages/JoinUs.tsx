import { Link } from "react-router-dom";

const benefits = [
  {
    icon: "💵",
    title: "دخل مجزي",
    desc: "احصل على دخل تنافسي مع حوافز إضافية بناءً على أدائك وعدد الطلبات المنجزة.",
    accent: "gold" as const,
  },
  {
    icon: "🕐",
    title: "مرونة في العمل",
    desc: "اختر أوقات العمل التي تناسبك مع إمكانية العمل بدوام كامل أو جزئي.",
    accent: "green" as const,
  },
  {
    icon: "🛡️",
    title: "دعم متواصل",
    desc: "فريق دعم مخصص على مدار الساعة لمساعدتك وحل أي مشكلة تواجهك أثناء العمل.",
    accent: "gold" as const,
  },
  {
    icon: "📱",
    title: "تطبيق متطور",
    desc: "تطبيق سهل الاستخدام لإدارة طلباتك وتتبع أرباحك ومتابعة أدائك.",
    accent: "green" as const,
  },
  {
    icon: "🏥",
    title: "تأمين صحي",
    desc: "تأمين طبي شامل لك ولعائلتك يغطي الحالات الطارئة والفحوصات الدورية.",
    accent: "gold" as const,
  },
  {
    icon: "📈",
    title: "فرص نمو",
    desc: "برامج تدريب وتطوير مستمرة مع فرص للترقي إلى مناصب إشرافية وقيادية.",
    accent: "green" as const,
  },
];

const requirements = [
  "أن يكون المتقدم سعودي الجنسية أو لديه إقامة سارية",
  "رخصة قيادة سارية المفعول",
  "العمر لا يقل عن ١٨ سنة",
  "امتلاك هاتف ذكي بنظام Android أو iOS",
  "سجل قيادة نظيف خالٍ من المخالفات الجسيمة",
  "اللياقة البدنية للعمل في التوصيل",
];

const steps = [
  { num: "٠١", title: "التسجيل", desc: "سجّل بياناتك الأساسية من خلال نموذج التسجيل الإلكتروني." },
  { num: "٠٢", title: "رفع المستندات", desc: "ارفع صور الهوية ورخصة القيادة والمستندات المطلوبة." },
  { num: "٠٣", title: "المراجعة", desc: "يتم مراجعة طلبك والتحقق من المستندات خلال ٤٨ ساعة." },
  { num: "٠٤", title: "التدريب", desc: "أكمل برنامج التدريب التأهيلي القصير وابدأ العمل فوراً." },
];

export default function JoinUs() {
  return (
    <main>
      <section className="fll-page-hero">
        <div className="fll-page-hero-content">
          <span className="fll-page-eyebrow fll-animate-in">وظائف السائقين</span>
          <h1 className="fll-page-title fll-animate-in-1">انضم إلينا</h1>
          <p className="fll-page-subtitle fll-animate-in-2">
            كن جزءاً من أسرة فيرست لاين لوجستيكس واحصل على دخل مجزي مع مرونة كاملة في أوقات العمل
          </p>
          <div className="fll-animate-in-3" style={{ marginTop: "2rem" }}>
            <Link to="/courier/register" className="fll-cta-btn">سجّل الآن</Link>
          </div>
        </div>
      </section>

      <section className="fll-section">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <h2 className="fll-section-title">مزايا العمل معنا</h2>
            <p className="fll-section-desc">نوفر لسائقينا بيئة عمل متميزة ومزايا تنافسية</p>
          </div>
          <div className="fll-grid-3">
            {benefits.map((b, i) => (
              <div className={`fll-feature-card fll-animate-in-${(i % 6) + 1}`} key={b.title}>
                <div className={`fll-feature-icon ${b.accent}`}>{b.icon}</div>
                <h3>{b.title}</h3>
                <p>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fll-section fll-section-alt">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <h2 className="fll-section-title">المتطلبات</h2>
            <p className="fll-section-desc">شروط بسيطة للانضمام إلى فريقنا</p>
          </div>
          <div className="fll-grid-2">
            {requirements.map((r, i) => (
              <div className={`fll-feature-card fll-animate-in-${(i % 6) + 1}`} key={i}>
                <p style={{ margin: 0, fontWeight: 600 }}>{r}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fll-section">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <h2 className="fll-section-title">خطوات التقديم</h2>
            <p className="fll-section-desc">عملية تسجيل سريعة وسهلة</p>
          </div>
          <div className="fll-grid-4">
            {steps.map((s, i) => (
              <div className={`fll-feature-card fll-animate-in-${i + 1}`} key={s.num}>
                <div className="fll-feature-icon gold" style={{ fontSize: "1.8rem", fontWeight: 800 }}>
                  {s.num}
                </div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fll-cta-section">
        <div className="fll-section-inner" style={{ textAlign: "center" }}>
          <h2 className="fll-section-title">ابدأ رحلتك المهنية اليوم</h2>
          <p className="fll-section-desc">
            سجّل الآن وانضم إلى أكثر من ٥٠٠٠ سائق يعملون مع فيرست لاين في جميع أنحاء المملكة
          </p>
          <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/courier/register" className="fll-cta-btn">سجّل كسائق</Link>
            <Link to="/faq" className="fll-cta-btn-outline">الأسئلة الشائعة</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
