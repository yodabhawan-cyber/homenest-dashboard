import { useState, useEffect } from 'react';

export default function Rewards() {
  const [selectedKid, setSelectedKid] = useState('ayush');
  const [rewardsData, setRewardsData] = useState({ balances: {}, rewards: [], redemptions: [] });

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      const res = await fetch('/config/rewards.json');
      const data = await res.json();
      setRewardsData(data);
    } catch (err) {
      console.error('Error loading rewards:', err);
      setRewardsData({
        balances: { ayush: 45, ahana: 38 },
        rewards: [
          { id: 1, name: '30 min extra screen time', emoji: '📱', cost: 10, unlocked: true },
          { id: 2, name: 'Choose dinner', emoji: '🍽️', cost: 15, unlocked: true },
          { id: 3, name: 'Movie night pick', emoji: '🎬', cost: 20, unlocked: true },
          { id: 4, name: 'Skip one chore', emoji: '✨', cost: 25, unlocked: false },
          { id: 5, name: 'Friend sleepover', emoji: '🏠', cost: 50, unlocked: false },
          { id: 6, name: 'New toy/game', emoji: '🎮', cost: 100, unlocked: false },
        ],
        redemptions: [
          { kid: 'ayush', reward: '30 min extra screen time', date: '2026-03-19', cost: 10 },
          { kid: 'ahana', reward: 'Choose dinner', date: '2026-03-18', cost: 15 },
        ]
      });
    }
  };

  const redeemReward = (reward) => {
    const balance = rewardsData.balances[selectedKid] || 0;
    if (balance < reward.cost) {
      alert('Not enough stars!');
      return;
    }
    if (!reward.unlocked) {
      alert('This reward is locked! Keep earning stars to unlock it.');
      return;
    }
    if (confirm(`Redeem "${reward.name}" for ${reward.cost} stars?`)) {
      const newBalance = balance - reward.cost;
      const newRedemption = {
        kid: selectedKid,
        reward: reward.name,
        date: new Date().toISOString().split('T')[0],
        cost: reward.cost
      };
      setRewardsData({
        ...rewardsData,
        balances: { ...rewardsData.balances, [selectedKid]: newBalance },
        redemptions: [newRedemption, ...rewardsData.redemptions]
      });
      alert('Reward redeemed! 🎉');
    }
  };

  const balance = rewardsData.balances[selectedKid] || 0;
  const rewards = rewardsData.rewards || [];
  const redemptions = (rewardsData.redemptions || []).filter(r => r.kid === selectedKid).slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with kid selector */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          ⭐ Reward Shop
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => setSelectedKid('ayush')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              selectedKid === 'ayush' ? 'active' : ''
            }`}
            style={{
              background: selectedKid === 'ayush' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
              border: `2px solid ${selectedKid === 'ayush' ? 'var(--accent-green)' : 'transparent'}`,
              color: selectedKid === 'ayush' ? 'var(--accent-green)' : 'var(--text-secondary)'
            }}
          >
            Ayush
          </button>
          <button
            onClick={() => setSelectedKid('ahana')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              selectedKid === 'ahana' ? 'active' : ''
            }`}
            style={{
              background: selectedKid === 'ahana' ? 'rgba(236,72,153,0.2)' : 'rgba(255,255,255,0.05)',
              border: `2px solid ${selectedKid === 'ahana' ? '#ec4899' : 'transparent'}`,
              color: selectedKid === 'ahana' ? '#ec4899' : 'var(--text-secondary)'
            }}
          >
            Ahana
          </button>
        </div>
      </div>

      {/* Star Balance */}
      <div className="glass-card p-8 mb-6 text-center">
        <div className="inline-block">
          <div className="text-6xl mb-3 animate-pulse">⭐</div>
          <div className="text-5xl font-bold mb-2" style={{ color: 'var(--accent-amber)' }}>
            {balance} Stars
          </div>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Available to spend
          </div>
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Available Rewards
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward) => {
            const canAfford = balance >= reward.cost;
            const isLocked = !reward.unlocked;
            
            return (
              <div
                key={reward.id}
                className="glass-card p-6 text-center relative"
                style={{
                  opacity: isLocked ? 0.5 : 1,
                  border: canAfford && !isLocked ? '1px solid var(--accent-green)' : undefined
                }}
              >
                {isLocked && (
                  <div className="absolute top-3 right-3 text-2xl">🔒</div>
                )}
                <div className="text-5xl mb-3">{reward.emoji}</div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {reward.name}
                </h3>
                <div className="text-2xl font-bold mb-4" style={{ color: 'var(--accent-amber)' }}>
                  {reward.cost} ⭐
                </div>
                {!isLocked ? (
                  <button
                    onClick={() => redeemReward(reward)}
                    disabled={!canAfford}
                    className="px-6 py-2 rounded-lg font-semibold transition-all"
                    style={{
                      background: canAfford ? 'var(--accent-green)' : 'rgba(255,255,255,0.05)',
                      color: canAfford ? 'white' : 'var(--text-muted)',
                      cursor: canAfford ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {canAfford ? 'Redeem' : 'Need more stars'}
                  </button>
                ) : (
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Locked - Keep earning stars!
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Redemptions */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Recent Redemptions
        </h2>
        {redemptions.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
            No redemptions yet. Start saving stars! 💫
          </div>
        ) : (
          <div className="space-y-3">
            {redemptions.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div>
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{r.reward}</div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{r.date}</div>
                </div>
                <div className="font-bold" style={{ color: 'var(--accent-amber)' }}>
                  -{r.cost} ⭐
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
