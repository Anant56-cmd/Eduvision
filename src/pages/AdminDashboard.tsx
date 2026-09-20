import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  Trash2, 
  ShieldCheck, 
  LayoutDashboard, 
  UserPlus, 
  Clock, 
  ShieldAlert,
  Activity,
  BarChart3,
  Search,
  MoreVertical,
  Mail,
  Calendar,
  Zap,
  Shield,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Input } from '@/components/ui/input';

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [pendingCourses, setPendingCourses] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (isManual = false) => {
    setIsRefreshing(true);
    try {
      const [usersData, pendingData, allData, activityData, earningsData] = await Promise.all([
        api.get('/users'),
        api.get('/courses/pending'),
        api.get('/courses'),
        api.get('/users/activity'),
        api.get('/payments/analytics')
      ]);
      setUsers(usersData);
      setPendingCourses(pendingData);
      setAllCourses(allData);
      setActivity(activityData);
      setEarnings(earningsData);
      
      if (isManual) {
        alert("System Audit Complete: All records are up to date.");
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      if (isManual) {
        alert("System Audit Failed: Could not reach the server.");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up WebSocket connection for real-time moderation
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('Admin: Real-time sync heart beat established');
    };

    socket.onmessage = (event) => {
      try {
        const { event: eventName, data } = JSON.parse(event.data);
        console.log(`Admin Event Received: ${eventName}`, data);

        // For major changes, we trigger a high-speed refresh to ensure consistency
        if ([
          'COURSE_CREATED', 
          'COURSE_APPROVED', 
          'COURSE_DELETED', 
          'USER_UPDATED', 
          'USER_DELETED'
        ].includes(eventName)) {
          fetchData(); 
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected. Will try reconnecting on next mount.');
    };

    return () => {
      socket.close();
    };
  }, []);

  const handleSystemAudit = () => {
    fetchData(true);
  };

  const handleApproveCourse = async (id: number) => {
    try {
      await api.post(`/courses/${id}/approve`, {});
      await fetchData(); // Refresh everything to update activity and stats
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCourse = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await api.delete(`/courses/${id}`);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRole = async (id: number, role: string) => {
    try {
      await api.put(`/users/${id}/role`, { role });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
    </div>
  );

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'bg-blue-500', glow: 'shadow-blue-500/20' },
    { label: 'Platform Earnings', value: `₹${Math.round(earnings?.totalCommission || 0).toLocaleString()}`, icon: ArrowUpRight, color: 'bg-emerald-500', glow: 'shadow-emerald-500/20' },
    { label: 'Total Revenue', value: `₹${Math.round(earnings?.totalRevenue || 0).toLocaleString()}`, icon: Zap, color: 'bg-indigo-500', glow: 'shadow-indigo-500/20' },
    { label: 'Pending Courses', value: pendingCourses.length, icon: Clock, color: 'bg-amber-500', glow: 'shadow-amber-500/20' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Header Section */}
      <section className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 text-white p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Badge className="bg-brand-500/20 text-brand-400 border-brand-500/30 px-3 py-1 mb-2">
              <Shield className="h-3 w-3 mr-2" />
              Administrator Access
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight font-heading">Control Center</h1>
            <p className="text-slate-400 text-lg font-medium max-w-md">
              Manage users, moderate content, and monitor system performance.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleSystemAudit}
              disabled={isRefreshing}
              className="bg-white text-slate-900 hover:bg-slate-100 rounded-2xl h-14 px-8 font-bold shadow-xl"
            >
              <Zap className={`h-5 w-5 mr-2 text-brand-600 ${isRefreshing ? 'animate-pulse' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'System Audit'}
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="rounded-[2rem] border-slate-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className={`h-12 w-12 rounded-2xl ${stat.color} flex items-center justify-center text-white shadow-lg ${stat.glow} group-hover:scale-110 transition-transform`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-slate-300" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <h3 className="text-3xl font-black text-slate-900 font-heading">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="space-y-12">
        {/* Moderation Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 font-heading">Content Moderation</h2>
                <p className="text-sm font-medium text-slate-500">Review and manage course submissions</p>
              </div>
            </div>
            <Badge className="bg-amber-100 text-amber-600 border-none px-4 py-1.5 font-bold">
              {pendingCourses.length} Pending Actions
            </Badge>
          </div>

          <Card className="rounded-[2.5rem] border-slate-200 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-b border-slate-100">
                  <TableHead className="px-8 py-5 font-bold text-slate-900">Course Details</TableHead>
                  <TableHead className="px-8 py-5 font-bold text-slate-900">Instructor</TableHead>
                  <TableHead className="px-8 py-5 font-bold text-slate-900">Status</TableHead>
                  <TableHead className="px-8 py-5 text-right font-bold text-slate-900">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...pendingCourses, ...allCourses].map(course => (
                  <TableRow key={course.id} className="hover:bg-slate-50/50 border-b border-slate-100 group transition-colors">
                    <TableCell className="px-8 py-6">
                      <div className="font-bold text-slate-900 text-base">{course.title}</div>
                      <div className="text-sm text-slate-500 line-clamp-1 max-w-md">{course.description}</div>
                    </TableCell>
                    <TableCell className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                          {course.instructor?.name?.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-700">{course.instructor?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-6">
                      {course.is_approved ? (
                        <Badge className="bg-emerald-100 text-emerald-600 border-none font-bold">Approved</Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-600 border-none font-bold">Pending Review</Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!course.is_approved && (
                          <Button 
                            onClick={() => handleApproveCourse(course.id)} 
                            className="bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold h-10 px-6 shadow-lg shadow-emerald-100"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteCourse(course.id)}
                          className="rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(allCourses.length + pendingCourses.length) === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-32">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center">
                          <CheckCircle className="h-10 w-10 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-medium text-lg">No courses found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </section>

        {/* Users Section */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 font-heading">User Management</h2>
                <p className="text-sm font-medium text-slate-500">Manage user accounts and system permissions</p>
              </div>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search users..." 
                className="pl-11 h-12 rounded-xl border-slate-200 focus:ring-brand-500 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Card className="rounded-[2.5rem] border-slate-200 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-b border-slate-100">
                  <TableHead className="px-8 py-5 font-bold text-slate-900">User</TableHead>
                  <TableHead className="px-8 py-5 font-bold text-slate-900">Role</TableHead>
                  <TableHead className="px-8 py-5 font-bold text-slate-900">Joined</TableHead>
                  <TableHead className="px-8 py-5 text-right font-bold text-slate-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {filteredUsers.map((user, i) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-slate-50/50 border-b border-slate-100 group transition-colors"
                    >
                      <TableCell className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-black text-lg shadow-sm group-hover:scale-110 transition-transform">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-base">{user.name}</div>
                            <div className="text-sm text-slate-500 flex items-center gap-1.5">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 py-6">
                        <Badge 
                          variant="outline" 
                          className={`rounded-lg px-3 py-1 font-bold border-none ${
                            user.role === 'admin' 
                              ? 'bg-indigo-100 text-indigo-600' 
                              : user.role === 'instructor' 
                                ? 'bg-emerald-100 text-emerald-600' 
                                : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-8 py-6">
                        <div className="text-sm text-slate-500 flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          {new Date().toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user.role !== 'admin' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleUpdateRole(user.id, 'admin')}
                              className="rounded-xl text-indigo-600 hover:bg-indigo-50"
                              title="Promote to Admin"
                            >
                              <ShieldCheck className="h-5 w-5" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteUser(user.id)}
                            className="rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </Card>
        </section>

        {/* Activity Feed */}
        <section className="space-y-6">
           <div className="flex items-center gap-3 px-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 font-heading">System Activity</h2>
              <p className="text-sm font-medium text-slate-500">Live feed of global system events</p>
            </div>
          </div>
          
          <Card className="rounded-[2.5rem] border-slate-200 shadow-sm overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activity.map((item, i) => {
                  const Icon = item.type === 'user' ? UserPlus : item.type === 'course' ? BookOpen : Zap;
                  const color = item.type === 'user' ? 'text-blue-600' : item.type === 'course' ? 'text-indigo-600' : 'text-emerald-600';
                  const bg = item.type === 'user' ? 'bg-blue-50' : item.type === 'course' ? 'bg-indigo-50' : 'bg-emerald-50';
                  
                  return (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100">
                      <div className={`h-12 w-12 rounded-2xl ${bg} ${color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{item.user}</p>
                        <p className="text-sm text-slate-500 line-clamp-1">{item.action}</p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {new Date(item.time).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {activity.length === 0 && (
                <div className="text-center py-10 text-slate-400 italic">
                  No recent activity found.
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
