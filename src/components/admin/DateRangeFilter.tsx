/**
 * DateRangeFilter — reusable date range picker for admin pages
 * Provides preset ranges (today, week, month) + custom range
 */
import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";

interface DateRange {
  from: string;
  to: string;
}

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESETS: { label: string; getRange: () => DateRange }[] = [
  {
    label: "اليوم",
    getRange: () => {
      const today = new Date().toISOString().slice(0, 10);
      return { from: today, to: today };
    },
  },
  {
    label: "آخر 7 أيام",
    getRange: () => {
      const to = new Date();
      const from = new Date(to);
      from.setDate(from.getDate() - 7);
      return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
    },
  },
  {
    label: "هذا الشهر",
    getRange: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: from.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
    },
  },
  {
    label: "الشهر الماضي",
    getRange: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
    },
  },
  {
    label: "آخر 3 أشهر",
    getRange: () => {
      const to = new Date();
      const from = new Date(to);
      from.setMonth(from.getMonth() - 3);
      return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
    },
  },
];

export function DateRangeFilter({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          borderRadius: 8,
          border: "1px solid var(--con-border-default, #e5e7eb)",
          background: "var(--con-bg-surface-1, #fff)",
          color: "var(--con-text-primary, #111)",
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        <Calendar size={14} style={{ color: "var(--con-text-muted)" }} />
        {value.from && value.to
          ? `${value.from} — ${value.to}`
          : "فلتر بالتاريخ"}
        <ChevronDown size={12} style={{ color: "var(--con-text-muted)" }} />
      </button>

      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 98 }}
            onClick={() => setOpen(false)}
          />
          <div
            dir="rtl"
            style={{
              position: "absolute",
              top: "100%",
              insetInlineEnd: 0,
              marginTop: 4,
              background: "var(--con-bg-surface-1, #fff)",
              border: "1px solid var(--con-border-default, #e5e7eb)",
              borderRadius: 10,
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              padding: 12,
              zIndex: 99,
              minWidth: 260,
            }}
          >
            {/* Presets */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--con-text-muted)", marginBottom: 4 }}>
                فترات سريعة
              </p>
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    onChange(p.getRange());
                    setOpen(false);
                  }}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "none",
                    background: "var(--con-bg-surface-2, #f3f4f6)",
                    color: "var(--con-text-primary, #111)",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    textAlign: "right",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom range */}
            <div style={{ borderTop: "1px solid var(--con-border-default, #e5e7eb)", paddingTop: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--con-text-muted)", marginBottom: 6 }}>
                فترة مخصصة
              </p>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  type="date"
                  value={value.from}
                  onChange={(e) => onChange({ ...value, from: e.target.value })}
                  style={{
                    flex: 1,
                    padding: "5px 8px",
                    borderRadius: 6,
                    border: "1px solid var(--con-border-default, #e5e7eb)",
                    fontSize: 12,
                    background: "var(--con-bg-surface-2, #f9fafb)",
                    color: "var(--con-text-primary, #111)",
                  }}
                />
                <span style={{ fontSize: 11, color: "var(--con-text-muted)" }}>إلى</span>
                <input
                  type="date"
                  value={value.to}
                  onChange={(e) => onChange({ ...value, to: e.target.value })}
                  style={{
                    flex: 1,
                    padding: "5px 8px",
                    borderRadius: 6,
                    border: "1px solid var(--con-border-default, #e5e7eb)",
                    fontSize: 12,
                    background: "var(--con-bg-surface-2, #f9fafb)",
                    color: "var(--con-text-primary, #111)",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    flex: 1,
                    padding: "6px",
                    borderRadius: 6,
                    border: "none",
                    background: "var(--con-brand, #3b82f6)",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  تطبيق
                </button>
                <button
                  onClick={() => {
                    onChange({ from: "", to: "" });
                    setOpen(false);
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "1px solid var(--con-border-default, #e5e7eb)",
                    background: "transparent",
                    color: "var(--con-text-secondary, #555)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  مسح
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
