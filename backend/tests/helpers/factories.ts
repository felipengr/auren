import bcrypt from "bcryptjs";
import { prisma } from "../../src/lib/prisma.js";

const PASSWORD = "Test@1234";

export async function createClinicUser(overrides: { name?: string; email?: string } = {}) {
  const passwordHash = await bcrypt.hash(PASSWORD, 4); // low cost factor: tests don't need prod-strength hashing
  return prisma.user.create({
    data: {
      name: overrides.name ?? "Clinic Staff",
      email: overrides.email ?? `clinic-${crypto.randomUUID()}@test.local`,
      passwordHash,
      role: "CLINIC",
    },
  });
}

export async function createPatientUser(overrides: { name?: string; email?: string } = {}) {
  const passwordHash = await bcrypt.hash(PASSWORD, 4);
  return prisma.user.create({
    data: {
      name: overrides.name ?? "Test Patient",
      email: overrides.email ?? `patient-${crypto.randomUUID()}@test.local`,
      passwordHash,
      role: "PATIENT",
    },
  });
}

export async function createExamType(name = `Exam-${crypto.randomUUID()}`) {
  return prisma.examType.create({ data: { name } });
}

export { PASSWORD as TEST_PASSWORD };
