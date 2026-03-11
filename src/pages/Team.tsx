import { Link } from "react-router-dom";

const values = [
  {
    icon: "🎯",
    title: "التميز التشغيلي",
    desc: "نسعى لتحقيق أعلى معايير الجودة في كل عملية توصيل ونلتزم بالتحسين المستمر.",
    accent: "gold" as const,
  },
  {
    icon: "🤝",
    title: "الشراكة الحقيقية",
    desc: "نبني علاقات طويلة الأمد مع شركائنا وسائقينا قائمة على الثقة والاحترام المتبادل.",
    accent: "green" as const,
  },
  {
    icon: "💡",
    title: "الابتكار",
    desc: "نوظف أحدث التقنيات لتطوير حلول لوجستية ذكية تلبي احتياجات السوق المتغيرة.",
    accent: "gold" as const,
  },
  {
    icon: "🔍",
    title: "الشفافية",
    desc: "نؤمن بالشفافية الكاملة في تعاملاتنا المالية والتشغيلية مع جميع أصحاب المصلحة.",
    accent: "green" as const,
  },
];

export default function Team() {
  return (
    <main>
      <section className="fll-page-hero">
        <div className="fll-page-hero-content">
          <span className="fll-page-eyebrow fll-animate-in">من نحن</span>
          <h1 className="fll-page-title fll-animate-in-1">فريق العمل</h1>
          <p className="fll-page-subtitle fll-animate-in-2">
            فريق متنوع من الخبراء يجمعهم شغف واحد: تقديم أفضل خدمات التوصيل في المملكة
          </p>
        </div>
      </section>

      <section className="fll-section">
        <div className="fll-section-inner">
          <div style={{ borderRadius: "1rem", overflow: "hidden", marginBottom: "3rem" }}>
            <img
              src="/public/images/fll-team.jpg"
              alt="فريق عمل فيرست لاين لوجستيكس"
              style={{ width: "100%", height: "auto", display: "block", maxHeight: "500px", objectFit: "cover" }}
            />
          </div>
          <div className="fll-section-header">
            <h2 className="fll-section-title">فلسفتنا القيادية</h2>
            <p className="fll-section-desc">
              نؤمن بأن القيادة الفعّالة تبدأ من الميدان. فريقنا القيادي يعمل جنباً إلى جنب مع
              السائقين والفرق التشغيلية لفهم التحديات اليومية وإيجاد حلول عملية. نركّز على
              تمكين كل فرد في الفريق وإعطائه الأدوات والصلاحيات اللازمة لاتخاذ القرارات السريعة
              التي تخدم العملاء والشركاء.
            </p>
          </div>
        </div>
      </section>

      <section className="fll-section fll-section-alt">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <h2 className="fll-section-title">بالأرقام</h2>
            <p className="fll-section-desc">إنجازات فريقنا في خدمة قطاع اللوجستيات السعودي</p>
          </div>
          <div className="fll-grid-4">
            {[
              { value: "+٥٠٠٠", label: "سائق نشط" },
              { value: "+١٥", label: "مدينة مغطاة" },
              { value: "+٦", label: "منصات شريكة" },
              { value: "+٢M", label: "طلب شهرياً" },
            ].map((m, i) => (
              <div className={`fll-pub-metric fll-animate-in-${i + 1}`} key={m.label}>
                <div className="fll-pub-metric-value">{m.value}</div>
                <div className="fll-pub-metric-label">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fll-section">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <h2 className="fll-section-title">قيمنا</h2>
            <p className="fll-section-desc">المبادئ التي توجّه عملنا كل يوم</p>
          </div>
          <div className="fll-grid-2">
            {values.map((v, i) => (
              <div className={`fll-feature-card fll-animate-in-${i + 1}`} key={v.title}>
                <div className={`fll-feature-icon ${v.accent}`}>{v.icon}</div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fll-cta-section">
        <div className="fll-section-inner" style={{ textAlign: "center" }}>
          <h2 className="fll-section-title">انضم إلى فريقنا</h2>
          <p className="fll-section-desc">
            نبحث دائماً عن أشخاص موهوبين وشغوفين للانضمام إلى أسرة فيرست لاين
          </p>
          <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/join" className="fll-cta-btn">انضم إلينا</Link>
            <Link to="/about" className="fll-cta-btn-outline">المزيد عنّا</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
