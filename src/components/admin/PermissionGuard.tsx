/**
 * PermissionGuard — wraps a route and checks if the current user has the
 * required permission. Redirects to /admin-panel/dashboard if not.
 */
import { Navigate } from "react-router-dom";
import { useAuth, type StaffPermissions } from "@/lib/admin/auth";
import { type ReactNode } from "react";

interface Props {
  permission: keyof StaffPermissions;
  children: ReactNode;
}

export function PermissionGuard({ permission, children }: Props) {
  const { hasPermission, loading } = useAuth();

  if (loading) return null;
  if (!hasPermission(permission)) {
    return <Navigate to="/admin-panel/dashboard" replace />;
  }

  return <>{children}</>;
}
