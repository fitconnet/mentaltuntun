-- 🎯 MentalTunTun - profiles 테이블 RLS 설정 완성
-- 현재 상태: SELECT, UPDATE 정책은 이미 존재
-- 추가 필요: INSERT 정책만 

-- ✅ Step 1: RLS 상태 확인 (이미 활성화되어 있음)
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY; (이미 완료)

-- ✅ Step 2: 기존 정책 확인
-- SELECT 정책: "Select My Profile" ✅ 존재
-- UPDATE 정책: "Enable update for users based on id" ✅ 존재

-- 🔥 Step 3: INSERT 정책 추가 (누락된 부분)
CREATE POLICY "Allow user to insert own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 📋 정책 요약 (완성 후):
-- 1. SELECT: 본인 프로필만 조회 가능
-- 2. UPDATE: 본인 프로필만 수정 가능  
-- 3. INSERT: 본인 ID로만 프로필 생성 가능

-- 🔒 보안 수준: authenticated 역할만 접근 가능
-- 🎯 적용 범위: 로그인한 사용자만 자신의 데이터 관리 