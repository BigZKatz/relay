import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// Bypass is gated on NODE_ENV=development so it's a no-op in production even if the env var is set.
const isDevBypassEnabled = process.env.NODE_ENV === "development" && process.env.DEV_AUTH_BYPASS === "true";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user || isDevBypassEnabled;
      const isOnDashboard = !nextUrl.pathname.startsWith("/login") && !nextUrl.pathname.startsWith("/api/auth");
      if (isOnDashboard) return isLoggedIn;
      if (session?.user || isDevBypassEnabled) return Response.redirect(new URL("/", nextUrl));
      return true;
    },
    session({ session }) {
      if (session.user || !isDevBypassEnabled) return session;
      return {
        ...session,
        user: {
          name: "Dev Bypass",
          email: "dev-bypass@local.test",
          image: null,
        },
      };
    },
  },
});
