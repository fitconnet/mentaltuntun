import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// 알림 테이블
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"), // null이면 관리자용, 값이 있으면 특정 사용자용
  type: text("type").notNull(), // 'admin_reply', 'customer_inquiry', 'user_feedback', 'monthly_report'
  title: text("title").notNull(),
  content: text("content").notNull(),
  priority: text("priority").default("normal"), // 'low', 'normal', 'high', 'urgent'
  status: text("status").default("active"), // 'active', 'expired', 'ended'
  isRead: boolean("is_read").default(false),
  relatedId: integer("related_id"), // 관련 문의 ID 등
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}), // 추가 데이터
  expiresAt: timestamp("expires_at"), // 알림 만료일
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
