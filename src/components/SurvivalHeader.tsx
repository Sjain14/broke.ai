'use client';

import { motion, useAnimationControls, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { User, MessageSquare, Star } from 'lucide-react';
import ProfileModal from '@/components/ProfileModal';
import { supabase } from '@/lib/supabase';

export default function SurvivalHeader() {
  const remainingBudget = useStore((s) => s.remainingBudget);
  const daysLeft        = useStore((s) => s.daysLeft);
  const salary          = useStore((s) => s.salary);
  const fixedExpenses   = useStore((s) => s.fixedExpenses);
  const investments     = useStore((s) => s.investments);
  const profile         = useStore((s) => s.profile);
  // Subscribe to history so component re-renders on every expense change
  useStore((s) => s.history);

  const budget   = remainingBudget();
  const days     = daysLeft();
  const controls = useAnimationControls();

  const prevBudget   = useRef(budget);
  const [isFlashing, setIsFlashing] = useState(false);
  
  const [showProfile, setShowProfile] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');

  // Starting discretionary budget (no ad-hoc expenses)
  const base = salary - fixedExpenses - investments;

  // Bankruptcy projection
  const history = useStore((s) => s.history);
  const expenses = history.filter(i => i.type === 'expense' && i.amount > 0);
  const totalSpent = salary - fixedExpenses - investments - budget;
  let bankruptcyLabel = 'Survival: Uncertain';
  if (expenses.length >= 2) {
    const first = expenses[0].timestamp;
    const daysSinceFirst = Math.max(1, (Date.now() - first) / (1000 * 60 * 60 * 24));
    const avgSpend = totalSpent / daysSinceFirst;
    if (avgSpend > 0 && budget > 0) {
      const daysUntilBroke = budget / avgSpend;
      bankruptcyLabel = `${daysUntilBroke.toFixed(1)} DAYS`;
    }
  }

  useEffect(() => {
    if (budget < prevBudget.current) {
      setIsFlashing(true);
      controls.start({
        scale: [1, 1.1, 1],
        transition: { duration: 0.45, ease: 'easeOut' },
      });
      const t = setTimeout(() => setIsFlashing(false), 500);
      prevBudget.current = budget;
      return () => clearTimeout(t);
    }
    prevBudget.current = budget;
  }, [budget, controls]);

  const isBroke    = budget <= 5000;
  const isCritical = base > 0 && budget / base < 0.15;
  const pct        = base > 0 ? (budget / base) * 100 : 0;

  const emoji =
    pct < 0   ? '🔥' :
    pct <= 5  ? '💀' :
    pct <= 25 ? '🤢' :
    pct <= 50 ? '😠' :
    pct <= 75 ? '😐' : '😌';

  const spentPct = base <= 0 ? 100 : Math.min(100, Math.max(0, ((base - budget) / base) * 100));

  return (
    <>
    <header
      id="survival-header"
      className={`w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-5 py-5 shrink-0 transition-shadow duration-700 ${
        isCritical ? 'shadow-[inset_0_0_50px_rgba(220,38,38,0.2)]' : ''
      }`}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-zinc-500">
          BROKE.AI // STATUS_CHECK
        </span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold font-mono tracking-widest uppercase text-red-400">
            {days}d to payday
          </span>
          <div className="flex items-center gap-2 border-l border-zinc-800 pl-3">
            <button
              onClick={() => setShowProfile(true)}
              className="text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              <User size={14} />
            </button>
            <button
              onClick={() => setShowFeedback(true)}
              className="text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              <MessageSquare size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Budget display */}
      <div className="flex items-end gap-3 mt-3">
        <div className="flex flex-col leading-none">
          <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-zinc-600 mb-2">
            Remaining
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-600 font-mono">₹</span>
            <motion.span
              animate={controls}
              className={`text-5xl font-black leading-none font-mono tabular-nums tracking-tighter transition-colors duration-150 ${
                isFlashing || isBroke ? 'text-red-500' : 'text-zinc-200'
              }`}
            >
              {Math.abs(budget).toLocaleString('en-IN')}
              {budget < 0 && (
                <span className="text-lg ml-1 font-normal text-red-600">deficit</span>
              )}
            </motion.span>
          </div>
        </div>

        <motion.div
          key={emoji}
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="mb-1 text-3xl select-none"
        >
          {emoji}
        </motion.div>
      </div>

      {/* Bankruptcy Projection */}
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-700">Projected Bankruptcy:</span>
        <span className={`text-[9px] font-mono font-bold tracking-widest uppercase ${
          bankruptcyLabel === 'Survival: Uncertain' ? 'text-zinc-600' : parseFloat(bankruptcyLabel) < 7 ? 'text-red-500 animate-pulse' : 'text-orange-500'
        }`}>
          {bankruptcyLabel}
        </span>
      </div>

      {/* Stress bar */}
      <div className="mt-4 h-[3px] w-full bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${isCritical ? 'bg-red-500' : isBroke ? 'bg-red-600' : 'bg-red-700/70'}`}
          animate={{ width: `${spentPct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">Flush</span>
        <span className="text-[9px] font-mono text-red-800 uppercase tracking-widest">Bankrupt</span>
      </div>
    </header>

    <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />

    <AnimatePresence>
      {showFeedback && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-zinc-950 border border-zinc-800 p-8 rounded-xl w-full max-w-sm space-y-6 relative"
          >
            <button onClick={() => setShowFeedback(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300">
              ✕
            </button>
            
            <div>
              <h2 className="text-xl font-mono font-bold text-zinc-200">Feedback</h2>
              <p className="text-xs font-mono text-zinc-500 mt-2 uppercase tracking-widest">
                How much did we hurt you?
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setFeedbackRating(star)}>
                    <Star size={24} className={star <= feedbackRating ? 'text-red-500 fill-red-500' : 'text-zinc-700'} />
                  </button>
                ))}
              </div>

              <textarea
                placeholder="Tell us your feelings..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 font-mono text-sm text-zinc-200 outline-none focus:border-red-700 resize-none"
              />

              <button
                onClick={async () => {
                  console.log('Feedback Submitted:', { rating: feedbackRating, text: feedbackText });
                  try {
                    await supabase.from('feedback').insert([{ 
                      email: profile.email, 
                      rating: feedbackRating, 
                      comment: feedbackText, 
                      created_at: new Date() 
                    }]);
                  } catch (e) { console.error(e); }
                  setShowFeedback(false);
                  setFeedbackRating(0);
                  setFeedbackText('');
                }}
                disabled={!feedbackRating || !feedbackText.trim()}
                className="w-full bg-red-900/60 hover:bg-red-800/70 border border-red-800/60 text-red-300 font-mono text-[10px] uppercase tracking-widest py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Pain
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
