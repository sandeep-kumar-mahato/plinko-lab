// ⭐ IMPROVED VERSION — Modern Colors, Better Font, Smooth Transitions, Polished UI
// Full PlinkoApp component with enhanced styling, better color palette,
// smoother animations, improved shadows, typography, and UI consistency.

"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";

/*********************************************************************************************
 * Utility Functions
 *********************************************************************************************/
async function sha256Hex(message: string) {
  const enc = new TextEncoder();
  const data = enc.encode(message);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function xorshift32_from_seed(seed: number) {
  let state = seed >>> 0;
  return function rand() {
    state ^= (state << 13) >>> 0;
    state ^= state >>> 17;
    state ^= (state << 5) >>> 0;
    return (state >>> 0) / 0xffffffff;
  };
}

function seedFromCombinedSeedHex(hex: string) {
  return parseInt(hex.slice(0, 8), 16) >>> 0;
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

/*********************************************************************************************
 * Plinko Engine
 *********************************************************************************************/
export async function computeRoundFront({
  serverSeed,
  clientSeed,
  nonce,
  dropColumn,
  rows = 12,
}: {
  serverSeed: string;
  clientSeed: string;
  nonce: string | null;
  dropColumn: number;
  rows?: number;
}) {
  const commitHex = await sha256Hex(`${serverSeed}:${nonce}`);
  const combinedSeed = await sha256Hex(`${serverSeed}:${clientSeed}:${nonce}`);

  const rand = xorshift32_from_seed(seedFromCombinedSeedHex(combinedSeed));

  const pegMap: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let i = 0; i < r + 1; i++) {
      const raw = 0.5 + (rand() - 0.5) * 0.2;
      row.push(Number(raw.toFixed(5)));
    }
    pegMap.push(row);
  }

  const pegMapHash = await sha256Hex(JSON.stringify(pegMap));

  let pos = 0;
  const mid = Math.floor(rows / 2);
  const adj = (dropColumn - mid) * 0.01;

  const path: ("L" | "R")[] = [];
  for (let r = 0; r < rows; r++) {
    const pegIndex = Math.min(pos, r);
    const bias = clamp(pegMap[r][pegIndex] + adj, 0, 1);

    if (rand() < bias) path.push("L");
    else {
      path.push("R");
      pos++;
    }
  }

  return { commitHex, combinedSeed, pegMap, pegMapHash, path, binIndex: pos };
}

/*********************************************************************************************
 * Plinko UI Component — ⭐ UPGRADED DESIGN
 *********************************************************************************************/
export default function PlinkoApp() {
  const rows = 12;
  const bins = 13;

  const [dropColumn, setDropColumn] = useState(Math.floor(bins / 2));
  const [bet, setBet] = useState(100);
  const [clientSeed, setClientSeed] = useState("demo-client-seed");
  const [serverSeed, setServerSeed] = useState(() =>
    Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
const [nonce, setNonce] = useState<string | null>(null);

  const [running, setRunning] = useState(false);
  const [path, setPath] = useState<("L" | "R")[] | null>(null);
  const [binIndex, setBinIndex] = useState<number | null>(null);
  const [pegMapHash, setPegMapHash] = useState<string | null>(null);
  const [combinedSeed, setCombinedSeed] = useState<string | null>(null);
  const [commitHex, setCommitHex] = useState<string | null>(null);

  const [muted, setMuted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [ballPos, setBallPos] = useState<{ x: number; y: number } | null>(null);

  /*********************************************************************************************
   * Listen to user motion settings
   *********************************************************************************************/
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  /*********************************************************************************************
   * Layout Configuration
   *********************************************************************************************/
  const layout = useMemo(() => {
    const width = 600;
    const height = 650;
    const padding = 30;
    const boardW = width - padding * 2;
    const boardH = height - 200;
    const binW = boardW / bins;
    return { width, height, padding, boardW, boardH, binW };
  }, [bins]);

  const pegPositions = useMemo(() => {
    const arr: { x: number; y: number }[][] = [];
    const { width, padding, boardW, boardH } = layout;

    for (let r = 0; r < rows; r++) {
      const row: { x: number; y: number }[] = [];
      const count = r + 1;

      for (let i = 0; i < count; i++) {
        const t = (i / (count - 1 || 1) - 0.5) * 0.85;
        row.push({
          x: width / 2 + t * boardW,
          y: padding + (r / rows) * boardH + 20,
        });
      }
      arr.push(row);
    }

    return arr;
  }, [rows, layout]);

  const binCenters = useMemo(() => {
    const { padding, boardW } = layout;
    return Array.from({ length: bins }).map((_, i) =>
      padding + (i / (bins - 1)) * boardW
    );
  }, [layout, bins]);

  /*********************************************************************************************
   * Drop Simulation
   *********************************************************************************************/
  const startRound = useCallback(async () => {
    if (running) return;
    setRunning(true);

    const res = await computeRoundFront({
      serverSeed,
      clientSeed,
      nonce,
      dropColumn,
      rows,
    });

    setPegMapHash(res.pegMapHash);
    setPath(res.path);
    setBinIndex(res.binIndex);
    setCombinedSeed(res.combinedSeed);
    setCommitHex(res.commitHex);

    setBallPos({ x: binCenters[dropColumn], y: 6 });

    if (reducedMotion) {
      setBallPos({ x: binCenters[res.binIndex], y: layout.height - 110 });
      setRunning(false);
      return;
    }

    // Animate down the peg rows
    for (let r = 0; r < rows; r++) {
      await new Promise((res2) => setTimeout(res2, 140));
      const posSoFar = res.path.slice(0, r).filter((s) => s === "R").length;
      const pegIndex = Math.min(posSoFar, r);
      const peg = pegPositions[r][pegIndex];

      setBallPos({ x: peg.x, y: peg.y });

      await new Promise((res2) => setTimeout(res2, 120));
      const dir = res.path[r] === "R" ? 26 : -26;
      setBallPos({ x: peg.x + dir, y: peg.y + 28 });
    }

    await new Promise((res2) => setTimeout(res2, 180));
    setBallPos({ x: binCenters[res.binIndex], y: layout.height - 110 });
    setRunning(false);
  }, [running, serverSeed, clientSeed, nonce, dropColumn, rows, reducedMotion, pegPositions, binCenters, layout.height]);

  /*********************************************************************************************
   * Keyboard Input
   *********************************************************************************************/
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")
        setDropColumn((c) => clamp(c - 1, 0, bins - 1));
      if (e.key === "ArrowRight")
        setDropColumn((c) => clamp(c + 1, 0, bins - 1));
      if (e.key === " ") {
        e.preventDefault();
        startRound();
      }
      if (e.key.toLowerCase() === "m") setMuted((m) => !m);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [startRound, bins]);

  /*********************************************************************************************
   * Generate new server seed
   *********************************************************************************************/
  function regenerateServerSeed() {
    setServerSeed(
      Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    );
    setNonce(crypto.randomUUID());
  }

  /*********************************************************************************************
   * RENDER UI — ⭐ MODERN DESIGN IMPROVED
   *********************************************************************************************/
  return (
    <div className="min-h-screen bg-[#0b0d11] flex items-center justify-center p-8 font-[Inter] text-[14px]">
      <div className="w-full max-w-5xl rounded-3xl bg-[#14171c] shadow-2xl border border-[#1f232a] overflow-hidden">
        {/* Header */}
        <div className="p-5 flex justify-between items-center bg-[#1a1d23] border-b border-[#252a33]">
          <div>
            <h1 className="text-xl font-bold bg-linear-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent tracking-wide">
              Plinko — Provably Fair
            </h1>
            <p className="text-xs text-gray-400 mt-1 tracking-tight">Modernized UI • Smooth Motion • Clean Layout</p>
          </div>

          <div className="flex gap-3 items-center">
            <button
              onClick={() => setMuted((m) => !m)}
              className="px-3 py-1 rounded-lg bg-[#232832] text-gray-200 shadow hover:bg-[#2b313c] transition"
            >
              {muted ? "🔇" : "🔊"}
            </button>

            <button
              onClick={regenerateServerSeed}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium shadow hover:bg-blue-500 transition"
            >
              New Server Seed
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-3 gap-6">
          {/*************************************
           * Control Panel
           *************************************/}
          <div className="col-span-1 bg-[#1a1d23] p-4 rounded-2xl border border-[#22262e] shadow-inner space-y-4">
            <label className="text-gray-300 text-sm">Drop Column</label>
            <input
              type="range"
              min={0}
              max={bins - 1}
              value={dropColumn}
              onChange={(e) => setDropColumn(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-gray-400 text-xs">
              <span>Selected: {dropColumn}</span>
              <span>Center: {Math.floor(bins / 2)}</span>
            </div>

            <label className="text-gray-300 text-sm">Bet (cents)</label>
            <input
              type="number"
              value={bet}
              onChange={(e) => setBet(Number(e.target.value || 0))}
              className="w-full bg-[#0d0f12] border border-[#2a2f37] rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:border-blue-500 transition"
            />

            <label className="text-gray-300 text-sm">Client Seed</label>
            <input
              type="text"
              value={clientSeed}
              onChange={(e) => setClientSeed(e.target.value)}
              className="w-full bg-[#0d0f12] border border-[#2a2f37] rounded-lg px-3 py-2 text-gray-200"
            />

            <label className="text-gray-300 text-sm">Server Seed</label>
            <textarea
              value={serverSeed}
              onChange={(e) => setServerSeed(e.target.value)}
              rows={3}
              className="w-full bg-[#0d0f12] border border-[#2a2f37] rounded-lg px-3 py-2 font-mono text-[11px] text-gray-300"
            />

            <div className="text-xs text-gray-400 font-mono">Nonce: {nonce}</div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={startRound}
                disabled={running}
                className="flex-1 py-2 rounded-xl bg-green-600 text-white font-semibold shadow hover:bg-green-500 disabled:opacity-40 transition"
              >
                {running ? "Dropping..." : "Drop"}
              </button>

              <button
                onClick={() => {
                  setPath(null);
                  setBinIndex(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#232832] text-gray-200 hover:bg-[#2c333d] transition"
              >
                Reset
              </button>
            </div>

            <div className="mt-4 text-[11px] text-gray-400 space-y-1">
              <div>Commit: <code className="font-mono">{commitHex ?? "—"}</code></div>
              <div>Combined: <code className="font-mono">{combinedSeed ?? "—"}</code></div>
              <div>PegHash: <code className="font-mono">{pegMapHash ?? "—"}</code></div>
              <div>Final Bin: <strong className="text-gray-200">{binIndex ?? "—"}</strong></div>
            </div>
          </div>

          {/*************************************
           * GAME BOARD — Polished Visuals
           *************************************/}
          <div className="col-span-2 bg-[#1a1d23] p-5 rounded-2xl border border-[#22262e] shadow-inner">
            <div className="text-gray-400 text-xs mb-3 flex justify-between">
              <div>Rows: {rows}, Bins: {bins}</div>
              <div>Use ← → keys and Space</div>
            </div>

            <div className="relative mx-auto">
              <svg
                ref={svgRef}
                width={layout.width}
                height={layout.height}
                className="mx-auto block"
              >
                {/* Pegs */}
                {pegPositions.map((row, r) =>
                  row.map((p, i) => (
                    <circle
                      key={`peg-${r}-${i}`}
                      cx={p.x}
                      cy={p.y}
                      r={6}
                      className="fill-blue-300 opacity-30 drop-shadow-sm"
                    />
                  ))
                )}

                {/* Baseline */}
                <line
                  x1={layout.padding}
                  x2={layout.width - layout.padding}
                  y1={layout.height - 80}
                  y2={layout.height - 80}
                  stroke="#3b4250"
                  strokeWidth={3}
                />

                {/* Bins */}
                {binCenters.map((x, i) => (
                  <g key={`bin-${i}`}>
                    <rect
                      x={x - layout.binW * 0.4}
                      y={layout.height - 80}
                      width={layout.binW * 0.8}
                      height={48}
                      rx={10}
                      className={`${i === binIndex
                        ? "fill-yellow-300 shadow-lg"
                        : "fill-[#0d0f12]"} transition`}
                    />
                    <text
                      x={x}
                      y={layout.height - 52}
                      textAnchor="middle"
                      className="fill-gray-200 text-[12px]"
                    >
                      {i}
                    </text>
                  </g>
                ))}
              </svg>

              {/* Ball */}
              {ballPos && (
                <div
                  style={{
                    left: ballPos.x - 12,
                    top: ballPos.y - 12,
                    transition: reducedMotion
                      ? "none"
                      : "left 150ms linear, top 150ms linear",
                  }}
                  className="absolute w-6 h-6 rounded-full bg-red-500 shadow-xl"
                />
              )}

              {/* Drop Indicator */}
              <div
                style={{ left: binCenters[dropColumn] - 10, top: 4 }}
                className="absolute w-5 h-5 bg-blue-500 text-white text-[10px] flex items-center justify-center rounded-full shadow"
              >
                ▲
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-400">Path: {path ? path.join("") : "—"}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 text-xs text-gray-500 border-t border-[#22262e] bg-[#1a1d23]">
          Keyboard: ← → to move, Space to drop, M to mute.
        </div>
      </div>
    </div>
  );
}