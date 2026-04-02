import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Receipt,
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Printer,
  ChevronDown,
  Shield,
  AlertTriangle,
  Minus,
  Zap,
  Fuel,
  Wifi,
  Banknote,
  ToggleLeft,
  ToggleRight,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper, PageHeader, StatsCard, Modal, btnPrimary, btnOutline, badge } from '@/components/admin/PreviewUI';

/* ─── Types ─── */
interface DriverSettlementData {
  id: string;
  driverCode: string;
  name: string;
  vehicle: string;
  platform: string;
  totalOrders: number;
  orderRate: number;
  bonuses: number;
  fuelDeduction: number;
  internetDeduction: number;
  advances: number;
  penalties: number;
  absenceDays: number;
  absenceRate: number;
  status: 'مسدد' | 'معلق' | 'مرفوض';
  approvalStage: 'مالية' | 'عمليات' | 'اعتماد نهائي' | 'مكتمل';
}

const PLATFORMS = ['HungerStation', 'Jahez', 'Marsool'];

const MONTHS = [
  { value: '2026-03', label: 'مارس 2026' },
  { value: '2026-02', label: 'فبراير 2026' },
  { value: '2026-01', label: 'يناير 2026' },
  { value: '2025-12', label: 'ديسمبر 2025' },
];

const NAMES = [
  'محمد العتيبي', 'فهد القحطاني', 'عبدالله الشمري', 'سعود الدوسري', 'خالد المالكي',
  'ناصر الحربي', 'تركي الغامدي', 'يوسف الزهراني', 'أحمد البقمي', 'عمر السبيعي',
];

const VEHICLES = [
  'هيونداي أكسنت 2024', 'تويوتا كامري 2023', 'نيسان صني 2024', 'كيا سيراتو 2023',
  'هيونداي إلنترا 2024', 'تويوتا يارس 2023', 'نيسان سنترا 2024', 'كيا ريو 2023',
  'شيفروليه أفيو 2024', 'سوزوكي سياز 2023',
];

const STATUSES: Array<'مسدد' | 'معلق' | 'مرفوض'> = ['مسدد', 'معلق', 'مرفوض'];
const STAGES: Array<'مالية' | 'عمليات' | 'اعتماد نهائي' | 'مكتمل'> = ['مالية', 'عمليات', 'اعتماد نهائي', 'مكتمل'];

function generateDrivers(): DriverSettlementData[] {
  return NAMES.map((name, i) => {
    const totalOrders = 400 + Math.floor(Math.random() * 350);
    const statusIdx = i < 5 ? 0 : i < 8 ? 1 : 2;
    const stageIdx = statusIdx === 0 ? 3 : Math.floor(Math.random() * 3);
    return {
      id: `DRV-${String(i + 1).padStart(3, '0')}`,
      driverCode: `FLL-${String(1000 + i)}`,
      name,
      vehicle: VEHICLES[i],
      platform: PLATFORMS[i % 3],
      totalOrders,
      orderRate: 15 + Math.floor(Math.random() * 8),
      bonuses: Math.floor(Math.random() * 500),
      fuelDeduction: 600 + Math.floor(Math.random() * 400),
      internetDeduction: 150 + Math.floor(Math.random() * 100),
      advances: Math.random() > 0.6 ? Math.floor(Math.random() * 1000) : 0,
      penalties: Math.random() > 0.7 ? Math.floor(Math.random() * 300) : 0,
      absenceDays: Math.floor(Math.random() * 4),
      absenceRate: 50,
      status: STATUSES[statusIdx],
      approvalStage: STAGES[stageIdx],
    };
  });
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  'مسدد': { color: 'var(--con-success)', icon: <CheckCircle2 size={14} /> },
  'معلق': { color: 'var(--con-warning)', icon: <Clock size={14} /> },
  'مرفوض': { color: 'var(--con-danger)', icon: <XCircle size={14} /> },
};

/* ─── Auto Settlement Config (Powerfleet) ─── */
function AutoSettlementConfig() {
  const [frequency, setFrequency] = useState('شهري');
  const [outputFormat, setOutputFormat] = useState('تحويل بنكي');
  const [settlementDay, setSettlementDay] = useState('28');
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [deductions, setDeductions] = useState({
    fuel: true,
    internet: true,
    advances: true,
    penalties: true,
  });

  const toggleDeduction = (key: keyof typeof deductions) => {
    setDeductions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--con-card)',
    border: '1px solid var(--con-border)',
    borderRadius: 'var(--con-radius)',
    padding: 22,
  };

  const selectStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid var(--con-border)',
    background: 'var(--con-bg)',
    color: 'var(--con-text)',
    fontSize: 13,
    fontWeight: 600,
    minWidth: 140,
  };

  const inputSmStyle: React.CSSProperties = {
    ...selectStyle,
    width: 80,
    textAlign: 'center' as const,
    direction: 'ltr' as const,
  };

  const deductionItems = [
    { key: 'fuel' as const, label: 'الوقود', icon: <Fuel size={14} /> },
    { key: 'internet' as const, label: 'الإنترنت', icon: <Wifi size={14} /> },
    { key: 'advances' as const, label: 'السلف', icon: <Banknote size={14} /> },
    { key: 'penalties' as const, label: 'المخالفات', icon: <AlertTriangle size={14} /> },
  ];

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.18 }}
      style={cardStyle}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Zap size={20} style={{ color: '#8b5cf6' }} />
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--con-text)' }}>تسوية تلقائية (Auto Settlement)</h3>
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
          مستوحاة من Powerfleet
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        {/* Frequency */}
        <div>
          <label style={{ fontSize: 12, color: 'var(--con-text-muted)', display: 'block', marginBottom: 6 }}>دورة التسوية</label>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)} style={selectStyle}>
            <option value="يومي">يومي</option>
            <option value="أسبوعي">أسبوعي</option>
            <option value="نصف شهري">نصف شهري</option>
            <option value="شهري">شهري</option>
          </select>
        </div>

        {/* Output Format */}
        <div>
          <label style={{ fontSize: 12, color: 'var(--con-text-muted)', display: 'block', marginBottom: 6 }}>طريقة الصرف</label>
          <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} style={selectStyle}>
            <option value="تحويل بنكي">تحويل بنكي</option>
            <option value="STC Pay">STC Pay</option>
            <option value="نقدي">نقدي</option>
          </select>
        </div>

        {/* Settlement Day */}
        <div>
          <label style={{ fontSize: 12, color: 'var(--con-text-muted)', display: 'block', marginBottom: 6 }}>يوم التسوية</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={16} style={{ color: 'var(--con-text-muted)' }} />
            <input
              type="number"
              min={1}
              max={31}
              value={settlementDay}
              onChange={(e) => setSettlementDay(e.target.value)}
              style={inputSmStyle}
            />
            <span style={{ fontSize: 12, color: 'var(--con-text-muted)' }}>من كل شهر</span>
          </div>
        </div>
      </div>

      {/* Auto-deductions */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, color: 'var(--con-text-muted)', display: 'block', marginBottom: 10 }}>الخصومات التلقائية</label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {deductionItems.map((item) => (
            <motion.button
              key={item.key}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => toggleDeduction(item.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                border: `1px solid ${deductions[item.key] ? '#22c55e40' : 'var(--con-border)'}`,
                background: deductions[item.key] ? '#22c55e10' : 'var(--con-bg)',
                color: deductions[item.key] ? '#22c55e' : 'var(--con-text-muted)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {item.icon}
              {item.label}
              {deductions[item.key] ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Toggle + Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, background: 'var(--con-bg)', borderRadius: 10, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setAutoEnabled(!autoEnabled);
              toast.success(autoEnabled ? 'تم إيقاف التسوية التلقائية' : 'تم تفعيل التسوية التلقائية');
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 10,
              border: 'none',
              background: autoEnabled ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'var(--con-card)',
              color: autoEnabled ? '#fff' : 'var(--con-text-muted)',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: autoEnabled ? '0 4px 12px #22c55e40' : 'none',
              transition: 'all 0.3s',
            }}
          >
            {autoEnabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
            تشغيل التسوية التلقائية
          </motion.button>

          <span style={{
            fontSize: 12,
            color: autoEnabled ? '#22c55e' : 'var(--con-text-muted)',
            fontWeight: 600,
          }}>
            {autoEnabled ? 'مفعّلة' : 'متوقفة'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={14} style={{ color: 'var(--con-text-muted)' }} />
          <span style={{ fontSize: 12, color: 'var(--con-text-muted)' }}>
            التسوية التلقائية القادمة: <strong style={{ color: 'var(--con-text)' }}>{settlementDay} أبريل 2026</strong>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function DriverSettlement() {
  const [data] = useState<DriverSettlementData[]>(generateDrivers);
  const [selectedMonth, setSelectedMonth] = useState('2026-03');
  const [selectedDriver, setSelectedDriver] = useState<DriverSettlementData | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const calcEarnings = (d: DriverSettlementData) => d.totalOrders * d.orderRate + d.bonuses;
  const calcDeductions = (d: DriverSettlementData) =>
    d.fuelDeduction + d.internetDeduction + d.advances + d.penalties + d.absenceDays * d.absenceRate;
  const calcNet = (d: DriverSettlementData) => calcEarnings(d) - calcDeductions(d);

  const totals = useMemo(() => {
    const totalDue = data.reduce((s, d) => s + calcEarnings(d), 0);
    const totalDeductions = data.reduce((s, d) => s + calcDeductions(d), 0);
    const totalNet = data.reduce((s, d) => s + calcNet(d), 0);
    return { totalDue, totalDeductions, totalNet, count: data.length };
  }, [data]);

  const handleBulkApprove = () => {
    if (selectedRows.size === 0) {
      toast.error('يرجى اختيار سائقين أولا');
      return;
    }
    toast.success(`تمت الموافقة على ${selectedRows.size} تسوية`);
    setSelectedRows(new Set());
  };

  const handleExportPayroll = () => {
    const header = 'الكود,السائق,المنصة,عدد الطلبات,إجمالي المستحقات,إجمالي الخصومات,صافي المدفوعات,الحالة\n';
    const rows = data
      .map((d) =>
        `${d.driverCode},${d.name},${d.platform},${d.totalOrders},${calcEarnings(d)},${calcDeductions(d)},${calcNet(d)},${d.status}`
      )
      .join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('تم تصدير كشف الرواتب');
  };

  const handlePrint = () => {
    toast.success('جاري تجهيز الطباعة...');
  };

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map((d) => d.id)));
    }
  };

  const approvalSteps = ['مالية', 'عمليات', 'اعتماد نهائي', 'مكتمل'];

  return (
    <PageWrapper>
      <PageHeader
        icon={<Receipt size={24} />}
        title="تسوية شهرية لكل سائق"
        subtitle="كشف الرواتب والمستحقات والخصومات الشهرية"
        actions={
          <>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ minWidth: 140, padding: '8px 12px', borderRadius: 8 }}
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <button style={btnOutline} onClick={handleExportPayroll}>
              <Download size={15} /> تصدير الرواتب
            </button>
            <button style={btnPrimary} onClick={handleBulkApprove}>
              <CheckCircle2 size={15} /> اعتماد ({selectedRows.size})
            </button>
          </>
        }
      />

      {/* KPIs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <StatsCard
          icon={<DollarSign size={20} />}
          title="إجمالي المستحقات"
          value={`${totals.totalDue.toLocaleString()} ريال`}
          color="var(--con-brand)"
          delay={0}
        />
        <StatsCard
          icon={<Minus size={20} />}
          title="إجمالي الخصومات"
          value={`${totals.totalDeductions.toLocaleString()} ريال`}
          color="var(--con-danger)"
          delay={0.05}
        />
        <StatsCard
          icon={<CheckCircle2 size={20} />}
          title="صافي المدفوعات"
          value={`${totals.totalNet.toLocaleString()} ريال`}
          trend={`${data.filter((d) => d.status === 'مسدد').length} مسدد من ${data.length}`}
          color="var(--con-success)"
          delay={0.1}
        />
        <StatsCard
          icon={<Users size={20} />}
          title="عدد السائقين"
          value={totals.count}
          color="var(--con-warning)"
          delay={0.15}
        />
      </div>

      {/* Auto Settlement Config — Powerfleet */}
      <AutoSettlementConfig />

      {/* Table */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          background: 'var(--con-card)',
          border: '1px solid var(--con-border)',
          borderRadius: 'var(--con-radius)',
          overflow: 'auto',
          maxHeight: 500,
        }}
      >
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedRows.size === data.length}
                  onChange={toggleAll}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
              </th>
              <th>الكود</th>
              <th>السائق</th>
              <th>المنصة</th>
              <th>عدد الطلبات</th>
              <th>المستحقات</th>
              <th>الوقود</th>
              <th>الإنترنت</th>
              <th>السلف</th>
              <th>المخالفات</th>
              <th>صافي المبلغ</th>
              <th>الحالة</th>
              <th>تفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => {
              const earnings = calcEarnings(d);
              const deductions = calcDeductions(d);
              const net = earnings - deductions;
              const statusConf = STATUS_CONFIG[d.status];
              return (
                <motion.tr
                  key={d.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.02 * i }}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(d.id)}
                      onChange={() => toggleRow(d.id)}
                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--con-text-muted)' }}>
                    {d.driverCode}
                  </td>
                  <td style={{ fontWeight: 600 }}>{d.name}</td>
                  <td>
                    <span style={badge(
                      d.platform === 'HungerStation' ? '#ef4444' :
                      d.platform === 'Jahez' ? '#f59e0b' : '#22c55e'
                    )}>
                      {d.platform}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{d.totalOrders}</td>
                  <td style={{ color: 'var(--con-success)' }}>{earnings.toLocaleString()}</td>
                  <td style={{ color: 'var(--con-danger)', fontSize: 13 }}>-{d.fuelDeduction.toLocaleString()}</td>
                  <td style={{ color: 'var(--con-danger)', fontSize: 13 }}>-{d.internetDeduction.toLocaleString()}</td>
                  <td style={{ color: d.advances > 0 ? 'var(--con-danger)' : 'var(--con-text-muted)', fontSize: 13 }}>
                    {d.advances > 0 ? `-${d.advances.toLocaleString()}` : '—'}
                  </td>
                  <td style={{ color: d.penalties > 0 ? 'var(--con-danger)' : 'var(--con-text-muted)', fontSize: 13 }}>
                    {d.penalties > 0 ? `-${d.penalties.toLocaleString()}` : '—'}
                  </td>
                  <td style={{ fontWeight: 700, color: net >= 0 ? 'var(--con-success)' : 'var(--con-danger)' }}>
                    {net.toLocaleString()} ريال
                  </td>
                  <td>
                    <span
                      style={{
                        ...badge(statusConf.color),
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {statusConf.icon}
                      {d.status}
                    </span>
                  </td>
                  <td>
                    <button
                      style={{ ...btnOutline, padding: '4px 10px', fontSize: 12 }}
                      onClick={() => setSelectedDriver(d)}
                    >
                      <ChevronDown size={13} /> عرض
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      {/* Driver Payslip Modal */}
      <Modal
        isOpen={!!selectedDriver}
        onClose={() => setSelectedDriver(null)}
        title={selectedDriver ? `كشف راتب — ${selectedDriver.name}` : ''}
        width={680}
      >
        {selectedDriver && (() => {
          const d = selectedDriver;
          const earnings = calcEarnings(d);
          const orderEarnings = d.totalOrders * d.orderRate;
          const deductions = calcDeductions(d);
          const net = earnings - deductions;
          const absenceDeduction = d.absenceDays * d.absenceRate;
          const currentStageIdx = approvalSteps.indexOf(d.approvalStage);

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Driver Info Header */}
              <div
                style={{
                  background: 'var(--con-bg)',
                  borderRadius: 8,
                  padding: 16,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                }}
              >
                <div>
                  <p style={{ fontSize: 12, color: 'var(--con-text-muted)' }}>الاسم</p>
                  <p style={{ fontWeight: 700 }}>{d.name}</p>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--con-text-muted)' }}>الكود</p>
                  <p style={{ fontFamily: 'monospace' }}>{d.driverCode}</p>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--con-text-muted)' }}>المركبة</p>
                  <p>{d.vehicle}</p>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--con-text-muted)' }}>المنصة</p>
                  <p>{d.platform}</p>
                </div>
              </div>

              {/* Earnings Breakdown */}
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: 'var(--con-success)' }}>
                  المستحقات
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--con-text-muted)' }}>الطلبات ({d.totalOrders} × {d.orderRate} ر.س)</span>
                    <span style={{ fontWeight: 600 }}>{orderEarnings.toLocaleString()} ريال</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--con-text-muted)' }}>المكافآت</span>
                    <span style={{ fontWeight: 600 }}>{d.bonuses.toLocaleString()} ريال</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 14,
                      fontWeight: 700,
                      borderTop: '1px solid var(--con-border)',
                      paddingTop: 8,
                      color: 'var(--con-success)',
                    }}
                  >
                    <span>إجمالي المستحقات</span>
                    <span>{earnings.toLocaleString()} ريال</span>
                  </div>
                </div>
              </div>

              {/* Deductions Breakdown */}
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: 'var(--con-danger)' }}>
                  الخصومات
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'الوقود', value: d.fuelDeduction },
                    { label: 'الإنترنت', value: d.internetDeduction },
                    { label: 'السلف', value: d.advances },
                    { label: 'المخالفات', value: d.penalties },
                    { label: `الغياب (${d.absenceDays} يوم × ${d.absenceRate} ر.س)`, value: absenceDeduction },
                  ].map((item) => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--con-text-muted)' }}>{item.label}</span>
                      <span style={{ fontWeight: 600, color: item.value > 0 ? 'var(--con-danger)' : 'var(--con-text-muted)' }}>
                        {item.value > 0 ? `-${item.value.toLocaleString()}` : '—'} {item.value > 0 ? 'ريال' : ''}
                      </span>
                    </div>
                  ))}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 14,
                      fontWeight: 700,
                      borderTop: '1px solid var(--con-border)',
                      paddingTop: 8,
                      color: 'var(--con-danger)',
                    }}
                  >
                    <span>إجمالي الخصومات</span>
                    <span>-{deductions.toLocaleString()} ريال</span>
                  </div>
                </div>
              </div>

              {/* Net */}
              <div
                style={{
                  background: net >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${net >= 0 ? 'var(--con-success)' : 'var(--con-danger)'}`,
                  borderRadius: 8,
                  padding: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 700 }}>صافي المستحق</span>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: net >= 0 ? 'var(--con-success)' : 'var(--con-danger)',
                  }}
                >
                  {net.toLocaleString()} ريال
                </span>
              </div>

              {/* Approval Workflow */}
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
                  <Shield size={14} style={{ marginLeft: 6 }} />
                  مسار الاعتماد
                </h4>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {approvalSteps.map((step, idx) => {
                    const isComplete = idx <= currentStageIdx;
                    const isCurrent = idx === currentStageIdx;
                    return (
                      <div key={step} style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 4 }}>
                        <div
                          style={{
                            flex: 1,
                            textAlign: 'center',
                            padding: '8px 4px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            background: isComplete
                              ? isCurrent
                                ? 'var(--con-brand)'
                                : 'rgba(34,197,94,0.15)'
                              : 'var(--con-bg)',
                            color: isComplete
                              ? isCurrent
                                ? '#fff'
                                : 'var(--con-success)'
                              : 'var(--con-text-muted)',
                            border: `1px solid ${isComplete ? (isCurrent ? 'var(--con-brand)' : 'var(--con-success)') : 'var(--con-border)'}`,
                          }}
                        >
                          {isComplete && !isCurrent && <CheckCircle2 size={12} style={{ marginLeft: 4, verticalAlign: 'middle' }} />}
                          {step}
                        </div>
                        {idx < approvalSteps.length - 1 && (
                          <div
                            style={{
                              width: 20,
                              height: 2,
                              background: idx < currentStageIdx ? 'var(--con-success)' : 'var(--con-border)',
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, borderTop: '1px solid var(--con-border)', paddingTop: 16 }}>
                <button style={btnPrimary} onClick={handlePrint}>
                  <Printer size={14} /> طباعة كشف الراتب
                </button>
                {d.status === 'معلق' && (
                  <button
                    style={{ ...btnOutline, color: 'var(--con-success)', borderColor: 'var(--con-success)' }}
                    onClick={() => {
                      toast.success(`تمت الموافقة على تسوية ${d.name}`);
                      setSelectedDriver(null);
                    }}
                  >
                    <CheckCircle2 size={14} /> اعتماد
                  </button>
                )}
                {d.status === 'معلق' && (
                  <button
                    style={{ ...btnOutline, color: 'var(--con-danger)', borderColor: 'var(--con-danger)' }}
                    onClick={() => {
                      toast.error(`تم رفض تسوية ${d.name}`);
                      setSelectedDriver(null);
                    }}
                  >
                    <AlertTriangle size={14} /> رفض
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>
    </PageWrapper>
  );
}
