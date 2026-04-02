import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Save,
  Trash2,
  BarChart3,
  Percent,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper, PageHeader, StatsCard, Modal, btnPrimary, btnOutline, badge } from '@/components/admin/PreviewUI';

/* ─── Types ─── */
interface Scenario {
  id: string;
  name: string;
  orders: number;
  commission: number;
  salary: number;
  fuel: number;
  internet: number;
  maintenance: number;
  platform: string;
  savedAt: string;
}

interface PlatformConfig {
  name: string;
  commission: number;
  color: string;
}

const PLATFORMS: PlatformConfig[] = [
  { name: 'HungerStation', commission: 18, color: '#ef4444' },
  { name: 'Jahez', commission: 15, color: '#f59e0b' },
  { name: 'Marsool', commission: 20, color: '#22c55e' },
];

const ORDER_COUNTS = [10, 15, 20, 25, 30, 35, 40];

const PERIOD_LABELS: Record<string, { label: string; multiplier: number }> = {
  daily: { label: 'يومي', multiplier: 1 },
  monthly: { label: 'شهري', multiplier: 26 },
  yearly: { label: 'سنوي', multiplier: 312 },
};

const STORAGE_KEY = 'fll_profit_scenarios';

function loadScenarios(): Scenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveScenarios(scenarios: Scenario[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
}

/* ─── Component ─── */
export default function OrderProfitCalculator() {
  const [orders, setOrders] = useState(25);
  const [commission, setCommission] = useState(18);
  const [salary, setSalary] = useState(120);
  const [fuel, setFuel] = useState(40);
  const [internet, setInternet] = useState(10);
  const [maintenance, setMaintenance] = useState(15);
  const [period, setPeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [selectedPlatform, setSelectedPlatform] = useState('HungerStation');
  const [scenarios, setScenarios] = useState<Scenario[]>(loadScenarios);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [showScenariosModal, setShowScenariosModal] = useState(false);

  const mult = PERIOD_LABELS[period].multiplier;

  const calc = useCallback(
    (o: number, comm: number) => {
      const revenue = o * comm * mult;
      const costs = (salary + fuel + internet + maintenance) * mult;
      const net = revenue - costs;
      const perOrder = o > 0 ? net / (o * mult) : 0;
      const margin = revenue > 0 ? (net / revenue) * 100 : 0;
      return { revenue, costs, net, perOrder, margin };
    },
    [salary, fuel, internet, maintenance, mult]
  );

  const result = useMemo(() => calc(orders, commission), [calc, orders, commission]);

  const comparisonTable = useMemo(
    () =>
      ORDER_COUNTS.map((o) => {
        const r = calc(o, commission);
        return { orders: o, ...r };
      }),
    [calc, commission]
  );

  const platformComparison = useMemo(
    () =>
      PLATFORMS.map((p) => {
        const r = calc(orders, p.commission);
        return { ...p, ...r };
      }),
    [calc, orders]
  );

  const handleSaveScenario = () => {
    if (!scenarioName.trim()) {
      toast.error('يرجى إدخال اسم السيناريو');
      return;
    }
    const newScenario: Scenario = {
      id: Date.now().toString(),
      name: scenarioName,
      orders,
      commission,
      salary,
      fuel,
      internet,
      maintenance,
      platform: selectedPlatform,
      savedAt: new Date().toLocaleDateString('ar-SA'),
    };
    const updated = [newScenario, ...scenarios];
    setScenarios(updated);
    saveScenarios(updated);
    toast.success(`تم حفظ السيناريو "${scenarioName}"`);
    setShowSaveModal(false);
    setScenarioName('');
  };

  const handleDeleteScenario = (id: string) => {
    const updated = scenarios.filter((s) => s.id !== id);
    setScenarios(updated);
    saveScenarios(updated);
    toast.success('تم حذف السيناريو');
  };

  const handleLoadScenario = (s: Scenario) => {
    setOrders(s.orders);
    setCommission(s.commission);
    setSalary(s.salary);
    setFuel(s.fuel);
    setInternet(s.internet);
    setMaintenance(s.maintenance);
    setSelectedPlatform(s.platform);
    setShowScenariosModal(false);
    toast.success(`تم تحميل السيناريو "${s.name}"`);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    fontSize: 15,
    textAlign: 'center' as const,
    fontWeight: 700,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    color: 'var(--con-text-muted)',
    display: 'block',
    marginBottom: 6,
  };

  return (
    <PageWrapper>
      <PageHeader
        icon={<Calculator size={24} />}
        title="حاسبة ربح لكل طلب"
        subtitle="احسب صافي الربح والتكاليف لكل طلب توصيل"
        actions={
          <>
            <button style={btnOutline} onClick={() => setShowScenariosModal(true)}>
              <BarChart3 size={15} /> السيناريوهات المحفوظة ({scenarios.length})
            </button>
            <button style={btnPrimary} onClick={() => setShowSaveModal(true)}>
              <Save size={15} /> حفظ كسيناريو
            </button>
          </>
        }
      />

      {/* Period Toggle */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{ display: 'flex', gap: 8 }}
      >
        {(Object.keys(PERIOD_LABELS) as Array<'daily' | 'monthly' | 'yearly'>).map((key) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            style={{
              ...btnOutline,
              background: period === key ? 'var(--con-brand)' : 'transparent',
              color: period === key ? '#fff' : 'var(--con-text)',
              borderColor: period === key ? 'var(--con-brand)' : 'var(--con-border)',
            }}
          >
            {PERIOD_LABELS[key].label}
          </button>
        ))}
      </motion.div>

      {/* Calculator Inputs */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          background: 'var(--con-card)',
          border: '1px solid var(--con-border)',
          borderRadius: 'var(--con-radius)',
          padding: 22,
        }}
      >
        <div>
          <label style={labelStyle}>عدد الطلبات (يوميا)</label>
          <input
            type="number"
            value={orders}
            onChange={(e) => setOrders(Math.max(0, Number(e.target.value)))}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>عمولة لكل طلب (ريال)</label>
          <input
            type="number"
            value={commission}
            onChange={(e) => setCommission(Math.max(0, Number(e.target.value)))}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>راتب السائق اليومي (ريال)</label>
          <input
            type="number"
            value={salary}
            onChange={(e) => setSalary(Math.max(0, Number(e.target.value)))}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>تكلفة الوقود اليومية (ريال)</label>
          <input
            type="number"
            value={fuel}
            onChange={(e) => setFuel(Math.max(0, Number(e.target.value)))}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>تكلفة الإنترنت اليومية (ريال)</label>
          <input
            type="number"
            value={internet}
            onChange={(e) => setInternet(Math.max(0, Number(e.target.value)))}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>تكلفة صيانة المركبة (يومي)</label>
          <input
            type="number"
            value={maintenance}
            onChange={(e) => setMaintenance(Math.max(0, Number(e.target.value)))}
            style={inputStyle}
          />
        </div>
      </motion.div>

      {/* KPIs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <StatsCard
          icon={<DollarSign size={20} />}
          title={`إجمالي الإيرادات (${PERIOD_LABELS[period].label})`}
          value={`${result.revenue.toLocaleString()} ريال`}
          color="var(--con-brand)"
          delay={0.2}
        />
        <StatsCard
          icon={<TrendingDown size={20} />}
          title={`إجمالي التكاليف (${PERIOD_LABELS[period].label})`}
          value={`${result.costs.toLocaleString()} ريال`}
          color="var(--con-warning)"
          delay={0.25}
        />
        <StatsCard
          icon={result.net >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          title={`صافي الربح (${PERIOD_LABELS[period].label})`}
          value={`${result.net.toLocaleString()} ريال`}
          trend={result.net >= 0 ? 'مربح' : 'خسارة'}
          color={result.net >= 0 ? 'var(--con-success)' : 'var(--con-danger)'}
          delay={0.3}
        />
        <StatsCard
          icon={<Package size={20} />}
          title="ربح لكل طلب"
          value={`${result.perOrder.toFixed(2)} ريال`}
          color={result.perOrder >= 0 ? 'var(--con-success)' : 'var(--con-danger)'}
          delay={0.35}
        />
        <StatsCard
          icon={<Percent size={20} />}
          title="نسبة الربحية"
          value={`${result.margin.toFixed(1)}%`}
          trend={result.margin >= 20 ? 'ربحية ممتازة' : result.margin >= 0 ? 'ربحية منخفضة' : 'خسارة'}
          color={result.margin >= 20 ? 'var(--con-success)' : result.margin >= 0 ? 'var(--con-warning)' : 'var(--con-danger)'}
          delay={0.4}
        />
      </div>

      {/* Visual Profit Breakdown */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.42 }}
        style={{
          background: 'var(--con-card)',
          border: '1px solid var(--con-border)',
          borderRadius: 'var(--con-radius)',
          padding: 22,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>تفصيل الأرباح والتكاليف</h3>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {/* Revenue bar */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ fontSize: 13, color: 'var(--con-text-muted)', marginBottom: 8 }}>الإيرادات</p>
            <div style={{ background: 'var(--con-bg)', borderRadius: 8, height: 36, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  borderRadius: 8,
                  background: 'linear-gradient(90deg, var(--con-brand), #6366f1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {result.revenue.toLocaleString()} ريال
              </motion.div>
            </div>
          </div>
          {/* Cost breakdown */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ fontSize: 13, color: 'var(--con-text-muted)', marginBottom: 8 }}>التكاليف</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'الراتب', value: salary * mult, color: '#ef4444' },
                { label: 'الوقود', value: fuel * mult, color: '#f59e0b' },
                { label: 'الإنترنت', value: internet * mult, color: '#3b82f6' },
                { label: 'الصيانة', value: maintenance * mult, color: '#8b5cf6' },
              ].map((item) => {
                const pct = result.costs > 0 ? (item.value / result.costs) * 100 : 0;
                return (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 60, fontSize: 12, color: 'var(--con-text-muted)', flexShrink: 0 }}>
                      {item.label}
                    </span>
                    <div style={{ flex: 1, background: 'var(--con-bg)', borderRadius: 4, height: 20, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        style={{ height: '100%', borderRadius: 4, background: item.color }}
                      />
                    </div>
                    <span style={{ width: 70, fontSize: 12, fontWeight: 600, textAlign: 'left', flexShrink: 0 }}>
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Comparison Table */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45 }}
        style={{
          background: 'var(--con-card)',
          border: '1px solid var(--con-border)',
          borderRadius: 'var(--con-radius)',
          overflow: 'auto',
        }}
      >
        <div style={{ padding: '18px 22px 0' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>مقارنة حسب عدد الطلبات</h3>
          <p style={{ fontSize: 13, color: 'var(--con-text-muted)', marginTop: 4 }}>
            الأرقام بالريال السعودي — {PERIOD_LABELS[period].label}
          </p>
        </div>
        <table style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>عدد الطلبات</th>
              <th>الإيرادات</th>
              <th>التكاليف</th>
              <th>صافي الربح</th>
              <th>ربح/طلب</th>
              <th>نسبة الربحية</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {comparisonTable.map((row, i) => (
              <motion.tr
                key={row.orders}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.02 * i }}
                style={{
                  background: row.orders === orders ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                }}
              >
                <td style={{ fontWeight: 700 }}>
                  {row.orders}
                  {row.orders === orders && (
                    <span style={{ ...badge('var(--con-brand)'), marginRight: 8, fontSize: 10 }}>الحالي</span>
                  )}
                </td>
                <td>{row.revenue.toLocaleString()}</td>
                <td>{row.costs.toLocaleString()}</td>
                <td style={{ color: row.net >= 0 ? 'var(--con-success)' : 'var(--con-danger)', fontWeight: 700 }}>
                  {row.net.toLocaleString()}
                </td>
                <td>{row.perOrder.toFixed(2)}</td>
                <td>{row.margin.toFixed(1)}%</td>
                <td>
                  <span style={badge(row.net >= 0 ? 'var(--con-success)' : 'var(--con-danger)')}>
                    {row.net >= 0 ? 'مربح' : 'خسارة'}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Platform Comparison */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          background: 'var(--con-card)',
          border: '1px solid var(--con-border)',
          borderRadius: 'var(--con-radius)',
          padding: 22,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>مقارنة بين المنصات</h3>
        <p style={{ fontSize: 13, color: 'var(--con-text-muted)', marginBottom: 16 }}>
          بناء على {orders} طلب يوميا — {PERIOD_LABELS[period].label}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {platformComparison.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 * i }}
              onClick={() => {
                setSelectedPlatform(p.name);
                setCommission(p.commission);
              }}
              style={{
                background: selectedPlatform === p.name ? `${p.color}12` : 'var(--con-bg)',
                border: `2px solid ${selectedPlatform === p.name ? p.color : 'var(--con-border)'}`,
                borderRadius: 'var(--con-radius)',
                padding: 20,
                cursor: 'pointer',
                transition: 'border-color 0.2s, background 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h4 style={{ fontSize: 16, fontWeight: 700 }}>{p.name}</h4>
                <span style={{ ...badge(p.color), fontSize: 13 }}>{p.commission} ر.س/طلب</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--con-text-muted)' }}>الإيرادات</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--con-brand)' }}>
                    {p.revenue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--con-text-muted)' }}>صافي الربح</p>
                  <p
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: p.net >= 0 ? 'var(--con-success)' : 'var(--con-danger)',
                    }}
                  >
                    {p.net.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--con-text-muted)' }}>ربح/طلب</p>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>{p.perOrder.toFixed(2)}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--con-text-muted)' }}>الربحية</p>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: p.margin >= 20 ? 'var(--con-success)' : p.margin >= 0 ? 'var(--con-warning)' : 'var(--con-danger)',
                    }}
                  >
                    {p.margin.toFixed(1)}%
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Save Scenario Modal */}
      <Modal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} title="حفظ كسيناريو">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, color: 'var(--con-text-muted)', display: 'block', marginBottom: 6 }}>
              اسم السيناريو
            </label>
            <input
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="مثال: سيناريو 25 طلب هنقرستيشن"
              style={{ width: '100%' }}
            />
          </div>
          <div
            style={{
              background: 'var(--con-bg)',
              borderRadius: 8,
              padding: 14,
              fontSize: 13,
              color: 'var(--con-text-muted)',
            }}
          >
            <p>عدد الطلبات: <strong style={{ color: 'var(--con-text)' }}>{orders}</strong></p>
            <p>العمولة: <strong style={{ color: 'var(--con-text)' }}>{commission} ر.س</strong></p>
            <p>صافي الربح: <strong style={{ color: result.net >= 0 ? 'var(--con-success)' : 'var(--con-danger)' }}>{result.net.toLocaleString()} ر.س</strong></p>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-start', marginTop: 8 }}>
            <button style={btnPrimary} onClick={handleSaveScenario}>
              <Save size={14} /> حفظ
            </button>
            <button style={btnOutline} onClick={() => setShowSaveModal(false)}>
              إلغاء
            </button>
          </div>
        </div>
      </Modal>

      {/* Saved Scenarios Modal */}
      <Modal
        isOpen={showScenariosModal}
        onClose={() => setShowScenariosModal(false)}
        title="السيناريوهات المحفوظة"
        width={640}
      >
        {scenarios.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--con-text-muted)', padding: 40 }}>
            لا توجد سيناريوهات محفوظة بعد
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {scenarios.map((s) => {
              const r = (() => {
                const rev = s.orders * s.commission;
                const cost = s.salary + s.fuel + s.internet + s.maintenance;
                return { revenue: rev, costs: cost, net: rev - cost };
              })();
              return (
                <div
                  key={s.id}
                  style={{
                    background: 'var(--con-bg)',
                    border: '1px solid var(--con-border)',
                    borderRadius: 8,
                    padding: 14,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{s.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--con-text-muted)' }}>
                      {s.orders} طلب | {s.platform} | صافي: {r.net.toLocaleString()} ر.س | {s.savedAt}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      style={{ ...btnOutline, padding: '6px 12px', fontSize: 12 }}
                      onClick={() => handleLoadScenario(s)}
                    >
                      تحميل
                    </button>
                    <button
                      style={{ ...btnOutline, padding: '6px 8px', fontSize: 12, color: 'var(--con-danger)', borderColor: 'var(--con-danger)' }}
                      onClick={() => handleDeleteScenario(s.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
