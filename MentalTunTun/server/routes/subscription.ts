import { Router } from "express";
import axios from "axios";
import { storage } from "../storage";
import {
  PremiumAIService,
  SubscriptionService,
} from "../services/subscription";
import {
  generatePremiumPersonaRecommendations,
  performAdvancedEmotionalAnalysis,
  performRealtimeEmotionAnalysis,
  generatePremiumCounselingResponse,
} from "../services/premium-ai";
import type { Request, Response } from "express";

const router = Router();

// 토스페이먼츠 설정
const TOSS_PAYMENTS_SECRET_KEY = process.env.TOSS_PAYMENTS_SECRET_KEY;
const TOSS_PAYMENTS_CLIENT_KEY = process.env.TOSS_PAYMENTS_CLIENT_KEY;

if (!TOSS_PAYMENTS_SECRET_KEY) {
  console.warn(
    "TOSS_PAYMENTS_SECRET_KEY not found. Subscription features will be limited."
  );
}

// 토스페이먼츠 API 기본 설정
const tossPaymentsAPI = axios.create({
  baseURL: 'https://api.tosspayments.com/v1',
  headers: {
    'Authorization': `Basic ${Buffer.from(TOSS_PAYMENTS_SECRET_KEY + ':').toString('base64')}`,
    'Content-Type': 'application/json',
  },
});

// Get current user subscription
router.get("/current", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    if (!req.user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    // Mock subscription data for now
    const subscription = {
      id: 1,
      userId: user.id,
      planName: user.subscriptionType === "premium" ? "프리미엄" : "무료",
      status: "active",
      startDate: user.createdAt,
      endDate:
        user.subscriptionType === "premium"
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : null,
      autoRenew: true,
    };

    res.json(subscription);
  } catch (error) {
    console.error("Error fetching subscription:", error);
    res.status(500).json({ message: "구독 정보 조회에 실패했습니다." });
  }
});

// Upgrade subscription - 토스페이먼츠 연동
router.post("/upgrade", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    if (!req.user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const { planId, billingCycle } = req.body;
    const user = await storage.getUser(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    // 결제 금액 설정
    const priceMap = {
      premium: billingCycle === "yearly" ? 199000 : 19900, // 19,900원/월, 199,000원/년
      pro: billingCycle === "yearly" ? 399000 : 39900, // 39,900원/월, 399,000원/년
    };

    const amount = priceMap[planId as keyof typeof priceMap];
    
    if (!amount) {
      return res.status(400).json({ message: "유효하지 않은 플랜입니다." });
    }

    if (TOSS_PAYMENTS_SECRET_KEY && planId !== "free") {
      try {
        // 토스페이먼츠 결제 정보 생성
        const orderId = `order_${user.id}_${Date.now()}`;
        const orderName = `멘탈튼튼 ${planId === 'premium' ? '프리미엄' : '프로'} 플랜 (${billingCycle === 'yearly' ? '연간' : '월간'})`;

        // 결제창 요청용 데이터 반환 (실제 결제는 프론트엔드에서 처리)
        const paymentData = {
          amount,
          orderId,
          orderName,
          customerEmail: user.email,
          customerName: user.name,
          successUrl: `${process.env.FRONTEND_URL || "http://localhost:5173"}/subscription?success=true`,
          failUrl: `${process.env.FRONTEND_URL || "http://localhost:5173"}/subscription?success=false`,
        };

        res.json({ 
          paymentData,
          message: "결제 정보가 생성되었습니다."
        });

      } catch (error) {
        console.error("토스페이먼츠 결제 생성 실패:", error);
        res.status(500).json({ message: "결제 생성에 실패했습니다." });
      }
    } else {
      // 데모 목적으로 즉시 구독 활성화
      const updatedUser = await storage.updateUser(user.id, {
        subscriptionType:
          planId === "premium"
            ? "premium"
            : planId === "pro"
              ? "premium"
              : "free",
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(
          Date.now() +
            (billingCycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000
        ),
      });

      res.json({
        message: "구독이 활성화되었습니다.",
        subscription: updatedUser,
      });
    }
  } catch (error) {
    console.error("Error upgrading subscription:", error);
    res.status(500).json({ message: "구독 업그레이드에 실패했습니다." });
  }
});

// 토스페이먼츠 결제 승인 처리
router.post("/toss/confirm", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    if (!req.user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const { paymentKey, orderId, amount } = req.body;

    if (!paymentKey || !orderId || !amount) {
      return res.status(400).json({ message: "필수 파라미터가 누락되었습니다." });
    }

    // 토스페이먼츠 결제 승인 요청
    const response = await tossPaymentsAPI.post('/payments/confirm', {
      paymentKey,
      orderId,
      amount,
    });

    const payment = response.data;

    if (payment.status === 'DONE') {
      // 결제 성공 시 사용자 구독 정보 업데이트
      const user = await storage.getUser(req.user.id);
      if (user) {
        // orderId에서 플랜 정보 추출 (order_userId_timestamp 형식)
        const planId = amount >= 30000 ? "pro" : "premium";
        const billingCycle = amount >= 100000 ? "yearly" : "monthly";

        await storage.updateUser(user.id, {
          subscriptionType: "premium",
          subscriptionStartDate: new Date(),
          subscriptionEndDate: new Date(
            Date.now() + (billingCycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000
          ),
        });
      }

      res.json({
        success: true,
        message: "결제가 완료되었습니다.",
        payment,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "결제가 완료되지 않았습니다.",
        payment,
      });
    }

  } catch (error: any) {
    console.error("토스페이먼츠 결제 승인 실패:", error);
    
    if (error.response?.data) {
      res.status(400).json({
        success: false,
        message: error.response.data.message || "결제 승인에 실패했습니다.",
        error: error.response.data,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "결제 승인 처리 중 오류가 발생했습니다.",
      });
    }
  }
});

// Cancel subscription
router.post("/cancel", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    if (!req.user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    // Update user subscription to free
    await storage.updateUser(user.id, {
      subscriptionType: "free",
      subscriptionEndDate: new Date(), // End immediately for demo
    });

    res.json({ message: "구독이 취소되었습니다." });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    res.status(500).json({ message: "구독 취소에 실패했습니다." });
  }
});

// Get premium AI features
router.post("/ai/advanced-persona", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    if (!req.user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    // Check if user has premium access
    if (user.subscriptionType === "free") {
      return res
        .status(403)
        .json({ message: "프리미엄 구독이 필요한 기능입니다." });
    }

    const { preferences } = req.body;
    const persona = await PremiumAIService.generateAdvancedPersona(
      user,
      preferences
    );

    // Track usage
    await SubscriptionService.trackAIUsage(user.id, "advanced_persona", 1000);

    res.json(persona);
  } catch (error) {
    console.error("Error generating advanced persona:", error);
    res.status(500).json({ message: "고급 페르소나 생성에 실패했습니다." });
  }
});

// Real-time emotional analysis
router.post("/ai/emotional-analysis", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    if (!req.user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    // Check if user has premium access
    if (user.subscriptionType === "free") {
      return res
        .status(403)
        .json({ message: "프리미엄 구독이 필요한 기능입니다." });
    }

    const { sessionId } = req.body;
    const messages = await storage.getChatMessagesBySession(sessionId);

    const analysis = await PremiumAIService.analyzeEmotionalState(
      messages,
      user
    );

    // Track usage
    await SubscriptionService.trackAIUsage(user.id, "emotional_analysis", 500);

    res.json(analysis);
  } catch (error) {
    console.error("Error analyzing emotional state:", error);
    res.status(500).json({ message: "감정 분석에 실패했습니다." });
  }
});

// Comprehensive personality analysis
router.get(
  "/ai/comprehensive-analysis",
  async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ message: "인증이 필요합니다." });
      }

      if (!req.user) {
        return res.status(401).json({ message: "인증이 필요합니다." });
      }

      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      }

      // Check if user has premium access
      if (user.subscriptionType === "free") {
        return res
          .status(403)
          .json({ message: "프리미엄 구독이 필요한 기능입니다." });
      }

      const sessions = await storage.getCounselingSessionsByUser(user.id);
      const emotions = await storage.getEmotionRecordsByUser(user.id);

      const analysis =
        await PremiumAIService.generateComprehensivePersonalityAnalysis(
          user,
          sessions,
          emotions
        );

      // Track usage
      await SubscriptionService.trackAIUsage(
        user.id,
        "comprehensive_analysis",
        2000
      );

      res.json(analysis);
    } catch (error) {
      console.error("Error generating comprehensive analysis:", error);
      res.status(500).json({ message: "종합 분석 생성에 실패했습니다." });
    }
  }
);

// Smart scheduling
router.get("/ai/smart-scheduling", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    if (!req.user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    // Check if user has premium access
    if (user.subscriptionType === "free") {
      return res
        .status(403)
        .json({ message: "프리미엄 구독이 필요한 기능입니다." });
    }

    const appointments = await storage.getScheduleAppointmentsByUser(user.id);
    const emotions = await storage.getEmotionRecordsByUser(user.id);

    const activityHistory = [...appointments, ...emotions].sort(
      (a, b) =>
        new Date(a.createdAt || a.date).getTime() -
        new Date(b.createdAt || b.date).getTime()
    );

    const recommendations = await PremiumAIService.generateOptimalScheduling(
      user,
      activityHistory
    );

    // Track usage
    await SubscriptionService.trackAIUsage(user.id, "smart_scheduling", 300);

    res.json(recommendations);
  } catch (error) {
    console.error("Error generating scheduling recommendations:", error);
    res.status(500).json({ message: "스마트 스케줄링 분석에 실패했습니다." });
  }
});

// Usage statistics
router.get("/usage", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    if (!req.user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const stats = await SubscriptionService.getUsageStats(req.user.id);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching usage stats:", error);
    res.status(500).json({ message: "사용량 조회에 실패했습니다." });
  }
});

// Premium counseling response generation
router.post("/ai/premium-counseling", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    if (!req.user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const { userMessage, persona, chatHistory } = req.body;

    // Get mock subscription data for premium features
    const mockSubscription = {
      id: 1,
      userId: req.user.id,
      planId: 2,
      status: "active" as const,
      startDate: new Date(),
      endDate: null,
      autoRenew: true,
      paymentMethod: null,
      stripeSubscriptionId: null,
      stripeCustomerId: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockPlan = {
      id: 2,
      name: "premium",
      displayName: "프리미엄",
      description: "고급 AI 기능과 무제한 상담",
      price: "19900",
      currency: "KRW",
      billingInterval: "monthly",
      features: ["무제한 AI 상담", "고급 분석", "실시간 감정 추적"],
      aiCredits: 0,
      maxSessions: 0,
      advancedAI: true,
      aiModel: "gpt-4o-mini",
      personalizedAnalysis: true,
      realtimeEmotionTracking: true,
      comprehensiveReports: true,
      smartScheduling: true,
      prioritySupport: true,
      customPersonas: true,
      isActive: true,
      sortOrder: 2,
      createdAt: new Date(),
    };

    const response = await generatePremiumCounselingResponse(
      userMessage,
      persona,
      chatHistory || [],
      req.user,
      mockSubscription,
      mockPlan
    );

    res.json(response);
  } catch (error) {
    console.error("Premium counseling response error:", error);
    res
      .status(500)
      .json({ message: "프리미엄 상담 응답 생성 중 오류가 발생했습니다." });
  }
});

// Real-time emotion tracking for premium users
router.post("/ai/realtime-emotion", async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    if (!req.user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    const { currentInput, recentContext } = req.body;

    const mockSubscription = {
      id: 1,
      userId: req.user.id,
      planId: 2,
      status: "active" as const,
      startDate: new Date(),
      endDate: null,
      autoRenew: true,
      paymentMethod: null,
      stripeSubscriptionId: null,
      stripeCustomerId: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockPlan = {
      id: 3,
      name: "pro",
      displayName: "프로",
      description: "최고급 AI 기능과 모든 프리미엄 혜택",
      price: "39900",
      currency: "KRW",
      billingInterval: "monthly",
      features: ["모든 프리미엄 기능", "GPT-4o 엔진", "24/7 우선 지원"],
      aiCredits: 0,
      maxSessions: 0,
      advancedAI: true,
      aiModel: "gpt-4o",
      personalizedAnalysis: true,
      realtimeEmotionTracking: true,
      comprehensiveReports: true,
      smartScheduling: true,
      prioritySupport: true,
      customPersonas: true,
      isActive: true,
      sortOrder: 3,
      createdAt: new Date(),
    };

    const analysis = await performRealtimeEmotionAnalysis(
      currentInput,
      req.user,
      recentContext || [],
      mockSubscription,
      mockPlan
    );

    res.json(analysis);
  } catch (error) {
    console.error("Real-time emotion analysis error:", error);
    res
      .status(500)
      .json({ message: "실시간 감정 분석 중 오류가 발생했습니다." });
  }
});

export default router;
