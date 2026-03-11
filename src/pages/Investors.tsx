/**
 * FLL Investors Page — "Midnight Operations" aesthetic
 * Arabic RTL investor relations page with financial metrics and market opportunity.
 */
import { Link } from "react-router-dom";

const METRICS = [
  { value: "+140%", label: "نمو الإيرادات السنوي" },
  { value: "+35,000", label: "طلب يومي" },
  { value: "15+", label: "مدينة تشغيلية" },
  { value: "+2,500", label: "سائق نشط" },
];

const ADVANTAGES = [
  {
    icon: "🖥️",
    title: "تقنية متقدمة",
    desc: "نظام تشغيل متكامل مبني داخلياً يشمل إدارة الأسطول، المحاسبة التلقائية، ولوحات تحكم لحظية تمنحنا كفاءة تشغيلية لا تُضاهى.",
    color: "teal",
  },
  {
    icon: "📈",
    title: "نطاق واسع وقابل للتوسع",
    desc: "بنية تحتية مصممة للنمو السريع — من 5 مدن إلى 15+ مدينة خلال عام واحد مع الحفاظ على جودة الخدمة ومعدل تسليم 99.2%.",
    color: "gold",
  },
  {
    icon: "🤝",
    title: "شراكات استراتيجية",
    desc: "شريك تشغيلي معتمد لأكبر منصات التوصيل في السعودية: هنقرستيشن، جاهز، تويو، ومرسول — مع عقود طويلة الأمد.",
    color: "green",
  },
  {
    icon: "🛡️",
    title: "امتثال تنظيمي كامل",
    desc: "التزام تام بأنظمة هيئة النقل العام ووزارة الموارد البشرية مع عقود إلكترونية موثقة وسجلات تدقيق شاملة.",
    color: "teal",
  },
];

const HIGHLIGHTS = [
  "سوق الميل الأخير في السعودية يتجاوز 10 مليار ريال سنوياً مع نمو مركّب بأكثر من 25%",
  "نموذج أعمال خفيف الأصول (Asset-light) مع هوامش تشغيلية متحسنة كل ربع",
  "إيرادات متكررة ومتنوعة من عدة منصات ومدن — لا اعتماد على عميل واحد",
  "فريق إداري بخبرة عميقة في اللوجستيات والتقنية المالية والعمليات",
  "خارطة طريق واضحة للتوسع الإقليمي تشمل دول الخليج بحلول 2027",
  "استثمارات مستمرة في الأتمتة والذكاء الاصطناعي لتحسين الكفاءة وخفض التكاليف",
];

export default function Investors() {
  return (
    <>
      {/* ═══════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════ */}
      <section className="fll-page-hero" style={{ padding: "8rem 2rem 5rem" }}>
        <div className="fll-page-hero-content">
          <div className="fll-page-eyebrow fll-animate-in fll-animate-in-1">
            علاقات المستثمرين
          </div>
          <h1
            className="fll-page-title fll-animate-in fll-animate-in-2"
            style={{ fontSize: "clamp(2.2rem, 6vw, 4rem)", marginBottom: "1.5rem" }}
          >
            استثمر في <span style={{ color: "var(--pub-teal)" }}>مستقبل التوصيل</span>
            <br />
            في أسرع الأسواق نمواً
          </h1>
          <p className="fll-page-subtitle fll-animate-in fll-animate-in-3" style={{ maxWidth: 680 }}>
            فيرست لاين لوجستكس (س.ت: 4030467553) — شركة سعودية رائدة مقرها جدة،
            متخصصة في عمليات الميل الأخير لمنصات التوصيل. نبني البنية التحتية
            التشغيلية لاقتصاد التوصيل في المملكة العربية السعودية.
          </p>
          <div
            className="fll-animate-in fll-animate-in-4"
            style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2.5rem", flexWrap: "wrap" }}
          >
            <Link to="/contact" className="fll-cta-btn">
              تواصل مع علاقات المستثمرين
            </Link>
            <Link to="/about" className="fll-cta-btn-outline">
              تعرّف على الشركة
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          KEY FINANCIAL METRICS STRIP
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
          MARKET OPPORTUNITY
          ═══════════════════════════════════════════ */}
      <section className="fll-section">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <div className="fll-page-eyebrow" style={{ justifyContent: "center" }}>فرصة السوق</div>
            <h2 className="fll-section-title" style={{ marginTop: "1rem" }}>
              سوق الميل الأخير السعودي — <span style={{ color: "var(--pub-teal)" }}>فرصة استثنائية</span>
            </h2>
            <p className="fll-section-desc">
              يشهد قطاع التوصيل في المملكة العربية السعودية نمواً متسارعاً مدفوعاً
              برؤية 2030 والتحول الرقمي وتغيّر سلوك المستهلك.
            </p>
          </div>
          <div className="fll-grid-2" style={{ maxWidth: 960, margin: "0 auto" }}>
            <div className="fll-feature-card fll-animate-in fll-animate-in-1">
              <div className="fll-feature-icon gold" style={{ fontSize: "1.75rem" }}>
                <span>🏪</span>
              </div>
              <h3>التجارة الإلكترونية المتسارعة</h3>
              <p>
                سوق التجارة الإلكترونية السعودي يتجاوز 80 مليار ريال مع نمو سنوي
                يفوق 20%، مما يولّد طلباً متزايداً على خدمات التوصيل الموثوقة
                والبنية التحتية اللوجستية المتخصصة.
              </p>
            </div>
            <div className="fll-feature-card fll-animate-in fll-animate-in-2">
              <div className="fll-feature-icon green" style={{ fontSize: "1.75rem" }}>
                <span>🌍</span>
              </div>
              <h3>رؤية 2030 والتحول اللوجستي</h3>
              <p>
                تستهدف رؤية 2030 جعل المملكة مركزاً لوجستياً عالمياً، مع استثمارات
                ضخمة في البنية التحتية والرقمنة وتنظيم قطاع النقل — مما يخلق بيئة
                مثالية لنمو شركات الميل الأخير المتخصصة.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          COMPETITIVE ADVANTAGES
          ═══════════════════════════════════════════ */}
      <section className="fll-section fll-section-alt">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <div className="fll-page-eyebrow" style={{ justifyContent: "center" }}>المزايا التنافسية</div>
            <h2 className="fll-section-title" style={{ marginTop: "1rem" }}>
              لماذا فيرست لاين لوجستكس؟
            </h2>
            <p className="fll-section-desc">
              نجمع بين التقنية والتشغيل والامتثال في منظومة واحدة
              تجعلنا الخيار الأول لمنصات التوصيل.
            </p>
          </div>
          <div className="fll-grid-2">
            {ADVANTAGES.map((a, i) => (
              <div key={i} className={`fll-feature-card fll-animate-in fll-animate-in-${i + 1}`}>
                <div className={`fll-feature-icon ${a.color}`}>
                  <span>{a.icon}</span>
                </div>
                <h3>{a.title}</h3>
                <p>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          INVESTMENT HIGHLIGHTS
          ═══════════════════════════════════════════ */}
      <section className="fll-section">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <div className="fll-page-eyebrow" style={{ justifyContent: "center" }}>أبرز النقاط الاستثمارية</div>
            <h2 className="fll-section-title" style={{ marginTop: "1rem" }}>
              أسباب مقنعة للاستثمار
            </h2>
          </div>
          <div
            style={{
              maxWidth: 800,
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {HIGHLIGHTS.map((h, i) => (
              <div
                key={i}
                className={`fll-feature-card fll-animate-in fll-animate-in-${(i % 6) + 1}`}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1rem",
                  padding: "1.25rem 1.5rem",
                }}
              >
                <span
                  style={{
                    color: "var(--pub-teal)",
                    fontWeight: 700,
                    fontSize: "1.25rem",
                    lineHeight: 1.6,
                    flexShrink: 0,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p style={{ margin: 0, lineHeight: 1.8 }}>{h}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA — Contact Investor Relations
          ═══════════════════════════════════════════ */}
      <div className="fll-cta-section">
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 className="fll-section-title" style={{ marginBottom: "0.75rem" }}>
            هل تريد معرفة المزيد؟
          </h2>
          <p className="fll-section-desc" style={{ marginBottom: "1rem" }}>
            فريق علاقات المستثمرين جاهز للإجابة على استفساراتكم وتقديم
            المعلومات التفصيلية حول فرص الاستثمار.
          </p>
          <p
            style={{
              color: "var(--pub-text-secondary)",
              fontSize: "0.8125rem",
              marginBottom: "2rem",
            }}
          >
            شركة فيرست لاين لوجستكس &bull; س.ت: 4030467553 &bull; جدة، المملكة العربية السعودية
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/contact" className="fll-cta-btn">
              تواصل مع علاقات المستثمرين
            </Link>
            <Link to="/governance" className="fll-cta-btn-outline">
              الحوكمة والامتثال
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
