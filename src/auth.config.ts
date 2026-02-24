import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";

/**
 * Edge-compatible auth config (no Prisma imports).
 * Used in middleware only. Must use JWT strategy so the Edge runtime
 * can verify sessions without a database connection.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    ...(process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET
      ? [
          Facebook({
            clientId: process.env.AUTH_FACEBOOK_ID,
            clientSecret: process.env.AUTH_FACEBOOK_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = (auth?.user as { role?: string } | undefined)?.role === "ADMIN";
      const pathname = nextUrl.pathname;

      if (pathname.startsWith("/admin")) {
        return isAdmin;
      }

      const protectedPaths = ["/orders", "/account", "/checkout"];
      if (protectedPaths.some((p) => pathname.startsWith(p))) {
        return isLoggedIn;
      }

      return true;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};
