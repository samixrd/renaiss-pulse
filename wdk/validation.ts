/**
 * wdk/validation.ts
 *
 * Validates an ExpenseIntent against:
 *   1. Sufficient wallet balance
 *   2. Per-category spend limit
 *   3. No duplicate reservation (same label + deadline already pending)
 *
 * Returns a typed ValidationResult — never throws, never fails silently.
 */
import type { ExpenseIntent } from "../shared-types/types.js";
import { SPEND_LIMITS } from "./limits.js";
import { getBalance } from "./wallet.js";
import { hasDuplicateReservation } from "./store.js";

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

export async function validateIntent(
  intent: ExpenseIntent,
  excludePendingId?: string
): Promise<ValidationResult> {
  // ── Rule 1: Sufficient balance ──────────────────────────────────────────────
  let balance: number;
  try {
    balance = await getBalance();
  } catch (err) {
    return {
      ok: false,
      reason: `Unable to query wallet balance: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (intent.amount > balance) {
    return {
      ok: false,
      reason: `Insufficient balance: have ${balance.toFixed(6)} USDt, need ${intent.amount} USDt.`,
    };
  }

  // ── Rule 2: Per-category spend limit ────────────────────────────────────────
  const limit = SPEND_LIMITS[intent.category] ?? SPEND_LIMITS["other"];
  if (intent.amount > limit) {
    return {
      ok: false,
      reason: `Amount exceeds spend limit for category "${intent.category}": max ${limit} USDt, requested ${intent.amount} USDt.`,
    };
  }

  // ── Rule 3: No duplicate reservation ────────────────────────────────────────
  if (intent.action === "reserve") {
    if (hasDuplicateReservation(intent.label, intent.deadline, excludePendingId)) {
      return {
        ok: false,
        reason: `Duplicate reservation: a pending intent for "${intent.label}" (deadline: ${intent.deadline ?? "none"}) already exists.`,
      };
    }
  }

  return { ok: true };
}
