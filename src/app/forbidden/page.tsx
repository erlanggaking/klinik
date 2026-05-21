import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-semibold">Akses Ditolak</h1>
      <p className="text-muted-foreground">
        Kamu tidak memiliki izin untuk mengakses halaman ini.
      </p>
      <Link className="text-primary underline" href="/dashboard">
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
