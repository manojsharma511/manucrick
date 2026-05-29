import { useState, useEffect } from 'react';

interface MatchLog {
  name: string;
  score: number;
  balls: number;
  difficulty: string;
  mode: string;
  status: string;
  date: string;
}

interface HighScore {
  name: string;
  score: number;
  difficulty: string;
  date: string;
}

export function TrophyCabinet() {
  const [stats, setStats] = useState({
    matchesPlayed: 0,
    totalRuns: 0,
    championshipBest: 0,
    sixesCount: 0,
    superOverWins: 0,
    targetWins: 0,
    maxSurvivalScore: 0,
  });

  const [selectedBat, setSelectedBat] = useState('kashmir');

  useEffect(() => {
    // Load stats from localStorage
    const savedLogs = localStorage.getItem('manucrick_match_logs');
    const savedHighs = localStorage.getItem('manucrick_highscores');
    const savedSixes = localStorage.getItem('manucrick_sixes_count');
    const activeBat = localStorage.getItem('manucrick_selected_bat') || 'kashmir';

    setSelectedBat(activeBat);

    let logs: MatchLog[] = [];
    if (savedLogs) {
      try {
        logs = JSON.parse(savedLogs);
      } catch (e) {}
    }

    let highs: HighScore[] = [];
    if (savedHighs) {
      try {
        highs = JSON.parse(savedHighs);
      } catch (e) {}
    }

    const matchesPlayed = logs.length;
    const totalRuns = logs.reduce((sum, log) => sum + (log.status === 'Ended' || log.status === 'Won' || log.status === 'Lost' ? log.score : 0), 0);
    
    // Championship best
    const champBest = highs.length > 0 ? Math.max(...highs.map((h) => h.score)) : 0;

    // Super over wins
    const superOverWins = logs.filter((l) => l.mode.toLowerCase().includes('super') && l.status === 'Won').length;

    // Target wins
    const targetWins = logs.filter((l) => l.mode.toLowerCase().includes('target') && l.status === 'Won').length;

    // Survival best
    const survivalBest = logs.length > 0 ? Math.max(...logs.filter((l) => l.mode.toLowerCase().includes('survival')).map((l) => l.score), 0) : 0;

    setStats({
      matchesPlayed,
      totalRuns,
      championshipBest: Math.max(champBest, logs.filter(l => l.mode.toLowerCase().includes('champ')).reduce((max, l) => Math.max(max, l.score), 0)),
      sixesCount: Number(savedSixes || 0),
      superOverWins,
      targetWins,
      maxSurvivalScore: survivalBest,
    });
  }, []);

  const selectBat = (id: string, isUnlocked: boolean) => {
    if (!isUnlocked) return;
    setSelectedBat(id);
    localStorage.setItem('manucrick_selected_bat', id);
  };

  // Unlocking criteria
  const isCyberBatUnlocked = stats.totalRuns >= 50 || stats.championshipBest >= 20;
  const isHelicopterBatUnlocked = stats.championshipBest >= 30 || stats.matchesPlayed >= 10;

  const trophies = [
    {
      id: 'debut',
      title: 'IPL Debut Cap',
      desc: 'Step into the stadium creases for the first time.',
      icon: '🧢',
      unlocked: stats.matchesPlayed >= 1,
      requirement: 'Play 1 match in Play Arena',
    },
    {
      id: 'sixer',
      title: 'Boundary King',
      desc: 'Cleared the fences and hit a towering six.',
      icon: '⚡',
      unlocked: stats.sixesCount >= 1,
      requirement: 'Hit a SIX in Play Arena',
    },
    {
      id: 'superover',
      title: 'Super Over Finisher',
      desc: 'Completed a successful target chase in Super Over mode.',
      icon: '🔥',
      unlocked: stats.superOverWins >= 1,
      requirement: 'Win 1 Super Over match',
    },
    {
      id: 'target',
      title: 'Target Destroyer',
      desc: 'Chased down a heavy target with time to spare.',
      icon: '🏆',
      unlocked: stats.targetWins >= 1,
      requirement: 'Win 1 Target Attack match',
    },
    {
      id: 'survival',
      title: 'Survival Legend',
      desc: 'Stood firm against bowling varieties and survived.',
      icon: '🛡️',
      unlocked: stats.maxSurvivalScore >= 20,
      requirement: 'Score 20+ runs in Survival mode',
    },
    {
      id: 'master',
      title: 'Century Batter',
      desc: 'Accumulated 100+ total career runs at the crease.',
      icon: '👑',
      unlocked: stats.totalRuns >= 100,
      requirement: 'Accumulate 100 total career runs',
    },
  ];

  const bats = [
    {
      id: 'kashmir',
      name: 'Kashmir Willow Pro',
      desc: 'Traditional light bat tailored for clinical timing and sweet spot placements.',
      spec: 'Sweet Spot Timing +10%',
      unlocked: true,
      power: 70,
      control: 95,
      icon: '🏏',
    },
    {
      id: 'cyber',
      name: 'Cyber-Carbon Bat',
      desc: 'Forged carbon-fiber core designed for heavy boundary clearing power.',
      spec: 'Power Hitting +20%',
      unlocked: isCyberBatUnlocked,
      requirement: 'Requires 50+ total career runs or 20+ Championship score',
      power: 90,
      control: 80,
      icon: '🚀',
    },
    {
      id: 'helicopter',
      name: "Manoj's Helicopter Special",
      desc: 'Custom heavy toe bat tuned specifically for explosive wrist action and helicopter shots.',
      spec: 'Perfect Shot Timing +15% & Power +30%',
      unlocked: isHelicopterBatUnlocked,
      requirement: 'Requires 30+ Championship high score or 10 matches played',
      power: 98,
      control: 92,
      icon: '🚁',
    },
  ];

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '20px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '40px',
      }}
      className="scroll-animate"
    >
      {/* Dynamic Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
        }}
      >
        {[
          { label: 'Matches Played', val: stats.matchesPlayed, icon: '🏟️', color: 'var(--primary)' },
          { label: 'Total Career Runs', val: stats.totalRuns, icon: '📈', color: 'var(--secondary)' },
          { label: 'Championship Best', val: stats.championshipBest, icon: '👑', color: 'var(--accent)' },
          { label: 'Total Sixes Hit', val: stats.sixesCount, icon: '💥', color: '#FF3B30' },
        ].map((item, index) => (
          <div
            key={index}
            className="glass-panel"
            style={{
              padding: '20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.05)',
              transition: 'transform 0.2s',
            }}
          >
            <span style={{ fontSize: '2rem', marginBottom: '8px' }}>{item.icon}</span>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
              {item.label}
            </div>
            <div style={{ fontFamily: 'var(--font-headings)', fontSize: '2.5rem', color: item.color, marginTop: '5px' }}>
              {item.val}
            </div>
          </div>
        ))}
      </div>

      {/* Legends Bat Vault */}
      <div>
        <h3
          style={{
            fontFamily: 'var(--font-headings)',
            fontSize: '2rem',
            color: '#FFFFFF',
            textAlign: 'left',
            marginBottom: '20px',
            borderLeft: '4px solid var(--primary)',
            paddingLeft: '12px',
          }}
        >
          🏏 LEGENDS BAT VAULT
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {bats.map((bat) => (
            <div
              key={bat.id}
              className={`glass-panel ${selectedBat === bat.id ? 'active-bat-card' : ''}`}
              onClick={() => selectBat(bat.id, bat.unlocked)}
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                border: selectedBat === bat.id ? '2px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.06)',
                boxShadow: selectedBat === bat.id ? '0 0 20px rgba(0, 255, 135, 0.15)' : 'none',
                opacity: bat.unlocked ? 1 : 0.6,
                cursor: bat.unlocked ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.8rem' }}>{bat.icon}</span>
                    <h4 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1.25rem', color: '#FFFFFF' }}>
                      {bat.name}
                    </h4>
                  </div>
                  {selectedBat === bat.id && (
                    <span style={{ backgroundColor: 'var(--primary)', color: '#050A18', padding: '3px 8px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' }}>
                      EQUIPPED
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '16px' }}>
                  {bat.desc}
                </p>
              </div>

              <div>
                {/* Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '3px' }}>
                      <span>Power</span>
                      <span>{bat.power}%</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${bat.power}%`, height: '100%', backgroundColor: 'var(--secondary)' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '3px' }}>
                      <span>Control</span>
                      <span>{bat.control}%</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${bat.control}%`, height: '100%', backgroundColor: 'var(--primary)' }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: bat.unlocked ? 'var(--primary)' : 'var(--secondary)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    {bat.unlocked ? bat.spec : '🔒 LOCKED'}
                  </span>
                  {!bat.unlocked && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right', maxWidth: '180px' }}>
                      {bat.requirement}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trophy Cabinet Badges */}
      <div>
        <h3
          style={{
            fontFamily: 'var(--font-headings)',
            fontSize: '2rem',
            color: '#FFFFFF',
            textAlign: 'left',
            marginBottom: '20px',
            borderLeft: '4px solid var(--secondary)',
            paddingLeft: '12px',
          }}
        >
          🏆 STADIUM TROPHY CABINET
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {trophies.map((trophy) => (
            <div
              key={trophy.id}
              className="glass-panel"
              style={{
                padding: '22px',
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                border: trophy.unlocked ? '1px solid rgba(255, 215, 0, 0.25)' : '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: trophy.unlocked ? '0 0 15px rgba(255, 215, 0, 0.06)' : 'none',
                opacity: trophy.unlocked ? 1 : 0.45,
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  fontSize: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: trophy.unlocked ? 'rgba(255, 215, 0, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: trophy.unlocked ? '1.5px solid #FFD700' : '1px solid rgba(255,255,255,0.06)',
                  boxShadow: trophy.unlocked ? '0 0 10px rgba(255, 215, 0, 0.2)' : 'none',
                }}
              >
                {trophy.unlocked ? trophy.icon : '🔒'}
              </div>

              <div style={{ flex: 1 }}>
                <h4
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: '1.08rem',
                    color: trophy.unlocked ? '#FFFFFF' : 'var(--text-secondary)',
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {trophy.title}
                  {trophy.unlocked && <span style={{ color: '#FFD700', fontSize: '0.8rem' }}>★</span>}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.3', marginBottom: '6px' }}>
                  {trophy.desc}
                </p>
                <div style={{ fontSize: '0.72rem', color: trophy.unlocked ? 'var(--primary)' : 'var(--secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                  {trophy.unlocked ? '🏆 UNLOCKED' : `REQ: ${trophy.requirement}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
