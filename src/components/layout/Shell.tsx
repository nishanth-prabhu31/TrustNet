import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function Shell() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-900 text-slate-50 relative">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />

      <Sidebar />
      <div className="flex-1 flex flex-col relative z-0 overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
