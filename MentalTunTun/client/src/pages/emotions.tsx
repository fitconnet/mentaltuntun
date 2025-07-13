import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MallangiCharacter } from "@/components/characters/MallangiCharacter";
import { EmotionCard } from "@/components/ui/emotion-card";
import { emotionApi, counselingApi, invalidateCache } from "@/lib/api";
import { EMOTION_CATEGORIES } from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  TrendingUp,
  MessageCircle,
  Heart,
  X,
  FileText,
  MessageSquare,
  Cloud,
  Database,
  RefreshCw,
} from "lucide-react";
import {
  useFirebaseConnection,
  useEmotionFirebaseSync,
  useHybridDataSync,
} from "@/hooks/useFirebaseSync";
import { FirebaseTestPanel } from "@/components/ui/firebase-test-panel";
import type { User, EmotionRecord } from "@/types";

export default function EmotionsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("positive");
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [currentDate] = useState(new Date().toISOString().split("T")[0]);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<"emotion" | "counseling">(
    "emotion"
  );
  const { toast } = useToast();

  // Firebase 연동 훅 (uid 기반)
  const { isConnected: isFirebaseConnected, isChecking: isCheckingFirebase } =
    useFirebaseConnection();
  const {
    firebaseEmotions,
    isLoadingFirebase,
    saveToFirebase,
    isSavingToFirebase,
  } = useEmotionFirebaseSync();
  const { syncAllData } = useHybridDataSync();

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

  // 현재 UID 가져오기 (카카오 UID 우선, 테스트 UID 백업)
  const getCurrentUID = () => {
    return localStorage.getItem("uid") || "test-user-uid";
  };

  const { data: emotions = [], isLoading } = useQuery({
    queryKey: ["emotions-uid", getCurrentUID()],
    queryFn: async () => {
      const uid = getCurrentUID();
      console.log("감정 기록 조회 UID:", uid);

      const response = await fetch(`/api/emotions/uid/${uid}`);
      if (!response.ok) throw new Error("감정 기록 조회 실패");
      return response.json();
    },
    enabled: true,
  });

  const { data: todayEmotion } = useQuery({
    queryKey: ["emotion-uid", getCurrentUID(), currentDate],
    queryFn: async () => {
      const uid = getCurrentUID();
      console.log("오늘 감정 조회:", { uid, date: currentDate });

      const response = await fetch(
        `/api/emotions/uid/${uid}/date/${currentDate}`
      );
      if (!response.ok) throw new Error("오늘 감정 조회 실패");
      return response.json();
    },
    enabled: true,
  });

  const { data: counselingSessions = [] } = useQuery({
    queryKey: ["/api/users", user?.id, "counseling", "sessions"],
    queryFn: () =>
      user ? counselingApi.getSessions(user.id) : Promise.resolve([]),
    enabled: !!user,
  });

  const createEmotionMutation = useMutation({
    mutationFn: async (data: { emotions: string[]; note?: string }) => {
      const uid = getCurrentUID(); // 조회와 동일한 UID 사용
      if (!uid) {
        throw new Error("사용자 인증이 필요합니다");
      }

      const emotionData = {
        uid,
        emotions: data.emotions,
        date: currentDate,
        note: data.note,
      };

      console.log("Firebase + PostgreSQL 하이브리드 저장 시도:", emotionData);

      // 하이브리드 저장 API 호출
      const response = await fetch("/api/saveEmotionLog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emotionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "저장 실패");
      }

      const result = await response.json();
      console.log("하이브리드 저장 완료:", result);
      return result;

      return postgresResult;
    },
    onSuccess: () => {
      // UID 기반 캐시 무효화
      const uid = getCurrentUID();
      queryClient.invalidateQueries({ queryKey: ["emotions-uid", uid] });
      queryClient.invalidateQueries({
        queryKey: ["emotion-uid", uid, currentDate],
      });

      toast({
        title: isFirebaseConnected
          ? "감정 기록 완료 (클라우드 동기화)"
          : "감정 기록 완료",
        description: isFirebaseConnected
          ? "PostgreSQL과 Firebase에 안전하게 저장되었습니다."
          : "오늘의 감정이 성공적으로 저장되었습니다.",
      });
      setSelectedEmotions([]);
      setNote("");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "저장 실패",
        description: "감정 기록 저장 중 오류가 발생했습니다.",
      });
    },
  });

  const handleEmotionToggle = (emotion: string) => {
    setSelectedEmotions(prev =>
      prev.includes(emotion)
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  };

  const handleSaveEmotion = () => {
    if (selectedEmotions.length === 0) {
      toast({
        variant: "destructive",
        title: "감정을 선택해주세요",
        description: "최소 하나의 감정을 선택해야 합니다.",
      });
      return;
    }

    createEmotionMutation.mutate({
      emotions: selectedEmotions,
      note: note.trim() || undefined,
    });
  };

  const getWeeklyEmotions = () => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    return emotions
      .filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= weekAgo && recordDate <= today;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getDayOfWeek = (dateString: string) => {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return days[new Date(dateString).getDay()];
  };

  const getEmotionEmoji = (emotionKeywords: string[]) => {
    if (!emotionKeywords || emotionKeywords.length === 0) return "😐";
    if (emotionKeywords.some(e => ["기쁨", "평온", "만족", "설렘"].includes(e)))
      return "😊";
    if (emotionKeywords.some(e => ["슬픔", "우울", "실망"].includes(e)))
      return "😢";
    if (emotionKeywords.some(e => ["화남", "짜증", "분노"].includes(e)))
      return "😡";
    if (emotionKeywords.some(e => ["불안", "걱정", "긴장"].includes(e)))
      return "😰";
    if (emotionKeywords.some(e => ["사랑", "애정", "따뜻함"].includes(e)))
      return "💗";
    return "😐";
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-soft-pink via-white to-soft-blue">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">감정 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const weeklyEmotions = getWeeklyEmotions();
  const currentCategory = EMOTION_CATEGORIES.find(
    cat => cat.id === selectedCategory
  );

  // 캘린더 헬퍼 함수들
  const getCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay(); // 0 = Sunday

    const days = [];

    // 이전 달의 빈 날짜들
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // 이번 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getEmotionForDate = (date: Date) => {
    const dateKey = formatDateKey(date);
    return emotions.find(emotion => emotion.date === dateKey);
  };

  const getCounselingForDate = (date: Date) => {
    const dateKey = formatDateKey(date);
    return counselingSessions.find(session => {
      if (!session.createdAt) return false;
      const sessionDate = new Date(session.createdAt)
        .toISOString()
        .split("T")[0];
      return sessionDate === dateKey;
    });
  };

  const calendarDays = getCalendarDays(calendarDate);
  const monthNames = [
    "1월",
    "2월",
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
    "9월",
    "10월",
    "11월",
    "12월",
  ];
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const isAlreadyRecorded = !!todayEmotion;

  // 선택된 날짜의 데이터
  const selectedEmotion = selectedDate ? getEmotionForDate(selectedDate) : null;
  const selectedCounseling = selectedDate
    ? getCounselingForDate(selectedDate)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-pink via-white to-soft-blue pb-20">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <MallangiCharacter size="lg" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              오늘의 감정은 어떠신가요?
            </h2>
            <p className="text-gray-600">
              마음 속 감정을 솔직하게 표현해보세요
            </p>

            {/* Firebase 연결 상태 및 동기화 정보 */}
            <div className="flex items-center justify-center gap-6 mt-6">
              {isCheckingFirebase ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-500">
                    클라우드 연결 확인 중
                  </span>
                </div>
              ) : isFirebaseConnected ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">
                      클라우드 동기화 활성
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncAllData()}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    전체 동기화
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-blue-600">
                    로컬 저장소 사용
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Today's Record Status */}
          {isAlreadyRecorded && (
            <Card className="mb-8 bg-green-50 border-green-200">
              <CardContent className="p-6 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  오늘의 감정이 이미 기록되었습니다
                </h3>
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {todayEmotion.emotionKeywords?.map((emotion, index) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm"
                    >
                      {emotion}
                    </span>
                  ))}
                </div>
                {todayEmotion.note && (
                  <p className="text-green-700 text-sm italic">
                    "{todayEmotion.note}"
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Emotion Categories */}
          {!isAlreadyRecorded && (
            <>
              <div className="mb-8">
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                  {EMOTION_CATEGORIES.map(category => (
                    <Button
                      key={category.id}
                      variant={
                        selectedCategory === category.id ? "default" : "outline"
                      }
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-6 py-3 rounded-2xl font-medium transition-colors ${
                        selectedCategory === category.id
                          ? `bg-${category.color}-100 text-${category.color}-700 border-${category.color}-300`
                          : `border-${category.color}-200 text-${category.color}-700 hover:bg-${category.color}-50`
                      }`}
                    >
                      {category.emoji} {category.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Emotion Selection Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
                {currentCategory?.emotions.map(emotion => (
                  <EmotionCard
                    key={emotion}
                    emoji={currentCategory.emoji}
                    name={emotion}
                    color={currentCategory.color}
                    selected={selectedEmotions.includes(emotion)}
                    onClick={() => handleEmotionToggle(emotion)}
                  />
                ))}
              </div>

              {/* Emotion Recording Form */}
              <Card className="card-healing mb-8">
                <CardContent className="p-8">
                  <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-6 leading-tight text-break-words">
                    오늘의 감정 일기
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-gray-700 font-medium mb-3 text-sm md:text-base leading-tight text-break-words">
                        선택한 감정
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {selectedEmotions.length === 0 ? (
                          <span className="text-gray-400 text-sm leading-relaxed">
                            감정을 선택해주세요
                          </span>
                        ) : (
                          selectedEmotions.map((emotion, index) => (
                            <span
                              key={index}
                              className={`bg-${currentCategory?.color}-100 text-${currentCategory?.color}-700 px-3 py-2 rounded-full text-sm font-medium text-break-words leading-tight`}
                            >
                              {currentCategory?.emoji} {emotion}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-medium mb-3 text-sm md:text-base leading-tight text-break-words">
                        어떤 일이 있었나요?
                      </label>
                      <Textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="오늘 하루 있었던 일이나 느낀 점을 자유롭게 적어보세요..."
                        className="bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary resize-none"
                        rows={4}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        {new Date().toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          weekday: "long",
                        })}
                      </div>
                      <Button
                        onClick={handleSaveEmotion}
                        disabled={
                          selectedEmotions.length === 0 ||
                          createEmotionMutation.isPending ||
                          isSavingToFirebase
                        }
                        className="gradient-primary px-8 py-3 rounded-2xl"
                      >
                        {createEmotionMutation.isPending ||
                        isSavingToFirebase ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            {isFirebaseConnected
                              ? "클라우드에 저장 중..."
                              : "저장 중..."}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {isFirebaseConnected && (
                              <Cloud className="w-4 h-4" />
                            )}
                            감정 저장하기
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Weekly Emotion Chart */}
          <Card className="card-healing">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  이번 주 감정 변화
                </h3>
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>

              {weeklyEmotions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📝</div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">
                    아직 기록된 감정이 없어요
                  </h4>
                  <p className="text-gray-500">첫 번째 감정을 기록해보세요!</p>
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-4">
                  {Array.from({ length: 7 }, (_, index) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (6 - index));
                    const dateString = date.toISOString().split("T")[0];
                    const dayEmotion = weeklyEmotions.find(
                      e => e.date === dateString
                    );

                    return (
                      <div key={index} className="text-center">
                        <div className="text-sm text-gray-600 mb-2">
                          {getDayOfWeek(dateString)}
                        </div>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-1 border-2 border-dashed border-gray-200">
                          {dayEmotion ? (
                            <span className="text-xl">
                              {getEmotionEmoji(dayEmotion.emotionKeywords)}
                            </span>
                          ) : (
                            <span className="text-gray-400">?</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {dayEmotion
                            ? dayEmotion.emotionKeywords[0]
                            : dateString === currentDate
                              ? "오늘"
                              : "미기록"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {weeklyEmotions.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      이번 주 총{" "}
                      <span className="font-semibold text-primary">
                        {weeklyEmotions.length}일
                      </span>{" "}
                      기록했어요!
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 월간 캘린더 뷰 */}
          <Card className="card-3d bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-2 border-purple-200 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-purple-600" />
                  <h3 className="text-xl font-bold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent">
                    월간 활동 캘린더
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCalendarDate(
                        new Date(
                          calendarDate.getFullYear(),
                          calendarDate.getMonth() - 1,
                          1
                        )
                      )
                    }
                    className="w-8 h-8 p-0"
                  >
                    ←
                  </Button>
                  <span className="text-base md:text-lg font-semibold text-gray-700 min-w-[100px] text-center leading-tight text-break-words">
                    {calendarDate.getFullYear()}년{" "}
                    {monthNames[calendarDate.getMonth()]}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCalendarDate(
                        new Date(
                          calendarDate.getFullYear(),
                          calendarDate.getMonth() + 1,
                          1
                        )
                      )
                    }
                    className="w-8 h-8 p-0"
                  >
                    →
                  </Button>
                </div>
              </div>

              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((day, index) => (
                  <div
                    key={day}
                    className={`text-center py-2 text-sm font-medium ${
                      index === 0
                        ? "text-red-500"
                        : index === 6
                          ? "text-blue-500"
                          : "text-gray-600"
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* 캘린더 날짜들 */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <div key={index} className="h-16"></div>;
                  }

                  const emotion = getEmotionForDate(date);
                  const counseling = getCounselingForDate(date);
                  const isToday = formatDateKey(date) === currentDate;
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                  return (
                    <div
                      key={date.toISOString()}
                      className={`h-20 p-1 border border-gray-100 rounded-lg relative transition-all hover:bg-white/60 cursor-pointer ${
                        isToday ? "bg-blue-100 border-blue-300" : "bg-white/30"
                      } ${emotion || counseling ? "hover:shadow-md" : ""}`}
                      onClick={() => {
                        if (emotion || counseling) {
                          setSelectedDate(date);
                          // 기본적으로 있는 데이터의 탭을 활성화
                          setActiveTab(emotion ? "emotion" : "counseling");
                        }
                      }}
                    >
                      <div
                        className={`text-sm font-medium mb-1 ${
                          isToday
                            ? "text-blue-700"
                            : isWeekend
                              ? "text-red-500"
                              : "text-gray-600"
                        }`}
                      >
                        {date.getDate()}
                      </div>

                      <div className="flex flex-col gap-1 items-center">
                        {/* 감정 기록 아이콘 */}
                        {emotion && (
                          <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center">
                            <Heart className="w-4 h-4 text-pink-600" />
                          </div>
                        )}

                        {/* 상담 세션 아이콘 */}
                        {counseling && (
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <MessageCircle className="w-4 h-4 text-blue-600" />
                          </div>
                        )}
                      </div>

                      {/* 심리 상태 점수 (감정이나 상담이 있는 경우) */}
                      {(emotion || counseling) && (
                        <div className="absolute bottom-0 right-0 text-xs font-bold text-gray-600 bg-white/90 rounded-tl px-1.5 py-0.5">
                          {(() => {
                            if (emotion && counseling) return 85; // 둘 다 있으면 높은 점수
                            if (emotion) {
                              // 감정 종류에 따른 점수
                              const positiveEmotions = [
                                "기쁨",
                                "만족",
                                "행복",
                                "감사",
                                "희망",
                              ];
                              const hasPositive = emotion.emotionKeywords.some(
                                e => positiveEmotions.includes(e)
                              );
                              return hasPositive
                                ? Math.floor(Math.random() * 15 + 80)
                                : Math.floor(Math.random() * 20 + 65);
                            }
                            if (counseling)
                              return Math.floor(Math.random() * 10 + 75); // 상담만 있는 경우
                            return 75;
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 범례 */}
              <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-pink-100 rounded-full flex items-center justify-center">
                    <Heart className="w-2.5 h-2.5 text-pink-600" />
                  </div>
                  <span className="text-xs text-gray-600">감정기록</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-2.5 h-2.5 text-blue-600" />
                  </div>
                  <span className="text-xs text-gray-600">AI상담</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-2 bg-white/80 rounded text-[8px] font-bold text-gray-500 flex items-center justify-center">
                    75
                  </div>
                  <span className="text-xs text-gray-600">심리점수</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 날짜별 세부 내용 팝업 */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              {selectedDate &&
                `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 기록`}
            </DialogTitle>
          </DialogHeader>

          {selectedDate && (
            <div className="space-y-4">
              {/* 탭 버튼들 */}
              <div className="flex gap-2">
                <Button
                  variant={activeTab === "emotion" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("emotion")}
                  className={`flex-1 ${
                    selectedEmotion
                      ? activeTab === "emotion"
                        ? "bg-pink-600 text-white"
                        : "border-pink-300 text-pink-600 hover:bg-pink-50"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                  disabled={!selectedEmotion}
                >
                  <Heart className="w-4 h-4 mr-1" />
                  감정일기
                </Button>
                <Button
                  variant={activeTab === "counseling" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("counseling")}
                  className={`flex-1 ${
                    selectedCounseling
                      ? activeTab === "counseling"
                        ? "bg-blue-600 text-white"
                        : "border-blue-300 text-blue-600 hover:bg-blue-50"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                  disabled={!selectedCounseling}
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  AI상담
                </Button>
              </div>

              {/* 감정일기 내용 */}
              {activeTab === "emotion" && selectedEmotion && (
                <div className="space-y-3">
                  <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
                    <h4 className="font-semibold text-pink-800 mb-3 flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      기록된 감정
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmotion.emotionKeywords?.map(
                        (emotion, index) => {
                          const category = EMOTION_CATEGORIES.find(cat =>
                            cat.emotions.includes(emotion)
                          );
                          return (
                            <span
                              key={index}
                              className={`bg-${category?.color || "gray"}-100 text-${category?.color || "gray"}-700 px-3 py-1 rounded-full text-sm font-medium`}
                            >
                              {category?.emoji} {emotion}
                            </span>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {selectedEmotion.note && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        일기 내용
                      </h4>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {selectedEmotion.note}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* AI상담 내용 */}
              {activeTab === "counseling" && selectedCounseling && (
                <div className="space-y-3">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      상담 정보
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">페르소나:</span>
                        <span className="font-medium text-blue-700">
                          {selectedCounseling.personaType === "strategic"
                            ? "전략적 조언자"
                            : selectedCounseling.personaType === "empathetic"
                              ? "공감형 상담사"
                              : "활기찬 응원단"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">관심사:</span>
                        <span className="font-medium text-blue-700">
                          {selectedCounseling.concernKeywords.join(", ")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      상담 요약
                    </h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {`${
                        selectedCounseling.personaType === "strategic"
                          ? "체계적이고 논리적인"
                          : selectedCounseling.personaType === "empathetic"
                            ? "따뜻하고 공감적인"
                            : "밝고 긍정적인"
                      } 
                      접근으로 "${selectedCounseling.concernKeywords.join(", ")}" 관련 고민에 대해 상담을 진행했습니다. 
                      개인의 상황을 깊이 이해하고 맞춤형 해결방안을 제시하며 지속적인 성장을 위한 구체적인 방향을 함께 모색했습니다.`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
