import { Link } from "react-router-dom";

const regulations = [
  {
    icon: "🚗",
    title: "هيئة النقل العام",
    desc: "ملتزمون بجميع لوائح وأنظمة هيئة النقل العام (TGA) المتعلقة بنشاط النقل والتوصيل، بما في ذلك تراخيص التشغيل ومعايير السلامة والجودة.",
    accent: "gold" as const,
  },
  {
    icon: "⚖️",
    title: "نظام العمل السعودي",
    desc: "نطبق جميع أحكام نظام العمل ولوائحه التنفيذية فيما يخص حقوق العاملين، ساعات العمل، الإجازات، والسلامة المهنية.",
    accent: "green" as const,
  },
  {
    icon: "💳",
    title: "الزكاة والضريبة والجمارك",
    desc: "ملتزمون بنظام ضريبة القيمة المضافة وجميع المتطلبات الضريبية والزكوية الصادرة عن هيئة الزكاة والضريبة والجمارك.",
    accent: "gold" as const,
  },
  {
    icon: "🔐",
    title: "حماية البيانات الشخصية",
    desc: "نلتزم بنظام حماية البيانات الشخصية (PDPL) الصادر عن الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا) في جمع ومعالجة وتخزين البيانات.",
    accent: "green" as const,
  },
];

const certifications = [
  "ترخيص نشاط نقل البضائع من هيئة النقل العام",
  "شهادة السجل التجاري - سجل تجاري رقم ٤٠٣٠٤٦٧٥٥٣",
  "شهادة التسجيل في ضريبة القيمة المضافة",
  "شهادة الامتثال لنظام حماية البيانات الشخصية",
  "شهادة التأمين الشامل على المركبات والعمليات",
  "شهادة السلامة المهنية وبيئة العمل",
];

const dataProtection = [
  {
    title: "جمع البيانات",
    desc: "نجمع البيانات الشخصية بالحد الأدنى اللازم لتقديم خدماتنا، مع إعلام صاحب البيانات بالغرض من الجمع.",
  },
  {
    title: "معالجة البيانات",
    desc: "نعالج البيانات وفقاً للأغراض المحددة فقط ولا نستخدمها لأي أغراض أخرى دون موافقة صريحة.",
  },
  {
    title: "تخزين البيانات",
    desc: "نخزّن البيانات على خوادم آمنة داخل المملكة العربية السعودية مع تشفير كامل أثناء النقل والتخزين.",
  },
  {
    title: "حقوق أصحاب البيانات",
    desc: "نكفل حق الوصول والتصحيح والحذف والاعتراض لجميع أصحاب البيانات وفقاً لنظام حماية البيانات الشخصية.",
  },
];

export default function Compliance() {
  return (
    <main>
      <section className="fll-page-hero">
        <div className="fll-page-hero-content">
          <span className="fll-page-eyebrow fll-animate-in">الامتثال التنظيمي</span>
          <h1 className="fll-page-title fll-animate-in-1">الامتثال</h1>
          <p className="fll-page-subtitle fll-animate-in-2">
            نلتزم بجميع الأنظمة واللوائح المعمول بها في المملكة العربية السعودية ونسعى لتحقيق أعلى معايير الامتثال
          </p>
        </div>
      </section>

      <section className="fll-section">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <h2 className="fll-section-title">الإطار التنظيمي</h2>
            <p className="fll-section-desc">
              نعمل وفقاً لإطار تنظيمي شامل يغطي جميع جوانب عملياتنا
            </p>
          </div>
          <div className="fll-grid-2">
            {regulations.map((r, i) => (
              <div className={`fll-feature-card fll-animate-in-${i + 1}`} key={r.title}>
                <div className={`fll-feature-icon ${r.accent}`}>{r.icon}</div>
                <h3>{r.title}</h3>
                <p>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fll-section fll-section-alt">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <h2 className="fll-section-title">التراخيص والشهادات</h2>
            <p className="fll-section-desc">حاصلون على جميع التراخيص والشهادات اللازمة لممارسة نشاطنا</p>
          </div>
          <div className="fll-grid-2">
            {certifications.map((c, i) => (
              <div className={`fll-feature-card fll-animate-in-${(i % 6) + 1}`} key={i}>
                <p style={{ margin: 0, fontWeight: 600 }}>{c}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fll-section">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <h2 className="fll-section-title">حماية البيانات</h2>
            <p className="fll-section-desc">
              التزامنا بنظام حماية البيانات الشخصية (PDPL)
            </p>
          </div>
          <div className="fll-grid-2">
            {dataProtection.map((d, i) => (
              <div className={`fll-feature-card fll-animate-in-${i + 1}`} key={d.title}>
                <h3>{d.title}</h3>
                <p>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fll-cta-section">
        <div className="fll-section-inner" style={{ textAlign: "center" }}>
          <h2 className="fll-section-title">التزامنا المستمر بالامتثال</h2>
          <p className="fll-section-desc">
            نراجع سياساتنا وإجراءاتنا بشكل دوري لضمان التوافق مع أحدث الأنظمة واللوائح
          </p>
          <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/governance" className="fll-cta-btn">الحوكمة</Link>
            <Link to="/privacy" className="fll-cta-btn-outline">سياسة الخصوصية</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
