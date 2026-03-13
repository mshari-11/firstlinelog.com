/**
 * Fitness App — User Profile Screen
 * Aesthetic: "Athletic Command Center" — midnight navy meets competitive sports energy.
 * Circular SVG progress rings, pulsing goal trackers, animated stat tiles,
 * and motivational streak counters on the FLL dark design system.
 */
import { useState, useEffect, useRef } from "react";

/* ─── Types ─── */
interface Goal {
  id: string;
  label: string;
  labelEn: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  icon: string;
}

interface WorkoutDay {
  day: string;
  intensity: 0 | 1 | 2 | 3; // 0=rest, 1=light, 2=medium, 3=intense
}

/* ─── Mock Data ─── */
const USER = {
  name: "خالد المنصور",
  nameEn: "Khalid Al-Mansour",
  age: 28,
  height: "178 cm",
  weight: "76 kg",
  bmi: 24.0,
  memberSince: "2024-03",
  avatar: null as string | null,
  level: "متقدم",
  levelEn: "Advanced",
  streak: 47,
  bestStreak: 63,
  totalWorkouts: 312,
  totalMinutes: 18720,
  totalCalories: 287500,
  heartRateAvg: 72,
  heartRateMax: 186,
  vo2max: 48.5,
};

const GOALS: Goal[] = [
  { id: "steps", label: "خطوات", labelEn: "Steps", current: 8743, target: 10000, unit: "", color: "#3B82F6", icon: "👟" },
  { id: "calories", label: "سعرات", labelEn: "Calories", current: 1850, target: 2500, unit: "kcal", color: "#F59E0B", icon: "🔥" },
  { id: "water", label: "ماء", labelEn: "Water", current: 2.1, target: 3.0, unit: "L", color: "#0EA5E9", icon: "💧" },
  { id: "sleep", label: "نوم", labelEn: "Sleep", current: 7.2, target: 8.0, unit: "hrs", color: "#8B5CF6", icon: "🌙" },
];

const WEEK_ACTIVITY: WorkoutDay[] = [
  { day: "سبت", intensity: 3 },
  { day: "أحد", intensity: 2 },
  { day: "إثن", intensity: 3 },
  { day: "ثلا", intensity: 0 },
  { day: "أرب", intensity: 2 },
  { day: "خمي", intensity: 3 },
  { day: "جمع", intensity: 1 },
];

const RECENT_WORKOUTS = [
  { type: "جري", typeEn: "Running", duration: "45 min", calories: 520, date: "اليوم", icon: "🏃", intensity: "عالي" },
  { type: "أثقال", typeEn: "Weights", duration: "60 min", calories: 380, date: "أمس", icon: "🏋️", intensity: "متوسط" },
  { type: "HIIT", typeEn: "HIIT", duration: "30 min", calories: 410, date: "قبل يومين", icon: "⚡", intensity: "عالي جداً" },
  { type: "سباحة", typeEn: "Swimming", duration: "40 min", calories: 350, date: "قبل 3 أيام", icon: "🏊", intensity: "متوسط" },
];

const ACHIEVEMENTS = [
  { icon: "🏆", label: "100 تمرين", unlocked: true },
  { icon: "🔥", label: "30 يوم متواصل", unlocked: true },
  { icon: "⚡", label: "10K خطوة/يوم", unlocked: true },
  { icon: "💪", label: "رفع 100 كغ", unlocked: true },
  { icon: "🏃", label: "ماراثون نصفي", unlocked: false },
  { icon: "🧘", label: "100 ساعة يوغا", unlocked: false },
];

/* ─── Animated Counter Hook ─── */
function useAnimatedValue(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return value;
}

/* ─── SVG Circular Progress Ring ─── */
function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  color,
  children,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedProgress = useAnimatedValue(Math.min(progress, 1), 1400);
  const offset = circumference * (1 - animatedProgress);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            filter: `drop-shadow(0 0 6px ${color}60)`,
            transition: "stroke-dashoffset 0.1s ease-out",
          }}
        />
      </svg>
      {/* Center content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ─── Motivational Quotes ─── */
const QUOTES = [
  "النجاح يبدأ من الخطوة الأولى",
  "كل تمرين يقربك من هدفك",
  "الاستمرارية تصنع الأبطال",
  "تحدَّ نفسك كل يوم",
];

/* ─── Main Component ─── */
export default function FitnessProfile() {
  const [activeTab, setActiveTab] = useState<"overview" | "goals" | "history">("overview");
  const [quoteIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));

  const streakValue = useAnimatedValue(USER.streak, 1800);
  const totalWorkoutsValue = useAnimatedValue(USER.totalWorkouts, 2000);

  const css = `
    @keyframes fp-pulse-ring {
      0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
      50% { box-shadow: 0 0 0 12px rgba(59,130,246,0); }
    }
    @keyframes fp-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
    @keyframes fp-streak-fire {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.15); }
    }
    @keyframes fp-slide-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fp-shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes fp-heartbeat {
      0%, 100% { transform: scale(1); }
      14% { transform: scale(1.15); }
      28% { transform: scale(1); }
      42% { transform: scale(1.1); }
      70% { transform: scale(1); }
    }
    .fp-card {
      background: rgba(17,26,43,0.85);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 16px;
      backdrop-filter: blur(12px);
      transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
    }
    .fp-card:hover {
      border-color: rgba(59,130,246,0.3);
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.4);
    }
    .fp-tab {
      padding: 10px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid transparent;
      background: transparent;
      color: #7E8CA2;
      font-family: 'IBM Plex Sans Arabic', sans-serif;
      transition: all 0.25s;
    }
    .fp-tab:hover { color: #B6C2D2; background: rgba(255,255,255,0.04); }
    .fp-tab.active {
      background: rgba(59,130,246,0.12);
      border-color: rgba(59,130,246,0.3);
      color: #3B82F6;
      font-weight: 600;
    }
    .fp-workout-row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 18px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      transition: background 0.2s;
    }
    .fp-workout-row:hover { background: rgba(255,255,255,0.03); }
    .fp-workout-row:last-child { border-bottom: none; }
    .fp-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 600;
    }
    .fp-achievement {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 14px 8px;
      border-radius: 12px;
      transition: all 0.25s;
      cursor: default;
    }
    .fp-achievement:hover { background: rgba(255,255,255,0.04); }
    .fp-achievement.locked { opacity: 0.35; filter: grayscale(1); }
  `;

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(170deg, #060E1A 0%, #0B1220 30%, #0F1A2E 60%, #0B1220 100%)",
        fontFamily: "'IBM Plex Sans Arabic', 'Plus Jakarta Sans', sans-serif",
        color: "#F3F6FB",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{css}</style>

      {/* ── Ambient background effects ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background:
            "radial-gradient(ellipse 60% 40% at 20% 10%, rgba(59,130,246,0.06) 0%, transparent 60%), " +
            "radial-gradient(ellipse 40% 50% at 80% 80%, rgba(139,92,246,0.04) 0%, transparent 50%)",
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          backgroundImage:
            "linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), " +
            "linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* ── Content ── */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>

        {/* ═══ PROFILE HEADER ═══ */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 32,
            animation: "fp-slide-up 0.6s ease-out both",
          }}
        >
          {/* Avatar with pulse ring */}
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 800,
              color: "#fff",
              flexShrink: 0,
              animation: "fp-pulse-ring 3s ease-in-out infinite",
              position: "relative",
            }}
          >
            خ
            {/* Level badge */}
            <div
              style={{
                position: "absolute",
                bottom: -4,
                left: -4,
                background: "#16A34A",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 8,
                border: "2px solid #0B1220",
              }}
            >
              {USER.levelEn}
            </div>
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: "clamp(1.5rem, 4vw, 2rem)",
                fontWeight: 800,
                marginBottom: 2,
                letterSpacing: "-0.02em",
              }}
            >
              {USER.name}
            </h1>
            <p
              style={{
                fontSize: 13,
                color: "#7E8CA2",
                fontFamily: "'JetBrains Mono', monospace",
                marginBottom: 8,
              }}
            >
              {USER.nameEn} &bull; {USER.age} yrs &bull; {USER.height} &bull; {USER.weight}
            </p>
            {/* Motivational quote */}
            <p
              style={{
                fontSize: 14,
                color: "#B6C2D2",
                fontStyle: "italic",
                background: "linear-gradient(90deg, #3B82F6, #8B5CF6, #3B82F6)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "fp-shimmer 4s linear infinite",
                fontWeight: 600,
              }}
            >
              "{QUOTES[quoteIndex]}"
            </p>
          </div>

          {/* Streak counter */}
          <div
            style={{
              textAlign: "center",
              flexShrink: 0,
              padding: "16px 20px",
              borderRadius: 16,
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.2)",
            }}
          >
            <div style={{ fontSize: 28, animation: "fp-streak-fire 2s ease-in-out infinite", marginBottom: 2 }}>
              🔥
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 28,
                fontWeight: 800,
                color: "#F59E0B",
                lineHeight: 1,
              }}
            >
              {Math.round(streakValue)}
            </div>
            <div style={{ fontSize: 11, color: "#D97706", fontWeight: 600, marginTop: 2 }}>
              يوم متواصل
            </div>
          </div>
        </header>

        {/* ═══ KPI STRIP ═══ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
            marginBottom: 28,
            animation: "fp-slide-up 0.6s ease-out 0.15s both",
          }}
        >
          {[
            { value: Math.round(totalWorkoutsValue), label: "تمرين", icon: "💪", color: "#3B82F6" },
            { value: `${(USER.totalMinutes / 60).toFixed(0)}h`, label: "ساعة تمرين", icon: "⏱️", color: "#0EA5E9" },
            { value: `${(USER.totalCalories / 1000).toFixed(0)}K`, label: "سعرة محروقة", icon: "🔥", color: "#F59E0B" },
            { value: USER.vo2max, label: "VO₂ Max", icon: "🫁", color: "#16A34A" },
            {
              value: USER.heartRateAvg,
              label: "نبض/د",
              icon: "❤️",
              color: "#EF4444",
              animate: true,
            },
          ].map((kpi, i) => (
            <div
              key={kpi.label}
              className="fp-card"
              style={{
                padding: "16px",
                textAlign: "center",
                animationDelay: `${i * 80}ms`,
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  marginBottom: 6,
                  animation: kpi.animate ? "fp-heartbeat 1.5s ease-in-out infinite" : undefined,
                }}
              >
                {kpi.icon}
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 22,
                  fontWeight: 800,
                  color: kpi.color,
                  lineHeight: 1,
                  marginBottom: 4,
                }}
              >
                {kpi.value}
              </div>
              <div style={{ fontSize: 11, color: "#7E8CA2", fontWeight: 500 }}>
                {kpi.label}
              </div>
            </div>
          ))}
        </div>

        {/* ═══ TAB NAV ═══ */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 24,
            animation: "fp-slide-up 0.6s ease-out 0.3s both",
          }}
        >
          {(["overview", "goals", "history"] as const).map((tab) => (
            <button
              key={tab}
              className={`fp-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "overview" ? "نظرة عامة" : tab === "goals" ? "الأهداف" : "السجل"}
            </button>
          ))}
        </div>

        {/* ═══ TAB CONTENT ═══ */}
        {activeTab === "overview" && (
          <div style={{ animation: "fp-slide-up 0.4s ease-out both" }}>
            {/* Two-column layout */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 16,
              }}
            >
              {/* Weekly Activity Heatmap */}
              <div className="fp-card" style={{ padding: 22 }}>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    marginBottom: 18,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 18 }}>📊</span>
                  نشاط الأسبوع
                </h3>
                <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
                  {WEEK_ACTIVITY.map((day) => {
                    const heights = [16, 32, 52, 72];
                    const colors = ["rgba(255,255,255,0.06)", "#16A34A50", "#16A34A90", "#16A34A"];
                    return (
                      <div key={day.day} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
                        <div
                          style={{
                            width: "100%",
                            maxWidth: 32,
                            height: 72,
                            borderRadius: 8,
                            background: "rgba(255,255,255,0.03)",
                            display: "flex",
                            alignItems: "flex-end",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              height: heights[day.intensity],
                              background: colors[day.intensity],
                              borderRadius: "6px 6px 0 0",
                              transition: "height 1s ease-out",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 11, color: "#7E8CA2", fontWeight: 500 }}>
                          {day.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 14, justifyContent: "center" }}>
                  {[
                    { label: "راحة", color: "rgba(255,255,255,0.06)" },
                    { label: "خفيف", color: "#16A34A50" },
                    { label: "متوسط", color: "#16A34A90" },
                    { label: "مكثف", color: "#16A34A" },
                  ].map((leg) => (
                    <div key={leg.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: leg.color }} />
                      <span style={{ fontSize: 10, color: "#7E8CA2" }}>{leg.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Body Metrics */}
              <div className="fp-card" style={{ padding: 22 }}>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    marginBottom: 18,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 18 }}>🏋️</span>
                  مؤشرات الجسم
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    { label: "الوزن", value: USER.weight, sub: "BMI " + USER.bmi, color: "#3B82F6" },
                    { label: "الطول", value: USER.height, sub: "", color: "#0EA5E9" },
                    { label: "نبض القلب", value: `${USER.heartRateAvg} bpm`, sub: `أقصى: ${USER.heartRateMax}`, color: "#EF4444" },
                    { label: "VO₂ Max", value: `${USER.vo2max} ml/kg/min`, sub: "ممتاز", color: "#16A34A" },
                  ].map((m) => (
                    <div key={m.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "#B6C2D2" }}>{m.label}</span>
                      <div style={{ textAlign: "left" }}>
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 14,
                            fontWeight: 700,
                            color: m.color,
                          }}
                        >
                          {m.value}
                        </span>
                        {m.sub && (
                          <span style={{ fontSize: 11, color: "#7E8CA2", marginRight: 8 }}>
                            {m.sub}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Workouts */}
            <div className="fp-card" style={{ overflow: "hidden", marginBottom: 16 }}>
              <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>⚡</span>
                  آخر التمارين
                </h3>
              </div>
              {RECENT_WORKOUTS.map((w, i) => (
                <div key={i} className="fp-workout-row">
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "rgba(59,130,246,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  >
                    {w.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{w.type}</div>
                    <div style={{ fontSize: 11, color: "#7E8CA2" }}>{w.date} &bull; {w.duration}</div>
                  </div>
                  <span
                    className="fp-badge"
                    style={{
                      background: "rgba(245,158,11,0.1)",
                      color: "#F59E0B",
                    }}
                  >
                    🔥 {w.calories}
                  </span>
                  <span
                    className="fp-badge"
                    style={{
                      background: "rgba(22,163,74,0.1)",
                      color: "#16A34A",
                    }}
                  >
                    {w.intensity}
                  </span>
                </div>
              ))}
            </div>

            {/* Achievements */}
            <div className="fp-card" style={{ padding: 22 }}>
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 18 }}>🏅</span>
                الإنجازات
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
                  gap: 6,
                }}
              >
                {ACHIEVEMENTS.map((a) => (
                  <div
                    key={a.label}
                    className={`fp-achievement ${a.unlocked ? "" : "locked"}`}
                  >
                    <div style={{ fontSize: 28 }}>{a.icon}</div>
                    <span style={{ fontSize: 10, color: a.unlocked ? "#B6C2D2" : "#4A5568", textAlign: "center", fontWeight: 500 }}>
                      {a.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "goals" && (
          <div style={{ animation: "fp-slide-up 0.4s ease-out both" }}>
            {/* Goal Progress Rings */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
                marginBottom: 24,
              }}
            >
              {GOALS.map((goal) => {
                const pct = goal.current / goal.target;
                return (
                  <div
                    key={goal.id}
                    className="fp-card"
                    style={{ padding: 28, display: "flex", flexDirection: "column", alignItems: "center" }}
                  >
                    <ProgressRing progress={pct} size={130} strokeWidth={10} color={goal.color}>
                      <span style={{ fontSize: 28, marginBottom: 2 }}>{goal.icon}</span>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 16,
                          fontWeight: 800,
                          color: goal.color,
                        }}
                      >
                        {Math.round(pct * 100)}%
                      </span>
                    </ProgressRing>
                    <div style={{ textAlign: "center", marginTop: 14 }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{goal.label}</div>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 13,
                          color: "#B6C2D2",
                          marginTop: 4,
                        }}
                      >
                        {goal.current} / {goal.target} {goal.unit}
                      </div>
                    </div>
                    {/* Mini progress bar */}
                    <div
                      style={{
                        width: "100%",
                        height: 4,
                        borderRadius: 2,
                        background: "rgba(255,255,255,0.06)",
                        marginTop: 12,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(pct * 100, 100)}%`,
                          height: "100%",
                          background: goal.color,
                          borderRadius: 2,
                          transition: "width 1.4s ease-out",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Daily Summary Card */}
            <div
              className="fp-card"
              style={{
                padding: 28,
                textAlign: "center",
                background: "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.06) 100%)",
                border: "1px solid rgba(59,130,246,0.15)",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>🎯</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
                أنت على بُعد خطوات من تحقيق أهداف اليوم!
              </h3>
              <p style={{ fontSize: 13, color: "#B6C2D2", marginBottom: 16, lineHeight: 1.8 }}>
                أكمل {(10000 - 8743).toLocaleString()} خطوة و {(2500 - 1850)} سعرة إضافية للوصول لهدفك الكامل.
              </p>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 24px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(59,130,246,0.3)",
                }}
              >
                ابدأ تمرينك 🏃
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div style={{ animation: "fp-slide-up 0.4s ease-out both" }}>
            {/* Monthly Stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
                marginBottom: 20,
              }}
            >
              {[
                { label: "تمارين هذا الشهر", value: "22", icon: "📅", color: "#3B82F6" },
                { label: "أفضل سلسلة", value: `${USER.bestStreak} يوم`, icon: "🏆", color: "#F59E0B" },
                { label: "عضو منذ", value: "مارس 2024", icon: "⭐", color: "#8B5CF6" },
              ].map((s) => (
                <div key={s.label} className="fp-card" style={{ padding: 20, textAlign: "center" }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 18,
                      fontWeight: 800,
                      color: s.color,
                      marginBottom: 4,
                    }}
                  >
                    {s.value}
                  </div>
                  <div style={{ fontSize: 12, color: "#7E8CA2" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Full workout history */}
            <div className="fp-card" style={{ overflow: "hidden" }}>
              <div
                style={{
                  padding: "16px 20px 12px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>سجل التمارين</h3>
                <span style={{ fontSize: 12, color: "#7E8CA2", fontFamily: "'JetBrains Mono', monospace" }}>
                  {USER.totalWorkouts} total
                </span>
              </div>
              {[...RECENT_WORKOUTS, ...RECENT_WORKOUTS].map((w, i) => (
                <div key={i} className="fp-workout-row">
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "rgba(59,130,246,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {w.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {w.type}
                      <span style={{ fontSize: 11, color: "#7E8CA2", marginRight: 6 }}>{w.typeEn}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#7E8CA2" }}>{w.date}</div>
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#F59E0B",
                      }}
                    >
                      {w.calories} kcal
                    </div>
                    <div style={{ fontSize: 11, color: "#7E8CA2" }}>{w.duration}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
