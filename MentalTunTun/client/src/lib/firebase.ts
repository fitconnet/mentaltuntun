import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  getAdditionalUserInfo,
  User as FirebaseUser,
  signInWithCustomToken,
} from "firebase/auth";

// 전역 타입 선언
declare global {
  interface Window {
    Kakao: {
      init: (key: string) => void;
      Auth: {
        login: (options: {
          success: (authObj: {
            access_token: string;
            refresh_token: string;
          }) => void;
          fail: (error: any) => void;
        }) => void;
      };
    };
    naver: {
      LoginWithNaverId: new (options: {
        clientId: string;
        callbackUrl: string;
        isPopup: boolean;
        loginButton: { color: string; type: number; height: number };
      }) => {
        getLoginStatus: (callback: (status: boolean) => void) => void;
        init: () => void;
        accessToken: { accessToken: string };
      };
    };
  }
}

// Firebase configuration with fallback values for development
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "development-key",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "mentaltuntun"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mentaltuntun",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "mentaltuntun"}.appspot.com`,
  messagingSenderId: "489949568314",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "development-app-id",
};

// Firebase 설정 검증 로그
console.log("Firebase 설정 확인:", {
  apiKey: firebaseConfig.apiKey?.includes("development")
    ? "⚠️ 개발모드"
    : "✅ 설정됨",
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId?.includes("development")
    ? "⚠️ 개발모드"
    : "✅ 설정됨",
});

// Initialize Firebase with error handling
let app: any = null;
let db: any = null;
let auth: any = null;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  console.log("✅ Firebase 초기화 성공");
} catch (error) {
  console.warn("⚠️ Firebase 초기화 실패, 오프라인 모드로 실행:", error);
  // 오프라인 모드에서는 null 값으로 설정
  app = null;
  db = null;
  auth = null;
}

export { db, auth };

// Firebase 사용자 인증 관리 (자동 로그인 지원)
export const initializeFirebaseAuth = () => {
  return new Promise<FirebaseUser | null>(resolve => {
    if (!auth) {
      console.warn("🔇 Firebase Auth 미사용 - 인증 초기화 오류");
      resolve(null);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, user => {
        if (user) {
          // 로그인 성공 시 uid를 localStorage에 저장
          localStorage.setItem("uid", user.uid);
          localStorage.setItem(
            "user",
            JSON.stringify({
              uid: user.uid,
              email: user.email,
              name: user.displayName || user.email?.split("@")[0] || "사용자",
            })
          );
        } else {
          // 로그아웃 시 localStorage 정리
          localStorage.removeItem("uid");
          localStorage.removeItem("user");
        }
        resolve(user);
        unsubscribe();
      });
    } catch (error) {
      console.error("인증 초기화 오류:", error);
      resolve(null);
    }
  });
};

// 지속적인 인증 상태 모니터링
export const monitorAuthState = (
  callback: (user: FirebaseUser | null) => void
) => {
  if (!auth) {
    console.warn("🔇 Firebase Auth 미사용 - 상태 모니터링 건너뜀");
    callback(null);
    return () => {}; // 빈 unsubscribe 함수 반환
  }

  try {
    return onAuthStateChanged(auth, user => {
      if (user) {
        localStorage.setItem("uid", user.uid);
        localStorage.setItem(
          "user",
          JSON.stringify({
            uid: user.uid,
            email: user.email,
            name: user.displayName || user.email?.split("@")[0] || "사용자",
          })
        );
      } else {
        localStorage.removeItem("uid");
        localStorage.removeItem("user");
      }
      callback(user);
    });
  } catch (error) {
    console.error("인증 상태 모니터링 오류:", error);
    callback(null);
    return () => {};
  }
};

// Firebase 이메일 로그인
export const loginWithEmailPassword = async (
  email: string,
  password: string
): Promise<FirebaseUser | null> => {
  if (!auth) {
    console.warn("🔇 Firebase Auth 미사용 - 이메일 로그인 건너뜀");
    return null;
  }
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("이메일 로그인 오류:", error);
    throw error;
  }
};

// Firebase 이메일 회원가입
export const registerWithEmailPassword = async (
  email: string,
  password: string
): Promise<FirebaseUser | null> => {
  if (!auth) {
    console.warn("🔇 Firebase Auth 미사용 - 이메일 회원가입 건너뜀");
    return null;
  }
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("이메일 회원가입 오류:", error);
    throw error;
  }
};

// Firebase 로그아웃 (완전한 정리)
export const firebaseSignOut = async (): Promise<void> => {
  // Firebase 로그아웃
  if (auth) {
    try {
      await signOut(auth);
    } catch (error) {
      console.warn("Firebase 로그아웃 실패:", error);
    }
  }

  // localStorage 완전 정리
  localStorage.removeItem("uid");
  localStorage.removeItem("user");
  localStorage.removeItem("autoLogin");
  localStorage.removeItem("loginCredentials");

  // 세션 정리
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch (error) {
    console.warn("서버 세션 정리 실패:", error);
  }
};

// 현재 Firebase 사용자 UID 가져오기
export const getCurrentUserUID = (): string | null => {
  if (!auth) return null;
  return auth.currentUser?.uid || null;
};

// Google 로그인 (향상된 오류 처리 및 설정 확인)
export const loginWithGoogle = async (): Promise<{
  user: FirebaseUser;
  isNewUser: boolean;
}> => {
  try {
    // Firebase 설정 재확인
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      throw new Error(
        "Firebase 설정이 완료되지 않았습니다. 환경 변수를 확인해주세요."
      );
    }

    console.log("구글 로그인 시도 중...");
    console.log("Firebase Auth 도메인:", firebaseConfig.authDomain);

    const provider = new GoogleAuthProvider();
    provider.addScope("email");
    provider.addScope("profile");

    // 팝업 설정 개선
    provider.setCustomParameters({
      prompt: "select_account",
    });

    const result = await signInWithPopup(auth, provider);

    if (!result.user) {
      throw new Error("로그인 결과에 사용자 정보가 없습니다");
    }

    const isNewUser = getAdditionalUserInfo(result)?.isNewUser || false;

    // ID 토큰 저장
    const idToken = await result.user.getIdToken();
    localStorage.setItem("firebaseToken", idToken);
    localStorage.setItem("uid", result.user.uid);
    localStorage.setItem(
      "user",
      JSON.stringify({
        uid: result.user.uid,
        email: result.user.email,
        name:
          result.user.displayName ||
          result.user.email?.split("@")[0] ||
          "사용자",
      })
    );

    console.log("✅ 구글 로그인 성공:", result.user.email);
    return { user: result.user, isNewUser };
  } catch (error: any) {
    console.error("❌ 구글 로그인 상세 오류:", error);

    if (error.code === "auth/configuration-not-found") {
      throw new Error(
        "Firebase 프로젝트 설정을 찾을 수 없습니다. Firebase 콘솔에서 Google 인증을 활성화해주세요."
      );
    } else if (error.code === "auth/popup-closed-by-user") {
      throw new Error("로그인 팝업이 사용자에 의해 닫혔습니다");
    } else if (error.code === "auth/popup-blocked") {
      throw new Error(
        "팝업이 브라우저에 의해 차단되었습니다. 팝업 차단을 해제해주세요."
      );
    } else if (error.code === "auth/cancelled-popup-request") {
      throw new Error("이전 팝업 요청이 취소되었습니다");
    } else if (error.code === "auth/operation-not-allowed") {
      throw new Error("구글 로그인이 Firebase 콘솔에서 비활성화되어 있습니다.");
    } else if (error.code === "auth/unauthorized-domain") {
      throw new Error(
        "현재 도메인이 Firebase에서 승인되지 않았습니다. Firebase 콘솔에서 승인된 도메인을 확인해주세요."
      );
    }

    throw error;
  }
};

// 현재 사용자의 ID 토큰 가져오기
export const getCurrentUserToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) {
    return localStorage.getItem("firebaseToken");
  }

  try {
    const token = await user.getIdToken(true); // 강제 갱신
    localStorage.setItem("firebaseToken", token);
    return token;
  } catch (error) {
    console.error("토큰 가져오기 실패:", error);
    return null;
  }
};

// Kakao 로그인 (Custom Token 방식)
export const loginWithKakao = async (): Promise<{
  user: FirebaseUser;
  isNewUser: boolean;
}> => {
  return new Promise((resolve, reject) => {
    // Kakao SDK가 로드되지 않은 경우
    if (typeof window === "undefined" || !window.Kakao) {
      reject(
        new Error("Kakao SDK가 로드되지 않았습니다. 페이지를 새로고침해주세요.")
      );
      return;
    }

    // Kakao SDK 초기화 확인
    if (!window.Kakao.isInitialized()) {
      const kakaoKey = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY;
      if (!kakaoKey) {
        reject(
          new Error(
            "Kakao JavaScript 키가 설정되지 않았습니다. VITE_KAKAO_JAVASCRIPT_KEY 환경변수를 설정해주세요."
          )
        );
        return;
      }
      window.Kakao.init(kakaoKey);
      console.log("✅ Kakao SDK 초기화 완료");
    }

    window.Kakao.Auth.login({
      success: async (authObj: any) => {
        try {
          console.log("Kakao 로그인 성공, 토큰 교환 중...");

          // 서버에서 Firebase Custom Token 생성
          const response = await fetch("/api/firebase-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider: "kakao",
              token: authObj.access_token,
            }),
          });

          if (!response.ok) {
            throw new Error("Firebase 토큰 생성 실패");
          }

          const { firebaseToken, userInfo } = await response.json();

          // Firebase Custom Token으로 로그인
          const userCredential = await signInWithCustomToken(
            auth,
            firebaseToken
          );

          // 사용자 정보 저장
          localStorage.setItem(
            "firebaseToken",
            await userCredential.user.getIdToken()
          );
          localStorage.setItem("uid", userCredential.user.uid);

          // displayName 설정
          const displayName =
            userInfo.name || userInfo.nickname || "카카오 사용자";
          localStorage.setItem(
            "user",
            JSON.stringify({
              uid: userCredential.user.uid,
              email: userInfo.email,
              name: displayName,
              provider: "kakao",
            })
          );

          console.log("✅ Kakao Firebase 로그인 성공:", userInfo.email);
          resolve({ user: userCredential.user, isNewUser: false });
        } catch (error) {
          console.error("❌ Kakao Firebase 토큰 교환 실패:", error);
          reject(error);
        }
      },
      fail: (err: any) => {
        console.error("❌ Kakao 로그인 실패:", err);
        reject(new Error("카카오 로그인에 실패했습니다."));
      },
    });
  });
};

// Naver 로그인 (Custom Token 방식)
export const loginWithNaver = async (): Promise<{
  user: FirebaseUser;
  isNewUser: boolean;
}> => {
  return new Promise((resolve, reject) => {
    // Naver SDK가 로드되지 않은 경우
    if (typeof window === "undefined" || !window.naver) {
      reject(
        new Error("Naver SDK가 로드되지 않았습니다. 페이지를 새로고침해주세요.")
      );
      return;
    }

    const naverLogin = new window.naver.LoginWithNaverId({
      clientId: import.meta.env.VITE_NAVER_CLIENT_ID,
      callbackUrl: window.location.origin + "/login",
      isPopup: true,
      loginButton: { color: "green", type: 3, height: 58 },
    });

    naverLogin.getLoginStatus(async (status: boolean) => {
      if (status) {
        try {
          console.log("Naver 로그인 성공, 토큰 교환 중...");

          // 서버에서 Firebase Custom Token 생성
          const response = await fetch("/api/firebase-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider: "naver",
              token: naverLogin.accessToken.accessToken,
            }),
          });

          if (!response.ok) {
            throw new Error("Firebase 토큰 생성 실패");
          }

          const { firebaseToken, userInfo } = await response.json();

          // Firebase Custom Token으로 로그인
          const userCredential = await signInWithCustomToken(
            auth,
            firebaseToken
          );

          // 사용자 정보 저장
          localStorage.setItem(
            "firebaseToken",
            await userCredential.user.getIdToken()
          );
          localStorage.setItem("uid", userCredential.user.uid);
          localStorage.setItem("user", JSON.stringify(userInfo));

          console.log("✅ Naver Firebase 로그인 성공:", userInfo.email);
          resolve({ user: userCredential.user, isNewUser: false });
        } catch (error) {
          console.error("❌ Naver Firebase 토큰 교환 실패:", error);
          reject(error);
        }
      } else {
        reject(new Error("네이버 로그인에 실패했습니다."));
      }
    });

    naverLogin.init();
  });
};

// Firebase Custom Claims를 통한 관리자 권한 확인
export const checkAdminRole = async (): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    const idTokenResult = await user.getIdTokenResult();
    return !!idTokenResult.claims.admin;
  } catch (error) {
    console.error("관리자 권한 확인 오류:", error);
    return false;
  }
};

// 관리자 이메일 도메인 체크 (Firebase Claims 대안)
export const isAdminEmail = (email: string): boolean => {
  const adminDomains = ["admin.mentaltuneup.com", "dev.mentaltuneup.com"];
  const adminEmails = ["admin7447@gmail.com", "developer@mentaltuneup.com"];

  return (
    adminEmails.includes(email) ||
    adminDomains.some(domain => email.endsWith(`@${domain}`))
  );
};

// Firebase 관리자 로그인 체크
export const verifyAdminAccess = async (): Promise<{
  isAdmin: boolean;
  user: any;
}> => {
  try {
    const user = auth.currentUser;
    if (!user) return { isAdmin: false, user: null };

    // 먼저 Custom Claims 확인
    const hasAdminClaim = await checkAdminRole();
    if (hasAdminClaim) {
      return { isAdmin: true, user };
    }

    // Claims가 없으면 이메일 도메인 확인
    const isAdminByEmail = isAdminEmail(user.email || "");

    return {
      isAdmin: isAdminByEmail,
      user: isAdminByEmail ? user : null,
    };
  } catch (error) {
    console.error("관리자 권한 확인 실패:", error);
    return { isAdmin: false, user: null };
  }
};

// 감정 기록 인터페이스 (Firebase uid 기준)
// 3️⃣ 감정카드 기록 구조 (emotions/{uid}/{yyyy-mm-dd})
export interface FirebaseEmotionRecord {
  date: string; // YYYY-MM-DD
  emotionKeywords: string[];
  note: string;
  score: number; // -1 ~ +1 (GPT 감정 분석)
  createdAt: Timestamp;
}

// AI 상담 세션 인터페이스 (Firebase uid 기준)
// 4️⃣ AI 상담 기록 구조 (chats/{uid}/session_{timestamp})
export interface FirebaseCounselingSession {
  startedAt: Timestamp;
  topic: string;
  persona: string;
  messages: {
    role: "user" | "assistant";
    content: string;
  }[];
  summary: string;
  endedAt?: Timestamp;
}

// 사용자 프로필 인터페이스 (Firebase uid 기준)
// 1️⃣ 사용자 기본 정보 구조 (users/{uid})
export interface FirebaseUserBasic {
  uid: string;
  email: string;
  provider: "kakao" | "naver" | "google" | "email";
  createdAt: Timestamp;
  lastLogin: Timestamp;
  plan: "free" | "premium";
  profileComplete: boolean;
}

// 2️⃣ 사용자 프로필 상세 (users/{uid}/profile)
export interface FirebaseUserProfile {
  name: string;
  birth: string; // YYYY-MM-DD
  gender: "남" | "여" | "기타";
  interests: string[];
  tendencies: string[];
  job: string;
  mbti: string;
  birthTime: string; // HH:MM (사주용)
}

// 자아 탐색 기록 인터페이스
export interface FirebaseIdentityExploration {
  id?: string;
  uid: string;
  step: string; // 탐색 단계
  selectedKeywords: string[];
  responses: string[];
  insights?: string; // AI 분석 결과
  createdAt: Timestamp;
}

// 캘린더 요약 인터페이스
export interface FirebaseCalendarSummary {
  id?: string;
  uid: string;
  month: string; // YYYY-MM
  emotionTrends: Record<string, number>; // 감정별 빈도
  counselingSummaries: string[]; // 상담 요약들
  aiInsights?: string; // AI 분석 인사이트
  updatedAt: Timestamp;
}

// Firestore 컬렉션 참조 (uid 기반 구조)
// Firestore 컬렉션 참조
export const getUserBasicDoc = (uid: string) => doc(db, "users", uid);
export const getUserProfileDoc = (uid: string) =>
  doc(db, `users/${uid}/profile`, "profile");
export const getEmotionDoc = (uid: string, date: string) =>
  doc(db, `emotions/${uid}`, date);
export const getEmotionsCollection = (uid: string) =>
  collection(db, `emotions/${uid}`);
export const getChatSessionDoc = (uid: string, sessionId: string) =>
  doc(db, `chats/${uid}`, sessionId);
export const getChatSessionsCollection = (uid: string) =>
  collection(db, `chats/${uid}`);

// 🔄 사용자 기본 정보 저장 (Firestore + PostgreSQL)
export const saveUserBasic = async (
  basic: Omit<FirebaseUserBasic, "createdAt" | "lastLogin">
): Promise<void> => {
  const uid = getCurrentUserUID();
  if (!uid) throw new Error("사용자가 로그인되지 않았습니다.");

  const userBasicDoc = getUserBasicDoc(uid);
  await setDoc(
    userBasicDoc,
    {
      ...basic,
      lastLogin: serverTimestamp(),
    },
    { merge: true }
  );

  // PostgreSQL에도 저장
  await fetch("/api/saveUserProfile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, ...basic }),
  });
};

// 🔄 사용자 프로필 상세 저장 (Firestore + PostgreSQL)
export const saveUserProfile = async (
  profile: FirebaseUserProfile
): Promise<void> => {
  const uid = getCurrentUserUID();
  if (!uid) throw new Error("사용자가 로그인되지 않았습니다.");

  const userProfileDoc = getUserProfileDoc(uid);
  await setDoc(userProfileDoc, profile);

  // PostgreSQL에도 저장
  await fetch("/api/saveUserProfile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, ...profile }),
  });
};

// 🔄 감정 기록 저장 (Firestore + PostgreSQL)
export const saveEmotionRecord = async (
  emotionKeywords: string[],
  date: string,
  note: string,
  score: number
): Promise<void> => {
  const uid = getCurrentUserUID();
  if (!uid) throw new Error("사용자가 로그인되지 않았습니다.");

  // Firestore에 저장 (emotions/{uid}/{date})
  const emotionDoc = getEmotionDoc(uid, date);
  const emotionRecord: FirebaseEmotionRecord = {
    date,
    emotionKeywords,
    note,
    score,
    createdAt: serverTimestamp() as Timestamp,
  };

  await setDoc(emotionDoc, emotionRecord);

  // PostgreSQL에도 저장
  await fetch("/api/saveEmotionLog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, date, emotions: emotionKeywords, note }),
  });
};

// 감정 기록 조회 (uid 기반)
export const getEmotionsFromFirestore = async (
  limit?: number
): Promise<FirebaseEmotionRecord[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Firebase 인증 필요");

  const q = query(getEmotionLogsCollection(user.uid), orderBy("date", "desc"));

  const querySnapshot = await getDocs(q);
  const emotions = querySnapshot.docs.map(
    doc =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as FirebaseEmotionRecord
  );

  return limit ? emotions.slice(0, limit) : emotions;
};

// 🔄 AI 상담 세션 저장 (Firestore + PostgreSQL)
export const saveCounselingSession = async (
  topic: string,
  persona: string,
  messages: { role: "user" | "assistant"; content: string }[],
  summary: string
): Promise<string> => {
  const uid = getCurrentUserUID();
  if (!uid) throw new Error("사용자가 로그인되지 않았습니다.");

  // 세션 ID 생성 (session_{timestamp})
  const sessionId = `session_${Date.now()}`;

  // Firestore에 저장 (chats/{uid}/session_{timestamp})
  const sessionDoc = getChatSessionDoc(uid, sessionId);
  const sessionData: FirebaseCounselingSession = {
    startedAt: serverTimestamp() as Timestamp,
    topic,
    persona,
    messages,
    summary,
    endedAt: serverTimestamp() as Timestamp,
  };

  await setDoc(sessionDoc, sessionData);

  // PostgreSQL에도 저장
  await fetch("/api/saveAISession", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uid,
      personaType: persona,
      personaName: persona,
      concernKeywords: [topic],
      selectedTones: [],
      messages: messages.map(msg => ({
        ...msg,
        timestamp: new Date().toISOString(),
      })),
      status: "completed",
      summary,
    }),
  });

  return sessionId;
};

// AI 상담 세션 조회
export const getCounselingSessionsFromFirestore = async (): Promise<
  FirebaseCounselingSession[]
> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Firebase 인증 필요");

  const q = query(
    getAISessionsCollection(user.uid),
    orderBy("createdAt", "desc")
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    doc =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as FirebaseCounselingSession
  );
};

// 자아 탐색 단계 저장
export const saveIdentityExplorationStep = async (
  step: string,
  selectedKeywords: string[],
  responses: string[],
  insights?: string
): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Firebase 인증 필요");

  const explorationStep: Omit<FirebaseIdentityExploration, "id"> = {
    uid: user.uid,
    step,
    selectedKeywords,
    responses,
    insights,
    createdAt: Timestamp.now(),
  };

  const docRef = await addDoc(
    getIdentityExplorationCollection(user.uid),
    explorationStep
  );
  return docRef.id;
};

// 캘린더 요약 업데이트
export const updateCalendarSummary = async (
  month: string,
  emotionTrends: Record<string, number>,
  counselingSummaries: string[],
  aiInsights?: string
): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Firebase 인증 필요");

  const summaryRef = doc(getCalendarSummaryCollection(user.uid), month);
  await setDoc(
    summaryRef,
    {
      uid: user.uid,
      month,
      emotionTrends,
      counselingSummaries,
      aiInsights,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
};

// 실시간 감정 기록 리스너 (uid 기반)
export const subscribeToEmotionRecords = (
  callback: (records: FirebaseEmotionRecord[]) => void
): (() => void) | null => {
  const user = auth.currentUser;
  if (!user) return null;

  const q = query(getEmotionLogsCollection(user.uid), orderBy("date", "desc"));

  return onSnapshot(q, querySnapshot => {
    const records = querySnapshot.docs.map(
      doc =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as FirebaseEmotionRecord
    );

    callback(records);
  });
};

// 실시간 상담 세션 리스너
export const subscribeToCounselingSessions = (
  callback: (sessions: FirebaseCounselingSession[]) => void
): (() => void) | null => {
  const user = auth.currentUser;
  if (!user) return null;

  const q = query(
    getAISessionsCollection(user.uid),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, querySnapshot => {
    const sessions = querySnapshot.docs.map(
      doc =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as FirebaseCounselingSession
    );

    callback(sessions);
  });
};

// Firebase 연결 및 인증 상태 확인
export const checkFirebaseConnection = async (): Promise<boolean> => {
  try {
    const user = await initializeFirebaseAuth();
    return !!user;
  } catch (error) {
    console.error("Firebase 연결 실패:", error);
    return false;
  }
};

// PostgreSQL API 호출 함수들 (백엔드 연동)
export const saveEmotionLogAPI = async (emotionData: {
  uid: string;
  emotions: string[];
  date: string;
  note?: string;
}) => {
  const response = await fetch("/api/saveEmotionLog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(emotionData),
  });

  if (!response.ok) {
    throw new Error("PostgreSQL 감정 기록 저장 실패");
  }

  return response.json();
};

export const saveAISessionAPI = async (sessionData: {
  uid: string;
  personaType: string;
  personaName: string;
  concernKeywords: string[];
  selectedTones: string[];
  summary?: string;
}) => {
  const response = await fetch("/api/saveAISession", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sessionData),
  });

  if (!response.ok) {
    throw new Error("PostgreSQL AI 세션 저장 실패");
  }

  return response.json();
};

export const saveUserProfileAPI = async (profileData: {
  uid: string;
  email: string;
  name: string;
  mbti?: string;
  interests: string[];
  personality: Record<string, any>;
  birthDate?: string;
  occupation?: string;
  gender?: string;
  subscriptionType: string;
}) => {
  const response = await fetch("/api/saveUserProfile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    throw new Error("PostgreSQL 사용자 프로필 저장 실패");
  }

  return response.json();
};
