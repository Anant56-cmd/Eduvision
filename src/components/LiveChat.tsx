import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { 
  Send, 
  Pin, 
  X, 
  Flame, 
  Sparkles, 
  Users, 
  Radio, 
  Smile, 
  Check, 
  ShieldAlert, 
  MessageSquare,
  ArrowDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';

interface LiveMessageItem {
  id: number;
  lesson_id: number;
  user_id: number;
  message: string;
  is_pinned?: boolean;
  createdAt: string;
  author: {
    id: number;
    name: string;
    avatar_url?: string;
    role: string;
  };
}

interface LiveChatProps {
  lessonId: number;
  courseInstructorId?: number;
  isLive?: boolean;
  liveStatus?: string;
  onSendReaction?: (emoji: string) => void;
}

const QUICK_REACTIONS = ['🔥', '🚀', '👏', '❤️', '💡', '🎉'];

export default function LiveChat({
  lessonId,
  courseInstructorId,
  isLive = true,
  liveStatus = 'live',
  onSendReaction
}: LiveChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<LiveMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [viewerCount, setViewerCount] = useState(1);
  const [pinnedMessage, setPinnedMessage] = useState<string | null>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [streamStatus, setStreamStatus] = useState(liveStatus);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isInstructor = user && (user.role === 'instructor' || user.id === courseInstructorId || user.role === 'admin');

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior
      });
      setHasNewMessages(false);
    }
  };

  // Fetch initial room messages & state
  useEffect(() => {
    let mounted = true;

    api.get(`/live/${lessonId}/messages`)
      .then((data) => {
        if (!mounted) return;
        setMessages(data.messages || []);
        setViewerCount(data.viewerCount || 1);
        setPinnedMessage(data.lesson?.pinned_message || null);
        setStreamStatus(data.lesson?.live_status || 'ended');
        setTimeout(() => scrollToBottom('auto'), 100);
      })
      .catch((err) => console.error('Failed to load live chat room:', err));

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        action: 'join_live_room',
        lessonId,
        userId: user?.id
      }));
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.event === 'LIVE_CHAT_MESSAGE' && payload.data?.lessonId === lessonId) {
          setMessages((prev) => [...prev, payload.data.message]);

          if (isAutoScroll) {
            setTimeout(() => scrollToBottom('smooth'), 50);
          } else {
            setHasNewMessages(true);
          }
        } else if (payload.event === 'LIVE_VIEWER_COUNT' && payload.data?.lessonId === lessonId) {
          setViewerCount(payload.data.count);
        } else if (payload.event === 'LIVE_MESSAGE_PINNED' && payload.data?.lessonId === lessonId) {
          setPinnedMessage(payload.data.pinnedMessage);
        } else if (payload.event === 'LIVE_STATUS_CHANGED' && payload.data?.lessonId === lessonId) {
          setStreamStatus(payload.data.live_status);
        }
      } catch (err) {
        console.error('WebSocket live message parse error:', err);
      }
    };

    return () => {
      mounted = false;
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          action: 'leave_live_room',
          lessonId,
          userId: user?.id
        }));
        ws.close();
      }
    };
  }, [lessonId]);

  // Handle scroll detection
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 40;
    setIsAutoScroll(isAtBottom);
    if (isAtBottom) {
      setHasNewMessages(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      await api.post(`/live/${lessonId}/messages`, { message: text });
      setIsAutoScroll(true);
      scrollToBottom('smooth');
    } catch (error) {
      console.error('Failed to post live chat message:', error);
    } finally {
      setSending(false);
    }
  };

  const handlePinMessage = async (text: string) => {
    if (!isInstructor) return;
    try {
      await api.post(`/live/${lessonId}/pin`, { pinnedMessage: text });
    } catch (err) {
      console.error('Failed to pin message:', err);
    }
  };

  const handleUnpinMessage = async () => {
    if (!isInstructor) return;
    try {
      await api.post(`/live/${lessonId}/pin`, { pinnedMessage: null });
    } catch (err) {
      console.error('Failed to unpin message:', err);
    }
  };

  const handleReactionClick = (emoji: string) => {
    if (onSendReaction) {
      onSendReaction(emoji);
    }

    // Send through WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    ws.onopen = () => {
      ws.send(JSON.stringify({
        action: 'send_reaction',
        lessonId,
        emoji,
        userName: user?.name || 'Student'
      }));
      setTimeout(() => ws.close(), 500);
    };
  };

  const toggleStreamStatus = async () => {
    if (!isInstructor) return;
    const newStatus = streamStatus === 'live' ? 'ended' : 'live';
    try {
      await api.post(`/live/${lessonId}/status`, {
        is_live: newStatus === 'live',
        live_status: newStatus
      });
      setStreamStatus(newStatus);
    } catch (err) {
      console.error('Failed to toggle live stream status:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative text-white">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            {streamStatus === 'live' ? (
              <>
                <span className="h-3 w-3 rounded-full bg-red-500 animate-ping absolute" />
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 relative" />
              </>
            ) : (
              <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-wide font-heading uppercase text-slate-100">
                {streamStatus === 'live' ? 'Live Chat' : 'Chat Replay'}
              </span>
              {streamStatus === 'live' && (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] font-bold px-1.5 py-0">
                  LIVE
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Viewer Counter */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] font-bold text-slate-300">
            <Users className="h-3.5 w-3.5 text-brand-400" />
            <span>{viewerCount} Watching</span>
          </div>

          {/* Teacher Stream Status Control */}
          {isInstructor && (
            <Button
              size="sm"
              onClick={toggleStreamStatus}
              className={`h-7 px-2.5 text-[10px] font-black rounded-lg transition-all ${
                streamStatus === 'live'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {streamStatus === 'live' ? 'End Stream' : 'Go Live 🔴'}
            </Button>
          )}
        </div>
      </div>

      {/* Pinned Announcement Banner */}
      <AnimatePresence>
        {pinnedMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-brand-900/70 to-indigo-950/80 border-b border-brand-500/30 px-4 py-2.5 text-xs text-brand-100 flex items-start gap-2 relative z-10"
          >
            <Pin className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="font-bold text-amber-300 mr-1 text-[11px] uppercase tracking-wider">Pinned by Instructor:</span>
              <span className="break-words">{pinnedMessage}</span>
            </div>
            {isInstructor && (
              <button
                onClick={handleUnpinMessage}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
                title="Unpin message"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Scroll Feed */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar text-sm select-text"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center p-6 space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400">
              <MessageSquare className="h-6 w-6" />
            </div>
            <p className="font-bold text-slate-400 text-xs">Welcome to EduVision Live Chat!</p>
            <p className="text-[11px] text-slate-500 max-w-xs">
              Say hello, ask live questions to the instructor, and celebrate milestones with reactions.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMsgInstructor = msg.author?.role === 'instructor' || msg.author?.role === 'admin';
            const isMe = user && msg.user_id === user.id;

            return (
              <div
                key={msg.id || idx}
                className={`group flex items-start gap-2.5 p-2 rounded-xl transition-colors ${
                  isMsgInstructor
                    ? 'bg-indigo-950/40 border border-indigo-500/20 shadow-sm'
                    : isMe
                    ? 'bg-slate-800/40'
                    : 'hover:bg-slate-800/20'
                }`}
              >
                {/* Avatar */}
                <div className="h-7 w-7 rounded-lg overflow-hidden bg-slate-700 shrink-0 flex items-center justify-center font-bold text-xs">
                  {msg.author?.avatar_url ? (
                    <img src={msg.author.avatar_url} alt={msg.author.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className={isMsgInstructor ? 'text-indigo-300' : 'text-slate-300'}>
                      {msg.author?.name?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>

                {/* Message Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-xs text-slate-200">
                      {msg.author?.name || 'Anonymous'}
                    </span>

                    {/* Role Badges */}
                    {isMsgInstructor ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-black text-[9px] tracking-wider uppercase shadow-sm">
                        Instructor 🎓
                      </span>
                    ) : (
                      <span className="text-[9px] font-semibold text-slate-400">
                        Scholar ⭐
                      </span>
                    )}

                    <span className="text-[10px] text-slate-500 ml-auto shrink-0 font-mono">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 mt-0.5 break-words leading-relaxed">
                    {msg.message}
                  </p>
                </div>

                {/* Pin Action for Instructors */}
                {isInstructor && (
                  <button
                    onClick={() => handlePinMessage(`${msg.author?.name}: "${msg.message}"`)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-amber-400 transition-all rounded"
                    title="Pin this comment"
                  >
                    <Pin className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* New Messages Jump-to-bottom pill */}
      <AnimatePresence>
        {hasNewMessages && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20"
          >
            <Button
              size="sm"
              onClick={() => scrollToBottom('smooth')}
              className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-full shadow-lg shadow-black/50 h-8 px-4 flex items-center gap-1.5"
            >
              <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
              New messages below
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Reactions Quick Bar */}
      <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between gap-1 z-10">
        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
          <Sparkles className="h-3 w-3 text-yellow-400" />
          <span>React:</span>
        </div>
        <div className="flex items-center gap-1.5">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReactionClick(emoji)}
              type="button"
              className="h-8 w-8 rounded-xl bg-slate-800 hover:bg-brand-600/30 hover:scale-125 border border-slate-700/50 flex items-center justify-center text-sm transition-all transform active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2 z-10">
        <Input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Chat publicly as ${user?.name || 'Student'}...`}
          maxLength={300}
          className="h-10 bg-slate-900 border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-brand-500 focus:border-brand-500"
        />
        <Button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="h-10 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shrink-0 shadow-md shadow-brand-500/20"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
