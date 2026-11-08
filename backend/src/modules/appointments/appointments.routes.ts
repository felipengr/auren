import type { FastifyInstance } from "fastify";
import { z } from "zod";
import * as appointmentsService from "./appointments.service.js";
import { civilDateTimeToUtc } from "../../lib/timezone.js";

const createSchema = z.object({
  patientId: z.string().min(1),
  examTypeId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "time must be HH:mm"),
});

const listQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  patientId: z.string().min(1).optional(),
});

const slotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
});

export default async function appointmentsRoutes(fastify: FastifyInstance) {
  // Clinic: full agenda, filterable by date and/or patient.
  fastify.get(
    "/appointments",
    { preHandler: fastify.requireRole("CLINIC") },
    async (request) => {
      const filters = listQuerySchema.parse(request.query);
      const appointments = await appointmentsService.listForClinic(filters);
      return { appointments };
    },
  );

  // Clinic: fixed 30-min grid for a given day, flagging which slots are free.
  fastify.get(
    "/appointments/available-slots",
    { preHandler: fastify.requireRole("CLINIC") },
    async (request) => {
      const { date } = slotsQuerySchema.parse(request.query);
      const slots = await appointmentsService.availableSlots(date);
      return { date, slots };
    },
  );

  // Patient: only their own appointments.
  fastify.get(
    "/appointments/mine",
    { preHandler: fastify.requireRole("PATIENT") },
    async (request) => {
      const appointments = await appointmentsService.listForPatient(request.user.sub);
      return { appointments };
    },
  );

  fastify.get(
    "/appointments/:id",
    { preHandler: fastify.authenticate },
    async (request) => {
      const { id } = request.params as { id: string };
      const appointment =
        request.user.role === "CLINIC"
          ? await appointmentsService.getForClinic(id)
          : await appointmentsService.getForPatient(id, request.user.sub);
      return { appointment };
    },
  );

  fastify.post(
    "/appointments",
    { preHandler: fastify.requireRole("CLINIC") },
    async (request, reply) => {
      const body = createSchema.parse(request.body);
      const scheduledAt = civilDateTimeToUtc(body.date, body.time);

      const appointment = await appointmentsService.create({
        patientId: body.patientId,
        examTypeId: body.examTypeId,
        scheduledAt,
        createdById: request.user.sub,
      });

      reply.code(201);
      return { appointment };
    },
  );

  fastify.delete(
    "/appointments/:id",
    { preHandler: fastify.requireRole("CLINIC") },
    async (request) => {
      const { id } = request.params as { id: string };
      const appointment = await appointmentsService.cancel(id);
      return { appointment };
    },
  );
}
