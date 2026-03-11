import { Link } from "react-router-dom";

const pillars = [
  {
    icon: "🏛️",
    title: "مجلس الإدارة",
    desc: "مجلس إدارة مستقل يضم خبراء في القطاع اللوجستي والمالي يشرف على التوجه الاستراتيجي للشركة ويضمن تحقيق أهدافها.",
    accent: "gold" as const,
  },
  {
    icon: "⚖️",
    title: "لجنة المراجعة",
    desc: "لجنة مراجعة داخلية تتابع الالتزام بالأنظمة واللوائح وتضمن دقة التقارير المالية والتشغيلية.",
    accent: "green" as const,
  },
  {
    icon: "🔒",
    title: "إدارة المخاطر",
    desc: "إطار شامل لإدارة المخاطر يحدد ويقيّم ويعالج المخاطر التشغيلية والمالية والتنظيمية.",
    accent: "gold" as const,
  },
];

const compliance = [
  "الالتزام بأنظمة هيئة النقل العام (TGA)",
  "التوافق مع نظام العمل السعودي ولوائحه التنفيذية",
  "الامتثال لأنظمة حماية البيانات الشخصية",
  "التوافق مع متطلبات الزكاة والضريبة والجمارك",
  "الالتزام بمعايير السلامة المرورية",
  "التوافق مع أنظمة التجارة الإلكترونية",
];

const transparency = [
  {
    title: "تقارير دورية",
    desc: "نشر تقارير أداء ربع سنوية تغطي المؤشرات التشغيلية والمالية الرئيسية.",
  },
  {
    title: "سياسة الإفصاح",
    desc: "سياسة إفصاح واضحة تضمن وصول المعلومات الجوهرية لجميع أصحاب المصلحة في الوقت المناسب.",
  },
  {
    title: "قنوات الإبلاغ",
    desc: "قنوات آمنة وسرية للإبلاغ عن أي مخالفات أو مخاوف تتعلق بالحوكمة والامتثال.",
  },
  {
    title: "المراجعة المستقلة",
    desc: "مراجعة سنوية من مدققين خارجيين مستقلين لضمان نزاهة العمليات والتقارير.",
  },
];

export default function Governance() {
  return (
    <main>
      <section className="fll-page-hero">
        <div className="fll-page-hero-content">
          <span className="fll-page-eyebrow fll-animate-in">الحوكمة المؤسسية</span>
          <h1 className="fll-page-title fll-animate-in-1">الحوكمة</h1>
          <p className="fll-page-subtitle fll-animate-in-2">
            نلتزم بأعلى معايير الحوكمة المؤسسية لضمان الشفافية والمساءلة وحماية مصالح جميع أصحاب المصلحة
          </p>
        </div>
      </section>

      <section className="fll-section">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <h2 className="fll-section-title">هيكل الحوكمة</h2>
            <p className="fll-section-desc">
              إطار حوكمة متين يضمن اتخاذ القرارات بشكل مسؤول وشفاف
            </p>
          </div>
          <div className="fll-grid-3">
            {pillars.map((p, i) => (
              <div className={`fll-feature-card fll-animate-in-${i + 1}`} key={p.title}>
                <div className={`fll-feature-icon ${p.accent}`}>{p.icon}</div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fll-section fll-section-alt">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <h2 className="fll-section-title">إطار الامتثال</h2>
            <p className="fll-section-desc">نلتزم بجميع الأنظمة واللوائح المعمول بها في المملكة العربية السعودية</p>
          </div>
          <div className="fll-grid-2">
            {compliance.map((item, i) => (
              <div className={`fll-feature-card fll-animate-in-${(i % 6) + 1}`} key={i}>
                <p style={{ margin: 0, fontWeight: 600 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fll-section">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <h2 className="fll-section-title">التزامات الشفافية</h2>
            <p className="fll-section-desc">الشفافية ركيزة أساسية في ثقافتنا المؤسسية</p>
          </div>
          <div className="fll-grid-2">
            {transparency.map((t, i) => (
              <div className={`fll-feature-card fll-animate-in-${i + 1}`} key={t.title}>
                <h3>{t.title}</h3>
                <p>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fll-cta-section">
        <div className="fll-section-inner" style={{ textAlign: "center" }}>
          <h2 className="fll-section-title">التزامنا بالتميز المؤسسي</h2>
          <p className="fll-section-desc">
            نسعى دائماً لتعزيز ممارسات الحوكمة والامتثال لبناء ثقة مستدامة مع شركائنا
          </p>
          <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/compliance" className="fll-cta-btn">الامتثال</Link>
            <Link to="/contact" className="fll-cta-btn-outline">تواصل معنا</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
