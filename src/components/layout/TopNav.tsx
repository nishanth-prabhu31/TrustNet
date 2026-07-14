import { Link } from 'react-router-dom';
import { Bell, Search, Settings } from 'lucide-react';
import { useApp, ADMIN_USER_ID } from '../../context/AppContext';

export default function TopNav() {
  const { messages } = useApp();
  const unreadCount = messages.filter(m => m.receiver === ADMIN_USER_ID).length;

  return (
    <div className="h-16 w-full glass-panel border-x-0 border-t-0 rounded-none flex items-center justify-between px-6 z-10 sticky top-0">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search network nodes, routes, or messages..." 
            className="w-full bg-slate-800/50 border border-glass-border rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4 ml-4">
        <Link to="/app/leaderboard" className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          System Online
        </Link>
        
        <Link to="/app/messaging" className="relative p-2 text-slate-400 hover:text-slate-200 transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-slate-900">
              {unreadCount}
            </span>
          )}
        </Link>
        
        <button className="p-2 text-slate-400 hover:text-slate-200 transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
