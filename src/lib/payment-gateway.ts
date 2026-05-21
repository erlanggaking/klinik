/**
 * Payment gateway abstraction (dummy).
 * Buat dynamic QRIS, virtual account, e-wallet — saat ini noop, tinggal swap
 * ke Midtrans / Xendit di produksi.
 */
export interface PaymentGatewayDriver {
  createQrisCharge(args: { amount: number; orderId: string; expiresInMinutes?: number }): Promise<{
    providerRef: string;
    qrString: string; // string yang bisa di-encode ke QR image
    expiresAt: Date;
    deepLinkUrl?: string;
  }>;
  checkStatus(providerRef: string): Promise<{ status: "PENDING" | "PAID" | "EXPIRED" | "FAILED" }>;
}

class DummyDriver implements PaymentGatewayDriver {
  async createQrisCharge(args: { amount: number; orderId: string; expiresInMinutes?: number }) {
    const exp = new Date(Date.now() + (args.expiresInMinutes ?? 30) * 60 * 1000);
    return {
      providerRef: `DUMMY-${Date.now()}`,
      qrString: `00020101021126${args.orderId}5204${args.amount}5303360540${args.amount}5802ID5901K6004City6304ABCD`,
      expiresAt: exp,
      deepLinkUrl: undefined,
    };
  }
  async checkStatus(_providerRef: string) {
    return { status: "PENDING" as const };
  }
}

let _driver: PaymentGatewayDriver | null = null;
export function paymentGateway(): PaymentGatewayDriver {
  if (_driver) return _driver;
  _driver = new DummyDriver();
  return _driver;
}
