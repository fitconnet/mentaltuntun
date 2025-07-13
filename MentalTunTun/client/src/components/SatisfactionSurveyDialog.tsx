import { useState } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Crown, MessageCircle, Heart, Sparkles } from "lucide-react";

interface SatisfactionSurveyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  serviceType: "counseling" | "self-discovery";
}

export function SatisfactionSurveyDialog({
  isOpen,
  onClose,
  serviceType,
}: SatisfactionSurveyDialogProps) {
  const [, setLocation] = useLocation();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const handleSubscribe = () => {
    onClose();
    setLocation("/subscription");
  };

  const handleCancel = () => {
    onClose();
    setLocation("/");
  };

  const serviceInfo = {
    counseling: {
      title: "AI 상담 서비스",
      icon: MessageCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    "self-discovery": {
      title: "나는 누구? 자아탐색",
      icon: Heart,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
  };

  const service = serviceInfo[serviceType];
  const ServiceIcon = service.icon;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div
            className={`w-16 h-16 mx-auto ${service.bgColor} rounded-full flex items-center justify-center mb-4`}
          >
            <ServiceIcon className={`w-8 h-8 ${service.color}`} />
          </div>
          <DialogTitle className="text-xl font-bold">
            무료 체험이 종료되었습니다
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            <span className="font-medium">{service.title}</span> 무료 체험을
            모두 사용하셨습니다.
            <br />
            서비스가 어떠셨는지 알려주세요!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* 만족도 평가 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              서비스 만족도를 평가해주세요
            </Label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-colors hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300 hover:text-yellow-400"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* 피드백 */}
          <div className="space-y-3">
            <Label htmlFor="feedback" className="text-sm font-medium">
              개선사항이나 의견을 남겨주세요 (선택)
            </Label>
            <Textarea
              id="feedback"
              placeholder="서비스에 대한 의견을 자유롭게 작성해주세요..."
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              className="min-h-[80px] text-sm"
            />
          </div>

          {/* 프리미엄 혜택 안내 */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-purple-800">
                프리미엄 구독 혜택
              </span>
            </div>
            <ul className="text-sm text-purple-700 space-y-1 ml-7">
              <li>• 무제한 AI 상담 이용</li>
              <li>• 무제한 자아탐색 세션</li>
              <li>• 성격분석 상세보기</li>
              <li>• 전문적인 심리테스트</li>
              <li>• 우선 고객지원</li>
            </ul>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3 pt-2">
            <Button onClick={handleCancel} variant="outline" className="flex-1">
              다음에 할게요
            </Button>
            <Button
              onClick={handleSubscribe}
              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              프리미엄 구독
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
