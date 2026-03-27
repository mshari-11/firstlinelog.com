/**
 * Pending Approvals Widget — Approval queue with inline approve/reject
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { WidgetShell } from "../WidgetShell";
import { useDashboardStore } from "@/stores/useDashboardStore";

interface ApprovalItem {
  id: string;
  title: string;
  by: string;
  time: string;
  type: string;
  amount?: string;
}

const mockApprovals: ApprovalItem[] = [
  { id: "apr-001", title: "استيراد Excel — رواتب فبراير 2026", by: "محمد الشمري", time: "منذ 2 ساعة", type: "excel", amount: "128,000 ر.س" },
  { id: "apr-002", title: "تعديل راتب — خالد العمري", by: "قسم المالية", time: "منذ 5 ساعات", type: "finance" },
  { id: "apr-003", title: "طلب انضمام سائق — فهد الغامدي", by: "فهد الغامدي", time: "منذ يوم", type: "driver" },
  { id: "apr-004", title: "دفعة رواتب مارس — 47 سائق", by: "قسم المالية", time: "منذ يوم", type: "payout", amount: "156,000 ر.س" },
];

export function PendingApprovals() {
  const navigate = useNavigate();
  const { stats } = useDashboardStore();
  const [approvals, setApprovals] = useState(mockApprovals);

  const handleApprove = (id: string) => {
    setApprovals((prev) => prev.filter((a) => a.id !== id));
  };

  const handleReject = (id: string) => {
    setApprovals((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <WidgetShell
      id="pending-approvals"
      title="اعتمادات تنتظر مراجعتك"
      subtitle={`${approvals.length} اعتماد معلق`}
      icon={Clock}
      iconColor="var(--con-warning)"
      onDrilldown={() => navigate("/admin-panel/approvals")}
    >
      {approvals.length === 0 ? (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <CheckCircle2 size={28} style={{ color: "var(--con-success)", marginBottom: 8 }} />
          <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)", margin: 0 }}>
            لا توجد اعتمادات معلقة
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {approvals.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                borderRadius: "var(--con-radius)",
                background: "var(--con-bg-surface-2)",
                border: "1px solid var(--con-border-default)",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "var(--con-text-body)", fontWeight: 500, color: "var(--con-text-primary)" }}>
                  {item.title}
                </div>
                <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginTop: 2 }}>
                  {item.by} · {item.time}
                  {item.amount && (
                    <span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-info)", marginRight: 8 }}>
                      {item.amount}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button
                  onClick={() => handleApprove(item.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    padding: "4px 10px",
                    borderRadius: 5,
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: "var(--con-font-primary)",
                    background: "rgba(22,163,74,0.1)",
                    color: "var(--con-success)",
                    border: "1px solid rgba(22,163,74,0.25)",
                    cursor: "pointer",
                  }}
                >
                  <CheckCircle2 size={12} /> اعتماد
                </button>
                <button
                  onClick={() => handleReject(item.id)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 5,
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: "var(--con-font-primary)",
                    background: "rgba(220,38,38,0.08)",
                    color: "var(--con-danger)",
                    border: "1px solid rgba(220,38,38,0.2)",
                    cursor: "pointer",
                  }}
                >
                  رفض
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}
