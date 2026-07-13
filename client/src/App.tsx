import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Shield, Sparkles, Brain, Cpu, MessageSquare } from 'lucide-react';

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
    id: 'gpt-4o',
    name: 'GPT-4o (Omni)',
    avatar: <Cpu className="w-5 h-5 text-emerald-500" />,
    subtitle: 'OpenAI GPT-4o model',
    model: 'gpt-4o',
    initialMessage: 'Hello. How can I help you stealthily today?',
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    avatar: <Brain className="w-5 h-5 text-orange-500" />,
    subtitle: 'Anthropic Sonnet model',
    model: 'claude-3-5-sonnet',
    initialMessage: 'Greetings. I am Claude. What shall we analyze?',
  },
  {
    id: 'gemini-1-5-pro',
    name: 'Gemini 1.5 Pro',
    avatar: <Sparkles className="w-5 h-5 text-blue-500" />,
    subtitle: 'Google Gemini Pro model',
    model: 'gemini-1-5-pro',
    initialMessage: 'Hi there! I am Gemini. Ready to tackle complex tasks.',
  },
  {
    id: 'llama-3-1',
    name: 'Llama 3.1 70B',
    avatar: <Shield className="w-5 h-5 text-purple-500" />,
    subtitle: 'Meta open source model',
    model: 'llama-3-1',
    initialMessage: 'Llama 3.1 active. Ready to assist.',
  }
];

function App() {
  const [selectedContact, setSelectedContact] = useState<Contact>(CONTACTS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [input, setInput] = useState('');
  const [chatHistories, setChatHistories] = useState<Record<string, Message[]>>(() => {
    // Initialize with the starter message for each model
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

  // Scroll to bottom on new message or stream update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistories, streamingMessage]);

  const activeMessages = chatHistories[selectedContact.id] || [];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    setIsLoading(true);

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date()
    };

    // Update state with user message
    setChatHistories(prev => ({
      ...prev,
      [selectedContact.id]: [...(prev[selectedContact.id] || []), userMessage]
    }));

    // Prepare API call
    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

      // Once done, append to conversation history
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
      // Append an error message bubble
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        sender: 'ai',
        text: '⚠️ Error: Failed to retrieve response from server. Make sure the FastAPI server is running.',
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

  const filteredContacts = CONTACTS.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-black font-sans">
      {/* Sidebar */}
      <div className="w-[300px] flex-shrink-0 flex flex-col bg-[#F5F5F7] border-r border-[#D2D2D7] h-full">
        {/* Search Bar Container */}
        <div className="p-3">
          <div className="relative flex items-center bg-[#E3E3E5] rounded-lg px-2 py-1.5 text-gray-500">
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
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
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
                    ? 'bg-[#007AFF] text-white'
                    : 'hover:bg-[#E8E8EC] text-black'
                }`}
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isActive ? 'bg-white/20' : 'bg-[#E3E3E5]'
                }`}>
                  {contact.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-[15px] truncate">{contact.name}</span>
                    <span className={`text-[11px] ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                      {lastMsg ? lastMsg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className={`text-[13px] truncate ${isActive ? 'text-white/90' : 'text-gray-500'}`}>
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
        <div className="h-[52px] border-b border-[#D2D2D7] flex items-center justify-center px-4 bg-white flex-shrink-0 relative">
          <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">To:</span>
            <span className="font-bold text-[15px]">{selectedContact.name}</span>
          </div>
          <div className="absolute right-4 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#E3E3E5] flex items-center justify-center">
              {selectedContact.avatar}
            </div>
          </div>
        </div>

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
                      : 'bg-[#E9E9EB] text-black rounded-bl-[4px]'
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

        {/* Input area */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-white border-t border-[#F2F2F2]">
          <form onSubmit={handleSend} className="relative flex items-center max-w-4xl mx-auto">
            <input
              type="text"
              placeholder="iMessage"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="w-full bg-white border border-[#D2D2D7] rounded-full pl-4 pr-12 py-2 text-[15px] focus:outline-none focus:border-blue-500 text-black placeholder-gray-400"
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
    </div>
  );
}

export default App;
