import { requireSession } from "@/lib/rbac";
import { Sidebar } from "@/components/nav";
import { Topbar } from "@/components/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const user = session.user as any;

  return (
    <div className="flex min-h-screen">
      <Sidebar permissions={user.permissions ?? []} />
      <div className="flex flex-1 flex-col">
        <Topbar name={user.name} roles={user.roles ?? []} />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
