import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSession } from "./auth";
import { can, type Permission, ForbiddenError } from "./rbac";

export interface AuthedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: string;
  avatarColor: string;
}

export async function getAuthedUser(): Promise<AuthedUser | null> {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Wraps a route handler, injecting the authenticated user. Returns 401 if not
 * authenticated. Optionally enforces a permission (403 on failure).
 */
export function withAuth(
  handler: (user: AuthedUser, req: Request, ctx: { params: Record<string, string> }) => Promise<Response> | Response,
  permission?: Permission,
) {
  return async (req: Request, ctx: { params: Record<string, string> }) => {
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (permission && !can(user.role, permission)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    try {
      return await handler(user, req, ctx);
    } catch (err) {
      return handleError(err);
    }
  };
}

export function handleError(err: unknown): Response {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", issues: err.flatten().fieldErrors },
      { status: 422 },
    );
  }
  if (err instanceof ForbiddenError) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
  if (err instanceof Error && err.message === "UNAUTHENTICATED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Unique constraint violations from Prisma.
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code: string }).code;
    if (code === "P2002") {
      return NextResponse.json(
        { error: "A record with that unique value already exists." },
        { status: 409 },
      );
    }
    if (code === "P2025") {
      return NextResponse.json({ error: "Record not found." }, { status: 404 });
    }
  }
  console.error("[API error]", err);
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}

export function ok<T>(data: T, status = 200): Response {
  return NextResponse.json(data, { status });
}
