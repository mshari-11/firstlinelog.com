/**
 * نظام المصادقة للوحة الإدارة
 * يدعم Supabase auth + Cognito localStorage session (fll_token / fll_user)
 * OTP temporarily disabled — will be re-enabled later
 */
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

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

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  // OTP temporarily disabled — will be re-enabled later
  // signInWithOtp: (email: string) => Promise<{ error?: string }>;
  // verifyEmailOtp: (email: string, token: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  hasPermission: (key: keyof StaffPermissions) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Map Cognito group names to internal UserRole */
function cognitoGroupToRole(groups: string[]): UserRole {
  if (groups.includes("SystemAdmin") || groups.includes("admin")) return "admin";
  if (groups.includes("owner") || groups.includes("executive")) return "owner";
  if (groups.includes("driver")) return "courier";
  return "staff";
}

/** Try to restore a session from Cognito localStorage tokens (fll_token + fll_user) */
function getCognitoLocalSession(): AdminUser | null {
  try {
    const token = localStorage.getItem("fll_token");
    const raw = localStorage.getItem("fll_user");
    if (!token || !raw) return null;
    const data = JSON.parse(raw);
    if (!data) return null;
    const groups: string[] = data.groups || [];
    const role = cognitoGroupToRole(groups);
    return {
      id: data.username || data.email || "cognito-user",
      email: data.email || data.username || "",
      role,
      full_name: data.name || data.email || "",
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Try Supabase session first
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          // 2. Fallback: check Cognito localStorage session
          const cognitoUser = getCognitoLocalSession();
          if (cognitoUser) {
            setUser(cognitoUser);
          }
          setLoading(false);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) fetchUserProfile(session.user.id);
        else {
          // Check Cognito fallback on Supabase sign-out too
          const cognitoUser = getCognitoLocalSession();
          setUser(cognitoUser);
          setLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    }

    // No Supabase configured — use Cognito only
    const cognitoUser = getCognitoLocalSession();
    if (cognitoUser) setUser(cognitoUser);
    setLoading(false);
  }, []);

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

  async function signIn(email: string, password: string) {
    if (!supabase) return { error: "Supabase غير متصل" };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
    return {};
  }

  // OTP temporarily disabled — will be re-enabled later
  // async function signInWithOtp(email: string) {
  //   if (!supabase) return { error: "Supabase غير متصل" };
  //   const { error } = await supabase.auth.signInWithOtp({
  //     email,
  //     options: { shouldCreateUser: false },
  //   });
  //   if (error) return { error: "تعذّر إرسال رمز التحقق. تأكد من أن البريد مسجّل في النظام." };
  //   return {};
  // }

  // OTP temporarily disabled — will be re-enabled later
  // async function verifyEmailOtp(email: string, token: string) {
  //   if (!supabase) return { error: "Supabase غير متصل" };
  //   const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  //   if (error) return { error: "رمز التحقق غير صحيح أو منتهي الصلاحية" };
  //   return {};
  // }

  async function signOut() {
    // Clear Cognito localStorage session
    try {
      localStorage.removeItem("fll_token");
      localStorage.removeItem("fll_user");
    } catch {}
    // Clear Supabase session
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
