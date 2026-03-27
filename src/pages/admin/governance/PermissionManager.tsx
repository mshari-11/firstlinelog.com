/**
 * إدارة الصلاحيات — Permission Manager
 * CRUD for roles, module permissions, action granularity, data-scope
 */
import { useState, useEffect } from "react";
import { Shield, Plus, Edit2, Trash2, Save, ChevronDown, ChevronUp } from "lucide-react";
import { PageWrapper, PageHeader, Card, KPIGrid, KPICard, Toolbar, Badge, Button, Modal, Select } from "@/components/admin/ui";
import { SYSTEM_ROLES, type EnhancedRole, type PermissionAction, type ModulePermission } from "@/lib/admin/permissions";
import { DEFAULT_MODULES, GROUP_LABELS, type ModuleGroup } from "@/lib/admin/moduleRegistry";
import { supabase } from "@/lib/supabase";

const ALL_ACTIONS: PermissionAction[] = ["view", "create", "edit", "delete", "approve", "export", "configure"];
const ACTION_LABELS: Record<PermissionAction, string> = {
  view: "عرض",
  create: "إنشاء",
  edit: "تعديل",
  delete: "حذف",
  approve: "اعتماد",
  export: "تصدير",
  configure: "إعداد",
};

export default function PermissionManager() {
  const [roles, setRoles] = useState<EnhancedRole[]>(SYSTEM_ROLES);

  useEffect(() => {
    (async () => {
      try {
        if (!supabase) throw new Error("no client");
        const { data, error } = await supabase
          .schema("admin")
          .from("role_permissions")
          .select("*");
        if (error || !data || data.length === 0) return;

        // Build a map from role_name → accumulated ModulePermission[]
        const roleMap = new Map<string, ModulePermission[]>();
        for (const row of data) {
          const existing = roleMap.get(row.role_name) || [];
          const actions: PermissionAction[] = Array.isArray(row.actions)
            ? (row.actions as string[]).filter((a): a is PermissionAction =>
                ALL_ACTIONS.includes(a as PermissionAction)
              )
            : [];
          if (actions.length > 0) {
            existing.push({ moduleId: row.module_id, actions });
          }
          roleMap.set(row.role_name, existing);
        }

        // Merge DB roles into existing SYSTEM_ROLES (DB overrides modules for non-system roles)
        setRoles((prev) =>
          prev.map((r) => {
            if (r.isSystem) return r;
            const dbModules = roleMap.get(r.name);
            if (!dbModules) return r;
            return { ...r, modules: dbModules };
          })
        );
      } catch {
        // silent — keep fallback SYSTEM_ROLES
      }
    })();
  }, []);
  const [selectedRole, setSelectedRole] = useState<string>(roles[0]?.id || "");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["operations"]));

  const currentRole = roles.find((r) => r.id === selectedRole);

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const toggleAction = (moduleId: string, action: PermissionAction) => {
    if (!currentRole || currentRole.isSystem) return;
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== selectedRole) return r;
        const existing = r.modules.find((m) => m.moduleId === moduleId);
        if (existing) {
          const newActions = existing.actions.includes(action)
            ? existing.actions.filter((a) => a !== action)
            : [...existing.actions, action];
          return {
            ...r,
            modules: newActions.length === 0
              ? r.modules.filter((m) => m.moduleId !== moduleId)
              : r.modules.map((m) => (m.moduleId === moduleId ? { ...m, actions: newActions } : m)),
          };
        }
        return { ...r, modules: [...r.modules, { moduleId, actions: [action] }] };
      })
    );
  };

  const hasAction = (moduleId: string, action: PermissionAction): boolean => {
    if (!currentRole) return false;
    if (currentRole.isSystem) return true;
    const mod = currentRole.modules.find((m) => m.moduleId === moduleId);
    return mod?.actions.includes(action) || false;
  };

  // Group modules
  const groupedModules = DEFAULT_MODULES.reduce((acc, m) => {
    const g = m.group;
    if (!acc[g]) acc[g] = [];
    acc[g].push(m);
    return acc;
  }, {} as Record<string, typeof DEFAULT_MODULES>);

  return (
    <PageWrapper>
      <PageHeader
        icon={Shield}
        title="إدارة الصلاحيات"
        subtitle="تحكّم في صلاحيات كل دور على مستوى الوحدات والإجراءات"
        actions={<Button icon={Save}>حفظ التغييرات</Button>}
      />

      <KPIGrid cols="repeat(4, 1fr)">
        <KPICard label="الأدوار" value={roles.length} icon={Shield} accent="var(--con-brand)" />
        <KPICard label="أدوار النظام" value={roles.filter((r) => r.isSystem).length} icon={Shield} accent="var(--con-info)" />
        <KPICard label="أدوار مخصصة" value={roles.filter((r) => !r.isSystem).length} icon={Shield} accent="var(--con-success)" />
        <KPICard label="إجمالي الوحدات" value={DEFAULT_MODULES.length} icon={Shield} accent="var(--con-warning)" />
      </KPIGrid>

      {/* Role Selector */}
      <Card title="اختر الدور" actions={<Button variant="ghost" icon={Plus}>إضافة دور</Button>}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              style={{
                padding: "8px 16px",
                borderRadius: "var(--con-radius)",
                border: `1px solid ${selectedRole === role.id ? "var(--con-border-brand)" : "var(--con-border-default)"}`,
                background: selectedRole === role.id ? "var(--con-brand-subtle)" : "var(--con-bg-surface-2)",
                color: selectedRole === role.id ? "var(--con-brand)" : "var(--con-text-secondary)",
                cursor: "pointer",
                fontSize: "var(--con-text-body)",
                fontWeight: 500,
                fontFamily: "var(--con-font-primary)",
                transition: "all 0.15s",
              }}
            >
              {role.nameAr}
              {role.isSystem && (
                <span style={{ fontSize: 10, color: "var(--con-text-muted)", marginRight: 6 }}>(نظام)</span>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Permission Matrix */}
      {currentRole && (
        <Card
          title={`صلاحيات: ${currentRole.nameAr}`}
          subtitle={currentRole.isSystem ? "دور نظام — صلاحيات كاملة تلقائياً" : "اضغط على الإجراء لتفعيله أو تعطيله"}
        >
          {currentRole.isSystem && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "var(--con-radius)",
                background: "var(--con-brand-subtle)",
                border: "1px solid var(--con-border-brand)",
                marginBottom: 16,
                fontSize: "var(--con-text-body)",
                color: "var(--con-brand)",
              }}
            >
              هذا دور نظام — يملك صلاحيات كاملة على جميع الوحدات تلقائياً ولا يمكن تعديله.
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(groupedModules).map(([group, modules]) => (
              <div key={group}>
                <button
                  onClick={() => toggleGroup(group)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "var(--con-radius)",
                    background: "var(--con-bg-surface-2)",
                    border: "1px solid var(--con-border-default)",
                    cursor: "pointer",
                    color: "var(--con-text-primary)",
                    fontWeight: 600,
                    fontSize: "var(--con-text-body)",
                    fontFamily: "var(--con-font-primary)",
                  }}
                >
                  <span>{GROUP_LABELS[group as ModuleGroup] || group} ({modules.length})</span>
                  {expandedGroups.has(group) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {expandedGroups.has(group) && (
                  <div style={{ padding: "8px 0", display: "flex", flexDirection: "column", gap: 4 }}>
                    {modules.map((mod) => (
                      <div
                        key={mod.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 14px",
                          borderRadius: "var(--con-radius-sm)",
                          border: "1px solid var(--con-border-default)",
                        }}
                      >
                        <span style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-primary)", fontWeight: 500 }}>
                          {mod.labelAr}
                        </span>
                        <div style={{ display: "flex", gap: 3 }}>
                          {ALL_ACTIONS.map((action) => {
                            const active = hasAction(mod.id, action);
                            return (
                              <button
                                key={action}
                                onClick={() => toggleAction(mod.id, action)}
                                disabled={currentRole.isSystem}
                                style={{
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  fontSize: 10,
                                  fontWeight: 600,
                                  border: `1px solid ${active ? "var(--con-border-brand)" : "var(--con-border-default)"}`,
                                  background: active ? "var(--con-brand-subtle)" : "transparent",
                                  color: active ? "var(--con-brand)" : "var(--con-text-disabled)",
                                  cursor: currentRole.isSystem ? "not-allowed" : "pointer",
                                  fontFamily: "var(--con-font-primary)",
                                  transition: "all 0.15s",
                                  opacity: currentRole.isSystem ? 0.5 : 1,
                                }}
                              >
                                {ACTION_LABELS[action]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </PageWrapper>
  );
}
