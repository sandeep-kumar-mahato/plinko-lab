import { prisma } from "@/lib/prisma";  // ✔ CORRECT
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const round = await prisma.round.findUnique({ where: { id: params.id } });
  if (!round) return NextResponse.json({ error: "Round not found" }, { status: 404 });
  return NextResponse.json(round);
}
