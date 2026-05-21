import { prisma } from "./prisma";

export type WhatsAppMessage = {
  to: string; // phone number, E.164 atau format Indonesia (08xx)
  body: string;
  templateCode?: string;
  patientId?: string;
  refType?: string;
  refId?: string;
};

export interface WhatsAppDriver {
  send(msg: WhatsAppMessage): Promise<{ providerRef?: string }>;
}

class NoopDriver implements WhatsAppDriver {
  async send(msg: WhatsAppMessage) {
    // eslint-disable-next-line no-console
    console.log("[WA NOOP] would send to", msg.to, "body:", msg.body.slice(0, 100));
    return { providerRef: "noop-" + Date.now() };
  }
}

// Stub kalau nanti pakai Fonnte/Wablas/Meta — implementasi konkrit.
function getDriver(): WhatsAppDriver {
  // const driver = process.env.WA_DRIVER ?? "noop";
  // switch(driver) { case "fonnte": ...; case "meta": ...; }
  return new NoopDriver();
}

/**
 * Enqueue a WA message into MessageOutbox (durable, retry-able).
 * Actual sending is processed by sendQueued() below atau scheduler.
 */
export async function enqueueWhatsApp(msg: WhatsAppMessage) {
  return prisma.messageOutbox.create({
    data: {
      channel: "WHATSAPP",
      toAddress: msg.to,
      body: msg.body,
      patientId: msg.patientId,
      refType: msg.refType,
      refId: msg.refId,
      status: "QUEUED",
      template: msg.templateCode
        ? { connect: { code: msg.templateCode } }
        : undefined,
    },
  });
}

/**
 * Send a single outbox message immediately. Returns updated outbox record.
 */
export async function sendOutbox(outboxId: string) {
  const driver = getDriver();
  const outbox = await prisma.messageOutbox.findUnique({ where: { id: outboxId } });
  if (!outbox) throw new Error("outbox not found");
  await prisma.messageOutbox.update({
    where: { id: outboxId },
    data: { status: "SENDING" },
  });
  try {
    const res = await driver.send({
      to: outbox.toAddress,
      body: outbox.body,
      patientId: outbox.patientId ?? undefined,
      refType: outbox.refType ?? undefined,
      refId: outbox.refId ?? undefined,
    });
    return prisma.messageOutbox.update({
      where: { id: outboxId },
      data: { status: "SENT", sentAt: new Date(), providerRef: res.providerRef },
    });
  } catch (e: any) {
    return prisma.messageOutbox.update({
      where: { id: outboxId },
      data: {
        status: "FAILED",
        errorMsg: e?.message ?? String(e),
        retries: { increment: 1 },
      },
    });
  }
}

export function renderTemplate(body: string, data: Record<string, any>): string {
  return body.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const parts = key.split(".");
    let v: any = data;
    for (const p of parts) v = v?.[p];
    return v == null ? "" : String(v);
  });
}
