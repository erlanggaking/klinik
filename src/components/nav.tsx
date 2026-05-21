"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  UserPlus,
  Users,
  Crown,
  Stethoscope,
  ClipboardList,
  HeartPulse,
  Sparkles,
  Camera,
  FileText,
  Pill,
  Boxes,
  Truck,
  Wallet,
  Receipt,
  Package,
  PiggyBank,
  BarChart3,
  MessageCircle,
  Tag,
  Star,
  PhoneOutgoing,
  Settings,
  type LucideIcon,
} from "lucide-react";

type Item = { href: string; label: string; icon: LucideIcon; perm?: string };
type Group = { title: string; items: Item[] };

export const navGroups: Group[] = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, perm: "dashboard.read" },
    ],
  },
  {
    title: "Front Office",
    items: [
      { href: "/appointment", label: "Appointment", icon: CalendarDays, perm: "appointment.read" },
      { href: "/pasien", label: "Registrasi Pasien", icon: UserPlus, perm: "patient.read" },
      { href: "/antrian", label: "Antrian", icon: Users, perm: "queue.read" },
      { href: "/membership", label: "Membership", icon: Crown, perm: "membership.read" },
    ],
  },
  {
    title: "Medical",
    items: [
      { href: "/rekam-medis", label: "Rekam Medis", icon: ClipboardList, perm: "medical_record.read" },
      { href: "/diagnosa", label: "Diagnosa", icon: Stethoscope, perm: "medical_record.read" },
      { href: "/treatment", label: "Treatment", icon: Sparkles, perm: "treatment.perform" },
      { href: "/foto", label: "Before-After", icon: Camera, perm: "photo.read" },
      { href: "/resep", label: "Resep", icon: FileText, perm: "prescription.read" },
    ],
  },
  {
    title: "Operasional",
    items: [
      { href: "/farmasi", label: "Farmasi", icon: Pill, perm: "pharmacy.dispense" },
      { href: "/inventory", label: "Inventory", icon: Boxes, perm: "inventory.read" },
      { href: "/consumables", label: "Consumables", icon: HeartPulse, perm: "inventory.read" },
      { href: "/supplier", label: "Supplier", icon: Truck, perm: "supplier.read" },
    ],
  },
  {
    title: "Financial",
    items: [
      { href: "/kasir", label: "Kasir", icon: Wallet, perm: "kasir.operate" },
      { href: "/invoice", label: "Invoice", icon: Receipt, perm: "invoice.read" },
      { href: "/paket", label: "Paket Treatment", icon: Package, perm: "package.read" },
      { href: "/deposit", label: "Deposit (Kas)", icon: PiggyBank, perm: "deposit.read" },
      { href: "/laporan", label: "Laporan", icon: BarChart3, perm: "report.read" },
    ],
  },
  {
    title: "CRM & Marketing",
    items: [
      { href: "/wa", label: "WA Reminder", icon: MessageCircle, perm: "message.send" },
      { href: "/promo", label: "Promo", icon: Tag, perm: "promo.read" },
      { href: "/loyalty", label: "Loyalty", icon: Star, perm: "loyalty.read" },
      { href: "/followup", label: "Follow Up", icon: PhoneOutgoing, perm: "followup.read" },
    ],
  },
  {
    title: "Settings",
    items: [
      { href: "/settings", label: "Pengaturan", icon: Settings, perm: "settings.read" },
    ],
  },
];

export function Sidebar({ permissions }: { permissions: string[] }) {
  const pathname = usePathname();
  const has = (p?: string) => !p || permissions.includes(p);

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="text-sm font-semibold">Klinik Cantik</div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((g) => {
          const visible = g.items.filter((i) => has(i.perm));
          if (visible.length === 0) return null;
          return (
            <div key={g.title} className="mb-4">
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {g.title}
              </div>
              <ul className="mt-1 space-y-0.5">
                {visible.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-foreground/70 hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
