import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/server";

export async function POST(req: NextRequest) {
  try {
    const { parent_id, helper_email } = await req.json();
    if (!parent_id || !helper_email) {
      return NextResponse.json({ error: "Missing parent_id or helper_email" }, { status: 400 });
    }
    // Find helper user by email
    const helper = await prisma.users.findUnique({
      where: { email: helper_email },
    });
    if (!helper || helper.role !== "helper") {
      return NextResponse.json({ error: "Helper not found or not a helper" }, { status: 404 });
    }
    // Check if relationship already exists
    const existing = await prisma.relationships.findFirst({
      where: { parent_id, helper_id: helper.id },
    });
    if (existing) {
      return NextResponse.json({ error: "Relationship already exists" }, { status: 409 });
    }
    // Create relationship
    const relationship = await prisma.relationships.create({
      data: { parent_id, helper_id: helper.id },
    });
    return NextResponse.json({ success: true, relationship });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
