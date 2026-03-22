import { useState, useEffect } from 'react';

export default function Activity() {
  const [activityLog, setActivityLog] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadActivity();
  }, []);

  const loadActivity = async () => {
    try {
      const res = await fetch('/config/activity.json');
      const data = await res.json();
      setActivityLog(data);
    } catch (err) {
      console.error('Error loading activity:', err);
      setActivityLog([
        { timestamp: new Date().toISOString(), message: 'Ayush completed homework', tier: 'HOME', member: 'ayush' },
        { timestamp: new Date(Date.now() - 3600000).toISOString(), message: 'Motion detected at Doorstep', tier: 'LOCAL', member: 'system' },
        { timestamp: new Date(Date.now() - 7200000).toISOString(), message: 'Living Room lights turned on', tier: 'HOME', member: 'snehal' },
        { timestamp: new Date(Date.now() - 10800000).toISOString(), message: 'Ahana earned 3 stars', tier: 'FAMILY', member: 'ahana' },
        { timestamp: new Date(Date.now() - 14400000).toISOString(), message: 'Agent performed backup', tier: 'AGENT', member: 'system' },
      ]);
    }
  };

  const getTierColor = (tier) => {
    const colors = {
      HOME: 'var(--accent-green)',
      FAMILY: 'var(--accent-amber)',
      LOCAL: 'var(--accent-blue)',
      CLOUD: 'var(--accent-purple)',
      AGENT: '#fb923c'
    };
    return colors[tier] || 'var(--text-muted)';
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return time.toLocaleDateString();
  };

  const filteredLogs = filter === 'all' 
    ? activityLog 
    : activityLog.filter(log => log.member === filter);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          📋 Activity Log
        </h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 rounded-lg text-sm"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--text-primary)'
          }}
        >
          <option value="all">All Members</option>
          <option value="snehal">Snehal</option>
          <option value="ayush">Ayush</option>
          <option value="ahana">Ahana</option>
          <option value="system">System</option>
        </select>
      </div>

      {/* Timeline */}
      <div className="glass-card p-6">
        <div className="space-y-4">
          {filteredLogs.map((log, i) => (
            <div key={i} className="flex items-start gap-4">
              {/* Timeline dot */}
              <div className="flex flex-col items-center">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: getTierColor(log.tier) }}
                />
                {i < filteredLogs.length - 1 && (
                  <div
                    className="w-0.5 h-full mt-1"
                    style={{ background: 'rgba(255,255,255,0.1)', minHeight: '32px' }}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p style={{ color: 'var(--text-primary)' }}>{log.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-semibold"
                        style={{
                          background: `${getTierColor(log.tier)}30`,
                          color: getTierColor(log.tier)
                        }}
                      >
                        {log.tier}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatTime(log.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
              No activity found
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
          Activity Tiers
        </h3>
        <div className="flex flex-wrap gap-3">
          {['HOME', 'FAMILY', 'LOCAL', 'CLOUD', 'AGENT'].map(tier => (
            <div key={tier} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: getTierColor(tier) }}
              />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {tier}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
