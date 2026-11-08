import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { resetDb } from "./helpers/db.js";
import { createClinicUser, TEST_PASSWORD } from "./helpers/factories.js";

describe("auth", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await resetDb();
  });

  it("logs in with valid credentials and sets an httpOnly cookie", async () => {
    const user = await createClinicUser({ email: "clinic@test.local" });

    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: user.email, password: TEST_PASSWORD },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().user).toMatchObject({ email: user.email, role: "CLINIC" });
    expect(response.headers["set-cookie"]).toMatch(/HttpOnly/i);
  });

  it("rejects an unknown email", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "nobody@test.local", password: "whatever" },
    });

    expect(response.statusCode).toBe(401);
  });

  it("rejects a wrong password", async () => {
    const user = await createClinicUser({ email: "clinic2@test.local" });

    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: user.email, password: "wrong-password" },
    });

    expect(response.statusCode).toBe(401);
  });

  it("rejects requests to protected routes without a token", async () => {
    const response = await app.inject({ method: "GET", url: "/api/appointments" });
    expect(response.statusCode).toBe(401);
  });
});
