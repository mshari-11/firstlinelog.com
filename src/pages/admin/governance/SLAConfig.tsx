/**
 * إعدادات SLA — SLA Configuration
 * Define SLA rules, escalation chains, auto-alert triggers
 */
import { useState, useEffect } from "react";
import { Timer, Plus, AlertTriangle, Clock, Bell, Edit2 } from "lucide-react";
import { PageWrapper, PageHeader, Card, KPIGrid, KPICard, Badge, Button, Toolbar, Select } from "@/components/admin/ui";
import { DEFAULT_SLA_RULES, type SLARule, type SLAUnit, type EscalationRule } from "@/lib/admin/governance";
import { supabase } from "@/lib/supabase";

const VALID_UNITS: SLAUnit[] = ["minutes", "hours", "days", "percentage", "count"];

const unitLabels: Record<SLAUnit, string> = {
  minutes: "دقيقة",
  hours: "ساعة",
  days: "يوم",
  percentage: "%",
  count: "عدد",
};

export default function SLAConfig() {
  const [rules, setRules] = useState<SLARule[]>(DEFAULT_SLA_RULES);

  useEffect(() => {
    (async () => {
      try {
        if (!supabase) throw new Error("no client");
        const { data, error } = await supabase
          .schema("admin")
          .from("sla_rules")
          .select("*")
          .order("module_id");
        if (error || !data || data.length === 0) return;

        const mapped: SLARule[] = data.map((row) => ({
          id: row.id as string,
          moduleId: row.module_id as string,
          metricName: row.metric_name as string,
          metricNameAr: (row.metric_name_ar ?? row.metric_name) as string,
          thresholdValue: Number(row.threshold_value ?? 0),
          thresholdUnit: VALID_UNITS.includes(row.threshold_unit as SLAUnit)
            ? (row.threshold_unit as SLAUnit)
            : "hours",
          escalationChain: Array.isArray(row.escalation_chain)
            ? (row.escalation_chain as EscalationRule[])
            : [],
          isActive: Boolean(row.is_active),
        }));
        setRules(mapped);
      } catch {
        // silent — keep DEFAULT_SLA_RULES fallback
      }
    })();
  }, []);
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? rules : rules.filter((r) => (filter === "active" ? r.isActive : !r.isActive));
  const activeCount = rules.filter((r) => r.isActive).length;

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)));
  };

  return (
    <PageWrapper>
      <PageHeader
        icon={Timer}
        title="إعدادات SLA"
        subtitle="تحديد قواعد مستوى الخدمة وسلاسل التصعيد والتنبيهات التلقائية"
        actions={<Button icon={Plus}>إضافة قاعدة SLA</Button>}
      />

      <KPIGrid cols="repeat(4, 1fr)">
        <KPICard label="إجمالي القواعد" value={rules.length} icon={Timer} accent="var(--con-brand)" />
        <KPICard label="نشطة" value={activeCount} icon={AlertTriangle} accent="var(--con-success)" />
        <KPICard label="معطّلة" value={rules.length - activeCount} icon={Timer} accent="var(--con-danger)" />
        <KPICard label="سلاسل التصعيد" value={rules.reduce((sum, r) => sum + r.escalationChain.length, 0)} icon={Bell} accent="var(--con-warning)" />
      </KPIGrid>

      <Toolbar>
        <Select
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "الكل" },
            { value: "active", label: "نشطة" },
            { value: "inactive", label: "معطّلة" },
          ]}
        />
      </Toolbar>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filtered.map((rule) => (
          <Card
            key={rule.id}
            title={rule.metricNameAr}
            subtitle={`الوحدة: ${rule.moduleId}`}
            actions={
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Badge variant={rule.isActive ? "success" : "muted"} dot>
                  {rule.isActive ? "نشط" : "معطّل"}
                </Badge>
                <Button variant="ghost" onClick={() => toggleRule(rule.id)}>
                  {rule.isActive ? "تعطيل" : "تفعيل"}
                </Button>
              </div>
            }
          >
            {/* Threshold */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
                padding: "12px 16px",
                borderRadius: "var(--con-radius)",
                background: "var(--con-bg-surface-2)",
                border: "1px solid var(--con-border-default)",
              }}
            >
              <Timer size={16} style={{ color: "var(--con-brand)" }} />
              <div>
                <span style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-secondary)" }}>الحد الأقصى: </span>
                <span
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "var(--con-text-primary)",
                    fontFamily: "var(--con-font-mono)",
                  }}
                >
                  {rule.thresholdValue} {unitLabels[rule.thresholdUnit]}
                </span>
              </div>
            </div>

            {/* Escalation Chain */}
            <h4 style={{ fontSize: "var(--con-text-caption)", fontWeight: 600, color: "var(--con-text-muted)", margin: "0 0 8px" }}>
              سلسلة التصعيد
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {rule.escalationChain.map((esc, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 14px",
                    borderRadius: "var(--con-radius-sm)",
                    background: "var(--con-bg-surface-2)",
                    border: "1px solid var(--con-border-default)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "var(--con-warning)",
                        color: "#000",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        fontFamily: "var(--con-font-mono)",
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-primary)" }}>
                      بعد <strong style={{ fontFamily: "var(--con-font-mono)" }}>{esc.afterHours}h</strong> → إشعار <strong>{esc.notifyRole}</strong>
                    </span>
                  </div>
                  <Badge variant={esc.notifyMethod === "all" ? "danger" : esc.notifyMethod === "email" ? "info" : "brand"}>
                    {esc.notifyMethod === "all" ? "جميع القنوات" : esc.notifyMethod === "email" ? "بريد" : "لوحة التحكم"}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </PageWrapper>
  );
}
