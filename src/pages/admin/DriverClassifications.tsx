/**
 * تصنيف السائقين — Driver Classifications
 * إدارة تصنيفات السائقين حسب النوع والمنصة والمركبة وحساب المستحقات
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { API_BASE } from "@/lib/api";
import { toast } from "sonner";
import {
  Users,
  Search,
  Plus,
  X,
  Save,
  Edit3,
  Trash2,
  Download,
  Printer,
  RefreshCw,
  Car,
  Truck,
  Bike,
  Building2,
  ChevronDown,
  ChevronUp,
  Filter,
  Tag,
  DollarSign,
  Shield,
  Star,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────────────── */
interface DriverProfile {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  national_id?: string;
  city: string;
  platform: string;
  platform_driver_id?: string; // ID from the delivery app (Jahez/HungerStation/etc)
  contract_type: "freelancer" | "company_sponsored" | "kafala" | "ajir";
  vehicle_ownership: "company" | "personal" | "none";
  vehicle_type: string;
  classification: "A" | "B" | "C" | "D" | "new";
  status: "active" | "inactive" | "suspended" | "pending";
  order_rate: number; // per-order pay rate
  monthly_vehicle_cost: number; // if company vehicle
  insurance_deduction: number;
  commission_rate: number; // FLL commission %
  fuel_allowance: number;
  operations_allowance: number;
  total_orders_month: number;
  rating: number;
  joined_date: string;
  notes?: string;
}

type SortField =
  | "full_name"
  | "classification"
  | "total_orders_month"
  | "city"
  | "platform";

const PLATFORMS = [
  { value: "jahez", label: "جاهز" },
  { value: "hungerstation", label: "هنقرستيشن" },
  { value: "keeta", label: "كيتا" },
  { value: "mrsool", label: "مرسول" },
  { value: "toyou", label: "تويو" },
  { value: "ninja", label: "نينجا" },
  { value: "careem", label: "كريم" },
  { value: "other", label: "أخرى" },
];

const CONTRACT_TYPES = [
  { value: "freelancer", label: "مستقل" },
  { value: "company_sponsored", label: "كفالة شركة" },
  { value: "kafala", label: "كفالة فردية" },
  { value: "ajir", label: "أجير" },
];

const CLASSIFICATIONS = [
  {
    value: "A",
    label: "A — ممتاز",
    color: "#22c55e",
    description: "+150 طلب/شهر، تقييم 4.5+",
  },
  {
    value: "B",
    label: "B — جيد",
    color: "#3b82f6",
    description: "100-150 طلب/شهر، تقييم 4.0+",
  },
  {
    value: "C",
    label: "C — متوسط",
    color: "#f59e0b",
    description: "50-100 طلب/شهر",
  },
  {
    value: "D",
    label: "D — منخفض",
    color: "#ef4444",
    description: "أقل من 50 طلب/شهر",
  },
  { value: "new", label: "جديد", color: "#64748b", description: "لم يكمل شهر" },
];

const VEHICLE_TYPES = [
  "سيارة صغيرة",
  "سيارة متوسطة",
  "دراجة نارية",
  "فان",
  "بدون مركبة",
];
const CITIES = [
  "الرياض",
  "جدة",
  "مكة",
  "المدينة",
  "الدمام",
  "الخبر",
  "تبوك",
  "أبها",
  "الطائف",
];

const VEHICLE_COSTS: Record<string, number> = {
  "سيارة صغيرة": 1500,
  "سيارة متوسطة": 2000,
  "دراجة نارية": 500,
  فان: 2500,
  "بدون مركبة": 0,
};

const DEFAULT_RATES: Record<string, number> = {
  jahez: 12,
  hungerstation: 14,
  keeta: 11,
  mrsool: 13,
  toyou: 10,
  ninja: 15,
  careem: 12,
  other: 12,
};

function emptyDriver(): DriverProfile {
  return {
    id: "",
    full_name: "",
    phone: "",
    email: "",
    national_id: "",
    city: "الرياض",
    platform: "jahez",
    platform_driver_id: "",
    contract_type: "freelancer",
    vehicle_ownership: "personal",
    vehicle_type: "سيارة صغيرة",
    classification: "new",
    status: "active",
    order_rate: 12,
    monthly_vehicle_cost: 0,
    insurance_deduction: 200,
    commission_rate: 12,
    fuel_allowance: 0,
    operations_allowance: 500,
    total_orders_month: 0,
    rating: 0,
    joined_date: new Date().toISOString().slice(0, 10),
    notes: "",
  };
}

const fmt = (n: number) =>
  new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(n);

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((r) => headers.map((h) => `"${r[h] ?? ""}"`).join(",")),
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename + ".csv";
  a.click();
}

/* ── Component ─────────────────────────────────────────────────────────── */
export default function DriverClassifications() {
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterClassification, setFilterClassification] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortField, setSortField] = useState<SortField>("full_name");
  const [sortAsc, setSortAsc] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<DriverProfile>(emptyDriver());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      if (supabase) {
        const { data } = await supabase
          .from("couriers")
          .select("*")
          .order("created_at", { ascending: false });
        if (data?.length) {
          setDrivers(
            data.map((d: any) => ({
              id: d.id,
              full_name: d.full_name || d.name || "",
              phone: d.phone || "",
              email: d.email || "",
              national_id: d.national_id || "",
              city: d.city || "الرياض",
              platform: d.platform_app || d.platform || "other",
              platform_driver_id: d.platform_driver_id || "",
              contract_type: d.contract_type || "freelancer",
              vehicle_ownership: d.has_company_vehicle ? "company" : "personal",
              vehicle_type: d.vehicle_type || "سيارة صغيرة",
              classification: d.classification || "new",
              status: d.status || "active",
              order_rate:
                d.order_rate || DEFAULT_RATES[d.platform_app || "other"] || 12,
              monthly_vehicle_cost: d.has_company_vehicle
                ? VEHICLE_COSTS[d.vehicle_type] || 0
                : 0,
              insurance_deduction: d.insurance_deduction || 200,
              commission_rate: d.commission_rate || 12,
              fuel_allowance: d.fuel_allowance || 0,
              operations_allowance: d.operations_allowance || 500,
              total_orders_month: d.total_orders_month || d.total_orders || 0,
              rating: d.rating || d.face_similarity_score || 0,
              joined_date: d.created_at ? d.created_at.slice(0, 10) : "",
              notes: d.notes || "",
            })),
          );
        }
      }
      // Also try API
      const res = await fetch(`${API_BASE}/drivers`);
      if (res.ok) {
        const d = await res.json();
        if (d.items?.length && !drivers.length) {
          setDrivers(
            d.items.map((item: any) => ({
              ...emptyDriver(),
              id: item.id,
              full_name: item.full_name || item.name || "",
              phone: item.phone || "",
              city: item.city || "الرياض",
              platform: item.platform || "other",
              platform_driver_id: item.platform_driver_id || "",
              status: item.status || "active",
              total_orders_month: item.total_orders || 0,
            })),
          );
        }
      }
    } catch {
      /* keep current state */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const filtered = useMemo(() => {
    let list = drivers.filter((d) => {
      if (
        search &&
        !d.full_name.includes(search) &&
        !d.phone.includes(search) &&
        !d.platform_driver_id?.includes(search)
      )
        return false;
      if (filterPlatform && d.platform !== filterPlatform) return false;
      if (filterClassification && d.classification !== filterClassification)
        return false;
      if (filterCity && d.city !== filterCity) return false;
      if (filterStatus && d.status !== filterStatus) return false;
      return true;
    });
    list.sort((a, b) => {
      const va = a[sortField] ?? "";
      const vb = b[sortField] ?? "";
      const cmp =
        typeof va === "number"
          ? va - (vb as number)
          : String(va).localeCompare(String(vb), "ar");
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [
    drivers,
    search,
    filterPlatform,
    filterClassification,
    filterCity,
    filterStatus,
    sortField,
    sortAsc,
  ]);

  const stats = useMemo(
    () => ({
      total: drivers.length,
      active: drivers.filter((d) => d.status === "active").length,
      classA: drivers.filter((d) => d.classification === "A").length,
      classB: drivers.filter((d) => d.classification === "B").length,
      classC: drivers.filter((d) => d.classification === "C").length,
      companyVehicle: drivers.filter((d) => d.vehicle_ownership === "company")
        .length,
    }),
    [drivers],
  );

  function openAdd() {
    setForm({ ...emptyDriver(), id: "drv-" + Date.now() });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(d: DriverProfile) {
    setForm({ ...d });
    setEditingId(d.id);
    setShowForm(true);
  }

  function updateForm(key: keyof DriverProfile, val: unknown) {
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      if (key === "platform")
        next.order_rate = DEFAULT_RATES[val as string] || 12;
      if (key === "vehicle_ownership") {
        next.monthly_vehicle_cost =
          val === "company" ? VEHICLE_COSTS[next.vehicle_type] || 0 : 0;
      }
      if (key === "vehicle_type" && next.vehicle_ownership === "company") {
        next.monthly_vehicle_cost = VEHICLE_COSTS[val as string] || 0;
      }
      // Auto-classify based on orders
      if (key === "total_orders_month") {
        const orders = val as number;
        if (orders >= 150) next.classification = "A";
        else if (orders >= 100) next.classification = "B";
        else if (orders >= 50) next.classification = "C";
        else if (orders > 0) next.classification = "D";
        else next.classification = "new";
      }
      return next as DriverProfile;
    });
  }

  async function saveDriver() {
    if (!form.full_name.trim()) {
      toast.error("أدخل اسم السائق");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("أدخل رقم الجوال");
      return;
    }

    if (editingId) {
      setDrivers((prev) => prev.map((d) => (d.id === editingId ? form : d)));
      // Update in DB
      if (supabase) {
        try {
          await supabase
            .from("couriers")
            .update({ ...form })
            .eq("id", editingId);
        } catch {
          toast.error("فشل تحديث البيانات في قاعدة البيانات");
        }
      }
      toast.success("تم تحديث بيانات السائق");
    } else {
      setDrivers((prev) => [form, ...prev]);
      // Insert in DB
      if (supabase) {
        try {
          await supabase.from("couriers").insert(form);
        } catch {
          toast.error("فشل حفظ البيانات في قاعدة البيانات");
        }
      }
      toast.success("تم إضافة السائق");
    }
    setShowForm(false);
  }

  async function removeDriver(id: string) {
    try {
      if (supabase) {
        const { error } = await supabase.from("couriers").delete().eq("id", id);
        if (error) throw error;
      }
      setDrivers((prev) => prev.filter((d) => d.id !== id));
      toast.success("تم حذف السائق");
    } catch {
      toast.error("تعذر حذف السائق من قاعدة البيانات");
    }
  }

  function getClassColor(c: string) {
    return CLASSIFICATIONS.find((cl) => cl.value === c)?.color || "#64748b";
  }

  function calcNetPay(d: DriverProfile) {
    const gross = d.total_orders_month * d.order_rate;
    const additions = d.fuel_allowance + d.operations_allowance;
    const commission = Math.round((gross * d.commission_rate) / 100);
    const deductions =
      commission + d.monthly_vehicle_cost + d.insurance_deduction;
    return gross + additions - deductions;
  }

  return (
    <div
      dir="rtl"
      style={{ padding: "1.5rem", fontFamily: "var(--con-font-arabic)" }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem",
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
            <Users size={18} style={{ color: "#EC4899" }} /> تصنيف السائقين
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "var(--con-text-muted)",
              margin: "4px 0 0",
            }}
          >
            إدارة تصنيفات السائقين حسب الأداء والمنصة ونوع التعاقد
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={openAdd}
            className="con-btn con-btn-primary"
            style={{ gap: 6, fontSize: 12 }}
          >
            <Plus size={13} /> إضافة سائق
          </button>
          <button
            onClick={() =>
              downloadCSV(filtered as any, "driver_classifications")
            }
            className="con-btn con-btn-ghost"
            style={{ gap: 6, fontSize: 12 }}
            disabled={!filtered.length}
          >
            <Download size={13} /> تصدير
          </button>
          <button
            onClick={() => window.print()}
            className="con-btn con-btn-ghost"
            style={{ gap: 6, fontSize: 12 }}
          >
            <Printer size={13} /> طباعة
          </button>
          <button
            onClick={fetchDrivers}
            disabled={loading}
            className="con-btn con-btn-ghost"
            style={{ gap: 6, fontSize: 12 }}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />{" "}
            تحديث
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        {[
          {
            label: "الإجمالي",
            value: stats.total,
            color: "var(--con-text-primary)",
          },
          { label: "نشط", value: stats.active, color: "var(--con-success)" },
          { label: "تصنيف A", value: stats.classA, color: "#22c55e" },
          { label: "تصنيف B", value: stats.classB, color: "#3b82f6" },
          { label: "تصنيف C", value: stats.classC, color: "#f59e0b" },
          {
            label: "مركبة شركة",
            value: stats.companyVehicle,
            color: "#EC4899",
          },
        ].map((k) => (
          <div
            key={k.label}
            className="con-card"
            style={{ padding: "0.6rem", textAlign: "center" }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: k.color }}>
              {k.value}
            </div>
            <div style={{ fontSize: 10, color: "var(--con-text-muted)" }}>
              {k.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "1rem",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--con-text-muted)",
            }}
          />
          <input
            className="con-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم، الجوال، أو ID المنصة..."
            style={{ width: "100%", paddingRight: 32, fontSize: 12 }}
          />
        </div>
        <select
          className="con-input"
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value)}
          style={{ fontSize: 12 }}
        >
          <option value="">كل المنصات</option>
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <select
          className="con-input"
          value={filterClassification}
          onChange={(e) => setFilterClassification(e.target.value)}
          style={{ fontSize: 12 }}
        >
          <option value="">كل التصنيفات</option>
          {CLASSIFICATIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          className="con-input"
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
          style={{ fontSize: 12 }}
        >
          <option value="">كل المدن</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="con-input"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ fontSize: 12 }}
        >
          <option value="">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="inactive">غير نشط</option>
          <option value="suspended">معلّق</option>
          <option value="pending">قيد المراجعة</option>
        </select>
      </div>

      {/* Classification Legend */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          marginBottom: "1rem",
          fontSize: 11,
          color: "var(--con-text-muted)",
        }}
      >
        {CLASSIFICATIONS.map((c) => (
          <span
            key={c.value}
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: c.color,
                display: "inline-block",
              }}
            />
            {c.label} — {c.description}
          </span>
        ))}
      </div>

      {/* Driver Cards */}
      {!filtered.length ? (
        <div
          className="con-card"
          style={{
            padding: "3rem",
            textAlign: "center",
            color: "var(--con-text-muted)",
          }}
        >
          <Users size={48} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>
            {drivers.length
              ? "لا توجد نتائج"
              : "لا يوجد سائقين — أضف سائقاً جديداً"}
          </p>
          {!drivers.length && (
            <button
              onClick={openAdd}
              className="con-btn-primary"
              style={{ marginTop: "0.75rem", gap: 6 }}
            >
              <Plus size={14} /> إضافة سائق
            </button>
          )}
        </div>
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          {filtered.map((d) => {
            const isExpanded = expandedId === d.id;
            const netPay = calcNetPay(d);
            return (
              <div
                key={d.id}
                className="con-card"
                style={{ padding: 0, overflow: "hidden" }}
              >
                {/* Row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "0.75rem 1rem",
                    cursor: "pointer",
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : d.id)}
                >
                  {/* Classification badge */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: getClassColor(d.classification) + "18",
                      border: `2px solid ${getClassColor(d.classification)}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 14,
                      color: getClassColor(d.classification),
                      flexShrink: 0,
                    }}
                  >
                    {d.classification === "new" ? "N" : d.classification}
                  </div>

                  {/* Name & Platform */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--con-text-primary)",
                        }}
                      >
                        {d.full_name || "—"}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: "var(--con-bg-elevated)",
                          color: "var(--con-text-muted)",
                        }}
                      >
                        {PLATFORMS.find((p) => p.value === d.platform)?.label ||
                          d.platform}
                      </span>
                      {d.platform_driver_id && (
                        <span
                          style={{
                            fontSize: 10,
                            fontFamily: "monospace",
                            color: "var(--con-text-muted)",
                          }}
                        >
                          #{d.platform_driver_id}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--con-text-muted)",
                        marginTop: 2,
                        display: "flex",
                        gap: 8,
                      }}
                    >
                      <span>{d.phone}</span>
                      <span>{d.city}</span>
                      <span>
                        {
                          CONTRACT_TYPES.find(
                            (c) => c.value === d.contract_type,
                          )?.label
                        }
                      </span>
                      <span>
                        {d.vehicle_ownership === "company"
                          ? "🏢 مركبة شركة"
                          : "🚗 مركبة خاصة"}
                      </span>
                    </div>
                  </div>

                  {/* Orders */}
                  <div style={{ textAlign: "center", minWidth: 60 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        fontFamily: "monospace",
                        color: "var(--con-text-primary)",
                      }}
                    >
                      {d.total_orders_month}
                    </div>
                    <div
                      style={{ fontSize: 9, color: "var(--con-text-muted)" }}
                    >
                      طلب/شهر
                    </div>
                  </div>

                  {/* Net Pay */}
                  <div style={{ textAlign: "center", minWidth: 80 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: "monospace",
                        color:
                          netPay >= 0
                            ? "var(--con-success)"
                            : "var(--con-danger)",
                      }}
                    >
                      {fmt(netPay)}
                    </div>
                    <div
                      style={{ fontSize: 9, color: "var(--con-text-muted)" }}
                    >
                      صافي
                    </div>
                  </div>

                  {/* Status */}
                  <span
                    className={`con-badge ${d.status === "active" ? "con-badge-success" : d.status === "suspended" ? "con-badge-danger" : "con-badge-warning"}`}
                    style={{ fontSize: 10 }}
                  >
                    {d.status === "active"
                      ? "نشط"
                      : d.status === "suspended"
                        ? "معلّق"
                        : d.status === "inactive"
                          ? "متوقف"
                          : "مراجعة"}
                  </span>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(d);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 4,
                        color: "var(--con-text-muted)",
                      }}
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDriver(d.id);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 4,
                        color: "var(--con-danger)",
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  {isExpanded ? (
                    <ChevronUp
                      size={14}
                      style={{ color: "var(--con-text-muted)" }}
                    />
                  ) : (
                    <ChevronDown
                      size={14}
                      style={{ color: "var(--con-text-muted)" }}
                    />
                  )}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div
                    style={{
                      padding: "0 1rem 1rem",
                      borderTop: "1px solid var(--con-border-subtle)",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: "0.75rem",
                        marginTop: "0.75rem",
                      }}
                    >
                      <DetailBox label="سعر الطلب" value={fmt(d.order_rate)} />
                      <DetailBox
                        label="الإجمالي (شهري)"
                        value={fmt(d.total_orders_month * d.order_rate)}
                      />
                      <DetailBox
                        label="بدل تشغيل"
                        value={fmt(d.operations_allowance)}
                        positive
                      />
                      <DetailBox
                        label="بدل وقود"
                        value={fmt(d.fuel_allowance)}
                        positive
                      />
                      <DetailBox
                        label="عمولة FLL ({d.commission_rate}%)"
                        value={fmt(
                          Math.round(
                            (d.total_orders_month *
                              d.order_rate *
                              d.commission_rate) /
                              100,
                          ),
                        )}
                        negative
                      />
                      <DetailBox
                        label="تكلفة مركبة"
                        value={
                          d.vehicle_ownership === "company"
                            ? fmt(d.monthly_vehicle_cost)
                            : "—"
                        }
                        negative={d.vehicle_ownership === "company"}
                      />
                      <DetailBox
                        label="تأمين"
                        value={fmt(d.insurance_deduction)}
                        negative
                      />
                      <DetailBox
                        label="صافي المستحق"
                        value={fmt(netPay)}
                        highlight
                      />
                    </div>
                    {d.notes && (
                      <p
                        style={{
                          fontSize: 11,
                          color: "var(--con-text-muted)",
                          marginTop: 8,
                          padding: "6px 8px",
                          background: "var(--con-bg-elevated)",
                          borderRadius: 6,
                        }}
                      >
                        {d.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add/Edit Modal ─────────────────────────────────────────────── */}
      {showForm && (
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
            overflow: "auto",
          }}
          onClick={() => setShowForm(false)}
        >
          <div
            className="con-card"
            style={{
              width: "100%",
              maxWidth: 640,
              padding: "1.5rem",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--con-text-primary)",
                  margin: 0,
                }}
              >
                {editingId ? "تعديل بيانات السائق" : "إضافة سائق جديد"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="con-btn con-btn-ghost"
                style={{ padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
              <Field label="الاسم الكامل">
                <input
                  className="con-input"
                  style={{ width: "100%" }}
                  value={form.full_name}
                  onChange={(e) => updateForm("full_name", e.target.value)}
                />
              </Field>
              <Field label="رقم الجوال">
                <input
                  className="con-input"
                  dir="ltr"
                  style={{ width: "100%", fontFamily: "monospace" }}
                  value={form.phone}
                  onChange={(e) => updateForm("phone", e.target.value)}
                  placeholder="5XXXXXXXX"
                />
              </Field>
              <Field label="البريد الإلكتروني">
                <input
                  className="con-input"
                  dir="ltr"
                  style={{ width: "100%", fontFamily: "monospace" }}
                  value={form.email || ""}
                  onChange={(e) => updateForm("email", e.target.value)}
                />
              </Field>
              <Field label="رقم الهوية">
                <input
                  className="con-input"
                  dir="ltr"
                  style={{ width: "100%", fontFamily: "monospace" }}
                  value={form.national_id || ""}
                  onChange={(e) => updateForm("national_id", e.target.value)}
                />
              </Field>
              <Field label="المنصة">
                <select
                  className="con-input"
                  style={{ width: "100%" }}
                  value={form.platform}
                  onChange={(e) => updateForm("platform", e.target.value)}
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="ID السائق في المنصة">
                <input
                  className="con-input"
                  dir="ltr"
                  style={{ width: "100%", fontFamily: "monospace" }}
                  value={form.platform_driver_id || ""}
                  onChange={(e) =>
                    updateForm("platform_driver_id", e.target.value)
                  }
                  placeholder="مثال: JAH-12345"
                />
              </Field>
              <Field label="نوع التعاقد">
                <select
                  className="con-input"
                  style={{ width: "100%" }}
                  value={form.contract_type}
                  onChange={(e) => updateForm("contract_type", e.target.value)}
                >
                  {CONTRACT_TYPES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="المدينة">
                <select
                  className="con-input"
                  style={{ width: "100%" }}
                  value={form.city}
                  onChange={(e) => updateForm("city", e.target.value)}
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="ملكية المركبة">
                <select
                  className="con-input"
                  style={{ width: "100%" }}
                  value={form.vehicle_ownership}
                  onChange={(e) =>
                    updateForm("vehicle_ownership", e.target.value)
                  }
                >
                  <option value="personal">مركبة خاصة</option>
                  <option value="company">مركبة من الشركة</option>
                  <option value="none">بدون مركبة</option>
                </select>
              </Field>
              <Field label="نوع المركبة">
                <select
                  className="con-input"
                  style={{ width: "100%" }}
                  value={form.vehicle_type}
                  onChange={(e) => updateForm("vehicle_type", e.target.value)}
                >
                  {VEHICLE_TYPES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>

              <div
                style={{
                  gridColumn: "1 / -1",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--con-accent)",
                  marginTop: 6,
                }}
              >
                الحسابات المالية
              </div>
              <Field label="عدد الطلبات/شهر">
                <input
                  className="con-input"
                  dir="ltr"
                  type="number"
                  style={{ width: "100%", fontFamily: "monospace" }}
                  value={form.total_orders_month}
                  onChange={(e) =>
                    updateForm(
                      "total_orders_month",
                      parseInt(e.target.value) || 0,
                    )
                  }
                />
              </Field>
              <Field label="سعر الطلب (ر.س)">
                <input
                  className="con-input"
                  dir="ltr"
                  type="number"
                  style={{ width: "100%", fontFamily: "monospace" }}
                  value={form.order_rate}
                  onChange={(e) =>
                    updateForm("order_rate", parseFloat(e.target.value) || 0)
                  }
                />
              </Field>
              <Field label="بدل تشغيل">
                <input
                  className="con-input"
                  dir="ltr"
                  type="number"
                  style={{ width: "100%", fontFamily: "monospace" }}
                  value={form.operations_allowance}
                  onChange={(e) =>
                    updateForm(
                      "operations_allowance",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                />
              </Field>
              <Field label="بدل وقود">
                <input
                  className="con-input"
                  dir="ltr"
                  type="number"
                  style={{ width: "100%", fontFamily: "monospace" }}
                  value={form.fuel_allowance}
                  onChange={(e) =>
                    updateForm(
                      "fuel_allowance",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                />
              </Field>
              <Field label="عمولة FLL (%)">
                <input
                  className="con-input"
                  dir="ltr"
                  type="number"
                  style={{ width: "100%", fontFamily: "monospace" }}
                  value={form.commission_rate}
                  onChange={(e) =>
                    updateForm(
                      "commission_rate",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                />
              </Field>
              <Field label="تأمين صحي">
                <input
                  className="con-input"
                  dir="ltr"
                  type="number"
                  style={{ width: "100%", fontFamily: "monospace" }}
                  value={form.insurance_deduction}
                  onChange={(e) =>
                    updateForm(
                      "insurance_deduction",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                />
              </Field>
              <Field label="التقييم (0-5)">
                <input
                  className="con-input"
                  dir="ltr"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  style={{ width: "100%", fontFamily: "monospace" }}
                  value={form.rating}
                  onChange={(e) =>
                    updateForm("rating", parseFloat(e.target.value) || 0)
                  }
                />
              </Field>
              <Field label="التصنيف (تلقائي)">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    background: getClassColor(form.classification) + "18",
                    borderRadius: 8,
                    border: `1px solid ${getClassColor(form.classification)}44`,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: 18,
                      color: getClassColor(form.classification),
                    }}
                  >
                    {form.classification === "new"
                      ? "جديد"
                      : form.classification}
                  </span>
                  <span
                    style={{ fontSize: 11, color: "var(--con-text-muted)" }}
                  >
                    {
                      CLASSIFICATIONS.find(
                        (c) => c.value === form.classification,
                      )?.description
                    }
                  </span>
                </div>
              </Field>

              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="ملاحظات">
                  <textarea
                    className="con-input"
                    style={{ width: "100%", minHeight: 60, resize: "vertical" }}
                    value={form.notes || ""}
                    onChange={(e) => updateForm("notes", e.target.value)}
                  />
                </Field>
              </div>
            </div>

            {/* Summary */}
            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem",
                background: "var(--con-bg-elevated)",
                borderRadius: 8,
                display: "flex",
                justifyContent: "space-around",
                textAlign: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 10, color: "var(--con-text-muted)" }}>
                  إجمالي
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "monospace",
                  }}
                >
                  {fmt(form.total_orders_month * form.order_rate)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--con-success)" }}>
                  + إضافات
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "monospace",
                    color: "var(--con-success)",
                  }}
                >
                  {fmt(form.operations_allowance + form.fuel_allowance)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--con-danger)" }}>
                  - خصومات
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "monospace",
                    color: "var(--con-danger)",
                  }}
                >
                  {fmt(
                    Math.round(
                      (form.total_orders_month *
                        form.order_rate *
                        form.commission_rate) /
                        100,
                    ) +
                      form.monthly_vehicle_cost +
                      form.insurance_deduction,
                  )}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--con-accent)" }}>
                  صافي
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    fontFamily: "monospace",
                    color: "var(--con-accent)",
                  }}
                >
                  {fmt(calcNetPay(form))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button
                onClick={saveDriver}
                className="con-btn-primary"
                style={{ flex: 1, justifyContent: "center", gap: 6 }}
              >
                <Save size={14} />{" "}
                {editingId ? "حفظ التعديلات" : "إضافة السائق"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="con-btn con-btn-ghost"
                style={{ justifyContent: "center" }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--con-text-muted)",
          marginBottom: 4,
          display: "block",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function DetailBox({
  label,
  value,
  positive,
  negative,
  highlight,
}: {
  label: string;
  value: string;
  positive?: boolean;
  negative?: boolean;
  highlight?: boolean;
}) {
  const color = highlight
    ? "var(--con-accent)"
    : positive
      ? "var(--con-success)"
      : negative
        ? "var(--con-danger)"
        : "var(--con-text-primary)";
  return (
    <div
      style={{
        padding: "8px",
        borderRadius: 6,
        background: "var(--con-bg-elevated)",
        textAlign: "center",
      }}
    >
      <div
        style={{ fontSize: 9, color: "var(--con-text-muted)", marginBottom: 2 }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: highlight ? 16 : 13,
          fontWeight: 700,
          fontFamily: "monospace",
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}
