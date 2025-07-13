import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  jsonb,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Subscription Plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // 'Free', 'Premium', 'Pro'
  displayName: text("display_name").notNull(), // '무료', '프리미엄', '프로'
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("KRW"),
  billingInterval: text("billing_interval").notNull(), // 'monthly', 'yearly', 'lifetime'
  features: jsonb("features").$type<string[]>().notNull(),
  aiCredits: integer("ai_credits").default(0), // AI 사용 크레딧 (0 = unlimited)
  maxSessions: integer("max_sessions").default(0), // 동시 세션 수 (0 = unlimited)
  advancedAI: boolean("advanced_ai").default(false), // 고급 AI 기능 사용 가능
  aiModel: text("ai_model").default("gpt-3.5-turbo"), // gpt-3.5-turbo, gpt-4o-mini, gpt-4o
  personalizedAnalysis: boolean("personalized_analysis").default(false), // 개인화 분석
  realtimeEmotionTracking: boolean("realtime_emotion_tracking").default(false), // 실시간 감정 추적
  comprehensiveReports: boolean("comprehensive_reports").default(false), // 종합 리포트
  smartScheduling: boolean("smart_scheduling").default(false), // 스마트 스케줄링
  prioritySupport: boolean("priority_support").default(false),
  customPersonas: boolean("custom_personas").default(false), // 커스텀 페르소나 생성
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Subscriptions
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  planId: integer("plan_id").notNull(),
  status: text("status").notNull(), // 'active', 'inactive', 'cancelled', 'expired'
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  autoRenew: boolean("auto_renew").default(true),
  paymentMethod: text("payment_method"), // 'card', 'bank', 'paypal'
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeCustomerId: text("stripe_customer_id"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Usage Tracking
export const aiUsageHistory = pgTable("ai_usage_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subscriptionId: integer("subscription_id").notNull(),
  featureType: text("feature_type").notNull(), // 'counseling', 'personality_analysis', 'custom_persona'
  tokensUsed: integer("tokens_used").notNull(),
  cost: decimal("cost", { precision: 10, scale: 4 }).notNull(),
  sessionId: integer("session_id"), // Optional reference to counseling session
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema exports
export const insertSubscriptionPlanSchema = createInsertSchema(
  subscriptionPlans
).omit({
  id: true,
  createdAt: true,
});

export const insertUserSubscriptionSchema = createInsertSchema(
  userSubscriptions
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiUsageHistorySchema = createInsertSchema(
  aiUsageHistory
).omit({
  id: true,
  createdAt: true,
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<
  typeof insertSubscriptionPlanSchema
>;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<
  typeof insertUserSubscriptionSchema
>;
export type AiUsageHistory = typeof aiUsageHistory.$inferSelect;
export type InsertAiUsageHistory = z.infer<typeof insertAiUsageHistorySchema>;
