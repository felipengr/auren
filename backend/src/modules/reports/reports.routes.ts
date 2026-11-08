import type { FastifyInstance } from "fastify";
import { z } from "zod";
import * as reportsService from "./reports.service.js";

const createSchema = z.object({
  title: z.string().trim().min(1),
  content: z.string().trim().min(1),
  professionalName: z.string().trim().min(1),
});

const updateSchema = createSchema.partial();

export default async function reportsRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/appointments/:id/report",
    { preHandler: fastify.requireRole("CLINIC") },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = createSchema.parse(request.body);
      const report = await reportsService.createDraft({ appointmentId: id, ...body });
      reply.code(201);
      return { report };
    },
  );

  fastify.get(
    "/appointments/:id/report",
    { preHandler: fastify.authenticate },
    async (request) => {
      const { id } = request.params as { id: string };
      const report =
        request.user.role === "CLINIC"
          ? await reportsService.getByAppointmentForClinic(id)
          : await reportsService.getByAppointmentForPatient(id, request.user.sub);
      return { report };
    },
  );

  fastify.get(
    "/reports/mine",
    { preHandler: fastify.requireRole("PATIENT") },
    async (request) => {
      const reports = await reportsService.listPublishedForPatient(request.user.sub);
      return { reports };
    },
  );

  fastify.get(
    "/reports/:id",
    { preHandler: fastify.authenticate },
    async (request) => {
      const { id } = request.params as { id: string };
      const report =
        request.user.role === "CLINIC"
          ? await reportsService.getForClinic(id)
          : await reportsService.getForPatient(id, request.user.sub);
      return { report };
    },
  );

  fastify.patch(
    "/reports/:id",
    { preHandler: fastify.requireRole("CLINIC") },
    async (request) => {
      const { id } = request.params as { id: string };
      const body = updateSchema.parse(request.body);
      const report = await reportsService.updateDraft(id, body);
      return { report };
    },
  );

  fastify.post(
    "/reports/:id/publish",
    { preHandler: fastify.requireRole("CLINIC") },
    async (request) => {
      const { id } = request.params as { id: string };
      const report = await reportsService.publish(id);
      return { report };
    },
  );
}
