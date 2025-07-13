import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SatisfactionSurveyDialog } from "@/components/SatisfactionSurveyDialog";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { MallangiCharacter } from "@/components/characters/MallangiCharacter";
import { TunteCharacter } from "@/components/characters/TunteCharacter";
import { chatApi, counselingApi } from "@/lib/api";
import {
  User,
  Send,
  Clock,
  Target,
  Heart,
  Compass,
  Lightbulb,
  FileText,
  Copy,
  Share2,
  Download,
  X,
} from "lucide-react";
import type { User as UserType, ChatMessage } from "@/types";

const SELF_DISCOVERY_TOPICS = [
  {
    id: "values",
    title: "가치관 탐색",
    description: "내가 정말 중요하게 생각하는 가치들을 찾아보세요",
    icon: <Heart className="w-5 h-5" />,
    color: "from-pink-400 to-red-400",
    questions: [
      "인생에서 가장 중요하게 생각하는 것은 무엇인가요?",
      "어떤 순간에 가장 행복감을 느끼시나요?",
      "타인과의 관계에서 가장 소중히 여기는 가치는 무엇인가요?",
    ],
  },
  {
    id: "identity",
    title: "정체성 탐구",
    description: "진정한 나의 모습과 정체성을 발견해보세요",
    icon: <User className="w-5 h-5" />,
    color: "from-purple-400 to-indigo-400",
    questions: [
      "다른 사람들은 나를 어떤 사람이라고 말하나요?",
      "내가 생각하는 나의 강점과 약점은 무엇인가요?",
      "10년 후 어떤 사람이 되고 싶으신가요?",
    ],
  },
  {
    id: "goals",
    title: "목표 설정",
    description: "단기적, 장기적 목표를 명확히 세워보세요",
    icon: <Target className="w-5 h-5" />,
    color: "from-green-400 to-blue-400",
    questions: [
      "1년 안에 꼭 이루고 싶은 목표가 있나요?",
      "인생의 궁극적인 목표는 무엇인가요?",
      "목표 달성을 위해 지금 당장 할 수 있는 일은 무엇인가요?",
    ],
  },
  {
    id: "motivation",
    title: "동기 부여",
    description: "나를 움직이는 원동력과 열정을 찾아보세요",
    icon: <Lightbulb className="w-5 h-5" />,
    color: "from-yellow-400 to-orange-400",
    questions: [
      "어떤 일을 할 때 시간 가는 줄 모르나요?",
      "힘들 때 나를 지탱해주는 것은 무엇인가요?",
      "새로운 도전을 시작하게 만드는 동기는 무엇인가요?",
    ],
  },
  {
    id: "purpose",
    title: "삶의 의미",
    description: "나만의 삶의 목적과 의미를 탐색해보세요",
    icon: <Compass className="w-5 h-5" />,
    color: "from-indigo-400 to-purple-400",
    questions: [
      "내 삶이 다른 사람들에게 어떤 의미가 되길 원하나요?",
      "세상에 어떤 긍정적인 영향을 남기고 싶으신가요?",
      "나만이 할 수 있는 특별한 일이 있다면 무엇일까요?",
    ],
  },
];

export default function SelfDiscoveryPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [, setLocation] = useLocation();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showSurveyDialog, setShowSurveyDialog] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const {
    incrementSelfDiscoveryUsage,
    canUseSelfDiscovery,
    usageStats,
    isFree,
    checkSelfDiscoveryUsageOnCompletion,
    markSelfDiscoveryUsed,
    isPremium,
    isAdmin,
  } = useSubscription();
  const queryClient = useQueryClient();

  // 자아탐색 세션 조회 (concernKeywords에 "자아탐색" 포함된 세션들)
  const { data: sessions = [] } = useQuery({
    queryKey: ["/api/users", user?.id, "counseling", "sessions"],
    queryFn: () =>
      user ? counselingApi.getSessions(user.id) : Promise.resolve([]),
    enabled: !!user,
  });

  const selfDiscoverySessions = sessions.filter(
    s =>
      s.concernKeywords.includes("자아탐색") ||
      s.concernKeywords.includes("튼트니")
  );
  const completedSelfDiscoverySessions = selfDiscoverySessions.filter(
    s => !s.isActive
  );

  useEffect(() => {
    // 강제로 테스트 사용자 생성 (기존 카카오 사용자 데이터 덮어쓰기)
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
    console.log("강제 테스트 사용자 설정 완료:", testUser);
  }, [setLocation]);

  // 사용자 성향에 맞는 페르소나 타입 결정
  const getPersonaType = (
    user: UserType
  ): "strategic" | "empathetic" | "cheerful" => {
    const personality = user.personality || {};
    const mbti = user.mbti || "";

    // MBTI 기반 판단
    if (mbti.includes("T")) return "strategic"; // 사고형
    if (mbti.includes("F")) return "empathetic"; // 감정형

    // 성격 특성 기반 판단
    const logicalScore = personality.logical || 0;
    const emotionalScore = personality.emotional || 0;
    const funScore = personality.fun || 0;

    if (logicalScore > emotionalScore && logicalScore > funScore)
      return "strategic";
    if (emotionalScore > logicalScore && emotionalScore > funScore)
      return "empathetic";
    if (funScore > logicalScore && funScore > emotionalScore) return "cheerful";

    // 기본값: 성장 지향적인 strategic
    return "strategic";
  };

  // 자아탐색 전용 상담 세션 생성
  const createSessionMutation = useMutation({
    mutationFn: async (topicId: string) => {
      console.log("세션 생성 시도 - user:", user);

      if (!user || !user.id) {
        throw new Error("User not found or invalid user ID");
      }

      const topic = SELF_DISCOVERY_TOPICS.find(t => t.id === topicId);
      if (!topic) throw new Error("Topic not found");

      const personaType = getPersonaType(user);

      console.log("세션 생성 데이터:", {
        userId: user.id,
        concernKeywords: [topic.title, "자아탐색", "정체성", "튼트니"],
        personaType,
      });

      return counselingApi.createSession(user.id, {
        concernKeywords: [topic.title, "자아탐색", "정체성", "튼트니"],
        personaType, // 사용자 성향에 맞는 페르소나 자동 설정
      });
    },
    onSuccess: session => {
      console.log("세션 생성 성공:", session);
      setSessionId(session.id);
      // 자동으로 환영 메시지 생성
      sendWelcomeMessage(session.id);
    },
    onError: error => {
      console.error("Error creating session:", error);
      toast({
        title: "오류가 발생했습니다",
        description: "상담 세션을 시작할 수 없습니다.",
        variant: "destructive",
      });
    },
  });

  // 채팅 메시지 조회
  const { data: messages = [] } = useQuery({
    queryKey: ["/api/counseling/sessions", sessionId, "messages"],
    queryFn: () =>
      sessionId ? chatApi.getMessages(sessionId) : Promise.resolve([]),
    enabled: !!sessionId,
    refetchInterval: 2000,
  });

  // 자동 스크롤 기능 (messages가 변경될 때마다 하단으로 스크롤)
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // 리포트 생성
  const handleGenerateReport = async () => {
    if (!sessionId || !currentTopic) return;

    setShowEndDialog(false);

    try {
      // 대화 내용 요약을 위한 간단한 리포트 생성
      const conversationSummary = messages
        .filter(msg => msg.role === "user")
        .map(msg => msg.content)
        .join("\n\n");

      const report = `🌱 자아탐색 리포트: ${currentTopic.title}

📅 탐색 일시: ${new Date().toLocaleDateString("ko-KR")}
👤 탐색자: ${user?.name}님

📋 주요 대화 내용:
${conversationSummary}

💡 탐색된 핵심 인사이트:
• 자신에 대한 새로운 이해와 발견
• 내면의 가치관과 신념 탐구
• 개인적 성장을 위한 방향성 설정

🎯 다음 스텝:
• 오늘 탐색한 내용을 일상에 적용해보기
• 발견한 가치관을 바탕으로 구체적인 행동 계획 세우기
• 지속적인 자아 성찰과 탐색 이어가기

✨ 튼트니의 마무리 격려:
"${user?.name}님의 진솔한 자아탐색 과정이 정말 인상 깊었습니다. 오늘 발견한 것들이 앞으로의 성장에 큰 밑거름이 되길 바랍니다!"`;

      setGeneratedReport(report);
      setShowReportDialog(true);
    } catch (error) {
      toast({
        title: "리포트 생성 실패",
        description: "리포트 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 리포트 복사
  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(generatedReport);
      toast({
        title: "복사 완료",
        description: "리포트가 클립보드에 복사되었습니다.",
      });
    } catch (error) {
      toast({
        title: "복사 실패",
        description: "리포트 복사에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  // 리포트 공유
  const handleShareReport = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `자아탐색 리포트: ${currentTopic?.title}`,
          text: generatedReport,
        });
      } catch (error) {
        // 공유 취소시 무시
      }
    } else {
      // 공유 API가 지원되지 않는 경우 복사로 대체
      handleCopyReport();
    }
  };

  // 환영 메시지 전송
  const sendWelcomeMessage = async (sessionId: number) => {
    if (!user || !selectedTopic) return;

    const topic = SELF_DISCOVERY_TOPICS.find(t => t.id === selectedTopic);
    if (!topic) return;

    try {
      const welcomePrompt = `안녕하세요, ${user.name}님! 저는 여러분의 자아탐색 여정을 함께할 상담사 튼트니입니다. 🌱

오늘은 "${topic.title}"에 대해 깊이 있게 탐구해보는 시간을 가져보려고 해요. 이 과정을 통해 자신에 대해 더 잘 이해하고, 진정한 자아를 발견하는 데 도움이 되길 바랍니다.

편안한 마음으로, 솔직하게 자신의 생각과 감정을 표현해 주세요. 정답은 없습니다. 오직 ${user.name}님만의 진실된 이야기가 있을 뿐이에요.

먼저 간단한 질문부터 시작해볼까요? 

${topic.questions[0]}

어떤 답변이든 좋습니다. 어떤 생각이 드시나요? 혹시 이런 생각해보신 적이 있으신가요?`;

      await chatApi.sendWelcomeMessage(sessionId, welcomePrompt);
      queryClient.invalidateQueries({
        queryKey: ["/api/counseling/sessions", sessionId, "messages"],
      });
    } catch (error) {
      console.error("Error sending welcome message:", error);
    }
  };

  // 메시지 전송
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId || !message.trim()) return;

      setIsTyping(true);

      // 사용자 메시지 전송
      const result = await chatApi.sendMessage(sessionId, message);

      // AI 응답 생성
      const topic = SELF_DISCOVERY_TOPICS.find(t => t.id === selectedTopic);
      const nextQuestionIndex = currentStep + 1;
      const hasMoreQuestions =
        topic && nextQuestionIndex < topic.questions.length;

      let systemPrompt = `당신은 자아탐색 전문 상담사 튼트니입니다. 튼트니는 성장과 발전을 중시하는 따뜻하고 격려하는 페르소나입니다.

특성:
- 사용자의 성장 잠재력을 믿고 응원하는 따뜻한 성격
- 실용적이면서도 깊이 있는 통찰을 제공
- 사용자가 스스로 답을 찾을 수 있도록 이끄는 코칭 스타일
- 긍정적이고 희망적인 관점을 유지

현재 "${topic?.title}" 주제로 자아탐색을 진행 중입니다.

진행 상황:
- 질문 단계: ${currentStep + 1}/${topic?.questions.length}
- 다음 질문: ${hasMoreQuestions ? topic?.questions[nextQuestionIndex] : "모든 질문 완료"}

응답 가이드라인:
1. 튼트니의 따뜻하고 격려하는 말투로 응답
2. 사용자의 답변에서 성장 가능성과 강점을 발견하여 인정
3. 대화 흐름을 이어가기 위한 핵심 요구사항:
   - 반드시 사용자가 더 이야기하고 싶게 만드는 질문 포함
   - "왜 그렇게 생각하시나요?", "더 자세히 말씀해 주실 수 있나요?", "그때 어떤 기분이셨나요?" 같은 깊이 있는 질문
   - 사용자의 경험이나 감정에 대한 호기심과 관심 표현
   - 공감과 격려를 통해 더 열린 대화 분위기 조성
4. ${hasMoreQuestions ? "적절한 타이밍에 다음 질문으로 자연스럽게 연결하되, 현재 대화를 충분히 탐구한 후 진행" : "전체 대화를 정리하고 성장 방향 제시"}
5. "저는 튼트니입니다" 같은 자기소개는 반복하지 말고, 자연스럽게 대화 진행

사용자 답변: ${message}`;

      // AI 응답은 이미 자동으로 생성됨 (기존 chatApi.sendMessage가 user 메시지 전송 후 AI 응답도 생성)

      if (hasMoreQuestions) {
        setCurrentStep(nextQuestionIndex);
      }

      return result;
    },
    onSuccess: () => {
      setMessage("");
      setIsTyping(false);
      queryClient.invalidateQueries({
        queryKey: ["/api/counseling/sessions", sessionId, "messages"],
      });
    },
    onError: error => {
      console.error("Error sending message:", error);
      setIsTyping(false);
      toast({
        title: "메시지 전송 실패",
        description: "다시 시도해 주세요.",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 주제 선택 화면
  if (!selectedTopic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-soft-blue to-warm-gray pb-20">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <TunteCharacter size="lg" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              나는 누구?
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              진정한 자아를 탐색하는 여정에 함께해요. 아래 주제 중 가장 관심있는
              영역을 선택하고, 깊이 있는 대화를 통해 자신을 더 잘 이해해보세요.
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SELF_DISCOVERY_TOPICS.map(topic => (
              <Card
                key={topic.id}
                className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={() => {
                  // 무료 플랜: 전체 자아탐색 1회 제한
                  if (isFree && !canUseSelfDiscovery) {
                    setShowSurveyDialog(true);
                    return;
                  }

                  // 무료 플랜: 자아탐색 사용 표시
                  if (isFree) {
                    markSelfDiscoveryUsed();
                  }
                  setSelectedTopic(topic.id);
                  createSessionMutation.mutate(topic.id);
                }}
              >
                <CardHeader className="pb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-r ${topic.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <div className="text-white">{topic.icon}</div>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {topic.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">
                    {topic.description}
                  </p>
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500">주요 질문들:</div>
                    {topic.questions.slice(0, 2).map((question, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-gray-600 bg-gray-50 p-2 rounded"
                      >
                        • {question}
                      </div>
                    ))}
                    <div className="text-xs text-gray-400">+1개 더</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 대화 화면
  const currentTopic = SELF_DISCOVERY_TOPICS.find(t => t.id === selectedTopic);
  const progress = currentTopic
    ? ((currentStep + 1) / currentTopic.questions.length) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-soft-blue to-warm-gray">
      <div className="container mx-auto px-4 py-6 pb-32">
        {/* 헤더 - 간소화 */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => setSelectedTopic(null)}
            className="text-gray-600"
          >
            ← 주제 변경
          </Button>
          <h2 className="text-xl font-bold text-gray-800">
            {currentTopic?.title}
          </h2>
          <div className="w-20">
            <TunteCharacter size="sm" />
          </div>
        </div>

        {/* 채팅 영역 */}
        <Card className="mb-6 min-h-[500px]">
          <CardContent className="p-0">
            <div
              className="space-y-4 p-6 max-h-[600px] overflow-y-auto"
              id="chatContainer"
            >
              {messages.map((msg: ChatMessage, idx: number) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="mr-3 mt-2">
                      <TunteCharacter size="sm" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="mr-3 mt-2">
                    <TunteCharacter size="sm" />
                  </div>
                  <div className="bg-gray-100 p-4 rounded-2xl">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                        style={{ animationDelay: "0.4s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* 메시지 입력 및 종료 버튼 */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <div className="container mx-auto max-w-4xl">
            <div className="flex gap-4">
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="솔직하고 편안하게 자신의 생각을 표현해 주세요..."
                className="flex-1 min-h-[60px] resize-none"
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessageMutation.mutate();
                  }
                }}
              />
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => sendMessageMutation.mutate()}
                  disabled={!message.trim() || sendMessageMutation.isPending}
                  className="px-6"
                >
                  <Send className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEndDialog(true)}
                  disabled={messages.length < 2}
                  className="px-4 text-xs"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  종료
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 종료 확인 다이얼로그 */}
        <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>자아탐색 종료</DialogTitle>
              <DialogDescription>
                자아탐색을 종료하고 대화 내용을 요약한 리포트를
                생성하시겠습니까?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEndDialog(false)}>
                계속하기
              </Button>
              <Button onClick={handleGenerateReport}>리포트 생성하기</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 리포트 표시 다이얼로그 */}
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                자아탐색 리포트
              </DialogTitle>
              <DialogDescription>
                {currentTopic?.title} 주제에 대한 탐색 결과입니다.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="whitespace-pre-wrap text-sm text-gray-700">
                  {generatedReport}
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleCopyReport}
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                복사하기
              </Button>
              <Button
                variant="outline"
                onClick={handleShareReport}
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                공유하기
              </Button>
              <Button
                onClick={() => {
                  setShowReportDialog(false);
                  setLocation("/");
                }}
              >
                메인으로 돌아가기
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 만족도 조사 팝업 */}
        <SatisfactionSurveyDialog
          isOpen={showSurveyDialog}
          onClose={() => setShowSurveyDialog(false)}
          serviceType="self-discovery"
        />
      </div>
    </div>
  );
}
