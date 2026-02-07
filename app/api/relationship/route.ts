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
    const body = await req.json();
    // Helper-side: { helper_id, parent_email }
    if (body.helper_id && body.parent_email) {
      // Find parent user by email
      const parent = await prisma.users.findUnique({
        where: { email: body.parent_email },
        select: { id: true },
      });
      if (!parent) {
        return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
      }
      // Delete the relationship
      const deleted = await prisma.relationships.deleteMany({
        where: {
          helper_id: body.helper_id,
          parent_id: parent.id,
        },
      });
      if (deleted.count > 0) {
        return NextResponse.json({ success: true });
      } else {
        return NextResponse.json({ error: 'Relationship not found' }, { status: 404 });
      }
    }
    // Parent-side: { parent_id, helper_email }
    if (body.parent_id && body.helper_email) {
      // Find helper user by email
      const helper = await prisma.users.findUnique({
        where: { email: body.helper_email },
        select: { id: true },
      });
      if (!helper) {
        return NextResponse.json({ error: 'Helper not found' }, { status: 404 });
      }
      // Delete the relationship
      const deleted = await prisma.relationships.deleteMany({
        where: {
          parent_id: body.parent_id,
          helper_id: helper.id,
        },
      });
      if (deleted.count > 0) {
        return NextResponse.json({ success: true });
      } else {
        return NextResponse.json({ error: 'Relationship not found' }, { status: 404 });
      }
    }
    // If neither, return error
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete relationship' }, { status: 500 });
  }
}
