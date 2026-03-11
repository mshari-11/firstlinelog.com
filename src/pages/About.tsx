/**
 * FLL About Page — "من نحن"
 * Company story, metrics, milestones, values, and team.
 */
import { Link } from "react-router-dom";

const METRICS = [
  { value: "+2,500", label: "سائق نشط" },
  { value: "15+", label: "مدينة سعودية" },
  { value: "+35,000", label: "طلب يومي" },
  { value: "99.2%", label: "معدل التسليم" },
];

const MILESTONES = [
  {
    year: "2019",
    title: "التأسيس",
    desc: "تأسست فيرست لاين لوجستيكس في جدة برؤية واضحة: بناء بنية تحتية موثوقة لتوصيل الميل الأخير في المملكة العربية السعودية.",
  },
  {
    year: "2020",
    title: "الشراكات الأولى",
    desc: "بدأنا التعاون مع أكبر منصات التوصيل في المملكة مثل هنقرستيشن وجاهز، وأثبتنا جدارتنا في تقديم خدمة عالية الجودة.",
  },
  {
    year: "2021",
    title: "التوسع الجغرافي",
    desc: "توسعنا من مدينتين إلى 8 مدن رئيسية، مع بناء فرق تشغيل محلية وأنظمة إدارة مركزية.",
  },
  {
    year: "2023",
    title: "النمو المتسارع",
    desc: "تجاوزنا 2,000 سائق نشط و15 مدينة تشغيلية، مع إطلاق نظامنا المالي المتكامل لإدارة المحافظ والمدفوعات.",
  },
  {
    year: "2025",
    title: "التحول التقني",
    desc: "أطلقنا منصتنا التشغيلية الذكية مع تقارير لحظية، محرك قواعد مالي، وأدوات ذكاء اصطناعي لتحسين الأداء.",
  },
];

const VALUES = [
  {
    icon: "🎯",
    title: "الموثوقية",
    desc: "نؤمن بأن كل طلب يمثل وعداً للعميل. نلتزم بمعدل تسليم يتجاوز 99% لأن الثقة تُبنى بالأفعال لا بالكلام.",
    color: "teal",
  },
  {
    icon: "💡",
    title: "الابتكار",
    desc: "نستخدم التقنية لحل تحديات التشغيل الحقيقية. من أنظمة التتبع اللحظي إلى التسوية المالية التلقائية — التقنية في خدمة الكفاءة.",
    color: "gold",
  },
  {
    icon: "🤝",
    title: "الشراكة الحقيقية",
    desc: "نعامل السائقين كشركاء نجاح لا مجرد مقدمي خدمة. ونعامل المنصات كحلفاء استراتيجيين نبني معهم مستقبل التوصيل.",
    color: "green",
  },
];

export default function About() {
  return (
    <>
      {/* ═══════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════ */}
      <section className="fll-page-hero" style={{ padding: "8rem 2rem 5rem" }}>
        <div className="fll-page-hero-content">
          <div className="fll-page-eyebrow fll-animate-in fll-animate-in-1">
            من نحن
          </div>
          <h1
            className="fll-page-title fll-animate-in fll-animate-in-2"
            style={{ fontSize: "clamp(2.2rem, 6vw, 4rem)", marginBottom: "1.5rem" }}
          >
            نبني <span style={{ color: "var(--pub-teal)" }}>البنية التحتية</span>
            <br />
            لتوصيل الميل الأخير في السعودية
          </h1>
          <p className="fll-page-subtitle fll-animate-in fll-animate-in-3" style={{ maxWidth: 640 }}>
            فيرست لاين لوجستيكس — شركة سعودية رائدة في خدمات الطرف الثالث
            اللوجستية (3PL) متخصصة في عمليات الميل الأخير لمنصات التوصيل الكبرى.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          COMPANY STORY / MISSION
          ═══════════════════════════════════════════ */}
      <section className="fll-section">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <div className="fll-page-eyebrow" style={{ justifyContent: "center" }}>قصتنا</div>
            <h2 className="fll-section-title" style={{ marginTop: "1rem" }}>
              من فكرة إلى طبقة تنفيذ وطنية
            </h2>
          </div>
          <div
            className="fll-animate-in fll-animate-in-1"
            style={{
              maxWidth: 800,
              margin: "0 auto",
              lineHeight: 2,
              fontSize: "1.0625rem",
              color: "var(--pub-text-secondary)",
              textAlign: "center",
            }}
          >
            <p style={{ marginBottom: "1.5rem" }}>
              انطلقت فيرست لاين لوجستيكس من إيمان عميق بأن قطاع التوصيل في المملكة العربية السعودية
              يحتاج إلى شريك تشغيلي موثوق يربط بين المنصات الرقمية والسائقين المحترفين.
              بدأنا بأسطول صغير في جدة، وسرعان ما أثبتنا أن الجودة والالتزام يصنعان الفرق.
            </p>
            <p style={{ marginBottom: "1.5rem" }}>
              اليوم، نُشغّل أكثر من 2,500 سائق في أكثر من 15 مدينة سعودية، نخدم من خلالهم
              أكبر منصات التوصيل مثل هنقرستيشن وجاهز وتويو ومرسول. مهمتنا هي بناء
              أقوى بنية تحتية لتوصيل الميل الأخير في المنطقة — بتقنية متقدمة، وأنظمة مالية
              شفافة، وفريق عمليات لا يتوقف.
            </p>
            <p>
              <span style={{ color: "var(--pub-teal)", fontWeight: 600 }}>
                رقم السجل التجاري: 4030467553
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          KEY METRICS
          ═══════════════════════════════════════════ */}
      <div style={{
        background: "var(--pub-surface)",
        borderTop: "1px solid var(--pub-border)",
        borderBottom: "1px solid var(--pub-border)",
      }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 2rem" }}>
          <div className="fll-grid-4">
            {METRICS.map((m, i) => (
              <div key={i} className={`fll-pub-metric fll-animate-in fll-animate-in-${i + 1}`}>
                <div className="fll-pub-metric-value">{m.value}</div>
                <div className="fll-pub-metric-label">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          TIMELINE / MILESTONES
          ═══════════════════════════════════════════ */}
      <section className="fll-section fll-section-alt">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <div className="fll-page-eyebrow" style={{ justifyContent: "center" }}>مسيرتنا</div>
            <h2 className="fll-section-title" style={{ marginTop: "1rem" }}>
              محطات رئيسية في رحلتنا
            </h2>
          </div>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            {MILESTONES.map((m, i) => (
              <div
                key={i}
                className={`fll-animate-in fll-animate-in-${(i % 6) + 1}`}
                style={{
                  display: "flex",
                  gap: "1.5rem",
                  alignItems: "flex-start",
                  marginBottom: i < MILESTONES.length - 1 ? "2.5rem" : 0,
                  position: "relative",
                }}
              >
                {/* Year badge */}
                <div
                  style={{
                    minWidth: 72,
                    height: 72,
                    borderRadius: 12,
                    background: "var(--pub-surface)",
                    border: "1px solid var(--pub-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "monospace",
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: "var(--pub-teal)",
                    flexShrink: 0,
                  }}
                >
                  {m.year}
                </div>
                {/* Content */}
                <div>
                  <h3 style={{
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: "var(--pub-text)",
                    marginBottom: "0.5rem",
                  }}>
                    {m.title}
                  </h3>
                  <p style={{
                    fontSize: "0.9375rem",
                    color: "var(--pub-text-secondary)",
                    lineHeight: 1.8,
                    margin: 0,
                  }}>
                    {m.desc}
                  </p>
                </div>
                {/* Connector line */}
                {i < MILESTONES.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      right: "auto",
                      left: 35,
                      top: 76,
                      width: 2,
                      height: "calc(100% - 36px)",
                      background: "var(--pub-border)",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          VALUES
          ═══════════════════════════════════════════ */}
      <section className="fll-section">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <div className="fll-page-eyebrow" style={{ justifyContent: "center" }}>قيمنا</div>
            <h2 className="fll-section-title" style={{ marginTop: "1rem" }}>
              المبادئ التي نعمل بها
            </h2>
            <p className="fll-section-desc">
              ثلاث قيم جوهرية تقود كل قرار نتخذه وكل خدمة نقدمها.
            </p>
          </div>
          <div className="fll-grid-3">
            {VALUES.map((v, i) => (
              <div key={i} className={`fll-feature-card fll-animate-in fll-animate-in-${i + 1}`}>
                <div className={`fll-feature-icon ${v.color}`}>
                  <span>{v.icon}</span>
                </div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          TEAM PHOTO
          ═══════════════════════════════════════════ */}
      <section className="fll-section fll-section-alt">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <div className="fll-page-eyebrow" style={{ justifyContent: "center" }}>فريقنا</div>
            <h2 className="fll-section-title" style={{ marginTop: "1rem" }}>
              الفريق الذي يقف خلف العمليات
            </h2>
            <p className="fll-section-desc">
              فريق متنوع من خبراء اللوجستيات والتقنية والعمليات يعمل على مدار الساعة
              لضمان تجربة توصيل استثنائية.
            </p>
          </div>
          <div
            className="fll-animate-in fll-animate-in-2"
            style={{ maxWidth: 900, margin: "0 auto" }}
          >
            <img
              src="/images/fll-team.jpg"
              alt="فريق فيرست لاين لوجستيكس"
              style={{
                width: "100%",
                borderRadius: 16,
                border: "1px solid var(--pub-border)",
                objectFit: "cover",
                maxHeight: 480,
              }}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA — JOIN
          ═══════════════════════════════════════════ */}
      <div className="fll-cta-section">
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 className="fll-section-title" style={{ marginBottom: "0.75rem" }}>
            كن جزءاً من القصة
          </h2>
          <p className="fll-section-desc" style={{ marginBottom: "2rem" }}>
            سواء كنت منصة تبحث عن شريك تشغيل موثوق أو سائق يبحث عن فرصة عمل مستقرة — انضم إلينا اليوم.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/for-platforms" className="fll-cta-btn">
              للمنصات — تواصل معنا
            </Link>
            <Link to="/join-us" className="fll-cta-btn-outline">
              انضم كسائق
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
