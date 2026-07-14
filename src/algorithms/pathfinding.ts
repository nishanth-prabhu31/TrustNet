import { MinHeap } from './minHeap';

export type Adjacency = Record<string, { to: string; weight: number }[]>;
export interface PathResult {
  path: string[];
  cost: number;
}

// Build the trust-weighted adjacency list from live app data.
// Cost to enter a node is inversely proportional to its Relationship Score with Admin:
// weight = max(1, 100 - score). Edges are bidirectional.
export function buildTrustAdjacency(
  ids: string[],
  trustData: Record<string, Record<string, unknown>>,
  getRelationshipScore: (id: string) => number,
): Adjacency {
  const adj: Adjacency = {};
  for (const id of ids) adj[id] = [];
  for (const [src, edges] of Object.entries(trustData)) {
    for (const tgt of Object.keys(edges)) {
      const tgtWeight = Math.max(1, 100 - getRelationshipScore(tgt));
      const srcWeight = Math.max(1, 100 - getRelationshipScore(src));
      if (!adj[src]) adj[src] = [];
      if (!adj[tgt]) adj[tgt] = [];
      adj[src].push({ to: tgt, weight: tgtWeight });
      adj[tgt].push({ to: src, weight: srcWeight });
    }
  }
  return adj;
}

function reconstruct(prev: Record<string, string | null>, dest: string): string[] {
  const path: string[] = [];
  let current: string | null = dest;
  while (current) {
    path.unshift(current);
    current = prev[current];
  }
  return path;
}

// Dijkstra, textbook O(V²) variant: linear scan for the closest unvisited node.
// Kept for the benchmark comparison against the heap version.
export function dijkstraLinear(ids: string[], adj: Adjacency, source: string, dest: string): PathResult | null {
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const visited = new Set<string>();
  for (const id of ids) {
    dist[id] = Infinity;
    prev[id] = null;
  }
  dist[source] = 0;

  for (;;) {
    let u: string | null = null;
    let minDist = Infinity;
    for (const id of ids) {
      if (!visited.has(id) && dist[id] < minDist) {
        minDist = dist[id];
        u = id;
      }
    }
    if (u === null || u === dest) break;
    visited.add(u);

    for (const edge of adj[u] || []) {
      if (visited.has(edge.to)) continue;
      const alt = dist[u] + edge.weight;
      if (alt < dist[edge.to]) {
        dist[edge.to] = alt;
        prev[edge.to] = u;
      }
    }
  }

  if (dist[dest] === Infinity) return null;
  return { path: reconstruct(prev, dest), cost: +dist[dest].toFixed(2) };
}

// Dijkstra with a binary min-heap: O((V + E) log V) — the version the report describes.
// Uses lazy deletion: outdated heap entries are skipped when popped.
export function dijkstraHeap(ids: string[], adj: Adjacency, source: string, dest: string): PathResult | null {
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const visited = new Set<string>();
  for (const id of ids) {
    dist[id] = Infinity;
    prev[id] = null;
  }
  dist[source] = 0;

  const heap = new MinHeap<string>();
  heap.push(0, source);

  while (heap.size > 0) {
    const { key, value: u } = heap.pop()!;
    if (visited.has(u) || key > dist[u]) continue; // stale entry
    if (u === dest) break;
    visited.add(u);

    for (const edge of adj[u] || []) {
      if (visited.has(edge.to)) continue;
      const alt = dist[u] + edge.weight;
      if (alt < dist[edge.to]) {
        dist[edge.to] = alt;
        prev[edge.to] = u;
        heap.push(alt, edge.to);
      }
    }
  }

  if (dist[dest] === Infinity) return null;
  return { path: reconstruct(prev, dest), cost: +dist[dest].toFixed(2) };
}

// Standard BFS — fewest hops, ignores weights.
export function bfs(_ids: string[], adj: Adjacency, source: string, dest: string): PathResult | null {
  const visited = new Set<string>([source]);
  const prev: Record<string, string | null> = { [source]: null };
  const queue: string[] = [source];
  let head = 0; // index-based queue: avoids O(n) Array.shift

  while (head < queue.length) {
    const current = queue[head++];
    if (current === dest) {
      const path = reconstruct(prev, dest);
      return { path, cost: path.length - 1 };
    }
    for (const edge of adj[current] || []) {
      if (!visited.has(edge.to)) {
        visited.add(edge.to);
        prev[edge.to] = current;
        queue.push(edge.to);
      }
    }
  }
  return null;
}
