import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  const round = await prisma.round.findUnique({ where: { id } });

  if (!round) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(round);
}
