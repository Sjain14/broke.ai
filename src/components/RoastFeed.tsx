'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useStore } from '@/lib/store';

export default function RoastFeed() {
  const history       = useStore((s) => s.history);
  const isTyping       = useStore((s) => s.isTyping);
  const typingMessage  = useStore((s) => s.typingMessage);
  const bottomRef      = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
            {/* User expense bubble — right aligned */}
            <div className="flex justify-end">
              <div className="max-w-[75%]">
                <div className="bg-red-950 border border-red-600/60 text-red-400 rounded-2xl rounded-tr-sm px-4 py-3 shadow-lg shadow-red-950/40">
                  <p className="font-mono text-sm font-semibold tracking-wide">
                    {item.expenseName}
                  </p>
                  <p className="font-mono text-lg font-black text-red-300 mt-0.5">
                    −₹{item.amount.toLocaleString('en-IN')}
                  </p>
                </div>
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
              {item.aiRoast && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="flex justify-start"
                >
                  <div className="max-w-[80%]">
                    <div className="flex items-center gap-2 mb-1.5 ml-1">
                      <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px]">
                        🔥
                      </div>
                      <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                        Financial Interrogator
                      </span>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-2xl rounded-tl-sm px-4 py-3 shadow-md relative group/roast">
                      <p className="font-mono text-sm leading-relaxed pr-6">{item.aiRoast}</p>
                      <button
                        onClick={() => handleCopy(item.id, item.aiRoast!)}
                        className="absolute bottom-2.5 right-2.5 text-zinc-600 hover:text-white transition-colors p-1 rounded"
                        title="Copy roast"
                      >
                        {copiedId === item.id
                          ? <Check size={12} className="text-green-500" />
                          : <Copy size={12} />}
                      </button>
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
