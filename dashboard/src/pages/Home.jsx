import { useState, useEffect } from 'react';

export default function Home() {
  const [climate, setClimate] = useState({
    temperature: { value: '--', unit: '°C' },
    humidity: { value: '--', unit: '%' },
    air_quality: { value: '--', unit: 'µg/m³' },
    power: { value: '--', unit: 'kW' }
  });
  
  const [presence, setPresence] = useState({
    Snehal: { home: false },
    Anushka: { home: false },
    Ayush: { home: false },
    Ahana: { home: false }
  });
  
  const [security, setSecurity] = useState({
    armed: false,
    mode: 'disarmed',
    doors: { locked: 0, unlocked: 0 },
    windows: { open: 0, closed: 0 },
    cameras: { online: 0, offline: 0 }
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const [climateRes, presenceRes, securityRes] = await Promise.all([
        fetch('http://localhost:3200/api/states').then(r => r.json()),
        fetch('http://localhost:3200/api/states').then(r => r.json()),
        fetch('http://localhost:3200/api/states').then(r => r.json())
      ]);
      
      // Parse climate data
      const climateData = {};
      climateRes.forEach(entity => {
        const id = entity.entity_id;
        if (id.includes('temperature') || id.includes('climate')) {
          if (entity.attributes?.current_temperature) {
            climateData.temperature = {
              value: Math.round(entity.attributes.current_temperature),
              unit: '°C'
            };
          }
        }
        if (id.includes('humidity')) {
          climateData.humidity = { value: entity.state, unit: '%' };
        }
        if (id.includes('pm25') || id.includes('air_quality')) {
          climateData.air_quality = { value: entity.state, unit: 'µg/m³' };
        }
        if (id.includes('power') && entity.attributes?.unit_of_measurement === 'W') {
          climateData.power = { 
            value: (parseFloat(entity.state) / 1000).toFixed(1), 
            unit: 'kW' 
          };
        }
      });
      
      if (Object.keys(climateData).length > 0) {
        setClimate(prev => ({ ...prev, ...climateData }));
      }
      
      // Parse presence
      const presenceData = {};
      presenceRes.forEach(entity => {
        const id = entity.entity_id;
        if (id.startsWith('person.') || id.startsWith('device_tracker.')) {
          ['Snehal', 'Anushka', 'Ayush', 'Ahana'].forEach(name => {
            if (id.toLowerCase().includes(name.toLowerCase())) {
              presenceData[name] = { home: entity.state === 'home' };
            }
          });
        }
      });
      
      if (Object.keys(presenceData).length > 0) {
        setPresence(prev => ({ ...prev, ...presenceData }));
      }
      
      // Parse security
      const secData = { doors: { locked: 0, unlocked: 0 }, windows: { open: 0, closed: 0 }, cameras: { online: 0, offline: 0 } };
      securityRes.forEach(entity => {
        const id = entity.entity_id;
        if (id.startsWith('alarm_control_panel.')) {
          secData.armed = entity.state !== 'disarmed';
          secData.mode = entity.state;
        }
        if (id.startsWith('lock.') || id.includes('door')) {
          if (entity.state === 'locked') secData.doors.locked++;
          else secData.doors.unlocked++;
        }
        if (id.includes('window')) {
          if (entity.state === 'on' || entity.state === 'open') secData.windows.open++;
          else secData.windows.closed++;
        }
        if (id.startsWith('camera.')) {
          if (['idle', 'recording', 'streaming'].includes(entity.state)) secData.cameras.online++;
          else secData.cameras.offline++;
        }
      });
      
      setSecurity(prev => ({ ...prev, ...secData }));
      
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  }

  const familyEmojis = {
    Snehal: '👨',
    Anushka: '👩',
    Ayush: '👦',
    Ahana: '👧'
  };

  return (
    <div className="space-y-6">
      {/* Climate Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Temperature" 
          value={climate.temperature.value} 
          unit={climate.temperature.unit}
          trend="Comfortable"
        />
        <StatCard 
          label="Humidity" 
          value={climate.humidity.value} 
          unit={climate.humidity.unit}
          trend="Normal"
        />
        <StatCard 
          label="Air Quality" 
          value={climate.air_quality.value} 
          unit={climate.air_quality.unit}
          trend="Good"
        />
        <StatCard 
          label="Power" 
          value={climate.power.value} 
          unit={climate.power.unit}
          trend="↓ 12%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Family Presence */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xl">👨‍👩‍👧‍👦</span>
            <h2 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Family Presence
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(presence).map(([name, info]) => (
              <div key={name} className="text-center">
                <div className="relative inline-block mb-3">
                  <div 
                    className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                    style={{ 
                      background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' 
                    }}
                  >
                    {familyEmojis[name]}
                  </div>
                  <div 
                    className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2"
                    style={{
                      background: info.home ? 'var(--accent-green)' : 'var(--text-muted)',
                      borderColor: 'var(--bg-card)'
                    }}
                  />
                </div>
                <div className="text-sm font-medium mb-1">{name}</div>
                <div className="text-xs text-slate-400">
                  {info.home ? 'Home' : 'Away'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xl">🔒</span>
            <h2 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Security
            </h2>
          </div>
          <div 
            className="flex items-center gap-4 p-4 rounded-xl"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
          >
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              style={{ 
                background: security.armed 
                  ? 'rgba(239,68,68,0.1)' 
                  : 'rgba(0,212,168,0.1)',
                color: security.armed ? 'var(--accent-red)' : 'var(--accent-green)'
              }}
            >
              {security.armed ? '🔒' : '🔓'}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">
                System {security.armed ? 'Armed' : 'Disarmed'}
              </h3>
              <p className="text-xs text-slate-400">
                {security.doors.locked} doors locked • {security.windows.open} windows open • {security.cameras.online} cameras online
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Controls */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xl">⚡</span>
          <h2 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
            Quick Controls
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickControl icon="💡" label="Lights" />
          <QuickControl icon="❄️" label="A/C" />
          <QuickControl icon="🚪" label="Doors" />
          <QuickControl icon="🎵" label="Music" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, trend }) {
  return (
    <div className="glass-card p-5">
      <div className="text-xs uppercase tracking-wider text-slate-400 mb-3">
        {label}
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-bold">{value}</span>
        <span className="text-lg text-slate-400">{unit}</span>
      </div>
      <div className="text-xs" style={{ color: 'var(--accent-green)' }}>
        {trend}
      </div>
    </div>
  );
}

function QuickControl({ icon, label }) {
  return (
    <button 
      className="p-6 rounded-xl text-center transition-all hover:scale-105"
      style={{ 
        background: 'var(--bg-secondary)', 
        border: '1px solid var(--border-subtle)' 
      }}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-sm text-slate-400">{label}</div>
    </button>
  );
}
