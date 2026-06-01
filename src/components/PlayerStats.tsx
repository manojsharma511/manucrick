import React, { useState, useEffect } from 'react';

// Profiles interface
interface PlayerProfile {
  id: string;
  name: string;
  team: string;
  battingStyle: 'Right Hand Batsman' | 'Left Hand Batsman';
  bowlingStyle: 'Right-arm Fast' | 'Left-arm Fast' | 'Right-arm Spin' | 'Left-arm Spin' | 'None';
  avatar: string; // Emoji
}

// Manual stats entry
interface ManualPerformance {
  playerId: string;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  ballsBowled: number;
  runsConceded: number;
  wickets: number;
  date: string;
}

// Aggregated Stats
interface AggregatedStats {
  id: string;
  name: string;
  team: string;
  avatar: string;
  battingStyle: string;
  bowlingStyle: string;
  // Batting
  matches: number;
  batInnings: number;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  outs: number;
  highestScore: number;
  batAvg: number;
  batSR: number;
  // Bowling
  bowlInnings: number;
  ballsBowled: number;
  runsConceded: number;
  wickets: number;
  bowlAvg: number;
  bowlEcon: number;
}

const AVATARS = ["🏏", "🥎", "🔥", "⚡", "👑", "🦁", "🐯", "🦅", "🎯", "🚀", "🦊", "🐻", "🦾", "🎩", "🕶️", "🦸"];

export function PlayerStats() {
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [manualStats, setManualStats] = useState<ManualPerformance[]>([]);
  const [aggregatedStats, setAggregatedStats] = useState<AggregatedStats[]>([]);
  
  // UI Tab switching
  const [activeTab, setActiveTab] = useState<'stats' | 'leaderboard' | 'create' | 'log'>('stats');
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('All');
  
  // Create Profile states
  const [newName, setNewName] = useState('');
  const [newTeam, setNewTeam] = useState('');
  const [newBatStyle, setNewBatStyle] = useState<'Right Hand Batsman' | 'Left Hand Batsman'>('Right Hand Batsman');
  const [newBowlStyle, setNewBowlStyle] = useState<PlayerProfile['bowlingStyle']>('Right-arm Fast');
  const [newAvatar, setNewAvatar] = useState('🏏');

  // Manual Log stats states
  const [logPlayerId, setLogPlayerId] = useState('');
  const [logRuns, setLogRuns] = useState(0);
  const [logBallsFaced, setLogBallsFaced] = useState(0);
  const [logFours, setLogFours] = useState(0);
  const [logSixes, setLogSixes] = useState(0);
  const [logIsOut, setLogIsOut] = useState(true);
  const [logBallsBowled, setLogBallsBowled] = useState(0);
  const [logRunsConceded, setLogRunsConceded] = useState(0);
  const [logWickets, setLogWickets] = useState(0);

  // Selected player for detail card modal
  const [selectedPlayerCard, setSelectedPlayerCard] = useState<AggregatedStats | null>(null);

  // Load profile data and manual stats
  useEffect(() => {
    loadData();
  }, []);

  // Recalculate whenever profiles, manual stats, or scorer matches change
  useEffect(() => {
    rebuildStats();
  }, [profiles, manualStats]);

  const loadData = () => {
    // 1. Load Profiles
    const savedProfiles = localStorage.getItem('manucrick_custom_players');
    let loadedProfiles: PlayerProfile[] = [];
    if (savedProfiles) {
      try {
        loadedProfiles = JSON.parse(savedProfiles);
      } catch (e) {
        console.error(e);
      }
    } else {
      // Default initial local players
      loadedProfiles = [
        { id: 'p_1', name: 'Manoj Kumar', team: 'Team Manoj', battingStyle: 'Right Hand Batsman', bowlingStyle: 'Right-arm Fast', avatar: '👑' },
        { id: 'p_2', name: 'Ramesh', team: 'Team Ramesh', battingStyle: 'Right Hand Batsman', bowlingStyle: 'Right-arm Spin', avatar: '🔥' },
        { id: 'p_3', name: 'Ajay Sharma', team: 'Team Manoj', battingStyle: 'Left Hand Batsman', bowlingStyle: 'None', avatar: '🦁' },
        { id: 'p_4', name: 'Suresh', team: 'Team Ramesh', battingStyle: 'Left Hand Batsman', bowlingStyle: 'Right-arm Fast', avatar: '⚡' }
      ];
      localStorage.setItem('manucrick_custom_players', JSON.stringify(loadedProfiles));
    }
    setProfiles(loadedProfiles);

    // 2. Load Manual Stats
    const savedManual = localStorage.getItem('manucrick_manual_stats');
    if (savedManual) {
      try {
        setManualStats(JSON.parse(savedManual));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const rebuildStats = () => {
    const playerMap: Record<string, AggregatedStats> = {};

    // Helper to init aggregated player item
    const initPlayerStats = (id: string, name: string, team: string, avatar: string, batStyle: string, bowlStyle: string): AggregatedStats => ({
      id, name, team, avatar, battingStyle: batStyle, bowlingStyle: bowlStyle,
      matches: 0, batInnings: 0, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, outs: 0, highestScore: 0, batSR: 0, batAvg: 0,
      bowlInnings: 0, ballsBowled: 0, runsConceded: 0, wickets: 0, bowlAvg: 0, bowlEcon: 0
    });

    // Populate using custom profiles
    profiles.forEach(p => {
      playerMap[p.name.toLowerCase()] = initPlayerStats(p.id, p.name, p.team, p.avatar, p.battingStyle, p.bowlingStyle);
    });

    // Parse Scorer Matches from localStorage
    const savedMatches = localStorage.getItem('manucrick_local_matches');
    if (savedMatches) {
      try {
        const matchesList = JSON.parse(savedMatches);
        // Only process completed matches
        const completedMatches = matchesList.filter((m: any) => m.status === 'completed');

        completedMatches.forEach((match: any) => {
          // Track unique players active in this match to increment their matches count
          const matchPlayers = new Set<string>();

          // Aggregate Batting Stats from Inning 1 & Inning 2
          [match.teamAScore, match.teamBScore].forEach((innings: any) => {
            if (!innings) return;
            
            // Batting
            Object.values(innings.batsmenStats || {}).forEach((bat: any) => {
              const nameLower = bat.name.toLowerCase();
              matchPlayers.add(nameLower);

              // If player profile doesn't exist, auto create one
              if (!playerMap[nameLower]) {
                const tempId = 'auto_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
                const teamName = match.teamAScore.batsmenStats[bat.name] ? match.teamA : match.teamB;
                playerMap[nameLower] = initPlayerStats(tempId, bat.name, teamName, '🏏', 'Right Hand Batsman', 'None');
              }

              const stats = playerMap[nameLower];
              stats.batInnings += 1;
              stats.runs += bat.runs;
              stats.ballsFaced += bat.ballsFaced;
              stats.fours += bat.fours;
              stats.sixes += bat.sixes;
              if (bat.status === 'out') {
                stats.outs += 1;
              }
              if (bat.runs > stats.highestScore) {
                stats.highestScore = bat.runs;
              }
            });

            // Bowling
            Object.values(innings.bowlerStats || {}).forEach((bowl: any) => {
              const nameLower = bowl.name.toLowerCase();
              matchPlayers.add(nameLower);

              if (!playerMap[nameLower]) {
                const tempId = 'auto_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
                const teamName = match.teamAScore.bowlerStats[bowl.name] ? match.teamA : match.teamB;
                playerMap[nameLower] = initPlayerStats(tempId, bowl.name, teamName, '🏏', 'Right Hand Batsman', 'Right-arm Fast');
              }

              const stats = playerMap[nameLower];
              stats.bowlInnings += 1;
              stats.ballsBowled += bowl.ballsBowled;
              stats.runsConceded += bowl.runsConceded;
              stats.wickets += bowl.wickets;
            });
          });

          // Increment match count for all players who played
          matchPlayers.forEach((nameLower) => {
            if (playerMap[nameLower]) {
              playerMap[nameLower].matches += 1;
            }
          });
        });
      } catch (e) {
        console.error("Error aggregating scorer matches", e);
      }
    }

    // Parse Manual Stats entries
    manualStats.forEach(log => {
      // Find profile by ID
      const profile = profiles.find(p => p.id === log.playerId);
      if (!profile) return;

      const nameLower = profile.name.toLowerCase();
      if (!playerMap[nameLower]) {
        playerMap[nameLower] = initPlayerStats(profile.id, profile.name, profile.team, profile.avatar, profile.battingStyle, profile.bowlingStyle);
      }

      const stats = playerMap[nameLower];
      stats.matches += 1;
      
      // Batting log check
      if (log.ballsFaced > 0 || log.runs > 0) {
        stats.batInnings += 1;
        stats.runs += log.runs;
        stats.ballsFaced += log.ballsFaced;
        stats.fours += log.fours;
        stats.sixes += log.sixes;
        if (log.isOut) stats.outs += 1;
        if (log.runs > stats.highestScore) stats.highestScore = log.runs;
      }

      // Bowling log check
      if (log.ballsBowled > 0) {
        stats.bowlInnings += 1;
        stats.ballsBowled += log.ballsBowled;
        stats.runsConceded += log.runsConceded;
        stats.wickets += log.wickets;
      }
    });

    // Run calculations for rates/averages
    const finalArray = Object.values(playerMap).map(stats => {
      // Batting Average
      if (stats.outs === 0) {
        stats.batAvg = stats.runs; // Unbeaten average
      } else {
        stats.batAvg = parseFloat((stats.runs / stats.outs).toFixed(2));
      }

      // Strike Rate
      if (stats.ballsFaced === 0) {
        stats.batSR = 0.0;
      } else {
        stats.batSR = parseFloat(((stats.runs / stats.ballsFaced) * 100).toFixed(1));
      }

      // Bowling Average
      if (stats.wickets === 0) {
        stats.bowlAvg = stats.runsConceded;
      } else {
        stats.bowlAvg = parseFloat((stats.runsConceded / stats.wickets).toFixed(2));
      }

      // Economy
      if (stats.ballsBowled === 0) {
        stats.bowlEcon = 0.0;
      } else {
        stats.bowlEcon = parseFloat(((stats.runsConceded / stats.ballsBowled) * 6).toFixed(2));
      }

      return stats;
    });

    setAggregatedStats(finalArray);
  };

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newTeam.trim()) {
      alert("Please fill in player Name and Team!");
      return;
    }

    // Check duplicate name
    if (profiles.some(p => p.name.toLowerCase() === newName.trim().toLowerCase())) {
      alert("A player profile with this name already exists!");
      return;
    }

    const newProfile: PlayerProfile = {
      id: 'p_' + Date.now(),
      name: newName.trim(),
      team: newTeam.trim(),
      battingStyle: newBatStyle,
      bowlingStyle: newBowlStyle,
      avatar: newAvatar
    };

    const updated = [...profiles, newProfile];
    localStorage.setItem('manucrick_custom_players', JSON.stringify(updated));
    setProfiles(updated);
    
    // Reset form
    setNewName('');
    setNewTeam('');
    setNewAvatar('🏏');
    
    alert("Player Profile Created Successfully!");
    setActiveTab('stats');
  };

  const handleLogManualStats = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logPlayerId) {
      alert("Please select a Player!");
      return;
    }

    const newLog: ManualPerformance = {
      playerId: logPlayerId,
      runs: logRuns,
      ballsFaced: logBallsFaced,
      fours: logFours,
      sixes: logSixes,
      isOut: logIsOut,
      ballsBowled: logBallsBowled,
      runsConceded: logRunsConceded,
      wickets: logWickets,
      date: new Date().toLocaleDateString()
    };

    const updated = [...manualStats, newLog];
    localStorage.setItem('manucrick_manual_stats', JSON.stringify(updated));
    setManualStats(updated);

    // Reset Form
    setLogRuns(0);
    setLogBallsFaced(0);
    setLogFours(0);
    setLogSixes(0);
    setLogBallsBowled(0);
    setLogRunsConceded(0);
    setLogWickets(0);
    setLogIsOut(true);

    alert("Match stats logged successfully for player!");
    setActiveTab('stats');
  };

  // Filter and Search players list
  const filteredPlayers = aggregatedStats.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.team.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTeam = teamFilter === 'All' || p.team.toLowerCase() === teamFilter.toLowerCase();
    return matchesSearch && matchesTeam;
  });

  // Extract unique team names for filter dropdown
  const uniqueTeams = Array.from(new Set(aggregatedStats.map(p => p.team))).filter(Boolean);

  // Sorting metrics for Leaderboards
  const topRunScorers = [...aggregatedStats].sort((a, b) => b.runs - a.runs).slice(0, 5);
  const topWicketTakers = [...aggregatedStats].sort((a, b) => b.wickets - a.wickets).slice(0, 5);
  const bestStrikeRates = [...aggregatedStats]
    .filter(p => p.runs >= 20) // Qualification: Min 20 runs
    .sort((a, b) => b.batSR - a.batSR)
    .slice(0, 5);
  const bestEconomies = [...aggregatedStats]
    .filter(p => p.ballsBowled >= 12) // Qualification: Min 2 overs
    .sort((a, b) => a.bowlEcon - b.bowlEcon)
    .slice(0, 5);

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', color: '#FFF' }}>
      
      {/* TABS CONTROLS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          {(['stats', 'leaderboard', 'create', 'log'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 18px',
                borderRadius: '6px',
                border: activeTab === tab ? '1.5px solid var(--primary)' : '1px solid rgba(255,255,255,0.06)',
                backgroundColor: activeTab === tab ? 'rgba(0, 255, 135, 0.08)' : 'rgba(5, 10, 24, 0.4)',
                color: activeTab === tab ? '#FFFFFF' : 'var(--text-secondary)',
                fontSize: '1rem',
                fontFamily: 'var(--font-headings)',
                letterSpacing: '1px',
                fontWeight: 700,
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              className="interactive"
            >
              {tab === 'stats' && '📋 Season Stats'}
              {tab === 'leaderboard' && '🏆 Leaderboard'}
              {tab === 'create' && '👤 Add Player'}
              {tab === 'log' && '📝 Log Match Performance'}
            </button>
          ))}
        </div>
      </div>

      {/* TAB VIEW 1: PLAYER SEASON STATS LIST */}
      {activeTab === 'stats' && (
        <div className="glass-panel" style={{ padding: '24px', animation: 'tabTransition 0.4s ease-out' }}>
          
          {/* SEARCH & FILTERS ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }} className="responsive-grid-2">
            <div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search player name or team..."
                className="premium-input"
                style={{ marginTop: 0 }}
              />
            </div>
            <div>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="premium-input"
                style={{ marginTop: 0 }}
              >
                <option value="All">All Teams</option>
                {uniqueTeams.map((team, idx) => (
                  <option key={idx} value={team} style={{ backgroundColor: '#0B0F1C' }}>{team}</option>
                ))}
              </select>
            </div>
          </div>

          {/* STATS TABLE */}
          <div className="table-scroll-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.08)', color: 'var(--primary)' }}>
                  <th style={{ padding: '12px 10px' }}>Player</th>
                  <th style={{ padding: '12px 10px' }}>Team</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>Matches</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center', color: 'var(--accent)' }}>Runs</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>Avg</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>S/R</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>H/S</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center', color: 'var(--secondary)' }}>Wickets</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>Econ</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.length > 0 ? (
                  filteredPlayers.map((player) => (
                    <tr 
                      key={player.id} 
                      style={{ 
                        borderBottom: '1px solid rgba(255,255,255,0.05)', 
                        transition: 'background 0.2s', 
                      }}
                      className="table-row-hover"
                    >
                      <td style={{ padding: '14px 10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.4rem' }}>{player.avatar}</span>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '0.98rem', color: '#FFF' }}>{player.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{player.battingStyle}</div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 10px' }}>{player.team}</td>
                      <td style={{ padding: '14px 10px', textAlign: 'center', fontWeight: 'bold' }}>{player.matches}</td>
                      <td style={{ padding: '14px 10px', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent)', fontSize: '1.05rem' }}>{player.runs}</td>
                      <td style={{ padding: '14px 10px', textAlign: 'center' }}>{player.batAvg}</td>
                      <td style={{ padding: '14px 10px', textAlign: 'center' }}>{player.batSR}</td>
                      <td style={{ padding: '14px 10px', textAlign: 'center', fontWeight: 'bold' }}>{player.highestScore}</td>
                      <td style={{ padding: '14px 10px', textAlign: 'center', fontWeight: 'bold', color: 'var(--secondary)', fontSize: '1.05rem' }}>{player.wickets}</td>
                      <td style={{ padding: '14px 10px', textAlign: 'center' }}>{player.bowlEcon}</td>
                      <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                        <button
                          onClick={() => setSelectedPlayerCard(player)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '4px',
                            border: '1px solid var(--primary)',
                            backgroundColor: 'transparent',
                            color: 'var(--primary)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                          }}
                          className="interactive"
                        >
                          🎫 Card
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      No players found matching current search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB VIEW 2: LEADERBOARDS PODIUM */}
      {activeTab === 'leaderboard' && (
        <div style={{ animation: 'tabTransition 0.4s ease-out' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '25px' }} className="responsive-grid-2">
            
            {/* Batting: Most Runs */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--accent)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px', marginBottom: '15px' }}>
                🏏 MOST RUNS (SEASON ORANGE CAP)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {topRunScorers.map((player, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255, 107, 0, 0.03)', borderLeft: `3px solid ${idx === 0 ? 'var(--secondary)' : 'rgba(255, 255, 255, 0.1)'}`, borderRadius: '4px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 'bold', width: '20px' }}>{idx + 1}.</span>
                      <span style={{ fontSize: '1.3rem' }}>{player.avatar}</span>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#FFF' }}>{player.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{player.team}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--secondary)' }}>{player.runs} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Runs</span></div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Avg: {player.batAvg}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bowling: Most Wickets */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px', marginBottom: '15px' }}>
                🥎 MOST WICKETS (SEASON PURPLE CAP)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {topWicketTakers.map((player, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(0, 255, 135, 0.03)', borderLeft: `3px solid ${idx === 0 ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)'}`, borderRadius: '4px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 'bold', width: '20px' }}>{idx + 1}.</span>
                      <span style={{ fontSize: '1.3rem' }}>{player.avatar}</span>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#FFF' }}>{player.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{player.team}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--primary)' }}>{player.wickets} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Wickets</span></div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Econ: {player.bowlEcon}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }} className="responsive-grid-2">
            
            {/* Batting: Best Strike Rate */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.4rem', color: '#00F0FF', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px', marginBottom: '15px' }}>
                🚀 HIGHEST STRIKE RATE (MIN 20 RUNS)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {bestStrikeRates.map((player, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(0, 240, 255, 0.03)', borderLeft: `3px solid ${idx === 0 ? '#00F0FF' : 'rgba(255, 255, 255, 0.1)'}`, borderRadius: '4px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 'bold', width: '20px' }}>{idx + 1}.</span>
                      <span style={{ fontSize: '1.3rem' }}>{player.avatar}</span>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#FFF' }}>{player.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{player.team}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#00F0FF' }}>{player.batSR}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{player.runs} Runs / {player.ballsFaced} Balls</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bowling: Best Economy */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.4rem', color: '#FFE135', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px', marginBottom: '15px' }}>
                🎯 BEST ECONOMY RATE (MIN 2 OVERS)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {bestEconomies.map((player, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255, 225, 53, 0.03)', borderLeft: `3px solid ${idx === 0 ? '#FFE135' : 'rgba(255, 255, 255, 0.1)'}`, borderRadius: '4px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 'bold', width: '20px' }}>{idx + 1}.</span>
                      <span style={{ fontSize: '1.3rem' }}>{player.avatar}</span>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#FFF' }}>{player.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{player.team}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#FFE135' }}>{player.bowlEcon}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{Math.floor(player.ballsBowled / 6)}.{player.ballsBowled % 6} Overs bowled</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB VIEW 3: CREATE PROFILE */}
      {activeTab === 'create' && (
        <div className="glass-panel" style={{ padding: '30px', maxWidth: '600px', margin: '0 auto', animation: 'tabTransition 0.4s ease-out' }}>
          <h3 style={{ fontSize: '1.6rem', color: 'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px', marginBottom: '20px' }}>
            CREATE NEW PLAYER PROFILE
          </h3>
          <form onSubmit={handleCreateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Player Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Pappu Kumar"
                className="premium-input"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Team Name</label>
              <input
                type="text"
                required
                value={newTeam}
                onChange={(e) => setNewTeam(e.target.value)}
                placeholder="e.g. Gully Gang XI"
                className="premium-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }} className="responsive-grid-2">
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Batting Style</label>
                <select
                  value={newBatStyle}
                  onChange={(e: any) => setNewBatStyle(e.target.value)}
                  className="premium-input"
                >
                  <option value="Right Hand Batsman" style={{ backgroundColor: '#0B0F1C' }}>Right Hand Batsman (RHB)</option>
                  <option value="Left Hand Batsman" style={{ backgroundColor: '#0B0F1C' }}>Left Hand Batsman (LHB)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Bowling Style</label>
                <select
                  value={newBowlStyle}
                  onChange={(e: any) => setNewBowlStyle(e.target.value)}
                  className="premium-input"
                >
                  <option value="Right-arm Fast" style={{ backgroundColor: '#0B0F1C' }}>Right-arm Fast</option>
                  <option value="Left-arm Fast" style={{ backgroundColor: '#0B0F1C' }}>Left-arm Fast</option>
                  <option value="Right-arm Spin" style={{ backgroundColor: '#0B0F1C' }}>Right-arm Spin</option>
                  <option value="Left-arm Spin" style={{ backgroundColor: '#0B0F1C' }}>Left-arm Spin</option>
                  <option value="None" style={{ backgroundColor: '#0B0F1C' }}>None (Pure Batsman)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Select Avatar Emoji</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', backgroundColor: 'rgba(5, 10, 24, 0.4)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setNewAvatar(av)}
                    style={{
                      fontSize: '1.6rem',
                      background: 'none',
                      border: newAvatar === av ? '2px solid var(--primary)' : '2px solid transparent',
                      borderRadius: '8px',
                      width: '45px',
                      height: '45px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: newAvatar === av ? 'rgba(0, 255, 135, 0.08)' : 'transparent',
                    }}
                    className="interactive"
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              style={{
                marginTop: '15px',
                padding: '12px 0',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--primary)',
                color: '#050A18',
                fontFamily: 'var(--font-headings)',
                fontSize: '1.3rem',
                letterSpacing: '1px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 0 15px rgba(0, 255, 135, 0.35)',
              }}
              className="interactive"
            >
              🚀 CREATE PROFILE
            </button>
          </form>
        </div>
      )}

      {/* TAB VIEW 4: LOG MANUAL STATS */}
      {activeTab === 'log' && (
        <div className="glass-panel" style={{ padding: '30px', maxWidth: '650px', margin: '0 auto', animation: 'tabTransition 0.4s ease-out' }}>
          <h3 style={{ fontSize: '1.6rem', color: 'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px', marginBottom: '20px' }}>
            LOG OFFLINE MATCH PERFORMANCE
          </h3>
          <form onSubmit={handleLogManualStats} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Select Player</label>
              <select
                required
                value={logPlayerId}
                onChange={(e) => setLogPlayerId(e.target.value)}
                className="premium-input"
              >
                <option value="">-- Choose Player --</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id} style={{ backgroundColor: '#0B0F1C' }}>
                    {p.name} ({p.team})
                  </option>
                ))}
              </select>
            </div>

            {/* Batting performance card */}
            <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '16px', backgroundColor: 'rgba(255, 107, 0, 0.02)' }}>
              <h4 style={{ color: 'var(--secondary)', fontSize: '1.05rem', marginBottom: '12px', borderBottom: '1px dashed rgba(255,255,255,0.06)', paddingBottom: '4px' }}>BATTING RECORD</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }} className="responsive-grid-2">
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Runs Scored</label>
                  <input type="number" min="0" value={logRuns} onChange={(e) => setLogRuns(Math.max(0, parseInt(e.target.value) || 0))} className="premium-input" style={{ padding: '8px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Balls Faced</label>
                  <input type="number" min="0" value={logBallsFaced} onChange={(e) => setLogBallsFaced(Math.max(0, parseInt(e.target.value) || 0))} className="premium-input" style={{ padding: '8px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Dismissal</label>
                  <select value={logIsOut ? 'true' : 'false'} onChange={(e) => setLogIsOut(e.target.value === 'true')} className="premium-input" style={{ padding: '8px' }}>
                    <option value="true" style={{ backgroundColor: '#0B0F1C' }}>Out</option>
                    <option value="false" style={{ backgroundColor: '#0B0F1C' }}>Not Out</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="responsive-grid-2">
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Fours (4s)</label>
                  <input type="number" min="0" value={logFours} onChange={(e) => setLogFours(Math.max(0, parseInt(e.target.value) || 0))} className="premium-input" style={{ padding: '8px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Sixes (6s)</label>
                  <input type="number" min="0" value={logSixes} onChange={(e) => setLogSixes(Math.max(0, parseInt(e.target.value) || 0))} className="premium-input" style={{ padding: '8px' }} />
                </div>
              </div>
            </div>

            {/* Bowling performance card */}
            <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '16px', backgroundColor: 'rgba(0, 255, 135, 0.02)' }}>
              <h4 style={{ color: 'var(--primary)', fontSize: '1.05rem', marginBottom: '12px', borderBottom: '1px dashed rgba(255,255,255,0.06)', paddingBottom: '4px' }}>BOWLING RECORD</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Balls Bowled</label>
                  <input type="number" min="0" value={logBallsBowled} onChange={(e) => setLogBallsBowled(Math.max(0, parseInt(e.target.value) || 0))} className="premium-input" style={{ padding: '8px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Runs Conceded</label>
                  <input type="number" min="0" value={logRunsConceded} onChange={(e) => setLogRunsConceded(Math.max(0, parseInt(e.target.value) || 0))} className="premium-input" style={{ padding: '8px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Wickets Taken</label>
                  <input type="number" min="0" max="10" value={logWickets} onChange={(e) => setLogWickets(Math.max(0, parseInt(e.target.value) || 0))} className="premium-input" style={{ padding: '8px' }} />
                </div>
              </div>
            </div>

            <button
              type="submit"
              style={{
                marginTop: '10px',
                padding: '12px 0',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--primary)',
                color: '#050A18',
                fontFamily: 'var(--font-headings)',
                fontSize: '1.3rem',
                letterSpacing: '1px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 0 15px rgba(0, 255, 135, 0.35)',
              }}
              className="interactive"
            >
              📝 LOG MATCH STATS
            </button>
          </form>
        </div>
      )}

      {/* INDIVIDUAL PLAYER STATS CARD OVERLAY MODAL */}
      {selectedPlayerCard && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(5, 10, 24, 0.9)', backdropFilter: 'blur(16px)', zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          
          {/* Stunning Trading Card Frame */}
          <div 
            className="glass-panel"
            style={{ 
              width: '100%', 
              maxWidth: '380px', 
              padding: '24px', 
              position: 'relative', 
              border: '2px solid var(--primary)', 
              boxShadow: '0 0 35px rgba(0, 255, 135, 0.25)', 
              background: 'linear-gradient(135deg, rgba(19, 22, 42, 0.95) 0%, rgba(5, 10, 24, 0.98) 100%)',
              textAlign: 'center',
              animation: 'tabTransition 0.5s cubic-bezier(0.1, 0.8, 0.1, 1)',
              overflow: 'hidden'
            }}
          >
            {/* Glowing Accent lines inside card */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '5px', background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }} />
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedPlayerCard(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                color: '#FFF',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              className="interactive"
            >
              ✕
            </button>

            {/* Avatar Badge */}
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '2.5px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', margin: '15px auto 10px', boxShadow: '0 0 20px rgba(0, 255, 135, 0.2)' }}>
              {selectedPlayerCard.avatar}
            </div>

            {/* Name & Team info */}
            <h3 style={{ fontSize: '2.2rem', color: '#FFF', letterSpacing: '1px', marginBottom: '2px', fontFamily: 'var(--font-headings)' }}>
              {selectedPlayerCard.name.toUpperCase()}
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }}>
              🛡️ {selectedPlayerCard.team}
            </span>

            {/* Roles detail */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '8px 0 18px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <span>🏏 {selectedPlayerCard.battingStyle}</span>
              <span>•</span>
              <span>🥎 {selectedPlayerCard.bowlingStyle}</span>
            </div>

            {/* STADIUM STATS ROW 1: BATTING */}
            <div style={{ backgroundColor: 'rgba(255, 107, 0, 0.03)', border: '1px solid rgba(255, 107, 0, 0.1)', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--secondary)', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px dashed rgba(255,107,0,0.1)', paddingBottom: '3px' }}>
                <span>batting records</span>
                <span>matches: {selectedPlayerCard.matches}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px' }}>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#FFF' }}>{selectedPlayerCard.runs}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Runs</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#FFF' }}>{selectedPlayerCard.batAvg}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Average</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#FFF' }}>{selectedPlayerCard.highestScore}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Highest</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#FFF' }}>{selectedPlayerCard.batSR}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Strike Rate</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                <span>4s: <strong>{selectedPlayerCard.fours}</strong></span>
                <span>6s: <strong>{selectedPlayerCard.sixes}</strong></span>
                <span>Innings: <strong>{selectedPlayerCard.batInnings}</strong></span>
              </div>
            </div>

            {/* STADIUM STATS ROW 2: BOWLING */}
            <div style={{ backgroundColor: 'rgba(0, 255, 135, 0.03)', border: '1px solid rgba(0, 255, 135, 0.1)', borderRadius: '8px', padding: '12px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px dashed rgba(0,255,135,0.1)', paddingBottom: '3px' }}>
                <span>bowling records</span>
                <span>overs: {Math.floor(selectedPlayerCard.ballsBowled / 6)}.{selectedPlayerCard.ballsBowled % 6}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#FFF' }}>{selectedPlayerCard.wickets}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Wickets</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#FFF' }}>{selectedPlayerCard.bowlEcon}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Economy</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#FFF' }}>{selectedPlayerCard.bowlAvg}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Avg spell</div>
                </div>
              </div>
            </div>

            {/* Action buttons inside card */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  const text = `🏏 ManucricK Season Player Profile 🏏\n═══════════════════\nPlayer: ${selectedPlayerCard.name} (${selectedPlayerCard.avatar})\nTeam: ${selectedPlayerCard.team}\n\n★ BATTING STATS:\nMatches: ${selectedPlayerCard.matches}\nRuns: ${selectedPlayerCard.runs}\nBat Average: ${selectedPlayerCard.batAvg}\nHighest Score: ${selectedPlayerCard.highestScore}\nStrike Rate: ${selectedPlayerCard.batSR}\n\n★ BOWLING STATS:\nWickets: ${selectedPlayerCard.wickets}\nEconomy: ${selectedPlayerCard.bowlEcon}\nOvers: ${Math.floor(selectedPlayerCard.ballsBowled / 6)}.${selectedPlayerCard.ballsBowled % 6}\n═══════════════════\nView card on ManucricK\nmanucrick.vercel.app`;
                  navigator.clipboard.writeText(text);
                  alert("WhatsApp Player Card Summary copied to clipboard!");
                }}
                style={{
                  flex: 1.5,
                  padding: '10px 0',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'var(--primary)',
                  color: '#050A18',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 0 10px rgba(0, 255, 135, 0.2)',
                }}
                className="interactive"
              >
                💬 WhatsApp Share Card
              </button>
              
              <button
                onClick={() => setSelectedPlayerCard(null)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backgroundColor: 'transparent',
                  color: '#FFF',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
                className="interactive"
              >
                Close
              </button>
            </div>

          </div>

        </div>
      )}

      <style>{`
        .table-row-hover:hover {
          background: rgba(255, 255, 255, 0.02) !important;
        }
        
        .table-row-hover td {
          border-color: rgba(255, 255, 255, 0.08) !important;
        }

        .table-scroll-container td, .table-scroll-container th {
          font-family: var(--font-body);
        }
      `}</style>

    </div>
  );
}
