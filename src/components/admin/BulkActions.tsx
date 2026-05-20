/**
 * BulkActions — reusable bulk action toolbar for admin tables
 * Shows when items are selected, with action buttons
 */
import { useState } from "react";
import { CheckSquare, X } from "lucide-react";

interface BulkAction {
  label: string;
  icon: React.ElementType;
  onClick: (selectedIds: string[]) => void;
  color?: string;
  destructive?: boolean;
}

interface Props {
  selectedIds: Set<string>;
  totalCount: number;
  onClear: () => void;
  onSelectAll: () => void;
  actions: BulkAction[];
}

export function BulkActions({ selectedIds, totalCount, onClear, onSelectAll, actions }: Props) {
  if (selectedIds.size === 0) return null;

  const ids = Array.from(selectedIds);

  return (
    <div
      dir="rtl"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 16px",
        background: "var(--con-brand, #3b82f6)",
        borderRadius: 10,
        color: "#fff",
        fontSize: 13,
        fontWeight: 500,
        marginBottom: 8,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <CheckSquare size={16} />
        <span>
          تم تحديد <strong>{selectedIds.size}</strong> من {totalCount}
        </span>
      </div>

      {selectedIds.size < totalCount && (
        <button
          onClick={onSelectAll}
          style={{
            padding: "4px 10px",
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.3)",
            background: "rgba(255,255,255,0.15)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          تحديد الكل ({totalCount})
        </button>
      )}

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => action.onClick(ids)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "5px 12px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.3)",
              background: action.destructive
                ? "rgba(239,68,68,0.9)"
                : action.color
                  ? action.color
                  : "rgba(255,255,255,0.15)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <action.icon size={13} />
            {action.label}
          </button>
        ))}

        <button
          onClick={onClear}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "5px 10px",
            borderRadius: 6,
            border: "none",
            background: "rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.7)",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          <X size={13} />
          إلغ��ء
        </button>
      </div>
    </div>
  );
}

/**
 * Helper hook for bulk selection
 */
export function useBulkSelect() {
  const [selected, setSelected] = useState(new Set<string>());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll(ids: string[]) {
    setSelected(new Set(ids));
  }

  function clear() {
    setSelected(new Set());
  }

  function isSelected(id: string) {
    return selected.has(id);
  }

  return { selected, toggle, selectAll, clear, isSelected };
}
