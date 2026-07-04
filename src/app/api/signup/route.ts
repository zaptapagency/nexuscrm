import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validations";
import { handleError, ok } from "@/lib/api";

const AVATAR_COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = signupSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return ok({ error: "An account with that email already exists." }, 409);
    }

    // First user to ever sign up becomes an Admin; everyone else is a Rep.
    const userCount = await prisma.user.count();
    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: userCount === 0 ? "ADMIN" : "REP",
        avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      },
    });

    return ok({ id: user.id, email: user.email, role: user.role }, 201);
  } catch (err) {
    return handleError(err);
  }
}
