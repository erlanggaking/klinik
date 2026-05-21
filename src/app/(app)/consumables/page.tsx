import { redirect } from "next/navigation";

export default function ConsumablesRedirect() {
  redirect("/inventory?type=CONSUMABLE");
}
