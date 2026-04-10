'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import SurvivalHeader from '@/components/SurvivalHeader';
import ConfigPanel from '@/components/ConfigPanel';
import ExpenseLedger from '@/components/ExpenseLedger';
import RoastFeed from '@/components/RoastFeed';
import ConfessionBox from '@/components/ConfessionBox';
import { GripVertical } from 'lucide-react';
import OnboardingTour from '@/components/OnboardingTour';
import { ensureAuth } from '@/lib/supabase';
import { backupToDrive } from '@/lib/drive';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    ensureAuth();
  }, []);

  const salary        = useStore((s) => s.salary);
  const fixedExpenses = useStore((s) => s.fixedExpenses);
  const investments   = useStore((s) => s.investments);
  const history       = useStore((s) => s.history);
  const autoBackupEnabled = useStore((s) => s.autoBackupEnabled);
  const googleToken     = useStore((s) => s.googleToken);

  useEffect(() => {
    if (!autoBackupEnabled || !googleToken) return;

    const syncTimer = setTimeout(async () => {
      try { 
        const state = useStore.getState();
        await backupToDrive(googleToken, JSON.stringify(state)); 
        console.log("Auto-backed up to Drive"); 
      } catch (e) { 
        console.error("Backup failed", e); 
      }
    }, 3000);

    return () => clearTimeout(syncTimer);
  }, [history, autoBackupEnabled, googleToken]);

  const totalBudget     = salary - fixedExpenses - investments;
  const spent           = history.reduce((acc, curr) => acc + curr.amount, 0);
  const remainingBudget = totalBudget - spent;
  const isAlert         = remainingBudget < totalBudget * 0.15;

  const [leftWidth, setLeftWidth] = useState(400);
  const [rightWidth, setRightWidth] = useState(600);

  const isDraggingLeft = useRef(false);
  const isDraggingRight = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft.current) {
        setLeftWidth(Math.max(250, Math.min(500, e.clientX)));
      }
      if (isDraggingRight.current) {
        setRightWidth(Math.max(300, Math.min(600, window.innerWidth - e.clientX)));
      }
    };

    const handleMouseUp = () => {
      isDraggingLeft.current = false;
      isDraggingRight.current = false;
      document.body.style.cursor = 'default';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (!isMounted) return <div className="h-screen bg-zinc-950" />;

  return (
    <>
      <OnboardingTour />
      <div 
        className={`h-screen overflow-hidden bg-zinc-950${isAlert ? ' alert-mode' : ''}`}
      style={{
        display: "grid",
        gridTemplateColumns: `${leftWidth}px 4px 1fr 4px ${rightWidth}px`
      }}
    >

      {/* Left — Dashboard */}
      <div className="flex flex-col overflow-y-auto h-full">
        <SurvivalHeader />
        <ConfigPanel />
      </div>

      {/* Left Divider */}
      <div
        className="w-full bg-zinc-900 border-x border-zinc-800 cursor-col-resize hover:bg-zinc-700 transition-colors flex flex-col items-center justify-center z-10 group"
        onMouseDown={() => {
          isDraggingLeft.current = true;
          document.body.style.cursor = 'col-resize';
        }}
      >
        <div className="h-8 w-1 bg-zinc-700 rounded-full group-hover:bg-white flex items-center justify-center overflow-visible relative">
          <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-100 text-zinc-950 transition-opacity absolute" />
        </div>
      </div>

      {/* Middle — Ledger */}
      <div className="flex flex-col min-h-0 h-full">
        <ExpenseLedger />
      </div>

      {/* Right Divider */}
      <div
        className="w-full bg-zinc-900 border-x border-zinc-800 cursor-col-resize hover:bg-zinc-700 transition-colors flex flex-col items-center justify-center z-10 group"
        onMouseDown={() => {
          isDraggingRight.current = true;
          document.body.style.cursor = 'col-resize';
        }}
      >
        <div className="h-8 w-1 bg-zinc-700 rounded-full group-hover:bg-white flex items-center justify-center overflow-visible relative">
          <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-100 text-zinc-950 transition-opacity absolute" />
        </div>
      </div>

      {/* Right — Interrogation Room */}
      <div className="flex flex-col min-h-0 h-full">
        <RoastFeed />
        <ConfessionBox />
      </div>

    </div>
    </>
  );
}
