import type { Role } from "@/server/domain/permissions";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      roles: Role[];
      emailIsVerified: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    roles?: Role[];
    isEmailVerified?: boolean;
  }
}

export {};
