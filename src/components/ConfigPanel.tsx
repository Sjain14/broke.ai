'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
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
  const { salary, fixedExpenses, investments, payday, updateSettings } = useStore();

  const [localSalary, setLocalSalary] = useState(String(salary));
  const [localFixed, setLocalFixed] = useState(String(fixedExpenses));
  const [localInvest, setLocalInvest] = useState(String(investments));
  const [localPayday, setLocalPayday] = useState(
    payday.toISOString().split('T')[0]
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
    <div className="border-t border-zinc-800 bg-zinc-900/40 px-5 py-5 space-y-5">
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
    </div>
  );
}
