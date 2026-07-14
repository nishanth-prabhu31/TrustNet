import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Network, MessageSquare, ShieldCheck, ListOrdered, Route as RouteIcon, BarChart3 } from 'lucide-react';
import clsx from 'clsx';
import { useApp } from '../../context/AppContext';

const navItems = [
  { path: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { path: '/app/users', label: 'Users', icon: Users },
  { path: '/app/network', label: 'Network Graph', icon: Network },
  { path: '/app/messaging', label: 'Messaging', icon: MessageSquare },
  { path: '/app/relationships', label: 'Relationships', icon: ShieldCheck },
  { path: '/app/leaderboard', label: 'Priority Leaderboard', icon: ListOrdered },
  { path: '/app/routing', label: 'Routing', icon: RouteIcon },
  { path: '/app/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function Sidebar() {
  const { users } = useApp();
  const admin = users.find(u => u.id === 'admin') || { id: 'admin', name: 'Nirmith Shetty', priority: 1, color: '#3B82F6' };

  return (
    <div className="w-64 h-full glass-panel border-y-0 border-l-0 rounded-none flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-glass-border">
        <NavLink to="/" className="flex items-center gap-2 text-blue-500 font-bold text-xl tracking-wide hover:opacity-80 transition-opacity">
          <Network className="w-6 h-6" />
          <span>TrustNet</span>
        </NavLink>
      </div>
      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                isActive 
                  ? "bg-blue-500/10 text-blue-400 font-medium" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </div>
      <div className="p-4 border-t border-glass-border">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
               style={{ backgroundColor: admin.color }}>
            {admin.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200 truncate max-w-[120px]" title={admin.name}>{admin.name}</p>
            <p className="text-xs text-slate-500">Node ID: {admin.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
