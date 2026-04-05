/**
 * صفحة المكافآت والجزاءات — Courier Rewards & Penalties
 * نظام إدارة المكافآت والجزاءات للمناديب
 */
import { useState, useCallback } from "react";
import {
  Award,
  AlertTriangle,
  Search,
  RefreshCw,
  Download,
  Plus,
  Users,
  DollarSign,
  TrendingUp,
  ShieldAlert,
  Ban,
  FileWarning,
} from "lucide-react";
import {
  PageWrapper,
  PageHeader,
  KPIGrid,
  KPICard,
  Card,
  Tabs,
  Toolbar,
  Table,
  Badge,
  Modal,
  Button,
  Select,
  EmptyState,
} from "@/components/admin/ui";
import { supabase } from "@/lib/supabase";

// ── Types ────────────────────────────────────────────────────────────────────
type RewardType = "courier_of_month" | "performance_bonus" | "commitment_bonus" | "referral_bonus";
type PenaltyType = "financial_deduction" | "verbal_warning" | "written_warning" | "suspension" | "termination";

interface Reward {
  id: string;
  date: string;
  courier_name: string;
  courier_id: string;
  type: RewardType;
  amount: number;
  description: string;
  issued_by: string;
}

interface Penalty {
  id: string;
  date: string;
  courier_name: string;
  courier_id: string;
  type: PenaltyType;
  amount: number;
  reason: string;
  issued_by: string;
  is_active: boolean;
}

// ── Labels ───────────────────────────────────────────────────────────────────
const REWARD_LABELS: Record<RewardType, string> = {
  courier_of_month: "مندوب الشهر",
  performance_bonus: "بونص أداء",
  commitment_bonus: "مكافأة التزام",
  referral_bonus: "بونص إحالة",
};

const PENALTY_LABELS: Record<PenaltyType, string> = {
  financial_deduction: "خصم مالي",
  verbal_warning: "إنذار شفهي",
  written_warning: "إنذار كتابي",
  suspension: "إيقاف مؤقت",
  termination: "فصل",
};

const PENALTY_COLORS: Record<PenaltyType, string> = {
  financial_deduction: "var(--con-warning)",
  verbal_warning: "var(--con-info)",
  written_warning: "var(--con-warning)",
  suspension: "var(--con-danger)",
  termination: "var(--con-danger)",
};

// ── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_REWARDS: Reward[] = [
  { id: "r1", date: "2026-04-01", courier_name: "أحمد العتيبي", courier_id: "C001", type: "courier_of_month", amount: 1500, description: "أفضل مندوب لشهر مارس", issued_by: "مشاري" },
  { id: "r2", date: "2026-04-02", courier_name: "فهد القحطاني", courier_id: "C002", type: "performance_bonus", amount: 800, description: "تجاوز 500 طلب في الشهر", issued_by: "مشاري" },
  { id: "r3", date: "2026-03-28", courier_name: "سعد الدوسري", courier_id: "C003", type: "commitment_bonus", amount: 500, description: "التزام 100% لمدة 3 أشهر", issued_by: "عبدالله" },
  { id: "r4", date: "2026-03-25", courier_name: "خالد الحربي", courier_id: "C004", type: "referral_bonus", amount: 300, description: "إحالة مندوب جديد - محمد", issued_by: "مشاري" },
  { id: "r5", date: "2026-03-20", courier_name: "محمد الشهري", courier_id: "C005", type: "performance_bonus", amount: 600, description: "أعلى تقييم عملاء", issued_by: "عبدالله" },
  { id: "r6", date: "2026-03-18", courier_name: "عمر المالكي", courier_id: "C006", type: "courier_of_month", amount: 1500, description: "أفضل مندوب لشهر فبراير", issued_by: "مشاري" },
  { id: "r7", date: "2026-03-15", courier_name: "يوسف الغامدي", courier_id: "C007", type: "commitment_bonus", amount: 500, description: "لا غياب لمدة 6 أشهر", issued_by: "عبدالله" },
  { id: "r8", date: "2026-03-10", courier_name: "أحمد العتيبي", courier_id: "C001", type: "performance_bonus", amount: 700, description: "أسرع وقت توصيل", issued_by: "مشاري" },
  { id: "r9", date: "2026-03-05", courier_name: "فهد القحطاني", courier_id: "C002", type: "referral_bonus", amount: 300, description: "إحالة مندوب جديد - سالم", issued_by: "عبدالله" },
  { id: "r10", date: "2026-03-01", courier_name: "سعد الدوسري", courier_id: "C003", type: "performance_bonus", amount: 900, description: "أعلى عدد طلبات يومي", issued_by: "مشاري" },
];

const MOCK_PENALTIES: Penalty[] = [
  { id: "p1", date: "2026-04-03", courier_name: "ناصر السبيعي", courier_id: "C008", type: "financial_deduction", amount: 200, reason: "تأخر في التسليم 3 مرات", issued_by: "مشاري", is_active: true },
  { id: "p2", date: "2026-04-01", courier_name: "بدر الزهراني", courier_id: "C009", type: "verbal_warning", amount: 0, reason: "عدم ارتداء الزي الرسمي", issued_by: "عبدالله", is_active: true },
  { id: "p3", date: "2026-03-28", courier_name: "عبدالرحمن النعيمي", courier_id: "C010", type: "written_warning", amount: 0, reason: "شكوى عميل - سوء تعامل", issued_by: "مشاري", is_active: true },
  { id: "p4", date: "2026-03-25", courier_name: "سلطان العنزي", courier_id: "C011", type: "suspension", amount: 0, reason: "غياب بدون إذن 3 أيام", issued_by: "عبدالله", is_active: true },
  { id: "p5", date: "2026-03-20", courier_name: "ناصر السبيعي", courier_id: "C008", type: "financial_deduction", amount: 150, reason: "فقدان طرد", issued_by: "مشاري", is_active: true },
  { id: "p6", date: "2026-03-15", courier_name: "بدر الزهراني", courier_id: "C009", type: "financial_deduction", amount: 100, reason: "تلف بضاعة", issued_by: "عبدالله", is_active: false },
  { id: "p7", date: "2026-03-10", courier_name: "تركي القرني", courier_id: "C012", type: "termination", amount: 0, reason: "مخالفات متكررة - 5 إنذارات", issued_by: "مشاري", is_active: true },
  { id: "p8", date: "2026-03-05", courier_name: "عبدالرحمن النعيمي", courier_id: "C010", type: "verbal_warning", amount: 0, reason: "تأخر في بدء الدوام", issued_by: "عبدالله", is_active: false },
];

export default function CourierRewards() {
  const [activeTab, setActiveTab] = useState("rewards");
  const [rewards, setRewards] = useState<Reward[]>(MOCK_REWARDS);
  const [penalties, setPenalties] = useState<Penalty[]>(MOCK_PENALTIES);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [rewardForm, setRewardForm] = useState({ courier_name: "", type: "performance_bonus" as RewardType, amount: "", note: "" });
  const [penaltyForm, setPenaltyForm] = useState({ courier_name: "", type: "financial_deduction" as PenaltyType, amount: "", reason: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (!supabase) throw new Error("no supabase");
      const [rRes, pRes] = await Promise.all([
        supabase.from("courier_rewards").select("*").order("date", { ascending: false }),
        supabase.from("courier_penalties").select("*").order("date", { ascending: false }),
      ]);
      if (rRes.data?.length) setRewards(rRes.data);
      if (pRes.data?.length) setPenalties(pRes.data);
    } catch {
      // keep mock data
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Filters ──────────────────────────────────────────────────────────────
  const filteredRewards = rewards.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.courier_name.includes(q) || REWARD_LABELS[r.type].includes(q);
    const matchType = typeFilter === "all" || r.type === typeFilter;
    return matchSearch && matchType;
  });

  const filteredPenalties = penalties.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.courier_name.includes(q) || PENALTY_LABELS[p.type].includes(q);
    const matchType = typeFilter === "all" || p.type === typeFilter;
    return matchSearch && matchType;
  });

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthRewards = rewards.filter((r) => r.date.startsWith(thisMonth));
  const totalRewardsAmount = monthRewards.reduce((s, r) => s + r.amount, 0);
  const uniqueBeneficiaries = new Set(monthRewards.map((r) => r.courier_id)).size;
  const maxReward = monthRewards.length ? Math.max(...monthRewards.map((r) => r.amount)) : 0;

  const totalPenaltiesAmount = penalties.filter((p) => p.date.startsWith(thisMonth)).reduce((s, p) => s + p.amount, 0);
  const activeWarnings = penalties.filter((p) => p.is_active && (p.type === "verbal_warning" || p.type === "written_warning")).length;
  const suspended = penalties.filter((p) => p.is_active && p.type === "suspension").length;

  function exportCSV(type: "rewards" | "penalties") {
    const rows = type === "rewards" ? filteredRewards : filteredPenalties;
    if (!rows.length) return;
    const headers = type === "rewards"
      ? ["التاريخ", "المندوب", "نوع المكافأة", "المبلغ", "الوصف", "بواسطة"]
      : ["التاريخ", "المندوب", "نوع الجزاء", "المبلغ", "السبب", "بواسطة"];
    const csvRows = rows.map((r: any) =>
      type === "rewards"
        ? [r.date, r.courier_name, REWARD_LABELS[r.type as RewardType], r.amount, r.description, r.issued_by]
        : [r.date, r.courier_name, PENALTY_LABELS[r.type as PenaltyType], r.amount, r.reason, r.issued_by]
    );
    const csv = [headers.join(","), ...csvRows.map((r) => r.map((c: any) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `courier_${type}_${thisMonth}.csv`;
    a.click();
  }

  function handleAddReward() {
    const newReward: Reward = {
      id: `r${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      courier_name: rewardForm.courier_name,
      courier_id: `C${Math.floor(Math.random() * 900 + 100)}`,
      type: rewardForm.type,
      amount: Number(rewardForm.amount) || 0,
      description: rewardForm.note,
      issued_by: "مشاري",
    };
    setRewards((prev) => [newReward, ...prev]);
    setShowRewardModal(false);
    setRewardForm({ courier_name: "", type: "performance_bonus", amount: "", note: "" });
  }

  function handleAddPenalty() {
    const newPenalty: Penalty = {
      id: `p${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      courier_name: penaltyForm.courier_name,
      courier_id: `C${Math.floor(Math.random() * 900 + 100)}`,
      type: penaltyForm.type,
      amount: Number(penaltyForm.amount) || 0,
      reason: penaltyForm.reason,
      issued_by: "مشاري",
      is_active: true,
    };
    setPenalties((prev) => [newPenalty, ...prev]);
    setShowPenaltyModal(false);
    setPenaltyForm({ courier_name: "", type: "financial_deduction", amount: "", reason: "" });
  }

  const rewardTypeOptions = [{ value: "all", label: "الكل" }, ...Object.entries(REWARD_LABELS).map(([v, l]) => ({ value: v, label: l }))];
  const penaltyTypeOptions = [{ value: "all", label: "الكل" }, ...Object.entries(PENALTY_LABELS).map(([v, l]) => ({ value: v, label: l }))];

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "var(--con-radius)",
    border: "1px solid var(--con-border)",
    background: "var(--con-bg-input)",
    color: "var(--con-text-primary)",
    fontSize: 13,
    fontFamily: "var(--con-font-primary)",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--con-text-secondary)",
    marginBottom: 6,
    display: "block",
  };

  return (
    <PageWrapper>
      <PageHeader
        icon={Award}
        title="المكافآت والجزاءات"
        subtitle="إدارة نظام المكافآت والجزاءات للمناديب"
        actions={
          <>
            <Button
              onClick={() => exportCSV(activeTab === "rewards" ? "rewards" : "penalties")}
              variant="ghost"
              icon={Download}
            >
              تصدير CSV
            </Button>
            <Button
              onClick={fetchData}
              variant="ghost"
              icon={RefreshCw}
              loading={loading}
            >
              تحديث
            </Button>
            {activeTab === "rewards" ? (
              <Button onClick={() => setShowRewardModal(true)} variant="primary" icon={Plus}>
                إضافة مكافأة
              </Button>
            ) : (
              <Button onClick={() => setShowPenaltyModal(true)} variant="primary" icon={Plus}>
                إضافة جزاء
              </Button>
            )}
          </>
        }
      />

      <Tabs
        items={[
          { key: "rewards", label: "المكافآت", icon: Award },
          { key: "penalties", label: "الجزاءات", icon: AlertTriangle },
        ]}
        active={activeTab}
        onChange={(k) => { setActiveTab(k); setTypeFilter("all"); setSearch(""); }}
      />

      {/* ── KPIs ── */}
      {activeTab === "rewards" ? (
        <KPIGrid>
          <KPICard label="إجمالي المكافآت هذا الشهر" value={`${totalRewardsAmount.toLocaleString()} ر.س`} icon={DollarSign} accent="var(--con-success)" />
          <KPICard label="عدد المستفيدين" value={uniqueBeneficiaries} icon={Users} accent="var(--con-brand)" />
          <KPICard label="أعلى مكافأة" value={`${maxReward.toLocaleString()} ر.س`} icon={TrendingUp} accent="var(--con-warning)" />
        </KPIGrid>
      ) : (
        <KPIGrid>
          <KPICard label="إجمالي الجزاءات هذا الشهر" value={`${totalPenaltiesAmount.toLocaleString()} ر.س`} icon={DollarSign} accent="var(--con-danger)" />
          <KPICard label="إنذارات نشطة" value={activeWarnings} icon={ShieldAlert} accent="var(--con-warning)" />
          <KPICard label="موقوفين" value={suspended} icon={Ban} accent="var(--con-danger)" />
        </KPIGrid>
      )}

      {/* ── Toolbar ── */}
      <Toolbar>
        <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
          <Search size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--con-text-muted)" }} />
          <input
            placeholder="بحث بالاسم أو النوع..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingRight: 32 }}
          />
        </div>
        <Select
          value={typeFilter}
          onChange={setTypeFilter}
          options={activeTab === "rewards" ? rewardTypeOptions : penaltyTypeOptions}
        />
      </Toolbar>

      {/* ── Table ── */}
      <Card>
        {activeTab === "rewards" ? (
          filteredRewards.length === 0 ? (
            <EmptyState icon={Award} title="لا توجد مكافآت" message="لم يتم العثور على مكافآت مطابقة للبحث" />
          ) : (
            <Table
              columns={["التاريخ", "المندوب", "نوع المكافأة", "المبلغ", "الوصف", "بواسطة"]}
              rows={filteredRewards.map((r) => [
                r.date,
                r.courier_name,
                <Badge key={r.id} variant="success">{REWARD_LABELS[r.type]}</Badge>,
                `${r.amount.toLocaleString()} ر.س`,
                r.description,
                r.issued_by,
              ])}
            />
          )
        ) : (
          filteredPenalties.length === 0 ? (
            <EmptyState icon={FileWarning} title="لا توجد جزاءات" message="لم يتم العثور على جزاءات مطابقة للبحث" />
          ) : (
            <Table
              columns={["التاريخ", "المندوب", "نوع الجزاء", "المبلغ", "السبب", "بواسطة"]}
              rows={filteredPenalties.map((p) => [
                p.date,
                p.courier_name,
                <span key={p.id} style={{ color: PENALTY_COLORS[p.type], fontWeight: 600, fontSize: 12 }}>{PENALTY_LABELS[p.type]}</span>,
                p.amount > 0 ? `${p.amount.toLocaleString()} ر.س` : "—",
                p.reason,
                p.issued_by,
              ])}
            />
          )
        )}
      </Card>

      {/* ── Add Reward Modal ── */}
      <Modal open={showRewardModal} onClose={() => setShowRewardModal(false)} title="إضافة مكافأة" width={480}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>المندوب</label>
            <input style={inputStyle} placeholder="اسم المندوب" value={rewardForm.courier_name} onChange={(e) => setRewardForm({ ...rewardForm, courier_name: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>نوع المكافأة</label>
            <select style={inputStyle} value={rewardForm.type} onChange={(e) => setRewardForm({ ...rewardForm, type: e.target.value as RewardType })}>
              {Object.entries(REWARD_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>المبلغ (ر.س)</label>
            <input style={inputStyle} type="number" placeholder="0" value={rewardForm.amount} onChange={(e) => setRewardForm({ ...rewardForm, amount: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>ملاحظة</label>
            <input style={inputStyle} placeholder="وصف المكافأة" value={rewardForm.note} onChange={(e) => setRewardForm({ ...rewardForm, note: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-start", marginTop: 8 }}>
            <Button variant="primary" onClick={handleAddReward} disabled={!rewardForm.courier_name}>حفظ</Button>
            <Button variant="ghost" onClick={() => setShowRewardModal(false)}>إلغاء</Button>
          </div>
        </div>
      </Modal>

      {/* ── Add Penalty Modal ── */}
      <Modal open={showPenaltyModal} onClose={() => setShowPenaltyModal(false)} title="إضافة جزاء" width={480}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>المندوب</label>
            <input style={inputStyle} placeholder="اسم المندوب" value={penaltyForm.courier_name} onChange={(e) => setPenaltyForm({ ...penaltyForm, courier_name: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>نوع الجزاء</label>
            <select style={inputStyle} value={penaltyForm.type} onChange={(e) => setPenaltyForm({ ...penaltyForm, type: e.target.value as PenaltyType })}>
              {Object.entries(PENALTY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>المبلغ (ر.س)</label>
            <input style={inputStyle} type="number" placeholder="0" value={penaltyForm.amount} onChange={(e) => setPenaltyForm({ ...penaltyForm, amount: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>السبب</label>
            <input style={inputStyle} placeholder="سبب الجزاء" value={penaltyForm.reason} onChange={(e) => setPenaltyForm({ ...penaltyForm, reason: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-start", marginTop: 8 }}>
            <Button variant="primary" onClick={handleAddPenalty} disabled={!penaltyForm.courier_name}>حفظ</Button>
            <Button variant="ghost" onClick={() => setShowPenaltyModal(false)}>إلغاء</Button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
}
