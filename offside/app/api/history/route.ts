import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const archives = await prisma.seasonArchive.findMany({
      where: { userId: session.user.id },
      orderBy: { archivedAt: "desc" },
    });

    return NextResponse.json(archives);
  } catch (error) {
    console.error('API /history: error occurred', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
