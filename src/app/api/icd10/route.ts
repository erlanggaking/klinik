import { NextRequest, NextResponse } from "next/server";
import { searchIcd10 } from "@/lib/icd10";
import { requireSession } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  await requireSession();
  const q = req.nextUrl.searchParams.get("q") ?? "";
  return NextResponse.json({ results: searchIcd10(q, 30) });
}
