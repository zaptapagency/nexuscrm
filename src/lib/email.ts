import { prisma } from "./prisma";

export interface EmailMessage {
  toEmail: string;
  toName?: string | null;
  fromName: string;
  subject: string;
  body: string; // HTML
  campaignId?: string;
  recipientId?: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<{ id: string }>;
}

/**
 * LocalEmailProvider persists every "sent" email into the database so campaigns
 * are fully testable offline. Emails are rendered in the in-app Outbox viewer.
 */
export class LocalEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<{ id: string }> {
    const record = await prisma.outboxEmail.create({
      data: {
        toEmail: message.toEmail,
        toName: message.toName ?? null,
        fromName: message.fromName,
        subject: message.subject,
        body: message.body,
        campaignId: message.campaignId,
        recipientId: message.recipientId,
      },
    });
    return { id: record.id };
  }
}

export const emailProvider: EmailProvider = new LocalEmailProvider();

/**
 * Injects an open-tracking pixel and rewrites links to go through the click
 * redirect endpoint so opens/clicks update the DB when viewed in the Outbox.
 */
export function instrumentEmailBody(
  body: string,
  campaignId: string,
  recipientId: string,
  baseUrl: string,
): string {
  const pixel = `<img src="${baseUrl}/api/track/open/${recipientId}" width="1" height="1" alt="" style="display:none" />`;
  const rewritten = body.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (_m, url) =>
      `href="${baseUrl}/api/track/click/${recipientId}?url=${encodeURIComponent(url)}"`,
  );
  return `${rewritten}${pixel}`;
}
