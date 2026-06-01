export function Footer() {
  return (
    <footer
      style={{
        width: '100%',
        padding: '36px 6%',
        backgroundColor: '#03060F',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        position: 'relative',
        zIndex: 5,
        cursor: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          maxWidth: '1100px',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        {/* Copyright info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.9rem', justifyContent: 'center' }}>
          <span>&copy; 2025 ManucricK &bull; Built with ❤️ by <a href="https://manojkumarsharma.vercel.app/" target="_blank" rel="noopener noreferrer" className="interactive footer-link" style={{ color: 'inherit', textDecoration: 'underline', transition: 'color 0.2s', cursor: 'none' }}>Manoj Kumar Sharma</a></span>
          <div
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: 'var(--secondary)',
              position: 'relative',
              animation: 'footerSpinBall 1.8s linear infinite',
              display: 'inline-block',
              boxShadow: '0 0 5px var(--secondary)',
            }}
          >
            {/* Ball Seam */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                width: '1px',
                height: '100%',
                backgroundColor: '#FFFFFF',
                transform: 'translateX(-50%)',
                opacity: 0.6,
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes footerSpinBall {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .footer-link:hover {
          color: var(--primary) !important;
        }
      `}</style>
    </footer>
  );
}
