import { useState } from "react";
import { confirmIntent, broadcastIntent, ApiError } from "../api/client";
import IntentCard from "../components/IntentCard";
import StepIndicator from "../components/StepIndicator";
import ErrorBanner from "../components/ErrorBanner";
import type {
  ExpenseIntent,
  ConfirmResponse,
  BroadcastResponse,
} from "../types";

interface ConfirmScreenProps {
  intent: ExpenseIntent;
  pendingId: string;
  vendorLabel?: string;
  onSigned: (res: ConfirmResponse) => void;
  onBroadcast: (res: BroadcastResponse) => void;
  onBack: () => void;
}

type Phase = "parsed" | "signed" | "broadcast";

export default function ConfirmScreen({
  intent,
  pendingId,
  vendorLabel,
  onSigned,
  onBroadcast,
  onBack,
}: ConfirmScreenProps) {
  const [phase, setPhase] = useState<Phase>("parsed");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedHex, setSignedHex] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);

  const currentStep: 1 | 2 | 3 =
    phase === "parsed" ? 1 : phase === "signed" ? 2 : 3;

  async function handleSign() {
    setLoading(true);
    setError(null);
    try {
      const res = await confirmIntent(pendingId);
      setSignedHex(res.signedTxHex);
      setRecipient(res.recipient);
      setPhase("signed");
      onSigned(res);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Signing failed unexpectedly.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleBroadcast() {
    setLoading(true);
    setError(null);
    try {
      const res = await broadcastIntent(pendingId);
      setTxId(res.txId);
      setNetwork(res.network);
      setPhase("broadcast");
      onBroadcast(res);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Broadcast failed unexpectedly.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <StepIndicator currentStep={currentStep} />

      <IntentCard intent={intent} />

      {error && (
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      )}

      {/* ── Phase 1: Parsed — awaiting signature ───────────────────────── */}
      {phase === "parsed" && (
        <div className="space-y-3">
          {intent.action === "spend" ? (
            <p className="text-sm font-medium text-warning bg-warning/10 p-3 rounded-lg border border-warning/20">
              Paying: {vendorLabel ?? "External Vendor"}
            </p>
          ) : intent.action === "reserve" ? (
            <p className="text-sm font-medium text-accent bg-accent/10 p-3 rounded-lg border border-accent/20">
              Earmarking funds — no recipient, funds stay in your wallet.
            </p>
          ) : null}
          <p className="text-sm text-subtle">
            QVAC parsed your intent on-device. Review the details above, then
            sign with WDK.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onBack}
              disabled={loading}
              className="flex-1 rounded-xl border border-edge bg-card hover:bg-elevated text-content font-medium py-3 transition-colors disabled:opacity-50 cursor-pointer"
            >
              ← Back
            </button>
            <button
              onClick={handleSign}
              disabled={loading}
              className="flex-1 rounded-xl bg-accent hover:bg-accent-hover text-surface font-semibold py-3 transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />
                  Signing…
                </>
              ) : (
                "Confirm & Sign"
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Phase 2: Signed — awaiting broadcast ──────────────────────── */}
      {phase === "signed" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-edge bg-card p-4">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-faint mb-2">
              Signed Transaction
            </h4>
            <p className="text-xs font-mono text-subtle break-all leading-relaxed">
              {signedHex}
            </p>
            {recipient && (
              <p className="text-xs text-faint mt-2">
                Recipient:{" "}
                <span className="font-mono text-subtle">{recipient}</span>
              </p>
            )}
          </div>

          <p className="text-sm text-subtle">
            Transaction signed locally by WDK. Click below to broadcast to the
            Tron network.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onBack}
              disabled={loading}
              className="flex-1 rounded-xl border border-edge bg-card hover:bg-elevated text-content font-medium py-3 transition-colors disabled:opacity-50 cursor-pointer"
            >
              ← Cancel
            </button>
            <button
              onClick={handleBroadcast}
              disabled={loading}
              className="flex-1 rounded-xl bg-accent hover:bg-accent-hover text-surface font-semibold py-3 transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />
                  Broadcasting…
                </>
              ) : (
                "Broadcast →"
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Phase 3: Broadcast — success ──────────────────────────────── */}
      {phase === "broadcast" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-5 text-center">
            <div className="text-4xl mb-3">✓</div>
            <h3 className="text-lg font-bold text-accent mb-1">
              Transaction Broadcast
            </h3>
            <p className="text-sm text-subtle">
              Successfully submitted to {network ?? "the network"}.
            </p>
            {txId && (
              <p className="text-xs font-mono text-faint mt-3 break-all">
                TX:{" "}
                <a
                  href={`https://nile.tronscan.org/#/transaction/${txId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-accent transition-colors"
                >
                  {txId}
                </a>
              </p>
            )}
          </div>

          <button
            onClick={onBack}
            className="w-full rounded-xl bg-accent hover:bg-accent-hover text-surface font-semibold py-3 transition-all cursor-pointer"
          >
            New Command
          </button>
        </div>
      )}
    </div>
  );
}
