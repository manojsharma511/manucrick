import React, { useState, useEffect } from 'react';

interface MatchScore {
  runs: number;
  wickets: number;
  overs: string;
}

interface TournamentMatch {
  id: number; // 1-indexed
  roundIndex: number; // 0, 1, 2, 3
  teamA: string;
  teamB: string;
  scoreA?: MatchScore;
  scoreB?: MatchScore;
  winner?: string;
}

interface Tournament {
  id: string;
  name: string;
  teamCount: 4 | 8 | 16;
  teams: string[];
  matches: TournamentMatch[];
  status: 'active' | 'completed';
  winner?: string;
  createdAt: number;
}

const GULLY_TEAMS = [
  "Gully Gang XI", "Mohalla Masters", "Rajasthan Royals (Local)", "UP Ke Cheetahs",
  "Nets Fighters", "Bazaar Bulls", "Station Strikers", "Lal Kila Legends",
  "Tractor Titans", "Sandstorm Warriors", "Desert Chargers", "Metro Blasters",
  "Chai Point Champions", "Bypass Busters", "High School Heroes", "Gram Panchayat XI"
];

export function TournamentBracket() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  
  // Creation States
  const [showCreate, setShowCreate] = useState(false);
  const [tournamentName, setTournamentName] = useState('Mohalla Championship 2026');
  const [teamCount, setTeamCount] = useState<4 | 8 | 16>(8);
  const [teamNames, setTeamNames] = useState<string[]>(Array(8).fill(''));

  // Match Scoring States
  const [scoringMatch, setScoringMatch] = useState<TournamentMatch | null>(null);
  const [runsA, setRunsA] = useState<number>(0);
  const [wicketsA, setWicketsA] = useState<number>(0);
  const [oversA, setOversA] = useState<string>('0.0');
  const [runsB, setRunsB] = useState<number>(0);
  const [wicketsB, setWicketsB] = useState<number>(0);
  const [oversB, setOversB] = useState<string>('0.0');

  // Mobile navigation for rounds
  const [activeRoundTab, setActiveRoundTab] = useState<number>(0);

  // Load Tournaments from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('manucrick_tournaments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTournaments(parsed);
        // Set most recent active tournament if exists
        const active = parsed.find((t: Tournament) => t.status === 'active');
        if (active) setCurrentTournament(active);
        else if (parsed.length > 0) setCurrentTournament(parsed[0]);
      } catch (e) {
        console.error("Error reading tournaments", e);
      }
    }
  }, []);

  // Update team names input array when size changes
  useEffect(() => {
    setTeamNames(Array(teamCount).fill('').map((_, i) => teamNames[i] || ''));
  }, [teamCount]);

  const saveTournamentState = (updated: Tournament[]) => {
    localStorage.setItem('manucrick_tournaments', JSON.stringify(updated));
    setTournaments(updated);
  };

  const selectTournament = (t: Tournament) => {
    setCurrentTournament(t);
    setShowCreate(false);
    setActiveRoundTab(0);
  };

  const handleDeleteTournament = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this tournament?")) return;
    const updated = tournaments.filter(t => t.id !== id);
    saveTournamentState(updated);
    if (currentTournament?.id === id) {
      setCurrentTournament(updated.length > 0 ? updated[0] : null);
    }
  };

  const handleAutofill = () => {
    const shuffled = [...GULLY_TEAMS].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, teamCount);
    setTeamNames(selected);
  };

  const startNewTournament = () => {
    if (!tournamentName.trim()) {
      alert("Please enter a tournament name!");
      return;
    }
    
    // Check if team names are filled
    const cleanedNames = teamNames.map((n, i) => n.trim() || `Team ${i + 1}`);
    
    // Initialize matches array
    const matches: TournamentMatch[] = [];
    
    // Calculate total matches in tournament: N - 1
    // For 16 teams: 15 matches (8 in R0, 4 in R1, 2 in R2, 1 in R3)
    // For 8 teams: 7 matches (4 in R0, 2 in R1, 1 in R2)
    // For 4 teams: 3 matches (2 in R0, 1 in R1)
    let matchId = 1;
    const r0Size = teamCount / 2;

    // Randomize initial team pairings (Fisher-Yates)
    const shuffledTeams = [...cleanedNames];
    for (let i = shuffledTeams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledTeams[i], shuffledTeams[j]] = [shuffledTeams[j], shuffledTeams[i]];
    }

    // Round 0 Matches
    for (let i = 0; i < r0Size; i++) {
      matches.push({
        id: matchId++,
        roundIndex: 0,
        teamA: shuffledTeams[i * 2],
        teamB: shuffledTeams[i * 2 + 1]
      });
    }

    // Subsequent Rounds (all slots initially empty)
    let prevRoundSize = r0Size;
    let roundIdx = 1;
    while (prevRoundSize > 1) {
      const nextRoundSize = prevRoundSize / 2;
      for (let i = 0; i < nextRoundSize; i++) {
        matches.push({
          id: matchId++,
          roundIndex: roundIdx,
          teamA: 'Winner Match ' + (matches.length - prevRoundSize + i * 2 + 1),
          teamB: 'Winner Match ' + (matches.length - prevRoundSize + i * 2 + 2)
        });
      }
      prevRoundSize = nextRoundSize;
      roundIdx++;
    }

    const newTournament: Tournament = {
      id: 'tour_' + Date.now(),
      name: tournamentName.trim(),
      teamCount,
      teams: cleanedNames,
      matches,
      status: 'active',
      createdAt: Date.now()
    };

    const updated = [newTournament, ...tournaments];
    saveTournamentState(updated);
    setCurrentTournament(newTournament);
    setShowCreate(false);
    setActiveRoundTab(0);
  };

  const handleOpenScoring = (match: TournamentMatch) => {
    // Cannot score match if parent teams are not resolved yet
    if (match.teamA.startsWith('Winner Match') || match.teamB.startsWith('Winner Match')) {
      alert("Waiting for previous round matches to complete first!");
      return;
    }
    setScoringMatch(match);
    setRunsA(match.scoreA?.runs || 0);
    setWicketsA(match.scoreA?.wickets || 0);
    setOversA(match.scoreA?.overs || '0.0');
    setRunsB(match.scoreB?.runs || 0);
    setWicketsB(match.scoreB?.wickets || 0);
    setOversB(match.scoreB?.overs || '0.0');
  };

  const submitMatchScore = () => {
    if (!currentTournament || !scoringMatch) return;

    if (runsA === runsB && wicketsA === wicketsB) {
      alert("Gully Cricket requires a winner! Super Over khilao, draw nahi chalega.");
      return;
    }

    // Determine winner based on runs, then wickets
    let winner = '';
    if (runsA > runsB) {
      winner = scoringMatch.teamA;
    } else if (runsB > runsA) {
      winner = scoringMatch.teamB;
    } else {
      // Runs are equal, team with fewer wickets lost wins
      winner = wicketsA < wicketsB ? scoringMatch.teamA : scoringMatch.teamB;
    }

    // Create updated matches list
    const updatedMatches = currentTournament.matches.map(m => {
      if (m.id === scoringMatch.id) {
        return {
          ...m,
          scoreA: { runs: runsA, wickets: wicketsA, overs: oversA },
          scoreB: { runs: runsB, wickets: wicketsB, overs: oversB },
          winner
        };
      }
      return m;
    });

    // Advance winner to next match if not final
    const matchCount = currentTournament.matches.length; // total matches (e.g. 7)
    const isFinalMatch = scoringMatch.id === matchCount;

    if (!isFinalMatch) {
      // Find which match this winner goes to using round structure logic
      // S = starting match index of this round
      // M = size of this round
      const roundIndex = scoringMatch.roundIndex;
      
      // Calculate start index and size of round
      let roundStartId = 1;
      let roundSize = currentTournament.teamCount / 2;
      for (let r = 0; r < roundIndex; r++) {
        roundStartId += roundSize;
        roundSize /= 2;
      }
      
      const nextRoundStartId = roundStartId + roundSize;
      const indexInRound = scoringMatch.id - roundStartId;
      const nextMatchId = nextRoundStartId + Math.floor(indexInRound / 2);
      const nextSlot = indexInRound % 2 === 0 ? 'teamA' : 'teamB';

      // Update that next match in the matches list
      const targetMatchIndex = updatedMatches.findIndex(m => m.id === nextMatchId);
      if (targetMatchIndex !== -1) {
        if (nextSlot === 'teamA') {
          updatedMatches[targetMatchIndex].teamA = winner;
        } else {
          updatedMatches[targetMatchIndex].teamB = winner;
        }
      }
    }

    // Check if tournament is completed
    const finalMatch = updatedMatches.find(m => m.id === matchCount);
    const tournamentWinner = finalMatch?.winner;
    const isCompleted = !!tournamentWinner;

    // Trigger celebration sound
    if (isCompleted) {
      playCelebrationSound();
    }

    const updatedTournament: Tournament = {
      ...currentTournament,
      matches: updatedMatches,
      status: isCompleted ? 'completed' : 'active',
      winner: tournamentWinner
    };

    const updatedTournaments = tournaments.map(t => t.id === currentTournament.id ? updatedTournament : t);
    saveTournamentState(updatedTournaments);
    setCurrentTournament(updatedTournament);
    setScoringMatch(null);
  };

  const playCelebrationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [261.63, 329.63, 392.00, 523.25]; // C E G C
      notes.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + index * 0.15);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime + index * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + index * 0.15 + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + index * 0.15);
        osc.stop(audioCtx.currentTime + index * 0.15 + 0.4);
      });
    } catch (e) {
      console.warn("Web audio playback failed", e);
    }
  };

  const getRoundName = (roundIdx: number, totalRounds: number) => {
    if (roundIdx === totalRounds - 1) return "Finals";
    if (roundIdx === totalRounds - 2) return "Semi Finals";
    if (roundIdx === totalRounds - 3) return "Quarter Finals";
    return `Round of ${Math.pow(2, totalRounds - roundIdx)}`;
  };

  const getTotalRounds = (teamCount: number): number => {
    if (teamCount === 4) return 2;
    if (teamCount === 8) return 3;
    return 4; // 16 teams
  };

  // Group matches by round index
  const rounds: { roundIndex: number; name: string; matches: TournamentMatch[] }[] = [];
  if (currentTournament) {
    const totalRounds = getTotalRounds(currentTournament.teamCount);
    for (let r = 0; r < totalRounds; r++) {
      rounds.push({
        roundIndex: r,
        name: getRoundName(r, totalRounds),
        matches: currentTournament.matches.filter(m => m.roundIndex === r)
      });
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', color: '#FFF' }}>
      
      {/* HEADER ACTIONS */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        {/* Tournament Selector Dropdown */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Select Fixture:</span>
          {tournaments.length > 0 ? (
            <div style={{ position: 'relative' }}>
              <select
                value={currentTournament?.id || ''}
                onChange={(e) => {
                  const t = tournaments.find(x => x.id === e.target.value);
                  if (t) selectTournament(t);
                }}
                className="premium-input"
                style={{ width: '220px', padding: '8px 12px', marginTop: 0 }}
              >
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id} style={{ backgroundColor: '#0C101E', color: '#FFF' }}>
                    {t.name} ({t.status === 'completed' ? '🏆 Done' : 'Live'})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <span style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>No brackets created.</span>
          )}

          {currentTournament && (
            <button
              onClick={(e) => handleDeleteTournament(currentTournament.id, e)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--red)',
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                padding: '6px'
              }}
              className="interactive"
            >
              🗑️ Delete
            </button>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {currentTournament && (
            <button
              onClick={() => window.print()}
              style={{
                padding: '10px 18px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.15)',
                backgroundColor: 'transparent',
                color: '#FFF',
                fontFamily: 'var(--font-headings)',
                fontSize: '1.1rem',
                letterSpacing: '1px',
                cursor: 'pointer',
              }}
              className="interactive"
            >
              🖨️ PRINT FIXTURES
            </button>
          )}

          <button
            onClick={() => setShowCreate(!showCreate)}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'var(--primary)',
              color: '#050A18',
              fontFamily: 'var(--font-headings)',
              fontSize: '1.1rem',
              letterSpacing: '1px',
              cursor: 'pointer',
              boxShadow: '0 0 12px rgba(0, 255, 135, 0.3)',
            }}
            className="interactive"
          >
            {showCreate ? '❌ CLOSE CREATOR' : '➕ CREATE TOURNAMENT'}
          </button>
        </div>
      </div>

      {/* TOURNAMENT CREATOR FORM */}
      {showCreate && (
        <div className="glass-panel no-print" style={{ padding: '30px', marginBottom: '30px', animation: 'tabTransition 0.4s ease-out' }}>
          <h3 style={{ fontSize: '1.6rem', color: 'var(--primary)', marginBottom: '20px' }}>CREATE NEW KNOCKOUT BRACKET</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }} className="responsive-grid-2">
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Tournament Name</label>
              <input
                type="text"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                placeholder="Mohalla Cup, Season 2"
                className="premium-input"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Number of Teams</label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                {([4, 8, 16] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setTeamCount(sz)}
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      borderRadius: '6px',
                      border: teamCount === sz ? '1.5px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
                      backgroundColor: teamCount === sz ? 'rgba(0, 255, 135, 0.08)' : 'rgba(5, 10, 24, 0.4)',
                      color: teamCount === sz ? '#FFF' : 'var(--text-secondary)',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                    className="interactive"
                  >
                    {sz} Teams
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', marginBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ fontSize: '1.2rem', color: '#FFF' }}>ENTER TEAM NAMES</h4>
              <button
                type="button"
                onClick={handleAutofill}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: '1px solid var(--primary)',
                  backgroundColor: 'transparent',
                  color: 'var(--primary)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
                className="interactive"
              >
                ⚡ Autofill Gully Teams
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
              {teamNames.map((name, i) => (
                <div key={i}>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      const updated = [...teamNames];
                      updated[i] = e.target.value;
                      setTeamNames(updated);
                    }}
                    placeholder={`Team ${i + 1}`}
                    className="premium-input"
                    style={{ padding: '8px 12px' }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              onClick={() => setShowCreate(false)}
              style={{
                padding: '12px 24px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.12)',
                backgroundColor: 'transparent',
                color: '#FFF',
                fontFamily: 'var(--font-headings)',
                fontSize: '1.2rem',
                letterSpacing: '1px',
                cursor: 'pointer',
              }}
              className="interactive"
            >
              CANCEL
            </button>
            
            <button
              onClick={startNewTournament}
              style={{
                padding: '12px 30px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'var(--primary)',
                color: '#050A18',
                fontFamily: 'var(--font-headings)',
                fontSize: '1.2rem',
                letterSpacing: '1px',
                cursor: 'pointer',
                boxShadow: '0 0 15px rgba(0, 255, 135, 0.4)',
              }}
              className="interactive"
            >
              🚀 GENERATE FIXTURES
            </button>
          </div>
        </div>
      )}

      {/* CHAMPION PROMPT OVERLAY SCREEN */}
      {currentTournament && currentTournament.status === 'completed' && (
        <div className="glass-panel" style={{ padding: '40px 20px', textShadow: '0 0 15px rgba(255, 107, 0, 0.2)', textAlign: 'center', marginBottom: '30px', border: '2px solid var(--secondary)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'var(--gold-metal)' }} />
          <h2 style={{ fontSize: '3.5rem', color: 'var(--accent)', letterSpacing: '4px', animation: 'badgePulse 2s infinite alternate ease-in-out' }}>
            🏆 TOURNAMENT CHAMPION 🏆
          </h2>
          <div style={{ fontSize: '4.2rem', fontFamily: 'var(--font-headings)', color: '#FFF', margin: '20px 0', textShadow: '0 0 20px var(--primary)' }}>
            {currentTournament.winner?.toUpperCase()}
          </div>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
            Congratulations! Champions of the {currentTournament.name} 🥇
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '25px' }} className="no-print">
            <button
              onClick={() => {
                const text = `🏆 ${currentTournament.name} CHAMPIONS! 🏆\n═══════════════════\nWinner: ${currentTournament.winner}\nCongratulations to all players! 🥇\n═══════════════════\nScore brackets via ManucricK\nmanucrick.vercel.app`;
                navigator.clipboard.writeText(text);
                alert("WhatsApp Message summary copied to clipboard! Share it in your team group.");
              }}
              style={{
                padding: '8px 18px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'var(--primary)',
                color: '#050A18',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
              className="interactive"
            >
              💬 WhatsApp Share Winner
            </button>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                padding: '8px 18px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.18)',
                backgroundColor: 'transparent',
                color: '#FFF',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
              className="interactive"
            >
              🔄 Play Again
            </button>
          </div>
        </div>
      )}

      {/* TOURNAMENT VIEW SECTION */}
      {currentTournament ? (
        <div>
          {/* TOURNAMENT TITLE HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '15px', marginBottom: '25px' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '3px' }}>KO FIXTURES</span>
              <h2 style={{ fontSize: '2.5rem', marginTop: '2px' }}>{currentTournament.name}</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Format: <strong>{currentTournament.teamCount} Teams Knockout</strong></span>
              <br />
              <span style={{ fontSize: '0.85rem', color: currentTournament.status === 'completed' ? 'var(--primary)' : 'var(--secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                {currentTournament.status === 'completed' ? '🏆 Completed' : '⚡ Tournament Live'}
              </span>
            </div>
          </div>

          {/* MOBILE ROUND SELECTION TABS */}
          <div className="no-print mobile-only" style={{ display: 'none', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '8px' }}>
            {rounds.map((r, idx) => (
              <button
                key={idx}
                onClick={() => setActiveRoundTab(idx)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '20px',
                  border: activeRoundTab === idx ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: activeRoundTab === idx ? 'rgba(0, 255, 135, 0.08)' : 'rgba(5, 10, 24, 0.4)',
                  color: activeRoundTab === idx ? '#FFF' : 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
                className="interactive"
              >
                {r.name}
              </button>
            ))}
          </div>

          {/* BRACKET LAYOUT DISPLAY */}
          {/* Desktop tree display, columns side by side */}
          <div className="bracket-wrapper" style={{ display: 'grid', gridTemplateColumns: `repeat(${rounds.length}, 1fr)`, gap: '30px' }}>
            {rounds.map((round, rIdx) => {
              const isTabActive = activeRoundTab === rIdx;
              return (
                <div
                  key={round.roundIndex}
                  className={`bracket-round-col ${isTabActive ? 'mobile-active' : ''}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-around',
                    height: '100%',
                    minHeight: '450px',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {/* Round Header */}
                  <div className="no-print" style={{ textAlign: 'center', marginBottom: '15px', borderBottom: '1px dashed rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>{round.name.toUpperCase()}</h3>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{round.matches.length} Matches</span>
                  </div>

                  {/* Print Round Header */}
                  <div className="print-only" style={{ display: 'none', textAlign: 'center', marginBottom: '10px' }}>
                    <h3 style={{ fontSize: '1.2rem', textDecoration: 'underline' }}>{round.name}</h3>
                  </div>

                  {/* Round Matches List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', justifyContent: 'space-evenly' }}>
                    {round.matches.map((match) => {
                      const isPlayable = !match.winner && !match.teamA.startsWith('Winner Match') && !match.teamB.startsWith('Winner Match');
                      const isMatchWinnerA = match.winner === match.teamA && !!match.winner;
                      const isMatchWinnerB = match.winner === match.teamB && !!match.winner;

                      return (
                        <div
                          key={match.id}
                          className="glass-panel match-card"
                          onClick={() => currentTournament.status === 'active' && handleOpenScoring(match)}
                          style={{
                            padding: '12px 14px',
                            cursor: currentTournament.status === 'completed' ? 'default' : (isPlayable ? 'pointer' : 'not-allowed'),
                            borderColor: match.winner ? 'rgba(0, 255, 135, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                            opacity: (match.teamA.startsWith('Winner Match') && match.teamB.startsWith('Winner Match')) ? 0.35 : 1,
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                        >
                          {/* Match Index Tag */}
                          <div style={{ position: 'absolute', top: '-10px', left: '15px', backgroundColor: '#090E1D', border: '1px solid rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                            MATCH {match.id}
                          </div>

                          {/* Team A Row */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {isMatchWinnerA && <span style={{ color: 'var(--accent)' }}>👑</span>}
                              <span style={{
                                fontWeight: isMatchWinnerA ? 'bold' : 'normal',
                                color: isMatchWinnerA ? 'var(--primary)' : (match.winner ? 'var(--text-secondary)' : '#FFF'),
                                fontSize: '0.95rem',
                              }}>
                                {match.teamA}
                              </span>
                            </div>
                            {match.scoreA ? (
                              <span style={{ fontSize: '0.88rem', fontWeight: 'bold' }}>
                                {match.scoreA.runs}/{match.scoreA.wickets} <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>({match.scoreA.overs})</span>
                              </span>
                            ) : null}
                          </div>

                          {/* Team B Row */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {isMatchWinnerB && <span style={{ color: 'var(--accent)' }}>👑</span>}
                              <span style={{
                                fontWeight: isMatchWinnerB ? 'bold' : 'normal',
                                color: isMatchWinnerB ? 'var(--primary)' : (match.winner ? 'var(--text-secondary)' : '#FFF'),
                                fontSize: '0.95rem',
                              }}>
                                {match.teamB}
                              </span>
                            </div>
                            {match.scoreB ? (
                              <span style={{ fontSize: '0.88rem', fontWeight: 'bold' }}>
                                {match.scoreB.runs}/{match.scoreB.wickets} <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>({match.scoreB.overs})</span>
                              </span>
                            ) : null}
                          </div>

                          {/* Match Result Footer text */}
                          {match.winner && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '4px', textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase' }}>
                              🏆 {match.winner} WON
                            </div>
                          )}

                          {/* Hover Playable overlay sign */}
                          {isPlayable && currentTournament.status === 'active' && (
                            <div className="match-card-overlay">
                              <span>Score Match 🏏</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* NO TOURNAMENT CREATED STATE */
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <span style={{ fontSize: '4.5rem' }}>📊</span>
          <h2 style={{ fontFamily: 'var(--font-headings)', fontSize: '2.5rem', margin: '20px 0' }}>TOURNAMENT MANAGER</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 30px' }}>
            Set up weekend gully cricket knockout tournaments. Input team names, auto-generate fixture brackets, record results, and advance players automatically to finals!
          </p>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              padding: '12px 30px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--primary)',
              color: '#050A18',
              fontFamily: 'var(--font-headings)',
              fontSize: '1.3rem',
              letterSpacing: '1px',
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(0,255,135,0.3)',
            }}
            className="interactive"
          >
            🚀 START NEW TOURNAMENT
          </button>
        </div>
      )}

      {/* MATCH SCORING MODAL DIALOG */}
      {scoringMatch && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(5, 10, 24, 0.85)', backdropFilter: 'blur(12px)', zIndex: 1050, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '24px', position: 'relative' }}>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px', marginBottom: '20px' }}>
              ENTER SCORE DETAILS
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Team A Scoring Inputs */}
              <div>
                <h4 style={{ color: 'var(--secondary)', fontSize: '1.1rem', marginBottom: '8px' }}>{scoringMatch.teamA.toUpperCase()}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Runs</label>
                    <input type="number" min="0" value={runsA} onChange={(e) => setRunsA(Math.max(0, parseInt(e.target.value) || 0))} className="premium-input" style={{ marginTop: '2px', padding: '8px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Wickets</label>
                    <input type="number" min="0" max="10" value={wicketsA} onChange={(e) => setWicketsA(Math.min(10, Math.max(0, parseInt(e.target.value) || 0)))} className="premium-input" style={{ marginTop: '2px', padding: '8px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Overs Bowled</label>
                    <input type="text" value={oversA} onChange={(e) => setOversA(e.target.value)} placeholder="0.0" className="premium-input" style={{ marginTop: '2px', padding: '8px' }} />
                  </div>
                </div>
              </div>

              {/* Team B Scoring Inputs */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '15px' }}>
                <h4 style={{ color: 'var(--secondary)', fontSize: '1.1rem', marginBottom: '8px' }}>{scoringMatch.teamB.toUpperCase()}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Runs</label>
                    <input type="number" min="0" value={runsB} onChange={(e) => setRunsB(Math.max(0, parseInt(e.target.value) || 0))} className="premium-input" style={{ marginTop: '2px', padding: '8px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Wickets</label>
                    <input type="number" min="0" max="10" value={wicketsB} onChange={(e) => setWicketsB(Math.min(10, Math.max(0, parseInt(e.target.value) || 0)))} className="premium-input" style={{ marginTop: '2px', padding: '8px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Overs Bowled</label>
                    <input type="text" value={oversB} onChange={(e) => setOversB(e.target.value)} placeholder="0.0" className="premium-input" style={{ marginTop: '2px', padding: '8px' }} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
              <button
                onClick={() => setScoringMatch(null)}
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
                CANCEL
              </button>
              <button
                onClick={submitMatchScore}
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
                🔒 LOCK RESULT
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .match-card {
          position: relative;
          overflow: hidden;
        }
        .match-card-overlay {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0, 255, 135, 0.95);
          display: flex; justify-content: center; align-items: center;
          opacity: 0;
          transition: opacity 0.2s ease-in-out;
        }
        .match-card-overlay span {
          color: #050A18;
          font-family: var(--font-headings);
          font-size: 1.3rem;
          letter-spacing: 1px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .match-card:hover .match-card-overlay {
          opacity: 1;
        }
        
        /* Print styling rules */
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          body, html {
            background: #FFF !important;
            color: #000 !important;
            font-size: 12px !important;
          }
          .bracket-wrapper {
            grid-template-columns: repeat(${rounds.length}, 1fr) !important;
            gap: 10px !important;
          }
          .bracket-round-col {
            display: flex !important;
            min-height: auto !important;
          }
          .glass-panel {
            background: none !important;
            border: 1px solid #000 !important;
            color: #000 !important;
            box-shadow: none !important;
            border-radius: 4px !important;
            margin-bottom: 10px !important;
          }
          .match-card span {
            color: #000 !important;
          }
          .match-card-overlay {
            display: none !important;
          }
        }

        /* Mobile specific layouts */
        @media (max-width: 1024px) {
          .mobile-only {
            display: flex !important;
          }
          .bracket-wrapper {
            grid-template-columns: 1fr !important;
          }
          .bracket-round-col {
            display: none !important;
            min-height: auto !important;
          }
          .bracket-round-col.mobile-active {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
