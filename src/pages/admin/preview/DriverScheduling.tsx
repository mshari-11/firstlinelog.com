import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  Coffee,
  AlertTriangle,
  Save,
  Upload,
  Printer,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper, PageHeader, StatsCard, btnPrimary, btnOutline, badge } from '@/components/admin/PreviewUI';

/* ─── Types ─── */
type ShiftType = 'صباحي' | 'مسائي' | 'راحة' | 'إجازة' | 'غائب' | 'متاح';

interface DriverSchedule {
  id: number;
  name: string;
  driverId: string;
  shifts: ShiftType[];
}

/* ─── Constants ─── */
const ARABIC_DAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

const SHIFT_CYCLE: ShiftType[] = ['صباحي', 'مسائي', 'راحة', 'إجازة', 'غائب', 'متاح'];

const SHIFT_CONFIG: Record<ShiftType, { color: string; bg: string; icon: React.ReactNode }> = {
  'صباحي': { color: '#3b82f6', bg: '#3b82f618', icon: <Sun size={12} /> },
  'مسائي': { color: '#8b5cf6', bg: '#8b5cf618', icon: <Moon size={12} /> },
  'راحة': { color: '#6b7280', bg: '#6b728018', icon: <Coffee size={12} /> },
  'إجازة': { color: '#6b7280', bg: '#6b728010', icon: <CalendarDays size={12} /> },
  'غائب': { color: '#ef4444', bg: '#ef444418', icon: <AlertTriangle size={12} /> },
  'متاح': { color: '#22c55e', bg: '#22c55e18', icon: <Clock size={12} /> },
};

/* ─── Mock Data ─── */
const generateShifts = (): ShiftType[] => {
  const patterns: ShiftType[][] = [
    ['صباحي', 'صباحي', 'مسائي', 'مسائي', 'صباحي', 'مسائي', 'راحة'],
    ['مسائي', 'صباحي', 'صباحي', 'راحة', 'مسائي', 'مسائي', 'صباحي'],
    ['صباحي', 'مسائي', 'صباحي', 'صباحي', 'مسائي', 'راحة', 'إجازة'],
    ['مسائي', 'مسائي', 'صباحي', 'مسائي', 'صباحي', 'صباحي', 'صباحي'],
    ['صباحي', 'صباحي', 'صباحي', 'مسائي', 'راحة', 'صباحي', 'مسائي'],
    ['مسائي', 'صباحي', 'مسائي', 'صباحي', 'مسائي', 'إجازة', 'راحة'],
    ['صباحي', 'راحة', 'مسائي', 'صباحي', 'صباحي', 'مسائي', 'مسائي'],
    ['صباحي', 'مسائي', 'غائب', 'صباحي', 'مسائي', 'صباحي', 'راحة'],
    ['مسائي', 'مسائي', 'صباحي', 'صباحي', 'مسائي', 'مسائي', 'مسائي'],
    ['صباحي', 'صباحي', 'مسائي', 'راحة', 'صباحي', 'مسائي', 'إجازة'],
  ];
  return patterns[Math.floor(Math.random() * patterns.length)];
};

const INITIAL_DRIVERS: DriverSchedule[] = [
  { id: 1, name: 'محمد العتيبي', driverId: 'D-101' },
  { id: 2, name: 'فهد القحطاني', driverId: 'D-102' },
  { id: 3, name: 'عبدالله الشمري', driverId: 'D-103' },
  { id: 4, name: 'سعود الدوسري', driverId: 'D-104' },
  { id: 5, name: 'خالد المالكي', driverId: 'D-105' },
  { id: 6, name: 'ناصر الغامدي', driverId: 'D-106' },
  { id: 7, name: 'عمر الحربي', driverId: 'D-107' },
  { id: 8, name: 'يوسف الزهراني', driverId: 'D-108' },
  { id: 9, name: 'بندر السبيعي', driverId: 'D-109' },
  { id: 10, name: 'تركي العنزي', driverId: 'D-110' },
].map((d) => ({ ...d, shifts: generateShifts() }));

const TEMPLATES = [
  { name: 'نمط أسبوعي قياسي', id: 1 },
  { name: 'نمط رمضاني', id: 2 },
  { name: 'نمط صيفي', id: 3 },
];

/* ─── Component ─── */
export default function DriverScheduling() {
  const [drivers, setDrivers] = useState(INITIAL_DRIVERS);
  const [weekOffset, setWeekOffset] = useState(0);

  const weekLabel = useMemo(() => {
    const base = new Date(2026, 2, 28); // Sat March 28
    const start = new Date(base);
    start.setDate(start.getDate() + weekOffset * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const fmt = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
    return `${fmt(start)} — ${fmt(end)}`;
  }, [weekOffset]);

  const stats = useMemo(() => {
    let morning = 0, evening = 0, off = 0, total = 0;
    drivers.forEach((d) =>
      d.shifts.forEach((s) => {
        if (s === 'صباحي') morning++;
        else if (s === 'مسائي') evening++;
        else if (s === 'راحة' || s === 'إجازة') off++;
        total++;
      })
    );
    return { totalShifts: morning + evening, morning, evening, off };
  }, [drivers]);

  const overtimeDrivers = useMemo(() => {
    return drivers.filter((d) => {
      const workDays = d.shifts.filter((s) => s === 'صباحي' || s === 'مسائي').length;
      return workDays > 6;
    });
  }, [drivers]);

  const cycleShift = (driverId: number, dayIndex: number) => {
    setDrivers((prev) =>
      prev.map((d) => {
        if (d.id !== driverId) return d;
        const current = d.shifts[dayIndex];
        const currentIdx = SHIFT_CYCLE.indexOf(current);
        const nextIdx = (currentIdx + 1) % SHIFT_CYCLE.length;
        const newShifts = [...d.shifts];
        newShifts[dayIndex] = SHIFT_CYCLE[nextIdx];
        return { ...d, shifts: newShifts };
      })
    );
  };

  const saveTemplate = () => {
    toast.success('تم حفظ النمط بنجاح');
  };

  const loadTemplate = (name: string) => {
    setDrivers(INITIAL_DRIVERS.map((d) => ({ ...d, shifts: generateShifts() })));
    toast.success(`تم تحميل: ${name}`);
  };

  const printSchedule = () => {
    toast.success('جاري تحضير الطباعة...');
  };

  return (
    <PageWrapper>
      <PageHeader
        icon={<CalendarDays size={24} />}
        title="جدولة السائقين"
        subtitle="إدارة ورديات السائقين والجدول الأسبوعي"
        actions={
          <>
            <button style={btnOutline} onClick={printSchedule}>
              <Printer size={14} /> طباعة
            </button>
            <button style={btnPrimary} onClick={saveTemplate}>
              <Save size={14} /> حفظ النمط
            </button>
          </>
        }
      />

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <StatsCard icon={<CalendarDays size={20} />} title="إجمالي الورديات" value={stats.totalShifts} color="#3b82f6" delay={0} />
        <StatsCard icon={<Sun size={20} />} title="ورديات صباحية" value={stats.morning} color="#f59e0b" delay={0.05} />
        <StatsCard icon={<Moon size={20} />} title="ورديات مسائية" value={stats.evening} color="#8b5cf6" delay={0.1} />
        <StatsCard icon={<Coffee size={20} />} title="أيام الراحة" value={stats.off} color="#6b7280" delay={0.15} />
      </div>

      {/* Week Navigator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setWeekOffset((p) => p + 1)}
            style={{ ...btnOutline, padding: '8px 12px' }}
          >
            <ChevronRight size={16} /> التالي
          </button>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--con-text)', minWidth: 140, textAlign: 'center' }}>
            {weekLabel}
          </span>
          <button
            onClick={() => setWeekOffset((p) => p - 1)}
            style={{ ...btnOutline, padding: '8px 12px' }}
          >
            السابق <ChevronLeft size={16} />
          </button>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {Object.entries(SHIFT_CONFIG).map(([label, cfg]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: cfg.color }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: cfg.color }} />
              {label}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Calendar Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        style={{
          background: 'var(--con-card)',
          border: '1px solid var(--con-border)',
          borderRadius: 'var(--con-radius)',
          overflow: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr>
              <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'var(--con-text)', borderBottom: '2px solid var(--con-border)', background: 'var(--con-bg)', position: 'sticky', right: 0, zIndex: 2 }}>
                السائق
              </th>
              {ARABIC_DAYS.map((day) => (
                <th key={day} style={{ padding: '14px 8px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--con-text-muted)', borderBottom: '2px solid var(--con-border)', minWidth: 80 }}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver, di) => {
              const workDays = driver.shifts.filter((s) => s === 'صباحي' || s === 'مسائي').length;
              const isOvertime = workDays > 6;
              return (
                <motion.tr
                  key={driver.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: di * 0.03 }}
                  style={{ background: isOvertime ? '#ef444408' : di % 2 === 0 ? 'transparent' : 'var(--con-bg)' }}
                >
                  <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--con-border)', position: 'sticky', right: 0, background: isOvertime ? '#ef444412' : 'var(--con-card)', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--con-text)' }}>{driver.name}</p>
                        <p style={{ fontSize: 10, color: 'var(--con-text-muted)' }}>{driver.driverId}</p>
                      </div>
                      {isOvertime && (
                        <span style={badge('#ef4444')}>
                          <AlertTriangle size={10} /> وقت إضافي
                        </span>
                      )}
                    </div>
                  </td>
                  {driver.shifts.map((shift, si) => {
                    const cfg = SHIFT_CONFIG[shift];
                    return (
                      <td
                        key={si}
                        style={{ padding: 6, borderBottom: '1px solid var(--con-border)', textAlign: 'center' }}
                      >
                        <motion.button
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => cycleShift(driver.id, si)}
                          style={{
                            width: '100%',
                            padding: '8px 4px',
                            borderRadius: 8,
                            background: cfg.bg,
                            color: cfg.color,
                            border: `1px solid ${cfg.color}30`,
                            fontSize: 11,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {cfg.icon}
                          {shift}
                        </motion.button>
                      </td>
                    );
                  })}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      {/* Overtime Warning */}
      {overtimeDrivers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{
            background: '#f59e0b10',
            border: '1px solid #f59e0b40',
            borderRadius: 'var(--con-radius)',
            padding: 18,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>تنبيه: سائقون يعملون أكثر من 6 أيام</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {overtimeDrivers.map((d) => (
              <span key={d.id} style={badge('#f59e0b')}>
                {d.name} — {d.shifts.filter((s) => s === 'صباحي' || s === 'مسائي').length} أيام
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Templates */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          background: 'var(--con-card)',
          border: '1px solid var(--con-border)',
          borderRadius: 'var(--con-radius)',
          padding: 22,
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--con-text)', marginBottom: 16 }}>قوالب الجدولة</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {TEMPLATES.map((t) => (
            <motion.button
              key={t.id}
              whileHover={{ scale: 1.03 }}
              onClick={() => loadTemplate(t.name)}
              style={{
                ...btnOutline,
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Upload size={14} />
              {t.name}
            </motion.button>
          ))}
          <button style={btnPrimary} onClick={saveTemplate}>
            <Save size={14} /> حفظ الجدول الحالي كقالب
          </button>
        </div>
      </motion.div>
    </PageWrapper>
  );
}
