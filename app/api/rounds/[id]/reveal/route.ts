import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const round = await prisma.round.findUnique({ where: { id: params.id } });
  if (!round) return NextResponse.json({ error: "Round not found" }, { status: 404 });

  await prisma.round.update({
    where: { id: params.id },
    data: { status: "REVEALED", revealedAt: new Date() },
  });

  return NextResponse.json({ serverSeed: round.serverSeed });
}
