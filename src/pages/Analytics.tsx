import { BarChart3, Trophy, TrendingUp, Users as UsersIcon, MessageSquare, ShieldCheck, Info } from 'lucide-react';
import { useApp, PRIORITY_COLORS, PRIORITY_THRESHOLDS, ADMIN_USER_ID, ADMIN_COLOR } from '../context/AppContext';

const priorityLabels: Record<number, string> = {
  1: 'Very Low', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Critical',
};

export default function Analytics() {
  const { users, messages, trustData, getRelationshipScore } = useApp();

  // User leaderboard
  const leaderboard = users.filter(u => u.id !== ADMIN_USER_ID).map(u => {
    const sent = messages.filter(m => m.sender === u.id).length;
    const received = messages.filter(m => m.receiver === u.id).length;
    const score = getRelationshipScore(u.id);
    return { ...u, sent, received, score };
  }).sort((a, b) => b.score - a.score);

  // Priority distribution
  const priorityDist = [1, 2, 3, 4, 5].map(p => ({
    priority: p,
    count: users.filter(u => u.priority === p).length,
    label: priorityLabels[p],
  }));
  const maxPriorityCount = Math.max(...priorityDist.map(d => d.count), 1);

  // Admin Interactions
  const adminMessages = messages.filter(m => m.sender === ADMIN_USER_ID || m.receiver === ADMIN_USER_ID).length;
  
  // Total edges
  const allEdges: { from: string; to: string; score: number }[] = [];
  for (const [src, edges] of Object.entries(trustData)) {
    for (const [tgt, data] of Object.entries(edges as any)) {
      allEdges.push({ from: src, to: tgt, score: (data as any).score });
    }
  }
  
  // Message stats
  const totalMessages = messages.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Network Analytics</h1>
        <p className="text-slate-400 mt-1">Performance metrics and relationship scoring breakdown</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400"><UsersIcon className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-slate-400">Total Nodes</p>
            <p className="text-xl font-bold text-white">{users.length}</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-violet-500/10 text-violet-400"><MessageSquare className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-slate-400">Messages</p>
            <p className="text-xl font-bold text-white">{totalMessages}</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${ADMIN_COLOR}20`, color: ADMIN_COLOR }}><ShieldCheck className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-slate-400">Admin Interactions</p>
            <p className="text-xl font-bold text-white">{adminMessages}</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400"><TrendingUp className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-slate-400">Network Edges</p>
            <p className="text-xl font-bold text-white">{allEdges.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard */}
        <div className="lg:col-span-2 glass-panel p-6">
          <h2 className="font-bold text-slate-200 flex items-center gap-2 mb-5">
            <Trophy className="w-5 h-5 text-yellow-400" /> Admin's Inner Circle
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-700/50">
                  <th className="py-3 px-2">#</th>
                  <th className="py-3 px-2">User</th>
                  <th className="py-3 px-2 text-center">Sent</th>
                  <th className="py-3 px-2 text-center">Received</th>
                  <th className="py-3 px-2 text-center">Rel. Score</th>
                  <th className="py-3 px-2 text-center">Priority</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((u, idx) => (
                  <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        idx === 1 ? 'bg-slate-400/20 text-slate-300' :
                        idx === 2 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-slate-700 text-slate-400'
                      }`}>
                        {idx + 1}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: u.color + '30', color: u.color }}>
                          {u.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-slate-200 font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center text-slate-300">{u.sent}</td>
                    <td className="py-3 px-2 text-center text-slate-300">{u.received}</td>
                    <td className="py-3 px-2 text-center">
                      <span className="font-bold text-white">{u.score}</span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="px-2 py-1 rounded text-xs font-bold"
                        style={{ backgroundColor: PRIORITY_COLORS[u.priority!] + '30', color: PRIORITY_COLORS[u.priority!] }}>
                        P{u.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="glass-panel p-6">
          <h2 className="font-bold text-slate-200 flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-blue-400" /> Priority Distribution
          </h2>
          <div className="space-y-4">
            {priorityDist.map(({ priority, count, label }) => (
              <div key={priority}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[priority] }} />
                    <span className="text-sm text-slate-300">P{priority} — {label}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{count}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5">
                  <div className="h-2.5 rounded-full transition-all duration-700"
                    style={{
                      width: `${(count / maxPriorityCount) * 100}%`,
                      backgroundColor: PRIORITY_COLORS[priority],
                      boxShadow: `0 0 8px ${PRIORITY_COLORS[priority]}40`,
                    }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scoring Rules */}
      <div className="glass-panel p-6">
        <h2 className="font-bold text-slate-200 flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-blue-400" /> Scoring & Priority Rules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Relationship Score Formula</h3>
            <div className="bg-slate-800/50 rounded-lg p-4 font-mono text-sm text-slate-300 space-y-1">
              <p>Gain per message = Base(dir) / (1 + Score/20)</p>
              <p className="text-xs text-slate-500">Base: Admin→User 8 · User→Admin 2 · Peer 4</p>
              <p className="text-xs text-slate-500">Decay ×0.95/day · Flag penalty −15</p>
            </div>
            <div className="mt-3 space-y-1.5">
              {PRIORITY_THRESHOLDS.slice().reverse().map(t => (
                <div key={t.priority} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[t.priority] }} />
                  <span className="text-slate-400">Score ≥ {t.min}</span>
                  <span className="text-slate-300 font-medium">→ P{t.priority} ({priorityLabels[t.priority]})</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Routing Costs</h3>
            <div className="bg-slate-800/50 rounded-lg p-4 font-mono text-sm text-slate-300 space-y-1">
              <p>NodeCost = 100 - RelationshipScore + 1</p>
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-slate-400">
              <p>• The pathfinder algorithm finds routes with the lowest total NodeCost</p>
              <p>• Routing through users close to the Admin is extremely cheap (cost approaches 1)</p>
              <p>• Routing through un-trusted users is expensive (cost approaches 100)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
