/**
 * صفحة إدارة الموظفين والصلاحيات
 * المدير يتحكم في صلاحيات كل موظف
 */
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Users, Building2, Plus, Search, Shield, ShieldCheck, ShieldOff,
  Edit2, Trash2, X, Check, ChevronDown, Eye, EyeOff,
  LayoutDashboard, ClipboardList, DollarSign, MessageSquare,
  FileSpreadsheet, Car, Settings, UserPlus, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── أنواع البيانات ─────────────────────────────────────────────

interface Permission {
  key: string;
  labelAr: string;
  icon: React.ElementType;
  color: string;
}

const ALL_PERMISSIONS: Permission[] = [
  { key: "couriers",   labelAr: "عرض المناديب",       icon: Users,           color: "purple" },
  { key: "orders",     labelAr: "عرض الطلبات",        icon: ClipboardList,   color: "cyan"   },
  { key: "finance",    labelAr: "إدارة المالية",       icon: DollarSign,      color: "yellow" },
  { key: "complaints", labelAr: "إدارة الشكاوى",      icon: MessageSquare,   color: "red"    },
  { key: "excel",      labelAr: "رفع Excel",           icon: FileSpreadsheet, color: "green"  },
  { key: "reports",    labelAr: "عرض التقارير",        icon: Eye,             color: "blue"   },
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
  // joined
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

// ─── الصفحة الرئيسية ────────────────────────────────────────────

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

    // جلب الأقسام
    const { data: depts } = await supabase
      .from("departments")
      .select("*")
      .eq("is_active", true)
      .order("name_ar");
    if (depts) setDepartments(depts);

    // جلب الموظفين مع join
    const { data: staffData } = await supabase
      .from("staff_profiles")
      .select(`
        id, user_id, job_title_ar, permissions, can_approve, approval_limit, is_active, department_id,
        users_2026_02_17_21_00 ( name, email, phone, role ),
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
        name: s.users_2026_02_17_21_00?.name || "—",
        email: s.users_2026_02_17_21_00?.email || "—",
        phone: s.users_2026_02_17_21_00?.phone || "—",
        role: s.users_2026_02_17_21_00?.role || "staff",
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
    const { error } = await supabase
      .from("staff_profiles")
      .update({ permissions: updated })
      .eq("id", staffId);
    if (!error) {
      setStaff(prev => prev.map(s => s.id === staffId ? { ...s, permissions: updated } : s));
      if (selectedStaff?.id === staffId) setSelectedStaff(s => s ? { ...s, permissions: updated } : s);
    }
  }

  async function toggleActive(staffId: string, current: boolean) {
    if (!supabase) return;
    const { error } = await supabase
      .from("staff_profiles")
      .update({ is_active: !current })
      .eq("id", staffId);
    if (!error) {
      setStaff(prev => prev.map(s => s.id === staffId ? { ...s, is_active: !current } : s));
      if (selectedStaff?.id === staffId) setSelectedStaff(s => s ? { ...s, is_active: !current } : s);
    }
  }

  async function grantAllPermissions(staffId: string) {
    if (!supabase) return;
    const all: Record<string, boolean> = {};
    ALL_PERMISSIONS.forEach(p => all[p.key] = true);
    const { error } = await supabase
      .from("staff_profiles")
      .update({ permissions: all })
      .eq("id", staffId);
    if (!error) {
      setStaff(prev => prev.map(s => s.id === staffId ? { ...s, permissions: all } : s));
      if (selectedStaff?.id === staffId) setSelectedStaff(s => s ? { ...s, permissions: all } : s);
    }
  }

  async function revokeAllPermissions(staffId: string) {
    if (!supabase) return;
    const none: Record<string, boolean> = {};
    ALL_PERMISSIONS.forEach(p => none[p.key] = false);
    const { error } = await supabase
      .from("staff_profiles")
      .update({ permissions: none })
      .eq("id", staffId);
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
    <div className="space-y-6" dir="rtl">
      {/* الرأس */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">الأقسام والموظفين</h1>
          <p className="text-slate-400 text-sm mt-0.5">إدارة الموظفين وتحديد صلاحياتهم</p>
        </div>
        <button
          onClick={() => activeTab === "staff" ? setShowAddModal(true) : setShowAddDeptModal(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          {activeTab === "staff" ? "إضافة موظف" : "إضافة قسم"}
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الموظفين", value: staff.length, color: "blue", icon: Users },
          { label: "موظفون نشطون", value: activeCount, color: "green", icon: ShieldCheck },
          { label: "غير نشطين", value: staff.length - activeCount, color: "red", icon: ShieldOff },
          { label: "الأقسام", value: departments.length, color: "orange", icon: Building2 },
        ].map(k => (
          <div key={k.label} className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3",
              k.color === "blue" && "bg-blue-500/15",
              k.color === "green" && "bg-green-500/15",
              k.color === "red" && "bg-red-500/15",
              k.color === "orange" && "bg-orange-500/15",
            )}>
              <k.icon size={18} className={cn(
                k.color === "blue" && "text-blue-400",
                k.color === "green" && "text-green-400",
                k.color === "red" && "text-red-400",
                k.color === "orange" && "text-orange-400",
              )} />
            </div>
            <p className="text-2xl font-bold text-white">{k.value}</p>
            <p className="text-slate-400 text-xs mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl w-fit">
        {[
          { key: "staff", label: "الموظفون" },
          { key: "departments", label: "الأقسام" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.key
                ? "bg-orange-500 text-white shadow"
                : "text-slate-400 hover:text-white"
            )}
          >{tab.label}</button>
        ))}
      </div>

      {/* محتوى التاب */}
      {activeTab === "staff" ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* قائمة الموظفين */}
          <div className="xl:col-span-1 space-y-3">
            <div className="relative">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="بحث بالاسم أو القسم..."
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl py-2.5 pr-9 pl-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50"
              />
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-500 text-sm">جارٍ التحميل...</div>
            ) : filtered.length === 0 ? (
              <EmptyStaff onAdd={() => setShowAddModal(true)} />
            ) : (
              <div className="space-y-2">
                {filtered.map(member => (
                  <StaffCard
                    key={member.id}
                    member={member}
                    selected={selectedStaff?.id === member.id}
                    onClick={() => setSelectedStaff(member)}
                    onToggleActive={() => toggleActive(member.id, member.is_active)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* لوحة الصلاحيات */}
          <div className="xl:col-span-2">
            {selectedStaff ? (
              <PermissionsPanel
                member={selectedStaff}
                departments={departments}
                onTogglePermission={(key, val) => togglePermission(selectedStaff.id, key, val)}
                onGrantAll={() => grantAllPermissions(selectedStaff.id)}
                onRevokeAll={() => revokeAllPermissions(selectedStaff.id)}
                onClose={() => setSelectedStaff(null)}
              />
            ) : (
              <div className="h-full bg-slate-800/40 rounded-2xl border border-slate-700/30 flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mb-4">
                  <Shield size={28} className="text-slate-500" />
                </div>
                <p className="text-slate-400 font-medium">اختر موظفاً</p>
                <p className="text-slate-600 text-sm mt-1">لتعديل صلاحياته</p>
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

      {/* مودال إضافة موظف */}
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

// ─── كارد الموظف ────────────────────────────────────────────────

function StaffCard({ member, selected, onClick, onToggleActive }: {
  member: StaffMember;
  selected: boolean;
  onClick: () => void;
  onToggleActive: () => void;
}) {
  const permCount = Object.values(member.permissions).filter(Boolean).length;
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border cursor-pointer transition-all",
        selected
          ? "bg-orange-500/10 border-orange-500/40"
          : "bg-slate-800/60 border-slate-700/40 hover:border-slate-600"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0",
          member.is_active ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white" : "bg-slate-700 text-slate-400"
        )}>
          {member.name.charAt(0) || "م"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-white text-sm font-medium truncate">{member.name}</p>
            {!member.is_active && (
              <span className="text-xs bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-md">معطّل</span>
            )}
          </div>
          <p className="text-slate-400 text-xs">{member.job_title_ar}</p>
          <p className="text-slate-500 text-xs">{member.department_name}</p>
        </div>
        <div className="text-left shrink-0">
          <p className="text-orange-400 text-xs font-medium">{permCount} صلاحية</p>
        </div>
      </div>
    </div>
  );
}

// ─── لوحة الصلاحيات ─────────────────────────────────────────────

function PermissionsPanel({ member, departments, onTogglePermission, onGrantAll, onRevokeAll, onClose }: {
  member: StaffMember;
  departments: Department[];
  onTogglePermission: (key: string, current: boolean) => void;
  onGrantAll: () => void;
  onRevokeAll: () => void;
  onClose: () => void;
}) {
  const dept = departments.find(d => d.id === member.department_id);

  return (
    <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* رأس اللوحة */}
      <div className="p-5 border-b border-slate-700/50 flex items-center gap-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold",
          member.is_active
            ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white"
            : "bg-slate-700 text-slate-400"
        )}>
          {member.name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-white font-semibold">{member.name}</h2>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              member.is_active ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
            )}>
              {member.is_active ? "نشط" : "معطّل"}
            </span>
          </div>
          <p className="text-slate-400 text-sm">{member.job_title_ar} {dept ? `• ${dept.name_ar}` : ""}</p>
          <p className="text-slate-500 text-xs">{member.email}</p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-700 transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* أزرار سريعة */}
      <div className="px-5 py-3 border-b border-slate-700/40 flex items-center gap-3">
        <p className="text-slate-400 text-sm flex-1">إدارة الصلاحيات</p>
        <button
          onClick={onGrantAll}
          className="flex items-center gap-1.5 text-xs bg-green-500/15 hover:bg-green-500/25 text-green-400 px-3 py-1.5 rounded-lg transition-colors"
        >
          <ShieldCheck size={13} /> منح الكل
        </button>
        <button
          onClick={onRevokeAll}
          className="flex items-center gap-1.5 text-xs bg-red-500/15 hover:bg-red-500/25 text-red-400 px-3 py-1.5 rounded-lg transition-colors"
        >
          <ShieldOff size={13} /> سحب الكل
        </button>
      </div>

      {/* شبكة الصلاحيات */}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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

      {/* معلومات إضافية */}
      <div className="px-5 pb-5 grid grid-cols-2 gap-3">
        <div className="bg-slate-900/50 rounded-xl p-3">
          <p className="text-slate-500 text-xs mb-1">صلاحية الاعتماد</p>
          <p className={cn("text-sm font-medium", member.can_approve ? "text-green-400" : "text-slate-400")}>
            {member.can_approve ? `✓ نعم — حتى ${member.approval_limit?.toLocaleString("ar")} ر.س` : "✗ لا"}
          </p>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-3">
          <p className="text-slate-500 text-xs mb-1">الصلاحيات الممنوحة</p>
          <p className="text-orange-400 text-sm font-medium">
            {Object.values(member.permissions).filter(Boolean).length} / {ALL_PERMISSIONS.length}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── زر الصلاحية ─────────────────────────────────────────────────

function PermissionToggle({ perm, granted, onToggle }: {
  perm: Permission;
  granted: boolean;
  onToggle: () => void;
}) {
  const colorMap: Record<string, string> = {
    blue:   "bg-blue-500/15 text-blue-400 border-blue-500/30",
    purple: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    cyan:   "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    green:  "bg-green-500/15 text-green-400 border-green-500/30",
    yellow: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    red:    "bg-red-500/15 text-red-400 border-red-500/30",
    orange: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    pink:   "bg-pink-500/15 text-pink-400 border-pink-500/30",
    slate:  "bg-slate-500/15 text-slate-400 border-slate-500/30",
  };

  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border transition-all text-right w-full",
        granted
          ? colorMap[perm.color]
          : "bg-slate-900/40 text-slate-600 border-slate-700/30 hover:border-slate-600"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
        granted ? "bg-current/10" : "bg-slate-800"
      )}>
        <perm.icon size={15} className={granted ? "" : "text-slate-600"} />
      </div>
      <span className={cn("text-sm flex-1", granted ? "font-medium" : "text-slate-500")}>
        {perm.labelAr}
      </span>
      <div className={cn(
        "w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all",
        granted ? "bg-current text-white scale-100" : "bg-slate-700 scale-90"
      )}>
        {granted ? <Check size={11} className="text-white" /> : <X size={11} className="text-slate-500" />}
      </div>
    </button>
  );
}

// ─── تاب الأقسام ─────────────────────────────────────────────────

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
        <div className="text-center py-16 text-slate-500 text-sm">
          <Building2 size={32} className="mx-auto mb-3 text-slate-700" />
          لا توجد أقسام بعد
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {departments.map(dept => {
            const deptStaff = staff.filter(s => s.department_id === dept.id);
            return (
              <div key={dept.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-500/15 rounded-xl flex items-center justify-center shrink-0">
                    <Building2 size={18} className="text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{dept.name_ar}</h3>
                    <p className="text-slate-500 text-xs">{dept.description}</p>
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    dept.is_active ? "bg-green-500/15 text-green-400" : "bg-slate-700 text-slate-500"
                  )}>
                    {dept.is_active ? "نشط" : "معطّل"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">{deptStaff.length} موظف</span>
                  <div className="flex -space-x-2 space-x-reverse">
                    {deptStaff.slice(0, 4).map(s => (
                      <div
                        key={s.id}
                        className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 border-2 border-slate-800 flex items-center justify-center text-xs text-white font-bold"
                        title={s.name}
                      >
                        {s.name.charAt(0)}
                      </div>
                    ))}
                    {deptStaff.length > 4 && (
                      <div className="w-7 h-7 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-xs text-slate-400">
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

// ─── مودال إضافة موظف ───────────────────────────────────────────

function AddStaffModal({ departments, onClose, onSaved }: {
  departments: Department[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    job_title_ar: "", department_id: "", can_approve: false, approval_limit: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!supabase) return;
    if (!form.name || !form.email || !form.password) {
      setError("يرجى تعبئة الاسم والبريد الإلكتروني وكلمة المرور");
      return;
    }
    setSaving(true);
    setError("");

    // إنشاء حساب في auth
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: form.email,
      password: form.password,
      email_confirm: true,
    });

    if (authErr || !authData.user) {
      setError("خطأ في إنشاء الحساب: " + authErr?.message);
      setSaving(false);
      return;
    }

    // إضافة للجدول users
    await supabase.from("users_2026_02_17_21_00").insert({
      id: authData.user.id,
      name: form.name,
      email: form.email,
      phone: form.phone,
      role: "staff",
      status: "active",
    });

    // إضافة profile
    const defaultPerms: Record<string, boolean> = {};
    ALL_PERMISSIONS.forEach(p => defaultPerms[p.key] = false);

    await supabase.from("staff_profiles").insert({
      user_id: authData.user.id,
      department_id: form.department_id || null,
      job_title_ar: form.job_title_ar || "موظف",
      permissions: defaultPerms,
      can_approve: form.can_approve,
      approval_limit: form.approval_limit,
      is_active: true,
    });

    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <Modal title="إضافة موظف جديد" onClose={onClose}>
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-4">
          <AlertCircle size={15} /> {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <ModalField label="الاسم الكامل" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
        <ModalField label="رقم الجوال" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
        <ModalField label="البريد الإلكتروني" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" span />
        <ModalField label="كلمة المرور" value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} type="password" span />
        <ModalField label="المسمى الوظيفي" value={form.job_title_ar} onChange={v => setForm(f => ({ ...f, job_title_ar: v }))} />
        <div>
          <label className="text-slate-400 text-xs mb-1.5 block">القسم</label>
          <select
            value={form.department_id}
            onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-orange-500/50"
          >
            <option value="">— بدون قسم —</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name_ar}</option>)}
          </select>
        </div>
        <div className="col-span-2 flex items-center gap-3">
          <input
            type="checkbox"
            id="can_approve"
            checked={form.can_approve}
            onChange={e => setForm(f => ({ ...f, can_approve: e.target.checked }))}
            className="accent-orange-500 w-4 h-4"
          />
          <label htmlFor="can_approve" className="text-slate-300 text-sm">صلاحية الاعتماد</label>
          {form.can_approve && (
            <ModalField
              label=""
              value={String(form.approval_limit)}
              onChange={v => setForm(f => ({ ...f, approval_limit: Number(v) }))}
              type="number"
              placeholder="الحد الأقصى (ر.س)"
            />
          )}
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-xl transition-colors">إلغاء</button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 text-sm bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          {saving ? "جارٍ الحفظ..." : <><UserPlus size={15} /> إضافة موظف</>}
        </button>
      </div>
    </Modal>
  );
}

// ─── مودال إضافة قسم ─────────────────────────────────────────────

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
      <div className="space-y-4">
        <ModalField label="اسم القسم بالعربية" value={form.name_ar} onChange={v => setForm(f => ({ ...f, name_ar: v }))} />
        <ModalField label="اسم القسم بالإنجليزية" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
        <div>
          <label className="text-slate-400 text-xs mb-1.5 block">الوصف</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={3}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-orange-500/50 resize-none"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-xl transition-colors">إلغاء</button>
        <button
          onClick={handleSave}
          disabled={saving || !form.name_ar}
          className="px-5 py-2 text-sm bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
        >
          {saving ? "جارٍ الحفظ..." : "إضافة القسم"}
        </button>
      </div>
    </Modal>
  );
}

// ─── مكونات مساعدة ───────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-white font-semibold">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ModalField({ label, value, onChange, type = "text", span = false, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; span?: boolean; placeholder?: string;
}) {
  return (
    <div className={span ? "col-span-2" : ""}>
      {label && <label className="text-slate-400 text-xs mb-1.5 block">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-orange-500/50"
      />
    </div>
  );
}

function EmptyStaff({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-700/30">
      <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Users size={24} className="text-slate-500" />
      </div>
      <p className="text-slate-400 font-medium mb-1">لا يوجد موظفون</p>
      <p className="text-slate-600 text-sm mb-4">ابدأ بإضافة أول موظف</p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm mx-auto transition-colors"
      >
        <UserPlus size={15} /> إضافة موظف
      </button>
    </div>
  );
}
