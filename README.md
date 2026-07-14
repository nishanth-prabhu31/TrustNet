# TrustNet — Centralized Authority Network Routing

A client-side simulation of a **trust-weighted communication network**: one Root Admin anchors the
trust of the entire system, and every routing decision follows from it. Built as a Design & Analysis
of Algorithms project — the interesting part is watching classical graph algorithms behave when their
edge weights are driven by organizational trust instead of distance.

## The idea

Every user earns a **Relationship Score (0–100)** with the Root Admin through messaging. That one
number drives everything:

| Score controls | Rule |
|---|---|
| Priority tier | ≥80 → P5 · ≥60 → P4 · ≥40 → P3 · ≥20 → P2 · else P1 |
| Position in the graph | `radius = 350 − score × 2.7` (trusted nodes orbit the Admin) |
| Routing cost | `cost(node) = max(1, 100 − score)` — trust is cheap, strangers are expensive |

## Algorithms

- **Dijkstra with a hand-written binary min-heap** — O((V+E) log V), lazy deletion of stale entries.
  Finds the minimum-trust-cost path; visibly bends routes inward through the trusted core.
- **BFS** — O(V+E), index-based FIFO queue. The unweighted baseline: fewest hops, trust-blind.
  Running both on identical inputs isolates exactly what trust-weighting does.
- **Complexity benchmark** — generates random connected graphs (V up to 5,000) and times heap
  Dijkstra against the O(V²) linear-scan variant live. Typical result: **~64× faster at V = 5,000**,
  with a cross-check that both variants return equal-cost paths.

Why not the others: Bellman-Ford solves negative weights we structurally can't have (cost is clamped
≥ 1); A* needs an admissible heuristic that trust-space doesn't offer (future work); Floyd-Warshall's
all-pairs precomputation goes stale on every message.

## Trust model

```
gain per message  = base / (1 + score/20)        (diminishing returns — spam-proof)
base              = 8 Admin→User · 2 User→Admin · 4 peer   (direction weighting)
decay             = score × 0.95 per simulated day (60 s)  (trust fades)
flag penalty      = −15 to the sender                       (trust is losable)
RelationshipScore = max(trust admin→u, trust u→admin)
```

Grounded in published reputation-system mechanics: saturating gains, exponential forgetting
(Jøsang & Ismail's Beta Reputation System), and penalty-driven collapse.

## Pages

Dashboard · Users (CRUD) · Network Graph (canvas starburst topology) · Messaging (with flagging) ·
Relationships (tier progression) · Priority Leaderboard · **Route Analysis** (Dijkstra vs BFS +
benchmark) · Analytics.

## Run it

```bash
npm install
npm run dev      # → http://localhost:5173
```

No backend — state persists in browser localStorage. `npm run build` type-checks and bundles.

## Tech

React 19 · TypeScript · Vite · Tailwind CSS v4 · react-force-graph-2d · react-router v7.

## Author

Nishanth Prabhu P
