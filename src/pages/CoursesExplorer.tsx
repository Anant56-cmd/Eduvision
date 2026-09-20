import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { Search, Clock, Star, BookOpen, Filter, Sparkles, Layers, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = ['All', 'System Design', 'DSA', 'AI & ML', 'Physics & Math'];
const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export default function CoursesExplorer() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [priceType, setPriceType] = useState<'all' | 'free' | 'paid'>('all');
  const [sortBy, setSortBy] = useState('rating');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchFilteredCourses();
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [search, selectedCategory, selectedLevel, priceType, sortBy]);

  const fetchFilteredCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedLevel !== 'All') params.append('level', selectedLevel);
      if (priceType !== 'all') params.append('priceType', priceType);
      if (sortBy) params.append('sort', sortBy);

      const data = await api.get(`/courses?${params.toString()}`);
      setCourses(data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalDuration = (lessons: any[]) => {
    if (!lessons || lessons.length === 0) return '0h 0m';
    let totalSeconds = 0;
    lessons.forEach((lesson) => {
      const duration = lesson.duration || '0:00';
      const parts = duration.split(':').map(Number);
      if (parts.length === 3) totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
      else if (parts.length === 2) totalSeconds += parts[0] * 60 + parts[1];
      else if (parts.length === 1) totalSeconds += parts[0] * 60;
    });
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="space-y-12 pb-24 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Catalog Hero Banner */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-14 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-6">
          <Badge className="bg-brand-500/30 text-brand-300 border-brand-400/30 px-4 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 mr-2 text-yellow-300 animate-spin-slow" />
            Curated Career Programs
          </Badge>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black font-heading tracking-tight leading-tight">
            Explore All Courses
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            From high-scale distributed systems and algorithmic patterns to competitive mathematics, learn from industry leaders with hands-on practice, AI doubt assistance, and accredited certificates.
          </p>

          <div className="relative pt-2 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-300" />
            <Input
              placeholder="Search by topic, keyword, or architecture..."
              className="pl-12 h-14 rounded-2xl bg-white/10 border-white/20 text-white placeholder:text-indigo-200 focus:bg-white/20 text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Filter and Category Controls */}
      <section className="space-y-6">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 scale-105'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-brand-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Secondary Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
              <Filter className="h-4 w-4 text-brand-600" />
              <span>Level:</span>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-800 outline-none cursor-pointer hover:bg-slate-100"
              >
                {LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
              <span>Price:</span>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {(['all', 'free', 'paid'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setPriceType(type)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider capitalize transition-all ${
                      priceType === type ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-800 outline-none cursor-pointer hover:bg-slate-100"
            >
              <option value="rating">Highest Rated</option>
              <option value="newest">Recently Added</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section>
        {loading && courses.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 rounded-3xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {courses.map((course, idx) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <Link to={`/course/${course.id}`} className="group block h-full">
                    <div className="h-full bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden flex flex-col shadow-sm hover:shadow-2xl hover:border-brand-200 transition-all duration-300">
                      <div className="relative h-52 bg-slate-100 overflow-hidden">
                        <img
                          src={course.thumbnail_url || `https://picsum.photos/seed/${course.id + 10}/800/600`}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute top-4 left-4 flex gap-2">
                          <Badge className="bg-white/90 text-slate-900 backdrop-blur-sm border-none font-bold px-3 py-1 rounded-lg">
                            {course.category || 'General'}
                          </Badge>
                          {course.level && (
                            <Badge className="bg-slate-900/80 text-white backdrop-blur-sm border-none font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase">
                              {course.level}
                            </Badge>
                          )}
                        </div>
                        <div className="absolute top-4 right-4">
                          <div className="flex items-center gap-1 bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg shadow-md">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            <span>{course.rating || 4.9}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-7 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand-600 transition-colors font-heading line-clamp-2 leading-snug">
                            {course.title}
                          </h3>
                          <p className="text-slate-500 text-sm line-clamp-2 font-medium leading-relaxed">
                            {course.description}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                              {course.instructor?.name?.charAt(0) || 'I'}
                            </div>
                            <span className="truncate max-w-[120px]">{course.instructor?.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <span>{calculateTotalDuration(course.lessons)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div className="text-2xl font-black text-slate-900">
                            {course.price === 0 ? (
                              <span className="text-emerald-600 font-bold">Free</span>
                            ) : (
                              `₹${course.price?.toLocaleString() || '2,499'}`
                            )}
                          </div>
                          <Button className="bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl px-5 h-10 shadow-md">
                            Explore <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {!loading && courses.length === 0 && (
          <div className="text-center py-24 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 space-y-4">
            <BookOpen className="h-12 w-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-700 font-heading">No matching courses found</h3>
              <p className="text-slate-400 text-sm">Try relaxing your search terms or clearing selected category filters.</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setSelectedCategory('All');
                setSelectedLevel('All');
                setPriceType('all');
              }}
              className="rounded-xl border-slate-300"
            >
              Reset Filters
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
