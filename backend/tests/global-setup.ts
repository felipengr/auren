import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Runs once before the whole test run, in its own process — builds a fresh
// SQLite file for the test suite so tests never touch dev.db.
export default function globalSetup() {
  const dbPath = path.resolve(process.cwd(), "test.db");
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    const file = dbPath + suffix;
    if (fs.existsSync(file)) fs.rmSync(file);
  }

  // `migrate deploy` (not `db push --accept-data-loss`) on purpose: it only
  // replays already-committed migration files forward, so it's safe to run
  // unattended against this disposable, just-recreated file.
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
  });
}
