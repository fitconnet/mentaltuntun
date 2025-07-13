import admin from "firebase-admin";
import { Pool } from "pg";
import dotenv from "dotenv";

// 환경변수 로드
dotenv.config();

// Firebase Admin 초기화
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`,
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
  });
}

const db = admin.firestore();

// PostgreSQL 연결 풀
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * 감정 기록 백업 (Firestore → PostgreSQL)
 */
async function backupEmotions() {
  console.log("🔄 감정 기록 백업 시작...");
  let totalBackedUp = 0;
  let errors = 0;

  try {
    // emotions 컬렉션의 모든 사용자 UID 가져오기
    const emotionsCollection = await db.collection("emotions").listDocuments();

    for (const userDoc of emotionsCollection) {
      const uid = userDoc.id;
      console.log(`📝 사용자 ${uid}의 감정 기록 처리 중...`);

      try {
        // 해당 사용자의 모든 날짜별 감정 기록 가져오기
        const userEmotions = await db
          .collection("emotions")
          .doc(uid)
          .collection("entries")
          .get();

        for (const emotionDoc of userEmotions.docs) {
          const data = emotionDoc.data();
          const date = emotionDoc.id;

          // PostgreSQL에 삽입 (중복 시 무시)
          await pool.query(
            `
            INSERT INTO emotion_records (uid, date, emotion_keywords, note, score, created_at) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            ON CONFLICT (uid, date) DO UPDATE SET
              emotion_keywords = EXCLUDED.emotion_keywords,
              note = EXCLUDED.note,
              score = EXCLUDED.score,
              updated_at = NOW()
          `,
            [
              uid,
              date,
              JSON.stringify(data.emotionKeywords || []),
              data.note || "",
              data.score || 0,
              data.createdAt ? new Date(data.createdAt) : new Date(),
            ]
          );

          totalBackedUp++;
        }
      } catch (userError) {
        console.error(`❌ 사용자 ${uid} 처리 중 오류:`, userError.message);
        errors++;
      }
    }

    console.log(
      `✅ 감정 기록 백업 완료: ${totalBackedUp}개 처리, ${errors}개 오류`
    );
  } catch (error) {
    console.error("❌ 감정 기록 백업 실패:", error.message);
    throw error;
  }
}

/**
 * AI 상담 세션 백업 (Firestore → PostgreSQL)
 */
async function backupChatSessions() {
  console.log("🔄 AI 상담 세션 백업 시작...");
  let totalBackedUp = 0;
  let errors = 0;

  try {
    // chats 컬렉션의 모든 사용자 UID 가져오기
    const chatsCollection = await db.collection("chats").listDocuments();

    for (const userDoc of chatsCollection) {
      const uid = userDoc.id;
      console.log(`💬 사용자 ${uid}의 상담 세션 처리 중...`);

      try {
        // 해당 사용자의 모든 세션 가져오기
        const userSessions = await db
          .collection("chats")
          .doc(uid)
          .collection("sessions")
          .get();

        for (const sessionDoc of userSessions.docs) {
          const sessionData = sessionDoc.data();
          const sessionId = sessionDoc.id;

          // 먼저 상담 세션 정보 삽입
          const sessionResult = await pool.query(
            `
            INSERT INTO counseling_sessions (uid, session_id, topic, persona_type, started_at, ended_at, summary) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            ON CONFLICT (uid, session_id) DO UPDATE SET
              topic = EXCLUDED.topic,
              persona_type = EXCLUDED.persona_type,
              started_at = EXCLUDED.started_at,
              ended_at = EXCLUDED.ended_at,
              summary = EXCLUDED.summary
            RETURNING id
          `,
            [
              uid,
              sessionId,
              sessionData.topic || "",
              sessionData.persona?.type || "empathetic",
              sessionData.startedAt
                ? new Date(sessionData.startedAt)
                : new Date(),
              sessionData.endedAt ? new Date(sessionData.endedAt) : null,
              sessionData.summary || "",
            ]
          );

          const dbSessionId = sessionResult.rows[0]?.id;

          // 해당 세션의 메시지들 백업
          if (sessionData.messages && Array.isArray(sessionData.messages)) {
            for (const [index, message] of sessionData.messages.entries()) {
              await pool.query(
                `
                INSERT INTO chat_messages (session_id, role, content, timestamp, message_order) 
                VALUES ($1, $2, $3, $4, $5) 
                ON CONFLICT (session_id, message_order) DO UPDATE SET
                  role = EXCLUDED.role,
                  content = EXCLUDED.content,
                  timestamp = EXCLUDED.timestamp
              `,
                [
                  dbSessionId,
                  message.role || "user",
                  message.content || "",
                  message.timestamp ? new Date(message.timestamp) : new Date(),
                  index,
                ]
              );
            }
          }

          totalBackedUp++;
        }
      } catch (userError) {
        console.error(
          `❌ 사용자 ${uid} 상담 세션 처리 중 오류:`,
          userError.message
        );
        errors++;
      }
    }

    console.log(
      `✅ AI 상담 세션 백업 완료: ${totalBackedUp}개 처리, ${errors}개 오류`
    );
  } catch (error) {
    console.error("❌ AI 상담 세션 백업 실패:", error.message);
    throw error;
  }
}

/**
 * 사용자 프로필 백업 (Firestore → PostgreSQL)
 */
async function backupUserProfiles() {
  console.log("🔄 사용자 프로필 백업 시작...");
  let totalBackedUp = 0;
  let errors = 0;

  try {
    // users 컬렉션의 모든 사용자 가져오기
    const usersSnapshot = await db.collection("users").get();

    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      const userData = userDoc.data();

      try {
        // 사용자 기본 정보 백업
        await pool.query(
          `
          INSERT INTO users (uid, email, provider, name, profile_complete, plan, created_at, last_login) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
          ON CONFLICT (uid) DO UPDATE SET
            email = EXCLUDED.email,
            provider = EXCLUDED.provider,
            name = EXCLUDED.name,
            profile_complete = EXCLUDED.profile_complete,
            plan = EXCLUDED.plan,
            last_login = EXCLUDED.last_login,
            updated_at = NOW()
        `,
          [
            uid,
            userData.email || "",
            userData.provider || "email",
            userData.name || "",
            userData.profileComplete || false,
            userData.plan || "free",
            userData.createdAt ? new Date(userData.createdAt) : new Date(),
            userData.lastLogin ? new Date(userData.lastLogin) : null,
          ]
        );

        // 사용자 상세 프로필이 있다면 백업
        if (userData.profile) {
          const profile = userData.profile;
          await pool.query(
            `
            INSERT INTO user_profiles (uid, birth_date, gender, occupation, mbti, interests, personality_scores) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            ON CONFLICT (uid) DO UPDATE SET
              birth_date = EXCLUDED.birth_date,
              gender = EXCLUDED.gender,
              occupation = EXCLUDED.occupation,
              mbti = EXCLUDED.mbti,
              interests = EXCLUDED.interests,
              personality_scores = EXCLUDED.personality_scores,
              updated_at = NOW()
          `,
            [
              uid,
              profile.birthDate || null,
              profile.gender || null,
              profile.occupation || null,
              profile.mbti || null,
              JSON.stringify(profile.interests || []),
              JSON.stringify(profile.personality || {}),
            ]
          );
        }

        totalBackedUp++;
      } catch (userError) {
        console.error(
          `❌ 사용자 ${uid} 프로필 처리 중 오류:`,
          userError.message
        );
        errors++;
      }
    }

    console.log(
      `✅ 사용자 프로필 백업 완료: ${totalBackedUp}개 처리, ${errors}개 오류`
    );
  } catch (error) {
    console.error("❌ 사용자 프로필 백업 실패:", error.message);
    throw error;
  }
}

/**
 * 전체 백업 실행
 */
async function runFullBackup() {
  const startTime = new Date();
  console.log(
    `🚀 Firestore → PostgreSQL 하이브리드 백업 시작: ${startTime.toISOString()}`
  );

  try {
    // 순차적으로 백업 실행
    await backupUserProfiles();
    await backupEmotions();
    await backupChatSessions();

    const endTime = new Date();
    const duration = Math.round((endTime - startTime) / 1000);
    console.log(`🎉 전체 백업 완료: ${duration}초 소요`);

    // 백업 로그 기록
    await pool.query(
      `
      INSERT INTO backup_logs (backup_type, status, started_at, completed_at, duration_seconds) 
      VALUES ($1, $2, $3, $4, $5)
    `,
      ["full_backup", "success", startTime, endTime, duration]
    );
  } catch (error) {
    console.error("❌ 백업 실패:", error.message);

    // 실패 로그 기록
    await pool.query(
      `
      INSERT INTO backup_logs (backup_type, status, started_at, error_message) 
      VALUES ($1, $2, $3, $4)
    `,
      ["full_backup", "failed", startTime, error.message]
    );

    process.exit(1);
  } finally {
    await pool.end();
  }
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  runFullBackup().catch(console.error);
}

export {
  backupEmotions,
  backupChatSessions,
  backupUserProfiles,
  runFullBackup,
};
