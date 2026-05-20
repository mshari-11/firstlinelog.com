/**
 * صفحة إدارة الموظفين والصلاحيات
 * Enterprise HR Console — staff management, permissions, departments
 */
import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabase";
import { API_BASE } from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Field, FieldLabel, FieldContent } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Empty,
  EmptyMedia as EmptyIcon,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import {
  Users,
  Building2,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  ShieldOff,
  X,
  Check,
  Eye,
  ClipboardList,
  DollarSign,
  MessageSquare,
  FileSpreadsheet,
  Car,
  UserPlus,
  AlertCircle,
  Download,
  Printer,
  Upload,
  FileDown,
} from "lucide-react";

function downloadCSV(data: Record<string, any>[], filename: string) {
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

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Permission {
  key: string;
  labelAr: string;
  icon: React.ElementType;
}

const ALL_PERMISSIONS: Permission[] = [
  { key: "couriers", labelAr: "المناديب", icon: Users },
  { key: "orders", labelAr: "الطلبات", icon: ClipboardList },
  { key: "finance", labelAr: "المالية والرواتب", icon: DollarSign },
  { key: "complaints", labelAr: "الشكاوى", icon: MessageSquare },
  { key: "excel", labelAr: "استيراد Excel", icon: FileSpreadsheet },
  { key: "reports", labelAr: "التقارير", icon: Eye },
  { key: "vehicles", labelAr: "المركبات", icon: Car },
  { key: "staff", labelAr: "الموظفين والأقسام", icon: Building2 },
  { key: "dispatch", labelAr: "الخريطة والإرسال", icon: Users },
  { key: "wallet", labelAr: "محافظ السائقين", icon: DollarSign },
];

interface StaffMember {
  id: string;
  user_id: string;
  job_title_ar: string;
  permissions: Record<string, boolean>;
  can_approve: boolean;
  approval_limit: number;
  is_active: boolean;
  department_id: string | null;
  name: string;
  email: string;
  phone: string;
  role: string;
  department_name: string;
}

interface Department {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  is_active: boolean;
}

// ─── Shared Modal Shell ────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      dir="rtl"
    >
      <div
        style={{
          background: "var(--con-bg-elevated)",
          border: "1px solid var(--con-border-strong)",
          borderRadius: 12,
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--con-border-default)",
          }}
        >
          <h2
            style={{
              fontSize: "var(--con-text-card-title)",
              fontWeight: 600,
              color: "var(--con-text-primary)",
              margin: 0,
            }}
          >
            {title}
          </h2>
          <button
            className="con-btn-ghost"
            style={{ padding: "4px 8px" }}
            onClick={onClose}
          >
            <X size={15} />
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

function ModalField({
  label,
  value,
  onChange,
  type = "text",
  span = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  span?: boolean;
  placeholder?: string;
}) {
  const id = label.replace(/\s/g, "-");
  return (
    <Field style={span ? { gridColumn: "span 2" } : {}}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <FieldContent>
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </FieldContent>
    </Field>
  );
}

// ─── Permission Toggle ─────────────────────────────────────────────────────────

function PermissionToggle({
  perm,
  granted,
  onToggle,
}: {
  perm: Permission;
  granted: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 8,
        width: "100%",
        textAlign: "right",
        border: "1px solid",
        borderColor: granted
          ? "var(--con-border-brand)"
          : "var(--con-border-default)",
        background: granted ? "rgba(59,130,246,0.08)" : "transparent",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 6,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: granted
            ? "rgba(59,130,246,0.15)"
            : "var(--con-bg-surface-2)",
        }}
      >
        <perm.icon
          size={14}
          style={{
            color: granted ? "var(--con-brand)" : "var(--con-text-muted)",
          }}
        />
      </div>
      <span
        style={{
          flex: 1,
          fontSize: "var(--con-text-table)",
          color: granted ? "var(--con-text-primary)" : "var(--con-text-muted)",
          fontWeight: granted ? 500 : 400,
        }}
      >
        {perm.labelAr}
      </span>
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: granted ? "var(--con-brand)" : "var(--con-bg-surface-2)",
          border: `1px solid ${granted ? "var(--con-brand)" : "var(--con-border-strong)"}`,
          transition: "all 0.15s",
        }}
      >
        {granted ? (
          <Check size={10} style={{ color: "#fff" }} />
        ) : (
          <X size={9} style={{ color: "var(--con-text-muted)" }} />
        )}
      </div>
    </button>
  );
}

// ─── Staff Card ────────────────────────────────────────────────────────────────

function StaffCard({
  member,
  selected,
  onClick,
}: {
  member: StaffMember;
  selected: boolean;
  onClick: () => void;
}) {
  const permCount = Object.values(member.permissions).filter(Boolean).length;
  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px 14px",
        borderRadius: 8,
        cursor: "pointer",
        border: "1px solid",
        borderColor: selected
          ? "var(--con-brand)"
          : "var(--con-border-default)",
        background: selected ? "rgba(59,130,246,0.07)" : "transparent",
        transition: "all 0.15s",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 700,
          background: member.is_active
            ? "rgba(59,130,246,0.15)"
            : "var(--con-bg-surface-2)",
          color: member.is_active
            ? "var(--con-brand)"
            : "var(--con-text-muted)",
        }}
      >
        {member.name.charAt(0) || "م"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: "var(--con-text-table)",
              fontWeight: 500,
              color: "var(--con-text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {member.name}
          </span>
          {!member.is_active && (
            <span className="con-badge con-badge-sm con-badge-danger">
              معطّل
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: "var(--con-text-caption)",
            color: "var(--con-text-muted)",
            marginTop: 1,
          }}
        >
          {member.job_title_ar}
          {member.department_name !== "—" && ` · ${member.department_name}`}
        </div>
      </div>
      <div
        style={{
          fontSize: "var(--con-text-caption)",
          fontWeight: 600,
          color: permCount > 0 ? "var(--con-brand)" : "var(--con-text-muted)",
          flexShrink: 0,
        }}
      >
        {permCount}/{ALL_PERMISSIONS.length}
      </div>
    </div>
  );
}

// ─── Permissions Panel ─────────────────────────────────────────────────────────

function PermissionsPanel({
  member,
  departments,
  onTogglePermission,
  onGrantAll,
  onRevokeAll,
  onToggleActive,
  onClose,
}: {
  member: StaffMember;
  departments: Department[];
  onTogglePermission: (key: string, current: boolean) => void;
  onGrantAll: () => void;
  onRevokeAll: () => void;
  onToggleActive: () => void;
  onClose: () => void;
}) {
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const dept = departments.find((d) => d.id === member.department_id);
  const grantedCount = Object.values(member.permissions).filter(Boolean).length;

  return (
    <div
      style={{
        background: "var(--con-bg-surface-1)",
        border: "1px solid var(--con-border-default)",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--con-border-default)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 700,
            background: member.is_active
              ? "rgba(59,130,246,0.15)"
              : "var(--con-bg-surface-2)",
            color: member.is_active
              ? "var(--con-brand)"
              : "var(--con-text-muted)",
          }}
        >
          {member.name.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: "var(--con-text-card-title)",
                fontWeight: 600,
                color: "var(--con-text-primary)",
              }}
            >
              {member.name}
            </span>
            <span
              className={`con-badge con-badge-sm ${member.is_active ? "con-badge-success" : "con-badge-danger"}`}
            >
              {member.is_active ? "نشط" : "معطّل"}
            </span>
          </div>
          <div
            style={{
              fontSize: "var(--con-text-caption)",
              color: "var(--con-text-muted)",
              marginTop: 2,
            }}
          >
            {member.job_title_ar}
            {dept ? ` · ${dept.name_ar}` : ""}
            {" · "}
            <span
              style={{
                fontFamily: "var(--con-font-mono)",
                color: "var(--con-text-muted)",
              }}
            >
              {member.email}
            </span>
          </div>
        </div>
        <button
          className="con-btn-ghost"
          style={{ padding: "5px 8px" }}
          onClick={onClose}
        >
          <X size={14} />
        </button>
      </div>

      {/* Quick actions bar */}
      <div
        style={{
          padding: "10px 20px",
          borderBottom: "1px solid var(--con-border-default)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: "var(--con-text-caption)",
            color: "var(--con-text-muted)",
            flex: 1,
          }}
        >
          الصلاحيات: {grantedCount}/{ALL_PERMISSIONS.length} ممنوحة
        </span>
        <button
          onClick={onGrantAll}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: 5,
            cursor: "pointer",
            background: "rgba(22,163,74,0.1)",
            color: "var(--con-success)",
            border: "1px solid rgba(22,163,74,0.25)",
            transition: "all 0.15s",
          }}
        >
          <ShieldCheck size={12} /> منح الكل
        </button>
        <button
          onClick={onRevokeAll}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: 5,
            cursor: "pointer",
            background: "rgba(220,38,38,0.08)",
            color: "var(--con-danger)",
            border: "1px solid rgba(220,38,38,0.2)",
            transition: "all 0.15s",
          }}
        >
          <ShieldOff size={12} /> سحب الكل
        </button>
        <button
          onClick={
            member.is_active
              ? () => setShowDeactivateDialog(true)
              : onToggleActive
          }
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: 5,
            cursor: "pointer",
            background: member.is_active
              ? "rgba(220,38,38,0.08)"
              : "rgba(22,163,74,0.1)",
            color: member.is_active
              ? "var(--con-danger)"
              : "var(--con-success)",
            border: `1px solid ${member.is_active ? "rgba(220,38,38,0.2)" : "rgba(22,163,74,0.25)"}`,
            transition: "all 0.15s",
          }}
        >
          {member.is_active ? (
            <ShieldOff size={12} />
          ) : (
            <ShieldCheck size={12} />
          )}{" "}
          {member.is_active ? "تعطيل" : "تفعيل"}
        </button>
      </div>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog
        open={showDeactivateDialog}
        onOpenChange={setShowDeactivateDialog}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد تعطيل الموظف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من تعطيل حساب <strong>{member.name}</strong>؟ لن
              يتمكن من الدخول إلى لوحة الإدارة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDeactivateDialog(false);
                onToggleActive();
              }}
              style={{ background: "var(--con-danger)" }}
            >
              تأكيد التعطيل
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permission grid */}
      <div
        style={{
          padding: 16,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 8,
        }}
      >
        {ALL_PERMISSIONS.map((perm) => {
          const granted = member.permissions[perm.key] ?? false;
          return (
            <PermissionToggle
              key={perm.key}
              perm={perm}
              granted={granted}
              onToggle={() => onTogglePermission(perm.key, granted)}
            />
          );
        })}
      </div>

      {/* Metadata strip */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--con-border-default)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
        }}
      >
        <div
          style={{
            background: "var(--con-bg-surface-2)",
            borderRadius: 7,
            padding: "8px 12px",
          }}
        >
          <div
            style={{
              fontSize: "var(--con-text-caption)",
              color: "var(--con-text-muted)",
              marginBottom: 3,
            }}
          >
            صلاحية الاعتماد
          </div>
          <div
            style={{
              fontSize: "var(--con-text-table)",
              fontWeight: 600,
              color: member.can_approve
                ? "var(--con-success)"
                : "var(--con-text-muted)",
            }}
          >
            {member.can_approve
              ? `نعم — حتى ${member.approval_limit?.toLocaleString("ar")} ر.س`
              : "لا"}
          </div>
        </div>
        <div
          style={{
            background: "var(--con-bg-surface-2)",
            borderRadius: 7,
            padding: "8px 12px",
          }}
        >
          <div
            style={{
              fontSize: "var(--con-text-caption)",
              color: "var(--con-text-muted)",
              marginBottom: 3,
            }}
          >
            الصلاحيات الممنوحة
          </div>
          <div
            style={{
              fontFamily: "var(--con-font-mono)",
              fontSize: "var(--con-text-table)",
              fontWeight: 600,
              color:
                grantedCount > 0 ? "var(--con-brand)" : "var(--con-text-muted)",
            }}
          >
            {grantedCount} / {ALL_PERMISSIONS.length}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Departments Tab ───────────────────────────────────────────────────────────

function DepartmentsTab({
  departments,
  staff,
  showAddModal,
  onCloseAdd,
  onRefresh,
}: {
  departments: Department[];
  staff: StaffMember[];
  showAddModal: boolean;
  onCloseAdd: () => void;
  onRefresh: () => void;
}) {
  return (
    <div>
      {departments.length === 0 ? (
        <Empty>
          <EmptyIcon>
            <Building2 className="size-10" />
          </EmptyIcon>
          <EmptyTitle>لا توجد أقسام بعد</EmptyTitle>
          <EmptyDescription>لم يتم إنشاء أي قسم حتى الآن</EmptyDescription>
        </Empty>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          {departments.map((dept) => {
            const deptStaff = staff.filter((s) => s.department_id === dept.id);
            return (
              <div
                key={dept.id}
                style={{
                  background: "var(--con-bg-surface-1)",
                  border: "1px solid var(--con-border-default)",
                  borderRadius: 10,
                  padding: "16px 18px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(59,130,246,0.12)",
                    }}
                  >
                    <Building2
                      size={16}
                      style={{ color: "var(--con-brand)" }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "var(--con-text-card-title)",
                        fontWeight: 600,
                        color: "var(--con-text-primary)",
                        marginBottom: 2,
                      }}
                    >
                      {dept.name_ar}
                    </div>
                    {dept.description && (
                      <div
                        style={{
                          fontSize: "var(--con-text-caption)",
                          color: "var(--con-text-muted)",
                        }}
                      >
                        {dept.description}
                      </div>
                    )}
                  </div>
                  <span
                    className={`con-badge con-badge-sm ${dept.is_active ? "con-badge-success" : "con-badge-danger"}`}
                  >
                    {dept.is_active ? "نشط" : "معطّل"}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: 10,
                    borderTop: "1px solid var(--con-border-default)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--con-text-caption)",
                      color: "var(--con-text-muted)",
                    }}
                  >
                    {deptStaff.length} موظف
                  </span>
                  <div style={{ display: "flex", gap: -6 }}>
                    {deptStaff.slice(0, 4).map((s) => (
                      <div
                        key={s.id}
                        title={s.name}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: "var(--con-bg-elevated)",
                          border: "2px solid var(--con-bg-surface-1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: 700,
                          color: "var(--con-brand)",
                          marginInlineStart: -4,
                        }}
                      >
                        {s.name.charAt(0)}
                      </div>
                    ))}
                    {deptStaff.length > 4 && (
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: "var(--con-bg-elevated)",
                          border: "2px solid var(--con-bg-surface-1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          color: "var(--con-text-muted)",
                          marginInlineStart: -4,
                        }}
                      >
                        +{deptStaff.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showAddModal && (
        <AddDepartmentModal onClose={onCloseAdd} onSaved={onRefresh} />
      )}
    </div>
  );
}

// ─── Add Staff Modal ───────────────────────────────────────────────────────────

function AddStaffModal({
  departments,
  onClose,
  onSaved,
}: {
  departments: Department[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    job_title_ar: "",
    department_id: "",
    role: "staff",
    can_approve: false,
    approval_limit: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!form.name || !form.email || !form.password) {
      setError("يرجى تعبئة الاسم والبريد الإلكتروني وكلمة المرور");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/admin/create-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role: form.role,
          job_title_ar: form.job_title_ar || "موظف",
          department_id: form.department_id || null,
          can_approve: form.can_approve,
          approval_limit: form.approval_limit,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "حدث خطأ أثناء إنشاء الحساب");
        setSaving(false);
        return;
      }
    } catch {
      setError("تعذّر الاتصال بالخادم");
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <Modal title="إضافة موظف جديد" onClose={onClose}>
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(220,38,38,0.08)",
            border: "1px solid rgba(220,38,38,0.25)",
            color: "var(--con-danger)",
            fontSize: "var(--con-text-table)",
            padding: "10px 12px",
            borderRadius: 7,
            marginBottom: 14,
          }}
        >
          <AlertCircle size={14} /> {error}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <ModalField
          label="الاسم الكامل"
          value={form.name}
          onChange={(v) => setForm((f) => ({ ...f, name: v }))}
        />
        <ModalField
          label="رقم الجوال"
          value={form.phone}
          onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
        />
        <ModalField
          label="البريد الإلكتروني"
          value={form.email}
          onChange={(v) => setForm((f) => ({ ...f, email: v }))}
          type="email"
          span
        />
        <ModalField
          label="كلمة المرور"
          value={form.password}
          onChange={(v) => setForm((f) => ({ ...f, password: v }))}
          type="password"
          span
        />
        <ModalField
          label="المسمى الوظيفي"
          value={form.job_title_ar}
          onChange={(v) => setForm((f) => ({ ...f, job_title_ar: v }))}
        />
        <div>
          <label
            style={{
              fontSize: "var(--con-text-caption)",
              color: "var(--con-text-muted)",
              display: "block",
              marginBottom: 5,
              fontWeight: 500,
            }}
          >
            القسم
          </label>
          <select
            value={form.department_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, department_id: e.target.value }))
            }
            className="con-input"
            style={{ width: "100%" }}
          >
            <option value="">— بدون قسم —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name_ar}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            style={{
              fontSize: "var(--con-text-caption)",
              color: "var(--con-text-muted)",
              display: "block",
              marginBottom: 5,
              fontWeight: 500,
            }}
          >
            الدور
          </label>
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            className="con-input"
            style={{ width: "100%" }}
          >
            <option value="staff">موظف</option>
            <option value="admin">أدمن</option>
          </select>
        </div>
        <div
          style={{
            gridColumn: "span 2",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Checkbox
            id="can_approve"
            checked={form.can_approve}
            onCheckedChange={(val) =>
              setForm((f) => ({ ...f, can_approve: !!val }))
            }
          />
          <label
            htmlFor="can_approve"
            style={{
              fontSize: "var(--con-text-table)",
              color: "var(--con-text-secondary)",
              cursor: "pointer",
            }}
          >
            صلاحية الاعتماد
          </label>
          {form.can_approve && (
            <div style={{ flex: 1 }}>
              <ModalField
                label=""
                value={String(form.approval_limit)}
                onChange={(v) =>
                  setForm((f) => ({ ...f, approval_limit: Number(v) }))
                }
                type="number"
                placeholder="الحد الأقصى (ر.س)"
              />
            </div>
          )}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 20,
        }}
      >
        <button onClick={onClose} className="con-btn-ghost">
          إلغاء
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="con-btn-primary"
          style={{ opacity: saving ? 0.6 : 1 }}
        >
          {saving ? (
            "جارٍ الحفظ..."
          ) : (
            <>
              <UserPlus size={14} /> إضافة موظف
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}

// ─── Add Department Modal ──────────────────────────────────────────────────────

function AddDepartmentModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ name: "", name_ar: "", description: "" });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!supabase || !form.name_ar) return;
    setSaving(true);
    await supabase.from("departments").insert({
      name: form.name || form.name_ar,
      name_ar: form.name_ar,
      description: form.description,
      is_active: true,
    });
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <Modal title="إضافة قسم جديد" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <ModalField
          label="اسم القسم بالعربية"
          value={form.name_ar}
          onChange={(v) => setForm((f) => ({ ...f, name_ar: v }))}
        />
        <ModalField
          label="اسم القسم بالإنجليزية (اختياري)"
          value={form.name}
          onChange={(v) => setForm((f) => ({ ...f, name: v }))}
        />
        <div>
          <label
            style={{
              fontSize: "var(--con-text-caption)",
              color: "var(--con-text-muted)",
              display: "block",
              marginBottom: 5,
              fontWeight: 500,
            }}
          >
            الوصف
          </label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            rows={3}
            className="con-input"
            style={{ width: "100%", resize: "none", minHeight: 72 }}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 20,
        }}
      >
        <button onClick={onClose} className="con-btn-ghost">
          إلغاء
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !form.name_ar}
          className="con-btn-primary"
          style={{ opacity: saving || !form.name_ar ? 0.6 : 1 }}
        >
          {saving ? "جارٍ الحفظ..." : "إضافة القسم"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Bulk Import Modal ────────────────────────────────────────────────────────

interface ImportRow {
  full_name: string;
  email: string;
  phone: string;
  job_title: string;
  department: string;
  role: string;
  password: string;
  _error?: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') inQuotes = false;
      else current += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === "," || ch === "\t") {
        result.push(current.trim());
        current = "";
      } else current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSVText(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  return lines.map(parseCSVLine);
}

function mapRowsToImportData(
  rows: string[][],
  headerRow: string[],
): ImportRow[] {
  const headerMap: Record<string, number> = {};
  const aliases: Record<string, string[]> = {
    full_name: ["full_name", "الاسم الكامل", "الاسم", "name", "اسم"],
    email: ["email", "البريد الإلكتروني", "البريد", "ايميل"],
    phone: ["phone", "رقم الجوال", "الجوال", "جوال", "mobile", "هاتف"],
    job_title: ["job_title", "المسمى الوظيفي", "المسمى", "الوظيفة", "title"],
    department: ["department", "القسم", "قسم", "dept"],
    role: ["role", "الدور", "دور"],
    password: ["password", "كلمة المرور", "كلمة_المرور", "pass"],
  };
  // map header columns
  headerRow.forEach((h, idx) => {
    const lower = h.toLowerCase().trim();
    for (const [field, names] of Object.entries(aliases)) {
      if (names.some((n) => n === lower || n === h.trim())) {
        headerMap[field] = idx;
      }
    }
  });

  return rows.map((cols) => ({
    full_name: cols[headerMap.full_name ?? 0] || "",
    email: cols[headerMap.email ?? 1] || "",
    phone: cols[headerMap.phone ?? 2] || "",
    job_title: cols[headerMap.job_title ?? 3] || "",
    department: cols[headerMap.department ?? 4] || "",
    role: cols[headerMap.role ?? 5] || "",
    password: cols[headerMap.password ?? 6] || "",
  }));
}

function BulkImportModal({
  departments,
  onClose,
  onDone,
}: {
  departments: Department[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
    errors: ImportRow[];
  }>({
    current: 0,
    total: 0,
    errors: [],
  });
  const [dragOver, setDragOver] = useState(false);
  const [parseError, setParseError] = useState("");

  function mapDepartmentId(deptName: string): string | null {
    if (!deptName) return null;
    const lower = deptName.trim().toLowerCase();
    const found = departments.find(
      (d) =>
        d.name_ar === deptName.trim() ||
        d.name.toLowerCase() === lower ||
        d.name_ar.includes(deptName.trim()),
    );
    return found ? found.id : null;
  }

  function mapRole(role: string): string {
    const lower = role.trim().toLowerCase();
    if (["admin", "أدمن", "مدير"].includes(lower)) return "admin";
    if (["viewer", "مشاهد", "عارض"].includes(lower)) return "viewer";
    return "staff";
  }

  async function handleFile(file: File) {
    setImportFile(file);
    setParseError("");
    setImportData([]);
    setImportProgress({ current: 0, total: 0, errors: [] });

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "xlsx" || ext === "xls") {
      setParseError(
        "ملفات .xlsx/.xls غير مدعومة مباشرة. يرجى تحويل الملف إلى CSV أولاً (حفظ كـ CSV من Excel).",
      );
      return;
    }

    try {
      const text = await file.text();
      const rows = parseCSVText(text);
      if (rows.length < 2) {
        setParseError(
          "الملف لا يحتوي على بيانات كافية (يجب أن يحتوي على صف عناوين وصف بيانات واحد على الأقل)",
        );
        return;
      }
      const header = rows[0];
      const dataRows = rows.slice(1);
      const mapped = mapRowsToImportData(dataRows, header);
      setImportData(mapped);
    } catch {
      setParseError("تعذّر قراءة الملف. تأكد أنه ملف CSV صالح.");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  async function handleImport() {
    if (!importData.length) return;
    setImporting(true);
    const errors: ImportRow[] = [];
    const total = importData.length;
    setImportProgress({ current: 0, total, errors: [] });

    for (let i = 0; i < importData.length; i++) {
      const row = importData[i];
      try {
        const res = await fetch(`${API_BASE}/admin/create-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: row.full_name,
            email: row.email,
            phone: row.phone,
            password: row.password || "Temp@1234",
            role: mapRole(row.role),
            job_title_ar: row.job_title || "موظف",
            department_id: mapDepartmentId(row.department),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          errors.push({ ...row, _error: data.error || `خطأ ${res.status}` });
        }
      } catch {
        errors.push({ ...row, _error: "تعذّر الاتصال بالخادم" });
      }
      setImportProgress({ current: i + 1, total, errors: [...errors] });
    }

    setImporting(false);
    if (errors.length === 0) {
      toast.success(`تم استيراد ${total} موظف بنجاح`);
      onDone();
      onClose();
    } else {
      toast.warning(
        `تم استيراد ${total - errors.length} موظف بنجاح، ${errors.length} أخطاء`,
      );
    }
  }

  function downloadTemplate() {
    const headers = "full_name,email,phone,job_title,department,role,password";
    const csv = headers;
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "staff_import_template.csv";
    a.click();
  }

  const previewRows = importData.slice(0, 10);
  const done =
    importProgress.current === importProgress.total &&
    importProgress.total > 0 &&
    !importing;

  return (
    <Modal title="استيراد موظفين من Excel / CSV" onClose={onClose}>
      {/* Download template */}
      <button
        onClick={downloadTemplate}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: "var(--con-text-caption)",
          fontWeight: 500,
          padding: "6px 12px",
          borderRadius: 6,
          cursor: "pointer",
          background: "rgba(59,130,246,0.08)",
          color: "var(--con-brand)",
          border: "1px solid rgba(59,130,246,0.2)",
          marginBottom: 14,
          width: "100%",
          justifyContent: "center",
        }}
      >
        <FileDown size={14} /> تحميل نموذج CSV جاهز
      </button>

      {/* Column mapping guide */}
      <div
        style={{
          background: "var(--con-bg-surface-2)",
          borderRadius: 8,
          padding: "10px 14px",
          marginBottom: 14,
          fontSize: "var(--con-text-caption)",
          border: "1px solid var(--con-border-default)",
        }}
      >
        <div
          style={{
            fontWeight: 600,
            color: "var(--con-text-secondary)",
            marginBottom: 6,
          }}
        >
          الأعمدة المطلوبة:
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "4px 8px",
            fontFamily: "var(--con-font-mono)",
            fontSize: 11,
            color: "var(--con-text-muted)",
          }}
        >
          {[
            ["الاسم الكامل", "full_name"],
            ["البريد الإلكتروني", "email"],
            ["رقم الجوال", "phone"],
            ["المسمى الوظيفي", "job_title"],
            ["القسم", "department"],
            ["الدور", "role"],
            ["كلمة المرور", "password"],
          ].map(([ar, en]) => (
            <div key={en} style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  color: "var(--con-text-secondary)",
                  fontWeight: 500,
                  fontFamily: "inherit",
                }}
              >
                {ar}
              </span>
              <span
                style={{ color: "var(--con-text-muted)", direction: "ltr" }}
              >
                {en}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      {!importFile && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById("bulk-import-input")?.click()}
          style={{
            border: `2px dashed ${dragOver ? "var(--con-brand)" : "var(--con-border-strong)"}`,
            borderRadius: 10,
            padding: "32px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            cursor: "pointer",
            background: dragOver ? "rgba(59,130,246,0.06)" : "transparent",
            transition: "all 0.2s",
          }}
        >
          <Upload
            size={28}
            style={{
              color: dragOver ? "var(--con-brand)" : "var(--con-text-muted)",
            }}
          />
          <div
            style={{
              fontSize: "var(--con-text-body)",
              color: "var(--con-text-secondary)",
              fontWeight: 500,
              textAlign: "center",
            }}
          >
            اسحب ملف Excel هنا أو اضغط للاختيار
          </div>
          <div
            style={{
              fontSize: "var(--con-text-caption)",
              color: "var(--con-text-muted)",
            }}
          >
            الحد الأقصى: 50 MB — يدعم آلاف السجلات
          </div>
          <input
            id="bulk-import-input"
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: "none" }}
            onChange={handleFileInput}
          />
        </div>
      )}

      {/* Selected file info */}
      {importFile && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            background: "var(--con-bg-surface-2)",
            borderRadius: 7,
            border: "1px solid var(--con-border-default)",
            marginBottom: 12,
          }}
        >
          <FileSpreadsheet
            size={16}
            style={{ color: "var(--con-brand)", flexShrink: 0 }}
          />
          <span
            style={{
              flex: 1,
              fontSize: "var(--con-text-table)",
              color: "var(--con-text-primary)",
              fontWeight: 500,
            }}
          >
            {importFile.name}
          </span>
          <span
            style={{
              fontSize: "var(--con-text-caption)",
              color: "var(--con-text-muted)",
            }}
          >
            {importData.length} سجل
          </span>
          <button
            className="con-btn-ghost"
            style={{ padding: "2px 6px" }}
            onClick={() => {
              setImportFile(null);
              setImportData([]);
              setParseError("");
              setImportProgress({ current: 0, total: 0, errors: [] });
            }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Parse error */}
      {parseError && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(220,38,38,0.08)",
            border: "1px solid rgba(220,38,38,0.25)",
            color: "var(--con-danger)",
            fontSize: "var(--con-text-table)",
            padding: "10px 12px",
            borderRadius: 7,
            marginBottom: 12,
          }}
        >
          <AlertCircle size={14} /> {parseError}
        </div>
      )}

      {/* Preview table */}
      {previewRows.length > 0 && !importing && !done && (
        <div
          style={{
            maxHeight: 240,
            overflowY: "auto",
            overflowX: "auto",
            border: "1px solid var(--con-border-default)",
            borderRadius: 8,
            marginBottom: 14,
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "var(--con-text-caption)",
            }}
          >
            <thead>
              <tr style={{ background: "var(--con-bg-surface-2)" }}>
                <th
                  style={{
                    padding: "6px 8px",
                    textAlign: "right",
                    borderBottom: "1px solid var(--con-border-default)",
                    color: "var(--con-text-muted)",
                    fontWeight: 600,
                  }}
                >
                  #
                </th>
                <th
                  style={{
                    padding: "6px 8px",
                    textAlign: "right",
                    borderBottom: "1px solid var(--con-border-default)",
                    color: "var(--con-text-muted)",
                    fontWeight: 600,
                  }}
                >
                  الاسم
                </th>
                <th
                  style={{
                    padding: "6px 8px",
                    textAlign: "right",
                    borderBottom: "1px solid var(--con-border-default)",
                    color: "var(--con-text-muted)",
                    fontWeight: 600,
                  }}
                >
                  البريد
                </th>
                <th
                  style={{
                    padding: "6px 8px",
                    textAlign: "right",
                    borderBottom: "1px solid var(--con-border-default)",
                    color: "var(--con-text-muted)",
                    fontWeight: 600,
                  }}
                >
                  الجوال
                </th>
                <th
                  style={{
                    padding: "6px 8px",
                    textAlign: "right",
                    borderBottom: "1px solid var(--con-border-default)",
                    color: "var(--con-text-muted)",
                    fontWeight: 600,
                  }}
                >
                  القسم
                </th>
                <th
                  style={{
                    padding: "6px 8px",
                    textAlign: "right",
                    borderBottom: "1px solid var(--con-border-default)",
                    color: "var(--con-text-muted)",
                    fontWeight: 600,
                  }}
                >
                  الدور
                </th>
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: "1px solid var(--con-border-default)",
                  }}
                >
                  <td
                    style={{
                      padding: "5px 8px",
                      color: "var(--con-text-muted)",
                      fontFamily: "var(--con-font-mono)",
                    }}
                  >
                    {i + 1}
                  </td>
                  <td
                    style={{
                      padding: "5px 8px",
                      color: "var(--con-text-primary)",
                    }}
                  >
                    {row.full_name}
                  </td>
                  <td
                    style={{
                      padding: "5px 8px",
                      color: "var(--con-text-secondary)",
                      direction: "ltr",
                    }}
                  >
                    {row.email}
                  </td>
                  <td
                    style={{
                      padding: "5px 8px",
                      color: "var(--con-text-secondary)",
                      direction: "ltr",
                    }}
                  >
                    {row.phone}
                  </td>
                  <td
                    style={{
                      padding: "5px 8px",
                      color: "var(--con-text-secondary)",
                    }}
                  >
                    {row.department}
                  </td>
                  <td
                    style={{
                      padding: "5px 8px",
                      color: "var(--con-text-secondary)",
                    }}
                  >
                    {row.role}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {importData.length > 10 && (
            <div
              style={{
                padding: "6px 10px",
                fontSize: "var(--con-text-caption)",
                color: "var(--con-text-muted)",
                textAlign: "center",
              }}
            >
              يعرض أول 10 سجلات من أصل {importData.length}
            </div>
          )}
        </div>
      )}

      {/* Import progress */}
      {importing && (
        <div
          style={{
            padding: "14px 16px",
            borderRadius: 8,
            background: "var(--con-bg-surface-2)",
            border: "1px solid var(--con-border-default)",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: "var(--con-text-table)",
                color: "var(--con-text-primary)",
                fontWeight: 500,
              }}
            >
              جارٍ الاستيراد... {importProgress.current}/{importProgress.total}
            </span>
            <span
              style={{
                fontSize: "var(--con-text-caption)",
                color: "var(--con-text-muted)",
              }}
            >
              {Math.round(
                (importProgress.current / importProgress.total) * 100,
              )}
              %
            </span>
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 3,
              background: "var(--con-bg-surface-1)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 3,
                background: "var(--con-brand)",
                width: `${(importProgress.current / importProgress.total) * 100}%`,
                transition: "width 0.3s",
              }}
            />
          </div>
          {importProgress.errors.length > 0 && (
            <div
              style={{
                fontSize: "var(--con-text-caption)",
                color: "var(--con-danger)",
                marginTop: 6,
              }}
            >
              {importProgress.errors.length} خطأ حتى الآن
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {done && (
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 8,
              marginBottom: 8,
              background:
                importProgress.errors.length === 0
                  ? "rgba(22,163,74,0.08)"
                  : "rgba(234,179,8,0.08)",
              border: `1px solid ${importProgress.errors.length === 0 ? "rgba(22,163,74,0.25)" : "rgba(234,179,8,0.25)"}`,
            }}
          >
            <span
              style={{
                fontSize: "var(--con-text-table)",
                fontWeight: 500,
                color:
                  importProgress.errors.length === 0
                    ? "var(--con-success)"
                    : "var(--con-warning)",
              }}
            >
              تم استيراد {importProgress.total - importProgress.errors.length}{" "}
              موظف بنجاح
              {importProgress.errors.length > 0 &&
                `، ${importProgress.errors.length} أخطاء`}
            </span>
          </div>
          {importProgress.errors.length > 0 && (
            <div
              style={{
                maxHeight: 180,
                overflowY: "auto",
                border: "1px solid rgba(220,38,38,0.2)",
                borderRadius: 8,
              }}
            >
              {importProgress.errors.map((errRow, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    fontSize: "var(--con-text-caption)",
                    borderBottom: "1px solid var(--con-border-default)",
                    background: "rgba(220,38,38,0.04)",
                  }}
                >
                  <span
                    style={{
                      color: "var(--con-text-primary)",
                      fontWeight: 500,
                      minWidth: 100,
                    }}
                  >
                    {errRow.full_name || errRow.email}
                  </span>
                  <span style={{ color: "var(--con-danger)", flex: 1 }}>
                    {errRow._error}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 16,
        }}
      >
        <button onClick={onClose} className="con-btn-ghost">
          {done ? "إغلاق" : "إلغاء"}
        </button>
        {!done && (
          <button
            onClick={handleImport}
            disabled={importing || importData.length === 0}
            className="con-btn-primary"
            style={{ opacity: importing || importData.length === 0 ? 0.6 : 1 }}
          >
            {importing ? (
              `جارٍ الاستيراد... ${importProgress.current}/${importProgress.total}`
            ) : (
              <>
                <Upload size={14} /> استيراد {importData.length} موظف
              </>
            )}
          </button>
        )}
      </div>
    </Modal>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminStaff() {
  const [activeTab, setActiveTab] = useState<"staff" | "departments" | "drivers" | "import">("staff");
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    if (!supabase) return;
    setLoading(true);

    const { data: depts } = await supabase
      .from("departments")
      .select("*")
      .eq("is_active", true)
      .order("name_ar");
    if (depts) setDepartments(depts);

    const { data: staffData } = await supabase
      .from("staff_profiles")
      .select(
        `
        id, user_id, job_title_ar, permissions, can_approve, approval_limit, is_active, department_id,
        users ( full_name, email, phone, role ),
        departments ( name_ar )
      `,
      )
      .order("is_active", { ascending: false });

    if (staffData) {
      const mapped: StaffMember[] = staffData.map((s: any) => ({
        id: s.id,
        user_id: s.user_id,
        job_title_ar: s.job_title_ar || "موظف",
        permissions: s.permissions || {},
        can_approve: s.can_approve || false,
        approval_limit: s.approval_limit || 0,
        is_active: s.is_active,
        department_id: s.department_id,
        name: s.users?.full_name || "—",
        email: s.users?.email || "—",
        phone: s.users?.phone || "—",
        role: s.users?.role || "staff",
        department_name: s.departments?.name_ar || "—",
      }));
      setStaff(mapped);
    }

    setLoading(false);
  }

  async function togglePermission(
    staffId: string,
    permKey: string,
    current: boolean,
  ) {
    if (!supabase) return;
    const member = staff.find((s) => s.id === staffId);
    if (!member) return;
    const updated = { ...member.permissions, [permKey]: !current };
    const { error } = await supabase
      .from("staff_profiles")
      .update({ permissions: updated })
      .eq("id", staffId);
    if (!error) {
      setStaff((prev) =>
        prev.map((s) =>
          s.id === staffId ? { ...s, permissions: updated } : s,
        ),
      );
      if (selectedStaff?.id === staffId)
        setSelectedStaff((s) => (s ? { ...s, permissions: updated } : s));
      toast.success(`تم تحديث الصلاحية`);
    } else {
      toast.error("فشل تحديث الصلاحية");
    }
  }

  async function toggleActive(staffId: string, current: boolean) {
    if (!supabase) return;
    const { error } = await supabase
      .from("staff_profiles")
      .update({ is_active: !current })
      .eq("id", staffId);
    if (!error) {
      setStaff((prev) =>
        prev.map((s) => (s.id === staffId ? { ...s, is_active: !current } : s)),
      );
      if (selectedStaff?.id === staffId)
        setSelectedStaff((s) => (s ? { ...s, is_active: !current } : s));
      toast.success(!current ? "تم تفعيل الموظف" : "تم تعطيل الموظف");
    } else {
      toast.error("فشل تحديث الحالة");
    }
  }

  async function grantAllPermissions(staffId: string) {
    if (!supabase) return;
    const all: Record<string, boolean> = {};
    ALL_PERMISSIONS.forEach((p) => (all[p.key] = true));
    const { error } = await supabase
      .from("staff_profiles")
      .update({ permissions: all })
      .eq("id", staffId);
    if (!error) {
      setStaff((prev) =>
        prev.map((s) => (s.id === staffId ? { ...s, permissions: all } : s)),
      );
      if (selectedStaff?.id === staffId)
        setSelectedStaff((s) => (s ? { ...s, permissions: all } : s));
      toast.success("تم منح جميع الصلاحيات");
    } else {
      toast.error("فشل منح الصلاحيات");
    }
  }

  async function revokeAllPermissions(staffId: string) {
    if (!supabase) return;
    const none: Record<string, boolean> = {};
    ALL_PERMISSIONS.forEach((p) => (none[p.key] = false));
    const { error } = await supabase
      .from("staff_profiles")
      .update({ permissions: none })
      .eq("id", staffId);
    if (!error) {
      setStaff((prev) =>
        prev.map((s) => (s.id === staffId ? { ...s, permissions: none } : s)),
      );
      if (selectedStaff?.id === staffId)
        setSelectedStaff((s) => (s ? { ...s, permissions: none } : s));
      toast.success("تم سحب جميع الصلاحيات");
    } else {
      toast.error("فشل سحب الصلاحيات");
    }
  }

  const filtered = staff.filter(
    (s) =>
      s.name.includes(search) ||
      s.email.includes(search) ||
      s.department_name.includes(search),
  );

  const activeCount = staff.filter((s) => s.is_active).length;

  return (
    <div
      dir="rtl"
      style={{ display: "flex", flexDirection: "column", gap: 20 }}
    >
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                background: "rgba(59,130,246,0.12)",
                borderRadius: 8,
                padding: "7px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Users size={18} style={{ color: "var(--con-brand)" }} />
            </div>
            <h1
              style={{
                fontSize: "var(--con-text-page-title)",
                fontWeight: 700,
                color: "var(--con-text-primary)",
                margin: 0,
                fontFamily: "var(--con-font-primary)",
              }}
            >
              الأقسام والموظفون
            </h1>
          </div>
          <p
            style={{
              fontSize: "var(--con-text-body)",
              color: "var(--con-text-muted)",
              margin: 0,
              paddingRight: 44,
            }}
          >
            إدارة الموظفين وتحديد صلاحياتهم
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <button
            className="con-btn-ghost"
            onClick={() => {
              window.print();
            }}
          >
            <Printer size={14} /> طباعة
          </button>
          <button
            className="con-btn-ghost"
            onClick={() => setShowImportModal(true)}
          >
            <FileSpreadsheet size={14} /> استيراد Excel
          </button>
          <button
            className="con-btn-ghost"
            onClick={() => {
              const rows = staff.map((s) => ({
                الاسم: s.name,
                البريد: s.email,
                الجوال: s.phone,
                القسم: s.department_name,
                الدور: s.role,
                الحالة: s.is_active ? "نشط" : "معطّل",
              }));
              downloadCSV(rows, "staff_export");
            }}
          >
            <Download size={14} /> تصدير CSV
          </button>
          <button
            onClick={() =>
              activeTab === "staff"
                ? setShowAddModal(true)
                : setShowAddDeptModal(true)
            }
            className="con-btn-primary"
          >
            <Plus size={14} />
            {activeTab === "staff" ? "إضافة موظف" : activeTab === "drivers" ? "إضافة سائق" : activeTab === "import" ? "تحميل نموذج CSV" : "إضافة قسم"}
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
        }}
      >
        {[
          {
            label: "إجمالي الموظفين",
            value: staff.length,
            icon: Users,
            accent: "var(--con-brand)",
          },
          {
            label: "موظفون نشطون",
            value: activeCount,
            icon: ShieldCheck,
            accent: "var(--con-success)",
          },
          {
            label: "غير نشطين",
            value: staff.length - activeCount,
            icon: ShieldOff,
            accent: "var(--con-danger)",
          },
          {
            label: "الأقسام",
            value: departments.length,
            icon: Building2,
            accent: "var(--con-warning)",
          },
        ].map((k) => (
          <div
            key={k.label}
            className="con-kpi-card"
            style={{ borderColor: "var(--con-border-default)" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: "var(--con-text-caption)",
                  color: "var(--con-text-muted)",
                  fontWeight: 500,
                }}
              >
                {k.label}
              </span>
              <k.icon size={14} style={{ color: k.accent }} />
            </div>
            {loading ? (
              <Skeleton className="h-6 w-1/2 rounded-md" />
            ) : (
              <div
                className="con-kpi-value"
                style={{ fontSize: 24, color: k.accent }}
              >
                {k.value}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="con-tabs">
        {[
          { key: "staff", label: "الموظفون الإداريون", icon: Building2 },
          { key: "drivers", label: "السائقون والمناديب", icon: Users },
          { key: "departments", label: "الأقسام", icon: Building2 },
          { key: "import", label: "استيراد من Excel", icon: FileSpreadsheet },
        ].map((t) => (
          <button
            key={t.key}
            className={`con-tab ${activeTab === t.key ? "con-tab-active" : ""}`}
            onClick={() => setActiveTab(t.key as any)}
            title={t.key === "import" ? "رفع ملف CSV/Excel لإضافة مجموعة موظفين أو سائقين دفعة واحدة" : ""}
          >
            <t.icon size={13} style={{ marginLeft: 4 }} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "staff" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "280px 1fr",
            gap: 16,
            alignItems: "start",
          }}
        >
          {/* Staff list column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <Search
                size={13}
                style={{
                  position: "absolute",
                  insetInlineEnd: 9,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--con-text-muted)",
                  pointerEvents: "none",
                }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالاسم أو القسم..."
                className="con-input"
                style={{ paddingInlineEnd: 28, width: "100%" }}
              />
            </div>

            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <Empty>
                <EmptyIcon>
                  <Users className="size-10" />
                </EmptyIcon>
                <EmptyTitle>لا يوجد موظفين</EmptyTitle>
                <EmptyDescription>
                  لم يتم العثور على نتائج مطابقة
                </EmptyDescription>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="con-btn-primary"
                  style={{ marginTop: 12, fontSize: 12 }}
                >
                  <UserPlus size={12} /> إضافة موظف
                </button>
              </Empty>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {filtered.map((member) => (
                  <StaffCard
                    key={member.id}
                    member={member}
                    selected={selectedStaff?.id === member.id}
                    onClick={() => setSelectedStaff(member)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Permissions panel column */}
          <div>
            {selectedStaff ? (
              <PermissionsPanel
                member={selectedStaff}
                departments={departments}
                onTogglePermission={(key, val) =>
                  togglePermission(selectedStaff.id, key, val)
                }
                onGrantAll={() => grantAllPermissions(selectedStaff.id)}
                onRevokeAll={() => revokeAllPermissions(selectedStaff.id)}
                onToggleActive={() =>
                  toggleActive(selectedStaff.id, selectedStaff.is_active)
                }
                onClose={() => setSelectedStaff(null)}
              />
            ) : (
              <div
                style={{
                  background: "var(--con-bg-surface-1)",
                  border: "1px solid var(--con-border-default)",
                  borderRadius: 10,
                  padding: "60px 24px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  minHeight: 260,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "var(--con-bg-surface-2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Shield
                    size={22}
                    style={{ color: "var(--con-text-muted)" }}
                  />
                </div>
                <div
                  style={{
                    fontSize: "var(--con-text-body)",
                    color: "var(--con-text-secondary)",
                    fontWeight: 500,
                  }}
                >
                  اختر موظفاً
                </div>
                <div
                  style={{
                    fontSize: "var(--con-text-caption)",
                    color: "var(--con-text-muted)",
                    marginTop: 4,
                  }}
                >
                  لعرض وتعديل صلاحياته
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <DepartmentsTab
          departments={departments}
          staff={staff}
          showAddModal={showAddDeptModal}
          onCloseAdd={() => setShowAddDeptModal(false)}
          onRefresh={fetchData}
        />
      )}

      {/* Drivers Tab */}
      {activeTab === "drivers" && (
        <DriversTab />
      )}

      {/* Import Tab */}
      {activeTab === "import" && (
        <BulkImportModal
          departments={departments}
          onClose={() => setActiveTab("staff")}
          onDone={fetchData}
        />
      )}

      {/* Modals */}
      {showAddModal && (
        <AddStaffModal
          departments={departments}
          onClose={() => setShowAddModal(false)}
          onSaved={fetchData}
        />
      )}
      {showImportModal && (
        <BulkImportModal
          departments={departments}
          onClose={() => setShowImportModal(false)}
          onDone={fetchData}
        />
      )}
    </div>
  );
}

// ─── Drivers Tab ──────────────────────────────────────────────────────────────
const CONTRACT_TYPES_MAP: Record<string, { label: string; color: string }> = {
  freelancer: { label: "مستقل (Freelancer)", color: "var(--con-info)" },
  company_sponsored: { label: "كفالة شركة", color: "var(--con-warning)" },
  kafala: { label: "كفالة فردية", color: "var(--con-brand)" },
  ajir: { label: "أجير", color: "var(--con-success)" },
};

function DriversTab() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [form, setForm] = useState({
    full_name: "", phone: "", email: "", city: "الرياض",
    platform: "jahez", contract_type: "freelancer",
    vehicle_ownership: "own", vehicle_type: "سيارة صغيرة",
    stc_bank_phone: "", iban: "", nationality: "سعودي",
    id_number: "", id_expiry: "", license_number: "", license_expiry: "",
    per_order_rate: 12, status: "active",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDrivers();
  }, []);

  async function fetchDrivers() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/drivers?limit=200`);
      const data = await res.json();
      setDrivers(data.items || []);
    } catch { /* keep empty */ }
    setLoading(false);
  }

  async function handleAddDriver() {
    if (!form.full_name || !form.phone) { toast.error("الاسم والجوال مطلوبان"); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/drivers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, driverId: "drv-" + Date.now() }),
      });
      if (res.ok) {
        toast.success("تم إضافة السائق بنجاح");
        setShowAddDriver(false);
        setForm(f => ({ ...f, full_name: "", phone: "", email: "", stc_bank_phone: "", iban: "", id_number: "" }));
        fetchDrivers();
      } else {
        const d = await res.json();
        toast.error(d.error || "فشل إضافة السائق");
      }
    } catch { toast.error("تعذر الاتصال"); }
    setSaving(false);
  }

  const filtered = drivers.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = !q || (d.full_name || "").includes(search) || (d.phone || "").includes(search) || (d.city || "").includes(search);
    const matchType = typeFilter === "all" || d.contract_type === typeFilter;
    return matchSearch && matchType;
  });

  const stats = {
    total: drivers.length,
    active: drivers.filter(d => d.status === "active").length,
    freelancer: drivers.filter(d => d.contract_type === "freelancer").length,
    company: drivers.filter(d => d.contract_type === "company_sponsored").length,
    kafala: drivers.filter(d => d.contract_type === "kafala").length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
        {[
          { label: "إجمالي السائقين", value: stats.total, color: "var(--con-brand)" },
          { label: "نشطون", value: stats.active, color: "var(--con-success)" },
          { label: "مستقل", value: stats.freelancer, color: "var(--con-info)" },
          { label: "كفالة شركة", value: stats.company, color: "var(--con-warning)" },
          { label: "كفالة فردية", value: stats.kafala, color: "var(--con-brand)" },
        ].map(k => (
          <div key={k.label} className="con-kpi-card">
            <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 10, color: "var(--con-text-muted)" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: "absolute", insetInlineEnd: 9, top: "50%", transform: "translateY(-50%)", color: "var(--con-text-muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو الجوال أو المدينة..." className="con-input" style={{ width: "100%", paddingInlineEnd: 28 }} />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="con-input" style={{ width: 160 }}>
          <option value="all">كل التصنيفات</option>
          <option value="freelancer">مستقل</option>
          <option value="company_sponsored">كفالة شركة</option>
          <option value="kafala">كفالة فردية</option>
          <option value="ajir">أجير</option>
        </select>
        <button onClick={() => setShowAddDriver(true)} className="con-btn-primary" style={{ gap: 6 }}>
          <UserPlus size={13} /> إضافة سائق
        </button>
      </div>

      {/* Drivers Table */}
      <div style={{ background: "var(--con-bg-surface-1)", border: "1px solid var(--con-border-default)", borderRadius: 10, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--con-text-muted)" }}>جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--con-text-muted)" }}>
            <Users size={40} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
            <p>لا يوجد سائقين</p>
            <button onClick={() => setShowAddDriver(true)} className="con-btn-primary" style={{ marginTop: 8 }}><UserPlus size={13} /> إضافة سائق</button>
          </div>
        ) : (
          <table className="con-table">
            <thead>
              <tr>
                <th>السائق</th>
                <th>التصنيف</th>
                <th>المنصة</th>
                <th>المدينة</th>
                <th>المركبة</th>
                <th>الحالة</th>
                <th>سعر الطلب</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const ct = CONTRACT_TYPES_MAP[d.contract_type] || { label: d.contract_type || "—", color: "var(--con-text-muted)" };
                return (
                  <tr key={d.id || d.driverId}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--con-text-primary)" }}>{d.full_name || d.name || "—"}</div>
                      <div style={{ fontSize: 10, color: "var(--con-text-muted)", fontFamily: "var(--con-font-mono)" }}>{d.phone || "—"}</div>
                    </td>
                    <td><span className="con-badge" style={{ background: ct.color + "20", color: ct.color, border: `1px solid ${ct.color}40` }}>{ct.label}</span></td>
                    <td style={{ color: "var(--con-text-secondary)" }}>{d.platform || "—"}</td>
                    <td style={{ color: "var(--con-text-secondary)" }}>{d.city || "—"}</td>
                    <td>
                      <span className={`con-badge con-badge-sm ${d.vehicle_ownership === "company" ? "con-badge-warning" : "con-badge-info"}`}>
                        {d.vehicle_ownership === "company" ? "شركة" : "خاص"} — {d.vehicle_type || "—"}
                      </span>
                    </td>
                    <td>
                      <span className={`con-badge con-badge-sm ${d.status === "active" ? "con-badge-success" : d.status === "suspended" ? "con-badge-danger" : "con-badge-muted"}`}>
                        {d.status === "active" ? "نشط" : d.status === "suspended" ? "معلّق" : d.status || "—"}
                      </span>
                    </td>
                    <td style={{ fontFamily: "var(--con-font-mono)", fontWeight: 600 }}>{d.per_order_rate || 0} ر.س</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Driver Modal */}
      {showAddDriver && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }} onClick={() => setShowAddDriver(false)} dir="rtl">
          <div style={{ background: "var(--con-bg-elevated)", border: "1px solid var(--con-border-strong)", borderRadius: 12, width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--con-border-default)" }}>
              <h2 style={{ fontSize: "var(--con-text-card-title)", fontWeight: 600, color: "var(--con-text-primary)", margin: 0 }}>إضافة سائق جديد</h2>
              <button className="con-btn-ghost" style={{ padding: "4px 8px" }} onClick={() => setShowAddDriver(false)}><X size={15} /></button>
            </div>
            <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FField label="الاسم الكامل *"><input className="con-input" style={{ width: "100%" }} value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} /></FField>
              <FField label="رقم الجوال *"><input className="con-input" dir="ltr" style={{ width: "100%" }} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="05XXXXXXXX" /></FField>
              <FField label="البريد الإلكتروني"><input className="con-input" type="email" style={{ width: "100%" }} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></FField>
              <FField label="الجنسية"><input className="con-input" style={{ width: "100%" }} value={form.nationality} onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))} /></FField>
              <FField label="رقم الهوية/الإقامة"><input className="con-input" dir="ltr" style={{ width: "100%" }} value={form.id_number} onChange={e => setForm(f => ({ ...f, id_number: e.target.value }))} /></FField>
              <FField label="انتهاء الهوية"><input className="con-input" type="date" dir="ltr" style={{ width: "100%" }} value={form.id_expiry} onChange={e => setForm(f => ({ ...f, id_expiry: e.target.value }))} /></FField>
              <FField label="رقم الرخصة"><input className="con-input" dir="ltr" style={{ width: "100%" }} value={form.license_number} onChange={e => setForm(f => ({ ...f, license_number: e.target.value }))} /></FField>
              <FField label="انتهاء الرخصة"><input className="con-input" type="date" dir="ltr" style={{ width: "100%" }} value={form.license_expiry} onChange={e => setForm(f => ({ ...f, license_expiry: e.target.value }))} /></FField>

              <div style={{ gridColumn: "1 / -1", fontSize: 12, fontWeight: 700, color: "var(--con-brand)", marginTop: 4 }}>التصنيف والتعاقد</div>

              <FField label="التصنيف">
                <select className="con-input" style={{ width: "100%" }} value={form.contract_type} onChange={e => setForm(f => ({ ...f, contract_type: e.target.value }))}>
                  <option value="freelancer">مستقل (Freelancer)</option>
                  <option value="company_sponsored">كفالة شركة</option>
                  <option value="kafala">كفالة فردية</option>
                  <option value="ajir">أجير</option>
                </select>
              </FField>
              <FField label="المنصة">
                <select className="con-input" style={{ width: "100%" }} value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
                  {["jahez","hungerstation","keeta","mrsool","toyou","ninja","careem"].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </FField>
              <FField label="المدينة">
                <select className="con-input" style={{ width: "100%" }} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}>
                  {["الرياض","جدة","مكة","المدينة","الدمام","الخبر","تبوك","أبها"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FField>
              <FField label="سعر الطلب (ر.س)"><input className="con-input" dir="ltr" type="number" style={{ width: "100%" }} value={form.per_order_rate} onChange={e => setForm(f => ({ ...f, per_order_rate: Number(e.target.value) }))} /></FField>

              <div style={{ gridColumn: "1 / -1", fontSize: 12, fontWeight: 700, color: "var(--con-warning)", marginTop: 4 }}>المركبة والبنك</div>

              <FField label="ملكية المركبة">
                <select className="con-input" style={{ width: "100%" }} value={form.vehicle_ownership} onChange={e => setForm(f => ({ ...f, vehicle_ownership: e.target.value }))}>
                  <option value="own">مركبة خاصة</option>
                  <option value="company">مركبة شركة</option>
                </select>
              </FField>
              <FField label="نوع المركبة">
                <select className="con-input" style={{ width: "100%" }} value={form.vehicle_type} onChange={e => setForm(f => ({ ...f, vehicle_type: e.target.value }))}>
                  {["سيارة صغيرة","سيارة متوسطة","دراجة نارية","فان"].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </FField>
              <FField label="رقم STC Bank (966+)"><input className="con-input" dir="ltr" style={{ width: "100%" }} value={form.stc_bank_phone} onChange={e => setForm(f => ({ ...f, stc_bank_phone: e.target.value }))} placeholder="966XXXXXXXXX" /></FField>
              <FField label="IBAN"><input className="con-input" dir="ltr" style={{ width: "100%" }} value={form.iban} onChange={e => setForm(f => ({ ...f, iban: e.target.value }))} placeholder="SA..." /></FField>

              <FField label="الحالة">
                <select className="con-input" style={{ width: "100%" }} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="active">نشط</option>
                  <option value="pending">قيد المراجعة</option>
                  <option value="suspended">معلّق</option>
                  <option value="inactive">غير نشط</option>
                </select>
              </FField>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 20px", borderTop: "1px solid var(--con-border-default)" }}>
              <button onClick={() => setShowAddDriver(false)} className="con-btn-ghost">إلغاء</button>
              <button onClick={handleAddDriver} disabled={saving} className="con-btn-primary" style={{ opacity: saving ? 0.6 : 1 }}>
                {saving ? "جارٍ الحفظ..." : <><UserPlus size={14} /> إضافة السائق</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--con-text-muted)", display: "block", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}
