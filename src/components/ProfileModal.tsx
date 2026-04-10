'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { supabase, ensureAuth } from '@/lib/supabase';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const profile = useStore((s) => s.profile);
  const updateProfile = useStore((s) => s.updateProfile);
  const hasSeenTour = useStore((s) => s.hasSeenTour);
  
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);

  const isMandatory = hasSeenTour && !profile.isComplete;
  const show = isMandatory || isOpen;

  if (!show) return null;

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) return;

    try {
      await ensureAuth();
      await supabase.from('users').insert([{ name: name.trim(), email: email.trim(), created_at: new Date() }]);
    } catch (e) { console.error(e); }

    updateProfile(name.trim(), email.trim());
    if (!isMandatory && onClose) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
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
          {!isMandatory && (
            <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300">
               ✕
            </button>
          )}
          
          <div>
            <h2 className="text-xl font-mono font-bold text-zinc-200">User Dossier</h2>
            <p className="text-xs font-mono text-zinc-500 mt-2 uppercase tracking-widest">
              {isMandatory ? 'Required for the autopsy report' : 'Edit your profile details'}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 font-mono text-sm text-zinc-200 outline-none focus:border-red-700"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">Email Address</label>
              <input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 font-mono text-sm text-zinc-200 outline-none focus:border-red-700"
              />
            </div>
            
            <p className="text-zinc-500 text-xs font-mono pt-2 leading-relaxed">
              🔒 We do not store financial data or API keys. All financial math is done locally in your browser.
            </p>

            <button
              onClick={handleSave}
              disabled={!name.trim() || !email.trim()}
              className="w-full bg-red-900/60 hover:bg-red-800/70 border border-red-800/60 text-red-300 font-mono text-[10px] uppercase tracking-widest py-3 mt-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMandatory ? 'Acknowledge & Continue' : 'Save Changes'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
