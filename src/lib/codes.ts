import { prisma } from "./prisma";

/**
 * Generate sequential codes like MR-2026-00001, INV-2026-00001, dll.
 * Uses count(year) + 1 as the sequence. For higher concurrency,
 * swap to a dedicated counters table with row-level locks.
 */
export async function nextCode(prefix: string, year = new Date().getFullYear()) {
  const yearStart = new Date(`${year}-01-01T00:00:00Z`);
  const yearEnd = new Date(`${year + 1}-01-01T00:00:00Z`);

  const counters: Record<string, () => Promise<number>> = {
    MR: () => prisma.medicalRecord.count({ where: { createdAt: { gte: yearStart, lt: yearEnd } } }),
    APT: () => prisma.appointment.count({ where: { createdAt: { gte: yearStart, lt: yearEnd } } }),
    INV: () => prisma.invoice.count({ where: { createdAt: { gte: yearStart, lt: yearEnd } } }),
    RX: () => prisma.prescription.count({ where: { createdAt: { gte: yearStart, lt: yearEnd } } }),
    PT: () => prisma.patient.count({ where: { createdAt: { gte: yearStart, lt: yearEnd } } }),
    PO: () => prisma.purchaseOrder.count({ where: { orderedAt: { gte: yearStart, lt: yearEnd } } }),
    OP: () => prisma.stockOpname.count({ where: { startedAt: { gte: yearStart, lt: yearEnd } } }),
  };

  const counter = counters[prefix];
  const seq = counter ? (await counter()) + 1 : 1;
  return `${prefix}-${year}-${String(seq).padStart(5, "0")}`;
}

export function todayQueueNumber(prefixLetter: string, sequence: number) {
  return `${prefixLetter}${String(sequence).padStart(3, "0")}`;
}
