import { useState, useEffect } from 'react';

export default function ScreenTime() {
  const [screenData, setScreenData] = useState({});

  useEffect(() => {
    loadScreenTime();
  }, []);

  const loadScreenTime = async () => {
    try {
      const res = await fetch('/config/screentime.json');
      const data = await res.json();
      setScreenData(data);
    } catch (err) {
      console.error('Error loading screen time:', err);
      setScreenData({
        ayush: {
          dailyLimit: 120,
          usedToday: 75,
          weekData: [45, 80, 120, 90, 60, 100, 75],
          devices: [
            { name: 'iPad', time: 45 },
            { name: 'iPhone', time: 30 }
          ]
        },
        ahana: {
          dailyLimit: 90,
          usedToday: 50,
          weekData: [30, 60, 85, 70, 45, 80, 50],
          devices: [
            { name: 'iPad', time: 35 },
            { name: 'iPhone', time: 15 }
          ]
        }
      });
    }
  };

  const pauseAllScreens = () => {
    alert('All screens paused! 📵');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          📱 Screen Time
        </h1>
        <button
          onClick={pauseAllScreens}
          className="px-6 py-3 rounded-lg font-semibold"
          style={{ background: 'var(--accent-red)', color: 'white' }}
        >
          ⏸️ Pause All Screens
        </button>
      </div>

      {Object.keys(screenData).map(kid => {
        const data = screenData[kid];
        const remaining = data.dailyLimit - data.usedToday;
        const progress = (data.usedToday / data.dailyLimit) * 100;
        const maxWeek = Math.max(...(data.weekData || [120]));

        return (
          <div key={kid} className="glass-card p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className={`avatar avatar-${kid}`}>
                {kid === 'ayush' ? 'Ay' : 'Ah'}
              </div>
              <div>
                <h2 className="text-xl font-bold capitalize" style={{ color: 'var(--text-primary)' }}>
                  {kid}
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {remaining > 0 ? `${remaining} min remaining today` : 'Limit reached'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Circular Progress */}
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke={progress > 90 ? 'var(--accent-red)' : progress > 70 ? 'var(--accent-amber)' : 'var(--accent-green)'}
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 88}`}
                      strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {data.usedToday}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      of {data.dailyLimit} min
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Chart */}
              <div>
                <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
                  This Week
                </h3>
                <div className="flex items-end justify-between gap-2 h-32">
                  {(data.weekData || []).map((mins, i) => {
                    const height = (mins / maxWeek) * 100;
                    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {mins}m
                        </div>
                        <div className="w-full rounded-t" style={{
                          height: `${height}%`,
                          background: 'var(--accent-blue)'
                        }} />
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {days[i]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Devices */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
                Device Breakdown
              </h3>
              <div className="space-y-2">
                {(data.devices || []).map((device, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📱</span>
                      <span style={{ color: 'var(--text-primary)' }}>{device.name}</span>
                    </div>
                    <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      {device.time} min
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
