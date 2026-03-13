import { useState } from "react";
import { Link } from "react-router-dom";

interface FAQItem {
  q: string;
  a: string;
}

const faqs: FAQItem[] = [
  {
    q: "كيف يمكنني الانضمام كسائق توصيل؟",
    a: "يمكنك التسجيل من خلال صفحة التسجيل على موقعنا أو تطبيق السائق. ستحتاج إلى تقديم صورة من الهوية الوطنية أو الإقامة، رخصة القيادة السارية، وصورة شخصية. بعد مراجعة طلبك والموافقة عليه خلال ٤٨ ساعة، ستتمكن من بدء العمل فوراً بعد إكمال التدريب التأهيلي.",
  },
  {
    q: "متى يتم صرف المستحقات المالية؟",
    a: "يتم صرف المستحقات المالية للسائقين بشكل أسبوعي كل يوم أحد. يمكنك متابعة أرباحك اليومية من خلال محفظتك في التطبيق. كما نوفر خيار السحب الفوري للمبالغ المتاحة في حالات معينة.",
  },
  {
    q: "ما هي المدن التي تغطيها فيرست لاين؟",
    a: "نعمل حالياً في أكثر من ١٥ مدينة تشمل: جدة، الرياض، مكة المكرمة، المدينة المنورة، الدمام، الخبر، الظهران، الطائف، تبوك، أبها، جازان، نجران، حائل، بريدة، والمزيد. ونتوسع باستمرار لتغطية مدن جديدة.",
  },
  {
    q: "كيف يمكن لمنصتنا الشراكة مع فيرست لاين؟",
    a: "نرحب بالشراكة مع جميع منصات التوصيل. يمكنك التواصل معنا من خلال صفحة التواصل أو إرسال بريد إلكتروني إلى partnerships@firstlinelog.com. سيتواصل معك فريق الشراكات خلال ٢٤ ساعة لمناقشة التفاصيل وتصميم خطة تشغيلية مخصصة.",
  },
  {
    q: "ما هي متطلبات المركبة للعمل كسائق؟",
    a: "نقبل أنواع متعددة من المركبات حسب نوع الخدمة: دراجات نارية للتوصيل السريع، سيارات سيدان للطلبات المتوسطة، وسيارات فان للطلبات الكبيرة. يجب أن تكون المركبة بحالة جيدة وتملك فحص دوري ساري المفعول وتأمين شامل.",
  },
  {
    q: "هل توفرون تأميناً صحياً للسائقين؟",
    a: "نعم، نوفر تأميناً صحياً شاملاً لجميع السائقين المتفرغين يغطي الحالات الطارئة والفحوصات الدورية. كما نوفر تأميناً ضد حوادث العمل لجميع السائقين بما في ذلك العاملين بدوام جزئي.",
  },
  {
    q: "كيف يتم حساب أرباح السائق؟",
    a: "تُحسب أرباح السائق بناءً على عدة عوامل تشمل: عدد الطلبات المنجزة، المسافة المقطوعة، أوقات الذروة، ونوع الخدمة. كما نقدم حوافز إضافية للأداء المتميز ومكافآت أسبوعية وشهرية للسائقين الأكثر نشاطاً.",
  },
  {
    q: "ما هي سياسة فيرست لاين تجاه حماية البيانات؟",
    a: "نلتزم بأعلى معايير حماية البيانات وفقاً لنظام حماية البيانات الشخصية في المملكة العربية السعودية. جميع البيانات مشفّرة ومحمية، ولا نشارك أي معلومات شخصية مع أطراف ثالثة دون موافقة صريحة. يمكنك الاطلاع على سياسة الخصوصية الكاملة.",
  },
  {
    q: "هل يمكنني العمل مع أكثر من منصة في نفس الوقت؟",
    a: "نعم، يمكنك العمل مع عدة منصات من خلال فيرست لاين. نظامنا يدير الطلبات من جميع المنصات الشريكة ويوزعها بذكاء لتحقيق أقصى كفاءة وأعلى دخل ممكن لك.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <main>
      <section className="fll-page-hero">
        <div className="fll-page-hero-content">
          <span className="fll-page-eyebrow fll-animate-in">مركز المساعدة</span>
          <h1 className="fll-page-title fll-animate-in-1">الأسئلة الشائعة</h1>
          <p className="fll-page-subtitle fll-animate-in-2">
            إجابات على أكثر الأسئلة شيوعاً حول خدماتنا وطريقة العمل معنا
          </p>
        </div>
      </section>

      <section className="fll-section">
        <div className="fll-section-inner" style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="fll-feature-card fll-animate-in"
                style={{ cursor: "pointer", transition: "all 0.3s ease" }}
                onClick={() => toggle(i)}
                onKeyDown={(e) => e.key === "Enter" && toggle(i)}
                role="button"
                tabIndex={0}
                aria-expanded={openIndex === i}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "1rem",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: "1.05rem", flex: 1 }}>{faq.q}</h3>
                  <span
                    style={{
                      color: "#38bdf8",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      transition: "transform 0.3s ease",
                      transform: openIndex === i ? "rotate(45deg)" : "rotate(0deg)",
                      flexShrink: 0,
                    }}
                  >
                    +
                  </span>
                </div>
                {openIndex === i && (
                  <p
                    style={{
                      marginTop: "1rem",
                      marginBottom: 0,
                      color: "#cbd5e1",
                      lineHeight: 1.8,
                      borderTop: "1px solid rgba(56, 189, 248, 0.15)",
                      paddingTop: "1rem",
                    }}
                  >
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="fll-cta-section">
        <div className="fll-section-inner" style={{ textAlign: "center" }}>
          <h2 className="fll-section-title">لم تجد إجابة لسؤالك؟</h2>
          <p className="fll-section-desc">
            فريق الدعم جاهز لمساعدتك والإجابة على جميع استفساراتك
          </p>
          <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/contact" className="fll-cta-btn">تواصل معنا</Link>
            <Link to="/join" className="fll-cta-btn-outline">انضم كسائق</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
