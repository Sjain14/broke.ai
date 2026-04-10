'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Home, TrendingUp, CalendarDays, SlidersHorizontal } from 'lucide-react';
import { useStore } from '@/lib/store';

interface FieldProps {
  label: string;
  icon: React.ReactNode;
  value: number | string;
  onChange: (val: string) => void;
  prefix?: string;
  type?: string;
}

function Field({ label, icon, value, onChange, prefix, type = 'number' }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">
        <span className="text-zinc-600">{icon}</span>
        {label}
      </label>
      <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden focus-within:border-red-900 focus-within:ring-1 focus-within:ring-red-950 transition-all">
        {prefix && (
          <span className="px-3 font-mono text-sm text-zinc-600 border-r border-zinc-800">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent px-3 py-2.5 font-mono text-sm text-zinc-200 outline-none tabular-nums"
        />
      </div>
    </div>
  );
}

export default function ConfigPanel() {
  const { salary, fixedExpenses, investments, payday, updateSettings, toxicityLevel, setToxicity, setRunTour, setHasSeenTour, customApiKey, setCustomApiKey } = useStore();

  const [showKeyModal, setShowKeyModal] = useState(false);
  const [localKey, setLocalKey] = useState(customApiKey);

  const [localSalary, setLocalSalary] = useState(String(salary));
  const [localFixed, setLocalFixed] = useState(String(fixedExpenses));
  const [localInvest, setLocalInvest] = useState(String(investments));
  const [localPayday, setLocalPayday] = useState(
    new Date(payday).toISOString().split('T')[0]
  );

  const handleApply = () => {
    updateSettings({
      salary: parseFloat(localSalary) || 0,
      fixedExpenses: parseFloat(localFixed) || 0,
      investments: parseFloat(localInvest) || 0,
      payday: new Date(localPayday),
    });
  };

  const discretionary = (parseFloat(localSalary) || 0) - (parseFloat(localFixed) || 0) - (parseFloat(localInvest) || 0);

  return (
    <div id="config-panel" className="border-t border-zinc-800 bg-zinc-900/40 px-5 py-5 space-y-5">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <SlidersHorizontal size={13} className="text-red-700" />
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500">
          Financial Configuration
        </span>
      </div>

      <div className="space-y-3">
        <Field
          label="Monthly Salary"
          icon={<Wallet size={11} />}
          value={localSalary}
          onChange={setLocalSalary}
          prefix="₹"
        />
        <Field
          label="Fixed Expenses"
          icon={<Home size={11} />}
          value={localFixed}
          onChange={setLocalFixed}
          prefix="₹"
        />
        <Field
          label="SIPs / Investments"
          icon={<TrendingUp size={11} />}
          value={localInvest}
          onChange={setLocalInvest}
          prefix="₹"
        />
        <Field
          label="Next Payday"
          icon={<CalendarDays size={11} />}
          value={localPayday}
          onChange={setLocalPayday}
          type="date"
        />
      </div>

      {/* Toxicity Toggle */}
      <div id="toxicity-slider" className="space-y-2">
        <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">
          ⚗️ Interrogation Intensity
        </label>
        <div className="flex rounded-lg overflow-hidden border border-zinc-800">
          {(['passive', 'ruthless', 'nuclear'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setToxicity(level)}
              className={`flex-1 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors ${
                toxicityLevel === level
                  ? level === 'passive' ? 'bg-zinc-700 text-zinc-200'
                  : level === 'ruthless' ? 'bg-red-900/70 text-red-300'
                  : 'bg-red-950 text-red-400 font-bold'
                  : 'bg-zinc-950 text-zinc-600 hover:text-zinc-400'
              }`}
            >
              {level === 'passive' ? '😐 Passive' : level === 'ruthless' ? '🔥 Ruthless' : '☢️ Nuclear'}
            </button>
          ))}
        </div>
      </div>

      {/* Preview row */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 space-y-1">
        <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-600">
          Discretionary budget preview
        </p>
        <p className={`font-mono text-xl font-black tabular-nums ${discretionary < 0 ? 'text-red-500' : 'text-zinc-300'}`}>
          ₹{Math.abs(discretionary).toLocaleString('en-IN')}
          {discretionary < 0 && <span className="text-xs ml-1 font-normal">(over budget)</span>}
        </p>
      </div>

      {/* Apply button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={handleApply}
        className="w-full py-2.5 rounded-lg bg-red-900/60 hover:bg-red-800/70 border border-red-800/60 font-mono text-xs text-red-300 tracking-widest uppercase transition-colors"
      >
        Apply &amp; Recalculate
      </motion.button>

      <div className="flex gap-2 w-full mt-2">
        <button
          onClick={() => { setHasSeenTour(false); setRunTour(true); setTimeout(() => window.location.reload(), 100); }}
          className="flex-1 py-2 bg-zinc-900 text-zinc-500 border border-zinc-800 rounded-lg font-mono text-[10px] uppercase tracking-widest hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
        >
          📖 How to Use
        </button>
        <button
          onClick={() => setShowKeyModal(true)}
          className="flex-1 py-2 bg-zinc-900 text-zinc-500 border border-zinc-800 rounded-lg font-mono text-[10px] uppercase tracking-widest hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
        >
          🔑 Custom API Key
        </button>
      </div>

      <AnimatePresence>
        {showKeyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl w-full max-w-sm space-y-4"
            >
              <div>
                <h3 className="font-mono font-bold text-zinc-200">Bring Your Own Key</h3>
                <p className="text-[10px] font-mono text-zinc-500 mt-1 uppercase tracking-widest">
                  Override default usage limits
                </p>
              </div>

              <input
                type="password"
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 font-mono text-sm text-zinc-200 outline-none focus:border-red-700"
              />

              <p className="text-xs font-mono text-zinc-500 leading-relaxed pt-1">
                Your key is stored strictly in your browser's local storage. We do not track it.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setCustomApiKey(localKey);
                    setShowKeyModal(false);
                  }}
                  className="flex-1 bg-red-900/60 hover:bg-red-800/70 border border-red-800/60 text-red-300 font-mono text-[10px] uppercase tracking-widest py-2 rounded-lg transition-colors"
                >
                  Save Key
                </button>
                <button
                  onClick={() => {
                    setLocalKey("");
                    setCustomApiKey("");
                    setShowKeyModal(false);
                  }}
                  className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 font-mono text-[10px] uppercase tracking-widest py-2 rounded-lg transition-colors"
                >
                  Clear Default
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
