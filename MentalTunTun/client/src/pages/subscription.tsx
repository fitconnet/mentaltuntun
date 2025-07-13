import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Check,
  X,
  Crown,
  Star,
  CreditCard,
  Calendar,
  Sparkles,
  Loader2,
} from "lucide-react";

const SUBSCRIPTION_PLANS = {
  free: {
    name: "무료 플랜",
    price: "0원",
    period: "영구 무료",
    badge: "FREE",
    badgeColor: "bg-gray-100 text-gray-800",
    features: [
      { name: "성격분석 기본 정보", included: true },
      { name: "감정 일기", included: true },
      { name: "컨텐츠 열람", included: true },
      { name: "AI 상담 채팅", included: true, limit: "2회 제한" },
      { name: "나는 누구?", included: true, limit: "1회 제한" },
      { name: "성격분석 상세정보", included: false },
      { name: "스케줄 관리", included: false },
      { name: "심리테스트", included: false },
      { name: "무제한 AI 상담", included: false },
      { name: "무제한 자기탐구", included: false },
    ],
  },
  premium: {
    name: "프리미엄 플랜",
    price: "9,900원",
    period: "매월 자동결제",
    badge: "PREMIUM",
    badgeColor: "bg-gradient-to-r from-purple-500 to-blue-500 text-white",
    features: [
      { name: "성격분석 기본 정보", included: true },
      { name: "성격분석 상세정보", included: true },
      { name: "감정 일기", included: true },
      { name: "스케줄 관리", included: true },
      { name: "심리테스트", included: true },
      { name: "컨텐츠 열람", included: true },
      { name: "나는 누구?", included: true, limit: "무제한" },
      { name: "감정 일기", included: true, limit: "무제한" },
      { name: "AI 상담", included: true, limit: "무제한" },
      { name: "우선 고객지원", included: true },
    ],
  },
};

const PAYMENT_OPTIONS = [
  {
    id: "monthly",
    name: "월간 자동결제",
    price: 9900,
    originalPrice: null,
    period: "매월",
    description: "매월 종료일에 자동 결제되며, 언제든 해지 가능",
    popular: true,
    savings: null,
  },
  {
    id: "onetime",
    name: "1개월 단기",
    price: 19900,
    originalPrice: null,
    period: "1회 결제",
    description: "1개월간 프리미엄 서비스 이용, 자동결제 없음",
    popular: false,
    savings: null,
  },
];

export default function Subscription() {
  const [selectedPlan, setSelectedPlan] = useState<string>("monthly");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // URL 파라미터에서 결제 정보 확인
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentKey = urlParams.get('paymentKey');
    const orderId = urlParams.get('orderId');
    const amount = urlParams.get('amount');
    const success = urlParams.get('success');

    // 토스페이먼츠 결제 성공 후 승인 처리
    if (paymentKey && orderId && amount && success === 'true') {
      handlePaymentSuccess(paymentKey, orderId, parseInt(amount));
    } else if (success === 'false') {
      toast({
        title: "결제 실패",
        description: "결제가 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  }, []);

  // 토스페이먼츠 결제 승인 처리
  const handlePaymentSuccess = async (paymentKey: string, orderId: string, amount: number) => {
    setPaymentProcessing(true);
    try {
      const response = await fetch('/api/subscription/toss/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "결제 완료",
          description: "프리미엄 구독이 성공적으로 활성화되었습니다!",
        });
        
        // 결제 성공 후 홈으로 이동
        setTimeout(() => {
          setLocation('/');
        }, 2000);
      } else {
        toast({
          title: "결제 승인 실패",
          description: result.message || "결제 승인 처리에 실패했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
      toast({
        title: "결제 승인 오류",
        description: "결제 승인 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setPaymentProcessing(false);
      
      // URL에서 결제 관련 파라미터 제거
      const url = new URL(window.location.href);
      url.searchParams.delete('paymentKey');
      url.searchParams.delete('orderId');
      url.searchParams.delete('amount');
      url.searchParams.delete('success');
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleSubscribe = (planId: string) => {
    // 실제 토스페이먼츠 결제는 subscription-premium 페이지에서 처리
    setLocation('/subscription-premium');
  };

  // 결제 처리 중 로딩 화면
  if (paymentProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">결제 처리 중</h2>
            <p className="text-gray-600">
              결제 승인을 처리하고 있습니다. 잠시만 기다려주세요...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const FeatureRow = ({
    feature,
    planType,
  }: {
    feature: any;
    planType: "free" | "premium";
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center gap-3">
        {feature.included ? (
          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
        ) : (
          <X className="w-5 h-5 text-gray-300 flex-shrink-0" />
        )}
        <span
          className={`text-sm ${feature.included ? "text-gray-900" : "text-gray-400"}`}
        >
          {feature.name}
        </span>
      </div>
      {feature.limit && (
        <Badge variant="outline" className="text-xs">
          {feature.limit}
        </Badge>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Crown className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">구독 플랜</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          멘탈튼튼의 모든 기능을 자유롭게 이용하고 더 깊이 있는 자기 탐구를
          시작하세요
        </p>
      </div>

      {/* Plan Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Free Plan */}
        <Card className="relative shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Badge className={SUBSCRIPTION_PLANS.free.badgeColor}>
                {SUBSCRIPTION_PLANS.free.badge}
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {SUBSCRIPTION_PLANS.free.name}
            </CardTitle>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-gray-900">
                {SUBSCRIPTION_PLANS.free.price}
              </div>
              <p className="text-sm text-gray-500">
                {SUBSCRIPTION_PLANS.free.period}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-1">
              {SUBSCRIPTION_PLANS.free.features.map((feature, index) => (
                <FeatureRow key={index} feature={feature} planType="free" />
              ))}
            </div>
            <Button variant="outline" className="w-full" disabled>
              현재 이용중
            </Button>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className="relative shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-purple-200">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-1 text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-1" />
              추천
            </Badge>
          </div>

          <CardHeader className="text-center pb-6 pt-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Badge className={SUBSCRIPTION_PLANS.premium.badgeColor}>
                {SUBSCRIPTION_PLANS.premium.badge}
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {SUBSCRIPTION_PLANS.premium.name}
            </CardTitle>
            <div className="space-y-1">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {SUBSCRIPTION_PLANS.premium.price}
              </div>
              <p className="text-sm text-gray-500">
                {SUBSCRIPTION_PLANS.premium.period}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-1">
              {SUBSCRIPTION_PLANS.premium.features.map((feature, index) => (
                <FeatureRow key={index} feature={feature} planType="premium" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call to Action */}
      <div className="text-center space-y-6 bg-gradient-to-r from-purple-50 to-blue-50 p-8 rounded-2xl">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">
            프리미엄으로 더 깊이 있는 자기 탐구를 시작하세요
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            무제한 AI 상담, 전문 심리테스트, 상세한 성격분석까지. 멘탈튼튼의
            모든 서비스를 자유롭게 이용하며 더 나은 나를 발견해보세요.
          </p>
        </div>
      </div>

      {/* Payment Options */}
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            결제 방식 선택
          </h3>
          <p className="text-gray-600">원하는 결제 방식을 선택하세요</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {PAYMENT_OPTIONS.map(option => (
            <Card
              key={option.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedPlan === option.id
                  ? "border-2 border-purple-500 shadow-lg"
                  : "border border-gray-200 hover:border-purple-300"
              } ${option.popular ? "relative" : ""}`}
              onClick={() => setSelectedPlan(option.id)}
            >
              {option.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-500 text-white px-3 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    인기
                  </Badge>
                </div>
              )}

              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">
                      {option.name}
                    </h4>
                    <p className="text-sm text-gray-500">{option.period}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">
                      {option.price.toLocaleString()}원
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  {option.description}
                </p>

                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      selectedPlan === option.id
                        ? "border-purple-500 bg-purple-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedPlan === option.id && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    선택됨
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payment Button */}
        <div className="text-center">
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={() => handleSubscribe(selectedPlan)}
          >
            <CreditCard className="w-5 h-5 mr-2" />
            {selectedPlan === "monthly"
              ? "월간 구독 시작하기"
              : "1개월 이용권 구매하기"}
          </Button>

          <div className="mt-4 space-y-2 text-sm text-gray-500">
            <p>• 언제든지 구독을 해지할 수 있습니다</p>
            <p>• 결제는 안전하게 암호화되어 처리됩니다</p>
            <p>• 문의사항은 고객센터로 연락해주세요</p>
          </div>
        </div>
      </div>
    </div>
  );
}
