import { useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://127.0.0.1:3200';

const ROOM_CONFIG = [
  { name: 'Master Bedroom', icon: '🛏️', color: 'var(--accent-blue)', keywords: ['Master Bedroom'] },
  { name: 'Master Bathroom', icon: '🚿', color: 'var(--accent-blue)', keywords: ['Master Bathroom'] },
  { name: "Ayush's Bathroom", icon: '🚿', color: 'var(--accent-green)', keywords: ['Ayush'] },
  { name: "Ahana's Bathroom", icon: '🚿', color: '#ec4899', keywords: ['Ahana'] },
  { name: "Ahana's Closet", icon: '👗', color: '#ec4899', keywords: ["Ahana's Closet"] },
  { name: 'Kitchen', icon: '🍳', color: 'var(--accent-amber)', keywords: ['Kitchen', 'Breakfast', 'Pantry'] },
  { name: 'Dining', icon: '🍽️', color: 'var(--accent-amber)', keywords: ['Dinning'] },
  { name: 'Living Room', icon: '🛋️', color: 'var(--accent-purple)', keywords: ['Living Room'] },
  { name: 'Theatre', icon: '🎬', color: 'var(--accent-purple)', keywords: ['Theatre'] },
  { name: 'Garage', icon: '🚗', color: 'var(--text-muted)', keywords: ['Garage'] },
  { name: 'Laundry', icon: '🧺', color: 'var(--text-muted)', keywords: ['Laundry'] },
  { name: 'Entrance', icon: '🚪', color: 'var(--text-muted)', keywords: ['Entrance', 'Doorstep', 'Plinth'] },
  { name: 'Patio', icon: '🪴', color: 'var(--accent-green)', keywords: ['Patio'] },
  { name: 'Stairs & Passages', icon: '🪜', color: 'var(--text-muted)', keywords: ['Stairs', 'Passage', 'Passageway', 'Top Chand'] },
  { name: 'Backyard', icon: '🌳', color: 'var(--accent-green)', keywords: ['Backyard'] },
  { name: 'Left Gate', icon: '🚧', color: 'var(--text-muted)', keywords: ['Left Gate'] },
  { name: 'Right Gate', icon: '🚧', color: 'var(--text-muted)', keywords: ['Right Gate'] },
  { name: 'Driveway', icon: '🛣️', color: 'var(--text-muted)', keywords: ['Driveway'] },
  { name: 'Other', icon: '📦', color: 'var(--text-muted)', keywords: [] },
];

function SmartHome() {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEntities = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/states`);
      if (!response.ok) throw new Error('HA Unreachable');
      const data = await response.json();
      
      const filtered = data.filter(e => {
        if (e.entity_id.startsWith('light.') || e.entity_id.startsWith('media_player.')) {
          return true;
        }
        
        if (e.entity_id.startsWith('sensor.')) {
          const name = (e.attributes?.friendly_name || e.entity_id).toLowerCase();
          const deviceClass = e.attributes?.device_class?.toLowerCase();
          return deviceClass === 'temperature' || 
                 deviceClass === 'humidity' ||
                 name.includes('temperature') || 
                 name.includes('humidity');
        }
        
        return false;
      });
      
      setEntities(filtered);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchEntities, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchEntities]);

  const toggleLight = async (entityId) => {
    try {
      await fetch(`${API_BASE}/api/services/light/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_id: entityId }),
      });
      setTimeout(fetchEntities, 300);
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  };

  const categorizeEntities = () => {
    const rooms = {};
    
    ROOM_CONFIG.forEach((room) => {
      rooms[room.name] = { ...room, entities: [] };
    });

    entities.forEach((entity) => {
      const name = entity.attributes?.friendly_name || entity.entity_id;
      let assigned = false;

      for (const room of ROOM_CONFIG) {
        if (room.name === 'Other') continue;
        
        if (room.keywords.some(keyword => name.includes(keyword))) {
          rooms[room.name].entities.push(entity);
          assigned = true;
          break;
        }
      }

      if (!assigned) {
        rooms['Other'].entities.push(entity);
      }
    });

    return Object.values(rooms)
      .filter(room => room.entities.length > 0)
      .filter(room => {
        if (!searchQuery) return true;
        return room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          room.entities.some(e => 
            (e.attributes?.friendly_name || e.entity_id).toLowerCase().includes(searchQuery.toLowerCase())
          );
      });
  };

  const rooms = categorizeEntities();

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="glass-card h-48 animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            ⚡ Smart Home
            <span className="text-sm px-3 py-1 rounded-full" style={{ background: 'rgba(59,130,246,0.2)', color: 'var(--accent-blue)' }}>
              {entities.length} devices
            </span>
          </h1>
          {lastRefresh && (
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Auto-refresh</span>
          </label>
          
          <input
            type="text"
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 rounded-lg text-sm outline-none"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-primary)'
            }}
          />
        </div>
      </div>

      {error && (
        <div className="glass-card p-4" style={{ borderColor: 'var(--accent-red)' }}>
          <div style={{ color: 'var(--accent-red)' }}>⚠️ {error}</div>
        </div>
      )}

      {/* Room Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => {
          const lights = room.entities.filter(e => e.entity_id.startsWith('light.'));
          const sensors = room.entities.filter(e => e.entity_id.startsWith('sensor.'));
          const tempSensor = sensors.find(e => {
            const deviceClass = e.attributes?.device_class?.toLowerCase();
            const name = (e.attributes?.friendly_name || e.entity_id).toLowerCase();
            return deviceClass === 'temperature' || name.includes('temperature');
          });
          const activeCount = lights.filter(l => l.state === 'on').length;
          const hasActiveEntities = activeCount > 0;

          return (
            <div
              key={room.name}
              className={`glass-card p-5 ${hasActiveEntities ? 'room-active' : ''}`}
            >
              {/* Room Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{ background: `${room.color}20`, border: `2px solid ${room.color}40` }}
                  >
                    {room.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {room.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>{lights.length} device{lights.length !== 1 ? 's' : ''}</span>
                      {activeCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.2)', color: 'var(--accent-green)' }}>
                          {activeCount} on
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {tempSensor && tempSensor.state !== 'unavailable' && (
                  <div className="text-right">
                    <div className="text-lg font-bold" style={{ color: 'var(--accent-amber)' }}>
                      {parseFloat(tempSensor.state).toFixed(1)}°
                    </div>
                  </div>
                )}
              </div>

              {/* Lights */}
              <div className="space-y-2">
                {lights.map((light) => {
                  const isOn = light.state === 'on';
                  const name = (light.attributes?.friendly_name || light.entity_id).replace(room.name, '').trim();
                  
                  return (
                    <div
                      key={light.entity_id}
                      className="flex items-center justify-between p-2 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.02)' }}
                    >
                      <span className="text-sm flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                        💡 <span>{name}</span>
                      </span>
                      <button
                        onClick={() => toggleLight(light.entity_id)}
                        className={`toggle-switch ${isOn ? 'on' : 'off'}`}
                      >
                        <span className="toggle-knob"></span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {rooms.length === 0 && (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          No rooms match your search.
        </div>
      )}
    </div>
  );
}

export default SmartHome;
