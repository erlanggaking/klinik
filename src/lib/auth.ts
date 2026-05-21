import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: {
            roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
          },
        });
        if (!user || !user.isActive) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        const roles: string[] = user.roles.map((ur: any) => ur.role.code);
        const permissions: string[] = Array.from(
          new Set(
            user.roles.flatMap((ur: any) =>
              ur.role.permissions.map((rp: any) => rp.permission.code as string)
            )
          )
        );

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          locale: user.locale,
          roles,
          permissions,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = (user as any).id;
        token.roles = (user as any).roles;
        token.permissions = (user as any).permissions;
        token.locale = (user as any).locale ?? "id";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.uid;
        (session.user as any).roles = token.roles ?? [];
        (session.user as any).permissions = token.permissions ?? [];
        (session.user as any).locale = token.locale ?? "id";
      }
      return session;
    },
  },
};
