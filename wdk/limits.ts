/**
 * Per-category spend limits enforced by the validation layer.
 * Override any limit via env vars: SPEND_LIMIT_TICKETS, etc.
 * Values are in whole USDt units.
 */
export const SPEND_LIMITS: Record<string, number> = {
  tickets: Number(process.env.SPEND_LIMIT_TICKETS ?? 500),
  fees:    Number(process.env.SPEND_LIMIT_FEES    ?? 300),
  travel:  Number(process.env.SPEND_LIMIT_TRAVEL  ?? 1000),
  merch:   Number(process.env.SPEND_LIMIT_MERCH   ?? 200),
  other:   Number(process.env.SPEND_LIMIT_OTHER   ?? 50),
};

/** Tron USDt (TRC-20) contract addresses */
export const TRON_USDT_CONTRACT = {
  mainnet: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
  shasta:  process.env.TRON_USDT_CONTRACT ?? "TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs",
} as const;

/** Pending store TTL: 10 minutes */
export const PENDING_TTL_MS = 10 * 60 * 1000;
