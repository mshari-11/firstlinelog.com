/**
 * حاسبة الرواتب وتصدير STC Bank Excel
 * Payroll Calculator + STC Bank Excel Generator
 */
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { API_BASE } from "@/lib/api";
import {
  Calculator, Users, Car, Truck, DollarSign, Plus, X, Save,
  Download, FileSpreadsheet, Trash2, RefreshCw, ChevronDown,
  Building2, Wallet, Receipt, TrendingUp, TrendingDown,
  Phone, User, Printer, CheckCircle2, AlertTriangle, Edit3,
} from "lucide-react";

/* ── Custom Field Types ────────────────────────────────────────────────── */
interface CustomField {
  id: string;
  label: string;
  type: "addition" | "deduction";
  calc: "fixed" | "percentage"; // fixed amount or % of gross
  defaultValue: number;
}

const CUSTOM_FIELDS_KEY = "fll_payroll_fields_v1";

function loadCustomFields(): CustomField[] {
  try {
    const raw = localStorage.getItem(CUSTOM_FIELDS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [
    { id: "fuel_allowance", label: "بدل وقود", type: "addition", calc: "fixed", defaultValue: 0 },
    { id: "operations_allowance", label: "بدل تشغيل", type: "addition", calc: "fixed", defaultValue: 500 },
    { id: "performance_bonus", label: "مكافأة أداء", type: "addition", calc: "fixed", defaultValue: 0 },
    { id: "fll_commission", label: "عمولة FLL", type: "deduction", calc: "percentage", defaultValue: 12 },
    { id: "insurance", label: "تأمين صحي", type: "deduction", calc: "fixed", defaultValue: 200 },
    { id: "maintenance", label: "صيانة", type: "deduction", calc: "fixed", defaultValue: 150 },
    { id: "penalties", label: "جزاءات", type: "deduction", calc: "fixed", defaultValue: 0 },
    { id: "vat", label: "ضريبة VAT", type: "deduction", calc: "percentage", defaultValue: 15 },
  ];
}

function saveCustomFields(fields: CustomField[]) {
  localStorage.setItem(CUSTOM_FIELDS_KEY, JSON.stringify(fields));
}

/* ── Types ─────────────────────────────────────────────────────────────── */
interface DriverPayroll {
  id: string;
  name: string;
  phone: string;
  platform: string;
  contract_type: "freelancer" | "company_sponsored" | "kafala" | "ajir";
  has_company_vehicle: boolean;
  vehicle_type: string;
  city: string;
  total_orders: number;
  order_rate: number;
  gross_earnings: number;
  // Dynamic fields stored as key-value
  customValues: Record<string, number>;
  // Calculated
  vehicle_cost: number;
  total_additions: number;
  total_deductions: number;
  net_payout: number;
}

const PLATFORMS = ["jahez", "hungerstation", "keeta", "mrsool", "toyou", "ninja", "careem", "other"];
const CONTRACT_TYPES = [
  { value: "freelancer", label: "مستقل (Freelancer)" },
  { value: "company_sponsored", label: "كفالة شركة" },
  { value: "kafala", label: "كفالة فردية" },
  { value: "ajir", label: "أجير" },
];
const VEHICLE_TYPES = ["سيارة صغيرة", "سيارة متوسطة", "دراجة نارية", "فان", "بدون مركبة"];
const CITIES = ["الرياض", "جدة", "مكة", "المدينة", "الدمام", "الخبر", "تبوك", "أبها"];

const DEFAULT_RATES: Record<string, number> = {
  jahez: 12, hungerstation: 14, keeta: 11, mrsool: 13, toyou: 10, ninja: 15, careem: 12, other: 12,
};

const VEHICLE_MONTHLY_COST: Record<string, number> = {
  "سيارة صغيرة": 1500,
  "سيارة متوسطة": 2000,
  "دراجة نارية": 500,
  "فان": 2500,
  "بدون مركبة": 0,
};

function emptyDriver(fields: CustomField[], id?: string): DriverPayroll {
  const customValues: Record<string, number> = {};
  fields.forEach(f => { customValues[f.id] = f.defaultValue; });
  return {
    id: id || "d-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
    name: "", phone: "", platform: "jahez", contract_type: "freelancer",
    has_company_vehicle: false, vehicle_type: "سيارة صغيرة", city: "الرياض",
    total_orders: 0, order_rate: 12,
    gross_earnings: 0, customValues,
    vehicle_cost: 0, total_additions: 0, total_deductions: 0, net_payout: 0,
  };
}

function recalc(d: DriverPayroll, fields: CustomField[]): DriverPayroll {
  const gross = d.total_orders * d.order_rate;
  let additions = 0;
  let deductions = 0;
  for (const f of fields) {
    const val = d.customValues[f.id] || 0;
    const amount = f.calc === "percentage" ? Math.round(gross * val / 100) : val;
    if (f.type === "addition") additions += amount;
    else deductions += amount;
  }
  const vehicleCost = d.has_company_vehicle ? (VEHICLE_MONTHLY_COST[d.vehicle_type] || 0) : 0;
  deductions += vehicleCost;
  const net = gross + additions - deductions;
  return { ...d, gross_earnings: gross, vehicle_cost: vehicleCost, total_additions: additions, total_deductions: deductions, net_payout: net };
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 9 && digits.startsWith("5")) return "966" + digits;
  if (digits.length === 10 && digits.startsWith("05")) return "966" + digits.slice(1);
  if (digits.length === 12 && digits.startsWith("966")) return digits;
  return "";
}

const fmt = (n: number) => new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(n);

/* ── Component ─────────────────────────────────────────────────────────── */
export default function PayrollCalculator() {
  const [customFields, setCustomFields] = useState<CustomField[]>(loadCustomFields);
  const [drivers, setDrivers] = useState<DriverPayroll[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DriverPayroll>(emptyDriver(customFields));
  const [generating, setGenerating] = useState(false);
  const [tab, setTab] = useState<"calculator" | "stc" | "fields">("calculator");

  // Field editor state
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<"addition" | "deduction">("addition");
  const [newFieldCalc, setNewFieldCalc] = useState<"fixed" | "percentage">("fixed");
  const [newFieldDefault, setNewFieldDefault] = useState(0);
  const [editFieldId, setEditFieldId] = useState<string | null>(null);

  function addCustomField() {
    if (!newFieldLabel.trim()) { toast.error("أدخل اسم الحقل"); return; }
    const id = "cf_" + Date.now();
    const field: CustomField = { id, label: newFieldLabel.trim(), type: newFieldType, calc: newFieldCalc, defaultValue: newFieldDefault };
    const updated = [...customFields, field];
    setCustomFields(updated);
    saveCustomFields(updated);
    // Add to all existing drivers
    setDrivers(prev => prev.map(d => ({ ...d, customValues: { ...d.customValues, [id]: newFieldDefault } })));
    setNewFieldLabel(""); setNewFieldDefault(0);
    toast.success("تم إضافة الحقل");
  }

  function removeCustomField(fieldId: string) {
    const updated = customFields.filter(f => f.id !== fieldId);
    setCustomFields(updated);
    saveCustomFields(updated);
    setDrivers(prev => prev.map(d => {
      const cv = { ...d.customValues };
      delete cv[fieldId];
      return recalc({ ...d, customValues: cv }, updated);
    }));
    toast.success("تم حذف الحقل");
  }

  function renameCustomField(fieldId: string, newLabel: string) {
    const updated = customFields.map(f => f.id === fieldId ? { ...f, label: newLabel } : f);
    setCustomFields(updated);
    saveCustomFields(updated);
    toast.success("تم تعديل الاسم");
  }

  const totals = useMemo(() => {
    const t = { gross: 0, additions: 0, deductions: 0, vat: 0, net: 0, count: drivers.length };
    drivers.forEach(d => { t.gross += d.gross_earnings; t.additions += d.total_additions; t.deductions += d.total_deductions; t.vat += d.vat_amount; t.net += d.net_payout; });
    return t;
  }, [drivers]);

  function openAdd() {
    const d = emptyDriver(customFields);
    setForm(d);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(d: DriverPayroll) {
    setForm({ ...d });
    setEditingId(d.id);
    setShowForm(true);
  }

  function updateForm(key: string, val: string | number | boolean) {
    setForm(prev => {
      const next = { ...prev } as DriverPayroll;
      if (key.startsWith("cf_") || customFields.some(f => f.id === key)) {
        next.customValues = { ...next.customValues, [key]: val as number };
      } else {
        (next as any)[key] = val;
      }
      if (key === "platform") next.order_rate = DEFAULT_RATES[val as string] || 12;
      if (key === "has_company_vehicle" && !val) next.vehicle_cost = 0;
      return recalc(next, customFields);
    });
  }

  function saveDriver() {
    if (!form.name.trim()) { toast.error("أدخل اسم المندوب"); return; }
    if (!form.phone.trim()) { toast.error("أدخل رقم الجوال"); return; }
    const calculated = recalc(form, customFields);
    if (editingId) {
      setDrivers(prev => prev.map(d => d.id === editingId ? calculated : d));
      toast.success("تم تحديث بيانات المندوب");
    } else {
      setDrivers(prev => [...prev, calculated]);
      toast.success("تم إضافة المندوب");
    }
    setShowForm(false);
  }

  function removeDriver(id: string) {
    setDrivers(prev => prev.filter(d => d.id !== id));
    toast.success("تم الحذف");
  }

  async function generateSTCExcel() {
    if (!drivers.length) { toast.error("أضف مندوبين أولاً"); return; }
    const invalid = drivers.filter(d => !normalizePhone(d.phone));
    if (invalid.length) { toast.error(`${invalid.length} مندوب برقم جوال غير صحيح`); return; }

    setGenerating(true);
    const payouts = drivers.map(d => ({
      reference: `${d.name} - ${d.platform} - ${d.contract_type}`,
      phone: normalizePhone(d.phone),
      amount: Math.max(0, d.net_payout),
    }));

    const payload = {
      run_id: "PAY-" + new Date().toISOString().slice(0, 10).replace(/-/g, ""),
      period: new Date().toISOString().slice(0, 10),
      payouts,
    };

    try {
      const res = await fetch(`${API_BASE}/finance/generate-stc-excel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.download_url) {
        window.open(data.download_url, "_blank");
        toast.success("تم إنشاء ملف STC Bank Excel");
      } else {
        downloadLocalSTCExcel(payouts);
      }
    } catch {
      downloadLocalSTCExcel(payouts);
    }
    setGenerating(false);
  }

  function downloadLocalSTCExcel(payouts: { reference: string; phone: string; amount: number }[]) {
    const headers = "Reference,Phone,Amount";
    const rows = payouts.map(p => `"${p.reference}","${p.phone}",${p.amount.toFixed(2)}`);
    const csv = "\uFEFF" + headers + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `STC_Bank_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("تم تحميل ملف STC Bank (CSV)");
  }

  function exportPayrollCSV() {
    if (!drivers.length) return;
    const headers = ["الاسم", "الجوال", "المنصة", "نوع التعاقد", "مركبة شركة", "المدينة", "عدد الطلبات", "سعر الطلب", "الإجمالي", "الإضافات", "الخصومات", "الضريبة", "صافي المستحق"];
    const rows = drivers.map(d => [
      d.name, d.phone, d.platform, d.contract_type, d.has_company_vehicle ? "نعم" : "لا",
      d.city, d.total_orders, d.order_rate, d.gross_earnings, d.total_additions,
      d.total_deductions, d.vat_amount, d.net_payout,
    ].map(v => `"${v}"`).join(","));
    const csv = "\uFEFF" + headers.join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `payroll_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  }

  return (
    <div dir="rtl" style={{ padding: "1.5rem", fontFamily: "var(--con-font-arabic)", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--con-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Calculator size={18} style={{ color: "var(--con-accent)" }} /> حاسبة الرواتب وتصدير STC
          </h1>
          <p style={{ fontSize: 12, color: "var(--con-text-muted)", margin: "4px 0 0" }}>حساب مستحقات المناديب وتجهيز ملفات الدفع</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={openAdd} className="con-btn-primary" style={{ gap: 6, fontSize: 12 }}>
            <Plus size={13} /> إضافة مندوب
          </button>
          <button onClick={exportPayrollCSV} className="con-btn con-btn-ghost" style={{ gap: 6, fontSize: 12 }} disabled={!drivers.length}>
            <Download size={13} /> تصدير CSV
          </button>
          <button onClick={() => window.print()} className="con-btn con-btn-ghost" style={{ gap: 6, fontSize: 12 }}>
            <Printer size={13} /> طباعة
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1rem" }}>
        {[
          { id: "calculator" as const, label: "حاسبة الرواتب", icon: Calculator },
          { id: "stc" as const, label: "تصدير STC Bank", icon: FileSpreadsheet },
          { id: "fields" as const, label: "إدارة بنود الراتب", icon: Edit3 },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="con-btn" style={{
            background: tab === t.id ? "var(--con-accent)" : "transparent",
            color: tab === t.id ? "#fff" : "var(--con-text-muted)",
            border: tab === t.id ? "none" : "1px solid var(--con-border-default)",
            fontSize: 12, gap: 6,
          }}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
        {[
          { label: "عدد المناديب", value: totals.count.toString(), icon: Users, color: "var(--con-accent)" },
          { label: "إجمالي الإيرادات", value: fmt(totals.gross), icon: TrendingUp, color: "var(--con-success)" },
          { label: "الإضافات", value: fmt(totals.additions), icon: Plus, color: "#22c55e" },
          { label: "الخصومات + الضريبة", value: fmt(totals.deductions + totals.vat), icon: TrendingDown, color: "var(--con-danger)" },
          { label: "صافي المستحق", value: fmt(totals.net), icon: Wallet, color: "var(--con-accent)" },
        ].map(k => (
          <div key={k.label} className="con-card" style={{ padding: "0.75rem", textAlign: "center" }}>
            <k.icon size={18} style={{ color: k.color, margin: "0 auto 6px" }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 10, color: "var(--con-text-muted)" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Calculator Tab */}
      {tab === "calculator" && (
        <div className="con-card" style={{ overflow: "auto" }}>
          {!drivers.length ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--con-text-muted)" }}>
              <Calculator size={48} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
              <p style={{ fontSize: 14 }}>أضف مناديب لحساب مستحقاتهم</p>
              <button onClick={openAdd} className="con-btn-primary" style={{ marginTop: "1rem", gap: 6 }}>
                <Plus size={14} /> إضافة مندوب
              </button>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--con-border-default)" }}>
                  {["المندوب", "المنصة", "التعاقد", "مركبة", "الطلبات", "الإجمالي", "الإضافات", "الخصومات", "الضريبة", "الصافي", "أوامر"].map(h => (
                    <th key={h} style={{ padding: "10px 8px", textAlign: "right", fontWeight: 600, color: "var(--con-text-muted)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {drivers.map(d => (
                  <tr key={d.id} style={{ borderBottom: "1px solid var(--con-border-subtle)" }}>
                    <td style={{ padding: "10px 8px" }}>
                      <div style={{ fontWeight: 600, color: "var(--con-text-primary)" }}>{d.name}</div>
                      <div style={{ fontSize: 10, color: "var(--con-text-muted)", fontFamily: "monospace" }}>{d.phone}</div>
                    </td>
                    <td style={{ padding: "10px 8px", color: "var(--con-text-secondary)" }}>{d.platform}</td>
                    <td style={{ padding: "10px 8px", color: "var(--con-text-secondary)" }}>{CONTRACT_TYPES.find(c => c.value === d.contract_type)?.label.split(" ")[0]}</td>
                    <td style={{ padding: "10px 8px" }}>
                      {d.has_company_vehicle ? (
                        <span className="con-badge con-badge-warning" style={{ fontSize: 10 }}>شركة</span>
                      ) : (
                        <span className="con-badge con-badge-info" style={{ fontSize: 10 }}>خاص</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 8px", fontWeight: 600, fontFamily: "monospace" }}>{d.total_orders}</td>
                    <td style={{ padding: "10px 8px", fontWeight: 600, color: "var(--con-text-primary)", fontFamily: "monospace" }}>{fmt(d.gross_earnings)}</td>
                    <td style={{ padding: "10px 8px", color: "var(--con-success)", fontFamily: "monospace" }}>+{fmt(d.total_additions)}</td>
                    <td style={{ padding: "10px 8px", color: "var(--con-danger)", fontFamily: "monospace" }}>-{fmt(d.total_deductions)}</td>
                    <td style={{ padding: "10px 8px", color: "var(--con-warning)", fontFamily: "monospace" }}>-{fmt(d.vat_amount)}</td>
                    <td style={{ padding: "10px 8px", fontWeight: 700, color: "var(--con-accent)", fontFamily: "monospace" }}>{fmt(d.net_payout)}</td>
                    <td style={{ padding: "10px 8px" }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => openEdit(d)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--con-text-muted)" }}><Edit3 size={13} /></button>
                        <button onClick={() => removeDriver(d.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--con-danger)" }}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* STC Tab */}
      {tab === "stc" && (
        <div className="con-card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.5rem" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileSpreadsheet size={24} style={{ color: "var(--con-success)" }} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--con-text-primary)", margin: 0 }}>تصدير ملف STC Bank Excel</h2>
              <p style={{ fontSize: 12, color: "var(--con-text-muted)", margin: "2px 0 0" }}>3 أعمدة: المرجع | رقم الجوال (966+) | المبلغ</p>
            </div>
          </div>

          {/* Preview */}
          <div style={{ background: "var(--con-bg-elevated)", borderRadius: 8, padding: "1rem", marginBottom: "1rem", overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--con-border-default)" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "var(--con-text-primary)" }}>Reference</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "var(--con-text-primary)" }}>Phone</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "var(--con-text-primary)" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {drivers.length ? drivers.map(d => {
                  const phone = normalizePhone(d.phone);
                  return (
                    <tr key={d.id} style={{ borderBottom: "1px solid var(--con-border-subtle)" }}>
                      <td style={{ padding: "8px 12px", color: "var(--con-text-secondary)" }}>{d.name} - {d.platform} - {d.contract_type}</td>
                      <td style={{ padding: "8px 12px", fontFamily: "monospace", color: phone ? "var(--con-text-primary)" : "var(--con-danger)" }}>{phone || "رقم غير صحيح"}</td>
                      <td style={{ padding: "8px 12px", fontFamily: "monospace", fontWeight: 600, color: "var(--con-success)" }}>{Math.max(0, d.net_payout).toFixed(2)}</td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={3} style={{ padding: "2rem", textAlign: "center", color: "var(--con-text-muted)" }}>أضف مناديب من تبويب "حاسبة الرواتب" أولاً</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Total */}
          {drivers.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "rgba(59,130,246,0.06)", borderRadius: 8, marginBottom: "1rem" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--con-text-primary)" }}>إجمالي الدفعة ({drivers.length} مندوب)</span>
              <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace", color: "var(--con-accent)" }}>{fmt(Math.max(0, totals.net))}</span>
            </div>
          )}

          <button onClick={generateSTCExcel} disabled={generating || !drivers.length} className="con-btn-primary" style={{ width: "100%", justifyContent: "center", gap: 8, fontSize: 14, padding: "0.75rem", opacity: generating || !drivers.length ? 0.5 : 1 }}>
            {generating ? <RefreshCw size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
            {generating ? "جارٍ الإنشاء..." : "تحميل ملف STC Bank Excel"}
          </button>
        </div>
      )}

      {/* Fields Management Tab */}
      {tab === "fields" && (
        <div className="con-card" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--con-text-primary)", margin: "0 0 1rem", display: "flex", alignItems: "center", gap: 8 }}>
            <Edit3 size={16} style={{ color: "var(--con-accent)" }} /> إدارة بنود الإضافات والخصومات
          </h2>
          <p style={{ fontSize: 12, color: "var(--con-text-muted)", marginBottom: "1.25rem" }}>
            أضف أو عدّل أو احذف بنود الراتب. التغييرات تنعكس فوراً على حاسبة الرواتب.
          </p>

          {/* Existing fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "1.5rem" }}>
            {customFields.map(f => (
              <div key={f.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8,
                background: f.type === "addition" ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
                border: `1px solid ${f.type === "addition" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: f.type === "addition" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                  color: f.type === "addition" ? "var(--con-success)" : "var(--con-danger)",
                }}>
                  {f.type === "addition" ? <Plus size={14} /> : <TrendingDown size={14} />}
                </div>
                {editFieldId === f.id ? (
                  <input
                    className="con-input"
                    style={{ flex: 1, fontSize: 13 }}
                    defaultValue={f.label}
                    autoFocus
                    onBlur={e => { renameCustomField(f.id, e.target.value); setEditFieldId(null); }}
                    onKeyDown={e => { if (e.key === "Enter") { renameCustomField(f.id, (e.target as HTMLInputElement).value); setEditFieldId(null); } }}
                  />
                ) : (
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--con-text-primary)" }}>{f.label}</span>
                )}
                <span className={`con-badge ${f.type === "addition" ? "con-badge-success" : "con-badge-danger"}`} style={{ fontSize: 10 }}>
                  {f.type === "addition" ? "إضافة" : "خصم"}
                </span>
                <span className="con-badge con-badge-info" style={{ fontSize: 10 }}>
                  {f.calc === "percentage" ? "نسبة %" : "مبلغ ثابت"}
                </span>
                <span style={{ fontSize: 11, color: "var(--con-text-muted)", fontFamily: "monospace" }}>
                  افتراضي: {f.defaultValue}{f.calc === "percentage" ? "%" : " ر.س"}
                </span>
                <button onClick={() => setEditFieldId(f.id)} title="تعديل الاسم" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--con-accent)" }}>
                  <Edit3 size={13} />
                </button>
                <button onClick={() => removeCustomField(f.id)} title="حذف" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--con-danger)" }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Add new field */}
          <div style={{ padding: "1rem", background: "var(--con-bg-elevated)", borderRadius: 10, border: "1px solid var(--con-border-default)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--con-text-primary)", marginBottom: 12 }}>إضافة بند جديد</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 100px", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: "var(--con-text-muted)", display: "block", marginBottom: 4 }}>اسم البند</label>
                <input className="con-input" style={{ width: "100%" }} value={newFieldLabel} onChange={e => setNewFieldLabel(e.target.value)} placeholder="مثال: بدل سكن" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--con-text-muted)", display: "block", marginBottom: 4 }}>النوع</label>
                <select className="con-input" style={{ width: "100%" }} value={newFieldType} onChange={e => setNewFieldType(e.target.value as any)}>
                  <option value="addition">إضافة (+)</option>
                  <option value="deduction">خصم (-)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--con-text-muted)", display: "block", marginBottom: 4 }}>طريقة الحساب</label>
                <select className="con-input" style={{ width: "100%" }} value={newFieldCalc} onChange={e => setNewFieldCalc(e.target.value as any)}>
                  <option value="fixed">مبلغ ثابت (ر.س)</option>
                  <option value="percentage">نسبة من الإجمالي (%)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--con-text-muted)", display: "block", marginBottom: 4 }}>القيمة</label>
                <input className="con-input" dir="ltr" type="number" style={{ width: "100%", fontFamily: "monospace" }} value={newFieldDefault} onChange={e => setNewFieldDefault(parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <button onClick={addCustomField} className="con-btn-primary" style={{ marginTop: 12, gap: 6 }}>
              <Plus size={14} /> إضافة البند
            </button>
          </div>
        </div>
      )}

      {/* ── Add/Edit Modal ─────────────────────────────────────────────── */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", overflow: "auto" }} onClick={() => setShowForm(false)}>
          <div className="con-card" style={{ width: "100%", maxWidth: 640, padding: "1.5rem", maxHeight: "90vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--con-text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Calculator size={16} style={{ color: "var(--con-accent)" }} /> {editingId ? "تعديل بيانات المندوب" : "إضافة مندوب جديد"}
              </h2>
              <button onClick={() => setShowForm(false)} className="con-btn con-btn-ghost" style={{ padding: 4 }}><X size={16} /></button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {/* Basic Info */}
              <FormField label="اسم المندوب" icon={User}>
                <input className="con-input" style={{ width: "100%" }} value={form.name} onChange={e => updateForm("name", e.target.value)} placeholder="أحمد محمد" />
              </FormField>
              <FormField label="رقم الجوال (5XXXXXXXX)" icon={Phone}>
                <input className="con-input" dir="ltr" style={{ width: "100%", fontFamily: "monospace" }} value={form.phone} onChange={e => updateForm("phone", e.target.value)} placeholder="563636006" maxLength={12} />
              </FormField>
              <FormField label="المنصة" icon={Building2}>
                <select className="con-input" style={{ width: "100%" }} value={form.platform} onChange={e => updateForm("platform", e.target.value)}>
                  {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </FormField>
              <FormField label="نوع التعاقد" icon={Receipt}>
                <select className="con-input" style={{ width: "100%" }} value={form.contract_type} onChange={e => updateForm("contract_type", e.target.value as any)}>
                  {CONTRACT_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </FormField>
              <FormField label="المدينة" icon={Building2}>
                <select className="con-input" style={{ width: "100%" }} value={form.city} onChange={e => updateForm("city", e.target.value)}>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="نوع المركبة" icon={Car}>
                <select className="con-input" style={{ width: "100%" }} value={form.vehicle_type} onChange={e => updateForm("vehicle_type", e.target.value)}>
                  {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </FormField>

              {/* Vehicle toggle */}
              <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: form.has_company_vehicle ? "rgba(234,179,8,0.08)" : "var(--con-bg-elevated)", border: `1px solid ${form.has_company_vehicle ? "rgba(234,179,8,0.3)" : "var(--con-border-default)"}` }}>
                <input type="checkbox" checked={form.has_company_vehicle} onChange={e => updateForm("has_company_vehicle", e.target.checked)} style={{ width: 16, height: 16 }} />
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--con-text-primary)" }}>مركبة من الشركة</span>
                  {form.has_company_vehicle && (
                    <span style={{ fontSize: 11, color: "var(--con-warning)", marginRight: 8 }}>
                      (خصم شهري: {fmt(VEHICLE_MONTHLY_COST[form.vehicle_type] || 0)})
                    </span>
                  )}
                </div>
              </div>

              {/* Orders & Rate */}
              <FormField label="عدد الطلبات" icon={TrendingUp}>
                <input className="con-input" dir="ltr" type="number" style={{ width: "100%", fontFamily: "monospace" }} value={form.total_orders} onChange={e => updateForm("total_orders", parseInt(e.target.value) || 0)} />
              </FormField>
              <FormField label="سعر الطلب الواحد (ر.س)" icon={DollarSign}>
                <input className="con-input" dir="ltr" type="number" style={{ width: "100%", fontFamily: "monospace" }} value={form.order_rate} onChange={e => updateForm("order_rate", parseFloat(e.target.value) || 0)} />
              </FormField>

              {/* Dynamic Additions */}
              {customFields.filter(f => f.type === "addition").length > 0 && (
                <div style={{ gridColumn: "1 / -1", fontSize: 12, fontWeight: 700, color: "var(--con-success)", marginTop: 8 }}>الإضافات</div>
              )}
              {customFields.filter(f => f.type === "addition").map(f => (
                <FormField key={f.id} label={`${f.label}${f.calc === "percentage" ? " (%)" : ""}`} icon={Plus}>
                  <input className="con-input" dir="ltr" type="number" style={{ width: "100%", fontFamily: "monospace" }} value={form.customValues[f.id] || 0} onChange={e => updateForm(f.id, parseFloat(e.target.value) || 0)} />
                </FormField>
              ))}

              {/* Dynamic Deductions */}
              {customFields.filter(f => f.type === "deduction").length > 0 && (
                <div style={{ gridColumn: "1 / -1", fontSize: 12, fontWeight: 700, color: "var(--con-danger)", marginTop: 8 }}>الخصومات</div>
              )}
              {customFields.filter(f => f.type === "deduction").map(f => (
                <FormField key={f.id} label={`${f.label}${f.calc === "percentage" ? " (%)" : ""}`} icon={Receipt}>
                  <input className="con-input" dir="ltr" type="number" style={{ width: "100%", fontFamily: "monospace" }} value={form.customValues[f.id] || 0} onChange={e => updateForm(f.id, parseFloat(e.target.value) || 0)} />
                </FormField>
              ))}
            </div>

            {/* Live calculation summary */}
            <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--con-bg-elevated)", borderRadius: 8, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", textAlign: "center" }}>
              <div><div style={{ fontSize: 10, color: "var(--con-text-muted)" }}>الإجمالي</div><div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace" }}>{fmt(form.gross_earnings)}</div></div>
              <div><div style={{ fontSize: 10, color: "var(--con-success)" }}>+ الإضافات</div><div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "var(--con-success)" }}>{fmt(form.total_additions)}</div></div>
              <div><div style={{ fontSize: 10, color: "var(--con-danger)" }}>- الخصومات</div><div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "var(--con-danger)" }}>{fmt(form.total_deductions)}</div></div>
              <div><div style={{ fontSize: 10, color: "var(--con-accent)" }}>الصافي</div><div style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace", color: "var(--con-accent)" }}>{fmt(form.net_payout)}</div></div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button onClick={saveDriver} className="con-btn-primary" style={{ flex: 1, justifyContent: "center", gap: 6 }}>
                <Save size={14} /> {editingId ? "حفظ التعديلات" : "إضافة المندوب"}
              </button>
              <button onClick={() => setShowForm(false)} className="con-btn con-btn-ghost" style={{ justifyContent: "center" }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--con-text-muted)", display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
        <Icon size={11} /> {label}
      </label>
      {children}
    </div>
  );
}
