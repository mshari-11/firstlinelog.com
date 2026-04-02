import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Banknote,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  Filter,
  Plus,
  Search,
  Wallet,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper, PageHeader, StatsCard, Modal, btnPrimary, btnOutline, badge } from '@/components/admin/PreviewUI';

/* ─── Types ─── */
interface CODDriver {
  id: number;
  name: string;
  codOrders: number;
  totalCollected: number;
  deposited: number;
  pending: number;
  lastDeposit: string;
  status: 'مسلّم' | 'معلق' | 'متأخر';
}

/* ─── Mock Data ─── */
const MOCK_DRIVERS: CODDriver[] = [
  { id: 1, name: 'محمد العتيبي', codOrders: 18, totalCollected: 2340, deposited: 2340, pending: 0, lastDeposit: '2026-04-01', status: 'مسلّم' },
  { id: 2, name: 'فهد القحطاني', codOrders: 14, totalCollected: 1870, deposited: 1200, pending: 670, lastDeposit: '2026-03-30', status: 'متأخر' },
  { id: 3, name: 'عبدالله الشمري', codOrders: 22, totalCollected: 3150, deposited: 2800, pending: 350, lastDeposit: '2026-04-01', status: 'معلق' },
  { id: 4, name: 'سعود الدوسري', codOrders: 11, totalCollected: 1480, deposited: 1480, pending: 0, lastDeposit: '2026-04-02', status: 'مسلّم' },
  { id: 5, name: 'خالد المالكي', codOrders: 16, totalCollected: 2100, deposited: 1400, pending: 700, lastDeposit: '2026-03-29', status: 'متأخر' },
  { id: 6, name: 'ياسر الحربي', codOrders: 20, totalCollected: 2650, deposited: 2650, pending: 0, lastDeposit: '2026-04-02', status: 'مسلّم' },
  { id: 7, name: 'عمر الزهراني', codOrders: 9, totalCollected: 1230, deposited: 600, pending: 630, lastDeposit: '2026-03-28', status: 'متأخر' },
  { id: 8, name: 'تركي السبيعي', codOrders: 13, totalCollected: 1740, deposited: 1740, pending: 0, lastDeposit: '2026-04-01', status: 'مسلّم' },
  { id: 9, name: 'نواف العنزي', codOrders: 17, totalCollected: 2280, deposited: 1900, pending: 380, lastDeposit: '2026-04-01', status: 'معلق' },
  { id: 10, name: 'بندر الغامدي', codOrders: 8, totalCollected: 1050, deposited: 500, pending: 550, lastDeposit: '2026-03-30', status: 'متأخر' },
  { id: 11, name: 'ماجد الشهري', codOrders: 15, totalCollected: 1980, deposited: 1980, pending: 0, lastDeposit: '2026-04-02', status: 'مسلّم' },
  { id: 12, name: 'راشد المطيري', codOrders: 19, totalCollected: 2510, deposited: 2100, pending: 410, lastDeposit: '2026-04-01', status: 'معلق' },
];

const STATUS_COLORS: Record<string, string> = {
  'مسلّم': '#22c55e',
  'معلق': '#f59e0b',
  'متأخر': '#ef4444',
};

const DEPOSIT_METHODS = ['بنكي', 'نقدي', 'محفظة'] as const;

/* ─── Styles ─── */
const cardStyle: React.CSSProperties = {
  background: 'var(--con-card)',
  border: '1px solid var(--con-border)',
  borderRadius: 'var(--con-radius)',
  padding: 22,
};

const thStyle: React.CSSProperties = {
  padding: '12px 14px',
  textAlign: 'right',
  fontSize: 12,
  color: 'var(--con-text-muted)',
  fontWeight: 600,
  borderBottom: '1px solid var(--con-border)',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 14px',
  fontSize: 13,
  color: 'var(--con-text)',
  borderBottom: '1px solid var(--con-border)',
  whiteSpace: 'nowrap',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid var(--con-border)',
  background: 'var(--con-bg)',
  color: 'var(--con-text)',
  fontSize: 13,
  direction: 'rtl',
};

export default function CashCollection() {
  const [drivers, setDrivers] = useState(MOCK_DRIVERS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('الكل');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<CODDriver | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState<string>('بنكي');
  const [refNumber, setRefNumber] = useState('');

  const filtered = useMemo(() => {
    return drivers.filter((d) => {
      const matchSearch = d.name.includes(search);
      const matchStatus = statusFilter === 'الكل' || d.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [drivers, search, statusFilter]);

  const totalCollected = drivers.reduce((s, d) => s + d.totalCollected, 0);
  const totalDeposited = drivers.reduce((s, d) => s + d.deposited, 0);
  const totalPending = drivers.reduce((s, d) => s + d.pending, 0);
  const deliveryRate = totalCollected > 0 ? Math.round((totalDeposited / totalCollected) * 100) : 0;

  const alerts = drivers.filter((d) => d.pending > 500 || d.status === 'متأخر');

  const todayCOD = 4820;
  const todayDeposited = 3150;
  const todayOutstanding = todayCOD - todayDeposited;

  const openDeposit = (driver: CODDriver) => {
    setSelectedDriver(driver);
    setDepositAmount(String(driver.pending));
    setDepositMethod('بنكي');
    setRefNumber('');
    setModalOpen(true);
  };

  const confirmDeposit = () => {
    if (!selectedDriver || !depositAmount || !refNumber) {
      toast.error('يرجى تعبئة جميع الحقول');
      return;
    }
    const amount = parseFloat(depositAmount);
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === selectedDriver.id
          ? {
              ...d,
              deposited: d.deposited + amount,
              pending: Math.max(0, d.pending - amount),
              lastDeposit: '2026-04-02',
              status: d.pending - amount <= 0 ? 'مسلّم' as const : 'معلق' as const,
            }
          : d
      )
    );
    toast.success(`تم تأكيد إيداع ${amount.toLocaleString()} ريال من ${selectedDriver.name}`);
    setModalOpen(false);
  };

  const exportCSV = () => {
    const header = 'السائق,طلبات COD,المحصّل,المودع,المعلّق,آخر إيداع,الحالة\n';
    const rows = drivers.map(
      (d) => `${d.name},${d.codOrders},${d.totalCollected},${d.deposited},${d.pending},${d.lastDeposit},${d.status}`
    );
    const blob = new Blob([header + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cash_collection.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('تم تصدير البيانات');
  };

  return (
    <PageWrapper>
      <PageHeader
        icon={<Banknote size={24} />}
        title="تحصيل النقد و COD"
        subtitle="متابعة النقد المحصّل من السائقين وتسوية المبالغ"
        actions={
          <>
            <button style={btnOutline} onClick={exportCSV}>
              <Download size={14} /> تصدير CSV
            </button>
          </>
        }
      />

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <StatsCard icon={<Banknote size={20} />} title="إجمالي النقد المحصّل" value={`${totalCollected.toLocaleString()} ر.س`} trend="+8% عن الأسبوع الماضي" color="#3b82f6" delay={0} />
        <StatsCard icon={<CheckCircle size={20} />} title="النقد المسلّم" value={`${totalDeposited.toLocaleString()} ر.س`} color="#22c55e" delay={0.05} />
        <StatsCard icon={<Clock size={20} />} title="النقد المعلّق" value={`${totalPending.toLocaleString()} ر.س`} trend={totalPending > 3000 ? 'يحتاج متابعة' : ''} color="#f59e0b" delay={0.1} />
        <StatsCard icon={<TrendingUp size={20} />} title="نسبة التسليم" value={`${deliveryRate}%`} trend={deliveryRate >= 85 ? '+جيد' : '-يحتاج تحسين'} color="#8b5cf6" delay={0.15} />
      </div>

      {/* Daily Summary */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ ...cardStyle, display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--con-text)' }}>ملخص اليوم</h3>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 11, color: 'var(--con-text-muted)' }}>إجمالي COD اليوم</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#3b82f6' }}>{todayCOD.toLocaleString()} ر.س</p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: 'var(--con-text-muted)' }}>تم الإيداع</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>{todayDeposited.toLocaleString()} ر.س</p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: 'var(--con-text-muted)' }}>المتبقي</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}>{todayOutstanding.toLocaleString()} ر.س</p>
          </div>
        </div>
      </motion.div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={{ ...cardStyle, borderColor: '#ef444440' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={18} style={{ color: '#ef4444' }} />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>تنبيهات — نقد معلّق يحتاج متابعة</h3>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {alerts.map((d) => (
              <motion.div key={d.id} whileHover={{ scale: 1.02 }} style={{ background: '#ef444412', border: '1px solid #ef444430', borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--con-text)' }}>{d.name}</span>
                <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>{d.pending.toLocaleString()} ر.س معلّق</span>
                <button style={{ ...btnPrimary, padding: '5px 12px', fontSize: 11 }} onClick={() => openDeposit(d)}>
                  تسجيل إيداع
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 320 }}>
          <Search size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--con-text-muted)' }} />
          <input
            placeholder="بحث بالاسم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingRight: 36 }}
          />
        </div>
        {['الكل', 'مسلّم', 'معلق', 'متأخر'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              ...btnOutline,
              background: statusFilter === s ? 'var(--con-brand)' : 'transparent',
              color: statusFilter === s ? '#fff' : 'var(--con-text-muted)',
              padding: '7px 14px',
              fontSize: 12,
            }}
          >
            <Filter size={12} /> {s}
          </button>
        ))}
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={{ ...cardStyle, padding: 0, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>السائق</th>
              <th style={thStyle}>طلبات COD</th>
              <th style={thStyle}>المحصّل (ر.س)</th>
              <th style={thStyle}>المودع (ر.س)</th>
              <th style={thStyle}>المعلّق (ر.س)</th>
              <th style={thStyle}>آخر إيداع</th>
              <th style={thStyle}>الحالة</th>
              <th style={thStyle}>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d, i) => (
              <motion.tr key={d.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.02 * i }} style={{ cursor: 'pointer' }} onDoubleClick={() => openDeposit(d)}>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{d.name}</td>
                <td style={tdStyle}>{d.codOrders}</td>
                <td style={tdStyle}>{d.totalCollected.toLocaleString()}</td>
                <td style={{ ...tdStyle, color: '#22c55e' }}>{d.deposited.toLocaleString()}</td>
                <td style={{ ...tdStyle, color: d.pending > 500 ? '#ef4444' : '#f59e0b', fontWeight: d.pending > 0 ? 600 : 400 }}>{d.pending.toLocaleString()}</td>
                <td style={{ ...tdStyle, fontSize: 12 }}>{d.lastDeposit}</td>
                <td style={tdStyle}>
                  <span style={badge(STATUS_COLORS[d.status])}>{d.status}</span>
                </td>
                <td style={tdStyle}>
                  {d.pending > 0 && (
                    <button style={{ ...btnPrimary, padding: '5px 12px', fontSize: 11 }} onClick={() => openDeposit(d)}>
                      <Plus size={12} /> إيداع
                    </button>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Deposit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="تأكيد إيداع نقدي">
        {selectedDriver && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ background: 'var(--con-bg)', borderRadius: 8, padding: 14 }}>
              <p style={{ fontSize: 13, color: 'var(--con-text-muted)', marginBottom: 4 }}>السائق</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--con-text)' }}>{selectedDriver.name}</p>
              <p style={{ fontSize: 12, color: '#f59e0b', marginTop: 4 }}>المبلغ المعلّق: {selectedDriver.pending.toLocaleString()} ر.س</p>
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--con-text-muted)', marginBottom: 6, display: 'block' }}>المبلغ (ر.س)</label>
              <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} style={inputStyle} />
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--con-text-muted)', marginBottom: 6, display: 'block' }}>طريقة الإيداع</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {DEPOSIT_METHODS.map((m) => {
                  const icons = { 'بنكي': <Building2 size={14} />, 'نقدي': <Banknote size={14} />, 'محفظة': <Wallet size={14} /> };
                  return (
                    <button
                      key={m}
                      onClick={() => setDepositMethod(m)}
                      style={{
                        ...btnOutline,
                        flex: 1,
                        justifyContent: 'center',
                        background: depositMethod === m ? 'var(--con-brand)' : 'transparent',
                        color: depositMethod === m ? '#fff' : 'var(--con-text-muted)',
                      }}
                    >
                      {icons[m]} {m}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--con-text-muted)', marginBottom: 6, display: 'block' }}>رقم المرجع</label>
              <input value={refNumber} onChange={(e) => setRefNumber(e.target.value)} placeholder="رقم الحوالة أو الإيصال" style={inputStyle} />
            </div>

            <button style={{ ...btnPrimary, justifyContent: 'center', padding: '12px 0', marginTop: 4 }} onClick={confirmDeposit}>
              <CheckCircle size={16} /> تأكيد الإيداع
            </button>
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
