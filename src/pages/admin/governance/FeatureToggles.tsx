/**
 * مفاتيح الميزات — Feature Toggles
 * Enable/disable features globally or per role
 */
import { useState, useEffect } from "react";
import { ToggleLeft, ToggleRight, Search } from "lucide-react";
import { PageWrapper, PageHeader, Card, KPIGrid, KPICard, Toolbar } from "@/components/admin/ui";
import { useModuleRegistry } from "@/stores/useModuleRegistry";
import { GROUP_LABELS, type ModuleGroup } from "@/lib/admin/moduleRegistry";
import { supabase } from "@/lib/supabase";

export default function FeatureToggles() {
  const { modules, toggleModule } = useModuleRegistry();
  // dbToggles holds enabled overrides fetched from admin.feature_toggles keyed by id
  const [dbToggles, setDbToggles] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    (async () => {
      try {
        if (!supabase) throw new Error("no client");
        const { data, error } = await supabase
          .schema("admin")
          .from("feature_toggles")
          .select("id, enabled");
        if (error || !data || data.length === 0) return;
        const map = new Map<string, boolean>();
        for (const row of data) {
          map.set(row.id as string, Boolean(row.enabled));
        }
        setDbToggles(map);
      } catch {
        // silent — keep fallback Zustand state
      }
    })();
  }, []);

  // Merge DB overrides: DB wins when an id matches
  const mergedModules = modules.map((m) =>
    dbToggles.has(m.id) ? { ...m, enabled: dbToggles.get(m.id)! } : m
  );
  const [search, setSearch] = useState("");

  const filtered = mergedModules.filter(
    (m) =>
      m.labelAr.includes(search) ||
      m.label.toLowerCase().includes(search.toLowerCase()) ||
      m.id.includes(search)
  );

  const enabled = mergedModules.filter((m) => m.enabled).length;
  const disabled = mergedModules.filter((m) => !m.enabled).length;
  const coreCount = mergedModules.filter((m) => m.isCore).length;

  // Group filtered modules
  const grouped = filtered.reduce((acc, m) => {
    const g = GROUP_LABELS[m.group as ModuleGroup] || m.group;
    if (!acc[g]) acc[g] = [];
    acc[g].push(m);
    return acc;
  }, {} as Record<string, typeof filtered>);

  return (
    <PageWrapper>
      <PageHeader
        icon={ToggleLeft}
        title="مفاتيح الميزات"
        subtitle="تفعيل وتعطيل الوحدات والميزات عبر المنصة"
      />

      <KPIGrid cols="repeat(4, 1fr)">
        <KPICard label="إجمالي الوحدات" value={modules.length} icon={ToggleLeft} accent="var(--con-brand)" />
        <KPICard label="مفعّلة" value={enabled} icon={ToggleRight} accent="var(--con-success)" />
        <KPICard label="معطّلة" value={disabled} icon={ToggleLeft} accent="var(--con-danger)" />
        <KPICard label="أساسية" value={coreCount} icon={ToggleRight} accent="var(--con-info)" />
      </KPIGrid>

      <Toolbar search={search} onSearch={setSearch} searchPlaceholder="ابحث عن وحدة..." />

      {Object.entries(grouped).map(([group, mods]) => (
        <Card key={group} title={group} subtitle={`${mods.filter((m) => m.enabled).length}/${mods.length} مفعّل`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {mods.sort((a, b) => a.order - b.order).map((mod) => (
              <div
                key={mod.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "var(--con-radius)",
                  background: "var(--con-bg-surface-2)",
                  border: `1px solid ${mod.enabled ? "var(--con-border-default)" : "rgba(255,255,255,0.03)"}`,
                  opacity: mod.enabled ? 1 : 0.6,
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "var(--con-radius-sm)",
                      background: mod.enabled ? "var(--con-brand-subtle)" : "var(--con-bg-elevated)",
                      border: `1px solid ${mod.enabled ? "var(--con-border-brand)" : "var(--con-border-default)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "var(--con-text-body)",
                      color: mod.enabled ? "var(--con-brand)" : "var(--con-text-muted)",
                    }}
                  >
                    {mod.enabled ? "✓" : "✕"}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: "var(--con-text-body)", fontWeight: 600, color: mod.enabled ? "var(--con-text-primary)" : "var(--con-text-muted)" }}>
                        {mod.labelAr}
                      </span>
                      {mod.isCore && (
                        <span
                          style={{
                            fontSize: 9,
                            padding: "1px 5px",
                            borderRadius: 3,
                            background: "var(--con-bg-elevated)",
                            border: "1px solid var(--con-border-default)",
                            color: "var(--con-text-muted)",
                            fontWeight: 600,
                          }}
                        >
                          أساسي
                        </span>
                      )}
                      {mod.requiredPermission && (
                        <span
                          style={{
                            fontSize: 9,
                            padding: "1px 5px",
                            borderRadius: 3,
                            background: "var(--con-brand-subtle)",
                            border: "1px solid var(--con-border-brand)",
                            color: "var(--con-brand)",
                            fontWeight: 600,
                          }}
                        >
                          {mod.requiredPermission}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", margin: "2px 0 0", fontFamily: "var(--con-font-mono)" }}>
                      {mod.path} · v{mod.version}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggleModule(mod.id)}
                  disabled={mod.isCore}
                  title={mod.isCore ? "وحدة أساسية لا يمكن تعطيلها" : mod.enabled ? "تعطيل" : "تفعيل"}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: mod.isCore ? "not-allowed" : "pointer",
                    color: mod.isCore ? "var(--con-text-muted)" : mod.enabled ? "var(--con-success)" : "var(--con-border-strong)",
                    opacity: mod.isCore ? 0.4 : 1,
                    display: "flex",
                    padding: 2,
                  }}
                >
                  {mod.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                </button>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </PageWrapper>
  );
}
