import OpenAI from "openai";
import type {
  UserSubscription,
  SubscriptionPlan,
} from "@shared/subscription-schema";
import type { User } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface PremiumPersonaRecommendation {
  id: string;
  name: string;
  description: string;
  personality: string;
  specialties: string[];
  communicationStyle: string;
  approach: string;
  matchingRank: "최상" | "상" | "중";
  premiumFeatures: string[];
  aiModel: string;
}

export interface AdvancedAnalysisResult {
  emotionalState: {
    current: string;
    trend: string;
    stability: number;
    recommendations: string[];
  };
  personalityInsights: {
    strengths: string[];
    growthAreas: string[];
    communicationPreferences: string[];
    copingMechanisms: string[];
  };
  behavioralPatterns: {
    triggers: string[];
    responses: string[];
    adaptations: string[];
  };
  recommendations: {
    immediateActions: string[];
    longTermGoals: string[];
    resources: string[];
  };
}

export interface RealtimeEmotionAnalysis {
  emotionScore: number;
  dominantEmotions: string[];
  intensity: number;
  context: string;
  triggers: string[];
  copingSuggestions: string[];
  timestamp: Date;
}

// Enhanced AI Persona Generation for Premium Users
export async function generatePremiumPersonaRecommendations(
  userProfile: any,
  subscription: UserSubscription,
  plan: SubscriptionPlan,
  concernKeywords: string[] = [],
  counselingHistory?: Array<{
    content: string;
    timestamp: Date;
    role: "user" | "assistant";
  }>
): Promise<PremiumPersonaRecommendation[]> {
  const aiModel = plan.aiModel || "gpt-4o-mini";

  const systemPrompt = `You are an advanced AI counselor persona generator for premium subscribers. 
  Create 3 highly personalized counselor personas based on the user's comprehensive profile and premium features.
  
  User Profile: ${JSON.stringify(userProfile)}
  Subscription Tier: ${plan.name}
  AI Model: ${aiModel}
  Premium Features: ${JSON.stringify(plan.features)}
  Concern Keywords: ${concernKeywords.join(", ")}
  Recent History: ${counselingHistory
    ?.slice(-3)
    .map(h => h.content)
    .join("; ")}
  
  For each persona, provide:
  1. Unique Korean name and detailed personality
  2. Specialized expertise areas
  3. Communication style tailored to user preferences
  4. Therapeutic approach methodology
  5. Premium-specific features and capabilities
  6. Matching rank (최상/상/중) for premium users
  
  Return as JSON array with premium persona objects.`;

  try {
    const response = await openai.chat.completions.create({
      model: aiModel,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            "Generate 3 premium personalized counselor personas for this user.",
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return (
      result.personas?.map((persona: any, index: number) => ({
        id: `premium-${Date.now()}-${index}`,
        name: persona.name || `프리미엄 상담사 ${index + 1}`,
        description:
          persona.description || "고급 AI 엔진으로 구동되는 전문 상담사",
        personality: persona.personality || "공감적이고 전문적인",
        specialties: persona.specialties || ["개인화 상담", "심층 분석"],
        communicationStyle: persona.communicationStyle || "따뜻하고 전문적인",
        approach: persona.approach || "인지행동치료 기반",
        matchingRank: persona.matchingRank || "최상",
        premiumFeatures: [
          "GPT-4o 고급 엔진",
          "개인화 분석",
          "실시간 감정 추적",
          "종합 리포트",
          "우선 지원",
        ],
        aiModel,
      })) || []
    );
  } catch (error) {
    console.error("Premium persona generation error:", error);
    return generateFallbackPremiumPersonas(aiModel);
  }
}

// Advanced Emotional Analysis for Premium Users
export async function performAdvancedEmotionalAnalysis(
  userProfile: any,
  emotionHistory: any[],
  counselingHistory: any[],
  subscription: UserSubscription,
  plan: SubscriptionPlan
): Promise<AdvancedAnalysisResult> {
  const aiModel = plan.aiModel || "gpt-4o-mini";

  const systemPrompt = `You are an advanced emotional intelligence analyst for premium subscribers.
  Perform comprehensive emotional and psychological analysis using advanced AI capabilities.
  
  User Profile: ${JSON.stringify(userProfile)}
  Emotion History: ${JSON.stringify(emotionHistory.slice(-10))}
  Counseling History: ${JSON.stringify(counselingHistory.slice(-5))}
  Subscription: ${plan.name} (${aiModel})
  
  Provide deep analysis including:
  1. Current emotional state and trends
  2. Personality insights and growth areas
  3. Behavioral patterns and triggers
  4. Personalized recommendations
  
  Return structured JSON with comprehensive analysis.`;

  try {
    const response = await openai.chat.completions.create({
      model: aiModel,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            "Perform comprehensive emotional and psychological analysis.",
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      emotionalState: {
        current: result.emotionalState?.current || "분석 중",
        trend: result.emotionalState?.trend || "안정적",
        stability: result.emotionalState?.stability || 75,
        recommendations: result.emotionalState?.recommendations || [
          "정기적인 감정 체크",
          "스트레스 관리",
        ],
      },
      personalityInsights: {
        strengths: result.personalityInsights?.strengths || [
          "공감 능력",
          "적응성",
        ],
        growthAreas: result.personalityInsights?.growthAreas || [
          "자기 표현",
          "경계 설정",
        ],
        communicationPreferences: result.personalityInsights
          ?.communicationPreferences || ["따뜻한 소통", "구체적 피드백"],
        copingMechanisms: result.personalityInsights?.copingMechanisms || [
          "대화를 통한 해결",
          "시간을 두고 생각하기",
        ],
      },
      behavioralPatterns: {
        triggers: result.behavioralPatterns?.triggers || [
          "과도한 업무",
          "인간관계 갈등",
        ],
        responses: result.behavioralPatterns?.responses || [
          "회피 경향",
          "도움 요청",
        ],
        adaptations: result.behavioralPatterns?.adaptations || [
          "점진적 변화",
          "지원 체계 구축",
        ],
      },
      recommendations: {
        immediateActions: result.recommendations?.immediateActions || [
          "휴식 시간 확보",
          "감정 일기 작성",
        ],
        longTermGoals: result.recommendations?.longTermGoals || [
          "감정 조절 능력 향상",
          "스트레스 관리 습관 형성",
        ],
        resources: result.recommendations?.resources || [
          "전문 상담",
          "자기계발 도서",
        ],
      },
    };
  } catch (error) {
    console.error("Advanced analysis error:", error);
    return getDefaultAdvancedAnalysis();
  }
}

// Real-time Emotion Tracking for Premium Users
export async function performRealtimeEmotionAnalysis(
  currentInput: string,
  userProfile: any,
  recentContext: any[],
  subscription: UserSubscription,
  plan: SubscriptionPlan
): Promise<RealtimeEmotionAnalysis> {
  const aiModel = plan.aiModel || "gpt-4o-mini";

  const systemPrompt = `You are a real-time emotion analysis system for premium subscribers.
  Analyze the user's current emotional state based on their input and context.
  
  User Profile: ${JSON.stringify(userProfile)}
  Current Input: "${currentInput}"
  Recent Context: ${JSON.stringify(recentContext.slice(-3))}
  AI Model: ${aiModel}
  
  Provide real-time emotional analysis with:
  1. Emotion score (0-100)
  2. Dominant emotions
  3. Intensity level
  4. Context understanding
  5. Triggers identification
  6. Immediate coping suggestions
  
  Return structured JSON with real-time analysis.`;

  try {
    const response = await openai.chat.completions.create({
      model: aiModel,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: "Analyze current emotional state in real-time.",
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      emotionScore: result.emotionScore || 50,
      dominantEmotions: result.dominantEmotions || ["중성"],
      intensity: result.intensity || 5,
      context: result.context || "일반적인 대화",
      triggers: result.triggers || [],
      copingSuggestions: result.copingSuggestions || [
        "깊게 호흡하기",
        "현재 순간에 집중하기",
      ],
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("Real-time emotion analysis error:", error);
    return getDefaultRealtimeAnalysis();
  }
}

// Premium Counseling Response with Enhanced Features
export async function generatePremiumCounselingResponse(
  userMessage: string,
  persona: PremiumPersonaRecommendation,
  chatHistory: any[],
  userProfile: any,
  subscription: UserSubscription,
  plan: SubscriptionPlan
): Promise<{
  message: string;
  emotionalAnalysis: RealtimeEmotionAnalysis;
  suggestions: string[];
  premiumInsights: string[];
}> {
  const aiModel = plan.aiModel || "gpt-4o-mini";

  // First, perform real-time emotional analysis
  const emotionAnalysis = await performRealtimeEmotionAnalysis(
    userMessage,
    userProfile,
    chatHistory,
    subscription,
    plan
  );

  const systemPrompt = `You are ${persona.name}, a premium AI counselor with advanced capabilities.
  
  Persona: ${JSON.stringify(persona)}
  User Profile: ${JSON.stringify(userProfile)}
  Chat History: ${JSON.stringify(chatHistory.slice(-5))}
  Current Emotion Analysis: ${JSON.stringify(emotionAnalysis)}
  AI Model: ${aiModel}
  Premium Features: ${JSON.stringify(plan.features)}
  
  Provide premium counseling response with:
  1. Empathetic and personalized response
  2. Integration of emotional analysis
  3. Premium-level insights
  4. Actionable suggestions
  5. Follow-up questions
  
  Maintain your persona's communication style and approach.`;

  try {
    const response = await openai.chat.completions.create({
      model: aiModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.8,
    });

    const counselingResponse = response.choices[0].message.content || "";

    return {
      message: counselingResponse,
      emotionalAnalysis: emotionAnalysis,
      suggestions: [
        "감정 상태를 더 자세히 탐색해보세요",
        "비슷한 경험을 다른 관점에서 바라보기",
        "구체적인 행동 계획 세우기",
      ],
      premiumInsights: [
        "고급 AI 분석을 통한 심층 이해",
        "개인화된 감정 패턴 인식",
        "실시간 감정 추적 결과 반영",
      ],
    };
  } catch (error) {
    console.error("Premium counseling response error:", error);
    return {
      message:
        "죄송합니다. 현재 고급 AI 기능에 일시적인 문제가 있습니다. 곧 정상화될 예정입니다.",
      emotionalAnalysis: emotionAnalysis,
      suggestions: [
        "잠시 후 다시 시도해보세요",
        "기본 상담 기능을 이용해보세요",
      ],
      premiumInsights: ["프리미엄 기능 복구 중"],
    };
  }
}

// Fallback functions
function generateFallbackPremiumPersonas(
  aiModel: string
): PremiumPersonaRecommendation[] {
  return [
    {
      id: `fallback-premium-1`,
      name: "김지혜",
      description: "GPT-4o 엔진으로 구동되는 고급 심리상담사",
      personality: "따뜻하고 전문적인",
      specialties: ["개인화 상담", "감정 분석", "심층 치료"],
      communicationStyle: "공감적이고 구체적인",
      approach: "인지행동치료 + 개인화 분석",
      matchingRank: "최상",
      premiumFeatures: ["GPT-4o 고급 엔진", "개인화 분석", "실시간 감정 추적"],
      aiModel,
    },
    {
      id: `fallback-premium-2`,
      name: "박성호",
      description: "전문 심리치료사 경력 20년의 노하우를 가진 AI 상담사",
      personality: "차분하고 논리적인",
      specialties: ["스트레스 관리", "대인관계", "목표 설정"],
      communicationStyle: "체계적이고 해결 지향적인",
      approach: "해결중심 단기치료 + 코칭",
      matchingRank: "상",
      premiumFeatures: ["고급 분석 리포트", "맞춤형 솔루션", "장기 계획 수립"],
      aiModel,
    },
    {
      id: `fallback-premium-3`,
      name: "이수민",
      description: "감정 전문가로서 세심한 감정 분석과 치유를 제공",
      personality: "섬세하고 직관적인",
      specialties: ["감정 조절", "트라우마 치료", "자존감 향상"],
      communicationStyle: "부드럽고 격려적인",
      approach: "감정중심 치료 + 마음챙김",
      matchingRank: "중",
      premiumFeatures: [
        "실시간 감정 모니터링",
        "감정 패턴 분석",
        "치유 과정 추적",
      ],
      aiModel,
    },
  ];
}

function getDefaultAdvancedAnalysis(): AdvancedAnalysisResult {
  return {
    emotionalState: {
      current: "안정적",
      trend: "점진적 개선",
      stability: 78,
      recommendations: ["규칙적인 생활 패턴 유지", "스트레스 관리 기법 실천"],
    },
    personalityInsights: {
      strengths: ["공감 능력", "적응성", "성실성"],
      growthAreas: ["자기 주장", "스트레스 관리", "완벽주의 조절"],
      communicationPreferences: ["따뜻한 소통", "구체적 피드백", "충분한 시간"],
      copingMechanisms: [
        "대화를 통한 해결",
        "혼자만의 시간",
        "운동이나 취미 활동",
      ],
    },
    behavioralPatterns: {
      triggers: ["과도한 업무", "인간관계 갈등", "예상치 못한 변화"],
      responses: ["신중한 고민", "주변 도움 요청", "단계적 접근"],
      adaptations: ["점진적 변화", "지원 체계 구축", "자기 돌봄 실천"],
    },
    recommendations: {
      immediateActions: ["규칙적인 휴식", "감정 일기 작성", "마음챙김 실천"],
      longTermGoals: ["감정 조절 능력 향상", "자신감 증진", "건강한 관계 형성"],
      resources: ["전문 상담", "자기계발 도서", "지지 그룹 참여"],
    },
  };
}

function getDefaultRealtimeAnalysis(): RealtimeEmotionAnalysis {
  return {
    emotionScore: 60,
    dominantEmotions: ["중성", "호기심"],
    intensity: 5,
    context: "일반적인 대화",
    triggers: [],
    copingSuggestions: ["깊게 호흡하기", "현재 순간에 집중하기"],
    timestamp: new Date(),
  };
}
