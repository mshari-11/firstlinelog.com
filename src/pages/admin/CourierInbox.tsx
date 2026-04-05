/**
 * بوابة التواصل — Courier Inbox / Internal Messaging
 * نظام المراسلات الداخلية بين الإدارة والمناديب
 */
import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Search,
  Star,
  RefreshCw,
  Mail,
  MailOpen,
  MessageCircle,
} from "lucide-react";
import {
  PageWrapper,
  PageHeader,
  KPIGrid,
  KPICard,
  Card,
  Toolbar,
  Tabs,
  Button,
} from "@/components/admin/ui";
import { supabase } from "@/lib/supabase";

// ── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  sender: "admin" | "courier";
  text: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  courier_id: string;
  courier_name: string;
  messages: Message[];
  unread_count: number;
  is_important: boolean;
  last_activity: string;
}

// ── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv1",
    courier_id: "C001",
    courier_name: "أحمد العتيبي",
    unread_count: 2,
    is_important: true,
    last_activity: "2026-04-05T14:30:00",
    messages: [
      { id: "m1", sender: "courier", text: "السلام عليكم، أحتاج تحديث بيانات الحساب البنكي", timestamp: "2026-04-05T14:00:00" },
      { id: "m2", sender: "admin", text: "وعليكم السلام، تفضل أرسل البيانات الجديدة", timestamp: "2026-04-05T14:10:00" },
      { id: "m3", sender: "courier", text: "IBAN: SA02 8000 0000 6080 1016 7519", timestamp: "2026-04-05T14:15:00" },
      { id: "m4", sender: "courier", text: "الاسم: أحمد محمد العتيبي - بنك الراجحي", timestamp: "2026-04-05T14:16:00" },
      { id: "m5", sender: "admin", text: "تم استلام البيانات، سيتم التحديث خلال 24 ساعة", timestamp: "2026-04-05T14:30:00" },
    ],
  },
  {
    id: "conv2",
    courier_id: "C002",
    courier_name: "فهد القحطاني",
    unread_count: 1,
    is_important: false,
    last_activity: "2026-04-05T12:00:00",
    messages: [
      { id: "m6", sender: "admin", text: "فهد، تم ترقيتك لمندوب VIP ابتداءً من اليوم", timestamp: "2026-04-05T10:00:00" },
      { id: "m7", sender: "courier", text: "شكراً جزيلاً! ما المزايا الجديدة؟", timestamp: "2026-04-05T10:30:00" },
      { id: "m8", sender: "admin", text: "أولوية في الطلبات + بونص 10% على كل طلب", timestamp: "2026-04-05T11:00:00" },
      { id: "m9", sender: "courier", text: "ممتاز! جزاكم الله خير", timestamp: "2026-04-05T12:00:00" },
    ],
  },
  {
    id: "conv3",
    courier_id: "C003",
    courier_name: "سعد الدوسري",
    unread_count: 0,
    is_important: false,
    last_activity: "2026-04-04T16:45:00",
    messages: [
      { id: "m10", sender: "courier", text: "متى موعد صرف الرواتب هذا الشهر؟", timestamp: "2026-04-04T15:00:00" },
      { id: "m11", sender: "admin", text: "يوم 28 من كل شهر كالعادة", timestamp: "2026-04-04T15:30:00" },
      { id: "m12", sender: "courier", text: "تمام، شكراً", timestamp: "2026-04-04T16:45:00" },
    ],
  },
  {
    id: "conv4",
    courier_id: "C006",
    courier_name: "عمر المالكي",
    unread_count: 3,
    is_important: true,
    last_activity: "2026-04-05T09:20:00",
    messages: [
      { id: "m13", sender: "admin", text: "عمر، لديك إنذار بسبب تأخيرات متكررة الأسبوع الماضي", timestamp: "2026-04-04T08:00:00" },
      { id: "m14", sender: "courier", text: "عذراً، كانت السيارة في الصيانة", timestamp: "2026-04-04T09:00:00" },
      { id: "m15", sender: "admin", text: "يرجى إحضار إثبات من الورشة", timestamp: "2026-04-04T10:00:00" },
      { id: "m16", sender: "courier", text: "سأرسل الفاتورة اليوم", timestamp: "2026-04-05T09:00:00" },
      { id: "m17", sender: "courier", text: "هل يمكن رفع الإنذار بعد تقديم الإثبات؟", timestamp: "2026-04-05T09:10:00" },
      { id: "m18", sender: "courier", text: "أرسلت صورة الفاتورة على الإيميل", timestamp: "2026-04-05T09:20:00" },
    ],
  },
  {
    id: "conv5",
    courier_id: "C005",
    courier_name: "محمد الشهري",
    unread_count: 0,
    is_important: false,
    last_activity: "2026-04-03T18:00:00",
    messages: [
      { id: "m19", sender: "courier", text: "أبي أطلب إجازة يوم الخميس القادم", timestamp: "2026-04-03T14:00:00" },
      { id: "m20", sender: "admin", text: "تم الموافقة على طلب الإجازة", timestamp: "2026-04-03T16:00:00" },
      { id: "m21", sender: "courier", text: "شكراً لكم", timestamp: "2026-04-03T18:00:00" },
    ],
  },
];

export default function CourierInbox() {
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [selectedId, setSelectedId] = useState<string>(MOCK_CONVERSATIONS[0].id);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selected = conversations.find((c) => c.id === selectedId);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (!supabase) throw new Error("no supabase");
      const { data: rows } = await supabase
        .from("courier_conversations")
        .select("*")
        .order("last_activity", { ascending: false });
      if (rows?.length) setConversations(rows);
    } catch {
      // keep mock data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages.length, selectedId]);

  // ── Filters ──────────────────────────────────────────────────────────────
  const filtered = conversations.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.courier_name.includes(q);
    if (filter === "unread") return matchSearch && c.unread_count > 0;
    if (filter === "important") return matchSearch && c.is_important;
    return matchSearch;
  });

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const today = new Date().toISOString().split("T")[0];
  const todayMessages = conversations.reduce(
    (s, c) => s + c.messages.filter((m) => m.timestamp.startsWith(today)).length,
    0
  );
  const totalUnread = conversations.reduce((s, c) => s + c.unread_count, 0);
  const activeConvs = conversations.filter((c) => {
    const lastMsg = c.messages[c.messages.length - 1];
    const diff = Date.now() - new Date(lastMsg.timestamp).getTime();
    return diff < 48 * 60 * 60 * 1000; // 48 hours
  }).length;

  function sendMessage() {
    if (!newMessage.trim() || !selected) return;
    const msg: Message = {
      id: `m${Date.now()}`,
      sender: "admin",
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selected.id
          ? { ...c, messages: [...c.messages, msg], last_activity: msg.timestamp }
          : c
      )
    );
    setNewMessage("");
  }

  function toggleImportant(convId: string) {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, is_important: !c.is_important } : c))
    );
  }

  function selectConversation(convId: string) {
    setSelectedId(convId);
    // Mark as read
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c))
    );
  }

  function formatTime(ts: string): string {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "var(--con-radius)",
    border: "1px solid var(--con-border)",
    background: "var(--con-bg-input)",
    color: "var(--con-text-primary)",
    fontSize: 13,
    fontFamily: "var(--con-font-primary)",
    outline: "none",
  };

  return (
    <PageWrapper>
      <PageHeader
        icon={MessageSquare}
        title="بوابة التواصل"
        subtitle="نظام المراسلات الداخلية مع المناديب"
        actions={
          <Button onClick={fetchData} variant="ghost" icon={RefreshCw} loading={loading}>
            تحديث
          </Button>
        }
      />

      {/* ── KPIs ── */}
      <KPIGrid>
        <KPICard label="رسائل اليوم" value={todayMessages} icon={Mail} accent="var(--con-brand)" />
        <KPICard label="غير مقروءة" value={totalUnread} icon={MailOpen} accent="var(--con-danger)" />
        <KPICard label="محادثات نشطة" value={activeConvs} icon={MessageCircle} accent="var(--con-success)" />
      </KPIGrid>

      {/* ── Chat Layout ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: 12,
          height: "calc(100vh - 380px)",
          minHeight: 500,
        }}
      >
        {/* ── Left Panel: Conversation List ── */}
        <Card style={{ display: "flex", flexDirection: "column", overflow: "hidden", padding: 0 }}>
          {/* Search + Filter */}
          <div style={{ padding: 12, borderBottom: "1px solid var(--con-border)" }}>
            <div style={{ position: "relative", marginBottom: 8 }}>
              <Search
                size={14}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--con-text-muted)" }}
              />
              <input
                placeholder="بحث في المحادثات..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...inputStyle, paddingRight: 32, fontSize: 12 }}
              />
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {[
                { key: "all", label: "الكل" },
                { key: "unread", label: "غير مقروء" },
                { key: "important", label: "مهم" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    flex: 1,
                    padding: "5px 8px",
                    fontSize: 11,
                    fontWeight: 600,
                    border: "1px solid var(--con-border)",
                    borderRadius: "var(--con-radius)",
                    background: filter === f.key ? "var(--con-brand)" : "transparent",
                    color: filter === f.key ? "#fff" : "var(--con-text-secondary)",
                    cursor: "pointer",
                    fontFamily: "var(--con-font-primary)",
                    transition: "all 0.15s",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Items */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--con-text-muted)", fontSize: 12 }}>
                لا توجد محادثات
              </div>
            ) : (
              filtered.map((c) => {
                const lastMsg = c.messages[c.messages.length - 1];
                const isSelected = c.id === selectedId;
                return (
                  <div
                    key={c.id}
                    onClick={() => selectConversation(c.id)}
                    style={{
                      padding: "12px 14px",
                      borderBottom: "1px solid var(--con-border)",
                      cursor: "pointer",
                      background: isSelected ? "var(--con-brand-subtle)" : "transparent",
                      transition: "background 0.15s",
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                    }}
                  >
                    {/* Avatar circle */}
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: isSelected ? "var(--con-brand)" : "var(--con-border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        color: isSelected ? "#fff" : "var(--con-text-secondary)",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      {c.courier_name.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: "var(--con-text-primary)" }}>
                          {c.courier_name}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {c.is_important && <Star size={12} style={{ color: "var(--con-warning)", fill: "var(--con-warning)" }} />}
                          {c.unread_count > 0 && (
                            <span
                              style={{
                                background: "var(--con-danger)",
                                color: "#fff",
                                fontSize: 10,
                                fontWeight: 700,
                                borderRadius: 10,
                                padding: "1px 6px",
                                minWidth: 18,
                                textAlign: "center",
                              }}
                            >
                              {c.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span
                          style={{
                            fontSize: 11,
                            color: c.unread_count > 0 ? "var(--con-text-primary)" : "var(--con-text-muted)",
                            fontWeight: c.unread_count > 0 ? 600 : 400,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 170,
                            display: "block",
                          }}
                        >
                          {lastMsg.sender === "admin" ? "أنت: " : ""}{lastMsg.text}
                        </span>
                        <span style={{ fontSize: 10, color: "var(--con-text-muted)", whiteSpace: "nowrap", marginRight: 4 }}>
                          {formatTime(lastMsg.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* ── Right Panel: Message Thread ── */}
        <Card style={{ display: "flex", flexDirection: "column", overflow: "hidden", padding: 0 }}>
          {selected ? (
            <>
              {/* Thread Header */}
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--con-border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "var(--con-brand)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    {selected.courier_name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--con-text-primary)" }}>
                      {selected.courier_name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--con-text-muted)" }}>
                      {selected.courier_id}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleImportant(selected.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    display: "flex",
                    alignItems: "center",
                  }}
                  title={selected.is_important ? "إزالة من المهم" : "تحديد كمهم"}
                >
                  <Star
                    size={18}
                    style={{
                      color: selected.is_important ? "var(--con-warning)" : "var(--con-text-muted)",
                      fill: selected.is_important ? "var(--con-warning)" : "none",
                      transition: "all 0.15s",
                    }}
                  />
                </button>
              </div>

              {/* Messages */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {selected.messages.map((msg) => {
                  const isAdmin = msg.sender === "admin";
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        justifyContent: isAdmin ? "flex-start" : "flex-end",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "70%",
                          padding: "8px 14px",
                          borderRadius: 12,
                          borderTopLeftRadius: isAdmin ? 4 : 12,
                          borderTopRightRadius: isAdmin ? 12 : 4,
                          background: isAdmin ? "var(--con-brand)" : "var(--con-bg-card-hover, rgba(255,255,255,0.06))",
                          color: isAdmin ? "#fff" : "var(--con-text-primary)",
                          fontSize: 13,
                          lineHeight: 1.6,
                        }}
                      >
                        <div>{msg.text}</div>
                        <div
                          style={{
                            fontSize: 10,
                            color: isAdmin ? "rgba(255,255,255,0.6)" : "var(--con-text-muted)",
                            marginTop: 4,
                            textAlign: isAdmin ? "left" : "right",
                          }}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Send Input */}
              <div
                style={{
                  padding: "10px 14px",
                  borderTop: "1px solid var(--con-border)",
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="اكتب رسالة..."
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "var(--con-radius)",
                    border: "none",
                    background: newMessage.trim() ? "var(--con-brand)" : "var(--con-border)",
                    color: "#fff",
                    cursor: newMessage.trim() ? "pointer" : "default",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s",
                    flexShrink: 0,
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--con-text-muted)",
                fontSize: 14,
              }}
            >
              اختر محادثة للبدء
            </div>
          )}
        </Card>
      </div>
    </PageWrapper>
  );
}
