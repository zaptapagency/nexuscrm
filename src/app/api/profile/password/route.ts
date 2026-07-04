import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { passwordChangeSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export const POST = withAuth(async (user, req) => {
  const body = await req.json();
  const data = passwordChangeSchema.parse(body);

  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!record) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  const valid = await bcrypt.compare(data.currentPassword, record.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }
  const passwordHash = await bcrypt.hash(data.newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  return ok({ success: true });
});
