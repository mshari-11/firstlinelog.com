/**
 * مكوّن حماية الصفحات بالصلاحيات
 * يعرض الصفحة إذا كان المستخدم يملك الصلاحية، وإلا يعرض رسالة الرفض
 */
import { ShieldOff } from "lucide-react";
import { useAuth, StaffPermissions } from "@/lib/admin/auth";

interface PermissionGuardProps {
  permission: keyof StaffPermissions;
  children: React.ReactNode;
}

export function PermissionGuard({ permission, children }: PermissionGuardProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center" dir="rtl">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
          <ShieldOff className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white">ليس لديك صلاحية</h2>
        <p className="text-gray-400 max-w-sm">
          لا تملك إذناً للوصول إلى هذه الصفحة. تواصل مع المدير لطلب الصلاحية.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
