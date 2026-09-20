import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Video, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Layout, 
  Users, 
  Settings, 
  PlusCircle, 
  Sparkles, 
  TrendingUp, 
  BrainCircuit, 
  BarChart3, 
  Activity, 
  DollarSign, 
  ExternalLink, 
  Play, 
  Trash2,
  Edit2,
  Save,
  Upload, 
  FileVideo,
  Radio 
} from 'lucide-react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { generateQuizQuestions } from '../lib/gemini';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import VideoPlayer from '../components/VideoPlayer';

const CATEGORIES = [
  'System Design & Architecture',
  'Web Development',
  'Data Structures & Algorithms',
  'AI & Machine Learning',
  'Cloud & DevOps',
  'Mobile App Development'
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

export default function InstructorDashboard() {
  const { user, updateUser } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCourse, setNewCourse] = useState({ 
    title: '', 
    description: '', 
    price: '', 
    category: 'System Design & Architecture', 
    level: 'Intermediate',
    thumbnail_url: '' 
  });
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [previewLesson, setPreviewLesson] = useState<any>(null);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [newLesson, setNewLesson] = useState({ 
    title: '', 
    content: '', 
    video_url: '', 
    embed_code: '', 
    duration: '',
    is_live: false,
    live_status: 'ended'
  });
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [payoutData, setPayoutData] = useState({
    account_holder_name: user?.account_holder_name || '',
    bank_account_no: user?.bank_account_no || '',
    ifsc_code: user?.ifsc_code || '',
  });
  const [isUpdatingPayout, setIsUpdatingPayout] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchAnalytics();

    // Real-time synchronization for course updates
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const { event: eventName } = JSON.parse(event.data);
        if (['COURSE_APPROVED', 'COURSE_DELETED', 'COURSE_CREATED', 'COURSE_UPDATED'].includes(eventName)) {
          fetchCourses();
          fetchAnalytics();
        }
      } catch (err) {
        console.error('WebSocket sync error:', err);
      }
    };

    return () => socket.close();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [analyticsData, revenueData] = await Promise.all([
        api.get('/courses/analytics'),
        api.get('/payments/revenue')
      ]);
      setAnalytics(analyticsData);
      setRevenue(revenueData);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  const fetchCourses = () => {
    api.get('/courses/instructor')
      .then(setCourses)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/courses', { 
        ...newCourse, 
        price: parseFloat(newCourse.price) || 0 
      });
      setNewCourse({ 
        title: '', 
        description: '', 
        price: '', 
        category: 'System Design & Architecture', 
        level: 'Intermediate',
        thumbnail_url: '' 
      });
      fetchCourses();
    } catch (err) {
      console.error(err);
      alert('Failed to create course');
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    try {
      await api.put(`/courses/${editingCourse.id}`, {
        title: editingCourse.title,
        description: editingCourse.description,
        price: parseFloat(editingCourse.price) || 0,
        category: editingCourse.category,
        level: editingCourse.level,
        thumbnail_url: editingCourse.thumbnail_url
      });
      setEditingCourse(null);
      fetchCourses();
    } catch (err) {
      console.error(err);
      alert('Failed to update course');
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
    try {
      await api.delete(`/courses/${courseId}`);
      setEditingCourse(null);
      fetchCourses();
    } catch (err) {
      console.error(err);
      alert('Failed to delete course');
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/courses/${selectedCourse.id}/lessons`, newLesson);
      setNewLesson({ title: '', content: '', video_url: '', embed_code: '', duration: '', is_live: false, live_status: 'ended' });
      fetchCourses();
      // Refresh current selectedCourse modal view
      const updated = await api.get(`/courses/${selectedCourse.id}`);
      setSelectedCourse(updated);
    } catch (err) {
      console.error(err);
      alert('Failed to add lesson');
    }
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson || !selectedCourse) return;
    try {
      await api.put(`/courses/${selectedCourse.id}/lessons/${editingLesson.id}`, editingLesson);
      setEditingLesson(null);
      fetchCourses();
      const updated = await api.get(`/courses/${selectedCourse.id}`);
      setSelectedCourse(updated);
    } catch (err) {
      console.error(err);
      alert('Failed to update lesson');
    }
  };

  const handleDeleteLesson = async (courseId: number, lessonId: number) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;
    try {
      await api.delete(`/courses/${courseId}/lessons/${lessonId}`);
      fetchCourses();
      if (selectedCourse && selectedCourse.id === courseId) {
        setSelectedCourse({
          ...selectedCourse,
          lessons: (selectedCourse.lessons || []).filter((l: any) => l.id !== lessonId)
        });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete lesson");
    }
  };

  const calculateTotalDuration = (lessons: any[]) => {
    if (!lessons || lessons.length === 0) return '0m';
    let totalSeconds = 0;
    lessons.forEach(lesson => {
      const duration = lesson.duration || '0:00';
      const parts = duration.split(':').map(Number);
      if (parts.length === 2) {
        totalSeconds += parts[0] * 60 + parts[1];
      } else if (parts.length === 3) {
        totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
    });

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    let result = '';
    if (h > 0) result += `${h}h `;
    if (m > 0) result += `${m}m `;
    if (s > 0) result += `${s}s`;
    return result.trim() || '0m';
  };

  const formatDuration = (duration: string) => {
    if (!duration) return '0m 0s';
    const parts = duration.split(':').map(Number);
    if (parts.length === 2) {
      return `${parts[0]}m ${parts[1]}s`;
    } else if (parts.length === 3) {
      return `${parts[0]}h ${parts[1]}m ${parts[2]}s`;
    }
    return duration;
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await api.post('/uploads/video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (editingLesson) {
        setEditingLesson({ ...editingLesson, video_url: response.videoUrl });
      } else {
        setNewLesson({ ...newLesson, video_url: response.videoUrl });
      }
    } catch (err) {
      console.error(err);
      alert('Video upload failed');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleGenerateAIQuiz = async (course: any) => {
    if (!course.lessons || course.lessons.length === 0) {
      alert("Add at least one lesson first!");
      return;
    }
    
    setIsGeneratingQuiz(true);
    try {
      const lesson = course.lessons[0];
      const questions = await generateQuizQuestions(lesson.title, lesson.content || "General course content");
      
      await api.post('/quizzes', { 
        course_id: course.id, 
        title: `AI Quiz: ${lesson.title}`,
        questions: questions.map((q: any) => ({
          question: q.question,
          options: q.options,
          answer: q.correctAnswer
        }))
      });
      
      alert("AI Quiz Generated and Saved Successfully!");
      fetchCourses();
    } catch (err: any) {
      console.error(err);
      alert(`Failed to generate AI quiz: ${err.message || "Unknown error"}`);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleUpdatePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPayout(true);
    try {
      const updatedUser = await api.put('/users/profile', payoutData);
      updateUser(updatedUser);
      alert("Payout settings updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update payout settings");
    } finally {
      setIsUpdatingPayout(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent"></div>
      <p className="text-slate-500 font-medium">Loading instructor workspace...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 bg-vibrant-mesh min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-50 text-brand-700 mb-2">
            <Sparkles className="h-3.5 w-3.5" /> Instructor Teaching Studio
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 font-heading tracking-tight">
            Instructor Hub
          </h1>
          <p className="text-slate-500 mt-1 text-base font-medium">
            Manage your courses, curriculum, student engagements, and revenue.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/analytics">
            <Button variant="outline" className="rounded-xl border-slate-200 hover:bg-slate-50 font-bold h-12 px-5">
              <BarChart3 className="h-4 w-4 mr-2" />
              Full Analytics
            </Button>
          </Link>
          <Dialog>
            <DialogTrigger>
              <Button variant="outline" className="rounded-xl border-slate-200 hover:bg-slate-50 font-bold h-12 px-5">
                <DollarSign className="h-4 w-4 mr-2" />
                Payout Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
              <div className="bg-brand-600 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <DialogHeader className="relative z-10">
                  <DialogTitle className="text-2xl font-black font-heading tracking-tight">Payout Settings</DialogTitle>
                  <p className="text-brand-100 font-medium">Where should we send your earnings?</p>
                </DialogHeader>
              </div>
              <form onSubmit={handleUpdatePayout} className="p-8 space-y-4 bg-white">
                <div className="space-y-2">
                  <Label htmlFor="holder" className="text-xs font-bold uppercase tracking-wider text-slate-500">Account Holder Name</Label>
                  <Input 
                    id="holder" 
                    placeholder="Enter full name" 
                    className="h-12 rounded-xl border-slate-200"
                    value={payoutData.account_holder_name}
                    onChange={(e) => setPayoutData({...payoutData, account_holder_name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accNo" className="text-xs font-bold uppercase tracking-wider text-slate-500">Bank Account Number</Label>
                  <Input 
                    id="accNo" 
                    placeholder="Enter account number" 
                    className="h-12 rounded-xl border-slate-200"
                    value={payoutData.bank_account_no}
                    onChange={(e) => setPayoutData({...payoutData, bank_account_no: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifsc" className="text-xs font-bold uppercase tracking-wider text-slate-500">IFSC Code</Label>
                  <Input 
                    id="ifsc" 
                    placeholder="e.g. HDFC0001234" 
                    className="h-12 rounded-xl border-slate-200"
                    value={payoutData.ifsc_code}
                    onChange={(e) => setPayoutData({...payoutData, ifsc_code: e.target.value.toUpperCase()})}
                    required
                  />
                </div>
                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100 text-[10px] text-amber-700 font-medium">
                  <Activity className="h-4 w-4" />
                  Payments are settled within 7 business days of request.
                </div>
                <Button 
                  type="submit" 
                  disabled={isUpdatingPayout}
                  className="w-full h-12 bg-brand-600 hover:bg-brand-700 rounded-xl font-bold shadow-lg shadow-brand-100"
                >
                  {isUpdatingPayout ? "Saving..." : "Save Payout Settings"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Create Course Dialog */}
          <Dialog>
            <DialogTrigger>
              <Button className="bg-brand-600 hover:bg-brand-700 rounded-xl h-12 px-6 shadow-lg shadow-brand-200 font-bold">
                <Plus className="h-4 w-4 mr-2" />
                Create New Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
              <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl" />
                <DialogHeader className="relative z-10">
                  <DialogTitle className="text-3xl font-black font-heading tracking-tight">Create New Course</DialogTitle>
                  <p className="text-slate-400 font-medium">Share your knowledge with the world.</p>
                </DialogHeader>
              </div>
              <form onSubmit={handleCreateCourse} className="p-8 space-y-6 bg-white max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="title" className="text-sm font-bold text-slate-700">Course Title</Label>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{newCourse.title.length}/100</span>
                  </div>
                  <Input 
                    id="title" 
                    placeholder="e.g. Masterclass in Scalable System Design"
                    className="h-14 rounded-2xl border-slate-200 focus:ring-brand-500 text-lg font-medium"
                    value={newCourse.title} 
                    onChange={(e) => setNewCourse({...newCourse, title: e.target.value.slice(0, 100)})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="description" className="text-sm font-bold text-slate-700">Description</Label>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{newCourse.description.length}/500</span>
                  </div>
                  <textarea 
                    id="description"
                    placeholder="What will students master in this course?"
                    className="w-full min-h-[120px] p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none transition-all leading-relaxed"
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({...newCourse, description: e.target.value.slice(0, 500)})}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-bold text-slate-700">Price (INR)</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                      <Input 
                        id="price" 
                        type="number"
                        placeholder="0 for free"
                        className="h-12 pl-8 rounded-xl border-slate-200 focus:ring-brand-500 font-bold"
                        value={newCourse.price} 
                        onChange={(e) => setNewCourse({...newCourse, price: e.target.value})} 
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700">Category</Label>
                    <select 
                      className="w-full h-12 px-3 rounded-xl border border-slate-200 bg-white font-medium text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                      value={newCourse.category}
                      onChange={(e) => setNewCourse({...newCourse, category: e.target.value})}
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700">Level</Label>
                    <select 
                      className="w-full h-12 px-3 rounded-xl border border-slate-200 bg-white font-medium text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                      value={newCourse.level}
                      onChange={(e) => setNewCourse({...newCourse, level: e.target.value})}
                    >
                      {LEVELS.map(lvl => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thumbnail" className="text-sm font-bold text-slate-700">Thumbnail Image URL (Optional)</Label>
                  <Input 
                    id="thumbnail"
                    placeholder="https://images.unsplash.com/..." 
                    className="h-12 rounded-xl border-slate-200"
                    value={newCourse.thumbnail_url}
                    onChange={(e) => setNewCourse({...newCourse, thumbnail_url: e.target.value})}
                  />
                </div>
                <div className="pt-2">
                  <Button type="submit" className="w-full h-14 bg-brand-600 hover:bg-brand-700 rounded-2xl font-black text-lg shadow-xl shadow-brand-100 transition-all">
                    Launch Course
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Stats & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-3xl border-slate-200 shadow-sm p-6 flex items-center gap-4 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all">
              <div className="h-12 w-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center">
                <Layout className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">{courses.length}</div>
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Courses</div>
              </div>
            </Card>
            <Card className="rounded-3xl border-slate-200 shadow-sm p-6 flex items-center gap-4 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all">
              <div className="h-12 w-12 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">{analytics?.totalUniqueStudents || 0}</div>
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Students</div>
              </div>
            </Card>
            <Card className="rounded-3xl border-slate-200 shadow-sm p-6 flex items-center gap-4 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all">
              <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">
                  {analytics?.totalEnrollments > 0 
                    ? Math.round((analytics.totalCompletions / analytics.totalEnrollments) * 100) 
                    : 0}%
                </div>
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Completion Rate</div>
              </div>
            </Card>
          </div>

          <Card className="rounded-[2.5rem] border-slate-200 p-8 bg-white">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-heading">Enrollment Growth</h3>
                <p className="text-slate-500 text-sm">Weekly student acquisition trend</p>
              </div>
              <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-1 font-bold">
                <TrendingUp className="h-3 w-3 mr-1" />
                Active Enrollments
              </Badge>
            </div>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.timeSeriesData || []}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="students" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorStudents)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card className="rounded-[2.5rem] border-none p-8 bg-slate-900 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl" />
          <div className="space-y-6 relative z-10">
            <div className="h-14 w-14 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <BrainCircuit className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold font-heading">AI Power-Up</h3>
              <p className="text-slate-400 leading-relaxed font-medium text-sm">
                Generate automatic quizzes, lesson summaries, and intelligent doubt resolution using our integrated Gemini AI Mentor engine.
              </p>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>AI Engine</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                Active
              </span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 w-full" />
            </div>
          </div>
        </Card>
      </div>

      {/* Courses List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 font-heading">My Courses ({courses.length})</h2>
        <div className="grid grid-cols-1 gap-6">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="rounded-[2rem] border-slate-200 overflow-hidden group hover:border-brand-300 transition-all bg-white shadow-sm">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-64 h-48 bg-slate-100 relative overflow-hidden flex-shrink-0">
                      <img 
                        src={course.thumbnail_url || `https://picsum.photos/seed/${course.id}/600/400`} 
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                        {course.is_approved ? (
                          <Badge className="bg-emerald-500 text-white border-none shadow-md font-bold text-xs">
                            Approved
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500 text-white border-none shadow-md font-bold text-xs">
                            Pending Review
                          </Badge>
                        )}
                        <Badge className="bg-black/60 backdrop-blur text-white border-none text-[10px] font-bold">
                          {course.category || 'General'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex-1 p-8 flex flex-col justify-between min-w-0">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-4">
                          <Link to={`/course/${course.id}`} className="group/title flex-1">
                            <h3 className="text-2xl font-black text-slate-900 group-hover/title:text-brand-600 transition-colors font-heading leading-tight flex items-center gap-2">
                              {course.title}
                              <ExternalLink className="h-4 w-4 opacity-0 group-hover/title:opacity-100 transition-opacity flex-shrink-0" />
                            </h3>
                          </Link>
                          {/* Course Settings / Edit Button */}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setEditingCourse({ ...course })}
                            className="rounded-xl border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 text-slate-700 font-bold"
                          >
                            <Settings className="h-4 w-4 text-brand-600" />
                            <span>Edit Course</span>
                          </Button>
                        </div>
                        <p className="text-slate-500 line-clamp-2 leading-relaxed text-sm font-medium">
                          {course.description}
                        </p>
                      </div>

                      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-100">
                        <div className="flex flex-wrap items-center gap-5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <Video className="h-4 w-4 text-brand-500" />
                            {course.lessons?.length || 0} Lessons ({calculateTotalDuration(course.lessons)})
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <Users className="h-4 w-4 text-brand-500" />
                            {analytics?.courseStats?.find((s: any) => s.id === course.id)?.students || 0} Enrolled
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <DollarSign className="h-4 w-4 text-emerald-500" />
                            {course.price > 0 ? `₹${course.price}` : 'Free'}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Button 
                            variant="outline" 
                            className="rounded-xl border-slate-200 hover:bg-slate-50 font-bold"
                            onClick={() => setSelectedCourse(course)}
                          >
                            <PlusCircle className="h-4 w-4 mr-2 text-brand-600" />
                            Manage Lessons ({course.lessons?.length || 0})
                          </Button>
                          <Button 
                            className="rounded-xl bg-slate-900 hover:bg-slate-800 font-bold flex items-center gap-2 text-white"
                            onClick={() => handleGenerateAIQuiz(course)}
                            disabled={isGeneratingQuiz}
                          >
                            {isGeneratingQuiz ? (
                              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                            AI Quiz
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {courses.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-8">
              <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-600 font-bold text-lg">No courses published yet.</p>
              <p className="text-slate-400 text-sm mt-1">Start by clicking the "Create New Course" button above.</p>
            </div>
          )}
        </div>
      </div>

      {/* Course Edit Dialog */}
      <Dialog open={!!editingCourse} onOpenChange={() => setEditingCourse(null)}>
        <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
          <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl" />
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-3xl font-black font-heading tracking-tight">
                Edit Course Settings
              </DialogTitle>
              <p className="text-slate-400 font-medium">Update details or manage visibility for this masterclass.</p>
            </DialogHeader>
          </div>
          {editingCourse && (
            <form onSubmit={handleUpdateCourse} className="p-8 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Course Title</Label>
                <Input 
                  value={editingCourse.title} 
                  onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                  className="h-12 rounded-xl border-slate-200 font-medium"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Description</Label>
                <textarea 
                  value={editingCourse.description} 
                  onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                  className="w-full min-h-[100px] p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Price (INR)</Label>
                  <Input 
                    type="number" 
                    value={editingCourse.price} 
                    onChange={(e) => setEditingCourse({ ...editingCourse, price: e.target.value })}
                    className="h-12 rounded-xl border-slate-200 font-medium"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Category</Label>
                  <select 
                    value={editingCourse.category || CATEGORIES[0]}
                    onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value })}
                    className="w-full h-12 px-3 rounded-xl border border-slate-200 bg-white font-medium text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Level</Label>
                  <select 
                    value={editingCourse.level || LEVELS[0]}
                    onChange={(e) => setEditingCourse({ ...editingCourse, level: e.target.value })}
                    className="w-full h-12 px-3 rounded-xl border border-slate-200 bg-white font-medium text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    {LEVELS.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Thumbnail Image URL</Label>
                <Input 
                  value={editingCourse.thumbnail_url || ''} 
                  onChange={(e) => setEditingCourse({ ...editingCourse, thumbnail_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="h-12 rounded-xl border-slate-200 font-medium"
                />
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <Button 
                  type="button" 
                  variant="destructive"
                  onClick={() => handleDeleteCourse(editingCourse.id)}
                  className="h-12 px-5 rounded-xl font-bold flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Course
                </Button>
                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditingCourse(null)}
                    className="h-12 px-5 rounded-xl border-slate-200 font-bold"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="h-12 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 font-bold text-white shadow-md shadow-brand-500/20 flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Manage Lessons Dialog */}
      <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
        <DialogContent className="max-w-3xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
          <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl" />
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-3xl font-black font-heading tracking-tight break-words">
                Curriculum: {selectedCourse?.title}
              </DialogTitle>
              <p className="text-slate-400 font-medium">Add, edit, or reorganize video lessons and study materials.</p>
            </DialogHeader>
          </div>
          
          <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
            {/* Existing Lessons List */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                Current Lessons ({selectedCourse?.lessons?.length || 0})
              </h4>
              {selectedCourse?.lessons?.map((l: any, i: number) => (
                <div key={l.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group/lesson hover:bg-white hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="h-8 w-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs font-black text-slate-500 flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm truncate">{l.title}</span>
                        {(l.is_live || l.live_status === 'live') && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500 text-white font-black text-[9px] uppercase tracking-wider animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                            Live Stream
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDuration(l.duration)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {(l.is_live || l.live_status === 'live') && (
                      <Link to={`/course/${selectedCourse.id}`}>
                        <Button 
                          size="sm" 
                          className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold h-8 px-3 text-xs gap-1 shadow-sm"
                        >
                          <Radio className="h-3.5 w-3.5 animate-pulse" />
                          Live Room
                        </Button>
                      </Link>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-brand-600 hover:bg-brand-50 rounded-xl font-bold h-8 px-3"
                      onClick={() => setPreviewLesson(l)}
                    >
                      <Play className="h-3.5 w-3.5 mr-1" />
                      Preview
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-slate-600 hover:bg-slate-100 rounded-xl font-bold h-8 px-3"
                      onClick={() => setEditingLesson({ ...l })}
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-rose-500 hover:bg-rose-50 rounded-xl font-bold h-8 px-2"
                      onClick={() => handleDeleteLesson(selectedCourse.id, l.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}

              {(!selectedCourse?.lessons || selectedCourse.lessons.length === 0) && (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Video className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm font-medium">No lessons added yet. Build your syllabus below.</p>
                </div>
              )}
            </div>

            {/* Edit Lesson Sub-Form */}
            {editingLesson ? (
              <form onSubmit={handleUpdateLesson} className="space-y-4 border-t border-slate-200 pt-6 bg-brand-50/40 p-6 rounded-2xl border">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-brand-800 flex items-center gap-2">
                    <Edit2 className="h-4 w-4 text-brand-600" />
                    Editing Lesson: {editingLesson.title}
                  </h4>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setEditingLesson(null)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-xs font-bold text-slate-700">Lesson Title</Label>
                    <Input 
                      value={editingLesson.title} 
                      onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                      className="h-10 rounded-xl border-slate-200 bg-white"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700">Duration</Label>
                    <Input 
                      value={editingLesson.duration} 
                      onChange={(e) => setEditingLesson({ ...editingLesson, duration: e.target.value })}
                      className="h-10 rounded-xl border-slate-200 bg-white"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Video URL</Label>
                  <Input 
                    value={editingLesson.video_url} 
                    onChange={(e) => setEditingLesson({ ...editingLesson, video_url: e.target.value })}
                    className="h-10 rounded-xl border-slate-200 bg-white text-xs font-mono"
                    placeholder="YouTube URL, YouTube Live link, or MP4 URL"
                  />
                </div>

                {/* Live Stream Configuration */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Radio className="h-4 w-4 text-red-500 animate-pulse" />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Live Streaming & Live Chat Mode</span>
                        <span className="text-[10px] text-slate-400">Enable real-time chat, reactions, and live viewer metrics</span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={editingLesson.is_live || false} 
                        onChange={(e) => setEditingLesson({ ...editingLesson, is_live: e.target.checked, live_status: e.target.checked ? 'live' : 'ended' })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>

                  {editingLesson.is_live && (
                    <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stream Status</Label>
                        <select 
                          value={editingLesson.live_status || 'live'} 
                          onChange={(e) => setEditingLesson({ ...editingLesson, live_status: e.target.value })}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs focus:ring-2 focus:ring-red-500 outline-none"
                        >
                          <option value="live">🔴 Live Now (Broadcasting)</option>
                          <option value="upcoming">⏳ Upcoming Live Stream</option>
                          <option value="ended">⏹️ Ended / Recorded Stream</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">YouTube Live Tip</Label>
                        <p className="text-[11px] text-slate-500 leading-tight pt-1">
                          Paste YouTube Live link (e.g. <code className="text-[10px] font-mono text-red-600">https://youtube.com/live/xxxx</code>) in Video URL.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Content / Summary</Label>
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <ReactQuill 
                      theme="snow" 
                      value={editingLesson.content || ''} 
                      onChange={(content) => setEditingLesson({ ...editingLesson, content })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEditingLesson(null)}
                    className="rounded-xl font-bold"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    size="sm" 
                    className="bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl px-5"
                  >
                    Update Lesson
                  </Button>
                </div>
              </form>
            ) : (
              /* Add New Lesson Form */
              <form onSubmit={handleAddLesson} className="space-y-6 border-t border-slate-100 pt-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
                    <PlusCircle className="h-5 w-5 text-brand-600" />
                    Add New Lesson
                  </h4>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">Lesson Title</Label>
                      <Input 
                        placeholder="e.g. Distributed Consensus & Raft Algorithm" 
                        className="h-11 rounded-xl border-slate-200 text-sm font-medium"
                        value={newLesson.title} 
                        onChange={(e) => setNewLesson({...newLesson, title: e.target.value})} 
                        required 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">Duration (e.g. 15:30)</Label>
                      <Input 
                        placeholder="15:30" 
                        className="h-11 rounded-xl border-slate-200 text-sm font-medium"
                        value={newLesson.duration} 
                        onChange={(e) => setNewLesson({...newLesson, duration: e.target.value})} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">Video Content</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Input 
                          type="file" 
                          accept="video/*" 
                          className="hidden" 
                          id="video-upload"
                          onChange={handleVideoUpload}
                          disabled={uploadingVideo}
                        />
                        <label 
                          htmlFor="video-upload"
                          className={`flex flex-col items-center justify-center gap-1.5 h-20 rounded-xl border-2 border-dashed border-slate-200 cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-all ${uploadingVideo ? 'opacity-50' : ''}`}
                        >
                          <Upload className="h-5 w-5 text-slate-400" />
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            {uploadingVideo ? 'Uploading...' : 'Upload Video File'}
                          </span>
                        </label>
                      </div>
                      <div>
                        <Input 
                          placeholder="Or paste YouTube URL, YouTube Live, or MP4 URL" 
                          className="h-20 rounded-xl border-slate-200 text-xs"
                          value={newLesson.video_url} 
                          onChange={(e) => setNewLesson({...newLesson, video_url: e.target.value})} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live Streaming Mode Toggle */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Radio className="h-4 w-4 text-red-500 animate-pulse" />
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Live Streaming & Live Chat Mode</span>
                          <span className="text-[10px] text-slate-500">Enable real-time chat, reactions, and live viewer metrics</span>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={newLesson.is_live} 
                          onChange={(e) => setNewLesson({ ...newLesson, is_live: e.target.checked, live_status: e.target.checked ? 'live' : 'ended' })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>

                    {newLesson.is_live && (
                      <div className="pt-2 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Stream Status</Label>
                          <select 
                            value={newLesson.live_status} 
                            onChange={(e) => setNewLesson({ ...newLesson, live_status: e.target.value })}
                            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-bold text-xs focus:ring-2 focus:ring-red-500 outline-none"
                          >
                            <option value="live">🔴 Live Now (Broadcasting)</option>
                            <option value="upcoming">⏳ Upcoming Live Stream</option>
                            <option value="ended">⏹️ Ended / Recorded Stream</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">YouTube Live Tip</Label>
                          <p className="text-[11px] text-slate-500 leading-tight pt-1">
                            Paste YouTube Live link (e.g. <code className="text-[10px] font-mono text-red-600">https://youtube.com/live/xxxx</code>) in the Video Content box above.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Lesson Material & Notes (Optional)</Label>
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <ReactQuill 
                        theme="snow" 
                        value={newLesson.content} 
                        onChange={(content) => setNewLesson({...newLesson, content})}
                        placeholder="Add code snippets, study links, or formulas..."
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-brand-600 hover:bg-brand-700 rounded-xl font-bold text-white shadow-md shadow-brand-200"
                  disabled={uploadingVideo}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Lesson to Course
                </Button>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Preview Modal */}
      <Dialog open={!!previewLesson} onOpenChange={() => setPreviewLesson(null)}>
        <DialogContent className="max-w-4xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-slate-900">
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-white font-heading truncate pr-8">
                Preview: {previewLesson?.title}
              </h3>
              <Button 
                variant="ghost" 
                onClick={() => setPreviewLesson(null)} 
                className="text-slate-400 hover:text-white hover:bg-white/10 rounded-xl"
              >
                Close
              </Button>
            </div>
            <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              {previewLesson && (
                <VideoPlayer 
                  url={previewLesson.video_url} 
                  embedCode={previewLesson.embed_code}
                  title={previewLesson.title} 
                />
              )}
            </div>
            {previewLesson?.content && (
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h4 className="text-slate-300 font-bold mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Lesson Content
                </h4>
                <div 
                  className="text-slate-400 text-sm prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewLesson.content }}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
