import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

// Simplified synthesizer for net practice
class PracticeAudio {
  private ctx: AudioContext | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playImpact(isPerfect: boolean) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isPerfect ? 180 : 130, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.08);
  }

  playWicket() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.15);
  }

  playFootstep() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.05);
    gain.gain.setValueAtTime(0.04, now);
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

export function PracticeNets() {
  const [deliveryType, setDeliveryType] = useState<'fast' | 'swing' | 'bouncer' | 'spin'>('fast');
  const [timingFeedback, setTimingFeedback] = useState<string>('PRESS SPACEBAR OR CLICK TO STRIKE!');
  const [feedbackColor, setFeedbackColor] = useState<string>('var(--text-secondary)');
  const [offsetMs, setOffsetMs] = useState<number | null>(null);
  const [ballActive, setBallActive] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<PracticeAudio>(new PracticeAudio());
  const requestRef = useRef<number>(0);

  // Canvas positions
  const bowlerXRef = useRef(240);
  const bowlerYRef = useRef(60);
  const bowlerArmRef = useRef(0);
  const bowlerStateRef = useRef<'runin' | 'release' | 'follow'>('runin');
  
  const batsmanSwingRef = useRef(0);
  const batsmanSwingAngleRef = useRef(0);

  const ballXRef = useRef(-100);
  const ballYRef = useRef(-100);
  const ballProgressRef = useRef(0);
  const ballHeightRef = useRef(70);

  // Frame-rate independent refs
  const ballStartTimeRef = useRef(0);
  const ballDurationRef = useRef(1000);
  const ballTrailRef = useRef<{ x: number; y: number }[]>([]);
  const isBallHitRef = useRef(false);
  const autoNextBallTimeoutRef = useRef<any>(null);

  // Stump objects
  const stumpsRef = useRef<{ x: number; y: number; angle: number; vx: number; vy: number }[]>([]);

  useEffect(() => {
    resetStumps();
    startNewBall();
  }, [deliveryType]);

  useEffect(() => {
    return () => {
      if (autoNextBallTimeoutRef.current) {
        clearTimeout(autoNextBallTimeoutRef.current);
      }
    };
  }, []);

  const resetStumps = () => {
    stumpsRef.current = [
      { x: 232, y: 535, angle: 0, vx: 0, vy: 0 },
      { x: 240, y: 535, angle: 0, vx: 0, vy: 0 },
      { x: 248, y: 535, angle: 0, vx: 0, vy: 0 },
    ];
  };

  const startNewBall = () => {
    if (autoNextBallTimeoutRef.current) {
      clearTimeout(autoNextBallTimeoutRef.current);
      autoNextBallTimeoutRef.current = null;
    }
    audioRef.current.init();
    setBallActive(false);
    isBallHitRef.current = false;
    ballProgressRef.current = 0;
    ballTrailRef.current = [];

    // Reset bowler
    bowlerXRef.current = 240;
    bowlerYRef.current = 60;
    bowlerStateRef.current = 'runin';
    bowlerArmRef.current = 0;

    // Reset batsman
    batsmanSwingRef.current = 0;
    batsmanSwingAngleRef.current = 0;

    resetStumps();

    // Setup duration based on delivery type
    if (deliveryType === 'fast') {
      ballDurationRef.current = 750;
      ballHeightRef.current = 45;
    } else if (deliveryType === 'swing') {
      ballDurationRef.current = 1050;
      ballHeightRef.current = 65;
    } else if (deliveryType === 'bouncer') {
      ballDurationRef.current = 900;
      ballHeightRef.current = 130;
    } else {
      ballDurationRef.current = 1300;
      ballHeightRef.current = 85;
    }

    // Play footstep sounds
    let step = 0;
    const footInterval = setInterval(() => {
      if (bowlerStateRef.current === 'runin') {
        audioRef.current.playFootstep();
        step++;
        if (step >= 5) clearInterval(footInterval);
      } else {
        clearInterval(footInterval);
      }
    }, 180);
  };

  const handleStrike = () => {
    if (batsmanSwingRef.current !== 0 || bowlerStateRef.current !== 'follow' || isBallHitRef.current) return;

    // Trigger batsman swing
    batsmanSwingRef.current = 1;

    // Calculate timing offset
    const elapsed = performance.now() - ballStartTimeRef.current;
    const prog = elapsed / ballDurationRef.current;
    const target = 0.86; // Sweet spot
    
    const diffProg = prog - target;
    const diffMs = Math.round(diffProg * ballDurationRef.current);

    setOffsetMs(diffMs);

    // Apply Bat timing scale modifier
    const selectedBatId = localStorage.getItem('manucrick_selected_bat') || 'kashmir';
    let timingTolerance = 38; // ms perfect window
    let goodTolerance = 95;  // ms good window
    if (selectedBatId === 'cyber') {
      timingTolerance = 44;
      goodTolerance = 110;
    } else if (selectedBatId === 'helicopter') {
      timingTolerance = 52;
      goodTolerance = 130;
    }

    if (Math.abs(diffMs) <= timingTolerance) {
      setTimingFeedback(`PERFECT SHOT! Offset: ${diffMs}ms (Sweet Spot) ⚡`);
      setFeedbackColor('var(--primary)');
      audioRef.current.playImpact(true);
      
      const perfectPhrases = [
        "What a shot! Timed to perfection!",
        "Magnificent timing! Right in the sweet spot!",
        "Beautifully played! Brilliant connection!",
        "That is clean! Absolute beauty of a shot!"
      ];
      audioRef.current.speakCommentary(perfectPhrases[Math.floor(Math.random() * perfectPhrases.length)]);
      
      // Hit ball away
      isBallHitRef.current = true;
      animateHit(240, -100);
    } else if (Math.abs(diffMs) <= goodTolerance) {
      setTimingFeedback(`GOOD CONTACT! Offset: ${diffMs > 0 ? '+' : ''}${diffMs}ms 🏏`);
      setFeedbackColor('var(--accent)');
      audioRef.current.playImpact(false);
      
      const goodPhrases = [
        "Well played! Good connection there.",
        "Good shot! Nicely pushed into the gap!",
        "Decent contact! Safe shot."
      ];
      audioRef.current.speakCommentary(goodPhrases[Math.floor(Math.random() * goodPhrases.length)]);
      
      isBallHitRef.current = true;
      animateHit(240, 60);
    } else if (diffMs < -goodTolerance) {
      setTimingFeedback(`TOO EARLY! Offset: ${diffMs}ms (Swing Missed) 💨`);
      setFeedbackColor('#9CA3AF');
      
      audioRef.current.speakCommentary("Too early on that swing!");
    } else {
      setTimingFeedback(`TOO LATE! Stumps hit! Offset: +${diffMs}ms 🛑`);
      setFeedbackColor('#FF3B30');
    }
  };

  const animateHit = (targetX: number, targetY: number) => {
    let t = 0;
    const startX = ballXRef.current;
    const startY = ballYRef.current;

    const hitLoop = () => {
      t += 0.04;
      if (t <= 1) {
        ballXRef.current = startX + (targetX - startX) * t;
        ballYRef.current = startY + (targetY - startY) * t - Math.sin(t * Math.PI) * 100;
        
        ballTrailRef.current.push({ x: ballXRef.current, y: ballYRef.current });
        if (ballTrailRef.current.length > 5) ballTrailRef.current.shift();
        
        requestAnimationFrame(hitLoop);
      } else {
        setBallActive(false);
        autoNextBallTimeoutRef.current = setTimeout(() => {
          startNewBall();
        }, 2000);
      }
    };
    hitLoop();
  };

  // Main Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawNets = () => {
      // Background Sky
      ctx.fillStyle = '#060B1C';
      ctx.fillRect(0, 0, 480, 600);

      // Perspective pitch (vertical)
      ctx.fillStyle = '#0F2618';
      ctx.beginPath();
      ctx.moveTo(170, 60);
      ctx.lineTo(310, 60);
      ctx.lineTo(410, 580);
      ctx.lineTo(70, 580);
      ctx.fill();

      // Side nets lines
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 600; i += 20) {
        ctx.beginPath();
        ctx.moveTo(10, i);
        ctx.lineTo(470, i);
        ctx.stroke();
      }

      // Draw Bowler
      const bx = bowlerXRef.current;
      const by = bowlerYRef.current;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(bx, by - 35, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bx, by - 30);
      ctx.lineTo(bx, by - 10);
      ctx.stroke();

      // Arms
      const armAngle = bowlerArmRef.current;
      ctx.beginPath();
      ctx.moveTo(bx, by - 25);
      ctx.lineTo(bx + Math.cos(armAngle) * 14, by - 25 + Math.sin(armAngle) * 14);
      ctx.stroke();

      // Draw Batsman Stance
      const tx = 240;
      const ty = 520;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(tx, ty - 35, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(tx, ty - 30);
      ctx.lineTo(tx, ty - 10);
      ctx.stroke();

      // Swing Bat (rendered based on Legends selection)
      ctx.save();
      ctx.translate(tx - 8, ty - 20);
      ctx.rotate(batsmanSwingAngleRef.current);
      
      const selectedBatId = localStorage.getItem('manucrick_selected_bat') || 'kashmir';
      if (selectedBatId === 'helicopter') {
        ctx.strokeStyle = '#FFD700'; // Gold grip
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-6, -4);
        ctx.stroke();

        ctx.strokeStyle = '#FF3B30'; // Red bat
        ctx.lineWidth = 5.2;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(-6, -4);
        ctx.lineTo(-24, -16);
        ctx.stroke();
      } else if (selectedBatId === 'cyber') {
        ctx.strokeStyle = '#F59E0B'; // Gold grip
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-6, -4);
        ctx.stroke();

        ctx.strokeStyle = '#111111'; // Black body
        ctx.lineWidth = 4.5;
        ctx.shadowColor = '#00E5FF';
        ctx.shadowBlur = 7;
        ctx.beginPath();
        ctx.moveTo(-6, -4);
        ctx.lineTo(-24, -16);
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#DEB887';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-24, -16);
        ctx.stroke();
      }
      ctx.restore();

      // Draw Stumps
      stumpsRef.current.forEach((stump) => {
        ctx.save();
        ctx.translate(stump.x, stump.y);
        ctx.rotate(stump.angle);
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(-2, -40, 4, 40);
        ctx.restore();
      });

      // Draw Ball & Tracer Trail
      if (ballActive) {
        // Draw Trail
        if (ballTrailRef.current.length > 1) {
          for (let i = 0; i < ballTrailRef.current.length - 1; i++) {
            const p1 = ballTrailRef.current[i];
            const p2 = ballTrailRef.current[i + 1];
            ctx.save();
            ctx.strokeStyle = '#CCFF00';
            ctx.lineWidth = (i + 1) * 1.3;
            ctx.globalAlpha = (i + 1) / ballTrailRef.current.length * 0.35;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.restore();
          }
        }

        // Draw main ball (neon yellow-lime, size 11)
        ctx.save();
        ctx.fillStyle = '#CCFF00';
        ctx.shadowColor = '#F59E0B';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(ballXRef.current, ballYRef.current, 11, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ballXRef.current - 3, ballYRef.current - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Translucent Swing Fan in nets
      if (batsmanSwingRef.current > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(tx - 8, ty - 20);
        ctx.arc(tx - 8, ty - 20, 46, -Math.PI * 0.75, -Math.PI * 0.25);
        ctx.lineTo(tx - 8, ty - 20);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    };

    const update = () => {
      // Bowler movement
      if (bowlerStateRef.current === 'runin') {
        bowlerYRef.current += 1.5;
        bowlerArmRef.current -= 0.15;
        if (bowlerYRef.current >= 150) {
          bowlerStateRef.current = 'release';
        }
      } else if (bowlerStateRef.current === 'release') {
        bowlerArmRef.current -= 0.35;
        if (bowlerArmRef.current <= -Math.PI) {
          bowlerStateRef.current = 'follow';
          // Release ball
          setBallActive(true);
          ballXRef.current = 240;
          ballYRef.current = 150;
          ballProgressRef.current = 0;
          ballStartTimeRef.current = performance.now();
          ballTrailRef.current = [];
        }
      }

      // Ball progress (only if not hit yet)
      if (ballActive && bowlerStateRef.current === 'follow' && !isBallHitRef.current) {
        const elapsed = performance.now() - ballStartTimeRef.current;
        const prog = elapsed / ballDurationRef.current;
        ballProgressRef.current = prog;

        if (prog <= 1) {
          const startX = 240;
          const targetX = 240;
          const startY = 150;
          const targetY = 520;

          let bx = startX + (targetX - startX) * prog;
          let by = (startY + (targetY - startY) * prog) - Math.sin(prog * Math.PI) * (ballHeightRef.current * 0.4);

          // Spin type curves
          if (deliveryType === 'spin' && prog > 0.5) {
            bx += Math.sin((prog - 0.5) * Math.PI) * 45;
          }
          if (deliveryType === 'swing' && prog > 0.4) {
            bx -= (prog - 0.4) * 20;
          }

          ballXRef.current = bx;
          ballYRef.current = by;

          ballTrailRef.current.push({ x: bx, y: by });
          if (ballTrailRef.current.length > 5) ballTrailRef.current.shift();
        } else {
          // Ball hit stumps! Wicket
          setBallActive(false);
          audioRef.current.playWicket();
          
          // Shatter stumps
          stumpsRef.current.forEach((stump) => {
            stump.angle = (Math.random() - 0.5) * 0.5;
            stump.vx = (Math.random() - 0.5) * 8;
            stump.vy = -3 - Math.random() * 3;
          });
          
          setTimingFeedback('STUMPS SHATTERED! Too late on connection 🛑');
          setFeedbackColor('#FF3B30');
          setOffsetMs(null);
          
          audioRef.current.speakCommentary("Bowled him! Stumps shattered!");
          
          autoNextBallTimeoutRef.current = setTimeout(() => {
            startNewBall();
          }, 2000);
        }
      }

      // Stumps physics (if shattered)
      stumpsRef.current.forEach((stump) => {
        if (stump.vx !== 0 || stump.vy !== 0) {
          stump.x += stump.vx;
          stump.y += stump.vy;
          stump.vy += 0.2;
          if (stump.y >= 545) {
            stump.y = 545;
            stump.vx = 0;
            stump.vy = 0;
          }
        }
      });

      // Batsman swing
      if (batsmanSwingRef.current === 1) {
        batsmanSwingAngleRef.current -= 0.28;
        if (batsmanSwingAngleRef.current <= -Math.PI * 0.7) {
          batsmanSwingRef.current = 2;
        }
      } else if (batsmanSwingRef.current === 2) {
        batsmanSwingAngleRef.current += 0.08;
        if (batsmanSwingAngleRef.current >= 0) {
          batsmanSwingAngleRef.current = 0;
          batsmanSwingRef.current = 0;
        }
      }
    };

    const loop = () => {
      update();
      drawNets();
      requestRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, [ballActive, deliveryType]);

  const handleKeyStrike = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      handleStrike();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
        borderRadius: '20px',
        overflow: 'hidden',
        backgroundColor: '#0a0a0a',
        border: '1px solid rgba(245, 158, 11, 0.15)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
        position: 'relative',
      }}
      className="practice-nets-arena-wrapper"
      tabIndex={0}
      onKeyDown={handleKeyStrike}
    >
        {/* HUD controls */}
        <div className="responsive-nets-hud">
          <div style={{ color: '#FFFFFF', fontWeight: 700, fontFamily: 'var(--font-body)', fontSize: '0.9rem', letterSpacing: '1px' }}>
            PRACTICE NETS MODE
          </div>

          {/* Delivery selections */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {(['fast', 'swing', 'bouncer', 'spin'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setDeliveryType(type)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '4px',
                  border: '1px solid',
                  borderColor: deliveryType === type ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                  backgroundColor: deliveryType === type ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                  color: deliveryType === type ? 'var(--primary)' : '#FFF',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  cursor: 'none',
                  transition: 'all 0.2s',
                }}
                className="interactive"
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={480}
          height={600}
          onClick={handleStrike}
          style={{
            display: 'block',
            width: '100%',
            maxWidth: '480px',
            margin: '0 auto',
            height: 'auto',
            aspectRatio: '48/60',
            cursor: 'none',
          }}
        />

        {/* Practice status HUD */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: 'rgba(4, 7, 19, 0.96)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Timing Grid Indicator */}
          {offsetMs !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.5px' }}>
                ACCURACY GRID:
              </span>
              <div
                style={{
                  flex: 1,
                  height: '14px',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: '7px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: '20%', height: '100%', backgroundColor: 'rgba(245, 158, 11, 0.25)', borderLeft: '1px dashed var(--primary)', borderRight: '1px dashed var(--primary)' }} />
                
                {/* User strike marker */}
                <div
                  style={{
                    position: 'absolute',
                    // Map -150ms to 0% and +150ms to 100%
                    left: `${Math.min(100, Math.max(0, 50 + (offsetMs / 300) * 100))}%`,
                    width: '6px',
                    height: '100%',
                    backgroundColor: 'var(--secondary)',
                    boxShadow: '0 0 8px var(--secondary)',
                    transform: 'translateX(-50%)',
                    borderRadius: '3px',
                  }}
                />
              </div>
            </div>
          )}

          {/* Feedback & next ball button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: feedbackColor, fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-body)', letterSpacing: '0.5px' }}>
              {timingFeedback}
            </div>

            <button
              onClick={startNewBall}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'var(--primary)',
                color: '#050A18',
                fontFamily: 'var(--font-headings)',
                fontSize: '1rem',
                letterSpacing: '1px',
                cursor: 'none',
                boxShadow: '0 0 10px rgba(0,255,135,0.3)',
              }}
              className="interactive"
            >
              🔄 NEXT BALL
            </button>
          </div>
        </div>
      </div>
  );
}
