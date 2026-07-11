import { useState } from "react";
import { postIntent, ApiError } from "../api/client";
import ErrorBanner from "../components/ErrorBanner";
import WalletStatusCard from "../components/WalletStatusCard";
import SystemStatusBar from "../components/SystemStatusBar";
import type { IntentResponse } from "../types";

interface CommandScreenProps {
  onIntentParsed: (response: IntentResponse) => void;
}

const EXAMPLES = [
  "Reserve 20 USDt for tickets",
  "Spend 5 USDt on travel expenses",
  "Reserve 50 USDt for merch",
];

/** Return a time-appropriate greeting based on local hour. Pure computation. */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function CommandScreen({ onIntentParsed }: CommandScreenProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await postIntent(text.trim());
      onIntentParsed(response);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Is the backend running?");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    /* Extra bottom padding so fixed SystemStatusBar never overlaps content */
    <div className="space-y-5 relative pb-10">
      {/* Subtle Pitch Pattern Background */}
      <div className="absolute inset-0 bg-pitch-pattern opacity-[0.08] pointer-events-none rounded-xl" />

      {/* ── 1. Wallet Status Card ───────────────────────────────────────── */}
      <div className="relative">
        <WalletStatusCard />
      </div>

      {/* ── 2. Empty-state greeting (only when input is empty) ──────────── */}
      {!text && (
        <div className="relative flex flex-col items-center gap-3 py-6 text-center select-none">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center shadow-lg shadow-accent/5">
            <img src="/logo.png" alt="Renaiss Pulse" className="w-8 h-8 object-contain" />
          </div>

          {/* Greeting */}
          <div>
            <p className="text-xl font-bold tracking-tight text-content">
              {getGreeting()} ⚽
            </p>
            <p className="text-sm text-subtle mt-1 max-w-xs leading-relaxed">
              Describe what you want to reserve or spend, or try an example
              below.
            </p>
          </div>
        </div>
      )}

      {/* ── 3. Error banner (existing, untouched) ───────────────────────── */}
      {error && (
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      )}

      {/* ── 4. Form — textarea + submit (existing, untouched) ───────────── */}
      <form onSubmit={handleSubmit} className="space-y-4 relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Reserve 20 USDt for tickets"
          rows={3}
          disabled={loading}
          className="w-full rounded-xl border border-edge bg-card px-4 py-3 text-content placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none disabled:opacity-50"
          autoFocus
        />

        <button
          type="submit"
          disabled={!text.trim() || loading}
          className="w-full rounded-xl bg-accent hover:bg-accent-hover text-surface font-semibold py-3 px-6 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />
              QVAC Parsing…
            </>
          ) : (
            "Parse Intent →"
          )}
        </button>
      </form>

      {/* ── 5. Example pills (existing, untouched) ──────────────────────── */}
      <div className="relative">
        <p className="text-xs text-faint uppercase tracking-wider mb-2">
          Try an example
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setText(ex)}
              disabled={loading}
              className="text-xs border border-accent/30 bg-accent/5 hover:bg-accent/15 text-accent hover:text-accent-hover px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* ── 6. Fixed system status bar ──────────────────────────────────── */}
      <SystemStatusBar />
    </div>
  );
}
