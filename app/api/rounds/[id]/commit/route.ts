import { prisma } from "@/lib/prisma";  // ✔ CORRECT
import { sha256Hex } from "@/engine/round";
import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST() {
  // server generates secret serverSeed and nonce; store serverSeed server-side only
  const serverSeed = crypto.randomBytes(32).toString("hex");
  const nonce = crypto.randomUUID();
  const commitHex = sha256Hex(`${serverSeed}:${nonce}`);

  const round = await prisma.round.create({
    data: {
      status: "CREATED",
      nonce,
      commitHex,
      serverSeed, // serverSeed stored but not returned
      clientSeed: "",
      rows: 12,
      payoutMultiplier: 1.0,
      betCents: 0,
      dropColumn: 6,
    },
  });

  return NextResponse.json({
    roundId: round.id,
    commitHex: round.commitHex,
    nonce: round.nonce,
  });
}
