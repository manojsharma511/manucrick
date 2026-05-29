import { useEffect, useState } from 'react';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
      
      const sections = ['home', 'about', 'play', 'contact'];
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 140 && rect.bottom >= 140) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(sectionId);
    if (el) {
      const offsetTop = el.offsetTop;
      window.scrollTo({
        top: offsetTop,
        behavior: 'auto', // The custom hook useSmoothScroll will interpolate this smoothly
      });
    }
  };

  const navLinks = [
    { label: 'Home', id: 'home' },
    { label: 'About', id: 'about' },
    { label: 'Play', id: 'play' },
    { label: 'Contact', id: 'contact' },
  ];

  return (
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
        background: scrolled ? 'rgba(5, 10, 24, 0.75)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid transparent',
      }}
    >
      {/* Brand logo letter-by-letter */}
      <div
        onClick={() => handleNavClick('home')}
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
              animationDelay: `${0.5 + index * 0.06}s`,
              opacity: 0,
              transform: 'scale(0.5) translateY(-5px)',
            }}
          >
            {char}
          </span>
        ))}
      </div>

      {/* Desktop Links */}
      <ul
        style={{
          display: 'flex',
          gap: '36px',
          listStyle: 'none',
          alignItems: 'center',
        }}
        className="desktop-nav"
      >
        {navLinks.map((link) => (
          <li key={link.id}>
            <button
              onClick={() => handleNavClick(link.id)}
              style={{
                background: 'none',
                border: 'none',
                color: activeSection === link.id ? 'var(--primary)' : 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '1.05rem',
                letterSpacing: '1.5px',
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
                className={`nav-underline ${activeSection === link.id ? 'active' : ''}`}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  height: '2px',
                  backgroundColor: 'var(--primary)',
                  transform: activeSection === link.id ? 'scaleX(1)' : 'scaleX(0)',
                  transformOrigin: 'left',
                  transition: 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  boxShadow: '0 0 8px var(--primary)',
                }}
              />
            </button>
          </li>
        ))}
      </ul>

      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        style={{
          background: 'none',
          border: 'none',
          display: 'none',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '30px',
          height: '20px',
          cursor: 'none',
          zIndex: 1002,
          padding: 0,
        }}
        className="hamburger-btn interactive"
        aria-label="Toggle Menu"
      >
        <span
          style={{
            width: '100%',
            height: '2px',
            backgroundColor: '#FFFFFF',
            transition: 'transform 0.3s, background-color 0.3s',
            transform: mobileMenuOpen ? 'rotate(45deg) translate(6px, 6px)' : 'none',
          }}
        />
        <span
          style={{
            width: '100%',
            height: '2px',
            backgroundColor: '#FFFFFF',
            transition: 'opacity 0.3s',
            opacity: mobileMenuOpen ? 0 : 1,
          }}
        />
        <span
          style={{
            width: '100%',
            height: '2px',
            backgroundColor: '#FFFFFF',
            transition: 'transform 0.3s',
            transform: mobileMenuOpen ? 'rotate(-45deg) translate(6px, -7px)' : 'none',
          }}
        />
      </button>

      {/* Mobile Full Screen Menu Overlay */}
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
        <ul
          style={{
            listStyle: 'none',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '40px',
          }}
        >
          {navLinks.map((link) => (
            <li key={link.id}>
              <button
                onClick={() => handleNavClick(link.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeSection === link.id ? 'var(--primary)' : '#FFFFFF',
                  fontFamily: 'var(--font-headings)',
                  fontSize: '3rem',
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                  cursor: 'none',
                  transition: 'color 0.3s',
                }}
                className="interactive"
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        @keyframes logoEntrance {
          0% { opacity: 0; transform: scale(0.5) translateY(-10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        
        .nav-link-btn:hover .nav-underline {
          transform: scaleX(1) !important;
        }

        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .hamburger-btn {
            display: flex !important;
          }
        }
      `}</style>
    </nav>
  );
}
