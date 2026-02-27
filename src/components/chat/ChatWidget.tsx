/**
 * Chat Widget - مساعد فيرست لاين الذكي
 * يظهر كفقاعة في أسفل الشاشة بعد تسجيل الدخول
 * متاح فقط للأدوار الإدارية: admin, owner, staff, finance, hr, operations
 * لا يظهر لصفحات المندوبين والسائقين (courier)
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from "lucide-react";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

// الأدوار المسموح لها باستخدام المساعد الذكي
type AdminRole = "admin" | "owner" | "staff" | "finance" | "hr" | "operations";
type CourierRole = "courier" | "driver";

interface ChatWidgetProps {
    userRole: AdminRole | CourierRole | string;
    userId: string;
    userName?: string;
}

// الأدوار الإدارية المصرح لها
const ADMIN_ROLES: string[] = ["admin", "owner", "staff", "finance", "hr", "operations"];

export default function ChatWidget({ userRole, userId, userName }: ChatWidgetProps) {
    // إخفاء المساعد تماماً للمندوبين والسائقين
  if (!ADMIN_ROLES.includes(userRole)) {
        return null;
  }

  const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [hasNewMessage, setHasNewMessage] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

  // رسالة الترحيب عند أول فتح
  useEffect(() => {
        if (open && messages.length === 0) {
                const welcome: Message = {
                          id: "welcome",
                          role: "assistant",
                          content: `أهلاً ${userName || ""}! أنا مساعد فيرست لاين الذكي. أقدر أساعدك في مراجعة الإحصائيات، تحليل البيانات، أو أي استفسار عن النظام. كيف أقدر أخدمك؟`,
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
        const trimmed = input.trim();
        if (!trimmed || loading) return;

                                      const userMsg: Message = {
                                              id: Date.now().toString(),
                                              role: "user",
                                              content: trimmed,
                                              timestamp: new Date(),
                                      };

                                      setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

                                      try {
                                              // إرسال الرسالة إلى API مع userRole للتحقق من الصلاحيات
          const response = await fetch("/api/ai-chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                                messages: [...messages, userMsg]
                                  .filter((m) => m.id !== "welcome")
                                  .map((m) => ({ role: m.role, content: m.content })),
                                userRole,
                                userId,
                    }),
          });

          if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
          }

          const data = await response.json();

          const assistantMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: data.message || "عذراً، لم أتمكن من معالجة طلبك.",
                    timestamp: new Date(),
          };

          setMessages((prev) => [...prev, assistantMsg]);
                                              if (!open) setHasNewMessage(true);
                                      } catch (error) {
                                              console.error("Chat error:", error);
                                              const errorMsg: Message = {
                                                        id: (Date.now() + 1).toString(),
                                                        role: "assistant",
                                                        content: "عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.",
                                                        timestamp: new Date(),
                                              };
                                              setMessages((prev) => [...prev, errorMsg]);
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

  return (
        <div className="fixed bottom-6 left-6 z-50" dir="rtl">
          {/* نافذة الدردشة */}
          {open && (
                  <div
                              className="mb-4 w-96 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                              style={{
                                            background: "oklch(0.13 0.08 240)",
                                            border: "1px solid oklch(0.25 0.08 240)",
                                            height: "480px",
                              }}
                            >
                    {/* رأس النافذة */}
                            <div
                                          className="flex items-center justify-between px-4 py-3"
                                          style={{ background: "oklch(0.18 0.12 240)" }}
                                        >
                                        <div className="flex items-center gap-2">
                                                      <div
                                                                        className="w-8 h-8 rounded-full flex items-center justify-center"
                                                                        style={{ background: "oklch(0.65 0.18 200)" }}
                                                                      >
                                                                      <Sparkles className="w-4 h-4 text-white" />
                                                      </div>
                                                      <div>
                                                                      <p className="text-sm font-semibold text-white">مساعد فيرست لاين</p>
                                                                      <p className="text-xs" style={{ color: "oklch(0.65 0.08 200)" }}>
                                                                                        مدعوم بـ GPT-5
                                                                      </p>
                                                      </div>
                                        </div>
                                        <button
                                                        onClick={() => setOpen(false)}
                                                        className="p-1.5 rounded-lg transition-colors hover:opacity-80"
                                                        style={{ color: "oklch(0.55 0.06 210)" }}
                                                      >
                                                      <X className="w-4 h-4" />
                                        </button>
                            </div>
                  
                    {/* منطقة الرسائل */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                              {messages.map((msg) => (
                                            <div
                                                              key={msg.id}
                                                              className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                                                            >
                                                            <div
                                                                                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                                                                                style={{
                                                                                                      background:
                                                                                                                              msg.role === "assistant"
                                                                                                                                ? "oklch(0.65 0.18 200)"
                                                                                                                                : "oklch(0.45 0.12 240)",
                                                                                }}
                                                                              >
                                                              {msg.role === "assistant" ? (
                                                                                                    <Bot className="w-4 h-4 text-white" />
                                                                                                  ) : (
                                                                                                    <User className="w-4 h-4 text-white" />
                                                                                                  )}
                                                            </div>
                                                            <div
                                                                                className="max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed"
                                                                                style={{
                                                                                                      background:
                                                                                                                              msg.role === "assistant"
                                                                                                                                ? "oklch(0.20 0.08 240)"
                                                                                                                                : "oklch(0.55 0.18 200)",
                                                                                                      color: "oklch(0.90 0.03 220)",
                                                                                                      borderRadius:
                                                                                                                              msg.role === "assistant"
                                                                                                                                ? "4px 16px 16px 16px"
                                                                                                                                : "16px 4px 16px 16px",
                                                                                }}
                                                                              >
                                                              {msg.content}
                                                            </div>
                                            </div>
                                          ))}
                            
                              {loading && (
                                            <div className="flex gap-2 flex-row">
                                                            <div
                                                                                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                                                                                style={{ background: "oklch(0.65 0.18 200)" }}
                                                                              >
                                                                              <Bot className="w-4 h-4 text-white" />
                                                            </div>
                                                            <div
                                                                                className="rounded-2xl px-3 py-2"
                                                                                style={{ background: "oklch(0.20 0.08 240)" }}
                                                                              >
                                                                              <Loader2
                                                                                                    className="w-4 h-4 animate-spin"
                                                                                                    style={{ color: "oklch(0.65 0.18 200)" }}
                                                                                                  />
                                                            </div>
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                            </div>
                  
                    {/* منطقة الإدخال */}
                            <div
                                          className="p-3"
                                          style={{ borderTop: "1px solid oklch(0.22 0.08 240)" }}
                                        >
                                        <div
                                                        className="flex items-center gap-2 rounded-xl px-3 py-2"
                                                        style={{ background: "oklch(0.18 0.08 240)" }}
                                                      >
                                                      <input
                                                                        ref={inputRef}
                                                                        type="text"
                                                                        value={input}
                                                                        onChange={(e) => setInput(e.target.value)}
                                                                        onKeyDown={handleKeyDown}
                                                                        placeholder="اكتب رسالتك..."
                                                                        className="flex-1 bg-transparent text-sm outline-none"
                                                                        style={{ color: "oklch(0.90 0.03 220)" }}
                                                                        disabled={loading}
                                                                      />
                                                      <button
                                                                        onClick={sendMessage}
                                                                        disabled={!input.trim() || loading}
                                                                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                                                                        style={{
                                                                                            background: input.trim() && !loading ? "oklch(0.65 0.18 200)" : "oklch(0.30 0.05 240)",
                                                                                            cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                                                                        }}
                                                                      >
                                                                      <Send className="w-3.5 h-3.5 text-white" />
                                                      </button>
                                        </div>
                            </div>
                  </div>
              )}
        
          {/* زر الفتح */}
              <button
                        onClick={() => setOpen(!open)}
                        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center relative transition-transform hover:scale-105"
                        style={{ background: "oklch(0.65 0.18 200)" }}
                      >
                {open ? (
                                  <X className="w-6 h-6 text-white" />
                                ) : (
                                  <MessageCircle className="w-6 h-6 text-white" />
                                )}
                {hasNewMessage && !open && (
                                  <span
                                                className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                                style={{ background: "oklch(0.65 0.18 30)" }}
                                              >
                                              !
                                  </span>
                      )}
              </button>
        </div>
      );
}</div>
