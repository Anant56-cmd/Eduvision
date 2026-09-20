import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { BookOpen, User, Clock, Search, ArrowRight, Sparkles, Layout, Trophy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'motion/react';

export default function Home() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setLoading(true);
      api.get(`/courses${search ? `?search=${search}` : ''}`)
        .then(setCourses)
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const calculateTotalDuration = (lessons: any[]) => {
    if (!lessons || lessons.length === 0) return '0h 0m';
    
    let totalSeconds = 0;
    lessons.forEach(lesson => {
      const duration = lesson.duration || '0:00';
      const parts = duration.split(':').map(Number);
      
      if (parts.length === 3) { // HH:MM:SS
        totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (parts.length === 2) { // MM:SS
        totalSeconds += parts[0] * 60 + parts[1];
      } else if (parts.length === 1) { // MM
        totalSeconds += parts[0] * 60;
      }
    });

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    
    if (h > 0) {
      return `${h}h ${m}m`;
    }
    return `${m}m`;
  };

  return (
    <div className="space-y-16 pb-20 bg-vibrant-mesh min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 px-6 rounded-[3rem] bg-slate-900 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[500px] h-[500px] bg-brand-500/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[500px] h-[500px] bg-vibrant-pink/30 rounded-full blur-[120px] animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
        
        <div className="relative max-w-4xl mx-auto text-center space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Badge className="bg-gradient-to-r from-brand-500 to-vibrant-pink text-white border-none px-6 py-1.5 mb-8 backdrop-blur-md shadow-lg glow-pink">
              <Sparkles className="h-4 w-4 mr-2 text-yellow-300 animate-spin-slow" />
              The Future of Learning is Here
            </Badge>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] font-heading">
              Master Your <br />
              <span className="text-gradient-vibrant">Future Today</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto mt-8 font-medium leading-relaxed">
              Experience EduVision. High-quality masterclasses, 
              AI-powered insights, and global certifications.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-md mx-auto relative group"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-300 group-focus-within:text-white transition-colors" />
            <Input 
              placeholder="What do you want to learn today?" 
              className="pl-12 h-14 bg-white/10 border-white/20 text-white placeholder:text-indigo-200 rounded-2xl focus:bg-white/20 focus:ring-brand-400 transition-all text-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </motion.div>
        </div>
      </section>

      {/* Course Grid */}
      <section className="space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-4xl font-black text-slate-900 font-heading tracking-tight">Premiere Courses</h2>
            <p className="text-slate-500 mt-2 text-lg">Explore our curated selection of launch courses</p>
          </div>
          <Link to="/courses" className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200 text-brand-600 font-bold flex items-center gap-2 hover:bg-brand-50 hover:border-brand-200 transition-all">
            Explore All <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        {loading && courses.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[400px] rounded-3xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Link to={`/course/${course.id}`}>
                  <div className="group h-full bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden card-hover flex flex-col shadow-sm hover:shadow-2xl hover:border-brand-200 transition-all duration-500">
                    <div className="relative h-56 bg-slate-100 overflow-hidden">
                      <img 
                        src={`https://picsum.photos/seed/${course.id}/800/600`} 
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-white/90 text-slate-900 backdrop-blur-sm border-none font-bold px-3 py-1 rounded-lg">
                          {course.lessons?.length || 0} Lessons
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-8 flex-1 flex flex-col space-y-5">
                      <div className="space-y-3">
                        <h3 className="text-2xl font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2 font-heading leading-tight break-words overflow-hidden">
                          {course.title}
                        </h3>
                        <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed font-medium break-words overflow-hidden">
                          {course.description}
                        </p>
                      </div>

                      <div className="pt-5 mt-auto border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-vibrant-purple flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {course.instructor?.name?.charAt(0)}
                          </div>
                          <span className="text-sm font-bold text-slate-700">{course.instructor?.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{calculateTotalDuration(course.lessons)}</span>
                        </div>
                      </div>
                        <div className="flex items-center justify-between pt-2">
                          <div className="text-2xl font-black text-slate-900 tracking-tighter">
                            {course.price === 0 ? (
                              <span className="text-emerald-600">Free</span>
                            ) : (
                              `₹${course.price !== undefined && course.price !== null ? course.price : '2,499'}`
                            )}
                          </div>
                          <Button className="bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl px-6 h-11 shadow-lg shadow-brand-100">
                            Enroll
                          </Button>
                        </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && courses.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-500 text-lg">No courses found matching your search.</p>
            <Button variant="link" onClick={() => setSearch('')} className="text-brand-600">
              Clear search
            </Button>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div 
          whileHover={{ y: -5 }}
          className="p-8 bg-white rounded-[2.5rem] border border-slate-200 space-y-4"
        >
          <div className="h-12 w-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 font-heading">AI-Powered Learning</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Get personalized summaries, instant quiz generation, and 24/7 support from our advanced Gemini AI assistant.
          </p>
        </motion.div>
        <motion.div 
          whileHover={{ y: -5 }}
          className="p-8 bg-white rounded-[2.5rem] border border-slate-200 space-y-4"
        >
          <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Layout className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 font-heading">Learn Anywhere</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Install EduVision as a native app on your phone or desktop. Experience seamless offline access and fast loading.
          </p>
        </motion.div>
        <motion.div 
          whileHover={{ y: -5 }}
          className="p-8 bg-white rounded-[2.5rem] border border-slate-200 space-y-4"
        >
          <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <Trophy className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 font-heading">Professional Certs</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Earn industry-recognized certificates upon course completion and showcase your skills to potential employers.
          </p>
        </motion.div>
      </section>
    </div>
  );
}