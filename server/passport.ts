import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";

// Use require for untyped modules to avoid TypeScript errors
const KakaoStrategy: any = require("passport-kakao").Strategy;
const NaverStrategy: any = require("passport-naver").Strategy;

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn(
    "Google OAuth credentials not found. Google login will be disabled."
  );
} else {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          // Google 프로필에서 이메일 정보 추출
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(
              new Error("Google 계정에서 이메일을 가져올 수 없습니다.")
            );
          }

          // 기존 사용자 확인
          let user = await storage.getUserByEmail(email);

          if (user) {
            // 기존 사용자인 경우 로그인
            return done(null, user);
          } else {
            // 새 사용자인 경우 계정 생성
            const newUser = await storage.createUser({
              uid: profile.id,
              email,
              name: profile.displayName || "Google 사용자",
              provider: "google",
              interests: [],
              personality: {},
              profileComplete: false,
            });
            return done(null, newUser);
          }
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

// Kakao OAuth Strategy
if (!process.env.KAKAO_CLIENT_ID || !process.env.KAKAO_CLIENT_SECRET) {
  console.warn(
    "Kakao OAuth credentials not found. Kakao login will be disabled."
  );
} else {
  passport.use(
    new KakaoStrategy(
      {
        clientID: process.env.KAKAO_CLIENT_ID,
        clientSecret: process.env.KAKAO_CLIENT_SECRET,
        callbackURL: "/api/auth/kakao/callback",
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          // Kakao 프로필에서 이메일 정보 추출
          const email = profile._json?.kakao_account?.email;
          const nickname =
            profile._json?.properties?.nickname || profile.displayName;

          if (!email) {
            return done(
              new Error(
                "카카오 계정에서 이메일을 가져올 수 없습니다. 이메일 제공 동의가 필요합니다."
              )
            );
          }

          // 기존 사용자 확인
          let user = await storage.getUserByEmail(email);

          if (user) {
            // 기존 사용자인 경우 로그인
            return done(null, user);
          } else {
            // 새 사용자인 경우 계정 생성
            const newUser = await storage.createUser({
              uid: profile.id,
              email,
              name: nickname || "카카오 사용자",
              provider: "kakao",
              interests: [],
              personality: {},
              profileComplete: false,
            });
            return done(null, newUser);
          }
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

// Naver OAuth Strategy
if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
  console.warn(
    "Naver OAuth credentials not found. Naver login will be disabled."
  );
} else {
  passport.use(
    new NaverStrategy(
      {
        clientID: process.env.NAVER_CLIENT_ID,
        clientSecret: process.env.NAVER_CLIENT_SECRET,
        callbackURL: "/api/auth/naver/callback",
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          // Naver 프로필에서 정보 추출
          const email = profile.emails?.[0]?.value || profile._json?.email;
          const name =
            profile.displayName ||
            profile._json?.nickname ||
            profile._json?.name;

          if (!email) {
            return done(
              new Error(
                "네이버 계정에서 이메일을 가져올 수 없습니다. 이메일 제공 동의가 필요합니다."
              )
            );
          }

          // 기존 사용자 확인
          let user = await storage.getUserByEmail(email);

          if (user) {
            // 기존 사용자인 경우 로그인
            return done(null, user);
          } else {
            // 새 사용자인 경우 계정 생성
            const newUser = await storage.createUser({
              uid: profile.id,
              email,
              name: name || "네이버 사용자",
              provider: "naver",
              interests: [],
              personality: {},
              profileComplete: false,
            });
            return done(null, newUser);
          }
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
