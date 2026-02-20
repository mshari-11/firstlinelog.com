/**
 * سياق المصادقة (Auth Context) لإدارة حالة تسجيل الدخول
 * FirstLine Logistics
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  phone: string;
  name: string | null;
  role: string;
}

interface Session {
  token: string;
  expires_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, session: Session) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'fll_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // تحميل الجلسة من localStorage عند بدء التطبيق
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // التحقق من صلاحية الجلسة
        if (parsed.session && new Date(parsed.session.expires_at) > new Date()) {
          setUser(parsed.user);
          setSession(parsed.session);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User, sessionData: Session) => {
    setUser(userData);
    setSession(sessionData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: userData, session: sessionData }));
  };

  const logout = () => {
    setUser(null);
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user && !!session,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
