import { Ticket, Receipt, Plane, Shirt, CircleDashed, Lock } from "lucide-react";
import type { HistoryEntry } from "../types";

interface HistoryListProps {
  entries: HistoryEntry[];
}

const CATEGORIES = ["tickets", "fees", "travel", "merch"];

const CategoryIcon = ({ category }: { category: string }) => {
  switch (category) {
    case "tickets":
      return <Ticket className="w-4 h-4 mr-2 inline-block" />;
    case "fees":
      return <Receipt className="w-4 h-4 mr-2 inline-block" />;
    case "travel":
      return <Plane className="w-4 h-4 mr-2 inline-block" />;
    case "merch":
      return <Shirt className="w-4 h-4 mr-2 inline-block" />;
    default:
      return <CircleDashed className="w-4 h-4 mr-2 inline-block" />;
  }
};

export default function HistoryList({ entries }: HistoryListProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-edge bg-card p-8 text-center">
        <p className="text-subtle text-sm">No transactions yet.</p>
        <p className="text-faint text-xs mt-1">
          Completed broadcasts will appear here.
        </p>
      </div>
    );
  }

  // Group by category — known categories first, then any extras
  const grouped = new Map<string, HistoryEntry[]>();

  for (const cat of CATEGORIES) {
    const items = entries.filter(
      (e) => e.intent.category.toLowerCase() === cat,
    );
    if (items.length > 0) grouped.set(cat, items);
  }

  const otherEntries = entries.filter(
    (e) => !CATEGORIES.includes(e.intent.category.toLowerCase()),
  );
  if (otherEntries.length > 0) grouped.set("other", otherEntries);

  return (
    <div className="space-y-4">
      {Array.from(grouped.entries()).map(([category, items]) => (
        <div
          key={category}
          className="rounded-xl border border-edge bg-card overflow-hidden"
        >
          <div className="px-4 py-3 bg-elevated/50 border-b border-edge flex items-center">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-subtle flex items-center">
              <CategoryIcon category={category} /> {category}
            </h4>
          </div>
          <div className="divide-y divide-edge/50">
            {items.map((entry) => (
              <div
                key={entry.txId}
                className="px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    {entry.intent.action === "reserve" && (
                      <span className="flex items-center gap-1 text-[9px] uppercase font-bold tracking-widest text-warning bg-warning/10 px-1.5 py-0.5 rounded">
                        <Lock className="w-2.5 h-2.5" /> Earmarked
                      </span>
                    )}
                    <p className="text-sm font-medium leading-none">
                      {entry.intent.action.toUpperCase()}{" "}
                      {entry.intent.amount.toFixed(2)} {entry.intent.currency}
                    </p>
                  </div>
                  <p className="text-xs text-faint mt-0.5">
                    {entry.intent.label}
                  </p>
                </div>
                <div className="text-right">
                  <a
                    href={`https://nile.tronscan.org/#/transaction/${entry.txId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-subtle underline hover:text-accent transition-colors inline-block"
                  >
                    {entry.txId.slice(0, 8)}…{entry.txId.slice(-6)}
                  </a>
                  <p className="text-[11px] text-faint mt-0.5">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
