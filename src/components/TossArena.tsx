import { useState, useEffect, useRef } from 'react';

interface Stats {
  totalFlips: number;
  heads: number;
  tails: number;
  wins: number;
  losses: number;
  currentStreak: number;
}

interface HistoryItem {
  id: string;
  outcome: 'Heads' | 'Tails';
  userChoice?: 'Heads' | 'Tails' | null;
  timestamp: string;
  resultStatus: 'win' | 'loss' | 'neutral';
}

export function TossArena() {
  const [isFlipping, setIsFlipping] = useState(false);
  const [coinTheme, setCoinTheme] = useState<'gold' | 'silver' | 'neon' | 'leather'>('gold');
  const [userChoice, setUserChoice] = useState<'Heads' | 'Tails' | null>(null);
  const [gameActive, setGameActive] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info' | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalFlips: 0,
    heads: 0,
    tails: 0,
    wins: 0,
    losses: 0,
    currentStreak: 0,
  });
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // We keep track of the cumulative rotation so the coin always spins forward
  const [rotation, setRotation] = useState({ x: 20, y: 0, z: 0 });
  const rotationRef = useRef({ x: 20, y: 0, z: 0 });

  // Load stats and history from localStorage
  useEffect(() => {
    const savedStats = localStorage.getItem('manucrick_toss_stats');
    const savedHistory = localStorage.getItem('manucrick_toss_history');
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (e) {
        console.error('Error loading stats from localStorage', e);
      }
    }
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error loading history from localStorage', e);
      }
    }
  }, []);

  // Save helper
  const saveStatsAndHistory = (newStats: Stats, newHistory: HistoryItem[]) => {
    localStorage.setItem('manucrick_toss_stats', JSON.stringify(newStats));
    localStorage.setItem('manucrick_toss_history', JSON.stringify(newHistory));
    setStats(newStats);
    setHistory(newHistory);
  };

  // Synthesize sound effects using Web Audio API
  const playSound = (type: 'flip' | 'land') => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (type === 'flip') {
        // Metallic spin sweep sound
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.15);
        osc.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.4);
        
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
        
        // Rapid ticks mimicking coin spin
        for (let i = 0; i < 7; i++) {
          const tickOsc = audioCtx.createOscillator();
          const tickGain = audioCtx.createGain();
          tickOsc.type = 'triangle';
          tickOsc.frequency.setValueAtTime(1000 - i * 50, audioCtx.currentTime + i * 0.06);
          tickGain.gain.setValueAtTime(0.03, audioCtx.currentTime + i * 0.06);
          tickGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.06 + 0.03);
          tickOsc.connect(tickGain);
          tickGain.connect(audioCtx.destination);
          tickOsc.start(audioCtx.currentTime + i * 0.06);
          tickOsc.stop(audioCtx.currentTime + i * 0.06 + 0.04);
        }
      } else if (type === 'land') {
        // Metallic landing bell chime + double bounce
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(987.77, audioCtx.currentTime); // B5
        osc1.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.2);
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1318.51, audioCtx.currentTime); // E6
        osc2.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.12);
        
        gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc1.start();
        osc2.start();
        osc1.stop(audioCtx.currentTime + 0.3);
        osc2.stop(audioCtx.currentTime + 0.3);
        
        // Bounce thud
        const thudOsc = audioCtx.createOscillator();
        const thudGain = audioCtx.createGain();
        thudOsc.type = 'sine';
        thudOsc.frequency.setValueAtTime(150, audioCtx.currentTime + 0.25);
        thudGain.gain.setValueAtTime(0.15, audioCtx.currentTime + 0.25);
        thudGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
        thudOsc.connect(thudGain);
        thudGain.connect(audioCtx.destination);
        thudOsc.start(audioCtx.currentTime + 0.25);
        thudOsc.stop(audioCtx.currentTime + 0.45);
      }
    } catch (err) {
      console.warn("Web Audio not allowed or failed to initialize", err);
    }
  };

  // Main Coin Flip execution
  const flipCoin = () => {
    if (isFlipping) return;
    
    // Clear message and start flipping state
    setIsFlipping(true);
    setMessage(null);
    setMessageType(null);
    playSound('flip');

    // Generate random outcome: 50% probability
    const isHeads = Math.random() < 0.5;
    const finalOutcome = isHeads ? 'Heads' : 'Tails';

    // Spin details
    const minTurns = 5; // minimum full spins
    const additionalTurns = Math.floor(Math.random() * 3) + 1; // 1-3 extra spins
    const totalSpins = minTurns + additionalTurns;
    
    // Calculate final rotation
    // Heads ends at 0 or 360, Tails ends at 180 degrees
    let targetX = rotationRef.current.x + totalSpins * 360;
    if (finalOutcome === 'Tails') {
      // If we are currently landing on tails, targetX must end on 180 + N*360
      // We align targetX so that (targetX % 360) is exactly 180
      const currentFullSpins = Math.floor(targetX / 360);
      targetX = currentFullSpins * 360 + 180;
      // Add extra turns to keep spinning forward
      targetX += 360 * additionalTurns;
    } else {
      // Align targetX to be a multiple of 360
      const currentFullSpins = Math.floor(targetX / 360);
      targetX = currentFullSpins * 360 + 360;
      targetX += 360 * additionalTurns;
    }
    
    // Add minor tilt variations on Y/Z axis so it spins offset slightly
    const targetY = Math.floor(Math.random() * 40) - 20; // -20deg to 20deg
    const targetZ = Math.floor(Math.random() * 40) - 20;

    // Apply rotation update state (handled smoothly by css transition)
    const finalRotation = { x: targetX, y: targetY, z: targetZ };
    setRotation(finalRotation);
    rotationRef.current = finalRotation;

    // Trigger state change after landing (1.6 seconds transition)
    setTimeout(() => {
      setIsFlipping(false);
      playSound('land');

      // Process Stats & Game outcomes
      let winCount = stats.wins;
      let lossCount = stats.losses;
      let currentStr = stats.currentStreak;
      let status: 'win' | 'loss' | 'neutral' = 'neutral';

      if (gameActive && userChoice) {
        if (userChoice === finalOutcome) {
          winCount += 1;
          currentStr = currentStr >= 0 ? currentStr + 1 : 1;
          status = 'win';
          setMessage(`🎉 YOU WON THE TOSS! The coin landed on ${finalOutcome.toUpperCase()}.`);
          setMessageType('success');
        } else {
          lossCount += 1;
          currentStr = currentStr <= 0 ? currentStr - 1 : -1;
          status = 'loss';
          setMessage(`😢 YOU LOST THE TOSS! The coin landed on ${finalOutcome.toUpperCase()}.`);
          setMessageType('error');
        }
      } else {
        setMessage(`Coin landed on: ${finalOutcome.toUpperCase()}`);
        setMessageType('info');
      }

      // Update statistics object
      const updatedStats: Stats = {
        totalFlips: stats.totalFlips + 1,
        heads: finalOutcome === 'Heads' ? stats.heads + 1 : stats.heads,
        tails: finalOutcome === 'Tails' ? stats.tails + 1 : stats.tails,
        wins: winCount,
        losses: lossCount,
        currentStreak: currentStr,
      };

      // Add to history
      const newHistoryItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        outcome: finalOutcome,
        userChoice: gameActive ? userChoice : null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        resultStatus: status,
      };

      const updatedHistory = [newHistoryItem, ...history.slice(0, 19)]; // Limit to 20 items
      saveStatsAndHistory(updatedStats, updatedHistory);
    }, 1600);
  };

  const selectChoice = (choice: 'Heads' | 'Tails') => {
    if (isFlipping) return;
    setUserChoice(choice);
    setGameActive(true);
    setMessage(`You called: ${choice.toUpperCase()}. Flip the coin to start the match!`);
    setMessageType('info');
  };

  const clearCall = () => {
    if (isFlipping) return;
    setUserChoice(null);
    setGameActive(false);
    setMessage(null);
    setMessageType(null);
  };

  const resetAllStats = () => {
    if (window.confirm('Are you sure you want to reset all Toss Arena statistics and history?')) {
      const resetStats = { totalFlips: 0, heads: 0, tails: 0, wins: 0, losses: 0, currentStreak: 0 };
      saveStatsAndHistory(resetStats, []);
      clearCall();
    }
  };

  // Generate edge segments to give the coin real depth
  const edgeSegments = Array.from({ length: 12 });

  // Get active theme variables
  const getThemeStyle = () => {
    switch (coinTheme) {
      case 'silver':
        return {
          frontBg: 'var(--silver-metal)',
          backBg: 'var(--silver-metal)',
          borderColor: '#BDC3C7',
          textColor: '#2C3E50',
          glow: 'rgba(255, 255, 255, 0.25)',
          rimColor: 'radial-gradient(circle, #BDC3C7 0%, #7F8C8D 100%)',
          textColorInner: '#7F8C8D',
        };
      case 'neon':
        return {
          frontBg: 'var(--neon-metal)',
          backBg: 'var(--neon-metal)',
          borderColor: 'var(--primary)',
          textColor: '#FFFFFF',
          glow: 'rgba(0, 255, 135, 0.4)',
          rimColor: 'radial-gradient(circle, var(--primary) 0%, var(--secondary) 100%)',
          textColorInner: 'var(--primary)',
        };
      case 'leather':
        return {
          frontBg: 'var(--leather-metal)',
          backBg: 'var(--leather-metal)',
          borderColor: '#FFFFFF',
          textColor: '#FFFFFF',
          glow: 'rgba(231, 76, 60, 0.4)',
          rimColor: '#C0392B',
          textColorInner: '#FFE4B5',
        };
      case 'gold':
      default:
        return {
          frontBg: 'var(--gold-metal)',
          backBg: 'var(--gold-metal)',
          borderColor: '#F39C12',
          textColor: '#6E2C00',
          glow: 'rgba(241, 196, 15, 0.4)',
          rimColor: 'radial-gradient(circle, #FFE066 0%, #D35400 100%)',
          textColorInner: '#B7950B',
        };
    }
  };

  const activeTheme = getThemeStyle();

  return (
    <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* HEADER CONTROLS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        {/* Themes Selectors */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Coin Skin:</span>
          {(['gold', 'silver', 'neon', 'leather'] as const).map((t) => (
            <button
              key={t}
              onClick={() => !isFlipping && setCoinTheme(t)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: coinTheme === t ? '1.5px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
                backgroundColor: coinTheme === t ? 'rgba(0, 255, 135, 0.08)' : 'rgba(5, 10, 24, 0.4)',
                color: coinTheme === t ? '#FFFFFF' : 'var(--text-secondary)',
                fontSize: '0.82rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                cursor: 'none',
                transition: 'all 0.3s',
              }}
              className="interactive"
            >
              {t}
            </button>
          ))}
        </div>

        {/* Audio trigger */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '1.4rem',
            cursor: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          className="interactive"
        >
          {isMuted ? '🔇 Muted' : '🔊 Audio ON'}
        </button>
      </div>

      {/* STAGE & PLAYGROUND */}
      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', width: '100%' }}>
        
        {/* LEFT COLUMN: THE COIN VIEWPORT & CONTROLS */}
        <div
          className="glass-panel"
          style={{
            flex: '1.2',
            minWidth: '320px',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* 3D Coin Viewer Arena */}
          <div
            style={{
              height: '320px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              width: '100%',
            }}
          >
            {/* Ambient spotlights behind coin */}
            <div
              style={{
                position: 'absolute',
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${activeTheme.glow} 0%, transparent 70%)`,
                filter: 'blur(10px)',
                pointerEvents: 'none',
                transform: `scale(${isFlipping ? 1.4 : 1})`,
                transition: 'all 0.5s ease-out',
                opacity: 0.7,
              }}
            />

            {/* 3D Coin Wrapper Container */}
            <div className="coin-container" style={{ transform: `scale(${isFlipping ? 1.15 : 1})`, transition: 'transform 1.6s cubic-bezier(0.1, 0.8, 0.1, 1)' }}>
              
              {/* Actual Coin Rotating */}
              <div
                className="coin-3d"
                style={{
                  transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg) translateY(${isFlipping ? -150 : 0}px)`,
                  transition: isFlipping ? 'transform 1.6s cubic-bezier(0.25, 0.9, 0.3, 1)' : 'transform 0.4s ease-out',
                }}
              >
                {/* HEADS SIDE (Front Face) */}
                <div
                  className="coin-face front"
                  style={{
                    background: activeTheme.frontBg,
                    borderColor: activeTheme.borderColor,
                    color: activeTheme.textColor,
                    boxShadow: `inset 0 0 25px rgba(0, 0, 0, 0.35), 0 0 15px ${activeTheme.glow}`,
                    transform: 'translateZ(5px)', // pushed forward
                  }}
                >
                  <div className="coin-shine" />
                  
                  {/* Styled Outer Emblem Ring */}
                  <div style={{ position: 'absolute', top: '10px', bottom: '10px', left: '10px', right: '10px', borderRadius: '50%', border: `1.5px dashed ${activeTheme.textColorInner}`, opacity: 0.65 }} />
                  
                  {/* Inside Contents */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                    {coinTheme === 'leather' ? (
                      <span style={{ fontSize: '3.6rem', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.5))' }}>🏏</span>
                    ) : (
                      <span style={{ fontSize: '3.6rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>🏆</span>
                    )}
                    <span style={{ fontFamily: 'var(--font-headings)', fontSize: '1.5rem', letterSpacing: '2px', marginTop: '2px' }}>HEADS</span>
                  </div>
                </div>

                {/* CYLINDRICAL RIM SEGMENTS (Thickness) */}
                <div className="coin-edge-loop">
                  {edgeSegments.map((_, i) => (
                    <div
                      key={i}
                      className="coin-edge-segment"
                      style={{
                        background: activeTheme.rimColor,
                        height: '10px', // Coin thickness
                        width: '54px',  // Segment width for overlap
                        left: '73px',
                        top: '95px',
                        position: 'absolute',
                        borderTop: '1px solid rgba(255,255,255,0.15)',
                        borderBottom: '1px solid rgba(0,0,0,0.3)',
                        // Rotate around Y-axis to cover the edge, translate outward to radius (99px), rotate X so it wraps vertically
                        transform: `rotateY(${i * 30}deg) translateZ(99px) rotateX(90deg)`,
                        backfaceVisibility: 'visible',
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      {/* Cricket seam dashed line on Leather theme edge */}
                      {coinTheme === 'leather' && (
                        <div style={{ position: 'absolute', left: 0, right: 0, top: '4px', height: '2px', borderTop: '2px dashed #FFF', opacity: 0.9 }} />
                      )}
                    </div>
                  ))}
                </div>

                {/* TAILS SIDE (Back Face) */}
                <div
                  className="coin-face back"
                  style={{
                    background: activeTheme.backBg,
                    borderColor: activeTheme.borderColor,
                    color: activeTheme.textColor,
                    boxShadow: `inset 0 0 25px rgba(0, 0, 0, 0.35), 0 0 15px ${activeTheme.glow}`,
                    transform: 'rotateY(180deg) translateZ(5px)', // pushed backward & rotated
                  }}
                >
                  <div className="coin-shine" />
                  
                  {/* Outer Emblem Ring */}
                  <div style={{ position: 'absolute', top: '10px', bottom: '10px', left: '10px', right: '10px', borderRadius: '50%', border: `1.5px dashed ${activeTheme.textColorInner}`, opacity: 0.65 }} />
                  
                  {/* Inside Contents */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                    {coinTheme === 'leather' ? (
                      <span style={{ fontSize: '3.6rem', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.5))' }}>🥎</span>
                    ) : (
                      <span style={{ fontSize: '3.6rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>🥎</span>
                    )}
                    <span style={{ fontFamily: 'var(--font-headings)', fontSize: '1.5rem', letterSpacing: '2px', marginTop: '2px' }}>TAILS</span>
                  </div>
                </div>

              </div>

              {/* Coin Shadow which scales/fades relative to coin height */}
              <div
                className="coin-shadow-3d"
                style={{
                  transform: `scale(${isFlipping ? 0.45 : 1.05})`,
                  opacity: isFlipping ? 0.25 : 0.65,
                  transition: 'transform 1.6s cubic-bezier(0.1, 0.8, 0.1, 1), opacity 1.6s cubic-bezier(0.1, 0.8, 0.1, 1)',
                }}
              />
            </div>

          </div>

          {/* CALL THE TOSS PICKER */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', marginTop: '10px', zIndex: 10 }}>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Select your Call (Optional)
            </p>
            
            <div style={{ display: 'flex', gap: '15px', width: '100%', maxWidth: '300px' }}>
              <button
                onClick={() => selectChoice('Heads')}
                disabled={isFlipping}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: '8px',
                  border: userChoice === 'Heads' ? '1.5px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: userChoice === 'Heads' ? 'rgba(0,255,135,0.08)' : 'rgba(255,255,255,0.01)',
                  color: userChoice === 'Heads' ? 'var(--primary)' : '#FFFFFF',
                  fontFamily: 'var(--font-headings)',
                  fontSize: '1.25rem',
                  letterSpacing: '1px',
                  cursor: isFlipping ? 'not-allowed' : 'none',
                  transition: 'all 0.25s',
                }}
                className="interactive"
              >
                🏆 HEADS
              </button>
              
              <button
                onClick={() => selectChoice('Tails')}
                disabled={isFlipping}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: '8px',
                  border: userChoice === 'Tails' ? '1.5px solid var(--secondary)' : '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: userChoice === 'Tails' ? 'rgba(255,107,0,0.08)' : 'rgba(255,255,255,0.01)',
                  color: userChoice === 'Tails' ? 'var(--secondary)' : '#FFFFFF',
                  fontFamily: 'var(--font-headings)',
                  fontSize: '1.25rem',
                  letterSpacing: '1px',
                  cursor: isFlipping ? 'not-allowed' : 'none',
                  transition: 'all 0.25s',
                }}
                className="interactive"
              >
                🥎 TAILS
              </button>
            </div>

            {userChoice && (
              <button
                onClick={clearCall}
                disabled={isFlipping}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FF4D4D',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: isFlipping ? 'not-allowed' : 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
                className="interactive"
              >
                Clear Call Choice
              </button>
            )}
          </div>

          {/* LARGE FLIP BUTTON */}
          <div style={{ marginTop: '28px', width: '100%', maxWidth: '300px', zIndex: 10 }}>
            <button
              onClick={flipCoin}
              disabled={isFlipping}
              style={{
                width: '100%',
                padding: '14px 0',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isFlipping ? 'rgba(255, 255, 255, 0.05)' : 'var(--primary)',
                color: isFlipping ? 'var(--text-secondary)' : '#050A18',
                fontFamily: 'var(--font-headings)',
                fontSize: '1.5rem',
                letterSpacing: '2.5px',
                cursor: isFlipping ? 'not-allowed' : 'none',
                boxShadow: isFlipping ? 'none' : '0 0 20px rgba(0, 255, 135, 0.35)',
                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
              }}
              className="interactive"
            >
              {isFlipping ? '🪙 FLIPPING...' : '🚀 FLIP THE COIN'}
            </button>
          </div>

          {/* RESULT STATUS BANNER */}
          {message && (
            <div
              style={{
                marginTop: '25px',
                padding: '12px 20px',
                borderRadius: '8px',
                width: '100%',
                maxWidth: '400px',
                textAlign: 'center',
                backgroundColor:
                  messageType === 'success'
                    ? 'rgba(0, 255, 135, 0.08)'
                    : messageType === 'error'
                    ? 'rgba(255, 77, 77, 0.08)'
                    : 'rgba(255, 255, 255, 0.03)',
                border: `1.5px solid ${
                  messageType === 'success'
                    ? 'var(--primary)'
                    : messageType === 'error'
                    ? '#FF4D4D'
                    : 'rgba(255, 255, 255, 0.08)'
                }`,
                color: messageType === 'success' ? 'var(--primary)' : messageType === 'error' ? '#FF4D4D' : '#FFFFFF',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '1.02rem',
                letterSpacing: '0.8px',
                animation: 'badgePulse 2s infinite alternate ease-in-out',
              }}
            >
              {message}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: STATS AND TOSS HISTORY */}
        <div style={{ flex: '1', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* STATS OVERVIEW CARD */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h3 style={{ fontSize: '1.7rem', color: '#FFFFFF', marginBottom: '22px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
              📊 Toss Statistics
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              {/* Total Flips */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Total Tosses</span>
                <p style={{ fontFamily: 'var(--font-headings)', fontSize: '2rem', color: '#FFF', marginTop: '4px' }}>{stats.totalFlips}</p>
              </div>

              {/* Current Streak */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Call Streak</span>
                <p
                  style={{
                    fontFamily: 'var(--font-headings)',
                    fontSize: '2rem',
                    color: stats.currentStreak > 0 ? 'var(--primary)' : stats.currentStreak < 0 ? '#FF4D4D' : '#FFF',
                    marginTop: '4px',
                  }}
                >
                  {stats.currentStreak > 0 ? `W ${stats.currentStreak}` : stats.currentStreak < 0 ? `L ${Math.abs(stats.currentStreak)}` : '0'}
                </p>
              </div>

              {/* Heads / Tails Count */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#FFFFFF', fontWeight: 600 }}>🏆 Heads: {stats.heads}</span>
                  <span style={{ fontSize: '0.85rem', color: '#FFFFFF', fontWeight: 600 }}>🥎 Tails: {stats.tails}</span>
                </div>
                {/* Progress bar */}
                <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                  <div
                    style={{
                      height: '100%',
                      width: stats.totalFlips > 0 ? `${(stats.heads / stats.totalFlips) * 100}%` : '50%',
                      backgroundColor: 'var(--primary)',
                      boxShadow: '0 0 6px var(--primary)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                  <div
                    style={{
                      height: '100%',
                      width: stats.totalFlips > 0 ? `${(stats.tails / stats.totalFlips) * 100}%` : '50%',
                      backgroundColor: 'var(--secondary)',
                      boxShadow: '0 0 6px var(--secondary)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>{stats.totalFlips > 0 ? Math.round((stats.heads / stats.totalFlips) * 100) : 50}%</span>
                  <span>{stats.totalFlips > 0 ? Math.round((stats.tails / stats.totalFlips) * 100) : 50}%</span>
                </div>
              </div>

              {/* Call Success Ratio */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', gridColumn: 'span 2' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Call Accuracy (Guessed right)</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '6px' }}>
                  <p style={{ fontFamily: 'var(--font-headings)', fontSize: '2rem', color: '#FFF', margin: 0 }}>
                    {stats.wins + stats.losses > 0
                      ? `${Math.round((stats.wins / (stats.wins + stats.losses)) * 100)}%`
                      : 'N/A'}
                  </p>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    ({stats.wins} wins / {stats.wins + stats.losses} total calls)
                  </span>
                </div>
              </div>

            </div>

            {stats.totalFlips > 0 && (
              <button
                onClick={resetAllStats}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.25)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  marginTop: '20px',
                  width: '100%',
                  textAlign: 'right',
                  cursor: 'none',
                  textTransform: 'uppercase',
                }}
                className="interactive reset-stats-btn"
              >
                Reset Stats & History
              </button>
            )}
          </div>

          {/* HISTORY LOG CARD */}
          <div className="glass-panel" style={{ padding: '30px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.7rem', color: '#FFFFFF', marginBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
              📜 Toss History
            </h3>
            
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxHeight: '260px',
                overflowY: 'auto',
                flex: 1,
                paddingRight: '5px',
              }}
              className="table-scroll-container"
            >
              {history.length === 0 ? (
                <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '100px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  No tosses logged. Flip the coin!
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255,255,255,0.01)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      transition: 'all 0.2s',
                    }}
                    className="history-item"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.1rem' }}>
                        {item.outcome === 'Heads' ? '🏆' : '🥎'}
                      </span>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: item.outcome === 'Heads' ? 'var(--primary)' : 'var(--secondary)' }}>
                          {item.outcome}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '10px' }}>
                          {item.timestamp}
                        </span>
                      </div>
                    </div>

                    {item.userChoice && (
                      <div
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor:
                            item.resultStatus === 'win'
                              ? 'rgba(0, 255, 135, 0.08)'
                              : 'rgba(255, 77, 77, 0.08)',
                          border: `1px solid ${
                            item.resultStatus === 'win' ? 'var(--primary)' : '#FF4D4D'
                          }`,
                          color: item.resultStatus === 'win' ? 'var(--primary)' : '#FF4D4D',
                        }}
                      >
                        {item.resultStatus === 'win' ? 'WIN' : 'LOSE'} (Called {item.userChoice.substring(0, 1)})
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      <style>{`
        .reset-stats-btn:hover {
          color: #FF4D4D !important;
          text-shadow: 0 0 5px rgba(255, 77, 77, 0.3);
        }
        .history-item:hover {
          background-color: rgba(255,255,255,0.03) !important;
          border-color: rgba(255,255,255,0.08) !important;
        }
      `}</style>
    </div>
  );
}
