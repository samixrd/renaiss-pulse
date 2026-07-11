import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import CommandScreen from "./screens/CommandScreen";
import ConfirmScreen from "./screens/ConfirmScreen";
import DashboardScreen from "./screens/DashboardScreen";
import type {
  ExpenseIntent,
  IntentResponse,
  ConfirmResponse,
  BroadcastResponse,
  HistoryEntry,
} from "./types";

// ─── State types ─────────────────────────────────────────────────────────────

type Tab = "command" | "dashboard";

interface PendingState {
  intent: ExpenseIntent;
  pendingId: string;
  vendorLabel?: string;
}

// ─── App ─────────────────────────────────────────────────────────────────────

function App() {
  const [tab, setTab] = useState<Tab>("command");
  const [pending, setPending] = useState<PendingState | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const saved = localStorage.getItem("pulse_history");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("pulse_history", JSON.stringify(history));
  }, [history]);

  // Step 1 complete — QVAC parsed & WDK validated
  function handleIntentParsed(res: IntentResponse) {
    setPending({ intent: res.intent, pendingId: res.pendingId, vendorLabel: res.vendorLabel });
  }

  // Step 2 complete — WDK signed (phase tracked inside ConfirmScreen)
  function handleSigned(_res: ConfirmResponse) {
    // no-op at App level; ConfirmScreen manages its own phase state
  }

  // Step 3 complete — broadcast success → add to local history
  function handleBroadcast(res: BroadcastResponse) {
    setHistory((prev) => [
      {
        intent: res.intent,
        txId: res.txId,
        network: res.network,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  }

  // Reset → back to command input
  function handleReset() {
    setPending(null);
  }

  function handleTabChange(t: Tab) {
    setTab(t);
    if (t !== "command") setPending(null);
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar tab={tab} onTabChange={handleTabChange} />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {tab === "command" && !pending && (
          <CommandScreen onIntentParsed={handleIntentParsed} />
        )}
        {tab === "command" && pending && (
          <ConfirmScreen
            intent={pending.intent}
            pendingId={pending.pendingId}
            vendorLabel={pending.vendorLabel}
            onSigned={handleSigned}
            onBroadcast={handleBroadcast}
            onBack={handleReset}
          />
        )}
        {tab === "dashboard" && <DashboardScreen history={history} />}
      </main>
    </div>
  );
}

export default App;
