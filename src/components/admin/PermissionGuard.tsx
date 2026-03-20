/**
 * PermissionGuard — wraps a route and checks if the current user has the
 * required permission. Redirects to /admin-panel/dashboard if not.
 */
import { useAuth, StaffPermissions } from "@/lib/admin/auth";
import { Navigate } from "react-router-dom";
import { ReactNode } from "react";

interface Props {
  permission: keyof StaffPermissions;
  children: ReactNode;
}

export function PermissionGuard({ permission, children }: Props) {
  const { hasPermission, loading, user } = useAuth();

  if (loading) return null;
  if (user?.role === "staff" && user.is_active === false) {
    return <Navigate to="/admin/login" replace />;
  }
  if (!hasPermission(permission)) {
    return <Navigate to="/admin-panel/dashboard" replace />;
  }

  return <>{children}</>;
}

interface RoleProps {
  roles?: Array<"admin" | "owner" | "staff" | "courier">;
  departments?: string[];
  children: ReactNode;
}

export function AccessGuard({ roles, departments, children }: RoleProps) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role === "staff" && user.is_active === false) return <Navigate to="/admin/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/admin-panel/dashboard" replace />;
  if (departments && user.role === "staff") {
    const dept = user.department_name || "";
    if (!departments.includes(dept)) return <Navigate to="/admin-panel/dashboard" replace />;
  }
  return <>{children}</>;
}
