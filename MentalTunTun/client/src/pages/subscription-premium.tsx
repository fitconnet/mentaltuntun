import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PremiumAIShowcase } from "@/components/premium/PremiumAIFeatureDemo";
import {
  Crown,
  Zap,
  Brain,
  Users,
  Calendar,
  MessageSquare,
  Star,
  Check,
  ArrowRight,
  Sparkles,
  Shield,
} from "lucide-react";

// 토스페이먼츠 SDK 타입 정의
declare global {
  interface Window {
    TossPayments: any;
  }
}

// Premium subscription tiers
const SUBSCRIPTION_TIERS = [
  {
    id: "free",
    name: "무료 플랜",
    displayName: "Free",
    price: 0,
    currency: "KRW",
    billingInterval: "monthly",
    popular: false,
    features: [
      "AI 상담 2회/월",
      "자아탐색 1회/월",
      "기본 감정 분석",
      "심리테스트 이용",
      "기본 페르소나 3개",
      "커뮤니티 지원",
    ],
    limitations: [
      "고급 AI 기능 제한",
      "맞춤형 페르소나 불가",
      "심화 분석 제한",
      "우선 지원 없음",
    ],
    color: "gray",
    gradient: "from-gray-100 to-gray-200",
  },
  {
    id: "premium",
    name: "프리미엄 플랜",
    displayName: "Premium",
    price: 19900,
    currency: "KRW",
    billingInterval: "monthly",
    popular: true,
    features: [
      "AI 상담 무제한",
      "자아탐색 무제한",
      "GPT-4o mini 고급 엔진",
      "맞춤형 페르소나 생성",
      "실시간 감정 추적",
      "심화 성격 분석",
      "개인화 분석 시스템",
      "종합 리포트 생성",
      "우선 고객 지원",
      "세션 기록 자동 저장",
      "캘린더 연동",
      "전문가 추천 기능",
    ],
    aiCredits: 0, // unlimited
    maxSessions: 0, // unlimited
    advancedAI: true,
    customPersonas: true,
    prioritySupport: true,
    color: "purple",
    gradient: "from-purple-100 to-blue-200",
  },
  {
    id: "pro",
    name: "프로 플랜",
    displayName: "Pro",
    price: 39900,
    currency: "KRW",
    billingInterval: "monthly",
    popular: false,
    features: [
      "프리미엄의 모든 기능",
      "GPT-4o 최고급 엔진",
      "전문가급 심리 분석",
      "고급 심리 치료 시스템",
      "예측적 분석 모듈",
      "커스텀 AI 모델링",
      "실시간 위험도 평가",
      "가족/팀 계정 관리",
      "데이터 내보내기",
      "24시간 전문가 지원",
      "API 접근 권한",
      "맞춤형 리포트 생성",
    ],
    aiCredits: 0, // unlimited
    maxSessions: 0, // unlimited
    advancedAI: true,
    customPersonas: true,
    prioritySupport: true,
    teamAccounts: true,
    apiAccess: true,
    color: "gold",
    gradient: "from-yellow-100 to-orange-200",
  },
];

export default function SubscriptionPremium() {
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string>("premium");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [tossPayments, setTossPayments] = useState<any>(null);
  const { toast } = useToast();
  const { plan: currentPlan, isPremium, isAdmin } = useSubscription();

  // 토스페이먼츠 SDK 로드
  useEffect(() => {
    const loadTossPayments = async () => {
      if (!window.TossPayments) {
        const script = document.createElement('script');
        script.src = 'https://js.tosspayments.com/v1/payment';
        script.async = true;
        document.head.appendChild(script);
        
        script.onload = () => {
          // TODO: 실제 클라이언트 키로 교체하세요
          const clientKey = import.meta.env.VITE_TOSS_PAYMENTS_CLIENT_KEY || 'test_ck_test_client_key_here';
          setTossPayments(window.TossPayments(clientKey));
        };
      } else {
        const clientKey = import.meta.env.VITE_TOSS_PAYMENTS_CLIENT_KEY || 'test_ck_test_client_key_here';
        setTossPayments(window.TossPayments(clientKey));
      }
    };

    loadTossPayments();
  }, []);

  // Current user subscription info
  const { data: currentSubscription } = useQuery({
    queryKey: ["/api/subscription/current"],
    staleTime: 5 * 60 * 1000,
  });

  // Subscription upgrade mutation - 토스페이먼츠로 전환
  const upgradeMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingCycle }),
      });

      if (!response.ok) {
        throw new Error("구독 업그레이드에 실패했습니다.");
      }

      return response.json();
    },
    onSuccess: async (data) => {
      if (data.paymentData && tossPayments) {
        try {
          // 토스페이먼츠 결제창 호출
          await tossPayments.requestPayment('카드', {
            amount: data.paymentData.amount,
            orderId: data.paymentData.orderId,
            orderName: data.paymentData.orderName,
            customerName: data.paymentData.customerName,
            customerEmail: data.paymentData.customerEmail,
            successUrl: data.paymentData.successUrl,
            failUrl: data.paymentData.failUrl,
          });
        } catch (error: any) {
          if (error.code === 'USER_CANCEL') {
            toast({
              title: "결제 취소",
              description: "사용자가 결제를 취소했습니다.",
            });
          } else {
            toast({
              title: "결제 실패",
              description: error.message || "결제 처리 중 오류가 발생했습니다.",
              variant: "destructive",
            });
          }
        }
      } else {
        toast({
          title: "구독 업그레이드 완료",
          description: "프리미엄 기능을 이용하실 수 있습니다.",
        });
        setLocation("/");
      }
    },
    onError: (error: any) => {
      toast({
        title: "구독 실패",
        description: error.message || "구독 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleUpgrade = (planId: string) => {
    if (isAdmin) {
      toast({
        title: "관리자 계정",
        description: "관리자는 모든 기능을 무료로 이용할 수 있습니다.",
      });
      return;
    }

    if (!tossPayments) {
      toast({
        title: "결제 모듈 로딩 중",
        description: "결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.",
      });
      return;
    }

    upgradeMutation.mutate(planId);
  };

  const getDiscountPrice = (price: number) => {
    return billingCycle === "yearly" ? Math.floor(price * 10) : price; // 20% discount for yearly
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 pt-20 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              프리미엄 구독
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-6">
            AI의 힘으로 더욱 깊이 있는 마음 건강 관리를 경험하세요
          </p>

          {/* Premium AI Features Showcase */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                🧠 고급 AI 기능
              </h2>
              <p className="text-lg text-gray-600">
                최신 AI 기술로 구현된 프리미엄 멘탈 헬스 케어
              </p>
            </div>
            <PremiumAIShowcase />
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span
              className={`text-sm ${billingCycle === "monthly" ? "text-gray-900 font-medium" : "text-gray-500"}`}
            >
              월간 결제
            </span>
            <button
              onClick={() =>
                setBillingCycle(
                  billingCycle === "monthly" ? "yearly" : "monthly"
                )
              }
              className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${
                billingCycle === "yearly" ? "bg-purple-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingCycle === "yearly" ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
            <span
              className={`text-sm ${billingCycle === "yearly" ? "text-gray-900 font-medium" : "text-gray-500"}`}
            >
              연간 결제
              <Badge variant="secondary" className="ml-2">
                20% 할인
              </Badge>
            </span>
          </div>
        </div>

        {/* Current Subscription Status */}
        {currentSubscription && (
          <Card className="mb-8 bg-gradient-to-r from-purple-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">현재 구독 상태</h3>
                  <p className="text-purple-100">
                    {currentSubscription.planName} •
                    {currentSubscription.status === "active"
                      ? " 활성"
                      : " 비활성"}{" "}
                    •
                    {currentSubscription.endDate &&
                      ` ${new Date(currentSubscription.endDate).toLocaleDateString("ko-KR")}까지`}
                  </p>
                </div>
                <Crown className="w-8 h-8 text-yellow-300" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {SUBSCRIPTION_TIERS.map(tier => (
            <Card
              key={tier.id}
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                tier.popular
                  ? "ring-2 ring-purple-500 shadow-xl scale-105"
                  : "shadow-lg"
              } ${selectedPlan === tier.id ? "ring-2 ring-blue-500" : ""}`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 text-sm font-medium">
                  <Star className="w-4 h-4 inline mr-1" />
                  인기
                </div>
              )}

              <CardHeader className={`bg-gradient-to-r ${tier.gradient} p-6`}>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {tier.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-900">
                      {billingCycle === "yearly" && tier.price > 0
                        ? `₩${getDiscountPrice(tier.price).toLocaleString()}`
                        : tier.price === 0
                          ? "무료"
                          : `₩${tier.price.toLocaleString()}`}
                    </span>
                    {tier.price > 0 && (
                      <span className="text-sm text-gray-600">
                        /{billingCycle === "yearly" ? "년" : "월"}
                      </span>
                    )}
                  </div>
                  {billingCycle === "yearly" && tier.price > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="line-through">
                        ₩{(tier.price * 12).toLocaleString()}
                      </span>
                      <span className="text-green-600 font-medium ml-2">
                        ₩{getDiscountPrice(tier.price).toLocaleString()} 절약
                      </span>
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {tier.limitations && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">제한사항:</p>
                      {tier.limitations.map((limitation, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 mb-1"
                        >
                          <div className="w-4 h-4 flex-shrink-0 rounded-full bg-gray-200"></div>
                          <span className="text-xs text-gray-500">
                            {limitation}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  {tier.id === "free" ? (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => setLocation("/")}
                    >
                      현재 플랜
                    </Button>
                  ) : currentPlan === tier.id ? (
                    <Button className="w-full" disabled>
                      현재 사용 중
                    </Button>
                  ) : (
                    <Button
                      className={`w-full ${tier.popular ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" : ""}`}
                      onClick={() => handleUpgrade(tier.id)}
                      disabled={upgradeMutation.isPending}
                    >
                      {upgradeMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          처리 중...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          업그레이드
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enhanced AI Features Section */}
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
              <Brain className="w-6 h-6 text-purple-600" />
              프리미엄 AI 기능
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  고급 AI 엔진
                </h4>
                <p className="text-sm text-gray-600">
                  최신 GPT-4o 모델을 활용한 더욱 정교하고 개인화된 상담 서비스
                </p>
              </div>

              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  맞춤형 페르소나
                </h4>
                <p className="text-sm text-gray-600">
                  당신만을 위한 AI 상담사 페르소나를 직접 생성하고 커스터마이징
                </p>
              </div>

              <div className="text-center p-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  스마트 스케줄링
                </h4>
                <p className="text-sm text-gray-600">
                  AI가 추천하는 최적의 상담 시간과 자동 리마인더 시스템
                </p>
              </div>

              <div className="text-center p-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-yellow-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  실시간 분석
                </h4>
                <p className="text-sm text-gray-600">
                  대화 중 실시간 감정 상태 분석과 즉시 피드백 제공
                </p>
              </div>

              <div className="text-center p-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">우선 지원</h4>
                <p className="text-sm text-gray-600">
                  전담 고객 지원팀을 통한 24시간 우선 응답 서비스
                </p>
              </div>

              <div className="text-center p-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-indigo-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  전문가급 분석
                </h4>
                <p className="text-sm text-gray-600">
                  심리학 전문가 수준의 깊이 있는 성격 분석과 맞춤형 조언
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            자주 묻는 질문
          </h3>
          <div className="space-y-4 text-left max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  언제든지 구독을 취소할 수 있나요?
                </h4>
                <p className="text-sm text-gray-600">
                  네, 언제든지 구독을 취소하실 수 있습니다. 취소 후에도 현재
                  결제 주기가 끝날 때까지 프리미엄 기능을 이용하실 수 있습니다.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  프리미엄 기능은 즉시 사용할 수 있나요?
                </h4>
                <p className="text-sm text-gray-600">
                  결제 완료 즉시 모든 프리미엄 기능을 이용하실 수 있습니다. 기존
                  데이터는 그대로 유지됩니다.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  데이터는 안전하게 보호되나요?
                </h4>
                <p className="text-sm text-gray-600">
                  모든 개인 데이터는 엔드투엔드 암호화되어 안전하게 보호됩니다.
                  개인정보는 상담 서비스 개선 목적으로만 사용됩니다.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
