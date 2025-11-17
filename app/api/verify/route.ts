import { computeRound } from "@/engine/round";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const serverSeed = url.searchParams.get("serverSeed") ?? "";
  const clientSeed = url.searchParams.get("clientSeed") ?? "";
  const nonce = url.searchParams.get("nonce") ?? "";
  const dropColumn = Number(url.searchParams.get("dropColumn") ?? "6");

  if (!serverSeed || !clientSeed || !nonce) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const res = computeRound({ serverSeed, clientSeed, nonce, dropColumn });

  return NextResponse.json({
    commitHex: res.commitHex,
    combinedSeed: res.combinedSeed,
    pegMapHash: res.pegMapHash,
    binIndex: res.binIndex,
    path: res.path,
  });
}
