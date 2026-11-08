import { prisma } from "../../src/lib/prisma.js";

/** Wipes every table between tests, respecting FK order. */
export async function resetDb() {
  await prisma.report.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.user.deleteMany();
  await prisma.examType.deleteMany();
}
