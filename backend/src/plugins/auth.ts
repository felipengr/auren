import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import fp from "fastify-plugin";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../lib/env.js";
import { UnauthorizedError, ForbiddenError } from "../lib/errors.js";
import type { Role } from "../generated/prisma/enums.js";

export const AUTH_COOKIE_NAME = "auren_token";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string; role: Role };
    user: { sub: string; role: Role };
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (...roles: Role[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

/**
 * Registra JWT + cookie e expõe dois preHandlers:
 *  - authenticate: exige um token válido (qualquer papel)
 *  - requireRole(...roles): exige token válido E papel permitido
 * Autorização é sempre checada aqui no backend, mesmo que a rota seja
 * chamada diretamente (nunca confiamos em nada vindo só do frontend).
 */
export default fp(async (fastify) => {
  await fastify.register(cookie);
  await fastify.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: { cookieName: AUTH_COOKIE_NAME, signed: false },
  });

  fastify.decorate("authenticate", async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      throw new UnauthorizedError();
    }
  });

  fastify.decorate("requireRole", (...roles: Role[]) => {
    return async (request: FastifyRequest, _reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        throw new UnauthorizedError();
      }
      if (!roles.includes(request.user.role)) {
        throw new ForbiddenError();
      }
    };
  });
});
