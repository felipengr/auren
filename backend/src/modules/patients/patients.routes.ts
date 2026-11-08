import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.js";

export default async function patientsRoutes(fastify: FastifyInstance) {
  // Only the clinic needs the patient list, to pick one when scheduling an exam.
  fastify.get(
    "/patients",
    { preHandler: fastify.requireRole("CLINIC") },
    async () => {
      const patients = await prisma.user.findMany({
        where: { role: "PATIENT" },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      });
      return { patients };
    },
  );
}
