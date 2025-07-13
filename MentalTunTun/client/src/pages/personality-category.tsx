import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import {
  ArrowLeft,
  Brain,
  Briefcase,
  TrendingUp,
  Users,
  AlertTriangle,
  Crown,
  BarChart3,
  TrendingDown,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { personalityApi } from "@/lib/api";
import { DetailedAnalysis, User } from "@/types";

const CATEGORIES = {
  personality_traits: {
    title: "성격특성",
    description: "당신의 핵심 성격과 특징",
    icon: Brain,
    color: "from-blue-500 to-blue-600",
    bgColor: "from-blue-50 to-blue-100",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
  },
  career_path: {
    title: "커리어패스",
    description: "적합한 직업과 성장 방향",
    icon: Briefcase,
    color: "from-green-500 to-green-600",
    bgColor: "from-green-50 to-green-100",
    borderColor: "border-green-200",
    textColor: "text-green-700",
  },
  personal_growth: {
    title: "개인적성장",
    description: "자기계발과 성장 방향",
    icon: TrendingUp,
    color: "from-purple-500 to-purple-600",
    bgColor: "from-purple-50 to-purple-100",
    borderColor: "border-purple-200",
    textColor: "text-purple-700",
  },
  relationships: {
    title: "인간관계",
    description: "대인관계 패턴과 소통 방식",
    icon: Users,
    color: "from-pink-500 to-pink-600",
    bgColor: "from-pink-50 to-pink-100",
    borderColor: "border-pink-200",
    textColor: "text-pink-700",
  },
  caution_areas: {
    title: "조심해야 할 것",
    description: "주의할 점과 개선 방향",
    icon: AlertTriangle,
    color: "from-amber-500 to-amber-600",
    bgColor: "from-amber-50 to-amber-100",
    borderColor: "border-amber-200",
    textColor: "text-amber-700",
  },
};

// 카테고리별 종합 요약 생성 함수
function generateCategorySummary(
  category: keyof DetailedAnalysis,
  keywords: string[]
): {
  strengths: string[];
  weaknesses: string[];
  cautions: string[];
  strengthScore: number;
  weaknessScore: number;
  cautionScore: number;
} {
  const summaries = {
    personality_traits: {
      strengths: [
        "독창적이고 창의적인 사고 능력",
        "논리적 분석과 체계적 접근 선호",
        "높은 학습 욕구와 지적 호기심",
        "독립적이고 자율적인 업무 스타일",
      ],
      weaknesses: [
        "완벽주의 성향으로 인한 스트레스",
        "감정 표현의 어려움",
        "과도한 자기비판 경향",
      ],
      cautions: [
        "번아웃 예방을 위한 적절한 휴식",
        "타인과의 소통 방식 개선 필요",
        "유연성 향상을 위한 노력",
      ],
      strengthScore: 85,
      weaknessScore: 25,
      cautionScore: 35,
    },
    career_path: {
      strengths: [
        "분석적 업무에 뛰어난 적성",
        "창의적 문제해결 능력",
        "자기주도적 학습 능력",
        "새로운 기술 습득에 대한 열정",
      ],
      weaknesses: [
        "팀워크보다 개인 작업 선호",
        "루틴한 업무에 대한 낮은 흥미",
        "빠른 의사결정의 어려움",
      ],
      cautions: [
        "협업 능력 향상 필요",
        "다양한 업무 경험 쌓기",
        "네트워킹 스킬 개발",
      ],
      strengthScore: 90,
      weaknessScore: 30,
      cautionScore: 40,
    },
    personal_growth: {
      strengths: [
        "지속적인 자기계발 의지",
        "목표 지향적 사고",
        "새로운 도전에 대한 개방성",
        "피드백 수용 능력",
      ],
      weaknesses: [
        "과도한 계획성으로 인한 경직성",
        "실패에 대한 두려움",
        "단기 성과에 대한 조급함",
      ],
      cautions: [
        "실패를 학습 기회로 받아들이기",
        "단계적 목표 설정",
        "멘토링 관계 구축",
      ],
      strengthScore: 82,
      weaknessScore: 28,
      cautionScore: 32,
    },
    relationships: {
      strengths: [
        "진정성 있는 관계 구축 능력",
        "깊이 있는 대화 선호",
        "상대방 이해하려는 노력",
        "신뢰할 수 있는 성격",
      ],
      weaknesses: [
        "새로운 사람과의 관계 형성 어려움",
        "감정 표현의 부족",
        "갈등 상황 회피 경향",
      ],
      cautions: [
        "적극적인 소통 자세 필요",
        "다양한 사람들과의 교류 확대",
        "갈등 해결 스킬 개발",
      ],
      strengthScore: 75,
      weaknessScore: 35,
      cautionScore: 45,
    },
    caution_areas: {
      strengths: [
        "위험 상황 인식 능력",
        "신중한 의사결정 과정",
        "안정성을 중시하는 성향",
        "체계적인 계획 수립 능력",
      ],
      weaknesses: [
        "과도한 신중함으로 인한 기회 상실",
        "변화에 대한 저항감",
        "스트레스 관리의 어려움",
      ],
      cautions: [
        "적절한 위험 감수 필요",
        "변화에 대한 적응력 향상",
        "스트레스 해소 방법 개발",
      ],
      strengthScore: 70,
      weaknessScore: 40,
      cautionScore: 50,
    },
  };

  return summaries[category];
}

export default function PersonalityCategoryPage() {
  const [, navigate] = useLocation();

  // useRoute 훅으로 파라미터 추출
  const [match, params] = useRoute("/personality/category/:category");
  const category = params?.category as keyof DetailedAnalysis;

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

  const handleKeywordClick = (keyword: string) => {
    navigate(`/personality/detail/${category}/${encodeURIComponent(keyword)}`);
  };

  if (!category || !CATEGORIES[category]) {
    navigate("/personality/overview");
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="text-xl text-gray-700 font-medium">
            카테고리 분석을 불러오는 중...
          </p>
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
              카테고리 데이터를 불러올 수 없습니다.
            </p>
            <Button onClick={() => navigate("/personality/overview")}>
              돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categoryInfo = CATEGORIES[category];
  const categoryData = analysis[category];
  const keywords = categoryData?.keywords || [];
  const summary = generateCategorySummary(category, keywords);
  const Icon = categoryInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/personality/overview")}
            className="hover:bg-white/50 shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            상세분석으로
          </Button>
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-medium text-gray-600">
              프리미엄 상세분석
            </span>
          </div>
        </div>

        {/* 카테고리 헤더 */}
        <Card
          className={`shadow-2xl bg-gradient-to-br ${categoryInfo.bgColor} ${categoryInfo.borderColor} border-2 relative overflow-hidden`}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent"></div>
          <CardHeader className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div
                className={`p-4 bg-gradient-to-r ${categoryInfo.color} rounded-xl shadow-lg`}
              >
                <Icon className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle
                  className={`text-3xl font-bold ${categoryInfo.textColor}`}
                >
                  {categoryInfo.title}
                </CardTitle>
                <p className="text-gray-600 text-lg">
                  {categoryInfo.description}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 키워드 버튼 3개 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">주요 키워드</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {keywords.slice(0, 3).map((keyword, index) => (
              <Button
                key={keyword}
                onClick={() => handleKeywordClick(keyword)}
                className={`h-auto p-6 text-left bg-gradient-to-br ${categoryInfo.bgColor} ${categoryInfo.borderColor} border-2 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-gray-800`}
                variant="outline"
              >
                <div className="w-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-semibold">{keyword}</span>
                    <BarChart3
                      className={`w-5 h-5 ${categoryInfo.textColor}`}
                    />
                  </div>
                  <div className="text-sm text-gray-600">상세 분석 보기</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* 종합 요약 섹션 */}
        <Card className="shadow-xl bg-white border-2 border-gray-200 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-transparent"></div>
          <CardHeader className="relative">
            <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <div
                className={`p-2 bg-gradient-to-r ${categoryInfo.color} rounded-lg`}
              >
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              {categoryInfo.title} 종합 분석
            </CardTitle>
          </CardHeader>

          <CardContent className="relative space-y-6">
            {/* 3개 섹션: 장점, 단점, 주의할 점 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 장점 */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-green-700">장점</h3>
                    <div className="text-2xl font-bold text-green-600">
                      {summary.strengthScore}%
                    </div>
                  </div>
                </div>

                {/* 장점 프로그래스 바 */}
                <div className="relative mb-4">
                  <div className="h-3 bg-gray-200 rounded-full shadow-inner overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full shadow-lg transition-all duration-1500 ease-out relative"
                      style={{
                        width: `${summary.strengthScore}%`,
                        boxShadow:
                          "inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.2)",
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full"></div>
                    </div>
                  </div>
                </div>

                <ul className="space-y-2">
                  {summary.strengths.map((strength, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-700 flex items-start gap-2 bg-green-50 p-2 rounded-lg"
                    >
                      <span className="text-green-600 mt-1">✓</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 단점 */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-500 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-red-700">단점</h3>
                    <div className="text-2xl font-bold text-red-600">
                      {summary.weaknessScore}%
                    </div>
                  </div>
                </div>

                {/* 단점 프로그래스 바 */}
                <div className="relative mb-4">
                  <div className="h-3 bg-gray-200 rounded-full shadow-inner overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full shadow-lg transition-all duration-1500 ease-out relative"
                      style={{
                        width: `${summary.weaknessScore}%`,
                        boxShadow:
                          "inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.2)",
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full"></div>
                    </div>
                  </div>
                </div>

                <ul className="space-y-2">
                  {summary.weaknesses.map((weakness, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-700 flex items-start gap-2 bg-red-50 p-2 rounded-lg"
                    >
                      <span className="text-red-600 mt-1">⚠</span>
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 주의할 점 */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-500 rounded-lg">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-700">주의할 점</h3>
                    <div className="text-2xl font-bold text-amber-600">
                      {summary.cautionScore}%
                    </div>
                  </div>
                </div>

                {/* 주의사항 프로그래스 바 */}
                <div className="relative mb-4">
                  <div className="h-3 bg-gray-200 rounded-full shadow-inner overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full shadow-lg transition-all duration-1500 ease-out relative"
                      style={{
                        width: `${summary.cautionScore}%`,
                        boxShadow:
                          "inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.2)",
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full"></div>
                    </div>
                  </div>
                </div>

                <ul className="space-y-2">
                  {summary.cautions.map((caution, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-700 flex items-start gap-2 bg-amber-50 p-2 rounded-lg"
                    >
                      <span className="text-amber-600 mt-1">💡</span>
                      {caution}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 추가 키워드 (4개 이상인 경우) */}
        {keywords.length > 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">추가 키워드</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {keywords.slice(3).map(keyword => (
                <Button
                  key={keyword}
                  onClick={() => handleKeywordClick(keyword)}
                  variant="outline"
                  className={`h-auto p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300`}
                >
                  <div className="text-center">
                    <span className="text-sm font-medium text-gray-700">
                      {keyword}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
