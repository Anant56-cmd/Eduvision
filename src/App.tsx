import { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, BookOpen, LayoutDashboard, User as UserIcon, Moon, Sun, Download, Flame, Zap, Compass, Terminal, Trophy, Activity } from 'lucide-react';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CourseDetails from './pages/CourseDetails';
import QuizView from './pages/QuizView';
import Analytics from './pages/Analytics';
import CoursesExplorer from './pages/CoursesExplorer';
import CodeLabPage from './pages/CodeLabPage';
import LeaderboardPage from './pages/LeaderboardPage';
import SystemHealthPage from './pages/SystemHealthPage';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('PWA: beforeinstallprompt event fired');
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA: User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
  };

  const toggleDarkMode = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 pt-[var(--sat)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-3 group">
              <img 
                src="/eduvision-icon.png" 
                alt="EduVision" 
                className="h-9 w-9 rounded-xl shadow-md object-cover border border-slate-100 group-hover:scale-105 transition-transform" 
              />
              <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-brand-600 to-violet-600 font-heading tracking-tight">
                EduVision
              </span>
            </Link>
            <Link to="/courses" className="hidden md:flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-brand-600 transition-colors">
              <Compass className="h-4 w-4" />
              <span>Explore</span>
            </Link>
            <Link to="/lab" className="hidden md:flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-brand-600 transition-colors">
              <Terminal className="h-4 w-4 text-brand-600" />
              <span>Code Lab</span>
            </Link>
            <Link to="/leaderboard" className="hidden md:flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-amber-600 transition-colors">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span>Leaderboard</span>
            </Link>
            <Link to="/system-health" className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100">
              <Activity className="h-3.5 w-3.5 text-emerald-500" />
              <span>Health</span>
            </Link>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link to="/courses" className="md:hidden">
              <Button variant="ghost" size="sm" className="px-2 font-bold text-slate-700 text-xs">
                Courses
              </Button>
            </Link>
            <Link to="/lab" className="md:hidden">
              <Button variant="ghost" size="sm" className="px-2 font-bold text-slate-700 text-xs">
                Lab
              </Button>
            </Link>

            {user && (
              <div className="flex items-center gap-2">
                <div 
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-full border border-amber-200/60 shadow-sm"
                  title="Your current study streak"
                >
                  <Flame className="h-4 w-4 text-amber-500 fill-amber-500 animate-pulse" />
                  <span className="text-xs font-black text-amber-700">{user.streak_count || 1}d</span>
                </div>
                <div 
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 rounded-full border border-indigo-200/60 shadow-sm"
                  title="Your earned learning experience"
                >
                  <Zap className="h-3.5 w-3.5 text-indigo-600 fill-indigo-600" />
                  <span className="text-xs font-black text-indigo-800">{user.xp_points || 100} XP</span>
                </div>
              </div>
            )}

            {deferredPrompt && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleInstall}
                className="hidden sm:flex items-center gap-2 border-brand-200 text-brand-600 hover:bg-brand-50"
              >
                <Download className="h-4 w-4" />
                Install App
              </Button>
            )}
            {deferredPrompt && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleInstall}
                className="sm:hidden h-9 w-9 border-brand-200 text-brand-600"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleDarkMode}
              className="rounded-xl text-slate-500 hover:text-brand-600 h-9 w-9 sm:h-10 sm:w-10"
            >
              {isDark ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
            </Button>

            {user ? (
              <div className="flex items-center space-x-2">
                <Link to={
                  user.role === 'admin' ? '/admin' : 
                  user.role === 'instructor' ? '/instructor' : '/dashboard'
                }>
                  <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                  <Button variant="ghost" size="icon" className="sm:hidden h-9 w-9">
                    <LayoutDashboard className="h-4 w-4" />
                  </Button>
                </Link>
                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full">
                  <UserIcon className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-900 capitalize">{user.role}</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout} className="hidden sm:flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
                <Button variant="outline" size="icon" onClick={handleLogout} className="sm:hidden h-9 w-9">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="px-2 sm:px-4">Login</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 px-2 sm:px-4">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  const { loading } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-[var(--sab)]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<CoursesExplorer />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/instructor" element={<InstructorDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/course/:id" element={<CourseDetails />} />
          <Route path="/quiz/:quizId" element={<QuizView />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/lab" element={<CodeLabPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/system-health" element={<SystemHealthPage />} />
        </Routes>
      </main>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-red-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Something went wrong</h2>
            <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-red-700 text-sm font-mono overflow-auto max-h-40 mb-6">
              {this.state.error?.message}
            </div>
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full bg-brand-600 hover:bg-brand-700"
            >
              Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}