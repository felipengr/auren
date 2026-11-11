import cors from "@fastify/cors";
import fp from "fastify-plugin";
import { env } from "../lib/env.js";

/**
 * Credenciais (cookie httpOnly) cruzam origem entre o front (Vercel) e o
 * back (Render), então o CORS precisa ecoar uma origin explícita + credentials
 * true — nunca "*", que o browser rejeita quando credentials estão envolvidas.
 *
 * `methods` precisa ser explícito: o default do @fastify/cors é só
 * "GET,HEAD,POST" — sem isso, o preflight de PATCH/DELETE (cancelar
 * agendamento, salvar/publicar laudo) falha no navegador antes mesmo da
 * requisição chegar na API.
 */
export default fp(async (fastify) => {
  await fastify.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PATCH", "DELETE"],
  });
});
