import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Terminal, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Cpu, 
  Code2, 
  Sparkles, 
  Check, 
  Zap 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface CodeLabProps {
  initialLanguage?: string;
  courseTopic?: string;
}

export default function CodeLab({ initialLanguage = 'javascript', courseTopic }: CodeLabProps) {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [language, setLanguage] = useState<'javascript' | 'python'>('javascript');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [executionStats, setExecutionStats] = useState<{ executionMs?: string; memoryKb?: number } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<Array<{ input: string; expected: string; passed: boolean; actual?: string }> | null>(null);

  useEffect(() => {
    api.get('/codelab/challenges')
      .then((data: any[]) => {
        setChallenges(data);
        if (data.length > 0) {
          const first = data[0];
          setSelectedChallenge(first);
          setCode(first.initialCode[language] || first.initialCode.javascript);
        }
      })
      .catch(console.error);
  }, []);

  const handleSelectChallenge = (ch: any) => {
    setSelectedChallenge(ch);
    setCode(ch.initialCode[language] || ch.initialCode.javascript || '');
    setOutput('');
    setTestResults(null);
    setExecutionStats(null);
  };

  const handleLanguageChange = (newLang: 'javascript' | 'python') => {
    setLanguage(newLang);
    if (selectedChallenge?.initialCode?.[newLang]) {
      setCode(selectedChallenge.initialCode[newLang]);
    }
    setOutput('');
    setTestResults(null);
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput('Running code sandbox...\n');
    setTestResults(null);
    try {
      const res = await api.post('/codelab/execute', { code, language });
      setOutput(res.output || 'Done (no console output).');
      setExecutionStats({
        executionMs: res.executionMs,
        memoryKb: res.memoryKb
      });
    } catch (err: any) {
      setOutput(`Execution failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunTests = async () => {
    if (!selectedChallenge?.testCases) return;
    setIsRunning(true);
    setOutput('Evaluating test assertions...\n');
    
    try {
      // Execute code and evaluate test assertions
      const results: Array<{ input: string; expected: string; passed: boolean; actual?: string }> = [];
      
      for (const tc of selectedChallenge.testCases) {
        // Run test assertion
        const testCode = `${code}\nconsole.log(${tc.input});`;
        const res = await api.post('/codelab/execute', { code: testCode, language });
        const lastLine = res.output?.trim().split('\n').pop() || '';
        const passed = lastLine.includes(tc.expected) || res.output.includes(tc.expected);
        results.push({
          input: tc.input,
          expected: tc.expected,
          actual: lastLine,
          passed
        });
      }

      setTestResults(results);
      const passedCount = results.filter(r => r.passed).length;
      setOutput(`Test Suite Finished: ${passedCount}/${results.length} assertions passed.`);
    } catch (err: any) {
      setOutput(`Test execution error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    if (selectedChallenge) {
      setCode(selectedChallenge.initialCode[language] || '');
      setOutput('');
      setTestResults(null);
      setExecutionStats(null);
    }
  };

  return (
    <div className="bg-slate-950 text-slate-100 rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col min-h-[580px]">
      {/* Header bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <Code2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white font-heading">
                {selectedChallenge?.title || 'Interactive Code Sandbox'}
              </span>
              {selectedChallenge && (
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                  selectedChallenge.difficulty === 'Easy' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                  selectedChallenge.difficulty === 'Medium' ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                  "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                )}>
                  {selectedChallenge.difficulty}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">Run, test, and benchmark algorithms in real time</p>
          </div>
        </div>

        {/* Challenge selector & Language toggle */}
        <div className="flex items-center gap-2">
          {challenges.length > 0 && (
            <select
              value={selectedChallenge?.id || ''}
              onChange={(e) => {
                const found = challenges.find(c => c.id === e.target.value);
                if (found) handleSelectChallenge(found);
              }}
              className="bg-slate-800 border border-slate-700 text-xs rounded-xl px-3 py-1.5 text-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
            >
              {challenges.map(ch => (
                <option key={ch.id} value={ch.id}>{ch.title}</option>
              ))}
            </select>
          )}

          <div className="flex rounded-xl bg-slate-800 p-0.5 border border-slate-700 text-xs font-semibold">
            <button
              onClick={() => handleLanguageChange('javascript')}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all",
                language === 'javascript' ? "bg-brand-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              )}
            >
              JS
            </button>
            <button
              onClick={() => handleLanguageChange('python')}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all",
                language === 'python' ? "bg-brand-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              )}
            >
              Python
            </button>
          </div>
        </div>
      </div>

      {/* Editor & Console Split View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[380px]">
        {/* Code Editor Panel */}
        <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900/50 border-b border-slate-800/80 text-[11px] text-slate-400 font-mono">
            <span>solution.{language === 'javascript' ? 'js' : 'py'}</span>
            <button 
              onClick={handleReset}
              className="hover:text-slate-200 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="flex-1 w-full bg-slate-950 text-emerald-400 font-mono text-xs sm:text-sm p-4 leading-relaxed outline-none resize-none selection:bg-brand-500/30 custom-scrollbar"
            placeholder="// Write code or algorithm here..."
          />
        </div>

        {/* Console / Test Runner Panel */}
        <div className="lg:col-span-5 flex flex-col bg-slate-900/60">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Terminal className="h-3.5 w-3.5 text-brand-400" />
              <span>Console & Output</span>
            </div>
            {executionStats && (
              <div className="flex items-center gap-3 text-[10px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Clock className="h-3 w-3" />
                  {executionStats.executionMs}ms
                </span>
                <span className="flex items-center gap-1 text-indigo-400">
                  <Cpu className="h-3 w-3" />
                  {executionStats.memoryKb} KB
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-3 custom-scrollbar text-slate-300">
            {/* Description blurb */}
            {selectedChallenge && (
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-slate-300 space-y-1">
                <div className="font-bold text-[11px] text-brand-400">Challenge Objective:</div>
                <p className="text-[11px] leading-relaxed text-slate-300">{selectedChallenge.description}</p>
              </div>
            )}

            {/* Test Case Breakdown if run */}
            {testResults && (
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  Automated Assertions
                </div>
                {testResults.map((tr, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "p-2.5 rounded-xl border text-xs flex items-center justify-between",
                      tr.passed 
                        ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300" 
                        : "bg-rose-950/40 border-rose-500/30 text-rose-300"
                    )}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-mono text-[11px] font-bold truncate">{tr.input}</div>
                      <div className="text-[10px] opacity-75">Expected: {tr.expected}</div>
                    </div>
                    {tr.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Console standard out */}
            <div className="space-y-1 pt-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Standard Output</div>
              <pre className="p-3 bg-black/50 rounded-xl border border-slate-800/80 whitespace-pre-wrap text-slate-200 text-xs font-mono min-h-[90px]">
                {output || 'Click "Run Code" to execute script.'}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-slate-900 border-t border-slate-800 p-3 px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>V8 Engine Sandboxed • +10 XP per run</span>
        </div>

        <div className="flex items-center gap-2">
          {selectedChallenge?.testCases && (
            <Button
              onClick={handleRunTests}
              disabled={isRunning}
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold h-9 px-4 text-xs flex items-center gap-1.5"
            >
              <Check className="h-3.5 w-3.5 text-brand-400" />
              Run Tests
            </Button>
          )}

          <Button
            onClick={handleRunCode}
            disabled={isRunning}
            size="sm"
            className="rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold h-9 px-5 text-xs flex items-center gap-1.5 shadow-md shadow-brand-500/20"
          >
            {isRunning ? (
              <span className="flex items-center gap-1">Executing...</span>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-white" />
                Run Code
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
