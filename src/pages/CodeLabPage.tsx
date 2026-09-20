import React from 'react';
import CodeLab from '../components/CodeLab';
import { Sparkles, Terminal, ShieldCheck, Zap } from 'lucide-react';

export default function CodeLabPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 px-4 sm:px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-50 text-brand-700 mb-1">
            <Sparkles className="h-3.5 w-3.5" /> Interactive Coding Lab
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
            Interactive Code Lab & Runner
          </h1>
          <p className="text-slate-500 text-sm max-w-2xl">
            Practice algorithmic problem solving, verify assertions against automated unit tests, and measure execution speed.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Sandboxed V8 Execution</span>
          </div>
        </div>
      </div>

      <CodeLab />
    </div>
  );
}
