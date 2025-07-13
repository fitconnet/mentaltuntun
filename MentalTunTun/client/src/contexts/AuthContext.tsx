import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authUtils, AuthSession } from "@/utils/auth";

interface AuthContextType {
  session: AuthSession | null;
  isLoading: boolean;
  login: (session: AuthSession) => void;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = (newSession: AuthSession) => {
    setSession(newSession);
    authUtils.setSession(newSession);
  };

  const logout = () => {
    setSession(null);
    authUtils.clearSession();
  };

  const refreshAuth = async () => {
    setIsLoading(true);
    try {
      const authSession = await authUtils.checkAuthStatus();
      setSession(authSession);
    } catch (error) {
      console.error("인증 새로고침 실패:", error);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 초기 로드 시 세션 확인
    const storedSession = authUtils.getSession();
    if (storedSession) {
      setSession(storedSession);
    }

    // 서버에서 인증 상태 확인
    refreshAuth();
  }, []);

  const value: AuthContextType = {
    session,
    isLoading,
    login,
    logout,
    refreshAuth,
    isAuthenticated: !!session?.isAuthenticated,
    isAdmin: !!session?.isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
