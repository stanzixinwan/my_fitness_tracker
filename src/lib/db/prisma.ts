import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const placeholderDatabaseUrl = "postgresql://johndoe:randompassword@localhost:5432/mydb";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  databaseUrl?: string;
};

export function isDatabaseConfigured() {
  const databaseUrl = process.env.DATABASE_URL;

  return Boolean(databaseUrl && !databaseUrl.startsWith(placeholderDatabaseUrl));
}

export function requirePrisma() {
  const prisma = getPrisma();

  if (!prisma) {
    throw new Error(
      "Database is not configured. Set DATABASE_URL in .env and restart the dev server.",
    );
  }

  return prisma;
}

export function getPrisma() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!isDatabaseConfigured()) {
    return null;
  }

  if (!globalForPrisma.prisma || globalForPrisma.databaseUrl !== databaseUrl) {
    const adapter = new PrismaPg({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 10_000,
      max: 5,
    });
    globalForPrisma.prisma = new PrismaClient({ adapter });
    globalForPrisma.databaseUrl = databaseUrl;
  }

  return globalForPrisma.prisma;
}
