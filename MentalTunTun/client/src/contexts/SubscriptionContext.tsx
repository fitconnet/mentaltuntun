import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type SubscriptionPlan = "free" | "premium";

interface UsageStats {
  counselingSessions: number;
  selfDiscoverySessions: number;
  lastResetDate: string;
  // 세션 생성 횟수 추적 (리스트 생성)
  sessionCreations: number;
  // 자아탐색 전체 사용 여부 (하나의 주제만 선택 가능)
  selfDiscoveryUsed: boolean;
}

interface SubscriptionContextType {
  plan: SubscriptionPlan;
  setPlan: (plan: SubscriptionPlan) => void;
  isPremium: boolean;
  isFree: boolean;
  isAdmin: boolean;
  usageStats: UsageStats;
  // 상담 세션 생성 (리스트 생성) 체크
  canCreateCounselingSession: () => boolean;
  incrementSessionCreation: () => boolean;
  // 자아탐색 전체 사용 체크
  canUseSelfDiscovery: boolean;
  markSelfDiscoveryUsed: () => void;
  // 유료 플랜: 7개 세션 관리 가이드
  checkSessionLimit: (currentSessions: number) => {
    canCreate: boolean;
    message?: string;
  };
  resetUsage: () => void;
  // 기존 호환성
  incrementCounselingUsage: () => boolean;
  incrementSelfDiscoveryUsage: () => boolean;
  canUseCounseling: boolean;
  checkCounselingUsageOnCompletion: (completedSessionsCount: number) => boolean;
  checkSelfDiscoveryUsageOnCompletion: (
    completedSessionsCount: number
  ) => boolean;
  // 관리자 플랜 전환
  toggleAdminPlan: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [plan, setPlan] = useState<SubscriptionPlan>("free"); // 기본값은 무료 플랜
  const [usageStats, setUsageStats] = useState<UsageStats>({
    counselingSessions: 0,
    selfDiscoverySessions: 0,
    lastResetDate: new Date().toDateString(),
    sessionCreations: 0,
    selfDiscoveryUsed: false,
  });

  // 관리자 모드 체크
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const checkAdminStatus = () => {
      const isAdminStored = localStorage.getItem("isAdmin") === "true";
      const adminStored = localStorage.getItem("admin");
      setIsAdmin(isAdminStored && !!adminStored);
    };

    checkAdminStatus();
    window.addEventListener("storage", checkAdminStatus);

    // 초기 확인 후 주기적으로 재확인
    const interval = setInterval(checkAdminStatus, 2000);

    return () => {
      window.removeEventListener("storage", checkAdminStatus);
      clearInterval(interval);
    };
  }, []);

  // 서버에서 실제 사용자 구독 정보 동기화 및 로컬스토리지 로드
  useEffect(() => {
    const syncSubscriptionPlan = async () => {
      try {
        // 관리자 모드인 경우 테스트용 플랜 사용
        if (isAdmin) {
          const adminTestPlan = localStorage.getItem(
            "admin_test_plan"
          ) as SubscriptionPlan;
          if (
            adminTestPlan &&
            (adminTestPlan === "free" || adminTestPlan === "premium")
          ) {
            setPlan(adminTestPlan);
            console.log("관리자 테스트 플랜 로드:", adminTestPlan);
            return;
          } else {
            // 관리자 기본값을 premium으로 설정
            setPlan("premium");
            localStorage.setItem("admin_test_plan", "premium");
            console.log("관리자 기본 premium 플랜 설정");
            return;
          }
        }

        // 서버에서 실제 사용자 정보 가져오기
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          if (data.user && data.user.subscriptionType) {
            const serverPlan = data.user.subscriptionType as SubscriptionPlan;
            if (!isAdmin) {
              setPlan(serverPlan);
              localStorage.setItem("subscription_plan", serverPlan);
              console.log("서버 구독 정보 동기화:", serverPlan);
            } else {
              // 관리자는 서버 플랜을 기본값으로 설정하되 테스트 플랜이 우선
              setPlan(serverPlan);
              localStorage.setItem("admin_test_plan", serverPlan);
              console.log("관리자 기본 플랜 설정:", serverPlan);
            }
          }
        } else {
          // 서버 응답이 없으면 로컬스토리지 사용
          const savedPlan = localStorage.getItem(
            "subscription_plan"
          ) as SubscriptionPlan;
          if (savedPlan && (savedPlan === "free" || savedPlan === "premium")) {
            setPlan(savedPlan);
          }
        }
      } catch (error) {
        console.log("서버 동기화 실패, 로컬스토리지 사용");
        // 서버 연결 실패시 로컬스토리지 사용
        const savedPlan = localStorage.getItem(
          "subscription_plan"
        ) as SubscriptionPlan;
        if (savedPlan && (savedPlan === "free" || savedPlan === "premium")) {
          setPlan(savedPlan);
        }
      }
    };

    syncSubscriptionPlan();

    const savedUsage = localStorage.getItem("usage_stats");
    if (savedUsage) {
      const parsedUsage = JSON.parse(savedUsage);
      const today = new Date().toDateString();

      // 날짜가 바뀌었으면 사용량 초기화
      if (parsedUsage.lastResetDate !== today) {
        const resetUsage = {
          counselingSessions: 0,
          selfDiscoverySessions: 0,
          lastResetDate: today,
          sessionCreations: 0,
          selfDiscoveryUsed: false,
        };
        setUsageStats(resetUsage);
        localStorage.setItem("usage_stats", JSON.stringify(resetUsage));
      } else {
        setUsageStats(parsedUsage);
      }
    }
  }, [isAdmin]); // isAdmin 변경시에도 재동기화

  // 구독 정보 변경 시 로컬스토리지에 저장 및 서버 동기화
  const updatePlan = async (newPlan: SubscriptionPlan) => {
    setPlan(newPlan);
    localStorage.setItem("subscription_plan", newPlan);

    // 관리자 모드일 때만 서버에 플랜 변경 알림 (실제 DB는 변경하지 않음)
    if (isAdmin) {
      console.log("관리자 테스트 모드:", newPlan);
    }
  };

  // 사용량 업데이트 함수
  const updateUsageStats = (newStats: UsageStats) => {
    setUsageStats(newStats);
    localStorage.setItem("usage_stats", JSON.stringify(newStats));
  };

  // AI 상담 사용량 증가 - 플랜에 따른 제한 적용
  const incrementCounselingUsage = (): boolean => {
    if (plan === "premium") return true;

    if (usageStats.counselingSessions >= 2) {
      return false; // 제한 초과
    }

    const newStats = {
      ...usageStats,
      counselingSessions: usageStats.counselingSessions + 1,
    };
    updateUsageStats(newStats);
    return true;
  };

  // 자아탐색 사용량 증가 (기존 호환성) - 플랜에 따른 제한 적용
  const incrementSelfDiscoveryUsage = (): boolean => {
    if (plan === "premium") return true;

    if (usageStats.selfDiscoverySessions >= 1) {
      return false; // 제한 초과
    }

    const newStats = {
      ...usageStats,
      selfDiscoverySessions: usageStats.selfDiscoverySessions + 1,
    };
    updateUsageStats(newStats);
    return true;
  };

  // 새로운 상담 세션 생성 가능 여부 (리스트 생성) - 플랜에 따른 제한 적용
  const canCreateCounselingSession = (): boolean => {
    if (plan === "premium") return true;
    return usageStats.sessionCreations < 2; // 무료 플랜: 2개 세션만 생성 가능
  };

  // 세션 생성 증가 - 플랜에 따른 제한 적용
  const incrementSessionCreation = (): boolean => {
    if (plan === "premium") return true;

    if (usageStats.sessionCreations >= 2) {
      return false; // 제한 초과
    }

    const newStats = {
      ...usageStats,
      sessionCreations: usageStats.sessionCreations + 1,
    };
    updateUsageStats(newStats);
    return true;
  };

  // 자아탐색 전체 사용 가능 여부 - 플랜에 따른 제한 적용
  const canUseSelfDiscovery =
    plan === "premium" || !usageStats.selfDiscoveryUsed;

  // 자아탐색 사용 표시 - 플랜에 따른 제한 적용
  const markSelfDiscoveryUsed = (): void => {
    if (plan === "premium") return; // 유료 플랜은 제한 없음

    const newStats = {
      ...usageStats,
      selfDiscoveryUsed: true,
    };
    updateUsageStats(newStats);
  };

  // 세션 제한 관리 - 진행중인 상담 리스트 개수 기반 - 관리자는 제한 없음
  const checkSessionLimit = (
    activeSessions: number,
    totalSessions?: number
  ): { canCreate: boolean; message?: string } => {
    if (isAdmin) {
      return { canCreate: true }; // 관리자는 제한 없음
    }

    if (plan === "free") {
      // 무료 플랜: 진행중인 상담이 2개 미만이어야 생성 가능
      if (activeSessions >= 2) {
        return { canCreate: false };
      }
      return { canCreate: true };
    }

    // 프리미엄 플랜: 진행중인 상담 리스트만 7개 제한 (총 상담횟수는 무제한)
    if (activeSessions >= 7) {
      return {
        canCreate: false,
        message:
          "진행중인 상담 목록이 7개에 도달했습니다. 기존 상담을 완료하거나 정리한 후 새로운 상담을 시작해주세요.",
      };
    }

    return { canCreate: true };
  };

  // 사용량 초기화
  const resetUsage = () => {
    const resetStats = {
      counselingSessions: 0,
      selfDiscoverySessions: 0,
      lastResetDate: new Date().toDateString(),
      sessionCreations: 0,
      selfDiscoveryUsed: false,
    };
    updateUsageStats(resetStats);
  };

  // 상담 세션 완료 시 사용량 확인 (완료된 세션 수를 직접 체크) - 플랜에 따른 제한 적용
  const checkCounselingUsageOnCompletion = (
    completedSessionsCount: number
  ): boolean => {
    if (plan === "premium") return true;
    return completedSessionsCount < 2; // 2개 이하면 사용 가능
  };

  // 자아탐색 세션 완료 시 사용량 확인 (완료된 세션 수를 직접 체크) - 플랜에 따른 제한 적용
  const checkSelfDiscoveryUsageOnCompletion = (
    completedSessionsCount: number
  ): boolean => {
    if (plan === "premium") return true;
    return completedSessionsCount < 1; // 1개 이하면 사용 가능
  };

  // 관리자 플랜 전환 함수 (테스트용)
  const toggleAdminPlan = (): void => {
    if (!isAdmin) {
      console.log("관리자가 아님, 플랜 전환 불가");
      return;
    }

    const currentPlan = plan;
    const newPlan = currentPlan === "free" ? "premium" : "free";
    console.log("관리자 플랜 전환:", currentPlan, "->", newPlan);

    // 즉시 상태 업데이트
    setPlan(newPlan);
    localStorage.setItem("subscription_plan", newPlan);
    localStorage.setItem("admin_test_plan", newPlan);

    // 강제로 리렌더링을 위해 storage 이벤트 발생
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "admin_test_plan",
        newValue: newPlan,
        oldValue: currentPlan,
      })
    );

    console.log("플랜 전환 완료, 새 플랜:", newPlan);
  };

  const value = {
    plan,
    setPlan: updatePlan,
    isPremium: plan === "premium",
    isFree: plan === "free",
    isAdmin,
    usageStats,
    // 새로운 함수들
    canCreateCounselingSession,
    incrementSessionCreation,
    canUseSelfDiscovery,
    markSelfDiscoveryUsed,
    checkSessionLimit,
    resetUsage,
    // 기존 호환성 함수들
    incrementCounselingUsage,
    incrementSelfDiscoveryUsage,
    canUseCounseling: plan === "premium" || usageStats.counselingSessions < 2,
    checkCounselingUsageOnCompletion,
    checkSelfDiscoveryUsageOnCompletion,
    // 관리자 플랜 전환
    toggleAdminPlan,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return context;
}
