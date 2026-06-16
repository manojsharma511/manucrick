import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { ArcadeFullscreenShell } from './ArcadeFullscreenShell';
import { getBestScoreForGame, markGameSessionStarted, persistArcadeGameResult } from './scoreHelpers';
import { ARCADE_GAME_MAP } from '../../data/arcadeGames';

const GAME_META = ARCADE_GAME_MAP['offroad-rally'];

interface Checkpoint {
  x: number;
  y: number;
  active: boolean;
  pulse: number;
}

interface MudPuddle {
  x: number;
  y: number;
  r: number;
}

interface RockObstacle {
  x: number;
  y: number;
  r: number;
}

interface SpeedPad {
  x: number;
  y: number;
  w: number;
  h: number;
  pulse: number;
}

interface DebrisParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

export default function OffroadRallyGame({ onExit, onSessionRecorded }: { onExit: () => void; onSessionRecorded: () => void }) {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'paused' | 'gameover'>('start');
  const [timeRemaining, setTimeRemaining] = useState(30);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loopRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const startedAtRef = useRef(0);
  
  const timerIntervalRef = useRef<any>(null);
  const timeRemainingRef = useRef(30);

  // Player rally car physics
  const xRef = useRef(240);
  const yRef = useRef(300);
  const angleRef = useRef(-Math.PI / 2);
  const speedRef = useRef(0);
  const maxSpeed = 4.8;
  const suspensionRollRef = useRef(0); // suspension tilt

  const keysPressedRef = useRef<Record<string, boolean>>({});
  
  // Game elements
  const checkpointRef = useRef<Checkpoint>({ x: 100, y: 100, active: true, pulse: 0 });
  const mudPuddlesRef = useRef<MudPuddle[]>([]);
  const rocksRef = useRef<RockObstacle[]>([]);
  const speedPadsRef = useRef<SpeedPad[]>([]);
  const debrisRef = useRef<DebrisParticle[]>([]);

  // Audio Context
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playSynthSound = (freq: number, duration: number, type: OscillatorType = 'triangle', rampTo = 0) => {
    if (!audioCtxRef.current) return;
    const now = audioCtxRef.current.currentTime;
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (rampTo > 0) {
      osc.frequency.exponentialRampToValueAtTime(rampTo, now + duration);
    }
    
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    
    osc.start();
    osc.stop(now + duration);
  };

  useEffect(() => {
    const best = getBestScoreForGame(GAME_META.id);
    setHighScore(best);
    generateTerrain();
  }, []);

  const generateTerrain = () => {
    mudPuddlesRef.current = [
      { x: 120, y: 150, r: 35 },
      { x: 380, y: 200, r: 40 },
      { x: 150, y: 450, r: 45 },
      { x: 340, y: 480, r: 35 },
    ];

    rocksRef.current = [
      { x: 80, y: 280, r: 16 },
      { x: 400, y: 340, r: 18 },
      { x: 220, y: 100, r: 15 },
      { x: 260, y: 520, r: 16 },
    ];

    speedPadsRef.current = [
      { x: 220, y: 220, w: 30, h: 30, pulse: 0 },
      { x: 120, y: 350, w: 30, h: 30, pulse: 1 },
      { x: 320, y: 350, w: 30, h: 30, pulse: 2 },
    ];
  };

  const startGame = () => {
    initAudio();
    playSynthSound(440, 0.15, 'sine');
    markGameSessionStarted(GAME_META.id);
    setScore(0);
    scoreRef.current = 0;
    startedAtRef.current = Date.now();
    xRef.current = 240;
    yRef.current = 300;
    angleRef.current = -Math.PI / 2;
    speedRef.current = 0;
    suspensionRollRef.current = 0;
    timeRemainingRef.current = 30;
    setTimeRemaining(30);
    debrisRef.current = [];
    keysPressedRef.current = {};
    spawnCheckpoint();
    
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      if (gameState === 'playing') {
        timeRemainingRef.current -= 1;
        setTimeRemaining(timeRemainingRef.current);
        if (timeRemainingRef.current <= 0) {
          triggerGameOver();
        }
      }
    }, 1000);

    setGameState('playing');
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [gameState]);

  const spawnCheckpoint = () => {
    checkpointRef.current = {
      x: 50 + Math.random() * 380,
      y: 50 + Math.random() * 500,
      active: true,
      pulse: 0,
    };
  };

  const togglePause = () => {
    if (gameState === 'playing') {
      initAudio();
      playSynthSound(330, 0.1, 'sine');
      setGameState('paused');
    } else if (gameState === 'paused') {
      initAudio();
      playSynthSound(550, 0.1, 'sine');
      setGameState('playing');
    }
  };

  const handleRestart = () => {
    startGame();
  };

  const triggerGameOver = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    initAudio();
    playSynthSound(150, 0.5, 'triangle');
    setGameState('gameover');
    persistArcadeGameResult(GAME_META, scoreRef.current, startedAtRef.current, onSessionRecorded);
    const best = getBestScoreForGame(GAME_META.id);
    setHighScore(best);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    keysPressedRef.current[e.key.toLowerCase()] = true;
    if (e.key === 'p' || e.key === 'P') {
      togglePause();
    }
  };

  const handleKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    keysPressedRef.current[e.key.toLowerCase()] = false;
  };

  // Canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const carW = 16;
    const carH = 32;

    const render = () => {
      // Grass terrain background
      ctx.fillStyle = '#14532D';
      ctx.fillRect(0, 0, 480, 600);

      // Draw Mud Puddles
      mudPuddlesRef.current.forEach((mud) => {
        ctx.save();
        ctx.fillStyle = '#78350F'; // Mud brown
        ctx.beginPath();
        ctx.arc(mud.x, mud.y, mud.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#92400E';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
      });

      // Draw Speed Boost Pads
      speedPadsRef.current.forEach((pad) => {
        ctx.save();
        pad.pulse = (pad.pulse + 0.15) % (Math.PI * 2);
        const glowOpacity = 0.5 + Math.sin(pad.pulse) * 0.35;
        
        ctx.fillStyle = '#FBBF24';
        ctx.shadowColor = '#F59E0B';
        ctx.shadowBlur = 10;
        ctx.fillRect(pad.x, pad.y, pad.w, pad.h);
        
        // Pulse glow border
        ctx.strokeStyle = 'rgba(251, 191, 36, ' + glowOpacity + ')';
        ctx.lineWidth = 3;
        ctx.strokeRect(pad.x - 2, pad.y - 2, pad.w + 4, pad.h + 4);

        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('▲', pad.x + pad.w / 2, pad.y + pad.h / 2 + 5);
        ctx.restore();
      });

      // Draw Rocks
      rocksRef.current.forEach((rock) => {
        ctx.save();
        ctx.fillStyle = '#6B7280';
        ctx.beginPath();
        ctx.arc(rock.x, rock.y, rock.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#4B5563';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Highlight crack lines
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(rock.x - rock.r + 5, rock.y);
        ctx.lineTo(rock.x + rock.r - 8, rock.y - 3);
        ctx.stroke();
        ctx.restore();
      });

      // Draw Checkpoint Flag (Animated waving)
      const cp = checkpointRef.current;
      if (cp.active) {
        ctx.save();
        cp.pulse += 0.18;
        const wave = Math.sin(cp.pulse) * 8;

        // Base Beacon Circle
        ctx.strokeStyle = '#00FF87';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, 16, 0, Math.PI * 2);
        ctx.stroke();

        // Flagpole
        ctx.fillStyle = '#FFF';
        ctx.fillRect(cp.x - 1, cp.y - 22, 2, 22);

        // Animated red flag waving triangle
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.moveTo(cp.x, cp.y - 22);
        ctx.lineTo(cp.x + 14 + wave * 0.3, cp.y - 17 + wave * 0.1);
        ctx.lineTo(cp.x, cp.y - 12);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      // Draw Debris / Mud particles
      debrisRef.current.forEach((deb, debIdx) => {
        ctx.save();
        ctx.globalAlpha = deb.alpha;
        ctx.fillStyle = deb.color;
        ctx.beginPath();
        ctx.arc(deb.x, deb.y, deb.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        if (gameState === 'playing') {
          deb.x += deb.vx;
          deb.y += deb.vy;
          deb.alpha -= 0.04;
          if (deb.alpha <= 0) debrisRef.current.splice(debIdx, 1);
        }
      });

      // Draw Player Rally Car (Neon blue with Active Suspension tilt)
      ctx.save();
      ctx.translate(xRef.current, yRef.current);
      ctx.rotate(angleRef.current + suspensionRollRef.current);

      ctx.shadowColor = '#7DD3FC';
      ctx.shadowBlur = 10;

      // Heavy Off-road Tires
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(-carW / 2 - 3, -carH / 2 + 3, 3, 8); // Front left
      ctx.fillRect(carW / 2, -carH / 2 + 3, 3, 8); // Front right
      ctx.fillRect(-carW / 2 - 3, carH / 2 - 11, 3, 8); // Rear left
      ctx.fillRect(carW / 2, carH / 2 - 11, 3, 8); // Rear right

      // Chassis body
      ctx.fillStyle = '#7DD3FC';
      ctx.fillRect(-carW / 2, -carH / 2, carW, carH);

      // Stripes decals
      ctx.fillStyle = '#FFF';
      ctx.fillRect(-carW / 2 + 2, -carH / 2 + 5, 2, carH - 10);
      ctx.fillRect(carW / 2 - 4, -carH / 2 + 5, 2, carH - 10);

      // Cabin windshield
      ctx.fillStyle = '#000';
      ctx.fillRect(-carW / 2 + 3, -carH / 6, carW - 6, carH / 3);

      ctx.restore();

      // Physics details
      if (gameState === 'playing') {
        let isInMud = false;
        let speedMultiplier = 1.0;

        // Check if inside mud puddle
        mudPuddlesRef.current.forEach((mud) => {
          const dist = Math.hypot(xRef.current - mud.x, yRef.current - mud.y);
          if (dist < mud.r) {
            isInMud = true;
          }
        });

        if (isInMud) {
          speedMultiplier = 0.35;
          // Spawn mud splash particles
          if (Math.random() > 0.4) {
            debrisRef.current.push({
              x: xRef.current,
              y: yRef.current,
              vx: (Math.random() - 0.5) * 5 - Math.cos(angleRef.current) * 2,
              vy: (Math.random() - 0.5) * 5 - Math.sin(angleRef.current) * 2,
              color: '#78350F', // brown
              size: 2 + Math.random() * 4,
              alpha: 0.8,
            });
          }
        } else {
          // Spawn grass dirt blades flying off tires when driving fast
          if (Math.abs(speedRef.current) > 2.0 && Math.random() > 0.7) {
            debrisRef.current.push({
              x: xRef.current,
              y: yRef.current,
              vx: -Math.cos(angleRef.current) * 3 + (Math.random() - 0.5) * 3,
              vy: -Math.sin(angleRef.current) * 3 + (Math.random() - 0.5) * 3,
              color: '#15803D', // bright green grass
              size: 1.5 + Math.random() * 3,
              alpha: 0.7,
            });
          }
        }

        // Check speed boost pads
        speedPadsRef.current.forEach((pad) => {
          if (
            xRef.current > pad.x &&
            xRef.current < pad.x + pad.w &&
            yRef.current > pad.y &&
            yRef.current < pad.y + pad.h
          ) {
            speedMultiplier = 1.65;
            playSynthSound(600, 0.08, 'sine');
          }
        });

        // Accelerate / Reverse
        let accelerate = false;
        let reverse = false;

        if (keysPressedRef.current['w'] || keysPressedRef.current['arrowup']) {
          speedRef.current = Math.min(maxSpeed * speedMultiplier, speedRef.current + 0.15);
          accelerate = true;
        }
        if (keysPressedRef.current['s'] || keysPressedRef.current['arrowdown']) {
          speedRef.current = Math.max(-maxSpeed * 0.4, speedRef.current - 0.12);
          reverse = true;
        }

        // Steer angle and suspension tilt
        if (keysPressedRef.current['a'] || keysPressedRef.current['arrowleft']) {
          if (Math.abs(speedRef.current) > 0.3) {
            const steerDir = speedRef.current > 0 ? -1 : 1;
            angleRef.current += 0.075 * steerDir;
            // Roll suspension slightly outwards
            suspensionRollRef.current = Math.max(-0.15, suspensionRollRef.current - 0.025);
          }
        } else if (keysPressedRef.current['d'] || keysPressedRef.current['arrowright']) {
          if (Math.abs(speedRef.current) > 0.3) {
            const steerDir = speedRef.current > 0 ? 1 : -1;
            angleRef.current += 0.075 * steerDir;
            suspensionRollRef.current = Math.min(0.15, suspensionRollRef.current + 0.025);
          }
        } else {
          suspensionRollRef.current *= 0.75; // centering spring
        }

        // Apply friction
        if (!accelerate && !reverse) {
          speedRef.current *= 0.93;
        }

        const vx = Math.cos(angleRef.current) * speedRef.current;
        const vy = Math.sin(angleRef.current) * speedRef.current;

        const nextX = xRef.current + vx;
        const nextY = yRef.current + vy;

        // Collision against rock obstacles
        let hitRock = false;
        rocksRef.current.forEach((rock) => {
          const dist = Math.hypot(nextX - rock.x, nextY - rock.y);
          if (dist < rock.r + carW / 2) {
            hitRock = true;
          }
        });

        // Arena borders
        if (nextX < 15 || nextX > 465 || nextY < 15 || nextY > 585) {
          speedRef.current *= -0.4;
          playSynthSound(150, 0.1, 'triangle');
        } else if (hitRock) {
          speedRef.current *= -0.4;
          playSynthSound(100, 0.15, 'sawtooth');
          // Spawn stone sparks
          for (let i = 0; i < 8; i++) {
            debrisRef.current.push({
              x: xRef.current,
              y: yRef.current,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              color: '#9CA3AF',
              size: 2,
              alpha: 0.8,
            });
          }
        } else {
          xRef.current = nextX;
          yRef.current = nextY;
        }

        // Reached checkpoint check
        const cpDist = Math.hypot(xRef.current - cp.x, yRef.current - cp.y);
        if (cp.active && cpDist < 24) {
          cp.active = false;
          scoreRef.current += 1000;
          setScore(scoreRef.current);
          
          timeRemainingRef.current = Math.min(99, timeRemainingRef.current + 10);
          setTimeRemaining(timeRemainingRef.current);
          
          playSynthSound(880, 0.2, 'sine', 1200);
          spawnCheckpoint();
        }
      }

      // Render Screen texts
      if (gameState === 'start') {
        ctx.fillStyle = 'rgba(3, 6, 15, 0.85)';
        ctx.fillRect(0, 0, 480, 600);
        ctx.fillStyle = '#FFF';
        ctx.font = '22px var(--font-headings), Arial';
        ctx.textAlign = 'center';
        ctx.fillText('OFFROAD RALLY RUN', 240, 230);
        ctx.font = '14px var(--font-body), Arial';
        ctx.fillStyle = 'var(--text-secondary)';
        ctx.fillText('Drive: WASD / Arrows.', 240, 265);
        ctx.fillText('Hit Checkpoints (🏁) to gain +10s time.', 240, 290);
        ctx.fillText('Avoid rocks and mud puddles (slows you down).', 240, 315);
        ctx.fillText('Press SPACE or Click to Start', 240, 355);
      } else if (gameState === 'paused') {
        ctx.fillStyle = 'rgba(3, 6, 15, 0.75)';
        ctx.fillRect(0, 0, 480, 600);
        ctx.fillStyle = '#7DD3FC';
        ctx.font = '24px var(--font-headings), Arial';
        ctx.textAlign = 'center';
        ctx.fillText('RALLY PAUSED', 240, 280);
        ctx.font = '14px var(--font-body), Arial';
        ctx.fillStyle = '#FFF';
        ctx.fillText('Press SPACE to Resume', 240, 320);
      } else if (gameState === 'gameover') {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.fillRect(0, 0, 480, 600);
        ctx.fillStyle = 'rgba(3, 6, 15, 0.88)';
        ctx.fillRect(40, 180, 400, 240);

        ctx.strokeStyle = '#7DD3FC';
        ctx.lineWidth = 2;
        ctx.strokeRect(40, 180, 400, 240);

        ctx.fillStyle = '#EF4444';
        ctx.font = '26px var(--font-headings), Arial';
        ctx.textAlign = 'center';
        ctx.fillText('TIME EXPIRED! GAME OVER', 240, 245);

        ctx.fillStyle = '#FFF';
        ctx.font = '16px var(--font-body), Arial';
        ctx.fillText(`Final Rally Score: ${scoreRef.current}`, 240, 295);
        ctx.fillText(`All-Time Best: ${highScore}`, 240, 325);
        ctx.font = '12px var(--font-body), Arial';
        ctx.fillStyle = 'var(--text-secondary)';
        ctx.fillText('Press SPACE or Click to Restart', 240, 375);
      }
    };

    const updateLoop = () => {
      render();
      loopRef.current = requestAnimationFrame(updateLoop);
    };

    updateLoop();

    return () => {
      cancelAnimationFrame(loopRef.current);
    };
  }, [gameState, highScore]);

  // Touch control helper
  const handleTouchDrive = (action: string) => {
    if (gameState !== 'playing') return;
    if (action === 'accelerate') {
      speedRef.current = Math.min(maxSpeed, speedRef.current + 1.2);
      playSynthSound(300, 0.08, 'sine');
    } else if (action === 'steer-left') {
      angleRef.current -= 0.35;
    } else if (action === 'steer-right') {
      angleRef.current += 0.35;
    }
  };

  const handleCanvasClick = () => {
    if (gameState === 'start' || gameState === 'gameover') {
      startGame();
    }
  };

  const statusText = gameState === 'start' ? 'READY' : gameState === 'playing' ? `TIME REMAINING: ${timeRemaining}s` : gameState === 'paused' ? 'PAUSED' : 'TIME OUT';

  const touchControls = (
    <>
      <button onClick={() => handleTouchDrive('steer-left')} className="arcade-touch-btn interactive">◀ Steer L</button>
      <button onClick={() => handleTouchDrive('accelerate')} className="arcade-touch-btn interactive" style={{ borderColor: '#7DD3FC', color: '#7DD3FC' }}>⛽ ACCEL</button>
      <button onClick={() => handleTouchDrive('steer-right')} className="arcade-touch-btn interactive">Steer R ▶</button>
    </>
  );

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', outline: 'none' }}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      tabIndex={0}
      className="interactive-focus"
    >
      <ArcadeFullscreenShell
        title={GAME_META.title}
        subtitle={`${GAME_META.genre} • Time attack checkpoints`}
        accent={GAME_META.accent}
        score={score}
        highScore={highScore}
        statusText={statusText}
        isPaused={gameState === 'paused'}
        controls={GAME_META.keyboardControls}
        onPauseToggle={togglePause}
        onRestart={handleRestart}
        onExit={onExit}
        touchControls={touchControls}
      >
        <canvas
          ref={canvasRef}
          width={480}
          height={600}
          onClick={handleCanvasClick}
          style={{
            display: 'block',
            width: '100%',
            maxWidth: '480px',
            height: 'auto',
            aspectRatio: '48/60',
            border: '2px solid rgba(255,255,255,0.06)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
            borderRadius: '8px',
          }}
        />
      </ArcadeFullscreenShell>
    </div>
  );
}
