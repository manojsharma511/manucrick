import { useState, useEffect } from 'react';

export function TossArena() {
  const [isFlipping, setIsFlipping] = useState(false);
  const [coinTheme, setCoinTheme] = useState<'gold' | 'silver' | 'neon' | 'leather'>('gold');
  const [userChoice, setUserChoice] = useState<'Heads' | 'Tails' | null>(null);
  const [gameActive, setGameActive] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info' | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [flipClass, setFlipClass] = useState('');
  const [shadowClass, setShadowClass] = useState('');
  const [lastOutcome, setLastOutcome] = useState<'Heads' | 'Tails'>('Heads');
  const [transitionEnabled, setTransitionEnabled] = useState(true);

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

  // Mobile viewport tracking
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 480);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        const spinOsc = audioCtx.createOscillator();
        const spinGain = audioCtx.createGain();
        
        const fmOsc = audioCtx.createOscillator();
        const fmGain = audioCtx.createGain();
        
        const ringOsc = audioCtx.createOscillator();
        const ringGain = audioCtx.createGain();
        
        spinOsc.type = 'sine';
        spinOsc.frequency.setValueAtTime(950, audioCtx.currentTime);
        spinOsc.frequency.exponentialRampToValueAtTime(650, audioCtx.currentTime + 1.5);
        
        fmOsc.type = 'sine';
        fmOsc.frequency.setValueAtTime(45, audioCtx.currentTime);
        fmOsc.frequency.exponentialRampToValueAtTime(8, audioCtx.currentTime + 1.5);
        fmGain.gain.setValueAtTime(150, audioCtx.currentTime);
        
        ringOsc.type = 'sine';
        ringOsc.frequency.setValueAtTime(2100, audioCtx.currentTime);
        ringOsc.frequency.exponentialRampToValueAtTime(1500, audioCtx.currentTime + 1.5);
        
        spinGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        spinGain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.1);
        spinGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
        
        ringGain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        ringGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
        
        fmOsc.connect(fmGain);
        fmGain.connect(spinOsc.frequency);
        
        spinOsc.connect(spinGain);
        spinGain.connect(audioCtx.destination);
        
        ringOsc.connect(ringGain);
        ringGain.connect(audioCtx.destination);
        
        fmOsc.start();
        spinOsc.start();
        ringOsc.start();
        
        fmOsc.stop(audioCtx.currentTime + 1.5);
        spinOsc.stop(audioCtx.currentTime + 1.5);
        ringOsc.stop(audioCtx.currentTime + 1.5);
      } else if (type === 'land') {
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

  // Main Coin Flip execution using CSS Keyframe state trigger
  const flipCoin = () => {
    if (isFlipping) return;
    
    setIsFlipping(true);
    setTransitionEnabled(true);
    setMessage(null);
    setMessageType(null);
    setFlipClass('');
    setShadowClass('');
    playSound('flip');

    const isHeads = Math.random() < 0.5;
    const finalOutcome = isHeads ? 'Heads' : 'Tails';
    setLastOutcome(finalOutcome);

    // Trigger state repaint then apply CSS animation classes
    setTimeout(() => {
      setFlipClass(isHeads ? 'toss-coin-animate-heads' : 'toss-coin-animate-tails');
      setShadowClass('toss-shadow-animate');
    }, 15);

    setTimeout(() => {
      // Temporarily disable transition to snap coin flat instantly without backwards spin
      setTransitionEnabled(false);
      setFlipClass('');
      setShadowClass('');
      setIsFlipping(false);
      playSound('land');

      if (gameActive && userChoice) {
        if (userChoice === finalOutcome) {
          setMessage(`🎉 YOU WON THE FLIP! Coin landed on ${finalOutcome.toUpperCase()}.`);
          setMessageType('success');
        } else {
          setMessage(`😢 YOU LOST THE FLIP! Coin landed on ${finalOutcome.toUpperCase()}.`);
          setMessageType('error');
        }
      } else {
        setMessage(`Coin landed on: ${finalOutcome.toUpperCase()}`);
        setMessageType('info');
      }

      // Re-enable transition after snap is complete
      setTimeout(() => {
        setTransitionEnabled(true);
      }, 50);
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

  // Theme settings
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
          frontBg: 'linear-gradient(135deg, #00FF87 0%, #60EFFF 100%)',
          backBg: 'linear-gradient(135deg, #00FF87 0%, #60EFFF 100%)',
          borderColor: '#00FF87',
          textColor: '#050A18',
          glow: 'rgba(0, 255, 135, 0.45)',
          rimColor: 'radial-gradient(circle, #00FF87 0%, #60EFFF 100%)',
          textColorInner: '#00D16E',
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

  const getRimGradient = () => {
    switch (coinTheme) {
      case 'silver':
        return 'repeating-linear-gradient(90deg, #BDC3C7, #BDC3C7 3px, #7F8C8D 3px, #7F8C8D 6px)';
      case 'neon':
        return 'repeating-linear-gradient(90deg, #00FF87, #00FF87 3px, #60EFFF 3px, #60EFFF 6px)';
      case 'leather':
        return 'repeating-linear-gradient(90deg, #C2410C, #C2410C 3px, #F97316 3px, #F97316 6px)';
      case 'gold':
      default:
        return 'repeating-linear-gradient(90deg, #FFE066, #FFE066 3px, #D35400 3px, #D35400 6px)';
    }
  };

  const activeTheme = getThemeStyle();

  return (
    <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: isMobile ? '120px' : '40px' }}>
      
      {/* HEADER CONTROLS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', width: '100%', padding: '0 4px' }}>
        {/* Themes Selectors */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Skin:</span>
          {(['gold', 'silver', 'neon', 'leather'] as const).map((t) => (
            <button
              key={t}
              onClick={() => !isFlipping && setCoinTheme(t)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: coinTheme === t ? '1.5px solid var(--primary)' : '1px solid rgba(255,255,255,0.06)',
                backgroundColor: coinTheme === t ? 'rgba(245, 158, 11, 0.15)' : 'rgba(5, 10, 24, 0.4)',
                color: coinTheme === t ? '#FFFFFF' : 'var(--text-secondary)',
                fontSize: '0.74rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                cursor: 'pointer',
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
            fontSize: '0.8rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          className="interactive"
        >
          {isMuted ? '🔇 Muted' : '🔊 Sound ON'}
        </button>
      </div>

      {/* STAGE & PLAYGROUND */}
      <div
        className="glass-panel"
        style={{
          width: '100%',
          padding: isMobile ? '25px 16px' : '40px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          border: '1px solid rgba(245, 158, 11, 0.15)',
          boxShadow: '0 8px 32px 0 rgba(245, 158, 11, 0.08)',
        }}
      >
        {/* Ambient spotlights behind coin */}
        <div
          style={{
            position: 'absolute',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${activeTheme.glow} 0%, transparent 70%)`,
            filter: 'blur(20px)',
            pointerEvents: 'none',
            transform: `scale(${isFlipping ? 1.5 : 1})`,
            transition: 'all 0.5s ease-out',
            opacity: 0.7,
          }}
        />

        {/* 3D Coin Viewer Arena */}
        <div
          style={{
            height: isMobile ? '220px' : '280px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            width: '100%',
          }}
        >
          {/* 3D Coin Wrapper Container */}
          <div 
            className="coin-container" 
            style={{ 
              width: isMobile ? '180px' : '220px',
              height: isMobile ? '180px' : '220px',
              transform: `scale(${isFlipping ? 1.05 : 1})`, 
              transition: 'transform 1.6s cubic-bezier(0.1, 0.8, 0.1, 1)' 
            }}
          >
            {/* Actual Coin Rotating */}
            <div
              className={`coin-3d ${flipClass}`}
              style={{
                transform: !flipClass ? (lastOutcome === 'Heads' ? 'rotateX(0deg) rotateY(0deg) rotateZ(0deg)' : 'rotateX(180deg) rotateY(0deg) rotateZ(180deg)') : undefined,
                transition: !transitionEnabled ? 'none' : 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
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
                  backfaceVisibility: 'hidden',
                }}
              >
                <div className="coin-shine" />
                
                {/* Styled Outer Emblem Ring */}
                <div style={{ position: 'absolute', top: '10px', bottom: '10px', left: '10px', right: '10px', borderRadius: '50%', border: `2px dashed ${activeTheme.textColorInner}`, opacity: 0.5 }} />
                
                {/* Inside Contents */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                  <span style={{ fontSize: isMobile ? '3rem' : '3.8rem', filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.3))', userSelect: 'none' }}>
                    {coinTheme === 'leather' ? '🏏' : '🏆'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-headings)', fontSize: isMobile ? '1.2rem' : '1.4rem', fontWeight: 800, letterSpacing: '2px', marginTop: '2px' }}>HEADS</span>
                </div>
              </div>

              {/* CYLINDRICAL RIM SEGMENTS (CSS Stacked Layering) */}
              {Array.from({ length: 10 }).map((_, idx) => {
                const zOffset = -4.5 + idx * 1.0; // Stack from -4.5px to 4.5px
                return (
                  <div
                    key={idx}
                    className="coin-edge-layer"
                    style={{
                      background: getRimGradient(),
                      border: `3px solid ${activeTheme.borderColor}`,
                      boxShadow: 'inset 0 0 15px rgba(0, 0, 0, 0.6)',
                      transform: `translateZ(${zOffset}px)`,
                    }}
                  />
                );
              })}

              {/* TAILS SIDE (Back Face) */}
              <div
                className="coin-face back"
                style={{
                  background: activeTheme.backBg,
                  borderColor: activeTheme.borderColor,
                  color: activeTheme.textColor,
                  boxShadow: `inset 0 0 25px rgba(0, 0, 0, 0.35), 0 0 15px ${activeTheme.glow}`,
                  transform: 'rotateY(180deg) translateZ(5px)',
                  backfaceVisibility: 'hidden',
                }}
              >
                <div className="coin-shine" />
                
                {/* Outer Emblem Ring */}
                <div style={{ position: 'absolute', top: '10px', bottom: '10px', left: '10px', right: '10px', borderRadius: '50%', border: `2px dashed ${activeTheme.textColorInner}`, opacity: 0.5 }} />
                
                {/* Inside Contents */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                  <span style={{ fontSize: isMobile ? '3rem' : '3.8rem', filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.3))', userSelect: 'none' }}>
                    {coinTheme === 'leather' ? '🥎' : '🥎'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-headings)', fontSize: isMobile ? '1.2rem' : '1.4rem', fontWeight: 800, letterSpacing: '2px', marginTop: '2px' }}>TAILS</span>
                </div>
              </div>

            </div>

            {/* Coin Shadow */}
            <div
              className={`coin-shadow-3d ${shadowClass}`}
              style={{
                width: '80%',
                left: '10%',
                transform: `scale(${isFlipping ? 0.5 : 1})`,
                opacity: isFlipping ? 0.2 : 0.6,
                transition: 'transform 1.6s cubic-bezier(0.1, 0.8, 0.1, 1), opacity 1.6s cubic-bezier(0.1, 0.8, 0.1, 1)',
              }}
            />
          </div>
        </div>

        {/* CALL THE TOSS PICKER */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '10px', zIndex: 10 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            Select your Call (Optional)
          </p>
          
          <div style={{ display: 'flex', gap: '15px', width: '100%', maxWidth: '300px' }}>
            <button
              onClick={() => selectChoice('Heads')}
              disabled={isFlipping}
              style={{
                flex: 1,
                padding: '12px 0',
                borderRadius: '10px',
                border: userChoice === 'Heads' ? '1.5px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
                backgroundColor: userChoice === 'Heads' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.01)',
                color: userChoice === 'Heads' ? 'var(--primary)' : '#FFFFFF',
                fontFamily: 'var(--font-headings)',
                fontSize: '1.1rem',
                fontWeight: 700,
                letterSpacing: '1px',
                cursor: 'pointer',
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
                padding: '12px 0',
                borderRadius: '10px',
                border: userChoice === 'Tails' ? '1.5px solid var(--secondary)' : '1px solid rgba(255,255,255,0.08)',
                backgroundColor: userChoice === 'Tails' ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.01)',
                color: userChoice === 'Tails' ? 'var(--secondary)' : '#FFFFFF',
                fontFamily: 'var(--font-headings)',
                fontSize: '1.1rem',
                fontWeight: 700,
                letterSpacing: '1px',
                cursor: 'pointer',
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
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginTop: '4px',
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
              padding: '15px 0',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: isFlipping ? 'rgba(255, 255, 255, 0.05)' : 'var(--primary)',
              color: isFlipping ? 'var(--text-secondary)' : '#0A0A0A',
              fontFamily: 'var(--font-headings)',
              fontSize: '1.3rem',
              fontWeight: 800,
              letterSpacing: '2.5px',
              cursor: isFlipping ? 'not-allowed' : 'pointer',
              boxShadow: isFlipping ? 'none' : '0 4px 20px rgba(245, 158, 11, 0.35)',
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
              padding: '14px 24px',
              borderRadius: '10px',
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
                  : 'rgba(255, 255, 255, 0.1)'
              }`,
              color: messageType === 'success' ? 'var(--primary)' : messageType === 'error' ? '#FF4D4D' : '#FFFFFF',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: '1rem',
              letterSpacing: '0.8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
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
          border: '1px solid rgba(245, 158, 11, 0.15)',
          boxShadow: '0 8px 32px 0 rgba(245, 158, 11, 0.08)',
        }}
      >
        <h3 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '4px', fontWeight: 800 }}>
          🏏 GULLY MATCH RULES MANAGER
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Local ground arguments start at rules. Select and lock rules below, then share with both teams!
        </p>

        {/* Rules Checklist Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
          gap: '12px', 
          width: '100%', 
          marginBottom: '20px' 
        }}>
          {[
            { key: 'oneTipOneHand', emoji: '☝️', label: '1 Tip 1 Hand Out', desc: 'One bounce catches are OUT' },
            { key: 'boxCricketMode', emoji: '📦', label: 'Box Cricket Boundaries', desc: 'No standard 6s, hit over is OUT' },
            { key: 'lostBallRuns', emoji: '🥎', label: 'Lost Ball Penalty', desc: '+5 Runs awarded to batting team' },
            { key: 'noBallFreeHit', emoji: '🚀', label: 'Free Hit Rule', desc: 'No balls earn a free hit delivery' },
            { key: 'lastManBatting', emoji: '🧍', label: 'Last Man Standing', desc: 'Last batsman bats alone till out' }
          ].map((rule) => {
            const isChecked = groundRules[rule.key as keyof typeof groundRules];
            return (
              <div
                key={rule.key}
                onClick={() => !isFlipping && setGroundRules({ ...groundRules, [rule.key]: !isChecked })}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  backgroundColor: isChecked ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                  border: isChecked ? '1.5px solid var(--primary)' : '1.5px solid rgba(255, 255, 255, 0.05)',
                  boxShadow: isChecked ? '0 0 12px rgba(245, 158, 11, 0.12)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  textAlign: 'left',
                  transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
                }}
                className="interactive rule-card-toggle"
              >
                <span style={{ fontSize: '1.8rem' }}>{rule.emoji}</span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 'bold', color: isChecked ? 'var(--primary)' : '#FFF' }}>
                    {rule.label}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    {rule.desc}
                  </span>
                </div>
                {/* Switch checkbox box */}
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  border: '1.5px solid',
                  borderColor: isChecked ? 'var(--primary)' : 'rgba(255,255,255,0.2)',
                  backgroundColor: isChecked ? 'var(--primary)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}>
                  {isChecked && <span style={{ fontSize: '12px', color: '#0A0A0A', fontWeight: 'bold' }}>✔</span>}
                </div>
              </div>
            );
          })}
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
                    style={{ background: 'none', border: 'none', color: '#FF4D4D', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Rule Input Form */}
        <form onSubmit={addCustomRule} style={{ display: 'flex', gap: '10px', marginBottom: '20px', width: '100%', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={newCustomRule}
            onChange={(e) => setNewCustomRule(e.target.value)}
            placeholder="Add custom rule (e.g. Lost ball in drain)..."
            className="premium-input"
            style={{ flex: 1, minWidth: '200px', marginTop: 0, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.3)', color: '#FFF' }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--primary)',
              color: '#0A0A0A',
              fontWeight: 'bold',
              cursor: 'pointer',
              flexShrink: 0,
              flex: '0 0 auto'
            }}
            className="interactive"
          >
            Add Rule
          </button>
        </form>

        {/* Action buttons */}
        <div className="responsive-flex-row" style={{ display: 'flex', gap: '12px', width: '100%', flexWrap: 'wrap' }}>
          <button
            onClick={saveRules}
            style={{
              flex: 1,
              minWidth: '150px',
              padding: '12px 0',
              borderRadius: '8px',
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
              minWidth: '180px',
              padding: '12px 0',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--primary)',
              color: '#0A0A0A',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(245, 158, 11, 0.2)',
            }}
            className="interactive"
          >
            💬 WhatsApp Rules Checklist
          </button>
        </div>
      </div>

      <style>{`
        @keyframes toss-flip-heads {
          0% { 
            transform: translateY(0) rotateX(0deg) scale(1); 
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));
          }
          15% { 
            transform: translateY(-150px) rotateX(360deg) scale(1.1); 
          }
          45% { 
            transform: translateY(-280px) rotateX(1080deg) scale(1.2); 
            filter: drop-shadow(0 25px 15px rgba(0,0,0,0.6));
          }
          75% { 
            transform: translateY(-80px) rotateX(1800deg) scale(1.05); 
          }
          90% { 
            transform: translateY(0) rotateX(2160deg) scale(1); 
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));
          }
          95% { 
            transform: translateY(-12px) rotateX(2175deg) scale(1.02); 
          }
          100% { 
            transform: translateY(0) rotateX(2160deg) scale(1); 
          }
        }

        @keyframes toss-flip-tails {
          0% { 
            transform: translateY(0) rotateX(0deg) scale(1); 
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));
          }
          15% { 
            transform: translateY(-150px) rotateX(360deg) scale(1.1); 
          }
          45% { 
            transform: translateY(-280px) rotateX(1080deg) scale(1.2); 
            filter: drop-shadow(0 25px 15px rgba(0,0,0,0.6));
          }
          75% { 
            transform: translateY(-80px) rotateX(1800deg) scale(1.05); 
          }
          90% { 
            transform: translateY(0) rotateX(2340deg) scale(1); 
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));
          }
          95% { 
            transform: translateY(-12px) rotateX(2325deg) scale(1.02); 
          }
          100% { 
            transform: translateY(0) rotateX(2340deg) scale(1); 
          }
        }

        @keyframes toss-flip-heads-mobile {
          0% { 
            transform: translateY(0) rotateX(0deg) scale(1); 
            filter: drop-shadow(0 3px 5px rgba(0,0,0,0.4));
          }
          15% { 
            transform: translateY(-70px) rotateX(360deg) scale(1.05); 
          }
          45% { 
            transform: translateY(-130px) rotateX(1080deg) scale(1.15); 
            filter: drop-shadow(0 15px 10px rgba(0,0,0,0.5));
          }
          75% { 
            transform: translateY(-40px) rotateX(1800deg) scale(1.02); 
          }
          90% { 
            transform: translateY(0) rotateX(2160deg) scale(1); 
            filter: drop-shadow(0 3px 5px rgba(0,0,0,0.4));
          }
          95% { 
            transform: translateY(-6px) rotateX(2170deg) scale(1.01); 
          }
          100% { 
            transform: translateY(0) rotateX(2160deg) scale(1); 
          }
        }

        @keyframes toss-flip-tails-mobile {
          0% { 
            transform: translateY(0) rotateX(0deg) scale(1); 
            filter: drop-shadow(0 3px 5px rgba(0,0,0,0.4));
          }
          15% { 
            transform: translateY(-70px) rotateX(360deg) scale(1.05); 
          }
          45% { 
            transform: translateY(-130px) rotateX(1080deg) scale(1.15); 
            filter: drop-shadow(0 15px 10px rgba(0,0,0,0.5));
          }
          75% { 
            transform: translateY(-40px) rotateX(1800deg) scale(1.02); 
          }
          90% { 
            transform: translateY(0) rotateX(2340deg) scale(1); 
            filter: drop-shadow(0 3px 5px rgba(0,0,0,0.4));
          }
          95% { 
            transform: translateY(-6px) rotateX(2330deg) scale(1.01); 
          }
          100% { 
            transform: translateY(0) rotateX(2340deg) scale(1); 
          }
        }

        @keyframes toss-shadow-scale {
          0% { transform: scale(1); opacity: 0.6; filter: blur(2px); }
          15% { transform: scale(0.75); opacity: 0.4; filter: blur(4px); }
          45% { transform: scale(0.4); opacity: 0.15; filter: blur(8px); }
          75% { transform: scale(0.8); opacity: 0.45; filter: blur(4px); }
          90% { transform: scale(1); opacity: 0.6; filter: blur(2px); }
          95% { transform: scale(0.95); opacity: 0.55; filter: blur(2px); }
          100% { transform: scale(1); opacity: 0.6; filter: blur(2px); }
        }

        .toss-coin-animate-heads {
          animation: toss-flip-heads 1.6s cubic-bezier(0.2, 0.85, 0.3, 1) forwards !important;
        }

        .toss-coin-animate-tails {
          animation: toss-flip-tails 1.6s cubic-bezier(0.2, 0.85, 0.3, 1) forwards !important;
        }

        .toss-shadow-animate {
          animation: toss-shadow-scale 1.6s cubic-bezier(0.2, 0.85, 0.3, 1) forwards !important;
        }

        /* Responsive keyframes injection for mobile */
        @media (max-width: 480px) {
          .toss-coin-animate-heads {
            animation: toss-flip-heads-mobile 1.6s cubic-bezier(0.2, 0.85, 0.3, 1) forwards !important;
          }

          .toss-coin-animate-tails {
            animation: toss-flip-tails-mobile 1.6s cubic-bezier(0.2, 0.85, 0.3, 1) forwards !important;
          }
        }

        .rule-card-toggle:hover {
          border-color: var(--primary) !important;
          background-color: rgba(245, 158, 11, 0.04) !important;
        }
      `}</style>
    </div>
  );
}
