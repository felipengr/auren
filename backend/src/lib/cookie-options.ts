import type { CookieSerializeOptions } from "@fastify/cookie";
import { env } from "./env.js";

const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7;

/**
 * Em produção o front (Vercel) e o back (Render) ficam em domínios
 * diferentes, então o cookie precisa de SameSite=None + Secure pra
 * sobreviver a uma requisição cross-site. Em dev, localhost:porta é
 * "same-site" e Lax já funciona sem precisar de HTTPS local.
 */
export function authCookieOptions(): CookieSerializeOptions {
  const isProd = env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: SEVEN_DAYS_SECONDS,
  };
}
