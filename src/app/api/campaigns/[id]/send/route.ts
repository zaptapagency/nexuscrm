import { prisma } from "@/lib/prisma";
import { withAuth, ok } from "@/lib/api";
import { segmentFilterSchema } from "@/lib/validations";
import { buildContactWhere } from "@/lib/segments";
import { emailProvider, instrumentEmailBody } from "@/lib/email";
import { logActivity } from "@/lib/activity";
import { NextResponse } from "next/server";

export const POST = withAuth(async (user, req, { params }) => {
  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: params.id },
    include: { segment: true },
  });

  if (campaign.status === "SENT") {
    return NextResponse.json({ error: "This campaign has already been sent." }, { status: 400 });
  }
  if (!campaign.segment) {
    return NextResponse.json({ error: "Attach a segment before sending." }, { status: 400 });
  }

  const filters = segmentFilterSchema.safeParse(JSON.parse(campaign.segment.filters));
  const where = buildContactWhere(filters.success ? filters.data : {});
  const contacts = await prisma.contact.findMany({
    where,
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  if (contacts.length === 0) {
    return NextResponse.json(
      { error: "The attached segment matches no contacts." },
      { status: 400 },
    );
  }

  const baseUrl = new URL(req.url).origin;
  let sent = 0;

  for (const contact of contacts) {
    const recipient = await prisma.campaignRecipient.create({
      data: {
        campaignId: campaign.id,
        contactId: contact.id,
        email: contact.email,
      },
    });
    const body = instrumentEmailBody(campaign.body, campaign.id, recipient.id, baseUrl);
    await emailProvider.send({
      toEmail: contact.email,
      toName: `${contact.firstName} ${contact.lastName}`,
      fromName: campaign.fromName,
      subject: campaign.subject,
      body,
      campaignId: campaign.id,
      recipientId: recipient.id,
    });
    sent++;
  }

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { status: "SENT", sentAt: new Date() },
  });

  await logActivity({
    type: "EMAIL_SENT",
    message: `Campaign "${campaign.name}" sent to ${sent} recipient${sent === 1 ? "" : "s"}`,
    actorId: user.id,
  });

  return ok({ sent });
}, "campaign:send");
