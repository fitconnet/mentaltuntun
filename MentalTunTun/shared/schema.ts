import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  jsonb,
  varchar,
  date,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export notification schema
export * from "./notification-schema";
export * from "./subscription-schema";

// 🔄 1️⃣ 사용자 기본 정보 (PostgreSQL 백업용)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Firebase UID (통합 식별자)
  email: text("email").notNull(),
  provider: text("provider").notNull(), // kakao, naver, google, email
  plan: text("plan").default("free"), // free, premium
  profileComplete: boolean("profile_complete").default(false),
  name: text("name"),
  mbti: text("mbti"),
  interests: jsonb("interests").$type<string[]>().default([]),
  personality: jsonb("personality").$type<Record<string, any>>().default({}),
  birthDate: text("birth_date"),
  occupation: text("occupation"),
  gender: text("gender"),
  subscriptionType: text("subscription_type").default("free"),
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  subscriptionCount: integer("subscription_count").default(0), // 총 구독 횟수
  // 관리자 임시 구독 필드
  tempPremiumEndDate: text("temp_premium_end_date"), // 임시 프리미엄 종료일 (ISO string)
  tempPremiumGrantedBy: text("temp_premium_granted_by"), // 임시 프리미엄 부여한 관리자
  tempPremiumGrantedAt: text("temp_premium_granted_at"), // 임시 프리미엄 부여 시간 (ISO string)
  password: text("password"), // 이메일 가입용 해시된 비밀번호
  isActive: boolean("is_active").default(true), // 사용자 활성화 상태
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 🔄 2️⃣ 사용자 프로필 상세 (PostgreSQL 백업용)
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Firebase UID
  name: text("name"),
  email: text("email"),
  phone: text("phone"), // 휴대폰 번호
  password: text("password"), // 해시된 비밀번호 (이메일 가입용)
  provider: text("provider").default("email"), // email, google, kakao, naver
  plan: text("plan").default("free"), // free, premium
  profileComplete: boolean("profile_complete").default(false),
  birth: text("birth"), // YYYY-MM-DD
  gender: text("gender"), // 남, 여, 기타
  interests: jsonb("interests").$type<string[]>().default([]),
  tendencies: jsonb("tendencies").$type<string[]>().default([]),
  job: text("job"),
  mbti: text("mbti"),
  birthTime: text("birth_time"), // HH:MM
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  adminId: text("admin_id").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").default("sub_admin"), // main_admin, sub_admin
  isSuperAdmin: boolean("is_super_admin").default(false), // 관리자 배지 클릭 권한
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 관리자 권한 관리 테이블
export const adminPermissions = pgTable("admin_permissions", {
  id: serial("id").primaryKey(),
  adminId: text("admin_id").notNull(), // admins 테이블과 연결
  permission: text("permission").notNull(), // dashboard, users, content, analytics, gpt, notifications, revenue
  granted: boolean("granted").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 🔄 3️⃣ 감정카드 기록 (PostgreSQL 백업용)
export const emotionRecords = pgTable("emotion_records", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull(), // Firebase UID
  userId: integer("user_id").notNull(), // 기존 API 호환성을 위한 추가 필드
  date: text("date").notNull(), // YYYY-MM-DD
  emotionKeywords: jsonb("emotion_keywords").$type<string[]>().notNull(),
  emotions: jsonb("emotions").$type<string[]>().notNull().default([]), // 감정 목록
  note: text("note"),
  score: integer("score"), // -100 to +100 (GPT 감정 분석 점수 * 100)
  createdAt: timestamp("created_at").defaultNow(),
});

// 🔄 4️⃣ AI 상담 기록 (PostgreSQL 백업용)
export const counselingSessions = pgTable("counseling_sessions", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull(), // Firebase UID
  userId: integer("user_id").notNull(), // 기존 API 호환성을 위한 추가 필드
  sessionId: text("session_id"), // session_{timestamp}
  topic: text("topic"),
  persona: text("persona"),
  personaType: text("persona_type"), // strategic, empathetic, cheerful
  personaName: text("persona_name"), // 페르소나 이름
  personaDescription: text("persona_description"), // 페르소나 설명
  matchingRank: text("matching_rank"), // 매칭 랭크
  reason: jsonb("reason").$type<string[]>(), // 추천 이유
  specialization: text("specialization"), // 전문 분야
  approachMethod: text("approach_method"), // 접근 방법
  concernKeywords: jsonb("concern_keywords").$type<string[]>(), // 고민 키워드
  selectedTones: jsonb("selected_tones").$type<string[]>(), // 선택한 어조
  messageCount: integer("message_count").default(0),
  summary: text("summary"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  role: text("role").notNull(), // user, assistant
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const feedbackLogs = pgTable("feedback_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sessionId: integer("session_id").notNull(),
  messageId: integer("message_id").notNull(),
  rating: integer("rating").notNull(), // 1-5
  feedbackText: text("feedback_text"),
  personaType: text("persona_type").notNull(),
  category: text("category"), // 피드백 카테고리
  comments: text("comments"), // 추가 코멘트
  createdAt: timestamp("created_at").defaultNow(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const personalityAssessments = pgTable("personality_assessments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  assessmentType: text("assessment_type").notNull(), // interests, worldcup, mbti
  results: jsonb("results").$type<Record<string, any>>().notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const scheduleAppointments = pgTable("schedule_appointments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // '감정일기', 'AI상담', '심리상담센터', '병원예약'
  title: text("title").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time"), // HH:MM format (선택사항)
  repeatType: text("repeat_type").default("none"), // 'none', 'weekly', 'monthly'
  repeatInterval: integer("repeat_interval").default(1), // 1=매주/매월, 2=격주/격월
  repeatDays: text("repeat_days").array(), // ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] (기존 호환성)
  repeatWeekdays: integer("repeat_weekdays").array(), // [0,1,2,3,4,5,6] (일~토)
  repeatDates: integer("repeat_dates").array(), // [1, 15, 30] for monthly date repeats (기존 호환성)
  monthlyBasis: text("monthly_basis"), // 'weekday' or 'date'
  repeatCount: integer("repeat_count"), // 반복 횟수 (null=무한)
  endDate: text("end_date"), // 종료 날짜 (선택적)
  baseDate: text("base_date"), // 최초 기준일
  groupId: text("group_id"), // 반복 일정 그룹 식별자
  reminderMinutes: integer("reminder_minutes").default(30), // 10, 30, 60
  memo: text("memo"),
  status: text("status").default("scheduled"), // 'scheduled', 'completed', 'cancelled', 'missed'
  // 유료 플랜용 AI 상담 요약 저장
  counselingSummary: text("counseling_summary"), // AI 상담 요약
  counselingSessionId: integer("counseling_session_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Psychological tests schema
export const psychologicalTests = pgTable("psychological_tests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // professional, fun
  questions: text("questions").notNull(), // JSON string
  scoring: text("scoring").notNull(), // JSON string for scoring logic
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const testResults = pgTable("test_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  testId: integer("test_id")
    .notNull()
    .references(() => psychologicalTests.id),
  answers: text("answers").notNull(), // JSON string
  result: text("result").notNull(), // JSON string
  score: integer("score"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Content management schema
export const contentItems = pgTable("content_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary"), // Summary/description of content
  content: text("content").notNull(), // Main content/article text
  category: text("category").notNull(), // psychology, health, wellness, etc.
  type: text("type"), // video, article, blog, scraped, card
  thumbnailUrl: text("thumbnail_url"), // Title/thumbnail image URL
  url: text("url"), // Source URL or external link
  tags: text("tags").array(), // Array of tags
  status: text("status").notNull().default("published"), // published, draft, scheduled
  viewCount: integer("view_count").notNull().default(0),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for hybrid database structure
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
});

export const updateUserSchema = createInsertSchema(users).omit({
  id: true,
  uid: true,
  createdAt: true,
  lastLogin: true,
  updatedAt: true,
}).partial();

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  updatedAt: true,
});

export const insertEmotionRecordSchema = createInsertSchema(
  emotionRecords
).omit({
  id: true,
  createdAt: true,
});

export const insertCounselingSessionSchema = createInsertSchema(
  counselingSessions
).omit({
  id: true,
  uid: true,
  sessionId: true,
  startedAt: true,
  endedAt: true,
  isActive: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertFeedbackLogSchema = createInsertSchema(feedbackLogs).omit({
  id: true,
  timestamp: true,
});

export const insertPersonalityAssessmentSchema = createInsertSchema(
  personalityAssessments
).omit({
  id: true,
  completedAt: true,
});

export const insertScheduleAppointmentSchema = createInsertSchema(
  scheduleAppointments
).omit({
  id: true,
  createdAt: true,
});

export const insertPsychologicalTestSchema = createInsertSchema(
  psychologicalTests
).omit({
  id: true,
  createdAt: true,
});

export const insertTestResultSchema = createInsertSchema(testResults).omit({
  id: true,
  createdAt: true,
});

export const insertContentItemSchema = createInsertSchema(contentItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// 고객 문의 테이블
export const customerInquiries = pgTable("customer_inquiries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"), // null이면 비회원 문의
  email: text("email").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(), // '서비스', '결제', '기술', '제안'
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").default("pending"), // 'pending', 'in_progress', 'resolved'
  adminReply: text("admin_reply"),
  repliedAt: timestamp("replied_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCustomerInquirySchema = createInsertSchema(
  customerInquiries
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// 사용자 피드백 테이블 (탈퇴사유, 사용경험, 상담후기 등)
export const userFeedback = pgTable("user_feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: text("type").notNull(), // 'withdrawal', 'experience', 'counseling_review', 'general'
  category: text("category"), // 탈퇴사유 카테고리 등
  reasons: text("reasons").array(), // 선택형 사유들
  message: text("message"), // 자유입력 피드백
  rating: integer("rating"), // 평점 (1-5)
  metadata: jsonb("metadata"), // 추가 메타데이터
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserFeedbackSchema = createInsertSchema(userFeedback).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// 사용자 알림 설정 테이블
export const userNotificationSettings = pgTable("user_notification_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // 알림 활성화 여부 (전체 알림 온/오프)
  enabled: boolean("enabled").default(true),
  // 메인화면 진입 시 알림 표시
  showOnMainEntry: boolean("show_on_main_entry").default(true),
  // 제한 도달 시 알림 (무료 사용자 제한 도달)
  showOnLimitReached: boolean("show_on_limit_reached").default(true),
  // 제한 기능 클릭 시 알림 (프리미엄 기능 클릭)
  showOnLimitFunctionPressed: boolean("show_on_limit_function_pressed").default(
    true
  ),
  // 서비스 종료 시 알림
  showOnServiceTermination: boolean("show_on_service_termination").default(
    true
  ),
  // 세션 완료 시 알림
  showOnSessionComplete: boolean("show_on_session_complete").default(true),
  // 피드백 요청 시 알림
  showOnFeedbackRequest: boolean("show_on_feedback_request").default(true),
  // 관리자 공지사항 알림
  showOnAdminAnnouncement: boolean("show_on_admin_announcement").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserNotificationSettingsSchema = createInsertSchema(
  userNotificationSettings
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// 주간 리포트 테이블
export const weeklyReports = pgTable("weekly_reports", {
  id: serial("id").primaryKey(),
  weekStart: text("week_start").notNull(), // 2025-07-07 (월요일)
  weekEnd: text("week_end").notNull(), // 2025-07-13 (일요일)
  reportData: jsonb("report_data")
    .$type<{
      withdrawalReasons: { reason: string; count: number }[];
      userReviews: { rating: number; content: string; date: string }[];
      signupMetrics: {
        signups: number;
        withdrawals: number;
        retention: number;
      };
      revenueFlow: { revenue: number; subscriptions: number; churn: number };
      demographics: {
        gender: { male: number; female: number };
        age: { [key: string]: number };
      };
    }>()
    .notNull(),
  generatedReport: text("generated_report").notNull(), // GPT 생성 마크다운 리포트
  status: text("status").default("generated"), // generated, sent, archived
  createdAt: timestamp("created_at").defaultNow(),
  scheduledFor: timestamp("scheduled_for"), // 스케줄링된 시간 (매주 월요일 8시)
});

export const insertWeeklyReportSchema = createInsertSchema(weeklyReports).omit({
  id: true,
  createdAt: true,
});

// Insert schemas for admin management
export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
});

export const insertAdminPermissionSchema = createInsertSchema(
  adminPermissions
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for hybrid database structure
export type User = typeof users.$inferSelect;
export type UserNotificationSettings =
  typeof userNotificationSettings.$inferSelect;
export type InsertUserNotificationSettings = z.infer<
  typeof insertUserNotificationSettingsSchema
>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type EmotionRecord = typeof emotionRecords.$inferSelect;
export type InsertEmotionRecord = z.infer<typeof insertEmotionRecordSchema>;
export type CounselingSession = typeof counselingSessions.$inferSelect;
export type InsertCounselingSession = z.infer<
  typeof insertCounselingSessionSchema
>;
export type PsychologicalTest = typeof psychologicalTests.$inferSelect;
export type InsertPsychologicalTest = z.infer<
  typeof insertPsychologicalTestSchema
>;
export type TestResult = typeof testResults.$inferSelect;
export type InsertTestResult = z.infer<typeof insertTestResultSchema>;
export type ContentItem = typeof contentItems.$inferSelect;
export type InsertContentItem = z.infer<typeof insertContentItemSchema>;
export type CustomerInquiry = typeof customerInquiries.$inferSelect;
export type InsertCustomerInquiry = z.infer<typeof insertCustomerInquirySchema>;
export type UserFeedback = typeof userFeedback.$inferSelect;
export type InsertUserFeedback = z.infer<typeof insertUserFeedbackSchema>;
export type WeeklyReport = typeof weeklyReports.$inferSelect;
export type InsertWeeklyReport = z.infer<typeof insertWeeklyReportSchema>;
export type AdminPermission = typeof adminPermissions.$inferSelect;
export type InsertAdminPermission = z.infer<typeof insertAdminPermissionSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type FeedbackLog = typeof feedbackLogs.$inferSelect;
export type InsertFeedbackLog = z.infer<typeof insertFeedbackLogSchema>;
export type PersonalityAssessment = typeof personalityAssessments.$inferSelect;
export type InsertPersonalityAssessment = z.infer<
  typeof insertPersonalityAssessmentSchema
>;
export type ScheduleAppointment = typeof scheduleAppointments.$inferSelect;
export type InsertScheduleAppointment = z.infer<
  typeof insertScheduleAppointmentSchema
>;

// 백업 시스템 스키마
export const backupLogs = pgTable("backup_logs", {
  id: serial("id").primaryKey(),
  backupType: varchar("backup_type", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(), // 'success', 'failed', 'running'
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  durationSeconds: integer("duration_seconds"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const userProfilesBackup = pgTable("user_profiles_backup", {
  id: serial("id").primaryKey(),
  uid: varchar("uid", { length: 128 }).unique().notNull(),
  birthDate: date("birth_date"),
  gender: varchar("gender", { length: 20 }),
  occupation: varchar("occupation", { length: 100 }),
  mbti: varchar("mbti", { length: 4 }),
  interests: jsonb("interests").default("[]"),
  personalityScores: jsonb("personality_scores").default("{}"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const emotionRecordsBackup = pgTable(
  "emotion_records_backup",
  {
    id: serial("id").primaryKey(),
    uid: varchar("uid", { length: 128 }).notNull(),
    date: date("date").notNull(),
    emotionKeywords: jsonb("emotion_keywords").default("[]"),
    note: text("note"),
    score: integer("score").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  table => {
    return {
      uniqueUidDate: unique().on(table.uid, table.date),
    };
  }
);

export const counselingSessionsBackup = pgTable(
  "counseling_sessions_backup",
  {
    id: serial("id").primaryKey(),
    uid: varchar("uid", { length: 128 }).notNull(),
    sessionId: varchar("session_id", { length: 255 }).notNull(),
    topic: text("topic"),
    personaType: varchar("persona_type", { length: 50 }).default("empathetic"),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    summary: text("summary"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  table => {
    return {
      uniqueUidSessionId: unique().on(table.uid, table.sessionId),
    };
  }
);

export const chatMessagesBackup = pgTable(
  "chat_messages_backup",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id").references(
      () => counselingSessionsBackup.id,
      { onDelete: "cascade" }
    ),
    role: varchar("role", { length: 20 }).notNull(), // 'user', 'assistant'
    content: text("content").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow(),
    messageOrder: integer("message_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  table => {
    return {
      uniqueSessionOrder: unique().on(table.sessionId, table.messageOrder),
    };
  }
);

// 백업 관련 타입 추출
export type BackupLog = typeof backupLogs.$inferSelect;
export type InsertBackupLog = typeof backupLogs.$inferInsert;

export type UserProfileBackup = typeof userProfilesBackup.$inferSelect;
export type InsertUserProfileBackup = typeof userProfilesBackup.$inferInsert;

export type EmotionRecordBackup = typeof emotionRecordsBackup.$inferSelect;
export type InsertEmotionRecordBackup =
  typeof emotionRecordsBackup.$inferInsert;

export type CounselingSessionBackup =
  typeof counselingSessionsBackup.$inferSelect;
export type InsertCounselingSessionBackup =
  typeof counselingSessionsBackup.$inferInsert;

export type ChatMessageBackup = typeof chatMessagesBackup.$inferSelect;
export type InsertChatMessageBackup = typeof chatMessagesBackup.$inferInsert;
