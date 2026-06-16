import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { ArcadeFullscreenShell } from './ArcadeFullscreenShell';
import { getBestScoreForGame, markGameSessionStarted, persistArcadeGameResult } from './scoreHelpers';
import { ARCADE_GAME_MAP } from '../../data/arcadeGames';

const GAME_META = ARCADE_GAME_MAP['bike-racing'];

interface TrafficCar {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  color: string;
  emoji: string;
  passed: boolean;
}

interface NitroItem {
  x: number;
  y: number;
  active: boolean;
  pulse: number;
}

interface ObstacleItem {
  x: number;
  y: number;
  type: 'slick' | 'barrier';
  active: boolean;
}

interface VisualFeedback {
  text: string;
  x: number;
  y: number;
  alpha: number;
  color: string;
}

interface WindStreak {
  x: number;
  y: number;
  length: number;
  speed: number;
}

export default function BikeRacingGame({ onExit, onSessionRecorded }: { onExit: () => void; onSessionRecorded: () => void }) {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'paused' | 'gameover'>('start');
  const [nitroGauge, setNitroGauge] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loopRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const startedAtRef = useRef(0);

  // Bike position and control refs
  const bikeXRef = useRef(240);
  const bikeSpeedXRef = useRef(0);
  const steeringRef = useRef<'left' | 'right' | null>(null);
  const leanAngleRef = useRef(0); // Lean angle for rider visual tilt

  const trafficRef = useRef<TrafficCar[]>([]);
  const nitrosRef = useRef<NitroItem[]>([]);
  const obstaclesRef = useRef<ObstacleItem[]>([]);
  const feedbacksRef = useRef<VisualFeedback[]>([]);
  const windStreaksRef = useRef<WindStreak[]>([]);

  const lastSpawnTimeRef = useRef(0);
  const speedScaleRef = useRef(1.0);
  const isBoostingRef = useRef(false);
  const nitroChargeRef = useRef(50);
  const roadOffsetRef = useRef(0);
  const skiddingTimeRef = useRef(0);

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
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    
    osc.start();
    osc.stop(now + duration);
  };

  useEffect(() => {
    const best = getBestScoreForGame(GAME_META.id);
    setHighScore(best);
    
    // Spawn wind streaks for motion
    windStreaksRef.current = Array.from({ length: 10 }).map(() => ({
      x: 60 + Math.random() * 360,
      y: Math.random() * 600,
      length: 20 + Math.random() * 40,
      speed: 12 + Math.random() * 8,
    }));
  }, []);

  const startGame = () => {
    initAudio();
    playSynthSound(440, 0.15, 'sine');
    markGameSessionStarted(GAME_META.id);
    setScore(0);
    scoreRef.current = 0;
    startedAtRef.current = Date.now();
    bikeXRef.current = 240;
    bikeSpeedXRef.current = 0;
    leanAngleRef.current = 0;
    trafficRef.current = [];
    nitrosRef.current = [];
    obstaclesRef.current = [];
    feedbacksRef.current = [];
    lastSpawnTimeRef.current = 0;
    speedScaleRef.current = 1.0;
    isBoostingRef.current = false;
    nitroChargeRef.current = 50;
    setNitroGauge(50);
    skiddingTimeRef.current = 0;
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
    playSynthSound(100, 0.5, 'sawtooth', 30);
    setGameState('gameover');
    persistArcadeGameResult(GAME_META, scoreRef.current, startedAtRef.current, onSessionRecorded);
    const best = getBestScoreForGame(GAME_META.id);
    setHighScore(best);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      steeringRef.current = 'left';
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
      steeringRef.current = 'right';
    } else if (e.key === 'Shift') {
      if (nitroChargeRef.current > 10 && gameState === 'playing') {
        isBoostingRef.current = true;
        playSynthSound(600, 0.25, 'sine', 1200);
      }
    } else if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      togglePause();
    }
  };

  const handleKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'ArrowLeft' || e.key === 'a') && steeringRef.current === 'left') {
      steeringRef.current = null;
    } else if ((e.key === 'ArrowRight' || e.key === 'd') && steeringRef.current === 'right') {
      steeringRef.current = null;
    } else if (e.key === 'Shift') {
      isBoostingRef.current = false;
    }
  };

  const triggerBoost = () => {
    if (nitroChargeRef.current > 10 && gameState === 'playing') {
      isBoostingRef.current = true;
      playSynthSound(600, 0.2, 'sine', 1200);
      setTimeout(() => {
        isBoostingRef.current = false;
      }, 1500);
    }
  };

  // Canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bikeWidth = 24;
    const bikeHeight = 62;
    const playerY = 500;

    const render = () => {
      // Draw background
      ctx.fillStyle = '#090816';
      ctx.fillRect(0, 0, 480, 600);

      // Highway lanes
      ctx.fillStyle = '#1B1A30';
      ctx.fillRect(50, 0, 380, 600);

      // Side glow barriers
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(50, 0);
      ctx.lineTo(50, 600);
      ctx.moveTo(430, 0);
      ctx.lineTo(430, 600);
      ctx.stroke();

      // Dashed lane lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.setLineDash([20, 30]);
      ctx.lineDashOffset = -roadOffsetRef.current;
      ctx.beginPath();
      ctx.moveTo(176, 0);
      ctx.lineTo(176, 600);
      ctx.moveTo(303, 0);
      ctx.lineTo(303, 600);
      ctx.stroke();
      ctx.setLineDash([]);

      const scrollSpeed = isBoostingRef.current ? 13 : 6.5;
      if (gameState === 'playing') {
        roadOffsetRef.current = (roadOffsetRef.current + scrollSpeed * speedScaleRef.current) % 50;
      }

      // Draw wind streaks for velocity indicators
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.2;
      windStreaksRef.current.forEach((str) => {
        ctx.beginPath();
        ctx.moveTo(str.x, str.y);
        ctx.lineTo(str.x, str.y + str.length);
        ctx.stroke();

        if (gameState === 'playing') {
          str.y += str.speed * (isBoostingRef.current ? 1.8 : 1.0);
          if (str.y > 620) {
            str.y = -60;
            str.x = 60 + Math.random() * 360;
          }
        }
      });

      // Physics of bike steering
      if (gameState === 'playing') {
        let steerStrength = skiddingTimeRef.current > 0 ? 1.5 : 5.5;
        if (skiddingTimeRef.current > 0) {
          skiddingTimeRef.current -= 1;
        }

        if (steeringRef.current === 'left') {
          bikeSpeedXRef.current = -steerStrength;
          leanAngleRef.current = Math.max(-0.25, leanAngleRef.current - 0.04);
        } else if (steeringRef.current === 'right') {
          bikeSpeedXRef.current = steerStrength;
          leanAngleRef.current = Math.min(0.25, leanAngleRef.current + 0.04);
        } else {
          bikeSpeedXRef.current *= 0.75;
          leanAngleRef.current *= 0.75; // Return to center
        }

        bikeXRef.current += bikeSpeedXRef.current;

        // Boundaries
        if (bikeXRef.current < 65) {
          bikeXRef.current = 65;
          bikeSpeedXRef.current = 0;
        }
        if (bikeXRef.current > 415) {
          bikeXRef.current = 415;
          bikeSpeedXRef.current = 0;
        }

        // Handle nitro consumption
        if (isBoostingRef.current) {
          nitroChargeRef.current = Math.max(0, nitroChargeRef.current - 0.6);
          setNitroGauge(Math.floor(nitroChargeRef.current));
          if (nitroChargeRef.current <= 0) {
            isBoostingRef.current = false;
          }
        } else {
          nitroChargeRef.current = Math.min(100, nitroChargeRef.current + 0.05);
          setNitroGauge(Math.floor(nitroChargeRef.current));
        }
      }

      // Draw exhaust particles (blue flames)
      if (gameState === 'playing') {
        ctx.save();
        ctx.shadowColor = isBoostingRef.current ? '#00FFFF' : '#10B981';
        ctx.shadowBlur = 12;
        ctx.fillStyle = isBoostingRef.current ? '#00FFFF' : '#10B981';
        const flameLength = isBoostingRef.current ? 30 : 15;
        ctx.beginPath();
        ctx.moveTo(bikeXRef.current - 3, playerY + bikeHeight / 2);
        ctx.lineTo(bikeXRef.current + 3, playerY + bikeHeight / 2);
        ctx.lineTo(bikeXRef.current + (Math.random() * 4 - 2), playerY + bikeHeight / 2 + flameLength);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Draw Bike Player with leaning rider representation
      ctx.save();
      ctx.translate(bikeXRef.current, playerY);
      ctx.rotate(leanAngleRef.current); // Visual Tilt rotation

      ctx.shadowColor = '#10B981';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#10B981';

      // Tires
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(-4, -bikeHeight / 2, 8, 12); // Front tire
      ctx.fillRect(-4, bikeHeight / 2 - 12, 8, 12); // Rear tire

      // Frame
      ctx.fillStyle = '#10B981';
      ctx.fillRect(-bikeWidth / 2, -bikeHeight / 2 + 10, bikeWidth, bikeHeight - 20);

      // Handlebars (Turning slightly)
      ctx.fillStyle = '#6B7280';
      const handleOffset = steeringRef.current === 'left' ? -2 : steeringRef.current === 'right' ? 2 : 0;
      ctx.fillRect(-bikeWidth / 2 - 4 + handleOffset, -bikeHeight / 2 + 14, bikeWidth + 8, 3);

      // Rider body (Leather jacket)
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();

      // Orange Helmet
      ctx.fillStyle = '#FF6B00';
      ctx.beginPath();
      ctx.arc(0, -9, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Draw Nitro pickups (Diamond pulse animation)
      nitrosRef.current.forEach((n) => {
        if (!n.active) return;
        n.pulse = (n.pulse + 0.1) % (Math.PI * 2);
        const sizeOffset = Math.sin(n.pulse) * 3;

        ctx.save();
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#00FFFF';
        ctx.beginPath();
        // Pulsing diamond shape
        ctx.moveTo(n.x, n.y - 10 - sizeOffset);
        ctx.lineTo(n.x + 8 + sizeOffset, n.y);
        ctx.lineTo(n.x, n.y + 10 + sizeOffset);
        ctx.lineTo(n.x - 8 - sizeOffset, n.y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('N', n.x, n.y + 3);
        ctx.restore();
      });

      // Draw Obstacles
      obstaclesRef.current.forEach((obs) => {
        if (!obs.active) return;
        ctx.save();
        if (obs.type === 'slick') {
          // Reflective oil puddle using radial gradient
          const slickGrad = ctx.createRadialGradient(obs.x, obs.y, 2, obs.x, obs.y, 22);
          slickGrad.addColorStop(0, '#00E5FF');
          slickGrad.addColorStop(0.5, 'rgba(0, 80, 255, 0.45)');
          slickGrad.addColorStop(1, 'rgba(0,0,0,0)');
          
          ctx.fillStyle = slickGrad;
          ctx.beginPath();
          ctx.ellipse(obs.x, obs.y, 24, 13, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Barrier
          ctx.fillStyle = '#EF4444';
          ctx.shadowColor = '#EF4444';
          ctx.shadowBlur = 8;
          ctx.fillRect(obs.x - 22, obs.y - 8, 44, 16);
          ctx.strokeStyle = '#FFF';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(obs.x - 22, obs.y - 8, 44, 16);
          ctx.fillStyle = '#FFF';
          ctx.font = '9px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('🚧', obs.x, obs.y + 4);
        }
        ctx.restore();
      });

      // Draw Traffic Cars
      trafficRef.current.forEach((car) => {
        ctx.save();
        ctx.shadowColor = car.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = car.color;
        ctx.fillRect(car.x - car.width / 2, car.y - car.height / 2, car.width, car.height);
        
        ctx.fillStyle = '#000';
        ctx.fillRect(car.x - car.width / 2 + 3, car.y - car.height / 2 + 10, car.width - 6, 12);
        
        ctx.fillStyle = '#FFF';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(car.emoji, car.x, car.y + 4);
        ctx.restore();
      });

      // Draw Visual Feedbacks
      feedbacksRef.current.forEach((fb, idx) => {
        ctx.save();
        ctx.globalAlpha = fb.alpha;
        ctx.fillStyle = fb.color;
        ctx.font = 'bold 15px var(--font-headings), Arial';
        ctx.textAlign = 'center';
        ctx.fillText(fb.text, fb.x, fb.y);
        ctx.restore();

        fb.y -= 1.5;
        fb.alpha -= 0.02;
        if (fb.alpha <= 0) {
          feedbacksRef.current.splice(idx, 1);
        }
      });

      // Update Game State details
      if (gameState === 'playing') {
        const now = performance.now();

        // Accumulate Score
        let multiplier = isBoostingRef.current ? 3.0 : 1.0;
        scoreRef.current += 0.08 * speedScaleRef.current * multiplier;
        setScore(Math.floor(scoreRef.current));

        speedScaleRef.current = 1.0 + Math.floor(scoreRef.current / 40) * 0.12;

        // Spawns
        const spawnDelay = Math.max(700, 1600 - (speedScaleRef.current * 120));
        if (now - lastSpawnTimeRef.current > spawnDelay) {
          const rand = Math.random();
          const roadX = 75 + Math.random() * 330;

          if (rand < 0.15) {
            nitrosRef.current.push({ x: roadX, y: -20, active: true, pulse: 0 });
          } else if (rand < 0.35) {
            obstaclesRef.current.push({
              x: roadX,
              y: -20,
              type: Math.random() > 0.5 ? 'slick' : 'barrier',
              active: true,
            });
          } else {
            const emojis = ['🚗', '🚕', '🚙', '🚓'];
            const colors = ['#A855F7', '#EC4899', '#3B82F6', '#F59E0B'];
            const colorIdx = Math.floor(Math.random() * colors.length);
            trafficRef.current.push({
              x: roadX,
              y: -50,
              width: 38,
              height: 60,
              speed: (2 + Math.random() * 2) * speedScaleRef.current,
              color: colors[colorIdx],
              emoji: emojis[colorIdx % emojis.length],
              passed: false,
            });
          }
          lastSpawnTimeRef.current = now;
        }

        // Check Nitro pickups
        nitrosRef.current.forEach((n) => {
          if (!n.active) return;
          n.y += scrollSpeed;
          const dist = Math.hypot(n.x - bikeXRef.current, n.y - playerY);
          if (dist < 22) {
            n.active = false;
            nitroChargeRef.current = Math.min(100, nitroChargeRef.current + 30);
            setNitroGauge(Math.floor(nitroChargeRef.current));
            feedbacksRef.current.push({ text: '+NITRO CHARGED ⚡', x: bikeXRef.current, y: playerY - 40, alpha: 1.0, color: '#00FFFF' });
            playSynthSound(700, 0.1, 'sine');
          }
        });

        // Check Obstacles
        obstaclesRef.current.forEach((obs) => {
          if (!obs.active) return;
          obs.y += scrollSpeed;

          const dist = Math.hypot(obs.x - bikeXRef.current, obs.y - playerY);
          if (dist < 25) {
            obs.active = false;
            if (obs.type === 'slick') {
              skiddingTimeRef.current = 60;
              feedbacksRef.current.push({ text: 'SKIDDING! 💦', x: bikeXRef.current, y: playerY - 40, alpha: 1.0, color: '#00E5FF' });
              playSynthSound(220, 0.3, 'sawtooth');
            } else {
              triggerGameOver();
            }
          }
        });

        // Traffic update
        trafficRef.current.forEach((car) => {
          car.y += car.speed + (isBoostingRef.current ? 4 : 0);

          const dist = Math.hypot(car.x - bikeXRef.current, car.y - playerY);
          if (dist < 26) {
            triggerGameOver();
          } else if (!car.passed && car.y > playerY - 30 && car.y < playerY + 30) {
            const lateralDist = Math.abs(car.x - bikeXRef.current);
            if (lateralDist < 35) {
              car.passed = true;
              scoreRef.current += 150;
              feedbacksRef.current.push({ text: 'NEAR MISS! +150 🔥', x: bikeXRef.current, y: playerY - 40, alpha: 1.0, color: '#FFD700' });
              playSynthSound(900, 0.05, 'sine');
            }
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
        ctx.fillText('STREET BIKE RUSH', 240, 230);
        ctx.font = '14px var(--font-body), Arial';
        ctx.fillStyle = 'var(--text-secondary)';
        ctx.fillText('Steer continuous. Collect NITRO diamond cores.', 240, 265);
        ctx.fillText('Dodge barriers and weave close to traffic for Near Miss scores!', 240, 290);
        ctx.fillText('Press SPACE or Click to Start', 240, 330);
      } else if (gameState === 'paused') {
        ctx.fillStyle = 'rgba(3, 6, 15, 0.75)';
        ctx.fillRect(0, 0, 480, 600);
        ctx.fillStyle = '#10B981';
        ctx.font = '24px var(--font-headings), Arial';
        ctx.textAlign = 'center';
        ctx.fillText('RUSH PAUSED', 240, 280);
        ctx.font = '14px var(--font-body), Arial';
        ctx.fillStyle = '#FFF';
        ctx.fillText('Press SPACE to Resume', 240, 320);
      } else if (gameState === 'gameover') {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.fillRect(0, 0, 480, 600);
        ctx.fillStyle = 'rgba(3, 6, 15, 0.88)';
        ctx.fillRect(40, 180, 400, 240);

        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2;
        ctx.strokeRect(40, 180, 400, 240);

        ctx.fillStyle = '#EF4444';
        ctx.font = '26px var(--font-headings), Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CRASHED! BUSTED', 240, 245);

        ctx.fillStyle = '#FFF';
        ctx.font = '16px var(--font-body), Arial';
        ctx.fillText(`Your Score: ${scoreRef.current}`, 240, 295);
        ctx.fillText(`All-Time Best: ${highScore}`, 240, 325);
        ctx.font = '12px var(--font-body), Arial';
        ctx.fillStyle = 'var(--text-secondary)';
        ctx.fillText('Press Space or Click to Restart', 240, 375);
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

  // Touch control handlers
  const handleTouchStart = (dir: 'left' | 'right') => {
    steeringRef.current = dir;
  };

  const handleTouchEnd = () => {
    steeringRef.current = null;
  };

  const handleCanvasClick = () => {
    if (gameState === 'start' || gameState === 'gameover') {
      startGame();
    }
  };

  const statusText = gameState === 'start' ? 'READY' : gameState === 'playing' ? (isBoostingRef.current ? '⚡ NITRO BOOST' : 'RUSHING') : gameState === 'paused' ? 'PAUSED' : 'CRASHED';

  const touchControls = (
    <>
      <button
        onMouseDown={() => handleTouchStart('left')}
        onMouseUp={handleTouchEnd}
        onTouchStart={() => handleTouchStart('left')}
        onTouchEnd={handleTouchEnd}
        className="arcade-touch-btn interactive"
      >
        ◀ Steer L
      </button>
      <button onClick={triggerBoost} className="arcade-touch-btn interactive" style={{ borderColor: '#00FFFF', color: '#00FFFF' }}>
        ⚡ BOOST ({nitroGauge}%)
      </button>
      <button
        onMouseDown={() => handleTouchStart('right')}
        onMouseUp={handleTouchEnd}
        onTouchStart={() => handleTouchStart('right')}
        onTouchEnd={handleTouchEnd}
        className="arcade-touch-btn interactive"
      >
        Steer R ▶
      </button>
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
        subtitle={`${GAME_META.genre} • Difficulty: ${GAME_META.difficulty}`}
        accent={GAME_META.accent}
        score={score}
        highScore={highScore}
        statusText={`${statusText} (Nitro: ${Math.floor(nitroChargeRef.current)}%)`}
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
