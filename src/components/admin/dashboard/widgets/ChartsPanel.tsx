/**
 * Charts Panel Widget — Orders and Revenue charts
 */
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { WidgetShell } from "../WidgetShell";
import { BarChart3 } from "lucide-react";
import { chartTooltipStyle } from "@/components/admin/FinanceUI";

const ordersData = [
  { day: "السبت",     orders: 142 },
  { day: "الأحد",    orders: 198 },
  { day: "الاثنين",  orders: 167 },
  { day: "الثلاثاء", orders: 223 },
  { day: "الأربعاء", orders: 189 },
  { day: "الخميس",   orders: 245 },
  { day: "الجمعة",   orders: 98  },
];

const revenueData = [
  { month: "أكتوبر",  revenue: 92000  },
  { month: "نوفمبر",  revenue: 78000  },
  { month: "ديسمبر",  revenue: 115000 },
  { month: "يناير",   revenue: 103000 },
  { month: "فبراير",  revenue: 128000 },
  { month: "مارس",    revenue: 142000 },
];

export function ChartsPanel() {
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
                  <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.25} />
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
