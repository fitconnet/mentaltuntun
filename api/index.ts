import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import path from 'path';
// import { registerRoutes } from '../server/routes';
// import { firebaseInitialized } from '../server/firebase-admin';
import '../types/express-session';

console.log("🎯 api/index.ts started - Function initialization");
console.log("🔧 Initial environment:", {
  NODE_ENV: process.env.NODE_ENV,
  timestamp: new Date().toISOString(),
  runtime: process.version
});

const app = express();

// 최우선 전역 요청 로깅 (모든 미들웨어보다 먼저)
app.use((req, res, next) => {
  const startTime = Date.now();
  console.log(`▶ Request started: ${req.method} ${req.url}`, {
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    headers: Object.keys(req.headers)
  });

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`◀ Request finished: ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });

  res.on('error', (err) => {
    console.error(`💥 Response error for ${req.method} ${req.url}:`, err);
  });

  next();
});

// 미들웨어 설정
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? true  // 프로덕션에서는 모든 origin 허용 (Vercel에서 자동 처리)
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  const startTime = Date.now();
  console.log(`📥 ${req.method} ${req.url}`, {
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    referer: req.get('Referer')
  });

  // 응답 완료 시 로깅
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`📤 ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });

  next();
});

// Session 미들웨어 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'mental-tun-tun-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// 환경변수 안전 체크 (확장된 체크리스트)
console.log("🔍 Starting comprehensive environment variable check...");

const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY'
];

const optionalEnvVars = [
  'SESSION_SECRET',
  'OPENAI_API_KEY',
  'DATABASE_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'KAKAO_CLIENT_ID',
  'KAKAO_CLIENT_SECRET',
  'NAVER_CLIENT_ID',
  'NAVER_CLIENT_SECRET'
];

// 상세한 환경변수 체크
const envStatus = {
  required: {} as Record<string, any>,
  optional: {} as Record<string, any>,
  total: Object.keys(process.env).length
};

requiredEnvVars.forEach(env => {
  const value = process.env[env];
  envStatus.required[env] = {
    exists: !!value,
    length: value ? value.length : 0,
    preview: value ? `${value.substring(0, 10)}...` : 'NOT_SET'
  };
});

optionalEnvVars.forEach(env => {
  const value = process.env[env];
  envStatus.optional[env] = {
    exists: !!value,
    length: value ? value.length : 0
  };
});

const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);
const missingOptionalEnvVars = optionalEnvVars.filter(env => !process.env[env]);

console.log('🔧 Detailed environment status:', envStatus);

if (missingEnvVars.length > 0) {
  console.error(`❌ CRITICAL: Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('❌ This will cause runtime failures for Firebase and authentication!');
}

if (missingOptionalEnvVars.length > 0) {
  console.warn(`⚠️  Missing optional environment variables: ${missingOptionalEnvVars.join(', ')}`);
  console.warn('⚠️  Some additional features may not work properly');
}

// Firebase 초기화 상태 추가 체크 (임시로 비활성화)
const firebaseInitialized = false; // 임시로 false로 설정
console.log('🔧 Service initialization status:', {
  NODE_ENV: process.env.NODE_ENV,
  hasFirebase: !!process.env.FIREBASE_PROJECT_ID,
  firebaseInitialized: firebaseInitialized,
  hasOpenAI: !!process.env.OPENAI_API_KEY,
  hasDatabase: !!process.env.DATABASE_URL,
  hasSession: !!process.env.SESSION_SECRET,
  timestamp: new Date().toISOString(),
  processId: process.pid,
  platform: process.platform,
  arch: process.arch
});

// 헬스체크 엔드포인트 (라우터 등록 전에 추가)
app.get('/health', (req, res) => {
  console.log('✨ Health check request:', req.method, req.url);
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {
      firebase: firebaseInitialized,
      session: !!process.env.SESSION_SECRET,
      database: !!process.env.DATABASE_URL,
      openai: !!process.env.OPENAI_API_KEY
    }
  });
});

// 간단한 테스트 엔드포인트 (강화된 에러 핸들링)
app.get('/api/test', async (req, res) => {
  console.log('✨ Test API request:', req.method, req.url);
  try {
    console.log('🔧 Test API - Headers count:', Object.keys(req.headers).length);
    console.log('🔧 Test API - Query params:', req.query);
    console.log('🔧 Test API - Path:', req.path);
    console.log('🔧 Test API - Processing...');

    const response = {
      ok: true,
      message: 'API is working perfectly!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      path: req.path,
      method: req.method,
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };

    console.log('✅ Test API - Response ready:', { ok: response.ok, timestamp: response.timestamp });
    res.json(response);
  } catch (err) {
    console.error('💥 CRITICAL Error in test handler:', {
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
      name: err instanceof Error ? err.name : 'UnknownError',
      timestamp: new Date().toISOString(),
      url: req.url,
      method: req.method
    });
    res.status(500).json({
      error: 'Internal error in test endpoint',
      message: err instanceof Error ? err.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// 환경변수 테스트 엔드포인트
app.get('/api/env-test', async (req, res) => {
  console.log('✨ Environment test request:', req.method, req.url);
  try {
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      hasFirebase: !!process.env.FIREBASE_PROJECT_ID,
      hasSession: !!process.env.SESSION_SECRET,
      hasDatabase: !!process.env.DATABASE_URL,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      firebaseInitialized: firebaseInitialized,
      // 민감한 정보는 마스킹
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID?.substring(0, 10) + '...',
      sessionSecret: process.env.SESSION_SECRET ? 'SET' : 'NOT_SET'
    };

    console.log('🔧 Environment check result:', envCheck);

    res.json({
      ok: true,
      environment: envCheck,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('💥 Error in env-test handler:', err);
    res.status(500).json({ error: 'Internal error in env-test endpoint' });
  }
});

// Firebase 연결 테스트 엔드포인트
app.get('/api/firebase-test', async (req, res) => {
  console.log('✨ Firebase test request:', req.method, req.url);
  try {
    if (!firebaseInitialized) {
      console.log('🔧 Firebase not initialized, returning error');
      return res.status(503).json({
        ok: false,
        error: 'Firebase not initialized',
        reason: 'Missing environment variables',
        timestamp: new Date().toISOString()
      });
    }

    // Firebase Admin SDK 기본 테스트
    const { admin } = await import('../server/firebase-admin');
    console.log('🔧 Testing Firebase Admin SDK...');

    // 간단한 Firebase 상태 확인
    const app = admin.app();
    console.log('🔧 Firebase app:', app.name);

    res.json({
      ok: true,
      firebase: {
        initialized: true,
        appName: app.name,
        projectId: app.options.projectId,
        hasAuth: !!admin.auth,
        hasFirestore: !!admin.firestore
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('💥 Error in firebase-test handler:', err);
    res.status(500).json({
      ok: false,
      error: 'Firebase test failed',
      message: err instanceof Error ? err.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// 직접 API 호출 테스트용 엔드포인트 (curl 테스트용)
app.get('/api/index', async (req, res) => {
  console.log('✨ Direct API index test:', req.method, req.url);
  try {
    console.log('🔧 API Index - Starting comprehensive check...');

    // 모든 시스템 상태 체크
    const systemStatus = {
      server: {
        running: true,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasRequiredEnvVars: requiredEnvVars.every(env => !!process.env[env]),
        missingRequired: requiredEnvVars.filter(env => !process.env[env]),
        optionalEnvCount: optionalEnvVars.filter(env => !!process.env[env]).length
      },
      services: {
        firebase: firebaseInitialized,
        session: !!process.env.SESSION_SECRET,
        database: !!process.env.DATABASE_URL,
        openai: !!process.env.OPENAI_API_KEY
      },
      request: {
        method: req.method,
        url: req.url,
        headers: Object.keys(req.headers).length,
        userAgent: req.get('User-Agent')
      }
    };

    console.log('✅ API Index - System status compiled successfully');

    res.json({
      ok: true,
      message: 'Vercel Serverless Function is running perfectly!',
      status: systemStatus,
      availableEndpoints: [
        'GET /health',
        'GET /api/test',
        'GET /api/env-test',
        'GET /api/firebase-test',
        'GET /api/index'
      ]
    });

  } catch (err) {
    console.error('💥 CRITICAL Error in API index handler:', {
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
      name: err instanceof Error ? err.name : 'UnknownError',
      timestamp: new Date().toISOString(),
      url: req.url,
      method: req.method
    });

    res.status(500).json({
      ok: false,
      error: 'Critical error in API index',
      message: err instanceof Error ? err.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      troubleshooting: [
        'Check Vercel Runtime Logs',
        'Verify environment variables',
        'Check Firebase initialization'
      ]
    });
  }
});

// 정적 파일 서빙 (빌드된 프론트엔드) - Vercel 환경에서는 자동 처리됨
if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(path.join(__dirname, '../dist/public')));
}

// 인증 없는 공용 엔드포인트들을 API 라우터 등록 전에 우선 정의
app.get('/public-health', (req, res) => {
  console.log('✨ Public health check:', req.method, req.url);
  res.json({
    status: 'OK',
    message: 'Public health check endpoint working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.get('/api/public-test', (req, res) => {
  console.log('✨ Public test endpoint:', req.method, req.url);
  res.json({
    message: 'Public API endpoint working!',
    timestamp: new Date().toISOString(),
    status: 'accessible'
  });
});

// API 라우터 등록 (임시로 주석 처리 - 디버깅용)
/*
try {
  console.log('🔧 Registering API routes...');
  registerRoutes(app);
  console.log('✅ API routes registered successfully');
} catch (error) {
  console.error('❌ Routes registration failed:', {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });

  // 라우터 등록 실패 시 기본 에러 핸들러 추가
  app.use('/api/*', (req, res) => {
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'API routes are currently unavailable',
      timestamp: new Date().toISOString()
    });
  });
}
*/

// 테스트 엔드포인트들을 registerRoutes 후에 재정의 (인증 우회)
app.get('/health', (req, res) => {
  console.log('✨ Health check request (post-routes):', req.method, req.url);
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {
      firebase: firebaseInitialized,
      session: !!process.env.SESSION_SECRET,
      database: !!process.env.DATABASE_URL,
      openai: !!process.env.OPENAI_API_KEY
    }
  });
});

app.get('/api/test', async (req, res) => {
  console.log('✨ Test API request (post-routes):', req.method, req.url);
  try {
    const testData = {
      message: 'API is working perfectly!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      serverInfo: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      },
      requestInfo: {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }
    };

    console.log('✅ Test API - Response data prepared successfully');
    res.json(testData);
  } catch (err) {
    console.error('💥 Error in test handler (post-routes):', err);
    res.status(500).json({
      error: 'Internal error in test endpoint',
      message: err instanceof Error ? err.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// 404 API 에러 핸들러 (SPA 라우팅 전에 처리)
app.use('/api/*', (req, res) => {
  console.log(`❌ 404 API endpoint not found: ${req.method} ${req.url}`);
  console.log(`🔧 Available endpoints check for: ${req.url}`);

  res.status(404).json({
    error: 'API Endpoint Not Found',
    message: `The requested API endpoint '${req.method} ${req.url}' does not exist`,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /health - Health check and system status',
      'GET /api/test - Basic API functionality test',
      'GET /api/env-test - Environment variables check',
      'GET /api/firebase-test - Firebase connection test',
      'GET /api/index - Comprehensive system status'
    ],
    troubleshooting: [
      'Check the URL spelling',
      'Verify the HTTP method (GET, POST, etc.)',
      'Review available endpoints above',
      'Check Vercel deployment logs'
    ],
    requestDetails: {
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    }
  });
});

// SPA 라우팅 지원: 모든 경로를 index.html로 처리
app.get('*', (req, res) => {
  console.log(`📄 SPA routing for: ${req.url}`);

  // Vercel에서는 정적 파일이 별도로 처리되므로 리다이렉트 사용
  if (process.env.NODE_ENV === 'production') {
    console.log('🔄 Redirecting to index.html in production');
    res.redirect('/');
  } else {
    try {
      res.sendFile(path.join(__dirname, '../dist/public/index.html'));
    } catch (err) {
      console.error('💥 Error serving SPA:', err);
      res.status(500).json({
        error: 'Failed to serve SPA',
        message: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
});

// 글로벌 에러 핸들러 (상세 로깅 포함)
app.use((err: any, req: any, res: any, next: any) => {
  console.error('❌ Global error handler:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 로컬 개발 환경에서만 서버 실행
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV}`);
  });
} else {
  // 프로덕션 환경에서는 서버 시작 로그만 출력
  console.log('🚀 Vercel serverless function initialized');
  console.log('🔧 Production environment detected');
}

// Vercel Serverless Function으로 내보내기
export default app;
