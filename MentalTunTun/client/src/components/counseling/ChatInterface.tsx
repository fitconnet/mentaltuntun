import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { chatApi, counselingApi, invalidateCache } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Brain,
  Heart,
  Smile,
  Send,
  Star,
  MoreVertical,
  Copy,
  ThumbsUp,
  ThumbsDown,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage, CounselingSession } from "@/types";
import { FeedbackRating } from "./FeedbackRating";

interface ChatInterfaceProps {
  session: CounselingSession;
  userId: number;
  onEndSession?: () => void;
}

const personaConfig = {
  strategic: {
    icon: Brain,
    gradient: "bg-gradient-to-r from-blue-500 to-blue-600",
    name: "냉철한 전략가",
  },
  empathetic: {
    icon: Heart,
    gradient: "bg-gradient-to-r from-pink-500 to-purple-500",
    name: "감성 공감형",
  },
  cheerful: {
    icon: Smile,
    gradient: "bg-gradient-to-r from-yellow-500 to-orange-500",
    name: "유쾌한 조언가",
  },
};

export function ChatInterface({
  session,
  userId,
  onEndSession,
}: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const config = personaConfig[session.personaType];
  const Icon = config.icon;
  const { toast } = useToast();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["/api/sessions", session.id, "messages"],
    queryFn: () => chatApi.getMessages(session.id),
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => chatApi.sendMessage(session.id, content),
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: () => {
      invalidateCache.messages(session.id);
      setMessage("");
      setIsTyping(false);
    },
    onError: () => {
      setIsTyping(false);
    },
  });

  const endSessionMutation = useMutation({
    mutationFn: () => counselingApi.endSession(session.id),
    onSuccess: () => {
      invalidateCache.sessions(userId);
      toast({
        title: "상담 종료",
        description: "상담이 종료되었습니다.",
        duration: 2000,
      });
      if (onEndSession) {
        onEndSession();
      }
    },
    onError: () => {
      toast({
        title: "오류 발생",
        description: "상담 종료에 실패했습니다.",
        variant: "destructive",
        duration: 2000,
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  // 메시지 복사 기능
  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "복사 완료",
        description: "메시지가 클립보드에 복사되었습니다.",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "복사 실패",
        description: "메시지 복사에 실패했습니다.",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  // 메시지 좋아요/싫어요 피드백
  const handleMessageFeedback = async (messageId: number, rating: number) => {
    try {
      // 여기에 피드백 API 호출 추가
      toast({
        title: "피드백 완료",
        description:
          rating > 3
            ? "긍정적인 피드백을 주셔서 감사합니다!"
            : "피드백을 주셔서 감사합니다. 더 나은 서비스로 보답하겠습니다.",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "피드백 실패",
        description: "피드백 전송에 실패했습니다.",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  // 상담 종료 처리 (바로 종료)
  const handleEndCounselingDirectly = () => {
    setShowEndDialog(false);
    endSessionMutation.mutate();
  };

  // 상담 종료 + 후기 작성
  const handleEndWithReview = () => {
    setShowEndDialog(false);
    setShowReviewDialog(true);
  };

  // 후기 작성 완료
  const handleSubmitReview = () => {
    if (reviewText.trim() && rating > 0) {
      // 후기 저장 API 호출 (실제 구현 필요)
      toast({
        title: "후기 작성 완료",
        description: "소중한 후기를 주셔서 감사합니다!",
        duration: 3000,
      });
    }

    setShowReviewDialog(false);
    setReviewText("");
    setRating(0);

    // 세션 종료 API 호출
    endSessionMutation.mutate();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card className="mobile-chat flex flex-col h-[calc(100vh-8rem)] sm:h-[600px]">
      {/* Chat Header */}
      <div className="mobile-chat-header border-b border-gray-100">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div
            className={cn(
              "w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center",
              config.gradient
            )}
          >
            <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h4 className="mobile-title font-bold text-gray-800">
              {config.name}
            </h4>
            <p className="mobile-text text-gray-500">
              {isTyping ? "응답 중..." : "온라인"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto mobile-chat">
        {messages.length === 0 && (
          <div className="text-center py-6 sm:py-8">
            <div
              className={cn(
                "w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4",
                config.gradient
              )}
            >
              <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="mobile-title font-semibold text-gray-800 mb-2">
              상담을 시작해보세요
            </h3>
            <p className="mobile-text text-gray-600">
              무엇이든 편하게 말씀해 주세요. 함께 이야기 나누어요.
            </p>
          </div>
        )}

        {messages.map((msg: ChatMessage) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-2 sm:gap-3 mb-3 sm:mb-4",
              msg.role === "user" ? "justify-end" : ""
            )}
          >
            {msg.role === "assistant" && (
              <div className="flex-shrink-0">
                <div
                  className={cn(
                    "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center",
                    config.gradient
                  )}
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
              </div>
            )}

            <div
              className={cn(
                "flex-1 max-w-[75%] sm:max-w-md",
                msg.role === "user" ? "flex justify-end" : ""
              )}
            >
              <div
                className={cn(
                  "rounded-lg sm:rounded-2xl p-3 sm:p-4",
                  msg.role === "user"
                    ? "bg-gradient-to-r from-primary to-secondary text-white rounded-tr-sm"
                    : "bg-gray-50 text-gray-800 rounded-tl-sm"
                )}
              >
                <p className="mobile-text text-balance leading-relaxed">
                  {msg.content}
                </p>
              </div>
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyMessage(msg.content)}
                    className="mobile-button h-8 w-8 p-0 hover:bg-gray-200"
                    title="복사하기"
                  >
                    <Copy className="w-3 h-3 text-gray-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMessageFeedback(msg.id, 5)}
                    className="mobile-button h-8 w-8 p-0 hover:bg-gray-200"
                    title="좋아요"
                  >
                    <ThumbsUp className="w-3 h-3 text-gray-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMessageFeedback(msg.id, 1)}
                    className="mobile-button h-8 w-8 p-0 hover:bg-gray-200"
                    title="싫어요"
                  >
                    <ThumbsDown className="w-3 h-3 text-gray-400" />
                  </Button>
                </div>
              )}
            </div>

            {msg.role === "user" && (
              <div className="flex-shrink-0">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-xs">👤</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="flex-shrink-0">
              <div
                className={cn(
                  "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center",
                  config.gradient
                )}
              >
                <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <div className="bg-gray-50 rounded-lg sm:rounded-2xl rounded-tl-sm p-3 sm:p-4 max-w-[75%] sm:max-w-md">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      {/* Message Input */}
      <div className="border-t border-gray-100 mobile-card safe-bottom">
        <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3">
          <Input
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="flex-1 bg-gray-50 border-0 rounded-lg sm:rounded-2xl focus:ring-2 focus:ring-primary"
            disabled={sendMessageMutation.isPending}
          />
          <Button
            type="submit"
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="mobile-button gradient-primary min-w-[44px] min-h-[44px] rounded-lg sm:rounded-2xl p-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>

        {/* 나가기/상담종료 버튼 */}
        <div className="mt-3 flex justify-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (onEndSession) {
                onEndSession();
              }
            }}
            className="mobile-button text-gray-600 border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-colors"
          >
            <X className="w-4 h-4 mr-1 sm:mr-2" />
            나가기
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEndDialog(true)}
            className="mobile-button text-red-600 border-red-300 bg-red-50 hover:bg-red-100 hover:border-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-1 sm:mr-2" />
            상담종료
          </Button>
        </div>
      </div>

      {/* 상담 종료 확인 다이얼로그 */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>상담을 완전히 종료하시겠습니까?</DialogTitle>
            <DialogDescription>
              상담을 종료하면 더 이상 대화를 이어갈 수 없습니다. 진행된 내용은
              저장되어 열람만 가능합니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              취소
            </Button>
            <Button variant="outline" onClick={handleEndCounselingDirectly}>
              바로 종료
            </Button>
            <Button onClick={handleEndWithReview}>후기 작성 후 종료</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 후기 작성 다이얼로그 */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>상담 후기를 남겨주세요</DialogTitle>
            <DialogDescription>
              오늘 상담은 어떠셨나요? 소중한 후기를 남겨주시면 더 나은 서비스
              제공에 도움이 됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="상담 후기를 자유롭게 작성해 주세요..."
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowReviewDialog(false);
                if (onEndSession) onEndSession();
              }}
            >
              건너뛰기
            </Button>
            <Button onClick={handleSubmitReview} disabled={!reviewText.trim()}>
              후기 제출
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
