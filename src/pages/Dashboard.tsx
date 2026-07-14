import { Users as UsersIcon, MessageSquare, Network, ShieldCheck, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp, PRIORITY_COLORS, ADMIN_USER_ID, ADMIN_COLOR } from '../context/AppContext';

const StatCard = ({ title, value, icon: Icon, trend, color, onClick }: any) => (
  <div onClick={onClick} className="glass-card p-6 flex flex-col relative overflow-hidden group cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300">
    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 group-hover:scale-110 transition-transform duration-500`} style={{ backgroundColor: color }} />
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 rounded-lg" style={{ backgroundColor: `${color}20`, color: color }}>
        <Icon className="w-6 h-6" />
      </div>
      {trend !== undefined && (
        <span className={`text-sm font-medium ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
    <p className="text-3xl font-bold text-slate-50 mt-1">{value}</p>
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { users, messages, trustData, getRelationshipScore } = useApp();

  const nodeCount = users.length;
  const messageCount = messages.length;
  const edgeCount = Object.values(trustData).reduce((acc, edges) => acc + Object.keys(edges).length, 0);
  const adminInteractionsCount = messages.filter(m => m.sender === ADMIN_USER_ID || m.receiver === ADMIN_USER_ID).length;

  // Admin's inner circle
  const topUsers = users
    .filter(u => u.id !== ADMIN_USER_ID)
    .map(u => ({ ...u, score: getRelationshipScore(u.id) }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Centralized Dashboard</h1>
          <p className="text-slate-400 mt-1">Real-time metrics focusing on the Admin's Inner Circle and Network Health</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Total Users (Nodes)" value={nodeCount} icon={UsersIcon} color="#3B82F6" onClick={() => navigate('/app/users')} />
        <StatCard title="Total Messages" value={messageCount} icon={MessageSquare} color="#8B5CF6" onClick={() => navigate('/app/messaging')} />
        <StatCard title="Active Connections (Edges)" value={edgeCount} icon={Network} color="#10B981" onClick={() => navigate('/app/network')} />
        <StatCard title="Admin Interactions" value={adminInteractionsCount} icon={ShieldCheck} color={ADMIN_COLOR} onClick={() => navigate('/app/relationships')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col">
          <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Network Interaction Throughput
          </h2>
          <div className="flex-1 flex items-end gap-1 px-2">
            {users.slice(0, 10).map(u => {
              const interactionsWithAdmin = messages.filter(m => (m.sender === u.id && m.receiver === ADMIN_USER_ID) || (m.sender === ADMIN_USER_ID && m.receiver === u.id)).length;
              const otherInteractions = messages.filter(m => (m.sender === u.id || m.receiver === u.id) && m.sender !== ADMIN_USER_ID && m.receiver !== ADMIN_USER_ID).length;
              const total = interactionsWithAdmin + otherInteractions;
              
              const maxTotal = Math.max(...users.map(u2 => messages.filter(m => m.sender === u2.id || m.receiver === u2.id).length), 1);
              
              return (
                <div key={u.id} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-400">{total}</span>
                  <div className="w-full flex flex-col gap-0.5" style={{ height: '200px' }}>
                    <div className="flex-1" />
                    <div className="rounded-t-sm" style={{
                      height: `${(interactionsWithAdmin / Math.max(maxTotal, 1)) * 180}px`,
                      background: 'linear-gradient(to top, #3B82F6, #60A5FA)',
                      boxShadow: '0 0 8px rgba(59,130,246,0.3)',
                    }} />
                    <div className="rounded-b-sm" style={{
                      height: `${(otherInteractions / Math.max(maxTotal, 1)) * 180}px`,
                      background: 'linear-gradient(to top, #64748B, #94A3B8)',
                    }} />
                  </div>
                  <span className="text-[10px] text-slate-500 truncate w-full text-center font-bold" style={{ color: u.color }}>
                    {u.id === ADMIN_USER_ID ? 'ADMIN' : u.name.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-700/50">
            <div className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded bg-blue-500" /> With Admin</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded bg-slate-500" /> With Others</div>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col">
          <h2 className="text-lg font-bold text-slate-200 mb-4 text-blue-400 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" /> Admin's Inner Circle
          </h2>
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
            {topUsers.map((user) => (
              <div key={user.id} onClick={() => navigate('/app/relationships')}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-700">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                  style={{ backgroundColor: `${user.color}20`, color: user.color }}>
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-200">{user.name}</p>
                  <p className="text-xs text-slate-500">Relationship Score: {user.score}</p>
                </div>
                <div className="text-sm font-bold px-2 py-0.5 rounded" style={{ color: PRIORITY_COLORS[user.priority!], backgroundColor: PRIORITY_COLORS[user.priority!] + '20' }}>
                  P{user.priority}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
