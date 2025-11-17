// src/engine/round.ts
import crypto from "crypto";
import { seedFromCombinedSeedHex, xorshift32_from_seed } from "./prng";

export type PegMap = number[][];

export function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function generatePegMap(rows: number, rand: () => number): PegMap {
  const pegMap: PegMap = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let i = 0; i < r + 1; i++) {
      const raw = 0.5 + (rand() - 0.5) * 0.2;
      const rounded = Number(raw.toFixed(6));
      row.push(rounded);
    }
    pegMap.push(row);
  }
  return pegMap;
}

export function pegMapHash(pegMap: PegMap): string {
  return sha256Hex(JSON.stringify(pegMap));
}

export function simulateDrop(rows: number, dropColumn: number, pegMap: PegMap, rand: () => number) {
  let pos = 0;
  const mid = Math.floor(rows / 2);
  const adj = (dropColumn - mid) * 0.01;
  const path: ("L" | "R")[] = [];

  for (let r = 0; r < rows; r++) {
    const pegIndex = Math.min(pos, r);
    const leftBias = pegMap[r][pegIndex];
    const biasPrime = Math.min(1, Math.max(0, leftBias + adj));
    const rnd = rand();
    if (rnd < biasPrime) {
      path.push("L");
    } else {
      path.push("R");
      pos++;
    }
  }
  return { path, binIndex: pos };
}

export function computeRound({
  serverSeed,
  clientSeed,
  nonce,
  dropColumn,
  rows = 12,
}: {
  serverSeed: string;
  clientSeed: string;
  nonce: string;
  dropColumn: number;
  rows?: number;
}) {
  const commitHex = sha256Hex(`${serverSeed}:${nonce}`);
  const combinedSeed = sha256Hex(`${serverSeed}:${clientSeed}:${nonce}`);

  const seed = seedFromCombinedSeedHex(combinedSeed);
  const rand = xorshift32_from_seed(seed);

  const pegMap = generatePegMap(rows, rand);
  const pegHash = pegMapHash(pegMap);

  const { path, binIndex } = simulateDrop(rows, dropColumn, pegMap, rand);

  return {
    commitHex,
    combinedSeed,
    pegMap,
    pegMapHash: pegHash,
    path,
    binIndex,
  };
}
