import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { noteSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

export const POST = withAuth(async (user, req) => {
  const body = await req.json();
  const data = noteSchema.parse(body);
  const note = await prisma.note.create({
    data: {
      body: data.body,
      authorId: user.id,
      contactId: data.contactId,
      dealId: data.dealId,
    },
    include: { author: { select: { name: true, avatarColor: true } } },
  });
  await logActivity({
    type: "NOTE_ADDED",
    message: `Note added`,
    actorId: user.id,
    contactId: data.contactId,
    dealId: data.dealId,
  });
  return ok(note, 201);
}, "record:edit");
