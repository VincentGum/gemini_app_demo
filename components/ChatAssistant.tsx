
import React, { useState, useRef, useEffect } from 'react';
import { getChatResponse } from '../services/geminiService';
import { GameState, ChatMessage } from '../types';

interface ChatAssistantProps {
  gameState: GameState;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ gameState }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getChatResponse(input, gameState, messages);
      setMessages(prev => [...prev, { role: 'model', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "Forgive me, my connection to the ether is weak. Try asking again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-zinc-900 border border-zinc-700 w-80 md:w-96 h-[500px] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          <header className="bg-zinc-800 p-4 flex justify-between items-center border-b border-zinc-700">
            <h3 className="font-bold text-zinc-200 flex items-center gap-2">
              <i className="fa-solid fa-wand-magic-sparkles text-purple-400"></i>
              Chronicle Guide
            </h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <i className="fa-solid fa-times"></i>
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950/50">
            {messages.length === 0 && (
              <p className="text-zinc-500 text-sm italic text-center py-10">
                Ask me about the world, your items, or your quest...
              </p>
            )}
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-lg text-sm ${
                  m.role === 'user' 
                    ? 'bg-purple-600 text-white rounded-br-none' 
                    : 'bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-bl-none'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 p-3 rounded-lg flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                </div>
              </div>
            )}
          </div>

          <footer className="p-4 bg-zinc-900 border-t border-zinc-800 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask the guide..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </footer>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        >
          <i className="fa-solid fa-wand-magic-sparkles text-xl"></i>
        </button>
      )}
    </div>
  );
};

export default ChatAssistant;
