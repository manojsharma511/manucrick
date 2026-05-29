import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';

interface PlayerCustomizerProps {
  onSave: (customs: { name: string; jerseyColor: string; jerseyNumber: string; batGripColor: string }) => void;
  onClose: () => void;
}

export function PlayerCustomizer({ onSave, onClose }: PlayerCustomizerProps) {
  const [name, setName] = useState('Manoj');
  const [jerseyColor, setJerseyColor] = useState('#00FF87');
  const [jerseyNumber, setJerseyNumber] = useState('27');
  const [batGripColor, setBatGripColor] = useState('#FF6B00');

  useEffect(() => {
    const saved = localStorage.getItem('manucrick_custom_player');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setName(parsed.name || 'Manoj');
        setJerseyColor(parsed.jerseyColor || '#00FF87');
        setJerseyNumber(parsed.jerseyNumber || '27');
        setBatGripColor(parsed.batGripColor || '#FF6B00');
      } catch (err) {
        console.error('Failed to load customizations', err);
      }
    }
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const customs = {
      name: name.trim().slice(0, 14),
      jerseyColor,
      jerseyNumber: jerseyNumber.slice(0, 2) || '10',
      batGripColor,
    };
    localStorage.setItem('manucrick_custom_player', JSON.stringify(customs));
    onSave(customs);
  };

  const colors = [
    { name: 'Pitch Green', value: '#00FF87' },
    { name: 'Fire Orange', value: '#FF6B00' },
    { name: 'Neon Blue', value: '#00D2FF' },
    { name: 'Trophy Gold', value: '#FFD700' },
    { name: 'Crimson Red', value: '#FF3B30' },
  ];

  return (
    <div
      className="glass-panel"
      style={{
        width: '100%',
        maxWidth: '460px',
        padding: '28px 24px',
        margin: '20px auto',
        cursor: 'none',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-headings)',
          fontSize: '1.9rem',
          color: '#FFFFFF',
          marginBottom: '20px',
          letterSpacing: '1px',
          textAlign: 'center',
        }}
      >
        🏏 CUSTOMIZE BATSMAN
      </h3>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
            Batsman Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.08)',
              backgroundColor: 'rgba(255,255,255,0.02)',
              color: '#FFFFFF',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              outline: 'none',
              cursor: 'none',
            }}
            className="interactive"
          />
        </div>

        {/* Number */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
            Jersey Number (1-99)
          </label>
          <input
            type="number"
            min="1"
            max="99"
            value={jerseyNumber}
            onChange={(e) => setJerseyNumber(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.08)',
              backgroundColor: 'rgba(255,255,255,0.02)',
              color: '#FFFFFF',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              outline: 'none',
              cursor: 'none',
            }}
            className="interactive"
          />
        </div>

        {/* Jersey Colors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
            Jersey Theme
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {colors.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setJerseyColor(c.value)}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor: c.value,
                  border: jerseyColor === c.value ? '2px solid #FFFFFF' : '2px solid transparent',
                  boxShadow: jerseyColor === c.value ? `0 0 10px ${c.value}` : 'none',
                  cursor: 'none',
                  transition: 'all 0.2s',
                }}
                title={c.name}
                className="interactive"
              />
            ))}
          </div>
        </div>

        {/* Bat Grip Colors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
            Bat Grip Theme
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {colors.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setBatGripColor(c.value)}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor: c.value,
                  border: batGripColor === c.value ? '2px solid #FFFFFF' : '2px solid transparent',
                  boxShadow: batGripColor === c.value ? `0 0 10px ${c.value}` : 'none',
                  cursor: 'none',
                  transition: 'all 0.2s',
                }}
                title={c.name}
                className="interactive"
              />
            ))}
          </div>
        </div>

        {/* Form controls */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button
            type="submit"
            style={{
              flex: 1,
              padding: '11px 0',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'var(--primary)',
              color: '#050A18',
              fontFamily: 'var(--font-headings)',
              fontSize: '1.2rem',
              letterSpacing: '1px',
              cursor: 'none',
              boxShadow: '0 0 10px rgba(0, 255, 135, 0.25)',
            }}
            className="interactive"
          >
            SAVE JERSEY
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '11px 0',
              borderRadius: '6px',
              border: '1.5px solid rgba(255,255,255,0.12)',
              backgroundColor: 'transparent',
              color: '#FFFFFF',
              fontFamily: 'var(--font-headings)',
              fontSize: '1.2rem',
              letterSpacing: '1px',
              cursor: 'none',
            }}
            className="interactive"
          >
            CANCEL
          </button>
        </div>
      </form>
    </div>
  );
}
