/**
 * Charts Panel Widget — Orders and Revenue charts
 * Connected to Supabase with mock fallback
 */
import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { WidgetShell } from "../WidgetShell";
import { BarChart3 } from "lucide-react";
import { chartTooltipStyle } from "@/components/admin/FinanceUI";
import { supabase } from "@/lib/supabase";

const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

const mockOrdersData = [
  { day: "السبت", orders: 142 }, { day: "الأحد", orders: 198 },
  { day: "الاثنين", orders: 167 }, { day: "الثلاثاء", orders: 223 },
  { day: "الأربعاء", orders: 189 }, { day: "الخميس", orders: 245 },
  { day: "الجمعة", orders: 98 },
];

const mockRevenueData = [
  { month: "أكتوبر", revenue: 92000 }, { month: "نوفمبر", revenue: 78000 },
  { month: "ديسمبر", revenue: 115000 }, { month: "يناير", revenue: 103000 },
  { month: "فبراير", revenue: 128000 }, { month: "مارس", revenue: 142000 },
];

export function ChartsPanel() {
  const [ordersData, setOrdersData] = useState(mockOrdersData);
  const [revenueData, setRevenueData] = useState(mockRevenueData);

  useEffect(() => {
    async function fetchChartData() {
      if (!supabase) return;
      try {
        // Weekly orders — last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 6);
        weekAgo.setHours(0, 0, 0, 0);

        const { data: ordersRaw } = await supabase
          .from("orders")
          .select("created_at")
          .gte("created_at", weekAgo.toISOString());

        if (ordersRaw && ordersRaw.length > 0) {
          const countByDay = new Map<string, number>();
          for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            countByDay.set(d.toISOString().split("T")[0], 0);
          }
          for (const row of ordersRaw) {
            const dateKey = new Date(row.created_at).toISOString().split("T")[0];
            countByDay.set(dateKey, (countByDay.get(dateKey) || 0) + 1);
          }
          const live = Array.from(countByDay.entries()).map(([dateStr, count]) => ({
            day: DAYS_AR[new Date(dateStr).getDay()],
            orders: count,
          }));
          if (live.some((d) => d.orders > 0)) setOrdersData(live);
        }

        // Monthly revenue — last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const { data: revenueRaw } = await supabase
          .from("orders")
          .select("total_amount, created_at")
          .gte("created_at", sixMonthsAgo.toISOString());

        if (revenueRaw && revenueRaw.length > 0) {
          const byMonth = new Map<string, number>();
          for (let i = 0; i < 6; i++) {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            byMonth.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
          }
          for (const row of revenueRaw) {
            const d = new Date(row.created_at);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            byMonth.set(key, (byMonth.get(key) || 0) + (Number(row.total_amount) || 0));
          }
          const live = Array.from(byMonth.entries()).map(([key, total]) => ({
            month: MONTHS_AR[parseInt(key.split("-")[1]) - 1],
            revenue: Math.round(total),
          }));
          if (live.some((d) => d.revenue > 0)) setRevenueData(live);
        }
      } catch { /* keep mock */ }
    }
    fetchChartData();
  }, []);

  return (
    <WidgetShell
      id="charts-panel"
      title="الأداء التشغيلي"
      subtitle="الطلبات والإيرادات"
      icon={BarChart3}
      iconColor="var(--con-info)"
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Weekly Orders */}
        <div>
          <h4 style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", margin: "0 0 10px", fontWeight: 600 }}>
            طلبات الأسبوع
          </h4>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={ordersData}>
              <defs>
                <linearGradient id="ctOrdersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: "var(--con-text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--con-text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: "var(--con-text-muted)" }} />
              <Area type="monotone" dataKey="orders" name="الطلبات" stroke="#3B82F6" strokeWidth={2} fill="url(#ctOrdersGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Revenue */}
        <div>
          <h4 style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", margin: "0 0 10px", fontWeight: 600 }}>
            الإيرادات الشهرية
          </h4>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={revenueData} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "var(--con-text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: "var(--con-text-muted)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(v: number) => [`${v.toLocaleString("ar-SA")} ر.س`, "الإيراد"]}
              />
              <Bar dataKey="revenue" fill="#16A34A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </WidgetShell>
  );
}
