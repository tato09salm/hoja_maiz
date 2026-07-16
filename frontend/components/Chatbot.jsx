'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import { 
  MessageCircle, 
  X, 
  Send, 
  Leaf, 
  Trash2, 
  Loader2, 
  Sparkles, 
  ArrowDownCircle,
  Upload
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
  const { language, t } = useLanguage();
  const router = useRouter();
  
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState('');
  const [showUploadBox, setShowUploadBox] = useState(false);
  const [localError, setLocalError] = useState(false);
  const messagesEndRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Vercel AI SDK useChat Hook
  const { 
    messages, 
    sendMessage, 
    status, 
    error,
    setMessages,
    addToolOutput,
    stop
  } = useChat({
    api: '/api/chat',
    onError: (err) => {
      console.error('Error in chatbot communication:', err);
    },
    onToolCall: async ({ toolCall }) => {
      console.log('Tool call client side:', toolCall);
      let outputText = '';
      if (toolCall.name === 'goToDashboard') {
        router.push('/dashboard');
        outputText = 'Navigated to Dashboard';
      } else if (toolCall.name === 'goToAnalyze') {
        router.push('/analyze');
        outputText = 'Navigated to Analyze page';
      } else if (toolCall.name === 'goToHistory') {
        router.push('/history');
        outputText = 'Navigated to History page';
      } else if (toolCall.name === 'analyzeLeaf') {
        setShowUploadBox(true);
        outputText = 'Upload panel displayed to user';
      }

      // Add tool output to transition the tool execution state and complete it
      addToolOutput({
        tool: toolCall.name,
        toolCallId: toolCall.id,
        state: 'output-available',
        output: outputText
      });
    }
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  // Monitor loading state to handle timeouts
  useEffect(() => {
    if (isLoading) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // 15-second timeout fallback
      timeoutRef.current = setTimeout(() => {
        console.warn('Chatbot request timed out. Aborting...');
        stop();
        setLocalError(true);
      }, 15000);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, messages, stop]);

  const handleUploadImage = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert(t('chatbot_scan_error'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataURL = event.target.result;
        sessionStorage.setItem('pending_analyze_image', dataURL);
        sessionStorage.setItem('pending_analyze_filename', file.name);
        
        setShowUploadBox(false);
        setIsOpen(false);
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('pending-analyze-image'));
        }
        
        router.push('/analyze');
      };
      reader.readAsDataURL(file);
    }
  };

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

  // Backup hook to execute tool calls detected in message history
  useEffect(() => {
    messages.forEach((msg) => {
      if (msg.role === 'assistant' && msg.parts) {
        msg.parts.forEach((part) => {
          if (part.type === 'tool' || part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
            const toolName = part.toolName || (part.type.startsWith('tool-') ? part.type.replace('tool-', '') : '');
            
            if (part.state === 'call' || part.state === 'input-available') {
              console.log('Executing tool from backup useEffect:', toolName, part.toolCallId);
              
              let outputText = '';
              if (toolName === 'goToDashboard') {
                router.push('/dashboard');
                outputText = 'Navigated to Dashboard';
              } else if (toolName === 'goToAnalyze') {
                router.push('/analyze');
                outputText = 'Navigated to Analyze page';
              } else if (toolName === 'goToHistory') {
                router.push('/history');
                outputText = 'Navigated to History page';
              } else if (toolName === 'analyzeLeaf') {
                setShowUploadBox(true);
                outputText = 'Upload panel displayed to user';
              }
              
              addToolOutput({
                tool: toolName,
                toolCallId: part.toolCallId,
                state: 'output-available',
                output: outputText
              });
            }
          }
        });
      }
    });
  }, [messages, router, addToolOutput]);

  // If no user is logged in or component not mounted, do not render the chatbot
  if (!mounted || !user) {
    return null;
  }

  const firstName = user.name ? user.name.split(' ')[0] : (language === 'en' ? 'User' : 'Usuario');
  const initialGreeting = t('chatbot_greeting', { name: firstName });

  const handleClearChat = () => {
    const msg = t('chatbot_clear_confirm');
    if (window.confirm(msg)) {
      setMessages([]);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLocalError(false); // Reset local error state on new message
    sendMessage({ text: input });
    setInput('');
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-full shadow-2xl hover:shadow-green-600/30 transition-all duration-300 hover:scale-110 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        aria-label={t('chatbot_open_aria')}
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
                {t('chatbot_header')}
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              </h3>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                <span className="text-[10px] text-emerald-100 font-medium">
                  {t('chatbot_online')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="p-1.5 hover:bg-white/10 rounded-lg text-emerald-100 hover:text-white transition-colors"
                title={t('chatbot_clear_title')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-lg text-emerald-100 hover:text-white transition-colors"
              title={t('chatbot_close_title')}
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
                <span className="block text-[10px] font-bold text-green-600 dark:text-green-400 mb-1">
                  {t('chatbot_assistant_label')}
                </span>
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

            // Extract tool calls from parts
            const toolParts = m.parts 
              ? m.parts.filter((part) => part.type.startsWith('tool-') || part.type === 'tool' || part.type === 'dynamic-tool') 
              : [];

            // If the message has no visible text but has tool calls, we generate a friendly default message
            let displayedText = visibleText;
            if (!visibleText.trim() && toolParts.length > 0) {
              const mainTool = toolParts[0];
              const toolName = mainTool.toolName || (mainTool.type.startsWith('tool-') ? mainTool.type.replace('tool-', '') : '');
              
              if (toolName === 'goToDashboard') {
                displayedText = t('chatbot_feedback_dashboard');
              } else if (toolName === 'goToAnalyze') {
                displayedText = t('chatbot_feedback_analyze');
              } else if (toolName === 'goToHistory') {
                displayedText = t('chatbot_feedback_history');
              } else if (toolName === 'analyzeLeaf') {
                displayedText = t('chatbot_feedback_upload');
              }
            }

            // If it is in thinking state and has no visible text to show, we want to render the thinking dots
            const showThinkingDots = !isUser && isThinking && !displayedText.trim();
            
            // If the message has no visible text, no thinking dots, and no tools, don't render it
            if (!displayedText.trim() && !showThinkingDots && toolParts.length === 0) {
              return null;
            }

            return (
              <div key={m.id} className="space-y-3">
                {/* 1. Render Tool Call Indicators (if any) */}
                {toolParts.map((part, partIdx) => {
                  let label = t('chatbot_tool_used');
                  const isExecuting = part.state === 'input-streaming' || part.state === 'input-available' || part.state === 'call';
                  if (isExecuting) {
                    label = t('chatbot_tool_calling');
                  }

                  return (
                    <div key={partIdx} className="w-full flex justify-center py-1">
                      <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-100 dark:bg-gray-800/50 px-2 py-0.5 rounded-md">
                        {label}
                      </span>
                    </div>
                  );
                })}

                {/* 2. Render normal Message Bubble (if it has text or thinking dots) */}
                {(displayedText.trim() || showThinkingDots) && (
                  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
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
                          <span className="block text-[10px] font-bold text-green-600 dark:text-green-400 mb-1">
                            {t('chatbot_assistant_label')}
                          </span>
                        )}
                        
                        {showThinkingDots ? (
                          <div className="flex items-center gap-1.5 py-1.5">
                            <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {renderMessageContent(displayedText, isUser)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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

          {/* Upload box for analyzeLeaf tool */}
          {showUploadBox && (
            <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-dashed border-green-300 dark:border-green-800 rounded-xl space-y-2 text-center animate-fade-in-down">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-green-800 dark:text-green-300 flex items-center gap-1.5">
                  <Leaf className="w-4 h-4 animate-bounce" />
                  {t('chatbot_scan_title')}
                </span>
                <button 
                  onClick={() => setShowUploadBox(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {t('chatbot_scan_desc')}
              </p>
              <label className="flex flex-col items-center justify-center py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-green-400 transition-all group">
                <Upload className="w-6 h-6 text-green-600 dark:text-green-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {t('chatbot_scan_btn')}
                </span>
                <span className="text-[10px] text-gray-400">
                  {t('chatbot_scan_formats')}
                </span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleUploadImage} 
                  className="hidden" 
                />
              </label>
            </div>
          )}

          {/* Error Message */}
          {(error || localError) && (
            <div className="p-3 text-xs bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-center font-medium">
              {t('chatbot_error')}
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
              placeholder={t('chatbot_placeholder')}
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
