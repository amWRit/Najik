import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/server";

export async function GET(req: NextRequest) {
  const helperId = req.nextUrl.searchParams.get("helper_id");
  if (!helperId) {
    return NextResponse.json({ error: "Missing helper_id" }, { status: 400 });
  }
  try {
    const relationships = await prisma.relationships.findMany({
      where: { helper_id: helperId },
      include: { parent: true },
    });
    const parents = relationships.map((rel) => ({
      id: rel.parent.id,
      name: rel.parent.name,
      email: rel.parent.email,
    }));
    return NextResponse.json({ parents });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch parents" }, { status: 500 });
  }
}
