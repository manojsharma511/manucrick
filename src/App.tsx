import { useState, useEffect } from 'react';
import { useSmoothScroll } from './hooks/useSmoothScroll';
import { useIntersectionObserver } from './hooks/useIntersectionObserver';
import { useKonamiCode } from './hooks/useKonamiCode';
import { Preloader } from './components/Preloader';
import { CustomCursor } from './components/CustomCursor';
import { ParticleBackground } from './components/ParticleBackground';
import { Toast } from './components/Toast';
import { ThreeDBat } from './components/ThreeDBat';
import { StatsCounter } from './components/StatsCounter';
import { FeatureCard } from './components/FeatureCard';
import { HowToPlay } from './components/HowToPlay';
import { DeveloperCard } from './components/DeveloperCard';
import { CricketGame } from './components/CricketGame';
import { PlayerCustomizer } from './components/PlayerCustomizer';
import { PracticeNets } from './components/PracticeNets';
import { LeaderboardPage } from './components/LeaderboardPage';
import { ContactCard } from './components/ContactCard';
import { Footer } from './components/Footer';
import { TrophyCabinet } from './components/TrophyCabinet';
import { LocalScorer } from './components/LocalScorer';
import './App.css';

function App() {
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'home' | 'play' | 'practice' | 'leaderboard' | 'contact' | 'academy' | 'scorer' | 'share-scorecard'>('home');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'warning'>('success');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [customizingPlayer, setCustomizingPlayer] = useState(false);

  // Initialize smooth scrolling
  useSmoothScroll(0.08);

  // Register entrance animations for scroll-triggered elements
  const observeRef = useIntersectionObserver({ threshold: 0.1 });

  // Load active tab from window hash url
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.split('?')[0].replace('#', '') as any;
      const validTabs = ['home', 'play', 'practice', 'leaderboard', 'contact', 'academy', 'scorer', 'share-scorecard'];
      if (validTabs.includes(hash)) {
        setCurrentTab(hash);
      } else {
        setCurrentTab('home');
      }
      window.scrollTo(0, 0); // Reset scroll on page transition
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initial check
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Monitor scroll for header background frosted glass transition
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Trigger toast message notification
  const triggerToast = (msg: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
  };

  // Konami Code Easter Egg
  useKonamiCode(() => {
    triggerToast('SECRET CODE DETECTED! Confetti explosion activated! 🥇', 'info');
  });

  const handleMagneticMove = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
  };

  const handleMagneticLeave = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    const btn = e.currentTarget;
    btn.style.transform = 'translate(0px, 0px)';
  };

  const handleTabTransition = (tab: string) => {
    setMobileMenuOpen(false);
    window.location.hash = tab;
  };

  const navLinks = [
    { label: 'Home', id: 'home' },
    { label: 'Play Arena', id: 'play' },
    { label: 'Practice Nets', id: 'practice' },
    { label: 'Local Scorer', id: 'scorer' },
    { label: 'Trophy Room', id: 'academy' },
    { label: 'Leaderboard', id: 'leaderboard' },
    { label: 'Contact', id: 'contact' },
  ];

  return (
    <>
      <div className="noise-overlay" />
      <CustomCursor />
      <ParticleBackground />

      {loading ? (
        <Preloader onComplete={() => setLoading(false)} />
      ) : (
        <div style={{ position: 'relative', width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          
          {/* MULTI-PAGE NAVIGATION NAVBAR */}
          <nav
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '80px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 6%',
              zIndex: 1000,
              transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
              background: scrolled ? 'rgba(5, 10, 24, 0.85)' : 'transparent',
              backdropFilter: scrolled ? 'blur(16px)' : 'none',
              WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
              borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid transparent',
            }}
          >
            <div
              onClick={() => handleTabTransition('home')}
              style={{
                fontFamily: 'var(--font-headings)',
                fontSize: '2.1rem',
                letterSpacing: '2.5px',
                color: '#FFFFFF',
                display: 'flex',
                gap: '1px',
                cursor: 'none',
                userSelect: 'none',
              }}
              className="interactive"
            >
              {'ManucricK'.split('').map((char, index) => (
                <span
                  key={index}
                  style={{
                    display: 'inline-block',
                    animation: 'logoEntrance 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                    animationDelay: `${index * 0.06}s`,
                    opacity: 0,
                    transform: 'scale(0.5) translateY(-5px)',
                  }}
                >
                  {char}
                </span>
              ))}
            </div>

            {/* Desktop Navigation */}
            <ul
              style={{
                display: 'flex',
                gap: '30px',
                listStyle: 'none',
                alignItems: 'center',
              }}
              className="desktop-nav"
            >
              {navLinks.map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => handleTabTransition(link.id as any)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: currentTab === link.id ? 'var(--primary)' : 'var(--text-primary)',
                      fontFamily: 'var(--font-body)',
                      fontWeight: 700,
                      fontSize: '1.02rem',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      position: 'relative',
                      padding: '6px 0',
                      cursor: 'none',
                      transition: 'color 0.3s ease',
                    }}
                    className="interactive nav-link-btn"
                  >
                    {link.label}
                    <span
                      className={`nav-underline ${currentTab === link.id ? 'active' : ''}`}
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: '2px',
                        backgroundColor: 'var(--primary)',
                        transform: currentTab === link.id ? 'scaleX(1)' : 'scaleX(0)',
                        transformOrigin: 'left',
                        transition: 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                        boxShadow: '0 0 8px var(--primary)',
                      }}
                    />
                  </button>
                </li>
              ))}
            </ul>

            {/* Hamburger mobile toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'none',
                border: 'none',
                display: 'none',
                flexDirection: 'column',
                justifyContent: 'space-between',
                width: '28px',
                height: '18px',
                cursor: 'none',
                zIndex: 1002,
                padding: 0,
              }}
              className="hamburger-btn interactive"
              aria-label="Toggle Menu"
            >
              <span style={{ width: '100%', height: '2px', backgroundColor: '#FFFFFF', transition: 'transform 0.3s', transform: mobileMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
              <span style={{ width: '100%', height: '2px', backgroundColor: '#FFFFFF', transition: 'opacity 0.3s', opacity: mobileMenuOpen ? 0 : 1 }} />
              <span style={{ width: '100%', height: '2px', backgroundColor: '#FFFFFF', transition: 'transform 0.3s', transform: mobileMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
            </button>

            {/* Mobile menu overlay */}
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(5, 10, 24, 0.98)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                zIndex: 1001,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                transform: mobileMenuOpen ? 'translateY(0)' : 'translateY(-100%)',
                transition: 'transform 0.5s cubic-bezier(0.77, 0, 0.175, 1)',
              }}
            >
              <ul style={{ listStyle: 'none', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {navLinks.map((link) => (
                  <li key={link.id}>
                    <button
                      onClick={() => handleTabTransition(link.id as any)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: currentTab === link.id ? 'var(--primary)' : '#FFFFFF',
                        fontFamily: 'var(--font-headings)',
                        fontSize: '2.5rem',
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        cursor: 'none',
                      }}
                      className="interactive"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Global Toast Alert */}
          {toastMessage && (
            <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
          )}

          {/* PAGE ROUTER RENDERING AREA */}
          <div style={{ marginTop: '80px', flex: 1, display: 'flex', flexDirection: 'column' }}>

            {/* TAB VIEW 1: HOME PAGE */}
            {currentTab === 'home' && (
              <div style={{ animation: 'tabTransition 0.5s ease-out' }}>
                <section
                  style={{
                    minHeight: 'calc(100vh - 80px)',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '60px 8%',
                    position: 'relative',
                    flexWrap: 'wrap',
                    gap: '40px',
                    background: 'radial-gradient(circle at 80% 40%, rgba(0, 255, 135, 0.04) 0%, transparent 60%)',
                  }}
                >
                  {/* Spotlights */}
                  <div style={{ position: 'absolute', top: 0, left: '20%', width: '2px', height: '100%', background: 'linear-gradient(rgba(0,255,135,0.1), transparent)', transform: 'rotate(25deg)', transformOrigin: 'top', animation: 'lightSweep1 10s infinite ease-in-out' }} />
                  <div style={{ position: 'absolute', top: 0, right: '20%', width: '2px', height: '100%', background: 'linear-gradient(rgba(255,107,0,0.1), transparent)', transform: 'rotate(-25deg)', transformOrigin: 'top', animation: 'lightSweep2 10s infinite ease-in-out' }} />

                  {/* Left Hero side */}
                  <div style={{ flex: '1.2', minWidth: '320px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', zIndex: 5 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '5px', color: 'var(--secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                      WELCOME TO
                    </div>

                    <h1 style={{ fontFamily: 'var(--font-headings)', fontSize: '6rem', lineHeight: '0.9', letterSpacing: '3px', marginBottom: '18px', display: 'flex', gap: '1px', userSelect: 'none' }}>
                      {'ManucricK'.split('').map((char, index) => (
                        <span
                          key={index}
                          style={{
                            display: 'inline-block',
                            animation: 'charEntrance 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                            animationDelay: `${0.1 + index * 0.07}s`,
                            opacity: 0,
                            transform: 'translateY(25px) scale(0.7)',
                            color: char === 'K' ? 'var(--secondary)' : '#FFFFFF',
                            textShadow: '0 0 12px rgba(0, 255, 135, 0.2)',
                          }}
                        >
                          {char}
                        </span>
                      ))}
                    </h1>

                    <p style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '32px', letterSpacing: '0.8px' }}>
                      The Ultimate Arena Cricket Batter & Runner Simulator
                    </p>

                    <div style={{ display: 'flex', gap: '20px', marginBottom: '45px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleTabTransition('play')}
                        onMouseMove={handleMagneticMove}
                        onMouseLeave={handleMagneticLeave}
                        style={{
                          padding: '14px 34px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: 'var(--primary)',
                          color: '#050A18',
                          fontFamily: 'var(--font-headings)',
                          fontSize: '1.4rem',
                          letterSpacing: '2px',
                          cursor: 'none',
                          animation: 'buttonPulseGlow 1.8s infinite alternate ease-in-out',
                          transition: 'transform 0.1s ease',
                        }}
                        className="interactive magnetic-btn"
                      >
                        🏏 ENTER STADIUM
                      </button>

                      <button
                        onClick={() => handleTabTransition('practice')}
                        onMouseMove={handleMagneticMove}
                        onMouseLeave={handleMagneticLeave}
                        style={{
                          padding: '13px 31px',
                          borderRadius: '8px',
                          border: '1.5px solid rgba(255, 255, 255, 0.18)',
                          backgroundColor: 'transparent',
                          color: '#FFFFFF',
                          fontFamily: 'var(--font-headings)',
                          fontSize: '1.4rem',
                          letterSpacing: '2px',
                          cursor: 'none',
                          transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                        }}
                        className="interactive magnetic-btn learn-more-btn"
                      >
                        PRACTICE NETS
                      </button>
                    </div>

                    {/* Stats counters */}
                    <div style={{ display: 'flex', gap: '30px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '22px', width: '100%', maxWidth: '500px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '100px' }}>
                        <div style={{ fontFamily: 'var(--font-headings)', fontSize: '1.8rem', color: '#FFF', display: 'flex', gap: '3px' }}>
                          🏆 <StatsCounter targetValue={500} suffix="+" />
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Batsmen Active</div>
                      </div>
                      <div style={{ flex: 1, minWidth: '100px' }}>
                        <div style={{ fontFamily: 'var(--font-headings)', fontSize: '1.8rem', color: '#FFF', display: 'flex', gap: '3px' }}>
                          ⚡ <StatsCounter targetValue={10000} suffix="+" />
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Deliveries Faced</div>
                      </div>
                      <div style={{ flex: 1, minWidth: '100px' }}>
                        <div style={{ fontFamily: 'var(--font-headings)', fontSize: '1.8rem', color: '#FFF', display: 'flex', gap: '3px' }}>
                          🌍 <StatsCounter targetValue={50} suffix="+" />
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Global Stadiums</div>
                      </div>
                    </div>
                  </div>

                  {/* Right 3D Scene */}
                  <div style={{ flex: '1', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', minWidth: '320px', height: '400px' }}>
                    <div
                      style={{
                        position: 'absolute',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--secondary)',
                        boxShadow: '0 0 15px var(--secondary)',
                        animation: 'heroBallFly 5s infinite cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        zIndex: 6,
                        pointerEvents: 'none',
                      }}
                    />
                    <ThreeDBat />
                    <div style={{ position: 'absolute', bottom: '10px', width: '180px', height: '60px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(0,255,135,0.15)', transform: 'perspective(120px) rotateX(60deg)' }} />
                  </div>
                </section>

                {/* About Content on Home Screen */}
                <section style={{ width: '100%', backgroundColor: '#040915', padding: '80px 8%' }}>
                  <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
                    <div className="section-title-wrapper">
                      <h2 ref={observeRef} className="reveal-text" style={{ fontFamily: 'var(--font-headings)', fontSize: '3rem', color: '#FFF', position: 'relative' }}>
                        THE STADIUM OVERVIEW
                        <span style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', width: '60px', height: '3px', backgroundColor: 'var(--primary)' }} />
                      </h2>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginTop: '50px', flexWrap: 'wrap' }}>
                      <FeatureCard icon="🏃" title="Interactive Running" description="Hit in gaps and trigger runs manually. Slide home or stop in creases to prevent run-out wickets from fielding throws!" />
                      <FeatureCard icon="🎯" title="Steering Aim Arc" description="Position targeted sweeps and cover drives. Guide hits away from fielders to prevent high catches." />
                      <FeatureCard icon="🥎" title="Delivery Variations" description="Refining batting accuracy against Fast, Outswinger curves, high Bouncers, and sharp Spin breaks." />
                    </div>

                    <HowToPlay />
                  </div>

                  <div style={{ width: '100%', margin: '80px 0 0', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '50px' }}>
                    <DeveloperCard onToast={triggerToast} />
                  </div>
                </section>
              </div>
            )}

            {/* TAB VIEW 2: PLAY ARENA */}
            {currentTab === 'play' && (
              <div style={{ padding: '20px 2%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'tabTransition 0.5s ease-out', width: '100%' }}>
                <div style={{ width: '100%', maxWidth: '1200px', textAlign: 'center', marginBottom: '20px' }}>
                  <div className="section-title-wrapper">
                    <h2 style={{ fontFamily: 'var(--font-headings)', fontSize: '3rem', color: '#FFF' }}>
                      CHAMPIONSHIP STADIUM
                    </h2>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px' }}>
                    <button
                      onClick={() => setCustomizingPlayer(!customizingPlayer)}
                      style={{
                        padding: '8px 20px',
                        borderRadius: '6px',
                        border: '1.5px solid var(--primary)',
                        backgroundColor: customizingPlayer ? 'rgba(0, 255, 135, 0.08)' : 'transparent',
                        color: 'var(--primary)',
                        fontFamily: 'var(--font-body)',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        cursor: 'none',
                      }}
                      className="interactive"
                    >
                      {customizingPlayer ? '🛡️ HIDE JERSEY CONFIG' : '👕 EDIT JERSEY & NAME'}
                    </button>
                  </div>

                  {customizingPlayer ? (
                    <PlayerCustomizer onSave={(c) => {
                      triggerToast(`Saved customizations for batsman ${c.name}!`, 'success');
                      setCustomizingPlayer(false);
                    }} onClose={() => setCustomizingPlayer(false)} />
                  ) : (
                    <CricketGame />
                  )}
                </div>
              </div>
            )}

            {/* TAB VIEW: LOCAL SCORER */}
            {(currentTab === 'scorer' || currentTab === 'share-scorecard') && (
              <div style={{ padding: '60px 4%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'tabTransition 0.5s ease-out', width: '100%' }}>
                <LocalScorer />
              </div>
            )}

            {/* TAB VIEW: TROPHY ROOM */}
            {currentTab === 'academy' && (
              <div style={{ padding: '60px 4%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'tabTransition 0.5s ease-out', width: '100%' }}>
                <div style={{ width: '100%', maxWidth: '1200px', textAlign: 'center' }}>
                  <div className="section-title-wrapper">
                    <h2 style={{ fontFamily: 'var(--font-headings)', fontSize: '3rem', color: '#FFF' }}>
                      LEGENDS VAULT & TROPHY CABINET
                    </h2>
                  </div>
                  <TrophyCabinet />
                </div>
              </div>
            )}

            {/* TAB VIEW 3: PRACTICE NETS */}
            {currentTab === 'practice' && (
              <div style={{ padding: '60px 8%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'tabTransition 0.5s ease-out' }}>
                <div style={{ width: '100%', maxWidth: '900px', textAlign: 'center' }}>
                  <div className="section-title-wrapper">
                    <h2 style={{ fontFamily: 'var(--font-headings)', fontSize: '3rem', color: '#FFF' }}>
                      PRACTICE NETS
                    </h2>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto 30px', fontSize: '1rem' }}>
                    Hone your batting reflex mechanics against customizable ball curves. Check your alignment offsets in milliseconds.
                  </p>
                  <PracticeNets />
                </div>
              </div>
            )}

            {/* TAB VIEW 4: LEADERBOARDS */}
            {currentTab === 'leaderboard' && (
              <div style={{ padding: '60px 8%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'tabTransition 0.5s ease-out' }}>
                <LeaderboardPage />
              </div>
            )}

            {/* TAB VIEW 5: BIO & CONTACT */}
            {currentTab === 'contact' && (
              <div style={{ padding: '60px 8%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'tabTransition 0.5s ease-out' }}>
                <div className="section-title-wrapper">
                  <h2 style={{ fontFamily: 'var(--font-headings)', fontSize: '3rem', color: '#FFF' }}>
                    GET IN TOUCH
                  </h2>
                </div>
                <div style={{ marginTop: '40px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <ContactCard onToast={triggerToast} />
                </div>
              </div>
            )}

          </div>

          <Footer />
        </div>
      )}

      <style>{`
        .learn-more-btn:hover {
          background-color: rgba(255, 255, 255, 0.08) !important;
          border-color: #FFFFFF !important;
          box-shadow: 0 0 15px rgba(255,255,255,0.15);
        }

        @keyframes tabTransition {
          0% { transform: translateY(15px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}

export default App;
