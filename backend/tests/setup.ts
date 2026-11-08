import path from "node:path";
import dotenv from "dotenv";

// Loaded before each test file's own imports resolve, so src/lib/env.ts picks
// up the test database instead of dev.db when it's first imported.
dotenv.config({ path: path.resolve(process.cwd(), ".env.test"), override: true });
