/**
 * صفحة تكاملات المنصات — Marketplace Integrations
 * إدارة تكاملات المنصات الخارجية عبر Lambda marketplace-integrations
 */
import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Link2,
  Plug,
  Activity,
  Settings,
  Plus,
  X,
  Save,
} from "lucide-react";
import { API_BASE } from "@/lib/api";
import { supabase } from "@/lib/supabase";

interface Integration {
  id: string;
  name: string;
  platform: string;
  status: "active" | "inactive" | "error" | "pending";
  webhook_url?: string;
  api_key_masked?: string;
  last_sync?: string;
  total_orders?: number;
  error_message?: string;
}

interface SyncLog {
  id: string;
  platform: string;
  event_type: string;
  status: "success" | "error";
  records: number;
  created_at: string;
}

const PLATFORM_LOGOS: Record<string, string> = {
  hungerstation: "/images/partners/hungerstation.png",
  jahez: "/images/partners/jahez.png",
  marsool: "",
  keeta: "/images/partners/keeta.jpg",
  ninja: "/images/partners/ninja.png",
  keeta_mart: "/images/partners/keeta-small.jpg",
  wasfaty: "",
  toyou: "/images/partners/toyou.png",
  the_chefs: "/images/partners/thechefz.webp",
  noon: "",
  amazon: "/images/partners/amazon.jpg",
  custom: "",
};

function PlatformLogo({ platform, size = 28 }: { platform: string; size?: number }) {
  const src = PLATFORM_LOGOS[platform];
  if (src) {
    return <img src={src} alt={platform} style={{ width: size, height: size, borderRadius: 6, objectFit: "cover" }} />;
  }
  const fallback: Record<string, string> = { marsool: "🛵", wasfaty: "💊", noon: "🛒", custom: "🔗" };
  return <span style={{ fontSize: size * 0.7 }}>{fallback[platform] || "🔗"}</span>;
}

const STATUS_MAP = {
  active: { label: "نشط", cls: "con-badge-success" },
  inactive: { label: "غير نشط", cls: "con-badge-warning" },
  error: { label: "خطأ", cls: "con-badge-danger" },
  pending: { label: "قيد الربط", cls: "con-badge-info" },
};

// ─── Platform Integration Guide ──────────────────────────────────────────────

interface PlatformGuide {
  key: string;
  name: string;
  icon: string;
  color: string;
  steps: string[];
  apiType: string;
  docsUrl?: string;
}

const PLATFORM_GUIDES: PlatformGuide[] = [
  {
    key: "hungerstation", name: "هنقرستيشن", icon: "🍔", color: "#ff6b00",
    apiType: "Webhook + REST API",
    steps: [
      "سجّل دخول في لوحة تحكم هنقرستيشن للشركاء (Vendor Portal)",
      "اذهب إلى Settings → API & Integrations",
      "أنشئ API Key جديد وانسخه",
      "في صفحة الربط هنا، اضغط \"إضافة تكامل\" واختر هنقرستيشن",
      "الصق API Key واضغط حفظ",
      "فعّل Webhook URL في لوحة هنقرستيشن لاستقبال تحديثات الطلبات تلقائياً",
    ],
  },
  {
    key: "jahez", name: "جاهز", icon: "🍕", color: "#e53e3e",
    apiType: "Saned API + Token Relay",
    steps: [
      "ادخل على بوابة ساند (gateway.saned.io) بحساب المزوّد",
      "بعد تسجيل الدخول، التوكن يُحفظ تلقائياً",
      "اذهب لصفحة \"جاهز\" في لوحة التحكم واضغط \"ربط بساند\"",
      "الصق التوكن أو سيتم التقاطه تلقائياً من الرابط",
      "البيانات تتزامن عبر Supabase Edge Function كـ proxy",
      "Lambda يسحب البيانات كل 15 دقيقة تلقائياً طالما التوكن صالح",
    ],
  },
  {
    key: "marsool", name: "مرسول", icon: "🛵", color: "#805ad5",
    apiType: "REST API",
    steps: [
      "تواصل مع فريق مرسول للحصول على بيانات API (Partner API)",
      "ستحصل على Client ID + Client Secret",
      "أضف التكامل هنا واملأ البيانات",
      "فعّل المزامنة لسحب الطلبات",
    ],
  },
  {
    key: "keeta", name: "كيتا", icon: "🏍", color: "#00c853",
    apiType: "REST API / Dashboard Export",
    steps: [
      "سجّل دخول في لوحة تحكم كيتا للمزوّدين",
      "اذهب إلى إعدادات API",
      "أنشئ مفتاح API وانسخه",
      "أضف التكامل هنا والصق المفتاح",
      "بديل: صدّر الطلبات كـ CSV من لوحة كيتا واستوردها هنا",
    ],
  },
  {
    key: "ninja", name: "نينجا", icon: "⚡", color: "#e91e63",
    apiType: "REST API",
    steps: [
      "تواصل مع Ninja Van للحصول على API credentials",
      "ستحصل على API Key + Webhook Secret",
      "أضف التكامل والصق البيانات",
      "فعّل Webhook لاستقبال تحديثات التتبع مباشرة",
    ],
  },
  {
    key: "keeta_mart", name: "كيتا مارت", icon: "🛒", color: "#00e676",
    apiType: "REST API / Dashboard Export",
    steps: [
      "نفس خطوات كيتا — استخدم نفس بيانات API",
      "حدد نوع الطلبات: كيتا مارت (بقالة/سوبرماركت)",
      "الطلبات تُصنّف تلقائياً حسب النوع",
    ],
  },
  {
    key: "wasfaty", name: "وصفتي", icon: "💊", color: "#ff9800",
    apiType: "REST API / Manual Import",
    steps: [
      "سجّل دخول في نظام وصفتي للمزوّدين",
      "اطلب تفعيل API من الدعم الفني",
      "أضف بيانات الربط هنا",
      "بديل: استورد الطلبات يدوياً من ملف Excel/CSV",
    ],
  },
  {
    key: "toyou", name: "تويو", icon: "📦", color: "#0abab5",
    apiType: "Odoo XML-RPC",
    steps: [
      "ادخل على نظام Odoo الخاص بتويو",
      "اذهب لصفحة \"تويو\" في لوحة التحكم",
      "اضغط إعدادات وأدخل: Server URL + Database + Username + API Key",
      "اضغط \"اختبار الاتصال\" للتأكد",
      "فعّل المزامنة — البيانات تُسحب عبر Odoo XML-RPC",
    ],
  },
  {
    key: "the_chefs", name: "ذا شيفز", icon: "👨‍🍳", color: "#8d6e63",
    apiType: "REST API / Manual Import",
    steps: [
      "تواصل مع فريق ذا شيفز للحصول على API access",
      "أضف بيانات الربط (API Key + Endpoint)",
      "بديل: صدّر الطلبات من لوحة ذا شيفز واستوردها كـ CSV",
    ],
  },
  {
    key: "noon", name: "نون", icon: "🛒", color: "#f6e05e",
    apiType: "Seller API",
    steps: [
      "سجّل دخول في Noon Seller Center",
      "اذهب إلى Settings → API Integration",
      "أنشئ API Key جديد",
      "أضف التكامل هنا والصق بيانات API",
      "فعّل Webhook لتحديثات الطلبات المباشرة",
    ],
  },
  {
    key: "amazon", name: "أمازون", icon: "📦", color: "#3182ce",
    apiType: "SP-API (Selling Partner)",
    steps: [
      "سجّل كـ Developer في Amazon Seller Central",
      "أنشئ تطبيق SP-API واحصل على credentials",
      "أضف: Client ID + Client Secret + Refresh Token",
      "فعّل المزامنة — الطلبات تُسحب عبر Amazon SP-API",
    ],
  },
];

export default function MarketplaceIntegrations() {
  const [integrations, setIntegrations] =
    useState<Integration[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"integrations" | "logs" | "guide">("integrations");
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newIntg, setNewIntg] = useState({
    name: "",
    platform: "custom",
    webhook_url: "",
    api_key: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/marketplace/integrations`);
      if (res.ok) {
        const d = await res.json();
        if (d.integrations?.length) setIntegrations(d.integrations);
        if (d.logs?.length) setLogs(d.logs);
      }
    } catch {
      /* keep mock */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function triggerSync(id: string) {
    setSyncing(id);
    try {
      await fetch(`${API_BASE}/api/marketplace/sync/${id}`, { method: "POST" });
      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, last_sync: new Date().toISOString() } : i,
        ),
      );
    } catch {
      /* ignore */
    } finally {
      setSyncing(null);
    }
  }

  async function toggleStatus(id: string, current: string) {
    const newStatus = current === "active" ? "inactive" : "active";
    try {
      await fetch(`${API_BASE}/api/marketplace/integrations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      /* ignore */
    }
    setIntegrations((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: newStatus as any } : i)),
    );
  }

  async function addIntegration() {
    if (!newIntg.name.trim() || !newIntg.platform) return;
    setSaving(true);
    const item: Integration = {
      id: "intg-" + Date.now(),
      name: newIntg.name.trim(),
      platform: newIntg.platform,
      status: "pending",
      webhook_url: newIntg.webhook_url || undefined,
      api_key_masked: newIntg.api_key
        ? newIntg.api_key.slice(0, 4) + "****"
        : undefined,
      total_orders: 0,
    };
    try {
      await fetch(`${API_BASE}/api/marketplace/integrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newIntg, id: item.id }),
      });
    } catch {
      /* save locally */
    }
    setIntegrations((prev) => [...prev, item]);
    setNewIntg({ name: "", platform: "custom", webhook_url: "", api_key: "" });
    setShowAdd(false);
    setSaving(false);
  }

  const activeCount = integrations.filter((i) => i.status === "active").length;
  const totalOrders = integrations.reduce(
    (s, i) => s + (i.total_orders || 0),
    0,
  );

  return (
    <div
      dir="rtl"
      style={{ padding: "1.5rem", fontFamily: "var(--con-font-arabic)" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--con-text-primary)",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Plug size={18} style={{ color: "var(--con-accent)" }} /> تكاملات
            المنصات
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "var(--con-text-muted)",
              margin: "4px 0 0",
            }}
          >
            إدارة ربط المنصات الخارجية وتدفق الطلبات
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setShowAdd(true)}
            className="con-btn-primary"
            style={{ gap: 6, fontSize: 12 }}
          >
            <Plus size={14} /> إضافة منصة
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="con-btn con-btn-ghost"
            style={{ gap: 6 }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />{" "}
            تحديث
          </button>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "0.75rem",
          marginBottom: "1.5rem",
        }}
      >
        {[
          {
            label: "المنصات المتصلة",
            value: integrations.length,
            color: "var(--con-text-secondary)",
          },
          { label: "نشط", value: activeCount, color: "var(--con-success)" },
          {
            label: "إجمالي الطلبات",
            value: totalOrders.toLocaleString("ar-SA"),
            color: "var(--con-accent)",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="con-card"
            style={{ padding: "0.75rem", textAlign: "center" }}
          >
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: "var(--con-text-muted)" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1rem",
          borderBottom: "1px solid var(--con-border-default)",
          paddingBottom: "0.5rem",
        }}
      >
        {[
          { id: "integrations", label: "المنصات" },
          { id: "logs", label: "سجل المزامنة" },
          { id: "guide", label: "📖 تعليمات الربط" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className="con-btn"
            style={{
              background: tab === t.id ? "var(--con-accent)" : "transparent",
              color: tab === t.id ? "#fff" : "var(--con-text-muted)",
              border:
                tab === t.id ? "none" : "1px solid var(--con-border-default)",
              fontSize: 12,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div
          className="con-card"
          style={{
            padding: "1rem",
            color: "var(--con-danger)",
            display: "flex",
            gap: 8,
            marginBottom: "1rem",
          }}
        >
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {tab === "integrations" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "0.75rem",
          }}
        >
          {integrations.map((intg) => {
            const sm = STATUS_MAP[intg.status];
            return (
              <div
                key={intg.id}
                className="con-card"
                style={{ padding: "1.25rem" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <PlatformLogo platform={intg.platform} size={28} />
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--con-text-primary)",
                        }}
                      >
                        {intg.name}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "var(--con-text-muted)" }}
                      >
                        {intg.platform}
                      </div>
                    </div>
                  </div>
                  <span className={`con-badge ${sm.cls}`}>{sm.label}</span>
                </div>

                {intg.error_message && (
                  <div
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      borderRadius: "var(--con-radius-sm)",
                      padding: "0.5rem 0.75rem",
                      marginBottom: 10,
                      fontSize: 11,
                      color: "var(--con-danger)",
                    }}
                  >
                    {intg.error_message}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                    color: "var(--con-text-muted)",
                    marginBottom: 12,
                  }}
                >
                  <span>
                    الطلبات:{" "}
                    <strong style={{ color: "var(--con-text-secondary)" }}>
                      {(intg.total_orders || 0).toLocaleString()}
                    </strong>
                  </span>
                  <span>
                    {intg.last_sync
                      ? `آخر مزامنة: ${new Date(intg.last_sync).toLocaleTimeString("ar-SA")}`
                      : "لم تتم مزامنة"}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => triggerSync(intg.id)}
                    disabled={syncing === intg.id || intg.status !== "active"}
                    className="con-btn con-btn-ghost"
                    style={{ fontSize: 11, gap: 4, flex: 1 }}
                  >
                    {syncing === intg.id ? (
                      <RefreshCw size={12} className="animate-spin" />
                    ) : (
                      <Activity size={12} />
                    )}
                    مزامنة
                  </button>
                  <button
                    onClick={() => toggleStatus(intg.id, intg.status)}
                    className="con-btn con-btn-ghost"
                    style={{ fontSize: 11, gap: 4, flex: 1 }}
                  >
                    {intg.status === "active" ? (
                      <XCircle size={12} />
                    ) : (
                      <CheckCircle2 size={12} />
                    )}
                    {intg.status === "active" ? "إيقاف" : "تفعيل"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add Integration Modal ── */}
      {showAdd && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => setShowAdd(false)}
        >
          <div
            className="con-card"
            style={{ width: "100%", maxWidth: 480, padding: "1.5rem" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.25rem",
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--con-text-primary)",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Plus size={16} style={{ color: "var(--con-accent)" }} /> إضافة
                منصة جديدة
              </h2>
              <button
                onClick={() => setShowAdd(false)}
                className="con-btn con-btn-ghost"
                style={{ padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--con-text-muted)",
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  المنصة
                </label>
                <select
                  className="con-input"
                  value={newIntg.platform}
                  onChange={(e) =>
                    setNewIntg((p) => ({ ...p, platform: e.target.value }))
                  }
                  style={{ width: "100%" }}
                >
                  {Object.entries(PLATFORM_ICONS).map(([k, icon]) => (
                    <option key={k} value={k}>
                      {icon}{" "}
                      {k === "jahez"
                        ? "جاهز"
                        : k === "hungerstation"
                          ? "هنقرستيشن"
                          : k === "noon"
                            ? "نون"
                            : k === "salla"
                              ? "سلة"
                              : k === "zid"
                                ? "زد"
                                : k === "amazon"
                                  ? "أمازون"
                                  : k === "namshi"
                                    ? "نمشي"
                                    : "مخصص"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--con-text-muted)",
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  اسم التكامل
                </label>
                <input
                  className="con-input"
                  style={{ width: "100%" }}
                  placeholder="مثال: جاهز — الرياض"
                  value={newIntg.name}
                  onChange={(e) =>
                    setNewIntg((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--con-text-muted)",
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  Webhook URL{" "}
                  <span
                    style={{ color: "var(--con-text-muted)", fontWeight: 400 }}
                  >
                    (اختياري)
                  </span>
                </label>
                <input
                  className="con-input"
                  dir="ltr"
                  style={{
                    width: "100%",
                    fontFamily: "monospace",
                    fontSize: 12,
                  }}
                  placeholder="https://api.platform.com/webhook"
                  value={newIntg.webhook_url}
                  onChange={(e) =>
                    setNewIntg((p) => ({ ...p, webhook_url: e.target.value }))
                  }
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--con-text-muted)",
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  API Key{" "}
                  <span
                    style={{ color: "var(--con-text-muted)", fontWeight: 400 }}
                  >
                    (اختياري)
                  </span>
                </label>
                <input
                  className="con-input"
                  dir="ltr"
                  type="password"
                  style={{
                    width: "100%",
                    fontFamily: "monospace",
                    fontSize: 12,
                  }}
                  placeholder="sk_live_xxxxxxxxxxxxx"
                  value={newIntg.api_key}
                  onChange={(e) =>
                    setNewIntg((p) => ({ ...p, api_key: e.target.value }))
                  }
                />
              </div>

              <div
                style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}
              >
                <button
                  onClick={addIntegration}
                  disabled={saving || !newIntg.name.trim()}
                  className="con-btn-primary"
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    gap: 6,
                    opacity: !newIntg.name.trim() || saving ? 0.5 : 1,
                  }}
                >
                  {saving ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  حفظ التكامل
                </button>
                <button
                  onClick={() => setShowAdd(false)}
                  className="con-btn con-btn-ghost"
                  style={{ flex: 0.5, justifyContent: "center" }}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "logs" && (
        <div className="con-card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{ borderBottom: "1px solid var(--con-border-default)" }}
              >
                {["المنصة", "نوع الحدث", "الحالة", "السجلات", "الوقت"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "0.75rem 1rem",
                        textAlign: "right",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--con-text-muted)",
                      }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  style={{ borderBottom: "1px solid var(--con-border-subtle)" }}
                >
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{ fontSize: 16, marginLeft: 6 }}>
                      {PLATFORM_LOGOS[log.platform] ? <img src={PLATFORM_LOGOS[log.platform]} alt={log.platform} style={{ width: 20, height: 20, borderRadius: 4, objectFit: "cover" }} /> : "🔗"}
                    </span>
                    <span
                      style={{ fontSize: 12, color: "var(--con-text-primary)" }}
                    >
                      {log.platform}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "0.75rem 1rem",
                      fontSize: 12,
                      color: "var(--con-text-secondary)",
                    }}
                  >
                    {log.event_type}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span
                      className={
                        log.status === "success"
                          ? "con-badge con-badge-success"
                          : "con-badge con-badge-danger"
                      }
                    >
                      {log.status === "success" ? "نجح" : "فشل"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "0.75rem 1rem",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--con-text-primary)",
                    }}
                  >
                    {log.records}
                  </td>
                  <td
                    style={{
                      padding: "0.75rem 1rem",
                      fontSize: 11,
                      color: "var(--con-text-muted)",
                    }}
                  >
                    {new Date(log.created_at).toLocaleString("ar-SA")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Guide Tab ──────────────────────────────────────────────────── */}
      {tab === "guide" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ padding: "1rem", background: "var(--con-bg-elevated)", borderRadius: 12, border: "1px solid var(--con-border-default)" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>كيف تربط منصة توصيل؟</h3>
            <p style={{ fontSize: "0.9rem", color: "var(--con-text-muted)", lineHeight: 1.8 }}>
              كل منصة لها طريقة ربط مختلفة. اختر المنصة من القائمة أدناه لرؤية الخطوات التفصيلية.
              بعد الربط، ستتمكن من سحب الطلبات مباشرة من صفحة "تحليل الطلبات".
            </p>
          </div>

          {PLATFORM_GUIDES.map((guide) => (
            <div
              key={guide.key}
              style={{
                background: "var(--con-bg-elevated)",
                borderRadius: 12,
                border: expandedGuide === guide.key ? `2px solid ${guide.color}` : "1px solid var(--con-border-default)",
                overflow: "hidden",
                transition: "all 0.2s",
              }}
            >
              <button
                onClick={() => setExpandedGuide(expandedGuide === guide.key ? null : guide.key)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "0.75rem",
                  padding: "1rem 1.25rem", background: "none", border: "none", cursor: "pointer",
                  textAlign: "start",
                }}
              >
                <PlatformLogo platform={guide.key} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--con-text-primary)" }}>{guide.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--con-text-muted)" }}>{guide.apiType}</div>
                </div>
                <ChevronDown
                  size={18}
                  style={{
                    transform: expandedGuide === guide.key ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                    color: "var(--con-text-muted)",
                  }}
                />
              </button>

              {expandedGuide === guide.key && (
                <div style={{ padding: "0 1.25rem 1.25rem", borderTop: "1px solid var(--con-border-default)" }}>
                  <ol style={{ margin: "1rem 0 0", paddingInlineStart: "1.5rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {guide.steps.map((step, i) => (
                      <li key={i} style={{ fontSize: "0.9rem", lineHeight: 1.7, color: "var(--con-text-primary)" }}>
                        {step}
                      </li>
                    ))}
                  </ol>
                  {guide.docsUrl && (
                    <a href={guide.docsUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: "0.75rem", fontSize: "0.85rem", color: guide.color, textDecoration: "underline" }}>
                      فتح التوثيق الرسمي ↗
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
