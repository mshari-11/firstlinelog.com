/**
 * Driver Wallet Console — محفظة السائقين
 * Double-entry ledger view, wallet balances, payout batches.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Wallet, TrendingUp, TrendingDown, Clock, CheckCircle2,
  Search, Download, Plus, ArrowUpRight, ArrowDownLeft,
  AlertTriangle, RefreshCw, ChevronDown, X, Layers,
  Package, Zap, Minus, DollarSign, FileText,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface DriverWallet {
  id: string;
  driver_id: string;
  driver_name?: string;
  driver_phone?: string;
  balance: number;
  pending_balance: number;
  total_earned: number;
  total_paid_out: number;
  last_payout_at?: string;
  is_frozen: boolean;
  freeze_reason?: string;
  updated_at: string;
}

interface WalletTransaction {
  id: string;
  driver_id: string;
  driver_name?: string;
  transaction_id: string;
  event_type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description?: string;
  reference_type?: string;
  reference_id?: string;
  created_at: string;
}

interface PayoutBatch {
  id: string;
  batch_ref: string;
  status: "draft" | "pending" | "processing" | "completed" | "failed";
  total_amount: number;
  driver_count: number;
  period_start: string;
  period_end: string;
  created_at: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const EVENT_META: Record<string, { label: string; icon: React.ElementType; color: string; sign: "+" | "-" }> = {
  order_payment: { label: "أرباح طلب",   icon: Package,       color: "var(--con-success)", sign: "+" },
  bonus:         { label: "حافز",         icon: Zap,           color: "var(--con-brand)",   sign: "+" },
  penalty:       { label: "خصم",          icon: Minus,         color: "var(--con-danger)",  sign: "-" },
  vehicle_cost:  { label: "تكلفة مركبة",  icon: DollarSign,    color: "var(--con-warning)", sign: "-" },
  adjustment:    { label: "تعديل",         icon: FileText,      color: "var(--con-info)",    sign: "±" },
  payout:        { label: "دفعة",          icon: ArrowUpRight,  color: "var(--con-text-muted)", sign: "-" },
};

const BATCH_STATUS: Record<string, { label: string; cls: string }> = {
  draft:      { label: "مسودة",    cls: "con-badge con-badge-muted"   },
  pending:    { label: "بانتظار",  cls: "con-badge con-badge-warning" },
  processing: { label: "جارٍ",     cls: "con-badge con-badge-info"    },
  completed:  { label: "مكتمل",    cls: "con-badge con-badge-success" },
  failed:     { label: "فشل",      cls: "con-badge con-badge-danger"  },
};

const fmt = (n: number) =>
  new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 2 }).format(n);

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });

const fmtTime = (s: string) =>
  new Date(s).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });

// ── Mock data (used until Supabase tables are created) ────────────────────

const MOCK_WALLETS: DriverWallet[] = [
  { id: "w1", driver_id: "d1", driver_name: "أحمد محمد السالم",  driver_phone: "0501234567", balance: 1840.50, pending_balance: 320.00, total_earned: 24800, total_paid_out: 22960, last_payout_at: "2025-02-28", is_frozen: false, updated_at: new Date().toISOString() },
  { id: "w2", driver_id: "d2", driver_name: "خالد العمري",       driver_phone: "0557654321", balance: 2310.00, pending_balance: 0,      total_earned: 18400, total_paid_out: 16090, last_payout_at: "2025-02-28", is_frozen: false, updated_at: new Date().toISOString() },
  { id: "w3", driver_id: "d3", driver_name: "فهد الغامدي",       driver_phone: "0509876543", balance: 3120.75, pending_balance: 450.00, total_earned: 31200, total_paid_out: 28080, last_payout_at: "2025-02-21", is_frozen: false, updated_at: new Date().toISOString() },
  { id: "w4", driver_id: "d4", driver_name: "سعد الزهراني",      driver_phone: "0551112233", balance: 0,        pending_balance: 0,      total_earned: 9200,  total_paid_out: 9200,  last_payout_at: "2025-03-01", is_frozen: true,  freeze_reason: "مخالفة سياسة الاستخدام", updated_at: new Date().toISOString() },
  { id: "w5", driver_id: "d5", driver_name: "محمد القحطاني",     driver_phone: "0556667788", balance: 980.00,  pending_balance: 120.00, total_earned: 15600, total_paid_out: 14620, last_payout_at: "2025-02-14", is_frozen: false, updated_at: new Date().toISOString() },
];

const MOCK_TRANSACTIONS: WalletTransaction[] = [
  { id: "t1", driver_id: "d1", driver_name: "أحمد محمد السالم",  transaction_id: "tx1", event_type: "order_payment", amount: 84,   balance_before: 1756.50, balance_after: 1840.50, description: "12 طلب — جاهز", reference_type: "platform_report", reference_id: "JHZ-2025-03",    created_at: "2025-03-11T14:23:00Z" },
  { id: "t2", driver_id: "d3", driver_name: "فهد الغامدي",       transaction_id: "tx2", event_type: "payout",        amount: -2800, balance_before: 5920.75, balance_after: 3120.75, description: "دفعة الأسبوع 9",  reference_type: "payout_batch",    reference_id: "PAY-2025-W09",     created_at: "2025-03-10T09:00:00Z" },
  { id: "t3", driver_id: "d2", driver_name: "خالد العمري",       transaction_id: "tx3", event_type: "bonus",         amount: 150,  balance_before: 2160.00, balance_after: 2310.00, description: "حافز 50 طلب",     reference_type: "bonus_rule",      reference_id: "BONUS-MARCH",      created_at: "2025-03-09T11:30:00Z" },
  { id: "t4", driver_id: "d1", driver_name: "أحمد محمد السالم",  transaction_id: "tx4", event_type: "vehicle_cost",  amount: -120, balance_before: 1876.50, balance_after: 1756.50, description: "تكلفة مركبة مارس", reference_type: "vehicle",         reference_id: "VEH-001",          created_at: "2025-03-08T08:00:00Z" },
  { id: "t5", driver_id: "d5", driver_name: "محمد القحطاني",     transaction_id: "tx5", event_type: "penalty",       amount: -50,  balance_before: 1030.00, balance_after: 980.00,  description: "تأخر في الاستلام", reference_type: "order",           reference_id: "#10234",           created_at: "2025-03-07T16:45:00Z" },
  { id: "t6", driver_id: "d3", driver_name: "فهد الغامدي",       transaction_id: "tx6", event_type: "order_payment", amount: 245,  balance_before: 5675.75, balance_after: 5920.75, description: "35 طلب — مرسول",  reference_type: "platform_report", reference_id: "MRS-2025-03",      created_at: "2025-03-06T18:00:00Z" },
];

const MOCK_BATCHES: PayoutBatch[] = [
  { id: "b1", batch_ref: "PAY-2025-W10", status: "draft",      total_amount: 12400, driver_count: 5, period_start: "2025-03-03", period_end: "2025-03-09", created_at: "2025-03-10T08:00:00Z" },
  { id: "b2", batch_ref: "PAY-2025-W09", status: "completed",  total_amount: 18750, driver_count: 6, period_start: "2025-02-24", period_end: "2025-03-02", created_at: "2025-03-03T08:00:00Z" },
  { id: "b3", batch_ref: "PAY-2025-W08", status: "completed",  total_amount: 16200, driver_count: 5, period_start: "2025-02-17", period_end: "2025-02-23", created_at: "2025-02-24T08:00:00Z" },
];

// ── Sub-components ─────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, variant }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; variant: "brand" | "success" | "info" | "warning" | "danger";
}) {
  const colors: Record<string, { bg: string; fg: string }> = {
    brand:   { bg: "var(--con-brand-subtle)",   fg: "var(--con-brand)"   },
    success: { bg: "var(--con-success-subtle)", fg: "var(--con-success)" },
    info:    { bg: "var(--con-info-subtle)",    fg: "var(--con-info)"    },
    warning: { bg: "var(--con-warning-subtle)", fg: "var(--con-warning)" },
    danger:  { bg: "var(--con-danger-subtle)",  fg: "var(--con-danger)"  },
  };
  const c = colors[variant];
  return (
    <div className="con-kpi-card">
      <div className="con-icon-wrap" style={{ background: c.bg, color: c.fg, marginBottom: "0.75rem" }}>
        <Icon size={18} />
      </div>
      <div className="con-kpi-value">{value}</div>
      {sub && <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-brand)", marginTop: "0.125rem", fontFamily: "var(--con-font-mono)" }}>{sub}</div>}
      <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginTop: "0.25rem" }}>{label}</div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

type Tab = "wallets" | "ledger" | "batches";

export default function DriverWallet() {
  const [tab, setTab]           = useState<Tab>("wallets");
  const [wallets, setWallets]   = useState<DriverWallet[]>(MOCK_WALLETS);
  const [txns, setTxns]         = useState<WalletTransaction[]>(MOCK_TRANSACTIONS);
  const [batches, setBatches]   = useState<PayoutBatch[]>(MOCK_BATCHES);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [selected, setSelected] = useState<DriverWallet | null>(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      // Try to fetch from Supabase; fall back to mock data if tables don't exist yet
      const [walletsRes, txnsRes, batchesRes] = await Promise.all([
        supabase
          .from("driver_wallets")
          .select("*, couriers(full_name, phone)")
          .order("balance", { ascending: false }),
        supabase
          .from("wallet_transactions")
          .select("*, couriers(full_name)")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("payout_batches")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (!walletsRes.error && walletsRes.data?.length) {
        setWallets(walletsRes.data.map((w: any) => ({
          ...w,
          driver_name:  w.couriers?.full_name,
          driver_phone: w.couriers?.phone,
        })));
      }
      if (!txnsRes.error && txnsRes.data?.length) {
        setTxns(txnsRes.data.map((t: any) => ({
          ...t,
          driver_name: t.couriers?.full_name,
        })));
      }
      if (!batchesRes.error && batchesRes.data?.length) {
        setBatches(batchesRes.data);
      }
    } catch {
      // keep mock data
    } finally {
      setLoading(false);
    }
  }

  // ── Aggregates ────────────────────────────────────────────
  const totalBalance  = wallets.reduce((s, w) => s + w.balance, 0);
  const totalPending  = wallets.reduce((s, w) => s + w.pending_balance, 0);
  const totalEarned   = wallets.reduce((s, w) => s + w.total_earned, 0);
  const frozenCount   = wallets.filter((w) => w.is_frozen).length;

  // ── Filtered sets ─────────────────────────────────────────
  const filteredWallets = wallets.filter((w) =>
    !search || (w.driver_name ?? "").includes(search) || (w.driver_phone ?? "").includes(search)
  );
  const filteredTxns = txns.filter((t) => {
    const matchSearch = !search || (t.driver_name ?? "").includes(search) || (t.description ?? "").includes(search);
    const matchEvent  = eventFilter === "all" || t.event_type === eventFilter;
    return matchSearch && matchEvent;
  });

  // ── Driver detail transactions ───────────────────────────
  const driverTxns = selected
    ? txns.filter((t) => t.driver_id === selected.driver_id)
    : [];

  return (
    <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }} dir="rtl">

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "var(--con-text-page-title)", fontWeight: 700, color: "var(--con-text-primary)", lineHeight: 1.2 }}>
            محفظة السائقين
          </h1>
          <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)", marginTop: "0.25rem" }}>
            نظام المحاسبة المزدوجة — كل ريال له مصدر ووجهة
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="con-btn-ghost" style={{ display: "flex", alignItems: "center", gap: "0.375rem" }} onClick={fetchAll}>
            <RefreshCw size={14} />
            تحديث
          </button>
          <button className="con-btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <Plus size={15} />
            دفعة جديدة
          </button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
        <KpiCard label="إجمالي الأرصدة" value={fmt(totalBalance)}  sub={`+ ${fmt(totalPending)} معلق`} icon={Wallet}       variant="brand"   />
        <KpiCard label="إجمالي المكتسب" value={fmt(totalEarned)}   icon={TrendingUp}    variant="success" />
        <KpiCard label="عدد المحافظ"    value={String(wallets.length)} sub={frozenCount > 0 ? `${frozenCount} مجمدة` : undefined} icon={Layers} variant="info" />
        <KpiCard label="آخر دفعة"       value={fmt(MOCK_BATCHES[1]?.total_amount ?? 0)} icon={CheckCircle2} variant="warning" />
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: "0" }}>
        <div className="con-tabs">
          {(["wallets", "ledger", "batches"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSearch(""); setEventFilter("all"); }}
              className={`con-tab${tab === t ? " con-tab-active" : ""}`}
            >
              { t === "wallets" ? "المحافظ" : t === "ledger" ? "سجل الحركات" : "دفعات الصرف" }
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab: Wallets ── */}
      {tab === "wallets" && (
        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr", gap: "1rem", alignItems: "start" }}>

          {/* Wallet list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--con-text-muted)", pointerEvents: "none" }} />
              <input className="con-input" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث باسم السائق أو الجوال..." style={{ paddingRight: "2.25rem", width: "100%" }} />
            </div>

            <div className="con-card" style={{ padding: 0, overflow: "hidden" }}>
              <table className="con-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>السائق</th>
                    <th>الرصيد المتاح</th>
                    <th>معلق</th>
                    <th>إجمالي المكتسب</th>
                    <th>آخر دفعة</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i}>{Array.from({ length: 6 }).map((__, j) => (
                          <td key={j}><div className="con-skeleton" style={{ height: "1rem", borderRadius: "4px" }} /></td>
                        ))}</tr>
                      ))
                    : filteredWallets.map((w) => (
                        <tr
                          key={w.id}
                          style={{ cursor: "pointer", background: selected?.id === w.id ? "var(--con-brand-subtle)" : undefined }}
                          onClick={() => setSelected(selected?.id === w.id ? null : w)}
                        >
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <div style={{ width: "1.75rem", height: "1.75rem", borderRadius: "var(--con-radius-sm)", background: w.is_frozen ? "var(--con-danger-subtle)" : "var(--con-brand-subtle)", color: w.is_frozen ? "var(--con-danger)" : "var(--con-brand)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--con-text-caption)", fontWeight: 700, flexShrink: 0 }}>
                                {(w.driver_name ?? "?").charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 500, color: "var(--con-text-primary)" }}>{w.driver_name ?? w.driver_id}</div>
                                <div style={{ fontFamily: "var(--con-font-mono)", fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>{w.driver_phone}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontFamily: "var(--con-font-mono)", fontWeight: 700, color: w.balance > 0 ? "var(--con-success)" : "var(--con-text-muted)" }}>
                              {fmt(w.balance)}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-warning)" }}>
                              {w.pending_balance > 0 ? fmt(w.pending_balance) : "—"}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-text-secondary)" }}>{fmt(w.total_earned)}</span>
                          </td>
                          <td>
                            <span style={{ color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)" }}>
                              {w.last_payout_at ? fmtDate(w.last_payout_at) : "—"}
                            </span>
                          </td>
                          <td>
                            {w.is_frozen
                              ? <span className="con-badge con-badge-danger">مجمدة</span>
                              : <span className="con-badge con-badge-success">نشطة</span>
                            }
                          </td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
              {!loading && filteredWallets.length === 0 && (
                <div className="con-empty"><Wallet size={24} style={{ opacity: 0.3, marginBottom: "0.5rem" }} /><p>لا توجد نتائج</p></div>
              )}
            </div>
          </div>

          {/* Driver detail panel */}
          {selected && (
            <div className="con-card" style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--con-text-primary)", fontSize: "var(--con-text-card-title)" }}>{selected.driver_name}</div>
                  <div style={{ fontFamily: "var(--con-font-mono)", fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>{selected.driver_phone}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--con-text-muted)", padding: "0.25rem" }}>
                  <X size={16} />
                </button>
              </div>

              {/* Balance highlight */}
              <div style={{ background: "var(--con-brand-subtle)", borderRadius: "var(--con-radius)", padding: "1rem", marginBottom: "1rem", textAlign: "center" }}>
                <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginBottom: "0.25rem" }}>الرصيد المتاح</div>
                <div style={{ fontFamily: "var(--con-font-mono)", fontSize: "1.75rem", fontWeight: 700, color: "var(--con-brand)" }}>{fmt(selected.balance)}</div>
                {selected.pending_balance > 0 && (
                  <div style={{ fontFamily: "var(--con-font-mono)", fontSize: "var(--con-text-caption)", color: "var(--con-warning)", marginTop: "0.25rem" }}>
                    + {fmt(selected.pending_balance)} معلق
                  </div>
                )}
              </div>

              {/* Stats grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
                {[
                  { label: "إجمالي المكتسب",  value: fmt(selected.total_earned)    },
                  { label: "إجمالي المصروف",   value: fmt(selected.total_paid_out)  },
                ].map((s) => (
                  <div key={s.label} style={{ background: "var(--con-bg-surface-2)", borderRadius: "var(--con-radius-sm)", padding: "0.625rem 0.75rem" }}>
                    <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>{s.label}</div>
                    <div style={{ fontFamily: "var(--con-font-mono)", fontWeight: 600, color: "var(--con-text-primary)", fontSize: "var(--con-text-body)" }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {selected.is_frozen && (
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", background: "var(--con-danger-subtle)", borderRadius: "var(--con-radius-sm)", padding: "0.75rem", marginBottom: "1rem" }}>
                  <AlertTriangle size={14} style={{ color: "var(--con-danger)", flexShrink: 0, marginTop: "0.125rem" }} />
                  <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-danger)" }}>
                    محفظة مجمدة — {selected.freeze_reason}
                  </div>
                </div>
              )}

              {/* Recent transactions */}
              <div style={{ fontSize: "var(--con-text-caption)", fontWeight: 600, color: "var(--con-text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>آخر الحركات</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                {driverTxns.slice(0, 5).map((t) => {
                  const meta = EVENT_META[t.event_type] ?? { label: t.event_type, icon: FileText, color: "var(--con-text-muted)", sign: "+" as const };
                  return (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0", borderBottom: "1px solid var(--con-border-default)" }}>
                      <div style={{ width: "1.5rem", height: "1.5rem", borderRadius: "var(--con-radius-sm)", background: "var(--con-bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <meta.icon size={11} style={{ color: meta.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description ?? meta.label}</div>
                        <div style={{ fontSize: "10px", color: "var(--con-text-muted)" }}>{fmtDate(t.created_at)} {fmtTime(t.created_at)}</div>
                      </div>
                      <div style={{ fontFamily: "var(--con-font-mono)", fontWeight: 600, fontSize: "var(--con-text-caption)", color: t.amount >= 0 ? "var(--con-success)" : "var(--con-danger)", flexShrink: 0 }}>
                        {t.amount >= 0 ? "+" : ""}{fmt(t.amount)}
                      </div>
                    </div>
                  );
                })}
                {driverTxns.length === 0 && (
                  <p style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", textAlign: "center", padding: "1rem 0" }}>لا توجد حركات</p>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <button className="con-btn-primary" style={{ flex: 1, fontSize: "var(--con-text-caption)", padding: "0.5rem", justifyContent: "center", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <ArrowUpRight size={13} /> صرف رصيد
                </button>
                <button className="con-btn-ghost" style={{ fontSize: "var(--con-text-caption)", padding: "0.5rem 0.75rem" }}>
                  تعديل
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Ledger ── */}
      {tab === "ledger" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Filters */}
          <div className="con-toolbar">
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={14} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--con-text-muted)", pointerEvents: "none" }} />
              <input className="con-input" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالسائق أو الوصف..." style={{ paddingRight: "2.25rem", width: "100%" }} />
            </div>
            <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
              {["all", ...Object.keys(EVENT_META)].map((ev) => (
                <button key={ev}
                  onClick={() => setEventFilter(ev)}
                  className={`con-tab${eventFilter === ev ? " con-tab-active" : ""}`}
                  style={{ fontSize: "var(--con-text-caption)" }}
                >
                  {ev === "all" ? "الكل" : EVENT_META[ev]?.label ?? ev}
                </button>
              ))}
            </div>
          </div>

          <div className="con-card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="con-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>السائق</th>
                  <th>النوع</th>
                  <th>المبلغ</th>
                  <th>الرصيد قبل</th>
                  <th>الرصيد بعد</th>
                  <th>المرجع</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>{Array.from({ length: 7 }).map((__, j) => (
                        <td key={j}><div className="con-skeleton" style={{ height: "1rem", borderRadius: "4px" }} /></td>
                      ))}</tr>
                    ))
                  : filteredTxns.map((t) => {
                      const meta = EVENT_META[t.event_type] ?? { label: t.event_type, icon: FileText, color: "var(--con-text-muted)", sign: "+" as const };
                      return (
                        <tr key={t.id}>
                          <td style={{ color: "var(--con-text-primary)", fontWeight: 500 }}>{t.driver_name ?? t.driver_id}</td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                              <meta.icon size={12} style={{ color: meta.color, flexShrink: 0 }} />
                              <span style={{ color: meta.color }}>{meta.label}</span>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontFamily: "var(--con-font-mono)", fontWeight: 700, color: t.amount >= 0 ? "var(--con-success)" : "var(--con-danger)" }}>
                              {t.amount >= 0 ? "+" : ""}{fmt(t.amount)}
                            </span>
                          </td>
                          <td><span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-text-muted)" }}>{fmt(t.balance_before)}</span></td>
                          <td><span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-text-secondary)" }}>{fmt(t.balance_after)}</span></td>
                          <td>
                            {t.reference_id
                              ? <span className="con-badge con-badge-muted" style={{ fontFamily: "var(--con-font-mono)" }}>{t.reference_id}</span>
                              : <span style={{ color: "var(--con-text-muted)" }}>—</span>
                            }
                          </td>
                          <td>
                            <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
                              <div>{fmtDate(t.created_at)}</div>
                              <div style={{ fontFamily: "var(--con-font-mono)" }}>{fmtTime(t.created_at)}</div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                }
              </tbody>
            </table>
            {!loading && filteredTxns.length === 0 && (
              <div className="con-empty"><FileText size={24} style={{ opacity: 0.3, marginBottom: "0.5rem" }} /><p>لا توجد حركات</p></div>
            )}
            {!loading && filteredTxns.length > 0 && (
              <div style={{ padding: "0.625rem 1.25rem", borderTop: "1px solid var(--con-border-default)", display: "flex", justifyContent: "space-between", fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
                <span>{filteredTxns.length} حركة</span>
                <span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-text-secondary)" }}>
                  صافي: {fmt(filteredTxns.reduce((s, t) => s + t.amount, 0))}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Payout Batches ── */}
      {tab === "batches" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="con-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--con-border-default)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 600, color: "var(--con-text-primary)", fontSize: "var(--con-text-card-title)" }}>دفعات الصرف</span>
              <button className="con-btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "var(--con-text-caption)" }}>
                <Plus size={13} /> دفعة جديدة
              </button>
            </div>
            <table className="con-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>رقم الدفعة</th>
                  <th>الفترة</th>
                  <th>عدد السائقين</th>
                  <th>الإجمالي</th>
                  <th>الحالة</th>
                  <th>تاريخ الإنشاء</th>
                  <th style={{ width: "3rem" }}></th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => {
                  const st = BATCH_STATUS[b.status] ?? { label: b.status, cls: "con-badge con-badge-muted" };
                  return (
                    <tr key={b.id}>
                      <td>
                        <span style={{ fontFamily: "var(--con-font-mono)", fontWeight: 700, color: "var(--con-brand)" }}>{b.batch_ref}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)" }}>
                          {fmtDate(b.period_start)} — {fmtDate(b.period_end)}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-text-secondary)" }}>{b.driver_count} سائق</span>
                      </td>
                      <td>
                        <span style={{ fontFamily: "var(--con-font-mono)", fontWeight: 700, color: "var(--con-text-primary)" }}>{fmt(b.total_amount)}</span>
                      </td>
                      <td><span className={st.cls}>{st.label}</span></td>
                      <td><span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>{fmtDate(b.created_at)}</span></td>
                      <td>
                        <button className="con-btn-ghost" style={{ padding: "0.25rem 0.5rem", fontSize: "var(--con-text-caption)" }}>
                          <ChevronDown size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {batches.length === 0 && (
              <div className="con-empty"><DollarSign size={24} style={{ opacity: 0.3, marginBottom: "0.5rem" }} /><p>لا توجد دفعات</p></div>
            )}
          </div>

          {/* Ledger integrity note */}
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.875rem 1rem", background: "var(--con-info-subtle)", borderRadius: "var(--con-radius)", border: "1px solid var(--con-border-default)" }}>
            <Layers size={14} style={{ color: "var(--con-info)", flexShrink: 0, marginTop: "0.1rem" }} />
            <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-secondary)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--con-info)" }}>نظام محاسبة مزدوجة</strong> — كل دفعة تُسجَّل كـ Debit على حساب التسوية وCredit على محفظة السائق. يمكن التدقيق في كل ريال عبر تبويب سجل الحركات.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
