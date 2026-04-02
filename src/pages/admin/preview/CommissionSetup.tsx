import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings2,
  Calculator,
  History,
  Edit3,
  Check,
  X,
  DollarSign,
  Fuel,
  Wifi,
  Clock,
  UserMinus,
  Play,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper, PageHeader, btnPrimary, btnOutline, badge } from '@/components/admin/PreviewUI';

/* ─── Types ─── */
interface PlatformRate {
  name: string;
  color: string;
  baseCommission: number;
  bonusPerKM: number;
  peakMultiplier: number;
  weekendRate: number;
}

interface DriverPayRules {
  baseDailySalary: number;
  perOrderBonus: number;
  fuelAllowance: number;
  internetAllowance: number;
  overtimeRate: number;
  absencePenalty: number;
}

interface ChangeLog {
  id: number;
  field: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
}

/* ─── Defaults ─── */
const DEFAULT_PLATFORMS: PlatformRate[] = [
  { name: 'هنقرستيشن', color: '#f97316', baseCommission: 8, bonusPerKM: 1.5, peakMultiplier: 1.5, weekendRate: 10 },
  { name: 'جاهز', color: '#22c55e', baseCommission: 7, bonusPerKM: 1.2, peakMultiplier: 1.3, weekendRate: 9 },
  { name: 'مرسول', color: '#8b5cf6', baseCommission: 9, bonusPerKM: 1.8, peakMultiplier: 1.4, weekendRate: 11 },
];

const DEFAULT_PAY: DriverPayRules = {
  baseDailySalary: 120,
  perOrderBonus: 3,
  fuelAllowance: 35,
  internetAllowance: 10,
  overtimeRate: 25,
  absencePenalty: 50,
};

const INITIAL_LOGS: ChangeLog[] = [
  { id: 1, field: 'عمولة هنقرستيشن الأساسية', oldValue: '7 ر.س', newValue: '8 ر.س', timestamp: '2026-04-01 14:30' },
  { id: 2, field: 'بدل الوقود اليومي', oldValue: '30 ر.س', newValue: '35 ر.س', timestamp: '2026-03-28 09:15' },
  { id: 3, field: 'مضاعف الذروة - مرسول', oldValue: '1.2x', newValue: '1.4x', timestamp: '2026-03-25 16:45' },
  { id: 4, field: 'خصم الغياب', oldValue: '40 ر.س', newValue: '50 ر.س', timestamp: '2026-03-20 11:00' },
  { id: 5, field: 'مكافأة الطلب - جاهز', oldValue: '6 ر.س', newValue: '7 ر.س', timestamp: '2026-03-15 13:20' },
];

/* ─── Styles ─── */
const cardStyle: React.CSSProperties = {
  background: 'var(--con-card)',
  border: '1px solid var(--con-border)',
  borderRadius: 'var(--con-radius)',
  padding: 22,
};

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid var(--con-border)',
  background: 'var(--con-bg)',
  color: 'var(--con-text)',
  fontSize: 14,
  fontWeight: 600,
  width: 90,
  textAlign: 'center' as const,
  direction: 'ltr' as const,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--con-text-muted)',
  marginBottom: 4,
  display: 'block',
};

const STORAGE_KEY = 'fll_commission_setup';

/* ─── Rate Charts (Powerfleet) ─── */
interface RateTier {
  tier: string;
  range: string;
  baseRate: number;
  bonusPercent: number;
  effectiveRate: number;
  color: string;
}

const DEFAULT_RATE_TIERS: RateTier[] = [
  { tier: 'المستوى 1', range: '1-15 طلب/يوم', baseRate: 8, bonusPercent: 0, effectiveRate: 8, color: '#94a3b8' },
  { tier: 'المستوى 2', range: '16-25 طلب/يوم', baseRate: 8, bonusPercent: 10, effectiveRate: 8.8, color: '#3b82f6' },
  { tier: 'المستوى 3', range: '26-35 طلب/يوم', baseRate: 8, bonusPercent: 20, effectiveRate: 9.6, color: '#22c55e' },
  { tier: 'المستوى 4', range: '36+ طلب/يوم', baseRate: 8, bonusPercent: 30, effectiveRate: 10.4, color: '#f59e0b' },
];

const WEEKEND_MULTIPLIER = 1.25;
const PEAK_HOURS = [
  { label: '12:00 - 14:00', multiplier: 1.5 },
  { label: '19:00 - 22:00', multiplier: 1.5 },
];

function RateChartsSection({ editingCell, editValue, setEditValue, startEdit, saveEdit, cancelEdit }: {
  editingCell: string | null;
  editValue: string;
  setEditValue: (v: string) => void;
  startEdit: (key: string, val: number) => void;
  saveEdit: (key: string) => void;
  cancelEdit: () => void;
}) {
  const [tiers, setTiers] = useState<RateTier[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_rate_tiers');
      return saved ? JSON.parse(saved) : DEFAULT_RATE_TIERS;
    } catch { return DEFAULT_RATE_TIERS; }
  });

  const [editingTierCell, setEditingTierCell] = useState<string | null>(null);
  const [tierEditValue, setTierEditValue] = useState('');

  const startTierEdit = (key: string, value: number) => {
    setEditingTierCell(key);
    setTierEditValue(String(value));
  };

  const saveTierEdit = (key: string) => {
    const val = parseFloat(tierEditValue);
    if (isNaN(val)) {
      toast.error('قيمة غير صالحة');
      setEditingTierCell(null);
      return;
    }
    const parts = key.split('.');
    const idx = parseInt(parts[1]);
    const field = parts[2];
    setTiers((prev) => {
      const updated = [...prev];
      if (field === 'baseRate') {
        updated[idx] = { ...updated[idx], baseRate: val, effectiveRate: Math.round(val * (1 + updated[idx].bonusPercent / 100) * 100) / 100 };
      } else if (field === 'bonusPercent') {
        updated[idx] = { ...updated[idx], bonusPercent: val, effectiveRate: Math.round(updated[idx].baseRate * (1 + val / 100) * 100) / 100 };
      }
      localStorage.setItem(STORAGE_KEY + '_rate_tiers', JSON.stringify(updated));
      return updated;
    });
    setEditingTierCell(null);
    toast.success('تم تحديث جدول الأسعار');
  };

  const cancelTierEdit = () => setEditingTierCell(null);

  const renderTierEditable = (key: string, value: number, suffix: string) => {
    if (editingTierCell === key) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            autoFocus
            value={tierEditValue}
            onChange={(e) => setTierEditValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') saveTierEdit(key); if (e.key === 'Escape') cancelTierEdit(); }}
            style={{ ...inputStyle, width: 70 }}
          />
          <button onClick={() => saveTierEdit(key)} style={{ background: '#22c55e20', color: '#22c55e', borderRadius: 6, padding: 4, display: 'flex', border: 'none', cursor: 'pointer' }}><Check size={14} /></button>
          <button onClick={cancelTierEdit} style={{ background: '#ef444420', color: '#ef4444', borderRadius: 6, padding: 4, display: 'flex', border: 'none', cursor: 'pointer' }}><X size={14} /></button>
        </div>
      );
    }
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        onClick={() => startTierEdit(key, value)}
        style={{
          background: 'var(--con-bg)',
          border: '1px solid var(--con-border)',
          borderRadius: 8,
          padding: '6px 14px',
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--con-text)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {value} {suffix}
        <Edit3 size={11} style={{ color: 'var(--con-text-muted)' }} />
      </motion.button>
    );
  };

  const rcThStyle: React.CSSProperties = {
    padding: '12px 14px',
    textAlign: 'right',
    fontSize: 12,
    color: 'var(--con-text-muted)',
    fontWeight: 600,
    borderBottom: '2px solid var(--con-border)',
  };

  const rcTdStyle: React.CSSProperties = {
    padding: '14px 14px',
    fontSize: 13,
    color: 'var(--con-text)',
    borderBottom: '1px solid var(--con-border)',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
      style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}
    >
      <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--con-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--con-text)' }}>جداول أسعار السائقين (Rate Charts)</h3>
          <p style={{ fontSize: 12, color: 'var(--con-text-muted)', marginTop: 4 }}>معدلات الدفع المتدرجة حسب عدد الطلبات — اضغط على أي قيمة لتعديلها</p>
        </div>
        <span style={{
          background: 'linear-gradient(135deg, #6366f120, #8b5cf620)',
          border: '1px solid #8b5cf640',
          borderRadius: 20,
          padding: '4px 12px',
          fontSize: 11,
          fontWeight: 600,
          color: '#8b5cf6',
        }}>
          Powerfleet
        </span>
      </div>

      {/* Tier Table */}
      <div style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={rcThStyle}>المستوى</th>
              <th style={rcThStyle}>نطاق الطلبات</th>
              <th style={rcThStyle}>السعر الأساسي/طلب</th>
              <th style={rcThStyle}>نسبة البونس</th>
              <th style={rcThStyle}>السعر الفعلي/طلب</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((t, i) => (
              <motion.tr
                key={t.tier}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.05 }}
              >
                <td style={rcTdStyle}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 700,
                    fontSize: 13,
                  }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: t.color, display: 'inline-block' }} />
                    {t.tier}
                  </span>
                </td>
                <td style={{ ...rcTdStyle, fontFamily: 'monospace', fontSize: 12, color: 'var(--con-text-muted)' }}>{t.range}</td>
                <td style={rcTdStyle}>{renderTierEditable(`tier.${i}.baseRate`, t.baseRate, 'ر.س')}</td>
                <td style={rcTdStyle}>{renderTierEditable(`tier.${i}.bonusPercent`, t.bonusPercent, '%')}</td>
                <td style={rcTdStyle}>
                  <span style={{ fontWeight: 700, color: t.color === '#94a3b8' ? 'var(--con-text)' : t.color, fontSize: 15 }}>
                    {t.effectiveRate} ر.س
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Multipliers */}
      <div style={{ padding: '16px 22px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          style={{
            flex: '1 1 200px',
            background: 'linear-gradient(135deg, #f59e0b08, #f59e0b15)',
            border: '1px solid #f59e0b30',
            borderRadius: 10,
            padding: 16,
          }}
        >
          <p style={{ fontSize: 12, color: 'var(--con-text-muted)', marginBottom: 6 }}>مضاعف نهاية الأسبوع</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>{WEEKEND_MULTIPLIER}x</p>
          <p style={{ fontSize: 11, color: 'var(--con-text-muted)', marginTop: 4 }}>الجمعة والسبت</p>
        </motion.div>

        {PEAK_HOURS.map((peak, i) => (
          <motion.div
            key={peak.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.85 + i * 0.05 }}
            style={{
              flex: '1 1 200px',
              background: 'linear-gradient(135deg, #ef444408, #ef444415)',
              border: '1px solid #ef444430',
              borderRadius: 10,
              padding: 16,
            }}
          >
            <p style={{ fontSize: 12, color: 'var(--con-text-muted)', marginBottom: 6 }}>ساعات الذروة</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#ef4444' }}>{peak.multiplier}x</p>
            <p style={{ fontSize: 11, color: 'var(--con-text-muted)', marginTop: 4, direction: 'ltr', textAlign: 'right' }}>{peak.label}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default function CommissionSetup() {
  const [platforms, setPlatforms] = useState<PlatformRate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_platforms');
      return saved ? JSON.parse(saved) : DEFAULT_PLATFORMS;
    } catch { return DEFAULT_PLATFORMS; }
  });

  const [payRules, setPayRules] = useState<DriverPayRules>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_pay');
      return saved ? JSON.parse(saved) : DEFAULT_PAY;
    } catch { return DEFAULT_PAY; }
  });

  const [logs, setLogs] = useState<ChangeLog[]>(INITIAL_LOGS);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [simOrders, setSimOrders] = useState('25');
  const [simPlatform, setSimPlatform] = useState('هنقرستيشن');
  const [simResult, setSimResult] = useState<{ revenue: number; cost: number; profit: number } | null>(null);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_platforms', JSON.stringify(platforms));
  }, [platforms]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_pay', JSON.stringify(payRules));
  }, [payRules]);

  const startEdit = (key: string, currentValue: number) => {
    setEditingCell(key);
    setEditValue(String(currentValue));
  };

  const saveEdit = (key: string) => {
    const val = parseFloat(editValue);
    if (isNaN(val)) {
      toast.error('قيمة غير صالحة');
      setEditingCell(null);
      return;
    }

    // Platform edit
    const parts = key.split('.');
    if (parts[0] === 'platform') {
      const idx = parseInt(parts[1]);
      const field = parts[2] as keyof PlatformRate;
      setPlatforms((prev) => {
        const updated = [...prev];
        const old = updated[idx][field];
        (updated[idx] as any)[field] = val;
        addLog(`${updated[idx].name} - ${fieldLabel(field)}`, String(old), String(val));
        return updated;
      });
    } else if (parts[0] === 'pay') {
      const field = parts[1] as keyof DriverPayRules;
      setPayRules((prev) => {
        const old = prev[field];
        addLog(payFieldLabel(field), String(old), String(val));
        return { ...prev, [field]: val };
      });
    }

    setEditingCell(null);
    toast.success('تم الحفظ تلقائياً');
  };

  const cancelEdit = () => setEditingCell(null);

  const addLog = (field: string, oldValue: string, newValue: string) => {
    const now = new Date();
    const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setLogs((prev) => [{ id: Date.now(), field, oldValue, newValue, timestamp: ts }, ...prev.slice(0, 4)]);
  };

  const fieldLabel = (f: string) => {
    const map: Record<string, string> = { baseCommission: 'العمولة الأساسية', bonusPerKM: 'بونس/كم', peakMultiplier: 'مضاعف الذروة', weekendRate: 'معدل نهاية الأسبوع' };
    return map[f] || f;
  };

  const payFieldLabel = (f: string) => {
    const map: Record<string, string> = { baseDailySalary: 'الراتب اليومي', perOrderBonus: 'مكافأة الطلب', fuelAllowance: 'بدل الوقود', internetAllowance: 'بدل الإنترنت', overtimeRate: 'معدل الوقت الإضافي', absencePenalty: 'خصم الغياب' };
    return map[f] || f;
  };

  const runSimulation = () => {
    const orderCount = parseInt(simOrders) || 0;
    const platform = platforms.find((p) => p.name === simPlatform);
    if (!platform || orderCount <= 0) {
      toast.error('يرجى إدخال بيانات صحيحة');
      return;
    }
    const avgKM = 5;
    const peakOrders = Math.round(orderCount * 0.3);
    const normalOrders = orderCount - peakOrders;

    const revenue = (normalOrders * platform.baseCommission) + (peakOrders * platform.baseCommission * platform.peakMultiplier) + (orderCount * avgKM * platform.bonusPerKM);
    const cost = payRules.baseDailySalary + (orderCount * payRules.perOrderBonus) + payRules.fuelAllowance + payRules.internetAllowance;
    const profit = revenue - cost;

    setSimResult({ revenue: Math.round(revenue), cost: Math.round(cost), profit: Math.round(profit) });
    toast.success('تم حساب المحاكاة');
  };

  const resetDefaults = () => {
    setPlatforms(DEFAULT_PLATFORMS);
    setPayRules(DEFAULT_PAY);
    toast.success('تم إعادة القيم الافتراضية');
  };

  const renderEditable = (key: string, value: number, suffix: string = 'ر.س') => {
    if (editingCell === key) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(key); if (e.key === 'Escape') cancelEdit(); }}
            style={{ ...inputStyle, width: 70 }}
          />
          <button onClick={() => saveEdit(key)} style={{ background: '#22c55e20', color: '#22c55e', borderRadius: 6, padding: 4, display: 'flex' }}><Check size={14} /></button>
          <button onClick={cancelEdit} style={{ background: '#ef444420', color: '#ef4444', borderRadius: 6, padding: 4, display: 'flex' }}><X size={14} /></button>
        </div>
      );
    }
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        onClick={() => startEdit(key, value)}
        style={{
          background: 'var(--con-bg)',
          border: '1px solid var(--con-border)',
          borderRadius: 8,
          padding: '6px 14px',
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--con-text)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {value} {suffix}
        <Edit3 size={11} style={{ color: 'var(--con-text-muted)' }} />
      </motion.button>
    );
  };

  const thStyle: React.CSSProperties = {
    padding: '12px 14px',
    textAlign: 'right',
    fontSize: 12,
    color: 'var(--con-text-muted)',
    fontWeight: 600,
    borderBottom: '2px solid var(--con-border)',
  };

  const tdStyle: React.CSSProperties = {
    padding: '14px 14px',
    fontSize: 13,
    color: 'var(--con-text)',
    borderBottom: '1px solid var(--con-border)',
  };

  return (
    <PageWrapper>
      <PageHeader
        icon={<Settings2 size={24} />}
        title="إعداد العمولات"
        subtitle="ضبط معدلات العمولات وقواعد الدفع للسائقين"
        actions={
          <button style={btnOutline} onClick={resetDefaults}>
            <RotateCcw size={14} /> إعادة الافتراضي
          </button>
        }
      />

      {/* Platform Commission Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ ...cardStyle, padding: 0, overflow: 'auto' }}
      >
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--con-border)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--con-text)' }}>عمولات المنصات</h3>
          <p style={{ fontSize: 12, color: 'var(--con-text-muted)', marginTop: 4 }}>اضغط على أي قيمة لتعديلها</p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>المنصة</th>
              <th style={thStyle}>العمولة الأساسية/طلب</th>
              <th style={thStyle}>بونس/كم إضافي</th>
              <th style={thStyle}>مضاعف الذروة</th>
              <th style={thStyle}>معدل نهاية الأسبوع</th>
            </tr>
          </thead>
          <tbody>
            {platforms.map((p, i) => (
              <motion.tr
                key={p.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
              >
                <td style={tdStyle}>
                  <span style={{ ...badge(p.color), fontSize: 13, fontWeight: 700 }}>{p.name}</span>
                </td>
                <td style={tdStyle}>{renderEditable(`platform.${i}.baseCommission`, p.baseCommission)}</td>
                <td style={tdStyle}>{renderEditable(`platform.${i}.bonusPerKM`, p.bonusPerKM)}</td>
                <td style={tdStyle}>{renderEditable(`platform.${i}.peakMultiplier`, p.peakMultiplier, 'x')}</td>
                <td style={tdStyle}>{renderEditable(`platform.${i}.weekendRate`, p.weekendRate)}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Driver Pay Rules */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        style={cardStyle}
      >
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--con-text)', marginBottom: 20 }}>قواعد دفع السائقين</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18 }}>
          {([
            { key: 'baseDailySalary', label: 'الراتب اليومي الأساسي', icon: <DollarSign size={16} />, color: '#3b82f6', suffix: 'ر.س' },
            { key: 'perOrderBonus', label: 'مكافأة لكل طلب', icon: <Calculator size={16} />, color: '#22c55e', suffix: 'ر.س' },
            { key: 'fuelAllowance', label: 'بدل الوقود اليومي', icon: <Fuel size={16} />, color: '#f59e0b', suffix: 'ر.س' },
            { key: 'internetAllowance', label: 'بدل الإنترنت اليومي', icon: <Wifi size={16} />, color: '#8b5cf6', suffix: 'ر.س' },
            { key: 'overtimeRate', label: 'معدل الوقت الإضافي/ساعة', icon: <Clock size={16} />, color: '#06b6d4', suffix: 'ر.س' },
            { key: 'absencePenalty', label: 'خصم الغياب', icon: <UserMinus size={16} />, color: '#ef4444', suffix: 'ر.س' },
          ] as const).map((item) => (
            <div key={item.key} style={{ background: 'var(--con-bg)', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ color: item.color }}>{item.icon}</div>
                <span style={{ fontSize: 12, color: 'var(--con-text-muted)' }}>{item.label}</span>
              </div>
              {renderEditable(`pay.${item.key}`, payRules[item.key], item.suffix)}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Simulation Panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        style={{ ...cardStyle, background: 'linear-gradient(135deg, #3b82f608, #22c55e08)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Calculator size={20} style={{ color: '#3b82f6' }} />
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--con-text)' }}>حساب تجريبي — محاكاة الإيرادات</h3>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>عدد الطلبات</label>
            <input
              type="number"
              value={simOrders}
              onChange={(e) => setSimOrders(e.target.value)}
              style={{ ...inputStyle, width: 120 }}
            />
          </div>
          <div>
            <label style={labelStyle}>المنصة</label>
            <select
              value={simPlatform}
              onChange={(e) => setSimPlatform(e.target.value)}
              style={{ ...inputStyle, width: 160, textAlign: 'right' as const }}
            >
              {platforms.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <button style={btnPrimary} onClick={runSimulation}>
            <Play size={14} /> حساب تجريبي
          </button>
        </div>

        {simResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}
          >
            <div style={{ flex: '1 1 150px', background: '#22c55e12', border: '1px solid #22c55e30', borderRadius: 10, padding: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: 'var(--con-text-muted)' }}>الإيرادات المتوقعة</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: '#22c55e' }}>{simResult.revenue.toLocaleString()} ر.س</p>
            </div>
            <div style={{ flex: '1 1 150px', background: '#ef444412', border: '1px solid #ef444430', borderRadius: 10, padding: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: 'var(--con-text-muted)' }}>التكاليف</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: '#ef4444' }}>{simResult.cost.toLocaleString()} ر.س</p>
            </div>
            <div style={{ flex: '1 1 150px', background: simResult.profit >= 0 ? '#3b82f612' : '#ef444412', border: `1px solid ${simResult.profit >= 0 ? '#3b82f630' : '#ef444430'}`, borderRadius: 10, padding: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: 'var(--con-text-muted)' }}>صافي الربح</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: simResult.profit >= 0 ? '#3b82f6' : '#ef4444' }}>{simResult.profit.toLocaleString()} ر.س</p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* History Log */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        style={cardStyle}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <History size={18} style={{ color: 'var(--con-text-muted)' }} />
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--con-text)' }}>سجل التعديلات الأخيرة</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {logs.slice(0, 5).map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.05 }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: 'var(--con-bg)',
                borderRadius: 8,
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Edit3 size={14} style={{ color: 'var(--con-text-muted)' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--con-text)' }}>{log.field}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: '#ef4444', textDecoration: 'line-through' }}>{log.oldValue}</span>
                <span style={{ fontSize: 12, color: 'var(--con-text-muted)' }}>→</span>
                <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>{log.newValue}</span>
                <span style={{ fontSize: 10, color: 'var(--con-text-muted)', fontFamily: 'monospace' }}>{log.timestamp}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Driver Rate Charts — Powerfleet */}
      <RateChartsSection editingCell={editingCell} editValue={editValue} setEditValue={setEditValue} startEdit={startEdit} saveEdit={(key: string) => { saveEdit(key); }} cancelEdit={cancelEdit} />
    </PageWrapper>
  );
}
