import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const ROLE_GATES: { prefix: string; roles: string[] }[] = [
  { prefix: "/dashboard", roles: ["PARTICIPANT", "ADMIN", "SUPER_ADMIN", "REVIEWER", "JUDGE", "TECH_OPERATOR"] },
  { prefix: "/admin", roles: ["ADMIN", "SUPER_ADMIN", "TECH_OPERATOR"] },
  { prefix: "/reviewer", roles: ["REVIEWER", "ADMIN", "SUPER_ADMIN"] },
  { prefix: "/judge", roles: ["JUDGE", "ADMIN", "SUPER_ADMIN"] },
  { prefix: "/stage", roles: ["ADMIN", "SUPER_ADMIN", "TECH_OPERATOR"] },
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const gate = ROLE_GATES.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`));
  if (!gate) return NextResponse.next();
  if (!req.auth?.user) {
    const url = req.nextUrl.clone();
    url.pathname = "/dang-nhap";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }
  const roles = req.auth.user.roles ?? [];
  if (!roles.includes("SUPER_ADMIN") && !roles.some((role) => gate.roles.includes(role))) {
    return NextResponse.redirect(new URL("/403", req.url));
  }
  const response = NextResponse.next();
  response.headers.set("x-robots-tag", "noindex, nofollow");
  return response;
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/reviewer/:path*", "/judge/:path*", "/stage/:path*"],
};
