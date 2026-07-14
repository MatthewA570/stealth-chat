import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Sparkles, Brain, Flame, Settings, X, Key, Info } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface Contact {
  id: string;
  name: string;
  avatar: React.ReactNode;
  subtitle: string;
  model: string;
  initialMessage: string;
}

const CONTACTS: Contact[] = [
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    avatar: <Flame className="w-5 h-5 text-orange-500" />,
    subtitle: 'Cost-efficient & high speed',
    model: 'gemini-3.5-flash',
    initialMessage: 'I am Gemini 3.5 Flash. Optimized for fast replies, low latency, and highly efficient processing. How can I help you?',
  },
  {
    id: 'gemini-3.1-pro',
    name: 'Gemini 3.1 Pro',
    avatar: <Brain className="w-5 h-5 text-indigo-500" />,
    subtitle: 'Deep reasoning & analysis',
    model: 'gemini-3.1-pro',
    initialMessage: 'Greetings. I am Gemini 3.1 Pro, our flagship model for deep analysis, complex coding, and multi-step reasoning. What shall we analyze today?',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash-Lite',
    avatar: <Sparkles className="w-5 h-5 text-blue-500" />,
    subtitle: 'Lightweight & instant replies',
    model: 'gemini-3.1-flash-lite',
    initialMessage: 'Hello! Gemini 3.1 Flash-Lite at your service. Ask me anything for instant, snappy responses.',
  }
];

function App() {
  const [selectedContact, setSelectedContact] = useState<Contact>(CONTACTS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [input, setInput] = useState('');
  
  // API Key State
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('stealth_gemini_api_key') || '';
  });
  const [tempKey, setTempKey] = useState(apiKey);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [chatHistories, setChatHistories] = useState<Record<string, Message[]>>(() => {
    const initial: Record<string, Message[]> = {};
    CONTACTS.forEach(c => {
      initial[c.id] = [
        {
          id: `init-${c.id}`,
          sender: 'ai',
          text: c.initialMessage,
          timestamp: new Date()
        }
      ];
    });
    return initial;
  });
  
  const [streamingMessage, setStreamingMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistories, streamingMessage]);

  const activeMessages = chatHistories[selectedContact.id] || [];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Check if API Key is configured before sending live queries
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
      timestamp: new Date()
    };

    setChatHistories(prev => ({
      ...prev,
      [selectedContact.id]: [...(prev[selectedContact.id] || []), userMessage]
    }));

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gemini-API-Key': apiKey.trim()
        },
        body: JSON.stringify({
          message: userText,
          model: selectedContact.model,
          history: (chatHistories[selectedContact.id] || []).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

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
        timestamp: new Date()
      };

      setChatHistories(prev => ({
        ...prev,
        [selectedContact.id]: [...(prev[selectedContact.id] || []), aiMessage]
      }));

    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        sender: 'ai',
        text: '⚠️ Error: Failed to retrieve response from server. Check your internet connection, API Key status, or verify that the backend sidecar is running.',
        timestamp: new Date()
      };
      setChatHistories(prev => ({
        ...prev,
        [selectedContact.id]: [...(prev[selectedContact.id] || []), errorMessage]
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

  const filteredContacts = CONTACTS.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-transparent text-black font-sans relative">
      {/* Sidebar */}
      <div 
        className="w-[300px] flex-shrink-0 flex flex-col bg-[#F5F5F7]/80 backdrop-blur-md border-r border-[#D2D2D7]/60 h-full select-none"
        data-tauri-drag-region="true"
      >
        {/* macOS Drag Area spacer */}
        <div className="h-[28px] w-full flex-shrink-0" data-tauri-drag-region="true"></div>

        {/* Sidebar Header Title & Settings icon */}
        <div className="px-4 py-2 flex items-center justify-between" data-tauri-drag-region="true">
          <h1 className="text-xl font-bold text-black" data-tauri-drag-region="true">Messages</h1>
          <button 
            onClick={() => {
              setTempKey(apiKey);
              setIsSettingsOpen(true);
            }}
            className="p-1 rounded-full text-gray-500 hover:bg-gray-200/50 hover:text-black transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar Container */}
        <div className="p-3" data-tauri-drag-region="true">
          <div className="relative flex items-center bg-[#E3E3E5]/90 rounded-lg px-2 py-1.5 text-gray-500">
            <Search className="w-4 h-4 mr-1.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm focus:outline-none placeholder-gray-500 text-black"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-4">
          {filteredContacts.map((contact) => {
            const isActive = contact.id === selectedContact.id;
            const history = chatHistories[contact.id] || [];
            const lastMsg = history[history.length - 1];
            
            return (
              <button
                key={contact.id}
                onClick={() => {
                  setSelectedContact(contact);
                  setStreamingMessage(null);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                  isActive
                    ? 'bg-[#007AFF] text-white shadow-sm'
                    : 'hover:bg-[#E8E8EC]/80 text-black'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isActive ? 'bg-white/25' : 'bg-white shadow-sm'
                }`}>
                  {contact.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-[14px] truncate">{contact.name}</span>
                    <span className={`text-[10px] ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                      {lastMsg ? lastMsg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className={`text-[12px] truncate ${isActive ? 'text-white/95' : 'text-gray-500'}`}>
                    {lastMsg ? lastMsg.text : contact.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white h-full relative">
        {/* Header */}
        <div 
          className="h-[52px] border-b border-[#D2D2D7]/60 flex items-center justify-center px-4 bg-white flex-shrink-0 relative select-none"
          data-tauri-drag-region="true"
        >
          <div className="h-[28px]" data-tauri-drag-region="true"></div>

          <div className="flex flex-col items-center" data-tauri-drag-region="true">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Gemini Chat</span>
            <span className="font-bold text-[14px]">{selectedContact.name}</span>
          </div>
          <div className="absolute right-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#E3E3E5]/60 flex items-center justify-center">
              {selectedContact.avatar}
            </div>
          </div>
        </div>

        {/* API Key Missing Header Indicator */}
        {!apiKey && (
          <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 text-xs flex items-center justify-between text-amber-800">
            <span className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
              API Key is missing. Live chat is disabled until you provide your Gemini API key.
            </span>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="font-semibold underline hover:text-amber-950"
            >
              Enter API Key
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-[80px]">
          {activeMessages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`relative max-w-[70%] px-4 py-2 text-[15px] leading-snug rounded-[18px] ${
                    isUser
                      ? 'bg-[#007AFF] text-white rounded-br-[4px]'
                      : 'bg-[#E9E9EB] text-black rounded-br-[18px] rounded-bl-[4px]'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
          {streamingMessage !== null && (
            <div className="flex w-full justify-start">
              <div className="relative max-w-[70%] px-4 py-2 text-[15px] leading-snug bg-[#E9E9EB] text-black rounded-[18px] rounded-bl-[4px]">
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

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/90 border-t border-[#F2F2F2]">
          <form onSubmit={handleSend} className="relative flex items-center max-w-4xl mx-auto">
            <input
              type="text"
              placeholder={apiKey ? "iMessage" : "Enter API key to chat..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="w-full bg-white border border-[#D2D2D7] rounded-full pl-4 pr-12 py-2 text-[15px] focus:outline-none focus:border-[#007AFF] text-black placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`absolute right-1.5 p-1.5 rounded-full transition-all ${
                input.trim() && !isLoading
                  ? 'bg-[#007AFF] text-white cursor-pointer hover:bg-blue-600'
                  : 'bg-transparent text-gray-300'
              }`}
            >
              <Send className="w-4 h-4 transform -rotate-90" />
            </button>
          </form>
        </div>
      </div>

      {/* macOS Premium settings popup modal */}
      {isSettingsOpen && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="w-[420px] bg-[#EBEBEB] border border-white/20 rounded-xl shadow-2xl flex flex-col overflow-hidden text-black text-sm select-none">
            {/* Modal Header */}
            <div className="h-10 border-b border-gray-300/60 flex items-center justify-between px-4" data-tauri-drag-region="true">
              <span className="font-semibold flex items-center gap-1.5 text-gray-700">
                <Key className="w-4 h-4 text-gray-500" />
                API Configuration
              </span>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-0.5 rounded-full text-gray-400 hover:bg-gray-300/70 hover:text-black transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveKey} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Google AI Studio API Key
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#007AFF] text-black shadow-inner"
                />
              </div>

              <div className="bg-white/50 border border-gray-200 rounded-lg p-3 text-xs text-gray-500 flex flex-col gap-1.5 leading-relaxed">
                <p>
                  <strong>🔒 Highly Secure & Local:</strong> Your API key is saved directly inside your computer's local application sandbox storage. It never leaves your machine except to authenticate requests directly sent to Google.
                </p>
                <p>
                  Get your free Gemini API key with generous limits from <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-[#007AFF] hover:underline font-medium">Google AI Studio</a>.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-300/40">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-1.5 rounded-md text-xs font-medium border border-gray-300 bg-white hover:bg-gray-50 transition-colors text-black active:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md text-xs font-semibold text-white bg-[#007AFF] hover:bg-blue-600 transition-colors active:bg-blue-700 shadow-sm"
                >
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
