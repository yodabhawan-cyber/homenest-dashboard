import { useState, useEffect } from 'react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('api');
  const [config, setConfig] = useState({
    openai_key: '',
    ha_url: '',
    ha_token: '',
    elevenlabs_key: '',
    openclaw_token: ''
  });
  const [profiles, setProfiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      // Load API keys (masked)
      const configRes = await fetch('/api/settings/config');
      if (configRes.ok) {
        const data = await configRes.json();
        setConfig(data);
      }
      
      // Load profiles
      const profilesRes = await fetch('/api/settings/profiles');
      if (profilesRes.ok) {
        const data = await profilesRes.json();
        setProfiles(Object.entries(data).map(([id, prof]) => ({ id, ...prof })));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }

  async function saveAPIKeys() {
    setSaving(true);
    setMessage(null);
    
    try {
      const res = await fetch('/api/settings/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      const data = await res.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'API keys saved successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function saveProfiles() {
    setSaving(true);
    setMessage(null);
    
    try {
      const profilesObj = {};
      profiles.forEach(p => {
        const { id, ...prof } = p;
        profilesObj[id] = prof;
      });
      
      const res = await fetch('/api/settings/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profilesObj)
      });
      
      const data = await res.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Profiles saved! Voice proxy will reload.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  function addProfile() {
    const newProfile = {
      id: `user_${Date.now()}`,
      name: 'New Person',
      age: 8,
      role: 'child',
      personality: 'playful',
      voice: 'piper',
      pin: Math.floor(100 + Math.random() * 900).toString(),
      agent_workspace: `agents/user_${Date.now()}/workspace`
    };
    
    setProfiles([...profiles, newProfile]);
  }

  function updateProfile(id, field, value) {
    setProfiles(profiles.map(p => p.id === id ? { ...p, [field]: value } : p));
  }

  function deleteProfile(id) {
    if (confirm(`Delete ${profiles.find(p => p.id === id)?.name}? This cannot be undone.`)) {
      setProfiles(profiles.filter(p => p.id !== id));
    }
  }

  return (
    <div>
      {/* Message Banner */}
      {message && (
        <div 
          className="mb-6 p-4 rounded-xl"
          style={{ 
            background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${message.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)'}`,
            color: message.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)'
          }}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'api', label: 'API Keys', icon: '🔑' },
          { id: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
          { id: 'voice', label: 'Voice', icon: '🎤' },
          { id: 'backup', label: 'Backup', icon: '💾' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-3 rounded-xl transition-all"
            style={{ 
              background: activeTab === tab.id ? 'var(--accent-orange)' : 'var(--bg-secondary)',
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${activeTab === tab.id ? 'var(--accent-orange)' : 'var(--border-subtle)'}`
            }}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* API Keys Tab */}
      {activeTab === 'api' && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold mb-6">API Keys & Connections</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">OpenAI API Key</label>
              <input
                type="password"
                value={config.openai_key}
                onChange={(e) => setConfig({ ...config, openai_key: e.target.value })}
                placeholder="sk-..."
                className="w-full px-4 py-3 rounded-xl"
                style={{ 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Home Assistant URL</label>
              <input
                type="text"
                value={config.ha_url}
                onChange={(e) => setConfig({ ...config, ha_url: e.target.value })}
                placeholder="http://homeassistant.local:8123"
                className="w-full px-4 py-3 rounded-xl"
                style={{ 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Home Assistant Token</label>
              <input
                type="password"
                value={config.ha_token}
                onChange={(e) => setConfig({ ...config, ha_token: e.target.value })}
                placeholder="Long-lived access token"
                className="w-full px-4 py-3 rounded-xl"
                style={{ 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">ElevenLabs API Key (Optional)</label>
              <input
                type="password"
                value={config.elevenlabs_key}
                onChange={(e) => setConfig({ ...config, elevenlabs_key: e.target.value })}
                placeholder="For premium voices"
                className="w-full px-4 py-3 rounded-xl"
                style={{ 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <button
              onClick={saveAPIKeys}
              disabled={saving}
              className="px-6 py-3 rounded-xl text-white font-semibold transition-all hover:scale-105"
              style={{ 
                background: saving ? 'var(--text-muted)' : 'var(--accent-orange)',
                opacity: saving ? 0.5 : 1
              }}
            >
              {saving ? 'Saving...' : 'Save API Keys'}
            </button>
          </div>
        </div>
      )}

      {/* Family Tab */}
      {activeTab === 'family' && (
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Family Members</h2>
            <button
              onClick={addProfile}
              className="px-4 py-2 rounded-xl text-white font-semibold transition-all hover:scale-105"
              style={{ background: 'var(--accent-orange)' }}
            >
              + Add Person
            </button>
          </div>

          <div className="space-y-4 mb-6">
            {profiles.map(profile => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                onUpdate={(field, value) => updateProfile(profile.id, field, value)}
                onDelete={() => deleteProfile(profile.id)}
              />
            ))}
          </div>

          <button
            onClick={saveProfiles}
            disabled={saving}
            className="px-6 py-3 rounded-xl text-white font-semibold transition-all hover:scale-105"
            style={{ 
              background: saving ? 'var(--text-muted)' : 'var(--accent-orange)',
              opacity: saving ? 0.5 : 1
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* Voice Tab */}
      {activeTab === 'voice' && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold mb-6">Voice Settings</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Voice settings are configured per family member in the Family tab.
          </p>
        </div>
      )}

      {/* Backup Tab */}
      {activeTab === 'backup' && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold mb-6">Backup & Restore</h2>
          
          <div className="space-y-4">
            <button
              className="w-full px-6 py-4 rounded-xl transition-all hover:scale-105 text-left"
              style={{ 
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div className="font-semibold mb-1">📦 Export Configuration</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Download all settings, profiles, and configurations
              </div>
            </button>

            <button
              className="w-full px-6 py-4 rounded-xl transition-all hover:scale-105 text-left"
              style={{ 
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div className="font-semibold mb-1">📥 Import Configuration</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Restore from a backup file
              </div>
            </button>

            <button
              className="w-full px-6 py-4 rounded-xl transition-all hover:scale-105 text-left"
              style={{ 
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid var(--accent-red)',
                color: 'var(--accent-red)'
              }}
            >
              <div className="font-semibold mb-1">🔄 Reset to Defaults</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Clear all settings and start fresh
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileCard({ profile, onUpdate, onDelete }) {
  return (
    <div 
      className="p-4 rounded-xl"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
            Name
          </label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => onUpdate('name', e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ 
              background: 'var(--bg-primary)', 
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
            PIN
          </label>
          <input
            type="text"
            value={profile.pin}
            onChange={(e) => onUpdate('pin', e.target.value)}
            maxLength={4}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ 
              background: 'var(--bg-primary)', 
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
            Voice
          </label>
          <select
            value={profile.voice}
            onChange={(e) => onUpdate('voice', e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ 
              background: 'var(--bg-primary)', 
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="piper">Piper (Default)</option>
            <option value="charlotte">Charlotte (Playful)</option>
            <option value="matilda">Matilda (Warm)</option>
          </select>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          onClick={onDelete}
          className="px-3 py-1 rounded-lg text-sm transition-all hover:scale-105"
          style={{ 
            background: 'rgba(239,68,68,0.1)',
            color: 'var(--accent-red)'
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
