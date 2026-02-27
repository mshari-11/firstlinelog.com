import React, { useState, useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronLeft, MapPin, Mail, ExternalLink, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ROUTE_PATHS, CURRENT_YEAR } from "@/lib/index";
import { IMAGES } from "@/assets/images";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { name: "الرئيسية", path: ROUTE_PATHS.HOME },
    { name: "من نحن", path: ROUTE_PATHS.ABOUT },
    { name: "خدماتنا", path: ROUTE_PATHS.SERVICES },
    { name: "الأخبار", path: ROUTE_PATHS.NEWS },
    { name: "المستثمرين", path: ROUTE_PATHS.INVESTORS },
    { name: "اتصل بنا", path: ROUTE_PATHS.CONTACT },
  ];

  return (
    <div dir="rtl" className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary font-sans">
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? "first-line-header py-3 shadow-lg bg-primary" : "bg-primary py-5"}`}>
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <Link to={ROUTE_PATHS.HOME} className="flex items-center gap-3 group">
            <div className="relative w-14 h-14 overflow-hidden rounded-lg bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <img src="/images/logo.webp" alt="فيرست لاين لوجستيكس" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold leading-none tracking-tight text-white">First Line</span>
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-[0.2em] leading-tight">LOGISTICS</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink key={link.path} to={link.path} className={({ isActive }) => `font-semibold transition-colors hover:text-primary ${isActive ? "text-white" : "text-white"}`}>
                {link.name}
              </NavLink>
            ))}
            <a href="https://www.fll.sa" className="font-semibold text-white hover:text-primary transition-colors">EN</a>
            <div className="relative group">
              <Button variant="outline" size="sm" className="rounded-full px-5 font-bold border-white/30 text-white hover:bg-white/10 flex items-center gap-1.5">
                <span>دخول</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M6 8L1 3h10L6 8z" /></svg>
              </Button>
              <div className="absolute left-0 top-full mt-2 w-44 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-gray-900 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <Link to="/unified-login?role=admin" className="flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors border-b border-white/5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                  دخول الإدارة
                </Link>
                <Link to="/unified-login?role=staff" className="flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors border-b border-white/5">
                  <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                  دخول الموظفين
                </Link>
                <Link to="/login?role=driver" className="flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors">
                  <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                  دخول المندوبين
                </Link>
              </div>
            </div>
          </nav>

          <button className="lg:hidden p-2 text-foreground hover:bg-muted rounded-md transition-colors" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="فتح القائمة">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="fixed inset-0 z-40 lg:hidden bg-background pt-28 px-6">
            <nav className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <NavLink key={link.path} to={link.path} className={({ isActive }) => `text-2xl font-bold transition-colors ${isActive ? "text-primary" : "text-foreground"}`}>
                  {link.name}
                </NavLink>
              ))}
              <div className="flex flex-col gap-2 mt-2 border-t border-border pt-4">
                <p className="text-sm text-muted-foreground font-medium">تسجيل الدخول</p>
                <Link to="/unified-login?role=admin" className="flex items-center gap-2 text-lg font-semibold text-foreground hover:text-primary transition-colors">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
                  دخول الإدارة
                </Link>
                <Link to="/unified-login?role=staff" className="flex items-center gap-2 text-lg font-semibold text-foreground hover:text-primary transition-colors">
                  <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                  دخول الموظفين
                </Link>
                <Link to="/login?role=driver" className="flex items-center gap-2 text-lg font-semibold text-foreground hover:text-primary transition-colors">
                  <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                  دخول المندوبين
                </Link>
              </div>
              <Button asChild variant="default" size="lg" className="mt-4 w-full rounded-xl font-bold text-lg">
                <Link to={ROUTE_PATHS.CONTACT}>تواصل معنا الآن</Link>
              </Button>
            </nav>
            <div className="absolute bottom-10 left-6 right-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3 font-medium">طبقة التنفيذ لاقتصاد التوصيل الرقمي</p>
              <div className="flex items-center gap-2 text-primary text-sm font-bold">
                <MapPin size={16} />
                <span>المملكة العربية السعودية · أكثر من 16 مدينة</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="bg-sidebar text-sidebar-foreground pt-24 pb-12 border-t border-sidebar-border">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 overflow-hidden rounded-lg bg-white/10 flex items-center justify-center shadow-lg">
                  <img src="/images/logo.webp" alt="First Line" className="w-full h-12 object-cover" />
                </div>
                <span className="text-2xl font-bold tracking-tight">First Line</span>
              </div>
              <p className="text-sidebar-foreground/70 text-base leading-relaxed max-w-xs font-medium">مشغل لوجستي سعودي للطرف الثالث (3PL) لمنصات التوصيل، متخصص في إدارة الأساطيل والتنفيذ الميداني بكفاءة مؤسسية.</p>
              <div className="flex gap-4">
                <a href="#" className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/5 group">
                  <ExternalLink size={20} className="text-primary group-hover:scale-110 transition-transform" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-8 border-r-2 border-primary/30 pr-3">المنصة</h4>
              <ul className="space-y-4 text-base font-medium">
                <li><Link to={ROUTE_PATHS.ABOUT} className="hover:text-primary transition-colors flex items-center gap-2">من نحن</Link></li>
                <li><Link to={ROUTE_PATHS.SERVICES} className="hover:text-primary transition-colors flex items-center gap-2">خدماتنا</Link></li>
                <li><Link to={ROUTE_PATHS.ABOUT} className="hover:text-primary transition-colors flex items-center gap-2">الأخبار</Link></li>
                <li><Link to={ROUTE_PATHS.INVESTORS} className="hover:text-primary transition-colors flex items-center gap-2">المستثمرين</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-8 border-r-2 border-primary/30 pr-3">الفرص</h4>
              <ul className="space-y-4 text-base font-medium">
                <li><Link to={ROUTE_PATHS.JOIN_US} className="hover:text-primary transition-colors">سجل كقائد مركبة</Link></li>
                <li><Link to={ROUTE_PATHS.JOIN_US} className="hover:text-primary transition-colors">شراكات الأساطيل</Link></li>
                <li><Link to={ROUTE_PATHS.CONTACT} className="hover:text-primary transition-colors">الاستفسارات المهنية</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-8 border-r-2 border-primary/30 pr-3">التواصل</h4>
              <div className="space-y-4 text-base font-medium">
                <div className="flex items-center gap-3">
                  <Mail className="text-primary flex-shrink-0" />
                  <a href="mailto:info@firstlinelog.com" className="hover:text-primary transition-colors">info@firstlinelog.com</a>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="text-primary flex-shrink-0" />
                  <span>جدة، المملكة العربية السعودية</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-sidebar-border pt-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-sm text-sidebar-foreground/60 font-medium">&copy; {CURRENT_YEAR} الخط الأول للخدمات اللوجستية. جميع الحقوق محفوظة.</div>
              <div className="flex items-center gap-6 text-sm font-medium">
                <Link to="#" className="hover:text-primary transition-colors">سياسة الخصوصية</Link>
                <Link to="#" className="hover:text-primary transition-colors">شروط الاستخدام</Link>
                <Link to="#" className="hover:text-primary transition-colors">الامتثال والحوكمة</Link>
                <a href="#" className="hover:text-primary transition-colors flex items-center gap-2">
                  <Globe size={16} />
                  English
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
      <div className="company-logo-watermark" />
    </div>
  );
}
