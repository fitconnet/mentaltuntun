import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MallangiCharacter } from "@/components/characters/MallangiCharacter";
import { CharacterCard } from "@/components/ui/character-card";
import {
  userApi,
  emotionApi,
  counselingApi,
  authApi,
  apiRequest,
} from "@/lib/api";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { User, Heart, MessageCircle, TrendingUp, Crown } from "lucide-react";
import type { User as UserType } from "@/types/index";

export default function HomePage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [, setLocation] = useLocation();
  const { isFree, isAdmin } = useSubscription();
  const [showExitDialog, setShowExitDialog] = useState(false);

  useEffect(() => {
    // 사용자 인증 상태 확인
    const checkAuthStatus = async () => {
      // 관리자 모드 우선 확인
      const isAdminStored = localStorage.getItem("isAdmin") === "true";
      const adminUserStored = localStorage.getItem("adminUser");

      if (isAdminStored && adminUserStored) {
        try {
          const adminUser = JSON.parse(adminUserStored);

          setUser(adminUser);
          return; // 관리자 모드일 때는 추가 인증 확인 생략
        } catch (error) {
          console.error("관리자 정보 파싱 오류:", error);
          // 관리자 정보 파싱 실패시 localStorage 정리 후 일반 인증 진행
          localStorage.removeItem("isAdmin");
          localStorage.removeItem("adminUser");
        }
      }

      // 일반 사용자 인증 확인
      const uid = localStorage.getItem("uid");
      const authToken = localStorage.getItem("authToken");

      if (!uid || !authToken) {
        // 인증 정보가 없으면 로그인 페이지로 리다이렉트
        setLocation("/login");
        return;
      }

      try {
        // 서버에서 사용자 정보 확인
        const response = await authApi.getCurrentUser();
        if (response && response.user) {
          setUser(response.user);
        } else {
          // 유효하지 않은 인증 정보
          localStorage.removeItem("uid");
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          setLocation("/login");
        }
      } catch (error) {
        setLocation("/login");
      }
    };

    checkAuthStatus();
  }, [setLocation]);

  // 뒤로가기 버튼 처리
  useEffect(() => {
    const handleBackButton = (event: PopStateEvent) => {
      event.preventDefault();
      setShowExitDialog(true);
      // 브라우저 히스토리에 현재 페이지를 다시 추가하여 뒤로가기를 방지
      window.history.pushState(null, "", window.location.pathname);
    };

    // 현재 페이지를 히스토리에 추가
    window.history.pushState(null, "", window.location.pathname);

    // popstate 이벤트 리스너 추가
    window.addEventListener("popstate", handleBackButton);

    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, []);

  const handleExitApp = () => {
    // 웹 환경에서는 창을 닫기
    window.close();
    // 만약 창이 닫히지 않으면 (일부 브라우저에서는 스크립트로 창을 닫을 수 없음) 알림 표시
    setTimeout(() => {
      alert("브라우저 탭을 닫아 앱을 종료해주세요.");
    }, 100);
  };

  const { data: emotions = [] } = useQuery({
    queryKey: ["/api/users", user?.id, "emotions"],
    queryFn: () =>
      user ? emotionApi.getEmotions(user.id) : Promise.resolve([]),
    enabled: !!user,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["/api/users", user?.id, "counseling", "sessions"],
    queryFn: () =>
      user ? counselingApi.getSessions(user.id) : Promise.resolve([]),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">테스트 사용자 로딩 중...</p>
        </div>
      </div>
    );
  }

  const consecutiveDays = emotions.length;
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter(
    session => session.isActive === true
  ).length; // 진행중인 상담 리스트
  const completedSessions = sessions.filter(
    session => session.isActive === false
  ).length; // 완료된 상담
  const recentEmotions = emotions.slice(-7);
  const positiveEmotions = recentEmotions.filter(record =>
    record.emotionKeywords?.some(emotion =>
      ["기쁨", "평온", "만족", "설렘", "감사", "희망"].includes(emotion)
    )
  );
  const positivityRate =
    recentEmotions.length > 0
      ? Math.round((positiveEmotions.length / recentEmotions.length) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-soft-blue to-warm-gray pb-20 mobile-scroll">
      <div className="mobile-container py-8 sm:py-12">
        {/* Welcome Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center mb-4">
            <MallangiCharacter size="lg" />
          </div>
          <h2 className="mobile-title font-bold text-gray-800 mb-3 text-balance">
            안녕하세요, {user.name}님!
          </h2>
          <p className="mobile-text text-gray-600 text-balance">
            오늘은 어떤 하루를 보내고 싶으신가요?
          </p>
        </div>

        {/* Main Action Cards */}
        <div className="max-w-4xl mx-auto mobile-grid mb-8 sm:mb-12">
          <Link href="/self-discovery" className="block h-full">
            <div className="h-full transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
              <CharacterCard
                title="나는 누구?"
                description="자아탐색과 정체성 발견을 통해 진정한 나를 찾아보세요"
                icon={<User className="text-white text-2xl" />}
                gradient="bg-gradient-to-r from-purple-400 to-pink-400"
                tags={["정체성 탐구", "가치관 탐색", "목표 설정"]}
                showPremiumIcon={isFree}
                limitText={isFree ? "1회 제한" : undefined}
              />
            </div>
          </Link>

          <Link href="/emotions" className="block h-full">
            <div className="h-full transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
              <CharacterCard
                title="감정 일기"
                description="오늘의 감정을 기록하고 변화를 시각화 해보세요"
                icon={<Heart className="text-white text-2xl" />}
                gradient="bg-gradient-to-r from-green-400 to-blue-400"
                tags={["감정 기록", "주간 분석", "패턴 발견"]}
              />
            </div>
          </Link>

          <Link href="/counseling" className="block h-full">
            <div className="h-full transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
              <CharacterCard
                title="상담 시작"
                description="AI 상담사와 마음 깊은 대화를 나누어 보세요"
                icon={<MessageCircle className="text-white text-2xl" />}
                gradient="bg-gradient-to-r from-yellow-400 to-orange-400"
                tags={["GPT 상담", "3가지 페르소나", "맞춤 조언"]}
                showPremiumIcon={isFree}
                limitText={isFree ? "2회 제한" : undefined}
              />
            </div>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="max-w-4xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="mobile-card bg-white rounded-2xl shadow-lg hover:shadow-xl card-3d">
            <CardContent className="text-center h-full flex flex-col justify-center min-h-[100px] sm:min-h-[112px]">
              <div className="mobile-title font-bold text-primary mb-1">
                {consecutiveDays}
              </div>
              <div className="mobile-text text-gray-600 text-balance">
                감정 기록일
              </div>
            </CardContent>
          </Card>

          <Card className="mobile-card bg-white rounded-2xl shadow-lg hover:shadow-xl card-3d">
            <CardContent className="text-center h-full flex flex-col justify-center min-h-[100px] sm:min-h-[112px]">
              <div className="mobile-title font-bold text-green-500 mb-1">
                {activeSessions}
              </div>
              <div className="mobile-text text-gray-600 text-balance">
                진행중 상담
              </div>
            </CardContent>
          </Card>

          <Card className="mobile-card bg-white rounded-2xl shadow-lg hover:shadow-xl card-3d">
            <CardContent className="text-center h-full flex flex-col justify-center min-h-[100px] sm:min-h-[112px]">
              <div className="mobile-title font-bold text-blue-500 mb-1">
                {totalSessions}
              </div>
              <div className="mobile-text text-gray-600 text-balance">
                총 상담횟수
              </div>
            </CardContent>
          </Card>

          <Card className="mobile-card bg-white rounded-2xl shadow-lg hover:shadow-xl card-3d">
            <CardContent className="text-center h-full flex flex-col justify-center min-h-[100px] sm:min-h-[112px]">
              <div className="mobile-title font-bold text-purple-500 mb-1">
                {positivityRate}%
              </div>
              <div className="mobile-text text-gray-600 text-balance">
                긍정도
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        {recentEmotions.length === 0 && (
          <div className="max-w-2xl mx-auto mt-6 sm:mt-8">
            <Card className="bg-gradient-to-r from-soft-purple to-soft-pink border-0 shadow-lg hover:shadow-xl card-3d">
              <CardContent className="mobile-card text-center">
                <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-primary" />
                <h3 className="mobile-title font-semibold text-gray-800 mb-3 text-balance">
                  첫 번째 감정 기록을 남겨보세요!
                </h3>
                <p className="mobile-text text-gray-600 mb-6 text-balance">
                  하루의 감정을 기록하면 마음의 변화를 더 잘 이해할 수 있어요.
                </p>
                <Link
                  href="/emotions"
                  className="mobile-button inline-block bg-primary text-white rounded-xl hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg card-3d font-medium"
                >
                  감정 기록하기
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* 프로그램 종료 확인 다이얼로그 */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>프로그램 종료</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 멘탈튼튼을 종료하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowExitDialog(false)}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleExitApp}>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
