/**
 * نظام التوثيق المركزي - Supabase Edge Functions
 * Authentication via Supabase login-password edge function
 */
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { cognitoSignOut } from "@/lib/cognito";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://djebhztfewjfyyoortvv.supabase.co";
const API_BASE = import.meta.env.VITE_API_BASE || "https://xr7wsfym5k.execute-api.me-south-1.amazonaws.com";
const SESSION_KEY = "fll_session";
const USER_KEY = "fll_user";

export type UserRole = "admin" | "owner" | "staff" | "courier";

export interface StaffPermissions {
  couriers: boolean;
  orders: boolean;
  finance: boolean;
  complaints: boolean;
  excel: boolean;
  reports: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  department_id?: string;
  department_name?: string;
  permissions?: StaffPermissions;
  is_active?: boolean;
  cognito_groups?: string[];
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithOtp: (email: string) => Promise<{ error?: string }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ error?: string; redirectUrl?: string }>;
  signOut: () => Promise<void>;
  hasPermission: (key: keyof StaffPermissions) => boolean;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function mapRole(role: string): UserRole {
  if (["admin", "super_admin"].includes(role)) return "admin";
  if (role === "owner") return "owner";
  if (["driver", "courier"].includes(role)) return "courier";
  return "staff";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const sessionStr = localStorage.getItem(SESSION_KEY);
      const userStr = localStorage.getItem(USER_KEY);
      if (sessionStr && userStr) {
        const session = JSON.parse(sessionStr);
        if (new Date(session.expires_at) > new Date()) {
          const u = JSON.parse(userStr);
          setUser({
            id: u.id,
            email: u.email,
            full_name: u.name || u.full_name || u.email,
            role: mapRole(u.role),
          });
        } else {
          localStorage.removeItem(SESSION_KEY);
          localStorage.removeItem(USER_KEY);
        }
      }
    } catch {
      setUser(null);
    }
    setLoading(false);
  }

  function hasPermission(key: keyof StaffPermissions): boolean {
    if (!user) return false;
    if (user.role === "admin" || user.role === "owner") return true;
    return user.permissions?.[key] === true;
  }

  async function getToken(): Promise<string | null> {
    try {
      const sessionStr = localStorage.getItem(SESSION_KEY);
      if (!sessionStr) return null;
      const session = JSON.parse(sessionStr);
      if (new Date(session.expires_at) < new Date()) return null;
      return session.token;
    } catch {
      return null;
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/login-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: "admin" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { error: data.error || "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify(data.session));
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser({
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.name || data.user.email,
        role: mapRole(data.user.role),
      });
      return {};
    } catch {
      return { error: "تعذّر الاتصال بالخادم. تأكد من اتصالك بالإنترنت." };
    }
  }

  async function signInWithOtp(email: string) {
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.message || "تعذّر إرسال رمز التحقق" };
      return {};
    } catch {
      return { error: "تعذّر إرسال رمز التحقق. تأكد من أن الاتصال يعمل بشكل صحيح." };
    }
  }

  async function verifyEmailOtp(email: string, token: string) {
    try {
      const res = await fetch(`${API_BASE}/auth/verify-custom-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: token }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        return { error: data.message || "رمز التحقق غير صحيح أو منتهي الصلاحية" };
      }
      return { redirectUrl: window.location.origin + "/admin-panel/dashboard" };
    } catch {
      return { error: "رمز التحقق غير صحيح أو منتهي الصلاحية" };
    }
  }

  async function handleSignOut() {
    try { cognitoSignOut(); } catch { /* ignore */ }
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signInWithOtp,
        verifyEmailOtp,
        signOut: handleSignOut,
        hasPermission,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
