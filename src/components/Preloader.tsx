import { useEffect, useState } from 'react';

interface PreloaderProps {
  onComplete: () => void;
}

export function Preloader({ onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [shouldFadeOut, setShouldFadeOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 1800; // 1.8 seconds loading time

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);

      if (pct < 100) {
        requestAnimationFrame(updateProgress);
      } else {
        setTimeout(() => {
          setShouldFadeOut(true);
          setTimeout(() => {
            onComplete();
          }, 450); // wait for fade duration
        }, 150);
      }
    };

    requestAnimationFrame(updateProgress);
  }, [onComplete]);

  const brandName = 'ManucricK';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#050505',
        zIndex: 20000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: shouldFadeOut ? 0 : 1,
        pointerEvents: shouldFadeOut ? 'none' : 'auto',
        transition: 'opacity 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
      }}
    >
      {/* Animated lights effect behind ball */}
      <div
        style={{
          position: 'absolute',
          width: '250px',
          height: '250px',
          background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          animation: 'preloaderGlowPulse 2.5s infinite alternate ease-in-out',
        }}
      />

      <div style={{ position: 'relative', marginBottom: '35px' }}>
        {/* Spinner ring */}
        <div
          style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            border: '2px solid rgba(245, 158, 11, 0.05)',
            borderTop: '2px solid var(--primary)',
            borderBottom: '2px solid var(--secondary)',
            animation: 'loaderSpin 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite',
          }}
        />
        {/* Center Cricket Ball */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'loaderSpinInverse 2s linear infinite',
          }}
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="var(--secondary)" />
            <path
              d="M12 2C12 2 15 7 15 12C15 17 12 22 12 22"
              stroke="#FFFFFF"
              strokeWidth="1.2"
              strokeDasharray="2 1.5"
              opacity="0.8"
            />
            <path
              d="M12 2C12 2 9 7 9 12C9 17 12 22 12 22"
              stroke="#FFFFFF"
              strokeWidth="1.2"
              strokeDasharray="2 1.5"
              opacity="0.8"
            />
          </svg>
        </div>
      </div>

      {/* Brand logo letter-by-letter */}
      <h1
        style={{
          fontFamily: 'var(--font-headings)',
          fontSize: '5rem',
          letterSpacing: '6px',
          display: 'flex',
          gap: '2px',
          marginBottom: '25px',
          color: '#FFFFFF',
        }}
      >
        {brandName.split('').map((char, index) => (
          <span
            key={index}
            style={{
              display: 'inline-block',
              animation: 'charEntrance 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
              animationDelay: `${index * 0.07}s`,
              opacity: 0,
              transform: 'translateY(30px) scale(0.6)',
              textShadow: '0 0 15px rgba(245, 158, 11, 0.3)',
            }}
          >
            {char}
          </span>
        ))}
      </h1>

      {/* Loading Progress Bar */}
      <div
        style={{
          width: '240px',
          height: '5px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '3px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, var(--secondary) 0%, var(--primary) 100%)',
            boxShadow: '0 0 8px var(--primary)',
            transition: 'width 0.05s linear',
          }}
        />
      </div>

      <div
        style={{
          marginTop: '14px',
          fontFamily: 'var(--font-body)',
          color: 'var(--text-secondary)',
          fontSize: '0.85rem',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          fontWeight: 700,
        }}
      >
        Preparing pitch {Math.round(progress)}%
      </div>

      <style>{`
        @keyframes loaderSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes loaderSpinInverse {
          0% { transform: translate(-50%, -50%) rotate(360deg); }
          100% { transform: translate(-50%, -50%) rotate(0deg); }
        }
        @keyframes preloaderGlowPulse {
          0% { transform: scale(0.9); opacity: 0.5; }
          100% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes charEntrance {
          0% { opacity: 0; transform: translateY(30px) scale(0.6); color: #FFF; }
          80% { color: var(--primary); }
          100% { opacity: 1; transform: translateY(0) scale(1); color: #FFF; }
        }
      `}</style>
    </div>
  );
}
