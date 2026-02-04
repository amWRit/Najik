export async function DELETE(req: NextRequest) {
  try {
    const { user_id } = await req.json();
    if (!user_id) {
      return NextResponse.json({ success: false, error: 'Missing user_id' }, { status: 400 });
    }
    const result = await prisma.location_updates.deleteMany({ where: { user_id } });
    return NextResponse.json({ success: true, deleted: result.count });
  } catch (err) {
    const errorMessage = typeof err === 'object' && err !== null && 'message' in err ? (err as { message: string }).message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const locationUpdate = await prisma.location_updates.create({
      data: {
        user_id: data.user_id,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        battery_level: data.battery_level,
        is_sharing: true,
        timestamp: data.timestamp,
      },
    });
    return NextResponse.json({ success: true, locationUpdate });
  } catch (err) {
    const errorMessage = typeof err === "object" && err !== null && "message" in err ? (err as { message: string }).message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
