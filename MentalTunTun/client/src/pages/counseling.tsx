import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PersonaCard } from "@/components/ui/persona-card";
import { ChatInterface } from "@/components/counseling/ChatInterface";
import { SatisfactionSurveyDialog } from "@/components/SatisfactionSurveyDialog";
import { PremiumUpgradeModal } from "@/components/premium/PremiumUpgradeModal";
import { counselingApi, invalidateCache, authApi } from "@/lib/api";
import { CONCERN_CATEGORIES } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import {
  ArrowLeft,
  MessageCircle,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Cloud,
  Database,
  RefreshCw,
} from "lucide-react";
import {
  useFirebaseConnection,
  useCounselingSessionFirebase,
  useHybridDataSync,
} from "@/hooks/useFirebaseSync";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type {
  User,
  PersonaRecommendation,
  CounselingSession,
  PersonaPreferences,
} from "@/types";

type Step = "concerns" | "preferences" | "tones" | "personas" | "chat";

export default function CounselingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>("concerns");
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [openSubcategory, setOpenSubcategory] = useState<string | null>(null);
  const [openRoleCategory, setOpenRoleCategory] = useState<string | null>(null);
  const [personaPreferences, setPersonaPreferences] =
    useState<PersonaPreferences>({
      gender: "any",
      ageGroup: "any",
      role: "",
      tones: [],
    });
  const [selectedPersona, setSelectedPersona] =
    useState<PersonaRecommendation | null>(null);
  const [currentSession, setCurrentSession] =
    useState<CounselingSession | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSessionsToDelete, setSelectedSessionsToDelete] = useState<
    number[]
  >([]);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [showSurveyDialog, setShowSurveyDialog] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { toast } = useToast();
  const {
    incrementCounselingUsage,
    canUseCounseling,
    usageStats,
    isFree,
    checkCounselingUsageOnCompletion,
    canCreateCounselingSession,
    incrementSessionCreation,
    checkSessionLimit,
    isPremium,
    isAdmin,
  } = useSubscription();

  // Firebase 연동 훅 (uid 기준)
  const { isConnected: isFirebaseConnected } = useFirebaseConnection();
  const { saveSession: saveToFirebase } = useCounselingSessionFirebase();
  const { syncAllData } = useHybridDataSync();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData && userData.id) {
          setUser(userData);
        } else {
          console.error("Invalid user data in localStorage");
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
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
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
    }
  }, [setLocation]);

  const { data: sessions = [] } = useQuery({
    queryKey: ["/api/users", user?.id, "counseling", "sessions"],
    queryFn: () =>
      user ? counselingApi.getSessions(user.id) : Promise.resolve([]),
    enabled: !!user,
  });

  const getRecommendationsMutation = useMutation({
    mutationFn: async (data: {
      concernKeywords: string[];
      personaPreferences: PersonaPreferences;
    }) => {
      // Check for premium subscription or admin and use advanced AI
      if (isPremium || isAdmin) {
        try {
          const response = await fetch(
            "/api/subscription/ai/advanced-persona",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                concernKeywords: data.concernKeywords,
                preferences: data.personaPreferences,
                counselingHistory: [],
              }),
            }
          );

          if (response.ok) {
            const result = await response.json();
            if (result.personas && result.personas.length > 0) {
              return result;
            }
          }
        } catch (error) {
          console.log("Premium AI not available, using standard generation");
        }
      }

      // Standard persona generation
      if (!user?.id) {
        throw new Error("사용자 정보가 없습니다");
      }
      return counselingApi.getRecommendations(
        user.id,
        data.concernKeywords,
        data.personaPreferences
      );
    },
    onSuccess: () => {
      setStep("personas");
    },
    onError: error => {
      console.error("Persona recommendation error:", error);
      toast({
        variant: "destructive",
        title: "추천 실패",
        description:
          "페르소나 추천을 가져오는 중 오류가 발생했습니다. 로그인 상태를 확인해주세요.",
      });
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: async (data: {
      personaType: string;
      concernKeywords: string[];
      selectedTones: string[];
    }) => {
      // PostgreSQL에 세션 생성
      const sessionResult = await counselingApi.createSession(user!.id, data);

      // Firebase에 동시 저장
      if (isFirebaseConnected && sessionResult) {
        try {
          await saveToFirebase({
            sessionId: sessionResult.id?.toString(),
            personaType: data.personaType,
            personaName: selectedPersona?.name || "AI 상담사",
            concernKeywords: data.concernKeywords,
            selectedTones: data.selectedTones,
            messages: [],
            status: "active",
          });
        } catch (firebaseError) {
          console.warn(
            "Firebase 세션 저장 실패, PostgreSQL만 저장됨:",
            firebaseError
          );
        }
      }

      return sessionResult;
    },
    onSuccess: session => {
      setCurrentSession(session);
      setStep("chat");
      invalidateCache.sessions(user!.id);
      toast({
        title: isFirebaseConnected
          ? "상담 세션 시작 (클라우드 동기화)"
          : "상담 세션 시작",
        description: isFirebaseConnected
          ? "PostgreSQL과 Firebase에 안전하게 저장되어 실시간 동기화됩니다."
          : "새로운 상담 세션이 시작되었습니다.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "세션 생성 실패",
        description: "상담 세션을 시작하는 중 오류가 발생했습니다.",
      });
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: number) =>
      fetch(`/api/counseling/sessions/${sessionId}`, { method: "DELETE" }),
    onError: () => {
      toast({
        variant: "destructive",
        title: "삭제 실패",
        description: "다시 시도해 주세요.",
      });
    },
  });

  const handleConcernToggle = (concern: string) => {
    if (selectedConcerns.length >= 3 && !selectedConcerns.includes(concern)) {
      toast({
        title: "최대 3개까지 선택 가능합니다",
        description: "다른 고민을 선택하시려면 기존 선택을 해제해 주세요.",
        variant: "destructive",
      });
      return;
    }

    setSelectedConcerns(prev =>
      prev.includes(concern)
        ? prev.filter(c => c !== concern)
        : [...prev, concern]
    );
  };

  const toggleCategory = (category: string) => {
    setOpenCategory(openCategory === category ? null : category);
    setOpenSubcategory(null);
  };

  const toggleSubcategory = (subcategory: string) => {
    setOpenSubcategory(openSubcategory === subcategory ? null : subcategory);
  };

  const handleNextToPreferences = () => {
    if (selectedConcerns.length === 0) {
      toast({
        variant: "destructive",
        title: "고민을 선택해주세요",
        description: "최소 하나의 고민 주제를 선택해야 합니다.",
      });
      return;
    }

    // 새로운 세션 생성 제한 확인 (진행중인 세션만 계산)
    const activeSessions = sessions.filter(s => s.isActive);
    const sessionCheck = checkSessionLimit(
      activeSessions.length,
      sessions.length
    );
    if (!sessionCheck.canCreate) {
      if (sessionCheck.message) {
        // 유료 플랜: 진행중 7개 제한
        toast({
          variant: "destructive",
          title: "세션 생성 제한",
          description: sessionCheck.message,
        });
      } else if (isFree && activeSessions.length >= 2) {
        // 무료 플랜: 진행중 2개 제한
        setShowSurveyDialog(true);
      }
      return;
    }

    setStep("preferences");
  };

  // 빠른 상담 시작 핸들러
  const handleQuickCounseling = async () => {
    if (!user) return;

    // 새로운 세션 생성 제한 확인 (진행중인 세션만 계산)
    const activeSessions = sessions.filter(s => s.isActive);
    const sessionCheck = checkSessionLimit(
      activeSessions.length,
      sessions.length
    );
    if (!sessionCheck.canCreate) {
      if (sessionCheck.message) {
        // 유료 플랜: 진행중 7개 제한
        toast({
          variant: "destructive",
          title: "세션 생성 제한",
          description: sessionCheck.message,
        });
      } else if (isFree && activeSessions.length >= 2) {
        // 무료 플랜: 진행중 2개 제한
        setShowSurveyDialog(true);
      }
      return;
    }

    try {
      // 1. 랜덤 페르소나 선호도 생성
      const randomGender = ["male", "female", "any"][
        Math.floor(Math.random() * 3)
      ] as "male" | "female" | "any";
      const randomAge = ["20s", "30s", "40s", "any"][
        Math.floor(Math.random() * 4)
      ] as "20s" | "30s" | "40s" | "any";

      // 랜덤 역할 선택
      const roleOptions = [
        "친구 같은 상담사",
        "전문 심리상담사",
        "인생 선배",
        "학습 코치",
        "커리어 멘토",
        "감정 치유사",
        "동기부여 코치",
        "문제해결사",
        "공감 전문가",
        "실용적 조언자",
      ];
      const randomRole =
        roleOptions[Math.floor(Math.random() * roleOptions.length)];

      // 랜덤 어조 선택 (1-3개)
      const toneOptions = [
        "따뜻하게",
        "차분하게",
        "격려하며",
        "공감하며",
        "함께 고민하는",
        "진지하게",
        "친근하게",
        "부드럽게",
        "위로하며",
        "격려하는",
        "긍정적으로",
        "실용적으로",
      ];
      const randomToneCount = Math.floor(Math.random() * 3) + 1;
      const randomTones = toneOptions
        .sort(() => 0.5 - Math.random())
        .slice(0, randomToneCount);

      const randomPreferences = {
        gender: randomGender,
        ageGroup: randomAge,
        role: randomRole,
        tones: randomTones,
      };

      // 2. 페르소나 추천 생성
      const recommendations = await counselingApi.getRecommendations(user.id, {
        concernKeywords: selectedConcerns,
        personaPreferences: randomPreferences,
      });

      // 3. 최고 매칭률 페르소나 선택
      const bestPersona = recommendations.reduce((best, current) => {
        const rankValue = { 최상: 3, 상: 2, 중: 1 };
        return rankValue[current.matchingRank] > rankValue[best.matchingRank]
          ? current
          : best;
      });

      // 4. 바로 상담 세션 생성
      const sessionData = {
        personaType: bestPersona.type,
        concernKeywords: selectedConcerns,
        selectedTones: randomTones,
      };

      const newSession = await counselingApi.createSession(
        user.id,
        sessionData
      );
      setCurrentSession(newSession);
      setSelectedPersona(bestPersona);
      setStep("chat");

      // 세션 카운트 증가
      incrementSessionCreation();

      toast({
        title: "빠른 상담이 시작되었습니다!",
        description: `${bestPersona.name} 상담사 (${bestPersona.matchingRank}급)와 대화를 시작하세요.`,
        duration: 2000,
      });
    } catch (error) {
      console.error("빠른 상담 시작 실패:", error);
      toast({
        title: "오류가 발생했습니다",
        description: "다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  const handleNextToPersonas = () => {
    getRecommendationsMutation.mutate({
      concernKeywords: selectedConcerns,
      personaPreferences,
    });
  };

  const handlePersonaSelect = (persona: PersonaRecommendation) => {
    // 진행중인 세션 개수 기반 제한 확인
    const activeSessions = sessions.filter(s => s.isActive);
    if (isFree && activeSessions.length >= 2) {
      setShowSurveyDialog(true);
      return;
    }

    setSelectedPersona(persona);
    createSessionMutation.mutate({
      personaType: persona.type,
      concernKeywords: selectedConcerns,
      selectedTones: personaPreferences.tones,
    });
  };

  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
    setSelectedSessionsToDelete([]);
  };

  const handleSelectSessionForDelete = (sessionId: number) => {
    setSelectedSessionsToDelete(prev =>
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const handleDeleteSelectedSessions = async () => {
    try {
      for (const sessionId of selectedSessionsToDelete) {
        await deleteSessionMutation.mutateAsync(sessionId);
      }

      // 모든 삭제가 성공한 후에 상태 초기화 및 캐시 무효화
      setSelectedSessionsToDelete([]);
      setIsEditMode(false);
      invalidateCache.sessions(user!.id);

      toast({
        title: "상담 삭제 완료",
        description: `${selectedSessionsToDelete.length}개의 상담이 삭제되었습니다.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "삭제 실패",
        description: "일부 상담을 삭제하는 중 오류가 발생했습니다.",
      });
    }
  };

  const handleBackToHome = () => {
    setLocation("/");
  };

  const handleBackToConcerns = () => {
    setStep("concerns");
    setSelectedConcerns([]);
  };

  const handleBackToPersonas = () => {
    setStep("personas");
    setSelectedPersona(null);
  };

  const handleContinueSession = (session: CounselingSession) => {
    setCurrentSession(session);
    setStep("chat");
  };

  const handleEndSession = () => {
    setStep("concerns");
    setCurrentSession(null);
    setSelectedConcerns([]);
    setSelectedPersona(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeSessions = sessions.filter(s => s.isActive);
  const completedSessions = sessions.filter(s => !s.isActive);
  const recommendations = getRecommendationsMutation.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-gray via-white to-soft-purple pb-20">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              {step !== "concerns" && (
                <Button
                  variant="ghost"
                  onClick={
                    step === "personas"
                      ? handleBackToConcerns
                      : step === "chat"
                        ? handleBackToPersonas
                        : handleBackToHome
                  }
                  className="absolute left-4 top-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  이전
                </Button>
              )}
              <MessageCircle className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-4 leading-tight px-4 text-break-words">
              AI 상담사와 대화해보세요
            </h2>
            <p className="text-gray-600 text-sm md:text-base lg:text-lg leading-relaxed px-4 text-break-words">
              {step === "concerns" && "어떤 고민이 있으신지 알려주세요"}
              {step === "preferences" && "원하는 상담사의 특성을 선택해주세요"}
              {step === "personas" &&
                "당신의 마음을 이해하는 세 가지 상담 스타일"}
              {step === "chat" && "편안한 마음으로 대화를 시작해보세요"}
            </p>

            {/* Firebase 연결 상태 표시 */}
            <div className="flex items-center justify-center gap-4 mt-4 px-4">
              {isFirebaseConnected ? (
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-full text-sm border border-green-200">
                  <Cloud className="w-4 h-4" />
                  <span>실시간 클라우드 동기화</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-full text-sm border border-blue-200">
                  <Database className="w-4 h-4" />
                  <span>로컬 저장소</span>
                </div>
              )}
            </div>

            {/* 안내문구 추가 */}
            {step === "concerns" && (
              <div className="mt-6 space-y-4">
                <div className="p-4 md:p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                  <p className="text-sm md:text-base text-blue-800 mb-3 font-semibold leading-tight text-break-words">
                    💡 상담 가이드
                  </p>
                  <ul className="text-xs md:text-sm lg:text-base text-blue-700 space-y-2 leading-relaxed">
                    <li className="text-break-words">
                      • 고민을 선택하고 맞춤형 AI 상담사와 대화해보세요
                    </li>
                    <li className="text-break-words">
                      • 언제든지 중단하고 다시 시작할 수 있습니다
                    </li>
                    <li className="text-break-words">
                      • 모든 대화는 안전하게 보호됩니다
                    </li>
                    <li className="text-break-words">
                      • 상담 종료 시 후기를 남겨주세요
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Step 1: Concern Selection */}
          {step === "concerns" && (
            <>
              <div className="mb-8">
                <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4 text-center leading-tight px-4">
                  어떤 고민이 있으신가요?
                </h3>
                <div className="text-center mb-6">
                  <p className="text-sm md:text-base text-gray-600 mb-2">
                    대주제를 선택하고, 세부 고민을 1~3개까지 선택해주세요
                  </p>
                  <div className="text-xs md:text-sm text-blue-600 bg-blue-50 p-3 rounded-lg inline-block">
                    💡 선택한 고민에 따라 맞춤형 AI 상담사가 추천됩니다
                  </div>
                </div>

                {/* 대주제 카테고리 */}
                <div className="space-y-4">
                  {Object.entries(CONCERN_CATEGORIES).map(
                    ([categoryName, categoryData]) => (
                      <div
                        key={categoryName}
                        className="border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                      >
                        {/* 대주제 헤더 */}
                        <Button
                          variant="ghost"
                          onClick={() => toggleCategory(categoryName)}
                          className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {categoryData.icon}
                            </span>
                            <span className="font-semibold text-gray-800">
                              {categoryName}
                            </span>
                          </div>
                          {openCategory === categoryName ? (
                            <ChevronUp className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          )}
                        </Button>

                        {/* 하위 카테고리 (펼쳐진 경우) */}
                        {openCategory === categoryName && (
                          <div className="p-4 bg-gray-50 border-t border-gray-200">
                            <div className="space-y-3">
                              {Object.entries(categoryData.subcategories).map(
                                ([subcategoryName, keywords]) => (
                                  <div
                                    key={subcategoryName}
                                    className="bg-white rounded-lg border border-gray-200"
                                  >
                                    {/* 하위 카테고리 헤더 */}
                                    <Button
                                      variant="ghost"
                                      onClick={() =>
                                        toggleSubcategory(subcategoryName)
                                      }
                                      className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                                    >
                                      <span className="font-medium text-gray-700">
                                        {subcategoryName}
                                      </span>
                                      {openSubcategory === subcategoryName ? (
                                        <ChevronUp className="w-4 h-4 text-gray-400" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                      )}
                                    </Button>

                                    {/* 키워드 목록 (펼쳐진 경우) */}
                                    {openSubcategory === subcategoryName && (
                                      <div className="p-3 border-t border-gray-100">
                                        <div className="flex flex-wrap gap-2">
                                          {keywords.map(keyword => (
                                            <Button
                                              key={keyword}
                                              variant={
                                                selectedConcerns.includes(
                                                  keyword
                                                )
                                                  ? "default"
                                                  : "outline"
                                              }
                                              size="sm"
                                              onClick={() =>
                                                handleConcernToggle(keyword)
                                              }
                                              className={cn(
                                                "text-xs px-3 py-1 rounded-full transition-all",
                                                selectedConcerns.includes(
                                                  keyword
                                                )
                                                  ? "bg-primary text-white shadow-sm"
                                                  : "hover:bg-primary/10 hover:border-primary"
                                              )}
                                            >
                                              {keyword}
                                            </Button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>

                {/* 선택된 고민 표시 */}
                {selectedConcerns.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">
                      선택된 고민 ({selectedConcerns.length}/3)
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedConcerns.map(concern => (
                        <span
                          key={concern}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {concern}
                          <button
                            onClick={() => handleConcernToggle(concern)}
                            className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleNextToPreferences}
                  disabled={selectedConcerns.length === 0}
                  className="gradient-primary px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  다음: 상담사 취향 선택 ({selectedConcerns.length}개 선택)
                </Button>
                <Button
                  onClick={handleQuickCounseling}
                  disabled={selectedConcerns.length === 0}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  ⚡ 빠른 상담 시작하기
                </Button>
              </div>

              {/* 진행 중인 상담 - 하단 이동 */}
              {activeSessions.length > 0 && (
                <Card className="mt-12 bg-blue-50 border-blue-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-blue-800">
                        진행 중인 상담 ({activeSessions.length}개)
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleToggleEditMode}
                        className="text-blue-700 border-blue-300 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                      >
                        {isEditMode ? (
                          <X className="w-4 h-4" />
                        ) : (
                          <Edit2 className="w-4 h-4" />
                        )}
                        {isEditMode ? "완료" : "편집"}
                      </Button>
                    </div>

                    {isEditMode && selectedSessionsToDelete.length > 0 && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-red-700">
                            {selectedSessionsToDelete.length}개 상담이 선택됨
                          </span>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteSelectedSessions}
                            disabled={deleteSessionMutation.isPending}
                            className="shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            삭제
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {activeSessions.map(session => (
                        <div
                          key={session.id}
                          className={cn(
                            "flex items-center justify-between bg-white rounded-xl p-4 border transition-all shadow-md hover:shadow-lg",
                            isEditMode &&
                              selectedSessionsToDelete.includes(session.id)
                              ? "border-red-300 bg-red-50 shadow-red-100"
                              : "border-blue-100 hover:border-blue-200 hover:scale-102 transform"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {isEditMode && (
                              <input
                                type="checkbox"
                                checked={selectedSessionsToDelete.includes(
                                  session.id
                                )}
                                onChange={() =>
                                  handleSelectSessionForDelete(session.id)
                                }
                                className="w-4 h-4 text-blue-600"
                              />
                            )}
                            <div>
                              <div className="font-medium text-gray-800">
                                {session.personaType === "strategic" &&
                                  "🎯 냉철한 전략가"}
                                {session.personaType === "empathetic" &&
                                  "🧘 감성 공감형"}
                                {session.personaType === "cheerful" &&
                                  "🎩 유쾌한 조언가"}
                              </div>
                              <div className="text-sm text-gray-600">
                                {session.concernKeywords.join(", ")}
                              </div>
                            </div>
                          </div>
                          {!isEditMode && (
                            <Button
                              onClick={() => handleContinueSession(session)}
                              className="gradient-primary shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                              size="sm"
                            >
                              대화 계속하기
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Step 2: Persona Preferences */}
          {step === "preferences" && (
            <>
              <div className="space-y-8">
                {/* 1단계: 성별 선택 */}
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      1단계: 상담사의 성별
                    </h3>
                    <div className="flex flex-wrap gap-3 justify-center">
                      {[
                        { key: "male", label: "👨 남자" },
                        { key: "female", label: "👩 여자" },
                        { key: "any", label: "🤝 상관없음" },
                      ].map(option => (
                        <Button
                          key={option.key}
                          variant={
                            personaPreferences.gender === option.key
                              ? "default"
                              : "outline"
                          }
                          onClick={() =>
                            setPersonaPreferences(prev => ({
                              ...prev,
                              gender: option.key as any,
                            }))
                          }
                          className={cn(
                            "px-6 py-3 rounded-2xl font-medium transition-all shadow-md hover:shadow-lg transform hover:scale-105",
                            personaPreferences.gender === option.key
                              ? "bg-primary text-white shadow-primary/20"
                              : "border-2 hover:border-primary"
                          )}
                        >
                          <span className="text-sm">{option.label}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* 2단계: 연령대 선택 */}
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      2단계: 상담사의 연령대
                    </h3>
                    <div className="flex flex-wrap gap-3 justify-center">
                      {[
                        { key: "10s", label: "👦 10대" },
                        { key: "20s", label: "👨‍🎓 20대" },
                        { key: "30s", label: "👨‍💼 30대" },
                        { key: "40s", label: "👨‍🏫 40대" },
                        { key: "50s", label: "👨‍💻 50대" },
                        { key: "60s", label: "👴 60대" },
                        { key: "any", label: "🤝 상관없음" },
                      ].map(option => (
                        <Button
                          key={option.key}
                          variant={
                            personaPreferences.ageGroup === option.key
                              ? "default"
                              : "outline"
                          }
                          onClick={() =>
                            setPersonaPreferences(prev => ({
                              ...prev,
                              ageGroup: option.key as any,
                            }))
                          }
                          className={cn(
                            "px-6 py-3 rounded-2xl font-medium transition-all shadow-md hover:shadow-lg transform hover:scale-105",
                            personaPreferences.ageGroup === option.key
                              ? "bg-primary text-white shadow-primary/20"
                              : "border-2 hover:border-primary"
                          )}
                        >
                          <span className="text-sm">{option.label}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* 3단계: 역할 선택 */}
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      3단계: 원하는 역할 유형
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 text-center">
                      어떤 역할의 상담사와 대화하고 싶으신가요?
                    </p>

                    {/* 역할 카테고리 드롭다운 */}
                    <div className="space-y-4">
                      {[
                        {
                          category: "정서적 공감형",
                          icon: "💝",
                          roles: [
                            "공감 전문가",
                            "따뜻한 언니/형",
                            "친구 같은 상담자",
                            "경청하는 선생님",
                            "친절한 부모님 같은 존재",
                            "고민 들어주는 룸메이트",
                            "감정코치",
                            "마음치유 멘토",
                            "인생 선배",
                          ],
                        },
                        {
                          category: "전문 상담가/가이드형",
                          icon: "🎓",
                          roles: [
                            "심리상담사",
                            "정신과 전문의",
                            "인생 코치",
                            "커리어 멘토",
                            "감정 트레이너",
                            "마음챙김 가이드",
                            "MBTI 해석 전문가",
                            "애착유형 분석가",
                            "트라우마 전문 상담가",
                          ],
                        },
                        {
                          category: "실용적 조언가형",
                          icon: "💼",
                          roles: [
                            "직장 선배",
                            "경험 많은 누나/형",
                            "삶의 코치",
                            "생산성 컨설턴트",
                            "습관 설계사",
                            "성격 분석가",
                            "문제 해결사",
                            "위기 관리자",
                          ],
                        },
                        {
                          category: "유쾌한 친구/일상형",
                          icon: "😄",
                          roles: [
                            "수다쟁이 친구",
                            "반려동물처럼 귀여운 친구",
                            "농담 잘하는 형",
                            "트렌디한 인스타 친구",
                            "고민 들어주는 DM 친구",
                            "TMI 토크 메이트",
                            "하루 기록 메이트",
                            "일기 친구",
                            "공감 짤 설명봇",
                          ],
                        },
                        {
                          category: "창의적/철학적 사유형",
                          icon: "🎨",
                          roles: [
                            "철학 전공자",
                            "시 쓰는 친구",
                            "명상 코치",
                            "예술가적 멘토",
                            "인생 질문 수집가",
                            "무의식 탐험가",
                            "자아탐색 동반자",
                          ],
                        },
                      ].map((group, groupIndex) => (
                        <div
                          key={group.category}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          <Button
                            variant="ghost"
                            onClick={() =>
                              setOpenRoleCategory(
                                openRoleCategory === group.category
                                  ? null
                                  : group.category
                              )
                            }
                            className="w-full justify-between p-4 hover:bg-gray-50 text-left"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{group.icon}</span>
                              <span className="font-medium text-gray-800">
                                {group.category}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({group.roles.length}개 역할)
                              </span>
                            </div>
                            {openRoleCategory === group.category ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </Button>

                          {openRoleCategory === group.category && (
                            <div className="p-4 border-t border-gray-100 bg-gray-50">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {group.roles.map(role => (
                                  <Button
                                    key={role}
                                    variant={
                                      personaPreferences.role === role
                                        ? "default"
                                        : "outline"
                                    }
                                    size="sm"
                                    onClick={() =>
                                      setPersonaPreferences(prev => ({
                                        ...prev,
                                        role,
                                      }))
                                    }
                                    className={cn(
                                      "text-xs px-3 py-2 rounded-lg transition-all justify-start text-left h-auto",
                                      personaPreferences.role === role
                                        ? "bg-primary text-white shadow-sm"
                                        : "hover:bg-white hover:border-primary bg-white"
                                    )}
                                  >
                                    <div className="flex items-center gap-2">
                                      {personaPreferences.role === role && (
                                        <CheckCircle className="w-3 h-3" />
                                      )}
                                      <span className="text-break-words leading-tight">
                                        {role}
                                      </span>
                                    </div>
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* 선택된 역할 표시 */}
                    {personaPreferences.role && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">
                            선택된 역할:
                          </span>
                          <span className="text-sm text-blue-700">
                            {personaPreferences.role}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-4 justify-center mt-8">
                <Button
                  variant="outline"
                  onClick={() => setStep("concerns")}
                  className="px-6 py-3 rounded-2xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  이전: 고민 선택
                </Button>
                <Button
                  onClick={() => setStep("tones")}
                  disabled={!personaPreferences.role}
                  className="gradient-primary px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음: 대화 어조 선택 {personaPreferences.role && "✓"}
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Tone Selection */}
          {step === "tones" && (
            <>
              <div className="mb-8">
                <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4 text-center leading-tight">
                  4단계: 원하는 대화 어조/화법을 선택하세요
                </h3>
                <p className="text-sm text-gray-600 text-center mb-6 leading-relaxed">
                  💡 1~3개까지 선택 가능 - 상담사가 선택한 어조를 조합해서
                  대화합니다
                </p>

                {/* 어조 카테고리 드롭다운 */}
                <div className="space-y-4">
                  {[
                    {
                      category: "말투 스타일",
                      icon: "🎤",
                      subcategories: [
                        {
                          type: "💬 일상형",
                          keywords: [
                            "반말",
                            "존댓말",
                            "반존대",
                            "친구 말투",
                            "톡투유 말투",
                          ],
                        },
                        {
                          type: "📘 포멀형",
                          keywords: [
                            "공손한",
                            "예의 바른",
                            "공식적인",
                            "논리적인",
                          ],
                        },
                        {
                          type: "🧑‍🏫 전문가형",
                          keywords: [
                            "분석적인",
                            "직설적인",
                            "정보 중심",
                            "질문 유도형",
                          ],
                        },
                        {
                          type: "🎨 감성형",
                          keywords: [
                            "따뜻한",
                            "부드러운",
                            "위로하는",
                            "감정 풍부한",
                          ],
                        },
                        {
                          type: "🎭 캐릭터형",
                          keywords: [
                            "유쾌한",
                            "톡톡 튀는",
                            "유머 섞인",
                            "수다쟁이 스타일",
                          ],
                        },
                        {
                          type: "🧘 심리형",
                          keywords: ["명상하듯", "차분한", "안정된", "느긋한"],
                        },
                        {
                          type: "💥 강한형",
                          keywords: [
                            "솔직한",
                            "날카로운",
                            "도전적인",
                            "시원한 말투",
                          ],
                        },
                      ],
                    },
                    {
                      category: "어조",
                      icon: "🎵",
                      subcategories: [
                        {
                          type: "💖 공감형",
                          keywords: [
                            "위로하는",
                            "다정한",
                            "함께 고민하는",
                            "감정 이입하는",
                          ],
                        },
                        {
                          type: "🔍 분석형",
                          keywords: [
                            "차분한",
                            "객관적인",
                            "논리적인",
                            "관찰자 시점의",
                          ],
                        },
                        {
                          type: "🔥 동기부여형",
                          keywords: [
                            "힘을 주는",
                            "북돋아주는",
                            "긍정적인",
                            "도전 욕구를 자극하는",
                          ],
                        },
                        {
                          type: "🧩 중립형",
                          keywords: [
                            "판단하지 않는",
                            "균형 잡힌",
                            "존중하는",
                            "열린 태도의",
                          ],
                        },
                        {
                          type: "🎈 캐주얼형",
                          keywords: [
                            "가볍고 유쾌한",
                            "익숙한",
                            "쉬운 표현 중심의",
                          ],
                        },
                        {
                          type: "💬 질문형",
                          keywords: [
                            "되묻는",
                            "유도형",
                            "대화 유도 중심",
                            "탐색형 어조",
                          ],
                        },
                      ],
                    },
                    {
                      category: "화법 스타일",
                      icon: "💬",
                      subcategories: [
                        {
                          type: "🧠 정보 중심",
                          keywords: [
                            "팩트 기반",
                            "통계 활용",
                            "배경 설명 중심",
                          ],
                        },
                        {
                          type: "🗣 스토리텔링",
                          keywords: [
                            "사례 제시형",
                            "경험 기반",
                            "은유적 표현 활용",
                          ],
                        },
                        {
                          type: "❓ 질문 유도",
                          keywords: [
                            "열린 질문",
                            "어떤 기분이었나요?",
                            "왜 그렇게 느꼈을까요?",
                          ],
                        },
                        {
                          type: "💡 제안형",
                          keywords: [
                            "이렇게 해보면 어때요?",
                            "한번 시도해볼 수 있어요",
                          ],
                        },
                        {
                          type: "🫶 감정 나열",
                          keywords: [
                            "속상했겠어요",
                            "화날 수 있어요",
                            "감정을 직접 말해주는 방식",
                          ],
                        },
                        {
                          type: "🧘 명상형",
                          keywords: [
                            "지금 이 순간을 느껴보세요",
                            "숨을 천천히 쉬어볼게요",
                          ],
                        },
                      ],
                    },
                  ].map((group, groupIndex) => (
                    <div
                      key={group.category}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <Button
                        variant="ghost"
                        onClick={() =>
                          setOpenCategory(
                            openCategory === group.category
                              ? null
                              : group.category
                          )
                        }
                        className="w-full justify-between p-4 hover:bg-gray-50 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{group.icon}</span>
                          <span className="font-medium text-gray-800">
                            {group.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            (
                            {group.subcategories.reduce(
                              (total, sub) => total + sub.keywords.length,
                              0
                            )}
                            개 키워드)
                          </span>
                        </div>
                        {openCategory === group.category ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </Button>

                      {openCategory === group.category && (
                        <div className="p-4 border-t border-gray-100 bg-gray-50">
                          <div className="space-y-4">
                            {group.subcategories.map(subcategory => (
                              <div key={subcategory.type} className="space-y-2">
                                <h5 className="text-sm font-medium text-gray-700 mb-2">
                                  {subcategory.type}
                                </h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {subcategory.keywords.map(keyword => (
                                    <Button
                                      key={keyword}
                                      variant={
                                        personaPreferences.tones.includes(
                                          keyword
                                        )
                                          ? "default"
                                          : "outline"
                                      }
                                      size="sm"
                                      disabled={
                                        !personaPreferences.tones.includes(
                                          keyword
                                        ) &&
                                        personaPreferences.tones.length >= 3
                                      }
                                      onClick={() =>
                                        setPersonaPreferences(prev => ({
                                          ...prev,
                                          tones: prev.tones.includes(keyword)
                                            ? prev.tones.filter(
                                                t => t !== keyword
                                              )
                                            : prev.tones.length < 3
                                              ? [...prev.tones, keyword]
                                              : prev.tones,
                                        }))
                                      }
                                      className={cn(
                                        "text-xs px-3 py-2 rounded-lg transition-all justify-start text-left h-auto",
                                        personaPreferences.tones.includes(
                                          keyword
                                        )
                                          ? "bg-primary text-white shadow-sm"
                                          : "hover:bg-white hover:border-primary bg-white",
                                        !personaPreferences.tones.includes(
                                          keyword
                                        ) &&
                                          personaPreferences.tones.length >=
                                            3 &&
                                          "opacity-50 cursor-not-allowed"
                                      )}
                                    >
                                      <div className="flex items-center gap-2">
                                        {personaPreferences.tones.includes(
                                          keyword
                                        ) && (
                                          <CheckCircle className="w-3 h-3" />
                                        )}
                                        <span className="text-break-words leading-tight">
                                          {keyword}
                                        </span>
                                      </div>
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* 선택된 어조 표시 */}
                {personaPreferences.tones.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">
                      선택된 어조 ({personaPreferences.tones.length}/3)
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {personaPreferences.tones.map(tone => (
                        <span
                          key={tone}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {tone}
                          <button
                            onClick={() =>
                              setPersonaPreferences(prev => ({
                                ...prev,
                                tones: prev.tones.filter(t => t !== tone),
                              }))
                            }
                            className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 justify-center mt-8">
                <Button
                  variant="outline"
                  onClick={() => setStep("preferences")}
                  className="px-6 py-3 rounded-2xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  이전: 상담사 특성
                </Button>
                <Button
                  onClick={() => {
                    getRecommendationsMutation.mutate({
                      concernKeywords: selectedConcerns,
                      personaPreferences,
                    });
                  }}
                  disabled={
                    getRecommendationsMutation.isPending ||
                    personaPreferences.tones.length === 0 ||
                    personaPreferences.tones.length > 3
                  }
                  className="gradient-primary px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  {getRecommendationsMutation.isPending
                    ? "상담사 생성 중..."
                    : "맞춤 상담사 생성하기"}
                </Button>
              </div>
            </>
          )}

          {/* Step 4: Persona Selection */}
          {step === "personas" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {recommendations.map(persona => (
                  <PersonaCard
                    key={persona.type}
                    type={persona.type}
                    name={persona.name}
                    description={persona.description}
                    slogan={persona.slogan}
                    matchingRank={persona.matchingRank}
                    reasons={persona.reason}
                    recommended={persona.matchingRank === "최상"}
                    onClick={() => handlePersonaSelect(persona)}
                  />
                ))}
              </div>

              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  onClick={() => setStep("tones")}
                  className="px-6 py-3 rounded-2xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  이전: 어조 다시 선택
                </Button>
              </div>

              {createSessionMutation.isPending && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">
                    상담 세션을 준비하고 있습니다...
                  </p>
                </div>
              )}
            </>
          )}

          {/* Step 3: Chat Interface */}
          {step === "chat" && currentSession && (
            <ChatInterface
              session={currentSession}
              userId={user.id}
              onEndSession={handleEndSession}
            />
          )}
        </div>
      </div>

      {/* 상담 제한 다이얼로그 */}
      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent className="sm:max-w-[500px] shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-orange-600 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              상담 개수 제한
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-base leading-relaxed mt-3">
              현재 진행 중인 상담이 5개입니다. 새로운 상담을 시작하려면 먼저
              기존 상담을 정리해 주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h4 className="font-semibold text-orange-800 mb-2">
                💡 상담 정리 방법
              </h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• 완료된 상담을 종료하여 정리하세요</li>
                <li>• 불필요한 상담을 삭제하세요</li>
                <li>
                  • 상담 편집 모드에서 여러 상담을 선택 삭제할 수 있습니다
                </li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowLimitDialog(false)}
              className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 만족도 조사 팝업 */}
      <SatisfactionSurveyDialog
        isOpen={showSurveyDialog}
        onClose={() => setShowSurveyDialog(false)}
        serviceType="counseling"
      />
      <PremiumUpgradeModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        feature="고급 AI 상담"
        title="프리미엄 AI 상담사가 기다리고 있어요"
        description="더욱 정교하고 개인화된 상담 경험을 위해 프리미엄 구독을 시작하세요."
      />
    </div>
  );
}
