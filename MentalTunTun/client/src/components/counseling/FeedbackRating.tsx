import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { feedbackApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface FeedbackRatingProps {
  userId: number;
  sessionId: number;
  messageId: number;
  personaType: string;
}

export function FeedbackRating({
  userId,
  sessionId,
  messageId,
  personaType,
}: FeedbackRatingProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitFeedbackMutation = useMutation({
    mutationFn: (data: { rating: number; feedbackText?: string }) =>
      feedbackApi.submitFeedback({
        userId,
        sessionId,
        messageId,
        personaType,
        ...data,
      }),
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const handleRatingClick = (value: number) => {
    setRating(value);
    if (!showFeedbackForm) {
      submitFeedbackMutation.mutate({ rating: value });
    }
  };

  const handleDetailedFeedback = () => {
    if (rating > 0) {
      submitFeedbackMutation.mutate({
        rating,
        feedbackText: feedbackText.trim() || undefined,
      });
    }
  };

  if (submitted) {
    return (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-green-600 text-center">
          피드백이 전송되었습니다. 감사합니다!
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-3">이 응답이 어땠나요?</p>

        <div className="flex justify-center space-x-2 mb-3">
          {[1, 2, 3, 4, 5].map(value => (
            <button
              key={value}
              className="text-2xl hover:scale-110 transition-transform"
              onMouseEnter={() => setHoveredRating(value)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => handleRatingClick(value)}
              disabled={submitFeedbackMutation.isPending}
            >
              <Star
                className={cn(
                  "w-6 h-6",
                  hoveredRating >= value || rating >= value
                    ? "text-yellow-400 fill-current"
                    : "text-gray-300"
                )}
              />
            </button>
          ))}
        </div>

        {!showFeedbackForm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFeedbackForm(true)}
            className="text-primary text-sm hover:underline"
          >
            상세 의견 남기기
          </Button>
        )}

        {showFeedbackForm && (
          <div className="mt-3 space-y-3">
            <Textarea
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              placeholder="더 구체적인 피드백을 남겨주세요... (선택사항)"
              className="text-sm"
              rows={3}
            />
            <div className="flex justify-center space-x-2">
              <Button
                size="sm"
                onClick={handleDetailedFeedback}
                disabled={rating === 0 || submitFeedbackMutation.isPending}
                className="gradient-primary"
              >
                {submitFeedbackMutation.isPending
                  ? "전송 중..."
                  : "피드백 전송"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFeedbackForm(false)}
              >
                취소
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
