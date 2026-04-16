import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

// Bypass is gated on NODE_ENV=development so it's a no-op in production even if the env var is set.
const isDevBypassEnabled = process.env.NODE_ENV === "development" && process.env.DEV_AUTH_BYPASS === "true";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google,
    Credentials({
      id: "demo",
      name: "Demo Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Read env vars at call time so Railway-injected values are always current
        const demoEmail = process.env.DEMO_LOGIN_EMAIL ?? "demo@relay.app";
        const demoPassword = process.env.DEMO_LOGIN_PASSWORD;
        if (
          demoPassword &&
          credentials?.email === demoEmail &&
          credentials?.password === demoPassword
        ) {
          return { id: "demo-user", name: "Demo User", email: demoEmail };
        }
        return null;
      },
    }),
  ],
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
