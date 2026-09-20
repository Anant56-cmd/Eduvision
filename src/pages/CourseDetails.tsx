import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle, PlayCircle, Lock, Trophy, Sparkles, Clock, User, 
  BookOpen, ChevronRight, BrainCircuit, Download, CreditCard,
  MessageSquare, StickyNote, Bell, ThumbsUp, Send, Bookmark,
  AlertCircle, Plus, Eye, CheckCircle2, Bot, HelpCircle, Star,
  Code2, Brain, Radio
} from 'lucide-react';
import { generateCourseSummary } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import AIAssistant from '../components/AIAssistant';
import VideoPlayer from '../components/VideoPlayer';
import PaymentModal from '../components/PaymentModal';
import CertificateModal from '../components/CertificateModal';
import CodeLab from '../components/CodeLab';
import FlashcardDeck from '../components/FlashcardDeck';
import LiveChat from '../components/LiveChat';
import { jsPDF } from 'jspdf';

export default function CourseDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Core state
  const [course, setCourse] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progress, setProgress] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'curriculum' | 'doubts' | 'notes' | 'announcements' | 'codelab' | 'flashcards' | 'livechat'>('curriculum');
  
  // Modals & player
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [isLiveClassMode, setIsLiveClassMode] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<Array<{ id: string; emoji: string; x: number }>>([]);

  // Doubts state (PW / Byju's style)
  const [doubts, setDoubts] = useState<any[]>([]);
  const [newDoubtTitle, setNewDoubtTitle] = useState('');
  const [newDoubtQuestion, setNewDoubtQuestion] = useState('');
  const [isPostingDoubt, setIsPostingDoubt] = useState(false);
  const [replyInput, setReplyInput] = useState<Record<number, string>>({});

  // Notes state
  const [notes, setNotes] = useState<any[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Announcements state
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    fetchData();

    // WebSocket real-time updates for doubts and announcements
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const { event: eventName } = JSON.parse(event.data);
        if (['DOUBT_CREATED', 'DOUBT_REPLIED'].includes(eventName)) {
          fetchDoubts();
        } else if (eventName === 'ANNOUNCEMENT_CREATED') {
          fetchAnnouncements();
        }
      } catch (err) {
        console.error('Socket message parse error:', err);
      }
    };

    return () => socket.close();
  }, [id, user]);

  useEffect(() => {
    if (selectedLesson) {
      fetchNotes(selectedLesson.id);
    }
  }, [selectedLesson]);

  const fetchData = async () => {
    try {
      const [courseData, enrolledData, quizzesData, progressData] = await Promise.all([
        api.get(`/courses/${id}`),
        user ? api.get(`/courses/enrolled`) : Promise.resolve([]),
        user ? api.get(`/quizzes/course/${id}`) : Promise.resolve([]),
        user ? api.get(`/courses/${id}/progress`) : Promise.resolve([])
      ]);

      setCourse(courseData);
      setQuizzes(quizzesData);
      
      const enrolled = enrolledData.some((c: any) => c.id === parseInt(id!));
      const isInstructor = user && courseData.instructor_id === user.id;
      const isAdmin = user && user.role === 'admin';
      
      const userHasAccess = enrolled || isInstructor || isAdmin;
      setIsEnrolled(userHasAccess);
      
      const progMap: Record<number, boolean> = {};
      progressData.forEach((p: any) => {
        progMap[p.lesson_id] = p.completion_status;
      });
      setProgress(progMap);

      // Default select first lesson
      if (courseData.lessons && courseData.lessons.length > 0) {
        setSelectedLesson(courseData.lessons[0]);
      }

      fetchDoubts();
      fetchAnnouncements();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedLesson?.is_live || selectedLesson?.live_status === 'live') {
      setIsLiveClassMode(true);
    }
  }, [selectedLesson?.id]);

  useEffect(() => {
    if (!selectedLesson?.id) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === 'LIVE_REACTION' && payload.data?.lessonId === selectedLesson.id) {
          const rId = payload.data.id || `${Date.now()}-${Math.random()}`;
          setFloatingReactions((prev) => [
            ...prev.slice(-12),
            {
              id: rId,
              emoji: payload.data.emoji,
              x: Math.floor(Math.random() * 25) + 65
            }
          ]);
          setTimeout(() => {
            setFloatingReactions((prev) => prev.filter((r) => r.id !== rId));
          }, 2100);
        }
      } catch (err) {
        console.error('Reaction parse error:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, [selectedLesson?.id]);

  const handleLocalReaction = (emoji: string) => {
    const rId = `${Date.now()}-${Math.random()}`;
    setFloatingReactions((prev) => [
      ...prev.slice(-12),
      {
        id: rId,
        emoji,
        x: Math.floor(Math.random() * 25) + 65
      }
    ]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== rId));
    }, 2100);
  };

  const fetchDoubts = async () => {
    try {
      const data = await api.get(`/doubts/course/${id}`);
      setDoubts(data);
    } catch (e) {
      console.error('Failed to fetch doubts:', e);
    }
  };

  const fetchNotes = async (lessonId: number) => {
    if (!user) return;
    try {
      const data = await api.get(`/notes/lesson/${lessonId}`);
      setNotes(data);
    } catch (e) {
      console.error('Failed to fetch notes:', e);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const data = await api.get(`/announcements?courseId=${id}`);
      setAnnouncements(data);
    } catch (e) {
      console.error('Failed to fetch announcements:', e);
    }
  };

  const handleCreateDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (!newDoubtTitle.trim() || !newDoubtQuestion.trim()) return;

    setIsPostingDoubt(true);
    try {
      await api.post('/doubts', {
        course_id: parseInt(id!),
        lesson_id: selectedLesson?.id || null,
        title: newDoubtTitle,
        question: newDoubtQuestion,
        timestamp_seconds: 0
      });
      setNewDoubtTitle('');
      setNewDoubtQuestion('');
      fetchDoubts();
    } catch (err) {
      console.error(err);
      alert('Failed to post doubt');
    } finally {
      setIsPostingDoubt(false);
    }
  };

  const handleReplyDoubt = async (doubtId: number) => {
    if (!user) return navigate('/login');
    const text = replyInput[doubtId];
    if (!text || !text.trim()) return;

    try {
      await api.post(`/doubts/${doubtId}/reply`, { reply: text.trim() });
      setReplyInput({ ...replyInput, [doubtId]: '' });
      fetchDoubts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpvoteDoubt = async (doubtId: number) => {
    try {
      await api.post(`/doubts/${doubtId}/upvote`, {});
      fetchDoubts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (!newNoteContent.trim() || !selectedLesson) return;

    setIsSavingNote(true);
    try {
      await api.post('/notes', {
        course_id: parseInt(id!),
        lesson_id: selectedLesson.id,
        timestamp_seconds: 0,
        content: newNoteContent.trim()
      });
      setNewNoteContent('');
      fetchNotes(selectedLesson.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      await api.delete(`/notes/${noteId}`);
      if (selectedLesson) fetchNotes(selectedLesson.id);
    } catch (err) {
      console.error(err);
    }
  };

  const calculateTotalDuration = (lessons: any[]) => {
    if (!lessons || lessons.length === 0) return '0m';
    let totalSeconds = 0;
    lessons.forEach(lesson => {
      const duration = lesson.duration || '0:00';
      const parts = duration.split(':').map(Number);
      if (parts.length === 2) totalSeconds += parts[0] * 60 + parts[1];
      else if (parts.length === 3) totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
    });
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const formatDuration = (duration: string) => {
    if (!duration) return '0m 0s';
    const parts = duration.split(':').map(Number);
    if (parts.length === 2) return `${parts[0]}m ${parts[1]}s`;
    if (parts.length === 3) return `${parts[0]}h ${parts[1]}m ${parts[2]}s`;
    return duration;
  };

  const handleDownloadPDF = () => {
    if (!course) return;
    const doc = new jsPDF();
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('EDUVISION', 20, 25);
    
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(20);
    doc.text(course.title, 20, 55);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Instructor: ${course.instructor?.name}`, 20, 65);
    doc.text(`Total Lessons: ${course.lessons?.length || 0}`, 20, 72);
    
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(11);
    const splitDescription = doc.splitTextToSize(course.description, 170);
    doc.text(splitDescription, 20, 85);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 110, 190, 110);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text('Course Curriculum', 20, 120);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    
    course.lessons?.forEach((lesson: any, index: number) => {
      const yPos = 135 + (index * 12);
      if (yPos > 270) {
        doc.addPage();
        doc.text('Curriculum (continued)', 20, 20);
      }
      doc.setFillColor(248, 250, 252);
      doc.rect(20, yPos - 7, 170, 10, 'F');
      doc.text(`${index + 1}. ${lesson.title} (${lesson.duration || 'N/A'})`, 25, yPos);
    });
    
    doc.save(`${course.title.replace(/\s+/g, '_')}_Syllabus.pdf`);
  };

  const handleEnroll = async () => {
    if (!user) return navigate('/login');
    try {
      await api.post(`/courses/${id}/enroll`, {});
      setIsEnrolled(true);
      fetchData();
    } catch (err: any) {
      console.error(err);
      if (course.price > 0) {
        setIsPaymentModalOpen(true);
      }
    }
  };

  const toggleLesson = async (lessonId: number) => {
    if (!isEnrolled) return;
    const newStatus = !progress[lessonId];
    try {
      await api.post('/courses/progress', { courseId: parseInt(id!), lessonId, completed: newStatus });
      setProgress({ ...progress, [lessonId]: newStatus });
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateSummary = async () => {
    if (!course) return;
    setGeneratingSummary(true);
    try {
      const summary = await generateCourseSummary(course.title, course.description, course.lessons || []);
      setAiSummary(summary || null);
    } catch (error) {
      console.error(error);
    } finally {
      setGeneratingSummary(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
    </div>
  );
  if (!course) return <div className="text-center py-20 text-slate-500">Course not found</div>;

  const completedCount = Object.values(progress).filter(Boolean).length;
  const totalLessons = course.lessons?.length || 0;
  const allCompleted = totalLessons > 0 && completedCount === totalLessons;

  // Can this lesson be previewed/played right now?
  const isLessonPlayable = (idx: number) => isEnrolled || idx === 0;

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-24 px-4 sm:px-6">
      {/* Hero Header */}
      <section className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 text-white p-8 md:p-14 shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
          <img 
            src={course.thumbnail_url || `https://picsum.photos/seed/${course.id + 10}/1200/800`} 
            alt="" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-slate-900" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-brand-500 hover:bg-brand-600 border-none px-3 py-1 font-bold">
              {course.category || 'General'}
            </Badge>
            {course.level && (
              <Badge variant="outline" className="text-slate-300 border-slate-700 font-bold">
                {course.level}
              </Badge>
            )}
            <div className="flex items-center gap-1 bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full text-xs font-bold">
              <Star className="h-3 w-3 fill-current text-amber-400" />
              <span>{course.rating || 4.9}</span>
            </div>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black tracking-tight font-heading leading-tight">
            {course.title}
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl font-medium">
            {course.description}
          </p>
          
          <div className="flex flex-wrap items-center gap-6 pt-2 text-sm text-slate-300 font-semibold">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-400" />
              <span>{calculateTotalDuration(course.lessons)} total</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-brand-400" />
              <span>{totalLessons} Modules</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-brand-400" />
              <span>By {course.instructor?.name}</span>
            </div>
          </div>

          <div className="pt-6 flex flex-wrap gap-4 items-center">
            {!isEnrolled ? (
              <>
                <Button 
                  onClick={() => {
                    if (course.price === 0) {
                      handleEnroll();
                    } else {
                      setIsPaymentModalOpen(true);
                    }
                  }} 
                  size="lg" 
                  className="h-14 px-8 rounded-2xl bg-brand-600 hover:bg-brand-700 text-lg font-bold shadow-xl shadow-brand-900/40"
                >
                  Enroll Now • {course.price === 0 ? 'Free' : `₹${course.price.toLocaleString()}`}
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="h-14 px-6 rounded-2xl border-slate-700 text-slate-200 hover:bg-white/10 font-bold"
                  onClick={handleDownloadPDF}
                >
                  <Download className="h-5 w-5 mr-2" />
                  Syllabus PDF
                </Button>
                {course.lessons && course.lessons.length > 0 && (
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => {
                      setSelectedLesson(course.lessons[0]);
                      const playerEl = document.getElementById('lesson-player');
                      playerEl?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="h-14 px-6 rounded-2xl text-amber-300 hover:bg-amber-400/10 font-bold"
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    Preview Lesson 1 Free
                  </Button>
                )}
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-4">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-4 py-2 text-sm font-bold">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Enrolled & Active
                </Badge>
                <Button 
                  variant="outline" 
                  className="rounded-xl border-slate-700 text-slate-300"
                  onClick={handleDownloadPDF}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Syllabus PDF
                </Button>
                {allCompleted && (
                  <Button 
                    className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl" 
                    onClick={() => setIsCertificateModalOpen(true)}
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Claim Certificate
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Video Player & Live Classroom Section */}
      {selectedLesson && (
        <section id="lesson-player" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Active Lesson</span>
                {(selectedLesson.is_live || selectedLesson.live_status === 'live') && (
                  <Badge className="bg-red-500 text-white font-black text-[10px] px-2 py-0.5 animate-pulse flex items-center gap-1 shadow-sm shadow-red-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                    LIVE CLASSROOM
                  </Badge>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
                {selectedLesson.title}
              </h2>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                variant={isLiveClassMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsLiveClassMode(!isLiveClassMode)}
                className={`rounded-xl font-bold h-10 px-4 text-xs flex items-center gap-2 transition-all ${
                  isLiveClassMode
                    ? "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <Radio className={`h-4 w-4 ${isLiveClassMode ? "animate-pulse text-white" : "text-red-500"}`} />
                {isLiveClassMode ? "Exit Live Layout" : "🔴 Live Classroom & Chat"}
              </Button>

              {!isEnrolled && (
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 px-3 py-1 font-bold">
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  Free Demo Preview
                </Badge>
              )}
            </div>
          </div>

          {/* Player Grid: either 2-column Live Theater (Video + LiveChat) or Standard 1-column */}
          <div className={isLiveClassMode ? "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" : "grid grid-cols-1 gap-6"}>
            <div className={isLiveClassMode ? "lg:col-span-8 space-y-6" : "space-y-6"}>
              <div className="relative group overflow-hidden rounded-[2rem]">
                <VideoPlayer 
                  url={selectedLesson.video_url} 
                  embedCode={selectedLesson.embed_code}
                  title={selectedLesson.title} 
                />

                {/* Floating Emoji Reactions Overlay */}
                <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
                  <AnimatePresence>
                    {floatingReactions.map((r) => (
                      <motion.div
                        key={r.id}
                        initial={{ opacity: 1, y: 350, scale: 0.6, x: `${r.x}%` }}
                        animate={{ opacity: 0, y: -40, scale: 1.6, x: `${r.x + (Math.random() * 10 - 5)}%` }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="absolute text-4xl select-none filter drop-shadow-md"
                      >
                        {r.emoji}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {selectedLesson.content && (
                <Card className="rounded-3xl border-slate-200 p-8 shadow-sm bg-white">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 font-heading border-b border-slate-100 pb-3 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-brand-600" />
                    Lesson Reference Notes
                  </h3>
                  <div 
                    className="prose prose-slate max-w-none prose-p:text-slate-600 prose-p:leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: selectedLesson.content }}
                  />
                </Card>
              )}
            </div>

            {/* Docked Live Chat Sidebar in Live Classroom Mode */}
            {isLiveClassMode && (
              <div className="lg:col-span-4 h-[580px] sticky top-24">
                <LiveChat 
                  lessonId={selectedLesson.id}
                  courseInstructorId={course?.instructor_id}
                  isLive={selectedLesson.is_live || selectedLesson.live_status === 'live'}
                  liveStatus={selectedLesson.live_status}
                  onSendReaction={handleLocalReaction}
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* PW / Byju's Interactive Learning Tabs */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('curriculum')}
            className={`flex items-center gap-2 pb-4 px-4 font-bold text-sm sm:text-base border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'curriculum'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Curriculum ({totalLessons})
          </button>
          <button
            onClick={() => setActiveTab('livechat')}
            className={`flex items-center gap-2 pb-4 px-4 font-bold text-sm sm:text-base border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'livechat'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Radio className="h-4 w-4 text-red-500" />
            Live Chat
          </button>
          <button
            onClick={() => setActiveTab('doubts')}
            className={`flex items-center gap-2 pb-4 px-4 font-bold text-sm sm:text-base border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'doubts'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Doubt Resolution & Q&A ({doubts.length})
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 pb-4 px-4 font-bold text-sm sm:text-base border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'notes'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <StickyNote className="h-4 w-4" />
            My Notes ({notes.length})
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex items-center gap-2 pb-4 px-4 font-bold text-sm sm:text-base border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'announcements'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="h-4 w-4" />
            Batches & Notice Board ({announcements.length})
          </button>
          <button
            onClick={() => setActiveTab('codelab')}
            className={`flex items-center gap-2 pb-4 px-4 font-bold text-sm sm:text-base border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'codelab'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="h-4 w-4" />
            Code Lab & IDE
          </button>
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-2 pb-4 px-4 font-bold text-sm sm:text-base border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'flashcards'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Brain className="h-4 w-4" />
            Active Recall (SM-2)
          </button>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            
            {/* TAB 1: CURRICULUM */}
            {activeTab === 'curriculum' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900 font-heading">Course Modules</h3>
                  {isEnrolled && (
                    <span className="text-sm font-bold text-slate-500">
                      {completedCount} of {totalLessons} Completed ({totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0}%)
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {course.lessons?.map((lesson: any, index: number) => {
                    const isCompleted = progress[lesson.id];
                    const isSelected = selectedLesson?.id === lesson.id;
                    const playable = isLessonPlayable(index);

                    return (
                      <div
                        key={lesson.id}
                        className={`group flex items-center gap-4 p-4 sm:p-5 rounded-2xl border transition-all ${
                          isSelected
                            ? 'bg-brand-50/50 border-brand-300 ring-2 ring-brand-500/10'
                            : playable
                              ? 'bg-white border-slate-200 hover:border-brand-200 hover:shadow-sm'
                              : 'bg-slate-50 border-slate-100 opacity-80'
                        }`}
                      >
                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-600'
                            : isSelected
                              ? 'bg-brand-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                        }`}>
                          {index + 1}
                        </div>

                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => {
                            if (playable) setSelectedLesson(lesson);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <h4 className={`font-bold text-base truncate transition-colors ${
                              isSelected ? 'text-brand-600' : 'text-slate-800 group-hover:text-brand-600'
                            }`}>
                              {lesson.title}
                            </h4>
                            {!isEnrolled && index === 0 && (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                                Free Preview
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 font-medium">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(lesson.duration)}
                            </span>
                            {!playable && (
                              <span className="flex items-center gap-1 text-slate-400">
                                <Lock className="h-3 w-3" />
                                Locked (Enroll to access)
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {playable ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedLesson(lesson)}
                                className={`rounded-xl font-bold ${
                                  isSelected ? 'bg-brand-600 text-white hover:bg-brand-700' : 'text-brand-600 hover:bg-brand-50'
                                }`}
                              >
                                <PlayCircle className="h-5 w-5 mr-1" />
                                {isSelected ? 'Playing' : 'Play'}
                              </Button>
                              {isEnrolled && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleLesson(lesson.id)}
                                  className={`rounded-xl transition-all ${
                                    isCompleted ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300 hover:text-brand-500 hover:bg-brand-50'
                                  }`}
                                  title={isCompleted ? 'Completed' : 'Mark Complete (+15 XP)'}
                                >
                                  <CheckCircle className="h-5 w-5" />
                                </Button>
                              )}
                            </>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              disabled 
                              className="rounded-xl text-slate-400"
                            >
                              <Lock className="h-4 w-4 mr-1" />
                              Locked
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: DOUBT RESOLUTION & Q&A FORUM */}
            {activeTab === 'doubts' && (
              <div className="space-y-6">
                <Card className="rounded-3xl border-slate-200 p-6 bg-white shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-brand-600" />
                      Ask a Doubt / Question
                    </h3>
                    <Badge className="bg-brand-50 text-brand-600 border-none">
                      <Bot className="h-3 w-3 mr-1" />
                      Instant AI Mentor Support
                    </Badge>
                  </div>
                  <form onSubmit={handleCreateDoubt} className="space-y-3">
                    <Input 
                      placeholder="Title: e.g. Why use Kafka over RabbitMQ for this service?"
                      value={newDoubtTitle}
                      onChange={(e) => setNewDoubtTitle(e.target.value)}
                      className="rounded-xl border-slate-200 h-11"
                      required
                    />
                    <textarea 
                      placeholder="Describe your question or doubt in detail. Our instructor and AI mentor will resolve it."
                      value={newDoubtQuestion}
                      onChange={(e) => setNewDoubtQuestion(e.target.value)}
                      className="w-full min-h-[90px] p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                      required
                    />
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={isPostingDoubt}
                        className="rounded-xl bg-brand-600 hover:bg-brand-700 font-bold"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {isPostingDoubt ? 'Submitting...' : 'Post Doubt'}
                      </Button>
                    </div>
                  </form>
                </Card>

                <div className="space-y-4">
                  {doubts.map((doubt) => (
                    <Card key={doubt.id} className="rounded-3xl border-slate-200 p-6 bg-white shadow-sm space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                            {doubt.author?.name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                              {doubt.author?.name}
                              {doubt.author?.role === 'instructor' && (
                                <Badge className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0 border-none font-bold">
                                  Instructor
                                </Badge>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {new Date(doubt.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpvoteDoubt(doubt.id)}
                            className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 hover:bg-brand-50 text-slate-600 hover:text-brand-600 rounded-xl border border-slate-200 text-xs font-bold transition-all"
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                            <span>{doubt.upvotes || 0}</span>
                          </button>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{doubt.title}</h4>
                        <p className="text-slate-600 text-sm mt-1 leading-relaxed">{doubt.question}</p>
                      </div>

                      {/* Replies */}
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        {doubt.replies?.map((rep: any) => (
                          <div 
                            key={rep.id} 
                            className={`p-4 rounded-2xl text-sm leading-relaxed ${
                              rep.is_ai_reply 
                                ? 'bg-gradient-to-r from-brand-50/60 to-indigo-50/60 border border-brand-100 text-slate-800'
                                : rep.is_instructor_reply
                                  ? 'bg-amber-50/60 border border-amber-100 text-slate-800'
                                  : 'bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 font-bold text-xs mb-1.5">
                              {rep.is_ai_reply ? (
                                <span className="flex items-center gap-1 text-brand-600 font-bold">
                                  <Bot className="h-3.5 w-3.5" />
                                  EduVision AI Mentor
                                </span>
                              ) : rep.is_instructor_reply ? (
                                <span className="text-amber-700 font-bold">
                                  👨‍🏫 Instructor Answer ({rep.author?.name})
                                </span>
                              ) : (
                                <span className="text-slate-600">
                                  {rep.author?.name || 'Peer'}
                                </span>
                              )}
                            </div>
                            <p className="whitespace-pre-wrap">{rep.reply}</p>
                          </div>
                        ))}

                        {/* Reply input */}
                        <div className="flex gap-2 pt-2">
                          <Input 
                            placeholder="Add your answer or clarification..."
                            value={replyInput[doubt.id] || ''}
                            onChange={(e) => setReplyInput({ ...replyInput, [doubt.id]: e.target.value })}
                            className="h-10 text-xs rounded-xl border-slate-200"
                            onKeyDown={(e) => e.key === 'Enter' && handleReplyDoubt(doubt.id)}
                          />
                          <Button 
                            size="sm"
                            onClick={() => handleReplyDoubt(doubt.id)}
                            className="rounded-xl bg-slate-900 hover:bg-slate-800 font-bold h-10 px-4"
                          >
                            Reply
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {doubts.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8 space-y-2">
                      <MessageSquare className="h-10 w-10 text-slate-300 mx-auto" />
                      <h4 className="font-bold text-slate-700">No doubts posted yet</h4>
                      <p className="text-xs text-slate-400">Be the first student to ask a question! Our instructor & AI mentor answer in minutes.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: NOTES & BOOKMARKS */}
            {activeTab === 'notes' && (
              <div className="space-y-6">
                <Card className="rounded-3xl border-slate-200 p-6 bg-white shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
                      <StickyNote className="h-5 w-5 text-brand-600" />
                      Take Notes for: {selectedLesson?.title || 'This Module'}
                    </h3>
                  </div>
                  <form onSubmit={handleSaveNote} className="space-y-3">
                    <textarea 
                      placeholder="Write your key concept summary, code snippets, or revision points..."
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      className="w-full min-h-[90px] p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
                      required
                    />
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={isSavingNote}
                        className="rounded-xl bg-brand-600 hover:bg-brand-700 font-bold"
                      >
                        <Bookmark className="h-4 w-4 mr-2" />
                        {isSavingNote ? 'Saving...' : 'Save Note'}
                      </Button>
                    </div>
                  </form>
                </Card>

                <div className="space-y-3">
                  {notes.map((note) => (
                    <Card key={note.id} className="rounded-2xl border-slate-200 p-5 bg-white shadow-sm flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-brand-600">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Saved note</span>
                        </div>
                        <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                          {note.content}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-slate-400 hover:text-red-500 rounded-xl"
                      >
                        Delete
                      </Button>
                    </Card>
                  ))}

                  {notes.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8 space-y-2">
                      <StickyNote className="h-10 w-10 text-slate-300 mx-auto" />
                      <h4 className="font-bold text-slate-700">No notes saved for this lesson</h4>
                      <p className="text-xs text-slate-400">Jot down insights above to build your personal revision cheat sheet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: ANNOUNCEMENTS & BATCHES */}
            {activeTab === 'announcements' && (
              <div className="space-y-4">
                {announcements.map((ann) => (
                  <Card key={ann.id} className="rounded-3xl border-slate-200 p-6 bg-white shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className={
                        ann.priority === 'urgent' 
                          ? 'bg-rose-50 text-rose-600 border-rose-200 font-bold'
                          : 'bg-indigo-50 text-indigo-600 border-indigo-200 font-bold'
                      }>
                        <Bell className="h-3.5 w-3.5 mr-1" />
                        {ann.priority.toUpperCase()} NOTICE
                      </Badge>
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(ann.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 font-heading">{ann.title}</h4>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                    <div className="pt-2 text-xs font-bold text-slate-500">
                      Posted by: {ann.author?.name || 'Course Faculty'}
                    </div>
                  </Card>
                ))}

                {announcements.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8 space-y-2">
                    <Bell className="h-10 w-10 text-slate-300 mx-auto" />
                    <h4 className="font-bold text-slate-700">No announcements yet</h4>
                    <p className="text-xs text-slate-400">Batch schedules and live class notices will be published here.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: INTERACTIVE CODE LAB */}
            {activeTab === 'codelab' && (
              <div className="space-y-4">
                <CodeLab courseTopic={course?.title} />
              </div>
            )}

            {/* TAB 6: SPACED REPETITION FLASHCARDS (SM-2) */}
            {activeTab === 'flashcards' && (
              <div className="space-y-4">
                <FlashcardDeck courseId={course?.id} />
              </div>
            )}

            {/* TAB 7: LIVE CHAT */}
            {activeTab === 'livechat' && (
              <div className="space-y-4">
                {selectedLesson ? (
                  <div className="h-[580px] rounded-3xl overflow-hidden shadow-md">
                    <LiveChat 
                      lessonId={selectedLesson.id}
                      courseInstructorId={course?.instructor_id}
                      isLive={selectedLesson.is_live || selectedLesson.live_status === 'live'}
                      liveStatus={selectedLesson.live_status}
                      onSendReaction={handleLocalReaction}
                    />
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8 space-y-2">
                    <Radio className="h-10 w-10 text-slate-300 mx-auto" />
                    <h4 className="font-bold text-slate-700">Select a lesson above to join Live Chat</h4>
                    <p className="text-xs text-slate-400">Live comments and reactions sync directly with the active video lesson.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* AI Insights Card */}
            <Card className="rounded-[2.5rem] border-slate-200 p-6 bg-gradient-to-br from-brand-600 to-indigo-700 text-white shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                  <BrainCircuit className="h-5 w-5 text-white" />
                </div>
                <Badge className="bg-white/20 text-white border-none text-[10px] font-bold">
                  Gemini Powered
                </Badge>
              </div>
              <div>
                <h3 className="text-xl font-bold font-heading">AI Course Insights</h3>
                <p className="text-xs text-indigo-100 mt-1 leading-relaxed">
                  Generate instant syllabus summaries, key takeaways, and revision points.
                </p>
              </div>
              <Button
                onClick={handleGenerateSummary}
                disabled={generatingSummary}
                className="w-full h-11 bg-white text-brand-700 hover:bg-slate-100 rounded-xl font-bold text-sm shadow-md"
              >
                {generatingSummary ? 'Analyzing...' : 'Generate AI Summary'}
              </Button>

              {aiSummary && (
                <div className="mt-4 p-4 bg-white/10 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap backdrop-blur-sm border border-white/10 max-h-60 overflow-y-auto">
                  {aiSummary}
                </div>
              )}
            </Card>

            {/* Quizzes & Practice Tests */}
            <Card className="rounded-[2rem] border-slate-200 shadow-sm overflow-hidden bg-white">
              <div className="bg-slate-900 p-6 text-white space-y-2">
                <Trophy className="h-8 w-8 text-amber-400" />
                <h3 className="text-xl font-bold font-heading">Interactive Quizzes</h3>
                <p className="text-xs text-slate-300">
                  Assess understanding, earn XP points, and qualify for certification.
                </p>
              </div>
              <CardContent className="p-6 space-y-3">
                {isEnrolled && quizzes.length > 0 ? (
                  quizzes.map((quiz) => (
                    <Link key={quiz.id} to={`/quiz/${quiz.id}`} className="block">
                      <Button className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 font-bold flex items-center justify-between px-4">
                        <span className="truncate max-w-[200px]">{quiz.title}</span>
                        <ChevronRight className="h-4 w-4 flex-shrink-0" />
                      </Button>
                    </Link>
                  ))
                ) : (
                  <Button disabled className="w-full h-12 rounded-xl bg-slate-100 text-slate-400 font-bold">
                    {isEnrolled ? 'No Quizzes Available Yet' : 'Enroll to Unlock Quizzes'}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Instructor Profile Card */}
            <Card className="rounded-[2rem] border-slate-200 shadow-sm p-6 space-y-4 bg-white">
              <h3 className="text-base font-bold text-slate-900 font-heading">Course Faculty</h3>
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 text-xl font-bold overflow-hidden">
                  {course.instructor?.avatar_url ? (
                    <img src={course.instructor.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    course.instructor?.name?.charAt(0) || 'I'
                  )}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{course.instructor?.name}</div>
                  <div className="text-xs text-brand-600 font-bold">Senior Academic Faculty</div>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {course.instructor?.bio || 'Dedicated educator committed to engineering excellence, deep conceptual clarity, and industry-standard software engineering excellence.'}
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Floating AI Assistant for enrolled learners */}
      {isEnrolled && (
        <AIAssistant context={`Course: ${course.title}. Description: ${course.description}. Current Lesson: ${selectedLesson?.title || ''}. Content: ${selectedLesson?.content || ''}`} />
      )}

      {/* Payment & Checkout Modal */}
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        course={{ id: parseInt(id!), title: course.title, price: course.price || 2499 }}
        onSuccess={() => {
          setIsEnrolled(true);
          fetchData();
        }}
      />

      {/* Certificate Modal */}
      <CertificateModal
        isOpen={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
        userName={user?.name || 'Student'}
        courseTitle={course.title}
        date={new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      />
    </div>
  );
}
