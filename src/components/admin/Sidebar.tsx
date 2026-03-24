/**
 * الشريط الجانبي — Obsidian Command Sidebar
 * Deep charcoal nav panel with teal accents, framer-motion micro-interactions.
 * Nav items driven by PageBuilder config (localStorage-backed).
 */
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/admin/auth";
import {
  LayoutDashboard, Users, ClipboardList, FileSpreadsheet,
  Wallet, MessageSquare, BarChart3, Car, Building2,
  Settings2, LogOut, Bell, Landmark, GitCompare, Map,
  TrendingUp, Receipt, ArrowRightLeft, FileText, Brain,
  ChevronLeft, Zap, Shield, GraduationCap, Lock, Target, Plug,
} from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loadConfig } from "@/pages/admin/PageBuilder";

// ── Icon map ──────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Users, ClipboardList, FileSpreadsheet,
  Wallet, MessageSquare, BarChart3, Car, Building2,
  Settings2, Landmark, GitCompare, Map,
  TrendingUp, Receipt, ArrowRightLeft, FileText, Brain,
  Shield, GraduationCap, Lock, Target, Plug,
};

function NavIcon({ name, size = 16 }: { name: string; size?: number }) {
  const Ico = ICON_MAP[name] || LayoutDashboard;
  return <Ico size={size} style={{ flexShrink: 0 }} />;
}

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
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate("/admin/login");
  }

  const initials = user?.full_name
    ? user.full_name.trim().split(" ").slice(0, 2).map((w: string) => w[0]).join("")
    : "م";

  // Load page config from PageBuilder (localStorage) — memoized to avoid reading on every render
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

  const groups = useMemo(() => {
    const g: Record<string, typeof enabledPages> = {};
    for (const page of enabledPages) {
      if (!g[page.group]) g[page.group] = [];
      g[page.group].push(page);
    }
    return g;
  }, [enabledPages]);

  const sidebarWidth = collapsed ? 68 : 260;

  return (
    <motion.aside
      className="con-sidebar"
      dir="rtl"
      animate={{ width: sidebarWidth }}
      transition={{ duration: 0.3, ease }}
      style={{ width: sidebarWidth, overflow: "hidden" }}
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
            width: 32,
            height: 32,
            borderRadius: "var(--con-radius)",
            background: "var(--con-bg-elevated)",
            border: "1px solid var(--con-border-default)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
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
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.2 }}
          >
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
          position: "absolute",
          left: -12,
          top: 28,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "var(--con-bg-elevated)",
          border: "1px solid var(--con-border-strong)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 60,
          color: "var(--con-text-muted)",
          transition: "color 0.2s, background 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--con-brand)";
          e.currentTarget.style.background = "var(--con-bg-surface-2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--con-text-muted)";
          e.currentTarget.style.background = "var(--con-bg-elevated)";
        }}
      >
        <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronLeft size={13} />
        </motion.div>
      </button>

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, overflowY: "auto", paddingBottom: "0.5rem", paddingTop: 4 }}>
        {Object.entries(groups).map(([groupLabel, items]) => (
          <div key={groupLabel}>
            {!collapsed && (
              <motion.p
                className="con-nav-group-label"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {groupLabel}
              </motion.p>
            )}
            {collapsed && <div style={{ height: 8 }} />}
            {items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `con-nav-item${isActive ? " active" : ""}`
                }
                title={collapsed ? item.label : undefined}
                style={{
                  justifyContent: collapsed ? "center" : undefined,
                  padding: collapsed ? "0.5rem" : undefined,
                  margin: collapsed ? "1px 0.375rem" : undefined,
                }}
              >
                <NavIcon name={item.icon} size={collapsed ? 18 : 16} />
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
          </div>
        ))}
      </nav>

      {/* ── Bottom ── */}
      <div style={{ borderTop: "1px solid var(--con-border-default)", padding: "0.625rem 0.5rem 0.75rem" }}>

        {/* Notifications */}
        <button
          className="con-nav-item"
          style={{
            width: "100%",
            textAlign: "right",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            justifyContent: collapsed ? "center" : undefined,
            padding: collapsed ? "0.5rem" : undefined,
          }}
          onClick={() => setNotifOpen(!notifOpen)}
        >
          <Bell size={collapsed ? 18 : 15} style={{ flexShrink: 0 }} />
          {!collapsed && <span style={{ flex: 1, fontSize: 13 }}>التنبيهات</span>}
          {!collapsed && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                background: "var(--con-danger)",
                color: "#fff",
                borderRadius: 100,
                padding: "1px 5px",
              }}
            >
              3
            </span>
          )}
          {collapsed && (
            <span
              style={{
                position: "absolute",
                top: 4,
                left: 8,
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--con-danger)",
              }}
            />
          )}
        </button>

        {/* User card */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: collapsed ? 0 : "0.625rem",
            padding: collapsed ? "0.5rem" : "0.5rem 0.875rem",
            background: "var(--con-bg-elevated)",
            borderRadius: "var(--con-radius)",
            margin: collapsed ? "0.25rem auto" : "0.25rem 0.25rem 0",
            justifyContent: collapsed ? "center" : undefined,
          }}
        >
          <motion.div
            whileHover={{ scale: 1.08 }}
            style={{
              width: 28,
              height: 28,
              borderRadius: "var(--con-radius-sm)",
              background: "var(--con-brand)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: 11,
              fontWeight: 700,
              color: "#0C0E14",
            }}
          >
            {initials}
          </motion.div>

          {!collapsed && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--con-text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    margin: 0,
                  }}
                >
                  {user?.full_name || "المدير"}
                </p>
                <p style={{ fontSize: 11, color: "var(--con-text-muted)", lineHeight: 1.3, margin: 0 }}>
                  {roleLabel[user?.role || "admin"]}
                </p>
              </div>

              <button
                onClick={handleSignOut}
                title="تسجيل الخروج"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  borderRadius: 4,
                  color: "var(--con-text-muted)",
                  display: "flex",
                  alignItems: "center",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--con-danger)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--con-text-muted)"; }}
              >
                <LogOut size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
