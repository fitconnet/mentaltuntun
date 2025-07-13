import OpenAI from "openai";
import type { SubscriptionPlan, UserSubscription } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Enhanced AI features for premium subscribers
export class PremiumAIService {
  // Advanced persona generation with more sophisticated prompts
  static async generateAdvancedPersona(
    userProfile: any,
    preferences: any
  ): Promise<any> {
    try {
      const prompt = `당신은 세계 최고 수준의 심리상담 AI 전문가입니다. 다음 사용자 정보를 바탕으로 매우 정교하고 개인화된 AI 상담사 페르소나를 생성해주세요.

사용자 정보:
- 이름: ${userProfile.name}
- MBTI: ${userProfile.mbti || "미입력"}
- 관심사: ${Array.isArray(userProfile.interests) ? userProfile.interests.join(", ") : "미입력"}
- 성격 특성: ${JSON.stringify(userProfile.personality || {})}
- 생년월일: ${userProfile.birthDate || "미입력"}
- 직업: ${userProfile.occupation || "미입력"}

요청사항:
1. 최신 심리학 이론과 CBT, DBT, ACT 등 근거 기반 치료법을 활용
2. 사용자의 MBTI와 성격 특성에 완벽히 맞춤화된 상담 스타일
3. 문화적 맥락(한국 문화)을 고려한 접근법
4. 트라우마 인식 상담(Trauma-Informed Care) 원칙 적용
5. 해결중심 단기치료(SFBT) 기법 활용

생성할 페르소나 정보:
- name: 한국식 이름 (상담사 이름)
- age: 적절한 나이대 (사용자와의 상호작용을 고려)
- background: 전문 배경 (심리학 박사, 임상경험 등)
- specialties: 전문 분야 (최소 3개)
- approach: 상담 접근법 (구체적이고 실용적)
- personality: 성격 특성 (사용자와 잘 맞는)
- communication_style: 소통 스타일
- therapeutic_techniques: 활용할 치료 기법들
- cultural_sensitivity: 문화적 민감성 요소
- session_structure: 세션 진행 방식

JSON 형태로 응답해주세요.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Latest model for premium users
        messages: [
          {
            role: "system",
            content:
              "You are an expert AI system designer specializing in therapeutic AI personas.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Error generating advanced persona:", error);
      throw new Error("고급 페르소나 생성에 실패했습니다.");
    }
  }

  // Real-time emotional analysis during conversation
  static async analyzeEmotionalState(
    messages: any[],
    userProfile: any
  ): Promise<any> {
    try {
      const recentMessages = messages.slice(-6); // Last 3 exchanges
      const conversationText = recentMessages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join("\n");

      const prompt = `당신은 심리학 전문가입니다. 다음 대화를 분석하여 사용자의 현재 감정 상태를 실시간으로 분석해주세요.

대화 내용:
${conversationText}

사용자 배경:
- MBTI: ${userProfile.mbti || "미입력"}
- 성격 특성: ${JSON.stringify(userProfile.personality || {})}

분석 항목:
1. primary_emotion: 주요 감정 (기쁨, 슬픔, 분노, 두려움, 놀람, 혐오, 중성)
2. emotion_intensity: 감정 강도 (1-10)
3. emotional_stability: 감정 안정성 (1-10)
4. stress_level: 스트레스 수준 (1-10)
5. engagement_level: 참여도 (1-10)
6. therapeutic_rapport: 치료적 라포 (1-10)
7. risk_indicators: 위험 신호 (자해, 자살, 폭력 등 - boolean)
8. intervention_needed: 개입 필요도 (low, medium, high)
9. suggested_techniques: 권장 기법들
10. next_session_focus: 다음 세션 집중 영역

JSON 형태로 응답해주세요.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a licensed clinical psychologist specializing in real-time emotional analysis.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Error analyzing emotional state:", error);
      throw new Error("실시간 감정 분석에 실패했습니다.");
    }
  }

  // Advanced therapeutic response generation
  static async generateTherapeuticResponse(
    userMessage: string,
    emotionalAnalysis: any,
    persona: any,
    sessionHistory: any[]
  ): Promise<any> {
    try {
      const prompt = `당신은 ${persona.name} 상담사입니다.

페르소나 정보:
- 전문분야: ${persona.specialties?.join(", ") || "일반상담"}
- 접근법: ${persona.approach || "CBT 기반"}
- 성격: ${persona.personality || "따뜻하고 전문적"}
- 치료기법: ${persona.therapeutic_techniques?.join(", ") || "CBT, 해결중심치료"}

현재 사용자 감정 상태:
- 주요 감정: ${emotionalAnalysis.primary_emotion}
- 감정 강도: ${emotionalAnalysis.emotion_intensity}/10
- 스트레스 수준: ${emotionalAnalysis.stress_level}/10
- 개입 필요도: ${emotionalAnalysis.intervention_needed}

사용자 메시지: "${userMessage}"

다음 지침에 따라 응답해주세요:
1. 감정 상태에 맞는 적절한 치료 기법 적용
2. 사용자의 강점과 자원 탐색
3. 구체적이고 실행 가능한 조언 제공
4. 치료적 라포 강화
5. 필요시 안전 계획 수립
6. 다음 대화로 자연스럽게 이어지는 질문 포함

응답 형태:
{
  "message": "상담사 응답 메시지",
  "therapeutic_technique": "사용된 치료 기법",
  "emotional_validation": "감정 검증 요소",
  "coping_strategy": "제안된 대처 전략",
  "follow_up_question": "후속 질문",
  "session_notes": "세션 노트",
  "safety_assessment": "안전성 평가"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a licensed clinical psychologist providing evidence-based therapeutic interventions.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Error generating therapeutic response:", error);
      throw new Error("치료적 응답 생성에 실패했습니다.");
    }
  }

  // Comprehensive personality analysis for premium users
  static async generateComprehensivePersonalityAnalysis(
    userProfile: any,
    sessions: any[],
    emotions: any[]
  ): Promise<any> {
    try {
      const prompt = `당신은 세계적으로 인정받는 성격 심리학 전문가입니다. 다음 정보를 바탕으로 매우 상세하고 전문적인 성격 분석을 제공해주세요.

사용자 정보:
- 기본 정보: ${JSON.stringify(userProfile)}
- 상담 세션 수: ${sessions.length}개
- 감정 기록 수: ${emotions.length}개

분석 요청 사항:
1. Big Five 성격 특성 점수 (0-100)
2. MBTI 세부 분석 및 확률
3. 애착 스타일 평가
4. 대처 전략 패턴
5. 스트레스 반응 패턴
6. 대인관계 스타일
7. 의사결정 패턴
8. 감정조절 능력
9. 심리적 강점과 자원
10. 발달 과제 및 권장사항

응답 형태:
{
  "big_five": {
    "openness": 85,
    "conscientiousness": 72,
    "extraversion": 45,
    "agreeableness": 88,
    "neuroticism": 35
  },
  "mbti_analysis": {
    "type": "INFP",
    "confidence": 0.85,
    "function_stack": ["Fi", "Ne", "Si", "Te"],
    "detailed_explanation": "..."
  },
  "attachment_style": {
    "primary": "secure",
    "secondary": "anxious",
    "explanation": "..."
  },
  "coping_strategies": [...],
  "stress_patterns": [...],
  "interpersonal_style": {...},
  "decision_making": {...},
  "emotional_regulation": {...},
  "strengths": [...],
  "growth_areas": [...],
  "recommendations": [...]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a leading personality psychologist with expertise in assessment and analysis.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Error generating comprehensive analysis:", error);
      throw new Error("종합 성격 분석 생성에 실패했습니다.");
    }
  }

  // Smart scheduling recommendations
  static async generateOptimalScheduling(
    userProfile: any,
    activityHistory: any[]
  ): Promise<any> {
    try {
      const prompt = `당신은 행동과학과 생체리듬 전문가입니다. 사용자의 데이터를 분석하여 최적의 상담 스케줄을 추천해주세요.

사용자 정보:
- 성격 유형: ${userProfile.mbti || "미입력"}
- 활동 패턴: ${JSON.stringify(activityHistory.slice(-30))} // 최근 30일

분석 및 추천:
1. 최적 상담 시간대
2. 주간 빈도 권장안
3. 세션 길이 권장안
4. 예측되는 효과적인 날짜들
5. 피해야 할 시간대
6. 개인화된 리마인더 전략

JSON 형태로 응답해주세요.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a behavioral scientist specializing in optimal scheduling and circadian rhythms.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Error generating scheduling recommendations:", error);
      throw new Error("스마트 스케줄링 분석에 실패했습니다.");
    }
  }
}

// Subscription management
export class SubscriptionService {
  static async checkFeatureAccess(
    userId: number,
    feature: string
  ): Promise<boolean> {
    // This would check the user's subscription and feature access
    // For now, return true for premium features
    return true;
  }

  static async trackAIUsage(
    userId: number,
    feature: string,
    tokensUsed: number
  ): Promise<void> {
    // Track AI usage for billing and analytics
    console.log(
      `AI Usage - User: ${userId}, Feature: ${feature}, Tokens: ${tokensUsed}`
    );
  }

  static async getUsageStats(userId: number): Promise<any> {
    // Return usage statistics for the user
    return {
      currentMonth: {
        counselingSessions: 15,
        aiTokensUsed: 45000,
        customPersonasCreated: 3,
        advancedAnalyses: 8,
      },
      limits: {
        maxSessions: 0, // unlimited for premium
        maxTokens: 0, // unlimited for premium
        maxPersonas: 10,
        maxAnalyses: 0, // unlimited for premium
      },
    };
  }
}
