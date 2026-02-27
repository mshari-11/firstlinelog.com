/**
 * الشريط الجانبي لوحة الإدارة - بهوية فيرست لاين
 */
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/admin/auth";
import {
  LayoutDashboard, Users, FileSpreadsheet, ClipboardList,
  MessageSquare, DollarSign, Settings, LogOut, ChevronRight,
  Bell, Car, Building2, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "الرئيسية", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "المناديب", icon: Users, path: "/admin/couriers" },
  { label: "الطلبات", icon: ClipboardList, path: "/admin/orders" },
  { label: "استيراد Excel", icon: FileSpreadsheet, path: "/admin/excel" },
  { label: "الرواتب والمالية", icon: DollarSign, path: "/admin/finance" },
  { label: "الشكاوى والطلبات", icon: MessageSquare, path: "/admin/complaints" },
  { label: "التقارير", icon: BarChart3, path: "/admin/reports" },
  { label: "المركبات", icon: Car, path: "/admin/vehicles" },
  { label: "الأقسام والموظفين", icon: Building2, path: "/admin/staff" },
  { label: "الإعدادات", icon: Settings, path: "/admin/settings" },
];

// ألوان هوية فيرست لاين
const C = {
  bg: "oklch(0.12 0.06 220)",
  bgCard: "oklch(0.16 0.05 220 / 0.6)",
  border: "1px solid oklch(0.22 0.05 210 / 0.5)",
  cyan: "oklch(0.65 0.18 200)",
  cyanBg: "oklch(0.60 0.18 200 / 0.12)",
  textPrimary: "oklch(0.92 0.02 220)",
  textMuted: "oklch(0.55 0.06 210)",
  textNav: "oklch(0.60 0.04 220)",
  hover: "oklch(0.18 0.05 220)",
};

export function AdminSidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/admin/login");
  }

  const roleLabel: Record<string, string> = {
    admin: "مدير النظام",
    owner: "المالك",
    staff: "موظف",
    courier: "مندوب",
  };

  return (
    <aside
      className="fixed right-0 top-0 h-full w-64 flex flex-col z-50"
      dir="rtl"
      style={{ background: C.bg, borderLeft: C.border }}
    >
      {/* الشعار */}
      <div className="p-5" style={{ borderBottom: C.border }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "oklch(0.20 0.09 220)" }}
          >
            <img
              src="/images/first_line_professional_english_1.png"
              alt="FL"
              className="w-8 h-8 object-contain opacity-90"
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                el.style.display = "none";
                el.parentElement!.innerHTML = '<span style="color:oklch(0.65 0.18 200);font-weight:700;font-size:13px">FL</span>';
              }}
            />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: C.textPrimary }}>فيرست لاين</p>
            <p className="text-xs" style={{ color: C.textMuted }}>لوحة الإدارة</p>
          </div>
        </div>
      </div>

      {/* القائمة */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) =>
              isActive
                ? { background: C.cyanBg, color: C.cyan, fontWeight: 600, display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "12px", fontSize: "14px", transition: "all 0.15s" }
                : { color: C.textNav, display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "12px", fontSize: "14px", transition: "all 0.15s" }
            }
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              if (!el.style.fontWeight || el.style.fontWeight !== "600") {
                el.style.background = C.hover;
                el.style.color = C.textPrimary;
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              if (el.style.fontWeight !== "600") {
                el.style.background = "transparent";
                el.style.color = C.textNav;
              }
            }}
          >
            <item.icon size={18} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{item.label}</span>
            <ChevronRight size={14} style={{ opacity: 0.3, transform: "rotate(180deg)" }} />
          </NavLink>
        ))}
      </nav>

      {/* أسفل السايدبار */}
      <div className="p-3 space-y-2" style={{ borderTop: C.border }}>
        {/* التنبيهات */}
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
          style={{ color: C.textNav }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = C.hover;
            (e.currentTarget as HTMLElement).style.color = C.textPrimary;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = C.textNav;
          }}
        >
          <Bell size={18} />
          <span>التنبيهات</span>
          <span
            className="mr-auto text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
            style={{ background: C.cyan, color: "oklch(0.10 0.08 220)" }}
          >
            3
          </span>
        </button>

        {/* المستخدم */}
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          style={{ background: C.bgCard }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, oklch(0.65 0.18 200), oklch(0.45 0.15 220))" }}
          >
            <span className="text-xs font-bold" style={{ color: "oklch(0.10 0.08 220)" }}>
              {user?.full_name?.charAt(0) || "م"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: C.textPrimary }}>
              {user?.full_name || "المدير"}
            </p>
            <p className="text-xs" style={{ color: C.textMuted }}>
              {roleLabel[user?.role || "admin"]}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1 rounded-lg transition-all"
            style={{ color: "oklch(0.50 0.04 220)" }}
            title="تسجيل الخروج"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "oklch(0.65 0.20 25)";
              (e.currentTarget as HTMLElement).style.background = "oklch(0.55 0.20 25 / 0.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "oklch(0.50 0.04 220)";
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
