import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Antrian Display TV mode — public, fullscreen, auto-refresh tiap 5 detik.
 * Cocok untuk monitor di ruang tunggu klinik.
 */
export default async function QueueDisplayPage() {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const tickets = await prisma.queueTicket.findMany({
    where: { date: today, status: { in: ["WAITING", "CALLED", "IN_PROGRESS"] } },
    include: { patient: true, appointment: { include: { primaryStaff: { include: { user: true } } } } },
    orderBy: [{ stage: "asc" }, { createdAt: "asc" }],
  });

  const grouped: Record<string, typeof tickets> = {
    WAITING_CONSULT: [],
    WAITING_TREATMENT: [],
    WAITING_PHARMACY: [],
    WAITING_CASHIER: [],
  };
  for (const t of tickets) (grouped[t.stage] ??= []).push(t);

  const called = tickets.filter((t: any) => t.status === "CALLED");

  return (
    <html lang="id">
      <head>
        <title>Antrian — Klinik Cantik</title>
        <meta httpEquiv="refresh" content="5" />
        <link rel="stylesheet" href="/globals.css" />
        <style>{`
          body { background: linear-gradient(135deg, #fff5f8 0%, #fce7f3 100%); margin: 0; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #1f2937; }
          .container { max-width: 1400px; margin: 0 auto; padding: 32px; }
          h1 { font-size: 48px; font-weight: 800; color: #ec4899; margin: 0; }
          .sub { color: #6b7280; font-size: 14px; margin-top: 4px; }
          .called { background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(236, 72, 153, 0.15); padding: 40px; margin-top: 32px; text-align: center; border: 4px solid #fbcfe8; }
          .called .label { font-size: 16px; color: #6b7280; text-transform: uppercase; letter-spacing: 2px; }
          .called .num { font-size: 120px; font-weight: 900; color: #ec4899; line-height: 1; margin: 16px 0; font-family: monospace; }
          .called .name { font-size: 28px; color: #374151; }
          .called .stage { font-size: 14px; color: #9ca3af; margin-top: 8px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 32px; }
          .col { background: white; border-radius: 12px; padding: 20px; min-height: 320px; }
          .col h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin: 0 0 12px 0; border-bottom: 2px solid #fbcfe8; padding-bottom: 8px; }
          .ticket { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-radius: 6px; margin-bottom: 6px; font-size: 14px; }
          .ticket.waiting { background: #f9fafb; }
          .ticket.in_progress { background: #fce7f3; font-weight: 600; }
          .num-mini { font-family: monospace; font-size: 18px; font-weight: 700; color: #ec4899; }
          .stage-name { color: #6b7280; font-size: 11px; }
          .empty { color: #d1d5db; font-size: 13px; text-align: center; padding: 40px 0; }
          .clock { font-family: monospace; font-size: 32px; color: #374151; margin-left: auto; }
          .header { display: flex; align-items: center; justify-content: space-between; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <div>
              <h1>{process.env.CLINIC_NAME ?? "Klinik Cantik"}</h1>
              <div className="sub">Antrian · {today.toLocaleDateString("id-ID", { dateStyle: "full" })}</div>
            </div>
            <div className="clock">{new Date().toLocaleTimeString("id-ID")}</div>
          </div>

          {called.length > 0 && (
            <div className="called">
              <div className="label">Sedang Dipanggil</div>
              <div className="num">{called[0].number}</div>
              <div className="name">{called[0].patient.fullName}</div>
              <div className="stage">{stageLabel(called[0].stage)}</div>
            </div>
          )}

          <div className="grid">
            {[
              { code: "WAITING_CONSULT", label: "Konsultasi" },
              { code: "WAITING_TREATMENT", label: "Treatment" },
              { code: "WAITING_PHARMACY", label: "Farmasi" },
              { code: "WAITING_CASHIER", label: "Kasir" },
            ].map((s) => {
              const list = grouped[s.code] ?? [];
              return (
                <div className="col" key={s.code}>
                  <h2>{s.label} · {list.length}</h2>
                  {list.length === 0 ? (
                    <div className="empty">—</div>
                  ) : (
                    list.slice(0, 8).map((t: any) => (
                      <div className={`ticket ${t.status === "IN_PROGRESS" ? "in_progress" : "waiting"}`} key={t.id}>
                        <span className="num-mini">{t.number}</span>
                        <span style={{ flex: 1, marginLeft: 12 }}>{t.patient.fullName}</span>
                        {t.status === "IN_PROGRESS" ? <span style={{ color: "#ec4899", fontSize: 12 }}>● Aktif</span> : null}
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </body>
    </html>
  );
}

function stageLabel(stage: string) {
  return ({
    WAITING_CONSULT: "Menuju Ruang Konsultasi",
    WAITING_TREATMENT: "Menuju Ruang Treatment",
    WAITING_PHARMACY: "Ke Loket Farmasi",
    WAITING_CASHIER: "Ke Kasir",
  } as Record<string, string>)[stage] ?? stage;
}
