/**
 * سياق المصادقة (Auth Context) لإدارة حالة تسجيل الدخول
 * FirstLine Logistics
 */
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface User {
  id: string;
  phone?: string;
  email?: string;
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
  updateUser: (updates: Partial<User>) => void;
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
          // الجلسة منتهية
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (err) {
      console.error('Auth load error:', err);
      localStorage.removeItem(STORAGE_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((userData: User, sessionData: Session) => {
    setUser(userData);
    setSession(sessionData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      user: userData, 
      session: sessionData 
    }));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
    // يمكن إضافة redirect هنا
    window.location.href = '/';
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      // تحديث localStorage أيضاً
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.user = updated;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user && !!session,
        isLoading,
        login,
        logout,
        updateUser,
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

// Helper hook للتحقق من الدور
export function useRequireAuth(allowedRoles?: string[]) {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const hasAccess = isAuthenticated && (!allowedRoles || allowedRoles.includes(user?.role || ''));
  
  return {
    hasAccess,
    isLoading,
    user,
  };
}
