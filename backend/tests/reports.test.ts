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

describe("reports", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await resetDb();
  });

  async function scheduleAppointment(clinicCookie: string, patientId: string, examTypeId: string, time: string) {
    const response = await app.inject({
      method: "POST",
      url: "/api/appointments",
      headers: { cookie: clinicCookie },
      payload: { patientId, examTypeId, date: futureCivilDate(2), time },
    });
    return response.json().appointment.id as string;
  }

  async function setup() {
    const clinic = await createClinicUser({ email: "clinic@test.local" });
    const patient = await createPatientUser({ email: "patient@test.local" });
    const examType = await createExamType("Ultrassom");
    const clinicCookie = await loginAs(app, clinic.email);
    return { clinic, patient, examType, clinicCookie };
  }

  it("creates a draft report and keeps it editable", async () => {
    const { patient, examType, clinicCookie } = await setup();
    const appointmentId = await scheduleAppointment(clinicCookie, patient.id, examType.id, "08:00");

    const created = await app.inject({
      method: "POST",
      url: `/api/appointments/${appointmentId}/report`,
      headers: { cookie: clinicCookie },
      payload: { title: "Título inicial", content: "Texto inicial", professionalName: "Dr. Teste" },
    });
    expect(created.statusCode).toBe(201);
    const reportId = created.json().report.id as string;
    expect(created.json().report.status).toBe("DRAFT");

    const edited = await app.inject({
      method: "PATCH",
      url: `/api/reports/${reportId}`,
      headers: { cookie: clinicCookie },
      payload: { title: "Título revisado" },
    });
    expect(edited.statusCode).toBe(200);
    expect(edited.json().report.title).toBe("Título revisado");
  });

  it("does not allow a second report on the same appointment", async () => {
    const { patient, examType, clinicCookie } = await setup();
    const appointmentId = await scheduleAppointment(clinicCookie, patient.id, examType.id, "08:30");

    await app.inject({
      method: "POST",
      url: `/api/appointments/${appointmentId}/report`,
      headers: { cookie: clinicCookie },
      payload: { title: "t", content: "c", professionalName: "Dr. Teste" },
    });

    const second = await app.inject({
      method: "POST",
      url: `/api/appointments/${appointmentId}/report`,
      headers: { cookie: clinicCookie },
      payload: { title: "t2", content: "c2", professionalName: "Dr. Teste" },
    });
    expect(second.statusCode).toBe(409);
  });

  it("does not allow a report on a cancelled appointment", async () => {
    const { patient, examType, clinicCookie } = await setup();
    const appointmentId = await scheduleAppointment(clinicCookie, patient.id, examType.id, "09:00");

    await app.inject({
      method: "DELETE",
      url: `/api/appointments/${appointmentId}`,
      headers: { cookie: clinicCookie },
    });

    const response = await app.inject({
      method: "POST",
      url: `/api/appointments/${appointmentId}/report`,
      headers: { cookie: clinicCookie },
      payload: { title: "t", content: "c", professionalName: "Dr. Teste" },
    });
    expect(response.statusCode).toBe(409);
  });

  it("does not allow editing a published report", async () => {
    const { patient, examType, clinicCookie } = await setup();
    const appointmentId = await scheduleAppointment(clinicCookie, patient.id, examType.id, "09:30");

    const created = await app.inject({
      method: "POST",
      url: `/api/appointments/${appointmentId}/report`,
      headers: { cookie: clinicCookie },
      payload: { title: "t", content: "c", professionalName: "Dr. Teste" },
    });
    const reportId = created.json().report.id as string;

    await app.inject({
      method: "POST",
      url: `/api/reports/${reportId}/publish`,
      headers: { cookie: clinicCookie },
    });

    const edited = await app.inject({
      method: "PATCH",
      url: `/api/reports/${reportId}`,
      headers: { cookie: clinicCookie },
      payload: { title: "tentativa de edição" },
    });
    expect(edited.statusCode).toBe(409);
  });

  // Cenário obrigatório 4: um laudo é publicado e passa a estar disponível
  // para o paciente correto.
  it("makes a published report available to the owning patient", async () => {
    const { patient, examType, clinicCookie } = await setup();
    const appointmentId = await scheduleAppointment(clinicCookie, patient.id, examType.id, "10:00");

    const created = await app.inject({
      method: "POST",
      url: `/api/appointments/${appointmentId}/report`,
      headers: { cookie: clinicCookie },
      payload: { title: "Resultado", content: "Sem alterações.", professionalName: "Dr. Teste" },
    });
    const reportId = created.json().report.id as string;

    const patientCookie = await loginAs(app, patient.email);
    const beforePublish = await app.inject({
      method: "GET",
      url: `/api/reports/${reportId}`,
      headers: { cookie: patientCookie },
    });
    expect(beforePublish.statusCode).toBe(404);

    await app.inject({
      method: "POST",
      url: `/api/reports/${reportId}/publish`,
      headers: { cookie: clinicCookie },
    });

    const afterPublish = await app.inject({
      method: "GET",
      url: `/api/reports/${reportId}`,
      headers: { cookie: patientCookie },
    });
    expect(afterPublish.statusCode).toBe(200);
    expect(afterPublish.json().report.title).toBe("Resultado");

    const mine = await app.inject({
      method: "GET",
      url: "/api/reports/mine",
      headers: { cookie: patientCookie },
    });
    expect(mine.json().reports).toHaveLength(1);
  });

  // Cenário obrigatório 3: um paciente tenta acessar um rascunho — o
  // conteúdo não deve ser disponibilizado.
  it("never exposes a draft report's content to the patient", async () => {
    const { patient, examType, clinicCookie } = await setup();
    const appointmentId = await scheduleAppointment(clinicCookie, patient.id, examType.id, "10:30");

    const created = await app.inject({
      method: "POST",
      url: `/api/appointments/${appointmentId}/report`,
      headers: { cookie: clinicCookie },
      payload: { title: "Rascunho sigiloso", content: "Não pode vazar", professionalName: "Dr. Teste" },
    });
    const reportId = created.json().report.id as string;

    const patientCookie = await loginAs(app, patient.email);

    const byId = await app.inject({
      method: "GET",
      url: `/api/reports/${reportId}`,
      headers: { cookie: patientCookie },
    });
    expect(byId.statusCode).toBe(404);
    expect(byId.body).not.toContain("Não pode vazar");

    const byAppointment = await app.inject({
      method: "GET",
      url: `/api/appointments/${appointmentId}/report`,
      headers: { cookie: patientCookie },
    });
    expect(byAppointment.statusCode).toBe(404);

    const listMine = await app.inject({
      method: "GET",
      url: "/api/appointments/mine",
      headers: { cookie: patientCookie },
    });
    expect(listMine.json().appointments[0]).toMatchObject({ hasPublishedReport: false });
  });

  // Cenário obrigatório 2: um paciente tenta consultar um laudo de outro
  // paciente — o acesso deve ser negado.
  it("denies a patient access to another patient's published report", async () => {
    const { patient, examType, clinicCookie } = await setup();
    const otherPatient = await createPatientUser({ email: "other@test.local" });
    const appointmentId = await scheduleAppointment(clinicCookie, patient.id, examType.id, "11:00");

    const created = await app.inject({
      method: "POST",
      url: `/api/appointments/${appointmentId}/report`,
      headers: { cookie: clinicCookie },
      payload: { title: "Confidencial", content: "Dados do paciente A", professionalName: "Dr. Teste" },
    });
    const reportId = created.json().report.id as string;

    await app.inject({
      method: "POST",
      url: `/api/reports/${reportId}/publish`,
      headers: { cookie: clinicCookie },
    });

    const otherPatientCookie = await loginAs(app, otherPatient.email);
    const response = await app.inject({
      method: "GET",
      url: `/api/reports/${reportId}`,
      headers: { cookie: otherPatientCookie },
    });

    expect(response.statusCode).toBe(404);
    expect(response.body).not.toContain("Dados do paciente A");
  });

  it("lets the clinic list all reports, filterable by status", async () => {
    const { patient, examType, clinicCookie } = await setup();

    const draftAppointment = await scheduleAppointment(clinicCookie, patient.id, examType.id, "12:00");
    await app.inject({
      method: "POST",
      url: `/api/appointments/${draftAppointment}/report`,
      headers: { cookie: clinicCookie },
      payload: { title: "Rascunho", content: "c", professionalName: "Dr. Teste" },
    });

    const publishedAppointment = await scheduleAppointment(clinicCookie, patient.id, examType.id, "12:30");
    const publishedReport = await app.inject({
      method: "POST",
      url: `/api/appointments/${publishedAppointment}/report`,
      headers: { cookie: clinicCookie },
      payload: { title: "Publicado", content: "c", professionalName: "Dr. Teste" },
    });
    await app.inject({
      method: "POST",
      url: `/api/reports/${publishedReport.json().report.id}/publish`,
      headers: { cookie: clinicCookie },
    });

    const all = await app.inject({ method: "GET", url: "/api/reports", headers: { cookie: clinicCookie } });
    expect(all.json().reports).toHaveLength(2);

    const onlyPublished = await app.inject({
      method: "GET",
      url: "/api/reports?status=PUBLISHED",
      headers: { cookie: clinicCookie },
    });
    const titles = onlyPublished.json().reports.map((r: { title: string }) => r.title);
    expect(titles).toEqual(["Publicado"]);
  });

  it("does not let a patient list all reports", async () => {
    const { patient } = await setup();
    const patientCookie = await loginAs(app, patient.email);

    const response = await app.inject({ method: "GET", url: "/api/reports", headers: { cookie: patientCookie } });
    expect(response.statusCode).toBe(403);
  });
});
