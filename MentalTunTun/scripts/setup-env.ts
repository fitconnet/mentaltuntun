// scripts/setup-env.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");

const envTemplate = `
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Kakao OAuth
NEXT_PUBLIC_KAKAO_JS_KEY=
KAKAO_REST_API_KEY=
KAKAO_REDIRECT_URI=

# Naver OAuth
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
NAVER_REDIRECT_URI=

# Toss Payments
TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=

# Server Configuration
PORT=3000
NODE_ENV=development

# Database (if needed)
DATABASE_URL=

# JWT Secret
JWT_SECRET=
`;

console.log("🔧 환경 변수 설정 파일 생성 중...");

try {
  // .env 파일이 이미 존재하는지 확인
  if (fs.existsSync(envPath)) {
    console.log("⚠️  .env 파일이 이미 존재합니다.");
    console.log("기존 파일을 백업하고 새로운 템플릿을 생성합니다.");
    
    // 기존 파일 백업
    const backupPath = path.resolve(__dirname, "../.env.backup");
    fs.copyFileSync(envPath, backupPath);
    console.log(`💾 기존 .env 파일을 .env.backup으로 백업했습니다.`);
  }

  // 새로운 .env 파일 생성
  fs.writeFileSync(envPath, envTemplate.trim());
  
  console.log("✅ .env 파일이 성공적으로 생성되었습니다!");
  console.log("");
  console.log("📋 다음 단계:");
  console.log("1. .env 파일을 열어 실제 값들을 입력하세요");
  console.log("2. Firebase 프로젝트 설정에서 API 키를 복사하세요");
  console.log("3. 각 OAuth 제공업체에서 클라이언트 ID/Secret을 발급받으세요");
  console.log("");
  console.log("🔗 참고 문서:");
  console.log("- Firebase: https://console.firebase.google.com/");
  console.log("- Google OAuth: https://console.developers.google.com/");
  console.log("- Kakao Developers: https://developers.kakao.com/");
  console.log("- Naver Developers: https://developers.naver.com/");
  console.log("- Toss Payments: https://docs.tosspayments.com/");
  
} catch (error) {
  console.error("❌ .env 파일 생성 중 오류가 발생했습니다:", error);
  process.exit(1);
} 