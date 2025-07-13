import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Share2,
  Copy,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Target,
  Heart,
  Lightbulb,
  Star,
  Crown,
} from "lucide-react";
import { userApi, personalityApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import type { PersonalityReport, User } from "@/types";
import { INTEREST_CATEGORIES } from "@/types";

// Existing personality form component
function PersonalityForm() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [worldcupResults, setWorldcupResults] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInterestSelect = (categoryId: string) => {
    setSelectedInterests(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // For now, just simulate analysis and redirect to report
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "성격분석 완료!",
        description: "분석 결과를 확인해보세요.",
      });

      // Refresh the page to show the report
      window.location.reload();
    } catch (error) {
      toast({
        title: "분석 실패",
        description: "다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">성격분석 테스트</CardTitle>
          <p className="text-sm text-gray-600 text-center">
            관심사를 선택해주세요 (최소 3개)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {INTEREST_CATEGORIES.map(category => (
              <Button
                key={category.id}
                variant={
                  selectedInterests.includes(category.id)
                    ? "default"
                    : "outline"
                }
                className="h-auto p-4 text-left"
                onClick={() => handleInterestSelect(category.id)}
              >
                <div>
                  <div className="font-medium">{category.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {category.subcategories.slice(0, 2).join(", ")}
                  </div>
                </div>
              </Button>
            ))}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={selectedInterests.length < 3 || isSubmitting}
            className="w-full"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            분석 시작하기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Visualization component for personality traits
function PersonalityChart({ report }: { report: PersonalityReport }) {
  // Calculate percentages based on number of strengths vs weaknesses
  const totalTraits = report.strengths.length + report.weaknesses.length;
  const strengthPercentage = Math.round(
    (report.strengths.length / totalTraits) * 100
  );
  const weaknessPercentage = 100 - strengthPercentage;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 성격 비율 분석
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Strength vs Weakness Chart */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-green-600 font-medium">강점</span>
            <span className="text-green-600 font-bold">
              {strengthPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${strengthPercentage}%` }}
            />
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-orange-600 font-medium">개선점</span>
            <span className="text-orange-600 font-bold">
              {weaknessPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${weaknessPercentage}%` }}
            />
          </div>
        </div>

        {/* Category Distribution */}
        <Separator />
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">추천 영역 분포</h4>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {report.lifestyle_recommendations.length}
              </div>
              <div className="text-xs text-blue-700">생활패턴</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {report.hobby_recommendations.length}
              </div>
              <div className="text-xs text-purple-700">취미활동</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {report.personal_growth_tips.length}
              </div>
              <div className="text-xs text-green-700">성장지침</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// New personality report component
function PersonalityReportView({ report }: { report: PersonalityReport }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isPremium, isFree } = useSubscription();

  const handleShare = async () => {
    try {
      await navigator.share({
        title: "나의 성격분석 결과",
        text: report.summary,
        url: window.location.href,
      });
      toast({
        title: "공유 완료",
        description: "성격분석 결과를 공유했습니다.",
      });
    } catch (error) {
      // Fallback for browsers that don't support Web Share API
      handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      const reportText = `
🧠 나의 성격분석 결과

📝 요약
${report.summary}

💪 강점
${report.strengths.map(strength => `• ${strength}`).join("\n")}

🎯 개선점
${report.weaknesses.map(weakness => `• ${weakness}`).join("\n")}

🏠 생활패턴 추천
${report.lifestyle_recommendations.map(rec => `• ${rec}`).join("\n")}

🎨 취미 추천
${report.hobby_recommendations.map(hobby => `• ${hobby}`).join("\n")}

🌱 성장 팁
${report.personal_growth_tips.map(tip => `• ${tip}`).join("\n")}

멘탈튼튼에서 제공된 분석 결과입니다.
      `;

      await navigator.clipboard.writeText(reportText);
      toast({
        title: "복사 완료",
        description: "분석 결과가 클립보드에 복사되었습니다.",
      });
    } catch (error) {
      toast({
        title: "복사 실패",
        description: "다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">🧠 성격분석 리포트</CardTitle>
          <p className="text-gray-600">AI가 분석한 나만의 성격 보고서</p>
        </CardHeader>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            종합 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">{report.summary}</p>
        </CardContent>
      </Card>

      {/* Personality Chart */}
      <PersonalityChart report={report} />

      {/* Strengths */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            강점
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {report.strengths.map((strength, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="p-2 justify-start"
              >
                {strength}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weaknesses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-500" />
            개선점
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {report.weaknesses.map((weakness, index) => (
              <div key={index} className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{weakness}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lifestyle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              🏠 생활패턴 추천
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.lifestyle_recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Hobbies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              🎨 취미 추천
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.hobby_recommendations.map((hobby, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{hobby}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">🌱 성장 팁</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {report.personal_growth_tips.map((tip, index) => (
              <div key={index} className="p-3 bg-green-50 rounded-lg">
                <span className="text-green-800">{tip}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={handleShare} variant="outline" className="flex-1">
          <Share2 className="w-4 h-4 mr-2" />
          공유하기
        </Button>
        <Button onClick={handleCopy} variant="outline" className="flex-1">
          <Copy className="w-4 h-4 mr-2" />
          복사
        </Button>
      </div>

      <Separator />

      {/* Bottom Actions */}
      <div className="flex gap-4">
        <Button
          onClick={() => setLocation("/profile")}
          className="flex-1 h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium text-base shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Edit className="w-5 h-5 mr-3" />
          성향 및 관심사 수정
        </Button>
        <Button
          onClick={() => {
            if (isFree) {
              toast({
                title: "프리미엄 기능",
                description:
                  "성격분석 상세보기는 프리미엄 회원만 이용할 수 있습니다.",
                variant: "destructive",
              });
              setLocation("/subscription");
              return;
            }
            setLocation("/personality/overview");
          }}
          className="flex-1 h-14 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium text-base shadow-lg hover:shadow-xl transition-all duration-200 relative overflow-hidden"
        >
          {/* Premium badge - 우측 상단 모서리에만 표시 */}
          {isFree && (
            <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
              <Crown className="w-3 h-3 text-yellow-800" />
            </div>
          )}
          <Star className="w-5 h-5 mr-3 text-yellow-200" />
          상세보기
        </Button>
      </div>
    </div>
  );
}

export default function PersonalityPage() {
  const [user, setUser] = useState<User | null>(null);

  // 테스트용 사용자 자동 설정
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error("사용자 데이터 파싱 실패:", error);
        // 파싱 실패 시 강제 테스트 사용자 생성
        const testUser = {
          id: 1,
          uid: "test-user-uid",
          email: "test@example.com",
          name: "테스트 사용자",
          profileComplete: true,
          createdAt: new Date().toISOString(),
          provider: "email",
          mbti: "ENFP",
          birthDate: "1990-01-01",
          gender: "여성",
          occupation: "개발자",
          interests: ["독서", "영화감상", "운동"],
          personality: {
            logical: 70,
            emotional: 85,
            fun: 90,
          },
        };
        setUser(testUser);
        localStorage.setItem("user", JSON.stringify(testUser));
      }
    } else {
      // 테스트용 사용자 자동 생성 (완전한 프로필)
      const testUser = {
        id: 1,
        uid: "test-user-uid",
        email: "test@example.com",
        name: "테스트 사용자",
        profileComplete: true,
        createdAt: new Date().toISOString(),
        provider: "email",
        mbti: "ENFP",
        birthDate: "1990-01-01",
        gender: "여성",
        occupation: "개발자",
        interests: ["독서", "영화감상", "운동"],
        personality: {
          logical: 70,
          emotional: 85,
          fun: 90,
        },
      };
      setUser(testUser);
      localStorage.setItem("user", JSON.stringify(testUser));
      console.log("테스트 사용자 자동 생성 완료:", testUser);
    }
  }, []);

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = currentUser.id;

  const { data: userData, isLoading: userLoading } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const userHasProfileData =
    (userData?.interests?.length || 0) > 0 ||
    userData?.mbti ||
    userData?.personality;

  const {
    data: report,
    isLoading: reportLoading,
    error,
  } = useQuery<PersonalityReport>({
    queryKey: [`/api/users/${userId}/personality/report`],
    queryFn: () => personalityApi.getReport(userId),
    enabled: !!userData && !!userHasProfileData && !!userId,
  });

  if (!userId) {
    return (
      <div className="max-w-md mx-auto p-4">
        <Card>
          <CardContent className="text-center p-6">
            <p>로그인이 필요합니다.</p>
            <Button
              onClick={() => (window.location.href = "/login")}
              className="mt-4"
            >
              로그인하기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-4">
        <Card>
          <CardContent className="text-center p-6">
            <p>사용자 정보를 찾을 수 없습니다.</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              새로고침
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show form for new users (no profile data)
  if (!userHasProfileData) {
    return <PersonalityForm />;
  }

  // Show loading for report
  if (reportLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-gray-600">AI가 성격을 분석하고 있습니다...</p>
        </div>
      </div>
    );
  }

  // Show error fallback
  if (error || !report) {
    return (
      <div className="max-w-md mx-auto p-4">
        <Card>
          <CardContent className="text-center p-6 space-y-4">
            <p className="text-red-600">분석 리포트를 불러올 수 없습니다.</p>
            <Button onClick={() => window.location.reload()}>다시 시도</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show report for existing users
  return <PersonalityReportView report={report} />;
}
