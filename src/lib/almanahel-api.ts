/**
 * AlManahel Time — خدمة الاتصال بنظام الحضور والانصراف
 * النظام: https://first-line.almanaheltime.com
 * API: https://first-line-api.almanaheltime.com
 *
 * يسحب البيانات بشكل مباشر: موظفين، أقسام، فروع، إجازات، بصمات
 * Token يُجدد تلقائياً (صلاحية سنتين)
 */

const ALMANAHEL_API = "https://first-line-api.almanaheltime.com";
const TOKEN_KEY = "fll_almanahel_token";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AlmanahelEmployee {
  id: number;
  name: string;
  code: number;
  joinDate: string;
  weeklyDaysOff: string;
  birthdate: string | null;
  phoneNumber: string | null;
  address: string | null;
  firingDate: string | null;
  firingReason: string | null;
  idNumber: string | null;
  idIssueDate: string | null;
  idExpiryDate: string | null;
  dayStart: string;
  departmentId: number;
  departmentName: string | null;
  positionId: number;
  branchId: number;
  status: number;
  shiftId: number;
  calculationMethod: number;
  gender: number;
  calcaulateOvertime: boolean;
  maximumAllowedMobileDevices: number;
  mustSendPhotoWithMobileFingerprint: boolean;
}

export interface AlmanahelDepartment {
  id: number;
  name: string;
  institutionId: number;
  parentDepartmentId: number | null;
  parentDeptName: string | null;
  level: number;
  maximumWorkHours: string;
}

export interface AlmanahelBranch {
  id: number;
  name: string;
  institutionId: number;
  cityId: number;
  address: string | null;
  phoneNumber: string | null;
}

export interface AlmanahelVacation {
  id: number;
  name: string;
  code?: number;
}

export interface AlmanahelShift {
  id: number;
  name?: string;
  code?: number;
}

export interface AlmanahelSchedule {
  id: number;
  name?: string;
}

export interface AlmanahelUserClaims {
  userName: string;
  userId: number;
  expirationDate: string;
  activeDate: string;
  roleId: number;
  isAdmin: boolean;
  isFollowUp: boolean;
  isDepartmentManager: boolean;
  isGeneralManager: boolean;
}

export interface AlmanahelStats {
  totalEmployees: number;
  activeEmployees: number;
  departments: number;
  branches: number;
}

// ─── Auth ───────────────────────────────────────────────────────────────────

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // localStorage unavailable
  }
}

export async function authenticateAlmanahel(
  username: string,
  password: string
): Promise<string> {
  const res = await fetch(`${ALMANAHEL_API}/authenticate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("فشل تسجيل الدخول في نظام البصمة");
  const data = await res.json();
  const token = data.token || data.access_token;
  if (!token) throw new Error("لم يتم استلام توكن صالح");
  storeToken(token);
  return token;
}

async function getToken(): Promise<string> {
  const stored = getStoredToken();
  if (stored) return stored;
  // Auto-authenticate with env credentials if available
  const user = import.meta.env.VITE_ALMANAHEL_USER;
  const pass = import.meta.env.VITE_ALMANAHEL_PASS;
  if (user && pass) {
    return authenticateAlmanahel(user, pass);
  }
  throw new Error("لا يوجد توكن لنظام البصمة — يرجى تسجيل الدخول أولاً");
}

async function apiFetch<T>(endpoint: string): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${ALMANAHEL_API}/${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `bearer ${token}`,
    },
  });
  if (res.status === 401) {
    // Token expired — clear and retry
    localStorage.removeItem(TOKEN_KEY);
    throw new Error("انتهت صلاحية توكن نظام البصمة");
  }
  if (!res.ok) throw new Error(`خطأ في نظام البصمة: ${res.status}`);
  return res.json();
}

// ─── Data Fetchers ──────────────────────────────────────────────────────────

export async function fetchEmployees(): Promise<AlmanahelEmployee[]> {
  return apiFetch<AlmanahelEmployee[]>("api/employees");
}

export async function fetchDepartments(): Promise<AlmanahelDepartment[]> {
  return apiFetch<AlmanahelDepartment[]>("api/departments");
}

export async function fetchBranches(): Promise<AlmanahelBranch[]> {
  return apiFetch<AlmanahelBranch[]>("api/branches");
}

export async function fetchVacations(): Promise<AlmanahelVacation[]> {
  return apiFetch<AlmanahelVacation[]>("api/vacations");
}

export async function fetchShifts(): Promise<AlmanahelShift[]> {
  return apiFetch<AlmanahelShift[]>("api/shifts");
}

export async function fetchSchedules(): Promise<AlmanahelSchedule[]> {
  return apiFetch<AlmanahelSchedule[]>("api/schedules");
}

export async function fetchPositions(): Promise<{ id: number; name: string }[]> {
  return apiFetch("api/positions");
}

export async function fetchUserClaims(): Promise<AlmanahelUserClaims> {
  return apiFetch<AlmanahelUserClaims>("api/GetUserClaims");
}

// ─── Aggregated Stats ───────────────────────────────────────────────────────

export async function fetchAlmanahelStats(): Promise<AlmanahelStats> {
  const [employees, departments, branches] = await Promise.all([
    fetchEmployees(),
    fetchDepartments(),
    fetchBranches(),
  ]);
  const active = employees.filter((e) => !e.firingDate);
  return {
    totalEmployees: employees.length,
    activeEmployees: active.length,
    departments: departments.length,
    branches: branches.length,
  };
}
