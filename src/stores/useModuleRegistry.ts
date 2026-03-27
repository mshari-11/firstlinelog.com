/**
 * Module Registry Store — Zustand
 * Single source of truth for all admin modules, feature toggles, and navigation
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_MODULES, type ModuleDefinition, type ModuleGroup, GROUP_LABELS, toPageConfig } from "@/lib/admin/moduleRegistry";

interface ModuleRegistryState {
  modules: ModuleDefinition[];
  initialized: boolean;

  // Actions
  initialize: () => void;
  toggleModule: (moduleId: string) => void;
  toggleFeature: (moduleId: string, featureId: string) => void;
  reorderModule: (moduleId: string, newOrder: number) => void;
  updateModuleBadge: (moduleId: string, count: number, variant?: string) => void;
  resetToDefaults: () => void;

  // Selectors
  getEnabledModules: () => ModuleDefinition[];
  getModulesByGroup: (group: ModuleGroup) => ModuleDefinition[];
  getModule: (moduleId: string) => ModuleDefinition | undefined;
  getGroups: () => { key: ModuleGroup; label: string; modules: ModuleDefinition[] }[];
  getPageConfig: () => ReturnType<typeof toPageConfig>;
}

export const useModuleRegistry = create<ModuleRegistryState>()(
  persist(
    (set, get) => ({
      modules: DEFAULT_MODULES,
      initialized: false,

      initialize: () => {
        const state = get();
        if (state.initialized) return;

        // Merge saved state with defaults (add any new modules from DEFAULT_MODULES)
        const savedIds = new Set(state.modules.map((m) => m.id));
        const newModules = DEFAULT_MODULES.filter((m) => !savedIds.has(m.id));
        if (newModules.length > 0) {
          set({ modules: [...state.modules, ...newModules], initialized: true });
        } else {
          set({ initialized: true });
        }
      },

      toggleModule: (moduleId) => {
        set((state) => ({
          modules: state.modules.map((m) =>
            m.id === moduleId && !m.isCore ? { ...m, enabled: !m.enabled } : m
          ),
        }));
      },

      toggleFeature: (moduleId, featureId) => {
        set((state) => ({
          modules: state.modules.map((m) =>
            m.id === moduleId
              ? {
                  ...m,
                  features: m.features.map((f) =>
                    f.id === featureId ? { ...f, enabled: !f.enabled } : f
                  ),
                }
              : m
          ),
        }));
      },

      reorderModule: (moduleId, newOrder) => {
        set((state) => ({
          modules: state.modules.map((m) =>
            m.id === moduleId ? { ...m, order: newOrder } : m
          ),
        }));
      },

      updateModuleBadge: (moduleId, count, variant = "warning") => {
        set((state) => ({
          modules: state.modules.map((m) =>
            m.id === moduleId ? { ...m, badge: count > 0 ? { count, variant } : undefined } : m
          ),
        }));
      },

      resetToDefaults: () => {
        set({ modules: DEFAULT_MODULES });
      },

      getEnabledModules: () => {
        return get()
          .modules.filter((m) => m.enabled)
          .sort((a, b) => a.order - b.order);
      },

      getModulesByGroup: (group) => {
        return get()
          .modules.filter((m) => m.group === group && m.enabled)
          .sort((a, b) => a.order - b.order);
      },

      getModule: (moduleId) => {
        return get().modules.find((m) => m.id === moduleId);
      },

      getGroups: () => {
        const modules = get().getEnabledModules();
        const groupMap = new Map<ModuleGroup, ModuleDefinition[]>();
        for (const m of modules) {
          const list = groupMap.get(m.group) || [];
          list.push(m);
          groupMap.set(m.group, list);
        }
        return Array.from(groupMap.entries()).map(([key, mods]) => ({
          key,
          label: GROUP_LABELS[key] || key,
          modules: mods,
        }));
      },

      getPageConfig: () => {
        return toPageConfig(get().modules);
      },
    }),
    {
      name: "fll_module_registry_v2",
      partialize: (state) => ({
        modules: state.modules.map(({ badge, ...rest }) => rest), // Don't persist badge counts
      }),
    }
  )
);
