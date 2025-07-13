// 🧠 멘탈튼튼 - 프로젝트 상수 정의
//
// 📁 리팩터링: 하드코딩된 값들을 중앙화하여 유지보수성 향상
// ⚡ 매직 넘버/스트링 제거 및 타입 안정성 개선

// 🔐 인증 관련 상수
export const AUTH_PROVIDERS = {
  GOOGLE: 'google',
  KAKAO: 'kakao',
  NAVER: 'naver',
  EMAIL: 'email',
} as const;

export const AUTH_REDIRECT_PATHS = {
  LOGIN: '/login',
  PROFILE: '/profile',
  HOME: '/',
} as const;

// 👤 사용자 플랜 상수
export const USER_PLANS = {
  FREE: 'free',
  PREMIUM: 'premium',
  PRO: 'pro',
} as const;

// 🎭 페르소나 타입 상수
export const PERSONA_TYPES = {
  STRATEGIC: 'strategic',
  EMPATHETIC: 'empathetic',
  CHEERFUL: 'cheerful',
} as const;

// 📊 상담 세션 상태
export const SESSION_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  COMPLETED: 'completed',
} as const;

// 💬 메시지 역할
export const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
} as const;

// 📈 피드백 등급
export const FEEDBACK_RATINGS = {
  MIN: 1,
  MAX: 5,
} as const;

// 🏷️ 알림 타입
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success',
} as const;

// 🔔 알림 우선순위
export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

// 📱 반응형 브레이크포인트 (Tailwind 기준)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// 🌈 테마 컬러 (디자인 시스템)
export const THEME_COLORS = {
  PRIMARY: 'hsl(var(--primary))',
  SECONDARY: 'hsl(var(--secondary))',
  SUCCESS: 'hsl(var(--success))',
  WARNING: 'hsl(var(--warning))',
  ERROR: 'hsl(var(--error))',
} as const;

// 📅 날짜 형식
export const DATE_FORMATS = {
  ISO_DATE: 'YYYY-MM-DD',
  ISO_DATETIME: 'YYYY-MM-DD HH:mm:ss',
  DISPLAY_DATE: 'YYYY년 MM월 DD일',
  DISPLAY_DATETIME: 'YYYY년 MM월 DD일 HH:mm',
} as const;

// 🔢 페이지네이션 기본값
export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const;

// 📊 감정 점수 범위
export const EMOTION_SCORE_RANGE = {
  MIN: -100,
  MAX: 100,
} as const;

// 🎯 AI 모델 타입
export const AI_MODELS = {
  GPT_3_5_TURBO: 'gpt-3.5-turbo',
  GPT_4O_MINI: 'gpt-4o-mini',
  GPT_4O: 'gpt-4o',
} as const;

// 📝 로그 레벨
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
} as const;

// 🔄 백업 상태
export const BACKUP_STATUS = {
  SUCCESS: 'success',
  FAILED: 'failed',
  RUNNING: 'running',
} as const;

// 타입 추출 (타입스크립트에서 사용)
export type AuthProvider = typeof AUTH_PROVIDERS[keyof typeof AUTH_PROVIDERS];
export type UserPlan = typeof USER_PLANS[keyof typeof USER_PLANS];
export type PersonaType = typeof PERSONA_TYPES[keyof typeof PERSONA_TYPES];
export type SessionStatus = typeof SESSION_STATUS[keyof typeof SESSION_STATUS];
export type MessageRole = typeof MESSAGE_ROLES[keyof typeof MESSAGE_ROLES];
export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];
export type NotificationPriority = typeof NOTIFICATION_PRIORITIES[keyof typeof NOTIFICATION_PRIORITIES];
export type AIModel = typeof AI_MODELS[keyof typeof AI_MODELS];
export type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];
export type BackupStatus = typeof BACKUP_STATUS[keyof typeof BACKUP_STATUS]; 