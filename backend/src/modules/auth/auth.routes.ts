import type { FastifyInstance } from "fastify";
import { z } from "zod";
import * as authService from "./auth.service.js";
import { AUTH_COOKIE_NAME } from "../../plugins/auth.js";
import { authCookieOptions } from "../../lib/cookie-options.js";
import { NotFoundError } from "../../lib/errors.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/auth/login", async (request, reply) => {
    const { email, password } = loginSchema.parse(request.body);

    const user = await authService.login(email, password);
    const token = await reply.jwtSign({ sub: user.id, role: user.role });

    reply.setCookie(AUTH_COOKIE_NAME, token, authCookieOptions());
    return { user };
  });

  fastify.post("/auth/logout", async (request, reply) => {
    reply.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
    return { ok: true };
  });

  fastify.get("/auth/me", { preHandler: fastify.authenticate }, async (request) => {
    const user = await authService.getUserById(request.user.sub);
    if (!user) throw new NotFoundError("Usuário");
    return { user };
  });
}
