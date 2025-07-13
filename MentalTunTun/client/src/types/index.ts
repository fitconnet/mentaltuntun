export interface User {
  id: number;
  email: string;
  name: string;
  birthDate?: string;
  occupation?: string;
  mbti?: string;
  interests: string[];
  personality: Record<string, any>;
  createdAt?: Date;
}

export interface EmotionRecord {
  id: number;
  userId: number;
  date: string;
  emotions: string[];
  note?: string;
  createdAt?: Date;
}

export interface CounselingSession {
  id: number;
  userId: number;
  personaType: "strategic" | "empathetic" | "cheerful";
  concernKeywords: string[];
  selectedTones?: string[];
  isActive: boolean;
  createdAt?: Date;
}

export interface ChatMessage {
  id: number;
  sessionId: number;
  role: "user" | "assistant";
  content: string;
  createdAt?: Date;
}

export interface ScheduleAppointment {
  id: number;
  userId: number;
  type: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  repeatType?: string;
  repeatDays?: string[];
  reminderMinutes: number;
  memo?: string;
  status: string;
  selectedDate?: string; // 삭제 시 사용되는 선택된 날짜
  createdAt?: Date;
}

export interface PersonaRecommendation {
  type: "strategic" | "empathetic" | "cheerful";
  name: string;
  description: string;
  slogan?: string;
  matchingRank: "최상" | "상" | "중";
  reason: string[];
}

export interface PersonaPreferences {
  gender: "male" | "female" | "any";
  ageGroup: "10s" | "20s" | "30s" | "40s" | "50s" | "60s" | "any";
  role: string; // 역할 페르소나 키워드
  tones: string[];
}

export interface PersonalityReport {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  lifestyle_recommendations: string[];
  hobby_recommendations: string[];
  personal_growth_tips: string[];
}

export interface DetailedAnalysis {
  personality_traits: {
    keywords: string[];
    content: { [key: string]: string };
  };
  career_path: {
    keywords: string[];
    content: { [key: string]: string };
  };
  personal_growth: {
    keywords: string[];
    content: { [key: string]: string };
  };
  relationships: {
    keywords: string[];
    content: { [key: string]: string };
  };
  caution_areas: {
    keywords: string[];
    content: { [key: string]: string };
  };
}

export interface InterestCategory {
  id: string;
  name: string;
  icon: string;
  subcategories: string[];
  color: string;
}

export interface EmotionCategory {
  id: string;
  name: string;
  emoji: string;
  color: string;
  emotions: string[];
}

export const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    id: "creativity",
    name: "🎨 창의성",
    icon: "palette",
    color: "red",
    subcategories: ["음악", "미술", "디자인", "글쓰기", "사진", "영화"],
  },
  {
    id: "career",
    name: "💼 커리어",
    icon: "briefcase",
    color: "blue",
    subcategories: ["리더십", "기획", "분석", "영업", "마케팅", "창업"],
  },
  {
    id: "development",
    name: "📚 자기계발",
    icon: "book",
    color: "green",
    subcategories: ["독서", "학습", "언어", "자격증", "강의", "멘토링"],
  },
  {
    id: "lifestyle",
    name: "🧘 라이프스타일",
    icon: "spa",
    color: "purple",
    subcategories: ["요가", "명상", "운동", "요리", "여행", "반려동물"],
  },
  {
    id: "hobbies",
    name: "🧩 취미",
    icon: "puzzle-piece",
    color: "yellow",
    subcategories: ["게임", "보드게임", "수집", "만들기", "원예", "낚시"],
  },
  {
    id: "digital",
    name: "📱 디지털",
    icon: "mobile-alt",
    color: "indigo",
    subcategories: ["앱개발", "SNS", "유튜브", "블로그", "쇼핑", "스트리밍"],
  },
  {
    id: "values",
    name: "🌱 가치",
    icon: "leaf",
    color: "teal",
    subcategories: ["환경", "사회공헌", "봉사", "가족", "우정", "종교"],
  },
  {
    id: "technology",
    name: "💡 기술",
    icon: "lightbulb",
    color: "orange",
    subcategories: ["AI", "프로그래밍", "로봇", "전자기기", "과학", "혁신"],
  },
];

export const EMOTION_CATEGORIES: EmotionCategory[] = [
  {
    id: "positive",
    name: "😊 긍정",
    emoji: "😊",
    color: "yellow",
    emotions: ["기쁨", "평온", "만족", "설렘", "감사", "희망"],
  },
  {
    id: "neutral",
    name: "😐 중립",
    emoji: "😐",
    color: "gray",
    emotions: ["평범", "무덤덤", "침착", "집중", "사색", "관찰"],
  },
  {
    id: "negative",
    name: "😢 부정",
    emoji: "😢",
    color: "blue",
    emotions: ["슬픔", "우울", "실망", "외로움", "후회", "좌절"],
  },
  {
    id: "anger",
    name: "😡 분노",
    emoji: "😡",
    color: "red",
    emotions: ["화남", "짜증", "분노", "억울", "답답", "반감"],
  },
  {
    id: "anxiety",
    name: "😰 불안",
    emoji: "😰",
    color: "purple",
    emotions: ["불안", "걱정", "긴장", "두려움", "스트레스", "초조"],
  },
  {
    id: "love",
    name: "💗 사랑",
    emoji: "💗",
    color: "pink",
    emotions: ["사랑", "애정", "따뜻함", "친밀감", "유대감", "공감"],
  },
];

// 대주제 키워드와 하위 키워드 구조
export const CONCERN_CATEGORIES = {
  "감정 관련": {
    icon: "🧠",
    subcategories: {
      "부정 감정": [
        "불안",
        "초조",
        "두려움",
        "분노",
        "외로움",
        "고독",
        "무기력",
        "공허함",
        "우울",
        "짜증",
        "질투",
        "억울함",
        "죄책감",
        "후회",
        "수치심",
        "열등감",
      ],
      "긍정 감정": [
        "안도",
        "평온",
        "안정감",
        "희망",
        "기쁨",
        "감사",
        "만족감",
        "기대",
        "행복",
        "사랑",
        "감동",
        "성취감",
        "자신감",
        "용기",
        "여유",
        "흥미",
      ],
    },
  },
  "자아/정체성": {
    icon: "👤",
    subcategories: {
      자존감: ["자기혐오", "자아분열", "자기비하"],
      정체성: ["자아정체성", "존재의 의미", "나다움"],
      성장: ["회복탄력성", "감정 조절"],
      완벽주의: ["자기수용", "내면아이"],
    },
  },
  인간관계: {
    icon: "🧍‍♀️",
    subcategories: {
      가족: ["가족 갈등", "부모 관계", "형제 간 불화"],
      친구: ["친구 관계", "따돌림", "관계 피로감"],
      연애: ["연애", "이별", "썸", "집착", "불안형 애착"],
      직장: ["직장 내 인간관계", "상사 스트레스", "팀 내 갈등"],
      사회성: ["사회성 부족", "거절 불안", "경계 설정"],
    },
  },
  "일/학업/미래": {
    icon: "🏢",
    subcategories: {
      직업: ["취업 스트레스", "퇴사 고민", "커리어 방향"],
      학업: ["성적 압박", "학업 번아웃", "시험 불안"],
      동기: ["동기 부족", "무의미감", "허무주의"],
      시간관리: ["일중독", "성취 강박"],
      미래불안: ["막막함", "결정장애", "선택 불안"],
    },
  },
  "행동/습관": {
    icon: "💬",
    subcategories: {
      회피행동: ["회피", "미루기", "중독(스마트폰, 알코올 등)"],
      자해행동: ["자해", "폭식", "불면증", "강박 행동"],
      생활패턴: ["우울 루틴", "규칙 무너짐", "수면 장애"],
      감정조절: ["감정 폭발", "폭언", "감정 억제"],
    },
  },
  "삶/존재/철학": {
    icon: "🔮",
    subcategories: {
      "삶의 의미": ["삶의 의미", "죽음에 대한 생각", "종교적 갈등"],
      "철학적 고민": ["죄의식", "운명론", "불교·명상·영성적 질문"],
      존재론: ["존재론적 외로움", "정체성 해체", "탈진"],
    },
  },
  "상담 관련": {
    icon: "🔄",
    subcategories: {
      치료방법: ["심리상담", "정신과", "CBT", "감정일기", "명상"],
      트라우마: ["트라우마", "EMDR", "내담자", "치료 저항"],
      상담과정: ["상담관계", "라포", "해석", "전이", "자각"],
      심리분석: ["감정 표현", "무의식", "방어기제", "분석"],
    },
  },
};

// 기존 호환성을 위한 평면화된 키워드 배열
export const CONCERN_KEYWORDS = Object.values(CONCERN_CATEGORIES).flatMap(
  category => Object.values(category.subcategories).flat()
);
