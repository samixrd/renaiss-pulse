interface BalanceCardProps {
  balance: number | null;
  reservedAmount: number;
  address: string | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export default function BalanceCard({
  balance,
  reservedAmount,
  address,
  loading,
  error,
  onRefresh,
}: BalanceCardProps) {
  const available = balance !== null ? Math.max(0, balance - reservedAmount) : null;

  return (
    <div className="rounded-xl border border-edge bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-faint">
          Wallet Balance
        </h3>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-xs text-subtle hover:text-accent transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? "⟳ Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      {error ? (
        <p className="text-danger text-sm">{error}</p>
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tabular-nums tracking-tight">
              {balance !== null ? balance.toFixed(2) : "—"}
            </span>
            <span className="text-lg font-medium text-subtle">USDt</span>
          </div>
          {balance !== null && (
            <div className="flex gap-6 mt-4 pt-4 border-t border-edge/50">
              <div>
                <p className="text-[10px] text-faint uppercase tracking-widest font-semibold mb-1">Available</p>
                <p className="text-sm font-semibold text-accent">{available?.toFixed(2)} USDt</p>
              </div>
              <div>
                <p className="text-[10px] text-faint uppercase tracking-widest font-semibold mb-1">Reserved</p>
                <p className="text-sm font-semibold text-warning">{reservedAmount.toFixed(2)} USDt</p>
              </div>
            </div>
          )}
          {address && (
            <p className="mt-3 text-xs text-faint font-mono truncate">
              {address}
            </p>
          )}
        </>
      )}
    </div>
  );
}
