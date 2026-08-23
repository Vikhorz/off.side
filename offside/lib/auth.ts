import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { username: credentials.username as string } });
        // Always run bcrypt.compare, even when the user doesn't exist, using a
        // dummy hash — otherwise a nonexistent username returns instantly while
        // a wrong password takes ~100ms+, letting an attacker time responses
        // to discover which usernames are registered.
        const hashToCheck = user?.passwordHash ?? "$2b$12$rbQiFz3VO0PlYQaZQETvu.5ky66QsL8k9JrCAdmjQuF.m89YPbuSC";
        const valid = await bcrypt.compare(credentials.password as string, hashToCheck);
        if (!user || !valid) return null;
        return { id: user.id, name: user.username, email: user.email ?? undefined };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) { if (user) token.id = user.id; return token; },
    session({ session, token }) { if (token.id) session.user.id = token.id as string; return session; },
  },
  pages: { signIn: "/login" },
});
