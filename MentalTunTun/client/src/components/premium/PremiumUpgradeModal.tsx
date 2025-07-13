import { useState } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles, ArrowRight, Star } from "lucide-react";

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  title?: string;
  description?: string;
}

export function PremiumUpgradeModal({
  isOpen,
  onClose,
  feature = "프리미엄 기능",
  title = "프리미엄 구독이 필요합니다",
  description = "이 기능을 사용하려면 프리미엄 구독이 필요합니다.",
}: PremiumUpgradeModalProps) {
  const [, setLocation] = useLocation();

  const premiumFeatures = [
    "AI 상담 무제한 이용",
    "고급 AI 분석 엔진",
    "맞춤형 페르소나 생성",
    "실시간 감정 추적",
    "심화 성격 분석",
    "우선 고객 지원",
    "세션 기록 자동 저장",
    "스마트 스케줄링",
  ];

  const handleUpgrade = () => {
    onClose();
    setLocation("/subscription/premium");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Crown className="w-6 h-6 text-purple-600" />
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-600">
            {description}
          </DialogDescription>
        </DialogHeader>

        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 mb-3">
                <Star className="w-3 h-3 mr-1" />
                프리미엄 전용
              </Badge>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature}
              </h3>
            </div>

            <div className="space-y-2 mb-6">
              {premiumFeatures.slice(0, 4).map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                월 19,900원
              </div>
              <p className="text-sm text-gray-600 mb-4">언제든지 취소 가능</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-3"
          >
            <Crown className="w-4 h-4 mr-2" />
            프리미엄 구독하기
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <Button variant="outline" onClick={onClose} className="w-full">
            나중에 하기
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          7일 무료 체험 • 언제든지 취소 가능
        </p>
      </DialogContent>
    </Dialog>
  );
}
