// 세션 관리 유틸리티
export interface SessionManager {
  adminId?: string;
  userId?: number;
  isAuthenticated: boolean;
  timestamp?: number;
}

export const sessionUtils = {
  // 관리자 세션 설정
  async setAdminSession(adminId: string): Promise<boolean> {
    try {
      const response = await fetch("/api/admin/set-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ adminId }),
      });

      if (response.ok) {
        return true;
      }
      throw new Error("세션 설정 실패");
    } catch (error) {
      console.error("관리자 세션 설정 오류:", error);
      return false;
    }
  },

  // 세션 만료 시간 확인 (24시간)
  isSessionValid(timestamp?: number): boolean {
    if (!timestamp) return false;
    const now = Date.now();
    const sessionAge = now - timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24시간
    return sessionAge < maxAge;
  },

  // 세션 강제 저장
  async saveSession(): Promise<boolean> {
    try {
      const response = await fetch("/api/admin/save-session", {
        method: "POST",
        credentials: "include",
      });
      return response.ok;
    } catch (error) {
      console.error("세션 저장 오류:", error);
      return false;
    }
  },
};
