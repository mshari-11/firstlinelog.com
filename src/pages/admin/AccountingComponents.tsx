/**
 * مكونات المحاسبة — Accounting Components (Rules Engine)
 * CRUD for flexible additions/deductions applied to driver payouts
 */
import { useState, useEffect } from "react";
import {
  Calculator,
  Plus,
  Edit2,
  Trash2,
  Save,
  ToggleRight,
  ToggleLeft,
  TrendingUp,
  TrendingDown,
  Users,
  MapPin,
  Building2,
  Truck,
} from "lucide-react";
import {
  PageWrapper,
  PageHeader,
  Card,
  KPIGrid,
  KPICard,
  Toolbar,
  Select,
  Badge,
  Button,
  Modal,
  Table,
  ConfirmDialog,
} from "@/components/admin/ui";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type {
  AccountingComponent,
  ScopeType,
} from "@/stores/usePayoutWorkflowStore";

const SCOPE_LABELS: Record<
  ScopeType,
  { label: string; icon: React.ElementType }
> = {
  all: { label: "جميع السائقين", icon: Users },
  contract_type: { label: "نوع التعاقد", icon: Building2 },
  city: { label: "المدينة", icon: MapPin },
  platform: { label: "المنصة", icon: Truck },
  driver: { label: "سائق محدد", icon: Users },
};

const EMPTY_FORM: Partial<AccountingComponent> = {
  name_ar: "",
  name_en: "",
  component_type: "addition",
  calc_method: "fixed",
  amount: 0,
  percentage: 0,
  scope_type: "all",
  scope_value: "",
  is_active: true,
  priority: 0,
  effective_from: new Date().toISOString().split("T")[0],
};

export default function AccountingComponents() {
  const [components, setComponents] =
    useState<AccountingComponent[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AccountingComponent | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadRules() {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .schema("finance")
          .from("accounting_components")
          .select("*")
          .order("priority", { ascending: true });
        if (error) throw error;
        if (data) setComponents(data as AccountingComponent[]);
      } catch {
        /* supabase unavailable — show empty state */
      }
    }
    loadRules();
  }, []);

  const filtered = components.filter((c) => {
    if (
      search &&
      !c.name_ar.includes(search) &&
      !(c.name_en || "").toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (typeFilter !== "all" && c.component_type !== typeFilter) return false;
    return true;
  });

  const additions = components.filter(
    (c) => c.component_type === "addition" && c.is_active,
  ).length;
  const deductions = components.filter(
    (c) => c.component_type === "deduction" && c.is_active,
  ).length;

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(comp: AccountingComponent) {
    setEditing(comp);
    setForm({ ...comp });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name_ar) {
      toast.error("اسم المكوّن مطلوب");
      return;
    }
    setSaving(true);

    const record = {
      name_ar: form.name_ar,
      name_en: form.name_en,
      component_type: form.component_type,
      calc_method: form.calc_method,
      amount: form.calc_method === "fixed" ? form.amount : null,
      percentage: form.calc_method === "percentage" ? form.percentage : null,
      scope_type: form.scope_type,
      scope_value: form.scope_value || "[]",
      is_active: form.is_active,
      priority: form.priority || 0,
      effective_from: form.effective_from,
      effective_to: form.effective_to || null,
    };

    if (editing) {
      // Update
      try {
        await fetch(`${API_BASE}/accounting-rules/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...record, ruleId: editing.id }),
        });
        setComponents((prev) =>
          prev.map((c) =>
            c.id === editing.id
              ? ({ ...c, ...record } as AccountingComponent)
              : c,
          ),
        );
        toast.success("تم تحديث المكوّن");
      } catch {
        toast.error("فشل تحديث المكوّن");
      }
    } else {
      // Create
      try {
        const res = await fetch(`${API_BASE}/accounting-rules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record),
        });
        const data = await res.json();
        const newComp: AccountingComponent = {
          ...record,
          id: data.id || `c-${Date.now()}`,
        } as AccountingComponent;
        setComponents((prev) => [...prev, newComp]);
        toast.success("تم إنشاء المكوّن");
      } catch {
        toast.error("فشل إنشاء المكوّن");
      }
    }
    setSaving(false);
    setModalOpen(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await fetch(`${API_BASE}/accounting-rules/${deleteId}`, {
        method: "DELETE",
      });
      setComponents((prev) => prev.filter((c) => c.id !== deleteId));
      toast.success("تم حذف المكوّن");
    } catch {
      toast.error("فشل حذف المكوّن");
    }
    setDeleteId(null);
  }

  function toggleActive(id: string) {
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_active: !c.is_active } : c)),
    );
  }

  const set = (key: string, val: any) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <PageWrapper>
      <PageHeader
        icon={Calculator}
        title="مكونات المحاسبة"
        subtitle="قواعد الإضافات والخصومات المطبقة على دفعات السائقين"
        actions={
          <Button icon={Plus} onClick={openCreate}>
            إضافة مكوّن
          </Button>
        }
      />

      <KPIGrid cols="repeat(4, 1fr)">
        <KPICard
          label="إجمالي المكونات"
          value={components.length}
          icon={Calculator}
          accent="var(--con-brand)"
        />
        <KPICard
          label="إضافات نشطة"
          value={additions}
          icon={TrendingUp}
          accent="var(--con-success)"
        />
        <KPICard
          label="خصومات نشطة"
          value={deductions}
          icon={TrendingDown}
          accent="var(--con-danger)"
        />
        <KPICard
          label="معطّلة"
          value={components.filter((c) => !c.is_active).length}
          icon={ToggleLeft}
          accent="var(--con-text-muted)"
        />
      </KPIGrid>

      <Toolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="ابحث عن مكوّن..."
      >
        <Select
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: "all", label: "الكل" },
            { value: "addition", label: "إضافات" },
            { value: "deduction", label: "خصومات" },
          ]}
        />
      </Toolbar>

      <Card noPadding>
        <Table
          headers={[
            "المكوّن",
            "النوع",
            "الحساب",
            "المبلغ",
            "النطاق",
            "الحالة",
            "إجراءات",
          ]}
          isEmpty={filtered.length === 0}
          emptyText="لا توجد قواعد محاسبية"
        >
          {filtered.map((c) => {
            const scopeInfo = SCOPE_LABELS[c.scope_type];
            return (
              <tr key={c.id}>
                <td>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "var(--con-text-primary)",
                    }}
                  >
                    {c.name_ar}
                  </div>
                  {c.name_en && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--con-text-muted)",
                        fontFamily: "var(--con-font-mono)",
                      }}
                    >
                      {c.name_en}
                    </div>
                  )}
                </td>
                <td>
                  <Badge
                    variant={
                      c.component_type === "addition" ? "success" : "danger"
                    }
                    dot
                  >
                    {c.component_type === "addition" ? "إضافة" : "خصم"}
                  </Badge>
                </td>
                <td>
                  <Badge variant="brand">
                    {c.calc_method === "fixed" ? "مبلغ ثابت" : "نسبة %"}
                  </Badge>
                </td>
                <td
                  style={{
                    fontFamily: "var(--con-font-mono)",
                    fontWeight: 600,
                    color:
                      c.component_type === "addition"
                        ? "var(--con-success)"
                        : "var(--con-danger)",
                  }}
                >
                  {c.calc_method === "fixed"
                    ? `${c.amount?.toLocaleString("ar-SA")} ر.س`
                    : `${c.percentage}%`}
                </td>
                <td>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <scopeInfo.icon
                      size={12}
                      style={{ color: "var(--con-text-muted)" }}
                    />
                    <span style={{ fontSize: 12 }}>{scopeInfo.label}</span>
                  </div>
                </td>
                <td>
                  <button
                    onClick={() => toggleActive(c.id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: c.is_active
                        ? "var(--con-success)"
                        : "var(--con-text-disabled)",
                      display: "flex",
                    }}
                  >
                    {c.is_active ? (
                      <ToggleRight size={20} />
                    ) : (
                      <ToggleLeft size={20} />
                    )}
                  </button>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={() => openEdit(c)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--con-brand)",
                        padding: 4,
                      }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteId(c.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--con-danger)",
                        padding: 4,
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "تعديل المكوّن" : "إضافة مكوّن جديد"}
        width={520}
        actions={
          <>
            <Button onClick={handleSave} disabled={saving} icon={Save}>
              {saving ? "جارٍ الحفظ..." : "حفظ"}
            </Button>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              إلغاء
            </Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--con-text-muted)",
                display: "block",
                marginBottom: 4,
              }}
            >
              اسم المكوّن (عربي) *
            </label>
            <input
              className="con-input"
              style={{ width: "100%" }}
              value={form.name_ar || ""}
              onChange={(e) => set("name_ar", e.target.value)}
              placeholder="مثال: بدل تشغيل"
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--con-text-muted)",
                display: "block",
                marginBottom: 4,
              }}
            >
              اسم المكوّن (إنجليزي)
            </label>
            <input
              className="con-input"
              style={{ width: "100%" }}
              value={form.name_en || ""}
              onChange={(e) => set("name_en", e.target.value)}
              placeholder="e.g. Operations Allowance"
              dir="ltr"
            />
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--con-text-muted)",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                النوع
              </label>
              <select
                className="con-input"
                style={{ width: "100%" }}
                value={form.component_type}
                onChange={(e) => set("component_type", e.target.value)}
              >
                <option value="addition">إضافة (+)</option>
                <option value="deduction">خصم (-)</option>
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--con-text-muted)",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                طريقة الحساب
              </label>
              <select
                className="con-input"
                style={{ width: "100%" }}
                value={form.calc_method}
                onChange={(e) => set("calc_method", e.target.value)}
              >
                <option value="fixed">مبلغ ثابت</option>
                <option value="percentage">نسبة %</option>
              </select>
            </div>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            {form.calc_method === "fixed" ? (
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--con-text-muted)",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  المبلغ (ر.س)
                </label>
                <input
                  className="con-input"
                  style={{ width: "100%" }}
                  type="number"
                  value={form.amount || ""}
                  onChange={(e) => set("amount", Number(e.target.value))}
                  dir="ltr"
                />
              </div>
            ) : (
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--con-text-muted)",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  النسبة %
                </label>
                <input
                  className="con-input"
                  style={{ width: "100%" }}
                  type="number"
                  value={form.percentage || ""}
                  onChange={(e) => set("percentage", Number(e.target.value))}
                  dir="ltr"
                />
              </div>
            )}
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--con-text-muted)",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                الأولوية
              </label>
              <input
                className="con-input"
                style={{ width: "100%" }}
                type="number"
                value={form.priority || 0}
                onChange={(e) => set("priority", Number(e.target.value))}
                dir="ltr"
              />
            </div>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--con-text-muted)",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                النطاق
              </label>
              <select
                className="con-input"
                style={{ width: "100%" }}
                value={form.scope_type}
                onChange={(e) => set("scope_type", e.target.value)}
              >
                <option value="all">جميع السائقين</option>
                <option value="contract_type">نوع التعاقد</option>
                <option value="city">المدينة</option>
                <option value="platform">المنصة</option>
                <option value="driver">سائق محدد</option>
              </select>
            </div>
            {form.scope_type !== "all" && (
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--con-text-muted)",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  قيمة النطاق (JSON)
                </label>
                <input
                  className="con-input"
                  style={{ width: "100%" }}
                  value={form.scope_value || ""}
                  onChange={(e) => set("scope_value", e.target.value)}
                  placeholder='["value1","value2"]'
                  dir="ltr"
                />
              </div>
            )}
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--con-text-muted)",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                تاريخ البداية
              </label>
              <input
                className="con-input"
                style={{ width: "100%" }}
                type="date"
                value={form.effective_from || ""}
                onChange={(e) => set("effective_from", e.target.value)}
                dir="ltr"
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--con-text-muted)",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                تاريخ النهاية (اختياري)
              </label>
              <input
                className="con-input"
                style={{ width: "100%" }}
                type="date"
                value={form.effective_to || ""}
                onChange={(e) => set("effective_to", e.target.value)}
                dir="ltr"
              />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="حذف المكوّن"
        message="هل أنت متأكد من حذف هذا المكوّن المحاسبي؟ لن يمكن استرجاعه."
        confirmLabel="حذف"
        variant="danger"
      />
    </PageWrapper>
  );
}
