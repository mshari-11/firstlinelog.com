/**
 * Public site layout wrapper — stub.
 * The public site is served by the static index.html (Skywork bundle).
 * This stub exists so App.tsx routes can reference it without breaking the build.
 */
import { type ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
  return <div dir="rtl">{children}</div>;
}
