import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Key,
  PanelLeft,
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
  subtitle: string;
  model?: string;
  initialMessage: string;
  canPrompt?: boolean;
  avatarImage?: string;
  isSMS?: boolean;
  initialMessages?: { sender: 'user' | 'ai'; text: string; timeOffsetMinutes: number }[];
}

type AppleSymbolName =
  | 'arrow.up'
  | 'chevron.right'
  | 'face.smiling'
  | 'line.3.horizontal.decrease'
  | 'magnifyingglass'
  | 'plus'
  | 'square.and.pencil'
  | 'waveform';

function AppleSymbol({ name }: { name: AppleSymbolName }) {
  return (
    <span
      className="apple-symbol"
      style={{ '--symbol-image': `url("/sf-symbols/${name}.png")` } as React.CSSProperties}
      aria-hidden="true"
    />
  );
}

const CONTACTS: Contact[] = [
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    initials: 'GF',
    subtitle: 'Cost-efficient & high speed',
    model: 'gemini-3.5-flash',
    canPrompt: true,
    initialMessage: 'I am Gemini 3.5 Flash. Optimized for fast replies, low latency, and highly efficient processing. How can I help you?',
  },
  {
    id: 'gemini-3.1-pro',
    name: 'Gemini 3.1 Pro',
    initials: 'GP',
    subtitle: 'Deep reasoning & analysis',
    model: 'gemini-3.1-pro',
    canPrompt: true,
    initialMessage: 'Greetings. I am Gemini 3.1 Pro, our flagship model for deep analysis, complex coding, and multi-step reasoning. What shall we analyze today?',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.5 Flash-Lite',
    initials: 'GL',
    subtitle: 'Lightweight & instant replies',
    model: 'gemini-3.1-flash-lite',
    canPrompt: true,
    initialMessage: 'Hello! Gemini 3.5 Flash-Lite at your service. Ask me anything for instant, snappy responses.',
  },
  {
    id: 'neighbor',
    name: 'Neighbor',
    initials: 'N',
    subtitle: "All good, he's just chilling",
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
    subtitle: "Let me know when you're free",
    initialMessage: 'Hello',
    isSMS: true,
    initialMessages: [
      { sender: 'ai', text: 'Hello', timeOffsetMinutes: 300 },
      { sender: 'user', text: 'Hello', timeOffsetMinutes: 290 },
      { sender: 'ai', text: "Hello", timeOffsetMinutes: 280 },
    ],
  },
  {
    id: 'jenny-anderson',
    name: 'Jenny Anderson',
    initials: 'J',
    subtitle: 'Are we still on for coffee tomorrow?',
    avatarImage: '/contact-photos/jenny-anderson.jpg',
    initialMessage: 'Are we still on for coffee tomorrow?',
    isSMS: true,
    initialMessages: [
      { sender: 'user', text: 'Coffee tomorrow morning?', timeOffsetMinutes: 1480 },
      { sender: 'ai', text: 'Absolutely! Same place around 10?', timeOffsetMinutes: 1455 },
    ],
  },
  {
    id: 'michael-clarke',
    name: 'Michael Clarke',
    initials: 'M',
    subtitle: 'The meeting moved to 2:30.',
    avatarImage: '/contact-photos/michael-clarke.jpg',
    initialMessage: 'The meeting moved to 2:30.',
    isSMS: true,
    initialMessages: [
      { sender: 'ai', text: 'Quick heads-up—the meeting moved to 2:30.', timeOffsetMinutes: 3020 },
      { sender: 'user', text: 'Thanks, I’ll update my calendar.', timeOffsetMinutes: 2990 },
    ],
  },
  {
    id: 'amy-clarke',
    name: 'Amy Clarke',
    initials: 'A',
    subtitle: 'I sent the photos from Saturday!',
    avatarImage: '/contact-photos/amy-clarke.jpg',
    initialMessage: 'I sent the photos from Saturday!',
    isSMS: true,
    initialMessages: [
      { sender: 'ai', text: 'I sent the photos from Saturday! There are some really good ones.', timeOffsetMinutes: 6240 },
      { sender: 'user', text: 'Just saw them—these are great!', timeOffsetMinutes: 6200 },
    ],
  },
  {
    id: 'kevin-miller',
    name: 'Kevin Miller',
    initials: 'K',
    subtitle: 'See you at the game tonight.',
    avatarImage: '/contact-photos/kevin-miller.jpg',
    initialMessage: 'See you at the game tonight.',
    isSMS: true,
    initialMessages: [
      { sender: 'user', text: 'What time are you heading over?', timeOffsetMinutes: 9080 },
      { sender: 'ai', text: 'Probably around 6. See you at the game tonight.', timeOffsetMinutes: 9040 },
    ],
  },
  {
    id: 'delivery',
    name: 'Apple Delivery',
    initials: 'D',
    subtitle: 'Delivered! Your package is at...',
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

function ProfileAvatar({
  contact,
  size = 42,
  fontSize = 15,
}: {
  contact: Pick<Contact, 'initials' | 'isSMS' | 'avatarImage'>;
  size?: number;
  fontSize?: number;
}) {
  const showsInitial = Boolean(contact.isSMS);

  return (
    <div
      className={`profile-avatar${showsInitial ? ' uses-initial' : ''}`}
      style={{ width: size, height: size, fontSize }}
      aria-hidden="true"
    >
      {contact.avatarImage ? (
        <img src={contact.avatarImage} alt="" />
      ) : showsInitial ? (
        <strong>{contact.initials}</strong>
      ) : (
        <svg viewBox="0 0 24 24" role="presentation">
          <circle cx="12" cy="7.6" r="4.15" />
          <path d="M3.8 21c.45-5.15 3.55-8.05 8.2-8.05s7.75 2.9 8.2 8.05H3.8Z" />
        </svg>
      )}
    </div>
  );
}

function ContactHeader({ contact, timestamp }: { contact: Contact; timestamp?: Date }) {
  return (
    <button className="contact-header" aria-label={`Conversation details for ${contact.name}`}>
      <ProfileAvatar contact={contact} size={42} fontSize={19} />
      <span className="contact-header-badge">
        <strong>{contact.name}</strong>
        <AppleSymbol name="chevron.right" />
      </span>
      <span className="contact-header-meta">
        <strong>{contact.isSMS ? 'Text Message • SMS' : 'iMessage'}</strong>
        {timestamp && <time>{formatHeaderTimestamp(timestamp)}</time>}
      </span>
    </button>
  );
}

function formatHeaderTimestamp(date: Date): string {
  const day = date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const time = date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${day} at ${time}`;
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
  const canPromptSelected = Boolean(selectedContact.canPrompt && selectedContact.model);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPromptSelected || !input.trim() || isLoading) return;

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
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gemini-API-Key': apiKey.trim(),
        },
        body: JSON.stringify({
          message: userText,
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
            <button className="sidebar-list-button" onClick={() => setIsSidebarVisible(false)} aria-label="Hide sidebar">
              <AppleSymbol name="line.3.horizontal.decrease" />
            </button>
          </div>

          <div className="search-wrap">
            <label className="search-field">
              <AppleSymbol name="magnifyingglass" />
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
                  onClick={() => {
                    setSelectedContact(contact);
                    setInput('');
                    setStreamingMessage(null);
                  }}
                >
                  <ProfileAvatar contact={contact} size={40} fontSize={18} />
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
            <button className="header-compose-button" aria-label="New message">
              <AppleSymbol name="square.and.pencil" />
            </button>
          </div>
          <ContactHeader contact={selectedContact} timestamp={activeMessages[0]?.timestamp} />
        </header>

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
                  {idx > 0 && shouldShowTimestamp(activeMessages, idx) && (
                    <time className="message-timestamp">{formatMessageTimestamp(msg.timestamp)}</time>
                  )}
                  <div className={`message-row ${isUser ? 'sent' : 'received'}${isFirstInGroup ? ' group-start' : ''}`}>
                    <div className={`message-bubble${isLastInGroup ? ' has-tail' : ''}${selectedContact.isSMS && isUser ? ' sms' : ''}`}>
                      {msg.text}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}

            {streamingMessage !== null && (
              <div className="message-row received group-start">
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
          <form onSubmit={handleSend} className={`composer-form${canPromptSelected ? '' : ' is-read-only'}`}>
            <button type="button" className="round-action" disabled={!canPromptSelected} aria-label="Add attachment">
              <AppleSymbol name="plus" />
            </button>
            <div className="composer-field">
              <input
                type="text"
                placeholder={canPromptSelected ? 'iMessage' : 'Conversation is read-only'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={!canPromptSelected || isLoading}
                aria-label={canPromptSelected ? 'Message' : 'Read-only conversation'}
              />
              {canPromptSelected && input.trim() ? (
                <button type="submit" className="send-button" disabled={isLoading} aria-label="Send message">
                  <AppleSymbol name="arrow.up" />
                </button>
              ) : (
                <button type="button" className="audio-button" disabled={!canPromptSelected} aria-label="Send audio message">
                  <AppleSymbol name="waveform" />
                </button>
              )}
            </div>
            <button type="button" className="emoji-button" disabled={!canPromptSelected} aria-label="Choose emoji">
              <AppleSymbol name="face.smiling" />
            </button>
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
