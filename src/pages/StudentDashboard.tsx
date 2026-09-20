import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Trophy, 
  Clock, 
  ArrowRight, 
  CheckCircle, 
  Star, 
  Layout, 
  Sparkles, 
  Activity, 
  Flame, 
  Zap, 
  Play, 
  Compass, 
  Award,
  GraduationCap
} from 'lucide-react';
import { motion } from 'motion/react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<Record<number, any>>({});
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [courses, quizResults, activityData] = await Promise.all([
        api.get('/courses/enrolled'),
        api.get('/quizzes/results'),
        api.get('/users/student-activity')
      ]);
      
      setEnrolledCourses(courses);
      setResults(quizResults);
      setActivity(activityData);

      // Calculate progress from pre-fetched data
      const progressMap: Record<number, any> = {};
      courses.forEach((course: any) => {
        const totalLessons = course.lessons?.length || 0;
        const completedLessons = (course.progressRecords || []).filter((p: any) => p.completion_status).length;
        const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        
        progressMap[course.id] = {
          completed: completedLessons,
          total: totalLessons,
          percentage
        };
      });
      setProgressData(progressMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Real-time synchronization for students
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const { event: eventName } = JSON.parse(event.data);
        if (['COURSE_DELETED', 'COURSE_APPROVED', 'ANNOUNCEMENT_CREATED'].includes(eventName)) {
          fetchData();
        }
      } catch (err) {
        console.error('WebSocket student sync error:', err);
      }
    };

    return () => socket.close();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent"></div>
      <p className="text-slate-500 font-medium">Loading your student portal...</p>
    </div>
  );

  const averageScore = results.length > 0 
    ? Math.round(results.reduce((acc, r) => acc + r.score, 0) / results.length) 
    : 0;

  const overallProgress = enrolledCourses.length > 0
    ? Math.round(Object.values(progressData).reduce((acc, p) => acc + p.percentage, 0) / enrolledCourses.length)
    : 0;

  const xp = user?.xp_points || 0;
  const streak = user?.streak_count || 1;
  const currentLevel = Math.floor(xp / 100) + 1;
  const xpToNextLevel = 100 - (xp % 100);

  // Pick first active course to resume
  const firstActiveCourse = enrolledCourses.length > 0 ? enrolledCourses[0] : null;

  return (
    <div className="space-y-10 pb-20 max-w-7xl mx-auto">
      {/* Header with Welcome and Quick Actions */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-50 text-brand-700 mb-2">
            <Sparkles className="h-3.5 w-3.5" /> EduVision Verified Scholar
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-slate-500 text-base">
            Keep your learning momentum going today.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {firstActiveCourse && (
            <Link to={`/course/${firstActiveCourse.id}`}>
              <Button className="bg-brand-600 hover:bg-brand-700 text-white rounded-2xl h-12 px-6 shadow-lg shadow-brand-500/25 font-bold flex items-center gap-2">
                <Play className="h-4 w-4 fill-white" />
                Resume Learning
              </Button>
            </Link>
          )}
          <Link to="/courses">
            <Button variant="outline" className="rounded-2xl h-12 px-6 border-slate-200 font-bold hover:bg-slate-50 flex items-center gap-2 text-slate-700">
              <Compass className="h-4 w-4 text-brand-600" />
              Explore Catalog
            </Button>
          </Link>
        </div>
      </header>

      {/* Gamification & Streaks Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Daily Streak Card */}
        <Card className="rounded-3xl border-orange-100 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white shadow-sm overflow-hidden border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-2xl bg-orange-500/15 flex items-center justify-center text-orange-600">
                <Flame className="h-7 w-7 fill-orange-500" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-800">
                Daily Goal
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-slate-900 flex items-baseline gap-1.5">
                {streak} <span className="text-lg font-bold text-slate-500">Days</span>
              </div>
              <p className="text-xs font-semibold text-orange-700 mt-1">
                🔥 Active Learning Streak!
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Study daily to level up your streak multiplier.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* XP & Level Card */}
        <Card className="rounded-3xl border-indigo-100 bg-gradient-to-br from-indigo-500/10 via-brand-500/5 to-white shadow-sm overflow-hidden border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/15 flex items-center justify-center text-indigo-600">
                <Zap className="h-7 w-7 fill-indigo-500" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800">
                Level {currentLevel}
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-slate-900 flex items-baseline gap-1.5">
                {xp} <span className="text-lg font-bold text-slate-500">XP</span>
              </div>
              <div className="mt-2 space-y-1">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all duration-700"
                    style={{ width: `${100 - xpToNextLevel}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {xpToNextLevel} XP until Level {currentLevel + 1}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enrolled Courses Progress */}
        <Card className="rounded-3xl border-slate-200 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600">
                <GraduationCap className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700">
                {overallProgress}% Done
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-slate-900">
                {enrolledCourses.length}
              </div>
              <p className="text-xs font-semibold text-slate-600 mt-1">Enrolled Courses</p>
              <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-500 rounded-full transition-all duration-700"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quiz Performance */}
        <Card className="rounded-3xl border-slate-200 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Trophy className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                {results.length} Completed
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-slate-900">
                {averageScore}%
              </div>
              <p className="text-xs font-semibold text-slate-600 mt-1">Average Quiz Score</p>
              <p className="text-[11px] text-slate-400 mt-1">
                {results.filter(r => r.score >= 70).length} quizzes mastered with high distinction
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Enrolled Courses */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 font-heading">
              <Layout className="h-5 w-5 text-brand-600" />
              My Enrolled Courses ({enrolledCourses.length})
            </h2>
            <Link to="/courses" className="text-sm font-bold text-brand-600 hover:text-brand-700">
              Browse More
            </Link>
          </div>

          <div className="space-y-4">
            {enrolledCourses.map((course, index) => {
              const prog = progressData[course.id] || { completed: 0, total: 0, percentage: 0 };
              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <Card className="group rounded-3xl border-slate-200 hover:border-brand-300 transition-all overflow-hidden shadow-sm hover:shadow-md bg-white">
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row">
                        <div className="w-full sm:w-52 h-40 bg-slate-100 overflow-hidden relative">
                          <img 
                            src={course.thumbnail_url || `https://picsum.photos/seed/${course.id}/400/300`} 
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {course.category || 'General'}
                          </div>
                        </div>

                        <div className="flex-1 p-6 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-4">
                              <h3 className="font-bold text-slate-900 text-lg group-hover:text-brand-600 transition-colors line-clamp-1">
                                {course.title}
                              </h3>
                              <Link to={`/course/${course.id}`}>
                                <Button size="sm" className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold h-9 px-4 gap-1.5 shadow-sm">
                                  <Play className="h-3.5 w-3.5 fill-white" />
                                  {prog.percentage > 0 ? 'Resume' : 'Start'}
                                </Button>
                              </Link>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {course.description}
                            </p>
                          </div>

                          <div className="mt-4 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-slate-600">
                                {prog.completed} of {prog.total} lessons completed
                              </span>
                              <span className="font-bold text-brand-600">
                                {prog.percentage}%
                              </span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-brand-600 rounded-full transition-all duration-700" 
                                style={{ width: `${prog.percentage}%` }} 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}

            {enrolledCourses.length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-4">
                <div className="h-16 w-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto text-brand-600">
                  <Compass className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">No enrolled courses yet</h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                    Explore top-rated masterclasses curated by seasoned engineering and industry leaders.
                  </p>
                </div>
                <Link to="/courses">
                  <Button className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold px-6">
                    Browse All Courses
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Recent Quizzes & Activity */}
        <div className="space-y-6">
          {/* Recent Quizzes */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-heading">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              Recent Quizzes
            </h2>
            <Card className="rounded-3xl border-slate-200 overflow-hidden shadow-sm bg-white">
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {results.slice(0, 4).map((result, index) => (
                    <div 
                      key={result.id || index}
                      className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 text-sm truncate">
                          {result.quiz?.title || 'Course Quiz'}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {new Date(result.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`h-9 w-12 rounded-xl flex items-center justify-center font-bold text-xs ${
                        result.score >= 70 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {result.score}%
                      </div>
                    </div>
                  ))}
                  {results.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-sm italic">
                      No quizzes taken yet. Complete course quizzes to test your understanding!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Feed */}
          <Card className="rounded-3xl bg-slate-900 text-white border-none p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-brand-500 rounded-xl flex items-center justify-center text-white">
                  <Activity className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold font-heading">Learning Log</h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live</span>
            </div>

            <div className="space-y-3 pt-2">
              {activity.slice(0, 4).map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <div className={`h-2 w-2 rounded-full mt-1 flex-shrink-0 ${item.type === 'quiz' ? 'bg-emerald-400' : 'bg-brand-400'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-200 truncate">{item.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{new Date(item.time).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {activity.length === 0 && (
                <p className="text-slate-400 text-xs italic text-center py-4">No recent activity.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
