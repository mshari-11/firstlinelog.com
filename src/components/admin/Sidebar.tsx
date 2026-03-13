/**
 * الشريط الجانبي — Enterprise Console Sidebar
 * IBM Carbon / AWS Cloudscape navigation style
 * Nav items driven by PageBuilder config (localStorage-backed)
 */
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/admin/auth";
import {
  LayoutDashboard, Users, ClipboardList, FileSpreadsheet,
  Wallet, MessageSquare, BarChart3, Car, Building2,
  Settings2, LogOut, Bell, Landmark, GitCompare, Map,
  TrendingUp, Receipt, ArrowRightLeft, FileText, Brain,
} from "lucide-react";
import { useState } from "react";
import { loadConfig } from "@/pages/admin/PageBuilder";

// ── Icon map ──────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Users, ClipboardList, FileSpreadsheet,
  Wallet, MessageSquare, BarChart3, Car, Building2,
  Settings2, Landmark, GitCompare, Map,
  TrendingUp, Receipt, ArrowRightLeft, FileText, Brain,
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

export function AdminSidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate("/admin/login");
  }

  const initials = user?.full_name
    ? user.full_name.trim().split(" ").slice(0, 2).map((w: string) => w[0]).join("")
    : "م";

  // Load page config from PageBuilder (localStorage)
  const pageConfig = loadConfig();
  const enabledPages = pageConfig.filter((p) => p.enabled).sort((a, b) => a.order - b.order);

  // Group enabled pages
  const groups: Record<string, typeof enabledPages> = {};
  for (const page of enabledPages) {
    if (!groups[page.group]) groups[page.group] = [];
    groups[page.group].push(page);
  }

  return (
    <aside className="con-sidebar" dir="rtl">

      {/* ── Logo ── */}
      <div className="con-sidebar-logo">
        <div style={{
          width: "30px", height: "30px",
          borderRadius: "6px",
          background: "var(--con-bg-elevated)",
          border: "1px solid var(--con-border-default)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <img
            src="/images/first_line_professional_english_1.png"
            alt="FL"
            style={{ width: "22px", height: "22px", objectFit: "contain" }}
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = "none";
              (el.parentElement as HTMLElement).innerHTML =
                '<span style="font-size:11px;font-weight:700;color:var(--con-brand)">FL</span>';
            }}
          />
        </div>
        <div>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--con-text-primary)", lineHeight: 1.2 }}>
            فيرست لاين
          </p>
          <p style={{ fontSize: "11px", color: "var(--con-text-muted)", lineHeight: 1.4 }}>
            لوحة الإدارة
          </p>
        </div>
      </div>

      {/* ── Navigation (driven by PageBuilder config) ── */}
      <nav style={{ flex: 1, overflowY: "auto", paddingBottom: "0.5rem" }}>
        {Object.entries(groups).map(([groupLabel, items]) => (
          <div key={groupLabel}>
            <p className="con-nav-group-label">{groupLabel}</p>
            {items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `con-nav-item${isActive ? " active" : ""}`
                }
              >
                <NavIcon name={item.icon} />
                <span style={{ flex: 1, fontSize: "13px" }}>{item.label}</span>
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
          style={{ width: "100%", textAlign: "right", background: "transparent", border: "none", cursor: "pointer" }}
          onClick={() => setNotifOpen(!notifOpen)}
        >
          <Bell size={15} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: "13px" }}>التنبيهات</span>
          <span style={{
            fontSize: "10px", fontWeight: 700,
            background: "var(--con-danger)",
            color: "#fff",
            borderRadius: "100px",
            padding: "1px 5px",
          }}>3</span>
        </button>

        {/* User card */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.625rem",
          padding: "0.5rem 0.875rem",
          background: "var(--con-bg-elevated)",
          borderRadius: "var(--con-radius)",
          margin: "0 0.25rem",
          marginTop: "0.25rem",
        }}>
          <div style={{
            width: "28px", height: "28px",
            borderRadius: "var(--con-radius-sm)",
            background: "var(--con-brand)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            fontSize: "11px", fontWeight: 700, color: "#fff",
          }}>
            {initials}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: "12px", fontWeight: 600,
              color: "var(--con-text-primary)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {user?.full_name || "المدير"}
            </p>
            <p style={{ fontSize: "11px", color: "var(--con-text-muted)", lineHeight: 1.3 }}>
              {roleLabel[user?.role || "admin"]}
            </p>
          </div>

          <button
            onClick={handleSignOut}
            title="تسجيل الخروج"
            style={{
              background: "transparent", border: "none",
              cursor: "pointer", padding: "4px",
              borderRadius: "4px",
              color: "var(--con-text-muted)",
              display: "flex", alignItems: "center",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--con-danger)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--con-text-muted)"; }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
