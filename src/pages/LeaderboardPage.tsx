import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Trophy, 
  Flame, 
  Zap, 
  Medal, 
  Crown, 
  Sparkles, 
  Search, 
  User, 
  Award,
  TrendingUp
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number>(1);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/leaderboard')
      .then((data) => {
        setLeaderboard(data.leaderboard || []);
        setCurrentUserRank(data.currentUserRank || 1);
        setTotalUsers(data.totalUsers || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = leaderboard.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  const top3 = leaderboard.slice(0, 3);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Trophy className="h-10 w-10 text-amber-500 animate-bounce" />
        <p className="text-slate-500 font-medium">Computing live cohort rankings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 px-4 sm:px-6">
      {/* Header */}
      <div className="text-center space-y-3 pt-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
          <Crown className="h-3.5 w-3.5 text-amber-600" />
          Global EduVision Cohort Rankings
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 font-heading tracking-tight">
          XP Mastery Leaderboard
        </h1>
        <p className="text-slate-500 text-sm max-w-xl mx-auto">
          Compete with top engineers, maintain your daily study streak, and rise through the engineering mastery tiers.
        </p>
      </div>

      {/* User Standing Banner */}
      {user && (
        <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur border border-white/20 flex items-center justify-center text-xl font-black">
              #{currentUserRank}
            </div>
            <div>
              <div className="text-xs text-indigo-100 font-semibold uppercase tracking-wider">Your Standing</div>
              <div className="text-xl font-bold font-heading">{user.name}</div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-xs text-indigo-100 flex items-center justify-center gap-1">
                <Flame className="h-3.5 w-3.5 text-amber-300 fill-amber-300" /> Streak
              </div>
              <div className="text-lg font-black">{user.streak_count || 1} Days</div>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center">
              <div className="text-xs text-indigo-100 flex items-center justify-center gap-1">
                <Zap className="h-3.5 w-3.5 text-yellow-300 fill-yellow-300" /> Experience
              </div>
              <div className="text-lg font-black">{user.xp_points || 0} XP</div>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Podium Cards */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {/* Rank 2 - Silver */}
          <div className="order-2 md:order-1 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-3 relative">
            <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 font-black flex items-center justify-center text-xs border border-slate-300">
              #2
            </div>
            <div className="h-16 w-16 rounded-full bg-slate-100 border-2 border-slate-300 overflow-hidden flex items-center justify-center">
              {top3[1]?.avatar_url ? (
                <img src={top3[1].avatar_url} alt={top3[1].name} className="w-full h-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-slate-400" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{top3[1]?.name}</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {top3[1]?.tier}
              </span>
            </div>
            <div className="text-sm font-black text-brand-600">
              {top3[1]?.xp_points} XP
            </div>
          </div>

          {/* Rank 1 - Gold */}
          <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-white rounded-3xl p-8 border-2 border-amber-300 shadow-lg flex flex-col items-center text-center space-y-3 relative md:-mt-4">
            <div className="absolute -top-3.5 bg-amber-500 text-white text-[11px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md">
              <Crown className="h-3.5 w-3.5" /> 1st Place
            </div>
            <div className="h-20 w-20 rounded-full bg-amber-100 border-4 border-amber-300 overflow-hidden flex items-center justify-center shadow-md">
              {top3[0]?.avatar_url ? (
                <img src={top3[0].avatar_url} alt={top3[0].name} className="w-full h-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-amber-600" />
              )}
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900">{top3[0]?.name}</h3>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                {top3[0]?.tier}
              </span>
            </div>
            <div className="text-xl font-black text-amber-600 flex items-center gap-1">
              <Zap className="h-5 w-5 fill-amber-500" />
              {top3[0]?.xp_points} XP
            </div>
          </div>

          {/* Rank 3 - Bronze */}
          <div className="order-3 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-3 relative">
            <div className="h-8 w-8 rounded-full bg-orange-50 text-orange-800 font-black flex items-center justify-center text-xs border border-orange-200">
              #3
            </div>
            <div className="h-16 w-16 rounded-full bg-orange-50 border-2 border-orange-200 overflow-hidden flex items-center justify-center">
              {top3[2]?.avatar_url ? (
                <img src={top3[2].avatar_url} alt={top3[2].name} className="w-full h-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-orange-400" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{top3[2]?.name}</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-800">
                {top3[2]?.tier}
              </span>
            </div>
            <div className="text-sm font-black text-brand-600">
              {top3[2]?.xp_points} XP
            </div>
          </div>
        </div>
      )}

      {/* Search & Full Leaderboard Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900 font-heading">
            Cohort Rankings ({filtered.length})
          </h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search student name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-9 rounded-xl border-slate-200 text-xs"
            />
          </div>
        </div>

        <Card className="rounded-3xl border-slate-200 overflow-hidden shadow-sm bg-white">
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {filtered.map((u) => {
                const isCurrent = u.id === user?.id;
                return (
                  <div 
                    key={u.id}
                    className={cn(
                      "p-4 sm:p-5 flex items-center justify-between transition-colors",
                      isCurrent ? "bg-brand-50/50" : "hover:bg-slate-50/80"
                    )}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <span className={cn(
                        "h-8 w-8 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0",
                        u.rank === 1 ? "bg-amber-400 text-white shadow-sm" :
                        u.rank === 2 ? "bg-slate-300 text-slate-800" :
                        u.rank === 3 ? "bg-orange-300 text-orange-950" :
                        "bg-slate-100 text-slate-500"
                      )}>
                        #{u.rank}
                      </span>

                      <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-5 w-5 text-slate-400" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm truncate">{u.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-100 text-brand-700">
                              You
                            </span>
                          )}
                        </div>
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block mt-0.5", u.tierColor)}>
                          {u.tier}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-xl border border-orange-200/50">
                        <Flame className="h-3.5 w-3.5 fill-orange-500" />
                        <span>{u.streak_count}d</span>
                      </div>

                      <div className="flex items-center gap-1 text-sm font-black text-slate-900 w-24 justify-end">
                        <Zap className="h-4 w-4 text-brand-600 fill-brand-500" />
                        <span>{u.xp_points} XP</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
