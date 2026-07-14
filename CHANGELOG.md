# Changelog — `nishanth-dev` branch

All changes made by Nishanth on top of `main` (`20cdea9`), newest first.
Written for teammates: every entry says **what** changed, **where**, and **why**.

---

## [2] Heap Dijkstra + Complexity Benchmark — commit `85a0de3` (2026-07-07)

### Why
Our project report claims Dijkstra runs at *O((V+E) log V) using a Min-Priority Queue* — but the
code was the O(V²) linear-scan variant with no heap. Any examiner opening the code would catch
that contradiction. This change makes the report's claim actually true, and adds a benchmark that
*demonstrates* the complexity difference empirically (the strongest DAA talking point we have).

### What changed

**New folder `src/algorithms/`** — all pathfinding logic moved out of the UI file:

| File | Contents |
|---|---|
| `minHeap.ts` | Binary min-heap written from scratch (push/pop with bubble-up/sift-down). |
| `pathfinding.ts` | `dijkstraHeap` — Dijkstra with the min-heap, O((V+E) log V), lazy deletion of stale entries. `dijkstraLinear` — the old O(V²) version, **kept on purpose** as the benchmark baseline. `bfs` — moved here; its queue now uses an index pointer instead of `array.shift()` (shift is O(n), which silently made BFS O(V²)). `buildTrustAdjacency` — the adjacency builder both pages share; same weights as before: `max(1, 100 − RelationshipScore)`, bidirectional. |
| `benchmark.ts` | `generateRandomGraph(n)` — random connected graph (spanning chain + random extra edges, avg degree 4, weights 1–100). `benchmarkSize(n)` — times both Dijkstra variants (best of 3 runs) on the same graph and cross-checks they found equal-cost paths. |

**`src/pages/RouteAnalysis.tsx`:**
- The inline `dijkstra`/`bfs` implementations (≈120 lines) were deleted; the page now imports from
  `src/algorithms/` and routes with **`dijkstraHeap`**.
- New **"Complexity Benchmark" panel**: one button runs V = 100 / 500 / 2,000 / 5,000 and renders a
  two-bar comparison per size with a speedup badge and a "paths agree" correctness check.
  Typical result: V=5,000 → linear ≈ 320 ms vs heap ≈ 5 ms (~64× faster).
- Chart colors blue `#3B82F6` / orange `#EA580C` were validated for colorblind safety
  (CVD ΔE ≈ 117; passes lightness/chroma/contrast checks on our dark surface).

### Behavior change for users
None for normal routing (same paths, same costs — just computed faster). The benchmark panel is new.

---

## [1] Trust Model v2 + honesty fixes + cleanup — commit `ded6b2e` (2026-07-07)

### Why
The old trust formula `score = min(100, comms × 1.8 + 10)` had three flaws:
1. **Gameable** — trust only counted message volume, so spamming 50 messages hit max priority.
2. **Monotonic** — score could never decrease; no concept of losing trust.
3. **No aging** — trust from long ago counted the same as today's.

Also, the UI displayed a formula (`Interactions × 10`) that did not match the code, and the
"Execution Time" metric on Route Analysis included a decorative 800 ms `setTimeout`, making the
number meaningless. These were honesty problems: what the app *said* differed from what it *did*.

### What changed

**`src/context/AppContext.tsx` — Trust Model v2:**

```
score = decay(oldScore) + qualityWeight(direction) × saturation(currentScore) − penalties
```

| Mechanism | Implementation | Why |
|---|---|---|
| Diminishing returns | `gainPerMessage = base / (1 + score/20)` | 1st message ≈ full base points, 50th ≈ nothing → spam can't reach P5. Verified: 11-message burst only reaches score ≈ 16 (still P1). |
| Direction weighting | base = 8 if Admin→User, 2 if User→Admin, 4 peer↔peer | You can't force the Admin to reply, so a high score now means the Admin *actually engages* with that user — spam-proof by construction. |
| Decay | every 60 s (1 simulated "day") all edge scores × `DECAY_FACTOR = 0.95` | Trust fades when interaction stops (standard exponential aging, like real reputation systems). |
| Flag penalty | new `flagMessage(id)`: sender loses `FLAG_PENALTY = 15` points on that edge | Trust becomes losable. This is the hook for a future "malicious node" attack demo. |

Tunables are exported constants at the top of the file: `DECAY_FACTOR`, `DECAY_INTERVAL_MS`,
`FLAG_PENALTY`, and `gainPerMessage()`.

**`src/pages/Messaging.tsx`:** new **Flag** column in Delivery History — flagging a message
penalizes the sender's trust edge; the flag disables itself after use.

**`src/pages/Relationships.tsx` / `Analytics.tsx`:** scoring-formula text now matches the real
code (was `Interactions × 10`, which was never what the code did). "Messages needed to next tier"
is now simulated under the actual gain curve instead of `ceil(points/10)`.

**`src/pages/RouteAnalysis.tsx`:** "Execution Time" now measures only the algorithm calls —
previously it included the 800 ms spinner delay, so the displayed ms was fake.

**Cleanup:**
- Deleted the `ROUTES` constant in `src/data/mockData.ts` — hardcoded fake routes that nothing
  imported (Route Analysis computes real routes).
- `npm uninstall recharts react-force-graph-3d three md-to-docx-cli` — none were imported anywhere;
  −227 packages from `node_modules`.
- Fixed 5 pre-existing TypeScript errors (unused imports in Analytics/Relationships/Users, missing
  `id` in Sidebar's admin fallback object, a nullability miss). **`npm run build` now passes clean —
  it did not compile on `main`.**
- Replaced the default Vite template `README.md` with a real project README.

### Behavior change for users
- Priorities now **move in both directions**: sustained engagement raises them slowly; silence and
  flags lower them. Expect users to visibly drop tiers over time if they stop interacting (e.g.
  Alice fell P5→P4 within minutes of idling during testing — with 1 day compressed into 60 s,
  decay is fast by design for demos; raise `DECAY_INTERVAL_MS` for realism).
- Existing browser `localStorage` state carries over; scores evolve under the new rules from
  wherever they were.
