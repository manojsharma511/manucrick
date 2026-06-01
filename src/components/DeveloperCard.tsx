import type { CSSProperties } from 'react';

interface DeveloperCardProps {
  onToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export function DeveloperCard({ onToast }: DeveloperCardProps) {
  const email = 'manojkumarsharma27096@gmail.com';
  const phone = '6350542691';

  const copyToClipboard = (text: string, type: 'email' | 'phone') => {
    navigator.clipboard.writeText(text);
    onToast(`Copied ${type === 'email' ? 'Email Address' : 'Phone Number'}!`);
  };

  const techTags = ['Java', 'Spring Boot', 'React', 'Liferay DXP', 'Node.js'];

  return (
    <div
      className="glass-panel scroll-animate"
      style={{
        padding: '45px 30px',
        width: '100%',
        maxWidth: '520px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'none',
      }}
    >
      {/* 3D Glowing ring and avatar */}
      <div style={{ position: 'relative', width: '130px', height: '130px', marginBottom: '20px' }}>
        {/* Rotating outer ring */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '130px',
            height: '130px',
            borderRadius: '50%',
            border: '2px solid transparent',
            borderTopColor: 'var(--primary)',
            borderBottomColor: 'var(--secondary)',
            animation: 'ringRotate 3.5s linear infinite',
            boxShadow: '0 0 10px rgba(0, 255, 135, 0.2)',
          }}
        />
        {/* Glow backdrop */}
        <div
          style={{
            position: 'absolute',
            top: '5px',
            left: '5px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,255,135,0.15) 0%, transparent 70%)',
          }}
        />
        {/* Avatar letters "MKS" */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            width: '110px',
            height: '110px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1C1D21 0%, #050A18 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: 'var(--font-headings)',
            fontSize: '2.4rem',
            color: '#FFFFFF',
            letterSpacing: '2px',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.8)',
          }}
        >
          <span style={{ background: 'linear-gradient(45deg, var(--primary) 0%, var(--secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            MKS
          </span>
        </div>
      </div>

      <div style={{ textAlign: 'center', zIndex: 2, width: '100%' }}>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            textTransform: 'uppercase',
            letterSpacing: '2.5px',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            fontWeight: 700,
            marginBottom: '4px',
          }}
        >
          Built with ❤️ by
        </p>
        <h3
          style={{
            fontSize: '2.8rem',
            color: 'var(--primary)',
            textShadow: '0 0 15px rgba(0,255,135,0.45)',
            marginBottom: '6px',
            letterSpacing: '1px',
          }}
        >
          <a href="https://manojkumarsharma.vercel.app/" target="_blank" rel="noopener noreferrer" className="interactive" style={{ color: 'inherit', textDecoration: 'underline', cursor: 'none' }}>
            Manoj Kumar Sharma
          </a>
        </h3>
        
        {/* Badge */}
        <div
          style={{
            display: 'inline-block',
            padding: '3px 14px',
            borderRadius: '20px',
            backgroundColor: 'rgba(0, 255, 135, 0.08)',
            border: '1px solid rgba(0, 255, 135, 0.25)',
            color: '#FFFFFF',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: '0.82rem',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            marginBottom: '24px',
            boxShadow: '0 0 8px rgba(0, 255, 135, 0.1)',
            animation: 'badgePulse 2s infinite alternate ease-in-out',
          }}
        >
          Full Stack Developer
        </div>

        {/* Contacts details */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '100%',
            maxWidth: '420px',
            margin: '0 auto 24px',
            textAlign: 'left',
          }}
        >
          {/* Email row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              padding: '10px 14px',
              transition: 'all 0.2s',
            }}
            className="contact-row"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
              <span style={{ fontSize: '1.1rem' }}>📧</span>
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                {email}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(email, 'email')}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                color: 'var(--primary)',
                padding: '4px 9px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                cursor: 'none',
                transition: 'all 0.2s',
              }}
              className="interactive copy-btn"
            >
              Copy
            </button>
          </div>

          {/* Phone row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              padding: '10px 14px',
              transition: 'all 0.2s',
            }}
            className="contact-row"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.1rem' }}>📱</span>
              <a
                href={`tel:${phone}`}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  cursor: 'none',
                }}
                className="interactive phone-link"
              >
                {phone}
              </a>
            </div>
            <button
              onClick={() => copyToClipboard(phone, 'phone')}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                color: 'var(--secondary)',
                padding: '4px 9px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                cursor: 'none',
                transition: 'all 0.2s',
              }}
              className="interactive copy-btn"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Tech tags */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {techTags.map((tag, i) => (
            <span
              key={tag}
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '6px',
                padding: '5px 12px',
                color: '#E5E7EB',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '0.88rem',
                letterSpacing: '0.5px',
                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                animation: 'devTagFadeIn 0.5s ease-out forwards',
                animationDelay: `${i * 0.08}s`,
                opacity: 0,
              } as CSSProperties}
              className="tech-tag interactive"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ringRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes badgePulse {
          0% { box-shadow: 0 0 5px rgba(0, 255, 135, 0.1); border-color: rgba(0, 255, 135, 0.2); }
          100% { box-shadow: 0 0 14px rgba(0, 255, 135, 0.25); border-color: rgba(0, 255, 135, 0.45); }
        }
        @keyframes devTagFadeIn {
          to { opacity: 1; }
        }
        
        .contact-row:hover {
          border-color: rgba(255,255,255,0.15) !important;
          background-color: rgba(255,255,255,0.04) !important;
        }
        .copy-btn:hover {
          background-color: var(--primary) !important;
          color: #050A18 !important;
          box-shadow: 0 0 8px var(--primary);
        }
        .contact-row:nth-child(2) .copy-btn:hover {
          background-color: var(--secondary) !important;
          color: #050A18 !important;
          box-shadow: 0 0 8px var(--secondary);
        }
        .phone-link:hover {
          color: var(--secondary);
          text-shadow: 0 0 8px rgba(255, 107, 0, 0.4);
        }
        .tech-tag:hover {
          transform: translateY(-3px);
          border-color: var(--primary);
          box-shadow: 0 4px 10px rgba(0, 255, 135, 0.15);
          color: #FFFFFF;
        }
      `}</style>
    </div>
  );
}
