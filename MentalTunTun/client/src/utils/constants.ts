// 🧠 멘탈튼튼 - 클라이언트 상수 (리팩터링)
//
// 📁 클라이언트 전용 상수들을 중앙화하여 관리
// ⚡ 하드코딩된 값들을 상수로 변환하여 유지보수성 향상

// 🎨 UI 애니메이션 지연시간 (ms)
export const ANIMATION_DELAYS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// 📱 로컬 스토리지 키
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'mentalTunTun_userPreferences',
  THEME: 'mentalTunTun_theme',
  LANG: 'mentalTunTun_language',
  RECENT_EMOTIONS: 'mentalTunTun_recentEmotions',
  DRAFT_MESSAGE: 'mentalTunTun_draftMessage',
} as const;

// 🌐 API 엔드포인트 베이스 경로
export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  USERS: '/api/users',
  EMOTIONS: '/api/emotions',
  COUNSELING: '/api/counseling',
  ADMIN: '/api/admin',
  SUBSCRIPTION: '/api/subscription',
} as const;

// 🔔 토스트 메시지 지속시간 (ms)
export const TOAST_DURATION = {
  SHORT: 3000,
  NORMAL: 5000,
  LONG: 8000,
} as const;

// 📊 차트 색상 팔레트
export const CHART_COLORS = {
  PRIMARY: '#3b82f6',
  SECONDARY: '#8b5cf6',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  NEUTRAL: '#6b7280',
} as const;

// 🎭 감정 아이콘 매핑
export const EMOTION_ICONS = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  anxious: '😰',
  excited: '🤩',
  calm: '😌',
  confused: '😕',
  grateful: '🙏',
} as const;

// 📐 반응형 그리드 설정
export const GRID_SETTINGS = {
  MOBILE: { cols: 1, gap: 4 },
  TABLET: { cols: 2, gap: 6 },
  DESKTOP: { cols: 3, gap: 8 },
  WIDE: { cols: 4, gap: 10 },
} as const;

// 🕒 폴링 간격 (ms)
export const POLLING_INTERVALS = {
  REALTIME: 1000,
  FREQUENT: 5000,
  NORMAL: 30000,
  SLOW: 60000,
} as const;

// 🔍 검색 디바운스 지연시간 (ms)
export const DEBOUNCE_DELAYS = {
  SEARCH: 300,
  AUTO_SAVE: 1000,
  VALIDATION: 500,
} as const;

// 📄 페이지 메타데이터
export const PAGE_METADATA = {
  DEFAULT_TITLE: '멘탈튼튼 - AI 기반 마음건강 관리',
  DEFAULT_DESCRIPTION: 'AI와 함께하는 개인화된 감정 관리 및 상담 서비스',
  KEYWORDS: ['멘탈헬스', 'AI상담', '감정관리', '마음건강', '심리상담'],
} as const;

// 타입 추출
export type AnimationDelay = typeof ANIMATION_DELAYS[keyof typeof ANIMATION_DELAYS];
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
export type ApiEndpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS];
export type ChartColor = typeof CHART_COLORS[keyof typeof CHART_COLORS];
export type EmotionIcon = typeof EMOTION_ICONS[keyof typeof EMOTION_ICONS]; 