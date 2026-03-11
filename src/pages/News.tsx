import { Link } from "react-router-dom";

const newsItems = [
  {
    date: "٢٠٢٦/٠٢/١٨",
    tag: "توسّع",
    title: "فيرست لاين تتوسع إلى ٣ مدن جديدة في المنطقة الشرقية",
    summary:
      "أعلنت فيرست لاين لوجستيكس عن بدء عملياتها في الدمام والخبر والظهران، لتوسّع تغطيتها إلى أكثر من ١٥ مدينة في المملكة. يأتي هذا التوسع استجابةً للطلب المتزايد من منصات التوصيل في المنطقة الشرقية.",
  },
  {
    date: "٢٠٢٦/٠١/٢٥",
    tag: "شراكة",
    title: "شراكة استراتيجية جديدة مع منصة جاهز لتوسيع خدمات التوصيل",
    summary:
      "وقّعت فيرست لاين اتفاقية شراكة استراتيجية مع منصة جاهز لتقديم خدمات التوصيل في ٥ مدن جديدة، مما يعزز من قدرات التغطية ويوفر فرص عمل إضافية لأكثر من ٨٠٠ سائق.",
  },
  {
    date: "٢٠٢٥/١٢/١٠",
    tag: "تقنية",
    title: "إطلاق نظام التتبّع الذكي الجديد بتقنية الذكاء الاصطناعي",
    summary:
      "أطلقت الشركة نظام تتبّع جديداً يعتمد على الذكاء الاصطناعي لتحسين دقة التوقعات وتقليل أوقات التوصيل بنسبة ٢٠٪. النظام الجديد يوفر تجربة محسّنة للعملاء والسائقين على حد سواء.",
  },
  {
    date: "٢٠٢٥/١١/٠٣",
    tag: "إنجاز",
    title: "فيرست لاين تتجاوز حاجز ٢ مليون طلب شهرياً",
    summary:
      "حققت فيرست لاين لوجستيكس إنجازاً جديداً بتجاوز حاجز المليوني طلب توصيل شهرياً، مما يؤكد مكانتها كأحد أبرز مزوّدي خدمات التوصيل في المملكة العربية السعودية.",
  },
];

const tagColors: Record<string, string> = {
  "توسّع": "#38bdf8",
  "شراكة": "#facc15",
  "تقنية": "#34d399",
  "إنجاز": "#f472b6",
};

export default function News() {
  return (
    <main>
      <section className="fll-page-hero">
        <div className="fll-page-hero-content">
          <span className="fll-page-eyebrow fll-animate-in">آخر المستجدات</span>
          <h1 className="fll-page-title fll-animate-in-1">الأخبار</h1>
          <p className="fll-page-subtitle fll-animate-in-2">
            تابع آخر أخبار فيرست لاين لوجستيكس وأبرز إنجازاتنا وشراكاتنا الجديدة
          </p>
        </div>
      </section>

      <section className="fll-section">
        <div className="fll-section-inner">
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {newsItems.map((item, i) => (
              <div
                className={`fll-feature-card fll-animate-in-${i + 1}`}
                key={i}
                style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
              >
                <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                  <span
                    style={{
                      background: tagColors[item.tag] ?? "#38bdf8",
                      color: "#0f172a",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "9999px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                    }}
                  >
                    {item.tag}
                  </span>
                  <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>{item.date}</span>
                </div>
                <h3 style={{ margin: 0, fontSize: "1.25rem" }}>{item.title}</h3>
                <p style={{ margin: 0, color: "#cbd5e1", lineHeight: 1.8 }}>{item.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fll-cta-section">
        <div className="fll-section-inner" style={{ textAlign: "center" }}>
          <h2 className="fll-section-title">ابقَ على اطلاع</h2>
          <p className="fll-section-desc">
            تواصل معنا لمعرفة المزيد عن آخر أخبارنا وخدماتنا
          </p>
          <div style={{ marginTop: "2rem" }}>
            <Link to="/contact" className="fll-cta-btn">تواصل معنا</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
