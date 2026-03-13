/**
 * New Admin Dashboard layout — stub.
 * This is the "new dashboard" layout (separate from the admin-panel).
 */
import { Outlet } from "react-router-dom";

export function AdminLayout() {
  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#0b1622" }}>
      <Outlet />
    </div>
  );
}
