import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { TrendingUp, Users, DollarSign, BookOpen, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { jsPDF } from 'jspdf';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

export default function Analytics() {
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [courseStats, setCourseStats] = useState<any[]>([]);
  const [summaryStats, setSummaryStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [payments, analytics] = await Promise.all([
          api.get('/payments/revenue'),
          api.get('/courses/analytics')
        ]);

        // Process payments into monthly revenue chart data
        const monthlyMap: Record<string, number> = {};
        let totalRev = 0;
        payments.forEach((p: any) => {
          const date = new Date(p.createdAt);
          const month = date.toLocaleString('default', { month: 'short' });
          monthlyMap[month] = (monthlyMap[month] || 0) + p.amount;
          totalRev += p.amount;
        });

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
          const mIdx = (currentMonth - i + 12) % 12;
          last6Months.push({
            name: months[mIdx],
            revenue: monthlyMap[months[mIdx]] || 0
          });
        }
        setRevenueData(last6Months);

        // Process course performance
        const perf = analytics.courseStats.map((c: any) => ({
          name: c.title.length > 15 ? c.title.substring(0, 15) + '...' : c.title,
          fullTitle: c.title,
          students: c.students,
          completions: c.completions
        }));
        setCourseStats(perf);

        setSummaryStats({
          totalRevenue: totalRev,
          totalStudents: analytics.totalUniqueStudents,
          completionRate: analytics.totalEnrollments > 0 
            ? Math.round((analytics.totalCompletions / analytics.totalEnrollments) * 100) 
            : 0,
          recentTransactions: payments.slice(0, 4)
        });

      } catch (error) {
        console.error(error);
      } finally {
         setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const handleExportReport = () => {
    if (!summaryStats) return;
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(99, 102, 241); // brand-600
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('EDUVISION ANALYTICS', 20, 25);
    
    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 20, 33);
    
    // Summary Section
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 20, 55);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Revenue: INR ${summaryStats.totalRevenue.toLocaleString()}`, 25, 65);
    doc.text(`Active Students: ${summaryStats.totalStudents}`, 25, 72);
    doc.text(`Average Completion Rate: ${summaryStats.completionRate}%`, 25, 79);
    
    // Course Performance Section
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Course Performance', 20, 95);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Course Title', 25, 105);
    doc.text('Students', 140, 105);
    doc.text('Completions', 170, 105);
    doc.line(20, 107, 190, 107);
    
    doc.setFont('helvetica', 'normal');
    courseStats.forEach((course, index) => {
      const y = 115 + (index * 10);
      if (y > 270) {
        doc.addPage();
        doc.text('Course Performance (continued)', 20, 20);
      }
      doc.text(course.fullTitle.length > 50 ? course.fullTitle.substring(0, 50) + '...' : course.fullTitle, 25, y);
      doc.text(course.students.toString(), 140, y);
      doc.text(course.completions.toString(), 170, y);
    });
    
    // Recent Transactions
    const startY = 115 + (courseStats.length * 10) + 20;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Recent Transactions', 20, startY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Student', 25, startY + 10);
    doc.text('Course', 80, startY + 10);
    doc.text('Amount', 150, startY + 10);
    doc.text('Status', 175, startY + 10);
    doc.line(20, startY + 12, 190, startY + 12);
    
    doc.setFont('helvetica', 'normal');
    summaryStats.recentTransactions.forEach((txn: any, index: number) => {
      const y = startY + 20 + (index * 10);
      doc.text(txn.user?.name || 'Anonymous', 25, y);
      doc.text(txn.course?.title.substring(0, 30) || 'N/A', 80, y);
      doc.text(`INR ${txn.amount}`, 150, y);
      doc.text(txn.payment_status, 175, y);
    });
    
    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text(`EduVision Confidential • Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
    }
    
    doc.save(`EduVision_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const stats = [
    { 
      title: 'Total Revenue', 
      value: `₹${summaryStats?.totalRevenue.toLocaleString() || '0'}`, 
      icon: DollarSign, 
      trend: 'Live', 
      trendUp: true, 
      color: 'brand' 
    },
    { 
      title: 'Active Students', 
      value: summaryStats?.totalStudents.toLocaleString() || '0', 
      icon: Users, 
      trend: 'Live', 
      trendUp: true, 
      color: 'emerald' 
    },
    { 
      title: 'Completion Rate', 
      value: `${summaryStats?.completionRate || 0}%`, 
      icon: BookOpen, 
      trend: 'Live', 
      trendUp: true, 
      color: 'amber' 
    },
    { 
      title: 'Avg. Rating', 
      value: '4.9', 
      icon: TrendingUp, 
      trend: 'Top', 
      trendUp: true, 
      color: 'rose' 
    },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 font-heading tracking-tight">Analytics Dashboard</h1>
          <p className="text-slate-500 mt-1">Real-time insights into your academy's performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="rounded-xl px-4 py-2 border-slate-200 bg-white">
            Last 30 Days
          </Badge>
          <button 
            onClick={handleExportReport}
            className="bg-brand-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 active:scale-95"
          >
            Export Report
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="rounded-[2rem] border-slate-200 shadow-sm overflow-hidden group hover:border-brand-200 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center bg-${stat.color}-50 text-${stat.color}-600`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-bold ${stat.trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {stat.trendUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {stat.trend}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</div>
                  <div className="text-sm text-slate-500 font-medium">{stat.title}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <Card className="rounded-[2.5rem] border-slate-200 p-8 shadow-sm">
          <CardHeader className="px-0 pt-0 mb-8">
            <CardTitle className="text-xl font-bold font-heading">Revenue Growth</CardTitle>
          </CardHeader>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Course Performance */}
        <Card className="rounded-[2.5rem] border-slate-200 p-8 shadow-sm">
          <CardHeader className="px-0 pt-0 mb-8">
            <CardTitle className="text-xl font-bold font-heading">Course Performance</CardTitle>
          </CardHeader>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="students" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Student Distribution by Course */}
        <Card className="rounded-[2.5rem] border-slate-200 p-8 shadow-sm lg:col-span-1">
          <CardHeader className="px-0 pt-0 mb-6">
            <CardTitle className="text-xl font-bold font-heading">Course Distribution</CardTitle>
          </CardHeader>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={courseStats.map((c, i) => ({ name: c.name, value: c.students }))}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {courseStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4 max-h-[150px] overflow-y-auto pr-2">
            {courseStats.slice(0, 5).map((course, i) => (
              <div key={course.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                  <span className="text-slate-600 font-medium truncate max-w-[120px]">{course.name}</span>
                </div>
                <span className="font-bold text-slate-900">{course.students}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Transactions */}
        <Card className="rounded-[2.5rem] border-slate-200 p-8 shadow-sm lg:col-span-2">
          <CardHeader className="px-0 pt-0 mb-6 flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold font-heading">Recent Transactions</CardTitle>
            <button className="text-brand-600 text-sm font-bold hover:underline">View All</button>
          </CardHeader>
          <div className="space-y-4">
            {summaryStats?.recentTransactions.map((txn: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center font-bold text-brand-600 border border-slate-200">
                    {txn.user?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{txn.user?.name || 'Anonymous'}</div>
                    <div className="text-xs text-slate-500">{txn.course?.title}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">₹{txn.amount.toLocaleString()}</div>
                  <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">{txn.payment_status}</div>
                </div>
              </div>
            ))}
            {(!summaryStats?.recentTransactions || summaryStats.recentTransactions.length === 0) && (
              <div className="text-center py-10 text-slate-400 italic">No transactions yet.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}