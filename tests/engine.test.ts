import { computeRound, sha256Hex } from "../src/engine/round";
import { describe, it, expect } from "vitest";

describe("engine test vector", () => {
  it("matches the provided test vector", async () => {
    const serverSeed =
      "b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc";
    const nonce = "42";
    const clientSeed = "candidate-hello";
    const rows = 12;
    const dropColumn = 6;

    const res = computeRound({ serverSeed, clientSeed, nonce, dropColumn, rows });

    // expected values from spec:
    expect(res.commitHex).toBe("bb9acdc67f3f18f3345236a01f0e5072596657a9005c7d8a22cff061451a6b34");
    expect(res.combinedSeed).toBe("e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0");

    // verify first five rand() from seeded xorshift32 (we can't easily extract rand sequence here,
    // but we can check first pegMap entries match sample rounding)
    expect(res.pegMap[0][0]).toBeCloseTo(0.422123, 6);
    expect(res.pegMap[1][0]).toBeCloseTo(0.552503, 6);
    expect(res.pegMap[1][1]).toBeCloseTo(0.408786, 6);
    expect(res.binIndex).toBe(6);
  });
});
