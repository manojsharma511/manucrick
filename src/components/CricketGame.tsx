import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';

class GameAudio {
  private ctx: AudioContext | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playThwack() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(165, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.08);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.08);

    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    click.type = 'sine';
    click.frequency.setValueAtTime(2300, now);
    click.frequency.exponentialRampToValueAtTime(950, now + 0.012);
    clickGain.gain.setValueAtTime(0.2, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);
    click.connect(clickGain);
    clickGain.connect(this.ctx.destination);
    click.start();
    click.stop(now + 0.012);
  }

  playCheer() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 1.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    filter.Q.value = 1.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
    noise.stop(now + 1.5);
  }

  playWicket() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1200;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }

  playFootstep() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(75, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.05);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.05);
  }

  speakCommentary(text: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 1.05;
      utterance.lang = 'en-US';
      const voices = window.speechSynthesis.getVoices();
      const engVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel')));
      if (engVoice) {
        utterance.voice = engVoice;
      }
      window.speechSynthesis.speak(utterance);
    }
  }
}

interface HighScore {
  name: string;
  score: number;
  difficulty: string;
  date: string;
}

interface StumpFragment {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  va: number;
  w: number;
  h: number;
}

interface Fielder {
  x: number;
  y: number;
  originalX: number;
  originalY: number;
  speed: number;
  state: 'idle' | 'chasing' | 'throwing' | 'returning';
}

interface MatchLog {
  name: string;
  score: number;
  balls: number;
  difficulty: string;
  mode: string;
  status: string;
  date: string;
}

export function CricketGame() {
  // Configs & customizations
  const [playerName, setPlayerName] = useState('Manoj');
  const [jerseyColor, setJerseyColor] = useState('#F59E0B');
  const [jerseyNumber, setJerseyNumber] = useState('27');
  const [batGripColor, setBatGripColor] = useState('#F97316');

  const [gameState, setGameState] = useState<'start' | 'playing' | 'out'>('start');
  const [gameMode, setGameMode] = useState<'endless' | 'superover' | 'survival' | 'target' | 'quick'>('endless');
  const [selectedOvers, setSelectedOvers] = useState<number>(2);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [score, setScore] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [balls, setBalls] = useState(0);
  const [targetRuns, setTargetRuns] = useState(16);
  const [ballsRemaining, setBallsRemaining] = useState(6);
  const [deliveryName, setDeliveryName] = useState<string>('FAST');

  const [aimAngle, setAimAngle] = useState(0); // Aiming angle offset (-60 to +60)
  const [batsmanRunning, setBatsmanRunning] = useState(false);
  const [currentRunsInSession, setCurrentRunsInSession] = useState(0);
  const [isBatsmanSafe, setIsBatsmanSafe] = useState(true);

  const [shotFeedback, setShotFeedback] = useState('CLICK ANYWHERE ON SCREEN TIMELY TO AIM AND HIT!');
  const [feedbackColor, setFeedbackColor] = useState('var(--text-secondary)');
  const [overlayEffect, setOverlayEffect] = useState<'four' | 'six' | 'wicket' | 'runout' | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<GameAudio>(new GameAudio());
  const requestRef = useRef<number>(0);

  // Player variables
  const bowlerXRef = useRef(240);
  const bowlerYRef = useRef(60);
  const bowlerLegBobRef = useRef(0);
  const bowlerArmAngleRef = useRef(0);
  const bowlerStateRef = useRef<'runin' | 'release' | 'follow'>('runin');

  const batsmanSwingRef = useRef(0);
  const batsmanSwingAngleRef = useRef(0);
  const batsmanBobRef = useRef(0);

  // Runner position
  const runnerXRef = useRef(240);
  const runnerYRef = useRef(600);
  const runnerDirectionRef = useRef(0); // 0 = idle, -1 = running up, 1 = running down
  const runnerSpeedRef = useRef(8.5);

  // Ball variables
  const ballXRef = useRef(-100);
  const ballYRef = useRef(-100);
  const ballProgressRef = useRef(0);
  const ballRotationRef = useRef(0);
  const ballFlightHeightRef = useRef(80);
  const ballLandingXRef = useRef(0);
  const ballLandingYRef = useRef(0);
  const ballTypeRef = useRef<'fast' | 'swing' | 'bouncer' | 'spin'>('fast');

  // Unified Ball State Machine Refs
  const ballStateRef = useRef<'idle' | 'bowled' | 'hit' | 'miss' | 'thrown'>('idle');
  const ballStartTimeRef = useRef(0);
  const ballDurationRef = useRef(1000);
  const ballTrailRef = useRef<{ x: number; y: number }[]>([]);

  // Hit flight details
  const hitStartXRef = useRef(0);
  const hitStartYRef = useRef(0);
  const hitStartTimeRef = useRef(0);
  const hitDurationRef = useRef(1500);
  const hitHeightRef = useRef(80);
  const hitBoundaryRunsRef = useRef(0);

  // Fielder throwing details
  const throwStartXRef = useRef(0);
  const throwStartYRef = useRef(0);
  const throwStartTimeRef = useRef(0);
  const throwDurationRef = useRef(800);
  const throwTargetXRef = useRef(240);
  const throwTargetYRef = useRef(600);

  const stumpsRef = useRef<StumpFragment[]>([]);
  const fieldersRef = useRef<Fielder[]>([]);
  const canvasParticlesRef = useRef<{ x: number; y: number; vx: number; vy: number; color: string; size: number; alpha: number }[]>([]);
  const runsFloatsRef = useRef<{ x: number; y: number; text: string; alpha: number }[]>([]);

  useEffect(() => {
    // Load player customs
    const savedCustoms = localStorage.getItem('manucrick_custom_player');
    if (savedCustoms) {
      try {
        const parsed = JSON.parse(savedCustoms);
        setPlayerName(parsed.name || 'Manoj');
        setJerseyColor(parsed.jerseyColor || '#F59E0B');
        setJerseyNumber(parsed.jerseyNumber || '27');
        setBatGripColor(parsed.batGripColor || '#FF6B00');
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  const triggerOverlay = (type: 'four' | 'six' | 'wicket' | 'runout') => {
    setOverlayEffect(type);
    setTimeout(() => setOverlayEffect(null), 1800);
  };

  const handleDifficultySelect = (diff: 'easy' | 'medium' | 'hard') => {
    setDifficulty(diff);
    audioRef.current.init();
  };

  const initGame = (mode: 'endless' | 'superover' | 'survival' | 'target' | 'quick') => {
    audioRef.current.init();
    setGameMode(mode);
    setScore(0);
    setWickets(0);
    setBalls(0);
    setAimAngle(0);
    setBatsmanRunning(false);
    setCurrentRunsInSession(0);
    setIsBatsmanSafe(true);
    setShotFeedback('WATCH THE BALL CLOSELY & CLICK/TOUCH ANYWHERE TO AIM AND STRIKE.');
    setFeedbackColor('var(--primary)');
    setIsFullscreen(true); // Immersive fullscreen view

    if (mode === 'superover') {
      const randTarget = Math.floor(Math.random() * 13) + 10; // 10 to 22 runs
      setTargetRuns(randTarget);
      setBallsRemaining(6);
    } else if (mode === 'survival') {
      setBallsRemaining(10);
    } else if (mode === 'target') {
      // Dynamic overs and targets
      const randOvers = [2, 3, 5][Math.floor(Math.random() * 3)];
      setBallsRemaining(randOvers * 6);
      if (randOvers === 2) {
        setTargetRuns(Math.floor(Math.random() * 23) + 20); // 20 to 42 runs
      } else if (randOvers === 3) {
        setTargetRuns(Math.floor(Math.random() * 26) + 35); // 35 to 60 runs
      } else {
        setTargetRuns(Math.floor(Math.random() * 36) + 60); // 60 to 95 runs
      }
    } else if (mode === 'quick') {
      setBallsRemaining(selectedOvers * 6);
      if (selectedOvers === 1) {
        setTargetRuns(Math.floor(Math.random() * 14) + 12); // 12 to 25 runs
      } else if (selectedOvers === 2) {
        setTargetRuns(Math.floor(Math.random() * 22) + 24); // 24 to 45 runs
      } else if (selectedOvers === 5) {
        setTargetRuns(Math.floor(Math.random() * 46) + 60); // 60 to 105 runs
      } else {
        setTargetRuns(Math.floor(Math.random() * 76) + 120); // 120 to 195 runs
      }
    }

    // Spreads fielders further out to the boundaries for a larger outfield
    fieldersRef.current = [
      { x: 70, y: 240, originalX: 70, originalY: 240, speed: 2.8, state: 'idle' },
      { x: 410, y: 240, originalX: 410, originalY: 240, speed: 2.8, state: 'idle' },
      { x: 110, y: 450, originalX: 110, originalY: 450, speed: 3.1, state: 'idle' },
      { x: 370, y: 450, originalX: 370, originalY: 450, speed: 3.1, state: 'idle' },
      { x: 240, y: 220, originalX: 240, originalY: 220, speed: 3.4, state: 'idle' },
    ];

    resetStumps();
    setGameState('playing');
    startNewDelivery();
  };

  const resetStumps = () => {
    stumpsRef.current = [
      { x: 232, y: 620, vx: 0, vy: 0, angle: 0, va: 0, w: 5, h: 48 },
      { x: 240, y: 620, vx: 0, vy: 0, angle: 0, va: 0, w: 5, h: 48 },
      { x: 248, y: 620, vx: 0, vy: 0, angle: 0, va: 0, w: 5, h: 48 },
    ];
  };

  const startNewDelivery = () => {
    ballStateRef.current = 'idle';
    ballProgressRef.current = 0;
    ballTrailRef.current = [];
    setBatsmanRunning(false);
    setCurrentRunsInSession(0);
    setIsBatsmanSafe(true);
    runnerXRef.current = 240;
    runnerYRef.current = 600;
    runnerDirectionRef.current = 0;

    // Reset bowler
    bowlerXRef.current = 240;
    bowlerYRef.current = 60;
    bowlerStateRef.current = 'runin';
    bowlerLegBobRef.current = 0;
    bowlerArmAngleRef.current = 0;

    // Reset batsman
    batsmanSwingRef.current = 0;
    batsmanSwingAngleRef.current = 0;

    // Return fielders
    fieldersRef.current.forEach((f) => {
      f.x = f.originalX;
      f.y = f.originalY;
      f.state = 'idle';
    });

    const types: ('fast' | 'swing' | 'bouncer' | 'spin')[] = ['fast', 'swing', 'bouncer', 'spin'];
    const chosen = types[Math.floor(Math.random() * types.length)];
    ballTypeRef.current = chosen;
    setDeliveryName(chosen.toUpperCase());

    if (chosen === 'fast') {
      ballFlightHeightRef.current = 35;
    } else if (chosen === 'swing') {
      ballFlightHeightRef.current = 60;
    } else if (chosen === 'bouncer') {
      ballFlightHeightRef.current = 135;
    } else {
      ballFlightHeightRef.current = 80;
    }

    let stepCount = 0;
    const runInterval = setInterval(() => {
      if (bowlerStateRef.current === 'runin' && gameState === 'playing') {
        audioRef.current.playFootstep();
        stepCount++;
        if (stepCount >= 6) clearInterval(runInterval);
      } else {
        clearInterval(runInterval);
      }
    }, 170);
  };

  const processInteractiveShot = (clickX: number, clickY: number) => {
    if (gameState !== 'playing' || batsmanSwingRef.current !== 0 || ballStateRef.current !== 'bowled') return;

    // Calculate shot aim direction from click coordinates relative to batsman
    const rawAngle = Math.atan2(clickY - 600, clickX - 240);
    let angleDegrees = (rawAngle * 180) / Math.PI;
    
    // Map click direction (aim straight down ground is straight up y=0)
    let aimOffset = angleDegrees + 90;
    
    // Clamp to -60 to 60 degrees
    aimOffset = Math.max(-60, Math.min(60, aimOffset));
    setAimAngle(Math.round(aimOffset));

    // Swing
    batsmanSwingRef.current = 1;

    const prog = ballProgressRef.current;
    const targetSpot = 0.86;
    const distance = Math.abs(prog - targetSpot);

    // Apply Bat modifiers
    const selectedBatId = localStorage.getItem('manucrick_selected_bat') || 'kashmir';
    let timingScale = 1.0;
    if (selectedBatId === 'cyber') timingScale = 1.12;
    else if (selectedBatId === 'helicopter') timingScale = 1.25;

    const perfectWindow = 0.08 * timingScale;
    const runningWindow = 0.16 * timingScale;

    if (distance <= perfectWindow) {
      // Perfect boundary connection
      audioRef.current.playThwack();
      audioRef.current.playCheer();
      
      const runs = Math.random() > 0.42 ? 6 : 4;
      
      // Save six to stats
      if (runs === 6) {
        const sixes = Number(localStorage.getItem('manucrick_sixes_count') || 0);
        localStorage.setItem('manucrick_sixes_count', String(sixes + 1));
      }

      // Determine shot type name based on angle
      let shotName = 'STRAIGHT DRIVE';
      if (aimOffset < -25) {
        shotName = runs === 6 ? 'REVERSE UPPER CUT' : 'BEAUTIFUL LATE CUT';
      } else if (aimOffset < -10) {
        shotName = runs === 6 ? 'SENSATIONAL SQUARE CUT' : 'POWERFUL SQUARE DRIVE';
      } else if (aimOffset > 25) {
        shotName = runs === 6 ? 'PULL SHOT OVER BOUNDARY' : 'CLASSIC COVER DRIVE';
      } else if (aimOffset > 10) {
        shotName = runs === 6 ? 'HELICOPTER SHOT' : 'EXQUISITE COVER DRIVE';
      } else {
        shotName = runs === 6 ? 'MONSTER STADIUM DRIVE' : 'POWERFUL DIRECT DRIVE';
      }

      setShotFeedback(`CRACK! ${shotName} for ${runs} Runs! ⚡`);
      setFeedbackColor(runs === 6 ? 'var(--accent)' : 'var(--primary)');
      triggerOverlay(runs === 6 ? 'six' : 'four');

      // Speak commentary
      if (runs === 6) {
        const sixPhrases = [
          "What a shot! That is a massive six!",
          "Maximum! That's gone all the way!",
          "It's a six! Out of the park!",
          "Six runs! Absolutely smashed it!",
          "Clean strike! That is a huge six!",
          "Beautiful shot! Sent high into the crowd for six!"
        ];
        audioRef.current.speakCommentary(sixPhrases[Math.floor(Math.random() * sixPhrases.length)]);
      } else {
        const fourPhrases = [
          "Beautiful shot! Races away for four!",
          "Four runs! Exquisite cover drive!",
          "Shot! Placed perfectly for a boundary!",
          "It's a boundary! Four runs to the total!",
          "Lovely timing, finding the gap for four!",
          "Crack! That's a textbook boundary!"
        ];
        audioRef.current.speakCommentary(fourPhrases[Math.floor(Math.random() * fourPhrases.length)]);
      }

      setScore((prev) => prev + runs);
      setBalls((prev) => prev + 1);
      if (gameMode !== 'endless') {
        setBallsRemaining((prev) => prev - 1);
      }

      // Transition to hit state
      ballStateRef.current = 'hit';
      hitStartXRef.current = ballXRef.current;
      hitStartYRef.current = ballYRef.current;
      hitStartTimeRef.current = performance.now();
      hitDurationRef.current = 1400; // 1.4s flight
      hitHeightRef.current = runs === 6 ? 120 : 60;
      hitBoundaryRunsRef.current = runs;

      // Spawn target coordinates
      let targetX = 240 + Math.sin(aimOffset * Math.PI / 180) * 280;
      let targetY = 60;
      if (runs === 6) {
        targetX = 240 + Math.sin(aimOffset * Math.PI / 180) * 350;
        targetY = -120;
      }
      ballLandingXRef.current = targetX;
      ballLandingYRef.current = targetY;

      // Particles
      spawnHitParticles();

      runsFloatsRef.current.push({
        x: 240,
        y: 560,
        text: `+${runs}`,
        alpha: 1,
      });

      setTimeout(() => checkNextBallFlow(runs), 2200);
    } else if (distance <= runningWindow) {
      // Good timing running zones
      audioRef.current.playThwack();
      
      let nudgeName = 'PUSH FOR SINGLE';
      if (aimOffset < -15) {
        nudgeName = 'SWEPT INTO DEEP SQUARE LEG GAP';
      } else if (aimOffset > 15) {
        nudgeName = 'STEERED INTO THE OFF-SIDE GAPS';
      } else {
        nudgeName = 'NUDGED SAFELY DOWN THE GROUND';
      }

      setShotFeedback(`${nudgeName}! Run between wickets! 🏃`);
      setFeedbackColor('var(--primary)');

      // Transition to hit state (running zone, 0 boundary runs)
      ballStateRef.current = 'hit';
      hitStartXRef.current = ballXRef.current;
      hitStartYRef.current = ballYRef.current;
      hitStartTimeRef.current = performance.now();
      hitDurationRef.current = 1200;
      hitHeightRef.current = 30;
      hitBoundaryRunsRef.current = 0;

      let targetX = 240 + Math.sin(aimOffset * Math.PI / 180) * 200;
      let targetY = 600 - Math.cos(aimOffset * Math.PI / 180) * 320;
      ballLandingXRef.current = targetX;
      ballLandingYRef.current = targetY;

      // Fielder chaser logic
      let closest: Fielder | null = null;
      let minDist = Infinity;

      fieldersRef.current.forEach((f) => {
        const dx = f.x - targetX;
        const dy = f.y - targetY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          closest = f;
        }
      });

      if (closest) {
        (closest as Fielder).state = 'chasing';
      }

      // Automatically start running!
      setBatsmanRunning(true);
      runnerDirectionRef.current = -1; // run up
      
      const nudgePhrases = [
        "Nudged into the gap! Quick runs here!",
        "Shot! Push for runs!",
        "Excellent placement, they are running hard!",
        "Pushed into the outfield, run hard!"
      ];
      audioRef.current.speakCommentary(nudgePhrases[Math.floor(Math.random() * nudgePhrases.length)]);
    } else if (prog < targetSpot) {
      // Too early
      setShotFeedback('TOO EARLY! Swung before the ball arrived. 💨');
      setFeedbackColor('#9CA3AF');
      ballStateRef.current = 'miss'; // batsman missed, ball continues to stumps
      setBalls((prev) => prev + 1);
      if (gameMode !== 'endless') setBallsRemaining((prev) => prev - 1);
      setTimeout(() => checkNextBallFlow(0), 2000);
    } else {
      // Too late
      setShotFeedback('TOO LATE! Swung after the ball passed. ❌');
      setFeedbackColor('#9CA3AF');
      ballStateRef.current = 'miss'; // batsman missed, ball continues to stumps
      setBalls((prev) => prev + 1);
      if (gameMode !== 'endless') setBallsRemaining((prev) => prev - 1);
      setTimeout(() => checkNextBallFlow(0), 2000);
    }
  };

  const spawnHitParticles = () => {
    for (let i = 0; i < 25; i++) {
      canvasParticlesRef.current.push({
        x: ballXRef.current,
        y: ballYRef.current,
        vx: (Math.random() - 0.75) * 8 - 2,
        vy: -(Math.random() * 5 + 3),
        color: '#FFD700',
        size: 2.5 + Math.random() * 2,
        alpha: 1,
      });
    }
  };

  const triggerRun = () => {
    if (gameState !== 'playing' || batsmanRunning || ballStateRef.current === 'thrown') return;
    setBatsmanRunning(true);
    runnerDirectionRef.current = -1; // run up
  };

  const stopRunning = () => {
    setBatsmanRunning(false);
  };

  const handleFielderFielded = (fielder: Fielder) => {
    fielder.state = 'throwing';
    ballStateRef.current = 'thrown';
    throwStartTimeRef.current = performance.now();
    throwStartXRef.current = fielder.x;
    throwStartYRef.current = fielder.y;
    throwTargetXRef.current = 240;
    throwTargetYRef.current = runnerDirectionRef.current === -1 ? 160 : 600;
    throwDurationRef.current = 800; // 0.8 seconds to throw back
  };

  const explodeStumps = () => {
    audioRef.current.playWicket();
    triggerOverlay('wicket');
    stumpsRef.current.forEach((stump) => {
      stump.vx = (Math.random() - 0.25) * 5;
      stump.vy = -3 - Math.random() * 4;
      stump.angle = (Math.random() - 0.5) * 0.4;
    });
  };

  const checkNextBallFlow = (runsScored: number, wicketLost = false) => {
    let currentScore = score + (wicketLost ? 0 : runsScored);
    let currentWickets = wickets + (wicketLost ? 1 : 0);
    let currentBalls = balls + 1;

    const newLog: MatchLog = {
      name: playerName,
      score: currentScore,
      balls: currentBalls,
      difficulty,
      mode: gameMode === 'superover' ? 'Super Over' : gameMode === 'survival' ? 'Survival' : gameMode === 'target' ? 'Target Attack' : gameMode === 'quick' ? 'Quick Match' : 'Championship',
      status: 'Ended',
      date: new Date().toLocaleDateString(),
    };

    if (gameMode === 'superover') {
      const remaining = ballsRemaining - (wicketLost ? 1 : 0);
      if (currentScore >= targetRuns) {
        setShotFeedback('VICTORY!! Target successfully chased! 🏆');
        newLog.status = 'Won';
        saveMatchResult(newLog);
        setGameState('out');
      } else if (remaining <= 0 || currentWickets >= 1) {
        setShotFeedback('DEFEAT! Target chase failed. ❌');
        newLog.status = 'Lost';
        saveMatchResult(newLog);
        setGameState('out');
      } else {
        startNewDelivery();
      }
    } else if (gameMode === 'target') {
      const remaining = ballsRemaining - (wicketLost ? 1 : 0);
      if (currentScore >= targetRuns) {
        setShotFeedback('VICTORY!! Chased target in time! 🏆');
        newLog.status = 'Won';
        saveMatchResult(newLog);
        setGameState('out');
      } else if (remaining <= 0 || currentWickets >= 1) {
        setShotFeedback('DEFEAT! Target attack failed. ❌');
        newLog.status = 'Lost';
        saveMatchResult(newLog);
        setGameState('out');
      } else {
        startNewDelivery();
      }
    } else if (gameMode === 'quick') {
      const remaining = ballsRemaining - (wicketLost ? 1 : 0);
      if (currentScore >= targetRuns) {
        setShotFeedback('VICTORY!! Target successfully chased! 🏆');
        newLog.status = 'Won';
        saveMatchResult(newLog);
        setGameState('out');
      } else if (remaining <= 0 || currentWickets >= 3) {
        setShotFeedback('DEFEAT! Target chase failed. ❌');
        newLog.status = 'Lost';
        saveMatchResult(newLog);
        setGameState('out');
      } else {
        startNewDelivery();
      }
    } else if (gameMode === 'survival') {
      const remaining = ballsRemaining - (wicketLost ? 1 : 0);
      if (remaining <= 0) {
        setShotFeedback('SURVIVAL CHALLENGE ENDED! Score logged. 🏟️');
        newLog.status = 'Ended';
        saveMatchResult(newLog);
        setGameState('out');
      } else {
        startNewDelivery();
      }
    } else {
      // Endless Championship
      if (currentWickets >= 3) {
        setShotFeedback('ALL OUT! Championship over. 🛑');
        newLog.status = 'Ended';
        saveMatchResult(newLog);
        setGameState('out');
      } else {
        startNewDelivery();
      }
    }
  };

  const saveMatchResult = (log: MatchLog) => {
    const existingLogs = localStorage.getItem('manucrick_match_logs');
    let logs = [];
    if (existingLogs) {
      try {
        logs = JSON.parse(existingLogs);
      } catch (e) {}
    }
    logs.unshift(log);
    localStorage.setItem('manucrick_match_logs', JSON.stringify(logs.slice(0, 30)));

    if (gameMode === 'endless') {
      const record: HighScore = {
        name: playerName,
        score: log.score,
        difficulty,
        date: new Date().toLocaleDateString(),
      };
      const existingHighs = localStorage.getItem('manucrick_highscores');
      let highs: HighScore[] = [];
      if (existingHighs) {
        try {
          highs = JSON.parse(existingHighs);
        } catch (e) {}
      }
      highs.push(record);
      highs = highs.sort((a, b) => b.score - a.score).slice(0, 10);
      localStorage.setItem('manucrick_highscores', JSON.stringify(highs));
    }
  };

  // Canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState !== 'playing') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      updatePositions();
      drawArena(ctx);
      drawPlayers(ctx);
      requestRef.current = requestAnimationFrame(render);
    };

    const updatePositions = () => {
      // Bowler run-in
      if (bowlerStateRef.current === 'runin') {
        bowlerYRef.current += 1.8;
        bowlerLegBobRef.current += 0.28;
        bowlerArmAngleRef.current -= 0.13;
        if (bowlerYRef.current >= 150) bowlerStateRef.current = 'release';
      } else if (bowlerStateRef.current === 'release') {
        bowlerArmAngleRef.current -= 0.35;
        if (bowlerArmAngleRef.current < -Math.PI) {
          bowlerStateRef.current = 'follow';
          // Release ball
          ballStateRef.current = 'bowled';
          ballXRef.current = 240;
          ballYRef.current = 150;
          ballProgressRef.current = 0;
          ballStartTimeRef.current = performance.now();
          ballTrailRef.current = [];
          
          let baseDuration = difficulty === 'hard' ? 850 : difficulty === 'medium' ? 1100 : 1400;
          let factor = 1.0;
          if (ballTypeRef.current === 'fast') factor = 0.85;
          else if (ballTypeRef.current === 'spin') factor = 1.25;
          else if (ballTypeRef.current === 'bouncer') factor = 1.05;
          ballDurationRef.current = baseDuration * factor;
        }
      }

      // Ball path updates
      if (ballStateRef.current === 'bowled' || ballStateRef.current === 'miss') {
        const elapsed = performance.now() - ballStartTimeRef.current;
        const progress = elapsed / ballDurationRef.current;
        ballProgressRef.current = progress;

        if (progress <= 1.0) {
          const startX = 240;
          const targetX = 240;
          const startY = 150;
          const targetY = 600;
          
          let bx = startX + (targetX - startX) * progress;
          let by = startY + (targetY - startY) * progress;

          // Ball flight arc
          const arc = Math.sin(progress * Math.PI) * (ballFlightHeightRef.current * 0.4);
          by -= arc;

          if (ballTypeRef.current === 'spin' && progress > 0.5) {
            bx += Math.sin((progress - 0.5) * Math.PI) * 45;
          }
          if (ballTypeRef.current === 'swing' && progress > 0.4) {
            bx -= (progress - 0.4) * 20;
          }

          ballXRef.current = bx;
          ballYRef.current = by;

          // Trail
          ballTrailRef.current.push({ x: bx, y: by });
          if (ballTrailRef.current.length > 6) ballTrailRef.current.shift();

          ballRotationRef.current += 0.15;
        } else {
          // Ball hit stumps! Wicket
          ballStateRef.current = 'idle';
          explodeStumps();

          const bowledPhrases = [
            "Bowled him! That's a beautiful delivery, stumps shattered!",
            "Bowled him! The batsman misses, and the stumps are broken!",
            "Clean bowled! Absolute peach of a delivery!"
          ];
          audioRef.current.speakCommentary(bowledPhrases[Math.floor(Math.random() * bowledPhrases.length)]);

          if (gameMode === 'survival') {
            setScore((prev) => Math.max(0, prev - 5));
            setShotFeedback('BOWLED OUT! Stumps broken: -5 Runs! ❌');
            setFeedbackColor('#FF3B30');
            setBalls((prev) => prev + 1);
            setBallsRemaining((prev) => prev - 1);
            setTimeout(() => checkNextBallFlow(0), 2200);
          } else {
            setWickets((prev) => prev + 1);
            setBalls((prev) => prev + 1);
            if (gameMode !== 'endless') setBallsRemaining((prev) => prev - 1);
            setShotFeedback('BOWLED OUT! Stumps broken. ❌');
            setFeedbackColor('#FF3B30');
            setTimeout(() => checkNextBallFlow(0, true), 2200);
          }
        }
      } else if (ballStateRef.current === 'hit') {
        const elapsed = performance.now() - hitStartTimeRef.current;
        const progress = elapsed / hitDurationRef.current;

        if (progress <= 1.0) {
          const startX = hitStartXRef.current;
          const startY = hitStartYRef.current;
          const targetX = ballLandingXRef.current;
          const targetY = ballLandingYRef.current;

          let bx = startX + (targetX - startX) * progress;
          let by = startY + (targetY - startY) * progress;

          // Flight arc
          const arc = Math.sin(progress * Math.PI) * hitHeightRef.current;
          by -= arc;

          ballXRef.current = bx;
          ballYRef.current = by;

          // Trail
          ballTrailRef.current.push({ x: bx, y: by });
          if (ballTrailRef.current.length > 6) ballTrailRef.current.shift();
        } else {
          // Ball landed
          ballXRef.current = ballLandingXRef.current;
          ballYRef.current = ballLandingYRef.current;
          
          if (hitBoundaryRunsRef.current > 0) {
            ballStateRef.current = 'idle';
          }
        }
      } else if (ballStateRef.current === 'thrown') {
        const elapsed = performance.now() - throwStartTimeRef.current;
        const progress = elapsed / throwDurationRef.current;

        if (progress <= 1.0) {
          const startX = throwStartXRef.current;
          const startY = throwStartYRef.current;
          const targetX = throwTargetXRef.current;
          const targetY = throwTargetYRef.current;

          let bx = startX + (targetX - startX) * progress;
          let by = startY + (targetY - startY) * progress;

          // Height arc
          const arc = Math.sin(progress * Math.PI) * 40;
          by -= arc;

          ballXRef.current = bx;
          ballYRef.current = by;

          // Trail
          ballTrailRef.current.push({ x: bx, y: by });
          if (ballTrailRef.current.length > 6) ballTrailRef.current.shift();
        } else {
          ballStateRef.current = 'idle';
          const ry = runnerYRef.current;
          const insideCrease = ry <= 180 || ry >= 580;

          if (!insideCrease && batsmanRunning) {
            explodeStumps();
            
            const runoutPhrases = [
              "Oh no! That's a run out! Disaster in the middle!",
              "Run out! Brilliant fielding has done the trick!",
              "Gone! He couldn't make it back in time, run out!"
            ];
            audioRef.current.speakCommentary(runoutPhrases[Math.floor(Math.random() * runoutPhrases.length)]);

            if (gameMode === 'survival') {
              setScore((prev) => Math.max(0, prev - 5));
              setShotFeedback('RUN OUT! Wicket lost: -5 Runs! 🛑');
              setFeedbackColor('#FF3B30');
              triggerOverlay('runout');
              setBalls((prev) => prev + 1);
              setBallsRemaining((prev) => prev - 1);
              setBatsmanRunning(false);
              setTimeout(() => checkNextBallFlow(0), 2200);
            } else {
              setWickets((prev) => prev + 1);
              setBalls((prev) => prev + 1);
              if (gameMode !== 'endless') setBallsRemaining((prev) => prev - 1);
              setShotFeedback('RUN OUT! Stumps broken. 🛑');
              setFeedbackColor('#FF3B30');
              triggerOverlay('runout');
              setBatsmanRunning(false);
              setTimeout(() => checkNextBallFlow(0, true), 2200);
            }
          } else {
            // Running completed safely
            setShotFeedback(`Safe! Secured +${currentRunsInSession} runs! ⚡`);
            setScore((prev) => prev + currentRunsInSession);
            setBalls((prev) => prev + 1);
            if (gameMode !== 'endless') setBallsRemaining((prev) => prev - 1);
            
            const safePhrases = [
              `Safe! Outstanding running between the wickets.`,
              `Brilliant running! Easy runs there.`,
              `Excellent speed, safely back in the crease.`
            ];
            audioRef.current.speakCommentary(safePhrases[Math.floor(Math.random() * safePhrases.length)]);

            setBatsmanRunning(false);
            setTimeout(() => checkNextBallFlow(currentRunsInSession), 2000);
          }
        }
      }

      // Batsman swing
      if (batsmanSwingRef.current === 1) {
        batsmanSwingAngleRef.current -= 0.28;
        if (batsmanSwingAngleRef.current <= -Math.PI * 0.7) batsmanSwingRef.current = 2;
      } else if (batsmanSwingRef.current === 2) {
        batsmanSwingAngleRef.current += 0.08;
        if (batsmanSwingAngleRef.current >= 0) {
          batsmanSwingAngleRef.current = 0;
          batsmanSwingRef.current = 0;
        }
      } else {
        batsmanBobRef.current += 0.035;
      }

      // Runner running crease
      if (batsmanRunning) {
        runnerYRef.current += runnerDirectionRef.current * runnerSpeedRef.current;
        if (runnerDirectionRef.current === -1 && runnerYRef.current <= 160) {
          runnerYRef.current = 160;
          setCurrentRunsInSession((prev) => prev + 1);
          if (ballStateRef.current === 'thrown') {
            setBatsmanRunning(false);
            runnerDirectionRef.current = 0;
          } else {
            runnerDirectionRef.current = 1;
          }
        } else if (runnerDirectionRef.current === 1 && runnerYRef.current >= 600) {
          runnerYRef.current = 600;
          setCurrentRunsInSession((prev) => prev + 1);
          if (ballStateRef.current === 'thrown') {
            setBatsmanRunning(false);
            runnerDirectionRef.current = 0;
          } else {
            runnerDirectionRef.current = -1;
          }
        }
        setIsBatsmanSafe(runnerYRef.current >= 580 || runnerYRef.current <= 180);
      } else {
        if (runnerYRef.current < 380) {
          runnerYRef.current += (160 - runnerYRef.current) * 0.1;
        } else {
          runnerYRef.current += (600 - runnerYRef.current) * 0.1;
        }
        runnerXRef.current += (240 - runnerXRef.current) * 0.1;
        setIsBatsmanSafe(true);
      }

      // Fielders chasing
      fieldersRef.current.forEach((f) => {
        if (f.state === 'chasing') {
          const dx = ballLandingXRef.current - f.x;
          const dy = ballLandingYRef.current - f.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 5) {
            f.x += (dx / dist) * f.speed;
            f.y += (dy / dist) * f.speed;
          } else {
            handleFielderFielded(f);
          }
        } else if (f.state === 'throwing') {
          f.state = 'returning';
        } else if (f.state === 'returning') {
          const dx = f.originalX - f.x;
          const dy = f.originalY - f.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 2) {
            f.x += (dx / dist) * 1.5;
            f.y += (dy / dist) * 1.5;
          } else {
            f.x = f.originalX;
            f.y = f.originalY;
            f.state = 'idle';
          }
        }
      });

      // Exploded stumps physics
      stumpsRef.current.forEach((stump) => {
        if (stump.vx !== 0 || stump.vy !== 0) {
          stump.x += stump.vx;
          stump.y += stump.vy;
          stump.vy += 0.22;
          stump.angle += stump.va;
          if (stump.y >= 640) {
            stump.y = 640;
            stump.vy = -stump.vy * 0.35;
            stump.vx *= 0.6;
          }
        }
      });

      // Particles
      canvasParticlesRef.current.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.alpha -= 0.02;
        if (p.alpha <= 0) canvasParticlesRef.current.splice(i, 1);
      });
    };

    const drawArena = (ctx: CanvasRenderingContext2D) => {
      // Sky background
      const sky = ctx.createLinearGradient(0, 0, 0, 720);
      sky.addColorStop(0, '#03050F');
      sky.addColorStop(0.6, '#070D22');
      sky.addColorStop(1, '#0E172F');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 480, 720);

      // Crowds (stadium seats at the top)
      ctx.fillStyle = 'rgba(3, 5, 12, 0.75)';
      ctx.beginPath();
      ctx.moveTo(0, 40);
      for (let i = 0; i <= 480; i += 12) {
        ctx.lineTo(i, 50 + Math.sin(i * 0.05) * 4);
      }
      ctx.lineTo(480, 80);
      ctx.lineTo(0, 80);
      ctx.fill();

      // boundary rope
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(240, 360, 220, 330, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Grass Pitch perspective trapezoid (vertical)
      ctx.fillStyle = '#05180E';
      ctx.beginPath();
      ctx.moveTo(160, 60);
      ctx.lineTo(320, 60);
      ctx.lineTo(440, 700);
      ctx.lineTo(40, 700);
      ctx.fill();

      // Pitch core
      ctx.fillStyle = '#1D3626';
      ctx.beginPath();
      ctx.moveTo(200, 60);
      ctx.lineTo(280, 60);
      ctx.lineTo(340, 700);
      ctx.lineTo(140, 700);
      ctx.fill();

      // Creases (horizontal crease lines)
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(180, 160);
      ctx.lineTo(300, 160);
      ctx.moveTo(100, 600);
      ctx.lineTo(380, 600);
      ctx.stroke();
    };

    const drawPlayers = (ctx: CanvasRenderingContext2D) => {
      // 1. Draw Fielders
      fieldersRef.current.forEach((f) => {
        ctx.save();
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(f.x, f.y - 25, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'var(--secondary)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(f.x, f.y - 21);
        ctx.lineTo(f.x, f.y - 8);
        ctx.stroke();
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(f.x, f.y - 8);
        ctx.lineTo(f.x - 4, f.y);
        ctx.moveTo(f.x, f.y - 8);
        ctx.lineTo(f.x + 4, f.y);
        ctx.stroke();
        ctx.restore();
      });

      // 2. Draw Bowler
      ctx.save();
      const bx = bowlerXRef.current;
      const by = bowlerYRef.current;
      const bob = Math.sin(bowlerLegBobRef.current) * 3;
      ctx.fillStyle = '#E5E7EB';
      ctx.beginPath();
      ctx.arc(bx, by - 36 + bob, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(bx, by - 31 + bob);
      ctx.lineTo(bx, by - 12 + bob);
      ctx.stroke();
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx, by - 26 + bob);
      ctx.lineTo(bx + Math.cos(bowlerArmAngleRef.current) * 14, by - 26 + bob + Math.sin(bowlerArmAngleRef.current) * 14);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx, by - 12 + bob);
      ctx.lineTo(bx - 6, by + bob);
      ctx.moveTo(bx, by - 12 + bob);
      ctx.lineTo(bx + 6, by + (bob * -1));
      ctx.stroke();
      ctx.restore();

      // 3. Draw Stumps
      stumpsRef.current.forEach((stump) => {
        ctx.save();
        ctx.translate(stump.x, stump.y);
        ctx.rotate(stump.angle);
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(-stump.w / 2, -stump.h, stump.w, stump.h);
        ctx.restore();
      });

      // 4. Draw Batsman / Runner
      ctx.save();
      const rx = runnerXRef.current;
      const ry = runnerYRef.current;
      const rBob = Math.sin(batsmanBobRef.current) * 1.5;

      ctx.fillStyle = '#E5E7EB';
      ctx.beginPath();
      ctx.arc(rx, ry - 38 + rBob, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = jerseyColor;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(rx, ry - 33 + rBob);
      ctx.lineTo(rx, ry - 12 + rBob);
      ctx.stroke();

      // Jersey Number
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 8px var(--font-body)';
      ctx.textAlign = 'center';
      ctx.fillText(jerseyNumber, rx, ry - 22 + rBob);

      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(rx, ry - 27 + rBob);
      ctx.lineTo(rx - 10, ry - 20 + rBob);
      ctx.stroke();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(rx, ry - 12 + rBob);
      ctx.lineTo(rx - 6, ry);
      ctx.moveTo(rx, ry - 12 + rBob);
      ctx.lineTo(rx + 6, ry);
      ctx.stroke();

      // Functional Bat Styling from Legends Vault
      ctx.save();
      ctx.translate(rx - 10, ry - 20 + rBob);
      ctx.rotate(batsmanSwingAngleRef.current);
      
      const selectedBatId = localStorage.getItem('manucrick_selected_bat') || 'kashmir';
      if (selectedBatId === 'helicopter') {
        // Manoj's Helicopter Special: glowing gold/red bat
        ctx.strokeStyle = '#FFD700'; // Gold grip
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-10, -6);
        ctx.stroke();

        ctx.strokeStyle = '#FF3B30'; // Fire red body
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 5.2; // Extra heavy!
        ctx.beginPath();
        ctx.moveTo(-10, -6);
        ctx.lineTo(-28, -18);
        ctx.stroke();
      } else if (selectedBatId === 'cyber') {
        // Cyber-Carbon: Carbon black with neon blue cyber glow
        ctx.strokeStyle = '#F59E0B'; // Gold grip
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-10, -6);
        ctx.stroke();

        ctx.strokeStyle = '#111111'; // Carbon black body
        ctx.shadowColor = '#00E5FF'; // Neon blue glow
        ctx.shadowBlur = 8;
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.moveTo(-10, -6);
        ctx.lineTo(-28, -18);
        ctx.stroke();

        // Neon stripe
        ctx.strokeStyle = '#00E5FF';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-12, -7);
        ctx.lineTo(-26, -17);
        ctx.stroke();
      } else {
        // Kashmir Willow Pro: standard wood bat
        ctx.strokeStyle = batGripColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-10, -6);
        ctx.stroke();
        ctx.strokeStyle = '#DEB887';
        ctx.lineWidth = 4.2;
        ctx.beginPath();
        ctx.moveTo(-10, -6);
        ctx.lineTo(-28, -18);
        ctx.stroke();
      }
      ctx.restore();
      ctx.restore();

      // 5. Draw Ball & Tracer Trail
      if (ballStateRef.current !== 'idle') {
        // Fading tracer trail
        if (ballTrailRef.current.length > 1) {
          for (let i = 0; i < ballTrailRef.current.length - 1; i++) {
            const p1 = ballTrailRef.current[i];
            const p2 = ballTrailRef.current[i + 1];
            ctx.save();
            ctx.strokeStyle = '#CCFF00'; // Neon yellow trail
            ctx.lineWidth = (i + 1) * 1.5;
            ctx.globalAlpha = (i + 1) / ballTrailRef.current.length * 0.35;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.restore();
          }
        }

        // Main Ball rendering: High contrast neon
        ctx.save();
        ctx.fillStyle = '#CCFF00'; // Neon yellow-lime
        ctx.shadowColor = '#F59E0B'; // Pitch gold glow
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(ballXRef.current, ballYRef.current, 11, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ballXRef.current - 3, ballYRef.current - 3, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw particles & floats
      canvasParticlesRef.current.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      runsFloatsRef.current.forEach((item) => {
        ctx.save();
        ctx.globalAlpha = item.alpha;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 2.2rem var(--font-headings)';
        ctx.fillText(item.text, item.x, item.y);
        ctx.restore();
      });

      // 6. Draw AIMING ARC overlay in front of batsman
      if (bowlerStateRef.current === 'runin' && ballStateRef.current === 'idle' && batsmanSwingRef.current === 0) {
        ctx.save();
        ctx.translate(rx, ry - 30);
        ctx.rotate((aimAngle - 90) * Math.PI / 180);
        ctx.strokeStyle = 'rgba(0, 255, 135, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 80);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 255, 135, 0.6)';
        ctx.beginPath();
        ctx.arc(0, 80, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 7. Draw Translucent Swing Fan
      if (batsmanSwingRef.current > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(rx - 10, ry - 20);
        const radAim = (aimAngle - 90) * Math.PI / 180;
        ctx.arc(rx - 10, ry - 20, 52, radAim - Math.PI * 0.25, radAim + Math.PI * 0.25);
        ctx.lineTo(rx - 10, ry - 20);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    };

    render();

    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, aimAngle, batsmanRunning, currentRunsInSession, jerseyColor, jerseyNumber, batGripColor]);

  // Click handler attached to the entire screen container wrapper
  const handleContainerClick = (e: MouseEvent<HTMLDivElement>) => {
    if (gameState !== 'playing') return;

    // Prevent swing if clicking interactive buttons or panel parts
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'BUTTON' || 
      target.closest('button') || 
      target.closest('.interactive')
    ) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    // Calculates click coordinates relative to the canvas view plane
    const clickX = ((e.clientX - rect.left) / rect.width) * 480;
    const clickY = ((e.clientY - rect.top) / rect.height) * 720;

    processInteractiveShot(clickX, clickY);
  };

  const roundedRuns = Math.floor(currentRunsInSession);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        margin: '10px 0',
      }}
    >
      {/* Fullscreen Overlay mode wrapper with container click strike trigger */}
      <div
        onClick={handleContainerClick}
        style={isFullscreen ? {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#03050C',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px',
          overflow: 'hidden',
          boxSizing: 'border-box',
        } : {
          position: 'relative',
          width: '100%',
          maxWidth: '1200px',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 15px 45px rgba(0, 0, 0, 0.85)',
          backgroundColor: '#0a0a0a',
          border: '1px solid rgba(245, 158, 11, 0.15)',
        }}
        className="cricket-game-arena-wrapper"
      >
        {/* Fullscreen Overlay Close Button */}
        {isFullscreen && (
          <button
            onClick={() => {
              setIsFullscreen(false);
              setGameState('start');
            }}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              zIndex: 100,
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1.5px solid #FF3B30',
              backgroundColor: 'rgba(255, 59, 48, 0.12)',
              color: '#FF3B30',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: 'var(--font-headings)',
              fontSize: '1rem',
              letterSpacing: '1px',
              boxShadow: '0 0 15px rgba(255, 59, 48, 0.3)',
            }}
            className="interactive arena-exit-btn"
          >
            ❌ EXIT ARENA
          </button>
        )}

        {/* Scoreboard HUD Overlay */}
        {gameState === 'playing' && (
          <div
            className={`responsive-game-hud ${isFullscreen ? 'fullscreen-hud' : ''}`}
            style={{
              right: isFullscreen ? '160px' : undefined, // Shift to avoid overlap with exit button in fullscreen
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
            }}
          >
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>BATSMAN: </span>
              <span style={{ color: jerseyColor }}>{playerName}</span>
            </div>

            <div style={{ display: 'flex', gap: '12px 20px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>SCORE: </span>
                <span style={{ color: 'var(--primary)' }}>{score}</span>
              </div>
              {gameMode === 'endless' ? (
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>WICKETS: </span>
                  <span style={{ color: '#FF3B30' }}>{wickets}/3</span>
                </div>
              ) : gameMode === 'survival' ? (
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>BALLS: </span>
                  <span style={{ color: '#FFF' }}>{ballsRemaining} Left</span>
                </div>
              ) : (
                <>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>NEED: </span>
                    <span style={{ color: 'var(--accent)' }}>{Math.max(0, targetRuns - score)} Runs</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>BALLS: </span>
                    <span style={{ color: '#FFF' }}>{ballsRemaining} Left</span>
                  </div>
                  {gameMode === 'quick' && (
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>WICKETS: </span>
                      <span style={{ color: '#FF3B30' }}>{wickets}/3</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Boundary flashes */}
        {overlayEffect && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 12,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: overlayEffect === 'wicket' || overlayEffect === 'runout' ? 'rgba(255, 0, 0, 0.25)' : 'transparent',
              animation: 'overlayFlash 0.3s ease-out',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-headings)',
                fontSize: '6rem',
                color: overlayEffect === 'six' ? 'var(--accent)' : overlayEffect === 'four' ? 'var(--primary)' : '#FF3B30',
                textShadow: '0 0 30px rgba(0,0,0,0.85)',
                letterSpacing: '5px',
                animation: 'textPop 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite alternate',
              }}
            >
              {overlayEffect === 'runout' ? 'RUN OUT!' : `${overlayEffect.toUpperCase()}!`}
            </div>
          </div>
        )}

        {/* Start Game Mode Overlay */}
        {gameState === 'start' && (
          <div
            style={{
              width: '100%',
              minHeight: '520px',
              zIndex: 15,
              backgroundColor: 'rgba(10, 10, 10, 0.96)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '40px 20px',
              textAlign: 'center',
            }}
          >
            <h3 style={{ fontFamily: 'var(--font-headings)', fontSize: 'clamp(1.6rem, 7vw, 3.2rem)', color: '#FFF', letterSpacing: '2px', marginBottom: '8px', textAlign: 'center' }}>
              MANUCRICK PLAY ARENA
            </h3>
            <p style={{ maxWidth: '480px', fontSize: '0.96rem', color: 'var(--text-secondary)', marginBottom: '25px' }}>
              Select your match challenge mode, choose difficulty, and enter the pitch creases!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', maxWidth: '300px', marginBottom: '24px' }}>
              {/* Game Modes */}
              <div className="start-modes-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {(['endless', 'superover', 'survival', 'target', 'quick'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setGameMode(mode)}
                    style={{
                      padding: '8px 0',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: gameMode === mode ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                      backgroundColor: gameMode === mode ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
                      color: gameMode === mode ? 'var(--primary)' : '#FFF',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      cursor: 'pointer',
                      gridColumn: mode === 'quick' ? 'span 2' : undefined,
                    }}
                    className="interactive"
                  >
                    {mode === 'endless' ? 'Championship' : mode === 'superover' ? 'Super Over' : mode === 'survival' ? 'Wicket Survival' : mode === 'target' ? 'Target Attack' : 'Quick Match'}
                  </button>
                ))}
              </div>

              {/* Overs Selector for Quick Match */}
              {gameMode === 'quick' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
                    Select Overs
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {([1, 2, 5, 10] as const).map((overs) => (
                      <button
                        key={overs}
                        onClick={() => setSelectedOvers(overs)}
                        style={{
                          flex: 1,
                          padding: '7px 0',
                          borderRadius: '5px',
                          border: '1px solid',
                          borderColor: selectedOvers === overs ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                          backgroundColor: selectedOvers === overs ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
                          color: selectedOvers === overs ? 'var(--primary)' : '#FFF',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                        className="interactive"
                      >
                        {overs} {overs === 1 ? 'Over' : 'Ov'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Difficulty */}
              <div className="start-difficulty-row" style={{ display: 'flex', gap: '8px' }}>
                {(['easy', 'medium', 'hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => handleDifficultySelect(diff)}
                    style={{
                      flex: 1,
                      padding: '7px 0',
                      borderRadius: '5px',
                      border: '1px solid',
                      borderColor: difficulty === diff ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                      backgroundColor: difficulty === diff ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
                      color: difficulty === diff ? 'var(--primary)' : '#FFF',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                    className="interactive"
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => initGame(gameMode)}
              style={{
                width: '300px',
                padding: '14px 0',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--primary)',
                color: '#050A18',
                fontFamily: 'var(--font-headings)',
                fontSize: '1.5rem',
                letterSpacing: '2px',
                cursor: 'pointer',
                boxShadow: '0 0 16px rgba(245, 158, 11, 0.4)',
                transition: 'all 0.2s',
              }}
              className="interactive start-match-btn"
            >
              🏏 ENTER FIELD
            </button>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'out' && (
          <div
            style={{
              width: '100%',
              minHeight: '520px',
              zIndex: 15,
              backgroundColor: 'rgba(10, 10, 10, 0.96)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '40px 20px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-headings)',
                fontSize: '4rem',
                color: (gameMode === 'superover' || gameMode === 'target' || gameMode === 'quick') && score >= targetRuns ? 'var(--primary)' : '#FF3B30',
                textShadow: '0 0 20px rgba(0,0,0,0.8)',
                letterSpacing: '2px',
                marginBottom: '15px',
              }}
            >
              {gameMode === 'superover' || gameMode === 'target' || gameMode === 'quick'
                ? (score >= targetRuns ? 'CHALLENGE ACCOMPLISHED! 🏆' : 'CHALLENGE FAILED! ❌')
                : gameMode === 'survival' ? 'CHALLENGE ENDED! 🏟️' : 'ALL OUT!'}
            </div>

            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                padding: '16px 36px',
                marginBottom: '25px',
              }}
            >
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1.5px', marginBottom: '4px' }}>
                {gameMode === 'endless' ? 'Championship Score' : gameMode === 'superover' ? 'Super Over Score' : gameMode === 'survival' ? 'Survival Score' : gameMode === 'target' ? 'Target Attack Score' : 'Quick Match Score'}
              </div>
              <div style={{ fontFamily: 'var(--font-headings)', fontSize: '3rem', color: '#FFF', lineHeight: 1 }}>
                {score} Runs
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Balls Faced: <span style={{ color: '#FFF', fontWeight: 'bold' }}>{balls}</span> &bull; Difficulty: <span style={{ color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>{difficulty}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={() => initGame(gameMode)}
                style={{
                  width: '180px',
                  padding: '12px 0',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'var(--primary)',
                  color: '#050A18',
                  fontFamily: 'var(--font-headings)',
                  fontSize: '1.3rem',
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  boxShadow: '0 0 10px rgba(245, 158, 11, 0.3)',
                }}
                className="interactive start-match-btn"
              >
                🔄 PLAY AGAIN
              </button>
              <button
                onClick={() => {
                  setIsFullscreen(false);
                  setGameState('start');
                }}
                style={{
                  width: '180px',
                  padding: '12px 0',
                  borderRadius: '6px',
                  border: '1.5px solid rgba(255,255,255,0.12)',
                  backgroundColor: 'transparent',
                  color: '#FFF',
                  fontFamily: 'var(--font-headings)',
                  fontSize: '1.3rem',
                  letterSpacing: '1px',
                  cursor: 'pointer',
                }}
                className="interactive"
              >
                🚪 EXIT ARENA
              </button>
            </div>
          </div>
        )}

        {/* Responsive Canvas */}
        {gameState === 'playing' && (
          <canvas
            ref={canvasRef}
            width={480}
            height={720}
            style={{
              display: 'block',
              width: '100%',
              maxWidth: '480px',
              margin: '0 auto',
              height: isFullscreen ? 'calc(100vh - 120px)' : 'auto', // Fits screen height in fullscreen mode
              maxHeight: isFullscreen ? '78vh' : 'none',
              aspectRatio: '48/72',
            }}
          />
        )}

        {/* Bottom Panel */}
        {gameState === 'playing' && (
          <div
            style={{
              padding: '14px 20px',
              backgroundColor: 'rgba(4, 7, 19, 0.96)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div className="game-hud-bottom-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Bowling Style: <span style={{ color: 'var(--secondary)' }}>{deliveryName} DELIVERY</span>
                </div>
                <div style={{ color: '#E5E7EB', fontSize: '0.85rem', fontWeight: 600 }}>
                  Last Aim Angle: <span style={{ color: 'var(--primary)' }}>{aimAngle}°</span> &bull; Click anywhere on screen to hit!
                </div>
              </div>

              {/* Actions */}
              <div className="game-hud-actions" style={{ display: 'flex', gap: '10px' }}>
                {!batsmanRunning ? (
                  <button
                    onClick={triggerRun}
                    disabled={ballStateRef.current === 'bowled' || ballStateRef.current === 'thrown'}
                    style={{
                      padding: '8px 24px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'var(--primary)',
                      color: '#050A18',
                      fontFamily: 'var(--font-headings)',
                      fontSize: '1.1rem',
                      letterSpacing: '1px',
                      cursor: 'pointer',
                      boxShadow: '0 0 10px rgba(245, 158, 11, 0.25)',
                      opacity: ballStateRef.current === 'bowled' || ballStateRef.current === 'thrown' ? 0.35 : 1,
                    }}
                    className="interactive"
                  >
                    🏃 RUN CREASE
                  </button>
                ) : (
                  <button
                    onClick={stopRunning}
                    style={{
                      padding: '8px 24px',
                      borderRadius: '6px',
                      border: '1.5px solid #FF3B30',
                      backgroundColor: 'rgba(255, 59, 48, 0.1)',
                      color: '#FF3B30',
                      fontFamily: 'var(--font-headings)',
                      fontSize: '1.1rem',
                      letterSpacing: '1px',
                      cursor: 'pointer',
                      boxShadow: '0 0 10px rgba(255, 59, 48, 0.2)',
                    }}
                    className="interactive"
                  >
                    🛑 STOP RUNNING
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: feedbackColor, fontWeight: 700, fontSize: '0.98rem', fontFamily: 'var(--font-body)', letterSpacing: '0.5px' }}>
                {shotFeedback}
              </div>
              
              {batsmanRunning && (
                <div style={{ color: isBatsmanSafe ? 'var(--primary)' : '#FF3B30', fontWeight: 700, fontSize: '0.92rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Runs: {roundedRuns} &bull; {isBatsmanSafe ? '🟢 SAFE IN CREASE' : '🔴 DANGER RUNOUT!'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
