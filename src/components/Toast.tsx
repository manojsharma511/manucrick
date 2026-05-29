import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'warning';
  onClose: () => void;
}

export function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getColors = () => {
    switch (type) {
      case 'success':
        return { border: 'var(--primary)', shadow: 'rgba(0, 255, 135, 0.3)', iconColor: 'var(--primary)' };
      case 'warning':
        return { border: 'var(--secondary)', shadow: 'rgba(255, 107, 0, 0.3)', iconColor: 'var(--secondary)' };
      default:
        return { border: 'var(--accent)', shadow: 'rgba(255, 215, 0, 0.3)', iconColor: 'var(--accent)' };
    }
  };

  const colors = getColors();

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        background: 'rgba(5, 10, 24, 0.9)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '14px 22px',
        zIndex: 10002,
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: `0 8px 32px ${colors.shadow}`,
        animation: 'toastSlideIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        letterSpacing: '0.5px',
      }}
    >
      <span style={{ color: colors.iconColor, fontSize: '18px' }}>🏏</span>
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: '#FFFFFF',
          fontSize: '18px',
          cursor: 'none',
          marginLeft: '8px',
          opacity: 0.6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
        }}
        className="interactive"
      >
        &times;
      </button>
      <style>{`
        @keyframes toastSlideIn {
          0% { transform: translateY(-20px) scale(0.9); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
