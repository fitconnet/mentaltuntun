import admin from "firebase-admin";

// Firebase Admin SDK 초기화
let firebaseInitialized = false;

if (!admin.apps.length) {
  try {
    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
      firebaseInitialized = true;
      console.log("✅ Firebase Admin SDK 초기화 완료");
    } else {
      console.warn("⚠️  Firebase 환경변수가 누락되었습니다. Firebase 기능이 비활성화됩니다.");
      console.warn("⚠️  Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY");
      firebaseInitialized = false;
    }
  } catch (error) {
    console.error("❌ Firebase Admin SDK 초기화 실패:", error);
    firebaseInitialized = false;
  }
}

export { admin };
export default admin;
export { firebaseInitialized };

// 안전한 export 확인
// Firebase Admin SDK 상태 확인 (로그 제거)

// Firebase ID 토큰 검증
export const verifyFirebaseToken = async (idToken: string) => {
  if (!firebaseInitialized) {
    console.warn("⚠️  Firebase not initialized, skipping token verification");
    throw new Error("Firebase not initialized");
  }
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error("Firebase 토큰 검증 실패:", error);
    throw new Error("Invalid Firebase token");
  }
};

// 관리자 권한 확인
export const verifyAdminAccess = async (
  email: string | undefined
): Promise<boolean> => {
  if (!email) return false;

  // 관리자 이메일 도메인 확인
  const adminEmails = ["admin7447@gmail.com"];
  const isAdminEmail = adminEmails.includes(email);

  if (isAdminEmail) {
    console.log(`관리자 접근 승인: ${email}`);
    return true;
  }

  return false;
};

// Firebase 인증 미들웨어
export const firebaseAuthMiddleware = async (req: any, res: any, next: any) => {
  if (!firebaseInitialized) {
    console.warn("⚠️  Firebase not initialized, skipping authentication");
    return res.status(503).json({ message: "Firebase authentication not available" });
  }
  
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token required" });
    }

    const idToken = authHeader.substring(7);
    const decodedToken = await verifyFirebaseToken(idToken);

    req.firebaseUser = decodedToken;
    req.uid = decodedToken.uid;
    req.email = decodedToken.email;

    next();
  } catch (error) {
    console.error("Firebase 인증 미들웨어 오류:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// 관리자 전용 미들웨어
export const adminAuthMiddleware = async (req: any, res: any, next: any) => {
  if (!firebaseInitialized) {
    console.warn("⚠️  Firebase not initialized, skipping admin authentication");
    return res.status(503).json({ message: "Admin authentication not available" });
  }
  
  try {
    await firebaseAuthMiddleware(req, res, async () => {
      const isAdmin = await verifyAdminAccess(req.email);

      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      req.isAdmin = true;
      next();
    });
  } catch (error) {
    console.error("관리자 인증 미들웨어 오류:", error);
    return res.status(403).json({ message: "Admin authentication failed" });
  }
};
