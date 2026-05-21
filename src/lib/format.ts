import { format } from "date-fns";
import { id as idLocale, enUS } from "date-fns/locale";

export type Locale = "id" | "en";

export function formatIDR(
  value: number | string | null | undefined,
  opts: { withSymbol?: boolean } = { withSymbol: true }
) {
  const n =
    typeof value === "string"
      ? Number(value)
      : typeof value === "number"
      ? value
      : 0;
  if (Number.isNaN(n)) return "-";
  const formatted = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
  return opts.withSymbol ? `Rp ${formatted}` : formatted;
}

export function formatDate(
  value: Date | string | null | undefined,
  pattern = "dd MMM yyyy",
  locale: Locale = "id"
) {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  return format(d, pattern, { locale: locale === "id" ? idLocale : enUS });
}

export function formatDateTime(
  value: Date | string | null | undefined,
  locale: Locale = "id"
) {
  return formatDate(value, "dd MMM yyyy HH:mm", locale);
}

export function formatTime(
  value: Date | string | null | undefined,
  locale: Locale = "id"
) {
  return formatDate(value, "HH:mm", locale);
}
