import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Search,
  Eye,
  ArrowLeft,
  TrendingUp,
  Zap,
  MapPin,
} from 'lucide-react';
import { PageWrapper, PageHeader, StatsCard, Modal, btnOutline, badge } from '@/components/admin/PreviewUI';

/* ─── Types ─── */
type OrderStatus = 'جديد' | 'مقبول' | 'قيد التوصيل' | 'مكتمل' | 'ملغي';
type Platform = 'هنقرستيشن' | 'جاهز' | 'مرسول';

interface Order {
  id: string;
  platform: Platform;
  driver: string;
  area: string;
  time: string;
  status: OrderStatus;
  duration: number; // minutes
  commission: number;
  timeline: { status: OrderStatus; time: string }[];
}

/* ─── Constants ─── */
const PLATFORM_COLORS: Record<Platform, string> = {
  'هنقرستيشن': '#f97316',
  'جاهز': '#22c55e',
  'مرسول': '#8b5cf6',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  'جديد': '#3b82f6',
  'مقبول': '#06b6d4',
  'قيد التوصيل': '#f59e0b',
  'مكتمل': '#22c55e',
  'ملغي': '#ef4444',
};

const STATUS_FLOW: OrderStatus[] = ['جديد', 'مقبول', 'قيد التوصيل', 'مكتمل'];

const DRIVERS = ['محمد العتيبي', 'فهد القحطاني', 'عبدالله الشمري', 'سعود الدوسري', 'خالد المالكي', 'ناصر الغامدي', 'عمر الحربي', 'يوسف الزهراني'];
const AREAS = ['العليا', 'الملز', 'النسيم', 'السليمانية', 'الروضة', 'المروج', 'الربوة', 'الورود', 'الملقا', 'حي الياسمين'];

/* ─── Mock Data ─── */
const generateOrders = (): Order[] => {
  const statuses: OrderStatus[] = ['جديد', 'مقبول', 'قيد التوصيل', 'مكتمل', 'مكتمل', 'مكتمل', 'مكتمل', 'مكتمل', 'مكتمل', 'مكتمل', 'مكتمل', 'ملغي', 'قيد التوصيل', 'قيد التوصيل', 'مقبول', 'جديد', 'مكتمل', 'مكتمل', 'قيد التوصيل', 'مكتمل'];
  const platforms: Platform[] = ['هنقرستيشن', 'جاهز', 'مرسول'];
  return Array.from({ length: 20 }, (_, i) => {
    const status = statuses[i];
    const hr = 10 + Math.floor(i / 3);
    const mn = (i * 7) % 60;
    const baseTime = `${hr}:${mn.toString().padStart(2, '0')}`;
    const timeline: { status: OrderStatus; time: string }[] = [
      { status: 'جديد', time: `${hr}:${mn.toString().padStart(2, '0')}` },
    ];
    if (status !== 'جديد') timeline.push({ status: 'مقبول', time: `${hr}:${(mn + 3).toString().padStart(2, '0')}` });
    if (status === 'قيد التوصيل' || status === 'مكتمل') timeline.push({ status: 'قيد التوصيل', time: `${hr}:${(mn + 8).toString().padStart(2, '0')}` });
    if (status === 'مكتمل') timeline.push({ status: 'مكتمل', time: `${hr}:${(mn + 25).toString().padStart(2, '0')}` });
    if (status === 'ملغي') timeline.push({ status: 'ملغي', time: `${hr}:${(mn + 5).toString().padStart(2, '0')}` });

    return {
      id: `ORD-${(1000 + i).toString()}`,
      platform: platforms[i % 3],
      driver: DRIVERS[i % DRIVERS.length],
      area: AREAS[i % AREAS.length],
      time: baseTime,
      status,
      duration: status === 'مكتمل' ? 15 + Math.floor(Math.random() * 20) : status === 'ملغي' ? 5 : 0,
      commission: status === 'مكتمل' ? 8 + Math.floor(Math.random() * 7) : 0,
      timeline,
    };
  });
};

/* ─── Styles ─── */
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

export default function OrderTracking() {
  const [orders] = useState(generateOrders);
  const [filterPlatform, setFilterPlatform] = useState<string>('الكل');
  const [filterStatus, setFilterStatus] = useState<string>('الكل');
  const [filterDriver, setFilterDriver] = useState<string>('الكل');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [revenueTicker, setRevenueTicker] = useState(0);

  // Live counter simulation
  useEffect(() => {
    const completed = orders.filter((o) => o.status === 'مكتمل').length;
    setCompletedCount(completed);
    const totalRevenue = orders.filter((o) => o.status === 'مكتمل').reduce((s, o) => s + o.commission, 0);
    setRevenueTicker(totalRevenue);

    const interval = setInterval(() => {
      setCompletedCount((c) => c + 1);
      setRevenueTicker((r) => r + 8 + Math.floor(Math.random() * 6));
    }, 8000);
    return () => clearInterval(interval);
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (filterPlatform !== 'الكل' && o.platform !== filterPlatform) return false;
      if (filterStatus !== 'الكل' && o.status !== filterStatus) return false;
      if (filterDriver !== 'الكل' && o.driver !== filterDriver) return false;
      if (search && !o.id.includes(search) && !o.driver.includes(search) && !o.area.includes(search)) return false;
      return true;
    });
  }, [orders, filterPlatform, filterStatus, filterDriver, search]);

  const pipeline = useMemo(() => {
    const counts: Record<OrderStatus, number> = { 'جديد': 0, 'مقبول': 0, 'قيد التوصيل': 0, 'مكتمل': 0, 'ملغي': 0 };
    orders.forEach((o) => counts[o.status]++);
    return counts;
  }, [orders]);

  const todayOrders = orders.length;
  const inDelivery = pipeline['قيد التوصيل'];
  const cancelled = pipeline['ملغي'];

  const inputStyle: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid var(--con-border)',
    background: 'var(--con-bg)',
    color: 'var(--con-text)',
    fontSize: 13,
    direction: 'rtl',
  };

  return (
    <PageWrapper>
      <PageHeader
        icon={<Package size={24} />}
        title="تتبع الطلبات"
        subtitle="متابعة دورة حياة الطلبات في الوقت الحقيقي"
      />

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <StatsCard icon={<Package size={20} />} title="طلبات اليوم" value={todayOrders} color="#3b82f6" delay={0} />
        <StatsCard icon={<Truck size={20} />} title="قيد التوصيل" value={inDelivery} color="#f59e0b" delay={0.05} />
        <StatsCard icon={<CheckCircle2 size={20} />} title="مكتملة" value={completedCount} trend="+3 كل ساعة" color="#22c55e" delay={0.1} />
        <StatsCard icon={<XCircle size={20} />} title="ملغاة" value={cancelled} color="#ef4444" delay={0.15} />
      </div>

      {/* Revenue Ticker + Pipeline */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Revenue Ticker */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'linear-gradient(135deg, #22c55e18, #3b82f618)',
            border: '1px solid var(--con-border)',
            borderRadius: 'var(--con-radius)',
            padding: 22,
            flex: '1 1 250px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#22c55e20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={24} style={{ color: '#22c55e' }} />
          </div>
          <div>
            <p style={{ fontSize: 12, color: 'var(--con-text-muted)' }}>إجمالي العمولات اليوم</p>
            <motion.p
              key={revenueTicker}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              style={{ fontSize: 28, fontWeight: 800, color: '#22c55e' }}
            >
              {revenueTicker.toLocaleString()} ر.س
            </motion.p>
          </div>
        </motion.div>

        {/* Live Counter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          style={{
            background: 'var(--con-card)',
            border: '1px solid var(--con-border)',
            borderRadius: 'var(--con-radius)',
            padding: 22,
            flex: '1 1 250px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#3b82f620', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={24} style={{ color: '#3b82f6' }} />
          </div>
          <div>
            <p style={{ fontSize: 12, color: 'var(--con-text-muted)' }}>طلبات مكتملة (مباشر)</p>
            <motion.p
              key={completedCount}
              initial={{ scale: 1.3, color: '#22c55e' }}
              animate={{ scale: 1, color: 'var(--con-text)' }}
              style={{ fontSize: 28, fontWeight: 800 }}
            >
              {completedCount}
            </motion.p>
          </div>
        </motion.div>
      </div>

      {/* Status Pipeline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        style={{
          background: 'var(--con-card)',
          border: '1px solid var(--con-border)',
          borderRadius: 'var(--con-radius)',
          padding: 22,
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--con-text)', marginBottom: 18 }}>مراحل الطلبات</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
          {[...STATUS_FLOW, 'ملغي' as OrderStatus].map((status, i) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 100 }}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                style={{
                  flex: 1,
                  background: `${STATUS_COLORS[status]}15`,
                  border: `2px solid ${STATUS_COLORS[status]}40`,
                  borderRadius: 12,
                  padding: '14px 10px',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: 24, fontWeight: 800, color: STATUS_COLORS[status] }}>{pipeline[status]}</p>
                <p style={{ fontSize: 11, color: 'var(--con-text-muted)', marginTop: 2 }}>{status}</p>
              </motion.div>
              {i < 4 && (
                <ArrowLeft size={18} style={{ color: 'var(--con-text-muted)', margin: '0 4px', flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}
      >
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
          <Search size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--con-text-muted)' }} />
          <input placeholder="بحث برقم الطلب أو السائق..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, width: '100%', paddingRight: 36 }} />
        </div>
        <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)} style={inputStyle}>
          <option value="الكل">كل المنصات</option>
          <option value="هنقرستيشن">هنقرستيشن</option>
          <option value="جاهز">جاهز</option>
          <option value="مرسول">مرسول</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={inputStyle}>
          <option value="الكل">كل الحالات</option>
          {Object.keys(STATUS_COLORS).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterDriver} onChange={(e) => setFilterDriver(e.target.value)} style={inputStyle}>
          <option value="الكل">كل السائقين</option>
          {DRIVERS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        style={{
          background: 'var(--con-card)',
          border: '1px solid var(--con-border)',
          borderRadius: 'var(--con-radius)',
          overflow: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>رقم الطلب</th>
              <th style={thStyle}>المنصة</th>
              <th style={thStyle}>السائق</th>
              <th style={thStyle}>المنطقة</th>
              <th style={thStyle}>الوقت</th>
              <th style={thStyle}>الحالة</th>
              <th style={thStyle}>المدة (دقيقة)</th>
              <th style={thStyle}>العمولة (ر.س)</th>
              <th style={thStyle}>تفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o, i) => (
              <motion.tr
                key={o.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                style={{ background: i % 2 === 0 ? 'transparent' : 'var(--con-bg)' }}
              >
                <td style={{ ...tdStyle, fontWeight: 700, fontFamily: 'monospace' }}>{o.id}</td>
                <td style={tdStyle}>
                  <span style={badge(PLATFORM_COLORS[o.platform])}>{o.platform}</span>
                </td>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{o.driver}</td>
                <td style={tdStyle}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} style={{ color: 'var(--con-text-muted)' }} />
                    {o.area}
                  </span>
                </td>
                <td style={{ ...tdStyle, fontSize: 12, fontFamily: 'monospace' }}>{o.time}</td>
                <td style={tdStyle}>
                  <span style={badge(STATUS_COLORS[o.status])}>{o.status}</span>
                </td>
                <td style={tdStyle}>{o.duration > 0 ? o.duration : '—'}</td>
                <td style={{ ...tdStyle, fontWeight: o.commission > 0 ? 600 : 400, color: o.commission > 0 ? '#22c55e' : 'var(--con-text-muted)' }}>
                  {o.commission > 0 ? o.commission : '—'}
                </td>
                <td style={tdStyle}>
                  <button style={{ ...btnOutline, padding: '4px 10px', fontSize: 11 }} onClick={() => setSelectedOrder(o)}>
                    <Eye size={12} /> عرض
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Order Detail Modal */}
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`تفاصيل الطلب ${selectedOrder?.id || ''}`}>
        {selectedOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'var(--con-bg)', borderRadius: 8, padding: 12 }}>
                <p style={{ fontSize: 11, color: 'var(--con-text-muted)' }}>المنصة</p>
                <span style={badge(PLATFORM_COLORS[selectedOrder.platform])}>{selectedOrder.platform}</span>
              </div>
              <div style={{ background: 'var(--con-bg)', borderRadius: 8, padding: 12 }}>
                <p style={{ fontSize: 11, color: 'var(--con-text-muted)' }}>السائق</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--con-text)' }}>{selectedOrder.driver}</p>
              </div>
              <div style={{ background: 'var(--con-bg)', borderRadius: 8, padding: 12 }}>
                <p style={{ fontSize: 11, color: 'var(--con-text-muted)' }}>المنطقة</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--con-text)' }}>{selectedOrder.area}</p>
              </div>
              <div style={{ background: 'var(--con-bg)', borderRadius: 8, padding: 12 }}>
                <p style={{ fontSize: 11, color: 'var(--con-text-muted)' }}>العمولة</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>
                  {selectedOrder.commission > 0 ? `${selectedOrder.commission} ر.س` : '—'}
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--con-text)', marginBottom: 14 }}>مراحل الطلب</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {selectedOrder.timeline.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: STATUS_COLORS[t.status], border: '3px solid var(--con-card)', zIndex: 1 }} />
                      {i < selectedOrder.timeline.length - 1 && (
                        <div style={{ width: 2, flex: 1, background: 'var(--con-border)', minHeight: 28 }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: 16 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: STATUS_COLORS[t.status] }}>{t.status}</p>
                      <p style={{ fontSize: 11, color: 'var(--con-text-muted)', fontFamily: 'monospace' }}>{t.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
