import { useState, useEffect } from 'react';

const API_BASE = 'http://127.0.0.1:3200';

const CAMERAS = [
  { id: 'camera.patio_fluent', name: 'Patio' },
  { id: 'camera.garage_fluent', name: 'Garage' },
  { id: 'camera.laundry_room_fluent', name: 'Laundry Room' },
  { id: 'camera.left_gate_fluent', name: 'Left Gate' },
  { id: 'camera.backyard_right_fluent', name: 'Backyard Right' },
  { id: 'camera.backyard_left_fluent', name: 'Backyard Left' },
  { id: 'camera.right_gate_fluent', name: 'Right Gate' },
  { id: 'camera.right_gate_front_fluent', name: 'Right Gate Front' },
  { id: 'camera.doorstep_fluent', name: 'Doorstep' },
  { id: 'camera.reolink_video_doorbell_poe_fluent', name: 'Video Doorbell' },
  { id: 'camera.driveway_fluent', name: 'Driveway' },
];

function Cameras() {
  const [sensors, setSensors] = useState({});
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [refreshKeys, setRefreshKeys] = useState({});

  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/states`);
        if (!response.ok) return;
        const data = await response.json();
        
        const sensorMap = {};
        data.forEach(entity => {
          if (entity.entity_id.startsWith('binary_sensor.')) {
            sensorMap[entity.entity_id] = entity.state;
          }
        });
        setSensors(sensorMap);
      } catch (err) {
        console.error('Failed to fetch sensors:', err);
      }
    };

    fetchSensors();
    const interval = setInterval(fetchSensors, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKeys(prev => {
        const newKeys = {};
        CAMERAS.forEach(cam => {
          newKeys[cam.id] = Date.now();
        });
        return newKeys;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getCameraSnapshot = (cameraId) => {
    const key = refreshKeys[cameraId] || Date.now();
    return `${API_BASE}/api/camera_proxy/${cameraId}?t=${key}`;
  };

  const getSensorStatus = (cameraName) => {
    const baseName = cameraName.toLowerCase().replace(/ /g, '_');
    const motion = sensors[`binary_sensor.${baseName}_motion`];
    const person = sensors[`binary_sensor.${baseName}_person`];
    const vehicle = sensors[`binary_sensor.${baseName}_vehicle`];
    const pet = sensors[`binary_sensor.${baseName}_pet`];

    return { motion, person, vehicle, pet };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
          📹 Security Cameras
          <span className="text-sm px-3 py-1 rounded-full" style={{ background: 'rgba(59,130,246,0.2)', color: 'var(--accent-blue)' }}>
            {CAMERAS.length} cameras
          </span>
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Live feeds • Auto-refresh every 5s
        </p>
      </div>

      {/* Camera Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CAMERAS.map((camera) => {
          const status = getSensorStatus(camera.name);
          const hasMotion = status.motion === 'on';
          const hasPerson = status.person === 'on';

          return (
            <div
              key={camera.id}
              className={`camera-card cursor-pointer ${hasMotion ? 'motion-active' : ''}`}
              onClick={() => setSelectedCamera(camera)}
            >
              <div className="relative aspect-video" style={{ background: 'var(--bg-secondary)' }}>
                <img
                  src={getCameraSnapshot(camera.id)}
                  alt={camera.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden w-full h-full items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                  📹 Camera Unavailable
                </div>
                
                {/* Detection Badges */}
                <div className="absolute top-2 right-2 flex gap-2">
                  {hasMotion && (
                    <span className="text-xs px-2 py-1 rounded-full flex items-center gap-1" style={{ background: 'var(--accent-red)', color: 'white' }}>
                      <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: 'white' }}></span>
                      Motion
                    </span>
                  )}
                  {hasPerson && (
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--accent-amber)', color: 'white' }}>
                      👤 Person
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{camera.name}</h3>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {camera.id.replace('camera.', '').replace('_fluent', '')}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full-Screen Overlay */}
      {selectedCamera && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)' }}
          onClick={() => setSelectedCamera(null)}
        >
          <div
            className="glass-card max-w-5xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{selectedCamera.name}</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{selectedCamera.id}</p>
              </div>
              <button
                onClick={() => setSelectedCamera(null)}
                className="text-3xl leading-none px-3"
                style={{ color: 'var(--text-muted)' }}
              >
                ×
              </button>
            </div>

            {/* Large Snapshot */}
            <div className="relative" style={{ background: 'var(--bg-secondary)' }}>
              <img
                src={getCameraSnapshot(selectedCamera.id)}
                alt={selectedCamera.name}
                className="w-full h-auto"
                key={refreshKeys[selectedCamera.id]}
              />
            </div>

            {/* Detection Status */}
            <div className="p-4 flex flex-wrap gap-2">
              {(() => {
                const status = getSensorStatus(selectedCamera.name);
                return (
                  <>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      status.motion === 'on' ? 'pulse-dot' : ''
                    }`} style={{
                      background: status.motion === 'on' ? 'var(--accent-red)' : 'rgba(255,255,255,0.05)',
                      color: status.motion === 'on' ? 'white' : 'var(--text-muted)'
                    }}>
                      {status.motion === 'on' ? '🔴 Motion Detected' : '⚪ No Motion'}
                    </span>
                    
                    {status.person !== undefined && (
                      <span className="px-3 py-1 rounded-full text-sm" style={{
                        background: status.person === 'on' ? 'var(--accent-amber)' : 'rgba(255,255,255,0.05)',
                        color: status.person === 'on' ? 'white' : 'var(--text-muted)'
                      }}>
                        👤 Person {status.person === 'on' ? '✓' : '—'}
                      </span>
                    )}
                    
                    {status.vehicle !== undefined && (
                      <span className="px-3 py-1 rounded-full text-sm" style={{
                        background: status.vehicle === 'on' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)',
                        color: status.vehicle === 'on' ? 'white' : 'var(--text-muted)'
                      }}>
                        🚗 Vehicle {status.vehicle === 'on' ? '✓' : '—'}
                      </span>
                    )}
                    
                    {status.pet !== undefined && (
                      <span className="px-3 py-1 rounded-full text-sm" style={{
                        background: status.pet === 'on' ? 'var(--accent-green)' : 'rgba(255,255,255,0.05)',
                        color: status.pet === 'on' ? 'white' : 'var(--text-muted)'
                      }}>
                        🐾 Pet {status.pet === 'on' ? '✓' : '—'}
                      </span>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cameras;
