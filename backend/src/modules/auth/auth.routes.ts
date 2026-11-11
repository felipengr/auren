import type { FastifyInstance } from "fastify";
import { z } from "zod";
import * as authService from "./auth.service.js";
import { AUTH_COOKIE_NAME } from "../../plugins/auth.js";
import { authCookieOptions } from "../../lib/cookie-options.js";

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
    // clearCookie precisa dos mesmos atributos usados no setCookie — em
    // produção isso inclui sameSite: "none" + secure: true. Sem eles, o
    // navegador descarta o Set-Cookie de limpeza (contexto cross-site exige
    // SameSite=None+Secure pra aceitar QUALQUER Set-Cookie, inclusive um que
    // expira o cookie) e a sessão antiga continua válida.
    reply.clearCookie(AUTH_COOKIE_NAME, authCookieOptions());
    return { ok: true };
  });

  // "Quem sou eu" não é um recurso protegido — é a checagem de sessão que a
  // SPA faz em toda carga de página, inclusive na tela de login, então
  // "sem sessão" é um resultado esperado (200 + user: null), não um 401.
  fastify.get("/auth/me", async (request) => {
    try {
      await request.jwtVerify();
    } catch {
      return { user: null };
    }
    const user = await authService.getUserById(request.user.sub);
    return { user };
  });
}
