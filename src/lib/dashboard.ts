import { prisma } from "./prisma";
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from "date-fns";

export async function dashboardKpis() {
  const now = new Date();
  const today = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const last7Start = startOfDay(subDays(now, 6));

  const [
    revenueToday,
    revenueMonth,
    patientsToday,
    appointmentsToday,
    completedToday,
    activePatients,
    last7Revenue,
    topTreatments,
    topProducts,
    doctorPerf,
    lowStockCount,
    expiringSoon,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: { paidAt: { gte: today, lte: todayEnd } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { paidAt: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.appointment.count({
      where: { startAt: { gte: today, lte: todayEnd }, status: { in: ["CHECKED_IN", "IN_CONSULTATION", "IN_TREATMENT", "COMPLETED"] } },
    }),
    prisma.appointment.count({
      where: { startAt: { gte: today, lte: todayEnd } },
    }),
    prisma.appointment.count({
      where: { startAt: { gte: today, lte: todayEnd }, status: "COMPLETED" },
    }),
    prisma.patient.count({ where: { isActive: true } }),
    last7Days(last7Start, todayEnd),
    prisma.treatmentItem.groupBy({
      by: ["treatmentId"],
      where: { performedAt: { gte: monthStart, lte: monthEnd } },
      _count: { _all: true },
      _sum: { total: true },
      orderBy: { _count: { treatmentId: "desc" } },
      take: 5,
    }),
    prisma.invoiceItem.groupBy({
      by: ["inventoryItemId"],
      where: {
        itemType: "PRODUCT",
        inventoryItemId: { not: null },
        invoice: { issuedAt: { gte: monthStart, lte: monthEnd }, status: { in: ["PAID", "PARTIALLY_PAID"] } },
      },
      _sum: { qty: true, total: true },
      orderBy: { _sum: { qty: "desc" } },
      take: 5,
    }),
    prisma.treatmentItem.groupBy({
      by: ["performedById"],
      where: { performedAt: { gte: monthStart, lte: monthEnd }, performedById: { not: null } },
      _count: { _all: true },
      _sum: { total: true },
      orderBy: { _count: { performedById: "desc" } },
      take: 5,
    }),
    countLowStock(),
    prisma.inventoryBatch.count({
      where: {
        expiredAt: { gte: now, lte: new Date(now.getTime() + 60 * 24 * 3600 * 1000) },
        quantity: { gt: 0 },
      },
    }),
  ]);

  // Resolve names
  const treatmentIds = topTreatments.map((t: any) => t.treatmentId);
  const treatmentNames: any[] = treatmentIds.length
    ? await prisma.treatment.findMany({ where: { id: { in: treatmentIds } } })
    : [];
  const productIds = topProducts.map((p: any) => p.inventoryItemId).filter(Boolean) as string[];
  const productNames: any[] = productIds.length
    ? await prisma.inventoryItem.findMany({ where: { id: { in: productIds } } })
    : [];
  const doctorIds = doctorPerf.map((d: any) => d.performedById).filter(Boolean) as string[];
  const doctors: any[] = doctorIds.length
    ? await prisma.staffProfile.findMany({
        where: { id: { in: doctorIds } },
        include: { user: true },
      })
    : [];

  return {
    revenueToday: Number(revenueToday._sum.amount ?? 0),
    revenueMonth: Number(revenueMonth._sum.amount ?? 0),
    patientsToday,
    appointmentsToday,
    completedToday,
    activePatients,
    last7Revenue,
    topTreatments: topTreatments.map((t: any) => ({
      name: treatmentNames.find((x: any) => x.id === t.treatmentId)?.nameId ?? t.treatmentId,
      count: t._count._all,
      revenue: Number(t._sum.total ?? 0),
    })),
    topProducts: topProducts.map((p: any) => ({
      name: productNames.find((x: any) => x.id === p.inventoryItemId)?.nameId ?? "—",
      qty: Number(p._sum.qty ?? 0),
      revenue: Number(p._sum.total ?? 0),
    })),
    doctorPerformance: doctorPerf.map((d: any) => {
      const sp = doctors.find((x: any) => x.id === d.performedById);
      return {
        name: sp?.user.name ?? "—",
        treatments: d._count._all,
        revenue: Number(d._sum.total ?? 0),
      };
    }),
    lowStockCount,
    expiringSoon,
  };
}

async function last7Days(from: Date, to: Date) {
  const payments = await prisma.payment.findMany({
    where: { paidAt: { gte: from, lte: to } },
    select: { amount: true, paidAt: true },
  });
  const buckets: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const key = d.toISOString().slice(0, 10);
    buckets[key] = 0;
  }
  for (const p of payments) {
    const key = p.paidAt.toISOString().slice(0, 10);
    if (key in buckets) buckets[key] += Number(p.amount);
  }
  return Object.entries(buckets).map(([date, value]) => ({ date, value }));
}

async function countLowStock() {
  const items = await prisma.inventoryItem.findMany({
    where: { isActive: true },
    select: { id: true, reorderPoint: true, isBatchTracked: true },
  });
  let cnt = 0;
  for (const it of items) {
    let qty = 0;
    if (it.isBatchTracked) {
      const r = await prisma.inventoryBatch.aggregate({ where: { itemId: it.id }, _sum: { quantity: true } });
      qty = Number(r._sum.quantity ?? 0);
    } else {
      const r = await prisma.stockMovement.aggregate({ where: { itemId: it.id }, _sum: { quantity: true } });
      qty = Number(r._sum.quantity ?? 0);
    }
    if (qty <= Number(it.reorderPoint)) cnt++;
  }
  return cnt;
}
