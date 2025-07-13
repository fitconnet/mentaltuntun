// 🧠 멘탈튼튼 - 페이지 컴포넌트 배럴 exports
// 
// 📁 App.tsx에서 import를 깔끔하게 관리하기 위한 중앙 집중식 export
// ⚡ 리팩터링: import 구조 개선으로 가독성 향상

// 인증 관련
export { default as LoginPage } from "./login";

// 메인 페이지들
export { default as HomePage } from "./home";
export { default as DashboardPage } from "./dashboard";
export { default as ProfilePage } from "./profile";

// 성격 분석 관련
export { default as PersonalityPage } from "./personality";
export { default as PersonalityOverviewPage } from "./personality-overview";
export { default as PersonalityCategoryPage } from "./personality-category";
export { default as PersonalityDetailPage } from "./personality-detail";
export { default as RealtimeAnalysisPage } from "./realtime-analysis";

// 감정 및 상담
export { default as EmotionsPage } from "./emotions";
export { default as CounselingPage } from "./counseling";
export { default as SchedulePage } from "./schedule";

// 자기계발 및 테스트
export { default as SelfDiscoveryPage } from "./self-discovery";
export { default as PsychologicalTestsPage } from "./psychological-tests";
export { default as PsychologicalTestDetailPage } from "./psychological-test-detail";
export { default as ContentPage } from "./content";

// 구독 및 지원
export { default as SubscriptionPage } from "./subscription";
export { default as SubscriptionPremiumPage } from "./subscription-premium";
export { default as SupportPage } from "./support";

// 설정 및 관리
export { default as SettingsPage } from "./settings";
export { default as AdminPage } from "./admin";

// 개발/테스트
export { default as FirebaseTestPage } from "./firebase-test";

// 법적 페이지
export { default as PrivacyPolicyPage } from "./privacy-policy";
export { default as TermsOfServicePage } from "./terms-of-service";

// OAuth 동의 화면
export { default as NaverConsentPage } from "./oauth/naver-consent";
export { default as GoogleConsentPage } from "./oauth/google-consent";
export { default as KakaoConsentPage } from "./oauth/kakao-consent";

// 예시/데모 페이지
export { default as PhoneUsagePage } from "./phone-usage";

// 기타
export { default as NotFound } from "./not-found"; 