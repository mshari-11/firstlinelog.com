/**
 * Public location-share page for customers.
 * URL: /track/:shipmentId
 * Customer clicks "مشاركة موقعي" → browser prompts for geolocation →
 * lat/lng is POSTed to Supabase.
 */
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { MapPin, CheckCircle2, AlertCircle, Truck } from "lucide-react";

export default function TrackLocation() {
  const { shipmentId = "" } = useParams<{ shipmentId: string }>();
  const [searchParams] = useSearchParams();
  const customerName = searchParams.get("name") || "";

  const [status, setStatus] = useState<
    "idle" | "requesting" | "saving" | "saved" | "error"
  >("idle");
  const [error, setError] = useState<string>("");
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);

  useEffect(() => {
    document.title = `تتبع الشحنة ${shipmentId} | First Line Logistics`;
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "ar";
  }, [shipmentId]);

  async function shareLocation() {
    setError("");
    if (!("geolocation" in navigator)) {
      setError("متصفحك لا يدعم تحديد الموقع");
      setStatus("error");
      return;
    }
    setStatus("requesting");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        setCoords({ lat, lng, accuracy });
        setStatus("saving");

        if (!supabase) {
          setError("تعذّر الاتصال بقاعدة البيانات");
          setStatus("error");
          return;
        }

        const { error: insertError } = await supabase
          .from("shipment_tracking_locations")
          .insert({
            shipment_id: shipmentId,
            customer_name: customerName || null,
            latitude: lat,
            longitude: lng,
            accuracy,
            user_agent: navigator.userAgent.slice(0, 255),
          });

        if (insertError) {
          console.error(insertError);
          setError("تعذّر حفظ الموقع. يرجى المحاولة لاحقاً.");
          setStatus("error");
          return;
        }

        setStatus("saved");
      },
      (err) => {
        if (err.code === 1) {
          setError("لم يتم السماح بالوصول للموقع. يرجى تفعيل الإذن من إعدادات المتصفح.");
        } else if (err.code === 2) {
          setError("تعذّر تحديد الموقع حالياً. تأكد من تفعيل GPS.");
        } else {
          setError("انتهى وقت طلب الموقع. يرجى المحاولة مرة أخرى.");
        }
        setStatus("error");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  const gmapsUrl = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
    : "";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          width: "100%",
          maxWidth: 460,
          padding: "32px 24px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          textAlign: "center",
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: 64,
            height: 64,
            background: "#dc2626",
            borderRadius: 16,
            margin: "0 auto 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Truck size={32} color="#fff" />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
          First Line Logistics
        </h1>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
          الخط الأول للخدمات اللوجستية
        </div>

        {/* Shipment info */}
        <div
          style={{
            background: "#f1f5f9",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: "14px 16px",
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
            رقم الشحنة
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#0f172a",
              fontFamily: "monospace",
              letterSpacing: "0.5px",
            }}
          >
            {shipmentId || "—"}
          </div>
          {customerName && (
            <div style={{ marginTop: 10, fontSize: 13, color: "#475569" }}>
              عزيزي {customerName}
            </div>
          )}
        </div>

        {/* Body */}
        {status === "saved" ? (
          <div>
            <CheckCircle2 size={56} color="#16a34a" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 17, fontWeight: 700, color: "#16a34a", marginBottom: 6 }}>
              تم استلام موقعك بنجاح
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
              سيقوم المندوب بالتواصل معك قريباً
            </div>
            {coords && (
              <a
                href={gmapsUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: 8,
                  padding: "10px 16px",
                  background: "#f1f5f9",
                  borderRadius: 8,
                  color: "#0f172a",
                  fontSize: 12,
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                عرض الموقع على الخريطة
              </a>
            )}
          </div>
        ) : (
          <>
            <p
              style={{
                fontSize: 14,
                color: "#334155",
                lineHeight: 1.7,
                marginBottom: 20,
              }}
            >
              الرجاء مشاركة موقع التسليم في حال قبولكم استلام الشحنة
            </p>

            <button
              onClick={shareLocation}
              disabled={status === "requesting" || status === "saving"}
              style={{
                width: "100%",
                padding: "14px 20px",
                background: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 700,
                cursor: status === "requesting" || status === "saving" ? "wait" : "pointer",
                opacity: status === "requesting" || status === "saving" ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontFamily: "inherit",
              }}
            >
              <MapPin size={18} />
              {status === "requesting"
                ? "جاري تحديد الموقع..."
                : status === "saving"
                  ? "جاري الحفظ..."
                  : "مشاركة موقعي الآن"}
            </button>

            {status === "error" && error && (
              <div
                style={{
                  marginTop: 16,
                  padding: "12px 14px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  textAlign: "start",
                }}
              >
                <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 12, color: "#7f1d1d", lineHeight: 1.5 }}>{error}</div>
              </div>
            )}

            <div
              style={{
                marginTop: 22,
                paddingTop: 16,
                borderTop: "1px solid #e2e8f0",
                fontSize: 11,
                color: "#94a3b8",
                lineHeight: 1.6,
              }}
            >
              موقعك لن يُستخدم إلا لأغراض تسليم الشحنة ولن تتم مشاركته مع أي جهة خارجية
            </div>
          </>
        )}
      </div>
    </div>
  );
}
