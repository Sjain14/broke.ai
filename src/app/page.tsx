import SurvivalHeader from '@/components/SurvivalHeader';
import ConfigPanel from '@/components/ConfigPanel';
import ExpenseLedger from '@/components/ExpenseLedger';
import RoastFeed from '@/components/RoastFeed';
import ConfessionBox from '@/components/ConfessionBox';

export default function Home() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_400px] h-screen overflow-hidden bg-zinc-950">

      {/* Left — Dashboard */}
      <div className="flex flex-col border-r border-zinc-800 overflow-y-auto">
        <SurvivalHeader />
        <ConfigPanel />
      </div>

      {/* Middle — Ledger */}
      <div className="flex flex-col border-r border-zinc-800 min-h-0">
        <ExpenseLedger />
      </div>

      {/* Right — Interrogation Room */}
      <div className="flex flex-col min-h-0">
        <RoastFeed />
        <ConfessionBox />
      </div>

    </div>
  );
}
