import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginWithCreds = async (eMail: string, pass: string, targetPath?: string) => {
    setError('');
    setSubmitting(true);
    try {
      const data = await api.post('/auth/login', { email: eMail, password: pass });
      login(data.token, data.user);
      if (targetPath) {
        navigate(targetPath);
      } else if (data.user.role === 'admin') {
        navigate('/admin');
      } else if (data.user.role === 'instructor') {
        navigate('/instructor');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError('Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleLoginWithCreds(email, password);
  };

  return (
    <div className="max-w-md mx-auto mt-8 sm:mt-12 px-4">
      {/* 1-Click Demo Persona Banner */}
      <div className="mb-6 p-5 bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl text-white shadow-xl space-y-3 border border-indigo-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Recruiter & Demo Mode</span>
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Test all role experiences instantly with 1-click credentials:
        </p>
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleLoginWithCreds('student@eduvision.com', 'student123', '/dashboard')}
            className="p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl text-center border border-white/10 transition-all flex flex-col items-center gap-1"
          >
            <span className="text-lg">🎓</span>
            <span className="text-[11px] font-bold text-white">Student</span>
          </button>
          <button
            type="button"
            onClick={() => handleLoginWithCreds('instructor@eduvision.com', 'ins123', '/instructor')}
            className="p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl text-center border border-white/10 transition-all flex flex-col items-center gap-1"
          >
            <span className="text-lg">👨‍🏫</span>
            <span className="text-[11px] font-bold text-white">Instructor</span>
          </button>
          <button
            type="button"
            onClick={() => handleLoginWithCreds('admin@eduvision.com', 'admin123', '/admin')}
            className="p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl text-center border border-white/10 transition-all flex flex-col items-center gap-1"
          >
            <span className="text-lg">🛡️</span>
            <span className="text-[11px] font-bold text-white">Admin</span>
          </button>
        </div>
      </div>

      <Card className="border-slate-200 shadow-xl rounded-3xl">
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="flex justify-center mb-3">
            <img 
              src="/eduvision-icon.png" 
              alt="EduVision" 
              className="h-16 w-16 rounded-2xl shadow-lg border border-slate-100 object-cover" 
            />
          </div>
          <CardTitle className="text-2xl font-bold font-heading">Welcome to EduVision</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button 
              type="submit" 
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-base shadow-lg shadow-indigo-100"
            >
              {submitting ? 'Authenticating...' : 'Login'}
            </Button>
            <p className="text-sm text-center text-slate-600">
              Don't have an account? <Link to="/register" className="text-indigo-600 font-bold hover:underline">Register</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
