import { useState, useRef, useEffect } from 'react';

export function TossArena() {
  const [isFlipping, setIsFlipping] = useState(false);
  const [coinTheme, setCoinTheme] = useState<'gold' | 'silver' | 'neon' | 'leather'>('gold');
  const [userChoice, setUserChoice] = useState<'Heads' | 'Tails' | null>(null);
  const [gameActive, setGameActive] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info' | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // We keep track of the cumulative rotation so the coin always spins forward
  const [rotation, setRotation] = useState({ x: 20, y: 0, z: 0 });
  const rotationRef = useRef({ x: 20, y: 0, z: 0 });

  // Ground Rules states
  const [groundRules, setGroundRules] = useState({
    oneTipOneHand: false,
    boxCricketMode: false,
    lostBallRuns: false,
    noBallFreeHit: false,
    lastManBatting: false,
  });
  const [customRules, setCustomRules] = useState<string[]>([]);
  const [newCustomRule, setNewCustomRule] = useState('');

  // Load ground rules on mount
  useEffect(() => {
    const savedRules = localStorage.getItem('manucrick_ground_rules');
    if (savedRules) {
      try {
        const { standard, custom } = JSON.parse(savedRules);
        if (standard) setGroundRules(standard);
        if (custom) setCustomRules(custom);
      } catch (e) {
        console.error("Error reading saved rules", e);
      }
    }
  }, []);

  const saveRules = () => {
    localStorage.setItem('manucrick_ground_rules', JSON.stringify({
      standard: groundRules,
      custom: customRules
    }));
    alert("Ground rules saved successfully as default!");
  };

  const shareRules = () => {
    let rulesText = `🏏 ManucricK Match Setup & Rules 🏏\n═══════════════════\n`;
    if (message) {
      rulesText += `Toss Result: ${message}\n═══════════════════\n`;
    }
    rulesText += `AGREED GROUND RULES:\n`;
    
    const rulesList: string[] = [];
    if (groundRules.oneTipOneHand) rulesList.push("✔ 1 Tip 1 Hand Out (One bounce catch is OUT)");
    if (groundRules.boxCricketMode) rulesList.push("✔ Box Cricket Boundaries (No standard 6s)");
    if (groundRules.lostBallRuns) rulesList.push("✔ Lost Ball = 5 Runs");
    if (groundRules.noBallFreeHit) rulesList.push("✔ No Ball = Free Hit");
    if (groundRules.lastManBatting) rulesList.push("✔ Last Man Standing bats alone");
    
    customRules.forEach(rule => {
      rulesList.push(`✔ ${rule}`);
    });
    
    if (rulesList.length === 0) {
      rulesList.push("• Standard cricket rules apply.");
    }
    
    rulesText += rulesList.join('\n') + `\n═══════════════════\nCreate matches at manucrick.vercel.app`;
    
    navigator.clipboard.writeText(rulesText);
    alert("WhatsApp rules summary copied to clipboard! Paste it in your group.");
  };

  const addCustomRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomRule.trim()) return;
    setCustomRules([...customRules, newCustomRule.trim()]);
    setNewCustomRule('');
  };

  const removeCustomRule = (idx: number) => {
    setCustomRules(customRules.filter((_, i) => i !== idx));
  };

  // Synthesize sound effects using Web Audio API
  const playSound = (type: 'flip' | 'land') => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (type === 'flip') {
        // High quality metallic coin spin using frequency modulation (LFO)
        const spinOsc = audioCtx.createOscillator();
        const spinGain = audioCtx.createGain();
        
        const fmOsc = audioCtx.createOscillator();
        const fmGain = audioCtx.createGain();
        
        // Ring resonance oscillator
        const ringOsc = audioCtx.createOscillator();
        const ringGain = audioCtx.createGain();
        
        // Configure Main Spin (frequency slides down as it spins)
        spinOsc.type = 'sine';
        spinOsc.frequency.setValueAtTime(950, audioCtx.currentTime);
        spinOsc.frequency.exponentialRampToValueAtTime(650, audioCtx.currentTime + 1.5);
        
        // Configure LFO (Slows down the metallic whir/buzz modulation rate)
        fmOsc.type = 'sine';
        fmOsc.frequency.setValueAtTime(45, audioCtx.currentTime);
        fmOsc.frequency.exponentialRampToValueAtTime(8, audioCtx.currentTime + 1.5);
        fmGain.gain.setValueAtTime(150, audioCtx.currentTime);
        
        // Configure Metallic Ring
        ringOsc.type = 'sine';
        ringOsc.frequency.setValueAtTime(2100, audioCtx.currentTime);
        ringOsc.frequency.exponentialRampToValueAtTime(1500, audioCtx.currentTime + 1.5);
        
        // Gain settings
        spinGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        spinGain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.1);
        spinGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
        
        ringGain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        ringGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
        
        // Connect nodes
        fmOsc.connect(fmGain);
        fmGain.connect(spinOsc.frequency);
        
        spinOsc.connect(spinGain);
        spinGain.connect(audioCtx.destination);
        
        ringOsc.connect(ringGain);
        ringGain.connect(audioCtx.destination);
        
        // Start oscillators
        fmOsc.start();
        spinOsc.start();
        ringOsc.start();
        
        fmOsc.stop(audioCtx.currentTime + 1.5);
        spinOsc.stop(audioCtx.currentTime + 1.5);
        ringOsc.stop(audioCtx.currentTime + 1.5);
      } else if (type === 'land') {
        // Metallic landing chime
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(1600, audioCtx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.15);
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(987.77, audioCtx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc1.start();
        osc2.start();
        osc1.stop(audioCtx.currentTime + 0.25);
        osc2.stop(audioCtx.currentTime + 0.25);
      }
    } catch (err) {
      console.warn("Web Audio failed to synthesize sound", err);
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
    const minSpins = 6;
    const additionalSpins = Math.floor(Math.random() * 3) + 1;
    const totalSpins = minSpins + additionalSpins;
    
    // Calculate final rotation
    let targetX = rotationRef.current.x + totalSpins * 360;
    if (finalOutcome === 'Tails') {
      const currentFullSpins = Math.floor(targetX / 360);
      targetX = currentFullSpins * 360 + 180 + (360 * additionalSpins);
    } else {
      const currentFullSpins = Math.floor(targetX / 360);
      targetX = currentFullSpins * 360 + 360 + (360 * additionalSpins);
    }
    
    const targetY = Math.floor(Math.random() * 30) - 15;
    const targetZ = Math.floor(Math.random() * 30) - 15;

    const finalRotation = { x: targetX, y: targetY, z: targetZ };
    setRotation(finalRotation);
    rotationRef.current = finalRotation;

    // Trigger state change after landing (1.6 seconds transition)
    setTimeout(() => {
      setIsFlipping(false);
      playSound('land');

      if (gameActive && userChoice) {
        if (userChoice === finalOutcome) {
          setMessage(`🎉 YOU WON THE FLIP! The coin landed on ${finalOutcome.toUpperCase()}.`);
          setMessageType('success');
        } else {
          setMessage(`😢 YOU LOST THE FLIP! The coin landed on ${finalOutcome.toUpperCase()}.`);
          setMessageType('error');
        }
      } else {
        setMessage(`Coin landed on: ${finalOutcome.toUpperCase()}`);
        setMessageType('info');
      }
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
    <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER CONTROLS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        {/* Themes Selectors */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Skin:</span>
          {(['gold', 'silver', 'neon', 'leather'] as const).map((t) => (
            <button
              key={t}
              onClick={() => !isFlipping && setCoinTheme(t)}
              style={{
                padding: '5px 12px',
                borderRadius: '5px',
                border: coinTheme === t ? '1.5px solid var(--primary)' : '1px solid rgba(255,255,255,0.06)',
                backgroundColor: coinTheme === t ? 'rgba(0, 255, 135, 0.08)' : 'rgba(5, 10, 24, 0.4)',
                color: coinTheme === t ? '#FFFFFF' : 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                cursor: 'none',
                transition: 'all 0.2s',
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
            fontSize: '1.2rem',
            cursor: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          className="interactive"
        >
          {isMuted ? '🔇 Muted' : '🔊 Audio ON'}
        </button>
      </div>

      {/* STAGE & PLAYGROUND */}
      <div
        className="glass-panel"
        style={{
          width: '100%',
          padding: '40px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Ambient spotlights behind coin */}
        <div
          style={{
            position: 'absolute',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${activeTheme.glow} 0%, transparent 70%)`,
            filter: 'blur(15px)',
            pointerEvents: 'none',
            transform: `scale(${isFlipping ? 1.4 : 1})`,
            transition: 'all 0.5s ease-out',
            opacity: 0.65,
          }}
        />

        {/* 3D Coin Viewer Arena */}
        <div
          style={{
            height: '300px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            width: '100%',
          }}
        >
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
                  transform: 'translateZ(5px)',
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
                      height: '10px',
                      width: '54px',
                      left: '73px',
                      top: '95px',
                      position: 'absolute',
                      borderTop: '1px solid rgba(255,255,255,0.15)',
                      borderBottom: '1px solid rgba(0,0,0,0.3)',
                      transform: `rotateY(${i * 30}deg) translateZ(99px) rotateX(90deg)`,
                      backfaceVisibility: 'visible',
                      transformStyle: 'preserve-3d',
                    }}
                  >
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
                  transform: 'rotateY(180deg) translateZ(5px)',
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

            {/* Coin Shadow */}
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
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '10px', zIndex: 10 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
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
        <div style={{ marginTop: '24px', width: '100%', maxWidth: '300px', zIndex: 10 }}>
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

      {/* GULLY CRICKET GROUND RULES MANAGER */}
      <div
        className="glass-panel"
        style={{
          width: '100%',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          textAlign: 'left',
          animation: 'tabTransition 0.5s ease-out',
        }}
      >
        <h3 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '4px' }}>
          🏏 GULLY MATCH RULES MANAGER
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>
          Local ground arguments start at rules. Select and lock rules below, then share with both teams!
        </p>

        {/* Rules Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.95rem' }}>
            <input
              type="checkbox"
              checked={groundRules.oneTipOneHand}
              onChange={(e) => setGroundRules({ ...groundRules, oneTipOneHand: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
            />
            <span>☝️ 1 Tip 1 Hand Out (One bounce catch is OUT)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.95rem' }}>
            <input
              type="checkbox"
              checked={groundRules.boxCricketMode}
              onChange={(e) => setGroundRules({ ...groundRules, boxCricketMode: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
            />
            <span>📦 Box cricket boundaries (No 6s allowed unless hit over/wall check)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.95rem' }}>
            <input
              type="checkbox"
              checked={groundRules.lostBallRuns}
              onChange={(e) => setGroundRules({ ...groundRules, lostBallRuns: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
            />
            <span>🥎 Lost ball = 5 Runs awarded to batting team</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.95rem' }}>
            <input
              type="checkbox"
              checked={groundRules.noBallFreeHit}
              onChange={(e) => setGroundRules({ ...groundRules, noBallFreeHit: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
            />
            <span>🚀 No ball = Free hit on next delivery</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.95rem' }}>
            <input
              type="checkbox"
              checked={groundRules.lastManBatting}
              onChange={(e) => setGroundRules({ ...groundRules, lastManBatting: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
            />
            <span>🧍 Last man batting (Last batsman bats alone till out)</span>
          </label>
        </div>

        {/* Custom Ground Rules list */}
        {customRules.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', marginBottom: '15px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Custom Ground Rules</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              {customRules.map((rule, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: '0.92rem' }}>✔ {rule}</span>
                  <button
                    type="button"
                    onClick={() => removeCustomRule(idx)}
                    style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Rule Input Form */}
        <form onSubmit={addCustomRule} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <input
            type="text"
            value={newCustomRule}
            onChange={(e) => setNewCustomRule(e.target.value)}
            placeholder="Add custom rule (e.g. Lost ball in drain is OUT)..."
            className="premium-input"
            style={{ flex: 1, marginTop: 0, padding: '8px 12px' }}
          />
          <button
            type="submit"
            style={{
              padding: '0 15px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--primary)',
              color: '#050A18',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
            className="interactive"
          >
            Add Rule
          </button>
        </form>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={saveRules}
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
            💾 Save Ground Rules
          </button>

          <button
            onClick={shareRules}
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
            💬 WhatsApp Rules Checklist
          </button>
        </div>
      </div>
    </div>
  );
}
