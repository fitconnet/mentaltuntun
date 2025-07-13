// Module declarations for passport strategies
declare module 'passport-kakao' {
  import { Strategy as PassportStrategy } from 'passport-strategy';
  
  export interface Profile {
    id: string;
    username?: string;
    displayName?: string;
    emails?: Array<{ value: string }>;
    photos?: Array<{ value: string }>;
    _json?: any;
  }

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
  }

  export class Strategy extends PassportStrategy {
    constructor(
      options: StrategyOptions,
      verify: (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (error: any, user?: any) => void
      ) => void
    );
  }
}

declare module 'passport-naver' {
  import { Strategy as PassportStrategy } from 'passport-strategy';
  
  export interface Profile {
    id: string;
    username?: string;
    displayName?: string;
    emails?: Array<{ value: string }>;
    photos?: Array<{ value: string }>;
    _json?: any;
  }

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
  }

  export class Strategy extends PassportStrategy {
    constructor(
      options: StrategyOptions,
      verify: (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (error: any, user?: any) => void
      ) => void
    );
  }
}

declare global {
  var verificationCodes: Map<string, { code: string; expiry: number }>;
  
  namespace NodeJS {
    interface Global {
      verificationCodes: Map<string, { code: string; expiry: number }>;
    }
  }
}

// Express 요청 타입 확장
declare module 'express' {
  interface Request {
    user?: import('@shared/schema').User;
    isAuthenticated?: () => boolean;
  }
}

export {}; 