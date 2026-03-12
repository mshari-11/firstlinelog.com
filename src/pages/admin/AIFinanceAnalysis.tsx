/**
 * تحليل الذكاء الاصطناعي المالي - AI Finance Analysis
 * Chat interface for financial questions, anomaly detection, trend predictions
 */
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/admin/auth";
import { supabase } from "@/lib/supabase";
import {
  Send, Zap, TrendingUp, AlertCircle, BarChart3,
  Sparkles, Copy, Check, MessageSquare, ChevronRight,
} from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const suggestedPrompts = [
  { icon: TrendingUp, text: "ما هي توقعاتك للإيرادات في الربع القادم؟" },
  { icon: AlertCircle, text: "هل هناك أي حالات شذوذ في النفقات هذا الشهر؟" },
  { icon: BarChart3, text: "أي المدن تحتاج اهتماماً أكثر من الأخرى؟" },
  { icon: Sparkles, text: "ما هي التوصيات لتحسين الهامش التشغيلي؟" },
];

const mockAnomalies = [
  { date: "2026-03-10", category: "الوقود والصيانة", amount: 8500, normal: 4200, severity: "high", reason: "صيانة طارئة لسيارات متعددة" },
  { date: "2026-03-08", category: "إداري", amount: 3200, normal: 1500, severity: "medium", reason: "مصاريف غير متوقعة" },
  { date: "2026-03-05", category: "رواتب السائقين", amount: 76000, normal: 69000, severity: "low", reason: "راتب إضافي للعاملين بالساعات الإضافية" },
];

const mockPredictions = {
  marchRevenue: { value: 225000, trend: "up", confidence: 87 },
  aprilRevenue: { value: 235000, trend: "up", confidence: 82 },
  mayRevenue: { value: 245000, trend: "up", confidence: 78 },
  operatingMargin: { value: 38.5, trend: "stable", confidence: 85 },
  burnRate: { value: -645000, trend: "down", confidence: 88 },
};

interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

// ─── Message Component ────────────────────────────────────────────────────────
function MessageBubble({ message, onCopy }: { message: ChatMessage; onCopy: (text: string) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: message.type === "user" ? "flex-end" : "flex-start",
        marginBottom: 12,
        animation: "fadeIn 0.3s ease-in",
      }}
    >
      <div
        style={{
          maxWidth: "75%",
          background: message.type === "user" ? "var(--con-brand)" : "var(--con-bg-surface-2)",
          color: message.type === "user" ? "white" : "var(--con-text-primary)",
          borderRadius: 12,
          padding: "12px 16px",
          wordWrap: "break-word",
          position: "relative",
        }}
      >
        <p style={{ margin: 0, lineHeight: 1.5, fontSize: "var(--con-text-body)" }}>
          {message.content}
        </p>
        {message.type === "ai" && (
          <button
            onClick={handleCopy}
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              background: "transparent",
              border: "none",
              color: "var(--con-text-muted)",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: "var(--con-text-caption)",
            }}
            title="نسخ الرسالة"
          >
            {copied ? (
              <>
                <Check size={14} style={{ color: "var(--con-success)" }} />
                <span>تم النسخ</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>نسخ</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Anomaly Card ──────────────────────────────────────────────────────────────
function AnomalyCard({ anomaly }: { anomaly: typeof mockAnomalies[0] }) {
  const severityColor = {
    high: "var(--con-danger)",
    medium: "var(--con-warning)",
    low: "var(--con-info)",
  }[anomaly.severity];

  const severityLabel = {
    high: "حرج",
    medium: "متوسط",
    low: "منخفض",
  }[anomaly.severity];

  return (
    <div style={{
      background: "var(--con-bg-surface-2)",
      border: `1px solid ${severityColor}33`,
      borderLeft: `3px solid ${severityColor}`,
      borderRadius: 8,
      padding: "12px 16px",
      marginBottom: 12,
    }}>
      <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ color: "var(--con-text-primary)", fontWeight: 600 }}>
              {anomaly.category}
            </span>
            <span style={{
              padding: "2px 8px",
              background: `${severityColor}14`,
              color: severityColor,
              fontSize: "var(--con-text-caption)",
              fontWeight: 600,
              borderRadius: 4,
            }}>
              {severityLabel}
            </span>
          </div>
          <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
            {anomaly.date}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "var(--con-text-body)", fontWeight: 700, color: "var(--con-danger)" }}>
            {(anomaly.amount / 1000).toFixed(1)}ك ر.س
          </div>
          <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
            المتوقع: {(anomaly.normal / 1000).toFixed(1)}ك ر.س
          </div>
        </div>
      </div>
      <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", padding: "8px 0", borderTop: "1px solid var(--con-border-default)" }}>
        {anomaly.reason}
      </div>
    </div>
  );
}

// ─── Prediction Card ──────────────────────────────────────────────────────────
function PredictionCard({ label, data }: { label: string; data: any }) {
  const trendIcon = data.trend === "up" ? "📈" : data.trend === "down" ? "📉" : "➡️";
  const value = typeof data.value === "number" && data.value > 1000 ? `${(data.value / 1000).toFixed(1)}ك ر.س` : `${data.value}${label.includes("الهامش") || label.includes("معدل") ? "%" : ""}`;

  return (
    <div style={{
      background: "var(--con-bg-surface-2)",
      border: "1px solid var(--con-border-default)",
      borderRadius: 8,
      padding: "12px 16px",
      marginBottom: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ color: "var(--con-text-primary)", fontWeight: 600 }}>
          {label}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: "18px" }}>{trendIcon}</span>
          <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
            ثقة {data.confidence}%
          </span>
        </div>
      </div>
      <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--con-brand)" }}>
        {value}
      </div>
    </div>
  );
}

// ─── Suggested Prompt Button ───────────────────────────────────────────────────
function SuggestedPrompt({ prompt, onClick }: { prompt: typeof suggestedPrompts[0]; onClick: () => void }) {
  const Icon = prompt.icon;
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        background: "var(--con-bg-surface-1)",
        border: "1px solid var(--con-border-default)",
        borderRadius: 8,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--con-brand)";
        e.currentTarget.style.background = "var(--con-bg-surface-2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--con-border-default)";
        e.currentTarget.style.background = "var(--con-bg-surface-1)";
      }}
    >
      <Icon size={18} style={{ color: "var(--con-brand)", flexShrink: 0 }} />
      <span style={{ textAlign: "right", color: "var(--con-text-primary)", fontWeight: 500 }}>
        {prompt.text}
      </span>
      <ChevronRight size={18} style={{ color: "var(--con-text-muted)", marginLeft: "auto" }} />
    </button>
  );
}

// ─── Tab Button ────────────────────────────────────────────────────────────────
function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 16px",
        background: active ? "var(--con-brand)" : "var(--con-bg-surface-1)",
        border: `1px solid ${active ? "var(--con-brand)" : "var(--con-border-default)"}`,
        borderRadius: 8,
        color: active ? "white" : "var(--con-text-primary)",
        fontSize: "var(--con-text-body)",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AIFinanceAnalysis() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "ai",
      content: "مرحباً! أنا مساعدك المالي الذكي. يمكنني مساعدتك في تحليل الإيرادات والمصروفات، توقع الاتجاهات، والإجابة على أسئلتك المالية. كيف يمكنني مساعدتك اليوم؟",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "anomalies" | "predictions">("chat");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: `شكراً على السؤال: "${messageText}". بناءً على تحليل البيانات، فإن الإجابة هي أن الأداء المالي حالياً يسير بشكل إيجابي. الإيرادات تنمو بمعدل 8% شهرياً، والهامش التشغيلي مستقر عند 39.9%. أوصي بمراقبة مصروفات الوقود والصيانة التي أظهرت زيادة طفيفة هذا الشهر.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setLoading(false);
    }, 1000);
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div dir="rtl" style={{ padding: "20px 24px", background: "var(--con-bg-default)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <Sparkles size={24} style={{ color: "var(--con-brand)" }} />
          <h1 style={{ fontSize: "32px", fontWeight: 700, color: "var(--con-text-primary)", margin: 0 }}>
            تحليل الذكاء الاصطناعي
          </h1>
        </div>
        <p style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", margin: 0 }}>
          محلل مالي ذكي لمساعدتك في اتخاذ القرارات المالية الأفضل
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <TabButton label="الدردشة" active={activeTab === "chat"} onClick={() => setActiveTab("chat")} />
        <TabButton label="حالات الشذوذ" active={activeTab === "anomalies"} onClick={() => setActiveTab("anomalies")} />
        <TabButton label="التنبؤات" active={activeTab === "predictions"} onClick={() => setActiveTab("predictions")} />
      </div>

      {/* Chat Tab */}
      {activeTab === "chat" && (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: "600px" }}>
          {/* Messages Area */}
          <div style={{
            flex: 1,
            background: "var(--con-bg-surface-1)",
            border: "1px solid var(--con-border-default)",
            borderRadius: 10,
            padding: "20px",
            marginBottom: 16,
            overflowY: "auto",
            minHeight: "400px",
          }}>
            {messages.length <= 1 && (
              <div style={{ textAlign: "center", paddingTop: "40px", marginBottom: 24 }}>
                <MessageSquare size={48} style={{ color: "var(--con-text-muted)", margin: "0 auto 16px" }} />
                <h3 style={{ color: "var(--con-text-primary)", marginBottom: 8 }}>
                  ابدأ محادثتك المالية
                </h3>
                <p style={{ color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)" }}>
                  اختر من الأسئلة المقترحة أو اكتب سؤالك الخاص
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} onCopy={handleCopyMessage} />
            ))}

            {messages.length === 1 && (
              <div style={{ marginTop: 24 }}>
                <h4 style={{ color: "var(--con-text-primary)", marginBottom: 12, fontSize: "var(--con-text-body)", fontWeight: 600 }}>
                  أسئلة مقترحة:
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
                  {suggestedPrompts.map((prompt, idx) => (
                    <SuggestedPrompt
                      key={idx}
                      prompt={prompt}
                      onClick={() => handleSendMessage(prompt.text)}
                    />
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div style={{ display: "flex", gap: 8, padding: "12px 16px", background: "var(--con-bg-surface-2)", borderRadius: 12, width: "fit-content" }}>
                <div style={{ width: 8, height: 8, background: "var(--con-brand)", borderRadius: "50%", animation: "pulse 1.5s infinite" }} />
                <div style={{ width: 8, height: 8, background: "var(--con-brand)", borderRadius: "50%", animation: "pulse 1.5s infinite 0.3s" }} />
                <div style={{ width: 8, height: 8, background: "var(--con-brand)", borderRadius: "50%", animation: "pulse 1.5s infinite 0.6s" }} />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{
            display: "flex",
            gap: 12,
            background: "var(--con-bg-surface-1)",
            border: "1px solid var(--con-border-default)",
            borderRadius: 10,
            padding: "12px",
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="اسأل عن الإيرادات والمصروفات والتوقعات..."
              style={{
                flex: 1,
                background: "var(--con-bg-surface-2)",
                border: "1px solid var(--con-border-default)",
                borderRadius: 8,
                padding: "12px 16px",
                color: "var(--con-text-primary)",
                fontSize: "var(--con-text-body)",
                outline: "none",
              }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || loading}
              style={{
                padding: "12px 16px",
                background: input.trim() && !loading ? "var(--con-brand)" : "rgba(59,130,246,0.5)",
                border: "none",
                borderRadius: 8,
                color: "white",
                cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Anomalies Tab */}
      {activeTab === "anomalies" && (
        <div style={{
          background: "var(--con-bg-surface-1)",
          border: "1px solid var(--con-border-default)",
          borderRadius: 10,
          padding: "20px",
        }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", margin: "0 0 4px 0" }}>
              حالات الشذوذ المكتشفة
            </h3>
            <p style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", margin: 0 }}>
              تم اكتشاف {mockAnomalies.length} حالات شذوذ في البيانات المالية
            </p>
          </div>
          {mockAnomalies.map((anomaly, idx) => (
            <AnomalyCard key={idx} anomaly={anomaly} />
          ))}
        </div>
      )}

      {/* Predictions Tab */}
      {activeTab === "predictions" && (
        <div style={{
          background: "var(--con-bg-surface-1)",
          border: "1px solid var(--con-border-default)",
          borderRadius: 10,
          padding: "20px",
        }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", margin: "0 0 4px 0" }}>
              التنبؤات المالية
            </h3>
            <p style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", margin: 0 }}>
              توقعات بناءً على تحليل الاتجاهات التاريخية
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
            <div>
              <h4 style={{ color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)", fontWeight: 600, marginBottom: 12 }}>
                توقعات الإيرادات
              </h4>
              <PredictionCard label="إيرادات مارس" data={mockPredictions.marchRevenue} />
              <PredictionCard label="إيرادات أبريل" data={mockPredictions.aprilRevenue} />
              <PredictionCard label="إيرادات مايو" data={mockPredictions.mayRevenue} />
            </div>
            <div>
              <h4 style={{ color: "var(--con-text-muted)", fontSize: "var(--con-text-caption)", fontWeight: 600, marginBottom: 12 }}>
                توقعات الأداء
              </h4>
              <PredictionCard label="الهامش التشغيلي" data={mockPredictions.operatingMargin} />
              <PredictionCard label="معدل الاحتراق" data={mockPredictions.burnRate} />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
