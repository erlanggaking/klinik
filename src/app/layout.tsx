import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Klinik Cantik — Beauty Clinic Management",
  description: "Sistem manajemen klinik kecantikan terintegrasi.",
};

// Force dynamic untuk semua page agar tidak prerender static.
// Aplikasi ini sangat data-driven (auth, antrian, dashboard real-time),
// jadi SSR per-request lebih sesuai dan menghindari error prerender saat build.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
