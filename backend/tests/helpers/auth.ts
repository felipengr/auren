import type { FastifyInstance } from "fastify";
import { TEST_PASSWORD } from "./factories.js";

/** Logs in via the real HTTP route and returns the Set-Cookie header to reuse. */
export async function loginAs(app: FastifyInstance, email: string, password = TEST_PASSWORD) {
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email, password },
  });

  if (response.statusCode !== 200) {
    throw new Error(`loginAs(${email}) failed: ${response.statusCode} ${response.body}`);
  }

  const setCookie = response.headers["set-cookie"];
  const cookieHeader = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  if (!cookieHeader) throw new Error(`loginAs(${email}): no Set-Cookie header in response`);

  return cookieHeader.split(";")[0] ?? "";
}
