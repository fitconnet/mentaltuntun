import { apiRequest, queryClient } from "./queryClient";

// Re-export apiRequest for convenience
export { apiRequest };
import type {
  User,
  EmotionRecord,
  CounselingSession,
  ChatMessage,
  PersonaRecommendation,
  PersonaPreferences,
} from "../types";

// Auth API
export const authApi = {
  login: async (email: string): Promise<{ user: User }> => {
    const response = await apiRequest("POST", "/api/auth/login", { email });
    return response.json();
  },

  loginWithPassword: async (
    email: string,
    password: string
  ): Promise<{ user: User }> => {
    const response = await apiRequest("POST", "/api/auth/login-password", {
      email,
      password,
    });
    return response.json();
  },

  signup: async (
    name: string,
    email: string,
    password: string
  ): Promise<{ user: User }> => {
    const response = await apiRequest("POST", "/api/auth/signup", {
      name,
      email,
      password,
    });
    return response.json();
  },

  adminLogin: async (
    adminId: string,
    password: string
  ): Promise<{ success: boolean; admin: any }> => {
    const response = await apiRequest("POST", "/api/auth/admin-login", {
      adminId,
      password,
    });
    return response.json();
  },

  sendVerificationCode: async (
    phone: string
  ): Promise<{ success: boolean; message: string; devCode?: string }> => {
    const response = await apiRequest("POST", "/api/auth/send-verification", {
      phone,
    });
    return response.json();
  },

  verifyCode: async (
    phone: string,
    code: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiRequest("POST", "/api/auth/verify-code", {
      phone,
      code,
    });
    return response.json();
  },

  getCurrentUser: async (): Promise<{ user: User }> => {
    const response = await apiRequest("GET", "/api/auth/me");
    return response.json();
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await apiRequest("POST", "/api/auth/logout");
    return response.json();
  },
};

// User API
export const userApi = {
  getUser: async (id: number): Promise<User> => {
    const response = await apiRequest("GET", `/api/users/${id}`);
    return response.json();
  },

  updateUser: async (id: number, updates: Partial<User>): Promise<User> => {
    const response = await apiRequest("PUT", `/api/users/${id}`, updates);
    return response.json();
  },
};

// Emotion API
export const emotionApi = {
  getEmotions: async (userId: number): Promise<EmotionRecord[]> => {
    const response = await apiRequest("GET", `/api/users/${userId}/emotions`);
    return response.json();
  },

  createEmotion: async (
    userId: number,
    data: {
      date: string;
      emotions: string[];
      note?: string;
    }
  ): Promise<EmotionRecord> => {
    const response = await apiRequest(
      "POST",
      `/api/users/${userId}/emotions`,
      data
    );
    return response.json();
  },

  getEmotionByDate: async (
    userId: number,
    date: string
  ): Promise<EmotionRecord | null> => {
    const response = await apiRequest(
      "GET",
      `/api/users/${userId}/emotions/${date}`
    );
    return response.json();
  },
};

// Personality API
export const personalityApi = {
  analyzePersonality: async (
    userId: number,
    data: {
      interests: string[];
      worldcupResults: any[];
    }
  ) => {
    const response = await apiRequest(
      "POST",
      `/api/users/${userId}/personality/analyze`,
      data
    );
    return response.json();
  },

  getAssessments: async (userId: number) => {
    const response = await apiRequest(
      "GET",
      `/api/users/${userId}/personality`
    );
    return response.json();
  },

  getReport: async (userId: number) => {
    const response = await apiRequest(
      "GET",
      `/api/users/${userId}/personality/report`
    );
    return response.json();
  },

  getDetailedAnalysis: async (userId: number) => {
    const response = await apiRequest(
      "GET",
      `/api/users/${userId}/personality/detailed`
    );
    return response.json();
  },

  getRealtimeAnalysis: async (userId: number) => {
    const response = await apiRequest(
      "GET",
      `/api/users/${userId}/analysis/realtime`
    );
    return response.json();
  },
};

// Counseling API
export const counselingApi = {
  getRecommendations: async (
    userId: number,
    concernKeywords: string[],
    personaPreferences?: PersonaPreferences
  ): Promise<PersonaRecommendation[]> => {
    const response = await apiRequest(
      "POST",
      `/api/users/${userId}/counseling/recommendations`,
      {
        concernKeywords,
        personaPreferences,
      }
    );
    return response.json();
  },

  createSession: async (
    userId: number,
    data: {
      personaType: string;
      concernKeywords: string[];
    }
  ): Promise<CounselingSession> => {
    const response = await apiRequest(
      "POST",
      `/api/users/${userId}/counseling/sessions`,
      data
    );
    return response.json();
  },

  getSessions: async (userId: number): Promise<CounselingSession[]> => {
    const response = await apiRequest(
      "GET",
      `/api/users/${userId}/counseling/sessions`
    );
    return response.json();
  },

  endSession: async (
    sessionId: number
  ): Promise<{ message: string; session: CounselingSession }> => {
    const response = await apiRequest(
      "PUT",
      `/api/counseling/sessions/${sessionId}/end`
    );
    return response.json();
  },
};

// Chat API
export const chatApi = {
  getMessages: async (sessionId: number): Promise<ChatMessage[]> => {
    const response = await apiRequest(
      "GET",
      `/api/sessions/${sessionId}/messages`
    );
    return response.json();
  },

  sendMessage: async (
    sessionId: number,
    content: string
  ): Promise<{
    userMessage: ChatMessage;
    assistantMessage: ChatMessage;
    suggestedFollowUps: string[];
  }> => {
    const response = await apiRequest(
      "POST",
      `/api/sessions/${sessionId}/messages`,
      {
        content,
        role: "user",
      }
    );
    return response.json();
  },

  sendWelcomeMessage: async (
    sessionId: number,
    content: string
  ): Promise<ChatMessage> => {
    const response = await apiRequest(
      "POST",
      `/api/sessions/${sessionId}/welcome`,
      {
        content,
      }
    );
    return response.json();
  },
};

// Feedback API
export const feedbackApi = {
  submitFeedback: async (data: {
    userId: number;
    sessionId: number;
    messageId: number;
    rating: number;
    feedbackText?: string;
    personaType: string;
  }) => {
    const response = await apiRequest("POST", "/api/feedback", data);
    return response.json();
  },
};

// Admin API
export const adminApi = {
  getStats: async () => {
    const response = await apiRequest("GET", "/api/admin/stats");
    return response.json();
  },

  getUsers: async () => {
    const response = await apiRequest("GET", "/api/admin/users");
    return response.json();
  },

  getFeedback: async () => {
    const response = await apiRequest("GET", "/api/admin/feedback");
    return response.json();
  },
};

// Cache invalidation helpers
export const invalidateCache = {
  user: (userId: number) => {
    queryClient.invalidateQueries({ queryKey: ["/api/users", userId] });
  },

  emotions: (userId: number) => {
    queryClient.invalidateQueries({
      queryKey: ["/api/users", userId, "emotions"],
    });
  },

  sessions: (userId: number) => {
    queryClient.invalidateQueries({
      queryKey: ["/api/users", userId, "counseling", "sessions"],
    });
  },

  messages: (sessionId: number) => {
    queryClient.invalidateQueries({
      queryKey: ["/api/sessions", sessionId, "messages"],
    });
  },
};
