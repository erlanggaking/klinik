/**
 * Email service abstraction.
 * Default: noop driver — log only. Tinggal swap ke Resend / Nodemailer / SES.
 */
export interface EmailDriver {
  send(args: { to: string; subject: string; html?: string; text?: string }): Promise<{ providerRef?: string }>;
}

class NoopDriver implements EmailDriver {
  async send(args: { to: string; subject: string; html?: string; text?: string }) {
    // eslint-disable-next-line no-console
    console.log("[EMAIL NOOP]", args.to, "·", args.subject);
    return { providerRef: "noop-" + Date.now() };
  }
}

export function emailDriver(): EmailDriver {
  return new NoopDriver();
}

export async function sendEmail(args: { to: string; subject: string; html?: string; text?: string }) {
  return emailDriver().send(args);
}
