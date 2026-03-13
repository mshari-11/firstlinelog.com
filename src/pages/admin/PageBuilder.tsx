/**
 * Admin Page Builder
 * Feature flags, nav reordering, page enable/disable
 * Settings persist to localStorage (Supabase-ready via upsert hook)
 */
import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, Users, ClipboardList, FileSpreadsheet,
  Wallet, MessageSquare, BarChart3, Car, Building2,
  Settings2, Landmark, GitCompare, Map, GripVertical,
  Eye, EyeOff, ToggleLeft, ToggleRight, Save, RotateCcw,
  Info, CheckCircle2, TrendingUp, Receipt, ArrowRightLeft, FileText, Brain,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PageConfig {
  id: string;
  label: string;
  path: string;
  group: string;
  icon: string;
  enabled: boolean;
  order: number;
  permission?: string;
  isCore?: boolean; // core pages can't be disabled
}

// ─── Icon map ─────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Users, ClipboardList, FileSpreadsheet,
  Wallet, MessageSquare, BarChart3, Car, Building2,
  Settings2, Landmark, GitCompare, Map,
  TrendingUp, Receipt, ArrowRightLeft, FileText, Brain,
};

function PageIcon({ name, size = 15 }: { name: string; size?: number }) {
  const Ico = ICON_MAP[name] || LayoutDashboard;
  return <Ico size={size} />;
}

// ─── Default page registry ────────────────────────────────────────────────────
const DEFAULT_PAGES: PageConfig[] = [
  { id: "dashboard",          label: "الرئيسية",           path: "/admin-panel/dashboard",          group: "التشغيل",          icon: "LayoutDashboard", enabled: true,  order: 0,  isCore: true },
  { id: "couriers",           label: "المناديب",            path: "/admin-panel/couriers",           group: "التشغيل",          icon: "Users",           enabled: true,  order: 1 },
  { id: "orders",             label: "الطلبات",             path: "/admin-panel/orders",             group: "التشغيل",          icon: "ClipboardList",   enabled: true,  order: 2 },
  { id: "complaints",         label: "الشكاوى",             path: "/admin-panel/complaints",         group: "التشغيل",          icon: "MessageSquare",   enabled: true,  order: 3 },
  { id: "dispatch",           label: "الخريطة والإرسال",   path: "/admin-panel/dispatch",           group: "التشغيل",          icon: "Map",             enabled: true,  order: 4 },
  { id: "finance-dashboard",  label: "لوحة المالية",       path: "/admin-panel/finance-dashboard",  group: "المالية والموارد", icon: "LayoutDashboard", enabled: true,  order: 5,  permission: "finance" },
  { id: "revenue",            label: "الإيرادات",           path: "/admin-panel/revenue",            group: "المالية والموارد", icon: "TrendingUp",      enabled: true,  order: 6,  permission: "finance" },
  { id: "expenses",           label: "المصروفات",           path: "/admin-panel/expenses",           group: "المالية والموارد", icon: "Receipt",         enabled: true,  order: 7,  permission: "finance" },
  { id: "cashflow",           label: "التدفقات النقدية",   path: "/admin-panel/cashflow",           group: "المالية والموارد", icon: "ArrowRightLeft",  enabled: true,  order: 8,  permission: "finance" },
  { id: "financial-reports",  label: "التقارير المالية",   path: "/admin-panel/financial-reports",  group: "المالية والموارد", icon: "FileText",        enabled: true,  order: 9,  permission: "finance" },
  { id: "ai-finance",         label: "تحليل AI المالي",    path: "/admin-panel/ai-finance",         group: "المالية والموارد", icon: "Brain",           enabled: true,  order: 10, permission: "finance" },
  { id: "finance",            label: "الرواتب والمالية",   path: "/admin-panel/finance",            group: "المالية والموارد", icon: "Wallet",          enabled: true,  order: 11, permission: "finance" },
  { id: "wallet",             label: "محافظ السائقين",     path: "/admin-panel/wallet",             group: "المالية والموارد", icon: "Landmark",        enabled: true,  order: 12, permission: "finance" },
  { id: "reconciliation",     label: "مطابقة مالية",       path: "/admin-panel/reconciliation",     group: "المالية والموارد", icon: "GitCompare",      enabled: true,  order: 13, permission: "finance" },
  { id: "reports",            label: "التقارير",            path: "/admin-panel/reports",            group: "المالية والموارد", icon: "BarChart3",       enabled: true,  order: 14, permission: "reports" },
  { id: "excel",              label: "استيراد Excel",      path: "/admin-panel/excel",              group: "المالية والموارد", icon: "FileSpreadsheet", enabled: true,  order: 15, permission: "excel" },
  { id: "vehicles",           label: "المركبات",            path: "/admin-panel/vehicles",           group: "الأصول والموظفون", icon: "Car",             enabled: true,  order: 16 },
  { id: "staff",              label: "الأقسام والموظفين",  path: "/admin-panel/staff",              group: "الأصول والموظفون", icon: "Building2",       enabled: true,  order: 17 },
  { id: "settings",           label: "الإعدادات",           path: "/admin-panel/settings",           group: "النظام",           icon: "Settings2",       enabled: true,  order: 18, isCore: true },
  { id: "pagebuilder",        label: "منشئ الصفحات",        path: "/admin-panel/page-builder",       group: "النظام",           icon: "LayoutDashboard", enabled: true,  order: 19, isCore: true },
];

const STORAGE_KEY = "fll_page_config_v1";

function loadConfig(): PageConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PAGES;
    const saved: PageConfig[] = JSON.parse(raw);
    // Merge: keep saved overrides, add any new defaults not yet in saved
    const savedIds = new Set(saved.map((p) => p.id));
    const merged = [
      ...saved,
      ...DEFAULT_PAGES.filter((p) => !savedIds.has(p.id)),
    ];
    return merged.sort((a, b) => a.order - b.order);
  } catch {
    return DEFAULT_PAGES;
  }
}

function saveConfig(pages: PageConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
}

// ─── Drag-and-drop helpers (pure mouse, no external lib) ─────────────────────
interface DragState {
  dragIndex: number | null;
  overIndex: number | null;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function PageBuilder() {
  const [pages, setPages] = useState<PageConfig[]>(loadConfig);
  const [saved, setSaved] = useState(false);
  const [drag, setDrag] = useState<DragState>({ dragIndex: null, overIndex: null });

  // Group pages
  const groups = Array.from(new Set(pages.map((p) => p.group)));

  function toggleEnabled(id: string) {
    setPages((prev) =>
      prev.map((p) => (p.id === id && !p.isCore ? { ...p, enabled: !p.enabled } : p))
    );
    setSaved(false);
  }

  function handleDragStart(index: number) {
    setDrag({ dragIndex: index, overIndex: index });
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDrag((d) => ({ ...d, overIndex: index }));
  }

  function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    const { dragIndex } = drag;
    if (dragIndex === null || dragIndex === dropIndex) {
      setDrag({ dragIndex: null, overIndex: null });
      return;
    }
    setPages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(dropIndex, 0, moved);
      return next.map((p, i) => ({ ...p, order: i }));
    });
    setDrag({ dragIndex: null, overIndex: null });
    setSaved(false);
  }

  function handleDragEnd() {
    setDrag({ dragIndex: null, overIndex: null });
  }

  function handleSave() {
    const ordered = pages.map((p, i) => ({ ...p, order: i }));
    saveConfig(ordered);
    setPages(ordered);
    setSaved(true);
    // Supabase upsert (non-blocking, best-effort)
    if (supabase) {
      supabase.from("page_builder_config").upsert(
        ordered.map((p) => ({ id: p.id, enabled: p.enabled, order: p.order })),
        { onConflict: "id" }
      ).then(() => {/* fire and forget */});
    }
    setTimeout(() => setSaved(false), 2500);
  }

  function handleReset() {
    setPages(DEFAULT_PAGES);
    setSaved(false);
  }

  // Flat index lookup for drag
  const flatIndex = (id: string) => pages.findIndex((p) => p.id === id);

  return (
    <div style={{ padding: "1.5rem", maxWidth: "900px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "var(--con-text-page-title)", fontWeight: 700, color: "var(--con-text-primary)", marginBottom: "0.25rem" }}>
            منشئ الصفحات
          </h1>
          <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)" }}>
            تحكّم في ترتيب الصفحات وتفعيلها أو إيقافها في القائمة الجانبية
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="con-btn-ghost"
            onClick={handleReset}
            style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "13px" }}
          >
            <RotateCcw size={14} /> إعادة تعيين
          </button>
          <button
            className="con-btn-primary"
            onClick={handleSave}
            style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "13px" }}
          >
            {saved ? <><CheckCircle2 size={14} /> تم الحفظ</> : <><Save size={14} /> حفظ التغييرات</>}
          </button>
        </div>
      </div>

      {/* Info bar */}
      <div style={{
        display: "flex", gap: "0.5rem",
        padding: "0.75rem 1rem",
        background: "var(--con-info-subtle)",
        border: "1px solid var(--con-brand-border)",
        borderRadius: "var(--con-radius)",
        marginBottom: "1.25rem",
        fontSize: "var(--con-text-caption)",
        color: "var(--con-text-secondary)",
      }}>
        <Info size={14} style={{ color: "var(--con-info)", flexShrink: 0, marginTop: "1px" }} />
        <span>
          اسحب الصفوف لإعادة الترتيب. الصفحات الأساسية ({pages.filter((p) => p.isCore).length}) لا يمكن إيقافها.
          التغييرات تُحفظ في المتصفح وتُزامَن مع قاعدة البيانات عند الضغط على «حفظ».
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
        {[
          { label: "إجمالي الصفحات", value: pages.length, color: "var(--con-brand)" },
          { label: "مفعّلة",           value: pages.filter((p) => p.enabled).length, color: "var(--con-success)" },
          { label: "معطّلة",           value: pages.filter((p) => !p.enabled).length, color: "var(--con-danger)" },
        ].map((k) => (
          <div key={k.label} className="con-kpi-card" style={{ borderTop: `2px solid ${k.color}`, padding: "0.875rem 1rem" }}>
            <p style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginBottom: "0.375rem" }}>{k.label}</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "var(--con-font-mono)", color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Page list by group */}
      {groups.map((group) => {
        const groupPages = pages.filter((p) => p.group === group);
        return (
          <div key={group} style={{ marginBottom: "1rem" }}>
            <p style={{
              fontSize: "var(--con-text-caption)", fontWeight: 600,
              color: "var(--con-text-muted)",
              textTransform: "uppercase", letterSpacing: "0.06em",
              padding: "0 0.25rem", marginBottom: "0.375rem",
            }}>
              {group}
            </p>

            <div className="con-card" style={{ padding: 0, overflow: "hidden" }}>
              {groupPages.map((page, localIdx) => {
                const idx = flatIndex(page.id);
                const isDraggingThis = drag.dragIndex === idx;
                const isOver = drag.overIndex === idx && drag.dragIndex !== idx;

                return (
                  <div
                    key={page.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.75rem",
                      padding: "0.75rem 1rem",
                      borderBottom: localIdx < groupPages.length - 1 ? "1px solid var(--con-border-default)" : "none",
                      background: isDraggingThis
                        ? "var(--con-bg-elevated)"
                        : isOver
                        ? "var(--con-brand-subtle)"
                        : "transparent",
                      opacity: isDraggingThis ? 0.5 : 1,
                      cursor: "grab",
                      transition: "background 0.1s",
                      borderLeft: isOver ? "2px solid var(--con-brand)" : "2px solid transparent",
                    }}
                  >
                    {/* Drag handle */}
                    <GripVertical size={15} style={{ color: "var(--con-text-muted)", flexShrink: 0, cursor: "grab" }} />

                    {/* Icon */}
                    <div style={{
                      width: "30px", height: "30px",
                      borderRadius: "var(--con-radius-sm)",
                      background: page.enabled ? "var(--con-brand-subtle)" : "var(--con-bg-elevated)",
                      border: `1px solid ${page.enabled ? "var(--con-brand-border)" : "var(--con-border-default)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                      color: page.enabled ? "var(--con-brand)" : "var(--con-text-muted)",
                      transition: "all 0.15s",
                    }}>
                      <PageIcon name={page.icon} size={14} />
                    </div>

                    {/* Label + meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{
                          fontSize: "13px", fontWeight: 600,
                          color: page.enabled ? "var(--con-text-primary)" : "var(--con-text-muted)",
                          transition: "color 0.15s",
                        }}>
                          {page.label}
                        </span>
                        {page.isCore && (
                          <span className="con-badge-sm con-badge-muted">أساسي</span>
                        )}
                        {page.permission && (
                          <span className="con-badge-sm con-badge-brand">{page.permission}</span>
                        )}
                      </div>
                      <p style={{ fontSize: "11px", color: "var(--con-text-muted)", fontFamily: "var(--con-font-mono)", marginTop: "1px" }}>
                        {page.path}
                      </p>
                    </div>

                    {/* Order badge */}
                    <span style={{
                      fontSize: "11px", fontWeight: 700, fontFamily: "var(--con-font-mono)",
                      color: "var(--con-text-muted)",
                      background: "var(--con-bg-elevated)",
                      border: "1px solid var(--con-border-default)",
                      borderRadius: "4px",
                      padding: "1px 6px",
                      flexShrink: 0,
                    }}>
                      #{page.order + 1}
                    </span>

                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleEnabled(page.id); }}
                      disabled={page.isCore}
                      title={page.isCore ? "صفحة أساسية لا يمكن إيقافها" : page.enabled ? "إيقاف الصفحة" : "تفعيل الصفحة"}
                      style={{
                        background: "none", border: "none", cursor: page.isCore ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", padding: "2px",
                        color: page.isCore
                          ? "var(--con-text-muted)"
                          : page.enabled
                          ? "var(--con-success)"
                          : "var(--con-border-strong)",
                        transition: "color 0.15s",
                        opacity: page.isCore ? 0.4 : 1,
                      }}
                    >
                      {page.enabled
                        ? <ToggleRight size={22} />
                        : <ToggleLeft size={22} />}
                    </button>

                    {/* Visible/hidden icon */}
                    <div style={{ color: page.enabled ? "var(--con-text-muted)" : "var(--con-border-strong)", flexShrink: 0 }}>
                      {page.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div style={{
        display: "flex", gap: "1.5rem", flexWrap: "wrap",
        padding: "0.875rem 1rem",
        background: "var(--con-bg-surface-1)",
        border: "1px solid var(--con-border-default)",
        borderRadius: "var(--con-radius)",
        marginTop: "0.75rem",
        fontSize: "var(--con-text-caption)",
        color: "var(--con-text-muted)",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <GripVertical size={13} /> اسحب لإعادة الترتيب
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <ToggleRight size={13} style={{ color: "var(--con-success)" }} /> مفعّل في القائمة الجانبية
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <ToggleLeft size={13} /> مخفي من القائمة الجانبية
        </span>
      </div>
    </div>
  );
}

// ─── Export config loader for Sidebar ─────────────────────────────────────────
export { loadConfig, DEFAULT_PAGES };
