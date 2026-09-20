import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Bot, User, Sparkles, Loader2, RotateCcw, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { askLearningAssistant } from '../lib/gemini';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantProps {
  context: string;
}

const SUGGESTED_PROMPTS = [
  "💡 Summarize key points",
  "❓ Quiz me on this lesson",
  "⚡ Technical interview tips",
  "🔍 Explain in simple terms"
];

export default function AIAssistant({ context }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: "Hello! I'm your EduVision AI Mentor. Ask me any question about the curriculum, coding patterns, or interview concepts!" 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim() || isLoading) return;

    const userMessage = promptText.trim();
    setInput('');
    const updatedHistory: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(updatedHistory);
    setIsLoading(true);

    try {
      const response = await askLearningAssistant(userMessage, context, updatedHistory);
      setMessages(prev => [
        ...prev, 
        { role: 'assistant', content: response || "I've reviewed the lesson material. Feel free to ask more details on specific algorithms or concepts!" }
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev, 
        { role: 'assistant', content: "I encountered a minor network glitch. Let me know which concept or question you'd like me to explain." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      { 
        role: 'assistant', 
        content: "Chat refreshed! How can I support your learning goals right now?" 
      }
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-[360px] sm:w-[420px] h-[540px] bg-white rounded-[2rem] shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src="/eduvision-icon.png" 
                  alt="EduVision" 
                  className="h-10 w-10 rounded-xl shadow-md object-cover border border-white/20" 
                />
                <div>
                  <h3 className="font-bold font-heading text-sm flex items-center gap-1.5">
                    EduVision AI Mentor
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono font-normal">v2.0</span>
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[11px] text-brand-100 font-medium">Multi-Turn Pedagogical Engine</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleResetChat}
                  title="Reset conversation"
                  className="text-white hover:bg-white/10 rounded-xl h-8 w-8"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/10 rounded-xl h-8 w-8"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-50/50 text-xs"
            >
              {messages.map((m, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex gap-2.5 max-w-[88%]",
                    m.role === 'user' ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                    m.role === 'user' ? "bg-slate-200 text-slate-700" : "bg-brand-100 text-brand-700"
                  )}>
                    {m.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                  </div>
                  <div className={cn(
                    "p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap",
                    m.role === 'user' 
                      ? "bg-brand-600 text-white rounded-tr-none shadow-sm" 
                      : "bg-white border border-slate-200/80 text-slate-800 rounded-tl-none shadow-sm font-medium"
                  )}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2.5 max-w-[88%]">
                  <div className="h-7 w-7 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2 text-slate-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-600" />
                    <span>Thinking & synthesizing...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 overflow-x-auto custom-scrollbar flex gap-1.5 flex-nowrap">
              {SUGGESTED_PROMPTS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendPrompt(chip)}
                  disabled={isLoading}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-600 hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700 transition-all flex-shrink-0 disabled:opacity-50"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-slate-100">
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Ask a question or request an explanation..."
                  className="w-full h-11 pl-4 pr-11 bg-slate-100 border-none rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt(input)}
                />
                <Button 
                  size="icon"
                  onClick={() => handleSendPrompt(input)}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-1 top-1 h-9 w-9 bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 sm:h-16 sm:w-16 bg-brand-600 text-white rounded-2xl shadow-xl flex items-center justify-center group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        {isOpen ? <X className="h-7 w-7 relative z-10" /> : <MessageSquare className="h-7 w-7 relative z-10" />}
        {!isOpen && (
          <div className="absolute top-2 right-2 h-3 w-3 bg-emerald-400 border-2 border-brand-600 rounded-full animate-ping" />
        )}
      </motion.button>
    </div>
  );
}
