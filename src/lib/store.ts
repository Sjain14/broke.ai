import { create } from 'zustand';

export interface HistoryItem {
  id: string;
  expenseName: string;
  amount: number;
  aiRoast?: string;
  timestamp: number;
}

interface Settings {
  salary: number;
  fixedExpenses: number;
  investments: number;
  payday: Date;
}

interface BudgetState extends Settings {
  history: HistoryItem[];
  isTyping: boolean;
  typingMessage: string;

  // Computed getters
  remainingBudget: () => number;
  daysLeft: () => number;

  // Actions
  addExpense: (name: string, amount: number) => void;
  deleteExpense: (id: string) => void;
  updateExpense: (id: string, newName: string, newAmount: number) => void;
  setAiRoast: (id: string, roast: string) => void;
  setIsTyping: (isTyping: boolean, message?: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
}

function defaultPayday(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}

const SEED_HISTORY: HistoryItem[] = [
  {
    id: 'seed-1',
    expenseName: 'Artisan Coffee',
    amount: 400,
    aiRoast: '₹400 for bean water? Your bloodline survived on tap water. Grow up.',
    timestamp: Date.now() - 1000 * 60 * 60 * 3,
  },
  {
    id: 'seed-2',
    expenseName: 'Farzi Cafe Apps',
    amount: 2500,
    aiRoast: "Deconstructed samosas for ₹2500? The only thing deconstructed is your credit score.",
    timestamp: Date.now() - 1000 * 60 * 30,
  },
];

export const useStore = create<BudgetState>((set, get) => ({
  salary: 100000,
  fixedExpenses: 60000,
  investments: 10000,
  payday: defaultPayday(),
  history: SEED_HISTORY,
  isTyping: false,
  typingMessage: 'Financial Interrogator is typing...',

  remainingBudget: () => {
    const { salary, fixedExpenses, investments, history } = get();
    const spent = history.reduce((sum, item) => sum + item.amount, 0);
    return salary - fixedExpenses - investments - spent;
  },

  daysLeft: () => {
    const { payday } = get();
    const now = new Date();
    const diff = payday.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  },

  addExpense: (name, amount) =>
    set((state) => ({
      history: [
        ...state.history,
        {
          id: crypto.randomUUID(),
          expenseName: name,
          amount,
          timestamp: Date.now(),
        },
      ],
    })),

  deleteExpense: (id) =>
    set((state) => ({
      history: state.history.filter((item) => item.id !== id),
    })),

  updateExpense: (id, newName, newAmount) =>
    set((state) => ({
      history: state.history.map((item) =>
        item.id === id ? { ...item, expenseName: newName, amount: newAmount } : item
      ),
    })),

  setAiRoast: (id, roast) =>
    set((state) => ({
      history: state.history.map((item) =>
        item.id === id ? { ...item, aiRoast: roast } : item
      ),
    })),

  setIsTyping: (isTyping, message) =>
    set({
      isTyping,
      typingMessage: message ?? 'Financial Interrogator is typing...',
    }),

  updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
}));
