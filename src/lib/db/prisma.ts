import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const placeholderDatabaseUrl = "postgresql://johndoe:randompassword@localhost:5432/mydb";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export function isDatabaseConfigured() {
  const databaseUrl = process.env.DATABASE_URL;

  return Boolean(databaseUrl && !databaseUrl.startsWith(placeholderDatabaseUrl));
}

export function getPrisma() {
  if (!isDatabaseConfigured()) {
    return null;
  }

  if (!globalForPrisma.prisma) {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }

  return globalForPrisma.prisma;
}
