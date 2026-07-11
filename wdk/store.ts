import crypto from "node:crypto";
import type { ExpenseIntent } from "../shared-types/types.js";
import { PENDING_TTL_MS } from "./limits.js";

export interface PendingEntry {
  /** The validated intent waiting for explicit confirmation */
  intent: ExpenseIntent;
  /** Null until POST /api/confirm/:id has been called */
  signedTxHex: string | null;
  /** Epoch ms when this entry expires */
  expiresAt: number;
}

// In-memory store. Entries are lost on server restart.
// TODO: replace with SQLite / Redis for production persistence.
const store = new Map<string, PendingEntry>();

/** Create a new pending entry; returns the generated pendingId */
export function createPending(intent: ExpenseIntent): string {
  const pendingId = crypto.randomUUID();
  store.set(pendingId, {
    intent,
    signedTxHex: null,
    expiresAt: Date.now() + PENDING_TTL_MS,
  });
  return pendingId;
}

/** Retrieve a live (non-expired) pending entry, or null */
export function getPending(pendingId: string): PendingEntry | null {
  const entry = store.get(pendingId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(pendingId);
    return null;
  }
  return entry;
}

/** Attach a signed tx hex to an existing pending entry */
export function attachSignedTx(pendingId: string, signedTxHex: string): void {
  const entry = getPending(pendingId);
  if (!entry) throw new Error(`Pending entry not found or expired: ${pendingId}`);
  store.set(pendingId, { ...entry, signedTxHex });
}

/** Remove an entry after successful broadcast */
export function deletePending(pendingId: string): void {
  store.delete(pendingId);
}

/**
 * Check whether a pending RESERVE intent with the same label+deadline
 * already exists (duplicate detection).
 */
export function hasDuplicateReservation(label: string, deadline: string | null, excludePendingId?: string): boolean {
  for (const [id, entry] of store.entries()) {
    if (excludePendingId && id === excludePendingId) continue;
    if (Date.now() > entry.expiresAt) continue; // skip expired
    const { intent } = entry;
    if (
      intent.action === "reserve" &&
      intent.label.toLowerCase() === label.toLowerCase() &&
      intent.deadline === deadline
    ) {
      return true;
    }
  }
  return false;
}
