// 관리자 세션 관리 모듈 - 쿠키 기반 인증
interface AdminSession {
  adminId: string;
  userId: number;
  timestamp: number;
}

class AdminSessionManager {
  private adminSession: AdminSession | null = null;

  setSession(adminId: string, userId: number): void {
    this.adminSession = {
      adminId,
      userId,
      timestamp: Date.now(),
    };
  }

  isValidSession(adminId?: string): boolean {
    if (!this.adminSession) {
      return false;
    }

    // 24시간 유효성 검사
    const isValid =
      Date.now() - this.adminSession.timestamp < 24 * 60 * 60 * 1000;

    if (!isValid) {
      this.clearSession();
      return false;
    }

    // adminId가 제공된 경우 일치하는지 확인
    if (adminId && this.adminSession.adminId !== adminId) {
      return false;
    }

    return true;
  }

  getSession(): AdminSession | null {
    return this.adminSession;
  }

  clearSession(): void {
    this.adminSession = null;
  }
}

// 전역 인스턴스 생성
export const adminSessionManager = new AdminSessionManager();
