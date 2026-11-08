import { prisma } from "../src/lib/prisma.js";
import { seedDemoData } from "./seed-data.js";

/**
 * Roda no boot do servidor em produção (Render free tier tem disco efêmero:
 * um redeploy ou reciclagem do container pode zerar o SQLite). Se o banco
 * já tem dados, não faz nada — nunca duplica agendamentos existentes.
 */
async function main() {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log(`ensure-seeded: banco já populado (${userCount} usuários), nada a fazer.`);
    return;
  }

  console.log("ensure-seeded: banco vazio, populando com dados de demonstração…");
  await seedDemoData();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
