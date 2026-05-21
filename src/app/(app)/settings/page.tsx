import { requirePermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, FileSearch, ScrollText, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";

export default async function SettingsPage() {
  await requirePermission("settings.read");
  const [users, roles] = await Promise.all([
    prisma.user.count(),
    prisma.role.count(),
  ]);

  const items = [
    { href: "/settings/users", title: "Pengguna", desc: `Kelola ${users} user, reset password, assign role`, icon: Users },
    { href: "/settings/roles", title: "Role & Permission", desc: `${roles} role aktif. Atur permission per role`, icon: Shield },
    { href: "/settings/audit", title: "Audit Log", desc: "Trail aktivitas user & akses foto sensitif", icon: FileSearch },
    { href: "/settings/clinic", title: "Info Klinik", desc: "Nama, alamat, kontak (untuk PDF/struk)", icon: SettingsIcon },
    { href: "/settings/templates", title: "Template Pesan", desc: "Template WA & email", icon: ScrollText },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Pengaturan" description="Kelola pengguna, role, dan konfigurasi klinik." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <Link key={it.href} href={it.href} className="block">
            <Card className="transition hover:border-primary/50 hover:shadow">
              <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <it.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{it.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{it.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
