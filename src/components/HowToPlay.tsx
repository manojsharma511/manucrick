export function HowToPlay() {
  const steps = [
    { num: '01', title: 'CHOOSE STYLE', desc: 'Select your difficulty and preferred batting gear or bat stance.' },
    { num: '02', title: 'WATCH RUN-UP', desc: "Focus on the bowler's approach and arm release for swing detection." },
    { num: '03', title: 'TIMING STRIKE', desc: 'Click or tap at the peak of the green crease sweet-spot.' },
    { num: '04', title: 'COLLECT RUNS', desc: 'Secure boundary hits while triggering runs manually between creases.' },
    { num: '05', title: 'TOP LEADERBOARD', desc: 'Archive your high scores globally and secure medals in the vault.' },
  ];

  return (
    <section 
      style={{ 
        width: '100%', 
        backgroundColor: 'rgba(14, 14, 14, 0.45)', 
        border: '1px solid rgba(255, 255, 255, 0.04)',
        borderRadius: '16px',
        padding: '60px 40px',
        marginTop: '60px',
        position: 'relative',
        overflow: 'hidden'
      }}
      className="chamfer-card scroll-animate"
    >
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'flex-end', 
          marginBottom: '50px',
          flexWrap: 'wrap',
          gap: '24px',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2 style={{ fontFamily: 'var(--font-headings)', fontSize: '2.5rem', textTransform: 'uppercase', margin: 0 }}>
            The Road to Pro
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontSize: '1.05rem', margin: 0, maxWidth: '600px' }}>
            Follow these 5 tactical steps to master the Stadium OS Engine and climb the leaderboard.
          </p>
        </div>
        <div 
          style={{ 
            fontFamily: 'var(--font-headings)', 
            fontSize: '3.5rem', 
            color: 'rgba(0, 255, 157, 0.1)', 
            fontWeight: 800, 
            letterSpacing: '1px',
            userSelect: 'none'
          }}
          className="desktop-only"
        >
          01—05
        </div>
      </div>

      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '30px', 
          width: '100%' 
        }}
      >
        {steps.map((step, idx) => (
          <div 
            key={idx} 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'flex-start', 
              textAlign: 'left',
              gap: '20px' 
            }}
            className="group-step"
          >
            <div 
              style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                border: '2px solid var(--primary)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontFamily: 'var(--font-data)', 
                color: 'var(--primary)', 
                fontSize: '1.25rem',
                fontWeight: 'bold',
                boxShadow: '0 0 10px rgba(0, 255, 157, 0.2)',
                transition: 'all 0.3s ease'
              }}
              className="step-badge"
            >
              {idx + 1}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h4 style={{ fontFamily: 'var(--font-data)', color: 'var(--primary)', fontSize: '1.05rem', fontWeight: 'bold', letterSpacing: '0.5px', margin: 0 }}>
                {step.title}
              </h4>
              <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0, lineHeight: '1.5' }}>
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .group-step:hover .step-badge {
          background-color: var(--primary) !important;
          color: #050505 !important;
          box-shadow: 0 0 20px var(--primary) !important;
          transform: scale(1.08);
        }
        @media (max-width: 768px) {
          .desktop-only {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}
