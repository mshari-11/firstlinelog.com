import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  TrendingUp,
  TrendingDown,
  Star,
  AlertTriangle,
  Gift,
  Filter,
  Users,
  Crown,
  Medal,
  Trophy,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper, PageHeader, StatsCard, Modal, btnPrimary, btnOutline, badge } from '@/components/admin/PreviewUI';

/* ─── Types ─── */
interface DriverPerf {
  id: string;
  name: string;
  platform: string;
  branch: string;
  totalOrders: number;
  onTimePercent: number;
  customerRating: number;
  attendancePercent: number;
  speedScore: number;
  reliabilityScore: number;
  trend: 'up' | 'down' | 'stable';
  monthlyScores: number[];
}

const PLATFORMS = ['HungerStation', 'Jahez', 'Marsool'];
const BRANCHES = ['الرياض', 'جدة', 'الدمام', 'مكة المكرمة'];

const NAMES = [
  'محمد العتيبي', 'فهد القحطاني', 'عبدالله الشمري', 'سعود الدوسري', 'خالد المالكي',
  'ناصر الحربي', 'تركي الغامدي', 'يوسف الزهراني', 'أحمد البقمي', 'عمر السبيعي',
  'ماجد العنزي', 'بندر الشهري', 'سلطان المطيري', 'راكان الرشيدي', 'مشعل الحارثي',
];

function generatePerformanceData(): DriverPerf[] {
  return NAMES.map((name, i) => {
    const onTime = 70 + Math.floor(Math.random() * 28);
    const rating = 3 + Math.random() * 2;
    const attendance = 75 + Math.floor(Math.random() * 24);
    const speed = 60 + Math.floor(Math.random() * 38);
    const reliability = 65 + Math.floor(Math.random() * 33);
    return {
      id: `DRV-${String(i + 1).padStart(3, '0')}`,
      name,
      platform: PLATFORMS[i % 3],
      branch: BRANCHES[i % 4],
      totalOrders: 300 + Math.floor(Math.random() * 500),
      onTimePercent: onTime,
      customerRating: parseFloat(rating.toFixed(1)),
      attendancePercent: attendance,
      speedScore: speed,
      reliabilityScore: reliability,
      trend: Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down',
      monthlyScores: Array.from({ length: 6 }, () => 50 + Math.floor(Math.random() * 45)),
    };
  });
}

function calcOverall(d: DriverPerf): number {
  return Math.round(
    d.onTimePercent * 0.25 +
    (d.customerRating / 5) * 100 * 0.25 +
    d.attendancePercent * 0.2 +
    d.speedScore * 0.15 +
    d.reliabilityScore * 0.15
  );
}

const RADAR_AXES = [
  { key: 'speedScore' as const, label: 'السرعة' },
  { key: 'reliabilityScore' as const, label: 'الموثوقية' },
  { key: 'totalOrders' as const, label: 'الطلبات' },
  { key: 'customerRating' as const, label: 'التقييم' },
  { key: 'attendancePercent' as const, label: 'الحضور' },
];

function normalizeAxis(d: DriverPerf, key: string): number {
  if (key === 'totalOrders') return Math.min(100, (d.totalOrders / 800) * 100);
  if (key === 'customerRating') return (d.customerRating / 5) * 100;
  return (d as unknown as Record<string, number>)[key] ?? 0;
}

/* ─── Radar Chart (CSS) ─── */
function RadarChart({ driver, teamAvg }: { driver: DriverPerf; teamAvg: DriverPerf }) {
  const size = 220;
  const center = size / 2;
  const maxR = size / 2 - 30;
  const n = RADAR_AXES.length;

  const getPoint = (value: number, idx: number) => {
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
    const r = (value / 100) * maxR;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const driverPoints = RADAR_AXES.map((a, i) => getPoint(normalizeAxis(driver, a.key), i));
  const avgPoints = RADAR_AXES.map((a, i) => getPoint(normalizeAxis(teamAvg, a.key), i));
  const labelPoints = RADAR_AXES.map((_, i) => getPoint(115, i));

  const driverPath = driverPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  const avgPath = avgPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <svg width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
      {/* Grid rings */}
      {[20, 40, 60, 80, 100].map((pct) => {
        const points = Array.from({ length: n }, (_, i) => getPoint(pct, i));
        const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
        return <path key={pct} d={path} fill="none" stroke="var(--con-border)" strokeWidth={0.5} opacity={0.5} />;
      })}
      {/* Axis lines */}
      {RADAR_AXES.map((_, i) => {
        const p = getPoint(100, i);
        return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="var(--con-border)" strokeWidth={0.5} opacity={0.3} />;
      })}
      {/* Team average */}
      <path d={avgPath} fill="rgba(148,163,184,0.1)" stroke="var(--con-text-muted)" strokeWidth={1.5} strokeDasharray="4 2" />
      {/* Driver */}
      <path d={driverPath} fill="rgba(59,130,246,0.15)" stroke="var(--con-brand)" strokeWidth={2} />
      {driverPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--con-brand)" />
      ))}
      {/* Labels */}
      {RADAR_AXES.map((a, i) => (
        <text
          key={a.key}
          x={labelPoints[i].x}
          y={labelPoints[i].y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--con-text-muted)"
          fontSize={11}
        >
          {a.label}
        </text>
      ))}
    </svg>
  );
}

/* ─── Stars ─── */
function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const partial = rating - full;
  return (
    <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={14}
          fill={i < full ? '#f59e0b' : i === full && partial > 0 ? `url(#star-grad)` : 'transparent'}
          stroke={i <= full ? '#f59e0b' : 'var(--con-border)'}
          strokeWidth={1.5}
        />
      ))}
      <span style={{ fontSize: 12, color: 'var(--con-text-muted)', marginRight: 4 }}>{rating.toFixed(1)}</span>
    </span>
  );
}

/* ─── Component ─── */
export default function DriverPerformance() {
  const [data] = useState<DriverPerf[]>(generatePerformanceData);
  const [filterPlatform, setFilterPlatform] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<DriverPerf | null>(null);

  const ranked = useMemo(() => {
    let result = [...data];
    if (filterPlatform) result = result.filter((d) => d.platform === filterPlatform);
    if (filterBranch) result = result.filter((d) => d.branch === filterBranch);
    return result.sort((a, b) => calcOverall(b) - calcOverall(a));
  }, [data, filterPlatform, filterBranch]);

  const teamAvg = useMemo<DriverPerf>(() => {
    const n = data.length || 1;
    return {
      id: 'avg',
      name: 'المتوسط',
      platform: '',
      branch: '',
      totalOrders: Math.round(data.reduce((s, d) => s + d.totalOrders, 0) / n),
      onTimePercent: Math.round(data.reduce((s, d) => s + d.onTimePercent, 0) / n),
      customerRating: parseFloat((data.reduce((s, d) => s + d.customerRating, 0) / n).toFixed(1)),
      attendancePercent: Math.round(data.reduce((s, d) => s + d.attendancePercent, 0) / n),
      speedScore: Math.round(data.reduce((s, d) => s + d.speedScore, 0) / n),
      reliabilityScore: Math.round(data.reduce((s, d) => s + d.reliabilityScore, 0) / n),
      trend: 'stable',
      monthlyScores: [],
    };
  }, [data]);

  const avgOverall = calcOverall(teamAvg);
  const bestDriver = ranked[0];
  const worstDriver = ranked[ranked.length - 1];
  const belowAvg = ranked.filter((d) => calcOverall(d) < avgOverall);

  const podium = ranked.slice(0, 3);
  const bottomPerformers = ranked.slice(-3).reverse();

  const PODIUM_COLORS = ['#fbbf24', '#94a3b8', '#cd7c32'];
  const PODIUM_ICONS = [
    <Crown size={22} key="1" />,
    <Medal size={22} key="2" />,
    <Trophy size={22} key="3" />,
  ];

  return (
    <PageWrapper>
      <PageHeader
        icon={<Award size={24} />}
        title="تقييم أداء السائقين"
        subtitle="تصنيف وتقييم أداء السائقين بناء على معايير متعددة"
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Filter size={16} style={{ color: 'var(--con-text-muted)' }} />
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              style={{ minWidth: 130 }}
            >
              <option value="">كل المنصات</option>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} style={{ minWidth: 120 }}>
              <option value="">كل الفروع</option>
              {BRANCHES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        }
      />

      {/* KPIs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <StatsCard
          icon={<Star size={20} />}
          title="متوسط التقييم العام"
          value={`${avgOverall}%`}
          color="var(--con-brand)"
          delay={0}
        />
        <StatsCard
          icon={<Crown size={20} />}
          title="أفضل سائق"
          value={bestDriver ? bestDriver.name : '—'}
          trend={bestDriver ? `${calcOverall(bestDriver)}%` : ''}
          color="var(--con-success)"
          delay={0.05}
        />
        <StatsCard
          icon={<AlertTriangle size={20} />}
          title="أسوأ سائق"
          value={worstDriver ? worstDriver.name : '—'}
          trend={worstDriver ? `${calcOverall(worstDriver)}%` : ''}
          color="var(--con-danger)"
          delay={0.1}
        />
        <StatsCard
          icon={<Users size={20} />}
          title="سائقين تحت المستوى"
          value={`${belowAvg.length} سائق`}
          trend={belowAvg.length > 5 ? 'يحتاج تدخل عاجل' : 'وضع مقبول'}
          color="var(--con-warning)"
          delay={0.15}
        />
      </div>

      {/* Top Performers Podium */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          background: 'var(--con-card)',
          border: '1px solid var(--con-border)',
          borderRadius: 'var(--con-radius)',
          padding: 22,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>المتصدرين</h3>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          {[1, 0, 2].map((podiumIdx) => {
            const d = podium[podiumIdx];
            if (!d) return null;
            const overall = calcOverall(d);
            const isFirst = podiumIdx === 0;
            return (
              <motion.div
                key={d.id}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 + podiumIdx * 0.1 }}
                style={{
                  background: `${PODIUM_COLORS[podiumIdx]}10`,
                  border: `2px solid ${PODIUM_COLORS[podiumIdx]}`,
                  borderRadius: 'var(--con-radius)',
                  padding: isFirst ? '24px 28px' : '18px 22px',
                  textAlign: 'center',
                  minWidth: 180,
                  transform: isFirst ? 'scale(1.05)' : 'none',
                }}
              >
                <div style={{ color: PODIUM_COLORS[podiumIdx], marginBottom: 8 }}>
                  {PODIUM_ICONS[podiumIdx]}
                </div>
                <p style={{ fontSize: 11, color: 'var(--con-text-muted)', marginBottom: 2 }}>
                  المركز {podiumIdx + 1}
                </p>
                <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{d.name}</p>
                <p style={{ fontSize: 13, color: 'var(--con-text-muted)', marginBottom: 8 }}>{d.platform}</p>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: PODIUM_COLORS[podiumIdx],
                  }}
                >
                  {overall}%
                </div>
                <StarRating rating={d.customerRating} />
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Ranking Table */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
        style={{
          background: 'var(--con-card)',
          border: '1px solid var(--con-border)',
          borderRadius: 'var(--con-radius)',
          overflow: 'auto',
          maxHeight: 450,
        }}
      >
        <table>
          <thead>
            <tr>
              <th>الترتيب</th>
              <th>السائق</th>
              <th>المنصة</th>
              <th>الفرع</th>
              <th>الطلبات</th>
              <th>الالتزام بالوقت</th>
              <th>تقييم العملاء</th>
              <th>الحضور</th>
              <th>التقييم العام</th>
              <th>الاتجاه</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((d, i) => {
              const overall = calcOverall(d);
              return (
                <motion.tr
                  key={d.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.02 * i }}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedDriver(d)}
                >
                  <td>
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        background:
                          i === 0
                            ? '#fbbf2420'
                            : i === 1
                            ? '#94a3b820'
                            : i === 2
                            ? '#cd7c3220'
                            : 'var(--con-bg)',
                        color:
                          i === 0
                            ? '#fbbf24'
                            : i === 1
                            ? '#94a3b8'
                            : i === 2
                            ? '#cd7c32'
                            : 'var(--con-text-muted)',
                      }}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{d.name}</td>
                  <td>
                    <span
                      style={badge(
                        d.platform === 'HungerStation'
                          ? '#ef4444'
                          : d.platform === 'Jahez'
                          ? '#f59e0b'
                          : '#22c55e'
                      )}
                    >
                      {d.platform}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--con-text-muted)' }}>{d.branch}</td>
                  <td style={{ fontWeight: 600 }}>{d.totalOrders}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div
                        style={{
                          width: 50,
                          height: 6,
                          borderRadius: 3,
                          background: 'var(--con-bg)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${d.onTimePercent}%`,
                            height: '100%',
                            borderRadius: 3,
                            background:
                              d.onTimePercent >= 90
                                ? 'var(--con-success)'
                                : d.onTimePercent >= 75
                                ? 'var(--con-warning)'
                                : 'var(--con-danger)',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 12 }}>{d.onTimePercent}%</span>
                    </div>
                  </td>
                  <td>
                    <StarRating rating={d.customerRating} />
                  </td>
                  <td>
                    <span
                      style={{
                        color:
                          d.attendancePercent >= 90
                            ? 'var(--con-success)'
                            : d.attendancePercent >= 75
                            ? 'var(--con-warning)'
                            : 'var(--con-danger)',
                        fontWeight: 600,
                      }}
                    >
                      {d.attendancePercent}%
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        ...badge(
                          overall >= 80
                            ? 'var(--con-success)'
                            : overall >= 60
                            ? 'var(--con-warning)'
                            : 'var(--con-danger)'
                        ),
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      {overall}%
                    </span>
                  </td>
                  <td>
                    {d.trend === 'up' ? (
                      <TrendingUp size={16} style={{ color: 'var(--con-success)' }} />
                    ) : d.trend === 'down' ? (
                      <TrendingDown size={16} style={{ color: 'var(--con-danger)' }} />
                    ) : (
                      <span style={{ color: 'var(--con-text-muted)', fontSize: 18 }}>—</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                      <button
                        style={{
                          ...btnOutline,
                          padding: '4px 8px',
                          fontSize: 11,
                          color: 'var(--con-success)',
                          borderColor: 'var(--con-success)',
                        }}
                        onClick={() => toast.success(`تم إرسال مكافأة لـ ${d.name}`)}
                      >
                        <Gift size={12} /> مكافأة
                      </button>
                      <button
                        style={{
                          ...btnOutline,
                          padding: '4px 8px',
                          fontSize: 11,
                          color: 'var(--con-warning)',
                          borderColor: 'var(--con-warning)',
                        }}
                        onClick={() => toast.warning(`تم إرسال تحذير لـ ${d.name}`)}
                      >
                        <AlertTriangle size={12} /> تحذير
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      {/* Bottom Performers */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{
          background: 'var(--con-card)',
          border: '1px solid var(--con-border)',
          borderRadius: 'var(--con-radius)',
          padding: 22,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--con-danger)' }}>
          <AlertTriangle size={16} style={{ marginLeft: 6, verticalAlign: 'middle' }} />
          سائقين يحتاجون تحسين
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {bottomPerformers.map((d) => {
            const overall = calcOverall(d);
            const recommendations: string[] = [];
            if (d.onTimePercent < 80) recommendations.push('تحسين الالتزام بالمواعيد');
            if (d.customerRating < 4) recommendations.push('رفع مستوى خدمة العملاء');
            if (d.attendancePercent < 85) recommendations.push('تحسين نسبة الحضور');
            if (d.speedScore < 70) recommendations.push('تسريع عمليات التوصيل');
            if (recommendations.length === 0) recommendations.push('الحفاظ على المستوى الحالي');

            return (
              <div
                key={d.id}
                style={{
                  background: 'rgba(239,68,68,0.05)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 8,
                  padding: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700 }}>{d.name}</span>
                  <span style={badge('var(--con-danger)')}>{overall}%</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--con-text-muted)', marginBottom: 8 }}>
                  {d.platform} — {d.branch}
                </p>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--con-warning)', marginBottom: 4 }}>
                  توصيات التحسين:
                </p>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {recommendations.map((r, i) => (
                    <li
                      key={i}
                      style={{
                        fontSize: 12,
                        color: 'var(--con-text-muted)',
                        paddingRight: 12,
                        position: 'relative',
                        marginBottom: 2,
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 5,
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          background: 'var(--con-warning)',
                        }}
                      />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Driver Detail Modal */}
      <Modal
        isOpen={!!selectedDriver}
        onClose={() => setSelectedDriver(null)}
        title={selectedDriver ? `تفاصيل أداء — ${selectedDriver.name}` : ''}
        width={600}
      >
        {selectedDriver && (() => {
          const d = selectedDriver;
          const overall = calcOverall(d);

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Info */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  background: 'var(--con-bg)',
                  borderRadius: 8,
                  padding: 14,
                }}
              >
                <div>
                  <p style={{ fontSize: 12, color: 'var(--con-text-muted)' }}>المنصة</p>
                  <p style={{ fontWeight: 600 }}>{d.platform}</p>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--con-text-muted)' }}>الفرع</p>
                  <p style={{ fontWeight: 600 }}>{d.branch}</p>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--con-text-muted)' }}>التقييم العام</p>
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: 18,
                      color:
                        overall >= 80 ? 'var(--con-success)' : overall >= 60 ? 'var(--con-warning)' : 'var(--con-danger)',
                    }}
                  >
                    {overall}%
                  </p>
                </div>
              </div>

              {/* Radar Chart */}
              <div style={{ textAlign: 'center' }}>
                <RadarChart driver={d} teamAvg={teamAvg} />
                <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 8, fontSize: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 12, height: 3, background: 'var(--con-brand)', borderRadius: 2 }} />
                    السائق
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span
                      style={{
                        width: 12,
                        height: 3,
                        background: 'var(--con-text-muted)',
                        borderRadius: 2,
                        borderBottom: '1px dashed var(--con-text-muted)',
                      }}
                    />
                    متوسط الفريق
                  </span>
                </div>
              </div>

              {/* Monthly Trend */}
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>الأداء الشهري (آخر 6 أشهر)</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 80 }}>
                  {d.monthlyScores.map((score, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 10, color: 'var(--con-text-muted)' }}>{score}%</span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${score * 0.7}px` }}
                        transition={{ delay: 0.1 * i, duration: 0.4 }}
                        style={{
                          width: '100%',
                          borderRadius: 4,
                          background:
                            score >= 80
                              ? 'var(--con-success)'
                              : score >= 60
                              ? 'var(--con-warning)'
                              : 'var(--con-danger)',
                        }}
                      />
                      <span style={{ fontSize: 10, color: 'var(--con-text-muted)' }}>
                        {['أكت', 'نوف', 'ديس', 'يناير', 'فبر', 'مارس'][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'إجمالي الطلبات', value: d.totalOrders, suffix: 'طلب' },
                  { label: 'الالتزام بالوقت', value: `${d.onTimePercent}%`, suffix: '' },
                  { label: 'تقييم العملاء', value: d.customerRating.toFixed(1), suffix: '/ 5' },
                  { label: 'نسبة الحضور', value: `${d.attendancePercent}%`, suffix: '' },
                  { label: 'نقاط السرعة', value: d.speedScore, suffix: '/ 100' },
                  { label: 'نقاط الموثوقية', value: d.reliabilityScore, suffix: '/ 100' },
                ].map((m) => (
                  <div
                    key={m.label}
                    style={{
                      background: 'var(--con-bg)',
                      borderRadius: 6,
                      padding: 10,
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontSize: 12, color: 'var(--con-text-muted)' }}>{m.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>
                      {m.value} {m.suffix}
                    </span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, borderTop: '1px solid var(--con-border)', paddingTop: 16 }}>
                <button
                  style={{ ...btnPrimary, background: 'var(--con-success)' }}
                  onClick={() => {
                    toast.success(`تم إرسال مكافأة لـ ${d.name}`);
                    setSelectedDriver(null);
                  }}
                >
                  <Gift size={14} /> مكافأة
                </button>
                <button
                  style={{ ...btnOutline, color: 'var(--con-warning)', borderColor: 'var(--con-warning)' }}
                  onClick={() => {
                    toast.warning(`تم إرسال تحذير لـ ${d.name}`);
                    setSelectedDriver(null);
                  }}
                >
                  <AlertTriangle size={14} /> تحذير
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </PageWrapper>
  );
}
