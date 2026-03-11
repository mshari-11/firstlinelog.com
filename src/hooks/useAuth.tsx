/**
 * Public auth provider stub — the public site uses Cognito via static JS.
 * This stub exists so App.tsx can wrap public routes without breaking the build.
 */
import { createContext, useContext, type ReactNode } from "react";

const AuthContext = createContext<null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
