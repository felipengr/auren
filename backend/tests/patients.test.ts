import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { resetDb } from "./helpers/db.js";
import { createClinicUser, createPatientUser } from "./helpers/factories.js";
import { loginAs } from "./helpers/auth.js";

describe("patients", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await resetDb();
  });

  it("lets the clinic register a new patient", async () => {
    const clinic = await createClinicUser({ email: "clinic@test.local" });
    const clinicCookie = await loginAs(app, clinic.email);

    const response = await app.inject({
      method: "POST",
      url: "/api/patients",
      headers: { cookie: clinicCookie },
      payload: { name: "Novo Paciente", email: "novo.paciente@test.local", password: "senha123" },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().patient).toMatchObject({ name: "Novo Paciente", email: "novo.paciente@test.local" });

    const list = await app.inject({
      method: "GET",
      url: "/api/patients",
      headers: { cookie: clinicCookie },
    });
    expect(list.json().patients.map((p: { email: string }) => p.email)).toContain("novo.paciente@test.local");
  });

  it("lets a newly registered patient log in", async () => {
    const clinic = await createClinicUser({ email: "clinic2@test.local" });
    const clinicCookie = await loginAs(app, clinic.email);

    await app.inject({
      method: "POST",
      url: "/api/patients",
      headers: { cookie: clinicCookie },
      payload: { name: "Ana Nova", email: "ana.nova@test.local", password: "senha123" },
    });

    const login = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "ana.nova@test.local", password: "senha123" },
    });
    expect(login.statusCode).toBe(200);
    expect(login.json().user.role).toBe("PATIENT");
  });

  it("rejects a duplicate e-mail", async () => {
    const clinic = await createClinicUser({ email: "clinic3@test.local" });
    const existingPatient = await createPatientUser({ email: "existing@test.local" });
    const clinicCookie = await loginAs(app, clinic.email);

    const response = await app.inject({
      method: "POST",
      url: "/api/patients",
      headers: { cookie: clinicCookie },
      payload: { name: "Duplicado", email: existingPatient.email, password: "senha123" },
    });
    expect(response.statusCode).toBe(409);
  });

  it("does not let a patient register other patients", async () => {
    const patient = await createPatientUser({ email: "patient@test.local" });
    const patientCookie = await loginAs(app, patient.email);

    const response = await app.inject({
      method: "POST",
      url: "/api/patients",
      headers: { cookie: patientCookie },
      payload: { name: "Outro", email: "outro@test.local", password: "senha123" },
    });
    expect(response.statusCode).toBe(403);
  });
});
