import { useState, useEffect, Suspense, lazy } from 'react';
import { Analytics } from '@vercel/analytics/react';
const ArcadeHub = lazy(() => import('./components/arcade/ArcadeHub'));
import { useSmoothScroll } from './hooks/useSmoothScroll';
import { useIntersectionObserver } from './hooks/useIntersectionObserver';
import { useKonamiCode } from './hooks/useKonamiCode';
import { Preloader } from './components/Preloader';
import { CustomCursor } from './components/CustomCursor';
import { ParticleBackground } from './components/ParticleBackground';
import { Toast } from './components/Toast';
import { ThreeDBat } from './components/ThreeDBat';
import { StatsCounter } from './components/StatsCounter';
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
import { TournamentBracket } from './components/TournamentBracket';
import { PlayerStats } from './components/PlayerStats';
import './App.css';

const thoughts = [
  { text: "Cricket is not just a game, it is an emotion.", author: "ManuCrick Philosophy" },
  { text: "In gully cricket, every tree is a fielder and every street is a stadium.", author: "Local Lore" },
  { text: "Every ball is a new opportunity. Timing and patience turn deliveries into boundaries.", author: "Mastery Guide" },
  { text: "Where passion meets pixels, we rebuild the nostalgia of the gentleman's game.", author: "Manoj Kumar Sharma" }
];

const CyberLogo = ({ width = 160, height = 48 }: { width?: number; height?: number }) => (
  <svg width={width} height={height} viewBox="0 0 450 120" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
    <defs>
      <linearGradient id="cyberGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: '#6366F1', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#06B6D4', stopOpacity: 1 }} />
      </linearGradient>
      <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <text x="20" y="80" fontFamily="'Sora', sans-serif" fontSize="64" fontWeight="800" fill="url(#cyberGradient)" style={{ letterSpacing: '-2px', filter: 'url(#neonGlow)' }}>MANUCRICK</text>
    <rect x="22" y="95" width="400" height="4" fill="url(#cyberGradient)" rx="2" opacity="0.8" />
    <rect x="22" y="95" width="60" height="4" fill="#ffffff" rx="2" opacity="0.9">
      <animate attributeName="x" from="22" to="362" dur="3s" repeatCount="indefinite" />
    </rect>
  </svg>
);

function App() {
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'home' | 'play' | 'practice' | 'leaderboard' | 'contact' | 'academy' | 'scorer' | 'share-scorecard' | 'toss' | 'tournament' | 'players' | 'arcade'>('home');
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
      const validTabs = ['home', 'play', 'practice', 'leaderboard', 'contact', 'academy', 'scorer', 'share-scorecard', 'toss', 'tournament', 'players', 'arcade'];
      if (validTabs.includes(hash)) {
        setCurrentTab(hash);
      } else {
        setCurrentTab('home');
      }
      window.scrollTo(0, 0); // Reset scroll on page transition
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Monitor scroll for header background transition
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  return (
    <>
      <Analytics />
      <div className="noise-overlay" />
      <CustomCursor />
      <ParticleBackground />

      {loading ? (
        <Preloader onComplete={() => setLoading(false)} />
      ) : (
        <div style={{ position: 'relative', width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#060814', color: '#F8FAFC' }}>

          {/* HEADER NAV */}
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
              padding: scrolled ? '0 4%' : '0 6%',
              zIndex: scrolled ? 999 : 98,
              transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
              background: scrolled ? 'rgba(6, 8, 20, 0.85)' : 'transparent',
              backdropFilter: scrolled ? 'blur(20px)' : 'none',
              WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
              borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent',
              boxShadow: scrolled ? '0 10px 30px rgba(0, 0, 0, 0.3)' : 'none',
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
              <CyberLogo width={150} height={44} />

              <span
                style={{
                  fontFamily: 'var(--font-data)',
                  fontSize: '0.68rem',
                  color: 'var(--primary)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  marginLeft: '15px',
                  letterSpacing: '1px',
                  background: 'rgba(245, 158, 11, 0.06)'
                }}
                className="desktop-only"
              >
                STADIUM OS
              </span>
            </div>

            {/* Desktop Dropdown Navigation Menu */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              className="desktop-only"
            >
              <button
                onClick={() => handleTabTransition('home')}
                className={`nav-direct-link interactive ${currentTab === 'home' ? 'active' : ''}`}
                style={{ cursor: 'none' }}
              >
                Dashboard
              </button>

              {/* Play Arena Dropdown */}
              <div className="nav-dropdown">
                <button className="nav-dropdown-trigger interactive" style={{ cursor: 'none' }}>
                  Play Arena <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>keyboard_arrow_down</span>
                </button>
                <div className="nav-dropdown-menu">
                  <button onClick={() => handleTabTransition('play')} className={`nav-dropdown-item interactive ${currentTab === 'play' ? 'active' : ''}`} style={{ cursor: 'none' }}>
                    🏏 Play Game
                  </button>
                  <button onClick={() => handleTabTransition('practice')} className={`nav-dropdown-item interactive ${currentTab === 'practice' ? 'active' : ''}`} style={{ cursor: 'none' }}>
                    🥎 Practice Nets
                  </button>
                  <button onClick={() => handleTabTransition('arcade')} className={`nav-dropdown-item interactive ${currentTab === 'arcade' ? 'active' : ''}`} style={{ cursor: 'none' }}>
                    🕹️ Arcade Hub
                  </button>
                </div>
              </div>

              {/* Gully Tools Dropdown */}
              <div className="nav-dropdown">
                <button className="nav-dropdown-trigger interactive" style={{ cursor: 'none' }}>
                  Gully Tools <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>keyboard_arrow_down</span>
                </button>
                <div className="nav-dropdown-menu">
                  <button onClick={() => handleTabTransition('scorer')} className={`nav-dropdown-item interactive ${currentTab === 'scorer' ? 'active' : ''}`} style={{ cursor: 'none' }}>
                    📊 Live Scorer
                  </button>
                  <button onClick={() => handleTabTransition('toss')} className={`nav-dropdown-item interactive ${currentTab === 'toss' ? 'active' : ''}`} style={{ cursor: 'none' }}>
                    🪙 Coin Flipper
                  </button>
                  <button onClick={() => handleTabTransition('tournament')} className={`nav-dropdown-item interactive ${currentTab === 'tournament' ? 'active' : ''}`} style={{ cursor: 'none' }}>
                    🏆 Bracket Builder
                  </button>
                  <button onClick={() => handleTabTransition('players')} className={`nav-dropdown-item interactive ${currentTab === 'players' ? 'active' : ''}`} style={{ cursor: 'none' }}>
                    👤 Player Stats
                  </button>
                </div>
              </div>

              {/* Clubhouse Dropdown */}
              <div className="nav-dropdown">
                <button className="nav-dropdown-trigger interactive" style={{ cursor: 'none' }}>
                  Clubhouse <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>keyboard_arrow_down</span>
                </button>
                <div className="nav-dropdown-menu">
                  <button onClick={() => handleTabTransition('academy')} className={`nav-dropdown-item interactive ${currentTab === 'academy' ? 'active' : ''}`} style={{ cursor: 'none' }}>
                    🎖️ Trophy Cabinet
                  </button>
                  <button onClick={() => handleTabTransition('leaderboard')} className={`nav-dropdown-item interactive ${currentTab === 'leaderboard' ? 'active' : ''}`} style={{ cursor: 'none' }}>
                    📈 Leaderboard
                  </button>
                </div>
              </div>

              <button
                onClick={() => handleTabTransition('contact')}
                className={`nav-direct-link interactive ${currentTab === 'contact' ? 'active' : ''}`}
                style={{ cursor: 'none' }}
              >
                Contact
              </button>
            </div>

            {/* Right Action buttons */}
            <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button
                onClick={() => handleTabTransition('play')}
                className="interactive nav-play-now-btn"
                style={{ cursor: 'none', borderRadius: '12px' }}
              >
                PLAY NOW
              </button>
            </div>

            {/* Hamburger mobile toggle (Visible on screens <= 1024px) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'none',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '5px',
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                cursor: 'none',
                zIndex: 1002,
                padding: 0,
              }}
              className="hamburger-btn interactive"
              aria-label="Toggle Menu"
            >
              <div style={{ width: '18px', height: '2px', backgroundColor: '#FFFFFF', transition: 'all 0.3s', transform: mobileMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
              <div style={{ width: '18px', height: '2px', backgroundColor: '#FFFFFF', transition: 'all 0.3s', opacity: mobileMenuOpen ? 0 : 1 }} />
              <div style={{ width: '18px', height: '2px', backgroundColor: '#FFFFFF', transition: 'all 0.3s', transform: mobileMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
            </button>
          </nav>



          {/* APP BOTTOM NAVIGATION FOR MOBILE */}
          <nav className="bottom-nav-dock">
            <button onClick={() => handleTabTransition('home')} className={`bottom-nav-btn interactive ${currentTab === 'home' ? 'active' : ''}`}>
              <span className="material-symbols-outlined">home</span>
              Home
            </button>
            <button onClick={() => handleTabTransition('play')} className={`bottom-nav-btn interactive ${currentTab === 'play' ? 'active' : ''}`}>
              <span className="material-symbols-outlined">sports_cricket</span>
              Play
            </button>
            <button onClick={() => handleTabTransition('practice')} className={`bottom-nav-btn interactive ${currentTab === 'practice' ? 'active' : ''}`}>
              <span className="material-symbols-outlined">sports_baseball</span>
              Nets
            </button>
            <button onClick={() => handleTabTransition('scorer')} className={`bottom-nav-btn interactive ${currentTab === 'scorer' ? 'active' : ''}`}>
              <span className="material-symbols-outlined">analytics</span>
              Scorer
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`bottom-nav-btn interactive ${mobileMenuOpen ? 'active' : ''}`}>
              <span className="material-symbols-outlined">menu_open</span>
              More
            </button>
          </nav>

          {/* MOBILE DRAWER NAVIGATION MENU */}
          {mobileMenuOpen && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(6, 8, 20, 0.98)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                zIndex: 998,
                display: 'flex',
                flexDirection: 'column',
                padding: '90px 24px 40px',
                animation: 'tabTransition 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)'
              }}
            >
              {/* Header inside menu */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '15px', marginBottom: '20px' }}>
                <h3 style={{ fontFamily: 'var(--font-headings)', fontSize: '1.2rem', color: '#FFF', margin: 0, letterSpacing: '1px' }}>
                  NAVIGATE STADIUM
                </h3>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'none',
                    color: '#FFF'
                  }}
                  className="interactive"
                  aria-label="Close menu"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
                </button>
              </div>

              {/* Scrollable single column categories list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flexGrow: 1, overflowY: 'auto', paddingRight: '6px', paddingBottom: '30px' }}>

                {/* Play Arena Group */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-data)', color: 'var(--primary)', letterSpacing: '2px', textTransform: 'uppercase', paddingLeft: '8px' }}>
                    Play Arena
                  </span>
                  <button
                    onClick={() => handleTabTransition('play')}
                    className="mobile-nav-subitem interactive"
                    style={{
                      textAlign: 'left',
                      fontSize: '1.25rem',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'none',
                      borderLeft: currentTab === 'play' ? '3px solid var(--primary)' : '3px solid transparent',
                      background: currentTab === 'play' ? 'rgba(245, 158, 11, 0.06)' : 'none',
                      color: currentTab === 'play' ? 'var(--primary)' : 'var(--text-primary)',
                      fontFamily: 'var(--font-headings)'
                    }}
                  >
                    🏏 Play Game
                  </button>
                  <button
                    onClick={() => handleTabTransition('practice')}
                    className="mobile-nav-subitem interactive"
                    style={{
                      textAlign: 'left',
                      fontSize: '1.25rem',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'none',
                      borderLeft: currentTab === 'practice' ? '3px solid var(--primary)' : '3px solid transparent',
                      background: currentTab === 'practice' ? 'rgba(245, 158, 11, 0.06)' : 'none',
                      color: currentTab === 'practice' ? 'var(--primary)' : 'var(--text-primary)',
                      fontFamily: 'var(--font-headings)'
                    }}
                  >
                    🥎 Practice Nets
                  </button>
                  <button
                    onClick={() => handleTabTransition('arcade')}
                    className="mobile-nav-subitem interactive"
                    style={{
                      textAlign: 'left',
                      fontSize: '1.25rem',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'none',
                      borderLeft: currentTab === 'arcade' ? '3px solid var(--primary)' : '3px solid transparent',
                      background: currentTab === 'arcade' ? 'rgba(245, 158, 11, 0.06)' : 'none',
                      color: currentTab === 'arcade' ? 'var(--primary)' : 'var(--text-primary)',
                      fontFamily: 'var(--font-headings)'
                    }}
                  >
                    🕹️ Arcade Hub
                  </button>
                </div>

                {/* Gully Tools Group */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-data)', color: 'var(--secondary)', letterSpacing: '2px', textTransform: 'uppercase', paddingLeft: '8px' }}>
                    Gully Tools
                  </span>
                  <button
                    onClick={() => handleTabTransition('scorer')}
                    className="mobile-nav-subitem interactive"
                    style={{
                      textAlign: 'left',
                      fontSize: '1.25rem',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'none',
                      borderLeft: currentTab === 'scorer' ? '3px solid var(--primary)' : '3px solid transparent',
                      background: currentTab === 'scorer' ? 'rgba(245, 158, 11, 0.06)' : 'none',
                      color: currentTab === 'scorer' ? 'var(--primary)' : 'var(--text-primary)',
                      fontFamily: 'var(--font-headings)'
                    }}
                  >
                    📊 Live Scorer
                  </button>
                  <button
                    onClick={() => handleTabTransition('toss')}
                    className="mobile-nav-subitem interactive"
                    style={{
                      textAlign: 'left',
                      fontSize: '1.25rem',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'none',
                      borderLeft: currentTab === 'toss' ? '3px solid var(--primary)' : '3px solid transparent',
                      background: currentTab === 'toss' ? 'rgba(245, 158, 11, 0.06)' : 'none',
                      color: currentTab === 'toss' ? 'var(--primary)' : 'var(--text-primary)',
                      fontFamily: 'var(--font-headings)'
                    }}
                  >
                    🪙 Coin Flipper
                  </button>
                  <button
                    onClick={() => handleTabTransition('tournament')}
                    className="mobile-nav-subitem interactive"
                    style={{
                      textAlign: 'left',
                      fontSize: '1.25rem',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'none',
                      borderLeft: currentTab === 'tournament' ? '3px solid var(--primary)' : '3px solid transparent',
                      background: currentTab === 'tournament' ? 'rgba(245, 158, 11, 0.06)' : 'none',
                      color: currentTab === 'tournament' ? 'var(--primary)' : 'var(--text-primary)',
                      fontFamily: 'var(--font-headings)'
                    }}
                  >
                    🏆 Bracket Builder
                  </button>
                  <button
                    onClick={() => handleTabTransition('players')}
                    className="mobile-nav-subitem interactive"
                    style={{
                      textAlign: 'left',
                      fontSize: '1.25rem',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'none',
                      borderLeft: currentTab === 'players' ? '3px solid var(--primary)' : '3px solid transparent',
                      background: currentTab === 'players' ? 'rgba(245, 158, 11, 0.06)' : 'none',
                      color: currentTab === 'players' ? 'var(--primary)' : 'var(--text-primary)',
                      fontFamily: 'var(--font-headings)'
                    }}
                  >
                    👤 Player Stats
                  </button>
                </div>

                {/* Clubhouse Group */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-data)', color: 'var(--accent)', letterSpacing: '2px', textTransform: 'uppercase', paddingLeft: '8px' }}>
                    Clubhouse
                  </span>
                  <button
                    onClick={() => handleTabTransition('academy')}
                    className="mobile-nav-subitem interactive"
                    style={{
                      textAlign: 'left',
                      fontSize: '1.25rem',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'none',
                      borderLeft: currentTab === 'academy' ? '3px solid var(--primary)' : '3px solid transparent',
                      background: currentTab === 'academy' ? 'rgba(245, 158, 11, 0.06)' : 'none',
                      color: currentTab === 'academy' ? 'var(--primary)' : 'var(--text-primary)',
                      fontFamily: 'var(--font-headings)'
                    }}
                  >
                    🎖️ Trophy Cabinet
                  </button>
                  <button
                    onClick={() => handleTabTransition('leaderboard')}
                    className="mobile-nav-subitem interactive"
                    style={{
                      textAlign: 'left',
                      fontSize: '1.25rem',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'none',
                      borderLeft: currentTab === 'leaderboard' ? '3px solid var(--primary)' : '3px solid transparent',
                      background: currentTab === 'leaderboard' ? 'rgba(245, 158, 11, 0.06)' : 'none',
                      color: currentTab === 'leaderboard' ? 'var(--primary)' : 'var(--text-primary)',
                      fontFamily: 'var(--font-headings)'
                    }}
                  >
                    📈 Leaderboard
                  </button>
                </div>

                {/* General Group */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-data)', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase', paddingLeft: '8px' }}>
                    General
                  </span>
                  <button
                    onClick={() => handleTabTransition('home')}
                    className="mobile-nav-subitem interactive"
                    style={{
                      textAlign: 'left',
                      fontSize: '1.25rem',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'none',
                      borderLeft: currentTab === 'home' ? '3px solid var(--primary)' : '3px solid transparent',
                      background: currentTab === 'home' ? 'rgba(245, 158, 11, 0.06)' : 'none',
                      color: currentTab === 'home' ? 'var(--primary)' : 'var(--text-primary)',
                      fontFamily: 'var(--font-headings)'
                    }}
                  >
                    🏠 Dashboard
                  </button>
                  <button
                    onClick={() => handleTabTransition('contact')}
                    className="mobile-nav-subitem interactive"
                    style={{
                      textAlign: 'left',
                      fontSize: '1.25rem',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'none',
                      borderLeft: currentTab === 'contact' ? '3px solid var(--primary)' : '3px solid transparent',
                      background: currentTab === 'contact' ? 'rgba(245, 158, 11, 0.06)' : 'none',
                      color: currentTab === 'contact' ? 'var(--primary)' : 'var(--text-primary)',
                      fontFamily: 'var(--font-headings)'
                    }}
                  >
                    📬 Contact
                  </button>
                </div>

              </div>

              {/* Mobile Drawer Footer */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Manoj Kumar Sharma &copy; 2026</span>
                <a
                  href="https://manojkumarsharma.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '0.74rem',
                    color: 'var(--primary)',
                    fontWeight: 'bold',
                    border: '1px solid var(--primary)',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    cursor: 'none'
                  }}
                  className="interactive"
                >
                  Portfolio
                </a>
              </div>
            </div>
          )}

          {/* Global Toast Alert */}
          {toastMessage && (
            <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
          )}

          {/* MAIN CONTENT CANVAS */}
          <main className="main-canvas-hud">

            {/* TAB VIEW 1: HOME PAGE */}
            {currentTab === 'home' && (
              <div style={{ animation: 'tabTransition 0.5s ease-out', position: 'relative' }}>
                <div className="cyber-grid-overlay" />
                <div className="aurora-container">
                  <div className="aurora-spotlight-1" />
                  <div className="aurora-spotlight-2" />
                </div>

                {/* HERO SECTION */}
                <section
                  style={{
                    minHeight: '80vh',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '40px 4%',
                    position: 'relative',
                    flexWrap: 'wrap',
                    gap: '40px',
                    zIndex: 5
                  }}
                >
                  {/* Left Hero side */}
                  <div style={{ flex: '1.2', minWidth: '320px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', zIndex: 5, textAlign: 'left' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-data)',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        letterSpacing: '4px',
                        color: 'var(--accent)',
                        marginBottom: '18px',
                        textTransform: 'uppercase',
                        border: '1px solid rgba(249, 115, 22, 0.3)',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        backgroundColor: 'rgba(249, 115, 22, 0.04)'
                      }}
                    >
                      THE ULTIMATE WEB CRICKET ARENA
                    </div>

                    <h1 className="gradient-text-indigo-cyan" style={{ fontFamily: 'var(--font-headings)', fontSize: '4.5rem', lineHeight: '1.05', letterSpacing: '-1.5px', marginBottom: '16px', fontWeight: 800, textTransform: 'uppercase' }}>
                      Manu Crick
                    </h1>

                    <h2 style={{ fontFamily: 'var(--font-headings)', fontSize: '2.0rem', lineHeight: '1.15', letterSpacing: '-0.5px', marginBottom: '24px', fontWeight: 700, color: '#FFF', textTransform: 'uppercase' }}>
                      Play. Train. Analyze. Conquer.
                    </h2>

                    <p style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: '1.6', maxWidth: '580px' }}>
                      Play Manu Crick games online. Enjoy the best cricket gaming experience with Manu Crick. Experience browser-based cricket simulated with deep physics modeling. Track match progress in real time, customize batting variables, and climb global brackets.
                    </p>

                    <div style={{ display: 'flex', gap: '16px', marginBottom: '40px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleTabTransition('play')}
                        onMouseMove={handleMagneticMove}
                        onMouseLeave={handleMagneticLeave}
                        style={{
                          padding: '16px 36px',
                          border: 'none',
                          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                          color: '#FFFFFF',
                          fontFamily: 'var(--font-headings)',
                          fontSize: '1.0rem',
                          fontWeight: 800,
                          letterSpacing: '1.5px',
                          cursor: 'none',
                          borderRadius: '14px',
                          boxShadow: '0 10px 25px rgba(245, 158, 11, 0.35)',
                          transition: 'transform 0.1s ease',
                        }}
                        className="interactive magnetic-btn btn-pulse"
                      >
                        ⚡ ENTER ARENA
                      </button>

                      <button
                        onClick={() => handleTabTransition('practice')}
                        onMouseMove={handleMagneticMove}
                        onMouseLeave={handleMagneticLeave}
                        style={{
                          padding: '15px 33px',
                          border: '1.5px solid rgba(255, 255, 255, 0.08)',
                          backgroundColor: 'rgba(255, 255, 255, 0.02)',
                          color: '#FFFFFF',
                          fontFamily: 'var(--font-body)',
                          fontWeight: 700,
                          fontSize: '1.0rem',
                          letterSpacing: '1px',
                          cursor: 'none',
                          borderRadius: '14px',
                          transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                        }}
                        className="interactive magnetic-btn learn-more-btn"
                      >
                        PRACTICE NETS
                      </button>
                    </div>

                    {/* Stats counters */}
                    <div style={{ display: 'flex', gap: '30px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px', width: '100%', maxWidth: '500px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '100px' }}>
                        <div style={{ fontFamily: 'var(--font-headings)', fontSize: '1.8rem', color: 'var(--primary)', display: 'flex', gap: '3px', fontWeight: 800 }}>
                          <StatsCounter targetValue={500} suffix="+" />
                        </div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontFamily: 'var(--font-data)', fontWeight: 700, letterSpacing: '1.5px', marginTop: '4px' }}>Batsmen Active</div>
                      </div>
                      <div style={{ flex: 1, minWidth: '100px' }}>
                        <div style={{ fontFamily: 'var(--font-headings)', fontSize: '1.8rem', color: 'var(--accent)', display: 'flex', gap: '3px', fontWeight: 800 }} className="cyber-glow-cyan">
                          <StatsCounter targetValue={10000} suffix="+" />
                        </div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontFamily: 'var(--font-data)', fontWeight: 700, letterSpacing: '1.5px', marginTop: '4px' }}>Deliveries Faced</div>
                      </div>
                      <div style={{ flex: 1, minWidth: '100px' }}>
                        <div style={{ fontFamily: 'var(--font-headings)', fontSize: '1.8rem', color: '#FFF', display: 'flex', gap: '3px', fontWeight: 800 }}>
                          <StatsCounter targetValue={50} suffix="+" />
                        </div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontFamily: 'var(--font-data)', fontWeight: 700, letterSpacing: '1.5px', marginTop: '4px' }}>Global Stadiums</div>
                      </div>
                    </div>
                  </div>

                  {/* Right 3D Scene */}
                  <div style={{ flex: '1', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', minWidth: '320px', height: '420px', zIndex: 4 }}>
                    <div
                      style={{
                        position: 'absolute',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent)',
                        boxShadow: '0 0 20px var(--accent)',
                        animation: 'heroBallFly 5s infinite cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        zIndex: 6,
                        pointerEvents: 'none',
                      }}
                    />
                    <ThreeDBat />
                    <div style={{ position: 'absolute', bottom: '10px', width: '180px', height: '60px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(99,102,241,0.1)', transform: 'perspective(120px) rotateX(60deg)', borderRadius: '50%' }} />
                  </div>
                </section>

                {/* BENTO GRID: FEATURES */}
                <section style={{ width: '100%', padding: '80px 4%', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
                    <div className="section-title-wrapper" style={{ marginBottom: '50px' }}>
                      <h2 ref={observeRef} className="reveal-text" style={{ fontFamily: 'var(--font-headings)', fontSize: '2.5rem', color: '#FFF', position: 'relative', margin: 0, fontWeight: 800 }}>
                        Engine Mechanics
                      </h2>
                      <p style={{ color: 'var(--text-secondary)', marginTop: '15px', fontSize: '0.96rem' }}>Every module is engineered for maximum precision, providing instant feedback for competitive players.</p>
                    </div>

                    {/* Bento Grid */}
                    <div className="bento-features-grid">
                      {/* Grid Item 1: Running */}
                      <div className="glass-panel bento-card-7" style={{ minHeight: '260px', padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left', borderRadius: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(245, 158, 11, 0.08)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '26px', color: 'var(--primary)' }}>directions_run</span>
                          </div>
                          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-data)', color: 'var(--primary)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '2px 8px', borderRadius: '6px' }}>MANUAL RUNNING</span>
                        </div>
                        <div>
                          <h3 style={{ fontFamily: 'var(--font-headings)', fontSize: '1.25rem', margin: '15px 0 8px 0', fontWeight: 'bold' }}>Interactive Running</h3>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.6' }}>
                            Hit in gaps and trigger runs manually. Slide home or stop in creases to prevent run-out wickets from fielding throws with high-fidelity control.
                          </p>
                        </div>
                        <button onClick={() => handleTabTransition('play')} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontFamily: 'var(--font-data)', fontSize: '0.72rem', fontWeight: 'bold', background: 'none', border: 'none', padding: 0, cursor: 'none', marginTop: '15px' }} className="interactive">
                          LAUNCH ARENA <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
                        </button>
                      </div>

                      {/* Grid Item 2: Steer */}
                      <div className="glass-panel bento-card-5" style={{ minHeight: '260px', padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left', borderRadius: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(249, 115, 22, 0.08)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(249, 115, 22, 0.15)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '26px', color: 'var(--accent)' }}>target</span>
                          </div>
                          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-data)', color: 'var(--accent)', border: '1px solid rgba(249, 115, 22, 0.2)', padding: '2px 8px', borderRadius: '6px' }}>PHYSICS AIM</span>
                        </div>
                        <div>
                          <h3 style={{ fontFamily: 'var(--font-headings)', fontSize: '1.25rem', margin: '15px 0 8px 0', fontWeight: 'bold' }}>Steering Aim Arc</h3>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.6' }}>
                            Calibrate shot directions precisely to find gaps and steer clear of catches.
                          </p>
                        </div>
                        <button onClick={() => handleTabTransition('play')} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontFamily: 'var(--font-data)', fontSize: '0.72rem', fontWeight: 'bold', background: 'none', border: 'none', padding: 0, cursor: 'none', marginTop: '15px' }} className="interactive">
                          AIM ARC <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
                        </button>
                      </div>

                      {/* Grid Item 3: Scorer */}
                      <div className="glass-panel bento-card-5" style={{ minHeight: '260px', padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left', borderRadius: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(252, 211, 77, 0.08)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(252, 211, 77, 0.15)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '26px', color: 'var(--secondary)' }}>analytics</span>
                          </div>
                          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-data)', color: 'var(--secondary)', border: '1px solid rgba(252, 211, 77, 0.2)', padding: '2px 8px', borderRadius: '6px' }}>STATS RUN</span>
                        </div>
                        <div>
                          <h3 style={{ fontFamily: 'var(--font-headings)', fontSize: '1.25rem', margin: '15px 0 8px 0', fontWeight: 'bold' }}>Live Scorer Engine</h3>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.6' }}>
                            Full scorecard builder, run logs, and PDF scorecard download.
                          </p>
                        </div>
                        <button onClick={() => handleTabTransition('scorer')} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)', fontFamily: 'var(--font-data)', fontSize: '0.72rem', fontWeight: 'bold', background: 'none', border: 'none', padding: 0, cursor: 'none', marginTop: '15px' }} className="interactive">
                          OPEN SCORER <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
                        </button>
                      </div>

                      {/* Grid Item 4: Training */}
                      <div className="glass-panel bento-card-7" style={{ minHeight: '260px', padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left', borderRadius: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '26px', color: '#FFF' }}>sports_baseball</span>
                          </div>
                          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-data)', color: '#FFF', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>NETS</span>
                        </div>
                        <div>
                          <h3 style={{ fontFamily: 'var(--font-headings)', fontSize: '1.25rem', margin: '15px 0 8px 0', fontWeight: 'bold' }}>Nets Training Complex</h3>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.6' }}>
                            Refine swings against Fast seamers, curve Outswingers, high Bouncers, and Offspin breaks. Review release intervals and batting sweet-spot hits.
                          </p>
                        </div>
                        <button onClick={() => handleTabTransition('practice')} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFF', fontFamily: 'var(--font-data)', fontSize: '0.72rem', fontWeight: 'bold', background: 'none', border: 'none', padding: 0, cursor: 'none', marginTop: '15px' }} className="interactive">
                          START TRAINING <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
                        </button>
                      </div>
                    </div>

                    {/* How to Play Section */}
                    <HowToPlay />
                  </div>
                </section>

                {/* LEGENDS VAULT */}
                <section style={{ width: '100%', background: 'rgba(255,255,255,0.01)', padding: '80px 4%', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '50px', flexWrap: 'wrap', gap: '24px', textAlign: 'left' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '8px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>military_tech</span>
                          <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.72rem', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 'bold' }}>PREMIUM ACHIEVEMENTS</span>
                        </div>
                        <h2 style={{ fontFamily: 'var(--font-headings)', fontSize: '2.5rem', textTransform: 'uppercase', margin: 0, fontWeight: 800 }}>Legends Vault</h2>
                        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontSize: '0.96rem', marginTop: '6px' }}>
                          Track match achievements to unlock premium bat designs, gloves, and virtual stickers.
                        </p>
                      </div>
                      <button
                        onClick={() => handleTabTransition('academy')}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#FFF', fontFamily: 'var(--font-data)', fontSize: '0.78rem', fontWeight: 'bold', letterSpacing: '1px', borderRadius: '10px', cursor: 'none' }}
                        className="interactive"
                      >
                        VIEW CABINET
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                      {/* Achievement 1 */}
                      <div className="glass-panel hazard-tag" style={{ padding: '24px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '18px', borderRadius: '16px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(249, 115, 22, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: '22px' }}>workspace_premium</span>
                        </div>
                        <div>
                          <h4 style={{ fontFamily: 'var(--font-headings)', fontSize: '1.1rem', margin: '0 0 4px 0', fontWeight: 'bold', color: '#FFF' }}>CENTURION</h4>
                          <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.62rem', color: 'var(--text-secondary)', letterSpacing: '1px' }}>SCORE 100+ RUNS IN A MATCH</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: '75%', height: '100%', backgroundColor: 'var(--accent)' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-data)', fontSize: '0.62rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>75/100 Runs</span>
                            <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>75%</span>
                          </div>
                        </div>
                      </div>

                      {/* Achievement 2 */}
                      <div className="glass-panel hazard-tag" style={{ padding: '24px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '18px', borderRadius: '16px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '22px' }}>stars</span>
                        </div>
                        <div>
                          <h4 style={{ fontFamily: 'var(--font-headings)', fontSize: '1.1rem', margin: '0 0 4px 0', fontWeight: 'bold', color: '#FFF' }}>STADIUM ACE</h4>
                          <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.62rem', color: 'var(--text-secondary)', letterSpacing: '1px' }}>WIN 10 MATCHES IN ARENA</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: '40%', height: '100%', backgroundColor: 'var(--primary)' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-data)', fontSize: '0.62rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>4/10 Ws</span>
                            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>40%</span>
                          </div>
                        </div>
                      </div>

                      {/* Achievement 3 */}
                      <div className="glass-panel hazard-tag" style={{ padding: '24px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '18px', borderRadius: '16px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(252, 211, 77, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-outlined" style={{ color: 'var(--secondary)', fontSize: '22px' }}>bolt</span>
                        </div>
                        <div>
                          <h4 style={{ fontFamily: 'var(--font-headings)', fontSize: '1.1rem', margin: '0 0 4px 0', fontWeight: 'bold', color: '#FFF' }}>WARP SPEED</h4>
                          <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.62rem', color: 'var(--text-secondary)', letterSpacing: '1px' }}>DELIVER 140+ KM/H BALL</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--secondary)' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-data)', fontSize: '0.62rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>COMPLETED</span>
                            <span style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>100%</span>
                          </div>
                        </div>
                      </div>

                      {/* Achievement 4 */}
                      <div className="glass-panel hazard-tag" style={{ padding: '24px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '18px', borderRadius: '16px', opacity: 0.5 }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-outlined" style={{ color: 'var(--text-secondary)', fontSize: '22px' }}>lock</span>
                        </div>
                        <div>
                          <h4 style={{ fontFamily: 'var(--font-headings)', fontSize: '1.1rem', margin: '0 0 4px 0', fontWeight: 'bold', color: '#FFF' }}>GULLY KING</h4>
                          <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.62rem', color: 'var(--text-secondary)', letterSpacing: '1px' }}>SECRET ACHIEVEMENT</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: '0%', height: '100%', backgroundColor: 'rgba(255,255,255,0.1)' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-data)', fontSize: '0.62rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>LOCKED</span>
                            <span style={{ color: 'var(--text-secondary)' }}>0%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* THE STORY OF MANUCRICK */}
                <section style={{ width: '100%', padding: '80px 4%', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', gap: '50px', alignItems: 'center', flexWrap: 'wrap', textAlign: 'left' }}>
                      <div style={{ flex: '1.2', minWidth: '320px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '8px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>history_edu</span>
                          <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.72rem', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700 }}>THE CHRONICLES</span>
                        </div>
                        <h2 style={{ fontFamily: 'var(--font-headings)', fontSize: '2.5rem', fontWeight: 800, marginBottom: '18px', color: '#FFF' }}>Where Passion Meets Pixels</h2>
                        <p style={{ fontSize: '#0.96rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '20px' }}>
                          Born from a deep love for gully cricket and modern web engineering, <strong>ManucricK</strong> is the ultimate virtual stadium built directly in your browser. Whether you are timing sweet sweeps in the <strong>Play Arena</strong>, training your reflexes in the <strong>Practice Nets</strong>, or tracking matches with our robust <strong>Local Scorer</strong>, every module is designed to feel fast, responsive, and tactile.
                        </p>
                        <p style={{ fontSize: '#0.96rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '25px' }}>
                          Built using <strong>React</strong>, <strong>TypeScript</strong>, and premium custom CSS animations, the site leverages advanced browser APIs—like the <strong>Web Audio API</strong> for programmatic sound synthesis—to provide an immersive soundscape without loading heavy media assets.
                        </p>

                        <div className="responsive-grid-2">
                          <div style={{ borderLeft: '3px solid var(--secondary)', paddingLeft: '15px' }}>
                            <h4 style={{ fontFamily: 'var(--font-headings)', fontWeight: 700, fontSize: '1.05rem', color: '#FFF', margin: '0 0 4px 0' }}>Pure Performance</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>No heavy WebGL engines or bloated assets. Just lightweight, custom-optimized rendering.</p>
                          </div>
                          <div style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '15px' }}>
                            <h4 style={{ fontFamily: 'var(--font-headings)', fontWeight: 700, fontSize: '1.05rem', color: '#FFF', margin: '0 0 4px 0' }}>Tactile Experience</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Features satisfying hover offsets, magnetic buttons, and dynamic cursor states.</p>
                          </div>
                        </div>
                      </div>

                      <div style={{ flex: '0.8', minWidth: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className="glass-panel" style={{ padding: '40px 30px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden', borderLeft: '4px solid var(--primary)', borderRadius: '20px' }}>
                          <span style={{ fontSize: '2.5rem', marginBottom: '15px' }}>🪙</span>
                          <h4 style={{ fontFamily: 'var(--font-headings)', fontSize: '1.25rem', color: '#FFF', marginBottom: '8px', fontWeight: 'bold' }}>QUICK COIN FLIPPER</h4>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
                            Need a quick decision on who plays first? Test our 100% fair 50/50 probability coin tosser!
                          </p>

                          <div style={{ marginBottom: '24px' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--gold-metal)', border: '3px solid #F59E0B', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3), 0 0 15px rgba(245,158,11,0.4)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', animation: 'logoEntrance 1.5s infinite alternate ease-in-out' }}>
                              <span style={{ fontSize: '1.8rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>🏆</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleTabTransition('toss')}
                            style={{
                              padding: '12px 24px',
                              border: 'none',
                              backgroundColor: 'var(--primary)',
                              color: '#FFF',
                              fontFamily: 'var(--font-data)',
                              fontSize: '0.82rem',
                              fontWeight: 'bold',
                              letterSpacing: '1px',
                              cursor: 'none',
                              borderRadius: '8px',
                              boxShadow: '0 0 12px rgba(99,102,241,0.2)',
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

                {/* THOUGHTS SLIDER */}
                <section style={{ width: '100%', padding: '60px 4%', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
                    <div className="quote-slider-card">
                      <span className="quote-decor open">“</span>
                      <div style={{ minHeight: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center', transition: 'all 0.5s ease' }}>
                        <p style={{ fontFamily: 'var(--font-headings)', fontSize: '1.3rem', fontWeight: 600, color: '#FFF', fontStyle: 'italic', marginBottom: '15px', lineHeight: '1.6' }}>
                          {thoughts[activeThoughtIdx].text}
                        </p>
                        <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-data)', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                          — {thoughts[activeThoughtIdx].author === "Manoj Kumar Sharma" ? (
                            <a href="https://manojkumarsharma.vercel.app/" target="_blank" rel="noopener noreferrer" className="interactive" style={{ color: 'inherit', textDecoration: 'underline', cursor: 'none' }}>
                              Manoj Kumar Sharma
                            </a>
                          ) : thoughts[activeThoughtIdx].author}
                        </span>
                      </div>
                      <span className="quote-decor close">”</span>

                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '25px' }}>
                        {thoughts.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveThoughtIdx(idx)}
                            style={{
                              width: '8px',
                              height: '8px',
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

                {/* MEET THE ARCHITECT */}
                <section style={{ width: '100%', padding: '80px 4%', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
                    <div className="section-title-wrapper" style={{ marginBottom: '50px' }}>
                      <h2 className="reveal-text visible" style={{ fontFamily: 'var(--font-headings)', fontSize: '2.5rem', color: '#FFF', position: 'relative', margin: 0, fontWeight: 800 }}>
                        Meet the Architect
                      </h2>
                    </div>

                    <div style={{ display: 'flex', gap: '30px', alignItems: 'stretch', flexWrap: 'wrap', textAlign: 'left' }}>
                      <div className="glass-panel" style={{ flex: '1.4', minWidth: '320px', padding: '36px', display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'space-between', borderLeft: '4px solid var(--primary)', borderRadius: '20px' }}>
                        <div>
                          <span style={{ fontFamily: 'var(--font-data)', fontWeight: 700, fontSize: '0.72rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '2.5px' }}>
                            ENTERPRISE FULL STACK ENGINEER
                          </span>
                          <h3 style={{ fontSize: '2.1rem', color: '#FFFFFF', marginTop: '5px', marginBottom: '12px', fontWeight: 800 }}>
                            <a href="https://manojkumarsharma.vercel.app/" target="_blank" rel="noopener noreferrer" className="interactive" style={{ color: 'inherit', textDecoration: 'underline', transition: 'color 0.2s', cursor: 'none' }}>
                              Manoj Kumar Sharma
                            </a>
                          </h3>
                          <p style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>
                            Enterprise Full Stack Software Engineer specializing in scalable retail operating systems, HRMS suites, and production-grade architectures. Currently engineering <strong>EnolaTech Retail OS</strong>, designing offline-first POS systems and robust database layers.
                          </p>

                          <h4 style={{ fontFamily: 'var(--font-headings)', fontSize: '1.1rem', color: '#FFF', marginTop: '20px', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                            Core Expertise
                          </h4>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', fontFamily: 'var(--font-data)' }}>
                                <span>JAVA 21 & SPRING BOOT</span>
                                <span style={{ color: 'var(--primary)' }}>95%</span>
                              </div>
                              <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ width: '95%', height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }} />
                              </div>
                            </div>

                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', fontFamily: 'var(--font-data)' }}>
                                <span>REACT & NEXT.JS PLATFORMS</span>
                                <span style={{ color: 'var(--primary)' }}>90%</span>
                              </div>
                              <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ width: '90%', height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }} />
                              </div>
                            </div>

                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', fontFamily: 'var(--font-data)' }}>
                                <span>POSTGRESQL & SCHEMAS ARCHITECTURE</span>
                                <span style={{ color: 'var(--primary)' }}>92%</span>
                              </div>
                              <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ width: '92%', height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }} />
                              </div>
                            </div>

                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', fontFamily: 'var(--font-data)' }}>
                                <span>LIFERAY DXP & VAADIN ENTERPRISE</span>
                                <span style={{ color: 'var(--primary)' }}>88%</span>
                              </div>
                              <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ width: '88%', height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }} />
                              </div>
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
                  <div className="section-title-wrapper" style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontFamily: 'var(--font-headings)', fontSize: '2.5rem', color: '#FFF', fontWeight: 800 }}>
                      MANUCRICK PLAY NOW
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '4px', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'var(--font-data)' }}>
                      OPERATED BY <a href="https://manojkumarsharma.vercel.app/" target="_blank" rel="noopener noreferrer" className="interactive" style={{ color: 'var(--primary)', textDecoration: 'underline', cursor: 'none' }}>MANOJ KUMAR SHARMA</a> &bull; THE ULTIMATE ARENA
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
                        <h3 style={{ fontSize: '1.4rem', color: 'var(--primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                          🏟️ ARENA DASHBOARD
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                          Welcome to the official arena of <a href="https://manojkumarsharma.vercel.app/" target="_blank" rel="noopener noreferrer" className="interactive" style={{ color: 'var(--primary)', textDecoration: 'underline', cursor: 'none' }}>Manoj Kumar Sharma</a>. Equip your gear, review guidelines, and take your stance.
                        </p>
                      </div>

                      {/* Quick Gear Customization */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '15px' }}>
                        <h4 style={{ fontSize: '0.96rem', color: '#FFF', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>
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
                              <div style={{ fontWeight: 'bold', fontSize: '0.88rem', color: '#FFF' }}>Kashmir Willow Pro</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Standard wood bat, balanced swing speed.</div>
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
                              <div style={{ fontWeight: 'bold', fontSize: '0.88rem', color: 'var(--primary)' }}>Cyber-Carbon Neon</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Lightweight cyber chassis with glowing tracer seam.</div>
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
                              <div style={{ fontWeight: 'bold', fontSize: '0.88rem', color: 'var(--secondary)' }}>Manoj's Helicopter Special</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Heavy profile custom wood. Unlocks explosive power!</div>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Jersey Settings */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <h4 style={{ fontSize: '0.96rem', color: '#FFF', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>
                          👕 Jersey Settings
                        </h4>
                        <button
                          onClick={() => setCustomizingPlayer(!customizingPlayer)}
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '10px',
                            border: '1.5px solid var(--primary)',
                            backgroundColor: customizingPlayer ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.03)',
                            color: 'var(--primary)',
                            fontFamily: 'var(--font-headings)',
                            fontSize: '1.0rem',
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
                        <h4 style={{ fontSize: '0.96rem', color: '#FFF', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>
                          📖 Stadium Guidelines
                        </h4>
                        <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px', lineHeight: '1.4', textAlign: 'left' }}>
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
                    <h2 style={{ fontFamily: 'var(--font-headings)', fontSize: '2.5rem', color: '#FFF', fontWeight: 800 }}>
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

            {/* TAB VIEW: TOURNAMENT BRACKET */}
            {currentTab === 'tournament' && (
              <div style={{ padding: '60px 4%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'tabTransition 0.5s ease-out', width: '100%' }}>
                <div style={{ width: '100%', maxWidth: '1200px', textAlign: 'center' }}>
                  <div className="section-title-wrapper">
                    <h2 style={{ fontFamily: 'var(--font-headings)', fontSize: '2.5rem', color: '#FFF', fontWeight: 800 }}>
                      TOURNAMENT BRACKET BUILDER
                    </h2>
                  </div>
                  <TournamentBracket />
                </div>
              </div>
            )}

            {/* TAB VIEW: PLAYER STATS */}
            {currentTab === 'players' && (
              <div style={{ padding: '60px 4%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'tabTransition 0.5s ease-out', width: '100%' }}>
                <div style={{ width: '100%', maxWidth: '1200px', textAlign: 'center' }}>
                  <div className="section-title-wrapper">
                    <h2 style={{ fontFamily: 'var(--font-headings)', fontSize: '2.5rem', color: '#FFF', fontWeight: 800 }}>
                      PLAYER PROFILES & SEASON STATS
                    </h2>
                  </div>
                  <PlayerStats />
                </div>
              </div>
            )}

            {/* TAB VIEW: TROPHY ROOM */}
            {currentTab === 'academy' && (
              <div style={{ padding: '60px 4%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'tabTransition 0.5s ease-out', width: '100%' }}>
                <div style={{ width: '100%', maxWidth: '1200px', textAlign: 'center' }}>
                  <div className="section-title-wrapper">
                    <h2 style={{ fontFamily: 'var(--font-headings)', fontSize: '2.5rem', color: '#FFF', fontWeight: 800 }}>
                      LEGENDS VAULT & TROPHY CABINET
                    </h2>
                  </div>
                  <TrophyCabinet />
                </div>
              </div>
            )}

            {/* TAB VIEW: ARCADE */}
            {currentTab === 'arcade' && (
              <div style={{ padding: '60px 4%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'tabTransition 0.5s ease-out', width: '100%' }}>
                <Suspense fallback={
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                    <div className="loading-spinner" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
                    <p style={{ marginTop: '15px', color: 'var(--text-secondary)', fontFamily: 'var(--font-headings)', letterSpacing: '1px' }}>LOADING ARCADE ARENA...</p>
                  </div>
                }>
                  <ArcadeHub />
                </Suspense>
              </div>
            )}

            {/* TAB VIEW 3: PRACTICE NETS */}
            {currentTab === 'practice' && (
              <div style={{ padding: '60px 8%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'tabTransition 0.5s ease-out' }}>
                <div style={{ width: '100%', maxWidth: '900px', textAlign: 'center' }}>
                  <div className="section-title-wrapper">
                    <h2 style={{ fontFamily: 'var(--font-headings)', fontSize: '2.5rem', color: '#FFF', fontWeight: 800 }}>
                      PRACTICE NETS
                    </h2>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto 30px', fontSize: '0.96rem' }}>
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
                  <h2 style={{ fontFamily: 'var(--font-headings)', fontSize: '2.5rem', color: '#FFF', fontWeight: 800 }}>
                    GET IN TOUCH
                  </h2>
                </div>
                <div style={{ marginTop: '40px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <ContactCard onToast={triggerToast} />
                </div>
              </div>
            )}

          </main>

          <Footer />
        </div>
      )}

      {/* Sawariya Floating Action Widgets */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
        className="floating-sawariya-widgets"
      >
        <a
          href="https://wa.me/916350542691?text=Hello%20Manoj%20Kumar%20Sharma,%20I%20visited%20your%20ManuCrick%20platform%20and%20want%20to%20connect!"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: '#25D366',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(37, 211, 102, 0.4)',
            cursor: 'none',
            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
          }}
          className="interactive floating-action-btn"
          title="Connect on WhatsApp"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#FFF">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.451L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.852.002-2.63-1.023-5.101-2.883-6.963C16.588 1.926 14.12 1.01 11.492 1.01c-5.452 0-9.887 4.437-9.89 9.873-.001 1.779.475 3.51 1.378 5.037L1.87 20.612l4.777-1.458zm12.28-5.321c-.302-.15-.1.85-.302-1.002-.089-.148-.207-.229-.437-.344-.229-.115-1.353-.667-1.562-.743-.21-.076-.361-.115-.513.115-.152.23-.588.743-.72.894-.132.152-.263.17-.565.02-.301-.15-1.272-.468-2.422-1.494-.895-.797-1.498-1.782-1.674-2.083-.175-.301-.019-.464.131-.613.136-.134.302-.351.453-.527.151-.176.201-.293.302-.49.101-.196.05-.369-.026-.52-.076-.15-.635-1.53-.87-2.096-.229-.553-.458-.477-.63-.487-.162-.008-.347-.01-.533-.01-.187 0-.491.07-.748.349-.257.279-.982.96-.982 2.342 0 1.382 1.005 2.716 1.147 2.902.141.186 1.977 3.019 4.79 4.23.669.288 1.192.46 1.6.592.673.214 1.285.184 1.768.112.539-.08 1.562-.638 1.782-1.256.22-.619.22-1.15.152-1.256-.068-.106-.25-.17-.552-.32z" />
          </svg>
        </a>
        <a
          href="tel:6350542691"
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
            cursor: 'none',
            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
          }}
          className="interactive floating-action-btn"
          title="Call Us Now"
        >
          <span className="material-symbols-outlined" style={{ color: '#000', fontSize: '24px' }}>call</span>
        </a>
      </div>

      <style>{`
        .learn-more-btn:hover {
          background-color: rgba(255, 255, 255, 0.08) !important;
          border-color: #FFFFFF !important;
          box-shadow: 0 0 15px rgba(255,255,255,0.15);
        }

        .hover-underline:hover {
          text-decoration: underline !important;
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
