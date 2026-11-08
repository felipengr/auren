import Fastify from "fastify";
import { ZodError } from "zod";
import { env } from "./lib/env.js";
import { AppError } from "./lib/errors.js";
import corsPlugin from "./plugins/cors.js";
import authPlugin from "./plugins/auth.js";
import healthRoutes from "./modules/health/health.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import patientsRoutes from "./modules/patients/patients.routes.js";
import examTypesRoutes from "./modules/exam-types/exam-types.routes.js";
import appointmentsRoutes from "./modules/appointments/appointments.routes.js";
import reportsRoutes from "./modules/reports/reports.routes.js";

export function buildApp() {
  const app = Fastify({
    logger:
      env.NODE_ENV === "development"
        ? { transport: { target: "pino-pretty" } }
        : env.NODE_ENV === "test"
          ? false
          : true,
  });

  app.register(corsPlugin);
  app.register(authPlugin);

  app.register(
    async (api) => {
      api.register(healthRoutes);
      api.register(authRoutes);
      api.register(patientsRoutes);
      api.register(examTypesRoutes);
      api.register(appointmentsRoutes);
      api.register(reportsRoutes);
    },
    { prefix: "/api" },
  );

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      reply.code(error.statusCode).send({ error: { code: error.code, message: error.message } });
      return;
    }

    if (error instanceof ZodError) {
      reply.code(400).send({
        error: { code: "VALIDATION_ERROR", message: "Requisição inválida", details: error.flatten() },
      });
      return;
    }

    request.log.error(error);
    reply.code(500).send({ error: { code: "INTERNAL_ERROR", message: "Algo deu errado" } });
  });

  app.setNotFoundHandler((_request, reply) => {
    reply.code(404).send({ error: { code: "NOT_FOUND", message: "Rota não encontrada" } });
  });

  return app;
}
