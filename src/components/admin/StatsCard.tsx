/**
 * StatsCard — بطاقة إحصائيات قابلة لإعادة الاستخدام
 * تُستخدم لعرض مؤشرات الأداء في صفحات الإدارة
 * تتبع نظام التصميم "Obsidian Command" (--con-* CSS variables)
 */
import { motion } from "framer-motion";

interface StatsCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; label: string };
  color?: string;
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.22, 0.68, 0, 1] },
};

export function StatsCard({
  icon: Icon,
  title,
  value,
  subtitle,
  trend,
  color = "#3b82f6",
}: StatsCardProps) {
  return (
    <motion.div
      variants={fadeUp}
      style={{
        background: "var(--con-card, #0d1926)",
        border: "1px solid var(--con-border, #1a3a52)",
        borderRadius: "var(--con-radius, 12px)",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div
          style={{
            background: `${color}18`,
            borderRadius: "var(--con-radius, 10px)",
            padding: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={20} color={color} />
        </div>
        {trend && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: trend.value >= 0 ? "#22c55e" : "#ef4444",
              background: trend.value >= 0 ? "#22c55e18" : "#ef444418",
              padding: "2px 8px",
              borderRadius: 6,
            }}
          >
            {trend.value >= 0 ? "+" : ""}
            {trend.value}% {trend.label}
          </span>
        )}
      </div>
      <div>
        <p style={{ fontSize: 13, color: "var(--con-text-muted, #94a3b8)", marginBottom: 4 }}>
          {title}
        </p>
        <p style={{ fontSize: 26, fontWeight: 700, color: "var(--con-text, #e2e8f0)", margin: 0 }}>
          {value}
        </p>
        {subtitle && (
          <p style={{ fontSize: 12, color: "var(--con-text-muted, #94a3b8)", marginTop: 4 }}>
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
}
