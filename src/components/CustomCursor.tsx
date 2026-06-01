import { useEffect, useState } from 'react';

export function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Detect touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouch(isTouchDevice);
    if (isTouchDevice) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'A' ||
          target.tagName === 'BUTTON' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'INPUT' ||
          target.closest('a') ||
          target.closest('button') ||
          target.closest('.magnetic-btn') ||
          target.closest('.interactive') ||
          window.getComputedStyle(target).cursor === 'pointer')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isVisible]);

  // Dynamically add/remove body class to hide the default browser cursor only when the custom cursor is visible
  useEffect(() => {
    if (isTouch) return;
    if (isVisible) {
      document.body.classList.add('custom-cursor-active');
    } else {
      document.body.classList.remove('custom-cursor-active');
    }
    return () => {
      document.body.classList.remove('custom-cursor-active');
    };
  }, [isVisible, isTouch]);

  if (isTouch || !isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: `translate(-50%, -50%) scale(${isHovering ? 1.4 : 1})`,
        pointerEvents: 'none',
        zIndex: 999999,
        transition: 'transform 0.1s ease-out',
        willChange: 'transform',
      }}
    >
      {/* Glow effect on hover */}
      {isHovering && (
        <div
          style={{
            position: 'absolute',
            width: '44px',
            height: '44px',
            border: '2.5px solid var(--primary)',
            borderRadius: '50%',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 12px var(--primary)',
            opacity: 0.7,
            animation: 'cursorPulse 1.2s infinite ease-in-out',
          }}
        />
      )}
      {/* Cricket Ball SVG */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: isHovering 
            ? 'drop-shadow(0 0 8px var(--primary))' 
            : 'drop-shadow(0 0 4px rgba(255, 107, 0, 0.6))',
          transition: 'filter 0.15s ease',
        }}
      >
        <circle cx="12" cy="12" r="10" fill="var(--secondary)" />
        <path
          d="M12 2C12 2 15.5 7 15.5 12C15.5 17 12 22 12 22"
          stroke="#FFFFFF"
          strokeWidth="1.2"
          strokeDasharray="2 1.5"
          opacity="0.8"
        />
        <path
          d="M12 2C12 2 8.5 7 8.5 12C8.5 17 12 22 12 22"
          stroke="#FFFFFF"
          strokeWidth="1.2"
          strokeDasharray="2 1.5"
          opacity="0.8"
        />
        <circle cx="9" cy="8" r="2.5" fill="#FFFFFF" opacity="0.35" />
      </svg>
      <style>{`
        @keyframes cursorPulse {
          0% { transform: translate(-50%, -50%) scale(0.85); opacity: 0.7; }
          50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.35; }
          100% { transform: translate(-50%, -50%) scale(0.85); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
