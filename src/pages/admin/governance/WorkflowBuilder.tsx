/**
 * سير عمل الاعتماد — Workflow Builder
 * Configure approval chains with SLA timers
 */
import { useState, useEffect } from "react";
import { GitBranch, Plus, Play, Pause, Clock, Users, ArrowDown } from "lucide-react";
import { PageWrapper, PageHeader, Card, KPIGrid, KPICard, Badge, Button } from "@/components/admin/ui";
import { DEFAULT_WORKFLOWS, type WorkflowDefinition, type ApprovalStep } from "@/lib/admin/governance";
import { supabase } from "@/lib/supabase";

export default function WorkflowBuilder() {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>(DEFAULT_WORKFLOWS);

  useEffect(() => {
    (async () => {
      try {
        if (!supabase) throw new Error("no client");
        const { data, error } = await supabase
          .schema("admin")
          .from("workflows")
          .select("*")
          .order("name");
        if (error || !data || data.length === 0) return;

        const mapped: WorkflowDefinition[] = data.map((row) => ({
          id: row.id as string,
          name: row.name as string,
          nameAr: (row.name_ar ?? row.name) as string,
          triggerModule: row.trigger_module as string,
          triggerAction: row.trigger_action as string,
          approvalChain: Array.isArray(row.approval_chain)
            ? (row.approval_chain as ApprovalStep[])
            : [],
          slaHours: Number(row.sla_hours ?? 0),
          isActive: Boolean(row.is_active),
          createdAt: new Date().toISOString(),
        }));
        setWorkflows(mapped);
      } catch {
        // silent — keep DEFAULT_WORKFLOWS fallback
      }
    })();
  }, []);

  const active = workflows.filter((w) => w.isActive).length;

  const toggleActive = (id: string) => {
    setWorkflows((prev) => prev.map((w) => (w.id === id ? { ...w, isActive: !w.isActive } : w)));
  };

  return (
    <PageWrapper>
      <PageHeader
        icon={GitBranch}
        title="سير عمل الاعتماد"
        subtitle="تكوين سلاسل الموافقة ومهلات SLA للعمليات الحساسة"
        actions={<Button icon={Plus}>إضافة سير عمل</Button>}
      />

      <KPIGrid cols="repeat(3, 1fr)">
        <KPICard label="إجمالي سير العمل" value={workflows.length} icon={GitBranch} accent="var(--con-brand)" />
        <KPICard label="نشط" value={active} icon={Play} accent="var(--con-success)" />
        <KPICard label="متوقف" value={workflows.length - active} icon={Pause} accent="var(--con-danger)" />
      </KPIGrid>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {workflows.map((wf) => (
          <Card
            key={wf.id}
            title={wf.nameAr}
            subtitle={`الوحدة: ${wf.triggerModule} · الإجراء: ${wf.triggerAction}`}
            actions={
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Badge variant={wf.isActive ? "success" : "muted"} dot>
                  {wf.isActive ? "نشط" : "متوقف"}
                </Badge>
                <Button variant="ghost" onClick={() => toggleActive(wf.id)}>
                  {wf.isActive ? "إيقاف" : "تفعيل"}
                </Button>
              </div>
            }
          >
            {/* SLA Timer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
                padding: "8px 12px",
                borderRadius: "var(--con-radius)",
                background: "var(--con-bg-surface-2)",
                border: "1px solid var(--con-border-default)",
              }}
            >
              <Clock size={14} style={{ color: "var(--con-warning)" }} />
              <span style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-secondary)" }}>
                مهلة إجمالية: <strong style={{ color: "var(--con-text-primary)", fontFamily: "var(--con-font-mono)" }}>{wf.slaHours} ساعة</strong>
              </span>
            </div>

            {/* Approval Chain */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              {wf.approvalChain.map((step, idx) => (
                <div key={idx} style={{ width: "100%" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      borderRadius: "var(--con-radius)",
                      background: "var(--con-bg-surface-2)",
                      border: "1px solid var(--con-border-default)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: "var(--con-brand-subtle)",
                          border: "1px solid var(--con-border-brand)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--con-brand)",
                          fontFamily: "var(--con-font-mono)",
                        }}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Users size={13} style={{ color: "var(--con-text-muted)" }} />
                          <span style={{ fontSize: "var(--con-text-body)", fontWeight: 600, color: "var(--con-text-primary)" }}>
                            {step.roleAr}
                          </span>
                        </div>
                        <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
                          {step.role}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Clock size={12} style={{ color: "var(--con-warning)" }} />
                      <span style={{ fontSize: "var(--con-text-caption)", fontFamily: "var(--con-font-mono)", color: "var(--con-warning)" }}>
                        {step.slaHours}h
                      </span>
                      {step.escalateTo && (
                        <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
                          → تصعيد: {step.escalateTo}
                        </span>
                      )}
                    </div>
                  </div>
                  {idx < wf.approvalChain.length - 1 && (
                    <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
                      <ArrowDown size={16} style={{ color: "var(--con-text-disabled)" }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </PageWrapper>
  );
}
