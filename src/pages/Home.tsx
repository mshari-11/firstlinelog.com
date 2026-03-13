/**
 * FLL Home Page — "Midnight Operations" aesthetic
 * The hero of the public site. Bold, data-driven, unforgettable.
 */
import { Link } from "react-router-dom";

const PLATFORMS = [
  { name: "HungerStation", img: "/images/خدمة-العملاء-هنقرستيشن.jpg" },
  { name: "Jahez", img: "/images/شركات-توصيل-طلبات-المطاعم-في-السعودية-1722690288-0.webp" },
  { name: "ToYou", img: "/images/images (1).png" },
  { name: "Mrsool", img: "/images/images.jpg" },
];

const METRICS = [
  { value: "+35,000", label: "طلب يومي" },
  { value: "+2,500", label: "سائق نشط" },
  { value: "15+", label: "مدينة سعودية" },
  { value: "99.2%", label: "معدل التسليم" },
];

const SERVICES = [
  {
    icon: "🚚",
    title: "إدارة أسطول السائقين",
    desc: "توفير وتدريب وإدارة سائقين محترفين لمنصات التوصيل مع متابعة أداء لحظية.",
    color: "teal",
  },
  {
    icon: "📦",
    title: "عمليات الميل الأخير",
    desc: "تنفيذ التوصيل من المتاجر والمطاعم إلى العملاء النهائيين بكفاءة وموثوقية.",
    color: "gold",
  },
  {
    icon: "📊",
    title: "التقارير والتحليلات",
    desc: "لوحات تحكم ذكية مع تقارير مالية وتشغيلية مفصلة لكل منصة ومدينة.",
    color: "green",
  },
  {
    icon: "🔧",
    title: "إدارة المركبات",
    desc: "تأمين وصيانة وتتبع المركبات مع تحسين تكاليف التشغيل وتقليل التعطل.",
    color: "teal",
  },
  {
    icon: "💰",
    title: "المحاسبة والمالية",
    desc: "محرك مالي متكامل: محافظ السائقين، دفعات مجدولة، تسوية تلقائية، وكشف التباينات.",
    color: "gold",
  },
  {
    icon: "🛡️",
    title: "الامتثال والتنظيم",
    desc: "التزام كامل بأنظمة هيئة النقل وأنظمة العمل مع عقود إلكترونية موثقة.",
    color: "green",
  },
];

const CITIES = [
  "الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "الدمام",
  "الخبر", "الطائف", "تبوك", "أبها", "خميس مشيط",
  "الأحساء", "ينبع", "نجران", "حائل", "الباحة",
];

export default function Home() {
  return (
    <>
      {/* ═══════════════════════════════════════════
          HERO — Full-viewport with animated grid
          ═══════════════════════════════════════════ */}
      <section className="fll-page-hero" style={{ padding: "8rem 2rem 5rem" }}>
        <div className="fll-page-hero-content">
          <div className="fll-page-eyebrow fll-animate-in fll-animate-in-1">
            طبقة التنفيذ لاقتصاد التوصيل
          </div>
          <h1
            className="fll-page-title fll-animate-in fll-animate-in-2"
            style={{ fontSize: "clamp(2.2rem, 6vw, 4rem)", marginBottom: "1.5rem" }}
          >
            نربط <span style={{ color: "var(--pub-teal)" }}>المنصات</span> بالسائقين
            <br />
            لتوصيل أسرع وأذكى
          </h1>
          <p className="fll-page-subtitle fll-animate-in fll-animate-in-3" style={{ maxWidth: 640 }}>
            شركة سعودية متخصصة في خدمات الطرف الثالث للميل الأخير (3PL)
            لمنصات التوصيل. نوفر أسطول سائقين محترفين مع نظام تشغيل متكامل
            يضمن الكفاءة والموثوقية.
          </p>
          <div
            className="fll-animate-in fll-animate-in-4"
            style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2.5rem", flexWrap: "wrap" }}
          >
            <Link to="/for-platforms" className="fll-cta-btn">
              للمنصات — ابدأ الآن
            </Link>
            <Link to="/join-us" className="fll-cta-btn-outline">
              انضم كسائق
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          LIVE METRICS — Mono-font KPI strip
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
          SERVICES
          ═══════════════════════════════════════════ */}
      <section className="fll-section">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <div className="fll-page-eyebrow" style={{ justifyContent: "center" }}>خدماتنا</div>
            <h2 className="fll-section-title" style={{ marginTop: "1rem" }}>
              حلول متكاملة لعمليات التوصيل
            </h2>
            <p className="fll-section-desc">
              من إدارة السائقين إلى التقارير المالية — نقدم كل ما تحتاجه
              المنصات لتشغيل عمليات الميل الأخير بكفاءة.
            </p>
          </div>
          <div className="fll-grid-3">
            {SERVICES.map((s, i) => (
              <div key={i} className={`fll-feature-card fll-animate-in fll-animate-in-${i + 1}`}>
                <div className={`fll-feature-icon ${s.color}`}>
                  <span>{s.icon}</span>
                </div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
            <Link to="/services" className="fll-cta-btn-outline">
              استعرض جميع الخدمات
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          PLATFORM PARTNERS
          ═══════════════════════════════════════════ */}
      <section className="fll-section fll-section-alt">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <div className="fll-page-eyebrow" style={{ justifyContent: "center" }}>شركاؤنا</div>
            <h2 className="fll-section-title" style={{ marginTop: "1rem" }}>
              نعمل مع أكبر منصات التوصيل
            </h2>
          </div>
          <div className="fll-grid-4" style={{ maxWidth: 800, margin: "0 auto" }}>
            {PLATFORMS.map((p, i) => (
              <div
                key={i}
                className={`fll-feature-card fll-animate-in fll-animate-in-${i + 1}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "1.5rem",
                  minHeight: 100,
                }}
              >
                <img
                  src={p.img}
                  alt={p.name}
                  style={{
                    maxHeight: 48,
                    maxWidth: "80%",
                    objectFit: "contain",
                    filter: "grayscale(0.3) brightness(0.95)",
                    transition: "filter 0.3s ease",
                  }}
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = "none";
                    el.parentElement!.innerHTML = `<span style="color:var(--pub-text-secondary);font-weight:600;font-size:1rem">${p.name}</span>`;
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          OPERATING CITIES
          ═══════════════════════════════════════════ */}
      <section className="fll-section">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <div className="fll-page-eyebrow" style={{ justifyContent: "center" }}>التغطية</div>
            <h2 className="fll-section-title" style={{ marginTop: "1rem" }}>
              متواجدون في <span style={{ color: "var(--pub-teal)" }}>15+</span> مدينة سعودية
            </h2>
          </div>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "0.75rem",
            maxWidth: 800,
            margin: "0 auto",
          }}>
            {CITIES.map((city, i) => (
              <span
                key={i}
                className={`fll-animate-in fll-animate-in-${(i % 6) + 1}`}
                style={{
                  padding: "0.5rem 1.25rem",
                  border: "1px solid var(--pub-border)",
                  borderRadius: 8,
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  color: "var(--pub-text-secondary)",
                  background: "var(--pub-surface)",
                  transition: "all 0.2s ease",
                  cursor: "default",
                }}
              >
                {city}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          WHY FLL
          ═══════════════════════════════════════════ */}
      <section className="fll-section fll-section-alt">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <div className="fll-page-eyebrow" style={{ justifyContent: "center" }}>لماذا فيرست لاين؟</div>
            <h2 className="fll-section-title" style={{ marginTop: "1rem" }}>
              البنية التحتية التي تحتاجها المنصات
            </h2>
          </div>
          <div className="fll-grid-3">
            {[
              { icon: "⚡", title: "سرعة التشغيل", desc: "نجهز أسطول سائقين جاهز للعمل خلال أيام، مع عقود إلكترونية وتدريب مكثف." },
              { icon: "🎯", title: "أداء مضمون", desc: "معدل تسليم 99.2% مع مراقبة لحظية للأداء ومعايير صارمة لجودة الخدمة." },
              { icon: "🏦", title: "شفافية مالية", desc: "نظام مالي متكامل مع محافظ رقمية، تسوية تلقائية، وتقارير مفصلة." },
            ].map((item, i) => (
              <div key={i} className={`fll-feature-card fll-animate-in fll-animate-in-${i + 1}`}>
                <div className="fll-feature-icon" style={{ fontSize: "1.75rem" }}>
                  {item.icon}
                </div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA — Join
          ═══════════════════════════════════════════ */}
      <div className="fll-cta-section">
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 className="fll-section-title" style={{ marginBottom: "0.75rem" }}>
            جاهز للانطلاق؟
          </h2>
          <p className="fll-section-desc" style={{ marginBottom: "2rem" }}>
            سواء كنت منصة تبحث عن شريك تشغيل أو سائق يبحث عن فرصة عمل — نحن هنا.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/for-platforms" className="fll-cta-btn">
              أنا منصة
            </Link>
            <Link to="/join-us" className="fll-cta-btn-outline">
              أنا سائق
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
