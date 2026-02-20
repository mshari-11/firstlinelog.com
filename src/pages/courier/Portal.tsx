/**
 * بوابة المندوب - فيرست لاين لوجستيكس
 * يعرض للمندوب: طلباته، حالته، بياناته
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/admin/auth";
import { supabase } from "@/lib/supabase";
import {
  Truck, Package, Clock, CheckCircle2, XCircle,
  LogOut, User, MapPin, Phone, AlertTriangle
} from "lucide-react";

interface CourierInfo {
  full_name: string;
  phone: string;
  city: string;
  status: string;
  username: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  platform: string;
  pickup_location: string;
  delivery_location: string;
  created_at: string;
}

export default function CourierPortal() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [courier, setCourier] = useState<CourierInfo | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/admin/login");
      return;
    }
    if (!authLoading && user && user.role !== "courier") {
      navigate("/admin/dashboard");
      return;
    }
    if (user) fetchData();
  }, [user, authLoading]);

  async function fetchData() {
    if (!supabase || !user) return;

    // بيانات المندوب
    const { data: cData } = await supabase
      .from("couriers_2026_02_17_21_00")
      .select("full_name, phone, city, status, username")
      .eq("user_id", user.id)
      .single();

    if (cData) setCourier(cData);

    // طلبات المندوب
    const { data: oData } = await supabase
      .from("orders_2026_02_17_21_00")
      .select("id, order_number, status, platform, pickup_location, delivery_location, created_at")
      .eq("courier_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (oData) setOrders(oData);
    setLoading(false);
  }

  async function handleLogout() {
    await signOut();
    navigate("/admin/login");
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "oklch(0.10 0.06 220)" }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "oklch(0.65 0.18 200 / 0.3)", borderTopColor: "oklch(0.65 0.18 200)" }} />
      </div>
    );
  }

  const statusBadge = (s: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: "bg-amber-500/20", text: "text-amber-400", label: "بانتظار الموافقة" },
      active: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "نشط" },
      inactive: { bg: "bg-red-500/20", text: "text-red-400", label: "غير نشط" },
      delivered: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "تم التوصيل" },
      in_transit: { bg: "bg-blue-500/20", text: "text-blue-400", label: "قيد التوصيل" },
      cancelled: { bg: "bg-red-500/20", text: "text-red-400", label: "ملغي" },
      new: { bg: "bg-cyan-500/20", text: "text-cyan-400", label: "جديد" },
    };
    const m = map[s] || { bg: "bg-gray-500/20", text: "text-gray-400", label: s };
    return <span className={`px-2 py-1 rounded-lg text-xs font-medium ${m.bg} ${m.text}`}>{m.label}</span>;
  };

  return (
    <div className="min-h-screen" dir="rtl" style={{ background: "oklch(0.10 0.06 220)" }}>
      {/* الهيدر */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b"
        style={{ background: "oklch(0.12 0.06 220 / 0.9)", borderColor: "oklch(0.22 0.05 210 / 0.5)" }}>
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Truck className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm">بوابة المندوب</h1>
              <p className="text-xs text-blue-300/60">فيرست لاين لوجستيكس</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut size={16} /> خروج
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* بطاقة المندوب */}
        {courier && (
          <div className="rounded-2xl p-6 border"
            style={{ background: "oklch(0.14 0.06 220 / 0.6)", borderColor: "oklch(0.22 0.05 210 / 0.5)" }}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
                  <User className="w-7 h-7 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{courier.full_name}</h2>
                  <p className="text-sm text-blue-300/60 font-mono" dir="ltr">@{courier.username}</p>
                </div>
              </div>
              {statusBadge(courier.status)}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-blue-200/80">
              <span className="flex items-center gap-1.5"><Phone size={14} /> {courier.phone}</span>
              <span className="flex items-center gap-1.5"><MapPin size={14} /> {courier.city}</span>
            </div>
            {courier.status === "pending" && (
              <div className="mt-4 p-3 bg-amber-900/20 border border-amber-700/30 rounded-xl flex items-center gap-2 text-amber-300 text-sm">
                <AlertTriangle size={16} />
                حسابك قيد المراجعة من الإدارة. سيتم تفعيله قريباً.
              </div>
            )}
          </div>
        )}

        {/* الطلبات */}
        <div className="rounded-2xl p-6 border"
          style={{ background: "oklch(0.14 0.06 220 / 0.6)", borderColor: "oklch(0.22 0.05 210 / 0.5)" }}>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Package size={20} className="text-cyan-400" /> طلباتي
          </h3>

          {orders.length === 0 ? (
            <div className="text-center py-12 text-blue-300/50">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد طلبات حالياً</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <div key={order.id} className="p-4 rounded-xl border flex items-center justify-between"
                  style={{ background: "oklch(0.12 0.05 220 / 0.5)", borderColor: "oklch(0.20 0.04 210 / 0.4)" }}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">#{order.order_number}</span>
                      {statusBadge(order.status)}
                    </div>
                    <p className="text-xs text-blue-300/60">
                      {order.platform && <span className="ml-2">{order.platform}</span>}
                      {order.delivery_location}
                    </p>
                  </div>
                  <div className="text-xs text-blue-300/40">
                    {new Date(order.created_at).toLocaleDateString("ar-SA")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
