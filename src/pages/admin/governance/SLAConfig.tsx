/**
 * إعدادات SLA — SLA Configuration
 * Define SLA rules, escalation chains, auto-alert triggers, priorities, and notifications
 */
import { useState, useEffect } from "react";
import {
  Timer, Plus, AlertTriangle, Bell, Edit2, Trash2, Save,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Zap,
  Users, Package, Truck, MessageSquare, DollarSign, FileText,
  Settings, ToggleLeft, ToggleRight, Copy, Search, X,
} from "lucide-react";
import {
  PageWrapper,
  PageHeader,
  Card,
  KPIGrid,
  KPICard,
  Badge,
  Button,
  Toolbar,
  Select,
  Modal,
} from "@/components/admin/ui";
import {
  DEFAULT_SLA_RULES,
  type SLARule,
  type SLAUnit,
  type EscalationRule,
} from "@/lib/admin/governance";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// ─── Constants ───────────────────────────────────────────────────────────────

const VALID_UNITS: SLAUnit[] = ["minutes", "hours", "days", "percentage", "count"];

const unitLabels: Record<SLAUnit, string> = {
  minutes: "دقيقة",
  hours: "ساعة",
  days: "يوم",
  percentage: "%",
  count: "عدد",
};

type Priority = "critical" | "high" | "medium" | "low";

const priorityConfig: Record<Priority, { label: string; color: string; bg: string }> = {
  critical: { label: "حرج", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  high: { label: "عالي", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  medium: { label: "متوسط", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  low: { label: "منخفض", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
};

const moduleConfig: Record<string, { label: string; icon: any; color: string }> = {
  orders: { label: "الطلبات", icon: Package, color: "#3b82f6" },
  complaints: { label: "الشكاوى", icon: MessageSquare, color: "#ef4444" },
  approvals: { label: "الاعتمادات", icon: CheckCircle2, color: "#f59e0b" },
  finance: { label: "المالية", icon: DollarSign, color: "#22c55e" },
  couriers: { label: "المناديب", icon: Truck, color: "#8b5cf6" },
  hr: { label: "الموارد البشرية", icon: Users, color: "#ec4899" },
  vehicles: { label: "المركبات", icon: Truck, color: "#06b6d4" },
  reports: { label: "التقارير", icon: FileText, color: "#64748b" },
  system: { label: "النظام", icon: Settings, color: "#475569" },
};

const notifyMethods = [
  { value: "dashboard", label: "لوحة التحكم" },
  { value: "email", label: "بريد إلكتروني" },
  { value: "sms", label: "رسالة SMS" },
  { value: "all", label: "جميع القنوات" },
];

const roles = [
  { value: "staff_operations", label: "موظف التشغيل" },
  { value: "staff_finance", label: "موظف المالية" },
  { value: "staff_hr", label: "الموارد البشرية" },
  { value: "admin", label: "مدير النظام" },
  { value: "owner", label: "المالك" },
];

// ─── Extended SLA Rule with priority ─────────────────────────────────────────

interface ExtendedSLARule extends SLARule {
  priority?: Priority;
  description?: string;
  autoAction?: string;
  notifyOnResolve?: boolean;
  workingHoursOnly?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SLAConfig() {
  const [rules, setRules] = useState<ExtendedSLARule[]>([]);
  const [filter, setFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRule, setEditingRule] = useState<ExtendedSLARule | null>(null);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ─── Form State ─────────────────────────────────────────────────────────
  const emptyForm: ExtendedSLARule = {
    id: "",
    moduleId: "orders",
    metricName: "",
    metricNameAr: "",
    thresholdValue: 0,
    thresholdUnit: "hours",
    escalationChain: [],
    isActive: true,
    priority: "medium",
    description: "",
    autoAction: "none",
    notifyOnResolve: false,
    workingHoursOnly: true,
  };
  const [form, setForm] = useState<ExtendedSLARule>(emptyForm);

  // ─── Load Rules ─────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        if (!supabase) throw new Error("no client");
        const { data, error } = await supabase
          .schema("admin")
          .from("sla_rules")
          .select("*")
          .order("module_id");
        if (error || !data || data.length === 0) {
          setRules(DEFAULT_SLA_RULES.map(r => ({ ...r, priority: "medium" as Priority })));
          return;
        }
        const mapped: ExtendedSLARule[] = data.map((row) => ({
          id: row.id as string,
          moduleId: row.module_id as string,
          metricName: row.metric_name as string,
          metricNameAr: (row.metric_name_ar ?? row.metric_name) as string,
          thresholdValue: Number(row.threshold_value ?? 0),
          thresholdUnit: VALID_UNITS.includes(row.threshold_unit as SLAUnit)
            ? (row.threshold_unit as SLAUnit) : "hours",
          escalationChain: Array.isArray(row.escalation_chain)
            ? (row.escalation_chain as EscalationRule[]) : [],
          isActive: Boolean(row.is_active),
          priority: (row.priority as Priority) || "medium",
          description: (row.description as string) || "",
          autoAction: (row.auto_action as string) || "none",
          notifyOnResolve: Boolean(row.notify_on_resolve),
          workingHoursOnly: row.working_hours_only !== false,
        }));
        setRules(mapped);
      } catch {
        setRules(DEFAULT_SLA_RULES.map(r => ({ ...r, priority: "medium" as Priority })));
      }
    })();
  }, []);

  // ─── Save Rule ──────────────────────────────────────────────────────────
  async function saveRule() {
    if (!form.metricNameAr.trim()) { toast.error("أدخل اسم القاعدة"); return; }
    if (form.thresholdValue <= 0) { toast.error("أدخل قيمة الحد الأقصى"); return; }
    setSaving(true);
    const isNew = !form.id || form.id.startsWith("new-");
    const ruleId = isNew ? `sla-${Date.now()}` : form.id;
    const updated = { ...form, id: ruleId };

    if (supabase) {
      try {
        const payload = {
          id: ruleId,
          module_id: form.moduleId,
          metric_name: form.metricName || form.metricNameAr,
          metric_name_ar: form.metricNameAr,
          threshold_value: form.thresholdValue,
          threshold_unit: form.thresholdUnit,
          escalation_chain: form.escalationChain,
          is_active: form.isActive,
          priority: form.priority,
          description: form.description,
          auto_action: form.autoAction,
          notify_on_resolve: form.notifyOnResolve,
          working_hours_only: form.workingHoursOnly,
        };
        const { error } = await supabase.schema("admin").from("sla_rules").upsert(payload, { onConflict: "id" });
        if (error) {
          console.error("SLA save error:", error);
          toast.error("تعذّر حفظ القاعدة في السحابة — تم الحفظ محلياً");
        } else {
          toast.success(isNew ? "تمت إضافة القاعدة" : "تم تحديث القاعدة");
        }
      } catch (e) {
        console.error(e);
        toast.error("خطأ في الاتصال — تم الحفظ محلياً");
      }
    }

    if (isNew) {
      setRules(prev => [...prev, updated]);
    } else {
      setRules(prev => prev.map(r => r.id === ruleId ? updated : r));
    }
    setShowAddModal(false);
    setEditingRule(null);
    setForm(emptyForm);
    setSaving(false);
    toast.success(isNew ? "تمت إضافة القاعدة" : "تم تحديث القاعدة");
  }

  // ─── Delete Rule ────────────────────────────────────────────────────────
  async function deleteRule(id: string) {
    if (supabase) {
      try {
        await supabase.schema("admin").from("sla_rules").delete().eq("id", id);
      } catch { /* continue */ }
    }
    setRules(prev => prev.filter(r => r.id !== id));
    toast.success("تم حذف القاعدة");
  }

  // ─── Toggle Rule ────────────────────────────────────────────────────────
  async function toggleRule(id: string) {
    const rule = rules.find(r => r.id === id);
    if (!rule) return;
    const newActive = !rule.isActive;
    setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: newActive } : r));
    if (supabase) {
      try {
        await supabase.schema("admin").from("sla_rules").update({ is_active: newActive }).eq("id", id);
      } catch { /* silent */ }
    }
    toast.success(newActive ? "تم تفعيل القاعدة" : "تم تعطيل القاعدة");
  }

  // ─── Add Escalation Step ────────────────────────────────────────────────
  function addEscalationStep() {
    setForm(prev => ({
      ...prev,
      escalationChain: [...prev.escalationChain, { afterHours: 1, notifyRole: "admin", notifyMethod: "dashboard" as const }],
    }));
  }

  function removeEscalationStep(idx: number) {
    setForm(prev => ({
      ...prev,
      escalationChain: prev.escalationChain.filter((_, i) => i !== idx),
    }));
  }

  function updateEscalationStep(idx: number, field: keyof EscalationRule, value: any) {
    setForm(prev => ({
      ...prev,
      escalationChain: prev.escalationChain.map((step, i) => i === idx ? { ...step, [field]: value } : step),
    }));
  }

  // ─── Duplicate Rule ─────────────────────────────────────────────────────
  function duplicateRule(rule: ExtendedSLARule) {
    const newRule = { ...rule, id: `new-${Date.now()}`, metricNameAr: rule.metricNameAr + " (نسخة)", isActive: false };
    setForm(newRule);
    setShowAddModal(true);
  }

  // ─── Open Edit ──────────────────────────────────────────────────────────
  function openEdit(rule: ExtendedSLARule) {
    setForm({ ...rule });
    setEditingRule(rule);
    setShowAddModal(true);
  }

  // ─── Filtering ──────────────────────────────────────────────────────────
  const filtered = rules.filter(r => {
    if (filter === "active" && !r.isActive) return false;
    if (filter === "inactive" && r.isActive) return false;
    if (moduleFilter !== "all" && r.moduleId !== moduleFilter) return false;
    if (priorityFilter !== "all" && r.priority !== priorityFilter) return false;
    if (search && !r.metricNameAr.includes(search) && !r.moduleId.includes(search)) return false;
    return true;
  });

  const activeCount = rules.filter(r => r.isActive).length;
  const criticalCount = rules.filter(r => r.priority === "critical" && r.isActive).length;
  const totalEscalations = rules.reduce((sum, r) => sum + r.escalationChain.length, 0);

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <PageWrapper>
      <PageHeader
        icon={Timer}
        title="إعدادات مستوى الخدمة (SLA)"
        subtitle="تحديد قواعد مستوى الخدمة، سلاسل التصعيد، الأولويات، التنبيهات التلقائية، والإجراءات الآلية"
        actions={
          <Button icon={Plus} onClick={() => { setForm(emptyForm); setEditingRule(null); setShowAddModal(true); }}>
            إضافة قاعدة SLA
          </Button>
        }
      />

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <KPIGrid cols="repeat(5, 1fr)">
        <KPICard label="إجمالي القواعد" value={rules.length} icon={Timer} accent="var(--con-brand)" />
        <KPICard label="نشطة" value={activeCount} icon={CheckCircle2} accent="var(--con-success)" />
        <KPICard label="معطّلة" value={rules.length - activeCount} icon={XCircle} accent="var(--con-danger)" />
        <KPICard label="حرجة" value={criticalCount} icon={AlertTriangle} accent="#ef4444" />
        <KPICard label="سلاسل التصعيد" value={totalEscalations} icon={Bell} accent="var(--con-warning)" />
      </KPIGrid>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <Toolbar>
        <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
          <Search size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--con-text-disabled)", pointerEvents: "none" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث في القواعد..."
            style={{ width: "100%", padding: "7px 32px 7px 10px", fontSize: 13, background: "var(--con-bg-elevated)", border: "1px solid var(--con-border-default)", borderRadius: "var(--con-radius-sm)", color: "var(--con-text-primary)", outline: "none" }}
          />
        </div>
        <Select value={filter} onChange={setFilter} options={[
          { value: "all", label: "الكل" },
          { value: "active", label: "نشطة" },
          { value: "inactive", label: "معطّلة" },
        ]} />
        <Select value={moduleFilter} onChange={setModuleFilter} options={[
          { value: "all", label: "كل الأقسام" },
          ...Object.entries(moduleConfig).map(([k, v]) => ({ value: k, label: v.label })),
        ]} />
        <Select value={priorityFilter} onChange={setPriorityFilter} options={[
          { value: "all", label: "كل الأولويات" },
          ...Object.entries(priorityConfig).map(([k, v]) => ({ value: k, label: v.label })),
        ]} />
      </Toolbar>

      {/* ── Empty State ──────────────────────────────────────────────────── */}
      {filtered.length === 0 && (
        <Card style={{ padding: "3rem", textAlign: "center" }}>
          <Timer size={48} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>لا توجد قواعد SLA</h3>
          <p style={{ color: "var(--con-text-muted)", marginBottom: "1rem" }}>أضف قواعد جديدة لمراقبة مستوى الخدمة</p>
          <Button icon={Plus} onClick={() => { setForm(emptyForm); setShowAddModal(true); }}>إضافة قاعدة</Button>
        </Card>
      )}

      {/* ── Rules List ────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map((rule) => {
          const mod = moduleConfig[rule.moduleId] || moduleConfig.system;
          const pri = priorityConfig[rule.priority || "medium"];
          const ModIcon = mod.icon;
          const isExpanded = expandedRule === rule.id;

          return (
            <Card key={rule.id} style={{ opacity: rule.isActive ? 1 : 0.6, transition: "opacity 0.2s" }}>
              {/* Header */}
              <div
                style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "4px 0" }}
                onClick={() => setExpandedRule(isExpanded ? null : rule.id)}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: mod.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ModIcon size={18} style={{ color: mod.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--con-text-primary)" }}>{rule.metricNameAr}</span>
                    <Badge variant={rule.isActive ? "success" : "muted"} dot>{rule.isActive ? "نشط" : "معطّل"}</Badge>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: pri.bg, color: pri.color, fontWeight: 600 }}>{pri.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--con-text-muted)", marginTop: 2 }}>
                    {mod.label} — الحد: <strong style={{ fontFamily: "var(--con-font-mono)" }}>{rule.thresholdValue} {unitLabels[rule.thresholdUnit]}</strong>
                    {rule.escalationChain.length > 0 && <> — {rule.escalationChain.length} مرحلة تصعيد</>}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button onClick={e => { e.stopPropagation(); toggleRule(rule.id); }} title={rule.isActive ? "تعطيل" : "تفعيل"} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: rule.isActive ? "var(--con-success)" : "var(--con-text-muted)" }}>
                    {rule.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  </button>
                  <button onClick={e => { e.stopPropagation(); openEdit(rule); }} title="تعديل" style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "var(--con-text-muted)" }}>
                    <Edit2 size={15} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); duplicateRule(rule); }} title="نسخ" style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "var(--con-text-muted)" }}>
                    <Copy size={15} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); deleteRule(rule.id); }} title="حذف" style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "var(--con-danger)" }}>
                    <Trash2 size={15} />
                  </button>
                  {isExpanded ? <ChevronUp size={16} style={{ color: "var(--con-text-muted)" }} /> : <ChevronDown size={16} style={{ color: "var(--con-text-muted)" }} />}
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--con-border-default)" }}>
                  {/* Description */}
                  {rule.description && (
                    <p style={{ fontSize: 13, color: "var(--con-text-secondary)", marginBottom: 12, lineHeight: 1.6 }}>{rule.description}</p>
                  )}

                  {/* Settings Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 14 }}>
                    <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--con-bg-surface-2)", border: "1px solid var(--con-border-default)" }}>
                      <div style={{ fontSize: 11, color: "var(--con-text-muted)", marginBottom: 4 }}>ساعات العمل فقط</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--con-text-primary)" }}>{rule.workingHoursOnly ? "نعم (8ص - 10م)" : "24/7"}</div>
                    </div>
                    <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--con-bg-surface-2)", border: "1px solid var(--con-border-default)" }}>
                      <div style={{ fontSize: 11, color: "var(--con-text-muted)", marginBottom: 4 }}>إشعار عند الحل</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--con-text-primary)" }}>{rule.notifyOnResolve ? "نعم" : "لا"}</div>
                    </div>
                    <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--con-bg-surface-2)", border: "1px solid var(--con-border-default)" }}>
                      <div style={{ fontSize: 11, color: "var(--con-text-muted)", marginBottom: 4 }}>إجراء تلقائي</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--con-text-primary)" }}>
                        {rule.autoAction === "none" ? "لا يوجد" : rule.autoAction === "pause_orders" ? "إيقاف الطلبات" : rule.autoAction === "notify_client" ? "إشعار العميل" : rule.autoAction === "reassign" ? "إعادة تعيين" : rule.autoAction || "لا يوجد"}
                      </div>
                    </div>
                  </div>

                  {/* Escalation Chain */}
                  {rule.escalationChain.length > 0 && (
                    <>
                      <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--con-text-muted)", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                        <Zap size={13} /> سلسلة التصعيد
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {rule.escalationChain.map((esc, idx) => (
                          <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", borderRadius: 8, background: "var(--con-bg-surface-2)", border: "1px solid var(--con-border-default)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ width: 24, height: 24, borderRadius: "50%", background: idx === 0 ? "var(--con-warning)" : idx === 1 ? "#f97316" : "#ef4444", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                                {idx + 1}
                              </span>
                              <span style={{ fontSize: 13, color: "var(--con-text-primary)" }}>
                                بعد <strong style={{ fontFamily: "var(--con-font-mono)" }}>{esc.afterHours} ساعة</strong> → إشعار <strong>{roles.find(r => r.value === esc.notifyRole)?.label || esc.notifyRole}</strong>
                              </span>
                            </div>
                            <Badge variant={esc.notifyMethod === "all" ? "danger" : esc.notifyMethod === "email" ? "info" : esc.notifyMethod === "sms" ? "warning" : "brand"}>
                              {notifyMethods.find(m => m.value === esc.notifyMethod)?.label || esc.notifyMethod}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* ── Add/Edit Modal ────────────────────────────────────────────────── */}
      {showAddModal && (
        <Modal
          open
          onClose={() => { setShowAddModal(false); setEditingRule(null); setForm(emptyForm); }}
          title={editingRule ? "تعديل قاعدة SLA" : "إضافة قاعدة SLA جديدة"}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "8px 0" }}>
            {/* Row 1: Name + Module */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--con-text-muted)", display: "block", marginBottom: 4 }}>اسم القاعدة *</label>
                <input value={form.metricNameAr} onChange={e => setForm(p => ({ ...p, metricNameAr: e.target.value }))} placeholder="مثال: متوسط وقت التوصيل" className="con-input" style={{ width: "100%" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--con-text-muted)", display: "block", marginBottom: 4 }}>القسم</label>
                <select value={form.moduleId} onChange={e => setForm(p => ({ ...p, moduleId: e.target.value }))} className="con-input" style={{ width: "100%" }}>
                  {Object.entries(moduleConfig).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
                </select>
              </div>
            </div>

            {/* Row 2: Threshold + Unit + Priority */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--con-text-muted)", display: "block", marginBottom: 4 }}>الحد الأقصى *</label>
                <input type="number" value={form.thresholdValue} onChange={e => setForm(p => ({ ...p, thresholdValue: Number(e.target.value) }))} className="con-input" style={{ width: "100%" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--con-text-muted)", display: "block", marginBottom: 4 }}>الوحدة</label>
                <select value={form.thresholdUnit} onChange={e => setForm(p => ({ ...p, thresholdUnit: e.target.value as SLAUnit }))} className="con-input" style={{ width: "100%" }}>
                  {VALID_UNITS.map(u => (<option key={u} value={u}>{unitLabels[u]}</option>))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--con-text-muted)", display: "block", marginBottom: 4 }}>الأولوية</label>
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as Priority }))} className="con-input" style={{ width: "100%" }}>
                  {Object.entries(priorityConfig).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--con-text-muted)", display: "block", marginBottom: 4 }}>الوصف</label>
              <textarea value={form.description || ""} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="وصف القاعدة والغرض منها..." className="con-input" style={{ width: "100%", minHeight: 60, resize: "vertical" }} />
            </div>

            {/* Row 3: Options */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--con-text-muted)", display: "block", marginBottom: 4 }}>إجراء تلقائي</label>
                <select value={form.autoAction || "none"} onChange={e => setForm(p => ({ ...p, autoAction: e.target.value }))} className="con-input" style={{ width: "100%" }}>
                  <option value="none">لا يوجد</option>
                  <option value="pause_orders">إيقاف استقبال الطلبات</option>
                  <option value="notify_client">إشعار العميل</option>
                  <option value="reassign">إعادة تعيين المندوب</option>
                  <option value="escalate_immediately">تصعيد فوري</option>
                </select>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", paddingTop: 22 }}>
                <input type="checkbox" checked={form.workingHoursOnly} onChange={e => setForm(p => ({ ...p, workingHoursOnly: e.target.checked }))} />
                <span style={{ fontSize: 13 }}>ساعات العمل فقط</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", paddingTop: 22 }}>
                <input type="checkbox" checked={form.notifyOnResolve} onChange={e => setForm(p => ({ ...p, notifyOnResolve: e.target.checked }))} />
                <span style={{ fontSize: 13 }}>إشعار عند الحل</span>
              </label>
            </div>

            {/* Escalation Chain */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--con-text-muted)" }}>سلسلة التصعيد</label>
                <button onClick={addEscalationStep} style={{ fontSize: 12, color: "var(--con-brand)", background: "none", border: "1px solid var(--con-brand)", borderRadius: 6, padding: "3px 10px", cursor: "pointer" }}>+ إضافة مرحلة</button>
              </div>
              {form.escalationChain.map((step, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr auto", gap: 8, marginBottom: 8, alignItems: "center" }}>
                  <input type="number" value={step.afterHours} onChange={e => updateEscalationStep(idx, "afterHours", Number(e.target.value))} placeholder="ساعات" className="con-input" style={{ width: "100%" }} />
                  <select value={step.notifyRole} onChange={e => updateEscalationStep(idx, "notifyRole", e.target.value)} className="con-input" style={{ width: "100%" }}>
                    {roles.map(r => (<option key={r.value} value={r.value}>{r.label}</option>))}
                  </select>
                  <select value={step.notifyMethod} onChange={e => updateEscalationStep(idx, "notifyMethod", e.target.value)} className="con-input" style={{ width: "100%" }}>
                    {notifyMethods.map(m => (<option key={m.value} value={m.value}>{m.label}</option>))}
                  </select>
                  <button onClick={() => removeEscalationStep(idx)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--con-danger)", padding: 4 }}>
                    <X size={16} />
                  </button>
                </div>
              ))}
              {form.escalationChain.length === 0 && (
                <p style={{ fontSize: 12, color: "var(--con-text-disabled)", textAlign: "center", padding: 12 }}>لا توجد مراحل تصعيد — اضغط "إضافة مرحلة"</p>
              )}
            </div>

            {/* Save Button */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 8, borderTop: "1px solid var(--con-border-default)" }}>
              <Button variant="ghost" onClick={() => { setShowAddModal(false); setEditingRule(null); setForm(emptyForm); }}>إلغاء</Button>
              <Button icon={Save} onClick={saveRule} disabled={saving}>
                {saving ? "جاري الحفظ..." : editingRule ? "تحديث القاعدة" : "إضافة القاعدة"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageWrapper>
  );
}
