import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db/prisma";
import { normalizePasswordInput, verifyPassword } from "@/lib/auth/password";
import { consumeRateLimit } from "@/lib/rate-limit";
import { normalizeEmail } from "@/lib/utils";
import { writeAuditLog } from "@/lib/audit";
import type { Role } from "@/server/domain/permissions";
import { getEnv } from "@/config/env";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: getEnv().AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: {
    signIn: "/dang-nhap",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = normalizeEmail(String(credentials?.email ?? ""));
        const password = normalizePasswordInput(String(credentials?.password ?? ""));
        if (!email || !password) return null;
        const limit = await consumeRateLimit(`login:${email}`);
        if (!limit.ok) return null;
        const user = await prisma.user.findUnique({
          where: { emailNormalized: email },
          include: { roleAssignments: { where: { revokedAt: null } } },
        });
        if (!user || user.status !== "ACTIVE" || user.deletedAt) {
          await prisma.loginEvent.create({ data: { email, success: false } });
          return null;
        }
        if (user.lockedUntil && user.lockedUntil > new Date()) return null;
        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
          const failedLoginCount = user.failedLoginCount + 1;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginCount,
              lockedUntil: failedLoginCount >= 8 ? new Date(Date.now() + 15 * 60 * 1000) : null,
            },
          });
          return null;
        }
        await prisma.user.update({
          where: { id: user.id },
          data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
        });
        await prisma.loginEvent.create({
          data: { userId: user.id, email, success: true },
        });
        await writeAuditLog({
          actorUserId: user.id,
          action: "auth.login",
          entityType: "User",
          entityId: user.id,
        });
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: { roleAssignments: { where: { revokedAt: null } } },
        });
        token.roles = (dbUser?.roleAssignments.map((item) => item.role) ?? []) as Role[];
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = String(token.userId ?? "");
      session.user.email = String(token.email ?? "");
      session.user.roles = Array.isArray(token.roles) ? token.roles : [];
      return session;
    },
  },
});
