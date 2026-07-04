import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { userCreateSchema } from "@/lib/validations";

const AVATAR_COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

export const GET = withAuth(async () => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      avatarColor: true,
      createdAt: true,
    },
  });
  return ok(users);
}, "user:manage");

export const POST = withAuth(async (_user, req) => {
  const body = await req.json();
  const data = userCreateSchema.parse(body);
  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    },
    select: { id: true, name: true, email: true, role: true, active: true, avatarColor: true },
  });
  return ok(user, 201);
}, "user:manage");
