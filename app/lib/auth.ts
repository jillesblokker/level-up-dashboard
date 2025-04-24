import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import { User } from "next-auth";
import NextAuth, { getServerSession } from "next-auth";

interface ExtendedSession extends Session {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

interface GithubUser extends User {
  id: string;
}

interface ExtendedJWT extends JWT {
  id?: string;
}

const isDev = process.env.NODE_ENV === "development";
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || "http://localhost:3005";

export const authOptions: NextAuthOptions = {
  debug: process.env.NEXTAUTH_DEBUG === "true",
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
      authorization: {
        params: {
          redirect_uri: `${NEXTAUTH_URL}/api/auth/callback/github`,
        },
      },
    }),
  ],
  useSecureCookies: !isDev,
  cookies: {
    sessionToken: {
      name: `${isDev ? "" : "__Secure-"}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: !isDev,
        maxAge: 30 * 24 * 60 * 60 // 30 days
      }
    },
    callbackUrl: {
      name: `${isDev ? "" : "__Secure-"}next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: !isDev
      }
    },
    csrfToken: {
      name: `${isDev ? "" : "__Secure-"}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: !isDev
      }
    },
    state: {
      name: `${isDev ? "" : "__Secure-"}next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: !isDev,
        maxAge: 900 // 15 minutes
      }
    }
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("[Auth Debug] Sign in callback:", { user, account, profile });
      return true;
    },
    async redirect({ url, baseUrl }) {
      console.log("[Auth Debug] Redirect callback:", { url, baseUrl });
      if (!url.startsWith(baseUrl)) {
        return baseUrl;
      }
      return url;
    },
    async session({ session, token }) {
      console.log("[Auth Debug] Session callback:", { session, token });
      const extendedSession = session as ExtendedSession;
      const extendedToken = token as ExtendedJWT;
      if (extendedSession.user) {
        extendedSession.user.id = extendedToken.id;
      }
      return extendedSession;
    },
    async jwt({ token, user }) {
      console.log("[Auth Debug] JWT callback:", { token, user });
      const extendedToken = token as ExtendedJWT;
      if (user) {
        const githubUser = user as GithubUser;
        extendedToken.id = githubUser.id;
      }
      return extendedToken;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  }
};

// Export auth function for server-side usage
export const auth = () => getServerSession(authOptions); 