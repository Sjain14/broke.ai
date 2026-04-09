'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Pencil, Check, X } from 'lucide-react';
import { useStore, HistoryItem } from '@/lib/store';

function EditableRow({
  item,
  onSave,
  onCancel,
}: {
  item: HistoryItem;
  onSave: (name: string, amount: number) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(item.expenseName);
  const [amount, setAmount] = useState(String(item.amount));

  return (
    <tr className="bg-red-950/20 border-b border-zinc-800">
      <td className="px-3 py-2 font-mono text-[10px] text-zinc-600 whitespace-nowrap">
        {new Date(item.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
      </td>
      <td className="px-3 py-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 font-mono text-xs text-zinc-200 outline-none focus:border-red-700"
        />
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs text-zinc-600">₹</span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            className="w-20 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 font-mono text-xs text-zinc-200 outline-none focus:border-red-700"
          />
        </div>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSave(name.trim() || item.expenseName, parseFloat(amount) || item.amount)}
            className="p-1.5 rounded bg-zinc-800 hover:bg-green-900/60 border border-zinc-700 hover:border-green-700 text-zinc-400 hover:text-green-400 transition-colors"
            title="Save"
          >
            <Check size={11} />
          </button>
          <button
            onClick={onCancel}
            className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Cancel"
          >
            <X size={11} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function LedgerRow({
  item,
  onEdit,
  onDelete,
}: {
  item: HistoryItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="group border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors"
    >
      <td className="px-3 py-2.5 font-mono text-[10px] text-zinc-600 whitespace-nowrap">
        {new Date(item.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
      </td>
      <td className="px-3 py-2.5 font-mono text-xs text-zinc-300 max-w-[120px] truncate" title={item.expenseName}>
        {item.expenseName}
      </td>
      <td className="px-3 py-2.5 font-mono text-xs font-semibold text-red-400 tabular-nums whitespace-nowrap">
        −₹{item.amount.toLocaleString('en-IN')}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-500 hover:text-zinc-200 transition-colors"
            title="Edit"
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded bg-zinc-800 hover:bg-red-900/60 border border-zinc-700 hover:border-red-800 text-zinc-500 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

export default function ExpenseLedger() {
  const history = useStore((s) => s.history);
  const deleteExpense = useStore((s) => s.deleteExpense);
  const updateExpense = useStore((s) => s.updateExpense);
  const remainingBudget = useStore((s) => s.remainingBudget);
  const [editingId, setEditingId] = useState<string | null>(null);

  const totalSpent      = history.filter(i => i.type === 'expense').reduce((sum, i) => sum + i.amount, 0);
  const validExpenses   = history.filter(i => i.type === 'expense');

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Column header */}
      <div className="shrink-0 px-4 py-4 border-b border-zinc-800 bg-zinc-950">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-zinc-600 mb-1">
              Evidence Log
            </p>
            <h2 className="font-mono text-sm font-black text-zinc-300 tracking-wider uppercase">
              Financial Autopsy
            </h2>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-600">Total Damage</p>
            <p className="font-mono text-lg font-black text-red-500 tabular-nums">
              ₹{totalSpent.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {validExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16 px-6">
            <span className="text-4xl mb-3">📋</span>
            <p className="font-mono text-zinc-600 text-xs uppercase tracking-widest">
              No crimes recorded yet.
            </p>
            <p className="font-mono text-zinc-700 text-[10px] mt-1">
              Start confessing on the right →
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-zinc-950 z-10">
              <tr className="border-b border-zinc-800">
                {['Date', 'Item', 'Amount', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-600"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {[...validExpenses].reverse().map((item) =>
                  editingId === item.id ? (
                    <EditableRow
                      key={item.id}
                      item={item}
                      onSave={(name, amount) => {
                        updateExpense(item.id, name, amount);
                        setEditingId(null);
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <LedgerRow
                      key={item.id}
                      item={item}
                      onEdit={() => setEditingId(item.id)}
                      onDelete={() => deleteExpense(item.id)}
                    />
                  )
                )}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      {/* Footer summary */}
      {validExpenses.length > 0 && (
        <div className="shrink-0 border-t border-zinc-800 px-4 py-3 bg-zinc-950 flex items-center justify-between">
          <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
            {validExpenses.length} transaction{validExpenses.length !== 1 ? 's' : ''}
          </span>
          <span className={`font-mono text-xs font-bold tabular-nums ${remainingBudget() < 0 ? 'text-red-500' : 'text-zinc-400'}`}>
            ₹{remainingBudget().toLocaleString('en-IN')} left
          </span>
        </div>
      )}
    </div>
  );
}
