/**
 * الشريط الجانبي — Obsidian Command Sidebar v2
 * Collapsible groups, search, dynamic badges, better visual hierarchy
 */
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/admin/auth";
import { useNotificationStore } from "@/stores/useNotificationStore";
import {
  LayoutDashboard, Users, ClipboardList, FileSpreadsheet,
  Wallet, MessageSquare, BarChart3, Car, Building2,
  Settings2, LogOut, Bell, Landmark, GitCompare, Map,
  TrendingUp, Receipt, ArrowRightLeft, FileText, Brain,
  ChevronLeft, Zap, Shield, GraduationCap, Lock, Target, Plug,
  User, ChevronUp, KeyRound, ChevronDown, Search, X,
  Package, CheckCircle2, ListTodo, ScrollText, Mail, ShieldAlert,
  UserCheck, Sparkles, Clock, Truck, Link2, FileCheck, CreditCard,
  Server, ToggleLeft, GitBranch, Timer, Eye,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loadConfig } from "@/pages/admin/PageBuilder";

// ── Icon map (expanded) ─────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Users, ClipboardList, FileSpreadsheet,
  Wallet, MessageSquare, BarChart3, Car, Building2,
  Settings2, Landmark, GitCompare, Map,
  TrendingUp, Receipt, ArrowRightLeft, FileText, Brain,
  Shield, GraduationCap, Lock, Target, Plug,
  Package, CheckCircle2, ListTodo, ScrollText, Mail,
  ShieldAlert, UserCheck, Sparkles, Clock, Truck, Link2,
  FileCheck, CreditCard, Zap, Server, ToggleLeft, GitBranch, Timer, Eye,
};

function NavIcon({ name, size = 16 }: { name: string; size?: number }) {
  const Ico = ICON_MAP[name] || LayoutDashboard;
  return <Ico size={size} style={{ flexShrink: 0 }} />;
}

// ── Group icons & colors ────────────────────────────────────────────────────
const GROUP_META: Record<string, { icon: React.ElementType; color: string }> = {
  "التشغيل":           { icon: Zap,          color: "var(--con-brand)" },
  "المالية والموارد":  { icon: CreditCard,   color: "var(--con-success)" },
  "الأصول والموظفون":  { icon: Building2,    color: "var(--con-info)" },
  "النظام":           { icon: Settings2,     color: "var(--con-text-muted)" },
  "السائقون":          { icon: Users,         color: "var(--con-warning)" },
  "الحوكمة والتحكم":  { icon: Shield,        color: "#8B5CF6" },
  "البنية التحتية":   { icon: Server,        color: "#FF9900" },
};

const roleLabel: Record<string, string> = {
  admin: "مدير النظام",
  owner: "المالك",
  staff: "موظف",
  courier: "مندوب",
};

const ease = [0.22, 0.68, 0, 1] as const;

export function AdminSidebar() {
  const { user, signOut, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { getUnreadCount } = useNotificationStore();
  const unreadCount = getUnreadCount();
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  async function handleSignOut() {
    await signOut();
    navigate("/admin/login");
  }

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const initials = user?.full_name
    ? user.full_name.trim().split(" ").slice(0, 2).map((w: string) => w[0]).join("")
    : "م";

  const [pageConfig] = useState(() => loadConfig());
  const enabledPages = pageConfig
    .filter((p) => p.enabled)
    .filter((p) => !p.permission || hasPermission(p.permission as any))
    .filter((p) => {
      if (!user) return false;
      if (["admin", "owner"].includes(user.role)) return true;
      if (user.role !== "staff") return false;
      if (["settings", "pagebuilder"].includes(p.id)) return false;
      if (p.id === "staff") return user.department_name === "hr";
      if (p.id === "vehicles") return user.department_name === "fleet";
      if (p.id === "dispatch") return hasPermission("orders");
      return true;
    })
    .sort((a, b) => a.order - b.order);

  // Apply search filter
  const filteredPages = search.trim()
    ? enabledPages.filter((p) => p.label.includes(search) || p.id.includes(search.toLowerCase()))
    : enabledPages;

  const groups = useMemo(() => {
    const g: Record<string, typeof filteredPages> = {};
    for (const page of filteredPages) {
      if (!g[page.group]) g[page.group] = [];
      g[page.group].push(page);
    }
    return g;
  }, [filteredPages]);

  const sidebarWidth = collapsed ? 68 : 260;

  return (
    <motion.aside
      className="con-sidebar"
      dir="rtl"
      animate={{ width: sidebarWidth }}
      transition={{ duration: 0.3, ease }}
      style={{ width: sidebarWidth, overflowX: "hidden", overflowY: "auto" }}
    >
      {/* ── Logo ── */}
      <div
        className="con-sidebar-logo"
        style={{
          justifyContent: collapsed ? "center" : undefined,
          padding: collapsed ? "1.125rem 0.5rem" : undefined,
        }}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
          style={{
            width: 32, height: 32, borderRadius: "var(--con-radius)",
            background: "var(--con-bg-elevated)", border: "1px solid var(--con-border-default)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <img
            src="/images/first_line_professional_english_1.png"
            alt="FL"
            style={{ width: 22, height: 22, objectFit: "contain" }}
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = "none";
              (el.parentElement as HTMLElement).innerHTML =
                '<span style="font-size:11px;font-weight:700;color:var(--con-brand)">FL</span>';
            }}
          />
        </motion.div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.2 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--con-text-primary)", lineHeight: 1.2, margin: 0 }}>
              فيرست لاين
            </p>
            <p style={{ fontSize: 11, color: "var(--con-text-muted)", lineHeight: 1.4, margin: 0 }}>
              لوحة الإدارة
            </p>
          </motion.div>
        )}
      </div>

      {/* ── Collapse toggle ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "توسيع" : "تقليص"}
        style={{
          position: "absolute", left: -12, top: 28,
          width: 24, height: 24, borderRadius: "50%",
          background: "var(--con-bg-elevated)", border: "1px solid var(--con-border-strong)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", zIndex: 60, color: "var(--con-text-muted)",
          transition: "color 0.2s, background 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--con-brand)"; e.currentTarget.style.background = "var(--con-bg-surface-2)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--con-text-muted)"; e.currentTarget.style.background = "var(--con-bg-elevated)"; }}
      >
        <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronLeft size={13} />
        </motion.div>
      </button>

      {/* ── Search (expanded only) ── */}
      {!collapsed && (
        <div style={{ padding: "0 0.625rem", marginBottom: 4 }}>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "var(--con-text-disabled)", pointerEvents: "none" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث سريع..."
              style={{
                width: "100%", padding: "6px 28px 6px 28px", fontSize: 12,
                background: "var(--con-bg-elevated)", border: "1px solid var(--con-border-default)",
                borderRadius: "var(--con-radius-sm)", color: "var(--con-text-secondary)",
                outline: "none", boxSizing: "border-box",
                fontFamily: "var(--con-font-primary)",
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{ position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--con-text-muted)", display: "flex", padding: 2 }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Navigation Groups ── */}
      <ScrollArea className="flex-1" style={{ paddingBottom: "0.5rem", paddingTop: 4 }}>
        <nav>
          {Object.entries(groups).map(([groupLabel, items]) => {
            const meta = GROUP_META[groupLabel] || { icon: LayoutDashboard, color: "var(--con-text-muted)" };
            const GroupIcon = meta.icon;
            const isGroupCollapsed = collapsedGroups.has(groupLabel);
            const hasActiveItem = items.some((item) => location.pathname === item.path);

            return (
              <div key={groupLabel} style={{ marginBottom: collapsed ? 0 : 2 }}>
                {/* Group Header */}
                {!collapsed ? (
                  <button
                    onClick={() => toggleGroup(groupLabel)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      width: "100%",
                      padding: "6px 0.75rem",
                      margin: "4px 0 2px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "var(--con-font-primary)",
                      textAlign: "right",
                    }}
                  >
                    <GroupIcon size={12} style={{ color: meta.color, flexShrink: 0 }} />
                    <span
                      style={{
                        flex: 1,
                        fontSize: 11,
                        fontWeight: 700,
                        color: hasActiveItem ? meta.color : "var(--con-text-muted)",
                        letterSpacing: "0.02em",
                        textTransform: "uppercase",
                      }}
                    >
                      {groupLabel}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        fontFamily: "var(--con-font-mono)",
                        color: "var(--con-text-disabled)",
                        background: "var(--con-bg-elevated)",
                        borderRadius: 3,
                        padding: "0 4px",
                        minWidth: 16,
                        textAlign: "center",
                      }}
                    >
                      {items.length}
                    </span>
                    <motion.div animate={{ rotate: isGroupCollapsed ? -90 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={11} style={{ color: "var(--con-text-disabled)" }} />
                    </motion.div>
                  </button>
                ) : (
                  <div
                    title={groupLabel}
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      padding: "6px 0 2px",
                      margin: "2px 0",
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 2,
                        borderRadius: 1,
                        background: meta.color,
                        opacity: 0.4,
                      }}
                    />
                  </div>
                )}

                {/* Group Items */}
                <AnimatePresence initial={false}>
                  {(!isGroupCollapsed || collapsed || search.trim()) && (
                    <motion.div
                      initial={!collapsed ? { height: 0, opacity: 0 } : false}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={!collapsed ? { height: 0, opacity: 0 } : undefined}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: !collapsed ? "hidden" : undefined }}
                    >
                      {items.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={({ isActive }) => `con-nav-item${isActive ? " active" : ""}`}
                          title={collapsed ? item.label : undefined}
                          style={{
                            justifyContent: collapsed ? "center" : undefined,
                            padding: collapsed ? "0.5rem" : "0.375rem 0.75rem 0.375rem 0.5rem",
                            margin: collapsed ? "1px 0.375rem" : "1px 0.375rem",
                            fontSize: 13,
                          }}
                        >
                          <NavIcon name={item.icon} size={collapsed ? 18 : 15} />
                          {!collapsed && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              style={{ flex: 1, fontSize: 13 }}
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </NavLink>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* ── Bottom ── */}
      <div style={{ borderTop: "1px solid var(--con-border-default)", padding: "0.5rem 0.5rem 0.625rem" }}>

        {/* Notifications */}
        <button
          className="con-nav-item"
          style={{
            width: "100%", textAlign: "right", background: "transparent",
            border: "none", cursor: "pointer",
            justifyContent: collapsed ? "center" : undefined,
            padding: collapsed ? "0.5rem" : undefined,
          }}
          onClick={() => navigate("/admin-panel/notifications")}
        >
          <Bell size={collapsed ? 18 : 15} style={{ flexShrink: 0 }} />
          {!collapsed && <span style={{ flex: 1, fontSize: 13 }}>التنبيهات</span>}
          {!collapsed && unreadCount > 0 && (
            <span
              style={{
                fontSize: 10, fontWeight: 700, background: "var(--con-danger)",
                color: "#fff", borderRadius: 100, padding: "1px 5px",
                fontFamily: "var(--con-font-mono)",
              }}
            >
              {unreadCount}
            </span>
          )}
          {collapsed && unreadCount > 0 && (
            <span
              style={{
                position: "absolute", top: 4, left: 8,
                width: 6, height: 6, borderRadius: "50%", background: "var(--con-danger)",
              }}
            />
          )}
        </button>

        {/* User card */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              style={{
                display: "flex", alignItems: "center",
                gap: collapsed ? 0 : "0.625rem",
                padding: collapsed ? "0.5rem" : "0.5rem 0.875rem",
                background: "var(--con-bg-elevated)", borderRadius: "var(--con-radius)",
                margin: collapsed ? "0.25rem auto" : "0.25rem 0.25rem 0",
                justifyContent: collapsed ? "center" : undefined,
                cursor: "pointer", transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--con-bg-surface-1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--con-bg-elevated)"; }}
            >
              <motion.div whileHover={{ scale: 1.08 }} style={{ flexShrink: 0 }}>
                <Avatar className="h-7 w-7 rounded-md" style={{ background: "var(--con-brand)" }}>
                  <AvatarFallback className="rounded-md text-[11px] font-bold" style={{ background: "var(--con-brand)", color: "#0C0E14" }}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              {!collapsed && (
                <>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--con-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                      {user?.full_name || "المدير"}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--con-text-muted)", lineHeight: 1.3, margin: 0 }}>
                      {roleLabel[user?.role || "admin"]}
                    </p>
                  </div>
                  <ChevronUp size={14} style={{ color: "var(--con-text-muted)" }} />
                </>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-48">
            <DropdownMenuLabel style={{ fontSize: 12 }}>{user?.full_name || "المدير"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/admin-panel/settings")}>
              <User className="w-3.5 h-3.5 ml-2" />الملف الشخصي
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/admin-panel/settings")}>
              <Settings2 className="w-3.5 h-3.5 ml-2" />الإعدادات
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/forgot-password")}>
              <KeyRound className="w-3.5 h-3.5 ml-2" />تغيير كلمة المرور
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500">
              <LogOut className="w-3.5 h-3.5 ml-2" />تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.aside>
  );
}
