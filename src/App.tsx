import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Shell from './components/layout/Shell';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import NetworkGraph from './pages/NetworkGraph';
import Landing from './pages/Landing';
import Messaging from './pages/Messaging';
import TrustManagement from './pages/Relationships';
import PriorityQueue from './pages/PriorityLeaderboard';
import RouteAnalysis from './pages/RouteAnalysis';
import Analytics from './pages/Analytics';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app" element={<Shell />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="network" element={<NetworkGraph />} />
            <Route path="messaging" element={<Messaging />} />
            <Route path="relationships" element={<TrustManagement />} />
            <Route path="leaderboard" element={<PriorityQueue />} />
            <Route path="routing" element={<RouteAnalysis />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  )
}

export default App;
