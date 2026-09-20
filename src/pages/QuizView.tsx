import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Trophy, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Clock, 
  Award, 
  Sparkles, 
  Check, 
  X 
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function QuizView() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    api.get(`/quizzes/results`)
      .then(results => {
        if (!isMounted) return;
        const existing = results.find((r: any) => r.quiz_id === parseInt(quizId!));
        if (existing) setResult(existing);
      })
      .catch(console.error);

    api.get(`/quizzes/${quizId}`)
      .then(data => {
        if (!isMounted) return;
        setQuiz(data);
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizId]);

  // Start timer when quiz is loaded and not submitted
  useEffect(() => {
    if (!result && quiz) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [result, quiz]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const data = await api.post('/quizzes/submit', { 
        quizId: parseInt(quizId!), 
        answers,
        timeTakenSeconds: elapsedSeconds
      });
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setResult(null);
    setAnswers({});
    setElapsedSeconds(0);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium">Loading quiz session...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <p className="text-lg font-bold text-slate-800">Quiz not found or course not available.</p>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  if (result) {
    const score = result.score ?? result.scorePercentage ?? 0;
    const isPassed = score >= 60;
    const timeDisplay = formatTime(result.timeTakenSeconds || elapsedSeconds || 45);
    const totalQuestions = result.totalQuestions || quiz.questions?.length || 0;
    const correctCount = result.correctCount !== undefined 
      ? result.correctCount 
      : Math.round((score / 100) * totalQuestions);

    return (
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-8 bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-2xl border border-slate-100 relative overflow-hidden"
        >
          <div className={cn(
            "absolute top-0 left-0 w-full h-2.5",
            isPassed 
              ? "bg-gradient-to-r from-emerald-500 via-brand-500 to-indigo-500" 
              : "bg-gradient-to-r from-amber-500 to-rose-500"
          )} />
          
          <div className="relative">
            <div className={cn(
              "inline-flex p-7 rounded-full relative",
              isPassed ? "bg-emerald-50" : "bg-amber-50"
            )}>
              <Trophy className={cn(
                "h-16 w-16",
                isPassed ? "text-emerald-600" : "text-amber-600"
              )} />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className={cn(
                  "absolute inset-0 border-4 border-dashed rounded-full",
                  isPassed ? "border-emerald-200" : "border-amber-200"
                )}
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 space-y-2"
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-50 text-brand-700">
                <Sparkles className="h-3.5 w-3.5" />
                {isPassed ? 'Assessment Completed' : 'Keep Practicing'}
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
                {isPassed ? (score >= 80 ? 'Mastery Achieved!' : 'Well Done!') : 'Great Effort!'}
              </h1>
              <p className="text-slate-500">
                {isPassed 
                  ? 'You demonstrated solid understanding of this topic.' 
                  : 'Review the explanations below and give it another try!'}
              </p>
              
              <div className="pt-2">
                <span className={cn(
                  "text-6xl sm:text-7xl font-black tracking-tight",
                  isPassed ? "text-emerald-600" : "text-amber-600"
                )}>
                  {score}%
                </span>
              </div>
            </motion.div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-2">
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {correctCount} / {totalQuestions}
              </div>
              <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider mt-1">
                Accuracy
              </div>
            </div>
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
              <div className="text-xl sm:text-2xl font-black text-slate-900 flex items-center justify-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-400" />
                {timeDisplay}
              </div>
              <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider mt-1">
                Time Taken
              </div>
            </div>
            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100/60">
              <div className="text-xl sm:text-2xl font-black text-amber-600 flex items-center justify-center gap-1">
                <Award className="h-5 w-5" />
                +{score >= 70 ? 50 : 20}
              </div>
              <div className="text-[11px] text-amber-700 uppercase font-bold tracking-wider mt-1">
                XP Earned
              </div>
            </div>
          </div>

          {/* Question Breakdown */}
          {result.breakdown && result.breakdown.length > 0 && (
            <div className="text-left space-y-4 pt-4 border-t border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-brand-600" />
                Detailed Question Breakdown
              </h2>
              <div className="space-y-3">
                {result.breakdown.map((item: any, idx: number) => (
                  <div 
                    key={item.id || idx}
                    className={cn(
                      "p-4 rounded-2xl border transition-all",
                      item.isCorrect 
                        ? "bg-emerald-50/50 border-emerald-100" 
                        : "bg-rose-50/50 border-rose-100"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {item.isCorrect ? (
                          <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm">
                            <X className="h-3.5 w-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <p className="font-semibold text-slate-800 text-sm">
                          <span className="text-slate-400 font-bold mr-1.5">Q{idx + 1}.</span>
                          {item.question}
                        </p>
                        <div className="text-xs space-y-1">
                          <p className={cn("font-medium", item.isCorrect ? "text-emerald-800" : "text-rose-800")}>
                            <span className="text-slate-500">Your answer:</span> {item.selectedAnswer || 'Not answered'}
                          </p>
                          {!item.isCorrect && (
                            <p className="text-emerald-700 font-semibold">
                              <span className="text-slate-500">Correct answer:</span> {item.correctAnswer}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
            <Button 
              onClick={handleRetake}
              variant="outline"
              className="h-12 px-6 rounded-xl border-slate-200 hover:bg-slate-50 font-bold text-slate-700 flex items-center justify-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Retake Quiz
            </Button>
            <Button 
              onClick={() => navigate(-1)} 
              variant="outline"
              className="h-12 px-6 rounded-xl border-slate-200 hover:bg-slate-50 font-bold text-slate-700"
            >
              Back to Course
            </Button>
            <Button 
              onClick={() => navigate('/dashboard')} 
              className="h-12 px-7 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-lg shadow-brand-500/20"
            >
              View Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const allAnswered = quiz.questions?.length > 0 && Object.keys(answers).length >= quiz.questions.length;

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-xl">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
          <Clock className="h-4 w-4 text-brand-600 animate-pulse" />
          <span className="text-sm font-bold text-slate-700 font-mono">
            {formatTime(elapsedSeconds)}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-50 text-brand-700">
          <Sparkles className="h-3.5 w-3.5" /> Concept Check
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
          {quiz.title}
        </h1>
        <p className="text-sm text-slate-500">
          Answer all questions carefully. Earn up to 50 XP upon achieving mastery!
        </p>
      </div>

      <div className="space-y-6">
        {quiz.questions?.map((q: any, index: number) => {
          let options: string[] = [];
          try {
            options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
          } catch (e) {
            options = [];
          }

          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-slate-200/80 rounded-[1.75rem] overflow-hidden group hover:border-brand-300 transition-all shadow-sm">
                <CardHeader className="bg-slate-50/60 border-b border-slate-100 p-6">
                  <CardTitle className="text-base sm:text-lg font-bold flex gap-3.5 text-slate-900 font-heading items-start">
                    <span className="h-7 w-7 rounded-lg bg-brand-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="pt-0.5">{q.question}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <RadioGroup 
                    onValueChange={(val) => setAnswers({ ...answers, [q.id]: val })}
                    value={answers[q.id]}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  >
                    {options.map((opt: string) => {
                      const isSelected = answers[q.id] === opt;
                      return (
                        <div 
                          key={opt} 
                          onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                          className={cn(
                            "flex items-center space-x-3 p-4 rounded-xl border transition-all cursor-pointer",
                            isSelected 
                              ? "bg-brand-50 border-brand-400 ring-2 ring-brand-500/20 shadow-sm" 
                              : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/80"
                          )}
                        >
                          <RadioGroupItem value={opt} id={`q${q.id}-${opt}`} className="text-brand-600" />
                          <Label 
                            htmlFor={`q${q.id}-${opt}`} 
                            className="flex-1 cursor-pointer font-medium text-sm text-slate-800"
                          >
                            {opt}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="sticky bottom-6 bg-white/90 backdrop-blur p-4 rounded-2xl border border-slate-200 shadow-xl flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-600">
          Answered: <span className="text-brand-600 font-bold">{Object.keys(answers).length}</span> / {quiz.questions?.length || 0}
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={!allAnswered || submitting}
          className="bg-brand-600 hover:bg-brand-700 px-7 h-11 text-base font-bold shadow-md shadow-brand-500/20 rounded-xl"
        >
          {submitting ? 'Evaluating...' : 'Submit Answers'}
        </Button>
      </div>
    </div>
  );
}
