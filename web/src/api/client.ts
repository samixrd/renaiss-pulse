/**
 * api/client.ts — Typed fetch wrappers for the Renaiss Pulse backend.
 *
 * Every function maps 1-to-1 with a backend route defined in src/server.ts.
 * Errors are thrown as ApiError instances so callers can inspect status codes.
 */

import type {
  IntentResponse,
  ConfirmResponse,
  BroadcastResponse,
  BalanceResponse,
  AddressResponse,
} from "../types";

// ─── Error Type ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  intent?: unknown;

  constructor(status: number, message: string, intent?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.intent = intent;
  }
}

// ─── Internals ───────────────────────────────────────────────────────────────

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const body: Record<string, unknown> = await res.json();

  if (!res.ok) {
    throw new ApiError(
      res.status,
      (body.error as string) ?? "Unknown error",
      body.intent,
    );
  }

  return body as T;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Step 1 — Parse natural language via QVAC and validate via WDK */
export async function postIntent(text: string): Promise<IntentResponse> {
  return request<IntentResponse>("/api/intent", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

/** Step 2 — Sign the pending intent locally (WDK) */
export async function confirmIntent(id: string): Promise<ConfirmResponse> {
  return request<ConfirmResponse>(`/api/confirm/${id}`, {
    method: "POST",
  });
}

/** Step 3 — Broadcast the signed transaction to the Tron network */
export async function broadcastIntent(id: string): Promise<BroadcastResponse> {
  return request<BroadcastResponse>(`/api/broadcast/${id}`, {
    method: "POST",
  });
}

/** Fetch wallet USDt balance */
export async function getBalance(): Promise<BalanceResponse> {
  return request<BalanceResponse>("/api/wallet/balance");
}

/** Fetch wallet public address */
export async function getAddress(): Promise<AddressResponse> {
  return request<AddressResponse>("/api/wallet/address");
}

