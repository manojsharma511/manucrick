import { useState, useEffect } from 'react';
import { ARCADE_GAMES } from '../../data/arcadeGames';
import type { ArcadeGameId } from '../../data/arcadeGames';
import { getArcadeSummary, getArcadeScores, getArcadeBestScoreByGame } from '../../utils/arcadeStorage';
import type { ArcadeScoreRecord } from '../../utils/arcadeStorage';

// Game Components
import CarRacingGame from './CarRacingGame';
import BikeRacingGame from './BikeRacingGame';
import ZombieSurvivalGame from './ZombieSurvivalGame';
import CityHeistChaseGame from './CityHeistChaseGame';
import OffroadRallyGame from './OffroadRallyGame';
import NeonRunnerGame from './NeonRunnerGame';

export default function ArcadeHub() {
  const [activeGameId, setActiveGameId] = useState<ArcadeGameId | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState<string>('All');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  
  // Dashboard stats
  const [summary, setSummary] = useState(getArcadeSummary());
  const [recentPlays, setRecentPlays] = useState<ArcadeScoreRecord[]>([]);
  const [bestScores, setBestScores] = useState<Record<string, number>>({});

  const loadStats = () => {
    setSummary(getArcadeSummary());
    setRecentPlays(getArcadeScores().slice(0, 5));
    
    // Get all best scores
    const best = getArcadeBestScoreByGame();
    setBestScores(best as Record<string, number>);
  };

  useEffect(() => {
    loadStats();
  }, [activeGameId]);

  const handleLaunchGame = (gameId: ArcadeGameId) => {
    setActiveGameId(gameId);
  };

  const handleExitGame = () => {
    setActiveGameId(null);
  };

  const handleSessionRecorded = () => {
    loadStats();
  };

  // Filter games catalog
  const filteredGames = ARCADE_GAMES.filter((game) => {
    const matchesSearch =
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.genre.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesGenre = genreFilter === 'All' || game.genre === genreFilter;
    const matchesDifficulty = difficultyFilter === 'All' || game.difficulty === difficultyFilter;

    return matchesSearch && matchesGenre && matchesDifficulty;
  });

  // Extract unique genres for filter buttons
  const genres = ['All', ...Array.from(new Set(ARCADE_GAMES.map((g) => g.genre)))];
  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  // Render active game if selected
  if (activeGameId === 'car-racing') {
    return <CarRacingGame onExit={handleExitGame} onSessionRecorded={handleSessionRecorded} />;
  }
  if (activeGameId === 'bike-racing') {
    return <BikeRacingGame onExit={handleExitGame} onSessionRecorded={handleSessionRecorded} />;
  }
  if (activeGameId === 'zombie-survival') {
    return <ZombieSurvivalGame onExit={handleExitGame} onSessionRecorded={handleSessionRecorded} />;
  }
  if (activeGameId === 'city-heist-chase') {
    return <CityHeistChaseGame onExit={handleExitGame} onSessionRecorded={handleSessionRecorded} />;
  }
  if (activeGameId === 'offroad-rally') {
    return <OffroadRallyGame onExit={handleExitGame} onSessionRecorded={handleSessionRecorded} />;
  }
  if (activeGameId === 'neon-runner') {
    return <NeonRunnerGame onExit={handleExitGame} onSessionRecorded={handleSessionRecorded} />;
  }

  // Convert hex color to rgba color for card shadows
  const getRGBAccent = (hex: string) => {
    if (hex === '#00FF87') return '0, 255, 135';
    if (hex === '#10B981') return '16, 185, 129';
    if (hex === '#FFD700') return '255, 215, 0';
    if (hex === '#FF6B00') return '255, 107, 0';
    if (hex === '#7DD3FC') return '125, 211, 252';
    return '0, 255, 135';
  };

  return (
    <div className="arcade-hub scroll-animate">
      {/* 1. Header Banner */}
      <div className="section-title-wrapper" style={{ marginBottom: '40px' }}>
        <h2 style={{ fontFamily: 'var(--font-headings)', fontSize: '3rem', color: '#FFF' }}>
          🕹️ RETRO ARCADE CHAMPIONSHIP
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '4px', letterSpacing: '1px', textTransform: 'uppercase' }}>
          FIVE FULL-SCREEN MULTIPLAYER CHALLENGES &bull; MATHEMATICALLY PRECISE REFLEX SIMULATORS
        </p>
      </div>

      {/* 2. Stats Dashboard Overview */}
      <div className="arcade-stats-panel">
        <div className="arcade-stat-card">
          <div style={{ fontSize: '2rem', marginBottom: '6px' }}>🎮</div>
          <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-headings)', color: 'var(--primary)' }}>
            {summary.totalPlayCount} Runs
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>
            Total Arcade Plays
          </div>
        </div>

        <div className="arcade-stat-card">
          <div style={{ fontSize: '2rem', marginBottom: '6px' }}>⚡</div>
          <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-headings)', color: 'var(--secondary)' }}>
            {summary.topScore} pts
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>
            Personal All-Time Best
          </div>
        </div>

        <div className="arcade-stat-card">
          <div style={{ fontSize: '2rem', marginBottom: '6px' }}>🔥</div>
          <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-headings)', color: '#FFF' }}>
            {summary.topPlayedGameId
              ? ARCADE_GAMES.find((g) => g.id === summary.topPlayedGameId)?.title.replace('Neon ', '').replace('Street ', '')
              : 'N/A'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>
            Most Popular Game
          </div>
        </div>
      </div>

      {/* 3. Search & Quick Filters */}
      <div className="arcade-filters">
        {/* Search */}
        <input
          type="text"
          placeholder="Search games..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="arcade-search-input interactive"
        />

        {/* Filters Group */}
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          {/* Genre Filters */}
          <div style={{ display: 'flex', gap: '5px', background: 'rgba(255, 255, 255, 0.02)', padding: '4px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setGenreFilter(g)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: genreFilter === g ? 'var(--primary)' : 'transparent',
                  color: genreFilter === g ? '#050A18' : '#FFF',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  cursor: 'none',
                  transition: 'all 0.2s',
                }}
                className="interactive"
              >
                {g}
              </button>
            ))}
          </div>

          {/* Difficulty Filters */}
          <div style={{ display: 'flex', gap: '5px', background: 'rgba(255, 255, 255, 0.02)', padding: '4px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            {difficulties.map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(diff)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: difficultyFilter === diff ? 'var(--secondary)' : 'transparent',
                  color: difficultyFilter === diff ? '#050A18' : '#FFF',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  cursor: 'none',
                  transition: 'all 0.2s',
                }}
                className="interactive"
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Games Catalog Grid */}
      <div className="arcade-grid">
        {filteredGames.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', fontWeight: 600 }}>
            No games match the selected filters. Clear search query to reset.
          </div>
        ) : (
          filteredGames.map((game) => {
            const bestScore = bestScores[game.id] ?? 0;
            return (
              <div
                key={game.id}
                className="arcade-card interactive"
                style={{
                  '--card-accent': game.accent,
                  '--card-accent-rgb': getRGBAccent(game.accent),
                } as any}
                onClick={() => handleLaunchGame(game.id)}
              >
                <div>
                  <div className="arcade-card-emoji">{game.emoji}</div>
                  <h3 style={{ fontSize: '1.5rem', color: '#FFF', marginBottom: '8px' }}>{game.title}</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {game.description}
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '12px 0 6px 0' }}>
                    {game.keyboardControls.slice(0, 2).map((ctrl) => (
                      <span
                        key={ctrl}
                        style={{
                          fontSize: '0.72rem',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          color: '#FFF',
                        }}
                      >
                        {ctrl.split(' ')[0]}
                      </span>
                    ))}
                  </div>

                  <div className="arcade-card-meta">
                    <span className={`arcade-difficulty-badge ${game.difficulty.toLowerCase()}`}>
                      {game.difficulty}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                      Best: <strong style={{ color: game.accent }}>{bestScore}</strong>
                    </span>
                  </div>

                  <button className="arcade-card-button" style={{ width: '100%', marginTop: '15px' }}>
                    LAUNCH GAME
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Recent Arcade Runs Panel */}
      <div className="glass-panel" style={{ padding: '25px', cursor: 'none' }}>
        <h3 style={{ fontFamily: 'var(--font-headings)', fontSize: '1.8rem', color: '#FFFFFF', marginBottom: '20px', letterSpacing: '1px' }}>
          ⏳ RECENT ARCADE RUNS LOG
        </h3>

        {recentPlays.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)', fontWeight: 600 }}>
            No arcade sessions recorded yet. Launch a mini-game to play!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentPlays.map((play) => (
              <div
                key={play.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.015)',
                  border: '1px solid rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  padding: '12px 18px',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '0.94rem',
                }}
              >
                <div>
                  <span style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{play.gameTitle}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', marginLeft: '12px', padding: '3px 7px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', fontWeight: 700 }}>
                    Duration: {play.durationSeconds}s
                  </span>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {new Date(play.createdAt).toLocaleString()}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.15rem' }}>
                    {play.score} pts
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
