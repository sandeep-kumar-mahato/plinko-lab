import { prisma } from "@/lib/prisma";
import { computeRound } from "@/engine/round";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { clientSeed, dropColumn, betCents } = body;

  const round = await prisma.round.findUnique({ where: { id: params.id } });
  if (!round) return NextResponse.json({ error: "Round not found" }, { status: 404 });
  if (!round.serverSeed) return NextResponse.json({ error: "Server seed missing" }, { status: 500 });

  const result = computeRound({
    serverSeed: round.serverSeed,
    clientSeed,
    nonce: round.nonce,
    dropColumn,
    rows: round.rows,
  });

  await prisma.round.update({
    where: { id: params.id },
    data: {
      status: "STARTED",
      clientSeed,
      combinedSeed: result.combinedSeed,
      pegMapHash: result.pegMapHash,
      dropColumn,
      binIndex: result.binIndex,
      pathJson: result.path,
      betCents: betCents ?? 0,
      payoutMultiplier: 1 + Math.abs(result.binIndex - Math.floor(round.rows / 2)) * 0.2,
    },
  });

  return NextResponse.json({
    roundId: params.id,
    pegMapHash: result.pegMapHash,
    rows: round.rows,
    binIndex: result.binIndex,
    path: result.path,
  });
}
