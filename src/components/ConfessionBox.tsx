'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Send, Loader2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { generateToxicRoast, analyzeReceipt } from '@/lib/gemini';

function parseExpense(input: string): { name: string; amount: number } | null {
  const match = input.match(/[₹Rs.]?\s*(\d+(?:\.\d+)?)\s+(?:on|for|at|-)?\s*(.+)/i);
  if (match) {
    return { amount: parseFloat(match[1]), name: match[2].trim() };
  }
  const numMatch = input.match(/(\d+(?:\.\d+)?)/);
  if (numMatch) {
    const amount = parseFloat(numMatch[1]);
    const name = input.replace(numMatch[0], '').replace(/[₹Rs.on for at-]/gi, '').trim() || 'mystery purchase';
    return { amount, name };
  }
  return null;
}

export default function ConfessionBox() {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Track whether the current submission is a vision scan
  const [isScanning, setIsScanning] = useState(false);

  const addExpense         = useStore((s) => s.addExpense);
  const setSummary         = useStore((s) => s.setSummary);
  const setAiRoast         = useStore((s) => s.setAiRoast);
  const setExpenseError    = useStore((s) => s.setExpenseError);
  const setIsTyping        = useStore((s) => s.setIsTyping);
  const remainingBudget    = useStore((s) => s.remainingBudget);
  const daysLeft           = useStore((s) => s.daysLeft);

  const salary        = useStore((s) => s.salary);
  const fixedExpenses = useStore((s) => s.fixedExpenses);
  const investments   = useStore((s) => s.investments);
  const totalBudget   = salary - fixedExpenses - investments;
  const toxicityLevel = useStore((s) => s.toxicityLevel);

  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Text submission (unified command router) ──────────────────────────
  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || isSubmitting) return;
    
    if (!text.startsWith('/confess') && !text.startsWith('/status') && !text.startsWith('/help')) {
      return;
    }

    setError('');
    setIsSubmitting(true);
    setInput('');

    const budget = remainingBudget();
    const days   = daysLeft();

    // ─── /status (hardcoded, no API) ───────────────────────────────────
    if (text.startsWith('/status')) {
      const daily = days > 0 ? budget / days : budget;
      const pct   = totalBudget > 0 ? (budget / totalBudget) * 100 : 0;
      const stats = `(₹${budget} left / ${days} days, ₹${daily.toFixed(0)}/day)`;

      let msg: string;
      if      (budget < 0)                            msg = "🚨 DEFICIT: You are officially burning your savings. " + stats;
      else if (budget === 0)                          msg = "💀 BANKRUPT: Welcome to absolute zero. " + stats;
      else if (pct > 90)                              msg = "👑 BALLER: You just got paid. Don't get cocky. " + stats;
      else if (pct < 15 && days > 15)                 msg = "⚠️ RED ALERT: Starvation imminent. Half the month left and no money. " + stats;
      else if (daily < 150 && budget > 0)             msg = "🍜 MAGGI MODE: You can afford tap water and instant noodles. " + stats;
      else if (daily > 3000)                          msg = "🎩 MONOPOLY: Why are you even using a budget tracker? " + stats;
      else if (days < 5 && pct > 30)                  msg = "🍾 SURVIVOR: You actually hoarded money. Miracles happen. " + stats;
      else if (days > 25 && pct < 50)                 msg = "📉 DISASTER: The month just started and you blew half your cash. " + stats;
      else if (Math.abs(pct - 50) < 1 && days > 12)   msg = "⚖️ BALANCED: Half money, half month. Boring but safe. " + stats;
      else                                            msg = "📊 MEDIOCRE: You are surviving, but barely. " + stats;

      addExpense('Status Check', 0, 'status');
      const id = useStore.getState().history.at(-1)?.id;
      if (id) setAiRoast(id, msg);
      setIsSubmitting(false);
      return;
    }

    // ─── /confess ──────────────────────────────────────────────────────
    if (text.startsWith('/confess')) {
      const match = text.match(/\d+(?:\.\d+)?/);
      if (match) {
        const amount = parseFloat(match[0]);
        const itemName = text.replace('/confess', '').replace(/\d+(?:\.\d+)?/g, '').trim() || 'unknown';
        const budgetAfter = budget - amount;

        addExpense(itemName, amount, 'expense');
        const id = useStore.getState().history.at(-1)?.id;
        
        setIsTyping(true, 'Drafting the perfect insult...');
        try {
          const aiData = await generateToxicRoast(amount, itemName, budgetAfter, days, totalBudget, 'expense', toxicityLevel);
          if (id) {
            setAiRoast(id, aiData.roast);
            setSummary(id, aiData.summarizedItem);
          }
        } catch {
          if (id) setExpenseError(id);
        } finally {
          setIsTyping(false);
          setIsSubmitting(false);
        }
      } else {
        setError('⚠️ Add an amount to confess (e.g. /confess 500 food)');
        setIsSubmitting(false);
      }
      return;
    }

    // ─── /help ─────────────────────────────────────────────────────────
    if (text.startsWith('/help')) {
      const helpText = text.replace('/help', '').trim() || 'Asking for help';
      addExpense(helpText, 0, 'help');
      const id = useStore.getState().history.at(-1)?.id;
      
      setIsTyping(true, 'Consulting the oracle of financial doom...');
      try {
        const aiData = await generateToxicRoast(0, helpText, budget, days, totalBudget, 'help', toxicityLevel);
        if (id) {
          setAiRoast(id, aiData.roast);
          setSummary(id, aiData.summarizedItem);
        }
      } catch {
        if (id) setExpenseError(id);
      } finally {
        setIsTyping(false);
        setIsSubmitting(false);
      }
      return;
    }
  };

  // ─── Receipt image upload ───────────────────────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    setIsSubmitting(true);
    setIsScanning(true);
    setIsTyping(true, 'Scanning receipt for financial stupidity...');

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        const base64  = dataUrl.split(',')[1];
        const budget  = remainingBudget();

        const { item, amount, roast } = await analyzeReceipt(base64, file.type, budget, daysLeft(), totalBudget);

        addExpense(item, amount, 'expense');
        const latestId = useStore.getState().history.at(-1)?.id;
        if (latestId) setAiRoast(latestId, roast);
      } catch {
        setError('Receipt scan failed. Even Gemini refuses to witness your spending.');
      } finally {
        setIsTyping(false);
        setIsSubmitting(false);
        setIsScanning(false);
      }
    };

    reader.onerror = () => {
      setError('Could not read file. Typical.');
      setIsTyping(false);
      setIsSubmitting(false);
      setIsScanning(false);
    };

    reader.readAsDataURL(file);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-4 shrink-0">
      {/* Quick Actions Row */}
      <div id="quick-actions" className="flex flex-wrap gap-2 mb-2">
        <button
          onClick={() => { setInput(prev => '/confess ' + prev.replace(/^\/(confess|status|help)\s*/, '')); inputRef.current?.focus(); }}
          disabled={isSubmitting}
          className="flex-shrink-0 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs px-3 py-1.5 rounded-full hover:bg-zinc-800 hover:text-zinc-200 transition-all disabled:opacity-40"
        >
          💸 /confess
        </button>
        <button
          onClick={() => { setInput(prev => '/status ' + prev.replace(/^\/(confess|status|help)\s*/, '')); inputRef.current?.focus(); }}
          disabled={isSubmitting}
          className="flex-shrink-0 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs px-3 py-1.5 rounded-full hover:bg-zinc-800 hover:text-zinc-200 transition-all disabled:opacity-40"
        >
          📊 /status
        </button>
        <button
          onClick={() => { setInput(prev => '/help ' + prev.replace(/^\/(confess|status|help)\s*/, '')); inputRef.current?.focus(); }}
          disabled={isSubmitting}
          className="flex-shrink-0 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs px-3 py-1.5 rounded-full hover:bg-zinc-800 hover:text-zinc-200 transition-all disabled:opacity-40"
        >
          🆘 /help
        </button>
      </div>

      <AnimatePresence>
        {input.trim() !== '' && !input.trim().startsWith('/confess') && !input.trim().startsWith('/status') && !input.trim().startsWith('/help') && (
          <motion.p
            key="warning"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-red-500 font-mono text-xs mb-3 px-1 tracking-wide"
          >
            ⚠️ Start with /confess, /status, or /help
          </motion.p>
        )}
        {error && (
          <motion.p
            key="error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-red-500 font-mono text-xs mb-3 px-1 tracking-wide"
          >
            ⚠ {error}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2">
        {/* Camera button — triggers file picker */}
        <motion.label
          whileHover={{ scale: isSubmitting ? 1 : 1.08 }}
          whileTap={{ scale: isSubmitting ? 1 : 0.92 }}
          htmlFor="receipt-upload"
          title={isScanning ? 'Scanning receipt…' : isSubmitting ? 'Processing…' : 'Upload receipt'}
          className={`shrink-0 w-11 h-11 rounded-xl bg-zinc-900 border flex items-center justify-center transition-colors cursor-pointer select-none
            ${isSubmitting
              ? 'border-zinc-800 text-zinc-700 cursor-not-allowed'
              : 'border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500'
            }`}
        >
          {isScanning
            ? <Loader2 size={16} className="animate-spin text-red-500" />
            : isSubmitting
              ? <Loader2 size={16} className="animate-spin text-red-700" />
              : <Camera size={18} />
          }
          <input
            id="receipt-upload"
            type="file"
            accept="image/*"
            className="hidden"
            disabled={isSubmitting}
            onChange={handleImageUpload}
          />
        </motion.label>

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); if (error) setError(''); }}
          onKeyDown={handleKeyDown}
          disabled={isSubmitting}
          placeholder={isSubmitting ? 'Consulting the Financial Interrogator…' : 'e.g. ₹900 on mocktails'}
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 font-mono text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-red-700 focus:ring-1 focus:ring-red-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {/* Send button */}
        <motion.button
          whileHover={{ scale: isSubmitting || (input.trim() !== '' && !input.trim().startsWith('/confess') && !input.trim().startsWith('/status') && !input.trim().startsWith('/help')) ? 1 : 1.06 }}
          whileTap={{ scale: isSubmitting || (input.trim() !== '' && !input.trim().startsWith('/confess') && !input.trim().startsWith('/status') && !input.trim().startsWith('/help')) ? 1 : 0.9 }}
          onClick={handleSubmit}
          disabled={isSubmitting || (input.trim() !== '' && !input.trim().startsWith('/confess') && !input.trim().startsWith('/status') && !input.trim().startsWith('/help'))}
          className="shrink-0 w-11 h-11 rounded-xl bg-red-700 hover:bg-red-600 border border-red-600 flex items-center justify-center text-white shadow-lg shadow-red-950/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Confess your sin"
        >
          {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={16} />}
        </motion.button>
      </div>

      <p className="text-center text-[10px] font-mono text-zinc-700 mt-3 tracking-widest uppercase">
        Every purchase is a crime scene. We document all of them.
      </p>
    </div>
  );
}
