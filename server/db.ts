import { config } from "dotenv";
import path from "path";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";

// Load environment variables before using them
config({ path: path.resolve(process.cwd(), "../.env.local") });
config({ path: path.resolve(process.cwd(), "../.env") }); // Load environment variables from .env file

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === "development") {
    console.warn("⚠️  DATABASE_URL이 설정되지 않았습니다. 개발 모드에서는 임시 URL을 사용합니다.");
    process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
  } else {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?"
    );
  }
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
