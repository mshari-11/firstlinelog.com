/**
 * نظام المصادقة للوحة الإدارة
 * يدعم تسجيل الدخول عبر AWS Cognito (يوزرنيم + باسوورد + OTP)
 * مع Supabase كمصدر بيانات للبروفايل
 */
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

const API_BASE = import.meta.env.VITE_API_BASE || "https://xr7wsfym5k.execute-api.me-south-1.amazonaws.com";

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
  permissions?: StaffPermissions;
  is_active?: boolean;
}

export interface CognitoLoginResult {
  error?: string;
  challenge?: "EMAIL_OTP" | "SMS_MFA" | "NEW_PASSWORD_REQUIRED";
  session?: string;
  message?: string;
  token?: string;
  idToken?: string;
  refreshToken?: string;
  user?: {
    email: string;
    name: string;
    groups: string[];
    sub: string;
  };
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  /** Legacy Supabase sign in */
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithOtp: (email: string) => Promise<{ error?: string }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ error?: string }>;
  /** AWS Cognito: username + password → may return OTP challenge */
  cognitoLogin: (username: string, password: string) => Promise<CognitoLoginResult>;
  /** AWS Cognito: respond to MFA/OTP challenge */
  cognitoVerifyOtp: (username: string, code: string, session: string, challenge?: string) => Promise<CognitoLoginResult>;
  /** AWS Cognito: get current user info */
  cognitoGetMe: () => Promise<{ user?: CognitoLoginResult["user"]; error?: string }>;
  signOut: () => Promise<void>;
  hasPermission: (key: keyof StaffPermissions) => boolean;
}

const TOKEN_KEY = "fll_access_token";
const ID_TOKEN_KEY = "fll_id_token";
const REFRESH_TOKEN_KEY = "fll_refresh_token";
const USER_KEY = "fll_cognito_user";

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: check for existing Cognito session or Supabase session
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken && storedUser) {
      // Restore from Cognito tokens
      try {
        const parsed = JSON.parse(storedUser);
        const role = mapGroupsToRole(parsed.groups || []);
        setUser({
          id: parsed.sub || parsed.email,
          email: parsed.email,
          role,
          full_name: parsed.name || parsed.email,
        });
        // Optionally fetch fresh profile from Supabase
        if (supabase) {
          fetchUserProfileByEmail(parsed.email).finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setLoading(false);
      }
      return;
    }

    // Fallback: check Supabase session
    if (!supabase) { setLoading(false); return; }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchUserProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) fetchUserProfile(session.user.id);
      else if (!localStorage.getItem(TOKEN_KEY)) { setUser(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  function mapGroupsToRole(groups: string[]): UserRole {
    if (groups.includes("admin") || groups.includes("super_admin")) return "admin";
    if (groups.includes("owner")) return "owner";
    if (groups.includes("courier") || groups.includes("driver")) return "courier";
    return "staff";
  }

  async function fetchUserProfileByEmail(email: string) {
    if (!supabase) return;
    const { data } = await supabase
      .from("users")
      .select("id, email, role, full_name, department_id")
      .eq("email", email)
      .single();

    if (data) {
      const baseUser: AdminUser = {
        id: data.id,
        email: data.email,
        role: data.role as UserRole,
        full_name: data.full_name,
        department_id: data.department_id,
      };

      if (data.role === "staff") {
        const { data: profile } = await supabase
          .from("staff_profiles")
          .select("permissions, is_active")
          .eq("user_id", data.id)
          .single();
        if (profile) {
          baseUser.permissions = profile.permissions as StaffPermissions;
          baseUser.is_active = profile.is_active;
        }
      }
      setUser(baseUser);
    }
  }

  async function fetchUserProfile(userId: string) {
    if (!supabase) return;

    const { data } = await supabase
      .from("users")
      .select("id, email, role, full_name, department_id")
      .eq("id", userId)
      .single();

    if (data) {
      const baseUser: AdminUser = {
        id: data.id,
        email: data.email,
        role: data.role as UserRole,
        full_name: data.full_name,
        department_id: data.department_id,
      };

      if (data.role === "staff") {
        const { data: profile } = await supabase
          .from("staff_profiles")
          .select("permissions, is_active")
          .eq("user_id", userId)
          .single();

        if (profile) {
          baseUser.permissions = profile.permissions as StaffPermissions;
          baseUser.is_active = profile.is_active;
        }
      }

      setUser(baseUser);
    }

    setLoading(false);
  }

  function hasPermission(key: keyof StaffPermissions): boolean {
    if (!user) return false;
    if (user.role === "admin" || user.role === "owner") return true;
    return user.permissions?.[key] === true;
  }

  // ── AWS Cognito: Login with username + password ──
  async function cognitoLogin(username: string, password: string): Promise<CognitoLoginResult> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { error: data.message || "خطأ في تسجيل الدخول" };
      }

      // If MFA challenge returned
      if (data.challenge) {
        return {
          challenge: data.challenge,
          session: data.session,
          message: data.message,
        };
      }

      // Direct success (no MFA)
      if (data.token) {
        storeCognitoTokens(data);
        const role = mapGroupsToRole(data.user?.groups || []);
        setUser({
          id: data.user?.sub || username,
          email: data.user?.email || username,
          role,
          full_name: data.user?.name || username,
        });
        if (supabase && data.user?.email) {
          fetchUserProfileByEmail(data.user.email);
        }
      }

      return data;
    } catch (err) {
      return { error: "تعذّر الاتصال بالخادم" };
    }
  }

  // ── AWS Cognito: Verify OTP ──
  async function cognitoVerifyOtp(
    username: string, code: string, session: string, challenge = "EMAIL_OTP"
  ): Promise<CognitoLoginResult> {
    try {
      const res = await fetch(`${API_BASE}/auth/respond-mfa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, code, session, challenge }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { error: data.message || "رمز التحقق غير صحيح" };
      }

      if (data.token) {
        storeCognitoTokens(data);
        const role = mapGroupsToRole(data.user?.groups || []);
        setUser({
          id: data.user?.sub || username,
          email: data.user?.email || username,
          role,
          full_name: data.user?.name || username,
        });
        if (supabase && data.user?.email) {
          fetchUserProfileByEmail(data.user.email);
        }
      }

      return data;
    } catch (err) {
      return { error: "تعذّر الاتصال بالخادم" };
    }
  }

  // ── AWS Cognito: Get current user info ──
  async function cognitoGetMe() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return { error: "غير مسجّل الدخول" };
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return { error: data.message };
      return data;
    } catch {
      return { error: "تعذّر الاتصال بالخادم" };
    }
  }

  function storeCognitoTokens(data: CognitoLoginResult) {
    if (data.token) localStorage.setItem(TOKEN_KEY, data.token);
    if (data.idToken) localStorage.setItem(ID_TOKEN_KEY, data.idToken);
    if (data.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    if (data.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  // ── Legacy Supabase methods (kept for backward compatibility) ──
  async function signIn(email: string, password: string) {
    if (!supabase) return { error: "Supabase غير متصل" };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
    return {};
  }

  async function signInWithOtp(email: string) {
    if (!supabase) return { error: "Supabase غير متصل" };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) return { error: "تعذّر إرسال رمز التحقق. تأكد من أن البريد مسجّل في النظام." };
    return {};
  }

  async function verifyEmailOtp(email: string, token: string) {
    if (!supabase) return { error: "Supabase غير متصل" };
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    if (error) return { error: "رمز التحقق غير صحيح أو منتهي الصلاحية" };
    return {};
  }

  async function signOut() {
    // Clear Cognito tokens
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ID_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Clear Supabase session
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{
      user, loading,
      signIn, signInWithOtp, verifyEmailOtp,
      cognitoLogin, cognitoVerifyOtp, cognitoGetMe,
      signOut, hasPermission,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
