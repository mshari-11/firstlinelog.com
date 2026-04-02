import { motion } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Lightbulb,
  Users,
  Fuel,
  Zap,
  ArrowUp,
  ArrowDown,
  Clock,
  Target,
} from 'lucide-react';
import { PageWrapper, PageHeader, StatsCard, badge } from '@/components/admin/PreviewUI';

/* ─── Mock Data ─── */
const REVENUE_7D = [
  { day: 'السبت', value: 4200 },
  { day: 'الأحد', value: 3800 },
  { day: 'الاثنين', value: 5100 },
  { day: 'الثلاثاء', value: 4600 },
  { day: 'الأربعاء', value: 5400 },
  { day: 'الخميس', value: 6200 },
  { day: 'الجمعة', value: 5800 },
];

const PLATFORM_DATA = [
  { name: 'هنقرستيشن', orders: 420, pct: 48, color: '#f97316' },
  { name: 'جاهز', orders: 280, pct: 32, color: '#22c55e' },
  { name: 'مرسول', orders: 175, pct: 20, color: '#8b5cf6' },
];

const TOP_DRIVERS = [
  { name: 'خالد العتيبي', orders: 847, trend: '+12%' },
  { name: 'فهد القحطاني', orders: 723, trend: '+8%' },
  { name: 'عبدالله الشمري', orders: 695, trend: '+5%' },
  { name: 'سعود الدوسري', orders: 651, trend: '-2%' },
  { name: 'ناصر الغامدي', orders: 612, trend: '+3%' },
];

const COST_BREAKDOWN = [
  { name: 'رواتب', value: 45000, pct: 52, color: '#3b82f6' },
  { name: 'وقود', value: 18000, pct: 21, color: '#f59e0b' },
  { name: 'إنترنت', value: 4500, pct: 5, color: '#8b5cf6' },
  { name: 'صيانة', value: 8500, pct: 10, color: '#ef4444' },
  { name: 'أخرى', value: 10000, pct: 12, color: '#6b7280' },
];

const PEAK_HOURS = [
  [0.2, 0.1, 0.3, 0.5, 0.7, 0.9, 1.0],
  [0.3, 0.2, 0.4, 0.6, 0.8, 0.9, 0.8],
  [0.8, 0.7, 0.9, 1.0, 0.9, 0.6, 0.4],
  [0.5, 0.4, 0.6, 0.7, 0.5, 0.4, 0.3],
  [0.9, 0.8, 1.0, 0.9, 0.8, 0.7, 0.6],
  [0.4, 0.3, 0.5, 0.6, 0.5, 0.4, 0.3],
];
const HOUR_LABELS = ['10ص', '11ص', '12ظ', '1م', '2م', '3م', '4م', '5م', '8م', '9م', '10م', '11م'];
const DAY_LABELS = ['سبت', 'أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع'];

const PROFIT_WEEKS = [
  { week: 'الأسبوع 1', revenue: 32000, cost: 24000, margin: 25 },
  { week: 'الأسبوع 2', revenue: 35000, cost: 25500, margin: 27 },
  { week: 'الأسبوع 3', revenue: 38000, cost: 26000, margin: 32 },
  { week: 'الأسبوع 4', revenue: 41000, cost: 27000, margin: 34 },
];

const AI_RECOMMENDATIONS = [
  { text: 'زيادة عدد السائقين في فترة الذروة (12-2 ظهراً) يمكن أن يزيد الإيرادات 18%', impact: '+18% إيرادات', color: '#22c55e', icon: <Users size={18} /> },
  { text: 'تقليل وقت التوقف بين الطلبات يوفر 2,300 ريال شهرياً في الوقود', impact: '-2,300 ر.س/شهر', color: '#f59e0b', icon: <Fuel size={18} /> },
  { text: 'السائقين الجدد يحتاجون تدريب إضافي — معدل الإلغاء 3x أعلى', impact: '-15% إلغاء', color: '#ef4444', icon: <Target size={18} /> },
  { text: 'التركيز على طلبات هنقرستيشن في الفترة المسائية يعظّم العمولة', impact: '+22% عمولة', color: '#3b82f6', icon: <Zap size={18} /> },
];

/* ─── Widget style ─── */
const widgetStyle: React.CSSProperties = {
  background: 'var(--con-card)',
  border: '1px solid var(--con-border)',
  borderRadius: 'var(--con-radius)',
  padding: 22,
};

export default function AIAnalytics() {
  const maxRevenue = Math.max(...REVENUE_7D.map((d) => d.value));
  const maxDriverOrders = TOP_DRIVERS[0].orders;

  return (
    <PageWrapper>
      <PageHeader
        icon={<Brain size={24} />}
        title="لوحة تحليلات AI"
        subtitle="رؤى ذكية مبنية على تحليل البيانات"
      />

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <StatsCard icon={<DollarSign size={20} />} title="الإيرادات الشهرية" value="146,000 ر.س" trend="+12% عن الشهر الماضي" color="#22c55e" delay={0} />
        <StatsCard icon={<TrendingDown size={20} />} title="التكاليف" value="86,000 ر.س" trend="-8% تحسن" color="#f59e0b" delay={0.05} />
        <StatsCard icon={<TrendingUp size={20} />} title="صافي الربح" value="60,000 ر.س" trend="+18%" color="#3b82f6" delay={0.1} />
        <StatsCard icon={<BarChart3 size={20} />} title="نسبة الربحية" value="41%" color="#8b5cf6" delay={0.15} />
        <StatsCard icon={<Zap size={20} />} title="معدل النمو" value="12%" trend="+3% عن الربع السابق" color="#06b6d4" delay={0.2} />
      </div>

      {/* AI Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        style={{
          ...widgetStyle,
          background: 'linear-gradient(135deg, #3b82f610, #8b5cf610)',
          borderColor: '#3b82f630',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#3b82f620', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={20} style={{ color: '#3b82f6' }} />
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--con-text)' }}>ملخص AI التنفيذي</h3>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--con-text)', fontWeight: 500 }}>
          بناءً على تحليل بيانات آخر 30 يوم: إيراداتك زادت <span style={{ color: '#22c55e', fontWeight: 700 }}>12%</span> مقارنة بالشهر السابق.
          السائق <span style={{ fontWeight: 700 }}>خالد العتيبي</span> حقق أعلى أداء بـ <span style={{ color: '#3b82f6', fontWeight: 700 }}>847 طلب</span>.
          تكاليف الوقود انخفضت <span style={{ color: '#22c55e', fontWeight: 700 }}>8%</span> بفضل تحسين المسارات.
          نوصي بزيادة السائقين في أوقات الذروة لتحقيق نمو إضافي.
        </p>
      </motion.div>

      {/* Comparison: This Month vs Last Month */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        style={{ ...widgetStyle }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--con-text)', marginBottom: 18 }}>مقارنة: هذا الشهر مقابل الشهر الماضي</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {[
            { label: 'الطلبات', current: '875', prev: '780', up: true, pct: '+12%' },
            { label: 'الإيرادات', current: '146K', prev: '130K', up: true, pct: '+12%' },
            { label: 'التكاليف', current: '86K', prev: '93K', up: false, pct: '-8%' },
            { label: 'سائقون نشطون', current: '24', prev: '22', up: true, pct: '+9%' },
            { label: 'معدل الإلغاء', current: '3.2%', prev: '4.1%', up: false, pct: '-22%' },
            { label: 'متوسط التوصيل', current: '22 د', prev: '26 د', up: false, pct: '-15%' },
          ].map((item, i) => (
            <div key={i} style={{ background: 'var(--con-bg)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: 'var(--con-text-muted)', marginBottom: 6 }}>{item.label}</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--con-text)' }}>{item.current}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 4 }}>
                {(item.label === 'التكاليف' || item.label === 'معدل الإلغاء' || item.label === 'متوسط التوصيل') ? (
                  <ArrowDown size={12} style={{ color: '#22c55e' }} />
                ) : item.up ? (
                  <ArrowUp size={12} style={{ color: '#22c55e' }} />
                ) : (
                  <ArrowDown size={12} style={{ color: '#ef4444' }} />
                )}
                <span style={{ fontSize: 12, fontWeight: 600, color: (item.label === 'التكاليف' || item.label === 'معدل الإلغاء' || item.label === 'متوسط التوصيل') ? '#22c55e' : item.up ? '#22c55e' : '#ef4444' }}>
                  {item.pct}
                </span>
                <span style={{ fontSize: 10, color: 'var(--con-text-muted)' }}>({item.prev})</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Widgets Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        {/* 1. Revenue Trend */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={widgetStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--con-text)', marginBottom: 18 }}>
            <BarChart3 size={16} style={{ verticalAlign: 'middle', marginLeft: 6 }} />
            إيرادات آخر 7 أيام
          </h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
            {REVENUE_7D.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--con-text-muted)', fontWeight: 600 }}>{(d.value / 1000).toFixed(1)}K</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: (d.value / maxRevenue) * 100 }}
                  transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                  style={{
                    width: '100%',
                    borderRadius: '6px 6px 0 0',
                    background: `linear-gradient(180deg, #3b82f6, #8b5cf6)`,
                    minHeight: 4,
                  }}
                />
                <span style={{ fontSize: 10, color: 'var(--con-text-muted)' }}>{d.day}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 2. Orders by Platform */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={widgetStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--con-text)', marginBottom: 18 }}>طلبات حسب المنصة</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {PLATFORM_DATA.map((p, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: p.color }}>{p.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--con-text-muted)' }}>{p.orders} طلب ({p.pct}%)</span>
                </div>
                <div style={{ height: 10, borderRadius: 5, background: 'var(--con-bg)', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${p.pct}%` }}
                    transition={{ delay: 0.4 + i * 0.1, duration: 0.6 }}
                    style={{ height: '100%', borderRadius: 5, background: p.color }}
                  />
                </div>
              </div>
            ))}
            {/* Visual circles */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
              {PLATFORM_DATA.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  style={{
                    width: 40 + p.pct * 0.6,
                    height: 40 + p.pct * 0.6,
                    borderRadius: '50%',
                    background: `${p.color}25`,
                    border: `2px solid ${p.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    color: p.color,
                  }}
                >
                  {p.pct}%
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 3. Top 5 Drivers */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={widgetStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--con-text)', marginBottom: 18 }}>
            <Users size={16} style={{ verticalAlign: 'middle', marginLeft: 6 }} />
            أفضل 5 سائقين
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {TOP_DRIVERS.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: i < 3 ? '#f59e0b20' : 'var(--con-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: i < 3 ? '#f59e0b' : 'var(--con-text-muted)' }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--con-text)' }}>{d.name}</span>
                    <span style={{ fontSize: 12, color: d.trend.startsWith('+') ? '#22c55e' : '#ef4444' }}>{d.trend}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--con-bg)', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(d.orders / maxDriverOrders) * 100}%` }}
                      transition={{ delay: 0.45 + i * 0.08 }}
                      style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #3b82f6, #22c55e)' }}
                    />
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--con-text-muted)' }}>{d.orders} طلب</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 4. Cost Breakdown */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} style={widgetStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--con-text)', marginBottom: 18 }}>توزيع التكاليف</h3>
          {/* Stacked Bar */}
          <div style={{ height: 32, borderRadius: 8, overflow: 'hidden', display: 'flex', marginBottom: 16 }}>
            {COST_BREAKDOWN.map((c, i) => (
              <motion.div
                key={i}
                initial={{ width: 0 }}
                animate={{ width: `${c.pct}%` }}
                transition={{ delay: 0.5 + i * 0.08, duration: 0.5 }}
                style={{ height: '100%', background: c.color }}
                title={`${c.name}: ${c.pct}%`}
              />
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {COST_BREAKDOWN.map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: c.color }} />
                  <span style={{ fontSize: 12, color: 'var(--con-text)' }}>{c.name}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--con-text-muted)' }}>{c.value.toLocaleString()} ر.س ({c.pct}%)</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 5. Peak Hours Heatmap */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={widgetStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--con-text)', marginBottom: 18 }}>
            <Clock size={16} style={{ verticalAlign: 'middle', marginLeft: 6 }} />
            خريطة ساعات الذروة
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Header */}
            <div style={{ display: 'flex', gap: 4, paddingRight: 40 }}>
              {DAY_LABELS.map((d) => (
                <div key={d} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'var(--con-text-muted)' }}>{d}</div>
              ))}
            </div>
            {PEAK_HOURS.map((row, ri) => (
              <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 36, fontSize: 10, color: 'var(--con-text-muted)', textAlign: 'left' }}>{HOUR_LABELS[ri * 2]}</span>
                {row.map((val, ci) => (
                  <motion.div
                    key={ci}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.55 + (ri * 7 + ci) * 0.01 }}
                    style={{
                      flex: 1,
                      height: 24,
                      borderRadius: 4,
                      background: `rgba(59, 130, 246, ${val * 0.8 + 0.1})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9,
                      color: val > 0.6 ? '#fff' : 'var(--con-text-muted)',
                      fontWeight: 600,
                    }}
                  >
                    {Math.round(val * 100)}%
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        </motion.div>

        {/* 6. Profit Margin Trend */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} style={widgetStyle}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--con-text)', marginBottom: 18 }}>اتجاه هامش الربح — آخر 4 أسابيع</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {PROFIT_WEEKS.map((w, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--con-text)' }}>{w.week}</span>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ fontSize: 11, color: '#22c55e' }}>ربح: {(w.revenue - w.cost).toLocaleString()}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6' }}>{w.margin}%</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 2, height: 18, borderRadius: 4, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${100 - w.margin}%` }}
                    transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                    style={{ height: '100%', background: '#ef444440', borderRadius: '4px 0 0 4px' }}
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${w.margin}%` }}
                    transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                    style={{ height: '100%', background: '#22c55e', borderRadius: '0 4px 4px 0' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* AI Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        style={widgetStyle}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Lightbulb size={20} style={{ color: '#f59e0b' }} />
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--con-text)' }}>توصيات AI</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {AI_RECOMMENDATIONS.map((rec, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.65 + i * 0.08 }}
              whileHover={{ scale: 1.02 }}
              style={{
                background: `${rec.color}08`,
                border: `1px solid ${rec.color}30`,
                borderRadius: 12,
                padding: 18,
                display: 'flex',
                gap: 14,
                alignItems: 'flex-start',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${rec.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: rec.color, flexShrink: 0 }}>
                {rec.icon}
              </div>
              <div>
                <p style={{ fontSize: 13, color: 'var(--con-text)', lineHeight: 1.7, marginBottom: 8 }}>{rec.text}</p>
                <span style={badge(rec.color)}>الأثر المتوقع: {rec.impact}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </PageWrapper>
  );
}
