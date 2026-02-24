import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // The Neon serverless driver connects via WebSocket, which requires the
  // DIRECT (non-pooler) endpoint. The -pooler. pgBouncer URL does not speak
  // the WebSocket protocol and will cause an ErrorEvent connection failure.
  // Also check Vercel's Neon integration variable names as fallbacks.
  const connectionString =
    process.env.DIRECT_URL ??
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL;

  if (!connectionString) {
    throw new Error("Missing DATABASE_URL environment variable");
  }

  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
