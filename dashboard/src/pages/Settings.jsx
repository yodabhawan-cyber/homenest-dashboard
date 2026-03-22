import { useState } from 'react';

function Settings() {
  const [settings, setSettings] = useState({
    voice: {
      model: 'openai-tts',
      speed: 'normal',
      volume: 80,
      language: 'en-AU',
    },
    safety: {
      level: 'family-safe',
      blockExplicit: true,
      requirePinForSensitive: true,
      logAllRequests: true,
    },
    notifications: {
      choreReminders: true,
      bedtimeAlerts: true,
      deviceAlerts: true,
      emailDigest: 'daily',
    },
    system: {
      timezone: 'Australia/Sydney',
      theme: 'dark',
      language: 'en-AU',
    }
  });

  const handleToggle = (category, key) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key]
      }
    }));
  };

  const handleSelect = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Settings</h2>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">
          Save Changes
        </button>
      </div>

      <div className="space-y-6">
        {/* Voice Settings */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            🎙️ Voice Assistant
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                TTS Model
              </label>
              <select
                value={settings.voice.model}
                onChange={(e) => handleSelect('voice', 'model', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              >
                <option value="openai-tts">OpenAI TTS</option>
                <option value="elevenlabs">ElevenLabs</option>
                <option value="google-tts">Google TTS</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Speech Speed
              </label>
              <select
                value={settings.voice.speed}
                onChange={(e) => handleSelect('voice', 'speed', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              >
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Volume: {settings.voice.volume}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.voice.volume}
                onChange={(e) => handleSelect('voice', 'volume', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Language
              </label>
              <select
                value={settings.voice.language}
                onChange={(e) => handleSelect('voice', 'language', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              >
                <option value="en-AU">English (Australia)</option>
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Safety Settings */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            🛡️ Safety & Privacy
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Safety Level
              </label>
              <select
                value={settings.safety.level}
                onChange={(e) => handleSelect('safety', 'level', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              >
                <option value="strict">Strict (Kids Only)</option>
                <option value="family-safe">Family Safe</option>
                <option value="moderate">Moderate</option>
              </select>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-700/50 rounded-lg">
              <div>
                <div className="font-medium">Block Explicit Content</div>
                <div className="text-sm text-gray-400">Filter inappropriate responses</div>
              </div>
              <button
                onClick={() => handleToggle('safety', 'blockExplicit')}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  settings.safety.blockExplicit ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    settings.safety.blockExplicit ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-700/50 rounded-lg">
              <div>
                <div className="font-medium">Require PIN for Sensitive Actions</div>
                <div className="text-sm text-gray-400">Lock changes, garage, cameras</div>
              </div>
              <button
                onClick={() => handleToggle('safety', 'requirePinForSensitive')}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  settings.safety.requirePinForSensitive ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    settings.safety.requirePinForSensitive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-700/50 rounded-lg">
              <div>
                <div className="font-medium">Log All Requests</div>
                <div className="text-sm text-gray-400">Track what's being asked</div>
              </div>
              <button
                onClick={() => handleToggle('safety', 'logAllRequests')}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  settings.safety.logAllRequests ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    settings.safety.logAllRequests ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            🔔 Notifications
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-700/50 rounded-lg">
              <div>
                <div className="font-medium">Chore Reminders</div>
                <div className="text-sm text-gray-400">Notify kids about pending chores</div>
              </div>
              <button
                onClick={() => handleToggle('notifications', 'choreReminders')}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  settings.notifications.choreReminders ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    settings.notifications.choreReminders ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-700/50 rounded-lg">
              <div>
                <div className="font-medium">Bedtime Alerts</div>
                <div className="text-sm text-gray-400">15-min warning before bedtime</div>
              </div>
              <button
                onClick={() => handleToggle('notifications', 'bedtimeAlerts')}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  settings.notifications.bedtimeAlerts ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    settings.notifications.bedtimeAlerts ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-700/50 rounded-lg">
              <div>
                <div className="font-medium">Device Alerts</div>
                <div className="text-sm text-gray-400">Garage left open, doors unlocked</div>
              </div>
              <button
                onClick={() => handleToggle('notifications', 'deviceAlerts')}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  settings.notifications.deviceAlerts ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    settings.notifications.deviceAlerts ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Email Digest
              </label>
              <select
                value={settings.notifications.emailDigest}
                onChange={(e) => handleSelect('notifications', 'emailDigest', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              >
                <option value="never">Never</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>
        </div>

        {/* System */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            ⚙️ System
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Timezone
              </label>
              <select
                value={settings.system.timezone}
                onChange={(e) => handleSelect('system', 'timezone', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              >
                <option value="Australia/Sydney">Australia/Sydney (AEDT)</option>
                <option value="Australia/Melbourne">Australia/Melbourne</option>
                <option value="Australia/Brisbane">Australia/Brisbane</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Theme
              </label>
              <select
                value={settings.system.theme}
                onChange={(e) => handleSelect('system', 'theme', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="auto">Auto</option>
              </select>
            </div>
          </div>
        </div>

        {/* Voice Profiles */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            👤 Voice Profiles
          </h3>
          
          <div className="space-y-3">
            {['Snehal', 'Ayush', 'Ahana'].map((name) => (
              <div key={name} className="flex justify-between items-center p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <div className="font-medium">{name}</div>
                  <div className="text-sm text-gray-400">PIN: {name === 'Snehal' ? '****' : 'Not set'}</div>
                </div>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm">
                  Configure
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Guest Mode Settings */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            👥 Guest Mode
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Allowed Devices
              </label>
              <div className="space-y-2">
                {['Lights', 'Music', 'TV'].map((device) => (
                  <label key={device} className="flex items-center gap-2 p-2 bg-gray-700/50 rounded">
                    <input type="checkbox" className="w-4 h-4" defaultChecked />
                    <span>{device}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Time Limit (hours)
              </label>
              <input
                type="number"
                defaultValue="4"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            🚨 Emergency Contacts
          </h3>
          
          <div className="space-y-3">
            {[
              { name: 'Snehal (Mobile)', phone: '+61 4XX XXX XXX' },
              { name: 'Emergency Services', phone: '000' },
              { name: 'Neighbor - Sarah', phone: '+61 4XX XXX XXX' }
            ].map((contact, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-gray-700/50 rounded-lg">
                <div>
                  <div className="font-medium">{contact.name}</div>
                  <div className="text-sm text-gray-400">{contact.phone}</div>
                </div>
                <button className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm">
                  Edit
                </button>
              </div>
            ))}
            <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
              + Add Contact
            </button>
          </div>
        </div>

        {/* Email Parser Settings */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📧 Email Parser
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                School Email Patterns
              </label>
              <div className="space-y-2">
                {[
                  '@school.nsw.edu.au',
                  'newsletter@',
                  'principal@'
                ].map((pattern, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-gray-700/50 rounded">
                    <input
                      type="text"
                      value={pattern}
                      className="flex-1 bg-gray-600 px-3 py-1 rounded text-sm"
                      readOnly
                    />
                    <button className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button className="mt-2 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
                + Add Pattern
              </button>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-gray-700/50 rounded-lg">
              <div>
                <div className="font-medium">Auto-Add to Calendar</div>
                <div className="text-sm text-gray-400">Parse dates from school emails</div>
              </div>
              <button
                className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors bg-green-600"
              >
                <span className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform translate-x-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-900/20 rounded-xl p-6 border border-red-700/50">
          <h3 className="text-xl font-semibold mb-4 text-red-400 flex items-center gap-2">
            ⚠️ Danger Zone
          </h3>
          
          <div className="space-y-3">
            <button className="w-full px-4 py-3 bg-red-900/50 hover:bg-red-900/70 border border-red-700 rounded-lg font-medium transition-colors text-left">
              Reset All Chore Progress
            </button>
            <button className="w-full px-4 py-3 bg-red-900/50 hover:bg-red-900/70 border border-red-700 rounded-lg font-medium transition-colors text-left">
              Clear All Activity Logs
            </button>
            <button className="w-full px-4 py-3 bg-red-900/50 hover:bg-red-900/70 border border-red-700 rounded-lg font-medium transition-colors text-left">
              Factory Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
