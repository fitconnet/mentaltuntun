import { useState, useEffect } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { monitorAuthState, getCurrentUserUID } from "@/lib/firebase";

export interface AuthUser {
  uid: string;
  email: string | null;
  name: string;
  isAuthenticated: boolean;
}

export const useAuthState = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Firebase Auth 상태 모니터링 시작
    const unsubscribe = monitorAuthState(
      (firebaseUser: FirebaseUser | null) => {
        try {
          if (firebaseUser) {
            const authUser: AuthUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name:
                firebaseUser.displayName ||
                firebaseUser.email?.split("@")[0] ||
                "사용자",
              isAuthenticated: true,
            };
            setUser(authUser);
            setError(null);
          } else {
            setUser(null);
          }
        } catch (err) {
          console.error("Auth state 처리 오류:", err);
          setError("인증 상태 처리 중 오류가 발생했습니다.");
          setUser(null);
        } finally {
          setLoading(false);
        }
      }
    );

    // 초기 localStorage 확인 (빠른 UI 반응)
    const storedUid = localStorage.getItem("uid");
    const storedUser = localStorage.getItem("user");

    if (storedUid && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({
          ...parsedUser,
          isAuthenticated: true,
        });
      } catch (err) {
        console.warn("저장된 사용자 정보 파싱 실패:", err);
        localStorage.removeItem("uid");
        localStorage.removeItem("user");
      }
    }

    return () => unsubscribe();
  }, []);

  // 사용자 인증 여부 확인
  const isAuthenticated = !!user?.isAuthenticated;

  // 현재 UID 확인
  const uid = user?.uid || getCurrentUserUID();

  return {
    user,
    loading,
    error,
    isAuthenticated,
    uid,
  };
};
