import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/server";

export async function POST(req: NextRequest) {
  try {
    const { parent_id, helper_id } = await req.json();
    if (!parent_id || !helper_id) {
      return NextResponse.json({ error: "Missing parent_id or helper_id" }, { status: 400 });
    }
    // Check if both users exist
    const parent = await prisma.users.findUnique({ where: { id: parent_id } });
    const helper = await prisma.users.findUnique({ where: { id: helper_id } });
    if (!parent || parent.role !== "parent") {
      return NextResponse.json({ error: "Parent not found or not a parent" }, { status: 404 });
    }
    if (!helper || helper.role !== "helper") {
      return NextResponse.json({ error: "Helper not found or not a helper" }, { status: 404 });
    }
    // Check if relationship already exists
    const existing = await prisma.relationships.findFirst({
      where: { parent_id, helper_id },
    });
    if (existing) {
      return NextResponse.json({ error: "Relationship already exists" }, { status: 409 });
    }
    // Create relationship
    const relationship = await prisma.relationships.create({
      data: { parent_id, helper_id },
    });
    return NextResponse.json({ success: true, relationship });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
