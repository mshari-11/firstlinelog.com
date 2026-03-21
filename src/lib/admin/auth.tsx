/**
 * نظام التوثيق المركزي - AWS Cognito
 * Authentication via AWS Cognito User Pool
 */
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  cognitoSignIn,
  getCognitoSession,
  getCognitoGroups,
  cognitoSignOut,
  getAccessToken,
} from "@/lib/cognito";
import { AUTH_API_BASE, API_BASE } from "@/lib/api";

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

/**
 * Determine user role from Cognito groups
 */
function roleFromGroups(groups: string[]): UserRole {
  if (groups.includes("SystemAdmin") || groups.includes("admin")) return "admin";
  if (groups.includes("owner")) return "owner";
  if (groups.includes("courier") || groups.includes("driver")) return "courier";
  return "staff";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check existing Cognito session on mount
  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const session = await getCognitoSession();
      if (session && session.isValid()) {
        const groups = getCognitoGroups(session);
        const payload = session.getIdToken().decodePayload();
        const email = (payload.email as string) || "";
        const name = (payload.name as string) || email.split("@")[0];
        const sub = (payload.sub as string) || "";

        const adminUser: AdminUser = {
          id: sub,
          email: email,
          role: roleFromGroups(groups),
          full_name: name,
          cognito_groups: groups,
        };

        // Try to fetch extended profile from API
        try {
          const token = getAccessToken(session);
          const res = await fetch(API_BASE + "/auth/profile", {
            headers: { Authorization: "Bearer " + token },
          });
          if (res.ok) {
            const profile = await res.json();
            if (profile.full_name) adminUser.full_name = profile.full_name;
            if (profile.department_id) adminUser.department_id = profile.department_id;
            if (profile.department_name) adminUser.department_name = profile.department_name;
            if (profile.permissions) adminUser.permissions = profile.permissions;
            if (profile.is_active !== undefined) adminUser.is_active = profile.is_active;
          }
        } catch {
          // Profile API not available, use Cognito data only
        }

        setUser(adminUser);
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
      const session = await getCognitoSession();
      if (session && session.isValid()) {
        return getAccessToken(session);
      }
      return null;
    } catch {
      return null;
    }
  }

  async function signIn(email: string, password: string) {
    const result = await cognitoSignIn(email, password);
    if (result.error) {
      return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
    }
    // Session established, refresh user state
    await checkSession();
    return {};
  }

  async function signInWithOtp(email: string) {
    try {
      const res = await fetch(AUTH_API_BASE + "/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { error: data.message || "تعذّر إرسال رمز التحقق" };
      return {};
    } catch {
      return { error: "تعذّر إرسال رمز التحقق. تأكد من أن الاتصال يعمل بشكل صحيح." };
    }
  }

  async function verifyEmailOtp(email: string, token: string) {
    try {
      const verifyRes = await fetch(AUTH_API_BASE + "/verify-custom-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: token }),
      });
      const verifyData = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok) {
        return { error: verifyData.message || "رمز التحقق غير صحيح أو منتهي الصلاحية" };
      }

      // OTP verified - refresh session
      await checkSession();
      return { redirectUrl: ADMIN_REDIRECT_URL };
    } catch {
      return { error: "رمز التحقق غير صحيح أو منتهي الصلاحية" };
    }
  }

  async function handleSignOut() {
    cognitoSignOut();
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
