# 카카오 로그인 API 키 설정 가이드

## 1단계: 카카오 디벨로퍼 콘솔 접속

1. [카카오 디벨로퍼 콘솔](https://developers.kakao.com/console/app)에 접속
2. 카카오 계정으로 로그인

## 2단계: 애플리케이션 생성

1. **"애플리케이션 추가하기"** 클릭
2. **앱 이름**: "멘탈튼튼" (또는 원하는 이름)
3. **사업자명**: 개인 개발자명 입력
4. **앱 생성** 완료

## 3단계: 플랫폼 설정

1. 생성된 앱 클릭 → **"플랫폼"** 메뉴
2. **"Web 플랫폼 등록"** 클릭
3. **사이트 도메인** 등록:
   - `http://localhost:5000`
   - `https://ff483d65-a24c-4cc3-8d95-90cf87b1f213-00-3to8f7i26y2pt.janeway.replit.dev` (현재 Replit 도메인)
   - `https://*.replit.dev` (Replit 도메인 패턴)

## 4단계: 카카오 로그인 활성화

1. **"제품 설정"** → **"카카오 로그인"** 메뉴
2. **"활성화 설정"**에서 **"ON"** 으로 변경
3. **"Redirect URI"** 등록:
   - `http://localhost:5000/login`
   - `https://ff483d65-a24c-4cc3-8d95-90cf87b1f213-00-3to8f7i26y2pt.janeway.replit.dev/login`
   - `https://ff483d65-a24c-4cc3-8d95-90cf87b1f213-00-3to8f7i26y2pt.janeway.replit.dev/firebase-test`

## 5단계: 동의항목 설정

1. **"제품 설정"** → **"카카오 로그인"** → **"동의항목"**
2. 필수 동의항목 설정:
   - **닉네임**: 필수 동의
   - **이메일**: 필수 동의 (이메일 수집 목적: 회원 식별용)

## 6단계: API 키 확인

1. **"앱 설정"** → **"앱 키"** 메뉴
2. 다음 키들을 복사:
   - **JavaScript 키**: `VITE_KAKAO_JAVASCRIPT_KEY`
   - **REST API 키**: `KAKAO_REST_API_KEY` (서버용)
   - **Admin 키**: `KAKAO_ADMIN_KEY` (필요시)

## 7단계: Replit Secrets 설정

Replit에서 다음 환경변수들을 추가:

```
VITE_KAKAO_JAVASCRIPT_KEY=복사한_자바스크립트_키
KAKAO_REST_API_KEY=복사한_REST_API_키
```

## 8단계: 테스트

Firebase 테스트 페이지(`/firebase-test`)에서 "카카오 로그인 테스트" 버튼 클릭하여 동작 확인

---

**주의사항:**
- JavaScript 키는 공개되어도 괜찮지만, REST API 키와 Admin 키는 서버에서만 사용
- 도메인 등록이 정확하지 않으면 로그인 실패
- 이메일 동의항목이 필수로 설정되어야 사용자 식별 가능