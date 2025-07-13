import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  Zap,
  Sparkles,
  TrendingUp,
  Clock,
  Users,
  Shield,
  Crown,
  Heart,
  MessageSquare,
} from "lucide-react";

interface PremiumFeatureCardProps {
  title: string;
  description: string;
  aiModel: string;
  features: string[];
  demoData?: any;
  tier: "premium" | "pro";
}

export function PremiumAIFeatureDemo({
  title,
  description,
  aiModel,
  features,
  demoData,
  tier,
}: PremiumFeatureCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const tierConfig = {
    premium: {
      color: "purple",
      icon: Crown,
      badge: "프리미엄",
      gradient: "from-purple-100 to-blue-100",
    },
    pro: {
      color: "amber",
      icon: Sparkles,
      badge: "프로",
      gradient: "from-amber-100 to-orange-100",
    },
  };

  const config = tierConfig[tier];
  const IconComponent = config.icon;

  return (
    <Card
      className={`bg-gradient-to-br ${config.gradient} border-2 border-${config.color}-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-${config.color}-500 text-white`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">
                {title}
              </CardTitle>
              <Badge
                variant="secondary"
                className={`mt-1 bg-${config.color}-100 text-${config.color}-700`}
              >
                {config.badge} • {aiModel}
              </Badge>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
          {description}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* AI Features List */}
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI 기능
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {features
              .slice(0, isExpanded ? features.length : 3)
              .map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Zap
                    className={`w-3 h-3 text-${config.color}-500 flex-shrink-0`}
                  />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
          </div>

          {features.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-purple-600 hover:text-purple-700 p-0 h-auto"
            >
              {isExpanded ? "접기" : `더보기 (+${features.length - 3}개)`}
            </Button>
          )}
        </div>

        {/* Live Demo Data */}
        {demoData && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              실시간 분석 예시
            </h4>

            {tier === "premium" && demoData.emotionAnalysis && (
              <div className="bg-white rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">감정 상태</span>
                  <Badge className="bg-blue-100 text-blue-700 text-xs">
                    {demoData.emotionAnalysis.current}
                  </Badge>
                </div>
                <Progress
                  value={demoData.emotionAnalysis.stability}
                  className="h-2"
                />
                <p className="text-xs text-gray-600">
                  안정도: {demoData.emotionAnalysis.stability}%
                </p>
              </div>
            )}

            {tier === "pro" && demoData.advancedInsights && (
              <div className="bg-white rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">고급 분석 결과</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <div className="text-lg font-bold text-amber-600">
                      {demoData.advancedInsights.riskScore}%
                    </div>
                    <div className="text-xs text-gray-600">위험도</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {demoData.advancedInsights.wellbeingScore}%
                    </div>
                    <div className="text-xs text-gray-600">웰빙지수</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Usage Statistics */}
        <div className="bg-white rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              이번 달 사용량
            </span>
            <Clock className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">AI 상담</span>
              <span className="font-medium">
                {tier === "premium" ? "무제한" : "무제한+"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">고급 분석</span>
              <span className="font-medium">
                {tier === "premium" ? "50회" : "무제한"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">우선 지원</span>
              <span className={`font-medium text-${config.color}-600`}>
                {tier === "premium" ? "비즈니스 시간" : "24/7"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button
          className={`w-full bg-gradient-to-r from-${config.color}-500 to-${config.color}-600 hover:from-${config.color}-600 hover:to-${config.color}-700 text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200`}
        >
          <IconComponent className="w-4 h-4 mr-2" />
          {tier === "premium" ? "프리미엄 체험하기" : "프로 플랜 시작하기"}
        </Button>
      </CardContent>
    </Card>
  );
}

// Premium AI Features Showcase
export function PremiumAIShowcase() {
  const premiumFeatures = [
    "GPT-4o mini 고급 엔진",
    "실시간 감정 상태 분석",
    "개인화된 상담 페르소나",
    "심화 성격 분석 리포트",
    "예측적 감정 패턴 분석",
    "맞춤형 치료 계획 수립",
    "감정 트렌드 추적",
    "스마트 알림 시스템",
  ];

  const proFeatures = [
    "GPT-4o 최고급 엔진",
    "고급 심리 치료 시스템",
    "예측적 멘탈 헬스 분석",
    "실시간 위험도 평가",
    "커스텀 AI 모델링",
    "전문가급 상담 품질",
    "24/7 모니터링 시스템",
    "팀/가족 계정 관리",
    "API 액세스 권한",
    "데이터 내보내기",
  ];

  const mockPremiumData = {
    emotionAnalysis: {
      current: "안정적",
      stability: 78,
      trend: "개선됨",
    },
  };

  const mockProData = {
    advancedInsights: {
      riskScore: 15,
      wellbeingScore: 82,
      predictions: ["스트레스 증가 가능성", "회복 경향"],
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <PremiumAIFeatureDemo
        title="프리미엄 AI 상담"
        description="GPT-4o mini 엔진으로 구동되는 고급 AI 상담사가 개인화된 심리 분석과 맞춤형 치료를 제공합니다."
        aiModel="GPT-4o mini"
        features={premiumFeatures}
        demoData={mockPremiumData}
        tier="premium"
      />

      <PremiumAIFeatureDemo
        title="프로 AI 치료 시스템"
        description="최고급 GPT-4o 엔진과 전문가급 심리 치료 알고리즘으로 예측적 분석과 고급 치료를 제공합니다."
        aiModel="GPT-4o"
        features={proFeatures}
        demoData={mockProData}
        tier="pro"
      />
    </div>
  );
}
