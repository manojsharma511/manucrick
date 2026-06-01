import { useState, useEffect } from 'react';
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
  const [jerseyClicks, setJerseyClicks] = useState(0);
  const [showAdminInbox, setShowAdminInbox] = useState(false);
  
  // Real-time Cloud Messages State
  const [cloudMessages, setCloudMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const kvBucketId = 'manucrick_msg_store_c3f7b8d9';

  // Fetch messages from cloud KVdb store
  const fetchCloudMessages = async () => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`https://kvdb.io/${kvBucketId}/messages`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCloudMessages(data);
          // Also save/update local storage as a local backup
          localStorage.setItem('manucrick_messages', JSON.stringify(data));
        }
      } else if (res.status === 404) {
        // If key doesn't exist yet, initialize it as empty list
        setCloudMessages([]);
      }
    } catch (err) {
      console.error("Failed to fetch messages from KVdb", err);
      // Fallback to local storage if offline or error
      const local = localStorage.getItem('manucrick_messages');
      if (local) {
        try { setCloudMessages(JSON.parse(local)); } catch (e) {}
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  // Trigger fetch when admin inbox is toggled open
  useEffect(() => {
    if (showAdminInbox) {
      fetchCloudMessages();
    }
  }, [showAdminInbox]);

  const handleJerseyClick = () => {
    const clicks = jerseyClicks + 1;
    setJerseyClicks(clicks);
    if (clicks >= 5) {
      setShowAdminInbox(!showAdminInbox);
      setJerseyClicks(0);
      onToast(showAdminInbox ? 'Admin Inbox Closed' : 'Developer Admin Inbox Unlocked! 🔓', 'info');
    }
  };

  const handleFormSubmit = async (e: FormEvent) => {
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

    onToast('Submitting message...', 'info');

    // 1. Save local backup first
    const existingMessages = localStorage.getItem('manucrick_messages');
    let localMsgs = [];
    if (existingMessages) {
      try {
        localMsgs = JSON.parse(existingMessages);
      } catch (err) { }
    }
    localMsgs.push(newMessage);
    localStorage.setItem('manucrick_messages', JSON.stringify(localMsgs));

    // 2. Save to Cloud KVdb (fetch current first, append, and put)
    try {
      let currentCloudMsgs: any[] = [];
      const fetchRes = await fetch(`https://kvdb.io/${kvBucketId}/messages`);
      if (fetchRes.ok) {
        const data = await fetchRes.json();
        if (Array.isArray(data)) {
          currentCloudMsgs = data;
        }
      }
      const updatedCloudMsgs = [...currentCloudMsgs, newMessage];
      
      const putRes = await fetch(`https://kvdb.io/${kvBucketId}/messages`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCloudMsgs),
      });

      if (putRes.ok) {
        // Sync our local state if it's currently open
        setCloudMessages(updatedCloudMsgs);
      }
    } catch (err) {
      console.error("Failed to sync message to cloud database", err);
    }

    // 3. Open mail client populated
    try {
      const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(newMessage.subject)}&body=${encodeURIComponent(
        `Name: ${newMessage.name}\nEmail: ${newMessage.email}\nDate: ${newMessage.date}\n\nMessage:\n${newMessage.message}`
      )}`;
      window.open(mailtoUrl, '_blank');
    } catch (err) {
      console.warn("Failed to open mail client", err);
    }

    // Clear form
    setSenderName('');
    setSenderEmail('');
    setSubject('');
    setMessage('');

    onToast('Message saved to cloud database & email draft opened! 📧', 'success');
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
          {/* Jersey Graphic (Secret inbox toggle) */}
          <div
            onClick={handleJerseyClick}
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
              cursor: 'pointer',
            }}
            className="interactive"
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
            <a href="https://manojkumarsharma.vercel.app/" target="_blank" rel="noopener noreferrer" className="interactive" style={{ color: 'inherit', textDecoration: 'underline', cursor: 'none' }}>
              Manoj Kumar Sharma
            </a>
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

      {showAdminInbox && (
        <div
          className="glass-panel"
          style={{
            width: '100%',
            padding: '30px',
            background: 'rgba(5, 10, 24, 0.85)',
            border: '2px solid var(--primary)',
            borderRadius: '16px',
            marginTop: '20px',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', flexWrap: 'wrap', gap: '15px' }}>
            <h4 style={{ fontFamily: 'var(--font-headings)', fontSize: '2rem', color: 'var(--primary)', letterSpacing: '1px', margin: 0 }}>
              📥 DEVELOPER INBOX (Cloud Synced)
            </h4>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={fetchCloudMessages}
                disabled={loadingMessages}
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  border: '1px solid var(--primary)',
                  backgroundColor: 'rgba(0, 255, 135, 0.08)',
                  color: 'var(--primary)',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  cursor: 'none',
                }}
                className="interactive"
              >
                {loadingMessages ? 'Refreshing...' : '🔄 Refresh'}
              </button>

              <button
                onClick={async () => {
                  if (window.confirm('Delete all messages globally in cloud database?')) {
                    try {
                      onToast('Clearing cloud database...', 'info');
                      const putRes = await fetch(`https://kvdb.io/${kvBucketId}/messages`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify([]),
                      });
                      if (putRes.ok) {
                        setCloudMessages([]);
                        localStorage.setItem('manucrick_messages', JSON.stringify([]));
                        onToast('All messages cleared globally!', 'success');
                      }
                    } catch (err) {
                      console.error("Failed to clear cloud messages", err);
                      onToast('Failed to clear cloud messages.', 'warning');
                    }
                  }
                }}
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  border: '1px solid #FF3B30',
                  backgroundColor: 'rgba(255, 59, 48, 0.1)',
                  color: '#FF3B30',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  cursor: 'none',
                }}
                className="interactive"
              >
                Clear All
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '400px', overflowY: 'auto' }} className="table-scroll-container">
            {loadingMessages ? (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>Loading cloud database...</div>
            ) : cloudMessages.length > 0 ? (
              cloudMessages.map((m: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '5px' }}>
                    <div>
                      <strong style={{ color: '#FFF' }}>{m.name}</strong>{' '}
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>({m.email})</span>
                    </div>
                    <span style={{ color: 'var(--secondary)', fontSize: '0.82rem', fontWeight: 'bold' }}>{m.date}</span>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '6px', fontWeight: 'bold' }}>
                    Subject: {m.subject}
                  </div>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                    {m.message}
                  </p>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>No messages in database.</div>
            )}
          </div>
        </div>
      )}

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
