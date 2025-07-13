import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Crown,
  Star,
  Brain,
  Briefcase,
  TrendingUp,
  Users,
  AlertTriangle,
  ChevronRight,
  FileText,
  BarChart3,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { personalityApi } from "@/lib/api";
import { DetailedAnalysis, User } from "@/types";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = {
  personality_traits: {
    title: "성격특성",
    description: "당신의 핵심 성격과 특징",
    icon: Brain,
    color: "from-blue-500 to-blue-600",
    bgColor: "from-blue-50 to-blue-100",
    borderColor: "border-blue-200",
  },
  career_path: {
    title: "커리어패스",
    description: "적합한 직업과 성장 방향",
    icon: Briefcase,
    color: "from-green-500 to-green-600",
    bgColor: "from-green-50 to-green-100",
    borderColor: "border-green-200",
  },
  personal_growth: {
    title: "개인적성장",
    description: "자기계발과 성장 방향",
    icon: TrendingUp,
    color: "from-purple-500 to-purple-600",
    bgColor: "from-purple-50 to-purple-100",
    borderColor: "border-purple-200",
  },
  relationships: {
    title: "인간관계",
    description: "대인관계 패턴과 소통 방식",
    icon: Users,
    color: "from-pink-500 to-pink-600",
    bgColor: "from-pink-50 to-pink-100",
    borderColor: "border-pink-200",
  },
  caution_areas: {
    title: "조심해야 할 것",
    description: "주의할 점과 개선 방향",
    icon: AlertTriangle,
    color: "from-amber-500 to-amber-600",
    bgColor: "from-amber-50 to-amber-100",
    borderColor: "border-amber-200",
  },
};

// 종합 분석 리포트 생성 함수
function generateComprehensiveReport(
  analysis: DetailedAnalysis,
  user: User
): {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  overallScore: number;
} {
  const name = user?.name || "사용자";

  return {
    summary: `${name}님은 창의적이고 독립적인 성향을 가진 분석적 사고자입니다. 강한 호기심과 학습 욕구를 바탕으로 새로운 도전을 즐기며, 체계적이고 논리적인 접근 방식을 선호합니다. 대인관계에서는 진정성을 중시하며, 깊이 있는 관계를 선호하는 경향이 있습니다.`,
    strengths: [
      "뛰어난 분석력과 문제해결 능력",
      "창의적이고 독창적인 아이디어 도출",
      "강한 학습 욕구와 자기계발 의지",
      "진정성 있는 대인관계 구축 능력",
    ],
    weaknesses: [
      "완벽주의 성향으로 인한 스트레스",
      "감정 표현에 있어서의 어려움",
      "과도한 자기비판 경향",
      "변화에 대한 초기 저항감",
    ],
    recommendations: [
      "감정 표현 연습과 스트레스 관리법 학습",
      "완벽주의보다는 진전에 초점 맞추기",
      "다양한 사람들과의 네트워킹 확대",
      "새로운 경험에 대한 개방적 태도 기르기",
    ],
    overallScore: 82,
  };
}

export default function PersonalityOverviewPage() {
  const [, navigate] = useLocation();
  const { isPremium, isFree } = useSubscription();
  const { toast } = useToast();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/users/1"],
  });

  const {
    data: analysis,
    isLoading,
    error,
  } = useQuery<DetailedAnalysis>({
    queryKey: ["/api/users/1/personality/detailed"],
    queryFn: () => personalityApi.getDetailedAnalysis(1),
    enabled: !!user,
  });

  const handleCategoryClick = (category: keyof DetailedAnalysis) => {
    if (isFree) {
      toast({
        title: "프리미엄 기능",
        description: "성격분석 상세보기는 프리미엄 회원만 이용할 수 있습니다.",
        variant: "destructive",
      });
      navigate("/subscription");
      return;
    }
    navigate(`/personality/category/${category}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="text-xl text-gray-700 font-medium">
            당신을 위한 초개인화된 정보를 분석중입니다
          </p>
          <p className="text-sm text-gray-500">잠시만 기다려주세요...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full mx-4 shadow-xl">
          <CardContent className="text-center p-8">
            <p className="text-gray-600 mb-4">
              분석 데이터를 불러올 수 없습니다.
            </p>
            <Button onClick={() => navigate("/personality")}>
              다시 시도하기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const comprehensiveReport = generateComprehensiveReport(analysis, user);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/personality")}
            className="hover:bg-white/50 shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로가기
          </Button>
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-medium text-gray-600">
              프리미엄 상세분석
            </span>
          </div>
        </div>

        {/* 종합 성격 분석 리포트 */}
        <Card className="shadow-2xl bg-gradient-to-br from-white via-blue-50 to-purple-50 border-2 border-blue-200 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent"></div>
          <CardHeader className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
                  종합 성격 분석 리포트
                </CardTitle>
                <p className="text-gray-600">
                  {user.name}님의 전체적인 성격 특성 분석
                </p>
              </div>
              <div className="ml-auto text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {comprehensiveReport.overallScore}%
                </div>
                <div className="text-sm text-gray-600">종합 점수</div>
              </div>
            </div>

            {/* 종합 점수 프로그래스 바 */}
            <div className="relative mb-6">
              <div className="h-4 bg-gray-200 rounded-full shadow-inner overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg transition-all duration-2000 ease-out relative"
                  style={{
                    width: `${comprehensiveReport.overallScore}%`,
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.2)",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full"></div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative space-y-6">
            {/* 종합 요약 */}
            <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-blue-100">
              <h3 className="font-semibold text-gray-800 mb-2">📋 종합 요약</h3>
              <p className="text-gray-700 leading-relaxed">
                {comprehensiveReport.summary}
              </p>
            </div>

            {/* 4분할 섹션 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 주요 강점 */}
              <div className="bg-green-50/80 backdrop-blur-sm p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  주요 강점
                </h3>
                <ul className="space-y-2">
                  {comprehensiveReport.strengths.map((strength, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-700 flex items-start gap-2"
                    >
                      <span className="text-green-600 mt-1">✓</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 개선 영역 */}
              <div className="bg-amber-50/80 backdrop-blur-sm p-4 rounded-lg border border-amber-200">
                <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  개선 영역
                </h3>
                <ul className="space-y-2">
                  {comprehensiveReport.weaknesses.map((weakness, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-700 flex items-start gap-2"
                    >
                      <span className="text-amber-600 mt-1">⚠</span>
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 성장 방향 */}
              <div className="bg-purple-50/80 backdrop-blur-sm p-4 rounded-lg border border-purple-200 md:col-span-2">
                <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  맞춤형 성장 방향
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {comprehensiveReport.recommendations.map(
                    (recommendation, index) => (
                      <div
                        key={index}
                        className="bg-white/60 p-3 rounded-lg text-sm text-gray-700 flex items-start gap-2"
                      >
                        <span className="text-purple-600 mt-1">💡</span>
                        {recommendation}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 실시간 분석 리포트 카드 */}
        <Card className="card-3d bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 border-2 border-blue-200 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent"></div>
          <CardHeader className="text-center pb-4 relative">
            <div className="flex items-center justify-center gap-2 mb-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
                실시간 분석 리포트
              </CardTitle>
            </div>
            <p className="text-sm text-gray-600">
              최근 상담 내용과 감정 기록을 종합하여 현재 심리 상태를 분석합니다
            </p>
          </CardHeader>
          <CardContent className="space-y-4 relative">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-white/60 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">실시간</div>
                <div className="text-xs text-gray-500">심리 상태 분석</div>
              </div>
              <div className="text-center p-3 bg-white/60 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  AI 기반
                </div>
                <div className="text-xs text-gray-500">종합 진단</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">📊</span>
                </div>
                <div>
                  <div className="font-medium text-sm">심리 변화 추이</div>
                  <div className="text-xs text-gray-500">
                    감정 패턴 분석 및 시각화
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">🎯</span>
                </div>
                <div>
                  <div className="font-medium text-sm">스트레스 요인 분석</div>
                  <div className="text-xs text-gray-500">
                    개인 맞춤형 해결 방안 제시
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-sm">🏥</span>
                </div>
                <div>
                  <div className="font-medium text-sm">전문가 추천 시스템</div>
                  <div className="text-xs text-gray-500">
                    상태에 따른 병원/상담센터 안내
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={() => navigate("/personality/realtime-analysis")}
              className="button-3d w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
              size="lg"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              실시간 분석 보고서 보기
            </Button>
          </CardContent>
        </Card>

        {/* 5개 대주제 카드 */}
        <div className="grid gap-4">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            세부 분석 카테고리
          </h2>
          {Object.entries(CATEGORIES).map(([key, category]) => {
            const categoryData = analysis[key as keyof DetailedAnalysis];
            const Icon = category.icon;

            return (
              <Card
                key={key}
                className={`shadow-xl bg-gradient-to-br ${category.bgColor} ${category.borderColor} border-2 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden ${isFree ? "opacity-75" : ""}`}
                onClick={() =>
                  handleCategoryClick(key as keyof DetailedAnalysis)
                }
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent"></div>
                {isFree && (
                  <div className="absolute top-3 right-3 z-10 flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                      <Crown className="w-3 h-3" />
                    </div>
                    <div className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-medium shadow-sm">
                      Premium
                    </div>
                  </div>
                )}
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 bg-gradient-to-r ${category.color} rounded-xl shadow-lg ${isFree ? "opacity-70" : ""}`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3
                          className={`text-xl font-bold text-gray-800 ${isFree ? "text-gray-600" : ""}`}
                        >
                          {category.title}
                        </h3>
                        <p
                          className={`text-gray-600 mt-1 ${isFree ? "text-gray-500" : ""}`}
                        >
                          {category.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`text-sm text-gray-500 ${isFree ? "text-gray-400" : ""}`}
                          >
                            키워드 {categoryData?.keywords?.length || 0}개
                          </span>
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          <span
                            className={`text-sm text-gray-500 ${isFree ? "text-gray-400" : ""}`}
                          >
                            상세 분석 포함
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isFree ? (
                        <Lock className="w-5 h-5 text-gray-400" />
                      ) : (
                        <BarChart3 className="w-5 h-5 text-gray-400" />
                      )}
                      <ChevronRight
                        className={`w-6 h-6 ${isFree ? "text-gray-300" : "text-gray-400"}`}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
