'use client';

import { useState } from 'react';
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

  const addExpense      = useStore((s) => s.addExpense);
  const setAiRoast      = useStore((s) => s.setAiRoast);
  const setIsTyping     = useStore((s) => s.setIsTyping);
  const remainingBudget = useStore((s) => s.remainingBudget);
  const daysLeft        = useStore((s) => s.daysLeft);
  
  const salary          = useStore((s) => s.salary);
  const fixedExpenses   = useStore((s) => s.fixedExpenses);
  const investments     = useStore((s) => s.investments);
  const totalBudget     = salary - fixedExpenses - investments;

  // ─── Text submission ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSubmitting) return;

    const parsed = parseExpense(trimmed);
    if (!parsed) {
      setError('Format: "₹900 on mocktails" — is reading a format too hard for you?');
      return;
    }
    if (parsed.amount <= 0) {
      setError("Negative expenses? That's not how bankruptcy works.");
      return;
    }

    setError('');
    setIsSubmitting(true);

    const budgetAfter = remainingBudget() - parsed.amount;
    addExpense(parsed.name, parsed.amount);
    setInput('');

    const latestId = useStore.getState().history.at(-1)?.id;

    setIsTyping(true, 'Drafting the perfect insult...');
    try {
      const roast = await generateToxicRoast(parsed.amount, parsed.name, budgetAfter, daysLeft(), totalBudget);
      if (latestId) setAiRoast(latestId, roast);
    } catch {
      if (latestId) setAiRoast(latestId, "Even my servers can't handle how broke you are.");
    } finally {
      setIsTyping(false);
      setIsSubmitting(false);
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

        addExpense(item, amount);
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
      <AnimatePresence>
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
          whileHover={{ scale: isSubmitting ? 1 : 1.06 }}
          whileTap={{ scale: isSubmitting ? 1 : 0.9 }}
          onClick={handleSubmit}
          disabled={isSubmitting}
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
