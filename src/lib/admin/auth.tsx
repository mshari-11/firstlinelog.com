/**
 * نظام المصادقة للوحة الإدارة
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

    const { data } = await supabase
      .from("users_2026_02_17_21_00")
      .select("id, email, role, name, department_id")
      .eq("id", userId)
      .single();

    if (data) {
      const baseUser: AdminUser = {
        id: data.id,
        email: data.email,
        role: data.role as UserRole,
        full_name: data.name,
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

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
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
