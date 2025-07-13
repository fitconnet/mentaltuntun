import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { insertAdminSchema, insertAdminPermissionSchema } from "@shared/schema";
import * as bcrypt from "bcryptjs";

const router = Router();

// 관리자 인증 미들웨어 (세션 기반)
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    console.log("Admin route auth check:", {
      sessionId: req.session?.id,
      userId: req.session?.userId,
      admin: req.session?.admin,
      user: req.user,
    });

    // 세션 기반 관리자 인증 또는 사용자 ID 7 (관리자) 확인
    if (req.user?.id === 7 || req.session?.userId === 7 || req.session?.admin) {
      console.log("Admin route auth successful");
      req.adminUid = req.session?.adminId || "admin7447";
      req.adminEmail = "admin7447@gmail.com";
      return next();
    }

    console.log("Admin route auth failed");
    return res.status(401).json({ message: "인증이 필요합니다" });
  } catch (error) {
    console.error("관리자 인증 오류:", error);
    res.status(500).json({ message: "인증 처리 중 오류가 발생했습니다" });
  }
};

// 사용자 현황 조회 (무료/유료 구분)
router.get("/users", requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", plan = "all" } = req.query;

    const allUsers = await storage.getAllUsers();

    // 검색 및 필터링
    let filteredUsers = allUsers;

    if (search) {
      filteredUsers = filteredUsers.filter(
        user =>
          user.name?.toLowerCase().includes(search.toString().toLowerCase()) ||
          user.email?.toLowerCase().includes(search.toString().toLowerCase())
      );
    }

    if (plan !== "all") {
      filteredUsers = filteredUsers.filter(
        user => user.subscriptionType === plan
      );
    }

    // 페이지네이션
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    // 통계 정보
    const stats = {
      total: allUsers.length,
      free: allUsers.filter(u => u.subscriptionType === "free").length,
      premium: allUsers.filter(u => u.subscriptionType === "premium").length,
      filtered: filteredUsers.length,
    };

    res.json({
      users: paginatedUsers,
      stats,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(filteredUsers.length / Number(limit)),
        hasMore: endIndex < filteredUsers.length,
      },
    });
  } catch (error) {
    console.error("사용자 목록 조회 오류:", error);
    res.status(500).json({ message: "사용자 목록을 불러오는데 실패했습니다" });
  }
});

// 개별 사용자 상세 정보
router.get("/users/:userId", requireAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
    }

    // 사용자의 활동 통계
    const [emotions, sessions, assessments] = await Promise.all([
      storage.getEmotionRecordsByUser(userId),
      storage.getCounselingSessionsByUser(userId),
      storage.getPersonalityAssessmentsByUser(userId),
    ]);

    const userStats = {
      emotionRecords: emotions.length,
      counselingSessions: sessions.length,
      personalityAssessments: assessments.length,
      lastActivity: Math.max(
        emotions.length > 0 && emotions[emotions.length - 1].createdAt
          ? new Date(emotions[emotions.length - 1].createdAt!).getTime()
          : 0,
        sessions.length > 0 && sessions[sessions.length - 1].createdAt
          ? new Date(sessions[sessions.length - 1].createdAt!).getTime()
          : 0
      ),
    };

    res.json({
      user,
      stats: userStats,
      recentActivity: {
        emotions: emotions.slice(-5),
        sessions: sessions.slice(-3),
      },
    });
  } catch (error) {
    console.error("사용자 상세 정보 조회 오류:", error);
    res.status(500).json({ message: "사용자 정보를 불러오는데 실패했습니다" });
  }
});

// 사용자 구독 계획 변경
router.patch("/users/:userId/subscription", requireAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const { plan } = req.body;

    if (!["free", "premium"].includes(plan)) {
      return res.status(400).json({ message: "유효하지 않은 구독 계획입니다" });
    }

    const updatedUser = await storage.updateUser(userId, {
      subscriptionType: plan,
      subscriptionEndDate:
        plan === "premium"
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30일 후
          : null,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
    }

    res.json({
      success: true,
      user: updatedUser,
      message: `구독 계획이 ${plan}으로 변경되었습니다`,
    });
  } catch (error) {
    console.error("구독 계획 변경 오류:", error);
    res.status(500).json({ message: "구독 계획 변경에 실패했습니다" });
  }
});

// 피드백 요약 보기
router.get("/feedback-summary", requireAdmin, async (req, res) => {
  try {
    const { period = "7d" } = req.query;

    const allFeedback = await storage.getAllFeedbackLogs();

    // 기간별 필터링
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "24h":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const recentFeedback = allFeedback.filter(
      feedback => feedback.createdAt && new Date(feedback.createdAt) >= startDate
    );

    // 피드백 통계 분석
    const stats = {
      total: recentFeedback.length,
      positive: recentFeedback.filter(f => f.rating >= 4).length,
      neutral: recentFeedback.filter(f => f.rating === 3).length,
      negative: recentFeedback.filter(f => f.rating <= 2).length,
      averageRating:
        recentFeedback.length > 0
          ? recentFeedback.reduce((sum, f) => sum + f.rating, 0) /
            recentFeedback.length
          : 0,
    };

    // 카테고리별 분류
    const byCategory = recentFeedback.reduce(
      (acc, feedback) => {
        const category = feedback.category || "general";
        if (!acc[category]) acc[category] = [];
        acc[category].push(feedback);
        return acc;
      },
      {} as Record<string, any[]>
    );

    // 최근 중요 피드백 (낮은 평점 + 긴 댓글)
    const criticalFeedback = recentFeedback
      .filter(f => f.rating <= 2 || (f.comments && f.comments.length > 50))
      .slice(0, 10);

    res.json({
      period,
      stats,
      byCategory,
      criticalFeedback,
      recentFeedback: recentFeedback.slice(0, 20),
    });
  } catch (error) {
    console.error("피드백 요약 조회 오류:", error);
    res
      .status(500)
      .json({ message: "피드백 데이터를 불러오는데 실패했습니다" });
  }
});

// 콘텐츠 업로드 (Firestore + PostgreSQL)
router.post("/content", requireAdmin, async (req, res) => {
  try {
    const contentSchema = z.object({
      title: z.string().min(1, "제목은 필수입니다"),
      category: z.enum(["심리분석", "건강정보", "웰빙정보", "오늘의 뉴스"]),
      summary: z.string().min(1, "요약은 필수입니다"),
      content: z.string().min(1, "내용은 필수입니다"),
      tags: z.array(z.string()).optional(),
      imageUrl: z.string().url().optional(),
      authorName: z.string().optional(),
      publishDate: z.string().optional(),
      url: z.string().url().optional(),
    });

    const validatedData = contentSchema.parse(req.body);

    const contentItem = await storage.createContentItem({
      ...validatedData,
      status: "published",
      viewCount: 0,
    });

    // Firestore에도 저장 (선택사항)
    try {
      const { doc, setDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");

      await setDoc(doc(db, "admin_content", contentItem.id.toString()), {
        ...contentItem,
        createdAt: new Date(),
        type: "content",
      });
    } catch (firebaseError) {
      console.warn("Firestore 저장 실패, PostgreSQL만 저장됨:", firebaseError);
    }

    res.json({
      success: true,
      content: contentItem,
      message: "콘텐츠가 성공적으로 업로드되었습니다",
    });
  } catch (error) {
    console.error("콘텐츠 업로드 오류:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "입력 데이터가 올바르지 않습니다",
        errors: error.errors,
      });
    }
    res.status(500).json({ message: "콘텐츠 업로드에 실패했습니다" });
  }
});

// 관리자 대시보드 통계
router.get("/dashboard-stats", requireAdmin, async (req, res) => {
  try {
    const [users, feedback, sessions] = await Promise.all([
      storage.getAllUsers(),
      storage.getAllFeedbackLogs(),
      storage.getSystemStats(),
    ]);

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 사용자 증가율
    const newUsersToday = users.filter(
      u => u.createdAt && new Date(u.createdAt) >= yesterday
    ).length;

    const newUsersThisWeek = users.filter(
      u => u.createdAt && new Date(u.createdAt) >= lastWeek
    ).length;

    // 활성 사용자 (최근 7일 활동)
    const recentFeedback = feedback.filter(
      f => f.createdAt && new Date(f.createdAt) >= lastWeek
    );

    const stats = {
      totalUsers: users.length,
      freeUsers: users.filter(u => u.subscriptionType === "free").length,
      premiumUsers: users.filter(u => u.subscriptionType === "premium").length,
      newUsersToday,
      newUsersThisWeek,
      totalSessions: sessions.totalSessions,
      averageRating: sessions.averageRating,
      recentFeedbackCount: recentFeedback.length,
      conversionRate:
        users.length > 0
          ? (users.filter(u => u.subscriptionType === "premium").length /
              users.length) *
            100
          : 0,
    };

    res.json(stats);
  } catch (error) {
    console.error("대시보드 통계 조회 오류:", error);
    res.status(500).json({ message: "통계 데이터를 불러오는데 실패했습니다" });
  }
});

// 관리자 계정 관리 API
// 관리자 계정 목록 조회
router.get("/admin-accounts", requireAdmin, async (req, res) => {
  try {
    const admins = await storage.getAllAdmins();

    // 비밀번호 정보 제거
    const adminsList = admins.map(admin => ({
      id: admin.id,
      adminId: admin.adminId,
      name: admin.name,
      role: admin.role,
      isSuperAdmin: admin.isSuperAdmin,
      createdAt: admin.createdAt,
    }));

    res.json({ admins: adminsList });
  } catch (error) {
    console.error("관리자 계정 목록 조회 오류:", error);
    res
      .status(500)
      .json({ message: "관리자 계정 목록을 불러오는데 실패했습니다" });
  }
});

// 관리자 계정 생성
router.post("/admin-accounts", requireAdmin, async (req, res) => {
  try {
    const adminData = insertAdminSchema.parse(req.body);

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(adminData.password, 12);

    const newAdmin = await storage.createAdmin({
      ...adminData,
      password: hashedPassword,
    });

    // 기본 권한 설정
    const defaultPermissions = [
      "dashboard",
      "users",
      "content",
      "statistics",
      "notifications",
      "gpt_assistant",
      "customer_service",
    ];

    for (const permission of defaultPermissions) {
      await storage.createAdminPermission({
        adminId: newAdmin.adminId,
        permission,
        granted: true,
      });
    }

    // 비밀번호 정보 제거하여 응답
    const { password, ...adminResponse } = newAdmin;

    res.json({
      success: true,
      admin: adminResponse,
      message: "관리자 계정이 성공적으로 생성되었습니다",
    });
  } catch (error) {
    console.error("관리자 계정 생성 오류:", error as Error);
    if (error instanceof Error && 'code' in error && (error as any).code === "23505") {
      // 중복 키 오류
      return res
        .status(400)
        .json({ message: "이미 존재하는 사용자명 또는 이메일입니다" });
    }
    res.status(500).json({ message: "관리자 계정 생성에 실패했습니다" });
  }
});

// 관리자 계정 삭제
router.delete("/admin-accounts/:adminId", requireAdmin, async (req, res) => {
  try {
    const adminId = Number(req.params.adminId);

    // 현재 관리자가 자신을 삭제하려는지 확인
    const admins = await storage.getAllAdmins();
    const currentAdmin = admins.find(admin => admin.adminId === req.params.adminId);
    if (currentAdmin && currentAdmin.id === adminId) {
      return res
        .status(400)
        .json({ message: "자신의 계정은 삭제할 수 없습니다" });
    }

    // 관리자 계정 삭제
    const deleted = await storage.deleteAdmin(adminId.toString());

    if (!deleted) {
      return res
        .status(404)
        .json({ message: "관리자 계정을 찾을 수 없습니다" });
    }

    res.json({
      success: true,
      message: "관리자 계정이 성공적으로 삭제되었습니다",
    });
  } catch (error) {
    console.error("관리자 계정 삭제 오류:", error);
    res.status(500).json({ message: "관리자 계정 삭제에 실패했습니다" });
  }
});

// 관리자 권한 조회
router.get(
  "/admin-accounts/:adminId/permissions",
  requireAdmin,
  async (req, res) => {
    try {
      const adminId = req.params.adminId;
      const permissions = await storage.getAdminPermissions(adminId);

      res.json({ permissions });
    } catch (error) {
      console.error("관리자 권한 조회 오류:", error);
      res
        .status(500)
        .json({ message: "관리자 권한을 불러오는데 실패했습니다" });
    }
  }
);

// 관리자 권한 수정
router.patch(
  "/admin-accounts/:adminId/permissions",
  requireAdmin,
  async (req, res) => {
    try {
      const adminId = Number(req.params.adminId);
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        return res
          .status(400)
          .json({ message: "권한 목록이 올바르지 않습니다" });
      }

      // 기존 권한 삭제 후 새로운 권한 추가
      await storage.updateAdminPermissions(adminId.toString(), permissions);

      for (const permission of permissions) {
        await storage.createAdminPermission({
          adminId: adminId.toString(),
          permission: permission.permission,
          granted: permission.granted,
        });
      }

      res.json({
        success: true,
        message: "관리자 권한이 성공적으로 수정되었습니다",
      });
    } catch (error) {
      console.error("관리자 권한 수정 오류:", error);
      res.status(500).json({ message: "관리자 권한 수정에 실패했습니다" });
    }
  }
);

export default router;
