import { prisma } from "../src/lib/prisma.js";
import { seedDemoData } from "./seed-data.js";

seedDemoData()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
