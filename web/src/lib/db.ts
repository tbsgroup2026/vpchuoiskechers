// ============================================================
// DB layer — TBS Ops Hub
//
// Hiện tại chạy bằng `node:sqlite` cục bộ (file web/.data/dev.sqlite)
// để `npm run dev` hoạt động ngay không cần deploy. Schema trong
// migrations/0001_ops_hub.sql dùng dialect SQLite thuần nên áp được
// y nguyên lên Cloudflare D1 thật (`wrangler d1 execute`) khi deploy.
//
// Khi chuyển sang chạy trên Cloudflare Workers (qua OpenNext), thay
// nội dung getDB() để trả về binding D1 thật (env.DB) — phần còn lại
// của code (các route dùng db.prepare(...).all/get/run) không cần sửa
// vì D1 cũng expose đúng API prepare/bind/all/get/run này.
// ============================================================

import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

let dbInstance: DatabaseSync | null = null;

function runMigration(db: DatabaseSync) {
  const migrationPath = path.join(process.cwd(), "migrations", "0001_ops_hub.sql");
  const sql = fs.readFileSync(migrationPath, "utf8");
  db.exec(sql);
}

export function getDB(): DatabaseSync {
  if (dbInstance) return dbInstance;

  const dataDir = path.join(process.cwd(), ".data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const dbPath = path.join(dataDir, "dev.sqlite");
  dbInstance = new DatabaseSync(dbPath);
  dbInstance.exec("PRAGMA foreign_keys = ON;");
  runMigration(dbInstance);

  return dbInstance;
}

/** Helper: chạy SELECT trả về nhiều dòng */
export function dbAll<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
  return getDB().prepare(sql).all(...(params as never[])) as T[];
}

/** Helper: chạy SELECT trả về 1 dòng (hoặc undefined) */
export function dbGet<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T | undefined {
  return getDB().prepare(sql).get(...(params as never[])) as T | undefined;
}

/** Helper: chạy INSERT/UPDATE/DELETE */
export function dbRun(sql: string, params: unknown[] = []): { lastInsertRowid: number | bigint; changes: number | bigint } {
  return getDB().prepare(sql).run(...(params as never[]));
}
