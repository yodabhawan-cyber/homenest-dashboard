import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import Shopping from './pages/Shopping';
import Chores from './pages/Chores';
import Meals from './pages/Meals';
import Profiles from './pages/Profiles';
import Settings from './pages/Settings';
import Activity from './pages/Activity';
import Calendar from './pages/Calendar';
import ScreenTime from './pages/ScreenTime';
import SmartHome from './pages/SmartHome';
import Cameras from './pages/Cameras';
import Rewards from './pages/Rewards';
import Setup from './pages/Setup';
import Test from './pages/Test';

function Layout({ children }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const navItems = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/shopping', icon: '🛒', label: 'Shopping' },
    { path: '/chores', icon: '✅', label: 'Chores' },
    { path: '/meals', icon: '🍽️', label: 'Meals' },
    { path: '/activity', icon: '📊', label: 'Activity' },
    { path: '/smarthome', icon: '⚡', label: 'Smart Home' },
    { path: '/cameras', icon: '📹', label: 'Cameras' },
    { path: '/rewards', icon: '⭐', label: 'Rewards' },
    { path: '/screentime', icon: '📱', label: 'Screen Time' },
    { path: '/calendar', icon: '📅', label: 'Calendar' },
    { path: '/profiles', icon: '👥', label: 'Profiles' },
    { path: '/settings', icon: '⚙️', label: 'Settings' },
    { path: '/test', icon: '🧪', label: 'Tests' },
  ];

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-primary)', position: 'relative', zIndex: 1 }}>
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg"
        style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)' }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside 
        className={`sidebar fixed md:static w-60 h-screen flex flex-col z-40 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div 
              className="flex items-center justify-center rounded-xl"
              style={{ 
                width: '48px', 
                height: '48px',
                background: 'linear-gradient(135deg, var(--accent-orange), var(--accent-purple))',
                boxShadow: '0 0 30px rgba(255,107,53,0.3)'
              }}
            >
              <span className="text-2xl">🏠</span>
            </div>
            <div>
              <h1 
                className="text-lg font-bold"
                style={{ 
                  background: 'linear-gradient(135deg, var(--accent-orange), var(--accent-purple))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                The Digital Hearth
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Family Dashboard</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`nav-item flex items-center gap-3 mb-1 ${
                location.pathname === item.path ? 'active' : ''
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Family avatars */}
        <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 justify-center">
            <div className="avatar avatar-snehal" title="Snehal">S</div>
            <div className="avatar avatar-ayush" title="Ayush">Ay</div>
            <div className="avatar avatar-ahana" title="Ahana">Ah</div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto md:ml-0" style={{ marginLeft: 0 }}>
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/setup" element={<Setup />} />
          <Route path="/test" element={<Test />} />
          <Route path="/" element={<Home />} />
          <Route path="/shopping" element={<Shopping />} />
          <Route path="/chores" element={<Chores />} />
          <Route path="/meals" element={<Meals />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/smarthome" element={<SmartHome />} />
          <Route path="/cameras" element={<Cameras />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/screentime" element={<ScreenTime />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/profiles" element={<Profiles />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
