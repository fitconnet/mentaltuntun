// 인증 관련 유틸리티 함수들
export interface AuthSession {
  user: any;
  isAuthenticated: boolean;
  isAdmin: boolean;
  role?: string;
}

export const authUtils = {
  // 세션 정보 저장
  setSession(session: AuthSession): void {
    localStorage.setItem("authSession", JSON.stringify(session));
  },

  // 세션 정보 가져오기
  getSession(): AuthSession | null {
    try {
      const session = localStorage.getItem("authSession");
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error("세션 정보 파싱 오류:", error);
      return null;
    }
  },

  // 세션 정리
  clearSession(): void {
    localStorage.removeItem("authSession");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("admin");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("user");
    localStorage.removeItem("uid");
  },

  // 관리자 권한 확인
  isMainAdmin(adminId?: string): boolean {
    return adminId === "admin7447";
  },

  // 인증 상태 확인
  async checkAuthStatus(): Promise<AuthSession | null> {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const session: AuthSession = {
          user: data,
          isAuthenticated: true,
          isAdmin: data.isAdmin || false,
          role: data.isAdmin ? "admin" : "user",
        };
        this.setSession(session);
        return session;
      }

      return null;
    } catch (error) {
      console.error("인증 상태 확인 오류:", error);
      return null;
    }
  },
};
