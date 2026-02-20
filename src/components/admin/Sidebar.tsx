/**
 * الشريط الجانبي لوحة الإدارة
 */
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/admin/auth";
import {
  LayoutDashboard, Users, FileSpreadsheet, ClipboardList,
  MessageSquare, DollarSign, Settings, LogOut, ChevronRight,
  Bell, Car, Building2
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "الرئيسية", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "المناديب", icon: Users, path: "/admin/couriers" },
  { label: "الطلبات", icon: ClipboardList, path: "/admin/orders" },
  { label: "استيراد Excel", icon: FileSpreadsheet, path: "/admin/excel" },
  { label: "الرواتب والمالية", icon: DollarSign, path: "/admin/finance" },
  { label: "الشكاوى والطلبات", icon: MessageSquare, path: "/admin/complaints" },
  { label: "المركبات", icon: Car, path: "/admin/vehicles" },
  { label: "الأقسام والموظفين", icon: Building2, path: "/admin/staff" },
  { label: "الإعدادات", icon: Settings, path: "/admin/settings" },
];

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
    <aside className="fixed right-0 top-0 h-full w-64 bg-slate-900 border-l border-slate-800 flex flex-col z-50" dir="rtl">
      {/* الشعار */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">FL</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">فيرست لاين</p>
            <p className="text-slate-500 text-xs">لوحة الإدارة</p>
          </div>
        </div>
      </div>

      {/* القائمة */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group",
                isActive
                  ? "bg-orange-500/15 text-orange-400 font-medium"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              )
            }
          >
            <item.icon size={18} className="shrink-0" />
            <span className="flex-1">{item.label}</span>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-50 -rotate-180 transition-all" />
          </NavLink>
        ))}
      </nav>

      {/* معلومات المستخدم */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        {/* التنبيهات */}
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 text-sm transition-all">
          <Bell size={18} />
          <span>التنبيهات</span>
          <span className="mr-auto bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">3</span>
        </button>

        {/* المستخدم */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/50">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">
              {user?.full_name?.charAt(0) || "A"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.full_name || "المدير"}</p>
            <p className="text-slate-500 text-xs">{roleLabel[user?.role || "admin"]}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/10"
            title="تسجيل الخروج"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
