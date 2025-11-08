import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";


export const db = new DatabaseSync("./incremental-copy-cache.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS files (
    path TEXT PRIMARY KEY,
    mtime INTEGER
  )
`);

export function hasChanged(filePath) {
  const stat = fs.statSync(filePath);
  const row = db.prepare("SELECT mtime FROM files WHERE path=?").get(filePath);
  if (!row || row.mtime !== stat.mtimeMs) return true;
  return false;
}

export function updateMtime(filePath) {
  const stat = fs.statSync(filePath);
  db.prepare("INSERT OR REPLACE INTO files VALUES (?, ?)").run(filePath, stat.mtimeMs);
}
