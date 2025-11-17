# Plinko Lab — Provably Fair (Full Assignment)

## What this repo contains
- Next.js app (App Router) with API routes implementing commit/reveal + verifier
- Deterministic engine (seed combiner, xorshift32 PRNG, peg map generation, path sim)
- Prisma + SQLite DB with Round model
- Frontend Plinko UI component (SVG) with keyboard accessibility
- Unit tests (Vitest) including the provided test vector
- Scripts: dev, build, start, migrate, test

## Quickstart (dev)
1. Install dependencies:
   npm install

2. Set env:
   copy .env.example -> .env
   ensure DATABASE_URL="file:./dev.db"

3. Migrate Prisma:
   npm run migrate

4. Start dev server:
   npm run dev

5. Run tests:
   npm run test

## Architecture (short)
- Frontend (Next.js App Router) renders Plinko UI and talks to API endpoints:
  - POST /api/rounds/commit  -> create round (server generates serverSeed + nonce, returns commitHex)
  - POST /api/rounds/:id/start -> client supplies clientSeed, dropColumn; server computes deterministic round & stores pegMapHash/path/binIndex
  - POST /api/rounds/:id/reveal -> reveal serverSeed
  - GET  /api/verify -> recompute commitHex/combinedSeed/pegMapHash/binIndex from provided serverSeed/clientSeed/nonce/dropColumn

- Engine details:
  - commitHex = SHA256(serverSeed + ":" + nonce)
  - combinedSeed = SHA256(serverSeed + ":" + clientSeed + ":" + nonce)
  - PRNG: xorshift32 seeded with first 4 bytes (big-endian) of combinedSeed
  - PegMap generated using PRNG first (leftBias ∈ [0.4, 0.6] via formula), rounded to 6 decimals
  - Simulation uses peg under path at each row and uses same PRNG stream for row decisions
  - PegMapHash = SHA256(JSON.stringify(pegMap))

## Test vector
Included in tests/engine.test.ts — matches the values from the assignment (commitHex, combinedSeed, peg map entries and binIndex).

## Notes on AI usage
I used AI assistance to draft and iterate code patterns and the initial frontend design. I verified and adjusted the code for correctness, added unit tests, and ensured the deterministic engine matches the assignment test vector.

## Next steps & improvements
- Move frontend calls to real API endpoints (UI buttons to commit/start/reveal)
- Add server-side unit tests and integration test covering API endpoints
- Add more UI polish: confetti, peg tick audio, a mute toggle tied to real SFX
- Switch to Postgres in production
- Add authentication/session if needed
