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

export async function DELETE(req: NextRequest) {
  try {
    const { helper_id, parent_email } = await req.json();
    if (!helper_id || !parent_email) {
      return NextResponse.json({ error: 'Missing helper_id or parent_email' }, { status: 400 });
    }
    // Find parent user by email
    const parent = await prisma.users.findUnique({
      where: { email: parent_email },
      select: { id: true },
    });
    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }
    // Delete the relationship
    const deleted = await prisma.relationships.deleteMany({
      where: {
        helper_id,
        parent_id: parent.id,
      },
    });
    if (deleted.count > 0) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Relationship not found' }, { status: 404 });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete relationship' }, { status: 500 });
  }
}
