import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { userUpdateSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export const PATCH = withAuth(async (user, req, { params }) => {
  const body = await req.json();
  const data = userUpdateSchema.parse(body);

  // Prevent an admin from removing their own admin role or deactivating themselves,
  // which could lock everyone out.
  if (params.id === user.id) {
    if (data.role && data.role !== "ADMIN") {
      return NextResponse.json({ error: "You cannot change your own role." }, { status: 400 });
    }
    if (data.active === false) {
      return NextResponse.json({ error: "You cannot deactivate yourself." }, { status: 400 });
    }
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, name: true, email: true, role: true, active: true, avatarColor: true },
  });
  return ok(updated);
}, "user:manage");

export const DELETE = withAuth(async (user, _req, { params }) => {
  if (params.id === user.id) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }
  // Soft-delete by deactivating to preserve historical ownership references.
  await prisma.user.update({ where: { id: params.id }, data: { active: false } });
  return ok({ success: true });
}, "user:manage");
