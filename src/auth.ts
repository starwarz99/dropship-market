import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  // JWT strategy: session is a signed token the Edge middleware can verify
  // without a database connection. PrismaAdapter still handles user/account
  // creation; sessions just aren't stored in the DB Session table.
  session: { strategy: "jwt" },
  callbacks: {
    // Keep the authorized callback from authConfig
    ...authConfig.callbacks,

    async signIn({ user }) {
      // Auto-promote matching email to ADMIN.
      // Wrapped in try/catch so any DB error never blocks sign-in.
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail && user.email === adminEmail) {
        try {
          await prisma.user.update({
            where: { email: user.email },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: { role: "ADMIN" as any },
          });
        } catch {
          // Non-fatal — sign-in proceeds; role will be promoted on next attempt.
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      // `user` is only present on the initial sign-in. Re-fetch from DB so
      // we pick up the role that the signIn callback may have just set.
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        token.id = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (dbUser?.role as any) ?? "CUSTOMER";
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session.user.role = (token.role as any) ?? "CUSTOMER";
      }
      return session;
    },
  },
});
