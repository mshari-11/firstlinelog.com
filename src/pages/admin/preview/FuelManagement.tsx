import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Fuel,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Plus,
  Download,
  Filter,
  Users,
  DollarSign,
  RefreshCw,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper, PageHeader, StatsCard, Modal, btnPrimary, btnOutline, badge } from '@/components/admin/PreviewUI';

/* ─── Mock Data ─── */
interface FuelEntry {
  id: number;
  driverName: string;
  driverId: string;
  vehiclePlate: string;
  allocated: number;
  consumed: number;
  fuelType: string;
  month: string;
}

const DRIVERS = [
  'محمد العتيبي', 'فهد القحطاني', 'عبدالله الشمري', 'سعود الدوسري', 'خالد المالكي',
  'ناصر الحربي', 'تركي الغامدي', 'يوسف الزهراني', 'أحمد البقمي', 'عمر السبيعي',
  'ماجد العنزي', 'بندر الشهري', 'سلطان المطيري', 'راكان الرشيدي', 'مشعل الحارثي',
];

const PLATES = [
  'ح ر س 1234', 'ب ن ق 5678', 'ص ع د 9012', 'ك م ل 3456', 'ج ه ز 7890',
  'و ت ف 2345', 'م ش ر 6789', 'ل ي ن 0123', 'ق د س 4567', 'ع ز م 8901',
  'ف خ ر 2346', 'ن ص ر 5670', 'ط ي ب 9013', 'ح ل م 3457', 'غ ن م 7891',
];

const generateFuelData = (): FuelEntry[] =>
  DRIVERS.map((name, i) => {
    const allocated = 800 + Math.floor(Math.random() * 400);
    const variance = -100 + Math.floor(Math.random() * 300);
    return {
      id: i + 1,
      driverName: name,
      driverId: `DRV-${String(i + 1).padStart(3, '0')}`,
      vehiclePlate: PLATES[i],
      allocated,
      consumed: allocated + variance,
      fuelType: Math.random() > 0.3 ? 'بنزين' : 'ديزل',
      month: '2026-03',
    };
  });

const MONTHS = [
  { value: '2026-03', label: 'مارس 2026' },
  { value: '2026-02', label: 'فبراير 2026' },
  { value: '2026-01', label: 'يناير 2026' },
  { value: '2025-12', label: 'ديسمبر 2025' },
];

/* ─── Fuel Cost Matrix (Powerfleet) ─── */
interface FuelMatrixCell {
  vehicleType: string;
  benzine91: number;
  benzine95: number;
  diesel: number;
  dailyLimit: number;
  monthlyLimit: number;
}

const DEFAULT_FUEL_MATRIX: FuelMatrixCell[] = [
  { vehicleType: 'سيارة صغيرة', benzine91: 80, benzine95: 90, diesel: 0, dailyLimit: 35, monthlyLimit: 900 },
  { vehicleType: 'سيارة كبيرة', benzine91: 120, benzine95: 135, diesel: 0, dailyLimit: 50, monthlyLimit: 1300 },
  { vehicleType: 'دباب', benzine91: 30, benzine95: 35, diesel: 0, dailyLimit: 15, monthlyLimit: 400 },
  { vehicleType: 'شاحنة صغيرة', benzine91: 0, benzine95: 0, diesel: 95, dailyLimit: 60, monthlyLimit: 1600 },
];

const FUEL_PRICES = {
  benzine91: 2.18,
  benzine95: 2.33,
  diesel: 0.52,
};

function FuelCostMatrix() {
  const [matrix, setMatrix] = useState<FuelMatrixCell[]>(DEFAULT_FUEL_MATRIX);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [prices, setPrices] = useState(FUEL_PRICES);
  const [updatingPrices, setUpdatingPrices] = useState(false);

  const startEdit = (key: string, value: number) => {
    setEditingCell(key);
    setEditValue(String(value));
  };

  const saveEdit = (key: string) => {
    const val = parseFloat(editValue);
    if (isNaN(val) || val < 0) {
      toast.error('قيمة غير صالحة');
      setEditingCell(null);
      return;
    }
    const [_, rowStr, field] = key.split('.');
    const rowIdx = parseInt(rowStr);
    setMatrix((prev) => {
      const updated = [...prev];
      updated[rowIdx] = { ...updated[rowIdx], [field]: val };
      return updated;
    });
    setEditingCell(null);
    toast.success('تم تحديث المصفوفة');
  };

  const cancelEdit = () => setEditingCell(null);

  const renderEditableCell = (key: string, value: number, suffix: string, isOverLimit?: boolean) => {
    if (editingCell === key) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(key); if (e.key === 'Escape') cancelEdit(); }}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid var(--con-border)',
              background: 'var(--con-bg)',
              color: 'var(--con-text)',
              fontSize: 13,
              fontWeight: 600,
              width: 70,
              textAlign: 'center' as const,
              direction: 'ltr' as const,
            }}
          />
          <button onClick={() => saveEdit(key)} style={{ background: '#22c55e20', color: '#22c55e', borderRadius: 6, padding: 4, display: 'flex', border: 'none', cursor: 'pointer' }}><Check size={14} /></button>
          <button onClick={cancelEdit} style={{ background: '#ef444420', color: '#ef4444', borderRadius: 6, padding: 4, display: 'flex', border: 'none', cursor: 'pointer' }}><X size={14} /></button>
        </div>
      );
    }
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        onClick={() => startEdit(key, value)}
        style={{
          background: isOverLimit ? '#ef444415' : 'var(--con-bg)',
          border: `1px solid ${isOverLimit ? '#ef444440' : 'var(--con-border)'}`,
          borderRadius: 8,
          padding: '6px 12px',
          fontSize: 13,
          fontWeight: 700,
          color: isOverLimit ? '#ef4444' : value === 0 ? 'var(--con-text-muted)' : 'var(--con-text)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {value === 0 ? '—' : value} {value !== 0 ? suffix : ''}
        <Edit3 size={10} style={{ color: 'var(--con-text-muted)' }} />
      </motion.button>
    );
  };

  const handleUpdatePrices = () => {
    setUpdatingPrices(true);
    setTimeout(() => {
      const variation = () => Math.round((Math.random() * 0.1 - 0.05) * 100) / 100;
      setPrices({
        benzine91: Math.round((2.18 + variation()) * 100) / 100,
        benzine95: Math.round((2.33 + variation()) * 100) / 100,
        diesel: Math.round((0.52 + variation()) * 100) / 100,
      });
      setUpdatingPrices(false);
      toast.success('تم تحديث أسعار الوقود');
    }, 1200);
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
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4 }}
      style={{
        background: 'var(--con-card)',
        border: '1px solid var(--con-border)',
        borderRadius: 'var(--con-radius)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--con-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--con-text)' }}>مصفوفة تكلفة الوقود (Fuel Cost Matrix)</h3>
          <p style={{ fontSize: 12, color: 'var(--con-text-muted)', marginTop: 4 }}>تكلفة الوقود حسب نوع المركبة ونوع الوقود — اضغط على أي خلية لتعديلها</p>
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
          مصفوفة التكلفة — Powerfleet
        </span>
      </div>

      {/* Current Fuel Prices */}
      <div style={{ padding: '14px 22px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', background: 'var(--con-bg)', borderBottom: '1px solid var(--con-border)' }}>
        <Fuel size={16} style={{ color: 'var(--con-text-muted)' }} />
        <span style={{ fontSize: 12, color: 'var(--con-text-muted)', fontWeight: 600 }}>أسعار الوقود الحالية:</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', background: '#3b82f610', padding: '4px 10px', borderRadius: 6 }}>
          بنزين 91 = {prices.benzine91} SAR/L
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', background: '#22c55e10', padding: '4px 10px', borderRadius: 6 }}>
          بنزين 95 = {prices.benzine95} SAR/L
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', background: '#f59e0b10', padding: '4px 10px', borderRadius: 6 }}>
          ديزل = {prices.diesel} SAR/L
        </span>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleUpdatePrices}
          disabled={updatingPrices}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 8,
            border: '1px solid var(--con-border)',
            background: 'var(--con-card)',
            color: 'var(--con-text)',
            fontSize: 12,
            fontWeight: 600,
            cursor: updatingPrices ? 'wait' : 'pointer',
            opacity: updatingPrices ? 0.6 : 1,
          }}
        >
          <RefreshCw size={13} style={{ animation: updatingPrices ? 'spin 1s linear infinite' : 'none' }} />
          تحديث أسعار الوقود
        </motion.button>
      </div>

      {/* Matrix Table */}
      <div style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>نوع المركبة</th>
              <th style={thStyle}>بنزين 91 (ر.س/شهر)</th>
              <th style={thStyle}>بنزين 95 (ر.س/شهر)</th>
              <th style={thStyle}>ديزل (ر.س/شهر)</th>
              <th style={thStyle}>الحد اليومي (ر.س)</th>
              <th style={thStyle}>الحد الشهري (ر.س)</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => {
              const totalMonthly = row.benzine91 + row.benzine95 + row.diesel;
              const isOverMonthlyLimit = totalMonthly > row.monthlyLimit;
              return (
                <motion.tr
                  key={row.vehicleType}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.05 }}
                  style={{ background: isOverMonthlyLimit ? '#ef444408' : 'transparent' }}
                >
                  <td style={{ ...tdStyle, fontWeight: 700 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {row.vehicleType}
                      {isOverMonthlyLimit && <AlertTriangle size={14} style={{ color: '#ef4444' }} />}
                    </span>
                  </td>
                  <td style={tdStyle}>{renderEditableCell(`m.${i}.benzine91`, row.benzine91, 'ر.س')}</td>
                  <td style={tdStyle}>{renderEditableCell(`m.${i}.benzine95`, row.benzine95, 'ر.س')}</td>
                  <td style={tdStyle}>{renderEditableCell(`m.${i}.diesel`, row.diesel, 'ر.س')}</td>
                  <td style={tdStyle}>{renderEditableCell(`m.${i}.dailyLimit`, row.dailyLimit, 'ر.س', (row.dailyLimit > 0 && totalMonthly / 30 > row.dailyLimit))}</td>
                  <td style={tdStyle}>{renderEditableCell(`m.${i}.monthlyLimit`, row.monthlyLimit, 'ر.س', isOverMonthlyLimit)}</td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* CSS for spin animation */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}

export default function FuelManagement() {
  const [data] = useState<FuelEntry[]>(generateFuelData);
  const [filterDriver, setFilterDriver] = useState('');
  const [filterMonth, setFilterMonth] = useState('2026-03');
  const [filterStatus, setFilterStatus] = useState<'all' | 'over' | 'under'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ driver: '', amount: '', type: 'بنزين', date: '', receipt: '' });

  const filtered = useMemo(() => {
    let result = data.filter((d) => d.month === filterMonth);
    if (filterDriver) result = result.filter((d) => d.driverName.includes(filterDriver));
    if (filterStatus === 'over') result = result.filter((d) => d.consumed > d.allocated);
    if (filterStatus === 'under') result = result.filter((d) => d.consumed <= d.allocated);
    return result;
  }, [data, filterDriver, filterMonth, filterStatus]);

  const totals = useMemo(() => {
    const totalAllocated = filtered.reduce((s, d) => s + d.allocated, 0);
    const totalConsumed = filtered.reduce((s, d) => s + d.consumed, 0);
    const overCount = filtered.filter((d) => d.consumed > d.allocated).length;
    const avg = filtered.length ? Math.round(totalConsumed / filtered.length) : 0;
    return { totalAllocated, totalConsumed, savings: totalAllocated - totalConsumed, overCount, avg };
  }, [filtered]);

  const top10 = useMemo(
    () => [...filtered].sort((a, b) => b.consumed - a.consumed).slice(0, 10),
    [filtered]
  );
  const maxConsumption = top10.length ? top10[0].consumed : 1;

  const handleExportCSV = () => {
    const header = 'السائق,لوحة المركبة,المخصص,المستهلك,الفرق,الحالة\n';
    const rows = filtered
      .map((d) => {
        const diff = d.allocated - d.consumed;
        const status = d.consumed > d.allocated ? 'تجاوز' : 'ضمن الحد';
        return `${d.driverName},${d.vehiclePlate},${d.allocated},${d.consumed},${diff},${status}`;
      })
      .join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fuel_report_${filterMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('تم تصدير التقرير بنجاح');
  };

  const handleAddEntry = () => {
    if (!formData.driver || !formData.amount) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    toast.success(`تم إضافة قيد وقود بمبلغ ${formData.amount} ريال`);
    setShowAddModal(false);
    setFormData({ driver: '', amount: '', type: 'بنزين', date: '', receipt: '' });
  };

  return (
    <PageWrapper>
      <PageHeader
        icon={<Fuel size={24} />}
        title="إدارة الوقود"
        subtitle="متابعة تخصيص واستهلاك الوقود لكل سائق"
        actions={
          <>
            <button style={btnOutline} onClick={handleExportCSV}>
              <Download size={15} /> تصدير CSV
            </button>
            <button style={btnPrimary} onClick={() => setShowAddModal(true)}>
              <Plus size={15} /> إضافة قيد وقود
            </button>
          </>
        }
      />

      {/* KPIs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <StatsCard
          icon={<DollarSign size={20} />}
          title="إجمالي الوقود الشهري"
          value={`${totals.totalConsumed.toLocaleString()} ريال`}
          trend="+8% عن الشهر السابق"
          color="var(--con-brand)"
          delay={0}
        />
        <StatsCard
          icon={<Users size={20} />}
          title="متوسط لكل سائق"
          value={`${totals.avg.toLocaleString()} ريال`}
          color="var(--con-success)"
          delay={0.05}
        />
        <StatsCard
          icon={<TrendingUp size={20} />}
          title="أعلى استهلاك"
          value={`${top10.length ? top10[0].consumed.toLocaleString() : 0} ريال`}
          trend={top10.length ? top10[0].driverName : ''}
          color="var(--con-warning)"
          delay={0.1}
        />
        <StatsCard
          icon={<AlertTriangle size={20} />}
          title="تجاوزات"
          value={`${totals.overCount} سائق`}
          trend={totals.overCount > 3 ? 'يحتاج مراجعة عاجلة' : 'وضع طبيعي'}
          color="var(--con-danger)"
          delay={0.15}
        />
      </div>

      {/* Filters */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
          background: 'var(--con-card)',
          padding: '14px 18px',
          borderRadius: 'var(--con-radius)',
          border: '1px solid var(--con-border)',
        }}
      >
        <Filter size={16} style={{ color: 'var(--con-text-muted)' }} />
        <input
          placeholder="بحث بالسائق..."
          value={filterDriver}
          onChange={(e) => setFilterDriver(e.target.value)}
          style={{ flex: '1 1 160px', minWidth: 140 }}
        />
        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} style={{ minWidth: 140 }}>
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as 'all' | 'over' | 'under')} style={{ minWidth: 120 }}>
          <option value="all">جميع الحالات</option>
          <option value="over">تجاوز فقط</option>
          <option value="under">ضمن الحد</option>
        </select>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        style={{
          background: 'var(--con-card)',
          border: '1px solid var(--con-border)',
          borderRadius: 'var(--con-radius)',
          overflow: 'auto',
          maxHeight: 400,
        }}
      >
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>السائق</th>
              <th>لوحة المركبة</th>
              <th>نوع الوقود</th>
              <th>المخصص (ريال)</th>
              <th>المستهلك (ريال)</th>
              <th>الفرق</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d, i) => {
              const diff = d.allocated - d.consumed;
              const isOver = d.consumed > d.allocated;
              return (
                <motion.tr
                  key={d.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.02 * i }}
                >
                  <td style={{ color: 'var(--con-text-muted)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{d.driverName}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{d.vehiclePlate}</td>
                  <td>{d.fuelType}</td>
                  <td>{d.allocated.toLocaleString()}</td>
                  <td>{d.consumed.toLocaleString()}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: isOver ? 'var(--con-danger)' : 'var(--con-success)' }}>
                      {isOver ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                      {Math.abs(diff).toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span style={badge(isOver ? 'var(--con-danger)' : 'var(--con-success)')}>
                      {isOver ? 'تجاوز' : 'ضمن الحد'}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      {/* Chart: Top 10 */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          background: 'var(--con-card)',
          border: '1px solid var(--con-border)',
          borderRadius: 'var(--con-radius)',
          padding: 22,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>أعلى 10 سائقين استهلاكاً للوقود</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {top10.map((d, i) => {
            const pct = (d.consumed / maxConsumption) * 100;
            const isOver = d.consumed > d.allocated;
            return (
              <motion.div
                key={d.id}
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 0.05 * i, duration: 0.5 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <span style={{ width: 24, textAlign: 'center', color: 'var(--con-text-muted)', fontSize: 13, flexShrink: 0 }}>
                  {i + 1}
                </span>
                <span style={{ width: 120, fontSize: 13, flexShrink: 0 }}>{d.driverName}</span>
                <div style={{ flex: 1, background: 'var(--con-bg)', borderRadius: 6, height: 28, overflow: 'hidden', position: 'relative' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.05 * i + 0.2, duration: 0.6, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      borderRadius: 6,
                      background: isOver
                        ? 'linear-gradient(90deg, var(--con-danger), #ef444480)'
                        : 'linear-gradient(90deg, var(--con-brand), #3b82f680)',
                    }}
                  />
                </div>
                <span style={{ width: 80, fontSize: 13, textAlign: 'left', flexShrink: 0, fontWeight: 600 }}>
                  {d.consumed.toLocaleString()} ر.س
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          background: 'var(--con-card)',
          border: '1px solid var(--con-border)',
          borderRadius: 'var(--con-radius)',
          padding: 22,
        }}
      >
        <div>
          <p style={{ fontSize: 12, color: 'var(--con-text-muted)' }}>إجمالي المخصص</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--con-brand)' }}>
            {totals.totalAllocated.toLocaleString()} ريال
          </p>
        </div>
        <div>
          <p style={{ fontSize: 12, color: 'var(--con-text-muted)' }}>إجمالي المستهلك</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--con-warning)' }}>
            {totals.totalConsumed.toLocaleString()} ريال
          </p>
        </div>
        <div>
          <p style={{ fontSize: 12, color: 'var(--con-text-muted)' }}>
            {totals.savings >= 0 ? 'الوفر' : 'التجاوز'}
          </p>
          <p
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: totals.savings >= 0 ? 'var(--con-success)' : 'var(--con-danger)',
            }}
          >
            {Math.abs(totals.savings).toLocaleString()} ريال
          </p>
        </div>
      </motion.div>

      {/* Fuel Cost Matrix — Powerfleet */}
      <FuelCostMatrix />

      {/* Add Fuel Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="إضافة قيد وقود">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, color: 'var(--con-text-muted)', display: 'block', marginBottom: 6 }}>
              السائق
            </label>
            <select
              value={formData.driver}
              onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
              style={{ width: '100%' }}
            >
              <option value="">اختر السائق</option>
              {DRIVERS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, color: 'var(--con-text-muted)', display: 'block', marginBottom: 6 }}>
              المبلغ (ريال)
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0"
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, color: 'var(--con-text-muted)', display: 'block', marginBottom: 6 }}>
                نوع الوقود
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={{ width: '100%' }}
              >
                <option value="بنزين">بنزين</option>
                <option value="ديزل">ديزل</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, color: 'var(--con-text-muted)', display: 'block', marginBottom: 6 }}>
                التاريخ
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                style={{ width: '100%' }}
              />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, color: 'var(--con-text-muted)', display: 'block', marginBottom: 6 }}>
              رقم الإيصال
            </label>
            <input
              value={formData.receipt}
              onChange={(e) => setFormData({ ...formData, receipt: e.target.value })}
              placeholder="RCP-0000"
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-start', marginTop: 8 }}>
            <button style={btnPrimary} onClick={handleAddEntry}>
              حفظ القيد
            </button>
            <button style={btnOutline} onClick={() => setShowAddModal(false)}>
              إلغاء
            </button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
}
