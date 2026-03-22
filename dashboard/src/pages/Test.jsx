import { useState } from 'react';

export default function Test() {
  const [tests, setTests] = useState([]);
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState({ total: 0, passed: 0, failed: 0, skipped: 0 });

  async function runAllTests() {
    setRunning(true);
    setTests([]);
    setSummary({ total: 0, passed: 0, failed: 0, skipped: 0 });
    
    const testSuites = [
      { name: 'Configuration Files', tests: testConfigFiles },
      { name: 'Setup API', tests: testSetupAPI },
      { name: 'Settings API', tests: testSettingsAPI },
      { name: 'Voice Proxy', tests: testVoiceProxy },
      { name: 'Agent Workspaces', tests: testAgentWorkspaces },
      { name: 'Home Assistant', tests: testHomeAssistant },
      { name: 'OpenClaw Gateway', tests: testOpenClaw },
    ];
    
    const allResults = [];
    
    for (const suite of testSuites) {
      addTest({ name: suite.name, status: 'running', message: 'Running test suite...' });
      
      try {
        const results = await suite.tests();
        allResults.push(...results);
        
        results.forEach(result => {
          addTest(result);
        });
      } catch (err) {
        addTest({ 
          name: `${suite.name} Suite Error`, 
          status: 'failed', 
          message: err.message 
        });
      }
    }
    
    // Calculate summary
    const passed = allResults.filter(r => r.status === 'passed').length;
    const failed = allResults.filter(r => r.status === 'failed').length;
    const skipped = allResults.filter(r => r.status === 'skipped').length;
    
    setSummary({
      total: allResults.length,
      passed,
      failed,
      skipped
    });
    
    setRunning(false);
  }

  function addTest(test) {
    setTests(prev => [...prev, { ...test, timestamp: new Date().toISOString() }]);
  }

  async function testConfigFiles() {
    const results = [];
    
    // Test profiles.json exists
    try {
      const res = await fetch('/api/test/file-exists?path=config/profiles.json');
      const data = await res.json();
      results.push({
        name: 'config/profiles.json exists',
        status: data.exists ? 'passed' : 'failed',
        message: data.exists ? 'File exists' : 'File not found'
      });
    } catch (err) {
      results.push({
        name: 'config/profiles.json exists',
        status: 'failed',
        message: err.message
      });
    }
    
    // Test .env exists
    try {
      const res = await fetch('/api/test/file-exists?path=.env');
      const data = await res.json();
      results.push({
        name: '.env exists',
        status: data.exists ? 'passed' : 'failed',
        message: data.exists ? 'File exists' : 'File not found (run setup wizard)'
      });
    } catch (err) {
      results.push({
        name: '.env exists',
        status: 'failed',
        message: err.message
      });
    }
    
    return results;
  }

  async function testSetupAPI() {
    const results = [];
    
    // Test setup status endpoint
    try {
      const res = await fetch('/api/setup/status');
      const data = await res.json();
      results.push({
        name: 'Setup API /status',
        status: res.ok ? 'passed' : 'failed',
        message: `Setup complete: ${data.setup_complete}`
      });
    } catch (err) {
      results.push({
        name: 'Setup API /status',
        status: 'failed',
        message: err.message
      });
    }
    
    return results;
  }

  async function testSettingsAPI() {
    const results = [];
    
    // Test settings config endpoint
    try {
      const res = await fetch('/api/settings/config');
      const data = await res.json();
      results.push({
        name: 'Settings API /config',
        status: res.ok ? 'passed' : 'failed',
        message: `Loaded ${Object.keys(data).length} config fields`
      });
    } catch (err) {
      results.push({
        name: 'Settings API /config',
        status: 'failed',
        message: err.message
      });
    }
    
    // Test settings profiles endpoint
    try {
      const res = await fetch('/api/settings/profiles');
      const data = await res.json();
      results.push({
        name: 'Settings API /profiles',
        status: res.ok ? 'passed' : 'failed',
        message: `Loaded ${Object.keys(data).length} profiles`
      });
    } catch (err) {
      results.push({
        name: 'Settings API /profiles',
        status: 'failed',
        message: err.message
      });
    }
    
    return results;
  }

  async function testVoiceProxy() {
    const results = [];
    
    // Test voice proxy via backend proxy (avoid CORS)
    try {
      const res = await fetch('/api/test/voice-proxy');
      const data = await res.json();
      const modelCount = data.models?.length || 0;
      results.push({
        name: 'Voice Proxy (port 11434)',
        status: data.running && modelCount > 0 ? 'passed' : 'failed',
        message: data.running ? `Running (${modelCount} models)` : 'Not running (start: python3 proxy_v4.py)'
      });
      
      // Add detail about models if passed
      if (data.running && modelCount > 0) {
        results.push({
          name: 'Voice Proxy Models',
          status: 'passed',
          message: `${modelCount} model(s) available: ${data.models.map(m => m.name).join(', ')}`
        });
      } else {
        results.push({
          name: 'Voice Proxy Models',
          status: 'skipped',
          message: 'Voice proxy not running'
        });
      }
    } catch (err) {
      results.push({
        name: 'Voice Proxy (port 11434)',
        status: 'failed',
        message: 'Not running (start: python3 proxy_v4.py)'
      });
      results.push({
        name: 'Voice Proxy Models',
        status: 'skipped',
        message: 'Voice proxy not running'
      });
    }
    
    return results;
  }

  async function testAgentWorkspaces() {
    const results = [];
    
    const agentNames = ['snehal', 'anushka', 'ayush', 'ahana'];
    
    for (const name of agentNames) {
      try {
        const res = await fetch(`/api/test/file-exists?path=agents/${name}/workspace/SOUL.md`);
        const data = await res.json();
        results.push({
          name: `Agent workspace: ${name}`,
          status: data.exists ? 'passed' : 'failed',
          message: data.exists ? 'SOUL.md exists' : 'Workspace not found'
        });
      } catch (err) {
        results.push({
          name: `Agent workspace: ${name}`,
          status: 'failed',
          message: err.message
        });
      }
    }
    
    return results;
  }

  async function testHomeAssistant() {
    const results = [];
    
    // Test HA proxy via backend (avoid CORS)
    try {
      const res = await fetch('/api/test/ha-proxy');
      const data = await res.json();
      results.push({
        name: 'HA API Proxy (port 3200)',
        status: data.running ? 'passed' : 'failed',
        message: data.running ? `Connected to ${data.ha_url}` : 'Not running (start: node dashboard/api-proxy.js)'
      });
    } catch (err) {
      results.push({
        name: 'HA API Proxy (port 3200)',
        status: 'failed',
        message: 'Not running (start: node dashboard/api-proxy.js)'
      });
    }
    
    // Test HA connection via Vite proxy (already works)
    try {
      const res = await fetch('http://localhost:3200/api/states');
      const data = await res.json();
      results.push({
        name: 'Home Assistant Connection',
        status: Array.isArray(data) ? 'passed' : 'failed',
        message: Array.isArray(data) ? `${data.length} entities loaded` : 'Connection failed'
      });
    } catch (err) {
      results.push({
        name: 'Home Assistant Connection',
        status: 'skipped',
        message: 'HA proxy not running'
      });
    }
    
    return results;
  }

  async function testOpenClaw() {
    const results = [];
    
    // Test OpenClaw Gateway via backend proxy (avoid CORS)
    try {
      const res = await fetch('/api/test/openclaw');
      const data = await res.json();
      results.push({
        name: 'OpenClaw Gateway (port 18789)',
        status: data.running ? 'passed' : 'failed',
        message: data.running ? 'Gateway responding' : 'Not running (start: openclaw gateway start)'
      });
    } catch (err) {
      results.push({
        name: 'OpenClaw Gateway (port 18789)',
        status: 'failed',
        message: 'Not running (start: openclaw gateway start)'
      });
    }
    
    // Test agent configuration (check profiles.json)
    try {
      const res = await fetch('/api/settings/profiles');
      const data = await res.json();
      // API returns object with profile keys, not array
      const agentCount = Object.keys(data).length;
      results.push({
        name: 'OpenClaw Agents Configured',
        status: agentCount >= 4 ? 'passed' : 'failed',
        message: `${agentCount} agents in profiles.json (expected 4)`
      });
    } catch (err) {
      results.push({
        name: 'OpenClaw Agents Configured',
        status: 'failed',
        message: 'Could not read profiles configuration'
      });
    }
    
    return results;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">System Tests</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Run comprehensive tests on all HomeNest components
          </p>
        </div>
        <button
          onClick={runAllTests}
          disabled={running}
          className="px-6 py-3 rounded-xl text-white font-semibold transition-all hover:scale-105"
          style={{ 
            background: running ? 'var(--text-muted)' : 'var(--accent-orange)',
            opacity: running ? 0.5 : 1
          }}
        >
          {running ? 'Running Tests...' : '▶ Run All Tests'}
        </button>
      </div>

      {/* Summary */}
      {summary.total > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-4">
            <div className="text-2xl font-bold mb-1">{summary.total}</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Tests</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-bold mb-1" style={{ color: 'var(--accent-green)' }}>
              {summary.passed}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Passed</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-bold mb-1" style={{ color: 'var(--accent-red)' }}>
              {summary.failed}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Failed</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-muted)' }}>
              {summary.skipped}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Skipped</div>
          </div>
        </div>
      )}

      {/* Test Results */}
      <div className="glass-card p-6">
        {tests.length === 0 && !running && (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            <div className="text-4xl mb-4">🧪</div>
            <p>Click "Run All Tests" to start</p>
          </div>
        )}

        <div className="space-y-2">
          {tests.map((test, i) => (
            <TestResult key={i} test={test} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TestResult({ test }) {
  const icons = {
    passed: '✅',
    failed: '❌',
    running: '⏳',
    skipped: '⊘'
  };
  
  const colors = {
    passed: 'var(--accent-green)',
    failed: 'var(--accent-red)',
    running: 'var(--accent-blue)',
    skipped: 'var(--text-muted)'
  };

  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-lg"
      style={{ 
        background: 'var(--bg-secondary)',
        border: `1px solid ${colors[test.status] || 'var(--border-subtle)'}`
      }}
    >
      <div style={{ fontSize: '1.2rem' }}>
        {icons[test.status]}
      </div>
      <div className="flex-1">
        <div className="font-medium">{test.name}</div>
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {test.message}
        </div>
      </div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {test.timestamp && new Date(test.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}
