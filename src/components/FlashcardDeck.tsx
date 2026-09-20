import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Sparkles, 
  RotateCw, 
  Plus, 
  Brain, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Zap, 
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface FlashcardDeckProps {
  courseId: number;
}

export default function FlashcardDeck({ courseId }: FlashcardDeckProps) {
  const [cards, setCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  const [newCard, setNewCard] = useState({ front_prompt: '', back_solution: '' });
  const [openModal, setOpenModal] = useState(false);

  const fetchCards = () => {
    api.get(`/flashcards/course/${courseId}`)
      .then((data) => {
        setCards(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCards();
  }, [courseId]);

  const currentCard = cards[currentIndex] || null;

  const handleReview = async (quality: number) => {
    if (!currentCard) return;
    setReviewing(true);
    try {
      const res = await api.post(`/flashcards/${currentCard.id}/review`, { quality });
      setXpEarned(res.xpAwarded);
      setTimeout(() => setXpEarned(null), 2500);

      // Advance to next card
      setIsFlipped(false);
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(0);
      }
      fetchCards();
    } catch (err) {
      console.error(err);
    } finally {
      setReviewing(false);
    }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/flashcards', {
        course_id: courseId,
        front_prompt: newCard.front_prompt,
        back_solution: newCard.back_solution,
      });
      setNewCard({ front_prompt: '', back_solution: '' });
      setOpenModal(false);
      fetchCards();
    } catch (err) {
      console.error(err);
      alert('Failed to create flashcard');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <Brain className="h-8 w-8 animate-pulse text-brand-500 mb-2" />
        <p className="text-sm">Loading SM-2 memory deck...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700">
            <Brain className="h-3 w-3" /> SuperMemo-2 (SM-2) Spaced Repetition
          </div>
          <h3 className="text-xl font-bold text-slate-900 font-heading mt-1">
            Active Recall Flashcards
          </h3>
          <p className="text-xs text-slate-500">
            Scientifically spaced intervals to lock fundamental concepts into long-term memory.
          </p>
        </div>

        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogTrigger>
            <Button size="sm" variant="outline" className="rounded-xl border-slate-200 text-xs font-bold gap-1.5 hover:bg-slate-50">
              <Plus className="h-3.5 w-3.5 text-brand-600" />
              Add Card
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-[2rem] p-6 bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold font-heading">Add Memory Flashcard</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCard} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Question / Front Prompt</Label>
                <textarea
                  required
                  placeholder="e.g. What is the difference between TCP and UDP?"
                  value={newCard.front_prompt}
                  onChange={(e) => setNewCard({ ...newCard, front_prompt: e.target.value })}
                  className="w-full h-24 p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Answer / Solution</Label>
                <textarea
                  required
                  placeholder="Key explanation to recall..."
                  value={newCard.back_solution}
                  onChange={(e) => setNewCard({ ...newCard, back_solution: e.target.value })}
                  className="w-full h-24 p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                />
              </div>
              <Button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 font-bold rounded-xl text-xs h-10">
                Save Flashcard
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Flashcard Area */}
      {cards.length > 0 && currentCard ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Card {currentIndex + 1} of {cards.length}</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-slate-600">
                <Clock className="h-3.5 w-3.5 text-brand-500" />
                Interval: {currentCard.interval_days}d
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <TrendingUp className="h-3.5 w-3.5 text-indigo-500" />
                EF: {currentCard.ease_factor}
              </span>
            </div>
          </div>

          {/* Interactive Card */}
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="relative w-full min-h-[260px] bg-white rounded-3xl border-2 border-slate-200 hover:border-brand-300 transition-all p-8 flex flex-col justify-between cursor-pointer shadow-md group select-none"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-widest">
                {isFlipped ? '💡 Solution / Answer' : '❓ Prompt / Question'}
              </span>
              <span className="text-[11px] font-semibold text-brand-600 group-hover:underline flex items-center gap-1">
                <RotateCw className="h-3 w-3" />
                Click to flip
              </span>
            </div>

            <div className="my-auto py-4 text-center">
              <p className={cn(
                "leading-relaxed transition-all font-medium",
                isFlipped ? "text-slate-800 text-sm sm:text-base text-left whitespace-pre-wrap font-sans" : "text-slate-900 text-lg sm:text-xl font-bold font-heading"
              )}>
                {isFlipped ? currentCard.back_solution : currentCard.front_prompt}
              </p>
            </div>

            <div className="text-center text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              {isFlipped ? 'Rate your recall difficulty below' : 'Think of the answer, then click to check'}
            </div>
          </div>

          {/* XP Popup toast */}
          <AnimatePresence>
            {xpEarned && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs shadow-sm">
                  <Zap className="h-3.5 w-3.5 text-amber-600 fill-amber-500" />
                  +{xpEarned} XP Earned!
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SM-2 Recall Feedback Buttons */}
          {isFlipped && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-4 gap-2 pt-2"
            >
              <Button
                disabled={reviewing}
                onClick={() => handleReview(1)}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl h-12 flex flex-col items-center justify-center p-1"
              >
                <span className="font-bold text-xs">Again</span>
                <span className="text-[9px] opacity-75 font-mono">1d (Reset)</span>
              </Button>
              <Button
                disabled={reviewing}
                onClick={() => handleReview(3)}
                className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-2xl h-12 flex flex-col items-center justify-center p-1"
              >
                <span className="font-bold text-xs">Hard</span>
                <span className="text-[9px] opacity-75 font-mono">Slow</span>
              </Button>
              <Button
                disabled={reviewing}
                onClick={() => handleReview(4)}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-2xl h-12 flex flex-col items-center justify-center p-1"
              >
                <span className="font-bold text-xs">Good</span>
                <span className="text-[9px] opacity-75 font-mono">Standard</span>
              </Button>
              <Button
                disabled={reviewing}
                onClick={() => handleReview(5)}
                className="bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-2xl h-12 flex flex-col items-center justify-center p-1"
              >
                <span className="font-bold text-xs">Easy</span>
                <span className="text-[9px] opacity-75 font-mono">Fast</span>
              </Button>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 p-6 space-y-3">
          <BookOpen className="h-8 w-8 text-slate-300 mx-auto" />
          <p className="text-slate-600 font-bold text-sm">No flashcards created for this course yet.</p>
          <p className="text-slate-400 text-xs">Click "Add Card" above to build your active recall deck.</p>
        </div>
      )}
    </div>
  );
}
