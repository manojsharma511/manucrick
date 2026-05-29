export function HowToPlay() {
  const steps = [
    { num: '1', title: 'Choose Style', desc: 'Click "Play Now" and select your difficulty setting.' },
    { num: '2', title: 'Watch Run-up', desc: 'Follow the bowler as they approach the pitch creases.' },
    { num: '3', title: 'Timing Strike', desc: 'Press Spacebar or Tap the screen when the ball hits the green spot.' },
    { num: '4', title: 'Collect Runs', desc: 'Secure boundaries (4s & 6s) while avoiding getting clean bowled.' },
    { num: '5', title: 'Top Leaderboard', desc: 'Record your score in localStorage and challenge players.' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '920px',
        margin: '60px auto 20px',
        position: 'relative',
      }}
      className="scroll-animate"
    >
      <h3
        style={{
          fontFamily: 'var(--font-headings)',
          fontSize: '2.6rem',
          color: '#FFFFFF',
          marginBottom: '45px',
          letterSpacing: '2.5px',
          textTransform: 'uppercase',
          position: 'relative',
        }}
      >
        How to Play
        <span
          style={{
            position: 'absolute',
            bottom: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60px',
            height: '3px',
            backgroundColor: 'var(--primary)',
            boxShadow: '0 0 8px var(--primary)',
          }}
        />
      </h3>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          width: '100%',
          position: 'relative',
          flexWrap: 'wrap',
          gap: '30px',
        }}
      >
        {/* Connection Line */}
        <div
          style={{
            position: 'absolute',
            top: '33px',
            left: '8%',
            width: '84%',
            height: '2px',
            borderTop: '2.5px dashed rgba(0, 255, 135, 0.25)',
            zIndex: 1,
          }}
          className="timeline-line"
        />

        {steps.map((step, idx) => (
          <div
            key={idx}
            style={{
              flex: 1,
              minWidth: '150px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              zIndex: 2,
              position: 'relative',
            }}
          >
            {/* Timeline ball */}
            <div
              style={{
                width: '66px',
                height: '66px',
                borderRadius: '50%',
                backgroundColor: '#050A18',
                border: '3px solid var(--primary)',
                boxShadow: '0 0 16px rgba(0, 255, 135, 0.3)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontFamily: 'var(--font-headings)',
                fontSize: '1.9rem',
                color: 'var(--primary)',
                marginBottom: '18px',
                transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
                userSelect: 'none',
              }}
              className="timeline-node interactive"
            >
              {step.num}
            </div>

            <h4
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '1.25rem',
                color: '#FFFFFF',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              {step.title}
            </h4>
            <p
              style={{
                fontSize: '0.92rem',
                color: 'var(--text-secondary)',
                padding: '0 5px',
                lineHeight: '1.4',
              }}
            >
              {step.desc}
            </p>
          </div>
        ))}
      </div>

      <style>{`
        .timeline-node:hover {
          transform: scale(1.15) rotate(360deg);
          border-color: var(--secondary);
          box-shadow: 0 0 20px rgba(255, 107, 0, 0.6);
          color: var(--secondary);
        }

        @media (max-width: 768px) {
          .timeline-line {
            display: none !important;
          }
          .timeline-node {
            width: 58px !important;
            height: 58px !important;
            font-size: 1.6rem !important;
          }
        }
      `}</style>
    </div>
  );
}
