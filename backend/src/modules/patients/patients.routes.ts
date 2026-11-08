import type { FastifyInstance } from "fastify";
import { z } from "zod";
import * as patientsService from "./patients.service.js";

const createSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export default async function patientsRoutes(fastify: FastifyInstance) {
  // Only the clinic needs the patient list, to pick one when scheduling an exam.
  fastify.get("/patients", { preHandler: fastify.requireRole("CLINIC") }, async () => {
    const patients = await patientsService.list();
    return { patients };
  });

  fastify.post("/patients", { preHandler: fastify.requireRole("CLINIC") }, async (request, reply) => {
    const body = createSchema.parse(request.body);
    const patient = await patientsService.create(body);
    reply.code(201);
    return { patient };
  });
}
