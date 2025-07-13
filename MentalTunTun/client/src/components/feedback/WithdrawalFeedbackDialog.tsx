import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  DollarSign,
  Clock,
  Smartphone,
  MessageSquare,
  Lightbulb,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

interface WithdrawalFeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  userId: number;
  userName?: string;
}

const withdrawalReasons = [
  {
    id: "price",
    label: "가격이 비싸서",
    icon: DollarSign,
    color: "text-red-500",
  },
  {
    id: "features",
    label: "원하는 기능이 부족해서",
    icon: Heart,
    color: "text-purple-500",
  },
  {
    id: "time",
    label: "사용할 시간이 없어서",
    icon: Clock,
    color: "text-blue-500",
  },
  {
    id: "difficulty",
    label: "사용법이 어려워서",
    icon: Smartphone,
    color: "text-orange-500",
  },
  {
    id: "ai_quality",
    label: "AI 상담 품질이 아쉬워서",
    icon: MessageSquare,
    color: "text-green-500",
  },
  {
    id: "alternative",
    label: "다른 서비스를 이용하게 되어서",
    icon: Lightbulb,
    color: "text-yellow-500",
  },
];

export default function WithdrawalFeedbackDialog({
  open,
  onClose,
  onComplete,
  userId,
  userName = "사용자",
}: WithdrawalFeedbackDialogProps) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const feedbackMutation = useMutation({
    mutationFn: async (feedbackData: any) => {
      const response = await fetch("/api/user-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackData),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("피드백 저장에 실패했습니다.");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({ description: "소중한 의견 감사합니다 🙏" });
      onComplete();
      onClose();
    },
    onError: (error: Error) => {
      toast({ description: error.message, variant: "destructive" });
    },
  });

  const handleReasonToggle = (reasonId: string) => {
    setSelectedReasons(prev =>
      prev.includes(reasonId)
        ? prev.filter(id => id !== reasonId)
        : [...prev, reasonId]
    );
  };

  const handleSubmitFeedback = () => {
    if (selectedReasons.length === 0 && !message.trim()) {
      toast({
        description: "탈퇴 사유를 선택하거나 의견을 작성해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const feedbackData = {
      type: "withdrawal",
      category: "user_withdrawal",
      reasons: selectedReasons,
      message: message.trim() || null,
      metadata: {
        userName,
        timestamp: new Date().toISOString(),
      },
    };

    feedbackMutation.mutate(feedbackData);
  };

  const handleSkipFeedback = () => {
    onComplete();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            😢 정말 아쉬워요, {userName}님
          </DialogTitle>
          <DialogDescription className="text-gray-600 leading-relaxed">
            멘탈튼튼을 떠나시게 되어 정말 아쉽습니다. 더 나은 서비스를 위해 탈퇴
            사유를 알려주시면 큰 도움이 됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 탈퇴 사유 선택 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              🤔 어떤 이유로 탈퇴하시나요?
              <Badge variant="outline" className="text-xs">
                복수 선택 가능
              </Badge>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {withdrawalReasons.map(reason => {
                const IconComponent = reason.icon;
                const isSelected = selectedReasons.includes(reason.id);

                return (
                  <Card
                    key={reason.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected
                        ? "ring-2 ring-purple-500 bg-purple-50"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleReasonToggle(reason.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleReasonToggle(reason.id)}
                        />
                        <IconComponent className={`w-5 h-5 ${reason.color}`} />
                        <span className="text-sm font-medium text-gray-900 flex-1">
                          {reason.label}
                        </span>
                        {isSelected && (
                          <ChevronRight className="w-4 h-4 text-purple-500" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* 자유 의견 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              💭 더 하고 싶은 말씀이 있나요?
              <Badge variant="secondary" className="text-xs">
                선택사항
              </Badge>
            </h3>

            <Textarea
              placeholder="서비스 개선을 위한 소중한 의견을 들려주세요. 어떤 기능이 있었으면 좋겠는지, 아쉬웠던 점은 무엇인지 자유롭게 작성해주세요."
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {message.length}/500
            </div>
          </div>

          {/* 안내 메시지 */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">🔒 개인정보 보호</p>
                  <p className="text-blue-700">
                    피드백은 서비스 개선 목적으로만 활용되며, 개인을 식별할 수
                    있는 정보는 안전하게 보호됩니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleSkipFeedback}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            의견 없이 탈퇴하기
          </Button>
          <Button
            onClick={handleSubmitFeedback}
            disabled={isSubmitting}
            className="w-full sm:w-auto order-1 sm:order-2 bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? "저장 중..." : "의견 제출 후 탈퇴하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
