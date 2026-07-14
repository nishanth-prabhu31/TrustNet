import { useState, useCallback } from 'react';
import { Route as RouteIcon, Play, Clock, Weight, Footprints, Info, Gauge, CheckCircle2 } from 'lucide-react';
import { useApp, PRIORITY_COLORS, ADMIN_USER_ID } from '../context/AppContext';
import { buildTrustAdjacency, dijkstraHeap, bfs } from '../algorithms/pathfinding';
import { benchmarkSize, BENCHMARK_SIZES, type BenchResult } from '../algorithms/benchmark';

type Algorithm = 'dijkstra' | 'bfs';

const BENCH_COLORS = { linear: '#3B82F6', heap: '#EA580C' }; // CVD-validated pair

// Pathfinding implementations live in src/algorithms/ (minHeap.ts, pathfinding.ts, benchmark.ts)

export default function RouteAnalysis() {
  const { users, trustData, getRelationshipScore } = useApp();
  const [source, setSource] = useState('');
  const [dest, setDest] = useState('');
  const [algo, setAlgo] = useState<Algorithm>('dijkstra');
  const [result, setResult] = useState<null | { path: string[]; cost: number; bfsCost: number; dijkstraCost: number; time: number }>(null);
  const [calculating, setCalculating] = useState(false);
  const [benchResults, setBenchResults] = useState<BenchResult[] | null>(null);
  const [benchRunning, setBenchRunning] = useState(false);

  const handleCalculate = useCallback(() => {
    if (!source || !dest) return;
    setCalculating(true);
    setResult(null);

    setTimeout(() => {
      // Measure only the algorithms — the surrounding spinner delay is UX, not computation
      const ids = users.map(u => u.id);
      const startTime = performance.now();
      const adj = buildTrustAdjacency(ids, trustData, getRelationshipScore);
      const dijkstraResult = dijkstraHeap(ids, adj, source, dest);
      const bfsResult = bfs(ids, adj, source, dest);
      const elapsed = +(performance.now() - startTime).toFixed(2);

      const activeResult = algo === 'dijkstra' ? dijkstraResult : bfsResult;

      if (activeResult) {
        setResult({
          path: activeResult.path,
          cost: activeResult.cost,
          bfsCost: bfsResult?.cost || 0,
          dijkstraCost: dijkstraResult?.cost || 0,
          time: elapsed,
        });
      }
      setCalculating(false);
    }, 800);
  }, [source, dest, algo, users, trustData, getRelationshipScore]);

  const handleBenchmark = useCallback(() => {
    setBenchRunning(true);
    setBenchResults(null);
    // Let the spinner paint before blocking the main thread with the benchmark
    setTimeout(() => {
      setBenchResults(BENCHMARK_SIZES.map(n => benchmarkSize(n)));
      setBenchRunning(false);
    }, 50);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Route Analysis</h1>
        <p className="text-slate-400 mt-1">Find optimal routes favoring users with high Admin Relationship Scores</p>
      </div>

      {/* Config Panel */}
      <div className="glass-panel p-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Source Node</label>
            <select value={source} onChange={e => { setSource(e.target.value); setResult(null); }}
              className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
              <option value="">Select source...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} {u.id === ADMIN_USER_ID ? '(Root)' : `(P${u.priority})`}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Destination Node</label>
            <select value={dest} onChange={e => { setDest(e.target.value); setResult(null); }}
              className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
              <option value="">Select destination...</option>
              {users.filter(u => u.id !== source).map(u => <option key={u.id} value={u.id}>{u.name} {u.id === ADMIN_USER_ID ? '(Root)' : `(P${u.priority})`}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Algorithm</label>
            <select value={algo} onChange={e => setAlgo(e.target.value as Algorithm)}
              className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
              <option value="dijkstra">Admin-Weighted Path</option>
              <option value="bfs">Shortest Path (Hops)</option>
            </select>
          </div>
          <button onClick={handleCalculate} disabled={calculating || !source || !dest}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg transition-colors">
            <Play className="w-4 h-4" /> {calculating ? 'Calculating...' : 'Calculate Route'}
          </button>
        </div>
      </div>

      {/* Calculating Spinner */}
      {calculating && (
        <div className="glass-panel p-12 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-300 font-medium">Running routing algorithm...</p>
          <p className="text-sm text-slate-500 mt-1">Evaluating node traversal costs</p>
        </div>
      )}

      {/* Results */}
      {result && !calculating && (
        <div className="space-y-6">
          {/* Path Visualization */}
          <div className="glass-panel p-6">
            <h2 className="font-bold text-slate-200 flex items-center gap-2 mb-6">
              <RouteIcon className="w-5 h-5 text-blue-400" /> Optimal Route
            </h2>
            <div className="flex items-center justify-center gap-2 flex-wrap py-4">
              {result.path.map((nodeId, idx) => {
                const user = users.find(u => u.id === nodeId);
                const isRoot = user?.id === ADMIN_USER_ID;
                return (
                  <div key={nodeId} className="flex items-center gap-2">
                    <div className="flex flex-col items-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-lg border-2 ${isRoot ? 'animate-pulse' : ''}`}
                        style={{
                          backgroundColor: PRIORITY_COLORS[user?.priority || 1] + '30',
                          borderColor: PRIORITY_COLORS[user?.priority || 1],
                          boxShadow: `0 0 15px ${PRIORITY_COLORS[user?.priority || 1]}40`,
                        }}>
                        {user?.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className={`text-xs mt-2 ${isRoot ? 'text-blue-400 font-bold' : 'text-slate-400'}`}>
                        {user?.name.split(' ')[0]}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded mt-1 font-bold"
                        style={{ backgroundColor: PRIORITY_COLORS[user?.priority || 1] + '30', color: PRIORITY_COLORS[user?.priority || 1] }}>
                        {isRoot ? 'ROOT' : `P${user?.priority}`}
                      </span>
                    </div>
                    {idx < result.path.length - 1 && (
                      <div className="flex flex-col items-center mx-2">
                        <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-violet-500" />
                        <span className="text-xs text-slate-500 mt-1">hop</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-5 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400"><Footprints className="w-6 h-6" /></div>
              <div>
                <p className="text-sm text-slate-400">Path Length</p>
                <p className="text-2xl font-bold text-white">{result.path.length - 1} hops</p>
              </div>
            </div>
            <div className="glass-card p-5 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-violet-500/10 text-violet-400"><Weight className="w-6 h-6" /></div>
              <div>
                <p className="text-sm text-slate-400">Total Route Cost</p>
                <p className="text-2xl font-bold text-white">{result.cost}</p>
              </div>
            </div>
            <div className="glass-card p-5 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400"><Clock className="w-6 h-6" /></div>
              <div>
                <p className="text-sm text-slate-400">Execution Time</p>
                <p className="text-2xl font-bold text-white">{result.time}ms</p>
              </div>
            </div>
          </div>

          {/* Algorithm Comparison */}
          <div className="glass-panel p-6">
            <h2 className="font-bold text-slate-200 mb-4">Algorithm Comparison</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-5 rounded-lg border transition-all ${algo === 'dijkstra' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-slate-800/30 border-slate-700/30'}`}>
                <h3 className="font-bold text-slate-200 mb-2">Admin-Weighted Path (Dijkstra)</h3>
                <p className="text-sm text-slate-400 mb-3">Prefers nodes with high Admin Relationship</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Cost:</span><span className="text-white font-mono">{result.dijkstraCost}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Node Weight:</span><span className="text-white font-mono">100 - Score</span></div>
                </div>
              </div>
              <div className={`p-5 rounded-lg border transition-all ${algo === 'bfs' ? 'bg-violet-500/10 border-violet-500/30' : 'bg-slate-800/30 border-slate-700/30'}`}>
                <h3 className="font-bold text-slate-200 mb-2">Shortest Path (BFS)</h3>
                <p className="text-sm text-slate-400 mb-3">Fewest-hops path (ignores relationship weights)</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Cost:</span><span className="text-white font-mono">{result.bfsCost} hops</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Node Weight:</span><span className="text-white font-mono">1</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complexity Benchmark */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-slate-200 flex items-center gap-2">
            <Gauge className="w-5 h-5 text-orange-500" /> Complexity Benchmark — O(V²) vs O((V+E) log V)
          </h2>
          <button onClick={handleBenchmark} disabled={benchRunning}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold rounded-lg transition-colors">
            <Play className="w-4 h-4" /> {benchRunning ? 'Running…' : 'Run Benchmark'}
          </button>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Generates random connected graphs (avg degree 4) and times both Dijkstra variants — best of 3 runs each.
        </p>

        {benchResults && (
          <>
            {/* Legend */}
            <div className="flex items-center gap-5 mb-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: BENCH_COLORS.linear }} /> Linear scan — O(V²)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: BENCH_COLORS.heap }} /> Binary min-heap — O((V+E) log V)
              </span>
            </div>

            {/* Small multiples: one row per graph size, bars scaled to that row's max */}
            <div className="space-y-4">
              {benchResults.map(r => {
                const rowMax = Math.max(r.linearMs, r.heapMs, 0.01);
                return (
                  <div key={r.n} className="bg-slate-800/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2 text-xs">
                      <span className="text-slate-300 font-medium">
                        V = {r.n.toLocaleString()} <span className="text-slate-500">· E = {r.edges.toLocaleString()}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        {r.costsAgree && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> paths agree
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded font-bold text-orange-400 bg-orange-500/10">
                          {r.speedup}× faster
                        </span>
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {([['linear', r.linearMs], ['heap', r.heapMs]] as const).map(([kind, ms]) => (
                        <div key={kind} className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-800/60 rounded h-3 overflow-hidden">
                            <div className="h-3 rounded-r"
                              style={{ width: `${Math.max(1.5, (ms / rowMax) * 100)}%`, backgroundColor: BENCH_COLORS[kind] }} />
                          </div>
                          <span className="w-20 text-right text-xs font-mono text-slate-300">{ms} ms</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 mt-3">
              The gap widens as V grows — that's the asymptotic difference: the linear scan does V passes over all
              vertices, while the heap extracts the closest vertex in log V.
            </p>
          </>
        )}

        {benchRunning && (
          <div className="flex items-center gap-3 text-slate-400 text-sm py-6 justify-center">
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            Timing algorithms on graphs up to {Math.max(...BENCHMARK_SIZES).toLocaleString()} nodes…
          </div>
        )}
      </div>

      {/* Algorithm Info */}
      <div className="glass-panel p-6">
        <h2 className="font-bold text-slate-200 flex items-center gap-2 mb-3">
          <Info className="w-5 h-5 text-blue-400" /> How Routing Works
        </h2>
        <div className="bg-slate-800/50 rounded-lg p-4 font-mono text-sm text-slate-300 space-y-1">
          <p>Traversal Cost = 100 - RelationshipScore + 1</p>
          <p className="text-xs text-slate-500 mt-2">• The algorithm heavily prefers routing through nodes that are close to Admin</p>
          <p className="text-xs text-slate-500">• Interacting directly with Admin makes a node significantly cheaper to route through</p>
        </div>
      </div>
    </div>
  );
}
