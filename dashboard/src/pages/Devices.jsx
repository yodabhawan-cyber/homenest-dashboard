import { useState, useEffect } from 'react';

function Devices() {
  const [devicesData, setDevicesData] = useState(null);
  const [deviceStates, setDeviceStates] = useState({});

  useEffect(() => {
    fetch('/config/devices.json')
      .then(res => res.json())
      .then(data => {
        setDevicesData(data);
        // Initialize device states
        const states = {};
        data.rooms.forEach(room => {
          room.devices.forEach(device => {
            states[device.id] = device.state === 'on' || device.state === 'unlocked';
          });
        });
        setDeviceStates(states);
      })
      .catch(err => console.error('Error loading devices:', err));
  }, []);

  const handleToggle = (deviceId) => {
    setDeviceStates(prev => ({
      ...prev,
      [deviceId]: !prev[deviceId]
    }));
    // In a real app, this would call the Home Assistant API
  };

  if (!devicesData) {
    return <div className="text-gray-400">Loading...</div>;
  }

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'light': return '💡';
      case 'fan': return '💨';
      case 'media': return '📺';
      case 'lock': return '🔒';
      default: return '⚡';
    }
  };

  const getDeviceStateColor = (isOn) => {
    return isOn ? 'bg-green-600' : 'bg-gray-600';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Smart Devices</h2>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors">
            All Off
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-2">Active Devices</div>
          <div className="text-3xl font-bold text-green-400">
            {Object.values(deviceStates).filter(Boolean).length}
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-2">Total Devices</div>
          <div className="text-3xl font-bold text-blue-400">
            {Object.keys(deviceStates).length}
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-2">Rooms</div>
          <div className="text-3xl font-bold text-purple-400">
            {devicesData.rooms.length}
          </div>
        </div>
      </div>

      {/* Rooms & Devices */}
      <div className="space-y-6">
        {devicesData.rooms.map((room) => (
          <div key={room.name} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{room.icon}</span>
              <h3 className="text-xl font-semibold">{room.name}</h3>
              <span className="ml-auto text-sm text-gray-400">
                {room.devices.filter(d => deviceStates[d.id]).length} / {room.devices.length} on
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {room.devices.map((device) => {
                const isOn = deviceStates[device.id];
                
                return (
                  <div
                    key={device.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isOn
                        ? 'bg-green-900/20 border-green-600'
                        : 'bg-gray-700/30 border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getDeviceIcon(device.type)}</span>
                        <div>
                          <div className="font-semibold">{device.name}</div>
                          <div className="text-xs text-gray-400">{device.type}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${isOn ? 'text-green-400' : 'text-gray-400'}`}>
                        {isOn ? 'ON' : 'OFF'}
                      </span>
                      <button
                        onClick={() => handleToggle(device.id)}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                          getDeviceStateColor(isOn)
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                            isOn ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-blue-700/50">
        <h3 className="text-xl font-semibold mb-4">⚡ Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors">
            🌙 Bedtime Mode
          </button>
          <button className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors">
            ☀️ Good Morning
          </button>
          <button className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors">
            🏠 I'm Home
          </button>
          <button className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors">
            🚶 Leaving
          </button>
        </div>
      </div>
    </div>
  );
}

export default Devices;
