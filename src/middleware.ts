import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    // Admin-only areas: team management. UI + API both guarded.
    if (pathname.startsWith("/team") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  },
);

// Protect all app routes; leave marketing site, auth, public forms, and tracking open.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/contacts/:path*",
    "/companies/:path*",
    "/deals/:path*",
    "/tasks/:path*",
    "/tickets/:path*",
    "/campaigns/:path*",
    "/segments/:path*",
    "/forms/:path*",
    "/outbox/:path*",
    "/team/:path*",
    "/settings/:path*",
  ],
};
