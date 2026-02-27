/**
 * تخطيط لوحة تحكم السائق - Driver Layout
 * FirstLine Logistics
 */
import { useState } from "react";
import { NavLink, Link, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Wallet,
  User,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  Bell,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ROUTE_PATHS } from "@/lib/index";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const driverNavLinks = [
  { name: "الرئيسية", path: ROUTE_PATHS.DRIVER, icon: LayoutDashboard, end: true },
  { name: "طلباتي", path: ROUTE_PATHS.DRIVER_ORDERS, icon: Package, badge: "3" },
  { name: "أرباحي", path: ROUTE_PATHS.DRIVER_EARNINGS, icon: Wallet },
  { name: "حسابي", path: ROUTE_PATHS.DRIVER_PROFILE, icon: User },
];

export function DriverLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTE_PATHS.HOME);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-muted/30 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-sidebar text-sidebar-foreground border-l border-sidebar-border">
        <div className="flex items-center gap-3 h-16 px-6 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">FL</span>
          </div>
          <div>
            <p className="font-bold text-sm leading-none">First Line</p>
            <p className="text-[10px] text-sidebar-foreground/60 font-medium">لوحة السائق</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {driverNavLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`
              }
            >
              <link.icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{link.name}</span>
              {link.badge && (
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                  {link.badge}
                </Badge>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
              {user?.name?.[0] || "س"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name || "سائق"}</p>
              <p className="text-xs text-sidebar-foreground/50">قائد مركبة</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/60 hover:text-red-400"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: 100 }}
              animate={{ x: 0 }}
              exit={{ x: 100 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 right-0 z-50 w-64 bg-sidebar text-sidebar-foreground lg:hidden"
            >
              <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">FL</span>
                  </div>
                  <p className="font-bold text-sm">لوحة السائق</p>
                </div>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="px-3 py-4 space-y-1">
                {driverNavLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    end={link.end}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive ? "bg-emerald-500 text-white" : "text-sidebar-foreground/70 hover:bg-sidebar-accent"
                      }`
                    }
                  >
                    <link.icon className="w-5 h-5" />
                    <span>{link.name}</span>
                  </NavLink>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:mr-64">
        <header className="sticky top-0 z-30 h-16 bg-background/95 backdrop-blur border-b border-border flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 hover:bg-muted rounded-lg" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <Link
              to={ROUTE_PATHS.HOME}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4 rotate-180" />
              العودة للموقع
            </Link>
          </div>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
          </Button>
        </header>
        <main className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
