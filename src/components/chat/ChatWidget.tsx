/**
 * مساعد فيرست لاين الذكي - Chat Widget
 * يظهر كفقاعة في أسفل الشاشة بعد تسجيل الدخول
 * يختلف سياقه حسب الدور (إدارة / مندوب)
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatWidgetProps {
  userRole: "admin" | "owner" | "staff" | "courier";
  userId: string;
  userName?: string;
}

const SUPABASE_URL = "https://djebhztfewjfyyoortvv.supabase.co";

export default function ChatWidget({ userRole, userId, userName }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Welcome message on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      const isAdmin = userRole === "admin" || userRole === "owner" || userRole === "staff";
      const welcome: Message = {
        id: "welcome",
        role: "assistant",
        content: isAdmin
          ? `أهلاً ${userName || ""}! أنا مساعد فيرست لاين الذكي. أقدر أساعدك في مراجعة الإحصائيات، تحليل البيانات، أو أي استفسار عن النظام. كيف أقدر أخدمك؟`
          : `أهلاً ${userName || ""}! أنا مساعدك في فيرست لاين. تقدر تسألني عن طلباتك، حالة حسابك، أو أي استفسار ثاني. كيف أقدر أساعدك؟`,
        timestamp: new Date(),
      };
      setMessages([welcome]);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setHasNewMessage(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Build context for API (last 10 messages excluding welcome)
      const contextMessages = [...messages.filter((m) => m.id !== "welcome"), userMsg].slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase?.auth.getSession())?.data?.session?.access_token || ""}`,
        },
        body: JSON.stringify({
          message: text,
          role: userRole,
          userId,
          context: contextMessages,
        }),
      });

      const data = await res.json();

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || data.error || "عذراً، حدث خطأ. حاول مرة أخرى.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (!open) setHasNewMessage(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "عذراً، لم أتمكن من الاتصال بالخادم. تأكد من اتصالك بالإنترنت.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, userRole, userId, open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isAdmin = userRole === "admin" || userRole === "owner" || userRole === "staff";

  return (
    <>
      {/* Chat Bubble Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 left-6 z-50 group"
          style={{ direction: "ltr" }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110"
            style={{
              background: "linear-gradient(135deg, oklch(0.65 0.18 200), oklch(0.55 0.18 230))",
              boxShadow: "0 4px 24px oklch(0.65 0.18 200 / 0.4)",
            }}
          >
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          {hasNewMessage && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
          )}
          {/* Tooltip */}
          <span
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ background: "oklch(0.18 0.06 220)", color: "oklch(0.85 0.02 220)", border: "1px solid oklch(0.25 0.05 210 / 0.5)" }}
          >
            مساعد فيرست لاين الذكي
          </span>
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div
          className="fixed bottom-6 left-6 z-50 flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{
            width: "min(400px, calc(100vw - 48px))",
            height: "min(580px, calc(100vh - 120px))",
            background: "oklch(0.10 0.06 220)",
            border: "1px solid oklch(0.22 0.05 210 / 0.6)",
            boxShadow: "0 8px 48px oklch(0 0 0 / 0.5)",
          }}
          dir="rtl"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{
              background: "linear-gradient(135deg, oklch(0.16 0.08 220), oklch(0.12 0.06 220))",
              borderBottom: "1px solid oklch(0.22 0.05 210 / 0.5)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "oklch(0.65 0.18 200 / 0.15)" }}
              >
                <Bot className="w-5 h-5" style={{ color: "oklch(0.65 0.18 200)" }} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">
                  مساعد فيرست لاين
                </h3>
                <p className="text-[10px]" style={{ color: "oklch(0.50 0.06 210)" }}>
                  {isAdmin ? "مساعد الإدارة" : "مساعد المندوب"} • ذكاء اصطناعي
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <X size={16} className="text-white/60" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ scrollbarWidth: "thin" }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    background:
                      msg.role === "assistant"
                        ? "oklch(0.65 0.18 200 / 0.15)"
                        : "oklch(0.50 0.12 280 / 0.15)",
                  }}
                >
                  {msg.role === "assistant" ? (
                    <Bot size={14} style={{ color: "oklch(0.65 0.18 200)" }} />
                  ) : (
                    <User size={14} style={{ color: "oklch(0.70 0.12 280)" }} />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className="max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                  style={{
                    background:
                      msg.role === "assistant"
                        ? "oklch(0.16 0.05 220)"
                        : "oklch(0.55 0.18 200 / 0.15)",
                    color: "oklch(0.88 0.02 220)",
                    border: `1px solid ${
                      msg.role === "assistant"
                        ? "oklch(0.22 0.05 210 / 0.4)"
                        : "oklch(0.55 0.18 200 / 0.25)"
                    }`,
                    borderTopRightRadius: msg.role === "user" ? "6px" : "16px",
                    borderTopLeftRadius: msg.role === "assistant" ? "6px" : "16px",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "oklch(0.65 0.18 200 / 0.15)" }}
                >
                  <Bot size={14} style={{ color: "oklch(0.65 0.18 200)" }} />
                </div>
                <div
                  className="rounded-2xl px-4 py-3 flex items-center gap-2"
                  style={{
                    background: "oklch(0.16 0.05 220)",
                    border: "1px solid oklch(0.22 0.05 210 / 0.4)",
                  }}
                >
                  <Loader2
                    size={14}
                    className="animate-spin"
                    style={{ color: "oklch(0.65 0.18 200)" }}
                  />
                  <span className="text-xs" style={{ color: "oklch(0.50 0.06 210)" }}>
                    يكتب...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions for first time */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {(isAdmin
                ? [
                    "كم عدد المناديب النشطين؟",
                    "إحصائيات اليوم",
                    "المناديب بانتظار التفعيل",
                  ]
                : [
                    "كم عدد طلباتي؟",
                    "حالة حسابي",
                    "كيف أرفع شكوى؟",
                  ]
              ).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInput(s);
                    setTimeout(() => sendMessage(), 50);
                  }}
                  className="px-3 py-1.5 rounded-full text-xs transition-colors"
                  style={{
                    background: "oklch(0.65 0.18 200 / 0.10)",
                    color: "oklch(0.65 0.18 200)",
                    border: "1px solid oklch(0.65 0.18 200 / 0.20)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "oklch(0.65 0.18 200 / 0.20)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "oklch(0.65 0.18 200 / 0.10)";
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div
            className="shrink-0 px-3 py-3"
            style={{
              borderTop: "1px solid oklch(0.22 0.05 210 / 0.5)",
              background: "oklch(0.12 0.06 220)",
            }}
          >
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{
                background: "oklch(0.16 0.05 220)",
                border: "1px solid oklch(0.25 0.05 210 / 0.4)",
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب رسالتك..."
                disabled={loading}
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-blue-300/30"
                style={{ color: "oklch(0.88 0.02 220)" }}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                style={{
                  background: input.trim() ? "oklch(0.65 0.18 200)" : "transparent",
                }}
              >
                <Send
                  size={15}
                  className={input.trim() ? "text-white -rotate-90" : ""}
                  style={{ color: input.trim() ? "white" : "oklch(0.40 0.06 210)" }}
                />
              </button>
            </div>
            <p
              className="text-center mt-1.5 text-[9px]"
              style={{ color: "oklch(0.35 0.04 210)" }}
            >
              مدعوم بالذكاء الاصطناعي من Anthropic
            </p>
          </div>
        </div>
      )}
    </>
  );
}
