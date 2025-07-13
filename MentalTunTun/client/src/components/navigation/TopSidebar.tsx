import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Menu,
  X,
  Home,
  BarChart3,
  Settings,
  ChevronRight,
  Calendar,
  ClipboardList,
  BookOpen,
  Crown,
  Headphones as HeadphonesIcon,
  Gift,
  LogOut,
  Shield,
  ToggleLeft,
  ToggleRight,
  TestTube,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const getNavigationItems = (isPremium: boolean) => [
  {
    href: "/",
    label: "홈",
    icon: Home,
    description: "메인 대시보드",
    premium: false,
  },
  {
    href: "/personality",
    label: "성격분석",
    icon: BarChart3,
    description: "성향 및 관심사 분석",
    premium: false,
  },
  {
    href: "/schedule",
    label: "스케줄",
    icon: Calendar,
    description: "상담 예약 및 일정 관리",
    premium: true,
  },
  {
    href: "/psychological-tests",
    label: "심리테스트",
    icon: ClipboardList,
    description: "심층 및 재미있는 심리테스트",
    premium: true,
  },
  {
    href: "/content",
    label: "컨텐츠",
    icon: BookOpen,
    description: "심리/건강 정보와 뉴스",
    premium: false,
  },
  {
    href: "/subscription",
    label: "구독",
    icon: Crown,
    description: "프리미엄 서비스 구독",
    premium: false,
  },
  {
    href: "/support",
    label: "고객센터",
    icon: HeadphonesIcon,
    description: "문의 및 고객 지원",
    premium: false,
  },
  {
    href: "/settings",
    label: "설정",
    icon: Settings,
    description: "앱 설정 및 환경설정",
    premium: false,
  },
];

export function TopSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location, navigate] = useLocation();
  const { plan, isPremium, isFree, setPlan, toggleAdminPlan } =
    useSubscription();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [userTestMode, setUserTestMode] = useState(false);
  const [testPlan, setTestPlan] = useState<"free" | "premium">("free");

  const navigationItems = getNavigationItems(isPremium);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  // 관리자 모드 확인
  useEffect(() => {
    const checkAdminStatus = async () => {
      // 먼저 localStorage에서 관리자 상태 확인
      const isAdminStored = localStorage.getItem("isAdmin") === "true";
      const adminStored = localStorage.getItem("admin");

      if (isAdminStored && adminStored) {
        try {
          const adminData = JSON.parse(adminStored);

          setIsAdmin(true);
          setAdminInfo(adminData);
          return; // localStorage 확인 성공시 API 호출 생략
        } catch (error) {
          console.error("localStorage 관리자 정보 파싱 오류:", error);
        }
      }

      // localStorage에 없거나 파싱 실패시 API로 확인
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include", // 세션 쿠키 포함
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          // Content-Type 확인하여 JSON인지 검증
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            console.log("API 인증 상태 응답:", data);

            if (data.isAdmin && data.admin) {
              console.log("API에서 관리자 모드 확인:", data.admin);
              setIsAdmin(true);
              setAdminInfo(data.admin);
              // localStorage에도 저장
              localStorage.setItem("isAdmin", "true");
              localStorage.setItem("admin", JSON.stringify(data.admin));
            } else {
              console.log("일반 사용자 모드");
              setIsAdmin(false);
              setAdminInfo(null);
              // localStorage 정리
              localStorage.removeItem("isAdmin");
              localStorage.removeItem("admin");
            }
          } else {
            console.log("API 응답이 JSON이 아님 - 백엔드 서버 미실행 상태");
            setIsAdmin(false);
            setAdminInfo(null);
          }
        } else {
          console.log("API 인증 실패 또는 백엔드 서버 미실행");
          setIsAdmin(false);
          setAdminInfo(null);
          // localStorage 정리
          localStorage.removeItem("isAdmin");
          localStorage.removeItem("admin");
        }
      } catch (error) {
        console.log("백엔드 서버에 연결할 수 없음 - 프론트엔드 전용 모드:", error.message);
        setIsAdmin(false);
        setAdminInfo(null);
      }
    };

    checkAdminStatus();

    // 10초마다 관리자 상태 재확인 (localStorage 우선)
    const interval = setInterval(checkAdminStatus, 10000);

    // 페이지 포커스 시 관리자 상태 재확인
    const handleFocus = () => {
      checkAdminStatus();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [location]);

  // 관리자 로그아웃
  const handleAdminLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // 세션 쿠키 포함
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setIsAdmin(false);
        setAdminInfo(null);
        // 모든 관리자 관련 localStorage 정리
        localStorage.removeItem("isAdmin");
        localStorage.removeItem("admin");
        localStorage.removeItem("adminUser");
        localStorage.removeItem("adminSessionId");
        localStorage.removeItem("user");
        toast({
          title: "로그아웃 완료",
          description: "관리자 모드에서 로그아웃되었습니다.",
        });
        navigate("/login");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "로그아웃 실패",
        description: "로그아웃 중 오류가 발생했습니다.",
      });
    }
  };

  // 대시보드로 이동
  const goToDashboard = () => {
    navigate("/admin");
    closeSidebar();
  };

  // 임시 계정 생성 및 전환
  const handleTestPlanChange = async (newPlan: "free" | "premium") => {
    if (!userTestMode) return;

    try {
      // 기존 임시 계정이 있으면 삭제
      const currentTestUser = localStorage.getItem("currentTestUser");
      if (currentTestUser) {
        const testUser = JSON.parse(currentTestUser);
        await fetch(`/api/admin/delete-test-user/${testUser.id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });
        console.log("기존 임시 계정 삭제:", testUser.id);
      }

      // 새 임시 계정 생성
      const response = await fetch("/api/admin/create-test-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan }),
      });

      if (response.ok) {
        // Content-Type 확인하여 JSON인지 검증
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("백엔드 서버가 실행되지 않았습니다");
        }
        const data = await response.json();
        const testUser = data.user;

        // 임시 계정으로 전환
        setTestPlan(newPlan);
        setPlan(newPlan);

        // localStorage에 임시 계정 정보 저장
        localStorage.setItem("currentTestUser", JSON.stringify(testUser));
        localStorage.setItem("user", JSON.stringify(testUser));
        localStorage.setItem("uid", testUser.uid);
        localStorage.setItem("admin_test_plan", newPlan);

        toast({
          title: "사용자 환경 점검",
          description: `${newPlan === "premium" ? "프리미엄" : "무료"} 플랜 임시 계정으로 전환되었습니다.`,
        });

        console.log(`${newPlan} 플랜 임시 계정 생성 및 전환:`, testUser);
      } else {
        throw new Error("임시 계정 생성 실패");
      }
    } catch (error) {
      console.error("임시 계정 전환 오류:", error);
      toast({
        variant: "destructive",
        title: "오류",
        description: "임시 계정 전환에 실패했습니다.",
      });
    }
  };

  // 사용자 환경 점검 모드 토글
  const handleTestModeToggle = async () => {
    const newMode = !userTestMode;
    setUserTestMode(newMode);

    if (newMode) {
      // 점검 모드 시작 - 현재 플랜으로 초기화
      setTestPlan(plan as "free" | "premium");
      toast({
        title: "사용자 환경 점검 시작",
        description: "무료/프리미엄 플랜을 선택하여 테스트할 수 있습니다.",
      });
    } else {
      // 점검 모드 종료 - 임시 계정 삭제 및 관리자 모드 복원
      try {
        const currentTestUser = localStorage.getItem("currentTestUser");
        if (currentTestUser) {
          const testUser = JSON.parse(currentTestUser);
          await fetch(`/api/admin/delete-test-user/${testUser.id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
          });
          console.log("점검 종료: 임시 계정 삭제 완료:", testUser.id);
        }

        // 관리자 계정으로 복원
        const adminUser = localStorage.getItem("adminUser");
        if (adminUser) {
          localStorage.setItem("user", adminUser);
          const adminUserData = JSON.parse(adminUser);
          localStorage.setItem("uid", adminUserData.uid);
        }

        // 점검 관련 localStorage 정리
        localStorage.removeItem("currentTestUser");
        localStorage.removeItem("admin_test_plan");

        setPlan("premium");

        toast({
          title: "사용자 환경 점검 종료",
          description: "임시 계정이 삭제되고 관리자 모드로 복원되었습니다.",
        });
      } catch (error) {
        console.error("점검 종료 오류:", error);
        toast({
          variant: "destructive",
          title: "오류",
          description: "점검 종료 중 오류가 발생했습니다.",
        });
      }
    }
  };

  return (
    <>
      {/* Header with Menu Button */}
      <header className="fixed top-0 left-0 right-0 h-14 sm:h-16 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-200 z-50 shadow-sm">
        <div className="mobile-container flex items-center justify-between h-full">
          <button
            onClick={toggleSidebar}
            className="mobile-button p-2 rounded-lg hover:bg-white/50 transition-colors"
            aria-label="메뉴 열기"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-purple-700" />
          </button>

          <div className="flex items-center justify-center">
            <img
              src="/attached_assets/logo.png"
              alt="로고"
              className="h-10 sm:h-14 w-auto object-contain"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* 관리자 모드 버튼들 */}
            {isAdmin && (
              <div className="flex items-center gap-1">
                <Button
                  onClick={goToDashboard}
                  size="sm"
                  variant="outline"
                  className="bg-blue-600 text-white border-blue-600 hover:bg-blue-700 h-8 px-2"
                >
                  <Shield className="w-3 h-3 mr-1" />
                  <span className="text-xs">대시보드</span>
                </Button>

                {/* 사용자 환경 점검 토글 */}
                <Button
                  onClick={handleTestModeToggle}
                  size="sm"
                  variant="outline"
                  className={cn(
                    "h-8 px-2 transition-colors",
                    userTestMode
                      ? "bg-green-600 text-white border-green-600 hover:bg-green-700"
                      : "bg-gray-600 text-white border-gray-600 hover:bg-gray-700"
                  )}
                >
                  <TestTube className="w-3 h-3 mr-1" />
                  <span className="text-xs">
                    {userTestMode ? "점검중" : "점검"}
                  </span>
                </Button>

                {/* 플랜 선택 버튼 (점검 모드일 때만 표시) */}
                {userTestMode && (
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => handleTestPlanChange("free")}
                      size="sm"
                      variant="outline"
                      className={cn(
                        "h-8 px-2",
                        testPlan === "free"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-blue-600 border-blue-600 hover:bg-blue-50"
                      )}
                    >
                      <Gift className="w-3 h-3 mr-1" />
                      <span className="text-xs">무료</span>
                    </Button>
                    <Button
                      onClick={() => handleTestPlanChange("premium")}
                      size="sm"
                      variant="outline"
                      className={cn(
                        "h-8 px-2",
                        testPlan === "premium"
                          ? "bg-yellow-600 text-white border-yellow-600"
                          : "bg-white text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                      )}
                    >
                      <Crown className="w-3 h-3 mr-1" />
                      <span className="text-xs">프리미엄</span>
                    </Button>
                  </div>
                )}

                <Button
                  onClick={handleAdminLogout}
                  size="sm"
                  variant="outline"
                  className="bg-red-600 text-white border-red-600 hover:bg-red-700 h-8 px-2"
                >
                  <LogOut className="w-3 h-3 mr-1" />
                  <span className="text-xs">로그아웃</span>
                </Button>
              </div>
            )}

            {/* 구독 플랜 배지 또는 관리자 배지 */}
            {isAdmin ? (
              userTestMode ? (
                // 사용자 환경 점검 모드일 때는 선택된 플랜 배지 표시
                <Badge
                  variant="default"
                  className={cn(
                    "text-xs px-3 py-1 font-bold shadow-lg border-2 border-orange-400",
                    testPlan === "free"
                      ? "bg-blue-600 text-white"
                      : "bg-gradient-to-r from-yellow-500 to-orange-600 text-white"
                  )}
                >
                  <div className="flex items-center gap-1">
                    {testPlan === "free" ? (
                      <Gift className="w-3 h-3" />
                    ) : (
                      <Crown className="w-3 h-3" />
                    )}
                    <span className="font-bold">
                      {testPlan === "free" ? "무료플랜" : "프리미엄"} (점검)
                    </span>
                  </div>
                </Badge>
              ) : (
                // 일반 관리자 모드 - 비활성화된 배지
                <Badge
                  variant="default"
                  className="text-xs px-3 py-1 font-bold shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                >
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    <span className="font-bold">관리자</span>
                  </div>
                </Badge>
              )
            ) : (
              <Badge
                variant="default"
                className={cn(
                  "text-xs px-3 py-1 font-bold shadow-lg",
                  isFree
                    ? "bg-blue-600 hover:bg-blue-700 text-white border border-blue-700"
                    : "bg-gradient-to-r from-yellow-500 to-orange-600 text-white"
                )}
              >
                <div className="flex items-center gap-1">
                  {isFree ? (
                    <Gift className="w-3 h-3" />
                  ) : (
                    <Crown className="w-3 h-3" />
                  )}
                  <span className="font-bold">
                    {isFree ? "무료플랜" : "프리미엄"}
                  </span>
                </div>
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-72 sm:w-80 bg-gradient-to-b from-purple-50 to-blue-50 shadow-xl z-50 transform transition-transform duration-300 ease-in-out border-r border-purple-100 overflow-hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 lg:p-6 border-b border-purple-200 flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex flex-col items-center gap-1 sm:gap-2 min-w-0">
                <img
                  src="/attached_assets/logo.png"
                  alt="로고"
                  className="h-12 sm:h-14 lg:h-16 w-auto object-contain flex-shrink-0"
                />
                <p className="text-xs sm:text-xs lg:text-sm text-purple-600 font-medium text-center leading-tight text-balance">
                  마음 건강 케어 앱
                </p>
              </div>
              {isAdmin && (
                <Badge
                  variant="default"
                  className="text-xs px-1.5 sm:px-2 py-1 font-medium ml-1 sm:ml-2 flex-shrink-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                >
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3 flex-shrink-0" />
                    <span className="hidden sm:inline">Admin</span>
                  </div>
                </Badge>
              )}
            </div>
            <button
              onClick={closeSidebar}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-white/50 transition-colors flex-shrink-0 ml-2"
              aria-label="메뉴 닫기"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-3 sm:p-4 overflow-y-auto">
            <ul className="space-y-1.5 sm:space-y-2">
              {navigationItems.map(
                ({ href, label, icon: Icon, description, premium }) => {
                  const isActive =
                    location === href ||
                    (href !== "/" && location.startsWith(href));
                  const isRestricted = premium && isFree; // 플랜에 따른 제한 적용

                  return (
                    <li key={href} className="relative">
                      {isRestricted ? (
                        <div
                          className={cn(
                            "flex items-center p-2 sm:p-3 rounded-xl transition-all duration-200 opacity-60 cursor-not-allowed",
                            "bg-gray-100/50 text-gray-400"
                          )}
                        >
                          <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 z-10">
                            <div className="flex items-center bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-1 rounded-full shadow-lg">
                              <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </div>
                          </div>
                          <div
                            className={cn(
                              "p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3 bg-gray-200/50 flex-shrink-0"
                            )}
                          >
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-xs sm:text-sm lg:text-base leading-tight text-break-words">
                              {label}
                            </div>
                            <div className="text-xs text-gray-400 leading-relaxed text-break-words line-clamp-2 hidden sm:block">
                              {description}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Link
                          href={href}
                          className={cn(
                            "mobile-button flex items-center rounded-xl transition-all duration-200",
                            "hover:bg-white/60 hover:shadow-sm",
                            isActive
                              ? "bg-white/70 text-purple-700 border border-purple-200 shadow-sm"
                              : "text-slate-700"
                          )}
                          onClick={closeSidebar}
                        >
                          <div
                            className={cn(
                              "p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3 flex-shrink-0",
                              isActive ? "bg-purple-100" : "bg-white/60"
                            )}
                          >
                            <Icon
                              className={cn(
                                "w-4 h-4 sm:w-5 sm:h-5",
                                isActive ? "text-purple-600" : "text-slate-600"
                              )}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium mobile-text text-balance">
                              {label}
                            </div>
                            <div className="text-xs text-slate-500 text-balance line-clamp-2 hidden sm:block">
                              {description}
                            </div>
                          </div>
                          <ChevronRight
                            className={cn(
                              "w-3 h-3 sm:w-4 sm:h-4 transition-transform flex-shrink-0",
                              isActive ? "text-primary" : "text-gray-400"
                            )}
                          />
                        </Link>
                      )}
                    </li>
                  );
                }
              )}
            </ul>
          </nav>

          {/* Sidebar Footer */}
          <div className="mobile-container border-t border-gray-200 flex-shrink-0">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 mobile-card rounded-xl">
              <div className="mobile-text font-medium text-gray-900 mb-1 text-balance">
                오늘도 좋은 하루 되세요! 💙
              </div>
              <div className="text-xs sm:text-sm text-gray-600 text-balance">
                당신의 마음 건강을 응원합니다
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
