import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  try {
    return new PrismaClient({
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
