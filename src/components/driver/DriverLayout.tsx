/**
 * Driver portal layout — stub.
 */
import { Outlet } from "react-router-dom";

export function DriverLayout() {
  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#0b1622" }}>
      <Outlet />
    </div>
  );
}
