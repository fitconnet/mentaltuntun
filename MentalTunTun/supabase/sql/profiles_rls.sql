-- 🎯 MentalTunTun - profiles 테이블 RLS 완전 설정
-- 용도: 사용자 프로필 보안 정책 설정
-- 적용: supabase db push 또는 SQL Editor에서 실행

-- ✅ Step 1: RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ✅ Step 2: SELECT 정책 - 본인 프로필만 조회
CREATE POLICY "Allow user to read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- ✅ Step 3: UPDATE 정책 - 본인 프로필만 수정
CREATE POLICY "Allow user to update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ✅ Step 4: INSERT 정책 - 본인 ID로만 프로필 생성
CREATE POLICY "Allow user to insert own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 📋 설정 완료 후 보안 상태:
-- 🔒 로그인한 사용자만 자신의 프로필 읽기/쓰기/생성 가능
-- 🚫 다른 사용자의 프로필 접근 차단
-- ✅ Supabase 인증과 완전 연동 