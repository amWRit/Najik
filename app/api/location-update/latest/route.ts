import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/server";

// GET /api/location-update/latest?user_id=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get("user_id");
  if (!user_id) {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }
  try {
    const locationUpdate = await prisma.location_updates.findFirst({
      where: { user_id },
      orderBy: { timestamp: "desc" },
    });
    return NextResponse.json({ locationUpdate });
  } catch (err) {
    const errorMessage = typeof err === "object" && err !== null && "message" in err ? (err as { message: string }).message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
