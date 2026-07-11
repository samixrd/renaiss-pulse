// ─── Shared Types (frontend mirror of shared-types/types.ts) ─────────────────

export type IntentAction = "reserve" | "spend" | "cancel";

export interface ExpenseIntent {
  action: IntentAction;
  amount: number;
  currency: "USDt";
  label: string;
  category: string;
  deadline: string | null;
}

// ─── API Response Shapes ─────────────────────────────────────────────────────

/** POST /api/intent — 202 success */
export interface IntentResponse {
  intent: ExpenseIntent;
  pendingId: string;
  expiresAt: string;
  vendorLabel?: string;
  message: string;
}

/** POST /api/confirm/:id — 200 success */
export interface ConfirmResponse {
  intent: ExpenseIntent;
  signedTxHex: string;
  recipient: string;
  amountUsdt: number;
  vendorLabel?: string;
  message: string;
}

/** POST /api/broadcast/:id — 200 success */
export interface BroadcastResponse {
  txId: string;
  network: string;
  intent: ExpenseIntent;
  message: string;
}

/** GET /api/wallet/balance */
export interface BalanceResponse {
  balance: number;
  currency: "USDt";
}

/** GET /api/wallet/address */
export interface AddressResponse {
  address: string;
}

// ─── Client-side History (not persisted on server) ───────────────────────────

export interface HistoryEntry {
  intent: ExpenseIntent;
  txId: string;
  network: string;
  timestamp: string;
}
