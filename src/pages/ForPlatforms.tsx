import { Link } from "react-router-dom";

const platforms = ["هنقرستيشن", "جاهز", "تويو", "مرسول", "نينجا", "كريم"];

const benefits = [
  {
    icon: "🚛",
    title: "أسطول مخصص",
    desc: "نوفر أسطولاً مدرّباً ومجهزاً بالكامل لتلبية احتياجات منصتك التشغيلية على مدار الساعة.",
    accent: "gold" as const,
  },
  {
    icon: "📡",
    title: "تتبّع لحظي",
    desc: "تقنيات تتبّع متقدمة تتيح لك ولعملائك رؤية كاملة لحالة كل طلب في الوقت الفعلي.",
    accent: "green" as const,
  },
  {
    icon: "💰",
    title: "شفافية مالية",
    desc: "تقارير مالية دقيقة وتسويات منتظمة تضمن شفافية كاملة في جميع المعاملات.",
    accent: "gold" as const,
  },
];

const steps = [
  { num: "٠١", title: "التواصل", desc: "تواصل معنا لمناقشة احتياجات منصتك وحجم العمليات المطلوب." },
  { num: "٠٢", title: "التخطيط", desc: "نصمم خطة تشغيلية مخصصة تتوافق مع معايير منصتك ومتطلباتها." },
  { num: "٠٣", title: "التكامل التقني", desc: "ربط أنظمتنا بمنصتك لضمان تدفق البيانات والطلبات بسلاسة." },
  { num: "٠٤", title: "الإطلاق", desc: "بدء العمليات مع فريق دعم مخصص لضمان أعلى مستويات الأداء." },
];

export default function ForPlatforms() {
  return (
    <main>
      <section className="fll-page-hero">
        <div className="fll-page-hero-content">
          <span className="fll-page-eyebrow fll-animate-in">شراكات المنصات</span>
          <h1 className="fll-page-title fll-animate-in-1">للمنصات</h1>
          <p className="fll-page-subtitle fll-animate-in-2">
            شريكك اللوجستي الموثوق لتشغيل عمليات التوصيل بكفاءة عالية وتغطية واسعة في جميع أنحاء المملكة
          </p>
        </div>
      </section>

      <section className="fll-section">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <h2 className="fll-section-title">منصات نفخر بالعمل معها</h2>
            <p className="fll-section-desc">
              نقدم خدمات لوجستية متكاملة لأبرز منصات التوصيل في المملكة العربية السعودية
            </p>
          </div>
          <div className="fll-grid-3">
            {platforms.map((p) => (
              <div className="fll-feature-card fll-animate-in" key={p}>
                <span style={{ fontSize: "1.25rem", fontWeight: 700 }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fll-section fll-section-alt">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <h2 className="fll-section-title">لماذا تختار فيرست لاين؟</h2>
            <p className="fll-section-desc">مزايا تنافسية تجعلنا الخيار الأمثل لمنصات التوصيل</p>
          </div>
          <div className="fll-grid-3">
            {benefits.map((b, i) => (
              <div className={`fll-feature-card fll-animate-in-${i + 1}`} key={b.title}>
                <div className={`fll-feature-icon ${b.accent}`}>{b.icon}</div>
                <h3>{b.title}</h3>
                <p>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fll-section">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <h2 className="fll-section-title">خطوات التكامل</h2>
            <p className="fll-section-desc">عملية بسيطة وسريعة لبدء الشراكة</p>
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
          <h2 className="fll-section-title">ابدأ شراكتك مع فيرست لاين اليوم</h2>
          <p className="fll-section-desc">
            تواصل معنا لمعرفة كيف يمكننا تعزيز عمليات التوصيل لمنصتك
          </p>
          <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/contact" className="fll-cta-btn">تواصل معنا</Link>
            <Link to="/about" className="fll-cta-btn-outline">تعرّف علينا</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
