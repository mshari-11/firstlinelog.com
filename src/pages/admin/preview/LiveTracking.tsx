import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Radio,
  Wifi,
  WifiOff,
  Package,
  Clock,
  MessageSquare,
  AlertTriangle,
  Navigation,
  Gauge,
  Filter,
  RefreshCw,
  ChevronLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper, PageHeader, btnPrimary, btnOutline, badge } from '@/components/admin/PreviewUI';

/* ─── Types ─── */
type DriverStatus = 'available' | 'onDelivery' | 'stopped' | 'offline';

interface TrackedDriver {
  id: string;
  name: string;
  status: DriverStatus;
  x: number;
  y: number;
  speed: number;
  heading: number;
  currentArea: string;
  currentOrder: string | null;
  ordersToday: number;
  lastUpdate: Date;
  vehiclePlate: string;
  phone: string;
  stoppedMinutes: number;
}

const STATUS_CONFIG: Record<DriverStatus, { label: string; color: string; dotColor: string }> = {
  available: { label: 'متوفر', color: 'var(--con-success)', dotColor: '#22c55e' },
  onDelivery: { label: 'في مهمة', color: 'var(--con-brand)', dotColor: '#3b82f6' },
  stopped: { label: 'متوقف', color: 'var(--con-danger)', dotColor: '#ef4444' },
  offline: { label: 'غير متصل', color: 'var(--con-text-muted)', dotColor: '#64748b' },
};

const AREAS = ['حي النسيم', 'حي الملقا', 'حي العليا', 'حي السليمانية', 'حي الروضة', 'حي الورود', 'حي الياسمين', 'حي المروج', 'حي الصحافة', 'حي الربيع'];
const DIRECTIONS = ['شمال', 'جنوب', 'شرق', 'غرب', 'شمال شرق', 'شمال غرب', 'جنوب شرق', 'جنوب غرب'];
const NAMES = [
  'محمد العتيبي', 'فهد القحطاني', 'عبدالله الشمري', 'سعود الدوسري', 'خالد المالكي',
  'ناصر الحربي', 'تركي الغامدي', 'يوسف الزهراني', 'أحمد البقمي', 'عمر السبيعي',
];

const STATUSES: DriverStatus[] = ['available', 'onDelivery', 'stopped', 'offline'];

function generateDrivers(): TrackedDriver[] {
  return NAMES.map((name, i) => {
    const status = STATUSES[i % 4];
    return {
      id: `DRV-${String(i + 1).padStart(3, '0')}`,
      name,
      status,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      speed: status === 'onDelivery' ? 30 + Math.floor(Math.random() * 60) : status === 'available' ? Math.floor(Math.random() * 20) : 0,
      heading: Math.floor(Math.random() * 360),
      currentArea: AREAS[i],
      currentOrder: status === 'onDelivery' ? `ORD-${String(5000 + i).padStart(5, '0')}` : null,
      ordersToday: 5 + Math.floor(Math.random() * 20),
      lastUpdate: new Date(Date.now() - Math.floor(Math.random() * (status === 'offline' ? 3600000 : 60000))),
      vehiclePlate: `ح ر س ${1000 + i * 111}`,
      phone: `05${Math.floor(10000000 + Math.random() * 90000000)}`,
      stoppedMinutes: status === 'stopped' ? 10 + Math.floor(Math.random() * 50) : 0,
    };
  });
}

/* ─── Map Grid ─── */
function CityMap({
  drivers,
  selectedId,
  onSelect,
}: {
  drivers: TrackedDriver[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const MAP_W = 700;
  const MAP_H = 500;

  // Streets (grid lines)
  const streets: { x1: number; y1: number; x2: number; y2: number; main?: boolean }[] = [];
  for (let i = 1; i <= 6; i++) {
    const y = (i / 7) * MAP_H;
    streets.push({ x1: 0, y1: y, x2: MAP_W, y2: y, main: i % 2 === 0 });
  }
  for (let i = 1; i <= 9; i++) {
    const x = (i / 10) * MAP_W;
    streets.push({ x1: x, y1: 0, x2: x, y2: MAP_H, main: i % 3 === 0 });
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: MAP_W,
        aspectRatio: `${MAP_W}/${MAP_H}`,
        background: '#0a1628',
        borderRadius: 'var(--con-radius)',
        border: '1px solid var(--con-border)',
        overflow: 'hidden',
        margin: '0 auto',
      }}
    >
      {/* Grid pattern background */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        preserveAspectRatio="none"
      >
        {/* Blocks */}
        <defs>
          <pattern id="smallGrid" width="35" height="35" patternUnits="userSpaceOnUse">
            <rect width="35" height="35" fill="none" stroke="#0f2236" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width={MAP_W} height={MAP_H} fill="url(#smallGrid)" />

        {/* Streets */}
        {streets.map((s, i) => (
          <line
            key={i}
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            stroke={s.main ? '#1a3a5260' : '#12283d40'}
            strokeWidth={s.main ? 3 : 1.5}
          />
        ))}

        {/* Area labels */}
        {AREAS.slice(0, 6).map((area, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          return (
            <text
              key={area}
              x={MAP_W * (0.17 + col * 0.33)}
              y={MAP_H * (0.25 + row * 0.5)}
              textAnchor="middle"
              fill="#1a3a5260"
              fontSize="12"
              fontFamily="inherit"
            >
              {area}
            </text>
          );
        })}
      </svg>

      {/* Driver dots */}
      {drivers
        .filter((d) => d.status !== 'offline')
        .map((d) => {
          const conf = STATUS_CONFIG[d.status];
          const isSelected = selectedId === d.id;
          const left = `${d.x}%`;
          const top = `${d.y}%`;

          return (
            <motion.div
              key={d.id}
              animate={{ left, top }}
              transition={{ duration: 2, ease: 'easeInOut' }}
              onClick={() => onSelect(d.id)}
              style={{
                position: 'absolute',
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer',
                zIndex: isSelected ? 20 : 10,
              }}
            >
              {/* Pulse ring */}
              {d.status !== 'stopped' && (
                <motion.div
                  animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    position: 'absolute',
                    inset: -4,
                    borderRadius: '50%',
                    border: `2px solid ${conf.dotColor}`,
                  }}
                />
              )}
              {/* Dot */}
              <div
                style={{
                  width: isSelected ? 18 : 12,
                  height: isSelected ? 18 : 12,
                  borderRadius: '50%',
                  background: conf.dotColor,
                  border: isSelected ? '3px solid #fff' : '2px solid rgba(255,255,255,0.3)',
                  boxShadow: `0 0 ${isSelected ? 16 : 8}px ${conf.dotColor}80`,
                  transition: 'width 0.2s, height 0.2s',
                }}
              />
              {/* Name tag */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    position: 'absolute',
                    top: -32,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--con-card)',
                    border: '1px solid var(--con-border)',
                    borderRadius: 6,
                    padding: '3px 8px',
                    fontSize: 11,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    color: 'var(--con-text)',
                  }}
                >
                  {d.name}
                </motion.div>
              )}
            </motion.div>
          );
        })}

      {/* Offline count badge */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          background: 'rgba(0,0,0,0.6)',
          borderRadius: 6,
          padding: '4px 10px',
          fontSize: 11,
          color: 'var(--con-text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <WifiOff size={12} />
        {drivers.filter((d) => d.status === 'offline').length} غير متصل
      </div>

      {/* Map controls */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          display: 'flex',
          gap: 6,
        }}
      >
        <div
          style={{
            background: 'rgba(0,0,0,0.6)',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 11,
            color: 'var(--con-text)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Radio size={12} style={{ color: 'var(--con-success)' }} />
          بث مباشر
        </div>
      </div>
    </div>
  );
}

/* ─── Component ─── */
export default function LiveTracking() {
  const [drivers, setDrivers] = useState<TrackedDriver[]>(generateDrivers);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<DriverStatus | ''>('');
  const [showAlerts, setShowAlerts] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulate movement every 3 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setDrivers((prev) =>
        prev.map((d) => {
          if (d.status === 'offline' || d.status === 'stopped') return d;
          const dx = (Math.random() - 0.5) * 3;
          const dy = (Math.random() - 0.5) * 3;
          return {
            ...d,
            x: Math.max(5, Math.min(95, d.x + dx)),
            y: Math.max(5, Math.min(95, d.y + dy)),
            speed: d.status === 'onDelivery' ? 30 + Math.floor(Math.random() * 60) : Math.floor(Math.random() * 20),
            heading: (d.heading + Math.floor(Math.random() * 30) - 15 + 360) % 360,
            lastUpdate: new Date(),
          };
        })
      );
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const selectedDriver = drivers.find((d) => d.id === selectedDriverId) || null;

  const filteredList = filterStatus ? drivers.filter((d) => d.status === filterStatus) : drivers;

  const statusCounts = {
    available: drivers.filter((d) => d.status === 'available').length,
    onDelivery: drivers.filter((d) => d.status === 'onDelivery').length,
    stopped: drivers.filter((d) => d.status === 'stopped').length,
    offline: drivers.filter((d) => d.status === 'offline').length,
  };

  const alerts = drivers.filter(
    (d) => (d.status === 'stopped' && d.stoppedMinutes > 20) || d.status === 'offline'
  );

  const formatTime = useCallback((date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `منذ ${diff} ثانية`;
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    return `منذ ${Math.floor(diff / 3600)} ساعة`;
  }, []);

  const getDirectionLabel = (heading: number): string => {
    const idx = Math.round(heading / 45) % 8;
    return DIRECTIONS[idx];
  };

  return (
    <PageWrapper>
      <PageHeader
        icon={<MapPin size={24} />}
        title="تتبع GPS مباشر"
        subtitle="تتبع مواقع السائقين في الوقت الفعلي"
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <RefreshCw size={14} style={{ color: 'var(--con-success)' }} />
            </motion.div>
            <span style={{ fontSize: 12, color: 'var(--con-success)' }}>تحديث تلقائي</span>
          </div>
        }
      />

      {/* Status Summary Bar */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {(Object.entries(STATUS_CONFIG) as Array<[DriverStatus, typeof STATUS_CONFIG[DriverStatus]]>).map(
          ([key, conf]) => (
            <button
              key={key}
              onClick={() => setFilterStatus(filterStatus === key ? '' : key)}
              style={{
                ...btnOutline,
                borderColor: filterStatus === key ? conf.color : 'var(--con-border)',
                background: filterStatus === key ? `${conf.dotColor}15` : 'transparent',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: conf.dotColor,
                  display: 'inline-block',
                }}
              />
              {conf.label}:{' '}
              <strong>{statusCounts[key]}</strong>
            </button>
          )
        )}
      </motion.div>

      {/* Main Layout: Map + Sidebar */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: 16,
          minHeight: 500,
        }}
      >
        {/* Map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <CityMap
            drivers={drivers}
            selectedId={selectedDriverId}
            onSelect={setSelectedDriverId}
          />

          {/* Selected Driver Details Panel */}
          <AnimatePresence>
            {selectedDriver && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                style={{
                  background: 'var(--con-card)',
                  border: '1px solid var(--con-border)',
                  borderRadius: 'var(--con-radius)',
                  padding: 18,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: STATUS_CONFIG[selectedDriver.status].dotColor,
                        flexShrink: 0,
                      }}
                    />
                    <h4 style={{ fontSize: 16, fontWeight: 700 }}>{selectedDriver.name}</h4>
                    <span style={badge(STATUS_CONFIG[selectedDriver.status].color)}>
                      {STATUS_CONFIG[selectedDriver.status].label}
                    </span>
                  </div>
                  <button
                    style={{ ...btnOutline, padding: '4px 8px' }}
                    onClick={() => setSelectedDriverId(null)}
                  >
                    <ChevronLeft size={14} />
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                  <div style={{ background: 'var(--con-bg)', borderRadius: 8, padding: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--con-text-muted)', fontSize: 11, marginBottom: 4 }}>
                      <Gauge size={12} /> السرعة
                    </div>
                    <p style={{ fontSize: 18, fontWeight: 700 }}>{selectedDriver.speed} <span style={{ fontSize: 12, color: 'var(--con-text-muted)' }}>كم/س</span></p>
                  </div>
                  <div style={{ background: 'var(--con-bg)', borderRadius: 8, padding: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--con-text-muted)', fontSize: 11, marginBottom: 4 }}>
                      <Navigation size={12} /> الاتجاه
                    </div>
                    <p style={{ fontSize: 16, fontWeight: 700 }}>{getDirectionLabel(selectedDriver.heading)}</p>
                  </div>
                  <div style={{ background: 'var(--con-bg)', borderRadius: 8, padding: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--con-text-muted)', fontSize: 11, marginBottom: 4 }}>
                      <MapPin size={12} /> المنطقة
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{selectedDriver.currentArea}</p>
                  </div>
                  <div style={{ background: 'var(--con-bg)', borderRadius: 8, padding: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--con-text-muted)', fontSize: 11, marginBottom: 4 }}>
                      <Package size={12} /> الطلبات اليوم
                    </div>
                    <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--con-brand)' }}>{selectedDriver.ordersToday}</p>
                  </div>
                  {selectedDriver.currentOrder && (
                    <div style={{ background: 'var(--con-bg)', borderRadius: 8, padding: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--con-text-muted)', fontSize: 11, marginBottom: 4 }}>
                        <Package size={12} /> الطلب الحالي
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>{selectedDriver.currentOrder}</p>
                    </div>
                  )}
                  <div style={{ background: 'var(--con-bg)', borderRadius: 8, padding: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--con-text-muted)', fontSize: 11, marginBottom: 4 }}>
                      <Clock size={12} /> آخر تحديث
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{formatTime(selectedDriver.lastUpdate)}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button
                    style={btnPrimary}
                    onClick={() => toast.success(`تم إرسال رسالة لـ ${selectedDriver.name}`)}
                  >
                    <MessageSquare size={14} /> إرسال رسالة
                  </button>
                  <button style={btnOutline}>
                    <Wifi size={14} /> {selectedDriver.phone}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Driver List Sidebar */}
        <div
          style={{
            background: 'var(--con-card)',
            border: '1px solid var(--con-border)',
            borderRadius: 'var(--con-radius)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--con-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h4 style={{ fontSize: 14, fontWeight: 700 }}>السائقون ({filteredList.length})</h4>
            <Filter size={14} style={{ color: 'var(--con-text-muted)' }} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredList.map((d) => {
              const conf = STATUS_CONFIG[d.status];
              const isSelected = selectedDriverId === d.id;
              return (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setSelectedDriverId(d.id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--con-border)',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(59,130,246,0.08)' : 'transparent',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: conf.dotColor,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{d.name}</span>
                    <span style={{ fontSize: 11, color: conf.color }}>{conf.label}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--con-text-muted)', paddingRight: 16 }}>
                    <span>{d.currentOrder || d.currentArea}</span>
                    <span>{formatTime(d.lastUpdate)}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Alerts Section */}
      {showAlerts && alerts.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            background: 'var(--con-card)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--con-radius)',
            padding: 18,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--con-danger)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={16} /> تنبيهات ({alerts.length})
            </h4>
            <button
              style={{ ...btnOutline, padding: '4px 10px', fontSize: 11 }}
              onClick={() => setShowAlerts(false)}
            >
              إخفاء
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.map((d) => (
              <div
                key={d.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(239,68,68,0.05)',
                  border: '1px solid rgba(239,68,68,0.15)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {d.status === 'stopped' ? (
                    <AlertTriangle size={14} style={{ color: 'var(--con-danger)', flexShrink: 0 }} />
                  ) : (
                    <WifiOff size={14} style={{ color: 'var(--con-text-muted)', flexShrink: 0 }} />
                  )}
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{d.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--con-text-muted)' }}>
                      {d.status === 'stopped'
                        ? `متوقف منذ ${d.stoppedMinutes} دقيقة في ${d.currentArea}`
                        : `غير متصل — آخر تحديث ${formatTime(d.lastUpdate)}`}
                    </p>
                  </div>
                </div>
                <button
                  style={{ ...btnOutline, padding: '4px 10px', fontSize: 11, flexShrink: 0 }}
                  onClick={() => toast.success(`تم إرسال رسالة لـ ${d.name}`)}
                >
                  <MessageSquare size={12} /> رسالة
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </PageWrapper>
  );
}
