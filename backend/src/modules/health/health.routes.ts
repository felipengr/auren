import type { FastifyInstance } from "fastify";

// Pinged periodically (UptimeRobot/cron-job.org) in the deployed environment
// to prevent the free-tier instance from going idle before someone reviews it.
export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));
}
