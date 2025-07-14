import {
  users,
  userProfiles,
  emotionRecords,
  counselingSessions,
  chatMessages,
  feedbackLogs,
  personalityAssessments,
  scheduleAppointments,
  contentItems,
  customerInquiries,
  userFeedback,
  userNotificationSettings,
  weeklyReports,
  admins,
  adminPermissions,
  type User,
  type InsertUser,
  type UserProfile,
  type InsertUserProfile,
  type EmotionRecord,
  type InsertEmotionRecord,
  type CounselingSession,
  type InsertCounselingSession,
  type ContentItem,
  type InsertContentItem,
  type CustomerInquiry,
  type InsertCustomerInquiry,
  type UserFeedback,
  type InsertUserFeedback,
  type UserNotificationSettings,
  type InsertUserNotificationSettings,
  type WeeklyReport,
  type InsertWeeklyReport,
  type Admin,
  type InsertAdmin,
  type AdminPermission,
  type InsertAdminPermission,
  type ChatMessage,
  type InsertChatMessage,
  type FeedbackLog,
  type InsertFeedbackLog,
  type PersonalityAssessment,
  type InsertPersonalityAssessment,
  type ScheduleAppointment,
  type InsertScheduleAppointment,
} from "@shared/schema";
import {
  notifications,
  type Notification,
  type InsertNotification,
} from "@shared/notification-schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUID(uid: string): Promise<User | undefined>; // Firebase UID 기반 조회
  createUser(user: InsertUser): Promise<User>;
  updateUser(
    id: number,
    updates: Partial<InsertUser>
  ): Promise<User | undefined>;

  // User profile operations
  getUserProfile(uid: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(
    uid: string,
    updates: Partial<InsertUserProfile>
  ): Promise<UserProfile | undefined>;

  // Emotion records
  getEmotionRecordsByUser(userId: number): Promise<EmotionRecord[]>;
  getEmotionRecordByDate(
    userId: number,
    date: string
  ): Promise<EmotionRecord | undefined>;
  createEmotionRecord(record: InsertEmotionRecord): Promise<EmotionRecord>;
  updateEmotionRecord(
    id: number,
    updates: Partial<InsertEmotionRecord>
  ): Promise<EmotionRecord | undefined>;

  // Counseling sessions
  getCounselingSessionsByUser(userId: number): Promise<CounselingSession[]>;
  getCounselingSession(id: number): Promise<CounselingSession | undefined>;
  createCounselingSession(
    session: InsertCounselingSession
  ): Promise<CounselingSession>;
  updateCounselingSession(
    id: number,
    updates: Partial<InsertCounselingSession>
  ): Promise<CounselingSession | undefined>;

  // Chat messages
  getChatMessagesBySession(sessionId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // Feedback logs
  getFeedbackLogsByUser(userId: number): Promise<FeedbackLog[]>;
  createFeedbackLog(feedback: InsertFeedbackLog): Promise<FeedbackLog>;

  // Personality assessments
  getPersonalityAssessmentsByUser(
    userId: number
  ): Promise<PersonalityAssessment[]>;
  createPersonalityAssessment(
    assessment: InsertPersonalityAssessment
  ): Promise<PersonalityAssessment>;

  // Schedule appointments
  getScheduleAppointmentsByUser(userId: number): Promise<ScheduleAppointment[]>;
  getScheduleAppointmentsByDate(
    userId: number,
    date: string
  ): Promise<ScheduleAppointment[]>;
  getScheduleAppointment(id: number): Promise<ScheduleAppointment | undefined>;
  createScheduleAppointment(
    appointment: InsertScheduleAppointment
  ): Promise<ScheduleAppointment>;
  updateScheduleAppointment(
    id: number,
    updates: Partial<InsertScheduleAppointment>
  ): Promise<ScheduleAppointment | undefined>;
  deleteScheduleAppointment(id: number): Promise<boolean>;

  // Admin operations
  getAllUsers(): Promise<User[]>;
  getAllFeedbackLogs(): Promise<FeedbackLog[]>;
  getSystemStats(): Promise<{
    totalUsers: number;
    totalSessions: number;
    averageRating: number;
    totalEmotionRecords: number;
  }>;

  // Content management
  getAllContentItems(): Promise<ContentItem[]>;
  createContentItem(item: InsertContentItem): Promise<ContentItem>;
  updateContentItem(
    id: number,
    updates: Partial<InsertContentItem>
  ): Promise<ContentItem | undefined>;
  deleteContentItem(id: number): Promise<boolean>;

  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getAllNotifications(): Promise<Notification[]>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<boolean>;

  // Notification lifecycle management
  extendNotificationExpiry(id: number, extensionDays: number): Promise<boolean>;
  terminateNotification(id: number): Promise<boolean>;
  deleteNotification(id: number): Promise<boolean>;
  getActiveNotifications(): Promise<Notification[]>;
  getExpiredNotifications(): Promise<Notification[]>;

  // Customer Inquiries
  createCustomerInquiry(
    inquiry: InsertCustomerInquiry
  ): Promise<CustomerInquiry>;
  getAllCustomerInquiries(): Promise<CustomerInquiry[]>;
  getCustomerInquiry(id: number): Promise<CustomerInquiry | undefined>;
  updateCustomerInquiry(
    id: number,
    updates: Partial<InsertCustomerInquiry>
  ): Promise<CustomerInquiry | undefined>;
  replyToCustomerInquiry(
    id: number,
    reply: string
  ): Promise<CustomerInquiry | undefined>;
  deleteCustomerInquiry(id: number): Promise<boolean>;

  // Admin operations
  deleteUserData(userId: number): Promise<boolean>;

  // User Feedback operations
  createUserFeedback(feedback: InsertUserFeedback): Promise<UserFeedback>;
  getUserFeedback(): Promise<UserFeedback[]>;

  // User notification settings
  getUserNotificationSettings(
    userId: number
  ): Promise<UserNotificationSettings | undefined>;
  createUserNotificationSettings(
    settings: InsertUserNotificationSettings
  ): Promise<UserNotificationSettings>;
  updateUserNotificationSettings(
    userId: number,
    updates: Partial<InsertUserNotificationSettings>
  ): Promise<UserNotificationSettings | undefined>;

  // Weekly Reports
  getWeeklyReportData(
    startDate: Date,
    endDate: Date
  ): Promise<{
    withdrawalReasons: { reason: string; count: number }[];
    userReviews: { rating: number; content: string; date: string }[];
    signupMetrics: { signups: number; withdrawals: number; retention: number };
    revenueFlow: { revenue: number; subscriptions: number; churn: number };
    demographics: {
      gender: { male: number; female: number };
      age: { [key: string]: number };
    };
  }>;
  createWeeklyReport(report: InsertWeeklyReport): Promise<WeeklyReport>;
  getWeeklyReports(): Promise<WeeklyReport[]>;
  getWeeklyReport(id: number): Promise<WeeklyReport | undefined>;

  // Admin account management
  getAllAdmins(): Promise<Admin[]>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  updateAdmin(
    adminId: string,
    updates: Partial<InsertAdmin>
  ): Promise<Admin | undefined>;
  deleteAdmin(adminId: string): Promise<boolean>;
  getAdminPermissions(adminId: string): Promise<AdminPermission[]>;
  updateAdminPermissions(
    adminId: string,
    permissions: AdminPermission[]
  ): Promise<void>;
}

export class MemStorage {
  private users: Map<number, User> = new Map();
  private emotionRecords: Map<number, EmotionRecord> = new Map();
  private counselingSessions: Map<number, CounselingSession> = new Map();
  private chatMessages: Map<number, ChatMessage> = new Map();
  private feedbackLogs: Map<number, FeedbackLog> = new Map();
  private personalityAssessments: Map<number, PersonalityAssessment> =
    new Map();

  private currentUserId = 1;
  private currentEmotionId = 1;
  private currentSessionId = 1;
  private currentMessageId = 1;
  private currentFeedbackId = 1;
  private currentAssessmentId = 1;

  constructor() {
    // Initialize with demo users
    this.createUser({
      uid: "demo-uid-1",
      email: "demo@example.com",
      provider: "local",
      name: "김민수",
      birthDate: "1990-01-15",
      occupation: "개발자",
      mbti: "INFP",
      interests: ["창의성", "기술", "자기계발"],
      personality: {
        type: "empathetic",
        traits: ["sensitive", "creative", "introspective"],
      },
    });

    // Add a second demo user for testing
    this.createUser({
      uid: "demo-uid-2",
      email: "user@example.com",
      provider: "local",
      name: "이지은",
      birthDate: "1995-03-22",
      occupation: "디자이너",
      mbti: "ENFP",
      interests: ["창의성", "라이프스타일", "취미"],
      personality: {
        type: "cheerful",
        traits: ["optimistic", "creative", "social"],
      },
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
      lastLogin: new Date(),
      name: insertUser.name ?? null,
      plan: insertUser.plan ?? null,
      profileComplete: insertUser.profileComplete ?? null,
      mbti: insertUser.mbti ?? null,
      interests: insertUser.interests ?? null,
      personality: insertUser.personality ?? null,
      birthDate: insertUser.birthDate ?? null,
      occupation: insertUser.occupation ?? null,
      gender: insertUser.gender ?? null,
      subscriptionType: insertUser.subscriptionType ?? null,
      subscriptionStartDate: insertUser.subscriptionStartDate ?? null,
      subscriptionEndDate: insertUser.subscriptionEndDate ?? null,
      subscriptionCount: insertUser.subscriptionCount ?? null,
      tempPremiumEndDate: insertUser.tempPremiumEndDate ?? null,
      tempPremiumGrantedBy: insertUser.tempPremiumGrantedBy ?? null,
      tempPremiumGrantedAt: insertUser.tempPremiumGrantedAt ?? null,
      password: insertUser.password ?? null,
      isActive: insertUser.isActive ?? null,
      updatedAt: insertUser.updatedAt ?? null,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(
    id: number,
    updates: Partial<InsertUser>
  ): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getEmotionRecordsByUser(userId: number): Promise<EmotionRecord[]> {
    return Array.from(this.emotionRecords.values()).filter(
      record => record.userId === userId
    );
  }

  async getEmotionRecordByDate(
    userId: number,
    date: string
  ): Promise<EmotionRecord | undefined> {
    return Array.from(this.emotionRecords.values()).find(
      record => record.userId === userId && record.date === date
    );
  }

  async createEmotionRecord(
    insertRecord: InsertEmotionRecord
  ): Promise<EmotionRecord> {
    const id = this.currentEmotionId++;
    const record: EmotionRecord = {
      ...insertRecord,
      emotions: insertRecord.emotions || [],
      id,
      createdAt: new Date(),
      note: insertRecord.note ?? null,
      score: insertRecord.score ?? null,
    };
    this.emotionRecords.set(id, record);
    return record;
  }

  async updateEmotionRecord(
    id: number,
    updates: Partial<InsertEmotionRecord>
  ): Promise<EmotionRecord | undefined> {
    const record = this.emotionRecords.get(id);
    if (!record) return undefined;

    const updatedRecord = { ...record, ...updates };
    this.emotionRecords.set(id, updatedRecord);
    return updatedRecord;
  }

  async getCounselingSessionsByUser(
    userId: number
  ): Promise<CounselingSession[]> {
    return Array.from(this.counselingSessions.values()).filter(
      session => session.userId === userId
    );
  }

  async getCounselingSession(
    id: number
  ): Promise<CounselingSession | undefined> {
    return this.counselingSessions.get(id);
  }

  async createCounselingSession(
    insertSession: InsertCounselingSession
  ): Promise<CounselingSession> {
    const id = this.currentSessionId++;
    const session: CounselingSession = {
      ...insertSession,
      id,
      uid: `session_${id}`,
      sessionId: `session_${id}`,
      isActive: true,
      startedAt: new Date(),
      endedAt: null,
      createdAt: new Date(),
      topic: insertSession.topic ?? null,
      persona: insertSession.persona ?? null,
      personaType: insertSession.personaType ?? null,
      personaName: insertSession.personaName ?? null,
      personaDescription: insertSession.personaDescription ?? null,
      matchingRank: insertSession.matchingRank ?? null,
      reason: insertSession.reason ?? null,
      specialization: insertSession.specialization ?? null,
      approachMethod: insertSession.approachMethod ?? null,
      concernKeywords: insertSession.concernKeywords ?? null,
      selectedTones: insertSession.selectedTones ?? null,
      messageCount: insertSession.messageCount ?? null,
      summary: insertSession.summary ?? null,
    };
    this.counselingSessions.set(id, session);
    return session;
  }

  async updateCounselingSession(
    id: number,
    updates: Partial<InsertCounselingSession>
  ): Promise<CounselingSession | undefined> {
    const session = this.counselingSessions.get(id);
    if (!session) return undefined;

    const updatedSession = { ...session, ...updates };
    this.counselingSessions.set(id, updatedSession);
    return updatedSession;
  }

  async getChatMessagesBySession(sessionId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.sessionId === sessionId)
      .sort(
        (a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0)
      );
  }

  async createChatMessage(
    insertMessage: InsertChatMessage
  ): Promise<ChatMessage> {
    const id = this.currentMessageId++;
    const message: ChatMessage = {
      ...insertMessage,
      id,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getFeedbackLogsByUser(userId: number): Promise<FeedbackLog[]> {
    return Array.from(this.feedbackLogs.values()).filter(
      log => log.userId === userId
    );
  }

  async createFeedbackLog(
    insertFeedback: InsertFeedbackLog
  ): Promise<FeedbackLog> {
    const id = this.currentFeedbackId++;
    const feedback: FeedbackLog = {
      ...insertFeedback,
      id,
      timestamp: new Date(),
      createdAt: new Date(),
      category: insertFeedback.category ?? null,
      feedbackText: insertFeedback.feedbackText ?? null,
      comments: insertFeedback.comments ?? null,
    };
    this.feedbackLogs.set(id, feedback);
    return feedback;
  }

  async getPersonalityAssessmentsByUser(
    userId: number
  ): Promise<PersonalityAssessment[]> {
    return Array.from(this.personalityAssessments.values()).filter(
      assessment => assessment.userId === userId
    );
  }

  async createPersonalityAssessment(
    insertAssessment: InsertPersonalityAssessment
  ): Promise<PersonalityAssessment> {
    const id = this.currentAssessmentId++;
    const assessment: PersonalityAssessment = {
      ...insertAssessment,
      id,
      completedAt: new Date(),
    };
    this.personalityAssessments.set(id, assessment);
    return assessment;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getAllFeedbackLogs(): Promise<FeedbackLog[]> {
    return Array.from(this.feedbackLogs.values());
  }

  async getSystemStats(): Promise<{
    totalUsers: number;
    totalSessions: number;
    averageRating: number;
    totalEmotionRecords: number;
  }> {
    const totalUsers = this.users.size;
    const totalSessions = this.counselingSessions.size;
    const totalEmotionRecords = this.emotionRecords.size;

    const ratings = Array.from(this.feedbackLogs.values()).map(
      log => log.rating
    );
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : 0;

    return {
      totalUsers,
      totalSessions,
      averageRating: Math.round(averageRating * 10) / 10,
      totalEmotionRecords,
    };
  }
}

// Database storage implementation
import { db } from "./db";
import { eq, sql, and } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      return user || undefined;
    } catch (error) {
      console.error("getUserByEmail 오류:", error);
      return undefined;
    }
  }

  async getUserByUID(uid: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.uid, uid));
      return user || undefined;
    } catch (error) {
      console.error("getUserByUID 오류:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(
    id: number,
    updates: Partial<InsertUser>
  ): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getUserProfile(uid: string): Promise<UserProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.uid, uid))
      .limit(1);
    return profile;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [newProfile] = await db
      .insert(userProfiles)
      .values(profile)
      .returning();
    return newProfile;
  }

  async updateUserProfile(
    uid: string,
    updates: Partial<InsertUserProfile>
  ): Promise<UserProfile | undefined> {
    const [profile] = await db
      .update(userProfiles)
      .set(updates)
      .where(eq(userProfiles.uid, uid))
      .returning();
    return profile;
  }

  async getEmotionRecordsByUser(userId: number): Promise<EmotionRecord[]> {
    // userId를 통해 user의 uid를 찾고, 그 uid로 감정 기록 조회
    const user = await this.getUser(userId);
    if (!user) return [];
    return await db
      .select()
      .from(emotionRecords)
      .where(eq(emotionRecords.uid, user.uid));
  }

  async getEmotionRecordByDate(
    userId: number,
    date: string
  ): Promise<EmotionRecord | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    const [record] = await db
      .select()
      .from(emotionRecords)
      .where(
        and(eq(emotionRecords.uid, user.uid), eq(emotionRecords.date, date))
      );
    return record || undefined;
  }

  async createEmotionRecord(
    record: InsertEmotionRecord
  ): Promise<EmotionRecord> {
    const [created] = await db
      .insert(emotionRecords)
      .values(record)
      .returning();
    return created;
  }

  async updateEmotionRecord(
    id: number,
    updates: Partial<InsertEmotionRecord>
  ): Promise<EmotionRecord | undefined> {
    const [record] = await db
      .update(emotionRecords)
      .set(updates)
      .where(eq(emotionRecords.id, id))
      .returning();
    return record || undefined;
  }

  async getCounselingSessionsByUser(
    userId: number
  ): Promise<CounselingSession[]> {
    const user = await this.getUser(userId);
    if (!user) return [];
    return await db
      .select()
      .from(counselingSessions)
      .where(eq(counselingSessions.uid, user.uid));
  }

  async getCounselingSession(
    id: number
  ): Promise<CounselingSession | undefined> {
    const [session] = await db
      .select()
      .from(counselingSessions)
      .where(eq(counselingSessions.id, id));
    return session || undefined;
  }

  async createCounselingSession(
    session: InsertCounselingSession
  ): Promise<CounselingSession> {
    // userId로 uid 조회
    const user = await this.getUser(session.userId);
    if (!user) {
      throw new Error(`User with ID ${session.userId} not found`);
    }

    const sessionData = {
      ...session,
      uid: user.uid,
      sessionId: `session_${Date.now()}`,
      topic: session.concernKeywords
        ? session.concernKeywords.join(", ")
        : "일반 상담",
      persona: session.personaType || "strategic",
      isActive: true,
    };

    const [created] = await db
      .insert(counselingSessions)
      .values(sessionData)
      .returning();
    return created;
  }

  async updateCounselingSession(
    id: number,
    updates: Partial<InsertCounselingSession>
  ): Promise<CounselingSession | undefined> {
    const [session] = await db
      .update(counselingSessions)
      .set(updates)
      .where(eq(counselingSessions.id, id))
      .returning();
    return session || undefined;
  }

  async getChatMessagesBySession(sessionId: number): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId));
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [created] = await db.insert(chatMessages).values(message).returning();
    return created;
  }

  async getFeedbackLogsByUser(userId: number): Promise<FeedbackLog[]> {
    return await db
      .select()
      .from(feedbackLogs)
      .where(eq(feedbackLogs.userId, userId));
  }

  async createFeedbackLog(feedback: InsertFeedbackLog): Promise<FeedbackLog> {
    const [created] = await db
      .insert(feedbackLogs)
      .values(feedback)
      .returning();
    return created;
  }

  async getPersonalityAssessmentsByUser(
    userId: number
  ): Promise<PersonalityAssessment[]> {
    return await db
      .select()
      .from(personalityAssessments)
      .where(eq(personalityAssessments.userId, userId));
  }

  async createPersonalityAssessment(
    assessment: InsertPersonalityAssessment
  ): Promise<PersonalityAssessment> {
    const [created] = await db
      .insert(personalityAssessments)
      .values(assessment)
      .returning();
    return created;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getAllFeedbackLogs(): Promise<FeedbackLog[]> {
    return await db.select().from(feedbackLogs);
  }

  async getSystemStats(): Promise<{
    totalUsers: number;
    totalSessions: number;
    averageRating: number;
    totalEmotionRecords: number;
  }> {
    const [userCount] = await db.select({ count: sql`count(*)` }).from(users);
    const [sessionCount] = await db
      .select({ count: sql`count(*)` })
      .from(counselingSessions);
    const [emotionCount] = await db
      .select({ count: sql`count(*)` })
      .from(emotionRecords);
    const [avgRating] = await db
      .select({ avg: sql`avg(rating)` })
      .from(feedbackLogs);

    return {
      totalUsers: parseInt(userCount.count as string),
      totalSessions: parseInt(sessionCount.count as string),
      averageRating: parseFloat(avgRating.avg as string) || 0,
      totalEmotionRecords: parseInt(emotionCount.count as string),
    };
  }

  async getScheduleAppointmentsByUser(
    userId: number
  ): Promise<ScheduleAppointment[]> {
    return await db
      .select()
      .from(scheduleAppointments)
      .where(eq(scheduleAppointments.userId, userId));
  }

  async getScheduleAppointmentsByDate(
    userId: number,
    date: string
  ): Promise<ScheduleAppointment[]> {
    return await db
      .select()
      .from(scheduleAppointments)
      .where(
        sql`${scheduleAppointments.userId} = ${userId} AND ${scheduleAppointments.date} = ${date}`
      );
  }

  async getScheduleAppointment(
    id: number
  ): Promise<ScheduleAppointment | undefined> {
    const [appointment] = await db
      .select()
      .from(scheduleAppointments)
      .where(eq(scheduleAppointments.id, id));
    return appointment || undefined;
  }

  async createScheduleAppointment(
    appointment: InsertScheduleAppointment
  ): Promise<ScheduleAppointment> {
    const [created] = await db
      .insert(scheduleAppointments)
      .values(appointment)
      .returning();
    return created;
  }

  async updateScheduleAppointment(
    id: number,
    updates: Partial<InsertScheduleAppointment>
  ): Promise<ScheduleAppointment | undefined> {
    const [updated] = await db
      .update(scheduleAppointments)
      .set(updates)
      .where(eq(scheduleAppointments.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteScheduleAppointment(id: number): Promise<boolean> {
    const result = await db
      .delete(scheduleAppointments)
      .where(eq(scheduleAppointments.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Content management methods
  async getAllContentItems(): Promise<ContentItem[]> {
    return await db.select().from(contentItems);
  }

  async createContentItem(item: InsertContentItem): Promise<ContentItem> {
    const [created] = await db.insert(contentItems).values(item).returning();
    return created;
  }

  async updateContentItem(
    id: number,
    updates: Partial<InsertContentItem>
  ): Promise<ContentItem | undefined> {
    const [updated] = await db
      .update(contentItems)
      .set(updates)
      .where(eq(contentItems.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteContentItem(id: number): Promise<boolean> {
    const result = await db.delete(contentItems).where(eq(contentItems.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Notification methods
  async createNotification(
    notification: InsertNotification
  ): Promise<Notification> {
    const [created] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return created;
  }

  async getAllNotifications(): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .orderBy(sql`${notifications.createdAt} DESC`);
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(sql`${notifications.createdAt} DESC`);
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Customer Inquiries
  async createCustomerInquiry(
    inquiry: InsertCustomerInquiry
  ): Promise<CustomerInquiry> {
    const [created] = await db
      .insert(customerInquiries)
      .values(inquiry)
      .returning();
    return created;
  }

  async getAllCustomerInquiries(): Promise<CustomerInquiry[]> {
    return await db
      .select()
      .from(customerInquiries)
      .orderBy(sql`${customerInquiries.createdAt} DESC`);
  }

  async getCustomerInquiry(id: number): Promise<CustomerInquiry | undefined> {
    const [inquiry] = await db
      .select()
      .from(customerInquiries)
      .where(eq(customerInquiries.id, id));
    return inquiry;
  }

  async updateCustomerInquiry(
    id: number,
    updates: Partial<InsertCustomerInquiry>
  ): Promise<CustomerInquiry | undefined> {
    const [updated] = await db
      .update(customerInquiries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customerInquiries.id, id))
      .returning();
    return updated;
  }

  async replyToCustomerInquiry(
    id: number,
    reply: string
  ): Promise<CustomerInquiry | undefined> {
    const [updated] = await db
      .update(customerInquiries)
      .set({
        adminReply: reply,
        status: "resolved",
        repliedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(customerInquiries.id, id))
      .returning();
    return updated;
  }

  async deleteCustomerInquiry(id: number): Promise<boolean> {
    try {
      // 먼저 문의가 존재하는지 확인
      const inquiry = await this.getCustomerInquiry(id);
      if (!inquiry) {
        console.log(`Customer inquiry with id ${id} not found`);
        return false;
      }

      const result = await db
        .delete(customerInquiries)
        .where(eq(customerInquiries.id, id));

      console.log(`Customer inquiry ${id} deleted successfully`);
      return true;
    } catch (error) {
      console.error("Error deleting customer inquiry:", error);
      return false;
    }
  }

  async deleteUserData(userId: number): Promise<boolean> {
    try {
      // Delete all user-related data in a transaction
      await db.transaction(async tx => {
        // Delete user's chat messages first (foreign key dependency)
        const userSessions = await tx
          .select({ id: counselingSessions.id })
          .from(counselingSessions)
          .where(eq(counselingSessions.userId, userId));

        for (const session of userSessions) {
          await tx
            .delete(chatMessages)
            .where(eq(chatMessages.sessionId, session.id));
        }

        // Delete user's counseling sessions
        await tx
          .delete(counselingSessions)
          .where(eq(counselingSessions.userId, userId));

        // Delete user's emotion records
        await tx
          .delete(emotionRecords)
          .where(eq(emotionRecords.userId, userId));

        // Delete user's feedback logs
        await tx.delete(feedbackLogs).where(eq(feedbackLogs.userId, userId));

        // Delete user's personality assessments
        await tx
          .delete(personalityAssessments)
          .where(eq(personalityAssessments.userId, userId));

        // Delete user's schedule appointments
        await tx
          .delete(scheduleAppointments)
          .where(eq(scheduleAppointments.userId, userId));

        // Delete user's notifications
        await tx.delete(notifications).where(eq(notifications.userId, userId));

        // Delete user's customer inquiries
        await tx
          .delete(customerInquiries)
          .where(eq(customerInquiries.userId, userId));

        // Delete user's feedback
        await tx.delete(userFeedback).where(eq(userFeedback.userId, userId));

        // Finally delete the user
        await tx.delete(users).where(eq(users.id, userId));
      });

      return true;
    } catch (error) {
      console.error("Error deleting user data:", error);
      return false;
    }
  }

  // User Feedback operations
  async createUserFeedback(
    feedback: InsertUserFeedback
  ): Promise<UserFeedback> {
    const [newFeedback] = await db
      .insert(userFeedback)
      .values(feedback)
      .returning();
    return newFeedback;
  }

  async getUserFeedback(): Promise<UserFeedback[]> {
    return await db.select().from(userFeedback).orderBy(userFeedback.createdAt);
  }

  // Notification operations
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(notifications.createdAt);
  }

  // User notification settings
  async getUserNotificationSettings(
    userId: number
  ): Promise<UserNotificationSettings | undefined> {
    const [settings] = await db
      .select()
      .from(userNotificationSettings)
      .where(eq(userNotificationSettings.userId, userId));
    return settings;
  }

  async createUserNotificationSettings(
    settings: InsertUserNotificationSettings
  ): Promise<UserNotificationSettings> {
    const [newSettings] = await db
      .insert(userNotificationSettings)
      .values(settings)
      .returning();
    return newSettings;
  }

  async updateUserNotificationSettings(
    userId: number,
    updates: Partial<InsertUserNotificationSettings>
  ): Promise<UserNotificationSettings | undefined> {
    const [updatedSettings] = await db
      .update(userNotificationSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userNotificationSettings.userId, userId))
      .returning();
    return updatedSettings;
  }

  // Notification lifecycle management methods
  async extendNotificationExpiry(
    id: number,
    extensionDays: number
  ): Promise<boolean> {
    try {
      const [notification] = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, id));

      if (!notification) {
        return false;
      }

      // Calculate new expiry date
      const currentExpiry = notification.expiresAt || new Date();
      const newExpiry = new Date(
        currentExpiry.getTime() + extensionDays * 24 * 60 * 60 * 1000
      );

      const result = await db
        .update(notifications)
        .set({
          expiresAt: newExpiry,
          status: "active", // Ensure it's marked as active when extended
        })
        .where(eq(notifications.id, id));

      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error extending notification expiry:", error);
      return false;
    }
  }

  async terminateNotification(id: number): Promise<boolean> {
    try {
      const result = await db
        .update(notifications)
        .set({
          status: "expired",
          expiresAt: new Date(), // Set expiry to now
        })
        .where(eq(notifications.id, id));

      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error terminating notification:", error);
      return false;
    }
  }

  async deleteNotification(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(notifications)
        .where(eq(notifications.id, id));

      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error deleting notification:", error);
      return false;
    }
  }

  async getActiveNotifications(): Promise<Notification[]> {
    try {
      const now = new Date();
      return await db
        .select()
        .from(notifications)
        .where(
          sql`(${notifications.status} = 'active' OR ${notifications.status} IS NULL) AND 
              (${notifications.expiresAt} IS NULL OR ${notifications.expiresAt} > ${now})`
        )
        .orderBy(sql`${notifications.createdAt} DESC`);
    } catch (error) {
      console.error("Error fetching active notifications:", error);
      return [];
    }
  }

  async getExpiredNotifications(): Promise<Notification[]> {
    try {
      const now = new Date();
      return await db
        .select()
        .from(notifications)
        .where(
          sql`${notifications.status} = 'expired' OR 
              (${notifications.expiresAt} IS NOT NULL AND ${notifications.expiresAt} <= ${now})`
        )
        .orderBy(sql`${notifications.createdAt} DESC`);
    } catch (error) {
      console.error("Error fetching expired notifications:", error);
      return [];
    }
  }

  async getWeeklyReportData(
    startDate: Date,
    endDate: Date
  ): Promise<{
    withdrawalReasons: { reason: string; count: number }[];
    userReviews: { rating: number; content: string; date: string }[];
    signupMetrics: { signups: number; withdrawals: number; retention: number };
    revenueFlow: { revenue: number; subscriptions: number; churn: number };
    demographics: {
      gender: { male: number; female: number };
      age: { [key: string]: number };
    };
  }> {
    try {
      // Get user feedback for reviews (탈퇴 사유 및 사용 후기)
      const feedbackQuery = await db
        .select()
        .from(userFeedback)
        .where(
          sql`${userFeedback.createdAt} >= ${startDate} AND ${userFeedback.createdAt} <= ${endDate}`
        );

      const withdrawalReasons = feedbackQuery
        .filter(f => f.category === "withdrawal")
        .reduce(
          (acc, f) => {
            const reason = f.message || "기타";
            const existing = acc.find(r => r.reason === reason);
            if (existing) {
              existing.count++;
            } else {
              acc.push({ reason, count: 1 });
            }
            return acc;
          },
          [] as { reason: string; count: number }[]
        );

      const userReviews = feedbackQuery
        .filter(f => f.category === "review" && f.rating !== null)
        .map(f => ({
          rating: f.rating || 0,
          content: f.message || "",
          date: f.createdAt?.toISOString().split("T")[0] || "",
        }));

      // Get signup/withdrawal metrics
      const allUsersInPeriod = await db
        .select()
        .from(users)
        .where(
          sql`${users.createdAt} >= ${startDate} AND ${users.createdAt} <= ${endDate}`
        );

      const signups = allUsersInPeriod.length;
      const withdrawals = feedbackQuery.filter(
        f => f.category === "withdrawal"
      ).length;
      const retention =
        signups > 0 ? Math.round(((signups - withdrawals) / signups) * 100) : 0;

      // Get revenue flow (프리미엄 구독 기반)
      const premiumUsers = await db
        .select()
        .from(users)
        .where(
          sql`${users.subscriptionType} = 'premium' AND ${users.subscriptionStartDate} >= ${startDate} AND ${users.subscriptionStartDate} <= ${endDate}`
        );

      const subscriptions = premiumUsers.length;
      const revenue = subscriptions * 9900; // 월 구독료 9,900원 기준
      const churn =
        subscriptions > 0 ? Math.round((withdrawals / subscriptions) * 100) : 0;

      // Get demographics
      const allUsers = await db.select().from(users);

      const genderCounts = allUsers.reduce(
        (acc, user) => {
          if (user.gender === "male") acc.male++;
          else if (user.gender === "female") acc.female++;
          return acc;
        },
        { male: 0, female: 0 }
      );

      const currentYear = new Date().getFullYear();
      const ageGroups = allUsers.reduce(
        (acc, user) => {
          if (user.birthDate) {
            const birthYear = new Date(user.birthDate).getFullYear();
            const age = currentYear - birthYear;

            let ageGroup = "";
            if (age < 20) ageGroup = "10대";
            else if (age < 30) ageGroup = "20대";
            else if (age < 40) ageGroup = "30대";
            else if (age < 50) ageGroup = "40대";
            else if (age < 60) ageGroup = "50대";
            else ageGroup = "60대+";

            acc[ageGroup] = (acc[ageGroup] || 0) + 1;
          }
          return acc;
        },
        {} as { [key: string]: number }
      );

      return {
        withdrawalReasons,
        userReviews,
        signupMetrics: { signups, withdrawals, retention },
        revenueFlow: { revenue, subscriptions, churn },
        demographics: { gender: genderCounts, age: ageGroups },
      };
    } catch (error) {
      console.error("Error fetching weekly report data:", error);
      return {
        withdrawalReasons: [],
        userReviews: [],
        signupMetrics: { signups: 0, withdrawals: 0, retention: 0 },
        revenueFlow: { revenue: 0, subscriptions: 0, churn: 0 },
        demographics: { gender: { male: 0, female: 0 }, age: {} },
      };
    }
  }

  async createWeeklyReport(report: InsertWeeklyReport): Promise<WeeklyReport> {
    try {
      const [newReport] = await db
        .insert(weeklyReports)
        .values(report)
        .returning();
      return newReport;
    } catch (error) {
      console.error("Error creating weekly report:", error);
      throw new Error("Failed to create weekly report");
    }
  }

  async getWeeklyReports(): Promise<WeeklyReport[]> {
    try {
      return await db
        .select()
        .from(weeklyReports)
        .orderBy(sql`${weeklyReports.createdAt} DESC`);
    } catch (error) {
      console.error("Error fetching weekly reports:", error);
      return [];
    }
  }

  async getWeeklyReport(id: number): Promise<WeeklyReport | undefined> {
    try {
      const [report] = await db
        .select()
        .from(weeklyReports)
        .where(eq(weeklyReports.id, id));
      return report || undefined;
    } catch (error) {
      console.error("Error fetching weekly report:", error);
      return undefined;
    }
  }

  // Admin account management methods
  async getAllAdmins(): Promise<Admin[]> {
    try {
      return await db.select().from(admins).orderBy(admins.createdAt);
    } catch (error) {
      console.error("Error fetching admins:", error);
      return [];
    }
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    try {
      const [newAdmin] = await db.insert(admins).values(admin).returning();
      return newAdmin;
    } catch (error) {
      console.error("Error creating admin:", error);
      throw new Error("Failed to create admin");
    }
  }

  async updateAdmin(
    adminId: string,
    updates: Partial<InsertAdmin>
  ): Promise<Admin | undefined> {
    try {
      const [updatedAdmin] = await db
        .update(admins)
        .set(updates)
        .where(eq(admins.adminId, adminId))
        .returning();
      return updatedAdmin;
    } catch (error) {
      console.error("Error updating admin:", error);
      return undefined;
    }
  }

  async deleteAdmin(adminId: string): Promise<boolean> {
    try {
      await db.transaction(async tx => {
        // Delete admin permissions first
        await tx
          .delete(adminPermissions)
          .where(eq(adminPermissions.adminId, adminId));

        // Then delete admin
        await tx.delete(admins).where(eq(admins.adminId, adminId));
      });
      return true;
    } catch (error) {
      console.error("Error deleting admin:", error);
      return false;
    }
  }

  async getAdminPermissions(adminId: string): Promise<AdminPermission[]> {
    try {
      return await db
        .select()
        .from(adminPermissions)
        .where(eq(adminPermissions.adminId, adminId))
        .orderBy(adminPermissions.createdAt);
    } catch (error) {
      console.error("Error fetching admin permissions:", error);
      return [];
    }
  }

  async createAdminPermission(
    permission: InsertAdminPermission
  ): Promise<AdminPermission> {
    try {
      const [newPermission] = await db
        .insert(adminPermissions)
        .values(permission)
        .returning();
      return newPermission;
    } catch (error) {
      console.error("Error creating admin permission:", error);
      throw new Error("Failed to create admin permission");
    }
  }

  async updateAdminPermissions(
    adminId: string,
    permissions: AdminPermission[]
  ): Promise<void> {
    try {
      await db.transaction(async tx => {
        // Delete existing permissions
        await tx
          .delete(adminPermissions)
          .where(eq(adminPermissions.adminId, adminId));

        // Insert new permissions
        if (permissions.length > 0) {
          await tx.insert(adminPermissions).values(
            permissions.map(p => ({
              adminId,
              permission: p.permission,
              granted: p.granted,
            }))
          );
        }
      });
    } catch (error) {
      console.error("Error updating admin permissions:", error);
      throw new Error("Failed to update admin permissions");
    }
  }
}

export const storage = new DatabaseStorage();
