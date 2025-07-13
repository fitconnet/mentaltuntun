import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import {
  ArrowLeft,
  Share2,
  Copy,
  Crown,
  TrendingUp,
  Target,
  AlertTriangle,
  Lightbulb,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { personalityApi } from "@/lib/api";
import { DetailedAnalysis, User } from "@/types";

const CATEGORIES = {
  personality_traits: {
    title: "🧠 성격특성",
    description: "당신의 핵심 성격과 특징을 분석합니다",
    color: "bg-blue-50 border-blue-200 text-blue-700",
    titleColor: "text-blue-600",
  },
  career_path: {
    title: "💼 커리어패스",
    description: "적합한 직업과 성장 방향을 제시합니다",
    color: "bg-green-50 border-green-200 text-green-700",
    titleColor: "text-green-600",
  },
  personal_growth: {
    title: "🌱 개인적성장",
    description: "자기계발과 성장 방향을 안내합니다",
    color: "bg-purple-50 border-purple-200 text-purple-700",
    titleColor: "text-purple-600",
  },
  relationships: {
    title: "💞 인간관계",
    description: "대인관계 패턴과 소통 방식을 분석합니다",
    color: "bg-pink-50 border-pink-200 text-pink-700",
    titleColor: "text-pink-600",
  },
  caution_areas: {
    title: "⚠️ 조심해야 할 것",
    description: "주의할 점과 개선 방향을 제시합니다",
    color: "bg-amber-50 border-amber-200 text-amber-700",
    titleColor: "text-amber-600",
  },
};

interface DetailViewProps {
  category: keyof DetailedAnalysis;
  keyword: string;
  content: string;
}

interface DetailedKeywordAnalysis {
  keyword: string;
  percentage: number;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  recommendations: string[];
}

// Mock detailed analysis function - in real app this would come from AI API
function generateDetailedAnalysis(
  category: string,
  keyword: string
): DetailedKeywordAnalysis {
  const percentages: Record<string, number> = {
    창의적: 75,
    "비전 중심": 68,
    "혼자 몰입": 82,
    "논리적 사고": 71,
    "감정 표현": 59,
    리더십: 65,
    협업: 73,
    완벽주의: 78,
  };

  return {
    keyword,
    percentage: percentages[keyword] || Math.floor(Math.random() * 30) + 50,
    strengths: [
      `${keyword} 특성이 매우 뛰어나며 이를 통해 독창적인 아이디어를 생성합니다`,
      `복잡한 상황에서도 ${keyword}한 접근으로 문제를 해결할 수 있습니다`,
      `타인과 차별화된 ${keyword} 관점으로 새로운 가치를 창출합니다`,
    ],
    weaknesses: [
      `지나친 ${keyword} 성향으로 인해 현실적 제약을 간과할 수 있습니다`,
      `${keyword}에 집중하다 보면 다른 중요한 요소들을 놓칠 위험이 있습니다`,
      `일반적인 방식을 거부하여 효율성이 떨어질 수 있습니다`,
    ],
    improvements: [
      `${keyword} 특성과 현실적 접근의 균형점을 찾아보세요`,
      `정기적으로 다른 관점에서의 피드백을 구하는 습관을 기르세요`,
      `${keyword}한 아이디어를 구체적 실행 계획으로 발전시키는 연습을 하세요`,
    ],
    recommendations: [
      `${keyword} 특성을 활용할 수 있는 창작 활동이나 프로젝트를 시작해보세요`,
      `${keyword}한 사고를 체계화할 수 있는 툴이나 방법론을 학습하세요`,
      `비슷한 ${keyword} 성향을 가진 사람들과의 네트워킹을 늘려보세요`,
    ],
  };
}

function DetailView({ category, keyword, content }: DetailViewProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const categoryInfo = CATEGORIES[category];

  // Generate detailed analysis for this keyword
  const analysis = generateDetailedAnalysis(category, keyword);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `멘탈튼튼 - ${categoryInfo.title} 분석`,
        text: `${keyword}: ${content.substring(0, 100)}...`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "링크가 복사되었습니다",
        description: "다른 사람들과 공유해보세요!",
      });
    }
  };

  const handleCopy = () => {
    const fullContent = `
${keyword} 분석 결과

📊 매칭도: ${analysis.percentage}%

✅ 장점:
${analysis.strengths.map(s => `• ${s}`).join("\n")}

⚠️ 단점:
${analysis.weaknesses.map(w => `• ${w}`).join("\n")}

🔧 개선할 점:
${analysis.improvements.map(i => `• ${i}`).join("\n")}

💡 추천 방법:
${analysis.recommendations.map(r => `• ${r}`).join("\n")}
    `;

    navigator.clipboard.writeText(fullContent);
    toast({
      title: "상세 분석이 복사되었습니다",
      description: "클립보드에 저장되었습니다.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(`/personality/category/${category}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            목록으로
          </Button>
          <div className="flex items-center gap-1">
            <Crown className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-600">
              프리미엄 상세분석
            </span>
          </div>
        </div>

        {/* Keyword Header with Percentage */}
        <Card className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent"></div>
          <CardHeader className="text-center pb-6 relative">
            <div className="space-y-4">
              <Badge
                variant="secondary"
                className="text-lg px-6 py-2 bg-white/80 backdrop-blur-sm shadow-lg border border-blue-200"
              >
                {categoryInfo.title}
              </Badge>
              <CardTitle className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-blue-700 to-purple-700 bg-clip-text text-transparent">
                {keyword}
              </CardTitle>
              <div className="flex items-center justify-center space-x-6">
                <div className="text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {analysis.percentage}%
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    매칭도
                  </div>
                </div>
                <div className="w-32">
                  <div className="relative">
                    <div className="h-4 bg-gray-200 rounded-full shadow-inner overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg transition-all duration-1000 ease-out relative"
                        style={{
                          width: `${analysis.percentage}%`,
                          boxShadow:
                            "inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.2)",
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full"></div>
                      </div>
                    </div>
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full shadow-lg transition-all duration-1000 ease-out"
                      style={{ left: `calc(${analysis.percentage}% - 6px)` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Analysis Sections */}
        <div className="grid gap-4">
          {/* Strengths */}
          <Card className="shadow-xl border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3 bg-gradient-to-r from-green-100 to-green-50 rounded-t-lg">
              <CardTitle className="text-lg text-green-700 flex items-center gap-2">
                <div className="p-2 bg-green-200 rounded-full">
                  <TrendingUp className="w-5 h-5" />
                </div>
                장점
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-b-lg pointer-events-none"></div>
              <ul className="space-y-3 relative">
                {analysis.strengths.map((strength, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-sm text-gray-700 bg-white/50 p-3 rounded-lg shadow-sm"
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    {strength}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Weaknesses */}
          <Card className="shadow-xl border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3 bg-gradient-to-r from-red-100 to-red-50 rounded-t-lg">
              <CardTitle className="text-lg text-red-700 flex items-center gap-2">
                <div className="p-2 bg-red-200 rounded-full">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                단점
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-b-lg pointer-events-none"></div>
              <ul className="space-y-3 relative">
                {analysis.weaknesses.map((weakness, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-sm text-gray-700 bg-white/50 p-3 rounded-lg shadow-sm"
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white text-xs font-bold">⚠</span>
                    </div>
                    {weakness}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Improvements */}
          <Card className="shadow-xl border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3 bg-gradient-to-r from-amber-100 to-amber-50 rounded-t-lg">
              <CardTitle className="text-lg text-amber-700 flex items-center gap-2">
                <div className="p-2 bg-amber-200 rounded-full">
                  <Target className="w-5 h-5" />
                </div>
                개선할 점
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-b-lg pointer-events-none"></div>
              <ul className="space-y-3 relative">
                {analysis.improvements.map((improvement, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-sm text-gray-700 bg-white/50 p-3 rounded-lg shadow-sm"
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white text-xs font-bold">🔧</span>
                    </div>
                    {improvement}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="shadow-xl border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3 bg-gradient-to-r from-purple-100 to-purple-50 rounded-t-lg">
              <CardTitle className="text-lg text-purple-700 flex items-center gap-2">
                <div className="p-2 bg-purple-200 rounded-full">
                  <Lightbulb className="w-5 h-5" />
                </div>
                추천 방법
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-b-lg pointer-events-none"></div>
              <ul className="space-y-3 relative">
                {analysis.recommendations.map((recommendation, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-sm text-gray-700 bg-white/50 p-3 rounded-lg shadow-sm"
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white text-xs font-bold">💡</span>
                    </div>
                    {recommendation}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6">
          <Button
            onClick={handleShare}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
            size="lg"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
            <Share2 className="w-5 h-5 mr-2 relative" />
            <span className="relative">공유하기</span>
          </Button>
          <Button
            onClick={handleCopy}
            variant="outline"
            className="flex-1 border-2 border-gray-300 bg-white hover:bg-gray-50 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
            size="lg"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-transparent"></div>
            <Copy className="w-5 h-5 mr-2 relative" />
            <span className="relative">복사하기</span>
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-4">
          AI 기반 종합 분석 결과 · 멘탈튼튼
        </div>
      </div>
    </div>
  );
}

export default function PersonalityDetailPage() {
  const [match, params] = useRoute("/personality/detail/:category/:keyword");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isPremium, isFree, isAdmin } = useSubscription();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/users/1"],
  });

  // Redirect free users with toast message (admin users have unrestricted access)
  useEffect(() => {
    if (isFree && !isAdmin) {
      toast({
        title: "프리미엄 기능",
        description: "성격분석 상세보기는 프리미엄 회원만 이용할 수 있습니다.",
        variant: "destructive",
      });
      navigate("/subscription");
    }
  }, [isFree, isAdmin, navigate, toast]);

  // Block access for free users early (admin users have unrestricted access)
  if (isFree && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <Card className="max-w-md w-full mx-4 shadow-2xl">
          <CardContent className="text-center p-8 space-y-6">
            <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-800">프리미엄 기능</h3>
              <p className="text-gray-600">
                성격분석 상세보기는 프리미엄 회원만 이용할 수 있습니다.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => navigate("/personality")}
                variant="outline"
                className="flex-1"
              >
                돌아가기
              </Button>
              <Button
                onClick={() => navigate("/subscription")}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                <Crown className="w-4 h-4 mr-2" />
                구독하기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    data: analysis,
    isLoading,
    error,
  } = useQuery<DetailedAnalysis>({
    queryKey: ["/api/users/1/personality/detailed"],
    queryFn: () => personalityApi.getDetailedAnalysis(1),
    enabled: !!user,
  });

  if (!match || !params?.category || !params?.keyword) {
    navigate("/personality");
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">상세 분석을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center p-8">
            <p className="text-gray-600 mb-4">
              상세 분석을 불러올 수 없습니다.
            </p>
            <Button onClick={() => navigate("/personality")}>돌아가기</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const category = params.category as keyof DetailedAnalysis;
  const keyword = decodeURIComponent(params.keyword);
  const content =
    analysis[category]?.content?.[keyword] ||
    `${keyword}에 대한 상세 분석 내용입니다.`;

  return <DetailView category={category} keyword={keyword} content={content} />;
}
