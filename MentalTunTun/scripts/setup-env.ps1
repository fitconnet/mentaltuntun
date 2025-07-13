# ✅ .env 자동 생성 스크립트 (MentalTunTun 프로젝트용 - Windows PowerShell)

Write-Host "🔧 MentalTunTun .env 파일 설정을 시작합니다..." -ForegroundColor Cyan

# 현재 .env 파일이 있는지 확인
if (Test-Path ".env") {
    Write-Host "⚠️  .env 파일이 이미 존재합니다." -ForegroundColor Yellow
    $choice = Read-Host "덮어쓰시겠습니까? (y/N)"
    if ($choice -notmatch '^[Yy]$') {
        Write-Host "❌ 설정을 취소했습니다." -ForegroundColor Red
        exit 1
    }
}

# .env 파일 내용 생성
$envContent = @"
# =============================================================================
# MentalTunTun 환경 설정 파일
# =============================================================================

# --- 데이터베이스 설정 ---
DATABASE_URL=postgresql://username:password@localhost:5432/mentaltuntun
POSTGRES_URL=postgresql://username:password@localhost:5432/mentaltuntun

# --- 애플리케이션 설정 ---
NODE_ENV=development
PORT=3000
SESSION_SECRET=your-session-secret-key-here

# --- Firebase 설정 (프론트엔드용 - VITE_ 접두사 필수) ---
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# --- Firebase 설정 (백엔드용) ---
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email

# --- OAuth 설정 ---
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret
VITE_KAKAO_JAVASCRIPT_KEY=your_kakao_js_key
VITE_KAKAO_REDIRECT_URI=http://localhost:5173/login

NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# --- 결제 설정 ---
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# --- OpenAI API 설정 ---
OPENAI_API_KEY=your_openai_api_key

# --- 기타 설정 ---
VITE_APP_ENV=local
WEBHOOK_URL=your_webhook_url
"@

# .env 파일 생성
$envContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "✅ .env 파일이 생성되었습니다!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 다음 단계를 진행해주세요:" -ForegroundColor White
Write-Host "   1. .env 파일을 열어서 실제 키 값들을 입력하세요" -ForegroundColor White
Write-Host "   2. 아래 OAuth 설정 가이드를 참고하세요" -ForegroundColor White
Write-Host ""

# OAuth 설정 가이드 출력
Write-Host "🔗 [OAuth 연동 설정 가이드]" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "🔥 Firebase 설정:" -ForegroundColor Red
Write-Host "   1. https://console.firebase.google.com/ 접속"
Write-Host "   2. 프로젝트 생성 → Authentication → Sign-in method"
Write-Host "   3. Google/Kakao 제공업체 사용 설정"
Write-Host "   4. 프로젝트 설정에서 웹 앱 구성 정보 복사"
Write-Host ""
Write-Host "🔍 Google OAuth 설정:" -ForegroundColor Blue
Write-Host "   1. https://console.cloud.google.com/apis/credentials 접속"
Write-Host "   2. 사용자 인증 정보 만들기 → OAuth 클라이언트 ID"
Write-Host "   3. 승인된 리디렉션 URI 추가:"
Write-Host "      - http://localhost:5173/login"
Write-Host "      - https://your-domain.com/login (배포용)"
Write-Host ""
Write-Host "🟡 Kakao OAuth 설정:" -ForegroundColor Yellow
Write-Host "   1. https://developers.kakao.com/ 접속"
Write-Host "   2. 내 애플리케이션 → 앱 설정 → 플랫폼"
Write-Host "   3. 웹 플랫폼 등록:"
Write-Host "      - 사이트 도메인: http://localhost:5173"
Write-Host "      - Redirect URI: http://localhost:5173/login"
Write-Host "   4. 제품 설정 → 카카오 로그인 활성화"
Write-Host ""
Write-Host "🔑 환경변수 설정 후 서버 재시작:" -ForegroundColor Green
Write-Host "   npm run dev"
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host ""
Write-Host "💡 Additional Tips:" -ForegroundColor Cyan
Write-Host "   - Edit .env file with Visual Studio Code"
Write-Host "   - Never commit sensitive information to Git"
Write-Host "   - Use platform environment variables for deployment" 