import { useState } from "react";
import { postIntent, ApiError } from "../api/client";
import ErrorBanner from "../components/ErrorBanner";
import type { IntentResponse } from "../types";

interface CommandScreenProps {
  onIntentParsed: (response: IntentResponse) => void;
}

const EXAMPLES = [
  "Reserve 20 USDt for tickets",
  "Spend 5 USDt on travel expenses",
  "Reserve 50 USDt for merch",
];

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
    <div className="space-y-6 relative">
      {/* Subtle Pitch Pattern Background */}
      <div className="absolute inset-0 bg-pitch-pattern opacity-[0.08] pointer-events-none rounded-xl" />

      <div className="relative">
        <h1 className="text-2xl font-bold tracking-tight">New Command</h1>
        <p className="text-subtle text-sm mt-1">
          Describe your financial intent in natural language. QVAC will parse it
          on-device.
        </p>
      </div>

      {error && (
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
    </div>
  );
}
