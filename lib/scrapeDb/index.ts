import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";

const DB_DIR =
  process.env.VERCEL === "1"
    ? path.join("/tmp", "cricket-scrapers-data")
    : path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "scrapers.db");

let db: DatabaseSync | null = null;

function ensureDb(): DatabaseSync {
  if (db) return db;
  fs.mkdirSync(DB_DIR, { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS scrape_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      match_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS scorecards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id INTEGER,
      site_id TEXT NOT NULL,
      match_id TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      scraped_at TEXT NOT NULL,
      UNIQUE(site_id, match_id),
      FOREIGN KEY (run_id) REFERENCES scrape_runs(id)
    );
  `);
  return db;
}

export type ScrapeRunRow = {
  id: number;
  site_id: string;
  start_date: string;
  end_date: string;
  created_at: string;
  match_count: number;
};

export function insertScrapeRun(
  siteId: string,
  startDate: string,
  endDate: string,
  matchCount: number,
): number {
  const conn = ensureDb();
  const result = conn
    .prepare(
      `INSERT INTO scrape_runs (site_id, start_date, end_date, created_at, match_count)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(siteId, startDate, endDate, new Date().toISOString(), matchCount);
  return Number(result.lastInsertRowid);
}

export function upsertScorecard(
  runId: number,
  siteId: string,
  matchId: string,
  payload: unknown,
): void {
  const conn = ensureDb();
  conn
    .prepare(
      `INSERT INTO scorecards (run_id, site_id, match_id, payload_json, scraped_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(site_id, match_id) DO UPDATE SET
         run_id = excluded.run_id,
         payload_json = excluded.payload_json,
         scraped_at = excluded.scraped_at`,
    )
    .run(runId, siteId, matchId, JSON.stringify(payload), new Date().toISOString());
}

export function listRecentRuns(limit = 10): ScrapeRunRow[] {
  const conn = ensureDb();
  return conn.prepare(`SELECT * FROM scrape_runs ORDER BY id DESC LIMIT ?`).all(limit) as ScrapeRunRow[];
}
