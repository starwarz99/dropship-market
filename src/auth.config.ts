import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";

/**
 * Edge-compatible auth config (no Prisma imports).
 * Used in middleware AND extended by auth.ts.
 *
 * IMPORTANT: session + jwt callbacks must live here so the Edge middleware's
 * NextAuth(authConfig) instance can build a proper session from the JWT cookie.
 * Without them, auth.user is undefined in the middleware and every protected
 * route redirects to sign-in even when the user is logged in.
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
    // Runs on every request in the middleware to build auth.user from the JWT.
    // No Prisma — just maps fields already stored in the token.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = (token.id ?? token.sub) as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session.user.role = (token.role as any) ?? "CUSTOMER";
      }
      return session;
    },

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
