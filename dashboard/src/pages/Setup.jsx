import { useState, useEffect } from 'react';

export default function Setup() {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    // API Keys
    openai_key: '',
    ha_url: 'http://homeassistant.local:8123',
    ha_token: '',
    elevenlabs_key: '',
    
    // System
    openclaw_url: 'http://127.0.0.1:18789/v1/chat/completions',
    openclaw_token: '',
    
    // Family
    family_members: [],
    
    // Status
    setup_complete: false
  });
  
  const [testing, setTesting] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    checkSetupStatus();
  }, []);

  async function checkSetupStatus() {
    try {
      const res = await fetch('/api/setup/status');
      const data = await res.json();
      
      if (data.setup_complete) {
        // Already set up, redirect to settings
        window.location.href = '/settings';
      }
    } catch (err) {
      console.error('Failed to check setup status:', err);
    }
  }

  function updateConfig(field, value) {
    setConfig(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors(prev => ({ ...prev, [field]: null }));
  }

  async function testConnection(service) {
    setTesting(prev => ({ ...prev, [service]: true }));
    setErrors(prev => ({ ...prev, [service]: null }));
    
    try {
      const res = await fetch('/api/setup/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service,
          config: service === 'openai' ? { api_key: config.openai_key } :
                  service === 'home_assistant' ? { url: config.ha_url, token: config.ha_token } :
                  service === 'elevenlabs' ? { api_key: config.elevenlabs_key } :
                  service === 'openclaw' ? { url: config.openclaw_url, token: config.openclaw_token } :
                  {}
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert(`✅ ${service} connected successfully!`);
      } else {
        setErrors(prev => ({ ...prev, [service]: data.error || 'Connection failed' }));
      }
    } catch (err) {
      setErrors(prev => ({ ...prev, [service]: err.message }));
    } finally {
      setTesting(prev => ({ ...prev, [service]: false }));
    }
  }

  function addFamilyMember() {
    const newMember = {
      id: Date.now(),
      name: '',
      age: 8,
      role: 'child',
      personality: 'playful',
      voice: 'piper',
      pin: Math.floor(100 + Math.random() * 900).toString()
    };
    
    setConfig(prev => ({
      ...prev,
      family_members: [...prev.family_members, newMember]
    }));
  }

  function updateFamilyMember(id, field, value) {
    setConfig(prev => ({
      ...prev,
      family_members: prev.family_members.map(m =>
        m.id === id ? { ...m, [field]: value } : m
      )
    }));
  }

  function removeFamilyMember(id) {
    setConfig(prev => ({
      ...prev,
      family_members: prev.family_members.filter(m => m.id !== id)
    }));
  }

  async function completeSetup() {
    try {
      const res = await fetch('/api/setup/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert('🎉 Setup complete! HomeNest is ready to use.');
        window.location.href = '/';
      } else {
        alert('Setup failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Setup failed: ' + err.message);
    }
  }

  function nextStep() {
    // Validate current step
    if (step === 1) {
      if (!config.openai_key || !config.ha_token || !config.openclaw_token) {
        alert('Please fill in all required API keys');
        return;
      }
    }
    
    if (step === 3) {
      if (config.family_members.length === 0) {
        alert('Please add at least one family member');
        return;
      }
    }
    
    setStep(step + 1);
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div 
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
            style={{ 
              background: 'linear-gradient(135deg, var(--accent-orange), var(--accent-purple))',
              boxShadow: '0 0 40px rgba(255,107,53,0.4)'
            }}
          >
            <span className="text-4xl">🏠</span>
          </div>
          <h1 
            className="text-4xl font-bold mb-3"
            style={{ 
              background: 'linear-gradient(135deg, var(--accent-orange), var(--accent-purple))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Welcome to HomeNest
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Let's set up your family's AI assistant
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            {[
              { num: 1, label: 'Connections' },
              { num: 2, label: 'Test' },
              { num: 3, label: 'Family' },
              { num: 4, label: 'Finish' }
            ].map((s, i) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 transition-all"
                    style={{ 
                      background: step >= s.num ? 'var(--accent-orange)' : 'var(--bg-secondary)',
                      color: step >= s.num ? 'white' : 'var(--text-muted)',
                      border: `2px solid ${step >= s.num ? 'var(--accent-orange)' : 'var(--border-subtle)'}`
                    }}
                  >
                    {s.num}
                  </div>
                  <span className="text-xs" style={{ color: step >= s.num ? 'var(--accent-orange)' : 'var(--text-muted)' }}>
                    {s.label}
                  </span>
                </div>
                {i < 3 && (
                  <div 
                    className="flex-1 h-1 mx-2"
                    style={{ background: step > s.num ? 'var(--accent-orange)' : 'var(--bg-secondary)' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="glass-card p-8">
          {/* Step 1: API Keys */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">API Connections</h2>
              <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
                Connect HomeNest to your services. All keys are stored locally and encrypted.
              </p>

              <div className="space-y-6">
                {/* OpenAI */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    OpenAI API Key <span style={{ color: 'var(--accent-red)' }}>*</span>
                  </label>
                  <input
                    type="password"
                    value={config.openai_key}
                    onChange={(e) => updateConfig('openai_key', e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-4 py-3 rounded-xl"
                    style={{ 
                      background: 'var(--bg-secondary)', 
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                    Used for cloud AI responses. Get one at platform.openai.com
                  </p>
                </div>

                {/* Home Assistant */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Home Assistant URL <span style={{ color: 'var(--accent-red)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={config.ha_url}
                    onChange={(e) => updateConfig('ha_url', e.target.value)}
                    placeholder="http://homeassistant.local:8123"
                    className="w-full px-4 py-3 rounded-xl mb-3"
                    style={{ 
                      background: 'var(--bg-secondary)', 
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  
                  <label className="block text-sm font-medium mb-2">
                    Home Assistant Token <span style={{ color: 'var(--accent-red)' }}>*</span>
                  </label>
                  <input
                    type="password"
                    value={config.ha_token}
                    onChange={(e) => updateConfig('ha_token', e.target.value)}
                    placeholder="Long-lived access token"
                    className="w-full px-4 py-3 rounded-xl"
                    style={{ 
                      background: 'var(--bg-secondary)', 
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                    Create a long-lived token in HA Settings → Security
                  </p>
                </div>

                {/* OpenClaw */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    OpenClaw Gateway Token <span style={{ color: 'var(--accent-red)' }}>*</span>
                  </label>
                  <input
                    type="password"
                    value={config.openclaw_token}
                    onChange={(e) => updateConfig('openclaw_token', e.target.value)}
                    placeholder="Your OpenClaw token"
                    className="w-full px-4 py-3 rounded-xl"
                    style={{ 
                      background: 'var(--bg-secondary)', 
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                    Find in ~/.openclaw/openclaw.json under gateway.token
                  </p>
                </div>

                {/* ElevenLabs (Optional) */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    ElevenLabs API Key <span style={{ color: 'var(--text-muted)' }}>(Optional)</span>
                  </label>
                  <input
                    type="password"
                    value={config.elevenlabs_key}
                    onChange={(e) => updateConfig('elevenlabs_key', e.target.value)}
                    placeholder="For character voices (Disney-like for kids)"
                    className="w-full px-4 py-3 rounded-xl"
                    style={{ 
                      background: 'var(--bg-secondary)', 
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                    Optional: For premium character voices. Free tier available at elevenlabs.io
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Test Connections */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Test Connections</h2>
              <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
                Let's verify everything is working correctly.
              </p>

              <div className="space-y-4">
                <TestConnectionCard 
                  name="OpenAI"
                  description="Cloud AI for complex queries"
                  onTest={() => testConnection('openai')}
                  testing={testing.openai}
                  error={errors.openai}
                />
                
                <TestConnectionCard 
                  name="Home Assistant"
                  description="Smart home control"
                  onTest={() => testConnection('home_assistant')}
                  testing={testing.home_assistant}
                  error={errors.home_assistant}
                />
                
                <TestConnectionCard 
                  name="OpenClaw Gateway"
                  description="Personal AI agents"
                  onTest={() => testConnection('openclaw')}
                  testing={testing.openclaw}
                  error={errors.openclaw}
                />
                
                {config.elevenlabs_key && (
                  <TestConnectionCard 
                    name="ElevenLabs"
                    description="Premium voice synthesis"
                    onTest={() => testConnection('elevenlabs')}
                    testing={testing.elevenlabs}
                    error={errors.elevenlabs}
                  />
                )}
              </div>
            </div>
          )}

          {/* Step 3: Family Members */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Your Family</h2>
              <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
                Add everyone who will use HomeNest. Each person gets their own AI assistant!
              </p>

              <div className="space-y-4 mb-6">
                {config.family_members.map(member => (
                  <FamilyMemberCard
                    key={member.id}
                    member={member}
                    onUpdate={(field, value) => updateFamilyMember(member.id, field, value)}
                    onRemove={() => removeFamilyMember(member.id)}
                  />
                ))}
              </div>

              <button
                onClick={addFamilyMember}
                className="w-full py-4 rounded-xl border-2 border-dashed transition-all hover:scale-105"
                style={{ 
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)'
                }}
              >
                + Add Family Member
              </button>
            </div>
          )}

          {/* Step 4: Finish */}
          {step === 4 && (
            <div className="text-center py-8">
              <div className="text-6xl mb-6">🎉</div>
              <h2 className="text-3xl font-bold mb-4">You're All Set!</h2>
              <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
                HomeNest will now create personalized AI agents for your family.
              </p>

              <div className="glass-card p-6 mb-8 text-left" style={{ background: 'var(--bg-secondary)' }}>
                <h3 className="font-semibold mb-4">What happens next:</h3>
                <ul className="space-y-2" style={{ color: 'var(--text-secondary)' }}>
                  <li>✅ Personal AI agent for each family member</li>
                  <li>✅ Voice profiles with PIN protection</li>
                  <li>✅ Age-appropriate content filtering</li>
                  <li>✅ Chores & rewards system</li>
                  <li>✅ Smart home voice control</li>
                </ul>
              </div>

              <button
                onClick={completeSetup}
                className="px-8 py-4 rounded-xl text-lg font-semibold text-white transition-all hover:scale-105"
                style={{ background: 'var(--accent-orange)' }}
              >
                Complete Setup & Launch HomeNest
              </button>
            </div>
          )}

          {/* Navigation */}
          {step < 4 && (
            <div className="flex justify-between mt-8 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
                className="px-6 py-3 rounded-xl transition-all"
                style={{ 
                  background: step === 1 ? 'transparent' : 'var(--bg-secondary)',
                  color: step === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  opacity: step === 1 ? 0.5 : 1,
                  cursor: step === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Back
              </button>
              
              <button
                onClick={nextStep}
                className="px-6 py-3 rounded-xl text-white font-semibold transition-all hover:scale-105"
                style={{ background: 'var(--accent-orange)' }}
              >
                Continue →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TestConnectionCard({ name, description, onTest, testing, error }) {
  return (
    <div 
      className="p-4 rounded-xl flex items-center justify-between"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
    >
      <div>
        <div className="font-medium mb-1">{name}</div>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{description}</div>
        {error && (
          <div className="text-sm mt-2" style={{ color: 'var(--accent-red)' }}>
            ❌ {error}
          </div>
        )}
      </div>
      <button
        onClick={onTest}
        disabled={testing}
        className="px-4 py-2 rounded-lg transition-all hover:scale-105"
        style={{ 
          background: 'var(--accent-blue)',
          color: 'white',
          opacity: testing ? 0.5 : 1
        }}
      >
        {testing ? 'Testing...' : 'Test'}
      </button>
    </div>
  );
}

function FamilyMemberCard({ member, onUpdate, onRemove }) {
  return (
    <div 
      className="p-6 rounded-xl"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Name</label>
          <input
            type="text"
            value={member.name}
            onChange={(e) => onUpdate('name', e.target.value)}
            placeholder="e.g., Sarah"
            className="w-full px-3 py-2 rounded-lg"
            style={{ 
              background: 'var(--bg-primary)', 
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Age</label>
          <input
            type="number"
            value={member.age}
            onChange={(e) => onUpdate('age', parseInt(e.target.value))}
            className="w-full px-3 py-2 rounded-lg"
            style={{ 
              background: 'var(--bg-primary)', 
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Role</label>
          <select
            value={member.role}
            onChange={(e) => onUpdate('role', e.target.value)}
            className="w-full px-3 py-2 rounded-lg"
            style={{ 
              background: 'var(--bg-primary)', 
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="parent">Parent</option>
            <option value="child">Child</option>
            <option value="teen">Teen</option>
            <option value="guest">Guest</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Personality</label>
          <select
            value={member.personality}
            onChange={(e) => onUpdate('personality', e.target.value)}
            className="w-full px-3 py-2 rounded-lg"
            style={{ 
              background: 'var(--bg-primary)', 
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="playful">Playful</option>
            <option value="curious">Curious</option>
            <option value="creative">Creative</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Voice PIN</label>
          <input
            type="text"
            value={member.pin}
            onChange={(e) => onUpdate('pin', e.target.value)}
            placeholder="123"
            className="w-full px-3 py-2 rounded-lg"
            style={{ 
              background: 'var(--bg-primary)', 
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Used for voice profile switching
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Voice</label>
          <select
            value={member.voice}
            onChange={(e) => onUpdate('voice', e.target.value)}
            className="w-full px-3 py-2 rounded-lg"
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

      <button
        onClick={onRemove}
        className="mt-4 px-4 py-2 rounded-lg text-sm transition-all hover:scale-105"
        style={{ 
          background: 'rgba(239,68,68,0.1)',
          color: 'var(--accent-red)'
        }}
      >
        Remove
      </button>
    </div>
  );
}
