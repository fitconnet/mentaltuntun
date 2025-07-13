import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    email?: string;
    isAdmin?: boolean;
    firebaseToken?: string;
    lastActivity?: Date;
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