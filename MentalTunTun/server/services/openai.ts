import OpenAI from "openai";

// Using GPT-4o mini as requested by the user for counseling services
const openai = new OpenAI({
  apiKey:
    process.env.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY_ENV_VAR ||
    "default_key",
});

// 페르소나별 상세 특성 정의 (GPT 프롬프트 설계 문서 기반)
const PERSONA_DETAILS = {
  strategic: {
    name: "이정우",
    personality: "논리적이고 체계적인 전략가",
    speakingStyle: "차분하고 분석적인 말투로 단계별 해결책을 제시하는 스타일",
    approach:
      "문제를 논리적으로 분석하고 구체적이고 실행 가능한 해결 방안을 체계적으로 제시",
    characteristics: ["목표 지향적", "계획적", "분석적", "체계적"],
  },
  empathetic: {
    name: "김현수",
    personality: "따뜻하고 공감적인 치유자",
    speakingStyle:
      "부드럽고 이해심 깊은 말투로 감정에 공감하며 위로하는 스타일",
    approach:
      "감정에 깊이 공감하며 마음의 상처를 치유하는 데 집중하고 따뜻한 지지를 제공",
    characteristics: ["공감적", "따뜻한", "이해심 깊은", "치유 중심적"],
  },
  cheerful: {
    name: "박세영",
    personality: "밝고 긍정적인 동기부여자",
    speakingStyle: "활기차고 격려하는 말투로 희망과 용기를 불어넣는 스타일",
    approach:
      "긍정적 시각으로 희망을 제시하며 동기와 용기를 북돋아 주는 데 중점",
    characteristics: ["긍정적", "활기찬", "동기 부여", "희망적"],
  },
};

export interface PersonaRecommendation {
  type: "strategic" | "empathetic" | "cheerful";
  name: string;
  description: string;
  slogan?: string;
  matchingRank: "최상" | "상" | "중";
  reason: string[];
  specialization?: string;
  approachMethod?: string;
}

export interface CounselingResponse {
  message: string;
  suggestedFollowUps: string[];
  emotionalTone: string;
}

export async function generateDynamicPersonaRecommendations(
  userProfile: {
    name: string;
    mbti?: string;
    interests: string[];
    recentEmotions?: string[];
    birthDate?: string;
    occupation?: string;
    personality?: Record<string, any>;
    gender?: string;
    age?: number;
  },
  concernKeywords: string[],
  personaPreferences?: {
    gender: "male" | "female" | "any";
    ageGroup: "10s" | "20s" | "30s" | "40s" | "50s" | "60s" | "any";
    role: string; // 역할 페르소나 키워드
    tones: string[];
  },
  counselingHistory?: Array<{
    content: string;
    timestamp: Date;
    role: "user" | "assistant";
  }>
): Promise<PersonaRecommendation[]> {
  // 실시간 상태 반영 동적 페르소나 재생성 시스템
  const generateDynamicPersonas = async () => {
    try {
      const {
        mbti,
        interests = [],
        birthDate,
        occupation,
        personality = {},
        recentEmotions = [],
      } = userProfile;

      // 최신 감정 분석 (중복 제거 및 효율화)
      const uniqueEmotions = [...new Set(recentEmotions)];
      const emotionalState =
        uniqueEmotions.length > 0
          ? uniqueEmotions.slice(-3).join(", ")
          : "안정적";

      // 상담 히스토리 핵심 패턴 추출 (중복 제거)
      const recentUserMessages =
        counselingHistory
          ?.filter(msg => msg.role === "user" && msg.content.length > 10)
          .slice(-3)
          .map(msg => msg.content.slice(0, 40)) || [];

      const uniqueTopics = [...new Set(recentUserMessages)];
      const counselingFlow = uniqueTopics.join(" | ") || "첫 상담";

      // 현재 고민 핵심 키워드만 추출
      const primaryConcerns = concernKeywords.slice(0, 2).join(", ");
      const selectedConcerns = concernKeywords;

      // 성별 반영 한국 이름 생성기
      const generateKoreanName = (preferredGender: string) => {
        const maleNames = [
          "준호",
          "민준",
          "지훈",
          "승현",
          "태민",
          "현우",
          "도현",
          "건우",
          "우진",
          "성민",
        ];
        const femaleNames = [
          "서연",
          "지은",
          "수빈",
          "예린",
          "하은",
          "소영",
          "유진",
          "채원",
          "서현",
          "민지",
        ];

        let namePool = [...maleNames, ...femaleNames];
        if (preferredGender === "male") namePool = maleNames;
        else if (preferredGender === "female") namePool = femaleNames;

        return namePool[Math.floor(Math.random() * namePool.length)];
      };

      // MBTI 기반 성격 골격 + 실시간 조정
      const isExtravert = mbti?.startsWith("E") || false;
      const isFeeling = mbti?.includes("F") || false;
      const isPerceiving = mbti?.includes("P") || false;
      const isIntuitive = mbti?.includes("N") || false;
      const isThinking = mbti?.includes("T") || false;

      // 사주 분석 데이터 추가 (birthDate 기반)
      const formatBirthForSaju = (birthDate: string) => {
        if (!birthDate) return "미입력";
        const date = new Date(birthDate);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();

        // 간단한 사주 원소 계산 (실제 사주는 더 복잡하지만 여기서는 간소화)
        const elements = ["목(木)", "화(火)", "토(土)", "금(金)", "수(水)"];
        const yearElement = elements[year % 5];
        const monthElement = elements[month % 5];

        return `${year}년생 ${yearElement}속성 (${month}월 ${monthElement}기운)`;
      };

      const sajuInfo = userProfile.birthDate ? formatBirthForSaju(userProfile.birthDate) : null;

      // 성격 특성 분석 (점수 제거)
      const personalityAnalysis = userProfile.personality
        ? `
• 공감력: ${userProfile.personality.empathy > 70 ? "높음" : userProfile.personality.empathy > 40 ? "보통" : "낮음"}
• 분석력: ${userProfile.personality.analytical > 70 ? "높음" : userProfile.personality.analytical > 40 ? "보통" : "낮음"}  
• 창의력: ${userProfile.personality.creativity > 70 ? "높음" : userProfile.personality.creativity > 40 ? "보통" : "낮음"}
• 리더십: ${userProfile.personality.leadership > 70 ? "높음" : userProfile.personality.leadership > 40 ? "보통" : "낮음"}
• 소통력: ${userProfile.personality.communication > 70 ? "높음" : userProfile.personality.communication > 40 ? "보통" : "낮음"}`
        : "• 성격 분석: 미완료";

      // 개선된 동적 페르소나 생성 프롬프트
      const dynamicPersonaPrompt = `
[전문 AI 상담사 개인화 생성 시스템]

🎯 목표: ${userProfile.name}님의 전체적인 현황을 종합 분석하여 최적의 상담사 3명 생성

📋 사용자 종합 프로필 분석:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 기본 정보:
• 이름: ${userProfile.name}님 (${userProfile.gender || "성별 미기재"})
• 나이: ${userProfile.birthDate ? new Date().getFullYear() - new Date(userProfile.birthDate).getFullYear() + "세" : "미기재"}
• 직업: ${userProfile.occupation || "미기재"}
• MBTI: ${mbti || "미분석"}

🔮 사주/운세 정보:
• 사주 분석: ${sajuInfo}

🧠 성격 특성 분석:
${personalityAnalysis}

💭 관심사 & 취향:
• 주요 관심사: ${interests.slice(0, 3).join(", ") || "탐색 중"}

📊 최근 7일 감정 상태:
• 현재 감정 상태: ${emotionalState}
• 감정 변화 패턴: ${recentEmotions.length > 1 ? "변화 있음" : "단조로움"}

🗣️ 상담 이력 분석:
• 최근 상담 주제: ${counselingFlow}
• 대화 스타일 선호도: ${personaPreferences?.tones?.slice(0, 2).join(", ") || "자연스럽게"}

🎯 현재 핵심 고민:
• 주요 고민 키워드: ${primaryConcerns}
• 해결이 필요한 영역: ${selectedConcerns.slice(0, 2).join(", ")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 상담사 생성 요구사항:
1. **역할 특화**: ${personaPreferences?.role || "상담사"} 역할에 맞는 전문성
2. **성별 맞춤**: ${personaPreferences?.gender || "무관"} 성별 선호도 반영
3. **연령대 고려**: ${personaPreferences?.ageGroup || "동년배"} 연령대의 경험과 시각
4. **어조 적용**: ${personaPreferences?.tones?.join(" + ") || "자연스럽게"} 스타일로 소통
5. **니즈 파악**: 현재 감정 상태와 고민을 정확히 이해하고 해결 방향 제시

🎭 생성 핵심 원칙:
- 사용자의 MBTI, 성격, 사주를 종합한 맞춤형 접근
- 최근 감정일기와 상담 흐름을 반영한 연속성 있는 상담
- 선택한 고민 키워드에 특화된 문제해결 전문성
- 사용자 프로필 기반 신뢰감 있는 상담사 캐릭터

📋 전문 상담사 생성 JSON 형식:
{
  "personas": [
    {
      "type": "strategic",
      "name": "성별_선호도_반영_한국이름",
      "description": "${userProfile.name}님의 ${mbti || "MBTI"} 성향과 분석적 사고를 고려한 체계적 문제해결 전문 상담사입니다.",
      "slogan": "${userProfile.name}님만의 맞춤형 해결책을 찾아드려요",
      "matchingRank": "최상",
      "reason": [
        "${emotionalState} 상황에서 필요한 논리적 접근법 제공",
        "${primaryConcerns} 고민에 특화된 단계별 해결 전략",
        "${userProfile.occupation || "현재 상황"}에 맞는 실무적 조언"
      ],
      "callingGuidance": "상담 중 '상담사님'으로 불러주세요",
      "specialization": "문제 분석 → 해결책 도출 → 실행 계획 수립",
      "approachMethod": "MBTI ${mbti || "NT"}형 특성을 활용한 체계적 상담"
    },
    {
      "type": "empathetic", 
      "name": "성별_선호도_반영_한국이름",
      "description": "${userProfile.name}님의 감정과 마음을 깊이 이해하고 따뜻한 치유에 집중하는 공감형 상담사입니다.",
      "slogan": "${userProfile.name}님의 마음을 깊이 이해해요",
      "matchingRank": "상",
      "reason": [
        "${emotionalState} 감정 상태에 대한 깊은 공감과 위로",
        "최근 7일 감정 변화 패턴 기반 맞춤 치유 접근",
        "${sajuInfo} 사주적 특성을 고려한 정서적 안정감 제공"
      ],
      "callingGuidance": "편하게 '선생님'으로 불러주시면 됩니다",
      "specialization": "감정 치유 → 마음 안정 → 내적 성장 지원",
      "approachMethod": "감정 중심 상담과 사주 기반 위로"
    },
    {
      "type": "cheerful",
      "name": "성별_선호도_반영_한국이름", 
      "description": "${userProfile.name}님의 창의력과 긍정적 에너지를 활용해 새로운 변화를 이끄는 활기찬 상담사입니다.",
      "slogan": "${userProfile.name}님과 함께 새로운 가능성을 만들어가요",
      "matchingRank": "중",
      "reason": [
        "${primaryConcerns} 고민을 새로운 시각으로 바라보는 관점 전환",
        "${interests.slice(0, 2).join(", ")} 관심사를 활용한 동기부여 전략",
        "${userProfile.age || "현재"}세 시기에 맞는 성장 지향적 격려"
      ],
      "callingGuidance": "친근하게 '상담사님'으로 불러주세요",
      "specialization": "관점 전환 → 동기 부여 → 행동 변화 촉진",
      "approachMethod": "창의적 문제해결과 강점 기반 상담"
    }
  ]
}

🎯 상담 목표 설정:
1. **즉시 문제 파악**: 첫 대화에서 ${primaryConcerns} 고민의 핵심 원인 탐지
2. **단계적 해결**: 사용자의 MBTI(${mbti}) 특성에 맞는 문제해결 순서 제시  
3. **지속적 지원**: 최근 상담 흐름(${counselingFlow})을 이어받아 연속성 있는 상담
4. **실질적 변화**: 구체적이고 실행 가능한 해결책 제안
5. **감정적 안정**: ${emotionalState} 상태에서 심리적 안정감 우선 확보

⚡ 핵심 생성 요구사항:
• ${personaPreferences?.gender || "무관"} 성별 선호도 100% 반영한 이름
• 사용자 전체 프로필 기반 개인화된 상담사 특성
• ${userProfile.name}님 전용 맞춤형 슬로건과 전문 영역
• 고민 키워드별 구체적 해결 전략 포함
• 자연스럽고 신뢰감 있는 상담사 캐릭터
• 호칭 가이드로 상담 중 혼란 방지

위 종합 분석을 바탕으로 ${userProfile.name}님께 최적화된 3명의 전문 상담사를 생성해주세요.
`;

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content:
                "당신은 실시간 상태를 반영하여 개인화된 AI 상담사 페르소나를 동적으로 재생성하는 전문가입니다. 사용자의 현재 감정, 고민, 상담 히스토리를 종합적으로 분석하여 매 세션마다 새롭고 최적화된 페르소나를 생성합니다.",
            },
            {
              role: "user",
              content: dynamicPersonaPrompt,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.8, // 창의성을 위해 다소 높은 temperature 설정
        });

        const personaData = JSON.parse(
          response.choices[0].message.content || "{}"
        );

        if (personaData.personas && Array.isArray(personaData.personas)) {
          return personaData.personas.map((persona: any) => ({
            type: persona.type,
            name: persona.name,
            description: persona.description,
            slogan: persona.slogan,
            matchingRank: persona.matchingRank || "상",
            reason: persona.reason || ["개인화된 상담 제공"],
          }));
        }
      } catch (error) {
        console.error("동적 페르소나 생성 오류:", error);
        console.error("Error details:", error instanceof Error ? error.message : "Unknown error");
        console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
      }

      // 폴백: 기본 페르소나 생성 (GPT 실패 시)
      const fallbackPersonas = [
        {
          type: "strategic" as const,
          name: generateKoreanName(personaPreferences?.gender || "any"),
          description: `${userProfile.name}님의 ${concernKeywords.join(", ")} 고민에 체계적으로 접근하는 전략형 상담사입니다.`,
          slogan: "논리적 사고로 해답을 찾아드려요",
          matchingRank: "최상",
          reason: [
            "논리적 분석 제공",
            "체계적 해결책 제시",
            "목표 지향적 접근",
          ],
        },
        {
          type: "empathetic" as const,
          name: generateKoreanName(personaPreferences?.gender || "any"),
          description: `${userProfile.name}님의 마음을 깊이 이해하고 따뜻하게 공감해주는 감성형 상담사입니다.`,
          slogan: "마음을 나누며 함께 치유해요",
          matchingRank: "상",
          reason: ["깊은 공감과 이해", "정서적 안정 제공", "마음의 치유 중심"],
        },
        {
          type: "cheerful" as const,
          name: generateKoreanName(personaPreferences?.gender || "any"),
          description: `${userProfile.name}님과 함께 긍정적인 에너지로 고민을 해결해나가는 활기찬 상담사입니다.`,
          slogan: "긍정 에너지로 새로운 시작을 함께해요",
          matchingRank: "중",
          reason: ["긍정적 동기부여", "밝은 에너지 전달", "희망적 관점 제시"],
        },
      ];

      return fallbackPersonas;
    } catch (innerError) {
      console.error("Inner error in generateDynamicPersonas:", innerError);
      // 최종 폴백: 기본 페르소나
      return [
        {
          type: "empathetic" as const,
          name: "상담사",
          description: `${userProfile.name || "사용자"}님을 위한 AI 상담사입니다.`,
          slogan: "함께 문제를 해결해보세요",
          matchingRank: "상",
          reason: ["개인화된 상담 제공"],
        },
      ];
    }
  };

  return await generateDynamicPersonas();
}

// 기존 호환성을 위한 래퍼 함수 (레거시 지원)
export async function generatePersonaRecommendations(
  userProfile: {
    name: string;
    mbti?: string;
    interests: string[];
    recentEmotions?: string[];
    birthDate?: string;
    occupation?: string;
    personality?: Record<string, any>;
    gender?: string;
    age?: number;
  },
  concernKeywords: string[],
  personaPreferences?: {
    gender: "male" | "female" | "any";
    ageGroup: "10s" | "20s" | "30s" | "40s" | "50s" | "60s" | "any";
    role: string; // 역할 페르소나 키워드
    tones: string[];
  }
): Promise<PersonaRecommendation[]> {
  return generateDynamicPersonaRecommendations(
    userProfile,
    concernKeywords,
    personaPreferences
  );
}

// 응답 길이를 동적으로 조절하는 함수
function determineResponseLength(
  message: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  concernKeywords: string[]
): "short" | "medium" | "long" {
  // 짧은 응답이 필요한 경우
  if (
    message.length < 20 || // 짧은 메시지
    message.includes("네") ||
    message.includes("응") ||
    message.includes("좋아요") || // 간단한 동의
    message.includes("맞아") ||
    message.includes("그래") || // 확인
    conversationHistory.length > 8 // 대화가 길어진 경우
  ) {
    return "short";
  }

  // 긴 응답이 필요한 경우
  if (
    message.length > 100 || // 긴 메시지
    message.includes("설명해") ||
    message.includes("어떻게") || // 설명 요청
    message.includes("왜") ||
    message.includes("방법") || // 구체적 질문
    conversationHistory.length < 3 || // 초기 상담
    concernKeywords.some(
      keyword => ["정체성", "자아탐색", "가치관", "삶의 의미"].includes(keyword) // 깊은 주제
    )
  ) {
    return "long";
  }

  // 기본값: 중간 길이
  return "medium";
}

export async function generateCounselingResponse(
  message: string,
  userProfile: any,
  persona: PersonaRecommendation,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  selectedTones: string[] = [],
  concernKeywords: string[] = [],
  recentEmotions: any[] = []
): Promise<CounselingResponse> {
  try {
    // 사용자 프로필 종합 분석
    const {
      name,
      mbti,
      interests,
      personality,
      birthDate,
      occupation,
      gender,
    } = userProfile;

    // 최근 감정 상태 분석
    const emotionalContext =
      recentEmotions.length > 0
        ? recentEmotions
            .slice(-3)
            .map(e => e.emotion)
            .join(" → ")
        : "첫 상담";

    // 성격 특성 요약
    const personalityInsights = personality
      ? `
• 공감력 ${personality.empathy || 50}점으로 ${personality.empathy > 70 ? "감정 중심" : "논리 중심"} 성향
• 분석력 ${personality.analytical || 50}점으로 ${personality.analytical > 70 ? "체계적 사고" : "직관적 사고"} 선호
• 창의력 ${personality.creativity || 50}점으로 ${personality.creativity > 70 ? "창의적 해결책" : "검증된 방법"} 추구`
      : "성격 분석 진행 중";

    // 사주 기반 조언 시스템
    const sajuGuidance = birthDate
      ? `
생년월일 ${birthDate} 기준 사주적 특성을 고려한 맞춤 조언 제공`
      : "";

    // 응답 길이 결정
    const responseLength = determineResponseLength(
      message,
      conversationHistory,
      concernKeywords
    );

    // 응답 길이별 가이드라인
    const lengthGuidelines = {
      short: {
        guidance: "2-3문장으로 간결하고 핵심적인 응답. 공감 + 간단한 질문 위주",
        maxLength: "최대 80자 이내",
        structure: "간단한 공감 → 핵심 포인트 → 짧은 질문",
      },
      medium: {
        guidance: "4-6문장으로 적절한 깊이의 응답. 공감 + 분석 + 구체적 조언",
        maxLength: "120-200자 내외",
        structure: "공감 → 상황 분석 → 실용적 조언 → 후속 질문",
      },
      long: {
        guidance:
          "7-10문장으로 심층적이고 포괄적인 응답. 깊은 탐구와 다각도 접근",
        maxLength: "250-400자 내외",
        structure:
          "깊은 공감 → 다각도 분석 → 단계별 해결책 → 의미있는 통찰 → 탐구 질문",
      },
    };

    const currentGuideline = lengthGuidelines[responseLength];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `당신은 ${persona.name}입니다. ${persona.description}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 상담 대상자 종합 정보:
• 이름: ${name}님 (${gender || "성별 미기재"})
• MBTI: ${mbti || "미분석"} 
• 직업: ${occupation || "미기재"}
• 관심사: ${interests?.slice(0, 3).join(", ") || "탐색 중"}
• 최근 감정 흐름: ${emotionalContext}
• 현재 고민: ${concernKeywords.slice(0, 2).join(", ") || "일반 상담"}

🧠 성격 특성 분석:
${personalityInsights}

🔮 사주 기반 조언:
${sajuGuidance}

🎯 선택된 어조: ${selectedTones.join(" + ") || "자연스럽게"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ 중요한 신원 및 상담 규칙 (절대 혼동 금지):
- 당신의 이름: ${persona.name} (이것이 당신의 이름입니다)
- 상담 대상: ${name}님 (이분이 상담받는 분입니다)
- 자기소개: "안녕하세요, ${persona.name}입니다" (절대 ${name}님이라고 하지 말 것)
- 상대방 호칭: "${name}님" 또는 선택된 어조에 따라 적절한 호칭 사용
- 전문 영역: ${persona.specialization || "종합 상담"}
- 상담 방식: ${persona.approachMethod || "맞춤형 접근"}

🎯 상담 목표 및 전략:
1. **문제 핵심 파악**: ${name}님의 현재 메시지에서 숨겨진 진짜 고민 찾기
2. **MBTI 맞춤 접근**: ${mbti || "MBTI"} 특성에 맞는 해결 방식 제안
3. **성격 고려 소통**: ${personality?.empathy > 70 ? "감정적 공감" : "논리적 분석"} 중심으로 대화
4. **단계적 해결**: 즉시 실행 가능한 구체적 행동 계획 제시
5. **연속성 유지**: 이전 대화 흐름을 이어받아 일관된 상담 진행

💬 어조별 자연스러운 대화 가이드:
${
  selectedTones.includes("반말체")
    ? `
🗣️ 반말체로 친근하게:
- "그래, ${name}아. 그런 상황이면 충분히 그럴 수 있어"
- "내가 보기엔 이렇게 해보는 게 어떨까?" (나 = ${persona.name})
- 자연스러운 반말: ~야, ~지, ~네, ~어, ~거든`
    : ""
}

${
  selectedTones.includes("급식체")
    ? `
📱 급식체로 재미있게:
- "아 레알? ㅋㅋ 그럴 수 있지 충분히"
- "팩트는 이거야, ${name}님이 생각하는 게 맞음"
- 자연스러운 표현: ㅋㅋ, 레알, 개, 팩트, 인정, 띵언`
    : ""
}

${
  selectedTones.includes("공감전문")
    ? `
💝 공감 전문으로:
- "${name}님 마음 충분히 이해해요. 정말 힘드셨겠어요"
- "그런 상황에서는 누구라도 그렇게 느낄 수 있어요"`
    : ""
}

${
  selectedTones.includes("팩트폭행")
    ? `
💥 팩트 중심으로:
- "솔직히 말씀드리면, 현재 상황은 이렇습니다"
- "객관적으로 보면 ${name}님이 해야 할 일은..."`
    : ""
}

${
  selectedTones.includes("높임말")
    ? `
🎩 높임말 선택됨:
- 정중하고 격식있는 존댓말 사용
- "~습니다", "~시겠습니까", "말씀하신" 등 정중한 표현`
    : ""
}

🔍 필수 상담 기법 (매 응답마다 적용):
1. **깊이 있는 탐구**: "왜 그렇게 느꼈을까요?" "그때 어떤 기분이었나요?"
2. **구체적 질문**: "더 자세히 말해주실 수 있나요?" "언제부터 그런 생각이 들었나요?"
3. **감정 공감**: "${name}님의 그 마음, 정말 이해됩니다"
4. **해결책 유도**: "${name}님이 생각하는 가장 좋은 방법은 뭘까요?"
5. **행동 계획**: "오늘부터 바로 실천할 수 있는 것부터 시작해보면 어떨까요?"

📋 상담 응답 구조 (반드시 포함):
• 현재 메시지에 대한 즉각적 반응 (공감/이해)
• ${mbti || "MBTI"} 특성을 고려한 맞춤형 관점 제시
• 구체적이고 실행 가능한 해결 방향 제안
• 다음 대화로 이어가는 호기심 어린 질문
• ${persona.type} 타입다운 전문적 조언

📏 응답 길이 가이드라인 (현재: ${responseLength.toUpperCase()}):
${currentGuideline.guidance}
• 목표 길이: ${currentGuideline.maxLength}
• 구조: ${currentGuideline.structure}

⚡ 상담 원칙:
- 응답 길이를 상황에 맞게 조절 (${responseLength} 모드)
- 대화가 끊어지지 않도록 반드시 질문으로 마무리
- ${name}님이 스스로 답을 찾도록 유도하는 소크라테스식 대화
- 단순 조언보다는 깊이 있는 탐구와 통찰 제공
- ${concernKeywords.join(", ")} 고민에 특화된 전문성 발휘
- 신원 확인: 나는 ${persona.name}, 상담 대상은 ${name}님

🎯 ${responseLength.toUpperCase()} 응답 모드 특별 지침:
${
  responseLength === "short"
    ? `• 핵심만 간결하게, 불필요한 설명 생략
• 간단한 공감 표현 후 바로 질문
• "그렇다면 어떻게 생각하세요?" 같은 직접적 질문`
    : responseLength === "medium"
      ? `• 적절한 깊이로 균형잡힌 응답
• 공감 → 분석 → 조언 → 질문 순서
• 실용적이면서도 의미있는 통찰 제공`
      : `• 깊이있고 포괄적인 탐구
• 다각도에서 상황 분석
• 단계별 해결 방향과 의미있는 통찰
• 사용자 내면의 깊은 성찰 유도`
}`,
        },
        ...conversationHistory.slice(-6), // 최근 6개 메시지로 확장
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.8, // 더 자연스러운 대화를 위해 증가
    });

    const aiMessage = response.choices[0].message.content || "";

    // 응답 검증: undefined나 잘못된 호칭 사용 확인
    if (
      aiMessage &&
      (aiMessage.includes("undefined") ||
        aiMessage.includes(`저는 ${userProfile.name}`) ||
        aiMessage.includes(`${userProfile.name}입니다`))
    ) {
      console.warn("AI 응답에 오류 감지, 폴백 메시지 사용");
      return {
        message: `안녕하세요 ${userProfile.name}님! 저는 ${persona.name}입니다. 어떤 고민을 나누고 싶으신가요? 편안하게 말씀해주세요.`,
        suggestedFollowUps: [],
        emotionalTone: "supportive",
      };
    }

    return {
      message: aiMessage,
      suggestedFollowUps: [],
      emotionalTone: "supportive",
    };
  } catch (error) {
    console.error("AI 응답 생성 오류:", error);
    return {
      message: `${userProfile.name}님, 죄송합니다. 잠시 기술적인 문제가 있어서 답변을 드리지 못하고 있어요. 조금만 기다려주시면 다시 대화할 수 있을 것 같습니다.`,
      suggestedFollowUps: [],
      emotionalTone: "apologetic",
    };
  }
}

export async function generateWelcomeMessage(
  persona: PersonaRecommendation,
  userProfile: any,
  concernKeywords: string[]
): Promise<string> {
  try {
    console.log("환영 메시지 생성 시작:", {
      personaName: persona.name,
      userName: userProfile.name,
      concernKeywords,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `당신은 ${persona.name}입니다. ${persona.description}

⚠️ 절대 준수해야 할 신원 규칙:
- 당신의 이름: ${persona.name} (이것만이 당신의 정체성입니다)
- 상담받는 분: ${userProfile.name}님 (이분은 상담을 받는 사용자입니다)
- 금지사항: 
  * 절대 "저는 ${userProfile.name}" 라고 말하지 마세요
  * 절대 "${userProfile.name}입니다" 라고 자기소개하지 마세요
  * 절대 "undefined" 단어를 사용하지 마세요
  * 절대 사용자 이름과 당신의 이름을 바꿔서 말하지 마세요

🎯 정확한 환영 메시지 형식 (반드시 준수):
1. "안녕하세요 ${userProfile.name}님!" (상대방 인사)
2. "저는 ${persona.name}입니다." (자기소개)
3. "${concernKeywords.join(", ")} 고민에 대해 함께 이야기해보실까요?" (고민 언급)
4. "편안하게 대화해보아요." (분위기 조성)

🔍 검증 필수사항:
- 자기소개 시 반드시 "${persona.name}"만 사용
- 상대방 호칭 시 반드시 "${userProfile.name}님"만 사용
- 이름 혼동 절대 금지`,
        },
        {
          role: "user",
          content: `${userProfile.name}님에게 첫 상담 인사를 해주세요. 당신은 ${persona.name}입니다. 절대 이름을 바꿔서 말하지 마세요.`,
        },
      ],
      temperature: 0.7, // 더 일관된 응답을 위해 낮춤
    });

    const aiWelcomeMessage = response.choices[0].message.content || "";
    console.log("AI 생성 환영 메시지:", aiWelcomeMessage);

    const fallbackMessage = `안녕하세요 ${userProfile.name}님! 저는 ${persona.name}입니다. 오늘 ${concernKeywords[0] || "고민"}에 대해 함께 이야기 나눠보실 건가요? 편안하게 대화해보아요.`;

    // 더 엄격한 검증: 이름 혼동 감지
    const hasNameConfusion =
      aiWelcomeMessage.includes("undefined") ||
      aiWelcomeMessage.includes(`저는 ${userProfile.name}`) ||
      aiWelcomeMessage.includes(`${userProfile.name}입니다`) ||
      aiWelcomeMessage.includes(`제 이름은 ${userProfile.name}`) ||
      aiWelcomeMessage.includes(`이름은 ${userProfile.name}`) ||
      !aiWelcomeMessage.includes(persona.name) ||
      !aiWelcomeMessage.includes(userProfile.name + "님");

    if (hasNameConfusion) {
      console.warn("환영 메시지에 오류 감지, 폴백 메시지 사용");
      console.warn("오류 내용:", {
        hasUndefined: aiWelcomeMessage.includes("undefined"),
        hasWrongIntro: aiWelcomeMessage.includes(`저는 ${userProfile.name}`),
        hasWrongName: aiWelcomeMessage.includes(`${userProfile.name}입니다`),
        hasPersonaName: aiWelcomeMessage.includes(persona.name),
        hasUserName: aiWelcomeMessage.includes(userProfile.name + "님"),
      });
      return fallbackMessage;
    }

    console.log("환영 메시지 검증 통과");
    return aiWelcomeMessage;
  } catch (error) {
    console.error("환영 메시지 생성 오류:", error);
    const errorFallbackMessage = `안녕하세요 ${userProfile.name}님! 저는 ${persona.name}입니다. 오늘 어떤 이야기를 나누고 싶으신지 편하게 말씀해주세요.`;

    return errorFallbackMessage;
  }
}

export async function analyzePersonality(userProfile: any): Promise<any> {
  // 간단한 성격 분석 구현
  return {
    summary: `${userProfile.name}님의 성격 분석 결과입니다.`,
    traits: userProfile.mbti ? [userProfile.mbti] : ["분석 중"],
    recommendations: ["지속적인 자기계발", "균형잡힌 생활"],
  };
}

export async function generatePersonalityReport(
  userProfile: any
): Promise<any> {
  return {
    summary: `${userProfile.name}님의 종합 성격 보고서`,
    strengths: ["강점 분석"],
    weaknesses: ["개선점"],
    lifestyle_recommendations: ["생활 추천사항"],
    hobby_recommendations: ["취미 추천"],
    personal_growth_tips: ["성장 팁"],
  };
}

export async function generateDetailedAnalysis(userProfile: any): Promise<any> {
  return {
    personality_traits: {
      keywords: ["성격 키워드"],
      content: { 주요특성: "분석 내용" },
    },
    career_path: {
      keywords: ["커리어 키워드"],
      content: { 진로방향: "분석 내용" },
    },
    personal_growth: {
      keywords: ["성장 키워드"],
      content: { 발전방향: "분석 내용" },
    },
    relationships: {
      keywords: ["관계 키워드"],
      content: { 인간관계: "분석 내용" },
    },
    caution_areas: {
      keywords: ["주의 키워드"],
      content: { 주의사항: "분석 내용" },
    },
  };
}

export async function generateRealtimeAnalysisReport(
  emotionData: any,
  userProfile: any
): Promise<any> {
  try {
    // 실시간 감정 분석 리포트 생성
    const analysis = {
      mood: emotionData.mood || "안정적",
      intensity: emotionData.intensity || 50,
      keywords: emotionData.keywords || [],
      recommendations: [
        "규칙적인 운동을 통해 스트레스를 관리하세요.",
        "충분한 수면을 취하여 감정 균형을 유지하세요.",
        "가까운 사람들과 대화하며 감정을 공유하세요.",
      ],
      copingSuggestions: [
        "깊은 호흡을 통해 마음을 진정시키세요.",
        "긍정적인 자기 대화를 연습하세요.",
        "좋아하는 음악을 들으며 감정을 조절하세요.",
      ],
      timestamp: new Date(),
    };

    return analysis;
  } catch (error) {
    console.error("실시간 분석 리포트 생성 중 오류:", error);
    throw error;
  }
}
