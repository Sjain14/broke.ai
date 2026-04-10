'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Copy, Check, RotateCcw } from 'lucide-react';
import { useStore, HistoryItem } from '@/lib/store';
import { generateToxicRoast } from '@/lib/gemini';
import ReactMarkdown from 'react-markdown';

export default function RoastFeed() {
  const history       = useStore((s) => s.history);
  const isTyping       = useStore((s) => s.isTyping);
  const typingMessage  = useStore((s) => s.typingMessage);
  const bottomRef      = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const setAiRoast     = useStore((s) => s.setAiRoast);
  const setSummary     = useStore((s) => s.setSummary);
  const setExpenseError = useStore((s) => s.setExpenseError);
  const remainingBudget = useStore((s) => s.remainingBudget);
  const totalBudget    = useStore((s) => s.salary - s.fixedExpenses - s.investments);
  const daysLeft       = useStore((s) => s.daysLeft);
  const toxicityLevel  = useStore((s) => s.toxicityLevel);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTweet = (amount: number, roast: string) => {
    const tweetText = encodeURIComponent(
      `BROKE.AI just destroyed my financial ego for spending \u20b9${amount} \uD83D\uDC80\n\n"${roast}"\n\nBuilt at #Hackathon`
    );
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
  };

  const handleRetry = async (item: HistoryItem) => {
    const setIsTyping = useStore.getState().setIsTyping;
    setIsTyping(true, "Retrying the interrogation...");
    
    try {
      const historyObj = useStore.getState().history;
      const recentContext = historyObj.slice(-3).map(h => ({ item: h.summary || h.expenseName, amount: h.amount }));

      const aiData = await generateToxicRoast(
        item.amount,
        item.expenseName,
        remainingBudget(),
        daysLeft(),
        totalBudget,
        item.type === 'help' ? 'help' : 'expense',
        recentContext,
        toxicityLevel
      );
      setAiRoast(item.id, aiData.roast);
      setSummary(item.id, aiData.summarizedItem);
    } catch {
      setExpenseError(item.id);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin scrollbar-track-zinc-950 scrollbar-thumb-zinc-800">
      {history.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-full text-center py-20"
        >
          <span className="text-5xl mb-4">🩸</span>
          <p className="font-mono text-zinc-600 text-sm tracking-widest uppercase">
            No confessions yet.
          </p>
          <p className="font-mono text-zinc-700 text-xs mt-1">
            Every rupee you waste will be documented here.
          </p>
        </motion.div>
      )}

      <AnimatePresence initial={false}>
        {history.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-2"
          >
            {/* User bubble — right aligned */}
            <div className="flex justify-end">
              <div className="max-w-[75%]">
                {item.amount === 0 ? (
                  <div className="bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-2xl rounded-tr-sm px-4 py-3 text-sm font-mono break-words">
                    {item.expenseName}
                  </div>
                ) : (
                  <div className="bg-red-950 border border-red-600/60 text-red-400 rounded-2xl rounded-tr-sm px-4 py-3 shadow-lg shadow-red-950/40 break-words">
                    <p className="font-mono text-sm font-semibold tracking-wide">
                      {item.expenseName}
                    </p>
                    <p className="font-mono text-lg font-black text-red-300 mt-0.5">
                      −₹{item.amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
                <p className="text-right text-[10px] font-mono text-zinc-700 mt-1 pr-1">
                  {new Date(item.timestamp).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {/* AI roast bubble — left aligned */}
            <AnimatePresence>
              {(item.status === 'success' || item.status === 'error') && (item.aiRoast || item.status === 'error') && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="flex justify-start"
                >
                  <div className="max-w-[80%]">
                    <div className="flex items-center gap-2 mb-1.5 ml-1">
                      <div className={`w-5 h-5 rounded-full bg-zinc-800 border flex items-center justify-center text-[10px] ${item.status === 'error' ? 'border-red-900/50' : 'border-zinc-700'}`}>
                        {item.status === 'error' ? '🔌' : '🔥'}
                      </div>
                      <span className={`text-[10px] font-mono uppercase tracking-widest ${item.status === 'error' ? 'text-red-500/80' : 'text-zinc-600'}`}>
                        {item.status === 'error' ? 'Connection Failed' : 'Financial Interrogator'}
                      </span>
                    </div>
                    <div className={`border text-zinc-300 rounded-2xl rounded-tl-sm px-4 py-3 shadow-md relative group/roast ${item.status === 'error' ? 'bg-red-950/20 border-red-900/30' : 'bg-zinc-900 border-zinc-800'}`}>
                      <div className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed space-y-2 prose-strong:text-white prose-strong:font-bold prose-em:italic prose-ol:pl-4 prose-ul:pl-4 prose-li:my-0.5 pr-14">
                        {item.status === 'error' ? (
                          <>
                            <p className="text-red-400">Even my servers can't handle how broke you are. Connection failed.</p>
                            <p className="text-[10px] text-zinc-500 italic mt-3 opacity-80 border-t border-zinc-800 pt-2">
                              ⚠️ High global demand (503). Retrying with the same data might work, or use a Custom API Key in Settings.
                            </p>
                          </>
                        ) : (
                          <ReactMarkdown>{item.aiRoast!}</ReactMarkdown>
                        )}
                      </div>
                      <div className="absolute top-2.5 right-2 flex flex-col items-center gap-1">
                        {item.status === 'error' ? (
                          <button
                            onClick={() => handleRetry(item)}
                            disabled={isTyping}
                            className="text-red-500 hover:text-red-400 bg-red-500/10 p-1.5 rounded-md animate-pulse disabled:opacity-50"
                            title="Retry Roast"
                          >
                            <RotateCcw className={`w-4 h-4 ${isTyping ? 'animate-spin' : ''}`} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleTweet(item.amount, item.aiRoast!)}
                            className="text-zinc-600 hover:text-sky-400 transition-colors p-1 rounded"
                            title="Share on Twitter"
                          >
                            {/* X / Twitter logo */}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L2.25 2.25h6.737l4.253 5.622 5.004-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117Z" />
                            </svg>
                          </button>
                        )}
                        {item.status === 'success' && (
                          <button
                            onClick={() => handleCopy(item.id, item.aiRoast!)}
                            className="text-zinc-600 hover:text-white transition-colors p-1 rounded"
                            title="Copy roast"
                          >
                            {copiedId === item.id
                              ? <Check size={12} className="text-green-500" />
                              : <Copy size={12} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Typing indicator */}
      <AnimatePresence>
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className="flex justify-start"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px]">
                🔥
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <span className="text-[11px] font-mono text-red-400 tracking-widest animate-pulse">
                  {typingMessage}
                </span>
                <span className="flex gap-1 items-end">
                  {[0, 0.15, 0.3].map((delay, i) => (
                    <motion.span
                      key={i}
                      className="w-1 h-1 bg-red-500 rounded-full inline-block"
                      animate={{ opacity: [0.2, 1, 0.2], y: [0, -3, 0] }}
                      transition={{ duration: 0.9, repeat: Infinity, delay }}
                    />
                  ))}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={bottomRef} />
    </div>
  );
}
