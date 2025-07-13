// UI 관련 유틸리티 함수들
export type AlertType = "info" | "success" | "warning" | "error";

export const uiUtils = {
  // 통합 알림 함수
  showAlert(message: string, type: AlertType = "info", toast?: any): void {
    if (toast) {
      const variants = {
        info: "default",
        success: "default",
        warning: "default",
        error: "destructive",
      };

      toast({
        title: type === "error" ? "오류" : type === "success" ? "성공" : "알림",
        description: message,
        variant: variants[type],
      });
    } else {
      // 폴백: 브라우저 기본 alert
      alert(`[${type.toUpperCase()}] ${message}`);
    }
  },

  // 확인 대화상자
  showConfirm(message: string): boolean {
    return confirm(message);
  },

  // 로딩 상태 관리
  setLoadingState(element: HTMLElement, isLoading: boolean): void {
    if (isLoading) {
      element.classList.add("opacity-50", "pointer-events-none");
    } else {
      element.classList.remove("opacity-50", "pointer-events-none");
    }
  },

  // 폼 검증 오류 표시
  showFormErrors(errors: Record<string, any>): string[] {
    const errorMessages: string[] = [];
    Object.keys(errors).forEach(field => {
      if (errors[field]?.message) {
        errorMessages.push(`${field}: ${errors[field].message}`);
      }
    });
    return errorMessages;
  },
};
