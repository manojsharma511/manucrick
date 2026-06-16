import type { ReactNode } from 'react';

interface ArcadeFullscreenShellProps {
  title: string;
  subtitle: string;
  accent: string;
  score: number;
  highScore: number;
  statusText: string;
  isPaused: boolean;
  controls: string[];
  onPauseToggle: () => void;
  onRestart: () => void;
  onExit: () => void;
  children: ReactNode;
  touchControls?: ReactNode;
}

export function ArcadeFullscreenShell({
  title,
  subtitle,
  accent,
  score,
  highScore,
  statusText,
  isPaused,
  controls,
  onPauseToggle,
  onRestart,
  onExit,
  children,
  touchControls,
}: ArcadeFullscreenShellProps) {
  return (
    <div className="arcade-shell-overlay">
      <div className="arcade-shell-topbar" style={{ borderColor: `${accent}66` }}>
        <div className="arcade-shell-heading">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <div className="arcade-shell-live-stats">
          <div>
            <span className="label">Score</span>
            <strong style={{ color: accent }}>{score}</strong>
          </div>
          <div>
            <span className="label">Best</span>
            <strong>{highScore}</strong>
          </div>
          <div>
            <span className="label">Status</span>
            <strong>{statusText}</strong>
          </div>
        </div>

        <div className="arcade-shell-actions">
          <button onClick={onPauseToggle} className="interactive">
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button onClick={onRestart} className="interactive">
            🔄 Restart
          </button>
          <button onClick={onExit} className="interactive danger">
            ✕ Exit
          </button>
        </div>
      </div>

      <div className="arcade-shell-main">{children}</div>

      <div className="arcade-shell-bottom">
        <div className="arcade-controls-list">
          {controls.map((control) => (
            <span key={control}>{control}</span>
          ))}
        </div>
        {touchControls ? <div className="arcade-touch-controls">{touchControls}</div> : null}
      </div>
    </div>
  );
}
