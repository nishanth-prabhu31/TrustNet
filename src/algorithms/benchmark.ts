import { type Adjacency, dijkstraLinear, dijkstraHeap } from './pathfinding';

export interface BenchResult {
  n: number;
  edges: number;
  linearMs: number;
  heapMs: number;
  speedup: number;
  costsAgree: boolean;
}

// Random connected graph: a spanning chain guarantees connectivity,
// then extra random edges bring the average degree to ~avgDegree.
export function generateRandomGraph(n: number, avgDegree = 4): { ids: string[]; adj: Adjacency; edges: number } {
  const ids = Array.from({ length: n }, (_, i) => `n${i}`);
  const adj: Adjacency = {};
  for (const id of ids) adj[id] = [];

  let edges = 0;
  const addEdge = (a: number, b: number) => {
    const w = 1 + Math.floor(Math.random() * 99);
    adj[ids[a]].push({ to: ids[b], weight: w });
    adj[ids[b]].push({ to: ids[a], weight: w });
    edges++;
  };

  for (let i = 1; i < n; i++) addEdge(i - 1, i);
  const extra = Math.max(0, Math.floor((n * avgDegree) / 2) - (n - 1));
  for (let k = 0; k < extra; k++) {
    const a = Math.floor(Math.random() * n);
    let b = Math.floor(Math.random() * n);
    if (a === b) b = (b + 1) % n;
    addEdge(a, b);
  }
  return { ids, adj, edges };
}

function timeBest<T>(runs: number, fn: () => T): { ms: number; result: T } {
  let best = Infinity;
  let result!: T;
  for (let i = 0; i < runs; i++) {
    const t0 = performance.now();
    result = fn();
    const t = performance.now() - t0;
    if (t < best) best = t;
  }
  return { ms: best, result };
}

// Times both Dijkstra variants on the same random graph (best of `runs`),
// and cross-checks that they found equally cheap paths.
export function benchmarkSize(n: number, runs = 3): BenchResult {
  const { ids, adj, edges } = generateRandomGraph(n);
  const source = ids[0];
  const dest = ids[n - 1];

  const linear = timeBest(runs, () => dijkstraLinear(ids, adj, source, dest));
  const heap = timeBest(runs, () => dijkstraHeap(ids, adj, source, dest));

  return {
    n,
    edges,
    linearMs: +linear.ms.toFixed(2),
    heapMs: +heap.ms.toFixed(2),
    speedup: heap.ms > 0 ? +(linear.ms / heap.ms).toFixed(1) : Infinity,
    costsAgree: linear.result?.cost === heap.result?.cost,
  };
}

export const BENCHMARK_SIZES = [100, 500, 2000, 5000];
