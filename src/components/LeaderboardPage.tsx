import { useEffect, useState } from 'react';

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

export function LeaderboardPage() {
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [matchLogs, setMatchLogs] = useState<MatchLog[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  useEffect(() => {
    const scores = localStorage.getItem('manucrick_highscores');
    if (scores) {
      try {
        setHighScores(JSON.parse(scores));
      } catch (e) {
        console.error(e);
      }
    }

    const logs = localStorage.getItem('manucrick_match_logs');
    if (logs) {
      try {
        setMatchLogs(JSON.parse(logs));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const filteredScores = highScores.filter((score) => {
    if (activeTab === 'all') return true;
    return score.difficulty.toLowerCase() === activeTab;
  });

  const totalRuns = matchLogs.reduce((acc, log) => acc + log.score, 0);
  const totalMatches = matchLogs.length;
  const bestScore = highScores.reduce((max, score) => (score.score > max ? score.score : max), 0);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '920px',
        margin: '0 auto',
        padding: '20px 0',
        cursor: 'none',
      }}
      className="scroll-animate"
    >
      {/* Stats Widgets */}
      <div
        style={{
          display: 'flex',
          gap: '20px',
          marginBottom: '30px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: '180px', padding: '22px', background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', textAlign: 'center', boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.02)' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: '6px' }}>🏆</div>
          <div style={{ fontSize: '1.9rem', fontFamily: 'var(--font-headings)', color: 'var(--accent)', textShadow: '0 0 10px rgba(255, 215, 0, 0.2)' }}>{bestScore} Runs</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginTop: '4px' }}>All-Time Personal Best</div>
        </div>
        <div style={{ flex: 1, minWidth: '180px', padding: '22px', background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', textAlign: 'center', boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.02)' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: '6px' }}>🏏</div>
          <div style={{ fontSize: '1.9rem', fontFamily: 'var(--font-headings)', color: 'var(--primary)', textShadow: '0 0 10px rgba(0, 255, 135, 0.2)' }}>{totalRuns} Runs</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginTop: '4px' }}>Total Runs Scored</div>
        </div>
        <div style={{ flex: 1, minWidth: '180px', padding: '22px', background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', textAlign: 'center', boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.02)' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: '6px' }}>🏟️</div>
          <div style={{ fontSize: '1.9rem', fontFamily: 'var(--font-headings)', color: '#FFFFFF' }}>{totalMatches} Matches</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginTop: '4px' }}>Championships Played</div>
        </div>
      </div>

      {/* Ranks Table */}
      <div className="glass-panel" style={{ padding: '25px', marginBottom: '35px', cursor: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '15px' }}>
          <h3 style={{ fontFamily: 'var(--font-headings)', fontSize: '1.9rem', color: '#FFFFFF', letterSpacing: '1px' }}>
            🏅 TOP BATSMEN RANKING
          </h3>

          {/* Selector */}
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.02)', padding: '4px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            {(['all', 'easy', 'medium', 'hard'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: activeTab === tab ? 'var(--primary)' : 'transparent',
                  color: activeTab === tab ? '#050A18' : '#FFF',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  cursor: 'none',
                  transition: 'all 0.2s',
                }}
                className="interactive"
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {filteredScores.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            No records logged under this difficulty. Play a match to log!
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <th style={{ padding: '10px 8px' }}>Rank</th>
                <th style={{ padding: '10px 8px' }}>Batsman</th>
                <th style={{ padding: '10px 8px' }}>Difficulty</th>
                <th style={{ padding: '10px 8px' }}>Date</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {filteredScores.map((scoreObj, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: idx === 0 ? 'var(--accent)' : idx === 1 ? '#E5E7EB' : idx === 2 ? '#CD7F32' : '#FFF' }}>
                  <td style={{ padding: '12px 8px' }}>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}</td>
                  <td style={{ padding: '12px 8px' }}>{scoreObj.name}</td>
                  <td style={{ padding: '12px 8px', textTransform: 'uppercase', fontSize: '0.8rem', color: scoreObj.difficulty === 'hard' ? '#FF3B30' : scoreObj.difficulty === 'medium' ? 'var(--primary)' : 'var(--text-secondary)' }}>
                    {scoreObj.difficulty}
                  </td>
                  <td style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{scoreObj.date}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700 }}>{scoreObj.score} Runs</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* History Log */}
      <div className="glass-panel" style={{ padding: '25px', cursor: 'none' }}>
        <h3 style={{ fontFamily: 'var(--font-headings)', fontSize: '1.9rem', color: '#FFFFFF', marginBottom: '22px', letterSpacing: '1px' }}>
          ⏳ RECENT MATCH HISTORY LOGS
        </h3>

        {matchLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            No matches played yet. Enter the play section to register logs!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto', paddingRight: '6px' }}>
            {matchLogs.slice(0, 20).map((log, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.015)',
                  border: '1px solid rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  padding: '14px 18px',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '0.94rem',
                }}
              >
                <div>
                  <span style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{log.name}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', marginLeft: '12px', padding: '3px 7px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', fontWeight: 700 }}>
                    {log.mode} &bull; {log.difficulty}
                  </span>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {log.date} &bull; RR: {log.balls > 0 ? ((log.score / log.balls) * 6).toFixed(1) : '0.0'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: log.status === 'Won' ? 'var(--primary)' : log.status === 'Lost' ? '#FF3B30' : '#FFFFFF', fontWeight: 700, fontSize: '1.25rem' }}>
                    {log.score} Runs
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, marginTop: '2px' }}>
                    {log.status === 'Won' ? '🏆 Chased Target' : log.status === 'Lost' ? '❌ Defeated' : '🎳 Bowled Out'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
