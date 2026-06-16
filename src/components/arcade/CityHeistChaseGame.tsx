import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { ArcadeFullscreenShell } from './ArcadeFullscreenShell';
import { getBestScoreForGame, markGameSessionStarted, persistArcadeGameResult } from './scoreHelpers';
import { ARCADE_GAME_MAP } from '../../data/arcadeGames';

const GAME_META = ARCADE_GAME_MAP['city-heist-chase'];

interface CashBag {
  x: number;
  y: number;
  active: boolean;
  pulse: number;
}

interface PoliceCar {
  x: number;
  y: number;
  angle: number;
  speed: number;
  vx: number;
  vy: number;
  active: boolean;
  type: 'patrol' | 'interceptor';
  sirenColor: string;
}

interface BuildingBlock {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface SkidMark {
  x: number;
  y: number;
  alpha: number;
}

export default function CityHeistChaseGame({ onExit, onSessionRecorded }: { onExit: () => void; onSessionRecorded: () => void }) {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'paused' | 'gameover'>('start');

  const [heat, setHeat] = useState(1);
  const [damage, setDamage] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loopRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const startedAtRef = useRef(0);

  // Player physics refs
  const xRef = useRef(240);
  const yRef = useRef(300);
  const angleRef = useRef(-Math.PI / 2); // facing UP
  const speedRef = useRef(0);
  const maxSpeed = 5.0;
  const damageRef = useRef(0);

  const keysPressedRef = useRef<Record<string, boolean>>({});
  const policeRef = useRef<PoliceCar[]>([]);
  const cashRef = useRef<CashBag[]>([]);
  const buildingsRef = useRef<BuildingBlock[]>([]);
  const skidMarksRef = useRef<SkidMark[]>([]);
  const sparksRef = useRef<{ x: number; y: number; vx: number; vy: number; color: string; size: number; alpha: number }[]>([]);

  // Sirens and spawn timers
  const lastPoliceSpawnTimeRef = useRef(0);
  const heatLevelRef = useRef(1);
  const sirenPhaseRef = useRef(0);

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
    generateCityGrid();
  }, []);

  const generateCityGrid = () => {
    // Blocks represent building walls
    buildingsRef.current = [
      { x: 40, y: 40, w: 100, h: 100 },
      { x: 180, y: 40, w: 120, h: 100 },
      { x: 340, y: 40, w: 100, h: 100 },
      { x: 40, y: 180, w: 100, h: 140 },
      { x: 180, y: 180, w: 120, h: 140 },
      { x: 340, y: 180, w: 100, h: 140 },
      { x: 40, y: 360, w: 100, h: 100 },
      { x: 180, y: 360, w: 120, h: 100 },
      { x: 340, y: 360, w: 100, h: 100 },
      { x: 40, y: 500, w: 100, h: 60 },
      { x: 180, y: 500, w: 120, h: 60 },
      { x: 340, y: 500, w: 100, h: 60 },
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
    damageRef.current = 0;
    setDamage(0);
    setHeat(1);
    heatLevelRef.current = 1;
    policeRef.current = [];
    skidMarksRef.current = [];
    sparksRef.current = [];
    keysPressedRef.current = {};
    spawnCashBags();
    setGameState('playing');
  };

  const spawnCashBags = () => {
    cashRef.current = [];
    for (let i = 0; i < 4; i++) {
      spawnOneCash();
    }
  };

  const spawnOneCash = () => {
    let spawned = false;
    let attempts = 0;
    while (!spawned && attempts < 100) {
      attempts++;
      const sx = 20 + Math.random() * 440;
      const sy = 20 + Math.random() * 560;

      const inside = buildingsRef.current.some(
        (b) => sx > b.x - 12 && sx < b.x + b.w + 12 && sy > b.y - 12 && sy < b.y + b.h + 12
      );

      if (!inside) {
        cashRef.current.push({ x: sx, y: sy, active: true, pulse: Math.random() * 10 });
        spawned = true;
      }
    }
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
    playSynthSound(70, 0.8, 'sawtooth');
    setGameState('gameover');
    persistArcadeGameResult(GAME_META, scoreRef.current, startedAtRef.current, onSessionRecorded);
    const best = getBestScoreForGame(GAME_META.id);
    setHighScore(best);
  };

  const spawnSparks = (sx: number, sy: number) => {
    for (let i = 0; i < 8; i++) {
      sparksRef.current.push({
        x: sx,
        y: sy,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        color: '#FF6B00',
        size: 2 + Math.random() * 3,
        alpha: 1.0,
      });
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    keysPressedRef.current[e.key.toLowerCase()] = true;
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      // Drift handbrake
      speedRef.current *= 0.45;
      playSynthSound(200, 0.12, 'sawtooth');
      
      // Spawn skid marks
      if (gameState === 'playing') {
        skidMarksRef.current.push({ x: xRef.current, y: yRef.current, alpha: 0.8 });
      }
    } else if (e.key === 'p' || e.key === 'P') {
      togglePause();
    }
  };

  const handleKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    keysPressedRef.current[e.key.toLowerCase()] = false;
  };

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const carW = 15;
    const carH = 30;

    const render = () => {
      // Asphalt streets base
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, 480, 600);

      // Draw sidewalk boundaries (grey lines framing roads)
      ctx.strokeStyle = '#4B5563';
      ctx.lineWidth = 4;
      buildingsRef.current.forEach((b) => {
        ctx.strokeRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4);
      });

      // Draw Skid Marks
      skidMarksRef.current.forEach((sm, smIdx) => {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, ' + sm.alpha + ')';
        ctx.fillRect(sm.x - 3, sm.y - 3, 6, 6);
        ctx.restore();
        if (gameState === 'playing') {
          sm.alpha -= 0.003; // Slowly fade tire marks
          if (sm.alpha <= 0) skidMarksRef.current.splice(smIdx, 1);
        }
      });

      // Draw Buildings
      buildingsRef.current.forEach((b) => {
        ctx.save();
        ctx.fillStyle = '#374151';
        ctx.strokeStyle = '#4B5563';
        ctx.lineWidth = 2.5;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeRect(b.x, b.y, b.w, b.h);

        // Building window details
        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        ctx.fillRect(b.x + 8, b.y + 8, b.w - 16, b.h - 16);
        ctx.restore();
      });

      // Draw Cash bags (glowing pulsars)
      cashRef.current.forEach((c) => {
        if (!c.active) return;
        c.pulse += 0.08;
        const pulseSize = 6 + Math.sin(c.pulse) * 2;

        ctx.save();
        ctx.shadowColor = '#00FF87';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#00FF87';
        ctx.beginPath();
        ctx.arc(c.x, c.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#050A18';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('$', c.x, c.y + 3);
        ctx.restore();
      });

      // Draw Police Cars with flashing red/blue siren glow projected on road
      policeRef.current.forEach((cop) => {
        if (!cop.active) return;

        // Flashing siren beam cone
        ctx.save();
        ctx.translate(cop.x, cop.y);
        ctx.rotate(cop.angle);

        const sirenTick = Math.floor(sirenPhaseRef.current * 1.5) % 2;
        const beamGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 50);
        beamGrad.addColorStop(0, sirenTick === 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.4)');
        beamGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 50, 0, Math.PI * 2);
        ctx.fill();

        // Wheels
        ctx.fillStyle = '#111';
        ctx.fillRect(-carW / 2 - 2, -carH / 2 + 5, 2, 8);
        ctx.fillRect(carW / 2, -carH / 2 + 5, 2, 8);
        ctx.fillRect(-carW / 2 - 2, carH / 2 - 13, 2, 8);
        ctx.fillRect(carW / 2, carH / 2 - 13, 2, 8);

        // Body
        ctx.fillStyle = '#000';
        ctx.fillRect(-carW / 2, -carH / 2, carW, carH);
        ctx.fillStyle = '#FFF';
        ctx.fillRect(-carW / 2 + 1, -carH / 6, carW - 2, carH / 3);

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
        if (gameState === 'playing') {
          sp.x += sp.vx;
          sp.y += sp.vy;
          sp.alpha -= 0.03;
          if (sp.alpha <= 0) sparksRef.current.splice(spIdx, 1);
        }
      });

      // Draw Engine Smoke/Fire based on damage levels
      if (gameState === 'playing') {
        const fireSpawnChance = damageRef.current / 100;
        if (damageRef.current > 30 && Math.random() < fireSpawnChance * 0.4) {
          // Grey smoke
          sparksRef.current.push({
            x: xRef.current,
            y: yRef.current,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            color: 'rgba(120, 120, 120, 0.5)',
            size: 4 + Math.random() * 5,
            alpha: 0.6,
          });
        }
        if (damageRef.current > 60 && Math.random() < fireSpawnChance * 0.5) {
          // Yellow-red flames
          sparksRef.current.push({
            x: xRef.current + (Math.random() - 0.5) * 8,
            y: yRef.current + (Math.random() - 0.5) * 8,
            vx: (Math.random() - 0.5) * 2,
            vy: -2 - Math.random() * 2,
            color: Math.random() > 0.4 ? '#FF2E93' : '#FFD700',
            size: 3 + Math.random() * 4,
            alpha: 0.9,
          });
        }
      }

      // Draw Player Heist Car with wheels turning
      ctx.save();
      ctx.translate(xRef.current, yRef.current);
      ctx.rotate(angleRef.current);

      ctx.shadowColor = '#FF6B00';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#FF6B00';

      // Wheels
      ctx.fillStyle = '#111';
      ctx.fillRect(-carW / 2 - 2, -carH / 2 + 5, 2, 8);
      ctx.fillRect(carW / 2, -carH / 2 + 5, 2, 8);
      ctx.fillRect(-carW / 2 - 2, carH / 2 - 13, 2, 8);
      ctx.fillRect(carW / 2, carH / 2 - 13, 2, 8);

      // Chassis
      ctx.fillStyle = '#FF6B00';
      ctx.fillRect(-carW / 2, -carH / 2, carW, carH);

      // Windows
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(-carW / 2 + 2, -carH / 4, carW - 4, carH / 2);

      ctx.restore();

      // Physics and game update details
      if (gameState === 'playing') {
        sirenPhaseRef.current += 0.15;

        // 1. Player driving physics
        let accelerate = false;
        let reverse = false;

        if (keysPressedRef.current['w'] || keysPressedRef.current['arrowup']) {
          speedRef.current = Math.min(maxSpeed, speedRef.current + 0.12);
          accelerate = true;
          // Spawn faint exhaust sparks
          if (Math.random() > 0.8) {
            sparksRef.current.push({
              x: xRef.current - Math.cos(angleRef.current) * 15,
              y: yRef.current - Math.sin(angleRef.current) * 15,
              vx: -Math.cos(angleRef.current) * 2,
              vy: -Math.sin(angleRef.current) * 2,
              color: 'rgba(255, 255, 255, 0.3)',
              size: 2,
              alpha: 0.5,
            });
          }
        }
        if (keysPressedRef.current['s'] || keysPressedRef.current['arrowdown']) {
          speedRef.current = Math.max(-maxSpeed * 0.5, speedRef.current - 0.1);
          reverse = true;
        }

        // Steering angle adjustment
        if (keysPressedRef.current['a'] || keysPressedRef.current['arrowleft']) {
          if (Math.abs(speedRef.current) > 0.3) {
            const steeringDir = speedRef.current > 0 ? -1 : 1;
            angleRef.current += 0.065 * steeringDir;
          }
        }
        if (keysPressedRef.current['d'] || keysPressedRef.current['arrowright']) {
          if (Math.abs(speedRef.current) > 0.3) {
            const steeringDir = speedRef.current > 0 ? 1 : -1;
            angleRef.current += 0.065 * steeringDir;
          }
        }

        // Apply friction when not accelerating
        if (!accelerate && !reverse) {
          speedRef.current *= 0.94;
        }

        const vx = Math.cos(angleRef.current) * speedRef.current;
        const vy = Math.sin(angleRef.current) * speedRef.current;

        const nextX = xRef.current + vx;
        const nextY = yRef.current + vy;

        // Collision against borders
        if (nextX < 15 || nextX > 465 || nextY < 15 || nextY > 585) {
          speedRef.current *= -0.5;
          damageRef.current = Math.min(100, damageRef.current + 4);
          setDamage(Math.floor(damageRef.current));
          playSynthSound(120, 0.1, 'sawtooth');
          spawnSparks(xRef.current, yRef.current);
        } else {
          // Collision check with building boxes
          let hitBuilding = false;
          buildingsRef.current.forEach((b) => {
            if (
              nextX > b.x - carW / 2 &&
              nextX < b.x + b.w + carW / 2 &&
              nextY > b.y - carH / 2 &&
              nextY < b.y + b.h + carH / 2
            ) {
              hitBuilding = true;
            }
          });

          if (hitBuilding) {
            speedRef.current *= -0.5;
            damageRef.current = Math.min(100, damageRef.current + 8);
            setDamage(Math.floor(damageRef.current));
            playSynthSound(120, 0.15, 'sawtooth');
            spawnSparks(xRef.current, yRef.current);
          } else {
            xRef.current = nextX;
            yRef.current = nextY;
          }
        }

        if (damageRef.current >= 100) {
          triggerGameOver();
        }

        // 2. Cash collection
        cashRef.current.forEach((c) => {
          if (!c.active) return;
          const dist = Math.hypot(c.x - xRef.current, c.y - yRef.current);
          if (dist < 18) {
            c.active = false;
            scoreRef.current += 500;
            setScore(scoreRef.current);
            playSynthSound(900, 0.15, 'sine');
            
            // Heat scale trigger
            if (scoreRef.current > 0 && scoreRef.current % 1500 === 0) {
              const nextHeat = Math.min(5, heatLevelRef.current + 1);
              heatLevelRef.current = nextHeat;
              setHeat(nextHeat);
              playSynthSound(500, 0.4, 'sine', 800);
            }

            spawnOneCash();
          }
        });

        // 3. Move Police Patrol units
        policeRef.current.forEach((cop) => {
          if (!cop.active) return;

          const targetAngle = Math.atan2(yRef.current - cop.y, xRef.current - cop.x);
          let angleDiff = targetAngle - cop.angle;
          angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
          cop.angle += angleDiff * 0.05;

          cop.vx = Math.cos(cop.angle) * cop.speed;
          cop.vy = Math.sin(cop.angle) * cop.speed;

          cop.x += cop.vx;
          cop.y += cop.vy;

          // Collide with buildings
          buildingsRef.current.forEach((b) => {
            if (
              cop.x > b.x - carW / 2 &&
              cop.x < b.x + b.w + carW / 2 &&
              cop.y > b.y - carH / 2 &&
              cop.y < b.y + b.h + carH / 2
            ) {
              cop.angle += Math.PI * 0.35;
            }
          });

          // Collide with player
          const dist = Math.hypot(cop.x - xRef.current, cop.y - yRef.current);
          if (dist < 22) {
            damageRef.current = Math.min(100, damageRef.current + 12);
            setDamage(Math.floor(damageRef.current));
            
            cop.x -= Math.cos(cop.angle) * 30;
            cop.y -= Math.sin(cop.angle) * 30;
            speedRef.current *= -0.3;

            playSynthSound(100, 0.25, 'sawtooth');
            spawnSparks(xRef.current, yRef.current);
            if (damageRef.current >= 100) {
              triggerGameOver();
            }
          }
        });

        // 4. Spawn Police based on Heat level
        const maxCops = heatLevelRef.current;
        const activeCops = policeRef.current.filter((c) => c.active).length;
        const nowMs = performance.now();

        if (activeCops < maxCops && nowMs - lastPoliceSpawnTimeRef.current > 4000) {
          let sx = 0;
          let sy = 0;
          if (Math.random() > 0.5) {
            sx = Math.random() > 0.5 ? 20 : 460;
            sy = Math.random() * 600;
          } else {
            sx = Math.random() * 480;
            sy = Math.random() > 0.5 ? 20 : 580;
          }

          policeRef.current.push({
            x: sx,
            y: sy,
            angle: 0,
            speed: 1.8 + heatLevelRef.current * 0.35 + (Math.random() * 0.6),
            vx: 0,
            vy: 0,
            active: true,
            type: heatLevelRef.current >= 3 ? 'interceptor' : 'patrol',
            sirenColor: '#3B82F6',
          });
          lastPoliceSpawnTimeRef.current = nowMs;
        }
      }

      // Overlays
      if (gameState === 'start') {
        ctx.fillStyle = 'rgba(3, 6, 15, 0.88)';
        ctx.fillRect(0, 0, 480, 600);
        ctx.fillStyle = '#FFF';
        ctx.font = '22px var(--font-headings), Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CITY HEIST CHASE', 240, 230);
        ctx.font = '14px var(--font-body), Arial';
        ctx.fillStyle = 'var(--text-secondary)';
        ctx.fillText('Drive: WASD / Arrows. Handbrake: SPACE.', 240, 265);
        ctx.fillText('Collect cash piles ($) to raise score & heat.', 240, 290);
        ctx.fillText('Avoid crashing into buildings or police units.', 240, 315);
        ctx.fillText('Press SPACE or Click to Start', 240, 355);
      } else if (gameState === 'paused') {
        ctx.fillStyle = 'rgba(3, 6, 15, 0.75)';
        ctx.fillRect(0, 0, 480, 600);
        ctx.fillStyle = '#FF6B00';
        ctx.font = '24px var(--font-headings), Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CHASE PAUSED', 240, 280);
        ctx.font = '14px var(--font-body), Arial';
        ctx.fillStyle = '#FFF';
        ctx.fillText('Press SPACE to Resume', 240, 320);
      } else if (gameState === 'gameover') {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.fillRect(0, 0, 480, 600);
        ctx.fillStyle = 'rgba(3, 6, 15, 0.88)';
        ctx.fillRect(40, 180, 400, 240);

        ctx.strokeStyle = '#FF6B00';
        ctx.lineWidth = 2;
        ctx.strokeRect(40, 180, 400, 240);

        ctx.fillStyle = '#EF4444';
        ctx.font = '26px var(--font-headings), Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BUSTED! CAR EXPLODED', 240, 245);

        ctx.fillStyle = '#FFF';
        ctx.font = '16px var(--font-body), Arial';
        ctx.fillText(`Loot Collected: $${scoreRef.current}`, 240, 295);
        ctx.fillText(`All-Time Best: $${highScore}`, 240, 325);
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
      playSynthSound(300, 0.1, 'sine');
    } else if (action === 'steer-left') {
      angleRef.current -= 0.35;
    } else if (action === 'steer-right') {
      angleRef.current += 0.35;
    } else if (action === 'handbrake') {
      speedRef.current *= 0.45;
      playSynthSound(200, 0.1, 'sawtooth');
      skidMarksRef.current.push({ x: xRef.current, y: yRef.current, alpha: 0.8 });
    }
  };

  const handleCanvasClick = () => {
    if (gameState === 'start' || gameState === 'gameover') {
      startGame();
    }
  };

  const statusText = gameState === 'start' ? 'READY' : gameState === 'playing' ? `HEAT LEVEL: ${heat}` : gameState === 'paused' ? 'PAUSED' : 'BUSTED';

  const touchControls = (
    <>
      <button onClick={() => handleTouchDrive('steer-left')} className="arcade-touch-btn interactive">◀ Steer L</button>
      <button onClick={() => handleTouchDrive('accelerate')} className="arcade-touch-btn interactive" style={{ borderColor: '#FF6B00', color: '#FF6B00' }}>⛽ ACCEL</button>
      <button onClick={() => handleTouchDrive('handbrake')} className="arcade-touch-btn interactive">🛑 BRAKE</button>
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
        subtitle={`${GAME_META.genre} • Heat Level: ${heat}`}
        accent={GAME_META.accent}
        score={score}
        highScore={highScore}
        statusText={`${statusText} (Car Damage: ${damage}%)`}
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
