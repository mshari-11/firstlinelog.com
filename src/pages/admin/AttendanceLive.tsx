/**
 * صفحة الحضور والانصراف — بيانات مباشرة من نظام AlManahel
 * يسحب بيانات الموظفين والأقسام والفروع بشكل لحظي
 * المصدر: https://first-line.almanaheltime.com
 */
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Fingerprint,
  RefreshCw,
  Users,
  Building2,
  GitBranch,
  UserCheck,
  Clock,
  Search,
  Download,
  Printer,
  Link2,
  Eye,
  CalendarDays,
  Briefcase,
  Phone,
  MapPin,
} from "lucide-react";
import { PageWrapper, PageHeader, Modal } from "@/components/admin/ui";
import { StatsCard } from "@/components/admin/StatsCard";
import {
  fetchEmployees,
  fetchDepartments,
  fetchBranches,
  fetchPositions,
  authenticateAlmanahel,
  type AlmanahelEmployee,
  type AlmanahelDepartment,
  type AlmanahelBranch,
} from "@/lib/almanahel-api";

export default function AttendanceLive() {
  const [employees, setEmployees] = useState<AlmanahelEmployee[]>([]);
  const [departments, setDepartments] = useState<AlmanahelDepartment[]>([]);
  const [branches, setBranches] = useState<AlmanahelBranch[]>([]);
  const [positions, setPositions] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [search, setSearch] = useState("");
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState<AlmanahelEmployee | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [emps, depts, brs, pos] = await Promise.all([
        fetchEmployees(),
        fetchDepartments(),
        fetchBranches(),
        fetchPositions(),
      ]);
      setEmployees(emps);
      setDepartments(depts);
      setBranches(brs);
      setPositions(pos);
      setConnected(true);
      setLastSync(new Date());
      toast.success(`تم سحب ${emps.length} موظف من نظام البصمة`);
    } catch (err: any) {
      if (err?.message?.includes("توكن")) {
        setShowLogin(true);
      } else {
        toast.error("فشل الاتصال بنظام البصمة");
      }
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!connected) return;
    const interval = setInterval(fetchAllData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [connected, fetchAllData]);

  const handleLogin = async () => {
    setLoginLoading(true);
    try {
      await authenticateAlmanahel(loginUser, loginPass);
      setShowLogin(false);
      toast.success("تم الاتصال بنظام البصمة بنجاح");
      fetchAllData();
    } catch {
      toast.error("فشل تسجيل الدخول — تحقق من البيانات");
    } finally {
      setLoginLoading(false);
    }
  };

  const getDeptName = (id: number) => departments.find((d) => d.id === id)?.name || "-";
  const getBranchName = (id: number) => branches.find((b) => b.id === id)?.name || "-";
  const getPositionName = (id: number) => positions.find((p) => p.id === id)?.name || "-";

  const activeEmployees = employees.filter((e) => !e.firingDate);

  const filtered = employees.filter((e) => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) ||
      String(e.code).includes(search) || (e.idNumber && e.idNumber.includes(search));
    const matchBranch = filterBranch === "all" || e.branchId === Number(filterBranch);
    const matchDept = filterDept === "all" || e.departmentId === Number(filterDept);
    return matchSearch && matchBranch && matchDept;
  });

  const handleExport = () => {
    const sanitize = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v);
    const csv = [
      "الكود,الاسم,القسم,الفرع,تاريخ الانضمام,الحالة",
      ...filtered.map((e) =>
        `${e.code},"${sanitize(e.name)}","${sanitize(getDeptName(e.departmentId))}","${sanitize(getBranchName(e.branchId))}","${e.joinDate?.split("T")[0] || ""}","${e.firingDate ? "منتهي" : "نشط"}"`
      ),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `almanahel-employees-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("تم تصدير البيانات");
  };

  const thStyle: React.CSSProperties = {
    padding: "10px 14px", fontSize: 12, fontWeight: 600,
    color: "var(--con-text-muted, #94a3b8)", textAlign: "right",
    borderBottom: "1px solid var(--con-border, #1a3a52)", whiteSpace: "nowrap",
  };
  const tdStyle: React.CSSProperties = {
    padding: "12px 14px", fontSize: 13, color: "var(--con-text, #e2e8f0)",
    borderBottom: "1px solid var(--con-border, #1a3a52)",
  };
  const inputStyle: React.CSSProperties = {
    background: "var(--con-bg, #07111d)", border: "1px solid var(--con-border, #1a3a52)",
    borderRadius: 8, padding: "8px 12px", color: "var(--con-text, #e2e8f0)",
    fontSize: 13, fontFamily: "inherit", width: "100%",
  };

  return (
    <PageWrapper>
      <PageHeader
        icon={Fingerprint}
        title="الحضور والانصراف — بيانات مباشرة"
        subtitle={
          connected
            ? `متصل — ${employees.length} موظف${lastSync ? ` | آخر تحديث: ${lastSync.toLocaleTimeString("ar-SA")}` : ""}`
            : "غير متصل بنظام البصمة"
        }
        iconColor={connected ? "#22c55e" : "#ef4444"}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={fetchAllData} disabled={loading} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
              background: "var(--con-card, #0d1926)", border: "1px solid var(--con-border, #1a3a52)",
              borderRadius: 8, color: "var(--con-text, #e2e8f0)", fontSize: 13,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              تحديث
            </button>
            <button onClick={handleExport} disabled={!connected} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
              background: connected ? "var(--con-brand, #3b82f6)" : "#475569",
              border: "none", borderRadius: 8, color: "#fff", fontSize: 13,
              cursor: connected ? "pointer" : "not-allowed", fontFamily: "inherit",
            }}>
              <Download size={14} /> تصدير
            </button>
            <button onClick={() => window.print()} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
              background: "var(--con-card, #0d1926)", border: "1px solid var(--con-border, #1a3a52)",
              borderRadius: 8, color: "var(--con-text, #e2e8f0)", fontSize: 13,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              <Printer size={14} /> طباعة
            </button>
          </div>
        }
      />

      {/* Connection Banner */}
      <div style={{
        background: connected ? "#22c55e12" : "#ef444412",
        border: `1px solid ${connected ? "#22c55e40" : "#ef444440"}`,
        borderRadius: 10, padding: "10px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link2 size={16} color={connected ? "#22c55e" : "#ef4444"} />
          <span style={{ color: connected ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
            {connected ? "متصل بنظام البصمة AlManahel" : "غير متصل"}
          </span>
          {connected && (
            <span style={{ color: "#94a3b8", fontSize: 12 }}>
              — تحديث تلقائي كل 5 دقائق
            </span>
          )}
        </div>
        {!connected && (
          <button onClick={() => setShowLogin(true)} style={{
            background: "var(--con-brand, #3b82f6)", border: "none", borderRadius: 6,
            padding: "6px 14px", color: "#fff", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
          }}>
            تسجيل الدخول
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <StatsCard icon={Users} title="إجمالي الموظفين" value={employees.length} color="#3b82f6" subtitle="من نظام البصمة مباشرة" />
        <StatsCard icon={UserCheck} title="موظفين نشطين" value={activeEmployees.length} color="#22c55e" />
        <StatsCard icon={Building2} title="الأقسام" value={departments.length} color="#f59e0b" />
        <StatsCard icon={GitBranch} title="الفروع" value={branches.length} color="#8b5cf6" />
      </div>

      {/* Branch Cards */}
      {branches.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          {branches.map((b) => {
            const count = employees.filter((e) => e.branchId === b.id).length;
            return (
              <div key={b.id} style={{
                background: "var(--con-card, #0d1926)", border: "1px solid var(--con-border, #1a3a52)",
                borderRadius: 10, padding: "14px 16px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div>
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>{b.name}</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: "var(--con-text, #e2e8f0)", margin: "4px 0 0" }}>{count}</p>
                </div>
                <div style={{ background: "#8b5cf618", borderRadius: 8, padding: 8 }}>
                  <MapPin size={18} color="#8b5cf6" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Employees Table */}
      <div style={{
        background: "var(--con-card, #0d1926)", border: "1px solid var(--con-border, #1a3a52)",
        borderRadius: 12, overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
          borderBottom: "1px solid var(--con-border, #1a3a52)", flexWrap: "wrap",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200,
            background: "var(--con-bg, #07111d)", border: "1px solid var(--con-border, #1a3a52)",
            borderRadius: 8, padding: "6px 12px",
          }}>
            <Search size={16} color="#94a3b8" />
            <input type="text" placeholder="بحث بالاسم أو الكود..." aria-label="بحث في الموظفين"
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ background: "transparent", border: "none", outline: "none",
                color: "var(--con-text, #e2e8f0)", fontSize: 13, width: "100%", fontFamily: "inherit" }}
            />
          </div>
          <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} aria-label="فلترة بالفرع"
            style={{ background: "var(--con-bg, #07111d)", border: "1px solid var(--con-border, #1a3a52)",
              borderRadius: 8, padding: "6px 12px", color: "var(--con-text, #e2e8f0)", fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
            <option value="all">جميع الفروع</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} aria-label="فلترة بالقسم"
            style={{ background: "var(--con-bg, #07111d)", border: "1px solid var(--con-border, #1a3a52)",
              borderRadius: 8, padding: "6px 12px", color: "var(--con-text, #e2e8f0)", fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
            <option value="all">جميع الأقسام</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>الكود</th>
                <th style={thStyle}>الاسم</th>
                <th style={thStyle}>الفرع</th>
                <th style={thStyle}>القسم</th>
                <th style={thStyle}>الانضمام</th>
                <th style={thStyle}>الحالة</th>
                <th style={{ ...thStyle, cursor: "default" }}>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ ...tdStyle, textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
                    {connected ? "لا توجد نتائج مطابقة" : "يرجى الاتصال بنظام البصمة أولاً"}
                  </td>
                </tr>
              ) : filtered.map((emp) => (
                <tr key={emp.id} style={{ transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#ffffff08")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ ...tdStyle, fontWeight: 600, color: "var(--con-brand, #3b82f6)" }}>{emp.code}</td>
                  <td style={tdStyle}>{emp.name}</td>
                  <td style={{ ...tdStyle, fontSize: 12 }}>{getBranchName(emp.branchId)}</td>
                  <td style={{ ...tdStyle, fontSize: 12 }}>{getDeptName(emp.departmentId)}</td>
                  <td style={{ ...tdStyle, fontSize: 12, color: "#94a3b8" }}>
                    {emp.joinDate ? new Date(emp.joinDate).toLocaleDateString("ar-SA") : "-"}
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      background: emp.firingDate ? "#ef444418" : "#22c55e18",
                      color: emp.firingDate ? "#ef4444" : "#22c55e",
                      padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                    }}>{emp.firingDate ? "منتهي" : "نشط"}</span>
                  </td>
                  <td style={tdStyle}>
                    <button onClick={() => setSelectedEmployee(emp)} aria-label={`عرض ${emp.name}`}
                      style={{ background: "var(--con-brand-subtle, #1e3a5f)", border: "none", borderRadius: 6,
                        padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                        color: "var(--con-brand, #3b82f6)", fontSize: 12 }}>
                      <Eye size={14} /> عرض
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{
          padding: "10px 16px", fontSize: 12, color: "#94a3b8",
          borderTop: "1px solid var(--con-border, #1a3a52)",
          display: "flex", justifyContent: "space-between",
        }}>
          <span>إجمالي: {filtered.length} من {employees.length}</span>
          <span>المصدر: نظام البصمة AlManahel — بيانات مباشرة</span>
        </div>
      </div>

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <Modal onClose={() => setSelectedEmployee(null)} title="تفاصيل الموظف" width={550}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "0.5rem 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#3b82f618",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Users size={24} color="#3b82f6" />
              </div>
              <div>
                <p style={{ fontSize: 18, fontWeight: 700, color: "var(--con-text, #e2e8f0)", margin: 0 }}>{selectedEmployee.name}</p>
                <p style={{ fontSize: 13, color: "#94a3b8", margin: "2px 0 0" }}>كود: {selectedEmployee.code}</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13,
              background: "var(--con-bg, #07111d)", borderRadius: 8, padding: 16 }}>
              {[
                { icon: Building2, label: "القسم", value: getDeptName(selectedEmployee.departmentId) },
                { icon: MapPin, label: "الفرع", value: getBranchName(selectedEmployee.branchId) },
                { icon: Briefcase, label: "المسمى", value: getPositionName(selectedEmployee.positionId) },
                { icon: CalendarDays, label: "الانضمام", value: selectedEmployee.joinDate ? new Date(selectedEmployee.joinDate).toLocaleDateString("ar-SA") : "-" },
                { icon: Phone, label: "الهاتف", value: selectedEmployee.phoneNumber || "-" },
                { icon: Clock, label: "بداية اليوم", value: selectedEmployee.dayStart || "-" },
                { icon: Fingerprint, label: "الهوية", value: selectedEmployee.idNumber || "-" },
                { icon: MapPin, label: "العنوان", value: selectedEmployee.address || "-" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <item.icon size={14} color="#94a3b8" />
                  <span style={{ color: "#94a3b8" }}>{item.label}:</span>
                  <span style={{ color: "var(--con-text, #e2e8f0)" }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Login Modal */}
      {showLogin && (
        <Modal onClose={() => setShowLogin(false)} title="الاتصال بنظام البصمة" width={400}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "0.5rem 0" }}>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>أدخل بيانات الدخول لنظام AlManahel</p>
            <input type="text" value={loginUser} onChange={(e) => setLoginUser(e.target.value)}
              style={inputStyle} placeholder="اسم المستخدم" />
            <input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)}
              style={inputStyle} placeholder="كلمة المرور" onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
            <button onClick={handleLogin} disabled={loginLoading || !loginUser || !loginPass}
              style={{ background: "var(--con-brand, #3b82f6)", border: "none", borderRadius: 8,
                padding: "10px 16px", color: "#fff", fontSize: 14, fontWeight: 600,
                cursor: loginLoading ? "wait" : "pointer", fontFamily: "inherit",
                opacity: loginLoading || !loginUser || !loginPass ? 0.6 : 1 }}>
              {loginLoading ? "جاري الاتصال..." : "اتصال"}
            </button>
          </div>
        </Modal>
      )}
    </PageWrapper>
  );
}
