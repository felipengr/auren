import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";

export default async function examTypesRoutes(fastify: FastifyInstance) {
  fastify.get("/exam-types", { preHandler: fastify.authenticate }, async () => {
    const examTypes = await prisma.examType.findMany({ orderBy: { name: "asc" } });
    return { examTypes };
  });
}
