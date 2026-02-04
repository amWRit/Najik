import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/server";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("parent_id");
  if (!userId) {
    return NextResponse.json({ error: "Missing parent_id" }, { status: 400 });
  }
  try {
    const relationship = await prisma.relationships.findFirst({
      where: { parent_id: userId },
      include: { helper: true },
    });
    return NextResponse.json({ helperName: relationship?.helper?.name || null });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch relationship" }, { status: 500 });
  }
}
