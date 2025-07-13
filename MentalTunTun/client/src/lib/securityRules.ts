// Firebase Security Rules Configuration
export const firestoreSecurityRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 프로필 (UID 기반 접근 제어)
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      allow create: if request.auth != null && request.auth.uid == uid;
    }
    
    // 감정 기록 (UID 기반 접근 제어)
    match /emotion_logs/{uid}/entries/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      allow create: if request.auth != null && request.auth.uid == uid;
    }
    
    // AI 상담 세션 (UID 기반 접근 제어)
    match /ai_sessions/{uid}/sessions/{sessionId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      allow create: if request.auth != null && request.auth.uid == uid;
    }
    
    // 자아 탐색 기록 (UID 기반 접근 제어)
    match /identity_exploration/{uid}/steps/{stepId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      allow create: if request.auth != null && request.auth.uid == uid;
    }
    
    // 캘린더 요약 (UID 기반 접근 제어)
    match /calendar_summary/{uid}/months/{monthId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      allow create: if request.auth != null && request.auth.uid == uid;
    }
    
    // 모든 다른 문서는 접근 금지
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
`;

// API 보안 검증 함수들
export const validateApiRequest = (req: any) => {
  // API 요청 검증 로직
  const requiredHeaders = ["content-type"];
  const missingHeaders = requiredHeaders.filter(header => !req.headers[header]);

  if (missingHeaders.length > 0) {
    throw new Error(`필수 헤더 누락: ${missingHeaders.join(", ")}`);
  }

  return true;
};

export const sanitizeUserInput = (input: string): string => {
  // 사용자 입력 정제
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // 스크립트 태그 제거
    .replace(/[<>]/g, "") // HTML 태그 방지
    .trim();
};

export const validateUID = (uid: string): boolean => {
  // Firebase UID 형식 검증
  const uidPattern = /^[a-zA-Z0-9]{28}$/;
  return uidPattern.test(uid);
};

// 환경 변수 검증
export const validateEnvironmentVariables = () => {
  const requiredEnvVars = [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_APP_ID",
  ];

  const missingVars = requiredEnvVars.filter(
    envVar => !import.meta.env[envVar]
  );

  if (missingVars.length > 0) {
    console.warn("누락된 환경 변수:", missingVars);
    return false;
  }

  return true;
};

// HTTPS 강제 적용 (프로덕션 환경)
export const enforceHTTPS = () => {
  if (
    typeof window !== "undefined" &&
    window.location.protocol !== "https:" &&
    window.location.hostname !== "localhost"
  ) {
    window.location.protocol = "https:";
  }
};
