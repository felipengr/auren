import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { DateTime } from "luxon";
import { buildApp } from "../src/app.js";
import { CLINIC_TIMEZONE } from "../src/lib/timezone.js";
import { resetDb } from "./helpers/db.js";
import { createClinicUser, createExamType, createPatientUser } from "./helpers/factories.js";
import { loginAs } from "./helpers/auth.js";

function futureCivilDate(daysAhead: number): string {
  return DateTime.now().setZone(CLINIC_TIMEZONE).plus({ days: daysAhead }).toFormat("yyyy-MM-dd");
}

describe("appointments", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await resetDb();
  });

  async function setup() {
    const clinic = await createClinicUser({ email: "clinic@test.local" });
    const patient = await createPatientUser({ email: "patient@test.local" });
    const examType = await createExamType("Raio-X");
    const clinicCookie = await loginAs(app, clinic.email);
    return { clinic, patient, examType, clinicCookie };
  }

  it("schedules an exam for a registered patient", async () => {
    const { patient, examType, clinicCookie } = await setup();

    const response = await app.inject({
      method: "POST",
      url: "/api/appointments",
      headers: { cookie: clinicCookie },
      payload: { patientId: patient.id, examTypeId: examType.id, date: futureCivilDate(2), time: "09:00" },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().appointment).toMatchObject({ status: "SCHEDULED", time: "09:00" });
  });

  // Cenário obrigatório 5: uma tentativa de agendar no passado é rejeitada.
  it("rejects scheduling in the past", async () => {
    const { patient, examType, clinicCookie } = await setup();

    const response = await app.inject({
      method: "POST",
      url: "/api/appointments",
      headers: { cookie: clinicCookie },
      payload: { patientId: patient.id, examTypeId: examType.id, date: "2020-01-01", time: "09:00" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("rejects a second active appointment in the same slot", async () => {
    const { patient, examType, clinicCookie } = await setup();
    const date = futureCivilDate(2);

    const first = await app.inject({
      method: "POST",
      url: "/api/appointments",
      headers: { cookie: clinicCookie },
      payload: { patientId: patient.id, examTypeId: examType.id, date, time: "10:00" },
    });
    expect(first.statusCode).toBe(201);

    const second = await app.inject({
      method: "POST",
      url: "/api/appointments",
      headers: { cookie: clinicCookie },
      payload: { patientId: patient.id, examTypeId: examType.id, date, time: "10:00" },
    });
    expect(second.statusCode).toBe(409);
  });

  // Cenário obrigatório 1: duas tentativas simultâneas no mesmo horário —
  // apenas uma deve ser aceita. Disparadas de verdade em paralelo (sem await
  // sequencial) pra exercitar a constraint única do banco sob concorrência.
  it("accepts only one of two concurrent bookings for the same slot", async () => {
    const { patient, examType, clinicCookie } = await setup();
    const date = futureCivilDate(3);
    const payload = { patientId: patient.id, examTypeId: examType.id, date, time: "11:00" };

    const [resultA, resultB] = await Promise.all([
      app.inject({ method: "POST", url: "/api/appointments", headers: { cookie: clinicCookie }, payload }),
      app.inject({ method: "POST", url: "/api/appointments", headers: { cookie: clinicCookie }, payload }),
    ]);

    const statusCodes = [resultA.statusCode, resultB.statusCode].sort();
    expect(statusCodes).toEqual([201, 409]);
  });

  it("lets a cancelled slot be reused", async () => {
    const { patient, examType, clinicCookie } = await setup();
    const date = futureCivilDate(2);

    const created = await app.inject({
      method: "POST",
      url: "/api/appointments",
      headers: { cookie: clinicCookie },
      payload: { patientId: patient.id, examTypeId: examType.id, date, time: "13:00" },
    });
    const appointmentId = created.json().appointment.id as string;

    const cancelled = await app.inject({
      method: "DELETE",
      url: `/api/appointments/${appointmentId}`,
      headers: { cookie: clinicCookie },
    });
    expect(cancelled.statusCode).toBe(200);

    const rebooked = await app.inject({
      method: "POST",
      url: "/api/appointments",
      headers: { cookie: clinicCookie },
      payload: { patientId: patient.id, examTypeId: examType.id, date, time: "13:00" },
    });
    expect(rebooked.statusCode).toBe(201);
  });

  it("blocks cancelling an appointment that has a published report", async () => {
    const { patient, examType, clinicCookie } = await setup();
    const date = futureCivilDate(2);

    const created = await app.inject({
      method: "POST",
      url: "/api/appointments",
      headers: { cookie: clinicCookie },
      payload: { patientId: patient.id, examTypeId: examType.id, date, time: "14:00" },
    });
    const appointmentId = created.json().appointment.id as string;

    const report = await app.inject({
      method: "POST",
      url: `/api/appointments/${appointmentId}/report`,
      headers: { cookie: clinicCookie },
      payload: { title: "t", content: "c", professionalName: "Dr. Test" },
    });
    const reportId = report.json().report.id as string;

    await app.inject({
      method: "POST",
      url: `/api/reports/${reportId}/publish`,
      headers: { cookie: clinicCookie },
    });

    const cancelled = await app.inject({
      method: "DELETE",
      url: `/api/appointments/${appointmentId}`,
      headers: { cookie: clinicCookie },
    });
    expect(cancelled.statusCode).toBe(409);
  });

  it("filters the clinic agenda by patient", async () => {
    const { patient, examType, clinicCookie } = await setup();
    const otherPatient = await createPatientUser({ email: "other@test.local" });
    const date = futureCivilDate(2);

    await app.inject({
      method: "POST",
      url: "/api/appointments",
      headers: { cookie: clinicCookie },
      payload: { patientId: patient.id, examTypeId: examType.id, date, time: "15:00" },
    });
    await app.inject({
      method: "POST",
      url: "/api/appointments",
      headers: { cookie: clinicCookie },
      payload: { patientId: otherPatient.id, examTypeId: examType.id, date, time: "15:30" },
    });

    const response = await app.inject({
      method: "GET",
      url: `/api/appointments?patientId=${patient.id}`,
      headers: { cookie: clinicCookie },
    });

    const appointments = response.json().appointments as Array<{ patient: { id: string } }>;
    expect(appointments).toHaveLength(1);
    expect(appointments[0]?.patient.id).toBe(patient.id);
  });

  it("does not let a patient create appointments", async () => {
    const { patient, examType } = await setup();
    const patientCookie = await loginAs(app, patient.email);

    const response = await app.inject({
      method: "POST",
      url: "/api/appointments",
      headers: { cookie: patientCookie },
      payload: { patientId: patient.id, examTypeId: examType.id, date: futureCivilDate(2), time: "09:00" },
    });

    expect(response.statusCode).toBe(403);
  });

  it("lets a patient see only their own appointments", async () => {
    const { patient, examType, clinicCookie } = await setup();
    const otherPatient = await createPatientUser({ email: "other2@test.local" });
    const date = futureCivilDate(2);

    await app.inject({
      method: "POST",
      url: "/api/appointments",
      headers: { cookie: clinicCookie },
      payload: { patientId: patient.id, examTypeId: examType.id, date, time: "16:00" },
    });
    await app.inject({
      method: "POST",
      url: "/api/appointments",
      headers: { cookie: clinicCookie },
      payload: { patientId: otherPatient.id, examTypeId: examType.id, date, time: "16:30" },
    });

    const patientCookie = await loginAs(app, patient.email);
    const response = await app.inject({
      method: "GET",
      url: "/api/appointments/mine",
      headers: { cookie: patientCookie },
    });

    expect(response.json().appointments).toHaveLength(1);
  });
});
