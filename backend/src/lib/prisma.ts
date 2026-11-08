import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client.js";
import { env } from "./env.js";

const adapter = new PrismaBetterSqlite3({ url: env.DATABASE_URL });

// Single PrismaClient instance reused across the app (connection pooling,
// avoids exhausting SQLite connections under test/dev hot-reload).
export const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});
