// src/engine/prng.ts
export function seedFromCombinedSeedHex(hex: string): number {
  // first 4 bytes big-endian (8 hex chars)
  return parseInt(hex.slice(0, 8), 16) >>> 0;
}

// xorshift32 PRNG (stateful)
export function xorshift32_from_seed(seed: number) {
  let state = seed >>> 0;
  return function rand() {
    state ^= (state << 13) >>> 0;
    state ^= state >>> 17;
    state ^= (state << 5) >>> 0;
    // convert to float in [0,1)
    return (state >>> 0) / 0xffffffff;
  };
}
