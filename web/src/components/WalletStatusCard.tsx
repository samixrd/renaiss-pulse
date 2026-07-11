import { useState, useEffect, useCallback } from "react";
import { Wallet, Copy, Check, Wifi } from "lucide-react";
import { getBalance, getAddress } from "../api/client";

/**
 * WalletStatusCard — compact wallet overview for the Command screen.
 *
 * Reuses the same getBalance() + getAddress() fetch pattern that
 * DashboardScreen uses. No new API calls are introduced.
 */
export default function WalletStatusCard() {
  const [balance, setBalance] = useState<number | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchWalletInfo = useCallback(async () => {
    setLoading(true);
    try {
      const [balRes, addrRes] = await Promise.allSettled([
        getBalance(),
        getAddress(),
      ]);
      if (balRes.status === "fulfilled") setBalance(balRes.value.balance);
      if (addrRes.status === "fulfilled") setAddress(addrRes.value.address);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletInfo();
  }, [fetchWalletInfo]);

  // Truncate address: first 4 chars + … + last 4 chars
  function truncateAddress(addr: string): string {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  }

  async function handleCopy() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard not available — silently ignore
    }
  }

  const isReady = !loading && balance !== null;

  return (
    <div className="rounded-xl border border-edge bg-card overflow-hidden">
      {/* Top accent strip */}
      <div className="h-[2px] bg-gradient-to-r from-accent via-accent/50 to-teal/60" />

      <div className="px-5 py-4 flex items-center gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-accent" />
        </div>

        {/* Address + Balance */}
        <div className="flex-1 min-w-0">
          {/* Address row */}
          <div className="flex items-center gap-2">
            {loading ? (
              <span className="h-3 w-32 rounded bg-elevated animate-pulse inline-block" />
            ) : address ? (
              <>
                <span className="text-xs font-mono text-subtle tracking-wide">
                  {truncateAddress(address)}
                </span>
                <button
                  onClick={handleCopy}
                  title={copied ? "Copied!" : "Copy full address"}
                  className="flex-shrink-0 text-faint hover:text-accent transition-colors cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-accent" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </>
            ) : (
              <span className="text-xs text-faint font-mono">No address</span>
            )}
          </div>

          {/* Balance row */}
          <div className="flex items-baseline gap-1.5 mt-0.5">
            {loading ? (
              <span className="h-5 w-20 rounded bg-elevated animate-pulse inline-block" />
            ) : (
              <>
                <span className="text-lg font-bold tabular-nums tracking-tight text-content">
                  {balance !== null ? balance.toFixed(2) : "—"}
                </span>
                <span className="text-xs font-medium text-subtle">USDt</span>
              </>
            )}
          </div>
        </div>

        {/* Status badge */}
        <div className="flex-shrink-0">
          {isReady ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/25 text-accent text-[11px] font-semibold tracking-wide">
              <Wifi className="w-3 h-3" />
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-elevated border border-edge text-faint text-[11px] font-semibold tracking-wide">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-faint animate-pulse" />
              Fetching…
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
