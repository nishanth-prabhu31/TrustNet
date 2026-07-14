import { Trophy, Medal, Star, TrendingUp } from 'lucide-react';
import { useApp, ADMIN_USER_ID, PRIORITY_COLORS } from '../context/AppContext';

export default function PriorityLeaderboard() {
  const { users, getRelationshipScore } = useApp();

  const leaderboardData = users
    .filter(u => u.id !== ADMIN_USER_ID)
    .map(u => ({
      ...u,
      score: getRelationshipScore(u.id),
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-400" /> Priority Leaderboard
        </h1>
        <p className="text-slate-400 mt-1">Global ranking of users based on their Relationship Score with the Root Admin.</p>
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-700/50 bg-slate-800/30 text-xs uppercase tracking-wider text-slate-400">
              <th className="py-4 px-6 font-medium">Rank</th>
              <th className="py-4 px-6 font-medium">User</th>
              <th className="py-4 px-6 font-medium text-center">Priority Tier</th>
              <th className="py-4 px-6 font-medium text-right">Relationship Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {leaderboardData.map((user, index) => (
              <tr key={user.id} className="hover:bg-slate-800/20 transition-colors group">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    {index === 0 ? <Medal className="w-5 h-5 text-yellow-400" /> :
                     index === 1 ? <Medal className="w-5 h-5 text-slate-300" /> :
                     index === 2 ? <Medal className="w-5 h-5 text-amber-600" /> :
                     <span className="text-slate-500 font-mono pl-1">{index + 1}</span>}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg"
                      style={{ backgroundColor: user.color + '20', color: user.color }}>
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{user.name}</p>
                      <p className="text-xs text-slate-500 font-mono">{user.id}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex justify-center">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-sm"
                      style={{ 
                        backgroundColor: PRIORITY_COLORS[user.priority!] + '15',
                        borderColor: PRIORITY_COLORS[user.priority!] + '30',
                        color: PRIORITY_COLORS[user.priority!]
                      }}>
                      <Star className="w-3.5 h-3.5" fill="currentColor" />
                      <span className="font-bold text-sm">P{user.priority}</span>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-bold font-mono text-slate-200">{user.score}</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-500" /> / 100
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {leaderboardData.length === 0 && (
          <div className="p-12 text-center flex flex-col items-center">
            <Trophy className="w-12 h-12 text-slate-600 mb-4" />
            <p className="text-slate-400">No users found in the system.</p>
          </div>
        )}
      </div>
    </div>
  );
}
