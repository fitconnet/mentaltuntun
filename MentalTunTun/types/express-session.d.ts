import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    email?: string;
    isAdmin?: boolean;
    firebaseToken?: string;
    lastActivity?: Date;
    admin?: {
      userId: string;
      email: string;
      name: string;
      role: string;
    } | null;
    user?: {
      id: string;
      uid: string;
      email: string;
      name: string;
      [key: string]: any;
    } | null;
    adminId?: string;
    adminTimestamp?: number;
  }
}

declare global {
  namespace Express {
    interface Request {
      sessionID: string;
      session: import('express-session').Session & Partial<import('express-session').SessionData>;
    }
  }
}

export {}; 