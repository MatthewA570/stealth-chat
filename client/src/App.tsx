import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  SquarePen,
  Video,
  Plus,
  Smile,
  AudioLines,
  X,
  Key,
  Info,
  Settings,
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
    name: 'Gemini 3.1 Flash-Lite',
    initials: 'GL',
    avatarColor: AVATAR_COLORS[2],
    subtitle: 'Lightweight & instant replies',
    model: 'gemini-3.1-flash-lite',
    initialMessage: 'Hello! Gemini 3.1 Flash-Lite at your service. Ask me anything for instant, snappy responses.',
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
      { sender: 'ai', text: 'Get off my property before I call the police', timeOffsetMinutes: 180 },
      { sender: 'user', text: 'Sorry', timeOffsetMinutes: 170 },
      { sender: 'ai', text: 'Quiet', timeOffsetMinutes: 165 },
      { sender: 'user', text: 'mb', timeOffsetMinutes: 160 },
    ],
  },
  {
    id: 'mom',
    name: 'Mom',
    initials: 'M',
    avatarColor: AVATAR_COLORS[4],
    subtitle: "Let me know when you're free",
    model: 'gemini-3.5-flash',
    initialMessage: 'Are you eating enough vegetables? 🥦',
    isSMS: true,
    initialMessages: [
      { sender: 'ai', text: 'Are you eating enough vegetables? 🥦', timeOffsetMinutes: 300 },
      { sender: 'user', text: 'Yes mom, I literally just made broccoli.', timeOffsetMinutes: 290 },
      { sender: 'ai', text: "Good! Let me know when you're free to visit.", timeOffsetMinutes: 280 },
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
      className="rounded-full flex-shrink-0 flex items-center justify-center font-semibold text-white select-none"
      style={{ width: size, height: size, background: color, fontSize }}
    >
      {initials}
    </div>
  );
}

// ── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [selectedContact, setSelectedContact] = useState<Contact>(CONTACTS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [input, setInput] = useState('');

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

  const sentBubbleClass = selectedContact.isSMS
    ? 'bg-[#34C759] text-white'
    : 'bg-[#007AFF] text-white';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-transparent text-white font-sans relative">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <div
        className="w-[300px] flex-shrink-0 flex flex-col bg-[#1C1C1C] border-r border-white/[0.06] h-full select-none"
        data-tauri-drag-region="true"
      >
        {/* macOS traffic-light spacer */}
        <div className="h-[28px] w-full flex-shrink-0" data-tauri-drag-region="true" />

        {/* Header row */}
        <div className="px-4 pt-1 pb-2 flex items-center justify-between relative" data-tauri-drag-region="true">
          <button
            onClick={() => { setTempKey(apiKey); setIsSettingsOpen(true); }}
            className="p-1 rounded-full text-[#8E8E93] hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          <span className="text-[17px] font-bold text-white absolute left-1/2 -translate-x-1/2 pointer-events-none">
            Messages
          </span>

          <button
            className="p-1 rounded-full text-[#8E8E93] hover:bg-white/10 hover:text-white transition-colors"
            aria-label="New message"
          >
            <SquarePen className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-3 pb-3" data-tauri-drag-region="true">
          <div className="relative flex items-center bg-[#3A3A3C] rounded-[10px] px-2.5 py-[7px]">
            <Search className="w-3.5 h-3.5 mr-1.5 text-[#8E8E93] flex-shrink-0" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-[14px] focus:outline-none text-white placeholder-[#8E8E93]"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto pb-4">
          {filteredContacts.map((contact) => {
            const isActive = contact.id === selectedContact.id;
            const history = chatHistories[contact.id] || [];
            const lastMsg = history[history.length - 1];

            return (
              <div key={contact.id} className="px-2">
                <button
                  onClick={() => { setSelectedContact(contact); setStreamingMessage(null); }}
                  className={`w-full flex items-center gap-3 px-2 py-[10px] text-left transition-colors rounded-[12px] ${
                    isActive ? 'bg-[#007AFF]' : 'hover:bg-white/[0.06]'
                  }`}
                >
                  <LetterAvatar initials={contact.initials} color={contact.avatarColor} size={42} fontSize={15} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-[1px]">
                      <span className="font-semibold text-[15px] text-white truncate leading-tight">
                        {contact.name}
                      </span>
                      <span className={`text-[12px] flex-shrink-0 ml-1 ${isActive ? 'text-white/80' : 'text-[#8E8E93]'}`}>
                        {lastMsg ? formatTimestamp(lastMsg.timestamp) : ''}
                      </span>
                    </div>
                    <p className={`text-[13px] truncate leading-tight ${isActive ? 'text-white/85 font-medium' : 'text-[#8E8E93]'}`}>
                      {lastMsg ? lastMsg.text : contact.subtitle}
                    </p>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Chat Area ───────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-[#1C1C1C] h-full relative">

        {/* Floating Top Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex flex-col">
          <div
            className="border-b border-white/[0.08] bg-[#1C1C1C]/80 backdrop-blur-xl flex-shrink-0 select-none"
            data-tauri-drag-region="true"
          >
            <div className="h-[28px]" data-tauri-drag-region="true" />

            <div className="h-[52px] flex items-center justify-between px-4 relative" data-tauri-drag-region="true">
              {/* Left: compose */}
              <button className="p-1.5 rounded-full text-[#8E8E93] hover:bg-white/10 hover:text-white transition-colors" aria-label="New message">
                <SquarePen className="w-5 h-5" />
              </button>

              {/* Center: avatar + name */}
              <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-[3px] pointer-events-none" data-tauri-drag-region="true">
                <LetterAvatar initials={selectedContact.initials} color={selectedContact.avatarColor} size={28} fontSize={10} />
                <span className="font-semibold text-[12px] text-white leading-none flex items-center gap-0.5">
                  {selectedContact.name}
                  {selectedContact.isSMS && <span className="text-[#8E8E93] font-normal text-[11px]">›</span>}
                </span>
              </div>

              {/* Right: video */}
              <button className="p-1.5 rounded-full text-[#8E8E93] hover:bg-white/10 hover:text-white transition-colors" aria-label="Video call">
                <Video className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* API Key Missing Banner */}
          {!apiKey && (
            <div className="bg-amber-950/20 border-b border-amber-900/30 px-4 py-2 text-xs flex items-center justify-between text-amber-300 backdrop-blur-md">
              <span className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
                API Key is missing. Live chat is disabled until you provide your Gemini API key.
              </span>
              <button onClick={() => setIsSettingsOpen(true)} className="font-semibold underline hover:text-amber-100">
                Enter API Key
              </button>
            </div>
          )}
        </div>

        {/* Messages scroll area */}
        <div
          className="flex-1 overflow-y-auto px-4 space-y-[3px] pb-[80px]"
          style={{ paddingTop: apiKey ? '108px' : '144px' }}
        >
          {activeMessages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            const nextMsg = activeMessages[idx + 1];
            const isLastInGroup = !nextMsg || nextMsg.sender !== msg.sender;

            return (
              <div
                key={msg.id}
                className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-1' : ''}`}
              >
                {/* Received: avatar slot */}
                {!isUser && (
                  <div className="w-[28px] flex-shrink-0 self-end mr-1.5">
                    {isLastInGroup && (
                      <LetterAvatar initials={selectedContact.initials} color={selectedContact.avatarColor} size={24} fontSize={9} />
                    )}
                  </div>
                )}

                <div
                  className={`relative max-w-[70%] px-[14px] py-[9px] text-[15px] leading-snug ${
                    isUser
                      ? `${sentBubbleClass} rounded-t-[20px] rounded-bl-[20px] ${isLastInGroup ? 'rounded-br-[5px]' : 'rounded-br-[20px]'}`
                      : `bg-[#262628] text-white rounded-t-[20px] rounded-br-[20px] ${isLastInGroup ? 'rounded-bl-[5px]' : 'rounded-bl-[20px]'}`
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}

          {/* Streaming bubble */}
          {streamingMessage !== null && (
            <div className="flex w-full justify-start mb-1">
              <div className="w-[28px] flex-shrink-0 self-end mr-1.5">
                <LetterAvatar initials={selectedContact.initials} color={selectedContact.avatarColor} size={24} fontSize={9} />
              </div>
              <div className="relative max-w-[70%] px-[14px] py-[9px] text-[15px] leading-snug bg-[#262628] text-white rounded-t-[20px] rounded-br-[20px] rounded-bl-[5px]">
                {streamingMessage}
                {streamingMessage === '' && (
                  <span className="flex gap-1 items-center justify-center h-5 w-8">
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Bar ──────────────────────────────────────────────────────── */}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 bg-[#1C1C1C] border-t border-white/[0.08]">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            {/* Plus button */}
            <button
              type="button"
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[#8E8E93] hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Add attachment"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Pill input */}
            <div className="flex-1 relative flex items-center bg-[#2C2C2E] border border-[#3A3A3C] rounded-full px-4 py-[7px]">
              <input
                type="text"
                placeholder={apiKey ? (selectedContact.isSMS ? 'Text Message' : 'iMessage') : 'Enter API key to chat...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1 bg-transparent text-[15px] focus:outline-none text-white placeholder-[#8E8E93] min-w-0"
              />
              <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                <button type="button" className="text-[#8E8E93] hover:text-white transition-colors" aria-label="Emoji">
                  <Smile className="w-[18px] h-[18px]" />
                </button>
                <button type="button" className="text-[#8E8E93] hover:text-white transition-colors" aria-label="Audio">
                  <AudioLines className="w-[18px] h-[18px]" />
                </button>
              </div>
            </div>

            {/* Send button - appears only when text is present */}
            {input.trim() && (
              <button
                type="submit"
                disabled={isLoading}
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[#007AFF] text-white hover:bg-[#0A78EF] transition-all"
                aria-label="Send"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            )}
          </form>
        </div>
      </div>

      {/* ── Settings Modal ──────────────────────────────────────────────────── */}
      {isSettingsOpen && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50">
          <div className="w-[420px] bg-[#2C2C2E]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden text-white text-sm select-none">
            <div className="h-10 border-b border-white/10 flex items-center justify-between px-4">
              <span className="font-semibold flex items-center gap-1.5 text-white">
                <Key className="w-4 h-4 text-gray-400" />
                API Configuration
              </span>
              <button onClick={() => setIsSettingsOpen(false)} className="p-0.5 rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveKey} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Google AI Studio API Key
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#0B84FF] text-white shadow-inner"
                />
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-gray-400 flex flex-col gap-1.5 leading-relaxed">
                <p>
                  <strong>🔒 Highly Secure & Local:</strong> Your API key is saved directly inside your computer's local application sandbox storage. It never leaves your machine except to authenticate requests directly sent to Google.
                </p>
                <p>
                  Get your free Gemini API key with generous limits from{' '}
                  <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-[#0B84FF] hover:underline font-medium">
                    Google AI Studio
                  </a>.
                </p>
              </div>

              <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-white/10">
                <button type="button" onClick={() => setIsSettingsOpen(false)} className="px-4 py-1.5 rounded-md text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-white active:bg-white/15">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 rounded-md text-xs font-semibold text-white bg-[#007AFF] hover:bg-blue-600 transition-colors active:bg-blue-700 shadow-sm">
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
