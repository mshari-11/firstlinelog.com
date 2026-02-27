/**
 * مكوّن حماية الصفحات بالصلاحيات
 * - يعيد التوجيه للـ login إذا لم يكن المستخدم مسجلاً
 * - يعرض رسالة الرفض إذا لم تكن لديه الصلاحية
 */
import { Navigate } from "react-router-dom";
import { ShieldOff } from "lucide-react";
import { useAuth, StaffPermissions } from "@/lib/admin/auth";

interface PermissionGuardProps {
  permission: keyof StaffPermissions;
  children: React.ReactNode;
}

export function PermissionGuard({ permission, children }: PermissionGuardProps) {
  const { user, loading } = useAuth();

  // انتظر تحميل بيانات المستخدم
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ✅ إذا لم يكن المستخدم مسجلاً → أعد التوجيه لصفحة الدخول
  if (!user) {
    return <Navigate to="/unified-login?role=admin" replace />;
  }

  // ✅ إذا لم تكن لديه الصلاحية → أظهر رسالة الرفض
  if (!hasPermission(user, permission)) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center"
        dir="rtl"
      >
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
          <ShieldOff className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white">ليس لديك صلاحية</h2>
        <p className="text-gray-400 max-w-sm">
          لا تملك إذناً للوصول إلى هذه الصفحة.
          <br />
          تواصل مع المدير لطلب الصلاحية.
        </p>
        <a href="/admin/dashboard" className="mt-2 text-sm text-cyan-400 underline">العودة للرئيسية</a>a></a>
      </div>
    );
  }

  return <>{children}</>;
}

// دالة مساعدة للتحقق من الصلاحيات
function hasPermission(
  user: NonNullable<ReturnType<typeof useAuth>["user"]>,
  permission: keyof StaffPermissions
): boolean {
  if (user.role === "admin" || user.role === "owner") return true;
  return user.permissions?.[permission] === true;
}
