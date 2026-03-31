import { useEffect, useRef, useState, useCallback } from "react";
import { Bot, Send, X, Sparkles, Loader2, RefreshCw, WifiOff } from "lucide-react";
import { useAuth } from "@/lib/admin/auth";
import { supabase } from "@/lib/supabase";

const CHAT_API_URL = "https://agr6khtuu9.execute-api.us-east-1.amazonaws.com/ai/chat";
const ALLOWED_DEPARTMENTS = ["finance", "operations", "supervisors", "fleet", "hr", "المالية", "التشغيل", "المشرفين", "المركبات", "الموارد البشرية"];
const MAX_RETRIES = 2;
const RETRY_DELAY = 1500;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

export function AdminAiAssistant() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [input, setInput] = useState("");
  const [apiStatus, setApiStatus] = useState<"online" | "offline" | "unknown">("unknown");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "مرحبًا، أنا مساعد FLL السحابي. أستطيع مساعدتك في التشغيل والمالية والموارد البشرية وتحليل البيانات." },
  ]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    async function checkAccess() {
      if (!user) return;
      if (user.role === "admin" || user.role === "owner") {
        if (active) setAllowed(true);
        return;
      }
      if (user.role !== "staff" || !supabase) {
        if (active) setAllowed(false);
        return;
      }
      const { data } = await supabase
        .from("staff_profiles")
        .select("departments(name_ar)")
        .eq("user_id", user.id)
        .single();
      const dept = user.department_name || (data as any)?.departments?.name || (data as any)?.departments?.name_ar || "";
      const hasOpsPermission = Boolean(user.permissions?.finance || user.permissions?.orders || user.permissions?.reports || user.permissions?.couriers || user.permissions?.complaints || user.permissions?.excel);
      if (active) setAllowed(ALLOWED_DEPARTMENTS.includes(dept) || hasOpsPermission);
    }
    checkAccess();
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  // Check API health when chat opens
  useEffect(() => {
    if (!open || apiStatus !== "unknown") return;
    fetch(CHAT_API_URL, { method: "OPTIONS" })
      .then((r) => setApiStatus(r.ok || r.status === 204 ? "online" : "offline"))
      .catch(() => setApiStatus("offline"));
  }, [open, apiStatus]);

  const fetchWithRetry = useCallback(async (payload: object, retries = MAX_RETRIES): Promise<{ reply?: string; error?: boolean }> => {
    try {
      const res = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 500 && retries > 0) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY));
        return fetchWithRetry(payload, retries - 1);
      }
      const data = await res.json().catch(() => ({}));
      if (data.reply) {
        setApiStatus("online");
        return { reply: data.reply };
      }
      setApiStatus("offline");
      return { reply: "خدمة المساعد الذكي غير متاحة حالياً. يرجى المحاولة لاحقاً أو التواصل مع الدعم على support@fll.sa", error: true };
    } catch {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY));
        return fetchWithRetry(payload, retries - 1);
      }
      setApiStatus("offline");
      return { reply: "تعذر الاتصال بالمساعد السحابي. تحقق من اتصال الإنترنت أو حاول مرة أخرى.", error: true };
    }
  }, []);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    const nextMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    const result = await fetchWithRetry({
      message: text,
      history: nextMessages.filter((m) => !m.error).map((m) => ({ role: m.role, content: m.content })),
      source: "admin-console",
      role: user?.role,
      user_id: user?.id,
    });
    setMessages((prev) => [...prev, { role: "assistant", content: result.reply || "تعذر الحصول على رد.", error: result.error }]);
    setLoading(false);
  }

  function retryLastMessage() {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return;
    // Remove the last error response
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      return last?.error ? prev.slice(0, -1) : prev;
    });
    setApiStatus("unknown");
    setInput(lastUserMsg.content);
    setTimeout(() => sendMessage(), 100);
  }

  if (!allowed) return null;

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed",
          left: 22,
          bottom: 22,
          zIndex: 90,
          width: 58,
          height: 58,
          borderRadius: "50%",
          border: "1px solid var(--con-border-brand)",
          background: "linear-gradient(135deg, var(--con-brand), #0891b2)",
          color: "#08111b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 12px 30px rgba(14,212,197,0.22)",
          cursor: "pointer",
        }}
        title="المساعد السحابي"
      >
        <Bot size={24} />
      </button>

      {open && (
        <div
          dir="rtl"
          style={{
            position: "fixed",
            left: 22,
            bottom: 92,
            zIndex: 90,
            width: 390,
            maxWidth: "calc(100vw - 32px)",
            height: 560,
            background: "var(--con-bg-surface-1)",
            border: "1px solid var(--con-border-strong)",
            borderRadius: 18,
            boxShadow: "var(--con-shadow-overlay)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--con-border-default)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg, rgba(14,212,197,0.12), rgba(8,17,27,0.4))" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--con-brand-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--con-brand)" }}>
                <Sparkles size={16} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--con-text-primary)" }}>FLL Cloud Chat</span>
                  <span style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: apiStatus === "online" ? "var(--con-success)" : apiStatus === "offline" ? "var(--con-danger)" : "var(--con-warning)",
                    display: "inline-block",
                  }} />
                </div>
                <div style={{ fontSize: 11, color: "var(--con-text-muted)" }}>
                  {apiStatus === "offline" ? "الخدمة غير متاحة حالياً" : "متاح للإدارة والمالية والتشغيل والموارد"}
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", color: "var(--con-text-muted)", cursor: "pointer" }}><X size={18} /></button>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {apiStatus === "offline" && (
              <div style={{
                background: "var(--con-danger-subtle)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, fontSize: 12,
              }}>
                <WifiOff size={14} style={{ color: "var(--con-danger)", flexShrink: 0 }} />
                <span style={{ color: "var(--con-text-secondary)", flex: 1 }}>خدمة الذكاء الاصطناعي غير متاحة مؤقتاً</span>
                <button
                  onClick={() => setApiStatus("unknown")}
                  style={{ background: "transparent", border: "none", color: "var(--con-brand)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600 }}
                >
                  <RefreshCw size={11} /> إعادة المحاولة
                </button>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} style={{ alignSelf: msg.role === "user" ? "flex-start" : "stretch", display: "flex", justifyContent: msg.role === "user" ? "flex-start" : "flex-end" }}>
                <div style={{
                  maxWidth: "88%",
                  background: msg.error ? "var(--con-danger-subtle)" : msg.role === "user" ? "var(--con-bg-elevated)" : "var(--con-brand-subtle)",
                  border: `1px solid ${msg.error ? "rgba(239,68,68,0.2)" : msg.role === "user" ? "var(--con-border-default)" : "var(--con-border-brand)"}`,
                  color: msg.role === "user" ? "var(--con-text-primary)" : "var(--con-text-secondary)",
                  padding: "10px 12px", borderRadius: 14, fontSize: 13, lineHeight: 1.8, whiteSpace: "pre-wrap",
                }}>
                  {msg.content}
                  {msg.error && (
                    <button
                      onClick={retryLastMessage}
                      style={{
                        display: "flex", alignItems: "center", gap: 4, marginTop: 8,
                        background: "transparent", border: "1px solid var(--con-border-default)",
                        borderRadius: 8, padding: "4px 10px", cursor: "pointer",
                        color: "var(--con-brand)", fontSize: 11, fontWeight: 600,
                      }}
                    >
                      <RefreshCw size={11} /> إعادة المحاولة
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ background: "var(--con-brand-subtle)", border: "1px solid var(--con-border-brand)", padding: "10px 12px", borderRadius: 14, color: "var(--con-text-muted)", display: "flex", alignItems: "center", gap: 8 }}>
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> جاري التفكير...
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: 12, borderTop: "1px solid var(--con-border-default)", display: "flex", gap: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              className="con-input"
              placeholder="اكتب طلبك هنا..."
              style={{ flex: 1 }}
            />
            <button className="con-btn-primary" onClick={sendMessage} disabled={loading || !input.trim()} style={{ padding: "0.5rem 0.8rem" }}>
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
