# Firebase 설정 가이드

## 구글 로그인 오류 해결 방법

현재 `auth/configuration-not-found` 오류가 발생하고 있습니다. 이는 Firebase 프로젝트 설정 문제입니다.

## 필요한 설정 단계

### 1. Firebase 콘솔 접속
- https://console.firebase.google.com/ 접속
- 프로젝트 선택: `mentaltuntun`

### 2. Authentication 설정
1. 왼쪽 메뉴에서 **Authentication** 클릭
2. **Sign-in method** 탭 선택
3. **Google** 제공업체 활성화
   - Google을 클릭하여 **사용 설정**
   - 프로젝트 지원 이메일 설정
   - **저장** 클릭

### 3. 승인된 도메인 설정
Authentication > Settings > **Authorized domains**에서 다음 도메인들을 추가해주세요:
- `localhost` (개발용)
- `mentaltuntun-kr.replit.dev` (현재 Replit 도메인)
- `replit.dev` (Replit 하위 도메인)
- `*.replit.dev` (모든 Replit 하위 도메인)

**⚠️ 중요**: 현재 `auth/unauthorized-domain` 오류는 위 도메인들이 Firebase 콘솔에서 승인되지 않아서 발생합니다.

### 4. 웹 앱 설정 확인
1. **프로젝트 설정** (톱니바퀴 아이콘) 클릭
2. **일반** 탭에서 웹 앱 확인
3. **SDK 설정 및 구성**에서 설정값 확인:
   - `apiKey`: 현재 설정됨
   - `authDomain`: `mentaltuntun.firebaseapp.com`
   - `projectId`: `mentaltuntun`
   - `appId`: 현재 설정됨

## 현재 환경 변수 상태
✅ VITE_FIREBASE_API_KEY: 설정됨
✅ VITE_FIREBASE_PROJECT_ID: 설정됨  
✅ VITE_FIREBASE_APP_ID: 설정됨

## 해결 후 테스트 방법
1. `/firebase-test` 페이지 접속
2. **구글 로그인 테스트** 버튼 클릭
3. 정상 동작 확인

Firebase 콘솔에서 위 설정을 완료한 후 다시 시도해주세요.