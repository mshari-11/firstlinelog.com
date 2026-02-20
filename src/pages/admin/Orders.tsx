/**
 * صفحة إدارة الطلبات
 */
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  Package, Search, Filter, Clock, CheckCircle2,
  XCircle, Bike, MapPin, Phone, MoreVertical,
  TrendingUp, ArrowUpRight, RefreshCw
} from "lucide-react";

interface Order {
  id: string;
  courier_name: string;
  platform: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  status: "pending" | "picked_up" | "on_way" | "delivered" | "failed" | "returned";
  amount: number;
  created_at: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "بانتظار الاستلام", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  picked_up: { label: "تم الاستلام", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  on_way: { label: "في الطريق", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  delivered: { label: "تم التسليم", color: "text-green-400 bg-green-500/10 border-green-500/20" },
  failed: { label: "فشل التسليم", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  returned: { label: "مرتجع", color: "text-blue-300/60 bg-blue-900/50 border-slate-600/20" },
};

const mockOrders: Order[] = [
  { id: "#10240", courier_name: "أحمد محمد", platform: "جاهز", customer_name: "محمد علي", customer_phone: "0501234567", address: "الرياض، حي النزهة", status: "on_way", amount: 45, created_at: "14:23" },
  { id: "#10239", courier_name: "خالد العمري", platform: "مرسول", customer_name: "فاطمة السالم", customer_phone: "0557654321", address: "جدة، حي الروضة", status: "delivered", amount: 30, created_at: "13:55" },
  { id: "#10238", courier_name: "فهد الغامدي", platform: "نون", customer_name: "علي أحمد", customer_phone: "0509876543", address: "الرياض، حي الملقا", status: "picked_up", amount: 65, created_at: "13:40" },
  { id: "#10237", courier_name: "سعد الزهراني", platform: "صاحب", customer_name: "هند محمد", customer_phone: "0551112233", address: "الدمام، حي الفيصلية", status: "pending", amount: 25, created_at: "13:10" },
  { id: "#10236", courier_name: "عمر الشمري", platform: "Shopify", customer_name: "عبدالله خالد", customer_phone: "0503334455", address: "الرياض، حي العليا", status: "delivered", amount: 80, created_at: "12:45" },
  { id: "#10235", courier_name: "محمد القحطاني", platform: "جاهز", customer_name: "نورة العتيبي", customer_phone: "0556667788", address: "مكة، حي العزيزية", status: "failed", amount: 55, created_at: "12:20" },
  { id: "#10234", courier_name: "أحمد محمد", platform: "مرسول", customer_name: "سلمى الشريف", customer_phone: "0509998877", address: "الرياض، حي السلام", status: "returned", amount: 40, created_at: "11:55" },
];

const platforms = ["الكل", "jahez", "hungerstation", "toyor", "marsool", "mrsool", "noon", "amazon"];
const platformLabels: Record<string, string> = {
  "الكل": "الكل", jahez: "جاهز", hungerstation: "هنقرستيشن",
  toyor: "طيور", marsool: "مرسول", mrsool: "مرسول برو",
  noon: "نون", amazon: "أمازون"
};

export default function AdminOrders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("الكل");
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      const { data, error } = await supabase
        .from("orders_2026_02_17_21_00")
        .select(`*, couriers_2026_02_17_21_00(full_name)`)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!error && data && data.length > 0) {
        const mapped = data.map((o: any) => ({
          id: `#${o.id}`,
          courier_name: o.couriers_2026_02_17_21_00?.full_name || "غير محدد",
          platform: o.platform,
          customer_name: o.customer_name || "غير محدد",
          customer_phone: o.customer_phone || "",
          address: o.delivery_address || "",
          status: o.status,
          amount: o.amount || 0,
          created_at: new Date(o.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
        }));
        setOrders(mapped);
      }
      setLoading(false);
    }
    fetchOrders();
  }, []);

  const filtered = orders.filter((o) => {
    const matchSearch = o.id.includes(search) || o.courier_name.includes(search) || o.customer_name.includes(search);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchPlatform = platformFilter === "الكل" || o.platform === platformFilter;
    return matchSearch && matchStatus && matchPlatform;
  });

  const stats = {
    total: orders.length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    active: orders.filter((o) => ["pending", "picked_up", "on_way"].includes(o.status)).length,
    failed: orders.filter((o) => o.status === "failed" || o.status === "returned").length,
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* الترويسة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">الطلبات</h1>
          <p className="text-blue-300/60 text-sm mt-0.5">تتبع ومتابعة جميع طلبات التوصيل</p>
        </div>
        <button className="flex items-center gap-2 text-blue-300/60 hover:text-slate-200 border border-blue-700/30 px-3 py-2 rounded-xl text-sm transition-colors">
          <RefreshCw size={15} />
          تحديث
        </button>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "إجمالي اليوم", value: stats.total, icon: Package, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
          { label: "تم التسليم", value: stats.delivered, icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
          { label: "جارية", value: stats.active, icon: Bike, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
          { label: "فشل / مرتجع", value: stats.failed, icon: XCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
        ].map((s) => (
          <div key={s.label} className={`border rounded-2xl p-4 ${s.bg}`}>
            <div className="mb-2"><s.icon size={20} className={s.color} /></div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-blue-300/60 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* فلترة */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث برقم الطلب، المندوب، أو العميل..."
              className="w-full bg-blue-950/60 border border-blue-700/30 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-blue-950/60 border border-blue-700/30 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">كل الحالات</option>
            {Object.entries(statusMap).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* منصات */}
        <div className="flex gap-2 flex-wrap">
          {platforms.map((p) => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                platformFilter === p
                  ? "bg-orange-500 text-white"
                  : "bg-blue-950/60 text-blue-300/60 hover:text-slate-200 border border-blue-700/30"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* جدول الطلبات */}
      <div className="bg-slate-800/40 border border-blue-700/30 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-blue-700/30">
                <th className="text-right text-slate-500 text-xs font-medium px-5 py-3.5">رقم الطلب</th>
                <th className="text-right text-slate-500 text-xs font-medium px-5 py-3.5">المندوب</th>
                <th className="text-right text-slate-500 text-xs font-medium px-5 py-3.5">المنصة</th>
                <th className="text-right text-slate-500 text-xs font-medium px-5 py-3.5">العميل</th>
                <th className="text-right text-slate-500 text-xs font-medium px-5 py-3.5">العنوان</th>
                <th className="text-right text-slate-500 text-xs font-medium px-5 py-3.5">المبلغ</th>
                <th className="text-right text-slate-500 text-xs font-medium px-5 py-3.5">الحالة</th>
                <th className="text-right text-slate-500 text-xs font-medium px-5 py-3.5">الوقت</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-b border-slate-800/50 hover:bg-slate-700/20 transition-colors cursor-pointer">
                  <td className="px-5 py-3.5 text-sm font-mono text-blue-100">{order.id}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-200">{order.courier_name}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs bg-slate-700/60 text-blue-100 px-2.5 py-1 rounded-lg">{order.platform}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-slate-200">{order.customer_name}</p>
                    <p className="text-xs text-slate-500 font-mono">{order.customer_phone}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-start gap-1 text-blue-300/60 text-xs max-w-36">
                      <MapPin size={11} className="mt-0.5 shrink-0" />
                      <span className="truncate">{order.address}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-blue-100 font-medium">{order.amount} ر.س</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${statusMap[order.status]?.color}`}>
                      {statusMap[order.status]?.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">{order.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Package size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">لا توجد طلبات</p>
          </div>
        )}
      </div>
    </div>
  );
}
