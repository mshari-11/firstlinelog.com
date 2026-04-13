/**
 * إرسال رابط تتبع — Admin page
 * Generate a pre-filled WhatsApp message with a /track/:id link
 * that opens the customer's location-share page.
 */
import { useState } from "react";
import {
  Truck,
  User,
  Phone,
  Package,
  MessageCircle,
  Copy,
  Send,
  CheckCircle2,
  Link2,
} from "lucide-react";
import { toast } from "sonner";

function generateShipmentId(): string {
  const prefix = "SUD";
  const rand = Math.floor(10000 + Math.random() * 89999);
  return `${prefix}-${rand}`;
}

function normalizePhone(raw: string): string {
  // Strip spaces, dashes, plus
  let p = raw.replace(/[\s\-+]/g, "");
  // 05XXXXXXXX → 9665XXXXXXXX
  if (p.startsWith("05") && p.length === 10) p = "966" + p.slice(1);
  // 5XXXXXXXX → 9665XXXXXXXX
  else if (p.startsWith("5") && p.length === 9) p = "966" + p;
  return p;
}

export default function SendTrackingLink() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [shipmentId, setShipmentId] = useState(() => generateShipmentId());
  const [sentList, setSentList] = useState<
    Array<{ id: string; name: string; phone: string; shipmentId: string; at: string }>
  >([]);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://fll.sa";
  const trackUrl = `${baseUrl}/track/${shipmentId}${name ? `?name=${encodeURIComponent(name)}` : ""}`;

  const messageText = `عزيزي العميل ${name || "[اسم العميل]"}
يوجد لديكم شحنة بريدية ${shipmentId}
الرجاء مشاركة موقع التسليم على الرابط ادناه في حال قبولكم للاستلام

${trackUrl}`;

  const waPhone = normalizePhone(phone);
  const waLink = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(messageText)}`
    : "";

  function openWhatsApp() {
    if (!name.trim()) {
      toast.error("أدخل اسم العميل");
      return;
    }
    if (!phone.trim() || waPhone.length < 12) {
      toast.error("أدخل رقم جوال صحيح");
      return;
    }
    window.open(waLink, "_blank");
    setSentList((prev) => [
      {
        id: crypto.randomUUID(),
        name,
        phone: waPhone,
        shipmentId,
        at: new Date().toLocaleTimeString("ar-SA"),
      },
      ...prev,
    ]);
    toast.success("تم فتح واتساب — اضغط إرسال");
  }

  function copyMessage() {
    navigator.clipboard.writeText(messageText);
    toast.success("تم نسخ الرسالة");
  }

  function copyLink() {
    navigator.clipboard.writeText(trackUrl);
    toast.success("تم نسخ الرابط");
  }

  function newShipment() {
    setShipmentId(generateShipmentId());
    setName("");
    setPhone("");
  }

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              background: "rgba(59,130,246,0.12)",
              borderRadius: 8,
              padding: 8,
              display: "flex",
            }}
          >
            <Send size={18} style={{ color: "var(--con-brand)" }} />
          </div>
          <div>
            <h1
              style={{
                fontSize: "var(--con-text-page-title)",
                fontWeight: 700,
                color: "var(--con-text-primary)",
                margin: 0,
              }}
            >
              إرسال رابط تتبع
            </h1>
            <p
              style={{
                fontSize: "var(--con-text-caption)",
                color: "var(--con-text-muted)",
                margin: "4px 0 0",
              }}
            >
              ارسل للعميل رابط يشارك منه موقعه عبر واتساب
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        {/* Left: Input fields */}
        <div
          style={{
            background: "var(--con-bg-surface-1)",
            border: "1px solid var(--con-border-default)",
            borderRadius: 10,
            padding: 20,
          }}
        >
          <h3
            style={{
              fontSize: "var(--con-text-card-title)",
              fontWeight: 600,
              color: "var(--con-text-primary)",
              margin: "0 0 16px",
            }}
          >
            بيانات العميل
          </h3>

          {/* Customer name */}
          <label style={{ display: "block", marginBottom: 14 }}>
            <div
              style={{
                fontSize: 12,
                color: "var(--con-text-muted)",
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <User size={12} /> اسم العميل
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="سلطان المالكي"
              className="con-input"
              style={{ width: "100%" }}
            />
          </label>

          {/* Phone */}
          <label style={{ display: "block", marginBottom: 14 }}>
            <div
              style={{
                fontSize: 12,
                color: "var(--con-text-muted)",
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Phone size={12} /> رقم الجوال
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0566606266"
              className="con-input"
              style={{ width: "100%", direction: "ltr", textAlign: "start" }}
            />
            {phone && waPhone && (
              <div
                style={{
                  fontSize: 10,
                  color: "var(--con-text-muted)",
                  marginTop: 4,
                  fontFamily: "var(--con-font-mono)",
                }}
              >
                {waPhone.length >= 12 ? `+${waPhone} ✓` : "الرقم غير صحيح"}
              </div>
            )}
          </label>

          {/* Shipment ID */}
          <label style={{ display: "block", marginBottom: 14 }}>
            <div
              style={{
                fontSize: 12,
                color: "var(--con-text-muted)",
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 6,
                justifyContent: "space-between",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Package size={12} /> رقم الشحنة
              </span>
              <button
                type="button"
                onClick={() => setShipmentId(generateShipmentId())}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--con-brand)",
                  fontSize: 11,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                توليد جديد
              </button>
            </div>
            <input
              type="text"
              value={shipmentId}
              onChange={(e) => setShipmentId(e.target.value.toUpperCase())}
              className="con-input"
              style={{
                width: "100%",
                fontFamily: "var(--con-font-mono)",
                letterSpacing: "0.5px",
              }}
            />
          </label>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              onClick={openWhatsApp}
              disabled={!name.trim() || !phone.trim()}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 16px",
                background: "#25d366",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                opacity: !name.trim() || !phone.trim() ? 0.5 : 1,
                fontFamily: "inherit",
              }}
            >
              <MessageCircle size={16} />
              إرسال عبر واتساب
            </button>
            <button
              onClick={newShipment}
              className="con-btn-ghost"
              title="تفريغ وإنشاء شحنة جديدة"
            >
              <Truck size={14} /> جديد
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div
          style={{
            background: "var(--con-bg-surface-1)",
            border: "1px solid var(--con-border-default)",
            borderRadius: 10,
            padding: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h3
              style={{
                fontSize: "var(--con-text-card-title)",
                fontWeight: 600,
                color: "var(--con-text-primary)",
                margin: 0,
              }}
            >
              معاينة الرسالة
            </h3>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                className="con-btn-ghost"
                onClick={copyMessage}
                title="نسخ الرسالة"
                style={{ padding: "4px 8px" }}
              >
                <Copy size={12} />
              </button>
              <button
                className="con-btn-ghost"
                onClick={copyLink}
                title="نسخ الرابط فقط"
                style={{ padding: "4px 8px" }}
              >
                <Link2 size={12} />
              </button>
            </div>
          </div>

          {/* WhatsApp-style bubble */}
          <div
            style={{
              background: "#075e54",
              padding: 14,
              borderRadius: 10,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                background: "#dcf8c6",
                color: "#000",
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: 13,
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
                direction: "rtl",
                fontFamily: "system-ui, Tahoma, sans-serif",
              }}
            >
              {messageText}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.6)",
                marginTop: 6,
                textAlign: "end",
              }}
            >
              {new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })} ✓✓
            </div>
          </div>

          <div
            style={{
              fontSize: 11,
              color: "var(--con-text-muted)",
              lineHeight: 1.6,
              padding: "10px 12px",
              background: "var(--con-bg-surface-2)",
              borderRadius: 6,
            }}
          >
            💡 الرسالة تفتح في واتساب وأنت تضغط إرسال. العميل يفتح الرابط،
            يوافق على مشاركة موقعه، والإحداثيات تُحفظ في قاعدة البيانات
            مربوطة برقم الشحنة.
          </div>
        </div>
      </div>

      {/* Recent sends */}
      {sentList.length > 0 && (
        <div
          style={{
            background: "var(--con-bg-surface-1)",
            border: "1px solid var(--con-border-default)",
            borderRadius: 10,
            padding: 16,
          }}
        >
          <h3
            style={{
              fontSize: "var(--con-text-card-title)",
              fontWeight: 600,
              color: "var(--con-text-primary)",
              margin: "0 0 12px",
            }}
          >
            الرسائل المفتوحة في هذه الجلسة
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {sentList.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 12px",
                  background: "var(--con-bg-surface-2)",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              >
                <CheckCircle2 size={14} style={{ color: "#25d366" }} />
                <span style={{ fontWeight: 600, color: "var(--con-text-primary)" }}>
                  {s.name}
                </span>
                <span
                  style={{ color: "var(--con-text-muted)", fontFamily: "var(--con-font-mono)" }}
                >
                  +{s.phone}
                </span>
                <span
                  style={{ color: "var(--con-brand)", fontFamily: "var(--con-font-mono)" }}
                >
                  {s.shipmentId}
                </span>
                <span style={{ color: "var(--con-text-muted)", marginInlineStart: "auto" }}>
                  {s.at}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
