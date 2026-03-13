/**
 * FLL Contact Page — "Midnight Operations" aesthetic
 * Arabic RTL, dark theme with teal (#38bdf8) accents.
 */
import { useState } from "react";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.85rem 1rem",
  backgroundColor: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "0.625rem",
  color: "#e2e8f0",
  fontSize: "1rem",
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.25s, box-shadow 0.25s",
  direction: "rtl" as const,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "0.4rem",
  fontSize: "0.92rem",
  fontWeight: 600,
  color: "#94a3b8",
};

const CONTACT_CARDS = [
  {
    icon: "✉️",
    title: "البريد الإلكتروني",
    value: "support@fll.sa",
    link: "mailto:support@fll.sa",
  },
  {
    icon: "📞",
    title: "الهاتف",
    value: "+966-XX-XXX-XXXX",
    link: "tel:+966XXXXXXXX",
  },
  {
    icon: "📍",
    title: "المقر الرئيسي",
    value: "جدة، المملكة العربية السعودية",
    link: undefined,
  },
];

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [focused, setFocused] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const getFocusedStyle = (field: string): React.CSSProperties =>
    focused === field
      ? { borderColor: "#38bdf8", boxShadow: "0 0 0 3px rgba(56,189,248,0.18)" }
      : {};

  return (
    <>
      {/* ═══════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════ */}
      <section className="fll-page-hero">
        <div className="fll-page-hero-content">
          <div className="fll-page-eyebrow fll-animate-in fll-animate-in-1">
            تواصل معنا
          </div>
          <h1 className="fll-page-title fll-animate-in fll-animate-in-2">
            نحن هنا لمساعدتك
          </h1>
          <p className="fll-page-subtitle fll-animate-in fll-animate-in-3">
            فريق فيرست لاين لوجستيكس جاهز للإجابة على استفساراتك ودعم أعمالك في كل خطوة
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CONTACT INFO CARDS
          ═══════════════════════════════════════════ */}
      <section className="fll-section">
        <div className="fll-section-inner">
          <div className="fll-grid-3">
            {CONTACT_CARDS.map((card, i) => (
              <div
                key={card.title}
                className={`fll-feature-card fll-animate-in fll-animate-in-${i + 1}`}
                style={{ textAlign: "center" }}
              >
                <div className="fll-feature-icon">{card.icon}</div>
                <h3 style={{ color: "#38bdf8", fontSize: "1.15rem", marginBottom: "0.5rem" }}>
                  {card.title}
                </h3>
                {card.link ? (
                  <a
                    href={card.link}
                    style={{
                      color: "#e2e8f0",
                      textDecoration: "none",
                      fontSize: "1.05rem",
                      direction: "ltr",
                      unicodeBidi: "embed",
                    }}
                  >
                    {card.value}
                  </a>
                ) : (
                  <p style={{ color: "#e2e8f0", fontSize: "1.05rem", margin: 0 }}>
                    {card.value}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CONTACT FORM
          ═══════════════════════════════════════════ */}
      <section className="fll-section fll-section-alt">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <h2 className="fll-section-title">أرسل لنا رسالة</h2>
            <p className="fll-section-desc">
              املأ النموذج أدناه وسنعود إليك في أقرب وقت ممكن
            </p>
          </div>

          <form
            onSubmit={(e) => e.preventDefault()}
            style={{ maxWidth: "720px", margin: "0 auto" }}
          >
            <div className="fll-grid-2" style={{ marginBottom: "1.25rem" }}>
              {/* الاسم الكامل */}
              <div>
                <label style={labelStyle} htmlFor="contact-name">
                  الاسم الكامل
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  placeholder="أدخل اسمك الكامل"
                  value={form.name}
                  onChange={handleChange}
                  onFocus={() => setFocused("name")}
                  onBlur={() => setFocused(null)}
                  style={{ ...inputStyle, ...getFocusedStyle("name") }}
                />
              </div>

              {/* البريد الإلكتروني */}
              <div>
                <label style={labelStyle} htmlFor="contact-email">
                  البريد الإلكتروني
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  placeholder="example@email.com"
                  value={form.email}
                  onChange={handleChange}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  style={{
                    ...inputStyle,
                    direction: "ltr",
                    textAlign: "right",
                    ...getFocusedStyle("email"),
                  }}
                />
              </div>
            </div>

            <div className="fll-grid-2" style={{ marginBottom: "1.25rem" }}>
              {/* رقم الجوال */}
              <div>
                <label style={labelStyle} htmlFor="contact-phone">
                  رقم الجوال
                </label>
                <input
                  id="contact-phone"
                  name="phone"
                  type="tel"
                  placeholder="+966-5X-XXX-XXXX"
                  value={form.phone}
                  onChange={handleChange}
                  onFocus={() => setFocused("phone")}
                  onBlur={() => setFocused(null)}
                  style={{
                    ...inputStyle,
                    direction: "ltr",
                    textAlign: "right",
                    ...getFocusedStyle("phone"),
                  }}
                />
              </div>

              {/* الموضوع */}
              <div>
                <label style={labelStyle} htmlFor="contact-subject">
                  الموضوع
                </label>
                <select
                  id="contact-subject"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  onFocus={() => setFocused("subject")}
                  onBlur={() => setFocused(null)}
                  style={{
                    ...inputStyle,
                    appearance: "none",
                    cursor: "pointer",
                    ...getFocusedStyle("subject"),
                  }}
                >
                  <option value="" style={{ background: "#0f172a" }}>
                    اختر الموضوع
                  </option>
                  <option value="partnership" style={{ background: "#0f172a" }}>
                    شراكة تجارية
                  </option>
                  <option value="support" style={{ background: "#0f172a" }}>
                    دعم فني
                  </option>
                  <option value="finance" style={{ background: "#0f172a" }}>
                    استفسار مالي
                  </option>
                  <option value="careers" style={{ background: "#0f172a" }}>
                    التوظيف
                  </option>
                  <option value="other" style={{ background: "#0f172a" }}>
                    أخرى
                  </option>
                </select>
              </div>
            </div>

            {/* الرسالة */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={labelStyle} htmlFor="contact-message">
                الرسالة
              </label>
              <textarea
                id="contact-message"
                name="message"
                rows={6}
                placeholder="اكتب رسالتك هنا..."
                value={form.message}
                onChange={handleChange}
                onFocus={() => setFocused("message")}
                onBlur={() => setFocused(null)}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  ...getFocusedStyle("message"),
                }}
              />
            </div>

            <div style={{ textAlign: "center" }}>
              <button type="submit" className="fll-cta-btn">
                إرسال الرسالة
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          OFFICE / MAP PLACEHOLDER
          ═══════════════════════════════════════════ */}
      <section className="fll-section">
        <div className="fll-section-inner">
          <div className="fll-section-header">
            <h2 className="fll-section-title">موقعنا</h2>
            <p className="fll-section-desc">
              المقر الرئيسي لفيرست لاين لوجستيكس في مدينة جدة
            </p>
          </div>

          <div
            className="fll-feature-card fll-animate-in fll-animate-in-1"
            style={{
              maxWidth: "900px",
              margin: "0 auto",
              padding: "2.5rem 2rem",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏢</div>
            <h3
              style={{
                color: "#38bdf8",
                fontSize: "1.35rem",
                marginBottom: "1rem",
              }}
            >
              فيرست لاين لوجستيكس
            </h3>
            <div
              style={{
                display: "grid",
                gap: "0.75rem",
                maxWidth: "400px",
                margin: "0 auto",
                color: "#cbd5e1",
                fontSize: "1rem",
                lineHeight: 1.8,
              }}
            >
              <p style={{ margin: 0 }}>📍 جدة، المملكة العربية السعودية</p>
              <p style={{ margin: 0 }}>🕐 الأحد – الخميس: ٩:٠٠ ص – ٦:٠٠ م</p>
              <p style={{ margin: 0 }}>📧 support@fll.sa</p>
              <p style={{ margin: 0, direction: "ltr", unicodeBidi: "embed" }}>
                📞 +966-XX-XXX-XXXX
              </p>
            </div>

            {/* Map placeholder */}
            <div
              style={{
                marginTop: "2rem",
                height: "260px",
                borderRadius: "0.75rem",
                background:
                  "linear-gradient(135deg, rgba(56,189,248,0.08) 0%, rgba(15,23,42,0.6) 100%)",
                border: "1px solid rgba(56,189,248,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748b",
                fontSize: "1rem",
              }}
            >
              <span>🗺️ خريطة الموقع — سيتم إضافتها قريباً</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
