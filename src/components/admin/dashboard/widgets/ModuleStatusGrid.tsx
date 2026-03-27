/**
 * Module Status Grid Widget — All modules at-a-glance with enable/disable status
 */
import { useNavigate } from "react-router-dom";
import { Grid3X3, CheckCircle, XCircle } from "lucide-react";
import { WidgetShell } from "../WidgetShell";
import { useModuleRegistry } from "@/stores/useModuleRegistry";
import { GROUP_LABELS, type ModuleGroup } from "@/lib/admin/moduleRegistry";

export function ModuleStatusGrid() {
  const navigate = useNavigate();
  const { modules, getGroups } = useModuleRegistry();
  const groups = getGroups();

  const totalEnabled = modules.filter((m) => m.enabled).length;
  const totalDisabled = modules.filter((m) => !m.enabled).length;

  return (
    <WidgetShell
      id="module-status-grid"
      title="حالة الوحدات"
      subtitle={`${totalEnabled} مفعّل · ${totalDisabled} معطّل`}
      icon={Grid3X3}
      iconColor="var(--con-brand)"
      onDrilldown={() => navigate("/admin-panel/page-builder")}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {groups.map((group) => (
          <div key={group.key}>
            <h4
              style={{
                fontSize: "var(--con-text-caption)",
                fontWeight: 600,
                color: "var(--con-text-muted)",
                margin: "0 0 6px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {group.label}
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {group.modules.map((mod) => (
                <div
                  key={mod.id}
                  onClick={() => navigate(mod.path)}
                  title={`${mod.labelAr} — ${mod.enabled ? "مفعّل" : "معطّل"}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "3px 8px",
                    borderRadius: "var(--con-radius-sm)",
                    fontSize: "var(--con-text-caption)",
                    fontWeight: 500,
                    background: mod.enabled ? "var(--con-brand-subtle)" : "rgba(255,255,255,0.03)",
                    color: mod.enabled ? "var(--con-brand)" : "var(--con-text-disabled)",
                    border: `1px solid ${mod.enabled ? "var(--con-border-brand)" : "var(--con-border-default)"}`,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {mod.enabled ? <CheckCircle size={10} /> : <XCircle size={10} />}
                  {mod.labelAr}
                  {mod.badge && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "0 4px",
                        borderRadius: 6,
                        background: `var(--con-${mod.badge.variant})`,
                        color: "#000",
                        fontFamily: "var(--con-font-mono)",
                      }}
                    >
                      {mod.badge.count}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}
