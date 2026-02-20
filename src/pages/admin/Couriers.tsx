/**
 * صفحة إدارة المناديب
 */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Users, Plus, Search, Filter, MoreVertical,
  CheckCircle2, XCircle, Clock, Phone, MapPin,
  Star, Package, Bike, ChevronDown
} from "lucide-react";

interface Courier {
  id: string;
  full_name: string;
  phone: string;
  status: "active" | "inactive" | "on_delivery" | "pending";
  city?: string;
  rating?: number;
  total_orders?: number;
  vehicle_type?: string;
  created_at: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  active: { label: "نشط", color: "text-green-400 bg-green-500/10 border-green-500/20" },
  inactive: { label: "غير نشط", color: "text-blue-300/60 bg-blue-900/50 border-slate-600/20" },
  on_delivery: { label: "في التوصيل", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  pending: { label: "معلق", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
};

const mockCouriers: Courier[] = [
  { id: "1", full_name: "أحمد محمد السالم", phone: "0501234567", status: "active", city: "الرياض", rating: 4.8, total_orders: 312, vehicle_type: "دراجة", created_at: "2024-01-15" },
  { id: "2", full_name: "خالد العمري", phone: "0557654321", status: "on_delivery", city: "جدة", rating: 4.5, total_orders: 198, vehicle_type: "سيارة", created_at: "2024-02-20" },
  { id: "3", full_name: "فهد الغامدي", phone: "0509876543", status: "active", city: "الرياض", rating: 4.9, total_orders: 445, vehicle_type: "دراجة", created_at: "2023-11-10" },
  { id: "4", full_name: "سعد الزهراني", phone: "0551112233", status: "inactive", city: "الدمام", rating: 3.9, total_orders: 87, vehicle_type: "دراجة", created_at: "2024-03-05" },
  { id: "5", full_name: "عمر الشمري", phone: "0503334455", status: "pending", city: "الرياض", rating: undefined, total_orders: 0, vehicle_type: "سيارة", created_at: "2025-02-01" },
  { id: "6", full_name: "محمد القحطاني", phone: "0556667788", status: "active", city: "مكة", rating: 4.7, total_orders: 234, vehicle_type: "دراجة", created_at: "2024-04-18" },
];

export default function AdminCouriers() {
  const [couriers, setCouriers] = useState<Courier[]>(mockCouriers);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => { fetchCouriers(); }, []);

  async function fetchCouriers() {
    if (!supabase) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from("couriers_2026_02_17_21_00")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        setCouriers(data as Courier[]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = couriers.filter((c) => {
    const matchSearch = c.full_name.includes(search) || c.phone.includes(search);
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: couriers.length,
    active: couriers.filter((c) => c.status === "active").length,
    onDelivery: couriers.filter((c) => c.status === "on_delivery").length,
    pending: couriers.filter((c) => c.status === "pending").length,
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* الترويسة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">المناديب</h1>
          <p className="text-blue-300/60 text-sm mt-0.5">إدارة جميع مناديب التوصيل</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          إضافة مندوب
        </button>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "إجمالي المناديب", value: stats.total, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
          { label: "نشطون الآن", value: stats.active, icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
          { label: "في التوصيل", value: stats.onDelivery, icon: Bike, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
          { label: "طلبات قيد المراجعة", value: stats.pending, icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
        ].map((s) => (
          <div key={s.label} className={`border rounded-2xl p-4 ${s.bg}`}>
            <div className={`mb-2`}><s.icon size={20} className={s.color} /></div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-blue-300/60 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* شريط البحث والفلترة */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الجوال..."
            className="w-full bg-blue-950/60 border border-blue-700/30 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-blue-950/60 border border-blue-700/30 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
        >
          <option value="all">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="on_delivery">في التوصيل</option>
          <option value="inactive">غير نشط</option>
          <option value="pending">معلق</option>
        </select>
      </div>

      {/* جدول المناديب */}
      <div className="bg-slate-800/40 border border-blue-700/30 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-blue-700/30">
                <th className="text-right text-slate-500 text-xs font-medium px-5 py-3.5">المندوب</th>
                <th className="text-right text-slate-500 text-xs font-medium px-5 py-3.5">رقم الجوال</th>
                <th className="text-right text-slate-500 text-xs font-medium px-5 py-3.5">المدينة</th>
                <th className="text-right text-slate-500 text-xs font-medium px-5 py-3.5">المركبة</th>
                <th className="text-right text-slate-500 text-xs font-medium px-5 py-3.5">التقييم</th>
                <th className="text-right text-slate-500 text-xs font-medium px-5 py-3.5">الطلبات</th>
                <th className="text-right text-slate-500 text-xs font-medium px-5 py-3.5">الحالة</th>
                <th className="text-right text-slate-500 text-xs font-medium px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((courier) => (
                <tr key={courier.id} className="border-b border-slate-800/50 hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">{courier.full_name.charAt(0)}</span>
                      </div>
                      <p className="text-sm text-slate-200 font-medium">{courier.full_name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-blue-300/60 font-mono">{courier.phone}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-blue-300/60 text-sm">
                      <MapPin size={13} />
                      {courier.city}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs bg-slate-700/60 text-blue-100 px-2.5 py-1 rounded-lg">{courier.vehicle_type}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {courier.rating ? (
                      <div className="flex items-center gap-1 text-yellow-400 text-sm">
                        <Star size={13} className="fill-yellow-400" />
                        {courier.rating}
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 text-blue-300/60 text-sm">
                      <Package size={13} />
                      {courier.total_orders}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${statusMap[courier.status]?.color}`}>
                      {statusMap[courier.status]?.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button className="text-slate-500 hover:text-blue-100 transition-colors p-1 rounded-lg hover:bg-blue-900/50">
                      <MoreVertical size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Users size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">لا توجد نتائج</p>
          </div>
        )}
      </div>
    </div>
  );
}
