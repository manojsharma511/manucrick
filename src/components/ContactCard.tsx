import { useState } from 'react';
import type { FormEvent } from 'react';

interface ContactCardProps {
  onToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export function ContactCard({ onToast }: ContactCardProps) {
  const email = 'manojkumarsharma27096@gmail.com';
  const phone = '6350542691';

  // Contact Form State
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !senderEmail.trim() || !message.trim()) {
      onToast('Please fill out all mandatory fields!', 'warning');
      return;
    }

    const newMessage = {
      name: senderName.trim(),
      email: senderEmail.trim(),
      subject: subject.trim() || 'General Inquiry',
      message: message.trim(),
      date: new Date().toLocaleString(),
    };

    // Save to localStorage messages list
    const existingMessages = localStorage.getItem('manucrick_messages');
    let messages = [];
    if (existingMessages) {
      try {
        messages = JSON.parse(existingMessages);
      } catch (err) { }
    }
    messages.push(newMessage);
    localStorage.setItem('manucrick_messages', JSON.stringify(messages));

    // Clear form
    setSenderName('');
    setSenderEmail('');
    setSubject('');
    setMessage('');

    onToast('Message sent successfully! Saved to localStorage database. 📧', 'success');
  };

  const copyToClipboard = (text: string, type: 'email' | 'phone') => {
    navigator.clipboard.writeText(text);
    onToast(`Copied ${type === 'email' ? 'Email Address' : 'Phone Number'}!`);
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '30px',
        width: '100%',
        maxWidth: '920px',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
      }}
    >
      {/* Left side: Developer Jersey Details */}
      <div
        className="glass-panel scroll-animate"
        style={{
          flex: '1',
          minWidth: '320px',
          background: 'rgba(5, 10, 24, 0.45)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          overflow: 'hidden',
          cursor: 'none',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Jersey Header */}
        <div
          style={{
            width: '100%',
            height: '130px',
            background: 'linear-gradient(135deg, rgba(0, 255, 135, 0.12) 0%, rgba(255, 107, 0, 0.12) 100%)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            position: 'relative',
          }}
        >
          {/* Jersey Graphic */}
          <div
            style={{
              position: 'absolute',
              width: '80px',
              height: '85px',
              background: '#050A18',
              border: '2px solid var(--primary)',
              borderRadius: '8px 8px 0 0',
              bottom: '-1px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 -4px 12px rgba(0, 255, 135, 0.18)',
            }}
          >
            <div style={{ fontSize: '0.62rem', color: '#9CA3AF', fontWeight: 700, letterSpacing: '0.5px' }}>MKS</div>
            <div
              style={{
                fontFamily: 'var(--font-headings)',
                fontSize: '2.4rem',
                color: 'var(--secondary)',
                lineHeight: 1,
              }}
            >
              27
            </div>
          </div>
        </div>

        <div style={{ padding: '36px 28px 28px', textAlign: 'center' }}>
          <h4
            style={{
              fontFamily: 'var(--font-headings)',
              fontSize: '2.1rem',
              letterSpacing: '1px',
              color: '#FFFFFF',
              marginBottom: '4px',
            }}
          >
            Manoj Kumar Sharma
          </h4>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              textTransform: 'uppercase',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              fontSize: '0.82rem',
              letterSpacing: '2px',
              marginBottom: '26px',
            }}
          >
            Developer Credentials
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              textAlign: 'left',
              marginBottom: '25px',
            }}
          >
            {/* Email field */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                backgroundColor: 'rgba(255,255,255,0.012)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: '8px',
              }}
            >
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.8px', marginBottom: '2px' }}>Email Address</div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, color: '#FFF', fontSize: '0.94rem' }}>{email}</div>
              </div>
              <button
                onClick={() => copyToClipboard(email, 'email')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'none',
                  color: 'var(--primary)',
                  fontSize: '1.2rem',
                  opacity: 0.7,
                  display: 'flex',
                  alignItems: 'center',
                }}
                className="interactive copy-btn-emoji"
              >
                📋
              </button>
            </div>

            {/* Phone field */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                backgroundColor: 'rgba(255,255,255,0.012)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: '8px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.8px', marginBottom: '2px' }}>Phone Number</div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, color: '#FFF', fontSize: '0.94rem' }}>{phone}</div>
              </div>
              <button
                onClick={() => copyToClipboard(phone, 'phone')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'none',
                  color: 'var(--secondary)',
                  fontSize: '1.2rem',
                  opacity: 0.7,
                  display: 'flex',
                  alignItems: 'center',
                }}
                className="interactive copy-btn-emoji"
              >
                📋
              </button>
            </div>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <a
              href={`mailto:${email}`}
              style={{
                flex: 1,
                padding: '11px 0',
                borderRadius: '6px',
                border: '1px solid var(--primary)',
                backgroundColor: 'rgba(0, 255, 135, 0.04)',
                color: 'var(--primary)',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                textAlign: 'center',
                fontSize: '0.85rem',
                cursor: 'none',
              }}
              className="interactive mail-btn"
            >
              Send Email
            </a>
            <a
              href={`tel:${phone}`}
              style={{
                flex: 1,
                padding: '11px 0',
                borderRadius: '6px',
                border: '1px solid var(--secondary)',
                backgroundColor: 'rgba(255, 107, 0, 0.04)',
                color: 'var(--secondary)',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                textAlign: 'center',
                fontSize: '0.85rem',
                cursor: 'none',
              }}
              className="interactive call-btn"
            >
              Call Now
            </a>
          </div>
        </div>
      </div>

      {/* Right side: Functional Messaging Form */}
      <div
        className="glass-panel scroll-animate"
        style={{
          flex: '1.2',
          minWidth: '320px',
          padding: '30px 24px',
          background: 'rgba(5, 10, 24, 0.45)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          cursor: 'none',
        }}
      >
        <h4
          style={{
            fontFamily: 'var(--font-headings)',
            fontSize: '1.9rem',
            color: '#FFFFFF',
            letterSpacing: '1px',
            marginBottom: '15px',
          }}
        >
          ✉️ SEND DIRECT MESSAGE
        </h4>

        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Full Name *
            </label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Your Name"
              required
              style={{
                padding: '10px 14px',
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

          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Email Address *
            </label>
            <input
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="name@example.com"
              required
              style={{
                padding: '10px 14px',
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

          {/* Subject */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Inquiry Subject"
              style={{
                padding: '10px 14px',
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

          {/* Message */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Message *
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here..."
              required
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.08)',
                backgroundColor: 'rgba(255,255,255,0.02)',
                color: '#FFFFFF',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                outline: 'none',
                cursor: 'none',
                resize: 'none',
              }}
              className="interactive"
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '12px 0',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'var(--primary)',
              color: '#050A18',
              fontFamily: 'var(--font-headings)',
              fontSize: '1.25rem',
              letterSpacing: '1px',
              cursor: 'none',
              boxShadow: '0 0 10px rgba(0, 255, 135, 0.25)',
              transition: 'all 0.2s',
            }}
            className="interactive submit-msg-btn"
          >
            🚀 SEND MESSAGE
          </button>
        </form>
      </div>

      <style>{`
        .copy-btn-emoji:hover {
          opacity: 1 !important;
          transform: scale(1.12);
        }
        .mail-btn:hover {
          background-color: var(--primary) !important;
          color: #050A18 !important;
          box-shadow: 0 0 14px rgba(0, 255, 135, 0.35);
        }
        .call-btn:hover {
          background-color: var(--secondary) !important;
          color: #050A18 !important;
          box-shadow: 0 0 14px rgba(255, 107, 0, 0.35);
        }
        .submit-msg-btn:hover {
          box-shadow: 0 0 16px var(--primary) !important;
          transform: scale(1.01);
        }
      `}</style>
    </div>
  );
}
