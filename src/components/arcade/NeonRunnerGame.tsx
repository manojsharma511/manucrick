import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { ArcadeFullscreenShell } from './ArcadeFullscreenShell';
import { getBestScoreForGame, markGameSessionStarted, persistArcadeGameResult } from './scoreHelpers';
import { ARCADE_GAME_MAP } from '../../data/arcadeGames';

const GAME_META = ARCADE_GAME_MAP['neon-runner'];

interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'buzzsaw' | 'drone' | 'laser';
  speed: number;
  rotation: number;
  active: boolean;
}

interface Battery {
  x: number;
  y: number;
  active: boolean;
}

export default function NeonRunnerGame({ onExit, onSessionRecorded }: { onExit: () => void; onSessionRecorded: () => void }) {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'paused' | 'gameover'>('start');
  const [lives, setLives] = useState(3);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loopRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const startedAtRef = useRef(0);

  // Player physics
  const yRef = useRef(400); // Floor is at 450
  const vyRef = useRef(0);
  const isJumpingRef = useRef(false);
  const doubleJumpAvailableRef = useRef(true);
  const isSlidingRef = useRef(false);
  const slideTimerRef = useRef(0);
  const livesRef = useRef(3);
  const invulFramesRef = useRef(0); // If > 0, player flashes and is immune

  // Animation ticks
  const runFrameRef = useRef(0);
  const bgOffset1Ref = useRef(0);
  const bgOffset2Ref = useRef(0);

  // Lists
  const obstaclesRef = useRef<Obstacle[]>([]);
  const batteriesRef = useRef<Battery[]>([]);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; color: string; size: number; alpha: number }[]>([]);

  const lastSpawnTimeRef = useRef(0);

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
  }, []);

  const startGame = () => {
    initAudio();
    playSynthSound(440, 0.15, 'sine');
    markGameSessionStarted(GAME_META.id);
    setScore(0);
    scoreRef.current = 0;
    startedAtRef.current = Date.now();
    yRef.current = 400;
    vyRef.current = 0;
    isJumpingRef.current = false;
    doubleJumpAvailableRef.current = true;
    isSlidingRef.current = false;
    slideTimerRef.current = 0;
    livesRef.current = 3;
    setLives(3);
    invulFramesRef.current = 0;
    obstaclesRef.current = [];
    batteriesRef.current = [];
    particlesRef.current = [];
    lastSpawnTimeRef.current = 0;
    setGameState('playing');
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

  const jump = () => {
    if (gameState !== 'playing') return;
    if (isSlidingRef.current) {
      // cancel slide
      isSlidingRef.current = false;
    }

    if (!isJumpingRef.current) {
      vyRef.current = -12.5;
      isJumpingRef.current = true;
      doubleJumpAvailableRef.current = true;
      playSynthSound(600, 0.15, 'sine', 900);
      spawnParticles(100, yRef.current, '#A855F7', 10);
    } else if (doubleJumpAvailableRef.current) {
      vyRef.current = -11.0;
      doubleJumpAvailableRef.current = false;
      playSynthSound(750, 0.15, 'sine', 1100);
      // Double jump shockwave particles
      spawnParticles(100, yRef.current, '#00FFFF', 15);
    }
  };

  const slide = () => {
    if (gameState !== 'playing') return;
    if (isJumpingRef.current) {
      // Fast fall
      vyRef.current = 10.0;
      return;
    }
    if (!isSlidingRef.current) {
      isSlidingRef.current = true;
      slideTimerRef.current = 32; // ~0.5s slide duration
      playSynthSound(200, 0.2, 'triangle');
    }
  };

  const spawnParticles = (x: number, y: number, color: string, count = 8) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6 - 2,
        vy: (Math.random() - 0.5) * 6,
        color,
        size: 2 + Math.random() * 4,
        alpha: 1.0,
      });
    }
  };

  const triggerDamage = () => {
    if (invulFramesRef.current > 0) return;
    invulFramesRef.current = 90; // 1.5 seconds invul
    livesRef.current -= 1;
    setLives(livesRef.current);
    playSynthSound(120, 0.35, 'sawtooth');
    spawnParticles(100, yRef.current, '#FF0055', 20);

    if (livesRef.current <= 0) {
      triggerGameOver();
    }
  };

  const triggerGameOver = () => {
    setGameState('gameover');
    persistArcadeGameResult(GAME_META, scoreRef.current, startedAtRef.current, onSessionRecorded);
    const best = getBestScoreForGame(GAME_META.id);
    setHighScore(best);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      e.preventDefault();
      jump();
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      e.preventDefault();
      slide();
    } else if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      if (gameState === 'start' || gameState === 'gameover') {
        startGame();
      } else {
        togglePause();
      }
    }
  };

  // Canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const floorY = 430;
    const playerX = 100;
    const pSize = 35;

    const render = () => {
      // 1. Draw Parallax Background Skyline
      ctx.fillStyle = '#060515';
      ctx.fillRect(0, 0, 480, 600);

      // Star field (slow parallax)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      for (let i = 0; i < 20; i++) {
        const sx = (i * 75 - bgOffset1Ref.current * 0.1) % 480;
        ctx.fillRect(sx, 40 + (i % 4) * 30, 2, 2);
      }

      // Far skyline (skyscrapers silhouette dark purple)
      ctx.fillStyle = '#110F2C';
      const buildingWidth = 60;
      for (let i = 0; i < 12; i++) {
        const bx = (i * buildingWidth - bgOffset1Ref.current * 0.4) % (480 + buildingWidth);
        const bh = 150 + (i % 3) * 50;
        ctx.fillRect(bx, floorY - bh, buildingWidth - 5, bh);
        // Window dots
        ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
        ctx.fillRect(bx + 10, floorY - bh + 20, 10, bh - 40);
        ctx.fillRect(bx + 30, floorY - bh + 30, 10, bh - 60);
        ctx.fillStyle = '#110F2C';
      }

      // Near skyline (neon outlines)
      ctx.fillStyle = '#1C193F';
      for (let i = 0; i < 8; i++) {
        const bx = (i * 100 - bgOffset2Ref.current) % 580;
        const bh = 100 + (i % 2) * 60;
        ctx.fillRect(bx, floorY - bh, 80, bh);
        ctx.strokeStyle = 'rgba(0, 255, 135, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, floorY - bh, 80, bh);
      }

      // 2. Draw Floor
      ctx.fillStyle = '#1D1C33';
      ctx.fillRect(0, floorY, 480, 170);
      
      // Neon floor grid
      ctx.strokeStyle = '#A855F7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, floorY);
      ctx.lineTo(480, floorY);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
      ctx.lineWidth = 1;
      for (let gridX = 0; gridX < 480; gridX += 30) {
        ctx.beginPath();
        const screenGridX = (gridX - bgOffset2Ref.current * 1.5) % 480;
        ctx.moveTo(screenGridX, floorY);
        ctx.lineTo(screenGridX - 25, 600);
        ctx.stroke();
      }

      if (gameState === 'playing') {
        bgOffset1Ref.current += 0.5;
        bgOffset2Ref.current = (bgOffset2Ref.current + 3) % 480;
      }

      // 3. Draw Particles
      particlesRef.current.forEach((part, idx) => {
        ctx.save();
        ctx.globalAlpha = part.alpha;
        ctx.fillStyle = part.color;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (gameState === 'playing') {
          part.x += part.vx;
          part.y += part.vy;
          part.alpha -= 0.025;
          if (part.alpha <= 0) {
            particlesRef.current.splice(idx, 1);
          }
        }
      });

      // 4. Draw Batteries
      batteriesRef.current.forEach((bat) => {
        if (!bat.active) return;
        ctx.save();
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#00FFFF';
        ctx.fillRect(bat.x - 6, bat.y - 10, 12, 20);
        // Cap
        ctx.fillStyle = '#FFF';
        ctx.fillRect(bat.x - 3, bat.y - 13, 6, 3);
        // Energy zig-zag symbol inside
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bat.x - 2, bat.y - 5);
        ctx.lineTo(bat.x + 2, bat.y);
        ctx.lineTo(bat.x - 2, bat.y);
        ctx.lineTo(bat.x + 2, bat.y + 5);
        ctx.stroke();
        ctx.restore();
      });

      // 5. Draw Obstacles (Buzzsaws, drones)
      obstaclesRef.current.forEach((obs) => {
        if (!obs.active) return;
        ctx.save();
        
        if (obs.type === 'buzzsaw') {
          ctx.translate(obs.x + obs.w / 2, obs.y + obs.h / 2);
          ctx.rotate(obs.rotation);

          // Draw neon spiky saw
          ctx.fillStyle = '#EF4444';
          ctx.shadowColor = '#EF4444';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          const spikes = 12;
          const outerR = obs.w / 2;
          const innerR = obs.w / 4;
          for (let s = 0; s < spikes * 2; s++) {
            const angle = (s * Math.PI) / spikes;
            const r = s % 2 === 0 ? outerR : innerR;
            ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
          }
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#FFF';
          ctx.beginPath();
          ctx.arc(0, 0, innerR - 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (obs.type === 'drone') {
          // Drone (quadcopter shape)
          ctx.translate(obs.x + obs.w / 2, obs.y + obs.h / 2);
          ctx.fillStyle = '#7C3AED'; // Purple
          ctx.shadowColor = '#7C3AED';
          ctx.shadowBlur = 8;
          ctx.fillRect(-15, -4, 30, 8); // body
          // Side fans
          ctx.fillRect(-20, -8, 6, 16);
          ctx.fillRect(14, -8, 6, 16);
          // Scanner laser (pulsing red down cone)
          ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-20, 150);
          ctx.lineTo(20, 150);
          ctx.closePath();
          ctx.fill();
        } else {
          // Laser bar (neon fence)
          ctx.fillStyle = '#FF6B00';
          ctx.shadowColor = '#FF6B00';
          ctx.shadowBlur = 15;
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        }
        ctx.restore();
      });

      // 6. Draw Player (Ninja Runner)
      const isInvul = invulFramesRef.current > 0;
      const flashTick = Math.floor(invulFramesRef.current / 4) % 2;

      if (!isInvul || flashTick === 0) {
        ctx.save();
        ctx.translate(playerX, yRef.current);

        // Neon Aura glow
        ctx.shadowColor = '#A855F7';
        ctx.shadowBlur = 15;

        // Draw Ninja Scarf (flowing neon trail behind)
        ctx.strokeStyle = '#FF0055';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(-10, -15);
        const waveOffset = Math.sin(runFrameRef.current * 0.4) * 6;
        ctx.quadraticCurveTo(-25, -20 + waveOffset, -38, -15 + waveOffset * 0.5);
        ctx.stroke();

        // Standing / Running ninja pose
        ctx.fillStyle = '#A855F7';
        
        if (isSlidingRef.current) {
          // Couching chassis slide
          ctx.fillRect(-16, 5, 32, 15);
          ctx.fillStyle = '#000'; // mask visor
          ctx.fillRect(0, 8, 12, 4);
          
          // emit slide foot spark particles
          if (gameState === 'playing' && Math.random() > 0.4) {
            spawnParticles(playerX - 10, yRef.current + 20, '#A855F7', 1);
          }
        } else if (isJumpingRef.current) {
          // Rolling spherical flip pose
          ctx.beginPath();
          ctx.arc(0, 0, pSize / 2, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = '#000'; // mask band
          ctx.fillRect(-10, -5, 20, 4);
        } else {
          // Running stance: Draw legs moving back and forth
          // Torso
          ctx.fillRect(-8, -15, 16, 25);
          // Head
          ctx.beginPath();
          ctx.arc(0, -22, 7, 0, Math.PI * 2);
          ctx.fill();
          // Visor mask
          ctx.fillStyle = '#00FFFF';
          ctx.fillRect(2, -24, 6, 3);
          
          // Left Leg
          ctx.fillStyle = '#7C3AED';
          const leftLegAngle = Math.sin(runFrameRef.current * 0.28);
          ctx.fillRect(-6, 10, 4, 10 + leftLegAngle * 4);
          
          // Right Leg
          ctx.fillStyle = '#A855F7';
          const rightLegAngle = -Math.sin(runFrameRef.current * 0.28);
          ctx.fillRect(2, 10, 4, 10 + rightLegAngle * 4);
        }

        ctx.restore();
      }

      // Physics logic
      if (gameState === 'playing') {
        const now = performance.now();

        // 1. Invulnerability frames countdown
        if (invulFramesRef.current > 0) {
          invulFramesRef.current -= 1;
        }

        // 2. Run frame animation tick
        runFrameRef.current += 1;

        // 3. Gravity and Jumping physics
        if (isJumpingRef.current) {
          vyRef.current += 0.55; // gravity
          yRef.current += vyRef.current;

          if (yRef.current >= floorY - pSize / 2) {
            yRef.current = floorY - pSize / 2;
            vyRef.current = 0;
            isJumpingRef.current = false;
            doubleJumpAvailableRef.current = true;
          }
        }

        // 4. Sliding timer countdown
        if (isSlidingRef.current) {
          slideTimerRef.current -= 1;
          if (slideTimerRef.current <= 0) {
            isSlidingRef.current = false;
          }
        }

        // 5. Score accrual
        scoreRef.current += 0.1;
        setScore(Math.floor(scoreRef.current));

        // 6. Move Obstacles
        obstaclesRef.current.forEach((obs) => {
          if (!obs.active) return;
          obs.x -= obs.speed;
          obs.rotation += 0.08;

          // Collision detection
          const playerLeft = playerX - 10;
          const playerRight = playerX + 10;
          const playerTop = isSlidingRef.current ? yRef.current + 5 : yRef.current - 25;
          const playerBottom = yRef.current + 15;

          const obsLeft = obs.x;
          const obsRight = obs.x + obs.w;
          const obsTop = obs.y;
          const obsBottom = obs.y + obs.h;

          if (
            playerRight > obsLeft &&
            playerLeft < obsRight &&
            playerBottom > obsTop &&
            playerTop < obsBottom
          ) {
            triggerDamage();
          }

          if (obs.x < -100) {
            obs.active = false;
          }
        });

        // 7. Move Batteries
        batteriesRef.current.forEach((b) => {
          if (!b.active) return;
          b.x -= 4.2;

          // Collection check
          const dist = Math.hypot(b.x - playerX, b.y - yRef.current);
          if (dist < 30) {
            b.active = false;
            scoreRef.current += 200;
            setScore(Math.floor(scoreRef.current));
            playSynthSound(950, 0.15, 'sine');
            spawnParticles(b.x, b.y, '#00FFFF', 12);
          }

          if (b.x < -50) {
            b.active = false;
          }
        });

        // 8. Spawn schedule manager
        const speedScale = 1.0 + Math.floor(scoreRef.current / 40) * 0.1;
        const spawnInterval = Math.max(900, 2200 - speedScale * 180);
        if (now - lastSpawnTimeRef.current > spawnInterval) {
          const rand = Math.random();

          if (rand < 0.25) {
            // Spawn Battery
            batteriesRef.current.push({
              x: 520,
              y: floorY - 30 - Math.random() * 120,
              active: true,
            });
          } else if (rand < 0.65) {
            // Spawn low saw obstacle
            obstaclesRef.current.push({
              x: 520,
              y: floorY - 32,
              w: 32,
              h: 32,
              type: 'buzzsaw',
              speed: 4.2 * speedScale,
              rotation: 0,
              active: true,
            });
          } else {
            // Spawn high laser drone
            obstaclesRef.current.push({
              x: 520,
              y: floorY - 95,
              w: 38,
              h: 15,
              type: 'drone',
              speed: 4.2 * speedScale,
              rotation: 0,
              active: true,
            });
          }
          lastSpawnTimeRef.current = now;
        }
      }

      // 7. Render Screen Overlays
      if (gameState === 'start') {
        ctx.fillStyle = 'rgba(3, 6, 15, 0.85)';
        ctx.fillRect(0, 0, 480, 600);
        ctx.fillStyle = '#FFF';
        ctx.font = '22px var(--font-headings), Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CYBER RUNNER NINJA', 240, 230);
        ctx.font = '14px var(--font-body), Arial';
        ctx.fillStyle = 'var(--text-secondary)';
        ctx.fillText('Jump: W / ArrowUp. Slide: S / ArrowDown.', 240, 270);
        ctx.fillText('Dodge buzzsaws and slide under hovering drones.', 240, 295);
        ctx.fillText('Collect power core batteries for speed boost.', 240, 320);
        ctx.fillText('Press SPACE or Click to Start', 240, 360);
      } else if (gameState === 'paused') {
        ctx.fillStyle = 'rgba(3, 6, 15, 0.75)';
        ctx.fillRect(0, 0, 480, 600);
        ctx.fillStyle = '#A855F7';
        ctx.font = '24px var(--font-headings), Arial';
        ctx.textAlign = 'center';
        ctx.fillText('RUNNER PAUSED', 240, 280);
        ctx.font = '14px var(--font-body), Arial';
        ctx.fillStyle = '#FFF';
        ctx.fillText('Press SPACE to Resume', 240, 320);
      } else if (gameState === 'gameover') {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.fillRect(0, 0, 480, 600);
        ctx.fillStyle = 'rgba(3, 6, 15, 0.88)';
        ctx.fillRect(40, 180, 400, 240);

        ctx.strokeStyle = '#A855F7';
        ctx.lineWidth = 2;
        ctx.strokeRect(40, 180, 400, 240);

        ctx.fillStyle = '#EF4444';
        ctx.font = '26px var(--font-headings), Arial';
        ctx.textAlign = 'center';
        ctx.fillText('TERMINATED! GAME OVER', 240, 245);

        ctx.fillStyle = '#FFF';
        ctx.font = '16px var(--font-body), Arial';
        ctx.fillText(`Distance: ${scoreRef.current} m`, 240, 295);
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

  const handleCanvasClick = () => {
    if (gameState === 'start' || gameState === 'gameover') {
      startGame();
    } else {
      jump();
    }
  };

  const statusText = gameState === 'start' ? 'READY' : gameState === 'playing' ? 'RUNNING' : gameState === 'paused' ? 'PAUSED' : 'TERMINATED';

  // Draw Heart emojis for lives remaining
  const hearts = Array.from({ length: 3 }).map((_, i) => (i < lives ? '❤️' : '🖤')).join(' ');

  const touchControls = (
    <>
      <button onClick={jump} className="arcade-touch-btn interactive" style={{ borderColor: '#A855F7', color: '#A855F7' }}>
        ▲ JUMP
      </button>
      <button onClick={slide} className="arcade-touch-btn interactive">
        ▼ SLIDE
      </button>
    </>
  );

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', outline: 'none' }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="interactive-focus"
    >
      <ArcadeFullscreenShell
        title={GAME_META.title}
        subtitle={`${GAME_META.genre} • Health: ${hearts}`}
        accent={GAME_META.accent}
        score={score}
        highScore={highScore}
        statusText={statusText}
        isPaused={gameState === 'paused'}
        controls={GAME_META.keyboardControls}
        onPauseToggle={togglePause}
        onRestart={startGame}
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
