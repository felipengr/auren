import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { UnauthorizedError } from "../../lib/errors.js";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: "CLINIC" | "PATIENT";
};

export async function login(email: string, password: string): Promise<AuthenticatedUser> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  // Same error for "no such user" and "wrong password": don't leak which one it was.
  if (!user) {
    throw new UnauthorizedError("E-mail ou senha inválidos");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new UnauthorizedError("E-mail ou senha inválidos");
  }

  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function getUserById(id: string): Promise<AuthenticatedUser | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}
