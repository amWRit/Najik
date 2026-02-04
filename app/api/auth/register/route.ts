import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email, password, name, role } = await request.json();
  if (!email || !password || !name || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const existing = await prisma.users.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.users.create({
    data: {
      // If 'id' is required, generate a unique id (e.g., using uuid).
      // If 'id' is auto-generated, you can omit it.
      id: crypto.randomUUID(),
      email,
      password: hashed,
      name,
      role,
    },
  });
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
}
