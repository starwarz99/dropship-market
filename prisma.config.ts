import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use direct (unpooled) URL for migrations — pgBouncer doesn't support DDL
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
});
