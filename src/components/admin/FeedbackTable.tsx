/**
 * FeedbackTable — جدول عرض التقييمات والملاحظات
 * يدعم الفلترة والبحث وعرض التفاصيل
 * تتبع نظام التصميم "Obsidian Command" (--con-* CSS variables)
 */
import { useState } from "react";
import { Search, Star, ChevronDown, ChevronUp, Eye } from "lucide-react";

export interface FeedbackItem {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  category: string;
  status: "new" | "reviewed" | "resolved";
  created_at: string;
  order_id?: string;
  driver_name?: string;
}

interface FeedbackTableProps {
  data: FeedbackItem[];
  onView?: (item: FeedbackItem) => void;
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  new: { bg: "#3b82f618", text: "#3b82f6", label: "جديد" },
  reviewed: { bg: "#f59e0b18", text: "#f59e0b", label: "تمت المراجعة" },
  resolved: { bg: "#22c55e18", text: "#22c55e", label: "تم الحل" },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          fill={i <= rating ? "#f59e0b" : "transparent"}
          color={i <= rating ? "#f59e0b" : "#475569"}
        />
      ))}
    </div>
  );
}

export function FeedbackTable({ data, onView }: FeedbackTableProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"created_at" | "rating">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = data
    .filter((item) => {
      const matchSearch =
        !search ||
        item.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        item.comment.toLowerCase().includes(search.toLowerCase()) ||
        (item.order_id && item.order_id.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = filterStatus === "all" || item.status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortField === "rating") return (a.rating - b.rating) * mul;
      return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * mul;
    });

  const toggleSort = (field: "created_at" | "rating") => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: string }) =>
    sortField === field ? (
      sortDir === "asc" ? (
        <ChevronUp size={14} />
      ) : (
        <ChevronDown size={14} />
      )
    ) : null;

  const thStyle: React.CSSProperties = {
    padding: "10px 14px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--con-text-muted, #94a3b8)",
    textAlign: "right",
    borderBottom: "1px solid var(--con-border, #1a3a52)",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    padding: "12px 14px",
    fontSize: 13,
    color: "var(--con-text, #e2e8f0)",
    borderBottom: "1px solid var(--con-border, #1a3a52)",
  };

  return (
    <div
      style={{
        background: "var(--con-card, #0d1926)",
        border: "1px solid var(--con-border, #1a3a52)",
        borderRadius: "var(--con-radius, 12px)",
        overflow: "hidden",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          borderBottom: "1px solid var(--con-border, #1a3a52)",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--con-bg, #07111d)",
            border: "1px solid var(--con-border, #1a3a52)",
            borderRadius: 8,
            padding: "6px 12px",
            flex: 1,
            minWidth: 200,
          }}
        >
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="بحث بالاسم أو التعليق أو رقم الطلب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--con-text, #e2e8f0)",
              fontSize: 13,
              width: "100%",
              fontFamily: "inherit",
            }}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            background: "var(--con-bg, #07111d)",
            border: "1px solid var(--con-border, #1a3a52)",
            borderRadius: 8,
            padding: "6px 12px",
            color: "var(--con-text, #e2e8f0)",
            fontSize: 13,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          <option value="all">جميع الحالات</option>
          <option value="new">جديد</option>
          <option value="reviewed">تمت المراجعة</option>
          <option value="resolved">تم الحل</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>العميل</th>
              <th style={thStyle} onClick={() => toggleSort("rating")}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  التقييم <SortIcon field="rating" />
                </span>
              </th>
              <th style={thStyle}>التعليق</th>
              <th style={thStyle}>التصنيف</th>
              <th style={thStyle}>الحالة</th>
              <th style={thStyle} onClick={() => toggleSort("created_at")}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  التاريخ <SortIcon field="created_at" />
                </span>
              </th>
              <th style={{ ...thStyle, cursor: "default" }}>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...tdStyle, textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
                  لا توجد تقييمات مطابقة
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const s = statusColors[item.status] || statusColors.new;
                return (
                  <tr
                    key={item.id}
                    style={{ transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#ffffff08")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={tdStyle}>
                      <div>
                        <span style={{ fontWeight: 500 }}>{item.customer_name}</span>
                        {item.order_id && (
                          <span style={{ display: "block", fontSize: 11, color: "#94a3b8" }}>
                            طلب #{item.order_id}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <StarRating rating={item.rating} />
                    </td>
                    <td style={{ ...tdStyle, maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.comment}
                    </td>
                    <td style={tdStyle}>{item.category}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          background: s.bg,
                          color: s.text,
                          padding: "3px 10px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {s.label}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontSize: 12, color: "#94a3b8" }}>
                      {new Date(item.created_at).toLocaleDateString("ar-SA")}
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => onView?.(item)}
                        style={{
                          background: "var(--con-brand-subtle, #1e3a5f)",
                          border: "none",
                          borderRadius: 6,
                          padding: "5px 8px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          color: "var(--con-brand, #3b82f6)",
                          fontSize: 12,
                        }}
                      >
                        <Eye size={14} />
                        عرض
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "10px 16px",
          fontSize: 12,
          color: "#94a3b8",
          borderTop: "1px solid var(--con-border, #1a3a52)",
        }}
      >
        إجمالي النتائج: {filtered.length} من {data.length}
      </div>
    </div>
  );
}
