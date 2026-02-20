/**
 * صفحة المالية والرواتب - لوحة إدارة فيرست لاين
 * إدارة رواتب المناديب والاستحقاقات المالية
 */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  DollarSign, TrendingUp, TrendingDown, CheckCircle2,
  Clock, XCircle, Search, Filter, Download, Eye,
  ChevronDown, Wallet, CreditCard, AlertTriangle,
  Calendar, RefreshCw, Plus
} from "lucide-react";

type PaymentStatus = "pending" | "approved" | "paid" | "rejected";

interface FinanceRecord {
  id: string;
  courier_id: string;
  courier_name?: string;
  period_start: string;
  period_end: string;
  gross_revenue: number;
  platform_fees: number;
  vehicle_deductions: number;
  absence_deductions: number;
  maintenance_deductions: number;
  insurance_deductions: number;
  other_deductions: number;
  net_payout: number;
  payment_status: PaymentStatus;
  approved_at?: string;
  paid_at?: string;
  notes?: string;
  created_at: string;
}

interface FinanceStats {
  totalPending: number;
  totalApproved: number;
  totalPaid: number;
  pendingCount: number;
  approvedCount: number;
  paidCount: number;
}

const statusConfig: Record<PaymentStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending:  { label: "في الانتظار", color: "text-yellow-400", bg: "bg-yellow-400/10", icon: Clock },
  approved: { label: "موافق عليه",  color: "text-blue-400",   bg: "bg-blue-400/10",   icon: CheckCircle2 },
  paid:     { label: "مدفوع",       color: "text-green-400",  bg: "bg-green-400/10",  icon: Wallet },
  rejected: { label: "مرفوض",       color: "text-red-400",    bg: "bg-red-400/10",    icon: XCircle },
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });

export default function Finance() {
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [stats, setStats] = useState<FinanceStats>({ totalPending: 0, totalApproved: 0, totalPaid: 0, pendingCount: 0, approvedCount: 0, paidCount: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all");
  const [selectedRecord, setSelectedRecord] = useState<FinanceRecord | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchFinanceData();
  }, []);

  async function fetchFinanceData() {
    setLoading(true);
    try {
      // جلب سجلات المالية مع أسماء المناديب
      const { data: finance } = await supabase
        .from("finance_2026_02_17_21_00")
        .select(`
          *,
          couriers_2026_02_17_21_00 (
            users_2026_02_17_21_00 ( full_name )
          )
        `)
        .order("created_at", { ascending: false });

      if (finance) {
        const mapped: FinanceRecord[] = finance.map((r: any) => ({
          ...r,
          courier_name: r.couriers_2026_02_17_21_00?.users_2026_02_17_21_00?.full_name || "غير معروف",
        }));
        setRecords(mapped);

        // حساب الإحصائيات
        const pending  = mapped.filter(r => r.payment_status === "pending");
        const approved = mapped.filter(r => r.payment_status === "approved");
        const paid     = mapped.filter(r => r.payment_status === "paid");

        setStats({
          totalPending:  pending.reduce((s, r)  => s + r.net_payout, 0),
          totalApproved: approved.reduce((s, r) => s + r.net_payout, 0),
          totalPaid:     paid.reduce((s, r)     => s + r.net_payout, 0),
          pendingCount:  pending.length,
          approvedCount: approved.length,
          paidCount:     paid.length,
        });
      }
    } catch (err) {
      console.error("خطأ في جلب بيانات المالية:", err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, newStatus: PaymentStatus) {
    setUpdating(id);
    try {
      const updates: any = { payment_status: newStatus };
      if (newStatus === "approved") updates.approved_at = new Date().toISOString();
      if (newStatus === "paid")     updates.paid_at     = new Date().toISOString();

      const { error } = await supabase
        .from("finance_2026_02_17_21_00")
        .update(updates)
        .eq("id", id);

      if (!error) {
        await fetchFinanceData();
        if (selectedRecord?.id === id) {
          setSelectedRecord(prev => prev ? { ...prev, payment_status: newStatus } : null);
        }
      }
    } finally {
      setUpdating(null);
    }
  }

  const filtered = records.filter(r => {
    const matchName   = r.courier_name?.includes(search) || search === "";
    const matchStatus = statusFilter === "all" || r.payment_status === statusFilter;
    return matchName && matchStatus;
  });

  const kpis = [
    { label: "في الانتظار",  value: formatCurrency(stats.totalPending),  count: stats.pendingCount,  color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20", icon: Clock },
    { label: "موافق عليه",   value: formatCurrency(stats.totalApproved), count: stats.approvedCount, color: "text-blue-400",   bg: "bg-blue-400/10",   border: "border-blue-400/20",   icon: CheckCircle2 },
    { label: "مدفوع",        value: formatCurrency(stats.totalPaid),     count: stats.paidCount,     color: "text-green-400", bg: "bg-green-400/10",  border: "border-green-400/20",  icon: Wallet },
    { label: "إجمالي الفترة", value: formatCurrency(stats.totalPending + stats.totalApproved + stats.totalPaid), count: records.length, color: "text-cyan-400", bg: "bg-orange-400/10", border: "border-orange-400/20", icon: DollarSign },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">المالية والرواتب</h1>
          <p className="text-blue-300/60 mt-1">إدارة مستحقات المناديب والمدفوعات</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchFinanceData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-blue-100 rounded-lg transition-colors text-sm"
          >
            <RefreshCw size={14} />
            تحديث
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg transition-colors text-sm">
            <Plus size={14} />
            إضافة سجل
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className={`bg-slate-800 border ${k.border} rounded-xl p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-blue-300/60 text-sm">{k.label}</span>
              <div className={`${k.bg} p-2 rounded-lg`}>
                <k.icon size={16} className={k.color} />
              </div>
            </div>
            <div className={`text-xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-slate-500 text-xs mt-1">{k.count} سجل</div>
          </div>
        ))}
      </div>

      {/* الفلاتر */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* البحث */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/60" />
            <input
              type="text"
              placeholder="ابحث عن مندوب..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg pr-9 pl-4 py-2 text-sm text-white placeholder-blue-400/50 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* فلتر الحالة */}
          <div className="flex items-center gap-2 flex-wrap">
            {(["all", "pending", "approved", "paid", "rejected"] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  statusFilter === s
                    ? "bg-orange-500 text-white"
                    : "bg-slate-700 text-blue-300/60 hover:text-white"
                }`}
              >
                {s === "all" ? "الكل" : statusConfig[s].label}
              </button>
            ))}
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-blue-100 rounded-lg transition-colors text-sm mr-auto">
            <Download size={14} />
            تصدير
          </button>
        </div>
      </div>

      {/* الجدول */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-blue-300/60">
            <DollarSign size={40} className="mb-3 opacity-30" />
            <p>لا توجد سجلات مالية</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/50">
                  <th className="text-right text-blue-300/60 text-xs font-medium px-4 py-3">المندوب</th>
                  <th className="text-right text-blue-300/60 text-xs font-medium px-4 py-3">الفترة</th>
                  <th className="text-right text-blue-300/60 text-xs font-medium px-4 py-3">الإيراد الإجمالي</th>
                  <th className="text-right text-blue-300/60 text-xs font-medium px-4 py-3">الخصومات</th>
                  <th className="text-right text-blue-300/60 text-xs font-medium px-4 py-3">صافي الراتب</th>
                  <th className="text-right text-blue-300/60 text-xs font-medium px-4 py-3">الحالة</th>
                  <th className="text-right text-blue-300/60 text-xs font-medium px-4 py-3">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(record => {
                  const totalDeductions = record.platform_fees + record.vehicle_deductions +
                    record.absence_deductions + record.maintenance_deductions +
                    record.insurance_deductions + record.other_deductions;
                  const status = statusConfig[record.payment_status] || statusConfig.pending;
                  const StatusIcon = status.icon;

                  return (
                    <tr key={record.id} className="border-b border-blue-700/30 hover:bg-blue-900/30 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 font-bold text-sm">
                            {record.courier_name?.charAt(0) || "؟"}
                          </div>
                          <span className="text-white text-sm font-medium">{record.courier_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-blue-100 text-sm">{formatDate(record.period_start)}</div>
                        <div className="text-slate-500 text-xs">حتى {formatDate(record.period_end)}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-green-400 font-medium text-sm">{formatCurrency(record.gross_revenue)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-red-400 font-medium text-sm">- {formatCurrency(totalDeductions)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-white font-bold text-sm">{formatCurrency(record.net_payout)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-medium ${status.color} ${status.bg}`}>
                          <StatusIcon size={12} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedRecord(record)}
                            className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                            title="عرض التفاصيل"
                          >
                            <Eye size={14} className="text-blue-100" />
                          </button>
                          {record.payment_status === "pending" && (
                            <button
                              onClick={() => updateStatus(record.id, "approved")}
                              disabled={updating === record.id}
                              className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs transition-colors disabled:opacity-50"
                            >
                              {updating === record.id ? "..." : "موافقة"}
                            </button>
                          )}
                          {record.payment_status === "approved" && (
                            <button
                              onClick={() => updateStatus(record.id, "paid")}
                              disabled={updating === record.id}
                              className="px-2.5 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-xs transition-colors disabled:opacity-50"
                            >
                              {updating === record.id ? "..." : "تأكيد الدفع"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal التفاصيل */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedRecord.courier_name}</h3>
                <p className="text-blue-300/60 text-sm mt-0.5">
                  {formatDate(selectedRecord.period_start)} — {formatDate(selectedRecord.period_end)}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-blue-300/60"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* تفاصيل الراتب */}
            <div className="p-6 space-y-4">
              {/* الإيرادات */}
              <div className="bg-green-400/5 border border-green-400/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-blue-300/60 text-sm">الإيراد الإجمالي</span>
                  <span className="text-green-400 font-bold">{formatCurrency(selectedRecord.gross_revenue)}</span>
                </div>
              </div>

              {/* الخصومات */}
              <div className="bg-slate-700/40 rounded-xl p-4 space-y-2.5">
                <h4 className="text-blue-300/60 text-xs font-medium mb-3 flex items-center gap-2">
                  <TrendingDown size={12} className="text-red-400" />
                  الخصومات
                </h4>
                {[
                  { label: "رسوم المنصة",   value: selectedRecord.platform_fees },
                  { label: "خصم السيارة",   value: selectedRecord.vehicle_deductions },
                  { label: "خصم الغياب",    value: selectedRecord.absence_deductions },
                  { label: "خصم الصيانة",   value: selectedRecord.maintenance_deductions },
                  { label: "خصم التأمين",   value: selectedRecord.insurance_deductions },
                  { label: "خصومات أخرى",   value: selectedRecord.other_deductions },
                ].filter(d => d.value > 0).map(d => (
                  <div key={d.label} className="flex items-center justify-between text-sm">
                    <span className="text-blue-300/60">{d.label}</span>
                    <span className="text-red-400">- {formatCurrency(d.value)}</span>
                  </div>
                ))}
              </div>

              {/* صافي الراتب */}
              <div className="bg-orange-400/10 border border-orange-400/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-blue-100 font-medium">صافي المستحق</span>
                  <span className="text-cyan-400 font-bold text-xl">{formatCurrency(selectedRecord.net_payout)}</span>
                </div>
              </div>

              {/* الحالة والملاحظات */}
              {selectedRecord.notes && (
                <div className="text-blue-300/60 text-sm bg-blue-900/30 rounded-lg p-3">
                  <span className="text-slate-500 text-xs block mb-1">ملاحظات</span>
                  {selectedRecord.notes}
                </div>
              )}

              {/* أزرار الإجراء */}
              <div className="flex gap-3 pt-2">
                {selectedRecord.payment_status === "pending" && (
                  <>
                    <button
                      onClick={() => { updateStatus(selectedRecord.id, "approved"); setSelectedRecord(null); }}
                      className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      موافقة
                    </button>
                    <button
                      onClick={() => { updateStatus(selectedRecord.id, "rejected"); setSelectedRecord(null); }}
                      className="px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
                    >
                      رفض
                    </button>
                  </>
                )}
                {selectedRecord.payment_status === "approved" && (
                  <button
                    onClick={() => { updateStatus(selectedRecord.id, "paid"); setSelectedRecord(null); }}
                    className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    تأكيد الدفع
                  </button>
                )}
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-blue-100 rounded-lg text-sm transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
