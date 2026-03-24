/**
 * صفحة إدارة الموظفين والصلاحيات
 * Enterprise HR Console — staff management, permissions, departments
 */
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { API_BASE } from "@/lib/api";
import {
  Users, Building2, Plus, Search, Shield, ShieldCheck, ShieldOff,
  X, Check, Eye,
  ClipboardList, DollarSign, MessageSquare,
  FileSpreadsheet, Car, UserPlus, AlertCircle,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Permission {
  key: string;
  labelAr: string;
  icon: React.ElementType;
}

const ALL_PERMISSIONS: Permission[] = [
  { key: "couriers",   labelAr: "عرض المناديب",   icon: Users },
  { key: "orders",     labelAr: "عرض الطلبات",    icon: ClipboardList },
  { key: "finance",    labelAr: "إدارة المالية",   icon: DollarSign },
  { key: "complaints", labelAr: "إدارة الشكاوى",  icon: MessageSquare },
  { key: "excel",      labelAr: "رفع Excel",       icon: FileSpreadsheet },
  { key: "reports",    labelAr: "عرض التقارير",    icon: Eye },
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

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)", display: "flex",
        alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      dir="rtl"
    >
      <div style={{
        background: "var(--con-bg-elevated)",
        border: "1px solid var(--con-border-strong)",
        borderRadius: 12, width: "100%", maxWidth: 520,
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid var(--con-border-default)",
        }}>
          <h2 style={{
            fontSize: "var(--con-text-card-title)", fontWeight: 600,
            color: "var(--con-text-primary)", margin: 0,
          }}>{title}</h2>
          <button className="con-btn-ghost" style={{ padding: "4px 8px" }} onClick={onClose}>
            <X size={15} />
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

function ModalField({ label, value, onChange, type = "text", span = false, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; span?: boolean; placeholder?: string;
}) {
  return (
    <div style={span ? { gridColumn: "span 2" } : {}}>
      {label && (
        <label style={{
          fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)",
          display: "block", marginBottom: 5, fontWeight: 500,
        }}>{label}</label>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="con-input"
        style={{ width: "100%" }}
      />
    </div>
  );
}

// ─── Permission Toggle ─────────────────────────────────────────────────────────

function PermissionToggle({ perm, granted, onToggle }: {
  perm: Permission;
  granted: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px", borderRadius: 8, width: "100%", textAlign: "right",
        border: "1px solid",
        borderColor: granted ? "var(--con-border-brand)" : "var(--con-border-default)",
        background: granted ? "rgba(59,130,246,0.08)" : "transparent",
        cursor: "pointer", transition: "all 0.15s",
      }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 6, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: granted ? "rgba(59,130,246,0.15)" : "var(--con-bg-surface-2)",
      }}>
        <perm.icon size={14} style={{ color: granted ? "var(--con-brand)" : "var(--con-text-muted)" }} />
      </div>
      <span style={{
        flex: 1, fontSize: "var(--con-text-table)",
        color: granted ? "var(--con-text-primary)" : "var(--con-text-muted)",
        fontWeight: granted ? 500 : 400,
      }}>
        {perm.labelAr}
      </span>
      <div style={{
        width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: granted ? "var(--con-brand)" : "var(--con-bg-surface-2)",
        border: `1px solid ${granted ? "var(--con-brand)" : "var(--con-border-strong)"}`,
        transition: "all 0.15s",
      }}>
        {granted
          ? <Check size={10} style={{ color: "#fff" }} />
          : <X size={9} style={{ color: "var(--con-text-muted)" }} />}
      </div>
    </button>
  );
}

// ─── Staff Card ────────────────────────────────────────────────────────────────

function StaffCard({ member, selected, onClick }: {
  member: StaffMember;
  selected: boolean;
  onClick: () => void;
}) {
  const permCount = Object.values(member.permissions).filter(Boolean).length;
  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px 14px", borderRadius: 8, cursor: "pointer",
        border: "1px solid",
        borderColor: selected ? "var(--con-brand)" : "var(--con-border-default)",
        background: selected ? "rgba(59,130,246,0.07)" : "transparent",
        transition: "all 0.15s",
        display: "flex", alignItems: "center", gap: 10,
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 700,
        background: member.is_active ? "rgba(59,130,246,0.15)" : "var(--con-bg-surface-2)",
        color: member.is_active ? "var(--con-brand)" : "var(--con-text-muted)",
      }}>
        {member.name.charAt(0) || "م"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            fontSize: "var(--con-text-table)", fontWeight: 500,
            color: "var(--con-text-primary)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {member.name}
          </span>
          {!member.is_active && (
            <span className="con-badge con-badge-sm con-badge-danger">معطّل</span>
          )}
        </div>
        <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginTop: 1 }}>
          {member.job_title_ar}
          {member.department_name !== "—" && ` · ${member.department_name}`}
        </div>
      </div>
      <div style={{
        fontSize: "var(--con-text-caption)", fontWeight: 600,
        color: permCount > 0 ? "var(--con-brand)" : "var(--con-text-muted)",
        flexShrink: 0,
      }}>
        {permCount}/{ALL_PERMISSIONS.length}
      </div>
    </div>
  );
}

// ─── Permissions Panel ─────────────────────────────────────────────────────────

function PermissionsPanel({ member, departments, onTogglePermission, onGrantAll, onRevokeAll, onToggleActive, onClose }: {
  member: StaffMember;
  departments: Department[];
  onTogglePermission: (key: string, current: boolean) => void;
  onGrantAll: () => void;
  onRevokeAll: () => void;
  onToggleActive: () => void;
  onClose: () => void;
}) {
  const dept = departments.find(d => d.id === member.department_id);
  const grantedCount = Object.values(member.permissions).filter(Boolean).length;

  return (
    <div style={{
      background: "var(--con-bg-surface-1)",
      border: "1px solid var(--con-border-default)",
      borderRadius: 10, overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid var(--con-border-default)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, fontWeight: 700,
          background: member.is_active ? "rgba(59,130,246,0.15)" : "var(--con-bg-surface-2)",
          color: member.is_active ? "var(--con-brand)" : "var(--con-text-muted)",
        }}>
          {member.name.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontSize: "var(--con-text-card-title)", fontWeight: 600,
              color: "var(--con-text-primary)",
            }}>
              {member.name}
            </span>
            <span className={`con-badge con-badge-sm ${member.is_active ? "con-badge-success" : "con-badge-danger"}`}>
              {member.is_active ? "نشط" : "معطّل"}
            </span>
          </div>
          <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginTop: 2 }}>
            {member.job_title_ar}
            {dept ? ` · ${dept.name_ar}` : ""}
            {" · "}
            <span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-text-muted)" }}>{member.email}</span>
          </div>
        </div>
        <button className="con-btn-ghost" style={{ padding: "5px 8px" }} onClick={onClose}>
          <X size={14} />
        </button>
      </div>

      {/* Quick actions bar */}
      <div style={{
        padding: "10px 20px",
        borderBottom: "1px solid var(--con-border-default)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", flex: 1 }}>
          الصلاحيات: {grantedCount}/{ALL_PERMISSIONS.length} ممنوحة
        </span>
        <button
          onClick={onGrantAll}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 600,
            padding: "4px 10px", borderRadius: 5, cursor: "pointer",
            background: "rgba(22,163,74,0.1)", color: "var(--con-success)",
            border: "1px solid rgba(22,163,74,0.25)", transition: "all 0.15s",
          }}
        >
          <ShieldCheck size={12} /> منح الكل
        </button>
        <button
          onClick={onRevokeAll}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 600,
            padding: "4px 10px", borderRadius: 5, cursor: "pointer",
            background: "rgba(220,38,38,0.08)", color: "var(--con-danger)",
            border: "1px solid rgba(220,38,38,0.2)", transition: "all 0.15s",
          }}
        >
          <ShieldOff size={12} /> سحب الكل
        </button>
        <button
          onClick={onToggleActive}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 600,
            padding: "4px 10px", borderRadius: 5, cursor: "pointer",
            background: member.is_active ? "rgba(220,38,38,0.08)" : "rgba(22,163,74,0.1)",
            color: member.is_active ? "var(--con-danger)" : "var(--con-success)",
            border: `1px solid ${member.is_active ? "rgba(220,38,38,0.2)" : "rgba(22,163,74,0.25)"}`,
            transition: "all 0.15s",
          }}
        >
          {member.is_active ? <ShieldOff size={12} /> : <ShieldCheck size={12} />} {member.is_active ? "تعطيل" : "تفعيل"}
        </button>
      </div>

      {/* Permission grid */}
      <div style={{
        padding: 16,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: 8,
      }}>
        {ALL_PERMISSIONS.map(perm => {
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
      <div style={{
        padding: "12px 16px",
        borderTop: "1px solid var(--con-border-default)",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
      }}>
        <div style={{
          background: "var(--con-bg-surface-2)", borderRadius: 7,
          padding: "8px 12px",
        }}>
          <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginBottom: 3 }}>
            صلاحية الاعتماد
          </div>
          <div style={{
            fontSize: "var(--con-text-table)", fontWeight: 600,
            color: member.can_approve ? "var(--con-success)" : "var(--con-text-muted)",
          }}>
            {member.can_approve
              ? `نعم — حتى ${member.approval_limit?.toLocaleString("ar")} ر.س`
              : "لا"}
          </div>
        </div>
        <div style={{
          background: "var(--con-bg-surface-2)", borderRadius: 7,
          padding: "8px 12px",
        }}>
          <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginBottom: 3 }}>
            الصلاحيات الممنوحة
          </div>
          <div style={{
            fontFamily: "var(--con-font-mono)",
            fontSize: "var(--con-text-table)", fontWeight: 600,
            color: grantedCount > 0 ? "var(--con-brand)" : "var(--con-text-muted)",
          }}>
            {grantedCount} / {ALL_PERMISSIONS.length}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Departments Tab ───────────────────────────────────────────────────────────

function DepartmentsTab({ departments, staff, showAddModal, onCloseAdd, onRefresh }: {
  departments: Department[];
  staff: StaffMember[];
  showAddModal: boolean;
  onCloseAdd: () => void;
  onRefresh: () => void;
}) {
  return (
    <div>
      {departments.length === 0 ? (
        <div className="con-empty">
          <Building2 size={32} style={{ opacity: 0.25, marginBottom: 10 }} />
          <div>لا توجد أقسام بعد</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {departments.map(dept => {
            const deptStaff = staff.filter(s => s.department_id === dept.id);
            return (
              <div key={dept.id} style={{
                background: "var(--con-bg-surface-1)",
                border: "1px solid var(--con-border-default)",
                borderRadius: 10, padding: "16px 18px",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(59,130,246,0.12)",
                  }}>
                    <Building2 size={16} style={{ color: "var(--con-brand)" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: "var(--con-text-card-title)", fontWeight: 600,
                      color: "var(--con-text-primary)", marginBottom: 2,
                    }}>
                      {dept.name_ar}
                    </div>
                    {dept.description && (
                      <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
                        {dept.description}
                      </div>
                    )}
                  </div>
                  <span className={`con-badge con-badge-sm ${dept.is_active ? "con-badge-success" : "con-badge-danger"}`}>
                    {dept.is_active ? "نشط" : "معطّل"}
                  </span>
                </div>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  paddingTop: 10, borderTop: "1px solid var(--con-border-default)",
                }}>
                  <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)" }}>
                    {deptStaff.length} موظف
                  </span>
                  <div style={{ display: "flex", gap: -6 }}>
                    {deptStaff.slice(0, 4).map(s => (
                      <div
                        key={s.id}
                        title={s.name}
                        style={{
                          width: 24, height: 24, borderRadius: "50%",
                          background: "var(--con-bg-elevated)",
                          border: "2px solid var(--con-bg-surface-1)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 700,
                          color: "var(--con-brand)",
                          marginInlineStart: -4,
                        }}
                      >
                        {s.name.charAt(0)}
                      </div>
                    ))}
                    {deptStaff.length > 4 && (
                      <div style={{
                        width: 24, height: 24, borderRadius: "50%",
                        background: "var(--con-bg-elevated)",
                        border: "2px solid var(--con-bg-surface-1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, color: "var(--con-text-muted)",
                        marginInlineStart: -4,
                      }}>
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

function AddStaffModal({ departments, onClose, onSaved }: {
  departments: Department[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    job_title_ar: "", department_id: "", role: "staff",
    can_approve: false, approval_limit: 0,
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
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.25)",
          color: "var(--con-danger)", fontSize: "var(--con-text-table)",
          padding: "10px 12px", borderRadius: 7, marginBottom: 14,
        }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <ModalField label="الاسم الكامل" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
        <ModalField label="رقم الجوال" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
        <ModalField label="البريد الإلكتروني" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" span />
        <ModalField label="كلمة المرور" value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} type="password" span />
        <ModalField label="المسمى الوظيفي" value={form.job_title_ar} onChange={v => setForm(f => ({ ...f, job_title_ar: v }))} />
        <div>
          <label style={{
            fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)",
            display: "block", marginBottom: 5, fontWeight: 500,
          }}>القسم</label>
          <select
            value={form.department_id}
            onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}
            className="con-input"
            style={{ width: "100%" }}
          >
            <option value="">— بدون قسم —</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name_ar}</option>)}
          </select>
        </div>
        <div>
          <label style={{
            fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)",
            display: "block", marginBottom: 5, fontWeight: 500,
          }}>الدور</label>
          <select
            value={form.role}
            onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
            className="con-input"
            style={{ width: "100%" }}
          >
            <option value="staff">موظف</option>
            <option value="admin">أدمن</option>
          </select>
        </div>
        <div style={{ gridColumn: "span 2", display: "flex", alignItems: "center", gap: 10 }}>
          <input
            type="checkbox"
            id="can_approve"
            checked={form.can_approve}
            onChange={e => setForm(f => ({ ...f, can_approve: e.target.checked }))}
            style={{ width: 15, height: 15, accentColor: "var(--con-brand)" }}
          />
          <label htmlFor="can_approve" style={{
            fontSize: "var(--con-text-table)", color: "var(--con-text-secondary)", cursor: "pointer",
          }}>
            صلاحية الاعتماد
          </label>
          {form.can_approve && (
            <div style={{ flex: 1 }}>
              <ModalField
                label=""
                value={String(form.approval_limit)}
                onChange={v => setForm(f => ({ ...f, approval_limit: Number(v) }))}
                type="number"
                placeholder="الحد الأقصى (ر.س)"
              />
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
        <button onClick={onClose} className="con-btn-ghost">إلغاء</button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="con-btn-primary"
          style={{ opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "جارٍ الحفظ..." : <><UserPlus size={14} /> إضافة موظف</>}
        </button>
      </div>
    </Modal>
  );
}

// ─── Add Department Modal ──────────────────────────────────────────────────────

function AddDepartmentModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
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
        <ModalField label="اسم القسم بالعربية" value={form.name_ar} onChange={v => setForm(f => ({ ...f, name_ar: v }))} />
        <ModalField label="اسم القسم بالإنجليزية (اختياري)" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
        <div>
          <label style={{
            fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)",
            display: "block", marginBottom: 5, fontWeight: 500,
          }}>الوصف</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={3}
            className="con-input"
            style={{ width: "100%", resize: "none", minHeight: 72 }}
          />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
        <button onClick={onClose} className="con-btn-ghost">إلغاء</button>
        <button
          onClick={handleSave}
          disabled={saving || !form.name_ar}
          className="con-btn-primary"
          style={{ opacity: (saving || !form.name_ar) ? 0.6 : 1 }}
        >
          {saving ? "جارٍ الحفظ..." : "إضافة القسم"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminStaff() {
  const [activeTab, setActiveTab] = useState<"staff" | "departments">("staff");
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);

  useEffect(() => { fetchData(); }, []);

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
      .select(`
        id, user_id, job_title_ar, permissions, can_approve, approval_limit, is_active, department_id,
        users ( full_name, email, phone, role ),
        departments ( name_ar )
      `)
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

  async function togglePermission(staffId: string, permKey: string, current: boolean) {
    if (!supabase) return;
    const member = staff.find(s => s.id === staffId);
    if (!member) return;
    const updated = { ...member.permissions, [permKey]: !current };
    const { error } = await supabase.from("staff_profiles").update({ permissions: updated }).eq("id", staffId);
    if (!error) {
      setStaff(prev => prev.map(s => s.id === staffId ? { ...s, permissions: updated } : s));
      if (selectedStaff?.id === staffId) setSelectedStaff(s => s ? { ...s, permissions: updated } : s);
    }
  }

  async function toggleActive(staffId: string, current: boolean) {
    if (!supabase) return;
    const { error } = await supabase.from("staff_profiles").update({ is_active: !current }).eq("id", staffId);
    if (!error) {
      setStaff(prev => prev.map(s => s.id === staffId ? { ...s, is_active: !current } : s));
      if (selectedStaff?.id === staffId) setSelectedStaff(s => s ? { ...s, is_active: !current } : s);
    }
  }

  async function grantAllPermissions(staffId: string) {
    if (!supabase) return;
    const all: Record<string, boolean> = {};
    ALL_PERMISSIONS.forEach(p => (all[p.key] = true));
    const { error } = await supabase.from("staff_profiles").update({ permissions: all }).eq("id", staffId);
    if (!error) {
      setStaff(prev => prev.map(s => s.id === staffId ? { ...s, permissions: all } : s));
      if (selectedStaff?.id === staffId) setSelectedStaff(s => s ? { ...s, permissions: all } : s);
    }
  }

  async function revokeAllPermissions(staffId: string) {
    if (!supabase) return;
    const none: Record<string, boolean> = {};
    ALL_PERMISSIONS.forEach(p => (none[p.key] = false));
    const { error } = await supabase.from("staff_profiles").update({ permissions: none }).eq("id", staffId);
    if (!error) {
      setStaff(prev => prev.map(s => s.id === staffId ? { ...s, permissions: none } : s));
      if (selectedStaff?.id === staffId) setSelectedStaff(s => s ? { ...s, permissions: none } : s);
    }
  }

  const filtered = staff.filter(s =>
    s.name.includes(search) || s.email.includes(search) || s.department_name.includes(search)
  );

  const activeCount = staff.filter(s => s.is_active).length;

  return (
    <div dir="rtl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              background: "rgba(59,130,246,0.12)", borderRadius: 8, padding: "7px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Users size={18} style={{ color: "var(--con-brand)" }} />
            </div>
            <h1 style={{
              fontSize: "var(--con-text-page-title)", fontWeight: 700,
              color: "var(--con-text-primary)", margin: 0,
              fontFamily: "var(--con-font-primary)",
            }}>
              الأقسام والموظفون
            </h1>
          </div>
          <p style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-muted)", margin: 0, paddingRight: 44 }}>
            إدارة الموظفين وتحديد صلاحياتهم
          </p>
        </div>
        <button
          onClick={() => activeTab === "staff" ? setShowAddModal(true) : setShowAddDeptModal(true)}
          className="con-btn-primary"
        >
          <Plus size={14} />
          {activeTab === "staff" ? "إضافة موظف" : "إضافة قسم"}
        </button>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "إجمالي الموظفين", value: staff.length,                   icon: Users,      accent: "var(--con-brand)" },
          { label: "موظفون نشطون",    value: activeCount,                    icon: ShieldCheck, accent: "var(--con-success)" },
          { label: "غير نشطين",       value: staff.length - activeCount,     icon: ShieldOff,   accent: "var(--con-danger)" },
          { label: "الأقسام",          value: departments.length,             icon: Building2,   accent: "var(--con-warning)" },
        ].map(k => (
          <div key={k.label} className="con-kpi-card" style={{ borderColor: "var(--con-border-default)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", fontWeight: 500 }}>
                {k.label}
              </span>
              <k.icon size={14} style={{ color: k.accent }} />
            </div>
            {loading
              ? <div className="con-skeleton" style={{ height: 22, width: "50%", borderRadius: 5 }} />
              : <div className="con-kpi-value" style={{ fontSize: 24, color: k.accent }}>{k.value}</div>
            }
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="con-tabs">
        {[
          { key: "staff", label: "الموظفون" },
          { key: "departments", label: "الأقسام" },
        ].map(tab => (
          <button
            key={tab.key}
            className={`con-tab ${activeTab === tab.key ? "con-tab-active" : ""}`}
            onClick={() => setActiveTab(tab.key as "staff" | "departments")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "staff" ? (
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, alignItems: "start" }}>

          {/* Staff list column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{
                position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)",
                color: "var(--con-text-muted)", pointerEvents: "none",
              }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="بحث بالاسم أو القسم..."
                className="con-input"
                style={{ paddingRight: 28, width: "100%" }}
              />
            </div>

            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} className="con-skeleton" style={{ height: 58, borderRadius: 8 }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="con-empty" style={{ padding: "32px 16px" }}>
                <Users size={28} style={{ opacity: 0.25, marginBottom: 8 }} />
                <div style={{ fontSize: "var(--con-text-body)" }}>لا يوجد موظفون</div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="con-btn-primary"
                  style={{ marginTop: 12, fontSize: 12 }}
                >
                  <UserPlus size={12} /> إضافة موظف
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {filtered.map(member => (
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
                onTogglePermission={(key, val) => togglePermission(selectedStaff.id, key, val)}
                onGrantAll={() => grantAllPermissions(selectedStaff.id)}
                onRevokeAll={() => revokeAllPermissions(selectedStaff.id)}
                onToggleActive={() => toggleActive(selectedStaff.id, selectedStaff.is_active)}
                onClose={() => setSelectedStaff(null)}
              />
            ) : (
              <div style={{
                background: "var(--con-bg-surface-1)",
                border: "1px solid var(--con-border-default)",
                borderRadius: 10, padding: "60px 24px",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                textAlign: "center", minHeight: 260,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: "var(--con-bg-surface-2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 12,
                }}>
                  <Shield size={22} style={{ color: "var(--con-text-muted)" }} />
                </div>
                <div style={{ fontSize: "var(--con-text-body)", color: "var(--con-text-secondary)", fontWeight: 500 }}>
                  اختر موظفاً
                </div>
                <div style={{ fontSize: "var(--con-text-caption)", color: "var(--con-text-muted)", marginTop: 4 }}>
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

      {/* Modals */}
      {showAddModal && (
        <AddStaffModal
          departments={departments}
          onClose={() => setShowAddModal(false)}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}
