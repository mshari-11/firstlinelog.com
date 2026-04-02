/**
 * صفحة التقييمات والملاحظات — Feedbacks Management
 * عرض وإدارة تقييمات العملاء والسائقين
 * Backend: platform-api-prod.js /feedbacks/ endpoints (mock fallback)
 */
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  MessageSquareHeart,
  RefreshCw,
  Download,
  Star,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  MessageCircle,
  X,
} from "lucide-react";
import { PageWrapper, PageHeader, Modal } from "@/components/admin/ui";
import { StatsCard } from "@/components/admin/StatsCard";
import { FeedbackTable, type FeedbackItem } from "@/components/admin/FeedbackTable";
import { useAuth } from "@/lib/admin/auth";
import { API_BASE } from "@/lib/api";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_FEEDBACKS: FeedbackItem[] = [
  {
    id: "fb-001",
    customer_name: "أحمد محمد",
    rating: 5,
    comment: "خدمة ممتازة وتوصيل سريع جداً",
    category: "توصيل",
    status: "reviewed",
    created_at: "2026-03-30T14:20:00Z",
    order_id: "ORD-4521",
    driver_name: "خالد العتيبي",
  },
  {
    id: "fb-002",
    customer_name: "سارة أحمد",
    rating: 3,
    comment: "التوصيل تأخر ساعة عن الموعد المحدد",
    category: "تأخير",
    status: "new",
    created_at: "2026-03-30T10:15:00Z",
    order_id: "ORD-4518",
    driver_name: "فهد الدوسري",
  },
  {
    id: "fb-003",
    customer_name: "عبدالله خالد",
    rating: 4,
    comment: "جيد بشكل عام، التغليف ممتاز",
    category: "جودة",
    status: "resolved",
    created_at: "2026-03-29T16:30:00Z",
    order_id: "ORD-4499",
    driver_name: "محمد السبيعي",
  },
  {
    id: "fb-004",
    customer_name: "نورة سعد",
    rating: 1,
    comment: "الطلب وصل تالف والسائق لم يعتذر",
    category: "شكوى",
    status: "new",
    created_at: "2026-03-29T09:45:00Z",
    order_id: "ORD-4487",
    driver_name: "سلطان الشهري",
  },
  {
    id: "fb-005",
    customer_name: "فيصل عمر",
    rating: 5,
    comment: "أفضل شركة توصيل تعاملت معها، شكراً لكم",
    category: "عام",
    status: "reviewed",
    created_at: "2026-03-28T20:10:00Z",
    order_id: "ORD-4475",
  },
  {
    id: "fb-006",
    customer_name: "ريم ناصر",
    rating: 2,
    comment: "السائق لم يلتزم بموقع التسليم",
    category: "توصيل",
    status: "new",
    created_at: "2026-03-28T11:00:00Z",
    order_id: "ORD-4460",
    driver_name: "عبدالرحمن القحطاني",
  },
  {
    id: "fb-007",
    customer_name: "محمد علي",
    rating: 4,
    comment: "سرعة في التوصيل لكن التتبع كان متأخر",
    category: "تقنية",
    status: "resolved",
    created_at: "2026-03-27T15:20:00Z",
    order_id: "ORD-4445",
  },
  {
    id: "fb-008",
    customer_name: "هند سالم",
    rating: 5,
    comment: "تجربة رائعة من البداية للنهاية",
    category: "عام",
    status: "reviewed",
    created_at: "2026-03-27T08:30:00Z",
    order_id: "ORD-4430",
    driver_name: "يوسف الحربي",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Feedbacks() {
  useAuth(); // ensure auth context is active
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(MOCK_FEEDBACKS);
  const [loading, setLoading] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const session = localStorage.getItem("fll_session");
      const token = session ? JSON.parse(session)?.token : null;
      const res = await fetch(`${API_BASE}/feedbacks`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setFeedbacks(data);
        }
      }
    } catch {
      // keep mock data on failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  // ─── Stats ──────────────────────────────────────────────────────────────────
  const totalFeedbacks = feedbacks.length;
  const avgRating = feedbacks.length
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : "0";
  const positiveCount = feedbacks.filter((f) => f.rating >= 4).length;
  const negativeCount = feedbacks.filter((f) => f.rating <= 2).length;
  const newCount = feedbacks.filter((f) => f.status === "new").length;

  const handleExport = () => {
    const sanitize = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v);
    const csv = [
      "الاسم,التقييم,التعليق,التصنيف,الحالة,التاريخ",
      ...feedbacks.map(
        (f) =>
          `"${sanitize(f.customer_name)}",${f.rating},"${sanitize(f.comment)}","${sanitize(f.category)}","${f.status}","${f.created_at}"`
      ),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedbacks-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("تم تصدير التقييمات بنجاح");
  };

  return (
    <PageWrapper>
      <PageHeader
        icon={MessageSquareHeart}
        title="التقييمات والملاحظات"
        subtitle={`${totalFeedbacks} تقييم — ${newCount} جديد`}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => fetchFeedbacks()}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                background: "var(--con-card, #0d1926)",
                border: "1px solid var(--con-border, #1a3a52)",
                borderRadius: 8,
                color: "var(--con-text, #e2e8f0)",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              تحديث
            </button>
            <button
              onClick={handleExport}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                background: "var(--con-brand, #3b82f6)",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <Download size={14} />
              تصدير CSV
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        <StatsCard
          icon={MessageCircle}
          title="إجمالي التقييمات"
          value={totalFeedbacks}
          subtitle="آخر 30 يوم"
          color="#3b82f6"
        />
        <StatsCard
          icon={Star}
          title="متوسط التقييم"
          value={avgRating}
          subtitle="من 5.0"
          color="#f59e0b"
          trend={{ value: 4.2, label: "عن الشهر الماضي" }}
        />
        <StatsCard
          icon={ThumbsUp}
          title="تقييمات إيجابية"
          value={positiveCount}
          subtitle={`${totalFeedbacks ? Math.round((positiveCount / totalFeedbacks) * 100) : 0}% من الإجمالي`}
          color="#22c55e"
        />
        <StatsCard
          icon={ThumbsDown}
          title="تقييمات سلبية"
          value={negativeCount}
          subtitle={`${totalFeedbacks ? Math.round((negativeCount / totalFeedbacks) * 100) : 0}% من الإجمالي`}
          color="#ef4444"
        />
      </div>

      {/* Feedback Table */}
      <FeedbackTable data={feedbacks} onView={setSelectedFeedback} />

      {/* Detail Modal */}
      {selectedFeedback && (
        <Modal onClose={() => setSelectedFeedback(null)} title="تفاصيل التقييم" width={500}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "0.5rem 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--con-text, #e2e8f0)" }}>
                {selectedFeedback.customer_name}
              </span>
              <div style={{ display: "flex", gap: 2 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={18}
                    fill={i <= selectedFeedback.rating ? "#f59e0b" : "transparent"}
                    color={i <= selectedFeedback.rating ? "#f59e0b" : "#475569"}
                  />
                ))}
              </div>
            </div>

            <div
              style={{
                background: "var(--con-bg, #07111d)",
                borderRadius: 8,
                padding: "12px 16px",
                fontSize: 14,
                color: "var(--con-text, #e2e8f0)",
                lineHeight: 1.7,
              }}
            >
              {selectedFeedback.comment}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                fontSize: 13,
              }}
            >
              <div>
                <span style={{ color: "#94a3b8" }}>التصنيف: </span>
                <span style={{ color: "var(--con-text, #e2e8f0)" }}>{selectedFeedback.category}</span>
              </div>
              <div>
                <span style={{ color: "#94a3b8" }}>الحالة: </span>
                <span style={{ color: "var(--con-text, #e2e8f0)" }}>
                  {selectedFeedback.status === "new"
                    ? "جديد"
                    : selectedFeedback.status === "reviewed"
                      ? "تمت المراجعة"
                      : "تم الحل"}
                </span>
              </div>
              {selectedFeedback.order_id && (
                <div>
                  <span style={{ color: "#94a3b8" }}>رقم الطلب: </span>
                  <span style={{ color: "var(--con-text, #e2e8f0)" }}>#{selectedFeedback.order_id}</span>
                </div>
              )}
              {selectedFeedback.driver_name && (
                <div>
                  <span style={{ color: "#94a3b8" }}>السائق: </span>
                  <span style={{ color: "var(--con-text, #e2e8f0)" }}>{selectedFeedback.driver_name}</span>
                </div>
              )}
              <div>
                <span style={{ color: "#94a3b8" }}>التاريخ: </span>
                <span style={{ color: "var(--con-text, #e2e8f0)" }}>
                  {new Date(selectedFeedback.created_at).toLocaleDateString("ar-SA", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </PageWrapper>
  );
}
