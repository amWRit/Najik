import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parentId = searchParams.get('parent_id');
  if (!parentId) {
    return NextResponse.json({ error: 'Missing parent_id' }, { status: 400 });
  }
  try {
    // Find all helpers (supporters) for this parent
    const relationships = await prisma.relationships.findMany({
      where: { parent_id: parentId },
      include: { helper: true },
    });
    const supporters = relationships.map(rel => rel.helper?.email).filter(Boolean);
    return NextResponse.json({ supporters });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch supporters' }, { status: 500 });
  }
}
