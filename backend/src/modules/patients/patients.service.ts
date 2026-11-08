import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import { ConflictError } from "../../lib/errors.js";

export async function list() {
  return prisma.user.findMany({
    where: { role: "PATIENT" },
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { name: "asc" },
  });
}

export async function create(input: { name: string; email: string; password: string }) {
  const passwordHash = await bcrypt.hash(input.password, 10);

  try {
    const patient = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase().trim(),
        passwordHash,
        role: "PATIENT",
      },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    return patient;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictError("Já existe uma conta cadastrada com esse e-mail");
    }
    throw error;
  }
}
