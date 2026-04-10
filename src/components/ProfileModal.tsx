'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { supabase, ensureAuth } from '@/lib/supabase';
import { CloudUpload, LogIn } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const profile         = useStore((s) => s.profile);
  const updateProfile   = useStore((s) => s.updateProfile);
  const hasSeenTour     = useStore((s) => s.hasSeenTour);
  const setGoogleToken  = useStore((s) => s.setGoogleToken);
  const setAutoBackup   = useStore((s) => s.setAutoBackup);
  const googleToken     = useStore((s) => s.googleToken);

  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');

  const isMandatory = hasSeenTour && !profile.isComplete;
  const show = isMandatory || isOpen;

  // Listen for OAuth callback — Supabase redirects back with session
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (_event === 'SIGNED_OUT' || !session) {
          setGoogleToken(null);
        } else if (session?.provider_token) {
          setGoogleToken(session.provider_token);
          const user = session.user;
          const name = user.user_metadata?.full_name || user.user_metadata?.name || '';
          const email = user.email || '';
          setAuthName(name);
          setAuthEmail(email);
          setStep(2);
          setIsLoading(false);
        }
      }
    );
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!show) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/drive.file',
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : 'https://broke-ai.vercel.app/',
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) {
      console.error('Google Sign-In error:', error.message);
      setIsLoading(false);
    }
    // Redirect happens — loading state remains until callback
  };

  const handleSkipAuth = () => {
    setStep(2);
  };

  const handleFinish = async (enableBackup: boolean) => {
    if (enableBackup) setAutoBackup(true);

    const name = authName || 'Anonymous User';
    const email = authEmail || '';

    try {
      await ensureAuth();
      await supabase.from('users').insert([{ name, email, created_at: new Date() }]);
    } catch (e) { console.error(e); }

    updateProfile(name, email);
    if (!isMandatory && onClose) onClose();
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
          key={step}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-zinc-950 border border-zinc-800 p-8 rounded-xl w-full max-w-sm space-y-6 relative"
        >
          {!isMandatory && (
            <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300">
              ✕
            </button>
          )}

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-red-500' : 'bg-zinc-800'}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-red-500' : 'bg-zinc-800'}`} />
          </div>

          {step === 1 && (
            <>
              <div>
                <h2 className="text-xl font-mono font-bold text-zinc-200">Welcome to Broke.AI</h2>
                <p className="text-xs font-mono text-zinc-500 mt-2 uppercase tracking-widest">
                  Step 1 — Identity verification
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono text-sm py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  <LogIn size={16} />
                  {isLoading ? 'Redirecting...' : 'Sign in with Google'}
                </button>

                <button
                  onClick={handleSkipAuth}
                  className="w-full text-zinc-600 hover:text-zinc-400 font-mono text-[10px] uppercase tracking-widest py-2 transition-colors"
                >
                  Skip — Continue anonymously
                </button>
              </div>

              <p className="text-zinc-500 text-xs font-mono leading-relaxed">
                🔒 We do not store financial data or API keys. All financial math is done locally in your browser.
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <h2 className="text-xl font-mono font-bold text-zinc-200">Cloud Backup</h2>
                <p className="text-xs font-mono text-zinc-500 mt-2 uppercase tracking-widest">
                  Step 2 — Never lose your financial sins
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <CloudUpload size={20} className="text-red-500 shrink-0" />
                  <div>
                    <p className="font-mono text-sm text-zinc-300">Google Drive Backup</p>
                    <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest mt-0.5">
                      {googleToken ? 'Connected — ready to sync' : 'Requires Google Sign-In'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handleFinish(true)}
                  disabled={!googleToken}
                  className="w-full bg-red-900/60 hover:bg-red-800/70 border border-red-800/60 text-red-300 font-mono text-[10px] uppercase tracking-widest py-3 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Enable Auto-Backup
                </button>

                <button
                  onClick={() => handleFinish(false)}
                  className="w-full text-zinc-600 hover:text-zinc-400 font-mono text-[10px] uppercase tracking-widest py-2 transition-colors"
                >
                  Maybe Later
                </button>
              </div>

              <p className="text-zinc-500 text-xs font-mono leading-relaxed">
                Backup is stored as <span className="text-zinc-400">broke_ai_backup.json</span> in your own Google Drive. Only you can access it.
              </p>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
