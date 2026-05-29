import { useRef, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({});
  const [glowStyle, setGlowStyle] = useState<CSSProperties>({});

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((centerY - y) / centerY) * 12; // Max 12 deg tilt
    const rotateY = ((x - centerX) / centerX) * 12;

    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`,
      transition: 'transform 0.05s ease-out, box-shadow 0.3s ease',
      boxShadow: '0 16px 36px rgba(0, 255, 135, 0.2)',
      borderColor: 'var(--primary)',
    });

    setGlowStyle({
      background: `radial-gradient(circle at ${x}px ${y}px, rgba(0, 255, 135, 0.15) 0%, transparent 65%)`,
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)',
      transition: 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s ease, border-color 0.3s ease',
    });
    setGlowStyle({});
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="glass-panel scroll-animate"
      style={{
        padding: '36px 24px',
        textAlign: 'center',
        flex: 1,
        minWidth: '260px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'none',
        ...style,
      }}
    >
      {/* Cursor spotlight layer */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1,
          ...glowStyle,
        }}
      />

      <div
        className="card-icon"
        style={{
          fontSize: '3.2rem',
          marginBottom: '18px',
          zIndex: 2,
          transition: 'transform 0.3s ease-in-out',
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          fontSize: '1.9rem',
          marginBottom: '10px',
          zIndex: 2,
          color: '#FFFFFF',
          textShadow: '0 2px 5px rgba(0,0,0,0.6)',
          letterSpacing: '1px',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: '1.02rem',
          zIndex: 2,
          color: 'var(--text-secondary)',
          lineHeight: '1.5',
        }}
      >
        {description}
      </p>

      <style>{`
        .glass-panel:hover .card-icon {
          transform: scale(1.25) translateY(-6px);
          animation: cardIconBounce 1s infinite alternate ease-in-out;
        }

        @keyframes cardIconBounce {
          0% { transform: scale(1.25) translateY(-6px); }
          100% { transform: scale(1.25) translateY(-14px); }
        }
      `}</style>
    </div>
  );
}
