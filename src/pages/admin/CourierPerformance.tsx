/**
 * أداء المناديب - Courier Performance Dashboard
 * لوحة تحليلية شاملة لأداء المناديب والتوصيل
 */
import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Download,
  Printer,
  Users,
  UserCheck,
  Star,
  TrendingUp,
  Package,
  Clock,
  Calendar,
} from "lucide-react";
import { PageWrapper, PageHeader } from "@/components/admin/ui";
import { supabase } from "@/lib/supabase";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────
interface CourierRecord {
  id: string;
  name: string;
  city: string;
  rating: number;
  deliveries: number;
  successRate: number;
  avgDeliveryTime: number;
  status: "active" | "inactive";
}

const CITY_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((r) => headers.map((h) => `"${r[h] ?? ""}"`).join(",")),
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename + ".csv";
  a.click();
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function CourierPerformance() {
  const [couriers, setCouriers] = useState<CourierRecord[]>([]);
  const [dailyTrend] = useState<{ day: string; deliveries: number; successRate: number }[]>([]);
  const [monthlyTrend] = useState<{ month: string; orders: number; deliveries: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(getToday);

  // ── Supabase fetch with mock fallback ──
  const fetchCouriers = useCallback(async () => {
    setLoading(true);
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("couriers")
          .select("*")
          .order("rating", { ascending: false });
        if (!error && data && data.length > 0) {
          const mapped: CourierRecord[] = data.map((c: Record<string, unknown>) => ({
            id: String(c.id ?? c.courier_id ?? ""),
            name: String(c.name ?? c.full_name ?? ""),
            city: String(c.city ?? "الرياض"),
            rating: Number(c.rating ?? 0),
            deliveries: Number(c.deliveries ?? c.total_deliveries ?? 0),
            successRate: Number(c.success_rate ?? c.successRate ?? 95),
            avgDeliveryTime: Number(c.avg_delivery_time ?? c.avgDeliveryTime ?? 30),
            status: (c.status === "active" ? "active" : "inactive") as "active" | "inactive",
          }));
          setCouriers(mapped);
          setLoading(false);
          return;
        }
      }
    } catch {
      // keep empty
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCouriers();
  }, [fetchCouriers]);

  // ── Derived data ──
  const activeCouriers = couriers.filter((c) => c.status === "active");
  const totalCouriers = couriers.length;
  const activeCount = activeCouriers.length;
  const avgRating = couriers.length
    ? (couriers.reduce((s, c) => s + c.rating, 0) / couriers.length).toFixed(1)
    : "0";
  const avgSuccessRate = couriers.length
    ? (couriers.reduce((s, c) => s + c.successRate, 0) / couriers.length).toFixed(1)
    : "0";
  const todayOrders = dailyTrend.length ? dailyTrend[dailyTrend.length - 1].deliveries : 0;
  const avgDeliveryTime = couriers.length
    ? Math.round(couriers.reduce((s, c) => s + c.avgDeliveryTime, 0) / couriers.length)
    : 0;

  const top10 = [...couriers].sort((a, b) => b.rating - a.rating).slice(0, 10);
  const bottom10 = [...couriers].sort((a, b) => a.rating - b.rating).slice(0, 10);

  // City distribution
  const cityMap: Record<string, number> = {};
  couriers.forEach((c) => {
    cityMap[c.city] = (cityMap[c.city] || 0) + 1;
  });
  const cityDistribution = Object.entries(cityMap).map(([city, count]) => ({
    name: city,
    value: count,
  }));

  // City comparison
  const cityComparison = Object.entries(cityMap).map(([city]) => {
    const cityCouriers = couriers.filter((c) => c.city === city);
    const totalOrders = cityCouriers.reduce((s, c) => s + c.deliveries, 0);
    const avgCityRating =
      cityCouriers.length
        ? +(cityCouriers.reduce((s, c) => s + c.rating, 0) / cityCouriers.length).toFixed(1)
        : 0;
    return { city, orders: totalOrders, rating: avgCityRating };
  });

  // ── Export CSV ──
  const handleExportCSV = () => {
    downloadCSV(
      couriers.map((c) => ({
        المعرف: c.id,
        الاسم: c.name,
        المدينة: c.city,
        التقييم: c.rating,
        التوصيلات: c.deliveries,
        "نسبة النجاح %": c.successRate,
        "متوسط الوقت (دقيقة)": c.avgDeliveryTime,
        الحالة: c.status === "active" ? "نشط" : "غير نشط",
      })),
      `courier_performance_${getToday()}`,
    );
  };

  // ── Styles ──
  const cardStyle: React.CSSProperties = {
    background: "var(--con-bg-surface-1)",
    border: "1px solid var(--con-border-default)",
    borderRadius: 12,
    padding: "1.25rem",
  };

  const kpiStyle: React.CSSProperties = {
    ...cardStyle,
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    minWidth: 0,
  };

  const chartWrapperStyle: React.CSSProperties = {
    ...cardStyle,
    padding: "1.25rem",
  };

  const iconBoxStyle = (bg: string): React.CSSProperties => ({
    width: 44,
    height: 44,
    borderRadius: 10,
    background: bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  });

  const inputStyle: React.CSSProperties = {
    background: "var(--con-bg-surface-2)",
    border: "1px solid var(--con-border-default)",
    borderRadius: 8,
    padding: "0.5rem 0.75rem",
    color: "var(--con-text-primary)",
    fontSize: "var(--con-text-caption)",
    outline: "none",
  };

  const btnStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "0.5rem 1rem",
    borderRadius: 8,
    border: "1px solid var(--con-border-default)",
    background: "var(--con-bg-surface-1)",
    color: "var(--con-text-primary)",
    fontSize: "var(--con-text-caption)",
    cursor: "pointer",
    transition: "background 0.15s",
  };

  const chartTitleStyle: React.CSSProperties = {
    color: "var(--con-text-primary)",
    fontSize: "var(--con-text-body)",
    fontWeight: 600,
    marginBottom: "1rem",
  };

  const tooltipStyle = {
    contentStyle: {
      background: "var(--con-bg-surface-2)",
      border: "1px solid var(--con-border-default)",
      borderRadius: 8,
      color: "var(--con-text-primary)",
      fontSize: 12,
    },
  };

  return (
    <PageWrapper>
      <PageHeader
        icon={TrendingUp}
        title="أداء المناديب"
        subtitle="لوحة تحليلية شاملة لمؤشرات أداء المناديب"
      />

      {/* ── Toolbar ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={16} style={{ color: "var(--con-text-muted)" }} />
          <span style={{ color: "var(--con-text-secondary)", fontSize: "var(--con-text-caption)" }}>
            من
          </span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={inputStyle}
          />
          <span style={{ color: "var(--con-text-secondary)", fontSize: "var(--con-text-caption)" }}>
            إلى
          </span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginInlineStart: "auto", display: "flex", gap: 8 }}>
          <button
            style={btnStyle}
            onClick={() => fetchCouriers()}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--con-bg-surface-2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--con-bg-surface-1)";
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            تحديث
          </button>
          <button
            style={btnStyle}
            onClick={handleExportCSV}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--con-bg-surface-2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--con-bg-surface-1)";
            }}
          >
            <Download size={14} />
            تصدير CSV
          </button>
          <button
            style={btnStyle}
            onClick={() => window.print()}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--con-bg-surface-2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--con-bg-surface-1)";
            }}
          >
            <Printer size={14} />
            طباعة
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* إجمالي المناديب */}
        <div style={kpiStyle}>
          <div style={iconBoxStyle("rgba(59,130,246,0.15)")}>
            <Users size={20} color="#3b82f6" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)" }}>
              إجمالي المناديب
            </div>
            <div style={{ color: "var(--con-text-primary)", fontSize: 22, fontWeight: 700 }}>
              {totalCouriers}
            </div>
          </div>
        </div>

        {/* نشطين */}
        <div style={kpiStyle}>
          <div style={iconBoxStyle("rgba(16,185,129,0.15)")}>
            <UserCheck size={20} color="#10b981" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)" }}>
              نشطين
            </div>
            <div style={{ color: "var(--con-text-primary)", fontSize: 22, fontWeight: 700 }}>
              {activeCount}
            </div>
          </div>
        </div>

        {/* متوسط التقييم */}
        <div style={kpiStyle}>
          <div style={iconBoxStyle("rgba(245,158,11,0.15)")}>
            <Star size={20} color="#f59e0b" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)" }}>
              متوسط التقييم
            </div>
            <div style={{ color: "var(--con-text-primary)", fontSize: 22, fontWeight: 700 }}>
              {avgRating} / 5
            </div>
          </div>
        </div>

        {/* معدل التوصيل */}
        <div style={kpiStyle}>
          <div style={iconBoxStyle("rgba(139,92,246,0.15)")}>
            <TrendingUp size={20} color="#8b5cf6" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)" }}>
              معدل التوصيل
            </div>
            <div style={{ color: "var(--con-text-primary)", fontSize: 22, fontWeight: 700 }}>
              {avgSuccessRate}%
            </div>
          </div>
        </div>

        {/* طلبات اليوم */}
        <div style={kpiStyle}>
          <div style={iconBoxStyle("rgba(236,72,153,0.15)")}>
            <Package size={20} color="#ec4899" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)" }}>
              طلبات اليوم
            </div>
            <div style={{ color: "var(--con-text-primary)", fontSize: 22, fontWeight: 700 }}>
              {todayOrders}
            </div>
          </div>
        </div>

        {/* متوسط وقت التوصيل */}
        <div style={kpiStyle}>
          <div style={iconBoxStyle("rgba(14,165,233,0.15)")}>
            <Clock size={20} color="#0ea5e9" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)" }}>
              متوسط وقت التوصيل
            </div>
            <div style={{ color: "var(--con-text-primary)", fontSize: 22, fontWeight: 700 }}>
              {avgDeliveryTime} د
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts Grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(480px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {/* 1. أفضل 10 مناديب */}
        <div style={chartWrapperStyle}>
          <div style={chartTitleStyle}>أفضل 10 مناديب (حسب التقييم)</div>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={top10} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--con-border-default)" />
              <XAxis type="number" domain={[0, 5]} tick={{ fill: "var(--con-text-muted)", fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "var(--con-text-secondary)", fontSize: 11 }}
                width={75}
              />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="rating" name="التقييم" fill="#10b981" radius={[0, 4, 4, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 2. أسوأ 10 مناديب */}
        <div style={chartWrapperStyle}>
          <div style={chartTitleStyle}>أسوأ 10 مناديب (حسب التقييم)</div>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={bottom10} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--con-border-default)" />
              <XAxis type="number" domain={[0, 5]} tick={{ fill: "var(--con-text-muted)", fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "var(--con-text-secondary)", fontSize: 11 }}
                width={75}
              />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="rating" name="التقييم" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 3. توزيع المناديب حسب المدينة */}
        <div style={chartWrapperStyle}>
          <div style={chartTitleStyle}>توزيع المناديب حسب المدينة</div>
          <ResponsiveContainer width="100%" height={340}>
            <PieChart>
              <Pie
                data={cityDistribution}
                cx="50%"
                cy="50%"
                outerRadius={120}
                innerRadius={60}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine
              >
                {cityDistribution.map((_, idx) => (
                  <Cell key={idx} fill={CITY_COLORS[idx % CITY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend
                wrapperStyle={{ color: "var(--con-text-secondary)", fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 4. معدل التوصيل اليومي */}
        <div style={chartWrapperStyle}>
          <div style={chartTitleStyle}>معدل التوصيل اليومي (آخر 14 يوم)</div>
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={dailyTrend} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--con-border-default)" />
              <XAxis dataKey="day" tick={{ fill: "var(--con-text-muted)", fontSize: 10 }} />
              <YAxis tick={{ fill: "var(--con-text-muted)", fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ color: "var(--con-text-secondary)", fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="deliveries"
                name="التوصيلات"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4, fill: "#3b82f6" }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="successRate"
                name="نسبة النجاح %"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4, fill: "#10b981" }}
                activeDot={{ r: 6 }}
                yAxisId={0}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 5. مقارنة بين المدن */}
        <div style={chartWrapperStyle}>
          <div style={chartTitleStyle}>مقارنة بين المدن (الطلبات والتقييم)</div>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={cityComparison} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--con-border-default)" />
              <XAxis dataKey="city" tick={{ fill: "var(--con-text-muted)", fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fill: "var(--con-text-muted)", fontSize: 11 }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 5]}
                tick={{ fill: "var(--con-text-muted)", fontSize: 11 }}
              />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ color: "var(--con-text-secondary)", fontSize: 12 }} />
              <Bar yAxisId="left" dataKey="orders" name="الطلبات" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} />
              <Bar yAxisId="right" dataKey="rating" name="التقييم" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 6. Trend شهري */}
        <div style={chartWrapperStyle}>
          <div style={chartTitleStyle}>Trend شهري (آخر 6 أشهر)</div>
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={monthlyTrend} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="gradOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradDeliveries" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--con-border-default)" />
              <XAxis dataKey="month" tick={{ fill: "var(--con-text-muted)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--con-text-muted)", fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ color: "var(--con-text-secondary)", fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="orders"
                name="الطلبات"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#gradOrders)"
              />
              <Area
                type="monotone"
                dataKey="deliveries"
                name="التوصيلات"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#gradDeliveries)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </PageWrapper>
  );
}
