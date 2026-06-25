import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Interfaces for Local Scoring State
interface BatsmanStats {
  name: string;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  status: 'notout' | 'out' | 'retired';
  dismissal?: string;
}

interface BowlerStats {
  name: string;
  ballsBowled: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
}

interface FallOfWicket {
  wicketNum: number;
  score: number;
  overs: string;
  batsman: string;
}

interface InningsScore {
  runs: number;
  wickets: number;
  ballsBowled: number;
  wideRuns: number;
  noBallRuns: number;
  legByes: number;
  byes: number;
  batsmenStats: Record<string, BatsmanStats>;
  bowlerStats: Record<string, BowlerStats>;
  fallOfWickets: FallOfWicket[];
  overHistory: string[]; // e.g. ["1", "wd", "W", "6", "nb+1", "2"]
  commentary: string[]; // Dynamic ball-by-ball commentary text
  overScores: number[]; // Scores at the end of each over
}

const getOverBallString = (ballsCount: number) => {
  const overs = Math.floor(ballsCount / 6);
  const balls = ballsCount % 6;
  return `${overs}.${balls}`;
};

const generateCommentary = (
  overBall: string,
  bowler: string,
  batsman: string,
  runs: number,
  type: 'normal' | 'wide' | 'noball' | 'bye' | 'legbye' | 'wicket',
  extraRuns = 0,
  wicketType?: string,
  fielderName?: string
): string => {
  const runsText = runs === 1 ? '1 run' : `${runs} runs`;
  
  const normalCommentaries: Record<number, string[]> = {
    0: [
      `Good length delivery, pushed to mid-on. No run.`,
      `Defended solidly back to the bowler.`,
      `Beaten! Slices past the off stump, no run.`,
      `Pitched up, driven straight to cover.`,
      `Defensive shot, played back on the crease.`,
      `Short ball, batsman ducks under it.`
    ],
    1: [
      `Guided down to third man for a single.`,
      `Tucked away to deep midwicket to rotate the strike.`,
      `Driven with soft hands to long-on for a run.`,
      `Flicked off the pads down to fine leg for one.`,
      `Pushed into the cover gap, quick single taken.`
    ],
    2: [
      `Flicked away through midwicket. They push hard and sprint back for a couple!`,
      `Driven nicely past point, the outfield is slow, so they pick up two runs.`,
      `Gently guided to deep square leg, excellent running to secure two.`,
      `Cut away to deep backward point, they comfortably complete two runs.`
    ],
    3: [
      `Struck well into the gap! Great chase by the fielder, they manage to run three!`,
      `Driven through extra cover. Excellent backing up allows them to run three.`
    ],
    4: [
      `CRACK! Terrific shot! Lofted over mid-off and bounces away for FOUR!`,
      `Shot! Played with superb timing, speeds away past point for FOUR!`,
      `Edged and runs away fine! No chance for slip, boundary FOUR!`,
      `Pulled away with power! Hits the fence for a solid FOUR!`
    ],
    5: [
      `Overthrows! They run a single, and a wild throw at the stumps goes to the boundary! 5 runs!`
    ],
    6: [
      `BOOM! High, handsome and maximum! Smashed over long-on for a huge SIX!`,
      `Incredible strike! Helicopter shot sends the ball sailing deep into the crowd! SIX!`,
      `That is massive! Clean connection, cleared the deep midwicket boundary with ease! SIX!`,
      `Smacked! Over the bowler's head, straight into the pavilion sightscreen! SIX!`
    ]
  };

  const selectRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  let detail = '';
  if (type === 'normal') {
    const list = normalCommentaries[runs] || [`Driven into the outfield for ${runsText}.`];
    detail = selectRandom(list);
  } else if (type === 'wide') {
    const wdExtra = extraRuns > 0 ? ` + ${extraRuns} runs` : '';
    detail = `Wide ball! Sprayed down leg side, keeper fumbles slightly. (Wd${wdExtra})`;
  } else if (type === 'noball') {
    const nbExtra = extraRuns > 0 ? ` + ${extraRuns} runs off the bat` : '';
    detail = `No ball! Bowler overstepped the line. Free hit awarded! (Nb${nbExtra})`;
  } else if (type === 'bye') {
    detail = `Beaten! Ball slips past the batsman and the keeper, they steal ${runsText} as byes.`;
  } else if (type === 'legbye') {
    detail = `Hit on the pads, rolls into the gap. They scamper through for ${runsText} as leg byes.`;
  } else if (type === 'wicket') {
    const field = fielderName ? ` by ${fielderName}` : '';
    if (wicketType === 'bowled') {
      detail = selectRandom([
        `CLEAN BOWLED! Stumps shattered! Straight through the defense!`,
        `Bowled him! Beautiful delivery, clips the top of off stump!`
      ]);
    } else if (wicketType === 'caught') {
      detail = selectRandom([
        `OUT! Caught${field}! Slices it high in the air, easy catch under pressure!`,
        `Caught${field}! Tried to go big, but got the top edge straight to the fielder!`
      ]);
    } else if (wicketType === 'lbw') {
      detail = `OUT! Plumb in front! Hits the pads right in front of middle, umpire raises the finger! LBW!`;
    } else if (wicketType === 'stumped') {
      detail = `OUT! Stumped${field}! Batsman steps out of the crease, completely beaten by spin, and the keeper whips the bails off!`;
    } else if (wicketType === 'runout') {
      detail = `OUT! Run out${field}! Direct hit! Batsman was scrambling to make the crease, but fell short!`;
    } else if (wicketType === 'retired') {
      detail = `Batsman walks off the field. Retired hurt.`;
    } else {
      detail = `OUT! Wicket falls!`;
    }
  }

  return `[${overBall}] ${bowler} to ${batsman}: ${detail}`;
};

interface LocalMatch {
  id: string;
  teamA: string;
  teamB: string;
  overs: number;
  tossWinner: string;
  tossDecision: 'bat' | 'bowl';
  date: string;
  timestamp: number;
  status: 'live' | 'completed';
  
  teamASquad: string[];
  teamBSquad: string[];

  teamAScore: InningsScore;
  teamBScore: InningsScore;
  
  currentInnings: 1 | 2;
  striker: string;
  nonStriker: string;
  currentBowler: string;
  
  historyStack: string[]; // State snapshots for undo (JSON strings)
}

const getOrInitBatsman = (score: InningsScore, name: string): BatsmanStats => {
  if (!score.batsmenStats[name]) {
    score.batsmenStats[name] = { name, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, status: 'notout' };
  }
  return score.batsmenStats[name];
};

const getOrInitBowler = (score: InningsScore, name: string): BowlerStats => {
  if (!score.bowlerStats[name]) {
    score.bowlerStats[name] = { name, ballsBowled: 0, maidens: 0, runsConceded: 0, wickets: 0 };
  }
  return score.bowlerStats[name];
};

export function LocalScorer() {
  const [matches, setMatches] = useState<LocalMatch[]>([]);
  const [currentMatch, setCurrentMatch] = useState<LocalMatch | null>(null);
  const [viewingScorecard, setViewingScorecard] = useState<LocalMatch | null>(null);
  
  // Setup form states
  const [showSetup, setShowSetup] = useState(false);
  const [teamA, setTeamA] = useState('Team Manoj');
  const [teamB, setTeamB] = useState('Team Ramesh');
  const [matchOvers, setMatchOvers] = useState(5);
  const [tossWinner, setTossWinner] = useState('Team Manoj');
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl'>('bat');
  const [teamASquadText, setTeamASquadText] = useState(
    "Manoj Kumar\nAjay Sharma\nVirat K\nRohit S\nMS Dhoni\nHardik P\nRavindra J\nR Ashwin\nMohd Shami\nJasprit B\nSiraj M"
  );
  const [teamBSquadText, setTeamBSquadText] = useState(
    "Ramesh\nSuresh\nDinesh K\nRahul KL\nShreyas I\nSanju S\nAxar P\nY Chahal\nBhuvi K\nUmran M\nArshdeep S"
  );

  // Selector dialogs during gameplay
  const [showOpenerSelect, setShowOpenerSelect] = useState(false);
  const [selectedStriker, setSelectedStriker] = useState('');
  const [selectedNonStriker, setSelectedNonStriker] = useState('');
  const [selectedBowler, setSelectedBowler] = useState('');

  const [showBowlerSelect, setShowBowlerSelect] = useState(false);
  const [nextBowler, setNextBowler] = useState('');

  const [showWicketModal, setShowWicketModal] = useState(false);
  const [wicketBatsman, setWicketBatsman] = useState('');
  const [wicketType, setWicketType] = useState('bowled');
  const [wicketFielder, setWicketFielder] = useState('');
  const [newBatsman, setNewBatsman] = useState('');

  const [showNoBallModal, setShowNoBallModal] = useState(false);
  const [noBallOffBatRuns, setNoBallOffBatRuns] = useState(0);

  const [showWideModal, setShowWideModal] = useState(false);
  const [wideExtraRuns, setWideExtraRuns] = useState(0);
  const [wicketRunsCompleted, setWicketRunsCompleted] = useState(0);
  const [liveTab, setLiveTab] = useState<'scoring' | 'scorecard'>('scoring');
  const [detailedScorecardTab, setDetailedScorecardTab] = useState<'tables' | 'commentary'>('tables');

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' } | null>(null);

  // Load matches & clean up expired on mount
  useEffect(() => {
    // Check if shared match in URL
    const handleHashCheck = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#share-scorecard')) {
        const queryParams = new URLSearchParams(hash.substring(hash.indexOf('?')));
        const data = queryParams.get('data');
        if (data) {
          try {
            const decodedStr = decodeURIComponent(atob(data).split('').map((c) => {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const sharedMatch = JSON.parse(decodedStr);
            setViewingScorecard(sharedMatch);
          } catch (e) {
            triggerToast("Failed to decode shared match scorecard link.", 'info');
          }
        }
      }
    };

    loadMatches();
    handleHashCheck();
    window.addEventListener('hashchange', handleHashCheck);
    return () => window.removeEventListener('hashchange', handleHashCheck);
  }, []);

  const triggerToast = (msg: string, type: 'success' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadMatches = () => {
    const saved = localStorage.getItem('manucrick_local_matches');
    if (saved) {
      try {
        let list: LocalMatch[] = JSON.parse(saved);
        const now = Date.now();
        // 5 Days in milliseconds: 5 * 24 * 60 * 60 * 1000 = 432,000,000
        const fiveDays = 432000000;
        
        // Clean up matches older than 5 days
        const validList = list.filter((m) => now - m.timestamp < fiveDays);
        if (validList.length !== list.length) {
          localStorage.setItem('manucrick_local_matches', JSON.stringify(validList));
        }
        setMatches(validList);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const saveMatchesList = (updated: LocalMatch[]) => {
    localStorage.setItem('manucrick_local_matches', JSON.stringify(updated));
    setMatches(updated);
  };

  // Helper formats
  const formatOvers = (balls: number) => {
    const overs = Math.floor(balls / 6);
    const extraBalls = balls % 6;
    return `${overs}.${extraBalls}`;
  };

  const calculateEcon = (runs: number, balls: number) => {
    if (balls === 0) return '0.00';
    return ((runs / balls) * 6).toFixed(2);
  };

  const calculateSR = (runs: number, balls: number) => {
    if (balls === 0) return '0.00';
    return ((runs / balls) * 100).toFixed(1);
  };

  // Setup match action
  const handleStartMatchSetup = () => {
    setTeamA('Team Manoj');
    setTeamB('Team Ramesh');
    setMatchOvers(5);
    setTossWinner('Team Manoj');
    setTossDecision('bat');
    setShowSetup(true);
  };

  const createNewMatch = () => {
    if (!teamA.trim() || !teamB.trim()) {
      triggerToast("Please enter both Team Names", 'info');
      return;
    }

    const squadA = teamASquadText.split('\n').map(n => n.trim()).filter(Boolean);
    const squadB = teamBSquadText.split('\n').map(n => n.trim()).filter(Boolean);

    if (squadA.length < 2 || squadB.length < 2) {
      triggerToast("Each squad must have at least 2 players.", 'info');
      return;
    }

    const initialInnings = (): InningsScore => ({
      runs: 0,
      wickets: 0,
      ballsBowled: 0,
      wideRuns: 0,
      noBallRuns: 0,
      legByes: 0,
      byes: 0,
      batsmenStats: {},
      bowlerStats: {},
      fallOfWickets: [],
      overHistory: [],
      commentary: [],
      overScores: [],
    });

    const newMatch: LocalMatch = {
      id: 'match_' + Date.now(),
      teamA: teamA.trim(),
      teamB: teamB.trim(),
      overs: matchOvers,
      tossWinner,
      tossDecision,
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      status: 'live',
      teamASquad: squadA,
      teamBSquad: squadB,
      teamAScore: initialInnings(),
      teamBScore: initialInnings(),
      currentInnings: 1,
      striker: '',
      nonStriker: '',
      currentBowler: '',
      historyStack: [],
    };

    // Save and load
    const updated = [newMatch, ...matches];
    saveMatchesList(updated);
    setCurrentMatch(newMatch);
    setShowSetup(false);
    
    // Prompt Opener selection
    setSelectedStriker(getBattingTeamSquad(newMatch)[0] || '');
    setSelectedNonStriker(getBattingTeamSquad(newMatch)[1] || '');
    setSelectedBowler(getBowlingTeamSquad(newMatch)[0] || '');
    setShowOpenerSelect(true);
  };

  const getBattingTeamName = (m: LocalMatch) => {
    const winner = (m.tossWinner || '').trim().toLowerCase();
    const tA = (m.teamA || '').trim().toLowerCase();
    const tB = (m.teamB || '').trim().toLowerCase();
    const teamABatsFirst = (winner === tA && m.tossDecision === 'bat') || (winner === tB && m.tossDecision === 'bowl');
    if (m.currentInnings === 1) {
      return teamABatsFirst ? m.teamA : m.teamB;
    } else {
      return teamABatsFirst ? m.teamB : m.teamA;
    }
  };

  const getBowlingTeamName = (m: LocalMatch) => {
    const name = getBattingTeamName(m).trim().toLowerCase();
    const tA = m.teamA.trim().toLowerCase();
    return name === tA ? m.teamB : m.teamA;
  };

  const getBattingTeamSquad = (m: LocalMatch) => {
    const name = getBattingTeamName(m).trim().toLowerCase();
    const tA = m.teamA.trim().toLowerCase();
    const squad = name === tA ? m.teamASquad : m.teamBSquad;
    return squad || [];
  };

  const getBowlingTeamSquad = (m: LocalMatch) => {
    const name = getBowlingTeamName(m).trim().toLowerCase();
    const tA = m.teamA.trim().toLowerCase();
    const squad = name === tA ? m.teamASquad : m.teamBSquad;
    return squad || [];
  };

  const getActiveInningsScore = (m: LocalMatch): InningsScore => {
    return m.currentInnings === 1 ? m.teamAScore : m.teamBScore;
  };

  const updateActiveInningsScore = (m: LocalMatch, score: InningsScore): LocalMatch => {
    if (m.currentInnings === 1) {
      return { ...m, teamAScore: score };
    } else {
      return { ...m, teamBScore: score };
    }
  };

  // Launch innings
  const confirmOpeners = () => {
    if (!selectedStriker || !selectedNonStriker || !selectedBowler) {
      triggerToast("Select Striker, Non-Striker, and Bowler to start.", 'info');
      return;
    }
    if (selectedStriker === selectedNonStriker) {
      triggerToast("Striker and Non-Striker must be different players.", 'info');
      return;
    }

    if (!currentMatch) return;

    // Snapshot history before setup
    const history = [...currentMatch.historyStack];
    // Clear historyStack from the snapshot to prevent nested string length overflow
    const snapshot = { ...currentMatch, historyStack: [] };
    history.push(JSON.stringify(snapshot));

    let updated = { ...currentMatch, historyStack: history };
    let score = getActiveInningsScore(updated);

    // Initialize batsman stats
    score.batsmenStats[selectedStriker] = { name: selectedStriker, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, status: 'notout' };
    score.batsmenStats[selectedNonStriker] = { name: selectedNonStriker, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, status: 'notout' };
    
    // Initialize bowler stats
    score.bowlerStats[selectedBowler] = { name: selectedBowler, ballsBowled: 0, maidens: 0, runsConceded: 0, wickets: 0 };

    updated = updateActiveInningsScore(updated, score);
    updated.striker = selectedStriker;
    updated.nonStriker = selectedNonStriker;
    updated.currentBowler = selectedBowler;

    saveMatchState(updated);
    setShowOpenerSelect(false);
    triggerToast("Innings Started!", 'success');
  };

  const saveMatchState = (m: LocalMatch) => {
    setCurrentMatch(m);
    const list = matches.map((item) => (item.id === m.id ? m : item));
    saveMatchesList(list);
  };

  // Score ball functions
  const addBallSnapshot = (m: LocalMatch) => {
    const history = [...m.historyStack];
    // Keep stack size reasonable (last 30 actions)
    if (history.length > 30) history.shift();
    
    // Clear historyStack from the serialized snapshot to prevent exponential nested string growth
    const snapshot = { ...m, historyStack: [] };
    history.push(JSON.stringify(snapshot));
    return { ...m, historyStack: history };
  };


  const scoreRuns = (runs: number, isBoundary = false) => {
    if (!currentMatch || !currentMatch.striker || !currentMatch.currentBowler) return;
    
    let m = addBallSnapshot(currentMatch);
    let score = getActiveInningsScore(m);
    
    const bName = m.striker;
    const bowlName = m.currentBowler;

    // Update batsman
    const bat = getOrInitBatsman(score, bName);
    bat.runs += runs;
    bat.ballsFaced += 1;
    if (isBoundary) {
      if (runs === 4) bat.fours += 1;
      if (runs === 6) bat.sixes += 1;
    }

    // Update bowler
    const bowler = getOrInitBowler(score, bowlName);
    bowler.ballsBowled += 1;
    bowler.runsConceded += runs;

    // Update team score
    score.runs += runs;
    score.ballsBowled += 1;
    score.overHistory.push(String(runs));

    // Generate commentary
    const commText = generateCommentary(
      getOverBallString(score.ballsBowled),
      bowlName,
      bName,
      runs,
      'normal'
    );
    if (!score.commentary) score.commentary = [];
    score.commentary.push(commText);

    // Handle strike rotation
    if (runs % 2 === 1) {
      const temp = m.striker;
      m.striker = m.nonStriker;
      m.nonStriker = temp;
    }

    m = updateActiveInningsScore(m, score);
    checkMatchMilestones(m);
  };

  const handleSwapStrike = () => {
    if (!currentMatch) return;
    let m = addBallSnapshot(currentMatch);
    const temp = m.striker;
    m.striker = m.nonStriker;
    m.nonStriker = temp;
    saveMatchState(m);
    triggerToast("Strike Swapped", 'success');
  };

  const handleUndo = () => {
    if (!currentMatch || currentMatch.historyStack.length === 0) {
      triggerToast("Nothing to Undo.", 'info');
      return;
    }
    const stack = [...currentMatch.historyStack];
    const prevStr = stack.pop();
    if (prevStr) {
      try {
        const prevMatch = JSON.parse(prevStr);
        prevMatch.historyStack = stack;
        setCurrentMatch(prevMatch);
        const list = matches.map((item) => (item.id === prevMatch.id ? prevMatch : item));
        saveMatchesList(list);
        triggerToast("Last Action Undone", 'success');
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Score Extras
  const scoreWide = () => {
    if (!currentMatch) return;
    setWideExtraRuns(0);
    setShowWideModal(true);
  };

  const confirmWide = () => {
    if (!currentMatch || !currentMatch.currentBowler) return;

    let m = addBallSnapshot(currentMatch);
    let score = getActiveInningsScore(m);
    const bowlName = m.currentBowler;

    const totalRuns = 1 + wideExtraRuns;
    score.runs += totalRuns;
    score.wideRuns += totalRuns;
    
    const historyText = wideExtraRuns > 0 ? `Wd+${wideExtraRuns}` : 'Wd';
    score.overHistory.push(historyText);

    // Bowler gets runs conceded, but ball is not counted
    const bowler = getOrInitBowler(score, bowlName);
    bowler.runsConceded += totalRuns;

    // Generate commentary
    const commText = generateCommentary(
      getOverBallString(score.ballsBowled),
      bowlName,
      m.striker || 'Batsman',
      totalRuns,
      'wide',
      wideExtraRuns
    );
    if (!score.commentary) score.commentary = [];
    score.commentary.push(commText);

    // Rotate strike on odd runs
    if (wideExtraRuns % 2 === 1) {
      const temp = m.striker;
      m.striker = m.nonStriker;
      m.nonStriker = temp;
    }

    m = updateActiveInningsScore(m, score);
    setShowWideModal(false);
    checkMatchMilestones(m);
  };

  const handleNoBallPrompt = () => {
    if (!currentMatch) return;
    setNoBallOffBatRuns(0);
    setShowNoBallModal(true);
  };

  const confirmNoBall = () => {
    if (!currentMatch || !currentMatch.striker || !currentMatch.currentBowler) return;

    let m = addBallSnapshot(currentMatch);
    let score = getActiveInningsScore(m);
    
    const bName = m.striker;
    const bowlName = m.currentBowler;

    // 1 run for No Ball + bat runs
    const totalConceded = 1 + noBallOffBatRuns;
    score.runs += totalConceded;
    score.noBallRuns += 1;
    
    const historyText = noBallOffBatRuns > 0 ? `Nb+${noBallOffBatRuns}` : 'Nb';
    score.overHistory.push(historyText);

    // Update batsman
    const bat = getOrInitBatsman(score, bName);
    bat.runs += noBallOffBatRuns;
    bat.ballsFaced += 1; // faces ball on No Ball
    if (noBallOffBatRuns === 4) bat.fours += 1;
    if (noBallOffBatRuns === 6) bat.sixes += 1;

    // Update bowler (No Ball is not counted, but runs conceded count)
    const bowler = getOrInitBowler(score, bowlName);
    bowler.runsConceded += totalConceded;

    // Generate commentary
    const commText = generateCommentary(
      getOverBallString(score.ballsBowled),
      bowlName,
      bName,
      totalConceded,
      'noball',
      noBallOffBatRuns
    );
    if (!score.commentary) score.commentary = [];
    score.commentary.push(commText);

    // Rotate strike on odd runs
    if (noBallOffBatRuns % 2 === 1) {
      const temp = m.striker;
      m.striker = m.nonStriker;
      m.nonStriker = temp;
    }

    m = updateActiveInningsScore(m, score);
    setShowNoBallModal(false);
    checkMatchMilestones(m);
  };

  const scoreLegBye = (runs: number) => {
    if (!currentMatch || !currentMatch.striker || !currentMatch.currentBowler) return;

    let m = addBallSnapshot(currentMatch);
    let score = getActiveInningsScore(m);
    
    const bName = m.striker;
    const bowlName = m.currentBowler;

    // Update team score & extras
    score.runs += runs;
    score.legByes += runs;
    score.ballsBowled += 1;
    score.overHistory.push(`${runs}Lb`);

    // Batsman faces ball, but scores 0 runs
    const bat = getOrInitBatsman(score, bName);
    bat.ballsFaced += 1;

    // Bowler bowls legal ball, but doesn't concede bowler runs (leg byes don't count against bowler)
    const bowler = getOrInitBowler(score, bowlName);
    bowler.ballsBowled += 1;

    // Generate commentary
    const commText = generateCommentary(
      getOverBallString(score.ballsBowled),
      bowlName,
      bName,
      runs,
      'legbye'
    );
    if (!score.commentary) score.commentary = [];
    score.commentary.push(commText);

    // Swap strike on odd runs
    if (runs % 2 === 1) {
      const temp = m.striker;
      m.striker = m.nonStriker;
      m.nonStriker = temp;
    }

    m = updateActiveInningsScore(m, score);
    checkMatchMilestones(m);
  };

  const scoreBye = (runs: number) => {
    if (!currentMatch || !currentMatch.striker || !currentMatch.currentBowler) return;

    let m = addBallSnapshot(currentMatch);
    let score = getActiveInningsScore(m);
    
    const bName = m.striker;
    const bowlName = m.currentBowler;

    // Update team score & extras
    score.runs += runs;
    score.byes += runs;
    score.ballsBowled += 1;
    score.overHistory.push(`${runs}By`);

    // Batsman faces ball, 0 runs
    const batBye = getOrInitBatsman(score, bName);
    batBye.ballsFaced += 1;

    // Bowler bowls legal ball, 0 runs conceded
    const bowlerBye = getOrInitBowler(score, bowlName);
    bowlerBye.ballsBowled += 1;

    // Generate commentary
    const commText = generateCommentary(
      getOverBallString(score.ballsBowled),
      bowlName,
      bName,
      runs,
      'bye'
    );
    if (!score.commentary) score.commentary = [];
    score.commentary.push(commText);

    // Swap strike
    if (runs % 2 === 1) {
      const temp = m.striker;
      m.striker = m.nonStriker;
      m.nonStriker = temp;
    }

    m = updateActiveInningsScore(m, score);
    checkMatchMilestones(m);
  };

  // Wickets
  const handleWicketPrompt = () => {
    if (!currentMatch) return;
    setWicketBatsman(currentMatch.striker);
    setWicketType('bowled');
    setWicketFielder('');
    setWicketRunsCompleted(0);
    
    // New batsman choices (players in squad who haven't batted yet)
    const score = getActiveInningsScore(currentMatch);
    const squad = getBattingTeamSquad(currentMatch);
    const alreadyBatted = Object.keys(score.batsmenStats);
    const unbatted = squad.filter((p) => !alreadyBatted.includes(p));

    setNewBatsman(unbatted[0] || '');
    setShowWicketModal(true);
  };

  const confirmWicket = () => {
    if (!currentMatch || !currentMatch.currentBowler || !wicketBatsman) return;

    let m = addBallSnapshot(currentMatch);
    let score = getActiveInningsScore(m);
    const bowlName = m.currentBowler;
    const bName = m.striker;

    // Add completed runs before dismissal to batsman & team
    if (wicketRunsCompleted > 0) {
      score.runs += wicketRunsCompleted;
      
      const bat = getOrInitBatsman(score, bName);
      if (bat) {
        bat.runs += wicketRunsCompleted;
      }
      
      const bowler = getOrInitBowler(score, bowlName);
      if (bowler) {
        bowler.runsConceded += wicketRunsCompleted;
      }

      // Rotate strike on odd runs
      if (wicketRunsCompleted % 2 === 1) {
        const temp = m.striker;
        m.striker = m.nonStriker;
        m.nonStriker = temp;
      }
    }

    // Update dismissed batsman
    const dismissedBat = getOrInitBatsman(score, wicketBatsman);
    dismissedBat.status = 'out';
    
    // Format dismissal text professionally
    let dismissalText = '';
    const fName = wicketFielder.trim();
    if (wicketType === 'bowled') {
      dismissalText = `b ${bowlName}`;
    } else if (wicketType === 'caught') {
      if (fName) {
        if (fName.toLowerCase() === bowlName.toLowerCase()) {
          dismissalText = `c & b ${bowlName}`;
        } else {
          dismissalText = `c ${fName} b ${bowlName}`;
        }
      } else {
        dismissalText = `c ? b ${bowlName}`;
      }
    } else if (wicketType === 'lbw') {
      dismissalText = `lbw b ${bowlName}`;
    } else if (wicketType === 'stumped') {
      dismissalText = fName ? `st ${fName} b ${bowlName}` : `st ? b ${bowlName}`;
    } else if (wicketType === 'runout') {
      dismissalText = fName ? `run out (${fName})` : `run out`;
    } else if (wicketType === 'retired') {
      dismissalText = `retired`;
    }
    dismissedBat.dismissal = dismissalText;

    // Update team wickets
    score.wickets += 1;
    score.ballsBowled += 1;
    score.overHistory.push("W");

    // Generate commentary
    const commText = generateCommentary(
      getOverBallString(score.ballsBowled),
      bowlName,
      wicketBatsman,
      0,
      'wicket',
      0,
      wicketType,
      wicketFielder
    );
    if (!score.commentary) score.commentary = [];
    score.commentary.push(commText);

    // Add fall of wicket log
    score.fallOfWickets.push({
      wicketNum: score.wickets,
      score: score.runs,
      overs: formatOvers(score.ballsBowled),
      batsman: wicketBatsman,
    });

    // Update bowler (unless it is runout/retired)
    const bowler = getOrInitBowler(score, bowlName);
    bowler.ballsBowled += 1;
    if (wicketType !== 'runout' && wicketType !== 'retired') {
      bowler.wickets += 1;
    }

    // Striker faces ball
    if (wicketBatsman === m.striker) {
      dismissedBat.ballsFaced += 1;
    } else {
      // Non-striker was run out (no ball faced for them on this delivery)
      getOrInitBatsman(score, bName).ballsFaced += 1; // Striker faced the ball
    }

    // Set new batsman
    const totalWicketsPossible = getBattingTeamSquad(m).length - 1;
    const allOut = score.wickets >= totalWicketsPossible || score.wickets >= 10;

    if (!allOut && newBatsman) {
      getOrInitBatsman(score, newBatsman);
      if (wicketBatsman === m.striker) {
        m.striker = newBatsman;
      } else {
        m.nonStriker = newBatsman;
      }
    } else {
      if (wicketBatsman === m.striker) {
        m.striker = '';
      } else {
        m.nonStriker = '';
      }
    }

    m = updateActiveInningsScore(m, score);
    setShowWicketModal(false);
    checkMatchMilestones(m);
  };

  // Milestone triggers (End of over, Innings complete)
  const checkMatchMilestones = (m: LocalMatch) => {
    const score = getActiveInningsScore(m);
    
    // Check if team is all out
    const squad = getBattingTeamSquad(m);
    const totalWicketsPossible = squad.length - 1;
    const isAllOut = score.wickets >= totalWicketsPossible || score.wickets >= 10;

    // Check if overs are completed
    const maxBalls = m.overs * 6;
    const isOversFinished = score.ballsBowled >= maxBalls;

    // Target check (Innings 2 only)
    let isChaseCompleted = false;
    if (m.currentInnings === 2) {
      const target = m.teamAScore.runs + 1;
      if (score.runs >= target) {
        isChaseCompleted = true;
      }
    }

    if (isChaseCompleted || isAllOut || isOversFinished) {
      // End Innings / Match
      handleInningsEnd(m);
      return;
    }

    // If over complete (6 legal balls)
    const isOverComplete = score.ballsBowled > 0 && score.ballsBowled % 6 === 0 && score.ballsBowled !== maxBalls;
    if (isOverComplete) {
      if (!score.overScores) score.overScores = [];
      score.overScores.push(score.runs);
      saveMatchState(m);
      
      // Auto swap strike on end of over
      const temp = m.striker;
      m.striker = m.nonStriker;
      m.nonStriker = temp;

      // Bowler selection prompt
      const bowlingSquad = getBowlingTeamSquad(m);
      const otherBowlers = bowlingSquad.filter((b) => b !== m.currentBowler);
      setNextBowler(otherBowlers[0] || '');
      setShowBowlerSelect(true);
      return;
    }

    saveMatchState(m);
  };

  const confirmNewBowler = () => {
    if (!currentMatch || !nextBowler) return;

    let m = { ...currentMatch };
    let score = getActiveInningsScore(m);

    // Swap bowler & clear over timeline history for UI
    score.overHistory = [];
    if (!score.bowlerStats[nextBowler]) {
      score.bowlerStats[nextBowler] = { name: nextBowler, ballsBowled: 0, maidens: 0, runsConceded: 0, wickets: 0 };
    }

    m = updateActiveInningsScore(m, score);
    m.currentBowler = nextBowler;

    saveMatchState(m);
    setShowBowlerSelect(false);
    triggerToast(`New Bowler: ${nextBowler}`, 'success');
  };

  const handleInningsEnd = (m: LocalMatch) => {
    const score = getActiveInningsScore(m);
    if (!score.overScores) score.overScores = [];
    if (score.overScores[score.overScores.length - 1] !== score.runs) {
      score.overScores.push(score.runs);
    }

    if (m.currentInnings === 1) {
      triggerToast("First Innings Completed!", 'success');
      
      // Setup 2nd Innings opener selections
      const nextMatch: LocalMatch = {
        ...m,
        currentInnings: 2,
        striker: '',
        nonStriker: '',
        currentBowler: '',
      };

      const battingSquad = getBattingTeamSquad(nextMatch);
      setSelectedStriker(battingSquad[0] || '');
      setSelectedNonStriker(battingSquad[1] || '');
      
      const bowlingSquad = getBowlingTeamSquad(nextMatch);
      setSelectedBowler(bowlingSquad[0] || '');

      saveMatchState(nextMatch);
      setShowOpenerSelect(true);
    } else {
      // Match completed
      const nextMatch: LocalMatch = {
        ...m,
        status: 'completed',
      };
      saveMatchState(nextMatch);
      setViewingScorecard(nextMatch);
      setCurrentMatch(null);
      triggerToast("Match Finished!", 'success');
    }
  };

  // Close match or scorecard
  const handleExitMatch = () => {
    setCurrentMatch(null);
    loadMatches();
  };

  const handleCloseScorecard = () => {
    setViewingScorecard(null);
    // Clear hash link
    window.location.hash = 'scorer';
    loadMatches();
  };

  const resumeMatch = (m: LocalMatch) => {
    setCurrentMatch(m);
    // Determine opener / bowler select requirements
    if (!m.striker || !m.nonStriker || !m.currentBowler) {
      const battingSquad = getBattingTeamSquad(m);
      setSelectedStriker(battingSquad[0] || '');
      setSelectedNonStriker(battingSquad[1] || '');
      const bowlingSquad = getBowlingTeamSquad(m);
      setSelectedBowler(bowlingSquad[0] || '');
      setShowOpenerSelect(true);
    }
  };

  const deleteMatch = (id: string, e: any) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this match scorecard?")) {
      const updated = matches.filter((item) => item.id !== id);
      saveMatchesList(updated);
      triggerToast("Match Deleted", 'success');
    }
  };

  // Share scorecard calculations
  const getMatchWinnerString = (m: LocalMatch) => {
    const runsA = m.teamAScore.runs;
    const runsB = m.teamBScore.runs;
    const wicketsB = m.teamBScore.wickets;

    const teamABatsFirst = (m.tossWinner === m.teamA && m.tossDecision === 'bat') || (m.tossWinner === m.teamB && m.tossDecision === 'bowl');
    const teamNameA = teamABatsFirst ? m.teamA : m.teamB;
    const teamNameB = teamABatsFirst ? m.teamB : m.teamA;

    if (runsB === runsA) {
      return `Match Tied!`;
    } else if (runsB > runsA) {
      const wicketsLeft = (m.teamBSquad.length - 1) - wicketsB;
      return `${teamNameB} won by ${wicketsLeft} Wickets!`;
    } else {
      const runsDiff = runsA - runsB;
      return `${teamNameA} won by ${runsDiff} Runs!`;
    }
  };

  const shareScorecardText = (m: LocalMatch) => {
    const teamABatsFirst = (m.tossWinner === m.teamA && m.tossDecision === 'bat') || (m.tossWinner === m.teamB && m.tossDecision === 'bowl');
    const teamName1 = teamABatsFirst ? m.teamA : m.teamB;
    const teamName2 = teamABatsFirst ? m.teamB : m.teamA;

    const score1 = m.teamAScore;
    const score2 = m.teamBScore;
    const winnerText = m.status === 'completed' ? getMatchWinnerString(m) : 'MATCH IN PROGRESS';

    let msg = `🏏 *CRICKET SCORECARD SUMMARY* 🏏\n`;
    msg += `🏆 *${teamName1} vs ${teamName2}* (${m.overs} Overs)\n`;
    msg += `📅 Date: ${m.date}\n\n`;
    msg += `🔴 *1st Innings - ${teamName1}*:\n`;
    msg += `👉 ${score1.runs}/${score1.wickets} in ${formatOvers(score1.ballsBowled)} Overs\n`;
    msg += `Top Batsmen:\n`;
    Object.values(score1.batsmenStats).slice(0, 3).forEach((b) => {
      msg += `  • ${b.name}: ${b.runs} (${b.ballsFaced})${b.status === 'out' ? '' : '*'}\n`;
    });
    msg += `Top Bowlers:\n`;
    Object.values(score1.bowlerStats).slice(0, 2).forEach((bowler) => {
      msg += `  • ${bowler.name}: ${bowler.wickets}/${bowler.runsConceded} (${formatOvers(bowler.ballsBowled)})\n`;
    });

    if (m.currentInnings === 2 || m.status === 'completed') {
      msg += `\n🔵 *2nd Innings - ${teamName2}*:\n`;
      msg += `👉 ${score2.runs}/${score2.wickets} in ${formatOvers(score2.ballsBowled)} Overs\n`;
      msg += `Top Batsmen:\n`;
      Object.values(score2.batsmenStats).slice(0, 3).forEach((b) => {
        msg += `  • ${b.name}: ${b.runs} (${b.ballsFaced})${b.status === 'out' ? '' : '*'}\n`;
      });
      msg += `Top Bowlers:\n`;
      Object.values(score2.bowlerStats).slice(0, 2).forEach((bowler) => {
        msg += `  • ${bowler.name}: ${bowler.wickets}/${bowler.runsConceded} (${formatOvers(bowler.ballsBowled)})\n`;
      });
    }

    msg += `\n📣 *Result:* ${winnerText}\n`;
    msg += `Shared from ManucricK Local Scorer.`;

    navigator.clipboard.writeText(msg);
    triggerToast("Scorecard text copied to clipboard!", 'success');
  };

  const copyShareLink = (m: LocalMatch) => {
    // Unicode safe base64 encoding
    const jsonStr = JSON.stringify(m);
    const b64 = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
    
    const link = `${window.location.origin}${window.location.pathname}#share-scorecard?data=${b64}`;
    navigator.clipboard.writeText(link);
    triggerToast("Base64 Share Link copied to clipboard!", 'success');
  };

interface MatchAwardsResult {
    bestBatsman: { name: string; runs: number; balls: number; fours: number; sixes: number; team: string } | null;
    bestBowler: { name: string; wickets: number; runs: number; balls: number; team: string } | null;
    playerOfTheMatch: { name: string; score: number; performance: string; team: string } | null;
    starPerformance: string;
  }

  const getMatchAwards = (m: LocalMatch): MatchAwardsResult => {
    const allBatsmen: { name: string; runs: number; balls: number; fours: number; sixes: number; team: string }[] = [];
    const allBowlers: { name: string; wickets: number; runs: number; balls: number; team: string }[] = [];

    const winner = (m.tossWinner || '').trim().toLowerCase();
    const tA = (m.teamA || '').trim().toLowerCase();
    const tB = (m.teamB || '').trim().toLowerCase();
    const teamABatsFirst = (winner === tA && m.tossDecision === 'bat') || (winner === tB && m.tossDecision === 'bowl');
    
    const team1 = teamABatsFirst ? m.teamA : m.teamB;
    const team2 = teamABatsFirst ? m.teamB : m.teamA;

    Object.values(m.teamAScore.batsmenStats).forEach((b) => {
      allBatsmen.push({ name: b.name, runs: b.runs, balls: b.ballsFaced, fours: b.fours, sixes: b.sixes, team: team1 });
    });
    Object.values(m.teamAScore.bowlerStats).forEach((bowler) => {
      allBowlers.push({ name: bowler.name, wickets: bowler.wickets, runs: bowler.runsConceded, balls: bowler.ballsBowled, team: team2 });
    });

    Object.values(m.teamBScore.batsmenStats).forEach((b) => {
      allBatsmen.push({ name: b.name, runs: b.runs, balls: b.ballsFaced, fours: b.fours, sixes: b.sixes, team: team2 });
    });
    Object.values(m.teamBScore.bowlerStats).forEach((bowler) => {
      allBowlers.push({ name: bowler.name, wickets: bowler.wickets, runs: bowler.runsConceded, balls: bowler.ballsBowled, team: team1 });
    });

    let bestBatsman = allBatsmen.reduce((max, b) => (b.runs > (max?.runs || 0) ? b : max), null as typeof allBatsmen[0] | null);
    if (bestBatsman && bestBatsman.runs === 0) bestBatsman = null;

    let bestBowler = allBowlers.reduce((max, b) => {
      if (!max) return b;
      if (b.wickets > max.wickets) return b;
      if (b.wickets === max.wickets) {
        const econB = b.balls > 0 ? (b.runs / b.balls) * 6 : 999;
        const econMax = max.balls > 0 ? (max.runs / max.balls) * 6 : 999;
        return econB < econMax ? b : max;
      }
      return max;
    }, null as typeof allBowlers[0] | null);
    if (bestBowler && bestBowler.wickets === 0 && bestBowler.runs === 0 && bestBowler.balls === 0) bestBowler = null;

    let playerOfTheMatch: { name: string; score: number; performance: string; team: string } | null = null;
    let maxScore = -1;

    allBatsmen.forEach((b) => {
      if (b.balls === 0) return;
      const sr = (b.runs / b.balls) * 100;
      let score = b.runs + (sr > 150 ? b.runs * 0.15 : 0) + b.sixes * 2.5 + b.fours * 1.2;
      if (score > maxScore) {
        maxScore = score;
        playerOfTheMatch = {
          name: b.name,
          score,
          performance: `Scored ${b.runs} runs off ${b.balls} balls (${b.fours}x4, ${b.sixes}x6, SR: ${sr.toFixed(1)})`,
          team: b.team,
        };
      }
    });

    allBowlers.forEach((b) => {
      if (b.balls === 0) return;
      const econ = (b.runs / b.balls) * 6;
      let score = b.wickets * 25;
      if (b.balls >= 6) {
        if (econ < 6.0) score += (6.0 - econ) * 6;
        if (econ > 10.0) score -= (econ - 10.0) * 3;
      }
      if (score > maxScore) {
        maxScore = score;
        const overs = Math.floor(b.balls / 6) + '.' + (b.balls % 6);
        playerOfTheMatch = {
          name: b.name,
          score,
          performance: `Took ${b.wickets} wickets, conceded ${b.runs} runs in ${overs} overs (Econ: ${econ.toFixed(2)})`,
          team: b.team,
        };
      }
    });

    let starPerformance = '';
    if (playerOfTheMatch) {
      const potmName = (playerOfTheMatch as any).name;
      const otherBatsmen = allBatsmen.filter(b => b.name !== potmName && b.runs >= 15);
      const otherBowlers = allBowlers.filter(b => b.name !== potmName && b.wickets >= 1);
      
      const topOtherBat = otherBatsmen.sort((x, y) => y.runs - x.runs)[0];
      const topOtherBowl = otherBowlers.sort((x, y) => y.wickets - x.wickets)[0];

      if (topOtherBat && (!topOtherBowl || topOtherBat.runs > topOtherBowl.wickets * 20)) {
        starPerformance = `${topOtherBat.name} (${topOtherBat.team}): ${topOtherBat.runs} runs off ${topOtherBat.balls} balls`;
      } else if (topOtherBowl) {
        const ovs = Math.floor(topOtherBowl.balls / 6) + '.' + (topOtherBowl.balls % 6);
        starPerformance = `${topOtherBowl.name} (${topOtherBowl.team}): ${topOtherBowl.wickets} Wkts, conceded ${topOtherBowl.runs} runs in ${ovs} overs`;
      }
    }

    return {
      bestBatsman,
      bestBowler,
      playerOfTheMatch,
      starPerformance,
    };
  };

  const renderWormChart = (m: LocalMatch) => {
    const oA = m.teamAScore.overScores || [];
    const oB = m.teamBScore.overScores || [];
    
    // Fallback: if no scores yet, add a 0 starting score
    const scoresA = [0, ...oA];
    const scoresB = [0, ...oB];
    
    const maxOvers = m.overs;
    const maxScore = Math.max(10, m.teamAScore.runs, m.teamBScore.runs);
    
    // SVG Dimensions
    const svgW = 600;
    const svgH = 260;
    const padX = 50;
    const padY = 30;
    
    const chartW = svgW - 2 * padX;
    const chartH = svgH - 2 * padY;
    
    // Helper to get X/Y coords
    const getX = (overIdx: number) => padX + (overIdx / maxOvers) * chartW;
    const getY = (runs: number) => svgH - padY - (runs / maxScore) * chartH;
    
    // Generate Path D strings
    let pathA = '';
    scoresA.forEach((runs, i) => {
      const x = getX(i);
      const y = getY(runs);
      if (i === 0) pathA = `M ${x} ${y}`;
      else pathA += ` L ${x} ${y}`;
    });
    
    let pathB = '';
    scoresB.forEach((runs, i) => {
      const x = getX(i);
      const y = getY(runs);
      if (i === 0) pathB = `M ${x} ${y}`;
      else pathB += ` L ${x} ${y}`;
    });
    
    // Grid lines count
    const gridLinesCount = 4;
    const gridYVals: number[] = [];
    for (let i = 1; i <= gridLinesCount; i++) {
      gridYVals.push(Math.round((maxScore / gridLinesCount) * i));
    }
    
    const teamABatsFirst = (m.tossWinner === m.teamA && m.tossDecision === 'bat') || (m.tossWinner === m.teamB && m.tossDecision === 'bowl');
    const teamName1 = teamABatsFirst ? m.teamA : m.teamB;
    const teamName2 = teamABatsFirst ? m.teamB : m.teamA;
    
    return (
      <div className="glass-panel scroll-animate" style={{ padding: '24px', border: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto' }}>
        <h4 style={{ fontFamily: 'var(--font-headings)', fontSize: '1.4rem', color: '#FFF', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <span>📈 RUN PROGRESSION (WORM CHART)</span>
          <div style={{ display: 'flex', gap: '15px', fontSize: '0.78rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FF3B30' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '4px', backgroundColor: '#FF3B30', borderRadius: '2px' }} />
              1st Innings ({teamName1})
            </span>
            {(m.currentInnings === 2 || m.status === 'completed') && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '4px', backgroundColor: 'var(--primary)', borderRadius: '2px' }} />
                2nd Innings ({teamName2})
              </span>
            )}
          </div>
        </h4>
        
        <div style={{ width: '100%', minWidth: '500px', position: 'relative' }}>
          <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
            {/* Background Grid Lines */}
            {gridYVals.map((val, idx) => {
              const y = getY(val);
              return (
                <g key={idx}>
                  <line x1={padX} y1={y} x2={svgW - padX} y2={y} stroke="rgba(255, 255, 255, 0.06)" strokeDasharray="4 4" />
                  <text x={padX - 8} y={y + 4} fill="var(--text-secondary)" fontSize="0.75rem" textAnchor="end">{val}</text>
                </g>
              );
            })}
            
            {/* Zero label */}
            <text x={padX - 8} y={getY(0) + 4} fill="var(--text-secondary)" fontSize="0.75rem" textAnchor="end">0</text>
            
            {/* Vertical Over Lines */}
            {Array.from({ length: maxOvers + 1 }).map((_, i) => {
              const x = getX(i);
              return (
                <g key={i}>
                  <line x1={x} y1={padY} x2={x} y2={svgH - padY} stroke="rgba(255, 255, 255, 0.05)" />
                  <text x={x} y={svgH - padY + 18} fill="var(--text-secondary)" fontSize="0.75rem" textAnchor="middle">
                    {i === 0 ? 'Start' : `Ov ${i}`}
                  </text>
                </g>
              );
            })}
            
            {/* Line Team A (1st Innings) */}
            {oA.length > 0 && (
              <>
                <path d={pathA} fill="none" stroke="#FF3B30" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0px 0px 4px rgba(255, 59, 48, 0.4))' }} />
                {scoresA.map((runs, i) => (
                  <g key={i}>
                    <circle cx={getX(i)} cy={getY(runs)} r="4" fill="#050A18" stroke="#FF3B30" strokeWidth="2.5" />
                    {i > 0 && (
                      <text x={getX(i)} y={getY(runs) - 10} fill="#FFF" fontSize="0.72rem" fontWeight="bold" textAnchor="middle">
                        {runs}
                      </text>
                    )}
                  </g>
                ))}
              </>
            )}
            
            {/* Line Team B (2nd Innings) */}
            {oB.length > 0 && (
              <>
                <path d={pathB} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0px 0px 4px rgba(0, 255, 135, 0.4))' }} />
                {scoresB.map((runs, i) => (
                  <g key={i}>
                    <circle cx={getX(i)} cy={getY(runs)} r="4" fill="#050A18" stroke="var(--primary)" strokeWidth="2.5" />
                    {i > 0 && (
                      <text x={getX(i)} y={getY(runs) + 16} fill="#FFF" fontSize="0.72rem" fontWeight="bold" textAnchor="middle">
                        {runs}
                      </text>
                    )}
                  </g>
                ))}
              </>
            )}
          </svg>
        </div>
      </div>
    );
  };

  const renderDetailedScorecard = (m: LocalMatch) => {
    const winner = (m.tossWinner || '').trim().toLowerCase();
    const tA = (m.teamA || '').trim().toLowerCase();
    const tB = (m.teamB || '').trim().toLowerCase();
    const teamABatsFirst = (winner === tA && m.tossDecision === 'bat') || (winner === tB && m.tossDecision === 'bowl');
    
    const teamName1 = teamABatsFirst ? m.teamA : m.teamB;
    const teamName2 = teamABatsFirst ? m.teamB : m.teamA;
    const score1 = m.teamAScore;
    const score2 = m.teamBScore;
    const winnerText = m.status === 'completed' ? getMatchWinnerString(m) : 'MATCH IN PROGRESS';
    const awards = m.status === 'completed' ? getMatchAwards(m) : null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', textAlign: 'left' }}>
        {/* TV Style Scorecard HUD */}
        <div className="glass-panel" style={{ padding: '24px 30px', border: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 800 }}>
            LOCAL CRICKET MATCH SCORECARD
          </div>
          <h2 style={{ fontFamily: 'var(--font-headings)', fontSize: '2.5rem', color: '#FFF', margin: '10px 0 6px' }}>
            {teamName1} vs {teamName2}
          </h2>
          <div style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            📢 Result: {winnerText}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Match Played on: {m.date} &bull; Toss: {m.tossWinner} chose to {m.tossDecision}
          </div>
        </div>

        {/* Awards and highlights */}
        {awards && (
          <div className="glass-panel scroll-animate" style={{ padding: '24px', border: '2px solid rgba(255, 215, 0, 0.25)', background: 'radial-gradient(circle at 10% 20%, rgba(255, 215, 0, 0.04) 0%, transparent 60%)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-15px', right: '-15px', fontSize: '5.5rem', opacity: 0.06, pointerEvents: 'none' }}>🏆</div>
            
            <h4 style={{ fontFamily: 'var(--font-headings)', fontSize: '1.8rem', color: '#ffd700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255, 215, 0, 0.15)', paddingBottom: '8px' }}>
              🎖️ MATCH AWARDS & HIGHLIGHTS
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
              {awards.playerOfTheMatch && (
                <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255, 215, 0, 0.15)', borderRadius: '8px', padding: '15px' }}>
                  <div style={{ fontSize: '0.78rem', color: '#ffd700', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>🌟 Player of the Match</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF', marginTop: '6px' }}>{awards.playerOfTheMatch.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{awards.playerOfTheMatch.team}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', marginTop: '8px', fontStyle: 'italic', lineHeight: '1.3' }}>{awards.playerOfTheMatch.performance}</div>
                </div>
              )}

              {awards.bestBatsman && (
                <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(0, 255, 135, 0.15)', borderRadius: '8px', padding: '15px' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>🏏 Best Batsman</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF', marginTop: '6px' }}>{awards.bestBatsman.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{awards.bestBatsman.team}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', marginTop: '8px', lineHeight: '1.3' }}>
                    Scored <strong>{awards.bestBatsman.runs}</strong> runs off <strong>{awards.bestBatsman.balls}</strong> balls ({awards.bestBatsman.fours}x4, {awards.bestBatsman.sixes}x6)
                  </div>
                </div>
              )}

              {awards.bestBowler && (
                <div style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255, 107, 0, 0.15)', borderRadius: '8px', padding: '15px' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--secondary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>🥎 Best Bowler</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF', marginTop: '6px' }}>{awards.bestBowler.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{awards.bestBowler.team}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', marginTop: '8px', lineHeight: '1.3' }}>
                    Took <strong>{awards.bestBowler.wickets}</strong> Wkts, conceded <strong>{awards.bestBowler.runs}</strong> runs (Econ: {((awards.bestBowler.runs / awards.bestBowler.balls) * 6).toFixed(2)})
                  </div>
                </div>
              )}
            </div>

            {awards.starPerformance && (
              <div style={{ marginTop: '14px', fontSize: '0.85rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ color: '#ffd700' }}>🔥</span> <strong>Star Performance:</strong> {awards.starPerformance}
              </div>
            )}
          </div>
        )}

        {/* Tab Selector inside detailed scorecard */}
        <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '10px' }}>
          <button
            onClick={() => setDetailedScorecardTab('tables')}
            style={{
              flex: 1,
              padding: '12px 0',
              backgroundColor: detailedScorecardTab === 'tables' ? 'var(--primary)' : 'rgba(255,255,255,0.02)',
              color: detailedScorecardTab === 'tables' ? '#050A18' : '#FFF',
              border: 'none',
              fontFamily: 'var(--font-headings)',
              fontSize: '1.1rem',
              letterSpacing: '1px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            className="interactive"
          >
            📈 FULL STATS TABLES
          </button>
          <button
            onClick={() => setDetailedScorecardTab('commentary')}
            style={{
              flex: 1,
              padding: '12px 0',
              backgroundColor: detailedScorecardTab === 'commentary' ? 'var(--primary)' : 'rgba(255,255,255,0.02)',
              color: detailedScorecardTab === 'commentary' ? '#050A18' : '#FFF',
              border: 'none',
              fontFamily: 'var(--font-headings)',
              fontSize: '1.1rem',
              letterSpacing: '1px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            className="interactive"
          >
            💬 BALL-BY-BALL COMMENTARY
          </button>
        </div>

        {detailedScorecardTab === 'tables' && (
          <>
            {/* Run progression worm chart */}
            {renderWormChart(m)}

            {/* 1st Innings details */}
            <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '16px' }}>
            <h4 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FF3B30' }} />
              1st Innings: {teamName1}
            </h4>
            <div style={{ fontFamily: 'var(--font-headings)', fontSize: '1.6rem', color: '#FFF' }}>
              {score1.runs} / {score1.wickets} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>({formatOvers(score1.ballsBowled)} Ov)</span>
            </div>
          </div>

          {/* Batting table */}
          <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '8px 4px' }}>Batsman</th>
                  <th style={{ padding: '8px 4px' }}>Status</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>R</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>B</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>4s</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>6s</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>SR</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(score1.batsmenStats).length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '15px 4px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No batsmen faced a delivery yet.</td>
                  </tr>
                ) : (
                  Object.values(score1.batsmenStats).map((b) => (
                    <tr key={b.name} style={{ color: '#FFF', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '10px 4px', fontWeight: 'bold' }}>{b.name} {m.striker === b.name && m.currentInnings === 1 && m.status === 'live' ? '*' : ''}</td>
                      <td style={{ padding: '10px 4px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{b.status === 'out' ? (b.dismissal || 'Out') : 'not out'}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'center', fontWeight: 'bold' }}>{b.runs}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'center' }}>{b.ballsFaced}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'center' }}>{b.fours}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'center' }}>{b.sixes}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'center', color: 'var(--primary)' }}>{calculateSR(b.runs, b.ballsFaced)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Extras */}
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
            <strong>Extras: </strong> 
            {score1.wideRuns + score1.noBallRuns + score1.legByes + score1.byes} 
            (Wd: {score1.wideRuns}, Nb: {score1.noBallRuns}, Lb: {score1.legByes}, By: {score1.byes})
          </div>

          {/* Bowling table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '8px 4px' }}>Bowler</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>O</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>M</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>R</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>W</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center' }}>Econ</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(score1.bowlerStats).length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '15px 4px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No bowlers bowled a delivery yet.</td>
                  </tr>
                ) : (
                  Object.values(score1.bowlerStats).map((b) => (
                    <tr key={b.name} style={{ color: '#FFF', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '10px 4px', fontWeight: 'bold' }}>{b.name} {m.currentBowler === b.name && m.currentInnings === 1 && m.status === 'live' ? '🔥' : ''}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'center' }}>{formatOvers(b.ballsBowled)}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'center' }}>{b.maidens}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'center', fontWeight: 'bold' }}>{b.runsConceded}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'center', color: '#FF3B30', fontWeight: 'bold' }}>{b.wickets}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'center', color: 'var(--accent)' }}>{calculateEcon(b.runsConceded, b.ballsBowled)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Fall of Wickets */}
          {score1.fallOfWickets.length > 0 && (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '18px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
              <strong>Fall of Wickets: </strong>
              {score1.fallOfWickets.map((fow, idx) => (
                <span key={idx} style={{ marginRight: '10px' }}>
                  {idx > 0 && ', '}
                  {fow.score}-{fow.wicketNum} ({fow.batsman}, {fow.overs} Ov)
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 2nd Innings details (only if started) */}
        {(m.currentInnings === 2 || m.status === 'completed') && (
          <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '16px' }}>
              <h4 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
                2nd Innings: {teamName2}
              </h4>
              <div style={{ fontFamily: 'var(--font-headings)', fontSize: '1.6rem', color: '#FFF' }}>
                {score2.runs} / {score2.wickets} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>({formatOvers(score2.ballsBowled)} Ov)</span>
              </div>
            </div>

            {/* Batting table */}
            <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th style={{ padding: '8px 4px' }}>Batsman</th>
                    <th style={{ padding: '8px 4px' }}>Status</th>
                    <th style={{ padding: '8px 4px', textAlign: 'center' }}>R</th>
                    <th style={{ padding: '8px 4px', textAlign: 'center' }}>B</th>
                    <th style={{ padding: '8px 4px', textAlign: 'center' }}>4s</th>
                    <th style={{ padding: '8px 4px', textAlign: 'center' }}>6s</th>
                    <th style={{ padding: '8px 4px', textAlign: 'center' }}>SR</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(score2.batsmenStats).length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '15px 4px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No batsmen faced a delivery yet.</td>
                    </tr>
                  ) : (
                    Object.values(score2.batsmenStats).map((b) => (
                      <tr key={b.name} style={{ color: '#FFF', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '10px 4px', fontWeight: 'bold' }}>{b.name} {m.striker === b.name && m.currentInnings === 2 && m.status === 'live' ? '*' : ''}</td>
                        <td style={{ padding: '10px 4px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{b.status === 'out' ? (b.dismissal || 'Out') : 'not out'}</td>
                        <td style={{ padding: '10px 4px', textAlign: 'center', fontWeight: 'bold' }}>{b.runs}</td>
                        <td style={{ padding: '10px 4px', textAlign: 'center' }}>{b.ballsFaced}</td>
                        <td style={{ padding: '10px 4px', textAlign: 'center' }}>{b.fours}</td>
                        <td style={{ padding: '10px 4px', textAlign: 'center' }}>{b.sixes}</td>
                        <td style={{ padding: '10px 4px', textAlign: 'center', color: 'var(--primary)' }}>{calculateSR(b.runs, b.ballsFaced)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Extras */}
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
              <strong>Extras: </strong> 
              {score2.wideRuns + score2.noBallRuns + score2.legByes + score2.byes} 
              (Wd: {score2.wideRuns}, Nb: {score2.noBallRuns}, Lb: {score2.legByes}, By: {score2.byes})
            </div>

            {/* Bowling table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th style={{ padding: '8px 4px' }}>Bowler</th>
                    <th style={{ padding: '8px 4px', textAlign: 'center' }}>O</th>
                    <th style={{ padding: '8px 4px', textAlign: 'center' }}>M</th>
                    <th style={{ padding: '8px 4px', textAlign: 'center' }}>R</th>
                    <th style={{ padding: '8px 4px', textAlign: 'center' }}>W</th>
                    <th style={{ padding: '8px 4px', textAlign: 'center' }}>Econ</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(score2.bowlerStats).length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '15px 4px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No bowlers bowled a delivery yet.</td>
                    </tr>
                  ) : (
                    Object.values(score2.bowlerStats).map((b) => (
                      <tr key={b.name} style={{ color: '#FFF', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '10px 4px', fontWeight: 'bold' }}>{b.name} {m.currentBowler === b.name && m.currentInnings === 2 && m.status === 'live' ? '🔥' : ''}</td>
                        <td style={{ padding: '10px 4px', textAlign: 'center' }}>{formatOvers(b.ballsBowled)}</td>
                        <td style={{ padding: '10px 4px', textAlign: 'center' }}>{b.maidens}</td>
                        <td style={{ padding: '10px 4px', textAlign: 'center', fontWeight: 'bold' }}>{b.runsConceded}</td>
                        <td style={{ padding: '10px 4px', textAlign: 'center', color: '#FF3B30', fontWeight: 'bold' }}>{b.wickets}</td>
                        <td style={{ padding: '10px 4px', textAlign: 'center', color: 'var(--accent)' }}>{calculateEcon(b.runsConceded, b.ballsBowled)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Fall of Wickets */}
            {score2.fallOfWickets.length > 0 && (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '18px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                <strong>Fall of Wickets: </strong>
                {score2.fallOfWickets.map((fow, idx) => (
                  <span key={idx} style={{ marginRight: '10px' }}>
                    {idx > 0 && ', '}
                    {fow.score}-{fow.wicketNum} ({fow.batsman}, {fow.overs} Ov)
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        </>
        )}

        {/* Commentary Tab Content */}
        {detailedScorecardTab === 'commentary' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 2nd Innings Commentary (if it exists) */}
            {(m.currentInnings === 2 || m.status === 'completed') && (
              <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h4 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
                  2nd Innings Commentary: {teamName2}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '450px', overflowY: 'auto' }}>
                  {(!score2.commentary || score2.commentary.length === 0) ? (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontStyle: 'italic', padding: '10px 0' }}>
                      No commentary available for this innings.
                    </div>
                  ) : (
                    [...score2.commentary].reverse().map((line, idx) => {
                      const isW = line.includes(': OUT!') || line.includes(': CLEAN BOWLED!') || line.includes(': Bowled him!') || line.includes(': Caught') || line.includes(': Plumb in front!') || line.includes(': Stumped') || line.includes('falls!');
                      const isBoundary = line.includes('FOUR!') || line.includes('SIX!');
                      const isExtra = line.includes('Wide ball!') || line.includes('No ball!');
                      return (
                        <div
                          key={idx}
                          style={{
                            fontSize: '0.88rem',
                            color: isW ? '#FF3B30' : isBoundary ? 'var(--primary)' : '#FFF',
                            padding: '10px 12px',
                            borderRadius: '6px',
                            backgroundColor: isW ? 'rgba(255, 59, 48, 0.05)' : isBoundary ? 'rgba(0, 255, 135, 0.04)' : 'rgba(255,255,255,0.01)',
                            borderLeft: `3px solid ${isW ? '#FF3B30' : isBoundary ? 'var(--primary)' : isExtra ? 'var(--secondary)' : 'rgba(255,255,255,0.1)'}`,
                            lineHeight: '1.4'
                          }}
                        >
                          {line}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* 1st Innings Commentary */}
            <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h4 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FF3B30' }} />
                1st Innings Commentary: {teamName1}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '450px', overflowY: 'auto' }}>
                {(!score1.commentary || score1.commentary.length === 0) ? (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontStyle: 'italic', padding: '10px 0' }}>
                    No commentary available for this innings.
                  </div>
                ) : (
                  [...score1.commentary].reverse().map((line, idx) => {
                    const isW = line.includes(': OUT!') || line.includes(': CLEAN BOWLED!') || line.includes(': Bowled him!') || line.includes(': Caught') || line.includes(': Plumb in front!') || line.includes(': Stumped') || line.includes('falls!');
                    const isBoundary = line.includes('FOUR!') || line.includes('SIX!');
                    const isExtra = line.includes('Wide ball!') || line.includes('No ball!');
                    return (
                      <div
                        key={idx}
                        style={{
                          fontSize: '0.88rem',
                          color: isW ? '#FF3B30' : isBoundary ? 'var(--primary)' : '#FFF',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          backgroundColor: isW ? 'rgba(255, 59, 48, 0.05)' : isBoundary ? 'rgba(0, 255, 135, 0.04)' : 'rgba(255,255,255,0.01)',
                          borderLeft: `3px solid ${isW ? '#FF3B30' : isBoundary ? 'var(--primary)' : isExtra ? 'var(--secondary)' : 'rgba(255,255,255,0.1)'}`,
                          lineHeight: '1.4'
                        }}
                      >
                        {line}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render match list in lobby
  if (!currentMatch && !viewingScorecard) {
    return (
      <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '20px 10px 100px' }} className="scroll-animate">
        {toast && (
          <div style={{ position: 'fixed', bottom: '20px', right: '20px', backgroundColor: 'rgba(245, 158, 11, 0.95)', color: '#000', padding: '12px 24px', borderRadius: '8px', zIndex: 1000, fontWeight: 'bold', boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)' }}>
            {toast.msg}
          </div>
        )}

        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', marginBottom: '30px', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
          <h3 style={{ fontFamily: 'var(--font-headings)', fontSize: '2.5rem', color: '#FFF', letterSpacing: '1.5px', marginBottom: '8px' }}>
            LOCAL CRICKET SCORER
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', maxWidth: '560px', margin: '0 auto 24px', lineHeight: '1.4' }}>
            Score your street, village, or turf matches ball-by-ball. Displays batsman partnerships, bowler wickets, over logs, and builds shareable TV scorecards. Saved for 5 days.
          </p>

          <button
            onClick={handleStartMatchSetup}
            style={{
              padding: '12px 30px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--primary)',
              color: '#050A18',
              fontFamily: 'var(--font-headings)',
              fontSize: '1.25rem',
              letterSpacing: '1px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 0 12px rgba(0, 255, 135, 0.35)',
              transition: 'transform 0.15s ease',
            }}
            className="interactive"
          >
            ➕ CREATE LOCAL MATCH
          </button>
        </div>

        {/* Setup Match View Overlay Modal */}
        {showSetup && createPortal(
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(10, 10, 10, 0.98)', zIndex: 9999, overflowY: 'auto', padding: '20px 10px' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '620px', padding: '25px', border: '1px solid rgba(245, 158, 11, 0.15)', margin: '40px auto' }}>
              <h4 style={{ fontFamily: 'var(--font-headings)', fontSize: 'clamp(1.4rem, 5vw, 2.2rem)', color: '#FFF', marginBottom: '20px', textAlign: 'center' }}>
                MATCH SETTINGS
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', textAlign: 'left' }}>
                {/* Team Names */}
                <div className="responsive-flex-row">
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Team A Name (Batting Pref)</label>
                    <input value={teamA} onChange={e => setTeamA(e.target.value)} className="premium-input" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Team B Name</label>
                    <input value={teamB} onChange={e => setTeamB(e.target.value)} className="premium-input" />
                  </div>
                </div>

                {/* Overs */}
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Match Overs</label>
                  <select value={matchOvers} onChange={e => setMatchOvers(Number(e.target.value))} className="premium-input">
                    {[2, 3, 5, 8, 10, 12, 15, 20].map((ov) => (
                      <option key={ov} value={ov}>{ov} Overs</option>
                    ))}
                  </select>
                </div>

                {/* Toss */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '15px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Toss Winner</label>
                  <div style={{ display: 'flex', gap: '20px', marginTop: '6px' }}>
                    <label style={{ color: '#FFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="radio" checked={tossWinner === teamA} onChange={() => setTossWinner(teamA)} />
                      {teamA}
                    </label>
                    <label style={{ color: '#FFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="radio" checked={tossWinner === teamB} onChange={() => setTossWinner(teamB)} />
                      {teamB}
                    </label>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Toss Decision</label>
                  <div style={{ display: 'flex', gap: '20px', marginTop: '6px' }}>
                    <label style={{ color: '#FFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="radio" checked={tossDecision === 'bat'} onChange={() => setTossDecision('bat')} />
                      Batting
                    </label>
                    <label style={{ color: '#FFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="radio" checked={tossDecision === 'bowl'} onChange={() => setTossDecision('bowl')} />
                      Bowling
                    </label>
                  </div>
                </div>

                {/* Squad lists */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '15px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Team A Squad List (One Player per line)</label>
                  <textarea rows={4} value={teamASquadText} onChange={e => setTeamASquadText(e.target.value)} className="premium-input premium-textarea" />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Team B Squad List (One Player per line)</label>
                  <textarea rows={4} value={teamBSquadText} onChange={e => setTeamBSquadText(e.target.value)} className="premium-input premium-textarea" />
                </div>
              </div>

              <div className="responsive-flex-row" style={{ marginTop: '30px' }}>
                <button onClick={createNewMatch} style={{ flex: 1, padding: '12px 0', borderRadius: '6px', border: 'none', backgroundColor: 'var(--primary)', color: '#050A18', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }} className="interactive">🏏 START MATCH</button>
                <button onClick={() => setShowSetup(false)} style={{ flex: 1, padding: '12px 0', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'transparent', color: '#FFF', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }} className="interactive">CANCEL</button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Match List History Display */}
        <div>
          <h4 style={{ fontFamily: 'var(--font-headings)', fontSize: '1.8rem', color: '#FFF', textAlign: 'left', marginBottom: '16px', borderLeft: '4px solid var(--primary)', paddingLeft: '10px' }}>
            📅 LOCAL MATCHES (LAST 5 DAYS)
          </h4>

          {matches.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', padding: '40px 0', textAlign: 'center' }}>
              No matches scored in the last 5 days. Click create above to start!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {matches.map((m) => {
                const teamABatsFirst = (m.tossWinner === m.teamA && m.tossDecision === 'bat') || (m.tossWinner === m.teamB && m.tossDecision === 'bowl');
                const teamName1 = teamABatsFirst ? m.teamA : m.teamB;
                const teamName2 = teamABatsFirst ? m.teamB : m.teamA;
                
                return (
                  <div
                    key={m.id}
                    onClick={() => m.status === 'live' ? resumeMatch(m) : setViewingScorecard(m)}
                    className="glass-panel responsive-lobby-card"
                    style={{
                      padding: '20px 24px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', backgroundColor: m.status === 'live' ? 'rgba(0, 255, 135, 0.12)' : 'rgba(255,255,255,0.06)', color: m.status === 'live' ? 'var(--primary)' : 'var(--text-secondary)', textTransform: 'uppercase' }}>
                          {m.status}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{m.date}</span>
                      </div>
                      
                      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1.2rem', color: '#FFF' }}>
                        {teamName1} vs {teamName2}
                      </div>

                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                        {m.teamAScore.runs}/{m.teamAScore.wickets} ({formatOvers(m.teamAScore.ballsBowled)})
                        { (m.currentInnings === 2 || m.status === 'completed') && (
                          <span>  vs  {m.teamBScore.runs}/{m.teamBScore.wickets} ({formatOvers(m.teamBScore.ballsBowled)})</span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); shareScorecardText(m); }}
                        style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--primary)', backgroundColor: 'transparent', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                        className="interactive"
                        title="Copy Summary text for WhatsApp"
                      >
                        📲 TEXT
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); copyShareLink(m); }}
                        style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--accent)', backgroundColor: 'transparent', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                        className="interactive"
                        title="Copy Web Share Link"
                      >
                        🔗 LINK
                      </button>
                      <button
                        onClick={(e) => deleteMatch(m.id, e)}
                        style={{ padding: '6px 10px', borderRadius: '4px', border: 'none', backgroundColor: '#FF3B30', color: '#FFF', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                        className="interactive"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Shared Read-Only View or Completed Match scorecard details
  if (viewingScorecard) {
    const m = viewingScorecard;

    return (
      <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: '20px 10px 100px' }} className="scroll-animate">
        {toast && (
          <div style={{ position: 'fixed', bottom: '20px', right: '20px', backgroundColor: 'rgba(245, 158, 11, 0.95)', color: '#000', padding: '12px 24px', borderRadius: '8px', zIndex: 1000, fontWeight: 'bold' }}>
            {toast.msg}
          </div>
        )}

        <div className="responsive-flex-row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={handleCloseScorecard} style={{ padding: '8px 18px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.18)', backgroundColor: 'transparent', color: '#FFF', fontWeight: 'bold', cursor: 'pointer' }} className="interactive">
            ⬅️ LOBBY HOME
          </button>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => shareScorecardText(m)} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--primary)', color: '#050A18', fontWeight: 'bold', cursor: 'pointer' }} className="interactive">
              📋 COPY TEXT
            </button>
            <button onClick={() => copyShareLink(m)} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--accent)', color: '#050A18', fontWeight: 'bold', cursor: 'pointer' }} className="interactive">
              🔗 COPY SHARE LINK
            </button>
          </div>
        </div>

        {renderDetailedScorecard(m)}
      </div>
    );
  }

  // GAMEPLAY LIVE SCORER VIEW
  if (!currentMatch) return null;

  const activeScore = getActiveInningsScore(currentMatch);
  const battingTeam = getBattingTeamName(currentMatch);
  
  // Opener select dialog
  const needsOpeners = !currentMatch.striker || !currentMatch.nonStriker || !currentMatch.currentBowler;
  if (showOpenerSelect || needsOpeners) {
    const squad = getBattingTeamSquad(currentMatch);
    const bowlingSquad = getBowlingTeamSquad(currentMatch);

    // Auto-populate default selections if state values are empty
    if (squad.length >= 2 && (!selectedStriker || !selectedNonStriker)) {
      if (!selectedStriker) setSelectedStriker(squad[0]);
      if (!selectedNonStriker) setSelectedNonStriker(squad[1]);
    }
    if (bowlingSquad.length > 0 && !selectedBowler) {
      setSelectedBowler(bowlingSquad[0]);
    }

    return (
      <div style={{ width: '100%', maxWidth: '540px', margin: '0 auto', padding: '20px 10px 100px' }} className="scroll-animate">
        <div className="glass-panel" style={{ padding: '30px', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
          <h4 style={{ fontFamily: 'var(--font-headings)', fontSize: '2rem', color: '#FFF', marginBottom: '20px', textAlign: 'center' }}>
            SELECT INNINGS OPENERS ({currentMatch.currentInnings === 1 ? '1st' : '2nd'} Innings)
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', textAlign: 'left' }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Opening Striker (Batting)</label>
              <select value={selectedStriker} onChange={(e) => setSelectedStriker(e.target.value)} className="premium-input">
                <option value="">-- Choose Striker --</option>
                {squad.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Opening Non-Striker (Batting)</label>
              <select value={selectedNonStriker} onChange={(e) => setSelectedNonStriker(e.target.value)} className="premium-input">
                <option value="">-- Choose Non-Striker --</option>
                {squad.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Opening Bowler</label>
              <select value={selectedBowler} onChange={(e) => setSelectedBowler(e.target.value)} className="premium-input">
                <option value="">-- Choose Bowler --</option>
                {bowlingSquad.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="responsive-flex-row" style={{ marginTop: '30px' }}>
            <button onClick={confirmOpeners} style={{ flex: 1, padding: '12px 0', borderRadius: '6px', border: 'none', backgroundColor: 'var(--primary)', color: '#050A18', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }} className="interactive">🏏 START MATCH</button>
            <button onClick={handleExitMatch} style={{ flex: 1, padding: '12px 0', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'transparent', color: '#FFF', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }} className="interactive">EXIT TO LOBBY</button>
          </div>
        </div>
      </div>
    );
  }

  // Bowler selection prompt modal
  const otherBowlersList = getBowlingTeamSquad(currentMatch).filter(b => b !== currentMatch.currentBowler);

  // Wicket options Choosing Dropdowns
  const battingSquad = getBattingTeamSquad(currentMatch);
  const unbatted = currentMatch ? battingSquad.filter((p) => !Object.keys(getActiveInningsScore(currentMatch).batsmenStats).includes(p)) : [];

  return (
    <div style={{ width: '100%', maxWidth: '850px', margin: '0 auto', padding: '20px 10px 100px' }} className="scroll-animate">
      {toast && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', backgroundColor: 'rgba(245, 158, 11, 0.95)', color: '#000', padding: '12px 24px', borderRadius: '8px', zIndex: 1000, fontWeight: 'bold' }}>
          {toast.msg}
        </div>
      )}

      {/* Over Complete Bowler Select Overlay Modal */}
      {showBowlerSelect && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(10, 10, 10, 0.97)', zIndex: 9999, overflowY: 'auto', padding: '20px 10px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '25px', border: '1px solid rgba(245, 158, 11, 0.15)', margin: '40px auto' }}>
            <h4 style={{ fontFamily: 'var(--font-headings)', fontSize: '1.8rem', color: '#FFF', marginBottom: '14px', textAlign: 'center' }}>
              🏏 OVER COMPLETE!
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px', textAlign: 'center' }}>
              Select a new bowler for the next over from the squad.
            </p>

            <select value={nextBowler} onChange={(e) => setNextBowler(e.target.value)} className="premium-input" style={{ marginBottom: '20px' }}>
              {otherBowlersList.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <button onClick={confirmNewBowler} style={{ width: '100%', padding: '12px 0', borderRadius: '6px', border: 'none', backgroundColor: 'var(--primary)', color: '#050A18', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }} className="interactive">
              START NEXT OVER
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* No Ball Modal popup */}
      {showNoBallModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(10, 10, 10, 0.97)', zIndex: 9999, overflowY: 'auto', padding: '20px 10px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '25px', border: '1px solid rgba(245, 158, 11, 0.15)', margin: '40px auto' }}>
            <h4 style={{ fontFamily: 'var(--font-headings)', fontSize: '1.8rem', color: '#FFF', marginBottom: '14px', textAlign: 'center' }}>
              ⚡ NO BALL EXTRA
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px', textAlign: 'center' }}>
              How many runs were scored off the bat?
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
              {[0, 1, 2, 3, 4, 6].map((r) => (
                <button
                  key={r}
                  onClick={() => setNoBallOffBatRuns(r)}
                  style={{
                    padding: '12px 0',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: noBallOffBatRuns === r ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                    backgroundColor: noBallOffBatRuns === r ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                    color: '#FFF',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                  }}
                  className="interactive"
                >
                  {r}
                </button>
              ))}
            </div>

            <button onClick={confirmNoBall} style={{ width: '100%', padding: '12px 0', borderRadius: '6px', border: 'none', backgroundColor: 'var(--primary)', color: '#050A18', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }} className="interactive">
              CONFIRM NO BALL
            </button>
          </div>
        </div>,
        document.body
      )}



      {/* Wicket Modal popup */}
      {showWicketModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(10, 10, 10, 0.97)', zIndex: 9999, overflowY: 'auto', padding: '20px 10px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '25px', border: '1px solid rgba(245, 158, 11, 0.15)', margin: '40px auto' }}>
            <h4 style={{ fontFamily: 'var(--font-headings)', fontSize: '1.8rem', color: '#FFF', marginBottom: '18px', textAlign: 'center' }}>
              🛑 LOG WICKET DISMISSAL
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
              {/* Dismissal type */}
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Dismissal Type</label>
                <select 
                  value={wicketType} 
                  onChange={(e) => {
                    const type = e.target.value;
                    setWicketType(type);
                    if (type !== 'runout' && type !== 'retired') {
                      setWicketBatsman(currentMatch.striker);
                    }
                  }} 
                  className="premium-input"
                >
                  {['bowled', 'caught', 'runout', 'stumped', 'lbw', 'retired'].map((type) => (
                    <option key={type} value={type}>{type.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              {/* Batsman out */}
              {(wicketType === 'runout' || wicketType === 'retired') ? (
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Batsman Out</label>
                  <div style={{ display: 'flex', gap: '20px', marginTop: '6px' }}>
                    <label style={{ color: '#FFF', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input type="radio" checked={wicketBatsman === currentMatch.striker} onChange={() => setWicketBatsman(currentMatch.striker)} />
                      {currentMatch.striker} (Striker)
                    </label>
                    <label style={{ color: '#FFF', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input type="radio" checked={wicketBatsman === currentMatch.nonStriker} onChange={() => setWicketBatsman(currentMatch.nonStriker)} />
                      {currentMatch.nonStriker} (Non-Striker)
                    </label>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: '#FFF', margin: '4px 0' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>Batsman Out:</span> <strong style={{ color: 'var(--secondary)' }}>{currentMatch.striker}</strong>
                </div>
              )}

              {/* Fielder Name */}
              {(wicketType === 'caught' || wicketType === 'runout' || wicketType === 'stumped') && (
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Select Fielder</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px', marginBottom: '8px' }}>
                    {getBowlingTeamSquad(currentMatch).map((player) => (
                      <button
                        key={player}
                        type="button"
                        onClick={() => setWicketFielder(player)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: '1px solid',
                          borderColor: wicketFielder === player ? 'var(--primary)' : 'rgba(255,255,255,0.15)',
                          backgroundColor: wicketFielder === player ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.02)',
                          color: '#FFF',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          transition: 'all 0.1s'
                        }}
                      >
                        {player}
                      </button>
                    ))}
                  </div>
                  <input 
                    value={wicketFielder} 
                    onChange={(e) => setWicketFielder(e.target.value)} 
                    placeholder="Or type fielder name..." 
                    className="premium-input" 
                  />
                </div>
              )}

              {/* Runs completed (Run out or Retired only) */}
              {(wicketType === 'runout' || wicketType === 'retired') && (
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Runs Completed before Wicket</label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                    {[0, 1, 2, 3].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setWicketRunsCompleted(r)}
                        style={{
                          flex: 1,
                          padding: '8px 0',
                          borderRadius: '6px',
                          border: '1px solid',
                          borderColor: wicketRunsCompleted === r ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                          backgroundColor: wicketRunsCompleted === r ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                          color: '#FFF',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* New batsman select */}
              {unbatted.length > 0 ? (
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>New Batsman coming in</label>
                  <select value={newBatsman} onChange={(e) => setNewBatsman(e.target.value)} className="premium-input">
                    {unbatted.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{ color: 'var(--secondary)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  No players remaining in squad. Innings will end as All Out.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '15px', marginTop: '24px' }}>
              <button onClick={confirmWicket} style={{ flex: 1, padding: '12px 0', borderRadius: '6px', border: 'none', backgroundColor: '#FF3B30', color: '#FFF', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }} className="interactive">CONFIRM OUT</button>
              <button onClick={() => setShowWicketModal(false)} style={{ flex: 1, padding: '12px 0', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'transparent', color: '#FFF', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }} className="interactive">CANCEL</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Wide Ball Modal popup */}
      {showWideModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(10, 10, 10, 0.97)', zIndex: 9999, overflowY: 'auto', padding: '20px 10px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '25px', border: '1px solid rgba(245, 158, 11, 0.15)', margin: '40px auto' }}>
            <h4 style={{ fontFamily: 'var(--font-headings)', fontSize: '1.8rem', color: '#FFF', marginBottom: '14px', textAlign: 'center' }}>
              ⚡ WIDE BALL EXTRA
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px', textAlign: 'center' }}>
              Any extra runs scored off this delivery? (e.g. from running or if the ball went to boundary)
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '24px' }}>
              {[0, 1, 2, 3, 4].map((r) => (
                <button
                  key={r}
                  onClick={() => setWideExtraRuns(r)}
                  style={{
                    padding: '12px 0',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: wideExtraRuns === r ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                    backgroundColor: wideExtraRuns === r ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                    color: '#FFF',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                  }}
                  className="interactive"
                >
                  {r === 4 ? '4 (5 Wd)' : `+${r}`}
                </button>
              ))}
            </div>

            <button onClick={confirmWide} style={{ width: '100%', padding: '12px 0', borderRadius: '6px', border: 'none', backgroundColor: 'var(--primary)', color: '#050A18', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }} className="interactive">
              CONFIRM WIDE
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Main Scorer Interface HUD */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={handleExitMatch} style={{ padding: '8px 18px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.18)', backgroundColor: 'transparent', color: '#FFF', fontWeight: 'bold', cursor: 'pointer' }} className="interactive">
          🚪 SAVE & EXIT
        </button>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
          Toss Winner: <span style={{ color: '#FFF' }}>{currentMatch.tossWinner}</span> ({currentMatch.tossDecision})
        </div>
      </div>

      {/* Live Match Tab Controls */}
      <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px' }}>
        <button
          onClick={() => setLiveTab('scoring')}
          style={{
            flex: 1,
            padding: '12px 0',
            backgroundColor: liveTab === 'scoring' ? 'var(--primary)' : 'rgba(255,255,255,0.02)',
            color: liveTab === 'scoring' ? '#050A18' : '#FFF',
            border: 'none',
            fontFamily: 'var(--font-headings)',
            fontSize: '1.15rem',
            letterSpacing: '1px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          className="interactive"
        >
          🎯 LIVE SCORING PANEL
        </button>
        <button
          onClick={() => setLiveTab('scorecard')}
          style={{
            flex: 1,
            padding: '12px 0',
            backgroundColor: liveTab === 'scorecard' ? 'var(--primary)' : 'rgba(255,255,255,0.02)',
            color: liveTab === 'scorecard' ? '#050A18' : '#FFF',
            border: 'none',
            fontFamily: 'var(--font-headings)',
            fontSize: '1.15rem',
            letterSpacing: '1px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          className="interactive"
        >
          📊 MATCH SCORECARD (LIVE)
        </button>
      </div>

      {liveTab === 'scorecard' ? (
        renderDetailedScorecard(currentMatch)
      ) : (
        <>
          <div className="glass-panel" style={{ padding: '24px', border: '2px solid rgba(255, 255, 255, 0.08)', marginBottom: '24px' }}>
            {/* Score Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>
                  🔴 Batting: {battingTeam} ({currentMatch.currentInnings === 1 ? '1st' : '2nd'} Innings)
                </div>
                <h2 style={{ fontFamily: 'var(--font-headings)', fontSize: '3rem', color: '#FFF', margin: '6px 0 0 0', lineHeight: 1.1 }}>
                  {activeScore.runs} / {activeScore.wickets} <span style={{ fontSize: '1.8rem', color: 'var(--text-secondary)' }}>({formatOvers(activeScore.ballsBowled)} / {currentMatch.overs} Ov)</span>
                </h2>
              </div>

              {currentMatch.currentInnings === 2 && (
                <div style={{ textAlign: 'right', backgroundColor: 'rgba(0, 255, 135, 0.06)', border: '1px solid rgba(0, 255, 135, 0.15)', padding: '10px 18px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>RUNS NEEDED TO WIN</div>
                  <div style={{ fontSize: '1.4rem', color: 'var(--primary)', fontWeight: 'bold', fontFamily: 'var(--font-headings)' }}>
                    {currentMatch.teamAScore.runs + 1 - activeScore.runs} Runs
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    from {currentMatch.overs * 6 - activeScore.ballsBowled} balls (Target: {currentMatch.teamAScore.runs + 1})
                  </div>
                </div>
              )}
            </div>

            {/* Live Match Info Ticker */}
            <div className="scorer-info-ticker" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px', padding: '10px 15px', marginBottom: '20px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <div style={{ textAlign: 'center' }}>
                <div>RUN RATE (CRR)</div>
                <div style={{ fontWeight: 'bold', color: '#FFF', fontSize: '1rem', marginTop: '2px' }}>
                  {activeScore.ballsBowled > 0 ? ((activeScore.runs / activeScore.ballsBowled) * 6).toFixed(2) : '0.00'}
                </div>
              </div>
              <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                <div>PARTNERSHIP</div>
                <div style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '1rem', marginTop: '2px' }}>
                  {activeScore.runs - (activeScore.fallOfWickets.length > 0 ? activeScore.fallOfWickets[activeScore.fallOfWickets.length - 1].score : 0)} Runs
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                {currentMatch.currentInnings === 2 ? (
                  <>
                    <div>REQ RATE (RRR)</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '1rem', marginTop: '2px' }}>
                      {currentMatch.teamAScore.runs + 1 - activeScore.runs > 0 && currentMatch.overs * 6 - activeScore.ballsBowled > 0
                        ? (((currentMatch.teamAScore.runs + 1 - activeScore.runs) / (currentMatch.overs * 6 - activeScore.ballsBowled)) * 6).toFixed(2)
                        : '0.00'}
                    </div>
                  </>
                ) : (
                  <>
                    <div>PROJ SCORE</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '1rem', marginTop: '2px' }}>
                      {activeScore.ballsBowled > 0
                        ? Math.round((activeScore.runs / activeScore.ballsBowled) * (currentMatch.overs * 6))
                        : 0}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Batsmen Partner Stats display */}
            <div className="responsive-grid-2" style={{ marginBottom: '20px' }}>
              {[
                { role: 'Striker', name: currentMatch.striker, active: true },
                { role: 'Non-Striker', name: currentMatch.nonStriker, active: false }
              ].map((item, idx) => {
                const stats = activeScore.batsmenStats[item.name] || { name: item.name, runs: 0, ballsFaced: 0, fours: 0, sixes: 0 };
                return (
                  <div key={idx} style={{ padding: '16px', borderRadius: '8px', backgroundColor: item.active ? 'rgba(0, 255, 135, 0.04)' : 'rgba(255,255,255,0.01)', border: item.active ? '1px solid rgba(0, 255, 135, 0.15)' : '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                      <span>{item.role}</span>
                      {item.active && <span style={{ color: 'var(--primary)' }}>⚡ ON STRIKE</span>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.15rem', color: '#FFF' }}>{stats.name || '--'}</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: item.active ? 'var(--primary)' : '#FFF' }}>
                        {stats.runs} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>({stats.ballsFaced}b)</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                      <span>4s: {stats.fours}</span>
                      <span>6s: {stats.sixes}</span>
                      <span>SR: {calculateSR(stats.runs, stats.ballsFaced)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bowler Stats display */}
            <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '3px' }}>Current Bowler</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#FFF' }}>{currentMatch.currentBowler || '--'}</div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px 20px', textAlign: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Overs</div>
                  <div style={{ fontWeight: 'bold', color: '#FFF' }}>{formatOvers((activeScore.bowlerStats[currentMatch.currentBowler] || {}).ballsBowled || 0)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Runs</div>
                  <div style={{ fontWeight: 'bold', color: '#FFF' }}>{(activeScore.bowlerStats[currentMatch.currentBowler] || {}).runsConceded || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Wickets</div>
                  <div style={{ fontWeight: 'bold', color: 'var(--secondary)' }}>{(activeScore.bowlerStats[currentMatch.currentBowler] || {}).wickets || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Econ</div>
                  <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                    {calculateEcon(
                      (activeScore.bowlerStats[currentMatch.currentBowler] || {}).runsConceded || 0,
                      (activeScore.bowlerStats[currentMatch.currentBowler] || {}).ballsBowled || 0
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Over History Timeline Display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '15px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.5px' }}>
                THIS OVER:
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {activeScore.overHistory.length === 0 ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>First ball of the over...</span>
                ) : (
                  activeScore.overHistory.map((ball, index) => {
                    const isW = ball === 'W';
                    const isBoundary = ball === '4' || ball === '6';
                    const isExtra = ball.includes('Wd') || ball.includes('Nb');
                    return (
                      <span
                        key={index}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          fontSize: '0.74rem',
                          fontWeight: 'bold',
                          backgroundColor: isW ? '#FF3B30' : isBoundary ? 'var(--primary)' : isExtra ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                          color: isW || isBoundary || isExtra ? '#050A18' : '#FFF',
                        }}
                      >
                        {ball}
                      </span>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* KEYPAD CONTROL PANEL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* Row 1: Runs Buttons */}
            <div className="responsive-keypad-runs">
              {[0, 1, 2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => scoreRuns(num, num === 4 || num === 6)}
                  style={{
                    padding: '16px 0',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    backgroundColor: num === 4 || num === 6 ? 'rgba(0, 255, 135, 0.12)' : 'rgba(255,255,255,0.03)',
                    color: num === 4 || num === 6 ? 'var(--primary)' : '#FFF',
                    fontFamily: 'var(--font-headings)',
                    fontSize: '1.4rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'transform 0.1s',
                  }}
                  className="interactive"
                >
                  {num}
                </button>
              ))}
            </div>

            {/* Row 2: Extras Buttons */}
            <div className="responsive-keypad-extras">
              <button onClick={scoreWide} style={{ padding: '14px 0', borderRadius: '8px', border: '1px solid rgba(255,107,0,0.2)', backgroundColor: 'rgba(255,107,0,0.06)', color: 'var(--secondary)', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }} className="interactive">WIDE (Wd)</button>
              <button onClick={handleNoBallPrompt} style={{ padding: '14px 0', borderRadius: '8px', border: '1px solid rgba(255,107,0,0.2)', backgroundColor: 'rgba(255,107,0,0.06)', color: 'var(--secondary)', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }} className="interactive">NO BALL</button>
              
              <button onClick={() => scoreLegBye(1)} style={{ padding: '14px 0', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)', color: '#FFF', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }} className="interactive">1 L.BYE</button>
              <button onClick={() => scoreLegBye(4)} style={{ padding: '14px 0', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)', color: '#FFF', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }} className="interactive">4 L.BYE</button>
              
              <button onClick={() => scoreBye(1)} style={{ padding: '14px 0', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)', color: '#FFF', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }} className="interactive">1 BYE</button>
              <button onClick={() => scoreBye(4)} style={{ padding: '14px 0', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)', color: '#FFF', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }} className="interactive">4 BYE</button>
            </div>

            {/* Row 3: Wicket & Action Buttons */}
            <div className="responsive-keypad-actions">
              <button
                onClick={handleWicketPrompt}
                style={{
                  padding: '14px 0',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#FF3B30',
                  color: '#FFF',
                  fontFamily: 'var(--font-headings)',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 0 10px rgba(255, 59, 48, 0.25)',
                }}
                className="interactive"
              >
                🛑 OUT (WICKET)
              </button>
              
              <button
                onClick={handleSwapStrike}
                style={{
                  padding: '14px 0',
                  borderRadius: '8px',
                  border: '1.5px solid rgba(0, 255, 135, 0.3)',
                  backgroundColor: 'transparent',
                  color: 'var(--primary)',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
                className="interactive"
              >
                🔄 SWAP STRIKE
              </button>

              <button
                onClick={handleUndo}
                disabled={currentMatch.historyStack.length === 0}
                style={{
                  padding: '14px 0',
                  borderRadius: '8px',
                  border: '1.5px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'transparent',
                  color: '#FFF',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  opacity: currentMatch.historyStack.length === 0 ? 0.35 : 1,
                }}
                className="interactive"
              >
                ↩️ UNDO LAST
              </button>
            </div>
            
            {/* Live Ball-by-Ball Commentary Ticker */}
            <div className="glass-panel scroll-animate" style={{ marginTop: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.06)', maxHeight: '250px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  💬 LIVE COMMENTARY FEED
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  Showing latest deliveries
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(!activeScore.commentary || activeScore.commentary.length === 0) ? (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontStyle: 'italic', textAlign: 'center', padding: '10px' }}>
                    Start scoring to generate ball-by-ball commentary...
                  </div>
                ) : (
                  [...activeScore.commentary].reverse().map((line, idx) => {
                    const isW = line.includes(': OUT!') || line.includes(': CLEAN BOWLED!') || line.includes(': Bowled him!') || line.includes(': Caught') || line.includes(': Plumb in front!') || line.includes(': Stumped') || line.includes('falls!');
                    const isBoundary = line.includes('FOUR!') || line.includes('SIX!');
                    const isExtra = line.includes('Wide ball!') || line.includes('No ball!');
                    
                    return (
                      <div
                        key={idx}
                        style={{
                          fontSize: '0.88rem',
                          color: isW ? '#FF3B30' : isBoundary ? 'var(--primary)' : '#FFF',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          backgroundColor: isW ? 'rgba(255, 59, 48, 0.05)' : isBoundary ? 'rgba(0, 255, 135, 0.04)' : 'rgba(255,255,255,0.01)',
                          borderLeft: `3px solid ${isW ? '#FF3B30' : isBoundary ? 'var(--primary)' : isExtra ? 'var(--secondary)' : 'rgba(255,255,255,0.1)'}`,
                          lineHeight: '1.4',
                          textAlign: 'left'
                        }}
                      >
                        {line}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
