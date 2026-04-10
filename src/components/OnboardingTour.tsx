'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { STATUS } from 'react-joyride';

const STEPS = [
  {
    target: '#survival-header',
    title: 'The Reality Check',
    content: 'Your financial blood pressure. Watch your remaining budget drop and your projected bankruptcy date approach.',
    disableBeacon: true,
  },
  {
    target: '#config-panel',
    title: 'Your Finances',
    content: 'Set your monthly salary, fixed expenses, and payday here. Be honest — we will know if you lie.',
    disableBeacon: true,
  },
  {
    target: '#toxicity-slider',
    title: 'Interrogation Intensity',
    content: 'Choose how brutal you want the AI to be. Nuclear mode is not for the faint of heart.',
    disableBeacon: true,
  },
  {
    target: '#expense-ledger',
    title: 'The Evidence',
    content: 'Your financial autopsy. Export this to CSV or burn the evidence if the guilt gets too heavy.',
    disableBeacon: true,
  },
  {
    target: '#quick-actions',
    title: 'Talk to Broke.AI',
    content: 'Use /confess to log expenses, /status for a reality check, and /help for toxic financial advice.',
    disableBeacon: true,
  },
];

export default function OnboardingTour() {
  const hasSeenTour   = useStore((s) => s.hasSeenTour);
  const runTour       = useStore((s) => s.runTour);
  const setHasSeenTour = useStore((s) => s.setHasSeenTour);
  const setRunTour    = useStore((s) => s.setRunTour);

  // Dynamically import Joyride (SSR-safe — it accesses window)
  const [Joyride, setJoyride] = useState<any>(null);

  useEffect(() => {
    import('react-joyride').then((mod) => {
      // react-joyride exports Joyride as both default and named; handle both
      setJoyride(() => (mod as any).default ?? (mod as any).Joyride ?? Object.values(mod)[0]);
    });
  }, []);

  useEffect(() => {
    if (!hasSeenTour) {
      // Small delay so DOM targets are mounted
      const t = setTimeout(() => setRunTour(true), 800);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!Joyride) return null;
  if (hasSeenTour && !runTour) return null;

  const handleCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      setHasSeenTour(true);
      setRunTour(false);
    }
  };

  return (
    <Joyride
      steps={STEPS}
      run={runTour}
      disableBeacon={true}
      continuous
      showSkipButton
      showProgress
      scrollToFirstStep
      styles={{
        options: {
          primaryColor: '#ef4444',
          backgroundColor: '#18181b',
          textColor: '#e4e4e7',
          arrowColor: '#18181b',
          overlayColor: 'rgba(0,0,0,0.65)',
        },
        beaconInner: { backgroundColor: '#ef4444' },
        beaconOuter: { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.2)' },
        tooltip: {
          borderRadius: 12,
          padding: '16px 20px',
          fontFamily: 'monospace',
        },
        tooltipTitle: {
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#ef4444',
        },
        buttonNext: {
          borderRadius: 6,
          fontSize: 11,
          fontFamily: 'monospace',
          letterSpacing: '0.1em',
        },
        buttonSkip: {
          fontSize: 11,
          fontFamily: 'monospace',
          color: '#71717a',
        },
        buttonBack: {
          fontSize: 11,
          fontFamily: 'monospace',
          color: '#71717a',
        },
      }}
      callback={handleCallback}
    />
  );
}
