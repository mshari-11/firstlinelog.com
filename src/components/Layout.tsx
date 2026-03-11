/**
 * Public site layout — Header + Footer + page content
 * Aesthetic: "Midnight Operations" — deep navy command center with teal signal lines
 * Font: IBM Plex Sans Arabic + Plus Jakarta Sans (display) + JetBrains Mono (data)
 */
import { type ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { label: "الرئيسية", path: "/" },
  { label: "من نحن", path: "/about" },
  { label: "خدماتنا", path: "/services" },
  { label: "للمنصات", path: "/for-platforms" },
  { label: "المستثمرين", path: "/investors" },
  { label: "الحوكمة", path: "/governance" },
  { label: "الأخبار", path: "/news" },
  { label: "انضم إلينا", path: "/join-us" },
  { label: "اتصل بنا", path: "/contact" },
];

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div dir="rtl" className="fll-public-site">
      {/* ── HEADER ── */}
      <header className="fll-pub-header">
        <div className="fll-pub-header-inner">
          {/* Logo */}
          <Link to="/" className="fll-pub-logo-link">
            <img
              src="/public/images/first_line_professional_english_1.png"
              alt="First Line Logistics"
              className="fll-pub-logo-img"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </Link>

          {/* Desktop nav */}
          <nav className="fll-pub-nav-desktop">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`fll-pub-nav-link ${location.pathname === item.path ? "active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA + Mobile toggle */}
          <div className="fll-pub-header-actions">
            <Link to="/unified-login" className="fll-pub-login-btn">
              تسجيل الدخول
            </Link>
            <button
              className="fll-pub-mobile-toggle"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="القائمة"
            >
              <span className={`fll-pub-hamburger ${mobileOpen ? "open" : ""}`} />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="fll-pub-nav-mobile">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`fll-pub-nav-mobile-link ${location.pathname === item.path ? "active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/unified-login"
              className="fll-pub-nav-mobile-link cta"
              onClick={() => setMobileOpen(false)}
            >
              تسجيل الدخول
            </Link>
          </nav>
        )}
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="fll-pub-main">{children}</main>

      {/* ── FOOTER ── */}
      <footer className="fll-pub-footer">
        <div className="fll-pub-footer-inner">
          {/* Brand column */}
          <div className="fll-pub-footer-brand">
            <img
              src="/public/images/first_line_professional_english_1.png"
              alt="FLL"
              className="fll-pub-footer-logo"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <p className="fll-pub-footer-tagline">
              طبقة التنفيذ لاقتصاد التوصيل الرقمي
            </p>
            <p className="fll-pub-footer-desc">
              شركة سعودية متخصصة في خدمات الطرف الثالث للميل الأخير لمنصات
              التوصيل. نربط المنصات بأسطول سائقين محترفين عبر تقنية متقدمة.
            </p>
          </div>

          {/* Links columns */}
          <div className="fll-pub-footer-links-grid">
            <div>
              <h4 className="fll-pub-footer-col-title">الشركة</h4>
              <Link to="/about">من نحن</Link>
              <Link to="/team">فريق العمل</Link>
              <Link to="/governance">الحوكمة</Link>
              <Link to="/investors">المستثمرين</Link>
              <Link to="/news">الأخبار</Link>
            </div>
            <div>
              <h4 className="fll-pub-footer-col-title">الخدمات</h4>
              <Link to="/services">جميع الخدمات</Link>
              <Link to="/for-platforms">للمنصات</Link>
              <Link to="/join-us">انضم كسائق</Link>
              <Link to="/contact">اتصل بنا</Link>
            </div>
            <div>
              <h4 className="fll-pub-footer-col-title">قانوني</h4>
              <Link to="/privacy">سياسة الخصوصية</Link>
              <Link to="/terms">الشروط والأحكام</Link>
              <Link to="/compliance">الامتثال</Link>
              <Link to="/faq">الأسئلة الشائعة</Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="fll-pub-footer-bottom">
          <p>&copy; {new Date().getFullYear()} فيرست لاين لوجستيكس. جميع الحقوق محفوظة.</p>
          <p className="fll-pub-footer-cr">سجل تجاري: 4030467553 — المملكة العربية السعودية</p>
        </div>
      </footer>
    </div>
  );
}
