'use client';

import { motion, useAnimationControls } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';

export default function SurvivalHeader() {
  const remainingBudget = useStore((s) => s.remainingBudget);
  const daysLeft = useStore((s) => s.daysLeft);
  const history = useStore((s) => s.history); // subscribe so re-renders on expense

  const budget = remainingBudget();
  const days = daysLeft();
  const controls = useAnimationControls();
  const prevBudget = useRef(budget);

  useEffect(() => {
    if (prevBudget.current !== budget) {
      controls.start({
        scale: [1, 1.22, 0.92, 1],
        color: ['#ef4444', '#ef4444', '#ef4444', budget <= 5000 ? '#ef4444' : '#e4e4e7'],
        transition: { duration: 0.55, ease: 'easeOut' },
      });
      prevBudget.current = budget;
    }
  }, [budget, controls]);

  const isBroke = budget <= 5000;
  const spentPct = useStore((s) => {
    const base = s.salary - s.fixedExpenses - s.investments;
    if (base <= 0) return 100;
    return Math.min(100, Math.max(0, ((base - budget) / base) * 100));
  });

  return (
    <header className="w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-5 py-5 shrink-0">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-zinc-500">
          Financial_Status.exe
        </span>
        <span className={`text-[10px] font-mono tracking-widest uppercase ${days <= 3 ? 'text-red-600' : 'text-zinc-500'}`}>
          {days}d to payday
        </span>
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
              className={`text-5xl font-black leading-none font-mono tabular-nums tracking-tighter ${
                isBroke ? 'text-red-500' : 'text-zinc-200'
              }`}
            >
              {Math.abs(budget).toLocaleString('en-IN')}
              {budget < 0 && <span className="text-lg ml-1 text-red-600">deficit</span>}
            </motion.span>
          </div>
        </div>

        <motion.div
          key={isBroke ? 'broke' : 'okay'}
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="mb-1 text-3xl select-none"
        >
          {isBroke ? '💀' : '🤬'}
        </motion.div>
      </div>

      {/* Stress bar */}
      <div className="mt-4 h-[3px] w-full bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${isBroke ? 'bg-red-500' : 'bg-red-700/70'}`}
          animate={{ width: `${spentPct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">Flush</span>
        <span className="text-[9px] font-mono text-red-800 uppercase tracking-widest">Bankrupt</span>
      </div>
    </header>
  );
}
