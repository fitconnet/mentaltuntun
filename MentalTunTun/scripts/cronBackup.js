#!/usr/bin/env node

/**
 * Cron Job을 위한 백업 스크립트
 * 매일 자정에 실행되어 Firestore → PostgreSQL 백업 수행
 */

import cron from "node-cron";
import { runFullBackup } from "./backupFirestoreToPostgres.js";

console.log("🕐 Firestore → PostgreSQL 백업 스케줄러 시작...");

// 매일 오전 2시에 백업 실행 (서버 부하가 적은 시간)
// 크론 표현식: 분 시 일 월 요일
// 0 2 * * * = 매일 오전 2시 0분
cron.schedule(
  "0 2 * * *",
  async () => {
    console.log("⏰ 정기 백업 시작:", new Date().toISOString());

    try {
      await runFullBackup();
      console.log("✅ 정기 백업 성공적으로 완료");
    } catch (error) {
      console.error("❌ 정기 백업 실패:", error.message);

      // 백업 실패 시 알림 (선택사항)
      // 예: 이메일, Slack, Discord 등으로 알림 전송
      // await sendBackupFailureNotification(error);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Seoul", // 한국 시간 기준
  }
);

// 매주 일요일 오전 1시에 주간 백업 리포트 생성
cron.schedule(
  "0 1 * * 0",
  async () => {
    console.log("📊 주간 백업 리포트 생성:", new Date().toISOString());

    try {
      await generateWeeklyBackupReport();
      console.log("✅ 주간 백업 리포트 생성 완료");
    } catch (error) {
      console.error("❌ 주간 백업 리포트 생성 실패:", error.message);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Seoul",
  }
);

/**
 * 주간 백업 리포트 생성
 */
async function generateWeeklyBackupReport() {
  const { Pool } = await import("pg");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // 지난 7일간의 백업 통계 조회
    const result = await pool.query(`
      SELECT 
        backup_type,
        COUNT(*) as total_runs,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_runs,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_runs,
        AVG(duration_seconds) as avg_duration,
        MAX(started_at) as last_backup
      FROM backup_logs 
      WHERE started_at >= NOW() - INTERVAL '7 days'
      GROUP BY backup_type
      ORDER BY backup_type
    `);

    console.log("\n📈 지난 7일간 백업 통계:");
    console.log("================================================");

    result.rows.forEach(row => {
      console.log(`백업 타입: ${row.backup_type}`);
      console.log(`  총 실행: ${row.total_runs}회`);
      console.log(`  성공: ${row.successful_runs}회`);
      console.log(`  실패: ${row.failed_runs}회`);
      console.log(`  평균 소요시간: ${Math.round(row.avg_duration)}초`);
      console.log(`  마지막 백업: ${row.last_backup}`);
      console.log("------------------------------------------------");
    });

    // 데이터 요약 조회
    const summaryResult = await pool.query("SELECT * FROM data_summary");
    if (summaryResult.rows.length > 0) {
      const summary = summaryResult.rows[0];
      console.log("\n📊 현재 백업 데이터 요약:");
      console.log("================================================");
      console.log(`사용자 수: ${summary.total_users}명`);
      console.log(`감정 기록: ${summary.total_emotion_records}개`);
      console.log(`상담 세션: ${summary.total_counseling_sessions}개`);
      console.log(`채팅 메시지: ${summary.total_chat_messages}개`);
      console.log("================================================\n");
    }
  } finally {
    await pool.end();
  }
}

/**
 * 수동 백업 실행 (터미널에서 호출 가능)
 */
process.on("SIGINT", () => {
  console.log("\n🛑 백업 스케줄러 종료");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 백업 스케줄러 종료");
  process.exit(0);
});

// 수동 실행 옵션
if (process.argv.includes("--manual")) {
  console.log("🔧 수동 백업 실행...");
  runFullBackup()
    .then(() => {
      console.log("✅ 수동 백업 완료");
      process.exit(0);
    })
    .catch(error => {
      console.error("❌ 수동 백업 실패:", error.message);
      process.exit(1);
    });
} else if (process.argv.includes("--report")) {
  console.log("📊 백업 리포트 생성...");
  generateWeeklyBackupReport()
    .then(() => {
      console.log("✅ 백업 리포트 완료");
      process.exit(0);
    })
    .catch(error => {
      console.error("❌ 백업 리포트 실패:", error.message);
      process.exit(1);
    });
} else {
  console.log("✅ 백업 스케줄러가 백그라운드에서 실행 중입니다.");
  console.log("💡 수동 실행: node cronBackup.js --manual");
  console.log("💡 리포트 생성: node cronBackup.js --report");
  console.log("💡 종료: Ctrl+C");
}
