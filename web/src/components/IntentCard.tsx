import type { ExpenseIntent } from "../types";

interface IntentCardProps {
  intent: ExpenseIntent;
}

const actionColors: Record<string, string> = {
  reserve: "bg-accent/15 text-accent",
  spend: "bg-warning/15 text-warning",
  cancel: "bg-danger/15 text-danger",
};

export default function IntentCard({ intent }: IntentCardProps) {
  const rows: [string, string][] = [
    ["Amount", `${intent.amount.toFixed(2)} ${intent.currency}`],
    ["Label", intent.label],
    ["Category", intent.category],
    ["Deadline", intent.deadline ?? "—"],
  ];

  return (
    <div className="rounded-xl border border-edge bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-faint">
          Parsed Intent
        </h3>
        <span
          className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${
            actionColors[intent.action] ?? "bg-elevated text-subtle"
          }`}
        >
          {intent.action}
        </span>
      </div>

      <div className="space-y-3">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between py-1 border-b border-edge/50 last:border-0"
          >
            <span className="text-sm text-subtle">{label}</span>
            <span className="text-sm font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
