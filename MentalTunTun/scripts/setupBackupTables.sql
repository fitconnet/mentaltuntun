-- Firestore 백업을 위한 PostgreSQL 테이블 생성

-- 백업 로그 테이블
CREATE TABLE IF NOT EXISTS backup_logs (
  id SERIAL PRIMARY KEY,
  backup_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'running'
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 프로필 테이블 (백업용)
CREATE TABLE IF NOT EXISTS user_profiles_backup (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(128) UNIQUE NOT NULL,
  birth_date DATE,
  gender VARCHAR(20),
  occupation VARCHAR(100),
  mbti VARCHAR(4),
  interests JSONB DEFAULT '[]',
  personality_scores JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 감정 기록 테이블 (백업용)
CREATE TABLE IF NOT EXISTS emotion_records_backup (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(128) NOT NULL,
  date DATE NOT NULL,
  emotion_keywords JSONB DEFAULT '[]',
  note TEXT,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(uid, date)
);

-- 상담 세션 테이블 (백업용)
CREATE TABLE IF NOT EXISTS counseling_sessions_backup (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(128) NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  topic TEXT,
  persona_type VARCHAR(50) DEFAULT 'empathetic',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(uid, session_id)
);

-- 채팅 메시지 테이블 (백업용)
CREATE TABLE IF NOT EXISTS chat_messages_backup (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES counseling_sessions_backup(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'user', 'assistant'
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, message_order)
);

-- 백업 통계 뷰
CREATE OR REPLACE VIEW backup_statistics AS
SELECT 
  backup_type,
  COUNT(*) as total_runs,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_runs,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_runs,
  AVG(duration_seconds) as avg_duration_seconds,
  MAX(started_at) as last_backup_time,
  MIN(started_at) as first_backup_time
FROM backup_logs 
GROUP BY backup_type;

-- 데이터 요약 뷰
CREATE OR REPLACE VIEW data_summary AS
SELECT 
  (SELECT COUNT(*) FROM user_profiles_backup) as total_users,
  (SELECT COUNT(*) FROM emotion_records_backup) as total_emotion_records,
  (SELECT COUNT(*) FROM counseling_sessions_backup) as total_counseling_sessions,
  (SELECT COUNT(*) FROM chat_messages_backup) as total_chat_messages,
  (SELECT MAX(updated_at) FROM user_profiles_backup) as last_user_update,
  (SELECT MAX(updated_at) FROM emotion_records_backup) as last_emotion_update,
  (SELECT MAX(updated_at) FROM counseling_sessions_backup) as last_session_update;

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_backup_logs_type_status ON backup_logs(backup_type, status);
CREATE INDEX IF NOT EXISTS idx_backup_logs_started_at ON backup_logs(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_profiles_backup_uid ON user_profiles_backup(uid);
CREATE INDEX IF NOT EXISTS idx_emotion_records_backup_uid_date ON emotion_records_backup(uid, date DESC);
CREATE INDEX IF NOT EXISTS idx_counseling_sessions_backup_uid ON counseling_sessions_backup(uid);
CREATE INDEX IF NOT EXISTS idx_counseling_sessions_backup_started_at ON counseling_sessions_backup(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_backup_session_id ON chat_messages_backup(session_id, message_order);

-- 백업 테이블에 대한 코멘트
COMMENT ON TABLE backup_logs IS 'Firestore → PostgreSQL 백업 실행 기록';
COMMENT ON TABLE user_profiles_backup IS 'Firestore 사용자 프로필 백업 데이터';
COMMENT ON TABLE emotion_records_backup IS 'Firestore 감정 기록 백업 데이터';
COMMENT ON TABLE counseling_sessions_backup IS 'Firestore AI 상담 세션 백업 데이터';
COMMENT ON TABLE chat_messages_backup IS 'Firestore 채팅 메시지 백업 데이터';

-- 초기 데이터 확인 쿼리 예시
-- SELECT * FROM backup_statistics;
-- SELECT * FROM data_summary;
-- SELECT COUNT(*) as backup_count, status FROM backup_logs GROUP BY status;