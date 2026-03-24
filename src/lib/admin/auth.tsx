/**
 * نظام المصادقة للوحة الإدارة
 */
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

import { AUTH_API_BASE } from "@/lib/api";
const ADMIN_REDIRECT_URL = window.location.origin + "/admin-panel/dashboard";

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
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithOtp: (email: string) => Promise<{ error?: string }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ error?: string; redirectUrl?: string }>;
  signOut: () => Promise<void>;
  hasPermission: (key: keyof StaffPermissions) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchUserProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) fetchUserProfile(session.user.id);
      else { setUser(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserProfile(userId: string) {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("users")
      .select("id, email, role, full_name, department_id")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Failed to fetch user profile:", error.message);
      setUser(null);
      setLoading(false);
      return;
    }

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
          .select("permissions, is_active, departments(name, name_ar)")
          .eq("user_id", userId)
          .single();

        if (profile) {
          baseUser.permissions = profile.permissions as StaffPermissions;
          baseUser.is_active = profile.is_active;
          baseUser.department_name = (profile as any).departments?.name || (profile as any).departments?.name_ar;
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

  async function signInWithOtp(email: string) {
    try {
      const res = await fetch(`${AUTH_API_BASE}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { error: data.message || "تعذّر إرسال رمز التحقق" };
      return {};
    } catch {
      return { error: "تعذّر إرسال رمز التحقق. تأكد من أن البريد مسجّل في النظام." };
    }
  }

  async function verifyEmailOtp(email: string, token: string) {
    if (!supabase) return { error: "Supabase غير متصل" };
    try {
      const verifyRes = await fetch(`${AUTH_API_BASE}/verify-custom-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: token }),
      });
      const verifyData = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok) return { error: verifyData.message || "رمز التحقق غير صحيح أو منتهي الصلاحية" };

      const tokenHash = verifyData.token_hash;
      const type = verifyData.type || "magiclink";
      if (!tokenHash) return { error: "تم التحقق لكن تعذر إنشاء جلسة الدخول" };

      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });
      if (error) return { error: "تم التحقق لكن تعذر تسجيل الدخول" };
      return { redirectUrl: ADMIN_REDIRECT_URL };
    } catch {
      return { error: "رمز التحقق غير صحيح أو منتهي الصلاحية" };
    }
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInWithOtp, verifyEmailOtp, signOut, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
