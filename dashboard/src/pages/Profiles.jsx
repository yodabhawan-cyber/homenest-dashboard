import { useState, useEffect } from 'react';

function Profiles() {
  const [profiles, setProfiles] = useState(null);

  useEffect(() => {
    fetch('/config/profiles.json')
      .then(res => res.json())
      .then(data => setProfiles(data))
      .catch(err => console.error('Error loading profiles:', err));
  }, []);

  if (!profiles) {
    return <div className="text-gray-400">Loading...</div>;
  }

  const profileList = [
    { id: 'snehal', emoji: '👨', data: profiles.snehal },
    { id: 'ayush', emoji: '👦', data: profiles.ayush },
    { id: 'ahana', emoji: '👧', data: profiles.ahana },
  ];

  const getRoleBadgeColor = (role) => {
    if (role === 'parent') return 'bg-blue-900/30 text-blue-400 border-blue-700/50';
    return 'bg-purple-900/30 text-purple-400 border-purple-700/50';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Family Profiles</h2>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">
          + Add Member
        </button>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {profileList.map((profile) => (
          <div key={profile.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-6">
              <div className="flex items-center gap-4">
                <div className="text-6xl">{profile.emoji}</div>
                <div>
                  <h3 className="text-2xl font-bold">{profile.data.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(profile.data.role)}`}>
                      {profile.data.role.charAt(0).toUpperCase() + profile.data.role.slice(1)}
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-700 text-gray-300">
                      {profile.data.age_group}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-6 space-y-4">
              {/* Device Access */}
              <div>
                <div className="text-sm font-medium text-gray-400 mb-2">Device Access</div>
                {profile.data.role === 'parent' ? (
                  <div className="text-green-400 font-medium">✓ All Devices</div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {profile.data.allowed_devices?.map((device, idx) => (
                        <span key={idx} className="px-3 py-1 bg-green-900/30 text-green-400 rounded-lg text-sm">
                          ✓ {device}
                        </span>
                      ))}
                    </div>
                    {profile.data.blocked_devices && profile.data.blocked_devices.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {profile.data.blocked_devices.map((device, idx) => (
                          <span key={idx} className="px-3 py-1 bg-red-900/30 text-red-400 rounded-lg text-sm">
                            ✗ {device}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Child-specific settings */}
              {profile.data.role === 'child' && (
                <>
                  {/* Bedtime */}
                  {profile.data.bedtime && (
                    <div className="flex justify-between items-center p-4 bg-gray-700/50 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-gray-400">Bedtime</div>
                        <div className="text-lg font-semibold">🌙 {profile.data.bedtime}</div>
                      </div>
                      <button className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm transition-colors">
                        Edit
                      </button>
                    </div>
                  )}

                  {/* Screen Time */}
                  {profile.data.screen_time_limit_min && (
                    <div className="flex justify-between items-center p-4 bg-gray-700/50 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-gray-400">Screen Time Limit</div>
                        <div className="text-lg font-semibold">📱 {profile.data.screen_time_limit_min} minutes/day</div>
                      </div>
                      <button className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm transition-colors">
                        Edit
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Voice PIN */}
              <div className="flex justify-between items-center p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-400">Voice PIN</div>
                  <div className="text-lg font-semibold">
                    {profile.data.voice_pin ? '🔒 Enabled' : '🔓 Not Set'}
                  </div>
                </div>
                <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors">
                  {profile.data.voice_pin ? 'Change' : 'Set PIN'}
                </button>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-700 flex gap-2">
                <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">
                  Edit Profile
                </button>
                {profile.data.role === 'child' && (
                  <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors">
                    View Activity
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Arlo (Pet Profile) */}
      <div className="mt-6 bg-gray-800 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center gap-4">
          <div className="text-5xl">🐕</div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold">Arlo</h3>
            <p className="text-gray-400">Family Dog • Good Boy</p>
          </div>
          <div className="text-center bg-gray-700/50 px-6 py-3 rounded-lg">
            <div className="text-sm text-gray-400">Fed Today</div>
            <div className="text-2xl font-bold text-green-400">✓</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profiles;
