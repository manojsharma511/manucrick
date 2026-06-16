import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { ArcadeFullscreenShell } from './ArcadeFullscreenShell';
import { getBestScoreForGame, markGameSessionStarted, persistArcadeGameResult } from './scoreHelpers';
import { ARCADE_GAME_MAP } from '../../data/arcadeGames';

const GAME_META = ARCADE_GAME_MAP['zombie-survival'];

interface Zombie {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  size: number;
  angle: number;
  wobbleTick: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
}

interface Pickup {
  x: number;
  y: number;
  type: 'health' | 'ammo';
  active: boolean;
}

interface BloodSplatter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

interface ShellCasing {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  alpha: number;
}

export default function ZombieSurvivalGame({ onExit, onSessionRecorded }: { onExit: () => void; onSessionRecorded: () => void }) {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'paused' | 'gameover'>('start');
  
  const [health, setHealth] = useState(100);
  const [ammo, setAmmo] = useState(60);
  const [wave, setWave] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loopRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const startedAtRef = useRef(0);

  // Player state refs
  const playerXRef = useRef(240);
  const playerYRef = useRef(300);
  const playerHealthRef = useRef(100);
  const playerAmmoRef = useRef(60);
  const playerFacingRef = useRef({ x: 0, y: -1 });
  const walkTickRef = useRef(0);
  const muzzleFlashRef = useRef(0); // If > 0, draw muzzle flash

  const keysPressedRef = useRef<Record<string, boolean>>({});
  const zombiesRef = useRef<Zombie[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const pickupsRef = useRef<Pickup[]>([]);
  const bloodSplattersRef = useRef<BloodSplatter[]>([]);
  const shellCasingsRef = useRef<ShellCasing[]>([]);

  // Wave manager refs
  const waveRef = useRef(1);
  const zombiesKilledRef = useRef(0);
  const lastSpawnTimeRef = useRef(0);
  const lastPickupSpawnTimeRef = useRef(0);

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
    playerXRef.current = 240;
    playerYRef.current = 300;
    playerHealthRef.current = 100;
    playerAmmoRef.current = 60;
    playerFacingRef.current = { x: 0, y: -1 };
    walkTickRef.current = 0;
    muzzleFlashRef.current = 0;
    setHealth(100);
    setAmmo(60);
    zombiesRef.current = [];
    bulletsRef.current = [];
    pickupsRef.current = [];
    bloodSplattersRef.current = [];
    shellCasingsRef.current = [];
    waveRef.current = 1;
    setWave(1);
    zombiesKilledRef.current = 0;
    lastSpawnTimeRef.current = 0;
    lastPickupSpawnTimeRef.current = 0;
    keysPressedRef.current = {};
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
    playSynthSound(80, 0.6, 'sawtooth');
    setGameState('gameover');
    persistArcadeGameResult(GAME_META, scoreRef.current, startedAtRef.current, onSessionRecorded);
    const best = getBestScoreForGame(GAME_META.id);
    setHighScore(best);
  };

  // Input Handling
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    keysPressedRef.current[e.key.toLowerCase()] = true;
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      fireWeapon();
    } else if (e.key === 'p' || e.key === 'P') {
      togglePause();
    }
  };

  const handleKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    keysPressedRef.current[e.key.toLowerCase()] = false;
  };

  const fireWeapon = () => {
    if (gameState !== 'playing') return;
    if (playerAmmoRef.current <= 0) {
      playSynthSound(150, 0.05, 'triangle');
      return;
    }

    playerAmmoRef.current -= 1;
    setAmmo(playerAmmoRef.current);
    initAudio();
    playSynthSound(800, 0.08, 'sawtooth', 300);
    muzzleFlashRef.current = 3; // 3 frames of flash

    const bulletSpeed = 8.5;
    const bulletAngle = Math.atan2(playerFacingRef.current.y, playerFacingRef.current.x);
    bulletsRef.current.push({
      x: playerXRef.current + Math.cos(bulletAngle) * 20,
      y: playerYRef.current + Math.sin(bulletAngle) * 20,
      vx: playerFacingRef.current.x * bulletSpeed,
      vy: playerFacingRef.current.y * bulletSpeed,
      active: true,
    });

    // Eject shell casing to the side
    const shellAngle = bulletAngle - Math.PI / 2 + (Math.random() - 0.5) * 0.4;
    shellCasingsRef.current.push({
      x: playerXRef.current,
      y: playerYRef.current,
      vx: Math.cos(shellAngle) * 2.5,
      vy: Math.sin(shellAngle) * 2.5,
      rot: Math.random() * Math.PI * 2,
      alpha: 1.0,
    });
  };

  // Canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const playerSize = 14;

    const render = () => {
      // Background Grid
      ctx.fillStyle = '#05070F';
      ctx.fillRect(0, 0, 480, 600);

      // Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 480; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 600);
        ctx.stroke();
      }
      for (let y = 0; y < 600; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(480, y);
        ctx.stroke();
      }

      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, 480, 600);

      // Draw Blood Splatters on Ground
      bloodSplattersRef.current.forEach((bl) => {
        ctx.save();
        ctx.globalAlpha = bl.alpha;
        ctx.fillStyle = bl.color;
        ctx.beginPath();
        ctx.arc(bl.x, bl.y, bl.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Shell Casings on Ground
      shellCasingsRef.current.forEach((sh, shIdx) => {
        ctx.save();
        ctx.globalAlpha = sh.alpha;
        ctx.fillStyle = '#FFD700'; // Gold metallic color
        ctx.translate(sh.x, sh.y);
        ctx.rotate(sh.rot);
        ctx.fillRect(-1, -3, 2, 6);
        ctx.restore();
        if (gameState === 'playing') {
          sh.x += sh.vx;
          sh.y += sh.vy;
          sh.vx *= 0.88;
          sh.vy *= 0.88;
          sh.rot += 0.12;
          sh.alpha -= 0.004; // Long lasting on ground
          if (sh.alpha <= 0) shellCasingsRef.current.splice(shIdx, 1);
        }
      });

      // Draw Pickups
      pickupsRef.current.forEach((p) => {
        if (!p.active) return;
        ctx.save();
        ctx.shadowColor = p.type === 'health' ? '#EF4444' : '#FFD700';
        ctx.shadowBlur = 10;
        
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(p.x - 9, p.y - 9, 18, 18);
        ctx.strokeStyle = p.type === 'health' ? '#EF4444' : '#FFD700';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(p.x - 9, p.y - 9, 18, 18);

        ctx.fillStyle = p.type === 'health' ? '#EF4444' : '#FFD700';
        if (p.type === 'health') {
          // Plus sign
          ctx.fillRect(p.x - 1, p.y - 5, 2, 10);
          ctx.fillRect(p.x - 5, p.y - 1, 10, 2);
        } else {
          // Ammo dots
          ctx.fillRect(p.x - 4, p.y - 3, 2, 6);
          ctx.fillRect(p.x - 1, p.y - 3, 2, 6);
          ctx.fillRect(p.x + 2, p.y - 3, 2, 6);
        }
        ctx.restore();
      });

      // Draw Laser Sight Line
      if (gameState === 'playing') {
        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(playerXRef.current, playerYRef.current);
        ctx.lineTo(
          playerXRef.current + playerFacingRef.current.x * 300,
          playerYRef.current + playerFacingRef.current.y * 300
        );
        ctx.stroke();
        ctx.restore();
      }

      // Draw Bullets
      ctx.fillStyle = '#FFD700';
      bulletsRef.current.forEach((b) => {
        if (!b.active) return;
        ctx.save();
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Zombies (Detailed walking animations)
      zombiesRef.current.forEach((z) => {
        ctx.save();
        ctx.translate(z.x, z.y);
        ctx.rotate(z.angle);

        ctx.shadowColor = '#FF0055';
        ctx.shadowBlur = 8;

        // Animated wobbly legs
        ctx.fillStyle = '#1E3A8A'; // Dark blue trousers
        const legWalk = Math.sin(z.wobbleTick) * 4;
        ctx.fillRect(-6, legWalk, 4, 8);
        ctx.fillRect(2, -legWalk, 4, 8);

        // Torso
        ctx.fillStyle = '#065F46'; // Infected dark green shirt
        ctx.fillRect(-7, -8, 14, 16);

        // Head
        ctx.fillStyle = '#6EE7B7'; // Pale green head
        ctx.beginPath();
        ctx.arc(0, -12, 6, 0, Math.PI * 2);
        ctx.fill();

        // Glowing red eyes
        ctx.fillStyle = '#FF3B30';
        ctx.fillRect(-3, -14, 2, 2);
        ctx.fillRect(1, -14, 2, 2);

        // Arms stretched forward
        ctx.fillStyle = '#6EE7B7';
        ctx.fillRect(-6, -20, 3, 12);
        ctx.fillRect(3, -20, 3, 12);

        // Health bar mini indicator above zombie
        ctx.restore();
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(z.x - 12, z.y - 25, 24, 4);
        ctx.fillStyle = '#FF0055';
        ctx.fillRect(z.x - 12, z.y - 25, (z.hp / z.maxHp) * 24, 4);
      });

      // Draw Player (Detailed legs movement)
      ctx.save();
      ctx.translate(playerXRef.current, playerYRef.current);
      const playerAngle = Math.atan2(playerFacingRef.current.y, playerFacingRef.current.x);
      ctx.rotate(playerAngle);

      ctx.shadowColor = '#FFFF00';
      ctx.shadowBlur = 10;

      // Legs cycling
      ctx.fillStyle = '#1E293B';
      const legWalk = Math.sin(walkTickRef.current * 0.3) * 4;
      ctx.fillRect(-6, legWalk + 4, 4, 8);
      ctx.fillRect(2, -legWalk - 10, 4, 8);

      // Torso
      ctx.fillStyle = '#D97706'; // Gold/yellow armor jacket
      ctx.fillRect(-8, -8, 16, 16);

      // Head
      ctx.fillStyle = '#FCD34D';
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();

      // Gun muzzle barrel pointing right
      ctx.fillStyle = '#475569';
      ctx.fillRect(6, -2, 14, 4);

      // Muzzle flash flame gradient
      if (muzzleFlashRef.current > 0) {
        muzzleFlashRef.current -= 1;
        const flashGrad = ctx.createRadialGradient(20, 0, 1, 20, 0, 15);
        flashGrad.addColorStop(0, '#FFF');
        flashGrad.addColorStop(0.3, '#F59E0B');
        flashGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = flashGrad;
        ctx.beginPath();
        ctx.arc(20, 0, 15, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Physics update details
      if (gameState === 'playing') {
        const now = performance.now();

        // 1. Move Player
        let dx = 0;
        let dy = 0;
        if (keysPressedRef.current['w'] || keysPressedRef.current['arrowup']) dy = -2.8;
        if (keysPressedRef.current['s'] || keysPressedRef.current['arrowdown']) dy = 2.8;
        if (keysPressedRef.current['a'] || keysPressedRef.current['arrowleft']) dx = -2.8;
        if (keysPressedRef.current['d'] || keysPressedRef.current['arrowright']) dx = 2.8;

        if (dx !== 0 || dy !== 0) {
          if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
          }
          playerXRef.current += dx;
          playerYRef.current += dy;
          walkTickRef.current += 1; // tick legs swing

          playerFacingRef.current = { x: dx, y: dy };
          const magnitude = Math.hypot(dx, dy);
          playerFacingRef.current.x /= magnitude;
          playerFacingRef.current.y /= magnitude;
        }

        playerXRef.current = Math.min(460, Math.max(20, playerXRef.current));
        playerYRef.current = Math.min(580, Math.max(20, playerYRef.current));

        // 2. Move Bullets
        bulletsRef.current.forEach((b) => {
          b.x += b.vx;
          b.y += b.vy;
          if (b.x < 0 || b.x > 480 || b.y < 0 || b.y > 600) {
            b.active = false;
          }
        });
        bulletsRef.current = bulletsRef.current.filter((b) => b.active);

        // 3. Move Zombies
        zombiesRef.current.forEach((z) => {
          z.wobbleTick += 0.12;
          z.angle = Math.atan2(playerYRef.current - z.y, playerXRef.current - z.x);
          
          const zvx = Math.cos(z.angle) * z.speed;
          const zvy = Math.sin(z.angle) * z.speed;
          z.x += zvx;
          z.y += zvy;

          // Damage player on contact
          const dist = Math.hypot(playerXRef.current - z.x, playerYRef.current - z.y);
          if (dist < playerSize + z.size) {
            playerHealthRef.current = Math.max(0, playerHealthRef.current - 0.28);
            setHealth(Math.floor(playerHealthRef.current));
            if (playerHealthRef.current <= 0) {
              triggerGameOver();
            }
          }
        });

        // 4. Bullets Hit Zombies
        bulletsRef.current.forEach((b) => {
          zombiesRef.current.forEach((z, zIdx) => {
            const hitDist = Math.hypot(b.x - z.x, b.y - z.y);
            if (hitDist < z.size + 4) {
              b.active = false;
              z.hp -= 1;
              playSynthSound(400, 0.05, 'triangle');
              
              // Spawn Blood Splatter particles
              for (let i = 0; i < 6; i++) {
                bloodSplattersRef.current.push({
                  x: z.x,
                  y: z.y,
                  vx: (Math.random() - 0.5) * 5,
                  vy: (Math.random() - 0.5) * 5,
                  color: Math.random() > 0.4 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)', // infected green/red blood mix
                  size: 2 + Math.random() * 4,
                  alpha: 1.0,
                });
              }

              if (z.hp <= 0) {
                zombiesRef.current.splice(zIdx, 1);
                zombiesKilledRef.current += 1;
                scoreRef.current += 10;
                setScore(scoreRef.current);

                if (zombiesKilledRef.current >= waveRef.current * 10) {
                  waveRef.current += 1;
                  setWave(waveRef.current);
                  zombiesKilledRef.current = 0;
                  playSynthSound(500, 0.3, 'sine', 1000);
                }
              }
            }
          });
        });

        // 5. Spawn Zombies
        const spawnInterval = Math.max(600, 3000 - waveRef.current * 250);
        if (now - lastSpawnTimeRef.current > spawnInterval) {
          let sx = 0;
          let sy = 0;
          if (Math.random() > 0.5) {
            sx = Math.random() > 0.5 ? 0 : 480;
            sy = Math.random() * 600;
          } else {
            sx = Math.random() * 480;
            sy = Math.random() > 0.5 ? 0 : 600;
          }

          const maxHp = Math.ceil(waveRef.current * 0.5);
          zombiesRef.current.push({
            x: sx,
            y: sy,
            hp: maxHp,
            maxHp: maxHp,
            speed: 1.0 + Math.min(2.0, waveRef.current * 0.18),
            size: 11 + Math.random() * 4,
            angle: 0,
            wobbleTick: Math.random() * 10,
          });
          lastSpawnTimeRef.current = now;
        }

        // 6. Spawn pickups
        if (now - lastPickupSpawnTimeRef.current > 7000) {
          if (pickupsRef.current.filter((p) => p.active).length < 3) {
            pickupsRef.current.push({
              x: 40 + Math.random() * 400,
              y: 40 + Math.random() * 520,
              type: Math.random() > 0.4 ? 'ammo' : 'health',
              active: true,
            });
            lastPickupSpawnTimeRef.current = now;
          }
        }

        // 7. Check pickup collection
        pickupsRef.current.forEach((p) => {
          if (!p.active) return;
          const dist = Math.hypot(p.x - playerXRef.current, p.y - playerYRef.current);
          if (dist < playerSize + 10) {
            p.active = false;
            initAudio();
            if (p.type === 'health') {
              playerHealthRef.current = Math.min(100, playerHealthRef.current + 25);
              setHealth(Math.floor(playerHealthRef.current));
              playSynthSound(600, 0.15, 'sine');
            } else {
              playerAmmoRef.current = Math.min(120, playerAmmoRef.current + 30);
              setAmmo(playerAmmoRef.current);
              playSynthSound(700, 0.15, 'sine');
            }
          }
        });

        // 8. Update Blood Splatters decay
        bloodSplattersRef.current.forEach((bl, blIdx) => {
          bl.x += bl.vx;
          bl.y += bl.vy;
          bl.vx *= 0.92;
          bl.vy *= 0.92;
          bl.alpha -= 0.003;
          if (bl.alpha <= 0) bloodSplattersRef.current.splice(blIdx, 1);
        });
      }

      // Screen text render overlay
      if (gameState === 'start') {
        ctx.fillStyle = 'rgba(3, 6, 15, 0.85)';
        ctx.fillRect(0, 0, 480, 600);
        ctx.fillStyle = '#FFF';
        ctx.font = '22px var(--font-headings), Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ZOMBIE SURVIVAL ARENA', 240, 230);
        ctx.font = '14px var(--font-body), Arial';
        ctx.fillStyle = 'var(--text-secondary)';
        ctx.fillText('Move: WASD / Arrows. Fire: SPACE.', 240, 270);
        ctx.fillText('Collect HEALTH (red) and AMMO (gold) crates.', 240, 295);
        ctx.fillText('Survive waves as zombies grow faster.', 240, 320);
        ctx.fillText('Press SPACE or Click to Start', 240, 360);
      } else if (gameState === 'paused') {
        ctx.fillStyle = 'rgba(3, 6, 15, 0.75)';
        ctx.fillRect(0, 0, 480, 600);
        ctx.fillStyle = '#FFD700';
        ctx.font = '24px var(--font-headings), Arial';
        ctx.textAlign = 'center';
        ctx.fillText('ARENA PAUSED', 240, 280);
        ctx.font = '14px var(--font-body), Arial';
        ctx.fillStyle = '#FFF';
        ctx.fillText('Press SPACE to Resume', 240, 320);
      } else if (gameState === 'gameover') {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.fillRect(0, 0, 480, 600);
        ctx.fillStyle = 'rgba(3, 6, 15, 0.88)';
        ctx.fillRect(40, 180, 400, 240);

        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(40, 180, 400, 240);

        ctx.fillStyle = '#EF4444';
        ctx.font = '26px var(--font-headings), Arial';
        ctx.textAlign = 'center';
        ctx.fillText('OVERRUN! YOU DIED', 240, 245);

        ctx.fillStyle = '#FFF';
        ctx.font = '16px var(--font-body), Arial';
        ctx.fillText(`Your Score: ${scoreRef.current} (Wave: ${waveRef.current})`, 240, 295);
        ctx.fillText(`All-Time Best: ${highScore}`, 240, 325);
        ctx.font = '12px var(--font-body), Arial';
        ctx.fillStyle = 'var(--text-secondary)';
        ctx.fillText('Press R or Click to Restart', 240, 375);
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
  const handleTouchMove = (x: number, y: number) => {
    if (gameState !== 'playing') return;
    playerXRef.current += x * 3.5;
    playerYRef.current += y * 3.5;
    playerXRef.current = Math.min(460, Math.max(20, playerXRef.current));
    playerYRef.current = Math.min(580, Math.max(20, playerYRef.current));
    
    if (x !== 0 || y !== 0) {
      playerFacingRef.current = { x, y };
      const len = Math.hypot(x, y);
      playerFacingRef.current.x /= len;
      playerFacingRef.current.y /= len;
    }
  };

  const handleCanvasClick = () => {
    if (gameState === 'start' || gameState === 'gameover') {
      startGame();
    } else if (gameState === 'playing') {
      fireWeapon();
    }
  };

  const statusText = gameState === 'start' ? 'READY' : gameState === 'playing' ? `WAVE ${waveRef.current}` : gameState === 'paused' ? 'PAUSED' : 'OVERRUN';

  const touchControls = (
    <>
      <button onClick={() => handleTouchMove(-1, 0)} className="arcade-touch-btn interactive">◀ L</button>
      <button onClick={() => handleTouchMove(0, -1)} className="arcade-touch-btn interactive">▲ U</button>
      <button onClick={() => handleTouchMove(0, 1)} className="arcade-touch-btn interactive">▼ D</button>
      <button onClick={() => handleTouchMove(1, 0)} className="arcade-touch-btn interactive">R ▶</button>
      <button onClick={fireWeapon} className="arcade-touch-btn interactive" style={{ borderColor: '#FF0055', color: '#FF0055' }}>
        🔫 FIRE ({ammo})
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
        subtitle={`${GAME_META.genre} • Wave: ${wave}`}
        accent={GAME_META.accent}
        score={score}
        highScore={highScore}
        statusText={`${statusText} (Health: ${health}% | Ammo: ${ammo})`}
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
