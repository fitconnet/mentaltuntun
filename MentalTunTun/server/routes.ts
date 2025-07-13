import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import passport from "./passport";
import { storage } from "./storage";
import {
  insertUserSchema,
  updateUserSchema,
  insertUserProfileSchema,
  insertEmotionRecordSchema,
  insertCounselingSessionSchema,
  insertUserNotificationSettingsSchema,
  insertFeedbackLogSchema,
  users,
  emotionRecords,
  counselingSessions,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import axios from "axios";
import * as cheerio from "cheerio";
import * as bcrypt from "bcryptjs";
import {
  generateDynamicPersonaRecommendations,
  generatePersonaRecommendations,
  generateCounselingResponse,
  analyzePersonality,
  generatePersonalityReport,
  generateWelcomeMessage,
  generateDetailedAnalysis,
} from "./services/openai";
import subscriptionRoutes from "./routes/subscription";
import adminRoutes from "./routes/admin";
import { registerAuthRoutes } from "./routes/auth";
import { firebaseAuthMiddleware, adminAuthMiddleware } from "./firebase-admin";
import { adminSessionManager } from "./admin-session";

export async function registerRoutes(app: Express): Promise<Server> {
  // 📁 리팩터링: 인증 관련 라우터를 별도 파일로 분리
  registerAuthRoutes(app);

  // TODO: 아래 인증 관련 코드들은 auth.ts로 이동 완료 후 제거 예정
  // Firebase Custom Token 생성 API (Kakao, Naver 소셜 로그인용)
  app.post("/api/firebase-token", async (req, res) => {
    const { provider, token } = req.body;

    if (!provider || !token) {
      return res.status(400).json({ message: "Provider와 token이 필요합니다" });
    }

    try {
      let userInfo: any = {};

      if (provider === "kakao") {
        const kakaoRes = await fetch("https://kapi.kakao.com/v2/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!kakaoRes.ok) {
          throw new Error("Kakao API 호출 실패");
        }

        const kakaoData = await kakaoRes.json();
        userInfo = {
          id: kakaoData.id,
          email: kakaoData.kakao_account?.email,
          nickname: kakaoData.properties?.nickname,
          profile_image: kakaoData.properties?.profile_image,
        };
      } else if (provider === "naver") {
        const naverRes = await fetch("https://openapi.naver.com/v1/nid/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!naverRes.ok) {
          throw new Error("Naver API 호출 실패");
        }

        const naverData = await naverRes.json();
        userInfo = {
          id: naverData.response.id,
          email: naverData.response.email,
          nickname: naverData.response.nickname,
          profile_image: naverData.response.profile_image,
        };
      } else {
        return res
          .status(400)
          .json({ message: "지원하지 않는 제공업체입니다" });
      }

      // Firebase Custom Token 생성
      console.log("🔍 3단계: Firebase Admin 초기화 확인...");

      // Firebase Admin SDK 직접 import 및 초기화
      const admin = (await import("firebase-admin")).default;

      console.log("🔍 Firebase Admin 상태:", {
        hasAdmin: !!admin,
        hasAuth: !!admin?.auth,
        appsLength: admin?.apps?.length || 0,
      });

      // Firebase Admin이 초기화되지 않은 경우 강제 초기화
      if (!admin.apps.length) {
        console.log("⚠️ Firebase Admin 초기화 시도...");
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey:
              process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") || "",
          }),
        });
        console.log("✅ Firebase Admin 초기화 완료");
      }

      const uid = `${provider}_${userInfo.id}`;
      console.log("🔍 4단계: Firebase Custom Token 생성 시도...", { uid });

      const firebaseToken = await admin.auth().createCustomToken(uid, {
        provider,
        email: userInfo.email || null,
        nickname: userInfo.nickname || null,
        profile_image: userInfo.profile_image || null,
      });

      console.log(
        "✅ Firebase 커스텀 토큰 생성 성공:",
        firebaseToken.substring(0, 50) + "..."
      );

      // 사용자 정보를 데이터베이스에 저장 또는 업데이트
      console.log("🔍 5단계: 사용자 데이터베이스 저장/업데이트...");
      try {
        const existingUser = await storage.getUserByUID(uid);

        if (existingUser) {
          console.log("✅ 기존 사용자 로그인:", existingUser.email);
        } else {
          console.log("🔍 새 사용자 생성 중...");
          const newUser = await storage.createUser({
            uid,
            email: userInfo.email || "",
            provider,
            plan: "free",
            profileComplete: false,
          });
          console.log("✅ 새 사용자 생성 완료:", newUser.email);
        }
      } catch (dbError) {
        console.error("❌ 사용자 데이터베이스 저장 오류:", dbError);
        // 데이터베이스 오류가 있어도 로그인은 계속 진행
      }

      console.log(
        `✅ ${provider} 소셜 로그인 Firebase 토큰 생성 성공:`,
        userInfo.email || userInfo.nickname
      );

      res.json({
        firebaseToken,
        userInfo: {
          uid,
          email: userInfo.email,
          name: userInfo.nickname,
          provider,
        },
      });
    } catch (error: any) {
      console.error(
        `❌ ${req.body.provider || "unknown"} 소셜 로그인 상세 오류:`,
        {
          message: error.message,
          stack: error.stack,
          code: error.code,
        }
      );
      res
        .status(500)
        .json({ message: "Firebase 토큰 생성 실패", error: error.message });
    }
  });

  // Google OAuth routes
  app.get(
    "/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/login?error=google_auth_failed",
    }),
    (req, res) => {
      // 성공적으로 인증된 경우
      const user = req.user as any;
      if (!user.profileCompleted) {
        res.redirect("/profile");
      } else {
        res.redirect("/");
      }
    }
  );

  // Kakao OAuth routes
  app.get(
    "/api/auth/kakao",
    passport.authenticate("kakao", {
      scope: ["account_email", "profile_nickname"],
    })
  );

  app.get(
    "/api/auth/kakao/callback",
    passport.authenticate("kakao", {
      failureRedirect: "/login?error=kakao_auth_failed",
    }),
    (req, res) => {
      // 성공적으로 인증된 경우
      const user = req.user as any;
      if (!user.profileCompleted) {
        res.redirect("/profile");
      } else {
        res.redirect("/");
      }
    }
  );

  // Naver OAuth routes
  app.get(
    "/api/auth/naver",
    passport.authenticate("naver", { scope: ["email", "profile"] })
  );

  app.get(
    "/api/auth/naver/callback",
    passport.authenticate("naver", {
      failureRedirect: "/login?error=naver_auth_failed",
    }),
    (req, res) => {
      // 성공적으로 인증된 경우
      const user = req.user as any;
      if (!user.profileCompleted) {
        res.redirect("/profile");
      } else {
        res.redirect("/");
      }
    }
  );

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email } = req.body;
      let user = await storage.getUserByEmail(email);

      if (!user) {
        // Create new user for demo purposes
        user = await storage.createUser({
          uid: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email,
          provider: "email",
          name: email.split("@")[0],
          interests: [],
          personality: {},
        });
      }

      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // 테스트용 로그인 엔드포인트
  app.post("/api/auth/test-login", async (req, res) => {
    try {
      const { uid, email } = req.body;

      // 테스트 사용자 세션 생성
      const testUser = {
        id: 1,
        uid: uid || "test-user-uid",
        email: email || "test@example.com",
        name: "테스트 사용자",
        profileComplete: true,
        plan: "free",
        provider: "email",
        isAuthenticated: true,
      };

      // 세션에 저장
      req.session = req.session || {};
      req.session.user = testUser;

      res.json({ success: true, user: testUser });
    } catch (error) {
      res.status(500).json({ message: "Test login failed" });
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { name, email, password } = req.body;

      // Validate password strength
      const passwordRegex =
        /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          message:
            "비밀번호는 8자 이상이며 영문, 숫자, 특수문자(@$!%*?&)를 모두 포함해야 합니다",
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "이미 가입된 이메일입니다" });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Generate unique uid for email signup
      const uid = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create new user
      const user = await storage.createUser({
        uid,
        email,
        provider: "email",
        plan: "free",
        profileComplete: false,
      });

      res.json({ user });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "회원가입 중 오류가 발생했습니다" });
    }
  });

  app.post("/api/auth/login-password", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);

      if (!user || !user.password) {
        return res
          .status(401)
          .json({ message: "이메일 또는 비밀번호가 잘못되었습니다" });
      }

      // Verify password using bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res
          .status(401)
          .json({ message: "이메일 또는 비밀번호가 잘못되었습니다" });
      }

      res.json({ user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "로그인 중 오류가 발생했습니다" });
    }
  });

  // SMS 인증번호 발송 API
  app.post("/api/auth/send-verification", async (req, res) => {
    try {
      const { phone } = req.body;

      // 휴대폰 번호 유효성 검사
      if (!phone || !/^01[0-9]-?[0-9]{4}-?[0-9]{4}$/.test(phone)) {
        return res.status(400).json({
          message: "올바른 휴대폰 번호를 입력해주세요 (010-1234-5678 형식)",
        });
      }

      // 6자리 랜덤 인증번호 생성
      const verificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();

      // 개발 환경에서는 콘솔에 인증번호 출력 (실제 환경에서는 SMS 발송)
      console.log(`📱 SMS 인증번호 발송: ${phone} -> ${verificationCode}`);

      // 임시로 메모리에 저장 (실제로는 Redis나 DB 사용)
      if (!global.verificationCodes) {
        global.verificationCodes = new Map();
      }

      // 인증번호를 5분간 유효하도록 설정
      global.verificationCodes.set(phone, {
        code: verificationCode,
        expiry: Date.now() + 5 * 60 * 1000, // 5분
      });

      res.json({
        success: true,
        message: "인증번호가 발송되었습니다",
        // 개발 환경에서만 코드 노출 (실제 환경에서는 제거)
        devCode:
          process.env.NODE_ENV === "development" ? verificationCode : undefined,
      });
    } catch (error) {
      console.error("인증번호 발송 오류:", error);
      res.status(500).json({ message: "인증번호 발송 중 오류가 발생했습니다" });
    }
  });

  // SMS 인증번호 확인 API
  app.post("/api/auth/verify-code", async (req, res) => {
    try {
      const { phone, code } = req.body;

      if (!global.verificationCodes) {
        return res
          .status(400)
          .json({ message: "인증번호를 먼저 요청해주세요" });
      }

      const stored = global.verificationCodes.get(phone);

      if (!stored) {
        return res
          .status(400)
          .json({ message: "인증번호를 먼저 요청해주세요" });
      }

      if (Date.now() > stored.expiry) {
        global.verificationCodes.delete(phone);
        return res
          .status(400)
          .json({ message: "인증번호가 만료되었습니다. 다시 요청해주세요" });
      }

      if (stored.code !== code) {
        return res
          .status(400)
          .json({ message: "인증번호가 일치하지 않습니다" });
      }

      // 인증 성공시 코드 삭제
      global.verificationCodes.delete(phone);

      res.json({
        success: true,
        message: "휴대폰 인증이 완료되었습니다",
      });
    } catch (error) {
      console.error("인증번호 확인 오류:", error);
      res.status(500).json({ message: "인증번호 확인 중 오류가 발생했습니다" });
    }
  });

  // Firebase 인증 확인 엔드포인트 (토큰 기반)
  app.get("/api/auth/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;

      // Firebase 토큰이 있는 경우 처리
      if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
          const { verifyFirebaseToken, verifyAdminAccess } = await import(
            "./firebase-admin"
          );
          const idToken = authHeader.substring(7);
          const decodedToken = await verifyFirebaseToken(idToken);

          // Firebase 사용자 정보로 PostgreSQL 사용자 조회
          const user = await storage.getUserByUID(decodedToken.uid);

          if (user) {
            const { password, ...userWithoutPassword } = user;
            const isAdmin = await verifyAdminAccess(decodedToken.email);

            return res.json({
              ...userWithoutPassword,
              isAdmin,
              firebaseUser: decodedToken,
            });
          }

          // Firebase 사용자는 있지만 PostgreSQL에 없는 경우
          const isAdmin = await verifyAdminAccess(decodedToken.email);
          return res.json({
            message: "User profile not found",
            isAdmin,
            firebaseUser: decodedToken,
          });
        } catch (firebaseError) {
          console.error("Firebase 토큰 검증 실패:", firebaseError);
          // Firebase 실패 시 기존 세션 방식으로 폴백
        }
      }

      // 관리자 세션 우선 확인

      if (req.session?.admin) {
        try {
          const adminUser = await storage.getUser(req.session.admin.userId);
          if (adminUser) {
            return res.json({
              ...adminUser,
              isAdmin: true,
              admin: req.session.admin,
              isAuthenticated: true,
            });
          }
        } catch (error) {
          console.error("Admin user fetch error:", error);
        }
      }

      // 기존 세션 기반 인증 (폴백)
      if (req.session?.user) {
        const user = req.session.user;
        return res.json(user);
      }

      // 테스트 사용자 인증 확인 (세션 기반)
      if (req.session?.user && req.session.user.uid === "test-user-uid") {
        return res.json({
          isAuthenticated: true,
          user: req.session.user,
        });
      }

      // 일반 사용자 인증 확인
      if (req.isAuthenticated && req.isAuthenticated()) {
        res.json({ user: req.user });
      } else {
        // 프로덕션 환경에서는 테스트 사용자 자동 생성 비활성화

        console.log("No valid authentication found");
        res.status(401).json({ message: "Not authenticated" });
      }
    } catch (error) {
      console.error("Auth check error:", error);
      res.status(500).json({ message: "Authentication check failed" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    // 관리자 세션과 일반 사용자 세션 모두 정리
    if (req.session?.admin) {
      req.session.admin = null;
    }

    req.logout(err => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }

      // 전체 세션 정리
      req.session.destroy((destroyErr: any) => {
        if (destroyErr) {
          console.error("Session destroy error:", destroyErr);
        }
        res.json({ message: "Logged out successfully" });
      });
    });
  });

  // 관리자 점검용 임시 계정 생성
  app.post("/api/admin/create-test-user", async (req, res) => {
    try {
      const { plan } = req.body; // 'free' 또는 'premium'

      if (!plan || (plan !== "free" && plan !== "premium")) {
        return res.status(400).json({ message: "Invalid plan type" });
      }

      // 임시 사용자 ID 생성
      const tempUserId = `temp_${plan}_${Date.now()}`;
      const tempEmail = `${tempUserId}@test.com`;

      // 임시 사용자 생성
      const testUser = await storage.createUser({
        uid: tempUserId,
        email: tempEmail,
        provider: "test",
        name: `${plan === "premium" ? "프리미엄" : "무료"} 테스트 사용자`,
        mbti: "ENFP",
        interests: ["테스트", "점검"],
        personality: {
          empathy: 50,
          analytical: 50,
          creativity: 50,
          innovation: 50,
          leadership: 50,
          reliability: 50,
          communication: 50,
          problemSolving: 50,
        },
        birthDate: "1990-01-01",
        occupation: "테스트",
        gender: "상관없음",
        subscriptionType: plan,
        profileComplete: true,
      });

      console.log(`${plan} 플랜 임시 계정 생성:`, testUser);

      res.json({
        success: true,
        user: testUser,
        message: `${plan === "premium" ? "프리미엄" : "무료"} 플랜 임시 계정이 생성되었습니다.`,
      });
    } catch (error) {
      console.error("임시 계정 생성 실패:", error);
      res.status(500).json({ message: "임시 계정 생성에 실패했습니다." });
    }
  });

  // 관리자 점검용 임시 계정 삭제
  app.delete("/api/admin/delete-test-user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // 테스트 사용자인지 확인
      const user = await storage.getUser(userId);
      if (!user || !user.uid.startsWith("temp_")) {
        return res.status(400).json({ message: "테스트 계정이 아닙니다." });
      }

      // 사용자와 연관된 모든 데이터 삭제
      const deleted = await storage.deleteUserData(userId);

      if (deleted) {
        console.log("임시 계정 삭제 완료:", user.uid);
        res.json({
          success: true,
          message: "임시 계정이 삭제되었습니다.",
        });
      } else {
        res.status(500).json({ message: "임시 계정 삭제에 실패했습니다." });
      }
    } catch (error) {
      console.error("임시 계정 삭제 실패:", error);
      res.status(500).json({ message: "임시 계정 삭제에 실패했습니다." });
    }
  });

  app.post("/api/auth/admin-login", async (req, res) => {
    try {
      const { adminId, password } = req.body;

      // Check admin credentials
      if (adminId === "admin7447" && password === "diver72@") {
        // 관리자용 자동 프로필 생성 또는 가져오기
        let adminUser = await storage.getUserByEmail("admin@mentaltuneup.com");

        if (!adminUser) {
          const adminProfile = {
            uid: "admin-uid-" + Date.now(), // 고유한 uid 생성
            email: "admin@mentaltuneup.com",
            name: "관리자",
            provider: "admin",
            profileCompleted: true,
            mbti: "ENTJ",
            interests: [
              "심리학",
              "상담",
              "데이터분석",
              "사용자경험",
              "기술혁신",
              "인공지능",
            ],
            birthDate: "1985-03-15",
            occupation: "시스템 관리자",
            subscriptionType: "premium", // 관리자는 premium 모드로 시작
            personality: {
              analytical: 95,
              leadership: 90,
              empathy: 85,
              innovation: 88,
              communication: 92,
              problemSolving: 93,
              creativity: 87,
              reliability: 96,
            },
          };

          adminUser = await storage.createUser(adminProfile);
          console.log("관리자용 프로필 자동 생성 완료:", adminUser);
        } else {
          // 기존 관리자 사용자를 premium 플랜으로 설정
          adminUser = await storage.updateUser(adminUser.id, {
            subscriptionType: "premium",
          });
          console.log("기존 관리자 premium 플랜 설정 완료:", adminUser);
        }

        if (!adminUser) {
          return res.status(500).json({ message: "관리자 프로필 생성/업데이트 실패" });
        }

        // 세션에 관리자 정보와 사용자 ID 저장
        req.session.admin = {
          id: adminId,
          name: "Administrator",
          role: "admin",
          userId: adminUser.id,
        };

        // 세션 저장 강제
        req.session.save((err: any) => {
          if (err) {
            console.error("Session save error:", err);
            return res.status(500).json({ message: "Session save failed" });
          } else {
            console.log("관리자 세션 저장 완료:", req.session.admin);
            console.log("세션 ID:", req.sessionID);
            res.json({
              success: true,
              admin: req.session.admin,
              user: adminUser,
              sessionId: req.sessionID, // 클라이언트에 세션 ID 전달
            });
          }
        });
      } else {
        res.status(401).json({ message: "Invalid admin credentials" });
      }
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Admin login failed" });
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { name, email, password } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }

      // Create new user
      const user = await storage.createUser({
        uid: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        provider: "email",
        name,
        password,
        interests: [],
        personality: {},
      });

      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: "Signup failed" });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      console.log("Update user request body:", req.body);
      const updates = updateUserSchema.parse(req.body);

      // 사용자가 존재하지 않으면 현재 localStorage의 사용자 정보로 생성
      let user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        console.log("User not found, creating new user with updates:", updates);
        // 기본 사용자 생성 (Firebase UID 기반)
        user = await storage.createUser({
          uid: `user_${Date.now()}`, // Temporary UID for profile creation
          email: "temp@example.com",
          provider: "email",
          plan: "free",
          profileComplete: true,
        });
        console.log("Created new user:", user);
      }

      user = await storage.updateUser(user.id, updates);
      res.json(user);
    } catch (error) {
      console.error("Update user error:", error);
      res
        .status(500)
        .json({
          message: "Failed to update user",
          error: (error as Error).message,
        });
    }
  });

  // Firebase UID 기반 PostgreSQL 저장 API들
  app.post("/api/saveEmotionLog", async (req: Request, res: Response) => {
    try {
      const { uid, emotions, date, note } = req.body as any;

      if (!uid || !emotions || !date) {
        return res.status(400).json({ message: "필수 필드 누락" });
      }

      console.log("감정 기록 저장 요청:", { uid, emotions, date, note });

      // UID에서 사용자 조회
      let user = await storage.getUserByUID(uid);
      if (!user) {
        // 사용자가 없으면 기본 사용자 생성
        user = await storage.createUser({
          uid,
          email: `${uid}@temp.com`,
          provider: "temp",
          name: "임시 사용자",
        });
      }

      // 직접 데이터베이스에 저장 (emotionRecords 테이블 스키마에 맞춤)
      const result = await db
        .insert(emotionRecords)
        .values({
          uid,
          userId: user.id,
          emotionKeywords: emotions, // emotions → emotionKeywords
          emotions: emotions, // emotions 필드도 필수
          date,
          note: note || null,
          createdAt: new Date(),
        })
        .returning();

      console.log("감정 기록 저장 성공:", result[0]);
      res.json({ success: true, record: result[0] });
    } catch (error) {
      console.error("감정 기록 저장 실패:", error);
      res
        .status(500)
        .json({
          message: "감정 기록 저장 실패",
          error: (error as Error).message,
        });
    }
  });

  app.post("/api/saveAISession", async (req: Request, res: Response) => {
    try {
      const {
        uid,
        personaType,
        personaName,
        concernKeywords,
        selectedTones,
        summary,
      } = req.body as any;

      if (!uid || !personaType || !personaName) {
        return res.status(400).json({ message: "필수 필드 누락" });
      }

      // UID에서 사용자 조회
      let user = await storage.getUserByUID(uid);
      if (!user) {
        // 사용자가 없으면 기본 사용자 생성
        user = await storage.createUser({
          uid,
          email: `${uid}@temp.com`,
          provider: "temp",
          name: "임시 사용자",
        });
      }

      const result = await db
        .insert(counselingSessions)
        .values({
          uid,
          userId: user.id,
          personaType,
          personaName,
          concernKeywords: concernKeywords || [],
          selectedTones: selectedTones || [],
          summary: summary || null,
          isActive: true,
          createdAt: new Date(),
        })
        .returning();

      res.json({ success: true, session: result[0] });
    } catch (error) {
      console.error("AI 세션 저장 실패:", error);
      res.status(500).json({ message: "AI 세션 저장 실패" });
    }
  });

  app.post("/api/saveUserProfile", async (req: Request, res: Response) => {
    try {
      const {
        uid,
        email,
        name,
        mbti,
        interests,
        personality,
        birthDate,
        occupation,
        gender,
        subscriptionType,
      } = req.body as any;

      if (!uid || !email || !name) {
        return res.status(400).json({ message: "필수 필드 누락" });
      }

      // 기존 사용자 확인
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.uid, uid))
        .limit(1);

      let result;
      if (existingUser.length > 0) {
        // 업데이트
        result = await db
          .update(users)
          .set({
            email,
            name,
            mbti: mbti || null,
            interests: interests || [],
            personality: personality || {},
            birthDate: birthDate || null,
            occupation: occupation || null,
            gender: gender || null,
            subscriptionType: subscriptionType || "free",
            profileComplete: true,
          })
          .where(eq(users.uid, uid))
          .returning();
      } else {
        // 새로 생성
        result = await db
          .insert(users)
          .values({
            uid,
            email,
            provider: "email",
            name,
            mbti: mbti || null,
            interests: interests || [],
            personality: personality || {},
            birthDate: birthDate || null,
            occupation: occupation || null,
            gender: gender || null,
            subscriptionType: subscriptionType || "free",
            profileComplete: true,
          })
          .returning();
      }

      res.json({ success: true, user: result[0] });
    } catch (error) {
      console.error("사용자 프로필 저장 실패:", error);
      res.status(500).json({ message: "사용자 프로필 저장 실패" });
    }
  });

  // Emotion records routes
  app.get("/api/users/:userId/emotions", async (req, res) => {
    try {
      const emotions = await storage.getEmotionRecordsByUser(
        parseInt(req.params.userId)
      );
      res.json(emotions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get emotion records" });
    }
  });

  app.post("/api/users/:userId/emotions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      // 사용자 정보 조회하여 uid 획득
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const emotionData = insertEmotionRecordSchema.parse({
        uid: user.uid,
        date: req.body.date,
        emotionKeywords: req.body.emotionKeywords,
        note: req.body.note,
        score: req.body.score,
      });

      console.log("감정 기록 생성 데이터:", emotionData);
      const emotion = await storage.createEmotionRecord(emotionData);
      res.json(emotion);
    } catch (error) {
      console.error("감정 기록 생성 오류:", error as Error);
      res
        .status(500)
        .json({
          message: "Failed to create emotion record",
          error: error instanceof Error ? error.message : "Unknown error",
        });
    }
  });

  app.get("/api/users/:userId/emotions/:date", async (req, res) => {
    try {
      const emotion = await storage.getEmotionRecordByDate(
        parseInt(req.params.userId),
        req.params.date
      );
      res.json(emotion || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to get emotion record" });
    }
  });

  // UID 기반 감정 기록 조회 API 추가
  app.get("/api/emotions/uid/:uid", async (req, res) => {
    try {
      const { uid } = req.params;
      console.log("UID 기반 감정 기록 조회:", uid);

      const emotions = await db
        .select()
        .from(emotionRecords)
        .where(eq(emotionRecords.uid, uid))
        .orderBy(emotionRecords.createdAt);

      console.log("조회된 감정 기록:", emotions);
      res.json(emotions);
    } catch (error) {
      console.error("UID 기반 감정 조회 실패:", error);
      res.status(500).json({ message: "Failed to get emotion records by UID" });
    }
  });

  app.get("/api/emotions/uid/:uid/date/:date", async (req, res) => {
    try {
      const { uid, date } = req.params;
      console.log("UID 기반 특정 날짜 감정 조회:", { uid, date });

      const [emotion] = await db
        .select()
        .from(emotionRecords)
        .where(and(eq(emotionRecords.uid, uid), eq(emotionRecords.date, date)));

      console.log("조회된 특정 날짜 감정:", emotion);
      res.json(emotion || null);
    } catch (error) {
      console.error("UID 기반 특정 날짜 감정 조회 실패:", error);
      res
        .status(500)
        .json({ message: "Failed to get emotion record by UID and date" });
    }
  });

  // Personality assessment routes
  app.post("/api/users/:userId/personality/analyze", async (req, res) => {
    try {
      const { interests, worldcupResults } = req.body;
      const analysis = await analyzePersonality({ interests, worldcupResults });

      const assessment = await storage.createPersonalityAssessment({
        userId: parseInt(req.params.userId),
        assessmentType: "interests_worldcup",
        results: analysis,
      });

      res.json(assessment);
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze personality" });
    }
  });

  app.get("/api/users/:userId/personality", async (req, res) => {
    try {
      const assessments = await storage.getPersonalityAssessmentsByUser(
        parseInt(req.params.userId)
      );
      res.json(assessments);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to get personality assessments" });
    }
  });

  // Counseling routes
  app.post(
    "/api/users/:userId/counseling/recommendations",
    async (req, res) => {
      try {
        const { concernKeywords, personaPreferences } = req.body;
        const userId = parseInt(req.params.userId);

        if (isNaN(userId)) {
          return res.status(400).json({ message: "Invalid user ID" });
        }

        const user = await storage.getUser(userId);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // 최근 감정 기록 가져오기 (지난 7일)
        const recentEmotions = await storage.getEmotionRecordsByUser(user.id);
        const recentEmotionKeywords = recentEmotions
          .filter(emotion => {
            if (!emotion.createdAt) return false;
            const emotionDate = new Date(emotion.createdAt);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return emotionDate >= weekAgo;
          })
          .flatMap(emotion => emotion.emotionKeywords)
          .slice(-10); // 최근 10개 감정만

        // 최근 상담 히스토리 가져오기 (지난 상담 3회)
        const recentSessions = await storage.getCounselingSessionsByUser(
          user.id
        );
        const recentChatHistory: Array<{
          content: string;
          timestamp: Date;
          role: "user" | "assistant";
        }> = [];

        for (const session of recentSessions.slice(-3)) {
          const messages = await storage.getChatMessagesBySession(session.id);
          recentChatHistory.push(
            ...messages.map(msg => ({
              content: msg.content,
              timestamp: msg.createdAt!,
              role: msg.role as "user" | "assistant",
            }))
          );
        }

        const recommendations = await generateDynamicPersonaRecommendations(
          {
            name: user.name || "사용자",
            mbti: user.mbti || undefined,
            interests: user.interests || [],
            recentEmotions: recentEmotionKeywords,
            birthDate: user.birthDate || undefined,
            occupation: user.occupation || undefined,
            personality: user.personality || {},
          },
          concernKeywords,
          personaPreferences,
          recentChatHistory.slice(-15) // 최근 15개 메시지만
        );

        res.json(recommendations);
      } catch (error) {
        console.error("Error generating persona recommendations:", error);
        res
          .status(500)
          .json({
            message: "Failed to generate recommendations",
            error: error instanceof Error ? error.message : "Unknown error",
          });
      }
    }
  );

  app.post("/api/users/:userId/counseling/sessions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      console.log("Creating counseling session for user:", userId);
      console.log("Request body:", req.body);

      const sessionData = insertCounselingSessionSchema.parse({
        ...req.body,
        userId: userId,
      });

      console.log("Parsed session data:", sessionData);

      const session = await storage.createCounselingSession(sessionData);

      // 세션 생성 후 페르소나의 첫 인사말 자동 생성 (자아탐색 세션 제외)
      const isSelfDiscoverySession =
        session.concernKeywords &&
        (session.concernKeywords.includes("자아탐색") ||
          session.concernKeywords.includes("튼트니"));

      const user = await storage.getUser(userId);
      if (user && !isSelfDiscoverySession) {
        const { generateWelcomeMessage } = await import("./services/openai");

        try {
          // 간단한 한국 이름 생성
          const names = [
            "준호",
            "서연",
            "지은",
            "민준",
            "수빈",
            "현우",
            "예린",
            "태민",
            "하은",
            "승현",
          ];
          const personaName = names[Math.floor(Math.random() * names.length)];

          // 페르소나 객체 생성 (환영 메시지 함수의 첫 번째 매개변수)
          const persona = {
            name: personaName,
            description: `${user.name || "사용자"}님의 ${(session.concernKeywords || []).join(", ")} 고민을 함께 해결하는 전문 상담사`,
            type: session.personaType as
              | "strategic"
              | "empathetic"
              | "cheerful",
            matchingRank: "상" as const,
            reason: ["사용자 맞춤형 상담"],
          };

          console.log("환영 메시지 생성을 위한 페르소나:", persona);
          console.log("환영 메시지 생성을 위한 사용자 프로필:", {
            name: user.name,
            mbti: user.mbti,
            interests: user.interests,
          });

          const welcomeMessage = await generateWelcomeMessage(
            persona,
            {
              name: user.name,
              mbti: user.mbti || undefined,
              interests: user.interests || [],
              birthDate: user.birthDate || undefined,
              occupation: user.occupation || undefined,
            },
            session.concernKeywords || []
          );

          // 첫 인사말을 자동으로 채팅에 추가
          await storage.createChatMessage({
            sessionId: session.id,
            role: "assistant",
            content: welcomeMessage,
          });
        } catch (welcomeError) {
          console.error("Failed to generate welcome message:", welcomeError);
          // 폴백 인사말이 이미 generateWelcomeMessage에서 처리됨
        }
      }

      res.json(session);
    } catch (error) {
      console.error("Error creating counseling session:", error);
      console.error("Error stack:", (error as Error).stack);
      res.status(500).json({
        message: "Failed to create counseling session",
        error: (error as Error).message,
        details: (error as Error).toString(),
      });
    }
  });

  app.get("/api/users/:userId/counseling/sessions", async (req, res) => {
    try {
      const sessions = await storage.getCounselingSessionsByUser(
        parseInt(req.params.userId)
      );
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get counseling sessions" });
    }
  });

  // 상담 세션 종료 (isActive를 false로 설정)
  app.put("/api/counseling/sessions/:sessionId/end", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const session = await storage.getCounselingSession(sessionId);

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // 세션을 종료 상태로 설정 (summary로 종료 표시)
      const updatedSession = await storage.updateCounselingSession(sessionId, {
        summary: "세션 종료됨",
      });

      // 유료 플랜 사용자의 상담 종료 시 캘린더에 요약 저장
      if (req.user) {
        try {
          const user = await storage.getUser(req.user.id);
          // 임시로 프리미엄 사용자로 가정 (나중에 실제 구독 체크 로직 추가)
          const isPremium = true; // user?.subscriptionPlan === 'premium';

          if (isPremium) {
            // 상담 메시지들을 가져와서 요약 생성
            const messages = await storage.getChatMessagesBySession(sessionId);

            if (messages.length > 1) {
              // 대화 요약 생성
              const userMessages = messages.filter(
                msg => msg.role === "user"
              ).length;
              const aiMessages = messages.filter(
                msg => msg.role === "assistant"
              ).length;
              const summary = `${session.personaType} AI 상담 완료\n메시지: 사용자 ${userMessages}개, AI ${aiMessages}개\n주제: ${Array.isArray(session.concernKeywords) ? session.concernKeywords.join(", ") : "일반상담"}\n시작: ${new Date(session.createdAt || new Date()).toLocaleString("ko-KR")}\n종료: ${new Date().toLocaleString("ko-KR")}`;

              // 캘린더에 상담 기록 저장
              const today = new Date().toISOString().split("T")[0];
              await storage.createScheduleAppointment({
                userId: req.user.id,
                type: "AI상담",
                title: `${session.personaType} AI 상담`,
                date: today,
                startTime: new Date().toTimeString().slice(0, 5),
                status: "completed",
                counselingSummary: summary,
                counselingSessionId: sessionId,
              });
            }
          }
        } catch (calendarError) {
          console.error(
            "Failed to save counseling summary to calendar:",
            calendarError
          );
          // 캘린더 저장 실패해도 세션 업데이트는 성공으로 처리
        }
      }

      res.json({
        message: "Session ended successfully",
        session: updatedSession,
      });
    } catch (error) {
      console.error("Failed to end session:", error);
      res.status(500).json({ message: "Failed to end session" });
    }
  });

  app.delete("/api/counseling/sessions/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const session = await storage.getCounselingSession(sessionId);

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // 세션을 비활성화 (summary로 삭제 표시)
      await storage.updateCounselingSession(sessionId, { summary: "세션 삭제됨" });

      res.json({ message: "Session deleted successfully" });
    } catch (error) {
      console.error("Failed to delete session:", error);
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  // Chat routes
  app.get("/api/sessions/:sessionId/messages", async (req, res) => {
    try {
      const messages = await storage.getChatMessagesBySession(
        parseInt(req.params.sessionId)
      );
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get chat messages" });
    }
  });

  app.post("/api/sessions/:sessionId/messages", async (req, res) => {
    try {
      const { content, role } = req.body;

      // Save user message
      const userMessage = await storage.createChatMessage({
        sessionId: parseInt(req.params.sessionId),
        role: "user",
        content,
      });

      if (role === "user") {
        // Generate AI response
        const session = await storage.getCounselingSession(
          parseInt(req.params.sessionId)
        );
        if (!session) {
          return res.status(404).json({ message: "Session not found" });
        }

        const user = await storage.getUser(session.userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Get conversation history
        const history = await storage.getChatMessagesBySession(session.id);
        const conversationHistory = history.slice(-10).map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));

        // 최근 7일 감정 기록 조회
        const recentEmotions = await storage.getEmotionRecordsByUser(user.id);
        const last7DaysEmotions = recentEmotions.filter(emotion => {
          const emotionDate = new Date(emotion.date);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return emotionDate >= weekAgo;
        });

        const aiResponse = await generateCounselingResponse(
          content,
          {
            name: user.name,
            mbti: user.mbti,
            interests: user.interests || [],
            birthDate: user.birthDate,
            occupation: user.occupation,
            personality: user.personality || {},
            gender: user.gender,
          },
          {
            type: session.personaType as
              | "strategic"
              | "empathetic"
              | "cheerful",
            name: session.personaName || session.personaType || "상담사",
            description: session.personaDescription || "",
            matchingRank: (session.matchingRank as "상" | "최상" | "중") || "상",
            reason: session.reason || [],
            specialization: session.specialization || "종합 상담",
            approachMethod: session.approachMethod || "맞춤형 접근",
          },
          conversationHistory,
          session.selectedTones || [],
          session.concernKeywords || [],
          last7DaysEmotions
        );

        // Save AI response
        const assistantMessage = await storage.createChatMessage({
          sessionId: session.id,
          role: "assistant",
          content: aiResponse.message,
        });

        res.json({
          userMessage,
          assistantMessage,
          suggestedFollowUps: aiResponse.suggestedFollowUps,
        });
      } else {
        res.json({ userMessage });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Welcome message route (assistant-only, no user message)
  app.post("/api/sessions/:sessionId/welcome", async (req, res) => {
    try {
      const { content } = req.body;

      const welcomeMessage = await storage.createChatMessage({
        sessionId: parseInt(req.params.sessionId),
        role: "assistant",
        content,
      });

      res.json(welcomeMessage);
    } catch (error) {
      console.error("Error creating welcome message:", error);
      res.status(500).json({ message: "Failed to create welcome message" });
    }
  });

  // Feedback routes
  app.post("/api/feedback", async (req, res) => {
    try {
      const feedbackData = insertFeedbackLogSchema.parse(req.body);
      const feedback = await storage.createFeedbackLog(feedbackData);
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ message: "Failed to create feedback" });
    }
  });

  app.get("/api/users/:userId/feedback", async (req, res) => {
    try {
      const feedback = await storage.getFeedbackLogsByUser(
        parseInt(req.params.userId)
      );
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ message: "Failed to get feedback" });
    }
  });

  // Admin routes - moved to comprehensive admin section below

  // 실시간 분석 리포트 API
  app.get("/api/users/:id/analysis/realtime", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // 기존 상세 성격 분석 가져오기
      const { generateDetailedAnalysis, generateRealtimeAnalysisReport } =
        await import("./services/openai");
      const personalityAnalysis = await generateDetailedAnalysis({
        name: user.name,
        mbti: user.mbti || undefined,
        interests: user.interests || [],
        birthDate: user.birthDate || undefined,
        occupation: user.occupation || undefined,
        personality: user.personality || {},
      });

      // 최근 상담 메시지 가져오기
      const counselingSessions =
        await storage.getCounselingSessionsByUser(userId);
      const recentMessages: Array<{
        content: string;
        timestamp: Date;
        role: "user" | "assistant";
      }> = [];

      for (const session of counselingSessions.slice(-3)) {
        // 최근 3개 세션
        const messages = await storage.getChatMessagesBySession(session.id);
        recentMessages.push(
          ...messages.map(msg => ({
            content: msg.content,
            timestamp: msg.createdAt || new Date(),
            role: msg.role as "user" | "assistant",
          }))
        );
      }

      // 최근 감정 기록 가져오기
      const emotionRecords = await storage.getEmotionRecordsByUser(userId);
      const recentEmotions = emotionRecords.slice(-7).map(record => ({
        emotions: record.emotions,
        date: record.date,
        note: record.note || undefined,
      }));

      const realtimeReport = await generateRealtimeAnalysisReport(
        {
          mood: "분석중",
          intensity: 50,
          keywords: recentEmotions.flatMap(e => e.emotions || []),
          recentMessages,
          recentEmotions
        },
        {
          name: user.name,
          mbti: user.mbti || undefined,
          interests: user.interests || [],
          birthDate: user.birthDate || undefined,
          occupation: user.occupation || undefined,
          personalityAnalysis
        }
      );

      res.json(realtimeReport);
    } catch (error) {
      console.error("Failed to generate realtime analysis:", error);
      res.status(500).json({ message: "Failed to generate realtime analysis" });
    }
  });

  // Detailed personality analysis route
  app.get("/api/users/:id/personality/detailed", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const analysis = await generateDetailedAnalysis(user);
      res.json(analysis);
    } catch (error) {
      console.error("Error generating detailed analysis:", error);
      res.status(500).json({ message: "Failed to generate detailed analysis" });
    }
  });

  // Personality report route
  app.get("/api/users/:id/personality/report", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { generatePersonalityReport } = await import("./services/openai");
      const report = await generatePersonalityReport(user);

      res.json(report);
    } catch (error) {
      console.error("Error generating personality report:", error);
      res
        .status(500)
        .json({ message: "Failed to generate personality report" });
    }
  });

  // Schedule appointments routes
  app.get("/api/users/:id/schedule/appointments", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const appointments = await storage.getScheduleAppointmentsByUser(userId);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get(
    "/api/users/:id/schedule/appointments/date/:date",
    async (req, res) => {
      try {
        const userId = parseInt(req.params.id);
        const date = req.params.date;
        const appointments = await storage.getScheduleAppointmentsByDate(
          userId,
          date
        );
        res.json(appointments);
      } catch (error) {
        console.error("Error fetching appointments by date:", error);
        res.status(500).json({ message: "Failed to fetch appointments" });
      }
    }
  );

  app.post("/api/users/:id/schedule/appointments", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { insertScheduleAppointmentSchema } = await import(
        "@shared/schema"
      );

      // 요청 데이터 디버깅
      console.log("일정 생성 요청 데이터:", {
        repeatType: req.body.repeatType,
        repeatWeekdays: req.body.repeatWeekdays,
        repeatDates: req.body.repeatDates,
        repeatDays: req.body.repeatDays,
        title: req.body.title,
        date: req.body.date,
        monthlyBasis: req.body.monthlyBasis,
      });

      const validatedData = insertScheduleAppointmentSchema.parse({
        ...req.body,
        userId,
      });

      // 검증된 데이터 확인
      console.log("검증된 일정 데이터:", {
        repeatType: validatedData.repeatType,
        repeatWeekdays: validatedData.repeatWeekdays,
        repeatDates: validatedData.repeatDates,
        repeatDays: validatedData.repeatDays,
        title: validatedData.title,
        date: validatedData.date,
        monthlyBasis: validatedData.monthlyBasis,
      });

      // 중복 방지: group_id가 있는 경우 동일한 날짜와 group_id 조합이 이미 존재하는지 확인
      if (validatedData.groupId) {
        const existingAppointments =
          await storage.getScheduleAppointmentsByUser(userId);
        const isDuplicate = existingAppointments.some(
          apt =>
            apt.groupId === validatedData.groupId &&
            apt.date === validatedData.date
        );

        if (isDuplicate) {
          console.log(
            `중복 일정 방지: ${validatedData.groupId} - ${validatedData.date} 이미 존재함`
          );
          return res
            .status(409)
            .json({
              message: "Duplicate appointment detected",
              existingAppointment: true,
            });
        }
      }

      const appointment =
        await storage.createScheduleAppointment(validatedData);
      console.log(
        `일정 생성 완료: ${appointment.title} - ${appointment.date} (${appointment.groupId})`
      );
      res.status(201).json(appointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.patch(
    "/api/users/:id/schedule/appointments/:appointmentId",
    async (req, res) => {
      try {
        const appointmentId = parseInt(req.params.appointmentId);
        const updates = req.body;

        const appointment = await storage.updateScheduleAppointment(
          appointmentId,
          updates
        );
        if (!appointment) {
          return res.status(404).json({ message: "Appointment not found" });
        }

        res.json(appointment);
      } catch (error) {
        console.error("Error updating appointment:", error);
        res.status(500).json({ message: "Failed to update appointment" });
      }
    }
  );

  app.delete(
    "/api/users/:id/schedule/appointments/:appointmentId",
    async (req, res) => {
      try {
        const appointmentId = parseInt(req.params.appointmentId);
        const { deleteType = "single", selectedDate } = req.body;

        const appointment = await storage.getScheduleAppointment(appointmentId);
        if (!appointment) {
          return res.status(404).json({ message: "Appointment not found" });
        }

        if (deleteType === "single") {
          // 단일 일정만 삭제 - 정확히 이 ID의 일정만 삭제 (반복 일정과 상관없이)
          console.log(`단일 일정 삭제: ID ${appointmentId}`);
          const success =
            await storage.deleteScheduleAppointment(appointmentId);

          if (!success) {
            return res.status(404).json({ message: "Appointment not found" });
          }

          console.log(`일정 ID ${appointmentId} 삭제 완료`);
          res.json({ message: "선택한 일정이 삭제되었습니다" });
        } else if (deleteType === "future") {
          // 선택된 날짜 이후의 반복 일정만 삭제
          if (appointment.repeatType !== "none" && selectedDate) {
            const userId = parseInt(req.params.id);
            const allAppointments =
              await storage.getScheduleAppointmentsByUser(userId);

            // 같은 반복 그룹의 일정들 중 선택된 날짜 이후 일정만 찾기
            const sameRepeatGroup = allAppointments.filter(
              apt =>
                apt.title === appointment.title &&
                apt.repeatType === appointment.repeatType &&
                apt.startTime === appointment.startTime &&
                apt.date >= selectedDate
            );

            let deletedCount = 0;
            for (const apt of sameRepeatGroup) {
              const success = await storage.deleteScheduleAppointment(apt.id);
              if (success) deletedCount++;
            }

            res.json({
              message: `${selectedDate} 이후의 반복 일정 ${deletedCount}개가 삭제되었습니다`,
            });
          } else {
            // 단일 일정인 경우
            const success =
              await storage.deleteScheduleAppointment(appointmentId);
            res.json({ message: "일정이 삭제되었습니다" });
          }
        } else {
          // 전체 반복 시리즈 삭제
          const userId = parseInt(req.params.id);
          const allAppointments =
            await storage.getScheduleAppointmentsByUser(userId);

          const sameRepeatGroup = allAppointments.filter(
            apt =>
              apt.title === appointment.title &&
              apt.repeatType === appointment.repeatType &&
              apt.startTime === appointment.startTime
          );

          let deletedCount = 0;
          for (const apt of sameRepeatGroup) {
            const success = await storage.deleteScheduleAppointment(apt.id);
            if (success) deletedCount++;
          }

          res.json({
            message: `반복 일정 시리즈 ${deletedCount}개가 모두 삭제되었습니다`,
          });
        }
      } catch (error) {
        console.error("Error deleting appointment:", error);
        res.status(500).json({ message: "Failed to delete appointment" });
      }
    }
  );

  // 그룹 기반 일정 삭제 엔드포인트 (지침서 기반)
  app.delete(
    "/api/users/:id/schedule/appointments/group/:groupId",
    async (req, res) => {
      try {
        const userId = parseInt(req.params.id);
        const groupId = req.params.groupId;
        const { deleteType = "all", fromDate } = req.body;

        console.log("그룹 삭제 요청:", {
          userId,
          groupId,
          deleteType,
          fromDate,
        });

        const allAppointments =
          await storage.getScheduleAppointmentsByUser(userId);

        // 그룹 ID로 해당 반복 일정들 찾기
        let targetAppointments = allAppointments.filter(
          apt => apt.groupId === groupId
        );

        if (deleteType === "future" && fromDate) {
          // 지정된 날짜 이후의 일정만 필터링
          targetAppointments = targetAppointments.filter(
            apt => apt.date >= fromDate
          );
        }

        console.log(`삭제 대상 일정: ${targetAppointments.length}개`);

        let deletedCount = 0;
        for (const apt of targetAppointments) {
          const success = await storage.deleteScheduleAppointment(apt.id);
          if (success) deletedCount++;
        }

        const message =
          deleteType === "future"
            ? `${fromDate} 이후의 반복 일정 ${deletedCount}개가 삭제되었습니다`
            : `반복 일정 그룹 ${deletedCount}개가 모두 삭제되었습니다`;

        res.json({ message, deletedCount });
      } catch (error) {
        console.error("그룹 일정 삭제 오류:", error);
        res.status(500).json({ message: "그룹 일정 삭제에 실패했습니다" });
      }
    }
  );

  // Content creation and management endpoints
  app.post("/api/admin/content", async (req: Request, res: Response) => {
    try {
      const { insertContentItemSchema } = await import("@shared/schema");
      const contentData = req.body;

      // Process image selection for title image
      let thumbnailUrl = contentData.thumbnailUrl || "";
      if (contentData.selectedImage) {
        thumbnailUrl = contentData.selectedImage;
      }

      // Validate and prepare content data
      const validatedData = insertContentItemSchema.parse({
        title: contentData.title,
        content: contentData.content || contentData.summary || "",
        summary: contentData.summary || "",
        category: contentData.category || "psychology",
        type: contentData.type || "article",
        url: contentData.sourceUrl || contentData.url || "",
        thumbnailUrl: thumbnailUrl,
        tags: Array.isArray(contentData.tags) ? contentData.tags : [],
        metadata: JSON.stringify(contentData.metadata || {}),
        status: contentData.status || "published",
      });

      // Save to database
      const savedContent = await storage.createContentItem(validatedData);

      console.log("New content created:", savedContent.title);

      res.json({
        success: true,
        content: savedContent,
        message: "콘텐츠가 성공적으로 저장되었습니다.",
      });
    } catch (error) {
      console.error("Error creating content:", error);
      res.status(500).json({
        success: false,
        message: "콘텐츠 저장 중 오류가 발생했습니다.",
      });
    }
  });

  app.post("/api/admin/scrape-url", async (req: Request, res: Response) => {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ message: "URL이 필요합니다." });
      }

      // 웹페이지 콘텐츠 스크래핑
      console.log("Scraping URL:", url);

      // 웹페이지 가져오기
      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        timeout: 10000, // 10초 타임아웃
      });

      const $ = cheerio.load(response.data);

      // 웹페이지에서 정보 추출
      const originalTitle =
        $("title").text().trim() ||
        $("h1").first().text().trim() ||
        $('meta[property="og:title"]').attr("content") ||
        "제목 없음";

      const originalDescription =
        $('meta[name="description"]').attr("content") ||
        $('meta[property="og:description"]').attr("content") ||
        "";

      // 본문 텍스트 추출 (다양한 선택자 시도)
      let mainContent = "";
      const contentSelectors = [
        "article",
        ".content",
        ".post-content",
        ".entry-content",
        ".post-body",
        ".article-content",
        "main",
        "#content",
        ".se-main-container", // 네이버 블로그
      ];

      for (const selector of contentSelectors) {
        const content = $(selector).text().trim();
        if (content.length > mainContent.length) {
          mainContent = content;
        }
      }

      // 메인 콘텐츠가 너무 짧으면 모든 p 태그에서 추출
      if (mainContent.length < 200) {
        mainContent = $("p")
          .map((i, el) => $(el).text())
          .get()
          .join("\n");
      }

      // 이미지 수집
      const images: string[] = [];
      $("img").each((i, el) => {
        const src = $(el).attr("src");
        if (src) {
          // 상대 경로를 절대 경로로 변환
          try {
            const imageUrl = new URL(src, url).href;
            if (imageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
              images.push(imageUrl);
            }
          } catch (e) {
            // URL 파싱 실패시 무시
          }
        }
      });

      // 메타데이터 추출
      const author =
        $('meta[name="author"]').attr("content") ||
        $('meta[property="article:author"]').attr("content") ||
        $(".author").first().text().trim() ||
        "";

      const publishDate =
        $('meta[property="article:published_time"]').attr("content") ||
        $("time").first().attr("datetime") ||
        $(".date").first().text().trim() ||
        "";

      console.log("Extracted content:", {
        title: originalTitle,
        contentLength: mainContent.length,
        imagesFound: images.length,
      });

      // GPT를 사용하여 콘텐츠 분석 및 재구성
      const analysisPrompt = `
다음은 웹페이지에서 추출한 실제 콘텐츠입니다:

원제목: ${originalTitle}
원 설명: ${originalDescription}
본문 내용: ${mainContent.substring(0, 3000)} ${mainContent.length > 3000 ? "...(이하 생략)" : ""}

이 콘텐츠를 분석하여 다음을 생성해주세요:

1. 개선된 제목: 원제목을 바탕으로 더 매력적이고 클릭하고 싶은 제목으로 재작성
2. 요약: 본문 내용을 2-3줄로 핵심만 요약
3. 재구성된 본문: 주요 내용을 정리하여 읽기 쉬운 블로그 포스트 형태로 재구성 (마크다운 형식)
4. 해시태그: 내용과 관련된 해시태그 5-8개 (# 없이 단어만)
5. 카테고리: psychology/health/wellness/lifestyle/mindfulness/news 중 가장 적합한 것

JSON 형식으로 응답해주세요:
{
  "title": "개선된 제목",
  "summary": "요약 내용",
  "content": "재구성된 본문",
  "tags": ["태그1", "태그2", "태그3"],
  "category": "카테고리"
}
`;

      // OpenAI API 호출
      const openai = new (await import("openai")).default({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content:
              "당신은 콘텐츠 분석 및 재구성 전문가입니다. 웹페이지 콘텐츠를 분석하고 한국 독자들에게 적합한 형태로 재구성해주세요. 반드시 유효한 JSON 형식으로 응답하세요.",
          },
          {
            role: "user",
            content: analysisPrompt,
          },
        ],
        max_tokens: 2500,
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const analysis = completion.choices[0].message.content;
      let analysisResult;

      try {
        analysisResult = JSON.parse(analysis || "{}");
      } catch (parseError) {
        console.error("JSON parsing error:", parseError);
        analysisResult = {
          title: originalTitle,
          summary: originalDescription || mainContent.substring(0, 200) + "...",
          content: mainContent,
          tags: ["웹콘텐츠", "정보"],
          category: "psychology",
        };
      }

      // 분석 결과를 구조화된 데이터로 반환
      const scrapedContent = {
        title: analysisResult.title || originalTitle,
        summary:
          analysisResult.summary ||
          originalDescription ||
          mainContent.substring(0, 200) + "...",
        content: analysisResult.content || mainContent,
        tags: analysisResult.tags || ["웹콘텐츠"],
        images: images.slice(0, 6), // 최대 6개 이미지
        metadata: {
          author: author || "웹사이트",
          publishDate: publishDate || new Date().toLocaleDateString("ko-KR"),
          readTime: `${Math.ceil((analysisResult.content || mainContent).length / 500)}분`,
          wordCount: (analysisResult.content || mainContent).length,
          originalUrl: url,
        },
      };

      console.log("Analysis completed:", {
        analyzedTitle: scrapedContent.title,
        contentLength: scrapedContent.content.length,
        tagsCount: scrapedContent.tags.length,
      });

      res.json(scrapedContent);
    } catch (error) {
      console.error("Error scraping URL:", error);

      let errorMessage = "URL 분석 중 오류가 발생했습니다.";
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          errorMessage =
            "웹페이지 로딩 시간이 초과되었습니다. 다른 URL을 시도해보세요.";
        } else if (error.message.includes("404")) {
          errorMessage = "웹페이지를 찾을 수 없습니다. URL을 확인해주세요.";
        } else if (error.message.includes("403")) {
          errorMessage =
            "웹페이지에 접근할 수 없습니다. 접근이 제한된 페이지일 수 있습니다.";
        }
      }

      res.status(500).json({
        message: errorMessage,
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      });
    }
  });

  app.get("/api/psychological-tests/:testId/:category", async (req, res) => {
    try {
      const { testId, category } = req.params;
      const { getAllTests } = await import(
        "./services/psychologyTestGenerator"
      );
      const allTests = await getAllTests();

      const test = allTests[testId];

      if (!test || test.category !== category) {
        return res.status(404).json({ message: "Test not found" });
      }

      res.json(test);
    } catch (error) {
      console.error("Error fetching psychological test:", error);
      res.status(500).json({ message: "Failed to fetch test" });
    }
  });

  app.get("/api/psychological-tests", async (req, res) => {
    try {
      const { getAllTests } = await import(
        "./services/psychologyTestGenerator"
      );
      const allTests = await getAllTests();
      res.json(allTests);
    } catch (error) {
      console.error("Error fetching psychological tests:", error);
      res.status(500).json({ message: "Failed to fetch tests" });
    }
  });

  // Admin API Routes

  // Admin Dashboard Statistics
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const stats = await storage.getSystemStats();
      const allUsers = await storage.getAllUsers();
      const allFeedback = await storage.getAllFeedbackLogs();

      // Calculate additional metrics
      const today = new Date().toISOString().split("T")[0];
      const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      const thisMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const dailyUsers = allUsers.filter(
        u => u.createdAt && u.createdAt.toISOString().split("T")[0] === today
      ).length;
      const weeklyUsers = allUsers.filter(
        u => u.createdAt && u.createdAt.toISOString().split("T")[0] >= thisWeek
      ).length;
      const monthlyUsers = allUsers.filter(
        u => u.createdAt && u.createdAt.toISOString().split("T")[0] >= thisMonth
      ).length;

      const freeUsers = allUsers.filter(
        u => u.subscriptionType === "free" || !u.subscriptionType
      ).length;
      const premiumUsers = allUsers.filter(
        u => u.subscriptionType === "premium"
      ).length;

      // Calculate demographics
      const genderCounts = allUsers.reduce(
        (acc, user) => {
          const gender = user.gender || "unknown";
          acc[gender] = (acc[gender] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Calculate age distribution
      const currentYear = new Date().getFullYear();
      const ageGroups = allUsers.reduce(
        (acc, user) => {
          if (user.birthDate) {
            const birthYear = new Date(user.birthDate).getFullYear();
            const age = currentYear - birthYear;

            let ageGroup = "";
            if (age < 20) ageGroup = "10대";
            else if (age < 30) ageGroup = "20대";
            else if (age < 40) ageGroup = "30대";
            else if (age < 50) ageGroup = "40대";
            else if (age < 60) ageGroup = "50대";
            else ageGroup = "60대+";

            acc[ageGroup] = (acc[ageGroup] || 0) + 1;
          } else {
            acc["미입력"] = (acc["미입력"] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>
      );

      const ageDistribution = Object.entries(ageGroups).map(
        ([ageGroup, count]) => ({
          ageGroup,
          count,
        })
      );

      res.json({
        ...stats,
        userGrowth: {
          daily: dailyUsers,
          weekly: weeklyUsers,
          monthly: monthlyUsers,
          total: allUsers.length,
        },
        subscriptions: {
          free: freeUsers,
          premium: premiumUsers,
          conversionRate:
            freeUsers > 0
              ? ((premiumUsers / (freeUsers + premiumUsers)) * 100).toFixed(1)
              : 0,
        },
        feedback: {
          totalCount: allFeedback.length,
          averageRating:
            allFeedback.length > 0
              ? (
                  allFeedback.reduce((sum, f) => sum + f.rating, 0) /
                  allFeedback.length
                ).toFixed(1)
              : 0,
        },
        demographics: {
          genderRatio: {
            male: genderCounts.male || 0,
            female: genderCounts.female || 0,
            unknown: genderCounts.unknown || 0,
          },
          ageDistribution,
        },
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin statistics" });
    }
  });

  // Admin User Management
  app.get("/api/admin/users", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string;

      let users = await storage.getAllUsers();

      if (search) {
        users = users.filter(
          u =>
            (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
            u.email.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Sort by creation date (newest first)
      users.sort(
        (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
      );

      const total = users.length;
      const startIndex = (page - 1) * limit;
      const paginatedUsers = users.slice(startIndex, startIndex + limit);

      res.json({
        users: paginatedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Update user subscription
  app.patch("/api/admin/users/:id/subscription", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { subscriptionType, subscriptionStartDate, subscriptionEndDate } =
        req.body;

      const updatedUser = await storage.updateUser(userId, {
        subscriptionType,
        subscriptionStartDate: subscriptionStartDate
          ? new Date(subscriptionStartDate)
          : undefined,
        subscriptionEndDate: subscriptionEndDate
          ? new Date(subscriptionEndDate)
          : undefined,
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user subscription:", error);
      res.status(500).json({ message: "Failed to update user subscription" });
    }
  });

  // Delete user account and all related data
  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Delete all user-related data
      await storage.deleteUserData(userId);

      res.json({ message: "User and all related data deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Get user profile details
  app.get("/api/admin/users/:id/profile", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get additional user data
      const emotionRecords = await storage.getEmotionRecordsByUser(userId);
      const counselingSessions =
        await storage.getCounselingSessionsByUser(userId);
      const personalityAssessments =
        await storage.getPersonalityAssessmentsByUser(userId);
      const scheduleAppointments =
        await storage.getScheduleAppointmentsByUser(userId);

      // Calculate user statistics
      const totalCounselingSessions = counselingSessions.length;
      const totalEmotionRecords = emotionRecords.length;
      const lastActivityDate = Math.max(
        ...emotionRecords.map(r => r.createdAt ? r.createdAt.getTime() : 0),
        ...counselingSessions.map(s => s.createdAt ? s.createdAt.getTime() : 0),
        0
      );

      res.json({
        profile: {
          id: user.id,
          name: user.name,
          email: user.email,
          gender: user.gender,
          birthDate: user.birthDate,
          occupation: user.occupation,
          mbti: user.mbti,
          interests: user.interests,
          subscriptionType: user.subscriptionType || "free",
          subscriptionStartDate: user.subscriptionStartDate,
          subscriptionEndDate: user.subscriptionEndDate,
          createdAt: user.createdAt,
          isActive: user.isActive !== false,
          provider: user.provider || "email",
        },
        statistics: {
          totalCounselingSessions,
          totalEmotionRecords,
          totalPersonalityAssessments: personalityAssessments.length,
          totalScheduleAppointments: scheduleAppointments.length,
          lastActivityDate:
            lastActivityDate > 0 ? new Date(lastActivityDate) : null,
          accountAge: user.createdAt
            ? Math.floor(
                (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
              )
            : 0,
        },
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // Deactivate user account
  app.patch("/api/admin/users/:id/deactivate", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      const updatedUser = await storage.updateUser(userId, {
        isActive: false,
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User account deactivated successfully" });
    } catch (error) {
      console.error("Error deactivating user:", error);
      res.status(500).json({ message: "Failed to deactivate user" });
    }
  });

  // Admin Content Management
  app.get("/api/admin/content", async (req, res) => {
    try {
      // Get real content from database
      const content = await storage.getAllContentItems();
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  // Update content item
  app.put("/api/admin/content/:id", async (req, res) => {
    try {
      const contentId = parseInt(req.params.id);
      const contentData = req.body;

      // Handle image selection
      let thumbnailUrl = contentData.thumbnailUrl || "";
      if (contentData.selectedImage) {
        thumbnailUrl = contentData.selectedImage;
      }

      // Validate and prepare update data
      const updateData = {
        title: contentData.title,
        content: contentData.content || contentData.summary || "",
        summary: contentData.summary || "",
        category: contentData.category || "psychology",
        type: contentData.type || "article",
        url: contentData.sourceUrl || contentData.url || "",
        thumbnailUrl: thumbnailUrl,
        tags: Array.isArray(contentData.tags) ? contentData.tags : [],
        metadata: JSON.stringify(contentData.metadata || {}),
        status: contentData.status || "published",
      };

      const updatedContent = await storage.updateContentItem(
        contentId,
        updateData
      );

      if (!updatedContent) {
        return res.status(404).json({ message: "Content not found" });
      }

      console.log("Content updated:", updatedContent.title);
      res.json({
        success: true,
        content: updatedContent,
        message: "콘텐츠가 성공적으로 수정되었습니다.",
      });
    } catch (error) {
      console.error("Error updating content:", error);
      res.status(500).json({
        success: false,
        message: "콘텐츠 수정 중 오류가 발생했습니다.",
      });
    }
  });

  // Delete content item
  app.delete("/api/admin/content/:id", async (req, res) => {
    try {
      const contentId = parseInt(req.params.id);
      const success = await storage.deleteContentItem(contentId);

      if (!success) {
        return res.status(404).json({ message: "Content not found" });
      }

      res.json({ message: "Content deleted successfully" });
    } catch (error) {
      console.error("Error deleting content:", error);
      res.status(500).json({ message: "Failed to delete content" });
    }
  });

  // Admin Activity Analytics with time ranges
  app.get("/api/admin/analytics", async (req, res) => {
    try {
      const { range = "7d", type = "activity" } = req.query;

      // Calculate date range
      let days = 7;
      if (range === "30d") days = 30;
      else if (range === "1y") days = 365;

      const allUsers = await storage.getAllUsers();
      const allFeedback = await storage.getAllFeedbackLogs();

      if (type === "gender") {
        // Gender distribution analytics
        const genderData = allUsers.reduce(
          (acc, user) => {
            const gender = user.gender || "unknown";
            acc[gender] = (acc[gender] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        const genderAnalytics = Object.entries(genderData).map(
          ([gender, count]) => ({
            name:
              gender === "male"
                ? "남성"
                : gender === "female"
                  ? "여성"
                  : "미지정",
            value: count,
            percentage: Math.round((count / allUsers.length) * 100),
          })
        );

        res.json(genderAnalytics);
      } else if (type === "age") {
        // Age distribution analytics
        const ageGroups = {
          "10대": 0,
          "20대": 0,
          "30대": 0,
          "40대": 0,
          "50대": 0,
          "60대+": 0,
        };

        allUsers.forEach(user => {
          if (user.birthDate) {
            const age =
              new Date().getFullYear() - new Date(user.birthDate).getFullYear();
            if (age < 20) ageGroups["10대"]++;
            else if (age < 30) ageGroups["20대"]++;
            else if (age < 40) ageGroups["30대"]++;
            else if (age < 50) ageGroups["40대"]++;
            else if (age < 60) ageGroups["50대"]++;
            else ageGroups["60대+"]++;
          }
        });

        const ageAnalytics = Object.entries(ageGroups).map(([age, count]) => ({
          name: age,
          value: count,
          percentage: Math.round((count / allUsers.length) * 100),
        }));

        res.json(ageAnalytics);
      } else if (type === "revenue") {
        // Revenue analytics with comparison
        const premiumUsers = allUsers.filter(
          u => u.subscriptionType === "premium"
        );
        const monthlyRevenue = premiumUsers.length * 9900;

        // Generate monthly revenue data for comparison
        const revenueData: Array<{month: string, revenue: number, growth: number}> = [];
        for (let i = 11; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthStr = date.toISOString().slice(0, 7);

          // Mock revenue data with some variation
          const baseRevenue = Math.floor(
            monthlyRevenue * (0.7 + Math.random() * 0.6)
          );
          revenueData.push({
            month: monthStr,
            revenue: baseRevenue,
            growth:
              i === 0
                ? 0
                : Math.round(
                    ((baseRevenue -
                      (revenueData[revenueData.length - 1]?.revenue ||
                        baseRevenue)) /
                      (revenueData[revenueData.length - 1]?.revenue ||
                        baseRevenue)) *
                      100
                  ),
          });
        }

        res.json(revenueData);
      } else {
        // Default activity analytics
        const analytics = [];
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
          const dateStr = date.toISOString().split("T")[0];

          const dailyUsers = allUsers.filter(
            u =>
              u.createdAt && u.createdAt.toISOString().split("T")[0] === dateStr
          ).length;

          const dailyFeedback = allFeedback.filter(
            f =>
              f.timestamp && f.timestamp.toISOString().split("T")[0] === dateStr
          ).length;

          analytics.push({
            date: dateStr,
            newUsers: dailyUsers,
            feedback: dailyFeedback,
            emotionRecords: Math.floor(Math.random() * 100) + 50,
            counselingSessions: Math.floor(Math.random() * 150) + 100,
            psychTests: Math.floor(Math.random() * 80) + 40,
          });
        }

        res.json(analytics);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Admin Feedback Management
  app.get("/api/admin/feedback", async (req, res) => {
    try {
      const feedback = await storage.getAllFeedbackLogs();

      // Sort by timestamp (newest first)
      feedback.sort(
        (a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)
      );

      res.json(feedback.slice(0, 100)); // Return latest 100 feedback items
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  // Admin Notifications Management
  app.get("/api/admin/notifications", async (req, res) => {
    try {
      const notifications = await storage.getAllNotifications();
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/admin/notifications/send", async (req, res) => {
    try {
      const {
        title,
        message,
        type,
        targetAudience,
        priority,
        duration,
        forceNotification,
      } = req.body;

      if (!title || !message) {
        return res.status(400).json({ message: "제목과 메시지는 필수입니다." });
      }

      // 대상 사용자 필터링
      const allUsers = await storage.getAllUsers();
      let targetUsers = [];

      switch (targetAudience) {
        case "premium":
          targetUsers = allUsers.filter(
            user => user.subscriptionType === "premium"
          );
          break;
        case "free":
          targetUsers = allUsers.filter(
            user => user.subscriptionType === "free"
          );
          break;
        case "active":
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          targetUsers = allUsers.filter(
            user => user.lastLogin && new Date(user.lastLogin) > thirtyDaysAgo
          );
          break;
        case "inactive":
          const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
          targetUsers = allUsers.filter(
            user => !user.lastLogin || new Date(user.lastLogin) < sixtyDaysAgo
          );
          break;
        default:
          targetUsers = allUsers;
      }

      // 사용자 알림 설정 체크 및 필터링
      const eligibleUsers = [];
      for (const user of targetUsers) {
        try {
          // 강제 전송이 활성화된 경우 설정 무시하고 모든 사용자에게 전송
          if (forceNotification) {
            eligibleUsers.push(user);
            continue;
          }

          const notificationSettings =
            await storage.getUserNotificationSettings(user.id);

          // 알림 설정이 없으면 기본값으로 모든 알림 허용
          if (!notificationSettings) {
            eligibleUsers.push(user);
            continue;
          }

          // 알림 유형에 따른 설정 체크
          let shouldSendNotification = false;

          switch (type) {
            case "시스템":
              shouldSendNotification =
                Boolean(notificationSettings.showOnMainEntry) ||
                Boolean(notificationSettings.showOnLimitReached) ||
                Boolean(notificationSettings.showOnLimitFunctionPressed) ||
                Boolean(notificationSettings.showOnServiceTermination);
              break;
            case "마케팅":
              shouldSendNotification =
                Boolean(notificationSettings.showOnAdminAnnouncement);
              break;
            case "이벤트":
              shouldSendNotification =
                Boolean(notificationSettings.showOnAdminAnnouncement);
              break;
            case "공지사항":
              shouldSendNotification =
                Boolean(notificationSettings.showOnAdminAnnouncement);
              break;
            case "업데이트":
              shouldSendNotification =
                Boolean(notificationSettings.showOnAdminAnnouncement);
              break;
            default:
              shouldSendNotification = true; // 기본값
          }

          if (shouldSendNotification) {
            eligibleUsers.push(user);
          }
        } catch (error) {
          console.error(
            `Error checking notification settings for user ${user.id}:`,
            error
          );
          // 설정 체크 실패 시 기본값으로 알림 허용
          eligibleUsers.push(user);
        }
      }

      // 만료일 계산 (duration이 지정된 경우)
      let expiresAt = null;
      if (duration && duration !== "무기한" && duration !== "indefinite") {
        const durationDays = parseInt(duration);
        if (!isNaN(durationDays) && durationDays > 0) {
          expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + durationDays);
        }
      }

      // 각 사용자에게 알림 생성
      const notificationPromises = eligibleUsers.map(user =>
        storage.createNotification({
          userId: user.id,
          title,
          content: message,
          type,
          priority: priority || "normal",
          isRead: false,
          status: "active",
          expiresAt,
        })
      );

      await Promise.all(notificationPromises);

      res.json({
        message: "알림이 성공적으로 전송되었습니다.",
        sentCount: eligibleUsers.length,
        totalFiltered: targetUsers.length,
        filteredBySettings: forceNotification
          ? 0
          : targetUsers.length - eligibleUsers.length,
        retentionPeriod: duration || "무기한",
        overrideEnabled: forceNotification || false,
      });
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ message: "알림 전송에 실패했습니다." });
    }
  });

  app.patch("/api/admin/notifications/:id/read", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const success = await storage.markNotificationAsRead(notificationId);

      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }

      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  // Extend notification expiry date
  app.patch("/api/admin/notifications/:id/extend", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const { extensionDays } = req.body;

      if (!extensionDays || extensionDays <= 0) {
        return res
          .status(400)
          .json({ message: "유효한 연장 일수를 입력해주세요." });
      }

      const success = await storage.extendNotificationExpiry(
        notificationId,
        extensionDays
      );

      if (!success) {
        return res.status(404).json({ message: "알림을 찾을 수 없습니다." });
      }

      res.json({ message: `알림이 ${extensionDays}일 연장되었습니다.` });
    } catch (error) {
      console.error("Error extending notification:", error);
      res.status(500).json({ message: "알림 연장에 실패했습니다." });
    }
  });

  // Terminate notification (set status to expired)
  app.patch("/api/admin/notifications/:id/terminate", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);

      const success = await storage.terminateNotification(notificationId);

      if (!success) {
        return res.status(404).json({ message: "알림을 찾을 수 없습니다." });
      }

      res.json({ message: "알림이 종료되었습니다." });
    } catch (error) {
      console.error("Error terminating notification:", error);
      res.status(500).json({ message: "알림 종료에 실패했습니다." });
    }
  });

  // Delete expired notification
  app.delete("/api/admin/notifications/:id", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);

      const success = await storage.deleteNotification(notificationId);

      if (!success) {
        return res.status(404).json({ message: "알림을 찾을 수 없습니다." });
      }

      res.json({ message: "알림이 삭제되었습니다." });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "알림 삭제에 실패했습니다." });
    }
  });

  // Get active/expired notifications separately
  app.get("/api/admin/notifications/active", async (req, res) => {
    try {
      const notifications = await storage.getActiveNotifications();
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching active notifications:", error);
      res.status(500).json({ message: "활성 알림 조회에 실패했습니다." });
    }
  });

  app.get("/api/admin/notifications/expired", async (req, res) => {
    try {
      const notifications = await storage.getExpiredNotifications();
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching expired notifications:", error);
      res.status(500).json({ message: "만료된 알림 조회에 실패했습니다." });
    }
  });

  // Admin Notification Rules Management
  app.get("/api/admin/notification-rules", async (req, res) => {
    try {
      // Mock notification rules data - in real implementation, these would be stored in database
      const notificationRules = [
        {
          id: "1",
          name: "사용자 가입 환영",
          description:
            "새로 가입한 사용자에게 환영 메시지를 자동으로 전송합니다.",
          enabled: true,
          category: "user_activity",
          condition: "user_signup",
        },
        {
          id: "2",
          name: "상담 세션 완료",
          description: "상담 세션 완료 후 만족도 조사를 자동으로 전송합니다.",
          enabled: true,
          category: "user_activity",
          condition: "counseling_session_completed",
        },
        {
          id: "3",
          name: "무료 플랜 한계 도달",
          description:
            "무료 플랜 사용자가 사용 한계에 도달했을 때 알림을 전송합니다.",
          enabled: true,
          category: "subscription",
          condition: "free_plan_limit_reached",
        },
        {
          id: "4",
          name: "프리미엄 구독 만료 임박",
          description: "프리미엄 구독이 7일 내에 만료될 때 알림을 전송합니다.",
          enabled: true,
          category: "subscription",
          condition: "premium_subscription_expiring",
        },
        {
          id: "5",
          name: "시스템 유지보수 공지",
          description:
            "시스템 유지보수 시 모든 사용자에게 공지사항을 전송합니다.",
          enabled: false,
          category: "system_events",
          condition: "system_maintenance",
        },
        {
          id: "6",
          name: "새로운 기능 업데이트",
          description:
            "새로운 기능이 추가되었을 때 사용자에게 알림을 전송합니다.",
          enabled: true,
          category: "engagement",
          condition: "new_feature_release",
        },
      ];

      res.json(notificationRules);
    } catch (error) {
      console.error("Error fetching notification rules:", error);
      res.status(500).json({ message: "Failed to fetch notification rules" });
    }
  });

  app.put("/api/admin/notification-rules/:id", async (req, res) => {
    try {
      const ruleId = req.params.id;
      const { enabled } = req.body;

      // Mock implementation - in real implementation, this would update the database
      console.log(
        `Updating notification rule ${ruleId} to enabled: ${enabled}`
      );

      res.json({
        message: "알림 규칙이 성공적으로 업데이트되었습니다.",
        ruleId,
        enabled,
      });
    } catch (error) {
      console.error("Error updating notification rule:", error);
      res.status(500).json({ message: "알림 규칙 업데이트에 실패했습니다." });
    }
  });

  // Notification statistics for admin dashboard
  app.get("/api/admin/notifications/stats", async (req, res) => {
    try {
      const notifications = await storage.getAllNotifications();

      // Calculate statistics
      const totalSent = notifications.length;
      const readCount = notifications.filter(n => n.isRead).length;
      const unreadCount = totalSent - readCount;
      const readRate =
        totalSent > 0 ? Math.round((readCount / totalSent) * 100) : 0;

      // Group by type
      const typeStats = notifications.reduce(
        (acc, notification) => {
          const type = notification.type || "other";
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Recent activity (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentNotifications = notifications.filter(
        n => n.createdAt && new Date(n.createdAt) > sevenDaysAgo
      );

      res.json({
        totalSent,
        readCount,
        unreadCount,
        readRate,
        typeStats,
        recentActivity: recentNotifications.length,
        avgDailyNotifications: Math.round(recentNotifications.length / 7),
      });
    } catch (error) {
      console.error("Error fetching notification stats:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch notification statistics" });
    }
  });

  // User Notifications API
  app.get("/api/notifications", async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching user notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const success = await storage.markNotificationAsRead(notificationId);

      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }

      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  // Admin user profile endpoint
  app.get(
    "/api/admin/users/:id/profile",
    async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.id);
        const user = await storage.getUser(userId);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Get user statistics
        const [
          emotionRecords,
          counselingSessions,
          personalityAssessments,
          scheduleAppointments,
        ] = await Promise.all([
          storage.getEmotionRecordsByUser(userId),
          storage.getCounselingSessionsByUser(userId),
          storage.getPersonalityAssessmentsByUser(userId),
          storage.getScheduleAppointmentsByUser(userId),
        ]);

        const response = {
          profile: {
            name: user.name || "미입력",
            email: user.email || "미입력",
            gender: user.gender || "미입력",
            birthDate: user.birthDate || null,
            occupation: user.occupation || "미입력",
            mbti: user.mbti || "미입력",
            provider: user.provider || "email",
            createdAt: user.createdAt,
            subscriptionType: user.subscriptionType || "free",
            isActive: user.isActive !== false,
            subscriptionStartDate: user.subscriptionStartDate || null,
            subscriptionEndDate: user.subscriptionEndDate || null,
            subscriptionCount: user.subscriptionCount || 0,
            interests: user.interests || [],
          },
          statistics: {
            totalCounselingSessions: counselingSessions.length,
            totalEmotionRecords: emotionRecords.length,
            totalPersonalityAssessments: personalityAssessments.length,
            totalScheduleAppointments: scheduleAppointments.length,
            lastActivityDate: Math.max(
              emotionRecords.length > 0 && emotionRecords[emotionRecords.length - 1].createdAt
                ? new Date(
                    emotionRecords[emotionRecords.length - 1].createdAt!
                  ).getTime()
                : 0,
              counselingSessions.length > 0 && counselingSessions[counselingSessions.length - 1].createdAt
                ? new Date(
                    counselingSessions[counselingSessions.length - 1].createdAt!
                  ).getTime()
                : 0
            ),
            accountAge: user.createdAt
              ? Math.floor(
                  (Date.now() - new Date(user.createdAt).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : 0,
          },
        };

        res.json(response);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Failed to fetch user profile" });
      }
    }
  );

  // Delete user endpoint
  app.delete("/api/admin/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const success = await storage.deleteUserData(userId);

      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Update user subscription endpoint
  app.patch(
    "/api/admin/users/:id/subscription",
    async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.id);
        const { subscriptionType } = req.body;

        const updatedUser = await storage.updateUser(userId, {
          subscriptionType: subscriptionType,
          subscriptionStartDate:
            subscriptionType === "premium" ? new Date() : null,
          subscriptionEndDate:
            subscriptionType === "premium"
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              : null,
        });

        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }

        res.json({
          message: "Subscription updated successfully",
          user: updatedUser,
        });
      } catch (error) {
        console.error("Error updating subscription:", error);
        res.status(500).json({ message: "Failed to update subscription" });
      }
    }
  );

  // Deactivate user endpoint
  app.patch(
    "/api/admin/users/:id/deactivate",
    async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.id);

        const updatedUser = await storage.updateUser(userId, {
          isActive: false,
          subscriptionType: "free",
          subscriptionEndDate: new Date(),
        });

        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }

        res.json({
          message: "User deactivated successfully",
          user: updatedUser,
        });
      } catch (error) {
        console.error("Error deactivating user:", error);
        res.status(500).json({ message: "Failed to deactivate user" });
      }
    }
  );

  // Content Request API - for users to request content
  app.post("/api/content-request", async (req, res) => {
    try {
      const { subject, content, reason, userEmail } = req.body;

      if (!subject || !content || !reason) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Create notification for admin
      await storage.createNotification({
        type: "content_request",
        title: `컨텐츠 신청: ${subject}`,
        content: `사용자 ${userEmail}가 컨텐츠를 신청했습니다.\n\n신청내용: ${content}\n\n신청이유: ${reason}`,
        isRead: false,
      });

      res.json({ message: "Content request submitted successfully" });
    } catch (error) {
      console.error("Error submitting content request:", error);
      res.status(500).json({ message: "Failed to submit content request" });
    }
  });

  // Public Content API - for regular users
  app.get("/api/content", async (req: Request, res: Response) => {
    try {
      const content = await storage.getAllContentItems();
      // Filter only published content for public access
      const publishedContent = content.filter(
        item => item.status === "published"
      );
      res.json(publishedContent);
    } catch (error) {
      console.error("Error fetching public content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  // Admin Content Management - CRUD endpoints
  app.get("/api/admin/content", async (req: Request, res: Response) => {
    try {
      const content = await storage.getAllContentItems();
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.put("/api/admin/content/:id", async (req: Request, res: Response) => {
    try {
      const contentId = parseInt(req.params.id);
      const updates = req.body;

      const updatedContent = await storage.updateContentItem(
        contentId,
        updates
      );

      if (!updatedContent) {
        return res.status(404).json({ message: "Content not found" });
      }

      res.json(updatedContent);
    } catch (error) {
      console.error("Error updating content:", error);
      res.status(500).json({ message: "Failed to update content" });
    }
  });

  app.delete("/api/admin/content/:id", async (req: Request, res: Response) => {
    try {
      const contentId = parseInt(req.params.id);
      const success = await storage.deleteContentItem(contentId);

      if (!success) {
        return res.status(404).json({ message: "Content not found" });
      }

      res.json({ message: "Content deleted successfully" });
    } catch (error) {
      console.error("Error deleting content:", error);
      res.status(500).json({ message: "Failed to delete content" });
    }
  });

  // Admin Revenue Analytics
  app.get("/api/admin/revenue", async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const premiumUsers = allUsers.filter(
        u => u.subscriptionType === "premium"
      );

      // Mock revenue calculation (would be replaced with actual payment data)
      const monthlyRevenue = premiumUsers.length * 9900; // 9,900원 per premium user
      const previousMonthRevenue = Math.floor(monthlyRevenue * 0.85); // Mock previous month

      const revenueGrowth =
        previousMonthRevenue > 0
          ? (
              ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) *
              100
            ).toFixed(1)
          : 0;

      // Generate monthly revenue data
      const revenueData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const users = Math.floor(premiumUsers.length * (0.7 + i * 0.05)); // Simulate growth

        revenueData.push({
          month: date.toLocaleDateString("ko-KR", { month: "short" }),
          revenue: users * 9900,
          users: users,
        });
      }

      res.json({
        currentMonth: {
          revenue: monthlyRevenue,
          growth: revenueGrowth,
          premiumUsers: premiumUsers.length,
        },
        monthlyData: revenueData,
        metrics: {
          averageRevenuePerUser:
            premiumUsers.length > 0 ? monthlyRevenue / premiumUsers.length : 0,
          churnRate: 3.2, // Mock churn rate
          averageSubscriptionDuration: 4.2, // Mock duration in months
        },
      });
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      res.status(500).json({ message: "Failed to fetch revenue data" });
    }
  });

  // Subscription routes
  app.use("/api/subscription", subscriptionRoutes);
  app.use("/api/admin", adminRoutes);

  // GPT Assistant for admin dashboard
  app.post("/api/admin/gpt-assistant", async (req: Request, res: Response) => {
    try {
      const { message, systemPrompt, context } = req.body;

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      const openai = new (await import("openai")).default({ apiKey: process.env.OPENAI_API_KEY });

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      res.json({
        response: response.choices[0].message.content,
        context,
      });
    } catch (error: any) {
      console.error("GPT Assistant error:", error);
      res
        .status(500)
        .json({ error: "GPT 어시스턴트 응답 중 오류가 발생했습니다." });
    }
  });

  // Customer Inquiry Routes
  app.post("/api/customer-inquiries", async (req: Request, res: Response) => {
    try {
      const inquiryData = req.body;
      const inquiry = await storage.createCustomerInquiry(inquiryData);

      // Create notification for admin
      await storage.createNotification({
        userId: null, // Admin notification
        type: "customer_inquiry",
        title: `새로운 고객 문의: ${inquiry.subject}`,
        content: `${inquiry.name}님이 ${inquiry.category} 카테고리로 문의하셨습니다.`,
        priority: "normal",
        relatedId: inquiry.id,
        metadata: { inquiryId: inquiry.id, userEmail: inquiry.email },
      });

      res.json({ success: true, inquiry });
    } catch (error) {
      console.error("Customer inquiry creation error:", error);
      res
        .status(500)
        .json({ success: false, error: "문의 등록에 실패했습니다." });
    }
  });

  app.get(
    "/api/admin/customer-inquiries",
    async (req: Request, res: Response) => {
      try {
        const inquiries = await storage.getAllCustomerInquiries();
        res.json({ success: true, inquiries });
      } catch (error) {
        console.error("Fetch inquiries error:", error);
        res
          .status(500)
          .json({
            success: false,
            error: "문의 목록을 불러오는데 실패했습니다.",
          });
      }
    }
  );

  app.put(
    "/api/admin/customer-inquiries/:id/reply",
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { reply } = req.body;

        const inquiry = await storage.replyToCustomerInquiry(
          parseInt(id),
          reply
        );
        if (!inquiry) {
          return res
            .status(404)
            .json({ success: false, error: "문의를 찾을 수 없습니다." });
        }

        // Create notification for user (if userId exists)
        if (inquiry.userId) {
          await storage.createNotification({
            userId: inquiry.userId,
            type: "admin_reply",
            title: `문의 답변이 도착했습니다`,
            content: `"${inquiry.subject}" 문의에 대한 관리자 답변이 등록되었습니다.`,
            priority: "high",
            relatedId: inquiry.id,
            metadata: {
              inquiryId: inquiry.id,
              replyPreview: reply.substring(0, 100),
            },
          });
        }

        res.json({ success: true, inquiry });
      } catch (error) {
        console.error("Reply creation error:", error);
        res
          .status(500)
          .json({ success: false, error: "답변 등록에 실패했습니다." });
      }
    }
  );

  app.delete(
    "/api/admin/customer-inquiries/:id",
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const inquiryId = parseInt(id);

        const inquiry = await storage.getCustomerInquiry(inquiryId);
        if (!inquiry) {
          return res
            .status(404)
            .json({ success: false, error: "문의를 찾을 수 없습니다." });
        }

        const deleted = await storage.deleteCustomerInquiry(inquiryId);

        if (!deleted) {
          return res
            .status(500)
            .json({ success: false, error: "문의 삭제에 실패했습니다." });
        }

        res.json({
          success: true,
          message: "문의가 성공적으로 삭제되었습니다.",
        });
      } catch (error) {
        console.error("Error deleting customer inquiry:", error);
        res.status(500).json({
          success: false,
          error: "문의 삭제 중 오류가 발생했습니다.",
        });
      }
    }
  );

  // User Notification Routes
  app.get("/api/notifications", async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      if (!user) {
        return res
          .status(401)
          .json({ success: false, error: "로그인이 필요합니다." });
      }

      const notifications = await storage.getUserNotifications(user.id);
      res.json({ success: true, notifications });
    } catch (error) {
      console.error("Fetch notifications error:", error);
      res
        .status(500)
        .json({ success: false, error: "알림을 불러오는데 실패했습니다." });
    }
  });

  app.put(
    "/api/notifications/:id/read",
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        await storage.markNotificationAsRead(parseInt(id));
        res.json({ success: true });
      } catch (error) {
        console.error("Mark notification read error:", error);
        res
          .status(500)
          .json({ success: false, error: "알림 읽음 처리에 실패했습니다." });
      }
    }
  );

  // Admin User Management Routes

  // Get user profile for admin
  app.get(
    "/api/admin/users/:id/profile",
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const userId = parseInt(id);

        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        // Get user statistics
        const counselingSessions =
          await storage.getCounselingSessionsByUser(userId);
        const emotionRecords = await storage.getEmotionRecordsByUser(userId);
        const personalityAssessments =
          await storage.getPersonalityAssessmentsByUser(userId);
        const scheduleAppointments =
          await storage.getScheduleAppointmentsByUser(userId);

        // Calculate statistics
        const lastActivityDate = Math.max(
          ...counselingSessions.map(s => s.createdAt ? new Date(s.createdAt).getTime() : 0),
          ...emotionRecords.map(e => e.createdAt ? new Date(e.createdAt).getTime() : 0),
          0
        );

        const accountAge = Math.floor(
          (Date.now() - new Date(user.createdAt || new Date()).getTime()) /
            (1000 * 60 * 60 * 24)
        );

        const statistics = {
          totalCounselingSessions: counselingSessions.length,
          totalEmotionRecords: emotionRecords.length,
          totalPersonalityAssessments: personalityAssessments.length,
          totalScheduleAppointments: scheduleAppointments.length,
          lastActivityDate:
            lastActivityDate > 0
              ? new Date(lastActivityDate).toISOString()
              : null,
          accountAge,
        };

        res.json({
          profile: user,
          statistics,
        });
      } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ error: "Failed to fetch user profile" });
      }
    }
  );

  // Delete user and all associated data
  app.delete("/api/admin/users/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      const success = await storage.deleteUserData(userId);
      if (!success) {
        return res
          .status(404)
          .json({ error: "User not found or deletion failed" });
      }

      res.json({
        message: "User and all associated data deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Update user subscription
  app.patch(
    "/api/admin/users/:id/subscription",
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { subscriptionType } = req.body;

        const userId = parseInt(id);
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        // 구독 변경 시 날짜 및 카운트 업데이트 로직
        const updateData: any = { subscriptionType };

        if (subscriptionType === "premium") {
          // 프리미엄으로 변경
          updateData.subscriptionStartDate = new Date().toISOString();
          updateData.subscriptionEndDate = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(); // 30일 후
          updateData.subscriptionCount = (user.subscriptionCount || 0) + 1;
        } else if (subscriptionType === "free") {
          // 무료로 변경
          updateData.subscriptionEndDate = new Date().toISOString();
          // 시작일과 카운트는 유지
        }

        const updatedUser = await storage.updateUser(userId, updateData);

        if (!updatedUser) {
          return res.status(404).json({ error: "User not found" });
        }

        res.json(updatedUser);
      } catch (error) {
        console.error("Error updating subscription:", error);
        res.status(500).json({ error: "Failed to update subscription" });
      }
    }
  );

  // Grant temporary premium subscription
  app.patch(
    "/api/admin/users/:id/temp-premium",
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { days } = req.body;

        const userId = parseInt(id);
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        // Only allow for free users
        if (user.subscriptionType !== "free") {
          return res
            .status(400)
            .json({
              error: "Only free users can receive temporary premium access",
            });
        }

        // Calculate end date
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);

        const updateData = {
          tempPremiumEndDate: endDate.toISOString(),
          tempPremiumGrantedBy: "admin7447",
          tempPremiumGrantedAt: new Date().toISOString(),
        };

        const updatedUser = await storage.updateUser(userId, updateData);

        if (!updatedUser) {
          return res.status(404).json({ error: "User not found" });
        }

        res.json({
          success: true,
          message: `${days}일 임시 프리미엄 구독이 부여되었습니다.`,
          user: updatedUser,
        });
      } catch (error) {
        console.error("Error granting temporary premium:", error);
        res.status(500).json({ error: "Failed to grant temporary premium" });
      }
    }
  );

  // Deactivate user account
  app.patch(
    "/api/admin/users/:id/deactivate",
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        const updatedUser = await storage.updateUser(parseInt(id), {
          isActive: false,
        });

        if (!updatedUser) {
          return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "User account deactivated successfully" });
      } catch (error) {
        console.error("Error deactivating user:", error);
        res.status(500).json({ error: "Failed to deactivate user" });
      }
    }
  );

  // User Notification Settings Routes
  app.get(
    "/api/user/notification-settings",
    async (req: Request, res: Response) => {
      try {
        const user = req.user as any;
        if (!user) {
          return res.status(401).json({ message: "인증이 필요합니다." });
        }

        const settings = await storage.getUserNotificationSettings(user.id);
        res.json(settings);
      } catch (error) {
        console.error("Error fetching notification settings:", error);
        res
          .status(500)
          .json({ message: "알림 설정을 불러오는데 실패했습니다." });
      }
    }
  );

  app.post(
    "/api/user/notification-settings",
    async (req: Request, res: Response) => {
      try {
        const user = req.user as any;
        if (!user) {
          return res.status(401).json({ message: "인증이 필요합니다." });
        }

        const settingsData = insertUserNotificationSettingsSchema.parse({
          userId: user.id,
          ...req.body,
        });

        const settings =
          await storage.createUserNotificationSettings(settingsData);
        res.json(settings);
      } catch (error) {
        console.error("Error creating notification settings:", error);
        res.status(500).json({ message: "알림 설정 생성에 실패했습니다." });
      }
    }
  );

  app.put(
    "/api/user/notification-settings",
    async (req: Request, res: Response) => {
      try {
        const user = req.user as any;
        if (!user) {
          return res.status(401).json({ message: "인증이 필요합니다." });
        }

        const updates = req.body;
        const settings = await storage.updateUserNotificationSettings(
          user.id,
          updates
        );

        if (!settings) {
          return res
            .status(404)
            .json({ message: "알림 설정을 찾을 수 없습니다." });
        }

        res.json(settings);
      } catch (error) {
        console.error("Error updating notification settings:", error);
        res.status(500).json({ message: "알림 설정 업데이트에 실패했습니다." });
      }
    }
  );

  // 사용자 피드백 저장 API
  app.post("/api/user-feedback", async (req: Request, res: Response) => {
    try {
      const { type, category, reasons, message, rating, metadata } = req.body;

      // 현재 사용자 ID 가져오기 (세션 또는 localStorage에서)
      let userId = req.session?.user?.id || req.body.userId;

      // 관리자 세션인 경우 관리자 userId 사용
      if (req.session?.admin?.userId) {
        userId = req.session.admin.userId;
      }

      const feedbackData = {
        userId: userId || null,
        type,
        category,
        reasons: Array.isArray(reasons) ? reasons : [],
        message: message || null,
        rating: rating || null,
        metadata: metadata || {},
      };

      console.log("피드백 데이터 저장:", feedbackData);
      const feedback = await storage.createUserFeedback(feedbackData);
      res.json({ success: true, feedback });
    } catch (error) {
      console.error("Error saving user feedback:", error);
      res.status(500).json({ error: "Failed to save feedback" });
    }
  });

  // 관리자 피드백 조회 API
  app.get("/api/admin/user-feedback", async (req: Request, res: Response) => {
    try {
      const feedback = await storage.getUserFeedback();
      res.json(feedback);
    } catch (error) {
      console.error("Error fetching user feedback:", error);
      res.status(500).json({ error: "Failed to fetch feedback" });
    }
  });

  // 관리자 피드백 조회 API (기존 endpoint와 호환)
  app.get("/api/admin/feedback", async (req: Request, res: Response) => {
    try {
      const feedback = await storage.getUserFeedback();
      res.json(feedback);
    } catch (error) {
      console.error("Error fetching admin feedback:", error);
      res.status(500).json({ error: "Failed to fetch feedback" });
    }
  });

  // Admin Notification Management Routes

  // 관리자 알림 작성 및 전송 API
  app.post("/api/admin/notifications", async (req: Request, res: Response) => {
    try {
      const { title, content, type, priority, targetGroup } = req.body;

      console.log("알림 작성 요청:", {
        title,
        content,
        type,
        priority,
        targetGroup,
      });

      // 대상 사용자 필터링
      const allUsers = await storage.getAllUsers();
      let targetUsers: any[] = [];

      switch (targetGroup) {
        case "all":
          targetUsers = allUsers;
          break;
        case "premium":
          targetUsers = allUsers.filter(
            user => user.subscriptionType === "premium"
          );
          break;
        case "free":
          targetUsers = allUsers.filter(
            user => user.subscriptionType === "free" || !user.subscriptionType
          );
          break;
        case "active":
          // 최근 7일 내 활동한 사용자
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          targetUsers = allUsers.filter(
            user => user.lastLogin && new Date(user.lastLogin) >= weekAgo
          );
          break;
        case "inactive":
          // 최근 30일 내 활동하지 않은 사용자
          const monthAgo = new Date();
          monthAgo.setDate(monthAgo.getDate() - 30);
          targetUsers = allUsers.filter(
            user => !user.lastLogin || new Date(user.lastLogin) < monthAgo
          );
          break;
        default:
          targetUsers = allUsers;
      }

      console.log(`대상 사용자 ${targetUsers.length}명에게 알림 전송`);

      // 각 대상 사용자에게 알림 생성
      const notifications = [];
      for (const user of targetUsers) {
        const notification = await storage.createNotification({
          userId: user.id,
          title,
          content,
          type,
          priority,
          isRead: false,
        });
        notifications.push(notification);
      }

      res.json({
        success: true,
        message: `${notifications.length}명의 사용자에게 알림을 전송했습니다.`,
        count: notifications.length,
        targetGroup,
      });
    } catch (error) {
      console.error("Error creating notifications:", error);
      res.status(500).json({
        success: false,
        error: "알림 전송 중 오류가 발생했습니다.",
      });
    }
  });

  // 관리자 알림 통계 조회 API
  app.get(
    "/api/admin/notifications/stats",
    async (req: Request, res: Response) => {
      try {
        const allNotifications = await storage.getAllNotifications();

        // 오늘 전송된 알림
        const today = new Date().toISOString().split("T")[0];
        const todayNotifications = allNotifications.filter(
          n => n.createdAt && n.createdAt.toISOString().split("T")[0] === today
        );

        // 읽지 않은 알림
        const unreadNotifications = allNotifications.filter(n => !n.isRead);

        // 알림 타입별 통계
        const typeStats = allNotifications.reduce(
          (acc, notification) => {
            const type = notification.type || "system";
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        // 최근 알림
        const recentNotifications = allNotifications
          .sort(
            (a, b) =>
              (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
          )
          .slice(0, 5);

        res.json({
          totalNotifications: allNotifications.length,
          todayNotifications: todayNotifications.length,
          unreadNotifications: unreadNotifications.length,
          typeStats,
          recentNotifications,
        });
      } catch (error) {
        console.error("Error fetching notification stats:", error);
        res.status(500).json({
          success: false,
          error: "알림 통계 조회 중 오류가 발생했습니다.",
        });
      }
    }
  );

  // Generate weekly report
  app.post(
    "/api/admin/generate-weekly-report",
    async (req: Request, res: Response) => {
      try {
        // 지난 7일간의 데이터를 수집
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);

        // 데이터 수집
        const weeklyData = await storage.getWeeklyReportData(
          startDate,
          endDate
        );

        // GPT를 사용하여 리포트 생성
        const reportData = {
          weekStart: startDate.toISOString().split("T")[0],
          weekEnd: endDate.toISOString().split("T")[0],
          reportData: weeklyData,
          generatedReport: "", // GPT로 생성될 예정
          status: "generating",
        };

        // OpenAI API를 사용하여 리포트 분석 생성
        const openai = new (await import("openai")).default({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const prompt = `
다음은 지난 1주일간 멘탈튠튠 서비스의 사용자 피드백 및 주요 지표 데이터입니다:

**탈퇴 사유:**
${weeklyData.withdrawalReasons.map(r => `- ${r.reason}: ${r.count}건`).join("\n")}

**사용 후기:**
평균 평점: ${weeklyData.userReviews.length > 0 ? (weeklyData.userReviews.reduce((sum, r) => sum + r.rating, 0) / weeklyData.userReviews.length).toFixed(1) : "N/A"}
최근 리뷰: ${weeklyData.userReviews
          .slice(0, 3)
          .map(r => `"${r.content}" (${r.rating}점)`)
          .join(", ")}

**신규 가입/이탈 수치:**
- 신규 가입: ${weeklyData.signupMetrics.signups}명
- 탈퇴: ${weeklyData.signupMetrics.withdrawals}명
- 리텐션율: ${weeklyData.signupMetrics.retention}%

**매출 흐름:**
- 주간 매출: ${weeklyData.revenueFlow.revenue.toLocaleString()}원
- 신규 구독: ${weeklyData.revenueFlow.subscriptions}건
- 해지율: ${weeklyData.revenueFlow.churn}%

**성비 및 연령 통계:**
- 성별: 남성 ${weeklyData.demographics.gender.male}명, 여성 ${weeklyData.demographics.gender.female}명
- 연령대: ${Object.entries(weeklyData.demographics.age)
          .map(([age, count]) => `${age}: ${count}명`)
          .join(", ")}

위 데이터를 바탕으로 다음 형식의 마크다운 리포트를 작성해주세요:

# 📅 [주간 서비스 리포트] (${startDate.toLocaleDateString("ko-KR")} ~ ${endDate.toLocaleDateString("ko-KR")})

## 1. 핵심 문제 요약 🔻
- 주요 탈퇴 사유 분석
- 이탈 증가 패턴 
- 재방문 의사 응답률

## 2. 사용자 행동 인사이트 👤
- 신규 가입 트렌드 분석
- 이탈 사용자 패턴
- 유입 채널 효과성

## 3. UX 개선 포인트 🛠
- 사용자 피드백 기반 개선사항
- UI/UX 관련 이슈 분석

## 4. 사업 구조 확장 전략 💼
- 🔄 기능 확장 제안
- 🧩 타겟 확장 방안
- 📱 채널 다각화 전략

## 5. 운영 우선순위 🚀
1. 단기 개선사항 (1-2주)
2. 중기 전략과제 (1개월)
3. 장기 성장동력 (3개월)

구체적이고 실행 가능한 인사이트와 개선방안을 제시해주세요.
      `;

        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        });

        const generatedReport =
          response.choices[0].message.content || "리포트 생성 실패";

        // 데이터베이스에 저장
        const weeklyReport = await storage.createWeeklyReport({
          ...reportData,
          generatedReport,
          status: "generated",
        });

        res.json({
          success: true,
          reportId: weeklyReport.id,
          report: generatedReport,
          data: weeklyData,
        });
      } catch (error: any) {
        console.error("Failed to generate weekly report:", error);
        res.status(500).json({ message: "주간 리포트 생성에 실패했습니다." });
      }
    }
  );

  // Get weekly reports
  app.get("/api/admin/weekly-reports", async (req: Request, res: Response) => {
    try {
      const reports = await storage.getWeeklyReports();
      res.json(reports);
    } catch (error: any) {
      console.error("Failed to get weekly reports:", error);
      res.status(500).json({ message: "주간 리포트 조회에 실패했습니다." });
    }
  });

  // Get specific weekly report
  app.get(
    "/api/admin/weekly-reports/:id",
    async (req: Request, res: Response) => {
      try {
        const reportId = parseInt(req.params.id);
        const report = await storage.getWeeklyReport(reportId);
        if (!report) {
          return res
            .status(404)
            .json({ message: "리포트를 찾을 수 없습니다." });
        }
        res.json(report);
      } catch (error: any) {
        console.error("Failed to get weekly report:", error);
        res.status(500).json({ message: "주간 리포트 조회에 실패했습니다." });
      }
    }
  );

  // Set admin session endpoint for temporary admin access
  app.post("/api/admin/set-session", async (req, res) => {
    try {
      const { adminId } = req.body;

      // 메인 관리자만 허용
      if (adminId !== "admin7447") {
        return res.status(403).json({
          success: false,
          message: "메인 관리자만 접근할 수 있습니다",
        });
      }

      // Express 세션에 관리자 정보 저장
      req.session.adminId = adminId;
      req.session.isAdmin = true;
      req.session.adminTimestamp = Date.now();

      // AdminSessionManager에도 설정 (백업용)
      adminSessionManager.setSession(adminId, 7);

      // 세션 강제 저장
      req.session.save((err: any) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "세션 저장 실패",
          });
        }

        res.json({
          success: true,
          message: "관리자 세션이 설정되었습니다",
          adminId: adminId,
        });
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "세션 설정 실패",
      });
    }
  });

  // Admin authentication middleware
  const checkAdminAuth = (req: any, res: any, next: any) => {
    try {
      // 1순위: Express 세션에서 관리자 확인
      if (req.session?.adminId === "admin7447" && req.session?.isAdmin) {
        // 24시간 유효성 검사
        const isValid =
          req.session.adminTimestamp &&
          Date.now() - req.session.adminTimestamp < 24 * 60 * 60 * 1000;

        if (isValid) {
          return next();
        } else {
          // 만료된 세션 정리
          delete req.session.adminId;
          delete req.session.isAdmin;
          delete req.session.adminTimestamp;
        }
      }

      // 2순위: 세션 매니저 확인
      const currentSession = adminSessionManager.getSession();
      if (currentSession && adminSessionManager.isValidSession()) {
        return next();
      }

      // 3순위: 사용자 ID 7 (관리자) 확인
      if (
        req.user?.id === 7 ||
        req.session?.userId === 7 ||
        req.session?.admin
      ) {
        return next();
      }

      return res.status(401).json({
        success: false,
        message: "관리자 권한이 필요합니다",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "인증 확인 중 오류가 발생했습니다",
      });
    }
  };

  // 관리자 계정 관리 API
  app.get("/api/admin/admin-accounts", checkAdminAuth, async (req, res) => {
    try {
      const admins = await storage.getAllAdmins();
      res.json(admins);
    } catch (error) {
      console.error("Error fetching admin accounts:", error);
      res.status(500).json({ message: "관리자 계정 조회 실패" });
    }
  });

  app.post("/api/admin/admin-accounts", checkAdminAuth, async (req, res) => {
    try {
      const { adminId, password, name, role } = req.body;

      if (!adminId || !password || !name) {
        return res.status(400).json({ message: "필수 필드가 누락되었습니다" });
      }

      const admin = await storage.createAdmin({
        adminId,
        password,
        name,
        role: role || "sub_admin",
      });

      res.json(admin);
    } catch (error) {
      console.error("Error creating admin account:", error);
      res.status(500).json({ message: "관리자 계정 생성 실패" });
    }
  });

  app.put(
    "/api/admin/admin-accounts/:adminId",
    checkAdminAuth,
    async (req, res) => {
      try {
        const { adminId } = req.params;
        const { password, name } = req.body;

        const updateData: any = {};
        if (password) updateData.password = password;
        if (name) updateData.name = name;

        const admin = await storage.updateAdmin(adminId, updateData);
        res.json(admin);
      } catch (error) {
        console.error("Error updating admin account:", error);
        res.status(500).json({ message: "관리자 계정 수정 실패" });
      }
    }
  );

  app.delete(
    "/api/admin/admin-accounts/:adminId",
    checkAdminAuth,
    async (req, res) => {
      try {
        const { adminId } = req.params;

        if (adminId === "admin7447") {
          return res
            .status(403)
            .json({ message: "메인 관리자는 삭제할 수 없습니다" });
        }

        await storage.deleteAdmin(adminId);
        res.json({ message: "관리자 계정이 삭제되었습니다" });
      } catch (error) {
        console.error("Error deleting admin account:", error);
        res.status(500).json({ message: "관리자 계정 삭제 실패" });
      }
    }
  );

  app.get(
    "/api/admin/admin-permissions/:adminId",
    checkAdminAuth,
    async (req, res) => {
      try {
        const { adminId } = req.params;
        const permissions = await storage.getAdminPermissions(adminId);
        res.json(permissions);
      } catch (error) {
        console.error("Error fetching admin permissions:", error);
        res.status(500).json({ message: "권한 조회 실패" });
      }
    }
  );

  app.put(
    "/api/admin/admin-permissions/:adminId",
    checkAdminAuth,
    async (req, res) => {
      try {
        const { adminId } = req.params;
        const { permissions } = req.body;

        await storage.updateAdminPermissions(adminId, permissions);
        res.json({ message: "권한이 업데이트되었습니다" });
      } catch (error) {
        console.error("Error updating admin permissions:", error);
        res.status(500).json({ message: "권한 업데이트 실패" });
      }
    }
  );

  // 백업 시스템 API
  app.get("/api/admin/backup/status", async (req: Request, res: Response) => {
    try {
      const backupService = await import("./services/backupService");
      const status = await backupService.default.getBackupHistory();
      res.json(status);
    } catch (error) {
      console.error("백업 상태 조회 실패:", error);
      res.status(500).json({ error: "백업 상태 조회 중 오류가 발생했습니다." });
    }
  });

  app.get("/api/admin/backup/logs", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const backupService = await import("./services/backupService");
      const logs = await backupService.default.getBackupHistory(limit);
      res.json(logs);
    } catch (error) {
      console.error("백업 로그 조회 실패:", error);
      res.status(500).json({ error: "백업 로그 조회 중 오류가 발생했습니다." });
    }
  });

  app.get(
    "/api/admin/backup/statistics",
    async (req: Request, res: Response) => {
      try {
        const days = parseInt(req.query.days as string) || 7;
        const backupService = await import("./services/backupService");
        const stats =
          await backupService.default.getBackupHistory(days);
        res.json(stats);
      } catch (error) {
        console.error("백업 통계 조회 실패:", error);
        res
          .status(500)
          .json({ error: "백업 통계 조회 중 오류가 발생했습니다." });
      }
    }
  );

  app.post("/api/admin/backup/trigger", async (req: Request, res: Response) => {
    try {
      const backupService = await import("./services/backupService");
      const result = await backupService.default.createBackup();
      res.json(result);
    } catch (error) {
      console.error("수동 백업 실행 실패:", error);
      res.status(500).json({ error: "수동 백업 실행 중 오류가 발생했습니다." });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
