import { requirePermission } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { startOpname } from "../actions";

export default async function StartOpnamePage() {
  await requirePermission("inventory.opname");
  const r = await startOpname();
  if (r?.id) redirect(`/inventory/opname/${r.id}`);
  redirect("/inventory/opname");
}
