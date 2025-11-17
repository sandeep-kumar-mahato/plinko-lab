import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  const round = await prisma.round.findUnique({ where: { id } });
  if (!round)
    return NextResponse.json({ error: "Round not found" }, { status: 404 });

  return NextResponse.json({
    serverSeed: round.serverSeed,
  });
}
