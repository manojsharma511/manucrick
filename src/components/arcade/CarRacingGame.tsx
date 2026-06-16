import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { ArcadeFullscreenShell } from './ArcadeFullscreenShell';
import { getBestScoreForGame, markGameSessionStarted, persistArcadeGameResult } from './scoreHelpers';
import { ARCADE_GAME_MAP } from '../../data/arcadeGames';

const GAME_META = ARCADE_GAME_MAP['car-racing'];

interface TrafficCar {
  x: number;
  y: number;
  lane: number;
  speed: number;
  color: string;
  emoji: string;
  wheelRot: number;
}

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

export default function CarRacingGame({ onExit, onSessionRecorded }: { onExit: () => void; onSessionRecorded: () => void }) {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'paused' | 'gameover'>('start');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loopRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const startedAtRef = useRef(0);

  // Gameplay parameters
  const playerLaneRef = useRef(1); // 0 = Left, 1 = Center, 2 = Right
  const playerXRef = useRef(240);
  const targetXRef = useRef(240);
  const trafficRef = useRef<TrafficCar[]>([]);
  const lastSpawnTimeRef = useRef(0);
  const speedScaleRef = useRef(1.0);
  const roadOffsetRef = useRef(0);

  // High-fidelity animation assets
  const sparksRef = useRef<SparkParticle[]>([]);
  const screenShakeRef = useRef(0); // If > 0, shake screen
  const smokeParticlesRef = useRef<{ x: number; y: number; r: number; alpha: number }[]>([]);
  const scenerySignsRef = useRef<{ y: number; text: string; side: 'left' | 'right' }[]>([]);

  // Audio Context (Synthesized effects)
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initScenery = () => {
    scenerySignsRef.current = [
      { y: 100, text: 'SLOW', side: 'left' },
      { y: 300, text: 'SPEED', side: 'right' },
      { y: 500, text: 'DODGE', side: 'left' },
    ];
  };

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playSynthSound = (freq: number, duration: number, type: OscillatorType = 'triangle') => {
    if (!audioCtxRef.current) return;
    const now = audioCtxRef.current.currentTime;
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (type === 'sawtooth') {
      osc.frequency.exponentialRampToValueAtTime(30, now + duration);
    }
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    
    osc.start();
    osc.stop(now + duration);
  };

  useEffect(() => {
    const best = getBestScoreForGame(GAME_META.id);
    setHighScore(best);
    initScenery();
  }, []);

  const startGame = () => {
    initAudio();
    playSynthSound(440, 0.15, 'sine');
    markGameSessionStarted(GAME_META.id);
    setScore(0);
    scoreRef.current = 0;
    startedAtRef.current = Date.now();
    playerLaneRef.current = 1;
    playerXRef.current = 240;
    targetXRef.current = 240;
    trafficRef.current = [];
    sparksRef.current = [];
    smokeParticlesRef.current = [];
    screenShakeRef.current = 0;
    initScenery();
    lastSpawnTimeRef.current = 0;
    speedScaleRef.current = 1.0;
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

  const handleRestart = () => {
    startGame();
  };

  const triggerGameOver = () => {
    initAudio();
    playSynthSound(100, 0.4, 'sawtooth');
    setGameState('gameover');
    screenShakeRef.current = 28; // Trigger 28 frames of shake
    
    // Spawn massive sparks
    for (let i = 0; i < 40; i++) {
      sparksRef.current.push({
        x: playerXRef.current + (Math.random() - 0.5) * 30,
        y: 480 + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 8 - 2,
        color: Math.random() > 0.5 ? '#FFD700' : '#FF6B00',
        size: 2 + Math.random() * 4,
        alpha: 1.0,
      });
    }

    persistArcadeGameResult(GAME_META, scoreRef.current, startedAtRef.current, onSessionRecorded);
    const best = getBestScoreForGame(GAME_META.id);
    setHighScore(best);
  };

  const moveLaneLeft = () => {
    if (gameState !== 'playing') return;
    if (playerLaneRef.current > 0) {
      playerLaneRef.current -= 1;
      initAudio();
      playSynthSound(600, 0.05, 'triangle');
    }
  };

  const moveLaneRight = () => {
    if (gameState !== 'playing') return;
    if (playerLaneRef.current < 2) {
      playerLaneRef.current += 1;
      initAudio();
      playSynthSound(600, 0.05, 'triangle');
    }
  };

  // Keyboard controls
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      moveLaneLeft();
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
      moveLaneRight();
    } else if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      togglePause();
    } else if (e.key === 'r' || e.key === 'R') {
      if (gameState === 'gameover') {
        startGame();
      }
    }
  };

  // Canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const laneCenters = [100, 240, 380];
    const playerY = 500;
    const playerWidth = 46;
    const playerHeight = 72;

    const render = () => {
      ctx.save();
      // Apply screen shake
      if (screenShakeRef.current > 0) {
        const shakeX = (Math.random() - 0.5) * screenShakeRef.current * 0.7;
        const shakeY = (Math.random() - 0.5) * screenShakeRef.current * 0.7;
        ctx.translate(shakeX, shakeY);
        screenShakeRef.current -= 1;
      }

      // Clear Screen
      ctx.fillStyle = '#060B1C';
      ctx.fillRect(0, 0, 480, 600);

      // Road background drawing
      ctx.fillStyle = '#111827';
      ctx.fillRect(40, 0, 400, 600);

      // Side shoulders (red/white striped curbs)
      const curbHeight = 40;
      const curbOffset = roadOffsetRef.current % curbHeight;
      for (let cy = -curbHeight; cy < 600 + curbHeight; cy += curbHeight) {
        const index = Math.floor((cy - roadOffsetRef.current) / curbHeight) % 2;
        ctx.fillStyle = index === 0 ? '#EF4444' : '#FFF';
        ctx.fillRect(34, cy + curbOffset, 6, curbHeight);
        ctx.fillRect(440, cy + curbOffset, 6, curbHeight);
      }

      // Lane dividers (animated dashed line)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 3.5;
      ctx.setLineDash([30, 45]);
      ctx.lineDashOffset = -roadOffsetRef.current;
      
      ctx.beginPath();
      ctx.moveTo(170, 0);
      ctx.lineTo(170, 600);
      ctx.moveTo(310, 0);
      ctx.lineTo(310, 600);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash

      if (gameState === 'playing') {
        // Animate road offset
        roadOffsetRef.current = (roadOffsetRef.current + 6.5 * speedScaleRef.current) % 75;
      }

      // Scenery Signs drawing
      scenerySignsRef.current.forEach((sign) => {
        if (gameState === 'playing') {
          sign.y += 6.5 * speedScaleRef.current;
          if (sign.y > 620) {
            sign.y = -60;
          }
        }
        ctx.save();
        ctx.fillStyle = '#374151';
        const signX = sign.side === 'left' ? 12 : 452;
        ctx.fillRect(signX, sign.y, 16, 20); // post
        ctx.fillStyle = '#FF6B00';
        ctx.fillRect(signX - 8, sign.y - 15, 32, 18); // sign board
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(sign.text, signX + 8, sign.y - 3);
        ctx.restore();
      });

      // Smoothly interpolate player X to target lane center
      targetXRef.current = laneCenters[playerLaneRef.current];
      playerXRef.current += (targetXRef.current - playerXRef.current) * 0.25;

      const px = playerXRef.current - playerWidth / 2;
      const py = playerY - playerHeight / 2;

      // Project Headlight Cones (Gradient)
      ctx.save();
      const headlightGrad = ctx.createLinearGradient(
        playerXRef.current,
        py,
        playerXRef.current,
        py - 180
      );
      headlightGrad.addColorStop(0, 'rgba(255, 255, 220, 0.45)');
      headlightGrad.addColorStop(1, 'rgba(255, 255, 220, 0.0)');
      ctx.fillStyle = headlightGrad;
      ctx.beginPath();
      ctx.moveTo(playerXRef.current - 12, py);
      ctx.lineTo(playerXRef.current - 45, py - 185);
      ctx.lineTo(playerXRef.current + 45, py - 185);
      ctx.lineTo(playerXRef.current + 12, py);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Exhaust Smoke drawing
      smokeParticlesRef.current.forEach((sm, smIdx) => {
        ctx.save();
        ctx.fillStyle = 'rgba(156, 163, 175, ' + sm.alpha + ')';
        ctx.beginPath();
        ctx.arc(sm.x, sm.y, sm.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        if (gameState === 'playing') {
          sm.y += 3.5;
          sm.alpha -= 0.02;
          sm.r += 0.25;
          if (sm.alpha <= 0) smokeParticlesRef.current.splice(smIdx, 1);
        }
      });

      if (gameState === 'playing' && Math.random() > 0.6) {
        smokeParticlesRef.current.push({
          x: playerXRef.current - 10,
          y: py + playerHeight,
          r: 3,
          alpha: 0.6,
        });
        smokeParticlesRef.current.push({
          x: playerXRef.current + 10,
          y: py + playerHeight,
          r: 3,
          alpha: 0.6,
        });
      }

      // Draw Player Car Wheels
      ctx.save();
      ctx.fillStyle = '#111';
      // Front Wheels
      ctx.fillRect(px - 4, py + 8, 4, 15);
      ctx.fillRect(px + playerWidth, py + 8, 4, 15);
      // Rear Wheels
      ctx.fillRect(px - 4, py + playerHeight - 22, 4, 15);
      ctx.fillRect(px + playerWidth, py + playerHeight - 22, 4, 15);
      ctx.restore();

      // Draw Player Car (Neon styling)
      ctx.save();
      ctx.shadowColor = '#00FF87';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#00FF87';
      ctx.beginPath();
      ctx.moveTo(px + playerWidth / 2, py); // Nose
      ctx.lineTo(px + playerWidth, py + playerHeight); // Rear right
      ctx.lineTo(px + playerWidth / 2, py + playerHeight - 12); // Center rear indent
      ctx.lineTo(px, py + playerHeight); // Rear left
      ctx.closePath();
      ctx.fill();

      // Spoiler (Rear wing bar)
      ctx.fillStyle = '#10B981';
      ctx.fillRect(px - 2, py + playerHeight - 3, playerWidth + 4, 4);

      // Windshield
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.moveTo(px + playerWidth / 2, py + 14);
      ctx.lineTo(px + playerWidth - 8, py + 42);
      ctx.lineTo(px + 8, py + 42);
      ctx.closePath();
      ctx.fill();

      // Tail lights
      ctx.fillStyle = '#FF3B30';
      ctx.fillRect(px + 5, py + playerHeight - 7, 7, 3);
      ctx.fillRect(px + playerWidth - 12, py + playerHeight - 7, 7, 3);
      ctx.restore();

      // Draw Traffic Cars
      trafficRef.current.forEach((car) => {
        const cx = car.x - playerWidth / 2;
        const cy = car.y - playerHeight / 2;

        if (gameState === 'playing') {
          car.wheelRot += 0.25;
        }

        // Draw Wheels
        ctx.save();
        ctx.fillStyle = '#111';
        ctx.fillRect(cx - 3, cy + 8, 3, 14);
        ctx.fillRect(cx + playerWidth, cy + 8, 3, 14);
        ctx.fillRect(cx - 3, cy + playerHeight - 22, 3, 14);
        ctx.fillRect(cx + playerWidth, cy + playerHeight - 22, 3, 14);
        ctx.restore();

        ctx.save();
        ctx.shadowColor = car.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = car.color;
        ctx.beginPath();
        ctx.moveTo(cx + playerWidth / 2, cy + playerHeight); // Nose pointing down
        ctx.lineTo(cx + playerWidth, cy); // Rear right
        ctx.lineTo(cx + playerWidth / 2, cy + 12);
        ctx.lineTo(cx, cy); // Rear left
        ctx.closePath();
        ctx.fill();

        // Spoiler
        ctx.fillRect(cx - 1, cy - 2, playerWidth + 2, 4);

        // Windshield
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(cx + playerWidth / 2, cy + playerHeight - 14);
        ctx.lineTo(cx + playerWidth - 8, cy + playerHeight - 42);
        ctx.lineTo(cx + 8, cy + playerHeight - 42);
        ctx.closePath();
        ctx.fill();

        // Emoji detail in center
        ctx.fillStyle = '#FFF';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(car.emoji, car.x, car.y + 4);
        ctx.restore();
      });

      // Draw Sparks
      sparksRef.current.forEach((sp, spIdx) => {
        ctx.save();
        ctx.globalAlpha = sp.alpha;
        ctx.fillStyle = sp.color;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 0.2; // gravity
        sp.alpha -= 0.025;
        if (sp.alpha <= 0) sparksRef.current.splice(spIdx, 1);
      });

      // Update Game State
      if (gameState === 'playing') {
        const now = performance.now();

        // Increment Score
        scoreRef.current += 0.05 * speedScaleRef.current;
        setScore(Math.floor(scoreRef.current));

        // Speed ramp scaling
        speedScaleRef.current = 1.0 + Math.floor(scoreRef.current / 30) * 0.15;

        // Spawn Traffic
        const spawnDelay = Math.max(800, 1800 - (speedScaleRef.current * 150));
        if (now - lastSpawnTimeRef.current > spawnDelay) {
          const spawnLane = Math.floor(Math.random() * 3);
          const tooClose = trafficRef.current.some(car => car.lane === spawnLane && car.y < 120);
          if (!tooClose) {
            const emojis = ['🚗', '🚕', '🚙', '🚓', '🚒', '🚚'];
            const colors = ['#FF6B00', '#FF2E93', '#FFD700', '#00E5FF', '#A855F7', '#EF4444'];
            const colorIdx = Math.floor(Math.random() * colors.length);
            trafficRef.current.push({
              x: laneCenters[spawnLane],
              y: -50,
              lane: spawnLane,
              speed: (3 + Math.random() * 2) * speedScaleRef.current,
              color: colors[colorIdx],
              emoji: emojis[colorIdx % emojis.length],
              wheelRot: 0,
            });
            lastSpawnTimeRef.current = now;
          }
        }

        // Move Traffic & Collision Detection
        trafficRef.current.forEach((car, index) => {
          car.y += car.speed;

          // Bounding box collision detection
          const playerLeft = playerXRef.current - playerWidth / 2 + 5;
          const playerRight = playerXRef.current + playerWidth / 2 - 5;
          const playerTop = playerY - playerHeight / 2 + 5;
          const playerBottom = playerY + playerHeight / 2 - 5;

          const carLeft = car.x - playerWidth / 2 + 5;
          const carRight = car.x + playerWidth / 2 - 5;
          const carTop = car.y - playerHeight / 2 + 5;
          const carBottom = car.y + playerHeight / 2 - 5;

          if (
            playerRight > carLeft &&
            playerLeft < carRight &&
            playerBottom > carTop &&
            playerTop < carBottom
          ) {
            triggerGameOver();
          }

          // Remove offscreen
          if (car.y > 650) {
            trafficRef.current.splice(index, 1);
          }
        });
      }

      // Render Screen overlays
      if (gameState === 'start') {
        ctx.fillStyle = 'rgba(3, 6, 15, 0.85)';
        ctx.fillRect(0, 0, 480, 600);
        ctx.fillStyle = '#FFF';
        ctx.font = '22px var(--font-headings), Arial';
        ctx.textAlign = 'center';
        ctx.fillText('NEON TRAFFIC RACER', 240, 240);
        ctx.font = '14px var(--font-body), Arial';
        ctx.fillStyle = 'var(--text-secondary)';
        ctx.fillText('Switch lanes to dodge ongoing traffic.', 240, 275);
        ctx.fillText('Press SPACE or Click to Start', 240, 310);
      } else if (gameState === 'paused') {
        ctx.fillStyle = 'rgba(3, 6, 15, 0.75)';
        ctx.fillRect(0, 0, 480, 600);
        ctx.fillStyle = '#FFD700';
        ctx.font = '24px var(--font-headings), Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME PAUSED', 240, 280);
        ctx.font = '14px var(--font-body), Arial';
        ctx.fillStyle = '#FFF';
        ctx.fillText('Press SPACE to Resume', 240, 320);
      } else if (gameState === 'gameover') {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.fillRect(0, 0, 480, 600);
        ctx.fillStyle = 'rgba(3, 6, 15, 0.85)';
        ctx.fillRect(40, 180, 400, 240);

        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(40, 180, 400, 240);

        ctx.fillStyle = '#EF4444';
        ctx.font = '26px var(--font-headings), Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CRASHED! GAME OVER', 240, 240);

        ctx.fillStyle = '#FFF';
        ctx.font = '16px var(--font-body), Arial';
        ctx.fillText(`Your Score: ${scoreRef.current}`, 240, 285);
        ctx.fillText(`All-Time Best: ${highScore}`, 240, 315);
        ctx.font = '12px var(--font-body), Arial';
        ctx.fillStyle = 'var(--text-secondary)';
        ctx.fillText('Press R or Click to Restart', 240, 365);
      }
      ctx.restore(); // restore shake
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
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState === 'start' || gameState === 'gameover') {
      startGame();
    } else if (gameState === 'playing') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const pct = x / rect.width;
      if (pct < 0.5) {
        moveLaneLeft();
      } else {
        moveLaneRight();
      }
    }
  };

  const statusText = gameState === 'start' ? 'READY' : gameState === 'playing' ? 'RACING' : gameState === 'paused' ? 'PAUSED' : 'CRASHED';

  const touchControls = (
    <>
      <button onClick={moveLaneLeft} className="arcade-touch-btn interactive">◀ Switch Left</button>
      <button onClick={moveLaneRight} className="arcade-touch-btn interactive">Switch Right ▶</button>
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
        subtitle={`${GAME_META.genre} • Difficulty: ${GAME_META.difficulty}`}
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
