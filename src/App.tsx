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
import { TossArena } from './components/TossArena';
import './App.css';

const thoughts = [
  { text: "Cricket is not just a game, it is an emotion.", author: "ManuCrick Philosophy" },
  { text: "In gully cricket, every tree is a fielder and every street is a stadium.", author: "Local Lore" },
  { text: "Every ball is a new opportunity. Timing and patience turn deliveries into boundaries.", author: "Mastery Guide" },
  { text: "Where passion meets pixels, we rebuild the nostalgia of the gentleman's game.", author: "Manoj Kumar Sharma" }
];

function App() {
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'home' | 'play' | 'practice' | 'leaderboard' | 'contact' | 'academy' | 'scorer' | 'share-scorecard' | 'toss'>('home');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'warning'>('success');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [customizingPlayer, setCustomizingPlayer] = useState(false);
  const [activeBat, setActiveBat] = useState(localStorage.getItem('manucrick_selected_bat') || 'kashmir');
  const [activeThoughtIdx, setActiveThoughtIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveThoughtIdx((prev) => (prev + 1) % thoughts.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Initialize smooth scrolling
  useSmoothScroll(0.08);

  // Register entrance animations for scroll-triggered elements
  const observeRef = useIntersectionObserver({ threshold: 0.1 });

  // Load active tab from window hash url
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.split('?')[0].replace('#', '') as any;
      const validTabs = ['home', 'play', 'practice', 'leaderboard', 'contact', 'academy', 'scorer', 'share-scorecard', 'toss'];
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
    { label: 'Practice Nets', id: 'practice' },
    { label: 'Flip Coin', id: 'toss' },
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
                display: 'flex',
                alignItems: 'center',
                cursor: 'none',
                userSelect: 'none',
              }}
              className="interactive"
            >
              {/* Rotating Cricket Ball SVG Logo */}
              <svg
                width="38"
                height="38"
                viewBox="0 0 100 100"
                style={{
                  marginRight: '12px',
                  filter: 'drop-shadow(0 0 8px var(--primary))',
                  display: 'block',
                }}
                className="spin-logo"
              >
                <circle cx="50" cy="50" r="45" fill="url(#logoBallGrad)" />
                <path d="M 50,5 A 45,45 0 0,1 50,95" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeDasharray="8,5" />
                <path d="M 5,50 A 45,45 0 0,1 95,50" fill="none" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="2" />
                <defs>
                  <linearGradient id="logoBallGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--primary)" />
                    <stop offset="100%" stopColor="var(--secondary)" />
                  </linearGradient>
                </defs>
              </svg>

              <div
                style={{
                  fontFamily: 'var(--font-headings)',
                  fontSize: '2.2rem',
                  letterSpacing: '2.5px',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: '#FFFFFF' }}>MANU</span>
                <span style={{ color: 'var(--primary)', textShadow: '0 0 10px rgba(0, 255, 135, 0.5)' }}>CRICK</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '35px',
              }}
              className="desktop-nav"
            >
              <ul
                style={{
                  display: 'flex',
                  gap: '24px',
                  listStyle: 'none',
                  alignItems: 'center',
                }}
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

              {/* Bold highlighted CTA button */}
              <button
                onClick={() => handleTabTransition('play')}
                className="interactive nav-play-now-btn"
                style={{ cursor: 'none' }}
              >
                PLAY NOW 🏏
              </button>
            </div>

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
              <ul style={{ listStyle: 'none', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                <li>
                  <button
                    onClick={() => handleTabTransition('play')}
                    style={{
                      background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                      border: 'none',
                      color: '#050A18',
                      fontFamily: 'var(--font-headings)',
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      padding: '12px 36px',
                      borderRadius: '10px',
                      cursor: 'none',
                      boxShadow: '0 0 15px rgba(0, 255, 135, 0.4)',
                      marginBottom: '10px',
                    }}
                    className="interactive"
                  >
                    PLAY NOW 🏏
                  </button>
                </li>
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
                <section style={{ width: '100%', backgroundColor: '#040915', padding: '80px 8%' }}>
                  <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
                    <div className="section-title-wrapper">
                      <h2 ref={observeRef} className="reveal-text" style={{ fontFamily: 'var(--font-headings)', fontSize: '3rem', color: '#FFF', position: 'relative' }}>
                        THE STADIUM OVERVIEW
                        <span style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', width: '60px', height: '3px', backgroundColor: 'var(--primary)' }} />
                      </h2>
                    </div>

                    <div style={{ display: 'flex', gap: '30px', marginTop: '50px', flexWrap: 'wrap' }}>
                      <FeatureCard icon="🏃" title="Interactive Running" description="Hit in gaps and trigger runs manually. Slide home or stop in creases to prevent run-out wickets from fielding throws!" />
                      <FeatureCard icon="🎯" title="Steering Aim Arc" description="Position targeted sweeps and cover drives. Guide hits away from fielders to prevent high catches." />
                      <FeatureCard icon="🥎" title="Delivery Variations" description="Refining batting accuracy against Fast, Outswinger curves, high Bouncers, and sharp Spin breaks." />
                    </div>

                    <HowToPlay />
                  </div>
                </section>

                <section style={{ width: '100%', backgroundColor: '#050a18', padding: '80px 8%', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
                    <div className="section-title-wrapper" style={{ marginBottom: '50px' }}>
                      <h2 className="reveal-text visible" style={{ fontFamily: 'var(--font-headings)', fontSize: '3rem', color: '#FFF', position: 'relative' }}>
                        THE STORY OF MANUCRICK
                        <span style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', width: '60px', height: '3px', backgroundColor: 'var(--primary)' }} />
                      </h2>
                    </div>

                    <div style={{ display: 'flex', gap: '50px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ flex: '1.2', minWidth: '320px' }}>
                        <h3 style={{ fontSize: '1.8rem', color: 'var(--primary)', marginBottom: '15px' }}>Where Passion Meets Pixels</h3>
                        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '20px' }}>
                          Born from a deep love for gully cricket and state-of-the-art frontend engineering, <strong>ManucricK</strong> is the ultimate virtual stadium built directly in your browser. Whether you are timing sweet sweeps in the <strong>Play Arena</strong>, training your reflexes in the <strong>Practice Nets</strong>, or tracking matches with our robust <strong>Local Scorer</strong>, every module is designed to feel fast, responsive, and tactile.
                        </p>
                        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '25px' }}>
                          Built using <strong>React</strong>, <strong>TypeScript</strong>, and premium custom CSS animations, the site leverages advanced browser APIs—like the <strong>Web Audio API</strong> for programmatic sound synthesis—to provide an immersive soundscape without loading heavy media assets.
                        </p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                          <div style={{ borderLeft: '3px solid var(--secondary)', paddingLeft: '15px' }}>
                            <h4 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1.1rem', color: '#FFF' }}>Pure Performance</h4>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>No heavy WebGL engines or bloated assets. Just lightweight, custom-optimized rendering.</p>
                          </div>
                          <div style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '15px' }}>
                            <h4 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1.1rem', color: '#FFF' }}>Tactile Experience</h4>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Features satisfying hover offsets, magnetic buttons, and dynamic cursor states.</p>
                          </div>
                        </div>
                      </div>

                      <div style={{ flex: '0.8', minWidth: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className="glass-panel" style={{ padding: '30px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }} />
                          
                          <span style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🪙</span>
                          <h4 style={{ fontFamily: 'var(--font-headings)', fontSize: '1.4rem', color: '#FFF', marginBottom: '8px' }}>QUICK COIN FLIPPER</h4>
                          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.4' }}>
                            Need a quick decision on who plays first? Test our 100% fair 50/50 probability coin flipper below!
                          </p>

                          <div style={{ marginBottom: '20px' }}>
                            <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'var(--gold-metal)', border: '3.5px solid #F39C12', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3), 0 0 15px rgba(241,196,15,0.4)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', animation: 'logoEntrance 1.5s infinite alternate ease-in-out' }}>
                              <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>🏆</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleTabTransition('toss')}
                            style={{
                              padding: '10px 22px',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor: 'var(--primary)',
                              color: '#050A18',
                              fontFamily: 'var(--font-headings)',
                              fontSize: '1.1rem',
                              letterSpacing: '1px',
                              cursor: 'none',
                              boxShadow: '0 0 12px rgba(0,255,135,0.2)',
                            }}
                            className="interactive"
                          >
                            OPEN COIN FLIPPER
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section style={{ width: '100%', backgroundColor: '#040814', padding: '80px 8%', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
                    <div className="section-title-wrapper" style={{ marginBottom: '55px' }}>
                      <h2 className="reveal-text visible" style={{ fontFamily: 'var(--font-headings)', fontSize: '3rem', color: '#FFF', position: 'relative' }}>
                        WELCOME TO MANUCRICK
                        <span style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', width: '60px', height: '3px', backgroundColor: 'var(--primary)' }} />
                      </h2>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '10px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                        YOUR ULTIMATE HUB FOR VIRTUAL CRICKET & GULLY MATCH SCORING
                      </p>
                    </div>

                    {/* Feature Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px', marginBottom: '60px' }}>
                      <div className="feature-glass-card">
                        <div style={{ fontSize: '2.2rem' }}>🏏</div>
                        <h3 style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>PLAY NOW (PLAY ARENA)</h3>
                        <p style={{ fontSize: '0.92rem', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                          Step into the Championship Stadium! Choose your challenge format (Championship, Super Over, Wicket Survival, or Target Attack). Swing with precision aiming overlays and control your batsman run-crease manually.
                        </p>
                      </div>

                      <div className="feature-glass-card">
                        <div style={{ fontSize: '2.2rem' }}>🥎</div>
                        <h3 style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>PRACTICE NETS</h3>
                        <p style={{ fontSize: '0.92rem', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                          Hone your timing reflexes against Fast, Curve Outswingers, high Bouncers, and sharp Spin breaks. Analyze your bat alignment offset in milliseconds after every shot to reach peak performance.
                        </p>
                      </div>

                      <div className="feature-glass-card">
                        <div style={{ fontSize: '2.2rem' }}>🪙</div>
                        <h3 style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>3D FLIP COIN</h3>
                        <p style={{ fontSize: '0.92rem', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                          Need a quick match decision? Access our Flip Coin arena featuring a 100% fair, mathematically simulated 50/50 probability coin tosser with rich 3D graphics, sound effects, and a smooth metallic spin.
                        </p>
                      </div>

                      <div className="feature-glass-card">
                        <div style={{ fontSize: '2.2rem' }}>📊</div>
                        <h3 style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>LOCAL SCORER</h3>
                        <p style={{ fontSize: '0.92rem', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                          Ditch the notebook! Keep score for your real-world gully matches with our comprehensive scorer tool. Log batsman records, extra runs, overs, wickets, view dynamic charts, and generate shareable scorecards.
                        </p>
                      </div>

                      <div className="feature-glass-card">
                        <div style={{ fontSize: '2.2rem' }}>🏆</div>
                        <h3 style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>LEGENDS VAULT & TROPHY CABINET</h3>
                        <p style={{ fontSize: '0.92rem', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                          Unleash special powers! Track achievements like matches played, runs scored, and sixes hit. Unlock premium equipment including the carbon Cyber-Carbon bat or Manoj's explosive Helicopter Special bat.
                        </p>
                      </div>

                      <div className="feature-glass-card">
                        <div style={{ fontSize: '2.2rem' }}>🎖️</div>
                        <h3 style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>GLOBAL LEADERBOARDS</h3>
                        <p style={{ fontSize: '0.92rem', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                          Pit your skills against other batsmen. Check out the top scores, delivery faced stats, and global player rankings to see who dominates the virtual turf.
                        </p>
                      </div>
                    </div>

                    {/* Thoughts / Quotes Slider */}
                    <div className="quote-slider-card">
                      <span className="quote-decor open">“</span>
                      <div style={{ minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', transition: 'all 0.5s ease' }}>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.4rem', fontWeight: 600, color: '#FFF', fontStyle: 'italic', marginBottom: '15px', lineHeight: '1.5' }}>
                          {thoughts[activeThoughtIdx].text}
                        </p>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                          — {thoughts[activeThoughtIdx].author}
                        </span>
                      </div>
                      <span className="quote-decor close">”</span>

                      {/* Indicators */}
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '25px' }}>
                        {thoughts.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveThoughtIdx(idx)}
                            style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: activeThoughtIdx === idx ? 'var(--primary)' : 'rgba(255,255,255,0.15)',
                              border: 'none',
                              padding: 0,
                              cursor: 'none',
                              transition: 'background-color 0.3s ease',
                            }}
                            className="interactive"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <section style={{ width: '100%', backgroundColor: '#03060F', padding: '80px 8%', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
                    <div className="section-title-wrapper" style={{ marginBottom: '50px' }}>
                      <h2 className="reveal-text visible" style={{ fontFamily: 'var(--font-headings)', fontSize: '3rem', color: '#FFF', position: 'relative' }}>
                        MEET THE ARCHITECT
                        <span style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', width: '60px', height: '3px', backgroundColor: 'var(--primary)' }} />
                      </h2>
                    </div>

                    <div style={{ display: 'flex', gap: '40px', alignItems: 'stretch', flexWrap: 'wrap' }}>
                      
                      <div className="glass-panel" style={{ flex: '1.4', minWidth: '320px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '25px', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '3px' }}>
                            DESIGNER & DEVELOPER
                          </span>
                          <h3 style={{ fontSize: '2.6rem', color: '#FFFFFF', marginTop: '5px', marginBottom: '15px' }}>
                            Manoj Kumar Sharma
                          </h3>
                          <p style={{ fontSize: '1.02rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '15px' }}>
                            Hello! I am a Full Stack Developer dedicated to merging cutting-edge architectural backend design with polished, high-fidelity user interfaces. My design philosophy revolves around clean semantics, performance-oriented UI states, and robust enterprise patterns.
                          </p>
                          <p style={{ fontSize: '1.02rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            Through projects like <strong>ManucricK</strong>, I push the limits of modern web engines to deliver rich interactive experiences that run smoothly on every screen size.
                          </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          <h4 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.95rem', color: '#FFF', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Technical Expertise
                          </h4>
                          
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                              <span>JAVA & ENTERPRISE ARCHITECTURE</span>
                              <span style={{ color: 'var(--primary)' }}>95%</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: '95%', height: '100%', background: 'linear-gradient(90deg, var(--secondary), var(--primary))', boxShadow: '0 0 6px var(--primary)' }} />
                            </div>
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                              <span>SPRING BOOT & MICROSERVICES</span>
                              <span style={{ color: 'var(--primary)' }}>95%</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: '95%', height: '100%', background: 'linear-gradient(90deg, var(--secondary), var(--primary))', boxShadow: '0 0 6px var(--primary)' }} />
                            </div>
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                              <span>REACT.JS & ANIMATION ENGINES</span>
                              <span style={{ color: 'var(--primary)' }}>90%</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: '90%', height: '100%', background: 'linear-gradient(90deg, var(--secondary), var(--primary))', boxShadow: '0 0 6px var(--primary)' }} />
                            </div>
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                              <span>LIFERAY DXP PORTAL DEVELOPMENT</span>
                              <span style={{ color: 'var(--primary)' }}>88%</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: '88%', height: '100%', background: 'linear-gradient(90deg, var(--secondary), var(--primary))', boxShadow: '0 0 6px var(--primary)' }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ flex: '0.8', minWidth: '280px', display: 'flex' }}>
                        <DeveloperCard onToast={triggerToast} />
                      </div>

                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* TAB VIEW 2: PLAY ARENA */}
            {currentTab === 'play' && (
              <div style={{ padding: '20px 2%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'tabTransition 0.5s ease-out', width: '100%' }}>
                <div style={{ width: '100%', maxWidth: '1200px', textAlign: 'center', marginBottom: '20px' }}>
                  <div className="section-title-wrapper" style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontFamily: 'var(--font-headings)', fontSize: '3rem', color: '#FFF' }}>
                      MANUCRICK PLAY NOW
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '4px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                      OPERATED BY MANOJ KUMAR SHARMA &bull; THE ULTIMATE ARENA
                    </p>
                  </div>

                  <div className="play-now-layout">
                    {/* Left side: Game Arena */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                      {customizingPlayer ? (
                        <PlayerCustomizer onSave={(c) => {
                          triggerToast(`Saved customizations for batsman ${c.name}!`, 'success');
                          setCustomizingPlayer(false);
                        }} onClose={() => setCustomizingPlayer(false)} />
                      ) : (
                        <CricketGame />
                      )}
                    </div>

                    {/* Right side: Bold Control & Branding Panel */}
                    <div className="neon-brand-panel">
                      <div>
                        <h3 style={{ fontSize: '1.8rem', color: 'var(--primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          🏟️ ARENA DASHBOARD
                        </h3>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                          Welcome to the official arena of Manoj Kumar Sharma. Equip your gear, review guidelines, and take your stance.
                        </p>
                      </div>

                      {/* Quick Gear Customization */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '15px' }}>
                        <h4 style={{ fontSize: '1.05rem', color: '#FFF', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          🏏 Select Active Bat
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <button 
                            onClick={() => {
                              localStorage.setItem('manucrick_selected_bat', 'kashmir');
                              setActiveBat('kashmir');
                              triggerToast('Equipped Kashmir Willow Pro!', 'success');
                            }}
                            className={`premium-bat-option interactive ${activeBat === 'kashmir' ? 'active' : ''}`}
                            style={{ width: '100%' }}
                          >
                            <span style={{ fontSize: '1.2rem' }}>🪵</span>
                            <div style={{ textAlign: 'left' }}>
                              <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#FFF' }}>Kashmir Willow Pro</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Standard wood bat, balanced swing speed.</div>
                            </div>
                          </button>

                          <button 
                            onClick={() => {
                              localStorage.setItem('manucrick_selected_bat', 'cyber');
                              setActiveBat('cyber');
                              triggerToast('Equipped Cyber-Carbon Neon!', 'success');
                            }}
                            className={`premium-bat-option interactive ${activeBat === 'cyber' ? 'active' : ''}`}
                            style={{ width: '100%' }}
                          >
                            <span style={{ fontSize: '1.2rem' }}>⚡</span>
                            <div style={{ textAlign: 'left' }}>
                              <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--primary)' }}>Cyber-Carbon Neon</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Lightweight cyber chassis with glowing tracer seam.</div>
                            </div>
                          </button>

                          <button 
                            onClick={() => {
                              localStorage.setItem('manucrick_selected_bat', 'helicopter');
                              setActiveBat('helicopter');
                              triggerToast("Equipped Manoj's Helicopter Special!", 'success');
                            }}
                            className={`premium-bat-option interactive ${activeBat === 'helicopter' ? 'active' : ''}`}
                            style={{ width: '100%' }}
                          >
                            <span style={{ fontSize: '1.2rem' }}>🔥</span>
                            <div style={{ textAlign: 'left' }}>
                              <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--secondary)' }}>Manoj's Helicopter Special</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Heavy profile custom wood. Unlocks explosive power!</div>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Jersey & Match Gear */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <h4 style={{ fontSize: '1.05rem', color: '#FFF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          👕 Jersey Settings
                        </h4>
                        <button
                          onClick={() => setCustomizingPlayer(!customizingPlayer)}
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1.5px solid var(--primary)',
                            backgroundColor: customizingPlayer ? 'rgba(0, 255, 135, 0.08)' : 'rgba(0, 255, 135, 0.03)',
                            color: 'var(--primary)',
                            fontFamily: 'var(--font-headings)',
                            fontSize: '1.1rem',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                            cursor: 'none',
                            transition: 'all 0.2s',
                          }}
                          className="interactive"
                        >
                          {customizingPlayer ? '🛡️ CLOSE JERSEY EDITOR' : '👕 EDIT JERSEY & NAME'}
                        </button>
                      </div>

                      {/* Playbook / Instructions */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '15px' }}>
                        <h4 style={{ fontSize: '1.05rem', color: '#FFF', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          📖 Stadium Guidelines
                        </h4>
                        <ul style={{ paddingLeft: '18px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px', lineHeight: '1.4' }}>
                          <li><strong>Shot Timing:</strong> Watch the ball curve carefully. Wait for it to enter the batting crease before clicking.</li>
                          <li><strong>Manual Running:</strong> Click <strong>RUN CREASE</strong> after hitting into gaps. Click again or <strong>STOP RUNNING</strong> to ground your batsman.</li>
                          <li><strong>Fielding Throws:</strong> Fielders throw to stumps! Sliding or grounding on time prevents run-out wickets.</li>
                          <li><strong>Aiming Arc:</strong> Drag or click to set the swing direction overlay. Guide hits away from fielders.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB VIEW: TOSS ARENA */}
            {currentTab === 'toss' && (
              <div style={{ padding: '60px 4%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'tabTransition 0.5s ease-out', width: '100%' }}>
                <div style={{ width: '100%', maxWidth: '1200px', textAlign: 'center' }}>
                  <div className="section-title-wrapper">
                    <h2 style={{ fontFamily: 'var(--font-headings)', fontSize: '3rem', color: '#FFF' }}>
                      3D FLIP COIN ARENA
                    </h2>
                  </div>
                  <TossArena />
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
