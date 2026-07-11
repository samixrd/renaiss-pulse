import { useState, useEffect, useCallback } from "react";
import { getBalance, getAddress } from "../api/client";
import BalanceCard from "../components/BalanceCard";
import HistoryList from "../components/HistoryList";
import type { HistoryEntry } from "../types";

interface DashboardScreenProps {
  history: HistoryEntry[];
}

export default function DashboardScreen({ history }: DashboardScreenProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate total reserved from history
  const reservedAmount = history
    .filter((e) => e.intent.action === "reserve")
    .reduce((sum, e) => sum + e.intent.amount, 0);

  const fetchWalletInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [balRes, addrRes] = await Promise.allSettled([
        getBalance(),
        getAddress(),
      ]);
      if (balRes.status === "fulfilled") {
        setBalance(balRes.value.balance);
      } else {
        setError("Could not fetch balance. Is the backend running?");
      }
      if (addrRes.status === "fulfilled") {
        setAddress(addrRes.value.address);
      }
    } catch {
      setError("Failed to connect to the backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletInfo();

    // The Nile testnet block time is ~3s. Poll a few times after mount
    // to catch the updated balance if the user just broadcasted a tx.
    const t1 = setTimeout(fetchWalletInfo, 3000);
    const t2 = setTimeout(fetchWalletInfo, 6000);
    const t3 = setTimeout(fetchWalletInfo, 9000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [fetchWalletInfo]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-subtle text-sm mt-1">
          Wallet overview and transaction history.
        </p>
      </div>

      <BalanceCard
        balance={balance}
        reservedAmount={reservedAmount}
        address={address}
        loading={loading}
        error={error}
        onRefresh={fetchWalletInfo}
      />

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-faint mb-3">
          History
        </h2>
        <HistoryList entries={history} />
      </div>
    </div>
  );
}
