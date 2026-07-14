import { Info, Star } from 'lucide-react';
import { useApp, ADMIN_USER_ID, PRIORITY_COLORS, PRIORITY_THRESHOLDS, gainPerMessage } from '../context/AppContext';

export default function Relationships() {
  const { users, getRelationshipScore } = useApp();

  const relationshipData = users
    .filter(u => u.id !== ADMIN_USER_ID)
    .map(u => {
      const score = getRelationshipScore(u.id);
      
      // Find next threshold
      let nextThreshold = null;
      for (let i = PRIORITY_THRESHOLDS.length - 1; i >= 0; i--) {
        if (score < PRIORITY_THRESHOLDS[i].min) {
          nextThreshold = PRIORITY_THRESHOLDS[i];
          break;
        }
      }

      const isMaxPriority = !nextThreshold;
      // Simulate user→admin messages under the diminishing-returns gain curve
      let messagesToNext = 0;
      if (nextThreshold) {
        let s = score;
        while (s < nextThreshold.min && messagesToNext < 999) {
          s += gainPerMessage(u.id, ADMIN_USER_ID, s);
          messagesToNext++;
        }
      }
      const progress = nextThreshold 
        ? (score / nextThreshold.min) * 100 
        : 100;

      return {
        user: u,
        score,
        nextThreshold,
        isMaxPriority,
        messagesToNext,
        progress
      };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Admin Relationships</h1>
          <p className="text-slate-400 mt-1">Track your relationship scores with users. Closer relationships yield higher network priority.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {relationshipData.map(({ user, score, isMaxPriority, nextThreshold, messagesToNext, progress }) => (
          <div key={user.id} className="glass-panel p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <span className="px-2 py-1 rounded text-xs font-bold"
                style={{ backgroundColor: PRIORITY_COLORS[user.priority!] + '30', color: PRIORITY_COLORS[user.priority!] }}>
                P{user.priority}
              </span>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ backgroundColor: user.color + '20', color: user.color }}>
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 className="font-bold text-slate-200 text-lg">{user.name}</h3>
                <p className="text-sm text-slate-400 font-mono">Score: {score}/100</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Progress to {isMaxPriority ? 'Max' : `P${nextThreshold?.priority}`}</span>
                <span className="text-slate-300 font-mono">{Math.floor(progress)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="h-2 rounded-full transition-all duration-700"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: PRIORITY_COLORS[user.priority!],
                    boxShadow: `0 0 10px ${PRIORITY_COLORS[user.priority!]}80`,
                  }} />
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-800/50">
                {isMaxPriority ? (
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                    <Star className="w-4 h-4" /> Max Priority Reached!
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    Needs <span className="text-blue-400 font-bold">{messagesToNext}</span> more direct interaction{messagesToNext !== 1 && 's'} with Admin to reach P{nextThreshold?.priority}.
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel p-6">
        <h2 className="font-bold text-slate-200 flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-blue-400" /> Relationship Scoring Formula
        </h2>
        <div className="bg-slate-800/50 rounded-lg p-4 font-mono text-sm text-slate-300">
          <p>Gain per message = Base(direction) / (1 + Score/20)</p>
          <p className="text-xs text-slate-500 mt-1">Base: Admin→User = 8 · User→Admin = 2 · Peer↔Peer = 4</p>
          <p className="text-xs text-slate-500">Decay: Score × 0.95 per day · Flagged message: −15 to sender</p>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
            {PRIORITY_THRESHOLDS.map(t => (
              <div key={t.priority} className="p-2 rounded bg-slate-800 text-center">
                <p className="text-xs text-slate-400 mb-1">Score ≥ {t.min}</p>
                <span className="px-2 py-0.5 rounded text-xs font-bold"
                  style={{ backgroundColor: PRIORITY_COLORS[t.priority] + '30', color: PRIORITY_COLORS[t.priority] }}>
                  P{t.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
