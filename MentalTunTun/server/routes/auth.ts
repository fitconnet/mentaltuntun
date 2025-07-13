// 🧠 멘탈튼튼 - 인증 관련 라우터 (리팩터링)
//
// 📁 routes.ts에서 분리된 인증 관련 엔드포인트들
// ⚡ 기능별 라우터 분리로 코드 유지보수성 향상

import type { Express } from "express";
import passport from "../passport";
import { storage } from "../storage";

export function registerAuthRoutes(app: Express): void {
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
    passport.authenticate("kakao", { scope: ["profile_nickname", "account_email"] })
  );

  app.get(
    "/api/auth/kakao/callback",
    passport.authenticate("kakao", {
      failureRedirect: "/login?error=kakao_auth_failed",
    }),
    (req, res) => {
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
    passport.authenticate("naver", { scope: ["profile"] })
  );

  app.get(
    "/api/auth/naver/callback",
    passport.authenticate("naver", {
      failureRedirect: "/login?error=naver_auth_failed",
    }),
    (req, res) => {
      const user = req.user as any;
      if (!user.profileCompleted) {
        res.redirect("/profile");
      } else {
        res.redirect("/");
      }
    }
  );

  // Logout
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "로그아웃 중 오류가 발생했습니다" });
      }
      res.json({ message: "로그아웃되었습니다" });
    });
  });
} 