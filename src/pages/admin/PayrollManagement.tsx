/**
 * إدارة الرواتب — Payroll Management
 * سجلات رواتب السائقين الشهرية مع الاعتماد والتصدير
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { API_BASE } from "@/lib/api";
import { toast } from "sonner";
import {
  Wallet, Search, Plus, X, Save, Download, Printer, RefreshCw,
  CheckCircle2, XCircle, Clock, DollarSign, Users, Calendar,
  FileSpreadsheet, Eye, Edit3, Filter, ChevronDown, TrendingUp,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────────────── */
interface PayrollRecord {
  id: string;
  driver_id: string;
  driver_name: string;
  phone: string;
  platform: string;
  period: string;           // e.g. "2026-03"
  total_orders: number;
  order_rate: number;
  gross_earnings: number;
  fuel_allowance: number;
  operations_allowance: number;
  performance_bonus: number;
  total_additions: number;
  fll_commission: number;
  vehicle_cost: number;
  insurance: number;
  maintenance: number;
  penalties: number;
  total_deductions: number;
  vat_amount: number;
  net_payout: number;
  status: "draft" | "pending" | "approved" | "paid" | "rejected";
  approved_by?: string;
  approved_at?: string;
  paid_at?: string;
  notes?: string;
  created_at: string;
}

const STATUS_META: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  draft:    { label: "مسودة",      cls: "con-badge-info",    icon: Edit3 },
  pending:  { label: "بانتظار",    cls: "con-badge-warning", icon: Clock },
  approved: { label: "معتمد",      cls: "con-badge-success", icon: CheckCircle2 },
  paid:     { label: "مدفوع",      cls: "con-badge-success", icon: DollarSign },
  rejected: { label: "مرفوض",      cls: "con-badge-danger",  icon: XCircle },
};

const PLATFORMS: Record<string, string> = {
  jahez: "جاهز", hungerstation: "هنقرستيشن", keeta: "كيتا", mrsool: "مرسول",
  toyou: "تويو", ninja: "نينجا", careem: "كريم", other: "أخرى",
};

const fmt = (n: number) => new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(n);

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [headers.join(","), ...data.map(r => headers.map(h => `"${r[h] ?? ""}"`).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename + ".csv"; a.click();
}

/* ── Component ─────────────────────────────────────────────────────────── */
export default function PayrollManagement() {
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      if (supabase) {
        const { data } = await supabase.from("finance.driver_payouts").select("*").order("created_at", { ascending: false }).limit(200);
        if (data?.length) {
          setRecords(data.map((r: any) => ({
            id: r.id, driver_id: r.driver_id || "", driver_name: r.driver_name || r.full_name || "",
            phone: r.phone || r.stc_bank_phone || "", platform: r.platform || "",
            period: r.period || r.period_start?.slice(0, 7) || "", total_orders: r.total_orders || 0,
            order_rate: r.order_rate || 0, gross_earnings: r.gross_earnings || 0,
            fuel_allowance: r.fuel_allowance || 0, operations_allowance: r.operations_allowance || 0,
            performance_bonus: r.performance_bonus || 0, total_additions: r.total_additions || 0,
            fll_commission: r.fll_commission || 0, vehicle_cost: r.vehicle_cost || 0,
            insurance: r.insurance || 0, maintenance: r.maintenance || 0,
            penalties: r.penalties || 0, total_deductions: r.total_deductions || 0,
            vat_amount: r.vat_amount || 0, net_payout: r.net_payout || 0,
            status: r.status || "draft", approved_by: r.approved_by, approved_at: r.approved_at,
            paid_at: r.paid_at, notes: r.notes, created_at: r.created_at || "",
          })));
        }
      }
      const res = await fetch(`${API_BASE}/payout-lines`);
      if (res.ok) {
        const d = await res.json();
        if (d.items?.length && !records.length) {
          setRecords(d.items.map((r: any) => ({
            id: r.id, driver_id: r.driver_id || "", driver_name: r.driver_name || "",
            phone: r.phone || "", platform: r.platform || "", period: r.period || "",
            total_orders: r.total_orders || 0, order_rate: r.order_rate || 0,
            gross_earnings: r.gross_earnings || 0, fuel_allowance: 0, operations_allowance: 0,
            performance_bonus: 0, total_additions: r.total_additions || 0,
            fll_commission: r.fll_commission || 0, vehicle_cost: 0, insurance: 0,
            maintenance: 0, penalties: 0, total_deductions: r.total_deductions || 0,
            vat_amount: r.vat_amount || 0, net_payout: r.net_payout || 0,
            status: r.status || "draft", notes: "", created_at: r.createdAt || "",
          })));
        }
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (search && !r.driver_name.includes(search) && !r.phone.includes(search)) return false;
      if (filterStatus && r.status !== filterStatus) return false;
      if (filterPeriod && r.period !== filterPeriod) return false;
      return true;
    });
  }, [records, search, filterStatus, filterPeriod]);

  const totals = useMemo(() => {
    const t = { count: filtered.length, gross: 0, additions: 0, deductions: 0, net: 0, pending: 0, approved: 0, paid: 0 };
    filtered.forEach(r => {
      t.gross += r.gross_earnings; t.additions += r.total_additions;
      t.deductions += r.total_deductions + r.vat_amount; t.net += r.net_payout;
      if (r.status === "pending") t.pending++;
      if (r.status === "approved") t.approved++;
      if (r.status === "paid") t.paid++;
    });
    return t;
  }, [filtered]);

  const periods = useMemo(() => [...new Set(records.map(r => r.period).filter(Boolean))].sort().reverse(), [records]);

  function toggleSelect(id: string) {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function bulkApprove() {
    const ids = [...selectedIds];
    setRecords(prev => prev.map(r => ids.includes(r.id) && r.status === "pending" ? { ...r, status: "approved", approved_at: new Date().toISOString() } : r));
    setSelectedIds(new Set());
    toast.success(`تم اعتماد ${ids.length} سجل`);
  }

  async function bulkPay() {
    const ids = [...selectedIds];
    setRecords(prev => prev.map(r => ids.includes(r.id) && r.status === "approved" ? { ...r, status: "paid", paid_at: new Date().toISOString() } : r));
    setSelectedIds(new Set());
    toast.success(`تم تحديث ${ids.length} سجل كـ "مدفوع"`);
  }

  function generateSTCExport() {
    const approved = filtered.filter(r => r.status === "approved" || r.status === "paid");
    if (!approved.length) { toast.error("لا توجد سجلات معتمدة للتصدير"); return; }
    const headers = "Reference,Phone,Amount";
    const rows = approved.map(r => {
      const phone = r.phone.replace(/\D/g, "");
      const intPhone = phone.length === 9 && phone.startsWith("5") ? "966" + phone : phone.length === 12 ? phone : "966" + phone;
      return `"${r.driver_name} - ${r.platform} - ${r.period}","${intPhone}",${Math.max(0, r.net_payout).toFixed(2)}`;
    });
    const csv = "\uFEFF" + headers + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `STC_Payroll_${filterPeriod || "all"}.csv`; a.click();
    toast.success("تم تحميل ملف STC Bank");
  }

  const detailRecord = detailId ? records.find(r => r.id === detailId) : null;

  return (
    <div dir="rtl" style={{ padding: "1.5rem", fontFamily: "var(--con-font-arabic)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--con-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Wallet size={18} style={{ color: "#EC4899" }} /> إدارة الرواتب
          </h1>
          <p style={{ fontSize: 12, color: "var(--con-text-muted)", margin: "4px 0 0" }}>سجلات رواتب السائقين — الاعتماد والدفع والتصدير</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {selectedIds.size > 0 && (
            <>
              <button onClick={bulkApprove} className="con-btn" style={{ gap: 6, fontSize: 12, background: "rgba(34,197,94,0.12)", color: "var(--con-success)", border: "1px solid rgba(34,197,94,0.3)" }}>
                <CheckCircle2 size={13} /> اعتماد ({selectedIds.size})
              </button>
              <button onClick={bulkPay} className="con-btn" style={{ gap: 6, fontSize: 12, background: "rgba(59,130,246,0.12)", color: "var(--con-accent)", border: "1px solid rgba(59,130,246,0.3)" }}>
                <DollarSign size={13} /> دفع ({selectedIds.size})
              </button>
            </>
          )}
          <button onClick={generateSTCExport} className="con-btn" style={{ gap: 6, fontSize: 12, background: "rgba(34,197,94,0.08)", color: "var(--con-success)", border: "1px solid rgba(34,197,94,0.2)" }} disabled={!filtered.length}>
            <FileSpreadsheet size={13} /> STC Bank
          </button>
          <button onClick={() => downloadCSV(filtered as any, "payroll_records")} className="con-btn con-btn-ghost" style={{ gap: 6, fontSize: 12 }} disabled={!filtered.length}>
            <Download size={13} /> تصدير
          </button>
          <button onClick={() => window.print()} className="con-btn con-btn-ghost" style={{ gap: 6, fontSize: 12 }}>
            <Printer size={13} />
          </button>
          <button onClick={fetchRecords} disabled={loading} className="con-btn con-btn-ghost" style={{ gap: 6, fontSize: 12 }}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem", marginBottom: "1rem" }}>
        {[
          { label: "السجلات", value: totals.count.toString(), icon: Users, color: "var(--con-text-primary)" },
          { label: "الإجمالي", value: fmt(totals.gross), icon: TrendingUp, color: "var(--con-success)" },
          { label: "بانتظار", value: totals.pending.toString(), icon: Clock, color: "var(--con-warning)" },
          { label: "معتمد", value: totals.approved.toString(), icon: CheckCircle2, color: "var(--con-accent)" },
          { label: "صافي المستحق", value: fmt(totals.net), icon: Wallet, color: "#EC4899" },
        ].map(k => (
          <div key={k.label} className="con-card" style={{ padding: "0.6rem", textAlign: "center" }}>
            <k.icon size={16} style={{ color: k.color, margin: "0 auto 4px" }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 10, color: "var(--con-text-muted)" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <Search size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--con-text-muted)" }} />
          <input className="con-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو الجوال..." style={{ width: "100%", paddingRight: 32, fontSize: 12 }} />
        </div>
        <select className="con-input" value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} style={{ fontSize: 12 }}>
          <option value="">كل الفترات</option>
          {periods.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="con-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ fontSize: 12 }}>
          <option value="">كل الحالات</option>
          {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="con-card" style={{ overflow: "auto" }}>
        {!filtered.length ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--con-text-muted)" }}>
            <Wallet size={48} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
            <p style={{ fontSize: 14 }}>لا توجد سجلات رواتب</p>
            <p style={{ fontSize: 12 }}>أضف سائقين من "تصنيف السائقين" ثم استخدم "حاسبة الرواتب" لإنشاء السجلات</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--con-border-default)" }}>
                <th style={{ padding: "10px 8px", width: 30 }}><input type="checkbox" onChange={e => { if (e.target.checked) setSelectedIds(new Set(filtered.map(r => r.id))); else setSelectedIds(new Set()); }} /></th>
                {["السائق", "المنصة", "الفترة", "الطلبات", "الإجمالي", "الإضافات", "الخصومات", "الصافي", "الحالة", ""].map(h => (
                  <th key={h} style={{ padding: "10px 8px", textAlign: "right", fontWeight: 600, color: "var(--con-text-muted)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const sm = STATUS_META[r.status];
                return (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--con-border-subtle)" }}>
                    <td style={{ padding: "10px 8px" }}><input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} /></td>
                    <td style={{ padding: "10px 8px" }}>
                      <div style={{ fontWeight: 600, color: "var(--con-text-primary)" }}>{r.driver_name || "—"}</div>
                      <div style={{ fontSize: 10, color: "var(--con-text-muted)", fontFamily: "monospace" }}>{r.phone}</div>
                    </td>
                    <td style={{ padding: "10px 8px", color: "var(--con-text-secondary)" }}>{PLATFORMS[r.platform] || r.platform}</td>
                    <td style={{ padding: "10px 8px", fontFamily: "monospace" }}>{r.period}</td>
                    <td style={{ padding: "10px 8px", fontWeight: 600, fontFamily: "monospace" }}>{r.total_orders}</td>
                    <td style={{ padding: "10px 8px", fontFamily: "monospace" }}>{fmt(r.gross_earnings)}</td>
                    <td style={{ padding: "10px 8px", fontFamily: "monospace", color: "var(--con-success)" }}>+{fmt(r.total_additions)}</td>
                    <td style={{ padding: "10px 8px", fontFamily: "monospace", color: "var(--con-danger)" }}>-{fmt(r.total_deductions + r.vat_amount)}</td>
                    <td style={{ padding: "10px 8px", fontWeight: 700, fontFamily: "monospace", color: "var(--con-accent)" }}>{fmt(r.net_payout)}</td>
                    <td style={{ padding: "10px 8px" }}><span className={`con-badge ${sm.cls}`} style={{ fontSize: 10 }}>{sm.label}</span></td>
                    <td style={{ padding: "10px 8px" }}>
                      <button onClick={() => setDetailId(r.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--con-text-muted)" }}><Eye size={13} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {detailRecord && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={() => setDetailId(null)}>
          <div className="con-card" style={{ width: "100%", maxWidth: 500, padding: "1.5rem" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--con-text-primary)", margin: 0 }}>تفاصيل الراتب</h2>
              <button onClick={() => setDetailId(null)} className="con-btn con-btn-ghost" style={{ padding: 4 }}><X size={16} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <Info label="السائق" value={detailRecord.driver_name} />
              <Info label="الجوال" value={detailRecord.phone} mono />
              <Info label="المنصة" value={PLATFORMS[detailRecord.platform] || detailRecord.platform} />
              <Info label="الفترة" value={detailRecord.period} mono />
              <Info label="الطلبات" value={detailRecord.total_orders.toString()} mono />
              <Info label="سعر الطلب" value={fmt(detailRecord.order_rate)} mono />
              <div style={{ gridColumn: "1 / -1", borderTop: "1px solid var(--con-border-subtle)", margin: "4px 0" }} />
              <Info label="الإجمالي" value={fmt(detailRecord.gross_earnings)} mono />
              <Info label="بدل وقود" value={fmt(detailRecord.fuel_allowance)} color="var(--con-success)" />
              <Info label="بدل تشغيل" value={fmt(detailRecord.operations_allowance)} color="var(--con-success)" />
              <Info label="مكافأة" value={fmt(detailRecord.performance_bonus)} color="var(--con-success)" />
              <div style={{ gridColumn: "1 / -1", borderTop: "1px solid var(--con-border-subtle)", margin: "4px 0" }} />
              <Info label="عمولة FLL" value={fmt(detailRecord.fll_commission)} color="var(--con-danger)" />
              <Info label="تكلفة مركبة" value={fmt(detailRecord.vehicle_cost)} color="var(--con-danger)" />
              <Info label="تأمين" value={fmt(detailRecord.insurance)} color="var(--con-danger)" />
              <Info label="جزاءات" value={fmt(detailRecord.penalties)} color="var(--con-danger)" />
              <Info label="ضريبة" value={fmt(detailRecord.vat_amount)} color="var(--con-danger)" />
              <div style={{ gridColumn: "1 / -1", borderTop: "2px solid var(--con-border-default)", margin: "4px 0" }} />
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "0.75rem", background: "rgba(59,130,246,0.06)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "var(--con-text-muted)" }}>صافي المستحق</div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "monospace", color: "var(--con-accent)" }}>{fmt(detailRecord.net_payout)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value, mono, color }: { label: string; value: string; mono?: boolean; color?: string }) {
  return (
    <div style={{ padding: "6px 8px", background: "var(--con-bg-elevated)", borderRadius: 6 }}>
      <div style={{ fontSize: 9, color: "var(--con-text-muted)" }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, fontFamily: mono ? "monospace" : "inherit", color: color || "var(--con-text-primary)" }}>{value}</div>
    </div>
  );
}
