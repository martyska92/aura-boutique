import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function getDatabaseUrl(): string | undefined {
  const raw =
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL;
  if (!raw) return undefined;
  const clean = raw.trim().replace(/^["']|["']$/g, "");
  return clean || undefined;
}

function createPrismaClient(): PrismaClient {
  const dbUrl = getDatabaseUrl();
  try {
    return new PrismaClient({
      ...(dbUrl ? { datasources: { db: { url: dbUrl } } } : {}),
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  } catch (error) {
    console.warn("PrismaClient initialization warning:", error);
    return new Proxy({} as PrismaClient, {
      get(target, prop) {
        if (prop in target) return (target as any)[prop];
        return () => Promise.reject(new Error("Prisma client is not initialized"));
      },
    });
  }
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? (globalForPrisma.prisma = createPrismaClient());

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
