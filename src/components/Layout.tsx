import React, { useState, useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronLeft, MapPin, Mail, ExternalLink, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ROUTE_PATHS, CURRENT_YEAR } from "@/lib/index";
import { IMAGES } from "@/assets/images";
import { Button } from "@/components/ui/button";
interface LayoutProps {
  children: React.ReactNode;
}

/**
 * مكون التخطيط الرئيسي لموقع فيرست لاين لوجستيكس
 * يدعم اللغة العربية ونظام القراءة من اليمين إلى اليسار (RTL)
 */
export function Layout({
  children
}: LayoutProps) {
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

  // إغلاق قائمة الهاتف المحمول عند تغيير المسار
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);
  const navLinks = [{
    name: "الرئيسية",
    path: ROUTE_PATHS.HOME
  }, {
    name: "من نحن",
    path: ROUTE_PATHS.ABOUT
  }, {
    name: "خدماتنا",
    path: ROUTE_PATHS.SERVICES
  }, {
    name: "للمستثمرين",
    path: ROUTE_PATHS.INVESTORS
  }, {
    name: "انضم إلينا",
    path: ROUTE_PATHS.JOIN_US
  }];
  return <div dir="rtl" className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary font-sans">
      {/* رأس الصفحة (Header) */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? "first-line-header py-3 shadow-lg" : "bg-transparent py-5"}`}>
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <Link to={ROUTE_PATHS.HOME} className="flex items-center gap-3 group">
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold leading-none tracking-tight text-foreground xl:text-[32px]">
                First Line
              </span>
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] leading-tight mt-1">
                Logistics
              </span>
            </div>
            <div className="relative w-12 h-12 overflow-hidden rounded-lg bg-[#1a2e44]/80 flex items-center justify-center shadow-md">
              <img src="/images/first_line_correct_logos_1.jpg" alt="فيرست لاين لوجستيكس" className="w-10 h-10 object-contain transition-transform duration-500 group-hover:scale-110" />
            </div>
          </Link>

          {/* التنقل لسطح المكتب */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map(link => <NavLink key={link.path} to={link.path} className={({
            isActive
          }) => `text-sm font-semibold transition-colors hover:text-primary ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {link.name}
              </NavLink>)}
            <Button asChild variant="default" size="sm" className="rounded-full px-6 font-bold">
              <Link to={ROUTE_PATHS.CONTACT}>اتصل بنا</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-full px-5 font-bold gap-2">
              <Link to="/admin/login"><LogIn size={15} />تسجيل الدخول</Link>
            </Button>
          </nav>

          {/* زر قائمة الهاتف */}
          <button className="lg:hidden p-2 text-foreground hover:bg-muted rounded-md transition-colors" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="فتح القائمة">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* قائمة الهاتف المحمول */}
      <AnimatePresence>
        {isMobileMenuOpen && <motion.div initial={{
        opacity: 0,
        x: 50
      }} animate={{
        opacity: 1,
        x: 0
      }} exit={{
        opacity: 0,
        x: 50
      }} transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }} className="fixed inset-0 z-40 lg:hidden bg-background pt-28 px-6">
            <nav className="flex flex-col gap-6">
              {navLinks.map(link => <NavLink key={link.path} to={link.path} className={({
            isActive
          }) => `text-2xl font-bold transition-colors ${isActive ? "text-primary" : "text-foreground"}`}>
                  {link.name}
                </NavLink>)}
              <Button asChild variant="default" size="lg" className="mt-4 w-full rounded-xl font-bold text-lg">
                <Link to={ROUTE_PATHS.CONTACT}>تواصل معنا الآن</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full rounded-xl font-bold text-lg gap-2">
                <Link to="/admin/login"><LogIn size={18} />تسجيل الدخول</Link>
              </Button>
            </nav>

            <div className="absolute bottom-10 left-6 right-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3 font-medium">طبقة التنفيذ لاقتصاد التوصيل الرقمي</p>
              <div className="flex items-center gap-2 text-primary text-sm font-bold">
                <MapPin size={16} />
                <span>المملكة العربية السعودية · أكثر من 16 مدينة</span>
              </div>
            </div>
          </motion.div>}
      </AnimatePresence>

      {/* منطقة المحتوى الرئيسية */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} initial={{
          opacity: 0,
          y: 10
        }} animate={{
          opacity: 1,
          y: 0
        }} exit={{
          opacity: 0,
          y: -10
        }} transition={{
          duration: 0.3
        }}>
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* تذييل الصفحة (Footer) */}
      <footer className="bg-sidebar text-sidebar-foreground pt-24 pb-12 border-t border-sidebar-border">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 overflow-hidden rounded-lg bg-white/10 flex items-center justify-center shadow-lg">
                  <img src="/images/first_line_correct_logos_1.jpg" alt="First Line" className="w-10 h-10 object-contain" />
                </div>
                <span className="text-2xl font-bold tracking-tight">First Line</span>
              </div>
              <p className="text-sidebar-foreground/70 text-base leading-relaxed max-w-xs font-medium">
                مشغل لوجستي سعودي للطرف الثالث (3PL) لمنصات التوصيل، متخصص في إدارة الأساطيل والتنفيذ الميداني بكفاءة مؤسسية.
              </p>
              <div className="flex gap-4">
                <a href="#" className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/5 group">
                  <ExternalLink size={20} className="text-primary group-hover:scale-110 transition-transform" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-8 border-r-2 border-primary/30 pr-3">
                المنصة
              </h4>
              <ul className="space-y-4 text-base font-medium">
                <li><Link to={ROUTE_PATHS.ABOUT} className="hover:text-primary transition-colors flex items-center gap-2">من نحن</Link></li>
                <li><Link to={ROUTE_PATHS.PLATFORMS} className="hover:text-primary transition-colors flex items-center gap-2">للمنصات</Link></li>
                <li><Link to={ROUTE_PATHS.GOVERNANCE} className="hover:text-primary transition-colors flex items-center gap-2">الحوكمة والامتثال</Link></li>
                <li><Link to={ROUTE_PATHS.INVESTORS} className="hover:text-primary transition-colors flex items-center gap-2">علاقات المستثمرين</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-8 border-r-2 border-primary/30 pr-3">
                الفرص
              </h4>
              <ul className="space-y-4 text-base font-medium">
                <li><Link to={ROUTE_PATHS.JOIN_US} className="hover:text-primary transition-colors">سجل كقائد مركبة</Link></li>
                <li><Link to={ROUTE_PATHS.JOIN_US} className="hover:text-primary transition-colors">شراكات الأساطيل</Link></li>
                <li><Link to={ROUTE_PATHS.CONTACT} className="hover:text-primary transition-colors">الاستفسارات المهنية</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-8 border-r-2 border-primary/30 pr-3">
                المركز الإقليمي
              </h4>
              <ul className="space-y-6 text-base text-sidebar-foreground/70 font-medium">
                <li className="flex gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>جدة، المملكة العربية السعودية</span>
                </li>
                <li className="flex gap-3">
                  <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>info@firstlinelog.com</span>
                </li>
                <li>
                  <Button asChild variant="outline" className="mt-2 border-white/10 hover:bg-white/5 w-full justify-between px-6">
                    
                  </Button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-10 border-t border-sidebar-border/50 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col gap-2 items-center md:items-start">
              <p className="text-xs text-sidebar-foreground/50 font-bold">
                &copy; {CURRENT_YEAR} First Line Logistics | جدة، المملكة العربية السعودية. جميع الحقوق محفوظة.
              </p>
              <p className="text-[10px] text-sidebar-foreground/30 font-medium">
                مصادر البيانات: أبحاث السوق · البيانات التشغيلية لفيرست لاين لوجستيكس
              </p>
            </div>
            
            <div className="flex gap-8 text-[11px] uppercase tracking-wider text-sidebar-foreground/40 font-black">
              <a href="#" className="hover:text-primary transition-colors">سياسة الخصوصية</a>
              <a href="#" className="hover:text-primary transition-colors">شروط الخدمة</a>
              <a href="#" className="hover:text-primary transition-colors">الامتثال</a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* علامة مائية للشعار */}
      <div className="company-logo-watermark" />
    </div>;
}