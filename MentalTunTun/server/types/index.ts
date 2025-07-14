import { Request, Response } from 'express';
import { Session } from 'express-session';
import { User } from '@shared/schema';

// 세션 타입 정의
export interface SessionData {
  user?: User;
  admin?: AdminUser;
  isAdmin?: boolean;
  adminId?: string;
  adminTimestamp?: number;
}

// Express 세션 타입 확장
declare module 'express-session' {
  interface SessionData {
    user?: User;
    admin?: AdminUser;
    isAdmin?: boolean;
    adminId?: string;
    adminTimestamp?: number;
  }
}

// Express serve-static-core 모듈 확장
declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
    session: Session & Partial<SessionData>;
  }
}

// Request 타입 확장
export interface AuthenticatedRequest extends Request {
  user?: User;
  session: Session & Partial<SessionData>;
}

// Admin 사용자 타입
export interface AdminUser {
  id: number;
  adminId: string;
  name: string;
  email: string;
  role: string;
  isSuperAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: number; // 추가된 속성
}

// 피드백 스키마
export interface FeedbackLog {
  id: number;
  userId: number;
  sessionId: number;
  personaType: string;
  messageId: number;
  rating: number;
  feedbackText: string | null;
  timestamp: Date;
  category?: string;
  comments?: string;
}

// 업데이트 스키마
export interface UpdateUserSchema {
  email?: string;
  name?: string;
  mbti?: string;
  interests?: string[];
  personality?: Record<string, any>;
  birthDate?: string;
  occupation?: string;
  gender?: string;
  subscriptionType?: string;
}

// 페르소나 추천 타입
export interface PersonaRecommendation {
  type: "strategic" | "empathetic" | "cheerful";
  name: string;
  description: string;
  matchingRank: "최상" | "상" | "중";
  reason: string[];
  specialization?: string;
  approachMethod?: string;
}

// 실시간 감정 분석 타입
export interface RealtimeEmotionAnalysis {
  mood: string;
  intensity: number;
  keywords: string[];
  recommendations: string[];
  "coping suggestions"?: string[];
}

// 스케줄 타입 (시간 필드 포함)
export interface ScheduleAppointment {
  id: number;
  userId: number;
  type: string;
  title: string;
  date: string;
  time: string;
  startTime: string;
  endTime?: string;
  duration: number;
  repeatType?: string;
  repeatDays?: string[];
  reminderMinutes: number;
  memo?: string;
  status: string;
  groupId?: string;
  counselingSessionId?: number;
  createdAt?: Date;
}

export default {}; 