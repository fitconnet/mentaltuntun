import { pgTable, foreignKey, pgPolicy, uuid, timestamp, text } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Supabase 인증용 users 테이블 참조용 정의
export const users = pgTable("users", {
  id: uuid("id").primaryKey().notNull(),
  email: text("email"), // email도 인증에 활용될 경우 대비
});

// profiles 테이블 정의
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    username: text(),
    avatarUrl: text("avatar_url"),
  },
  (table) => [
    // 외래키: Supabase users 테이블 참조
    foreignKey({
      columns: [table.id],
      foreignColumns: [users.id],
      name: "profiles_id_fkey",
    }).onDelete("cascade"),

    // RLS 정책: 본인만 update 가능
    pgPolicy("Enable update for users based on id", {
      as: "permissive",
      for: "update",
      to: ["public"],
      using: sql`auth.uid() = id`,
      withCheck: sql`auth.uid() = id`,
    }),

    // RLS 정책: 본인만 SELECT 가능
    pgPolicy("Select My Profile", {
      as: "permissive",
      for: "select",
      to: ["public"],
      using: sql`auth.uid() = id`,
    }),
  ]
);
