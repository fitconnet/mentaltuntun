import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { userApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { MallangiCharacter } from "@/components/characters/MallangiCharacter";
import { TunteCharacter } from "@/components/characters/TunteCharacter";

// 관심사 카테고리
const INTEREST_CATEGORIES = [
  {
    id: "creativity",
    name: "창의성 / 예술",
    emoji: "🎨",
    keywords: [
      "디자인",
      "일러스트",
      "음악",
      "사진",
      "영상편집",
      "창작글",
      "수공예",
      "미술",
      "무용",
      "연기",
    ],
  },
  {
    id: "career",
    name: "커리어 / 직무",
    emoji: "💼",
    keywords: [
      "스타트업",
      "마케팅",
      "개발",
      "창업",
      "영업",
      "UX디자인",
      "데이터 분석",
      "기획",
      "컨설팅",
      "HR",
    ],
  },
  {
    id: "learning",
    name: "학습 / 자기계발",
    emoji: "📚",
    keywords: [
      "외국어",
      "독서",
      "코칭",
      "심리학",
      "글쓰기",
      "논리력",
      "공부법",
      "강의",
      "온라인 교육",
      "자격증",
    ],
  },
  {
    id: "lifestyle",
    name: "라이프스타일",
    emoji: "🧘‍♀️",
    keywords: [
      "미니멀리즘",
      "여행",
      "요가",
      "채식",
      "명상",
      "플래너",
      "자산관리",
      "인테리어",
      "요리",
      "건강관리",
    ],
  },
  {
    id: "hobby",
    name: "취미 / 놀이",
    emoji: "🧩",
    keywords: [
      "보드게임",
      "덕질",
      "캠핑",
      "게임",
      "드로잉",
      "반려동물",
      "영화감상",
      "독서",
      "운동",
      "수집",
    ],
  },
  {
    id: "digital",
    name: "디지털 문화",
    emoji: "📱",
    keywords: [
      "유튜브",
      "인스타그램",
      "웹툰",
      "숏폼",
      "트렌드 분석",
      "크리에이터",
      "SNS",
      "스트리밍",
      "온라인 쇼핑",
    ],
  },
  {
    id: "values",
    name: "가치 / 사회참여",
    emoji: "🌱",
    keywords: [
      "환경",
      "비건",
      "사회적기업",
      "봉사",
      "페미니즘",
      "정치",
      "교육격차",
      "기부",
      "사회정의",
      "동물권",
    ],
  },
  {
    id: "tech",
    name: "기술 / 혁신",
    emoji: "💡",
    keywords: [
      "AI",
      "블록체인",
      "Web3",
      "가상현실",
      "테크 스타트업",
      "미래도시",
      "IoT",
      "빅데이터",
      "로봇",
      "메타버스",
    ],
  },
];

// 성향 키워드
const PERSONALITY_TRAITS = [
  {
    category: "가치관 & 태도",
    traits: [
      "성취지향",
      "안정추구",
      "변화선호",
      "보수적",
      "모험적",
      "계획형",
      "창의적",
      "현실적",
      "개인주의",
      "공동체지향",
      "외향적",
      "내향적",
      "감성적",
      "이성적",
      "실용주의",
      "이상주의",
      "독립적",
      "의존적",
      "논리중시",
      "감정중시",
    ],
  },
  {
    category: "학습 성향",
    traits: [
      "책 애호가",
      "온라인 강의파",
      "독학 선호",
      "멘토 선호",
      "구조적 학습",
      "자유 탐색",
      "문해력 중심",
      "수치/데이터 중심",
      "심화 탐구",
      "넓은 탐색",
      "경험 중심 학습",
      "이론 중심 학습",
      "토론 선호",
      "혼자 몰입",
      "시각 자료 선호",
      "텍스트 선호",
      "실습형",
      "개념형",
    ],
  },
  {
    category: "라이프스타일",
    traits: [
      "아침형",
      "저녁형",
      "루틴 선호",
      "유연한 일정",
      "디지털 노마드",
      "정착형",
      "여행 좋아함",
      "집콕 선호",
      "다이어리 사용",
      "앱 기반 기록",
      "걷기 선호",
      "실내운동 선호",
      "식물 키움",
      "반려동물 키움",
      "건강식 추구",
      "맛 우선",
      "미니멀리스트",
      "수집가 성향",
    ],
  },
  {
    category: "업무 성향",
    traits: [
      "팀워크 중심",
      "개인 몰입 중심",
      "빠른 실행",
      "완벽 추구",
      "비전 중심",
      "현실 기반",
      "리더 성향",
      "서포터 성향",
      "직관적 판단",
      "근거 기반 판단",
      "새로운 도전 선호",
      "안정된 구조 선호",
      "문제 해결자",
      "아이디어 제안자",
      "전략가",
      "실행가",
      "멀티태스커",
      "집중형",
    ],
  },
  {
    category: "콘텐츠 성향",
    traits: [
      "숏폼 중심",
      "롱폼 중심",
      "유튜브",
      "넷플릭스",
      "리얼리티",
      "다큐멘터리",
      "뉴스/시사",
      "감성콘텐츠",
      "웹툰 소비",
      "책 독서 선호",
      "게임 선호",
      "영상 선호",
      "브이로그",
      "튜토리얼",
      "SNS 활발",
      "비활성 사용자",
      "유행 탐색",
      "자기 취향 고수",
    ],
  },
];

// MBTI 옵션
const MBTI_OPTIONS = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
];

type Step = "basic" | "interests" | "personality" | "optional";

interface ProfileData {
  name: string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  gender: string;
  occupation: string;
  interests: string[];
  personality: string[];
  mbti: string;
  birthTime: string;
}

export default function ProfilePage() {
  const [currentStep, setCurrentStep] = useState<Step>("basic");
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    birthYear: "",
    birthMonth: "",
    birthDay: "",
    gender: "",
    occupation: "",
    interests: [],
    personality: [],
    mbti: "",
    birthTime: "",
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const saveProfileMutation = useMutation({
    mutationFn: async (data: ProfileData) => {
      const birthDate =
        data.birthYear && data.birthMonth && data.birthDay
          ? `${data.birthYear}-${data.birthMonth.padStart(2, "0")}-${data.birthDay.padStart(2, "0")}`
          : undefined;

      const userData = {
        name: data.name,
        birthDate,
        occupation: data.occupation,
        interests: data.interests,
        personality: Object.fromEntries(data.personality.map(p => [p, true])),
        mbti: data.mbti,
        profileCompleted: true,
      };

      // Firebase UID 기반 프로필 저장 API 호출
      const response = await fetch("/api/saveUserProfile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: `email_${Date.now()}`,
          email: "temp@example.com",
          name: data.name,
          mbti: data.mbti,
          interests: data.interests,
          personality: data.personality,
          birthDate: birthDate,
          occupation: data.occupation,
          gender: data.gender || "",
          subscriptionType: "free",
        }),
      });

      if (!response.ok) {
        throw new Error("프로필 저장 실패");
      }

      const result = await response.json();

      // localStorage에 저장
      localStorage.setItem("user", JSON.stringify(result.user));

      return result.user;
    },
    onSuccess: () => {
      setLocation("/");
    },
    onError: error => {
      console.error("Profile save error:", error);
      toast({
        title: "저장 실패",
        description: "다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  const progress = () => {
    const steps = ["basic", "interests", "personality", "optional"];
    return ((steps.indexOf(currentStep) + 1) / steps.length) * 100;
  };

  const handleNext = () => {
    const steps: Step[] = ["basic", "interests", "personality", "optional"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handlePrev = () => {
    const steps: Step[] = ["basic", "interests", "personality", "optional"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleInterestToggle = (interest: string) => {
    setProfileData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handlePersonalityToggle = (trait: string) => {
    setProfileData(prev => ({
      ...prev,
      personality: prev.personality.includes(trait)
        ? prev.personality.filter(p => p !== trait)
        : [...prev.personality, trait],
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case "basic":
        return (
          profileData.name &&
          profileData.birthYear &&
          profileData.birthMonth &&
          profileData.birthDay &&
          profileData.gender
        );
      case "interests":
        return profileData.interests.length > 0;
      case "personality":
        return profileData.personality.length > 0;
      case "optional":
        return true;
      default:
        return false;
    }
  };

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <MallangiCharacter size="lg" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          기본 정보를 알려주세요
        </h2>
        <p className="text-gray-600 mb-2">
          더 나은 상담을 위해 필요한 정보입니다
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <p className="text-blue-800 text-sm font-medium">
            <span className="text-red-600">*</span> 표시된 항목은 필수 입력
            사항입니다
          </p>
          <p className="text-blue-700 text-xs mt-1">
            개인정보는 오직 상담 서비스 제공 목적으로만 사용됩니다
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">이름 *</Label>
          <Input
            id="name"
            value={profileData.name}
            onChange={e =>
              setProfileData(prev => ({ ...prev, name: e.target.value }))
            }
            placeholder="이름을 입력해주세요"
            className="mt-1"
          />
        </div>

        <div>
          <Label>생년월일 *</Label>
          <div className="grid grid-cols-3 gap-3 mt-2">
            <div>
              <Select
                value={profileData.birthYear}
                onValueChange={value =>
                  setProfileData(prev => ({ ...prev, birthYear: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="년도" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 60 }, (_, i) => 2024 - i).map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}년
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={profileData.birthMonth}
                onValueChange={value =>
                  setProfileData(prev => ({ ...prev, birthMonth: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="월" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <SelectItem key={month} value={month.toString()}>
                      {month}월
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={profileData.birthDay}
                onValueChange={value =>
                  setProfileData(prev => ({ ...prev, birthDay: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="일" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}일
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div>
          <Label>성별 *</Label>
          <div className="flex gap-3 mt-2">
            {["남성", "여성", "기타"].map(gender => (
              <Button
                key={gender}
                variant={profileData.gender === gender ? "default" : "outline"}
                onClick={() => setProfileData(prev => ({ ...prev, gender }))}
                className="flex-1"
              >
                {gender}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderInterests = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <TunteCharacter size="lg" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          관심사를 선택해주세요
        </h2>
        <p className="text-gray-600 mb-2">
          여러 개 선택 가능해요 (선택: {profileData.interests.length}개)
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
          <p className="text-green-800 text-sm font-medium">
            선택사항이지만, 초개인화된 상담을 위해 솔직하고 자세한 입력을
            부탁드려요
          </p>
          <p className="text-green-700 text-xs mt-1">
            더 많은 관심사를 선택할수록 더 정확한 맞춤 상담을 받을 수 있습니다
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {INTEREST_CATEGORIES.map(category => (
          <Card
            key={category.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              selectedCategory === category.id ? "ring-2 ring-primary" : ""
            )}
            onClick={() =>
              setSelectedCategory(
                selectedCategory === category.id ? null : category.id
              )
            }
          >
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">{category.emoji}</div>
              <div className="font-medium text-sm">{category.name}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedCategory && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">
              {INTEREST_CATEGORIES.find(c => c.id === selectedCategory)?.name}{" "}
              키워드
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {INTEREST_CATEGORIES.find(
                c => c.id === selectedCategory
              )?.keywords.map(keyword => (
                <Badge
                  key={keyword}
                  variant={
                    profileData.interests.includes(keyword)
                      ? "default"
                      : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() => handleInterestToggle(keyword)}
                >
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderPersonality = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="flex justify-center space-x-4 mb-4">
          <MallangiCharacter size="md" />
          <TunteCharacter size="md" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          성향을 선택해주세요
        </h2>
        <p className="text-gray-600 mb-2">
          자신과 맞다고 생각하는 키워드들을 선택해주세요 (선택:{" "}
          {profileData.personality.length}개)
        </p>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
          <p className="text-purple-800 text-sm font-medium">
            내 성향을 정확히 알려주시면 더 맞춤형 상담을 받을 수 있어요
          </p>
          <p className="text-purple-700 text-xs mt-1">
            다양한 카테고리에서 솔직하게 선택해주세요
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {PERSONALITY_TRAITS.map(section => (
          <Card key={section.category}>
            <CardHeader>
              <CardTitle className="text-lg">{section.category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {section.traits.map(trait => (
                  <Badge
                    key={trait}
                    variant={
                      profileData.personality.includes(trait)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => handlePersonalityToggle(trait)}
                  >
                    {trait}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderOptional = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <MallangiCharacter size="lg" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          추가 정보 (선택사항)
        </h2>
        <p className="text-gray-600 mb-2">
          더 정확한 분석을 위한 선택적 정보입니다
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
          <p className="text-amber-800 text-sm font-medium">
            선택사항이지만, 초개인화된 상담을 위해 솔직하고 자세한 입력을
            부탁드려요
          </p>
          <p className="text-amber-700 text-xs mt-1">
            개인정보는 상담만을 위해서 사용되며, 안전하게 보호됩니다
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="occupation">직업</Label>
          <Input
            id="occupation"
            value={profileData.occupation}
            onChange={e =>
              setProfileData(prev => ({ ...prev, occupation: e.target.value }))
            }
            placeholder="직업을 입력해주세요"
            className="mt-1"
          />
        </div>

        <div>
          <Label>MBTI</Label>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {MBTI_OPTIONS.map(mbti => (
              <Button
                key={mbti}
                variant={profileData.mbti === mbti ? "default" : "outline"}
                onClick={() =>
                  setProfileData(prev => ({
                    ...prev,
                    mbti: prev.mbti === mbti ? "" : mbti,
                  }))
                }
                className="text-sm"
              >
                {mbti}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="birthTime">태어난 시간</Label>
          <Input
            id="birthTime"
            type="time"
            value={profileData.birthTime}
            onChange={e =>
              setProfileData(prev => ({ ...prev, birthTime: e.target.value }))
            }
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen gradient-soft">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <Progress value={progress()} className="h-2" />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>기본정보</span>
              <span>관심사</span>
              <span>성향</span>
              <span>추가정보</span>
            </div>
          </div>

          <Card className="card-healing">
            <CardContent className="p-8">
              {currentStep === "basic" && renderBasicInfo()}
              {currentStep === "interests" && renderInterests()}
              {currentStep === "personality" && renderPersonality()}
              {currentStep === "optional" && renderOptional()}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  disabled={currentStep === "basic"}
                  className="flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  이전
                </Button>

                {currentStep === "optional" ? (
                  <Button
                    onClick={() => saveProfileMutation.mutate(profileData)}
                    disabled={saveProfileMutation.isPending}
                    className="flex items-center"
                  >
                    {saveProfileMutation.isPending ? "분석 중..." : "완료"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="flex items-center"
                  >
                    다음
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
