/**
 * نظام التوثيق المركزي - Supabase Edge Functions
 * Authentication via Supabase login-password edge function
 */
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { cognitoSignIn, cognitoSignOut, getCognitoGroups, cognitoForgotPassword, cognitoConfirmPassword } from "@/lib/cognito";
import { sendOtp as sendLambdaOtp, verifyOtp as verifyLambdaOtp } from "@/lib/otp-service";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://djebhztfewjfyyoortvv.supabase.co";
const API_BASE = import.meta.env.VITE_API_BASE || "https://qihrv9osed.execute-api.me-south-1.amazonaws.com/prod";
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
      const result = await cognitoSignIn(email, password);
      if (result.error) {
        return { error: result.error.includes("Incorrect") ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : result.error };
      }
      if (!result.session) {
        return { error: "تعذّر إنشاء جلسة" };
      }
      const groups = getCognitoGroups(result.session);
      const payload = result.session.getIdToken().decodePayload();
      const userEmail = (payload["email"] as string) || email;
      const userName = (payload["name"] as string) || userEmail;
      const userSub = (payload["sub"] as string) || "";
      const role = groups.includes("admin") || groups.includes("SystemAdmin") ? "admin" : groups.includes("staff") ? "staff" : "staff";

      const sessionData = {
        token: result.session.getAccessToken().getJwtToken(),
        expires_at: new Date(result.session.getAccessToken().getExpiration() * 1000).toISOString(),
      };
      const userData = { id: userSub, email: userEmail, name: userName, role };

      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      setUser({ id: userSub, email: userEmail, full_name: userName, role: mapRole(role), cognito_groups: groups });
      return {};
    } catch {
      return { error: "تعذّر الاتصال بالخادم. تأكد من اتصالك بالإنترنت." };
    }
  }

  async function signInWithOtp(email: string) {
    try {
      const result = await cognitoForgotPassword(email);
      if (result.error) return { error: result.error };
      return {};
    } catch {
      return { error: "تعذّر إرسال رمز التحقق." };
    }
  }

  async function verifyEmailOtp(email: string, token: string) {
    try {
      const result = await verifyLambdaOtp(email, token, "login");
      if (result.error) {
        return { error: result.error === "Failed to verify OTP" ? "رمز التحقق غير صحيح أو منتهي الصلاحية" : result.error };
      }
      return { redirectUrl: "/admin-panel/dashboard" };
    } catch {
      return { error: "تعذّر التحقق من الرمز. حاول مرة أخرى." };
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
