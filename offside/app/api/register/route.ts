import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { username, password, email } = await req.json();
  if (!username || !password) return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  if (username.length < 3 || username.length > 20) return NextResponse.json({ error: "Username must be 3–20 chars" }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return NextResponse.json({ error: "Letters, numbers and underscores only" }, { status: 400 });
  const existing = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (existing) return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { username, passwordHash, email: email || null } });
  return NextResponse.json({ ok: true });
}
