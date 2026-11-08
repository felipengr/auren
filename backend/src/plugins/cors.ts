import cors from "@fastify/cors";
import fp from "fastify-plugin";
import { env } from "../lib/env.js";

/**
 * Credenciais (cookie httpOnly) cruzam origem entre o front (Vercel) e o
 * back (Render), então o CORS precisa ecoar uma origin explícita + credentials
 * true — nunca "*", que o browser rejeita quando credentials estão envolvidas.
 */
export default fp(async (fastify) => {
  await fastify.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });
});
