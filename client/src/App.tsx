import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  SquarePen,
  Video,
  Plus,
  AudioLines,
  X,
  Key,
  Info,
  Settings,
  PanelLeft,
  ChevronRight,
  CircleUserRound,
  Send,
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}


interface Contact {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  subtitle: string;
  model: string;
  initialMessage: string;
  isSMS?: boolean;
  initialMessages?: { sender: 'user' | 'ai'; text: string; timeOffsetMinutes: number }[];
}

// ── Avatar colour palette ────────────────────────────────────────────────────
const AVATAR_COLORS: string[] = [
  '#5E5CE6', // indigo-purple (Gemini Flash)
  '#0A84FF', // system blue  (Gemini Pro)
  '#30D158', // system green (Flash-Lite)
  '#FF9F0A', // orange       (Neighbor)
  '#FF375F', // red-pink     (Mom)
  '#636366', // neutral gray (Delivery)
];

const CONTACTS: Contact[] = [
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    initials: 'GF',
    avatarColor: AVATAR_COLORS[0],
    subtitle: 'Cost-efficient & high speed',
    model: 'gemini-3.5-flash',
    initialMessage: 'I am Gemini 3.5 Flash. Optimized for fast replies, low latency, and highly efficient processing. How can I help you?',
  },
  {
    id: 'gemini-3.1-pro',
    name: 'Gemini 3.1 Pro',
    initials: 'GP',
    avatarColor: AVATAR_COLORS[1],
    subtitle: 'Deep reasoning & analysis',
    model: 'gemini-3.1-pro',
    initialMessage: 'Greetings. I am Gemini 3.1 Pro, our flagship model for deep analysis, complex coding, and multi-step reasoning. What shall we analyze today?',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.5 Flash-Lite',
    initials: 'GL',
    avatarColor: AVATAR_COLORS[2],
    subtitle: 'Lightweight & instant replies',
    model: 'gemini-3.1-flash-lite',
    initialMessage: 'Hello! Gemini 3.5 Flash-Lite at your service. Ask me anything for instant, snappy responses.',
  },
  {
    id: 'neighbor',
    name: 'Neighbor',
    initials: 'N',
    avatarColor: AVATAR_COLORS[3],
    subtitle: "All good, he's just chilling",
    model: 'gemini-3.5-flash',
    initialMessage: 'Get off my property before I call the police',
    isSMS: true,
    initialMessages: [
      { sender: 'ai', text: 'Hello neighbor', timeOffsetMinutes: 180 },
      { sender: 'user', text: 'Hello', timeOffsetMinutes: 170 },
      { sender: 'ai', text: 'Hello', timeOffsetMinutes: 165 },
      { sender: 'user', text: 'Hello', timeOffsetMinutes: 160 },
    ],
  },
  {
    id: 'mom',
    name: 'Mom',
    initials: 'M',
    avatarColor: AVATAR_COLORS[4],
    subtitle: "Let me know when you're free",
    model: 'gemini-3.5-flash',
    initialMessage: 'Hello',
    isSMS: true,
    initialMessages: [
      { sender: 'ai', text: 'Hello', timeOffsetMinutes: 300 },
      { sender: 'user', text: 'Hello', timeOffsetMinutes: 290 },
      { sender: 'ai', text: "Hello", timeOffsetMinutes: 280 },
    ],
  },
  {
    id: 'delivery',
    name: 'Apple Delivery',
    initials: 'AD',
    avatarColor: AVATAR_COLORS[5],
    subtitle: 'Delivered! Your package is at...',
    model: 'gemini-3.5-flash',
    initialMessage: 'Your order #98213 has been shipped.',
    isSMS: true,
    initialMessages: [
      { sender: 'ai', text: 'Your order #98213 has been shipped and is out for delivery.', timeOffsetMinutes: 500 },
      { sender: 'ai', text: 'Delivered! Your package is at the front door.', timeOffsetMinutes: 480 },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = diffMs / 60000;
  const diffDays = diffMs / 86400000;

  if (diffMinutes < 1) return 'Just now';

  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  if (diffDays < 2) return 'Yesterday';

  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'long' });
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function LetterAvatar({
  initials,
  color,
  size = 42,
  fontSize = 15,
}: {
  initials: string;
  color: string;
  size?: number;
  fontSize?: number;
}) {
  return (
    <div
      className="contact-avatar"
      style={{ width: size, height: size, '--avatar-color': color, fontSize } as React.CSSProperties}
    >
      <span>{initials}</span>
    </div>
  );
}

function ContactHeader({ contact }: { contact: Contact }) {
  return (
    <button className="contact-header" aria-label={`Conversation details for ${contact.name}`}>
      <span className="contact-header-avatar" aria-hidden="true">
        <svg viewBox="0 0 24 24" role="presentation">
          <circle cx="12" cy="7.6" r="4.15" />
          <path d="M3.8 21c.45-5.15 3.55-8.05 8.2-8.05s7.75 2.9 8.2 8.05H3.8Z" />
        </svg>
      </span>
      <span className="contact-header-badge">
        <strong>{contact.name}</strong>
        <ChevronRight aria-hidden="true" />
      </span>
    </button>
  );
}

function formatMessageTimestamp(date: Date): string {
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const day = sameDay
    ? 'Today'
    : date.toDateString() === yesterday.toDateString()
      ? 'Yesterday'
      : date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  return `${day} ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

function shouldShowTimestamp(messages: Message[], index: number): boolean {
  if (index === 0) return true;
  if (index < 0 || index >= messages.length) return false;
  return messages[index].timestamp.getTime() - messages[index - 1].timestamp.getTime() > 30 * 60 * 1000;
}

// ── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [selectedContact, setSelectedContact] = useState<Contact>(CONTACTS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [input, setInput] = useState('');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('stealth_gemini_api_key') || '';
  });
  const [tempKey, setTempKey] = useState(apiKey);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [chatHistories, setChatHistories] = useState<Record<string, Message[]>>(() => {
    const initial: Record<string, Message[]> = {};
    CONTACTS.forEach((c) => {
      if (c.initialMessages && c.initialMessages.length > 0) {
        initial[c.id] = c.initialMessages.map((m, idx) => {
          const timestamp = new Date();
          timestamp.setMinutes(timestamp.getMinutes() - m.timeOffsetMinutes);
          return { id: `init-${c.id}-${idx}`, sender: m.sender, text: m.text, timestamp };
        });
      } else {
        initial[c.id] = [
          { id: `init-${c.id}`, sender: 'ai', text: c.initialMessage, timestamp: new Date() },
        ];
      }
    });
    return initial;
  });

  const [streamingMessage, setStreamingMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistories, streamingMessage]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = (matches: boolean) => {
      if (matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    updateTheme(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => updateTheme(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const activeMessages = chatHistories[selectedContact.id] || [];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!apiKey.trim()) {
      setIsSettingsOpen(true);
      return;
    }

    const userText = input.trim();
    setInput('');
    setIsLoading(true);

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date(),
    };

    setChatHistories((prev) => ({
      ...prev,
      [selectedContact.id]: [...(prev[selectedContact.id] || []), userMessage],
    }));

    try {
      const messageText = selectedContact.isSMS
        ? `[SYSTEM INSTRUCTION: You are roleplaying as "${selectedContact.name}" in a casual SMS chat. Keep your response very brief (1-2 sentences max), informal, and in-character. Do not reveal you are an AI model.] User message: ${userText}`
        : userText;

      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gemini-API-Key': apiKey.trim(),
        },
        body: JSON.stringify({
          message: messageText,
          model: selectedContact.model,
          history: (chatHistories[selectedContact.id] || []).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
        }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No reader available');

      let accumulatedText = '';
      setStreamingMessage('');

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;
        setStreamingMessage(accumulatedText);
      }

      const aiMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        sender: 'ai',
        text: accumulatedText,
        timestamp: new Date(),
      };

      setChatHistories((prev) => ({
        ...prev,
        [selectedContact.id]: [...(prev[selectedContact.id] || []), aiMessage],
      }));
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        sender: 'ai',
        text: '⚠️ Error: Failed to retrieve response from server. Check your internet connection, API Key status, or verify that the backend sidecar is running.',
        timestamp: new Date(),
      };
      setChatHistories((prev) => ({
        ...prev,
        [selectedContact.id]: [...(prev[selectedContact.id] || []), errorMessage],
      }));
    } finally {
      setStreamingMessage(null);
      setIsLoading(false);
    }
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('stealth_gemini_api_key', tempKey.trim());
    setApiKey(tempKey.trim());
    setIsSettingsOpen(false);
  };

  const filteredContacts = CONTACTS.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="messages-window">
      {isSidebarVisible && (
        <aside className="sidebar" data-tauri-drag-region="true">
          <div className="sidebar-toolbar" data-tauri-drag-region="true">
            <div className="traffic-light-space" data-tauri-drag-region="true" />
            <div className="toolbar-actions">
              <button className="symbol-button" onClick={() => setIsSidebarVisible(false)} aria-label="Hide sidebar">
                <PanelLeft aria-hidden="true" />
              </button>
              <button className="symbol-button" aria-label="New message">
                <SquarePen aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="search-wrap">
            <label className="search-field">
              <Search aria-hidden="true" />
              <input
                type="search"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search conversations"
              />
            </label>
          </div>

          <div className="conversation-list">
            {filteredContacts.map((contact) => {
              const isActive = contact.id === selectedContact.id;
              const history = chatHistories[contact.id] || [];
              const lastMsg = history[history.length - 1];
              return (
                <button
                  key={contact.id}
                  className={`conversation-row${isActive ? ' is-active' : ''}`}
                  onClick={() => { setSelectedContact(contact); setStreamingMessage(null); }}
                >
                  <LetterAvatar initials={contact.initials} color={contact.avatarColor} size={48} fontSize={14} />
                  <span className="conversation-copy">
                    <span className="conversation-heading">
                      <strong>{contact.name}</strong>
                      <time>{lastMsg ? formatTimestamp(lastMsg.timestamp) : ''}</time>
                    </span>
                    <span className="conversation-preview">{lastMsg ? lastMsg.text : contact.subtitle}</span>
                  </span>
                </button>
              );
            })}
            {filteredContacts.length === 0 && <div className="empty-search">No conversations found</div>}
          </div>

          <button
            className="sidebar-settings"
            onClick={() => { setTempKey(apiKey); setIsSettingsOpen(true); }}
            aria-label="Open settings"
          >
            <Settings aria-hidden="true" />
            <span>Settings</span>
          </button>
        </aside>
      )}

      <section className="chat-pane">
        <header className="chat-header" data-tauri-drag-region="true">
          <div className="header-leading">
            {!isSidebarVisible && (
              <button className="symbol-button" onClick={() => setIsSidebarVisible(true)} aria-label="Show sidebar">
                <PanelLeft aria-hidden="true" />
              </button>
            )}
          </div>
          <ContactHeader contact={selectedContact} />
          <div className="header-actions">
            <button className="symbol-button video-button" aria-label="Start video call">
              <Video aria-hidden="true" />
            </button>
            <button
              className="symbol-button"
              onClick={() => { setTempKey(apiKey); setIsSettingsOpen(true); }}
              aria-label="Conversation settings"
            >
              <CircleUserRound aria-hidden="true" />
            </button>
          </div>
        </header>

        {!apiKey && (
          <div className="api-notice" role="status">
            <Info aria-hidden="true" />
            <span>Connect your Gemini API key to send messages.</span>
            <button onClick={() => { setTempKey(apiKey); setIsSettingsOpen(true); }}>Set Up</button>
          </div>
        )}

        <div className="message-scroll">
          <div className="message-stack">
            {activeMessages.map((msg, idx) => {
              const isUser = msg.sender === 'user';
              const nextMsg = activeMessages[idx + 1];
              const previousMsg = activeMessages[idx - 1];
              const isLastInGroup = !nextMsg || nextMsg.sender !== msg.sender || shouldShowTimestamp(activeMessages, idx + 1);
              const isFirstInGroup = !previousMsg || previousMsg.sender !== msg.sender || shouldShowTimestamp(activeMessages, idx);
              return (
                <React.Fragment key={msg.id}>
                  {shouldShowTimestamp(activeMessages, idx) && (
                    <time className="message-timestamp">{formatMessageTimestamp(msg.timestamp)}</time>
                  )}
                  <div className={`message-row ${isUser ? 'sent' : 'received'}${isFirstInGroup ? ' group-start' : ''}`}>
                    {!isUser && (
                      <span className="message-avatar-slot">
                        {isLastInGroup && <LetterAvatar initials={selectedContact.initials} color={selectedContact.avatarColor} size={24} fontSize={8} />}
                      </span>
                    )}
                    <div className={`message-bubble${isLastInGroup ? ' has-tail' : ''}${selectedContact.isSMS && isUser ? ' sms' : ''}`}>
                      {msg.text}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}

            {streamingMessage !== null && (
              <div className="message-row received group-start">
                <span className="message-avatar-slot">
                  <LetterAvatar initials={selectedContact.initials} color={selectedContact.avatarColor} size={24} fontSize={8} />
                </span>
                <div className="message-bubble has-tail">
                  {streamingMessage || (
                    <span className="typing-indicator" aria-label="Typing">
                      <i /><i /><i />
                    </span>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <footer className="composer-bar">
          <form onSubmit={handleSend} className="composer-form">
            <button type="button" className="round-action" aria-label="Add attachment">
              <Plus aria-hidden="true" />
            </button>
            <div className="composer-field">
              <input
                type="text"
                placeholder={apiKey ? (selectedContact.isSMS ? 'Text Message • SMS' : 'iMessage') : 'Connect API key to chat'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                aria-label="Message"
              />
              {input.trim() ? (
                <button type="submit" className="send-button" disabled={isLoading} aria-label="Send message">
                  <Send aria-hidden="true" />
                </button>
              ) : (
                <button type="button" className="audio-button" aria-label="Send audio message">
                  <AudioLines aria-hidden="true" />
                </button>
              )}
            </div>
          </form>
        </footer>
      </section>

      {isSettingsOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => {
          if (e.currentTarget === e.target) setIsSettingsOpen(false);
        }}>
          <section className="settings-sheet" role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <header>
              <span id="settings-title"><Key aria-hidden="true" /> API Configuration</span>
              <button onClick={() => setIsSettingsOpen(false)} aria-label="Close settings"><X aria-hidden="true" /></button>
            </header>
            <form onSubmit={handleSaveKey}>
              <label htmlFor="api-key">Google AI Studio API Key</label>
              <input
                id="api-key"
                type="password"
                placeholder="AIzaSy..."
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                autoFocus
              />
              <div className="privacy-note">
                <Key aria-hidden="true" />
                <p>Your key stays in this app's local storage and is only sent to the local chat service for Gemini authentication.</p>
              </div>
              <p className="key-help">Create a key in <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer">Google AI Studio</a>.</p>
              <div className="modal-actions">
                <button type="button" onClick={() => setIsSettingsOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button">Save</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default App;
