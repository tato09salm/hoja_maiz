'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  MessageCircle, 
  X, 
  Send, 
  Leaf, 
  Trash2, 
  Loader2, 
  Sparkles, 
  ArrowDownCircle
} from 'lucide-react';

// Helper to parse deepseek-like reasoning tags (<think>...</think>) out of streaming text
const parseMessage = (text) => {
  let temp = text || '';
  let isThinking = false;
  
  // Replace all completed think blocks
  while (temp.includes('<think>') && temp.includes('</think>')) {
    const startIndex = temp.indexOf('<think>');
    const endIndex = temp.indexOf('</think>') + 8; // length of </think>
    temp = temp.slice(0, startIndex) + temp.slice(endIndex);
  }
  
  // Check if there is an active/uncompleted think block at the end
  if (temp.includes('<think>')) {
    isThinking = true;
    const startIndex = temp.indexOf('<think>');
    temp = temp.slice(0, startIndex);
  }
  
  return { visibleText: temp.trimStart(), isThinking };
};

// Helper to render simple Markdown (bold, italic, list items) as React elements
const renderMessageContent = (text, isUser = false) => {
  if (!text) return null;

  // Split by newlines to handle paragraph breaks
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    if (line.trim() === '') {
      return <span className="block h-2" key={lineIdx} />;
    }

    // Check if it's a list item starting with "- " or "* "
    const isListItem = line.trim().startsWith('- ') || line.trim().startsWith('* ');
    let cleanLine = line;
    if (isListItem) {
      cleanLine = line.trim().replace(/^[-*]\s+/, '');
    }

    // Split line by bold (**text**) and italic (*text*) patterns
    const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
    const matches = cleanLine.split(regex);

    const renderedLine = matches.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong 
            key={partIdx} 
            className={`font-extrabold ${isUser ? 'text-white underline' : 'text-green-800 dark:text-green-300'}`}
          >
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em 
            key={partIdx} 
            className={`italic ${isUser ? 'text-gray-100' : 'text-gray-700 dark:text-gray-200'}`}
          >
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });

    if (isListItem) {
      return (
        <li 
          key={lineIdx} 
          className={`ml-4 list-disc list-outside mb-1 leading-relaxed ${isUser ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}
        >
          <span>{renderedLine}</span>
        </li>
      );
    }

    return (
      <p key={lineIdx} className={lineIdx > 0 ? 'mt-1.5' : ''}>
        {renderedLine}
      </p>
    );
  });
};

export default function Chatbot() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Vercel AI SDK useChat Hook
  const { 
    messages, 
    sendMessage, 
    status, 
    error,
    setMessages 
  } = useChat({
    api: '/api/chat',
    onError: (err) => {
      console.error('Error in chatbot communication:', err);
    }
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  // Scroll to bottom on new messages or when chat window opens
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      // Small timeout to allow the transition/render to complete
      const timer = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, isOpen, isLoading]);

  // If no user is logged in or component not mounted, do not render the chatbot
  if (!mounted || !user) {
    return null;
  }

  const firstName = user.name ? user.name.split(' ')[0] : 'Usuario';
  const initialGreeting = `Bienvenido, ${firstName}. ¿En qué te puedo ayudar?`;

  const handleClearChat = () => {
    if (window.confirm('¿Deseas vaciar el historial de conversación?')) {
      setMessages([]);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput('');
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-full shadow-2xl hover:shadow-green-600/30 transition-all duration-300 hover:scale-110 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        aria-label="Abrir asistente de chat"
      >
        {isOpen ? (
          <X className="w-6 h-6 transition-transform duration-300 rotate-90" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-6 h-6 transition-transform duration-300 group-hover:rotate-12" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full border border-white" />
          </div>
        )}
      </button>

      {/* Chat Window Container */}
      <div
        className={`
          fixed bottom-24 right-6 z-50 flex flex-col 
          w-[calc(100vw-2rem)] sm:w-96 h-[500px] max-h-[75vh] sm:max-h-[80vh]
          bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl 
          transition-all duration-300 ease-out origin-bottom-right
          ${isOpen 
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' 
            : 'opacity-0 translate-y-8 scale-90 pointer-events-none'
          }
        `}
      >
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-700 dark:to-emerald-800 text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/20 rounded-xl backdrop-blur-sm">
              <Leaf className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                Asistente Maíz Saludable
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              </h3>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                <span className="text-[10px] text-emerald-100 font-medium">En línea</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="p-1.5 hover:bg-white/10 rounded-lg text-emerald-100 hover:text-white transition-colors"
                title="Limpiar chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-lg text-emerald-100 hover:text-white transition-colors"
              title="Cerrar chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Body (Messages List) */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50 dark:bg-gray-900/30 scrollbar-thin">
          {/* Static Welcome Message (0 Tokens) */}
          <div className="flex justify-start">
            <div className="flex items-start gap-2.5 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 border border-green-200 dark:border-green-800">
                <Leaf className="w-4 h-4 text-green-700 dark:text-green-400" />
              </div>
              <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-2xl rounded-tl-none px-4 py-2.5 text-sm shadow-sm border border-gray-100 dark:border-gray-700">
                <span className="block text-[10px] font-bold text-green-600 dark:text-green-400 mb-1">ASISTENTE</span>
                <p className="leading-relaxed whitespace-pre-line">{initialGreeting}</p>
              </div>
            </div>
          </div>

          {/* Dynamic Messages from useChat */}
          {messages.map((m) => {
            const isUser = m.role === 'user';
            
            const rawText = m.parts
              ? m.parts.filter((part) => part.type === 'text').map((part) => part.text).join('')
              : m.content || '';
              
            const { visibleText, isThinking } = isUser ? { visibleText: rawText, isThinking: false } : parseMessage(rawText);

            // If it is in thinking state and has no visible text to show, we want to render the thinking dots
            const showThinkingDots = !isUser && isThinking && !visibleText.trim();
            
            // If the message is completely empty and we're not thinking, don't render an empty bubble
            if (!visibleText.trim() && !showThinkingDots) {
              return null;
            }

            return (
              <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start gap-2.5 max-w-[85%] ${isUser ? 'flex-row-reverse' : ''}`}>
                  {/* Icon */}
                  {!isUser ? (
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 border border-green-200 dark:border-green-800">
                      <Leaf className="w-4 h-4 text-green-700 dark:text-green-400" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs uppercase shadow-sm">
                      {user.name ? user.name[0] : 'U'}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div 
                    className={`
                      rounded-2xl px-4 py-2.5 text-sm shadow-sm border leading-relaxed whitespace-normal
                      ${isUser 
                        ? 'bg-gradient-to-br from-green-600 to-emerald-600 text-white border-green-500 rounded-tr-none' 
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-100 dark:border-gray-700 rounded-tl-none'
                      }
                    `}
                  >
                    {!isUser && (
                      <span className="block text-[10px] font-bold text-green-600 dark:text-green-400 mb-1">ASISTENTE</span>
                    )}
                    
                    {showThinkingDots ? (
                      <div className="flex items-center gap-1.5 py-1.5">
                        <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {renderMessageContent(visibleText, isUser)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing/Loading Indicator (only before assistant message starts streaming) */}
          {isLoading && !messages.some((m) => m.role === 'assistant') && (
            <div className="flex justify-start">
              <div className="flex items-start gap-2.5 max-w-[85%] animate-pulse">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 border border-green-200 dark:border-green-800">
                  <Leaf className="w-4 h-4 text-green-700 dark:text-green-400" />
                </div>
                <div className="bg-white dark:bg-gray-800 text-gray-400 rounded-2xl rounded-tl-none px-4 py-3 text-sm border border-gray-100 dark:border-gray-700 flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 text-xs bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-center">
              Hubo un problema de conexión. Por favor intenta de nuevo.
            </div>
          )}

          {/* Anchor for Auto-Scroll */}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Footer */}
        <form 
          onSubmit={handleFormSubmit}
          className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-2xl"
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta algo sobre Maíz Saludable..."
              disabled={isLoading}
              className="flex-1 min-w-0 h-10 px-3.5 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-transparent disabled:opacity-50 transition-all duration-200"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex items-center justify-center w-10 h-10 bg-green-600 dark:bg-green-700 text-white rounded-xl shadow-md hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-40 disabled:hover:bg-green-600 transition-all duration-200 flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-4.5 h-4.5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
