import { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { monitorAuthState, firebaseSignOut } from "@/lib/firebase";

interface AuthUser {
  uid: string;
  email: string | null;
  name: string;
  isAuthenticated: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Firebase 인증 상태 모니터링
        const unsubscribe = monitorAuthState(
          (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
              const authUser: AuthUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name:
                  firebaseUser.displayName ||
                  firebaseUser.email?.split("@")[0] ||
                  "User",
                isAuthenticated: true,
              };

              setUser(authUser);
              setLoading(false);
              setError(null);

              localStorage.setItem("uid", firebaseUser.uid);
              localStorage.setItem("authToken", "firebase-authenticated");
            } else {
              setUser(null);
              setLoading(false);
              setError(null);

              localStorage.removeItem("uid");
              localStorage.removeItem("user");
              localStorage.removeItem("authToken");
            }
          }
        );

        return unsubscribe;
      } catch (error) {
        console.error("인증 초기화 오류:", error);
        setError("인증 초기화에 실패했습니다.");
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const handleSignOut = async () => {
    try {
      // Firebase 로그아웃 (에러 무시)
      try {
        await firebaseSignOut();
      } catch (e) {
        console.log("Firebase 로그아웃 생략");
      }

      setUser(null);
      localStorage.removeItem("uid");
      localStorage.removeItem("user");
    } catch (error) {
      console.error("로그아웃 오류:", error);
      setError("로그아웃 중 오류가 발생했습니다.");
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
