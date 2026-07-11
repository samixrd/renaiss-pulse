/**
 * wdk/broadcaster.ts
 *
 * The ONLY file in this codebase that makes outbound network calls to the Tron node.
 * All other WDK code is offline-only.
 *
 * Receives a pre-signed transaction hex produced by signer.ts and submits it
 * to the Tron network. Returns the transaction ID on success.
 *
 * This step is always explicit — never called automatically.
 */
import { getAccount } from "./wallet.js";

export interface BroadcastResult {
  txId: string;
  network: string;
}

/**
 * Broadcasts a pre-signed TRC-20 transaction to the Tron network.
 *
 * @param signedTxHex The signed transaction produced by signer.ts
 * @throws on network error or transaction rejection
 */
export async function broadcastSigned(signedTxHex: string): Promise<BroadcastResult> {
  const account = getAccount();
  const nodeUrl = process.env.TRON_NODE_URL ?? "https://api.shasta.trongrid.io";

  // WDK preferred path: account.broadcastTransaction()
  if (typeof (account as any).broadcastTransaction === "function") {
    const result = await (account as any).broadcastTransaction(signedTxHex);
    const txId: string = result?.txId ?? result?.transaction_id ?? result?.id ?? String(result);
    return { txId, network: nodeUrl };
  }

  // Fallback: direct Tron broadcast endpoint
  const parsed = parseSignedTx(signedTxHex);
  const response = await fetch(`${nodeUrl}/wallet/broadcasttransaction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Tron broadcast failed [${response.status}]: ${body}`);
  }

  const data = (await response.json()) as { result?: boolean; txid?: string; message?: string };
  if (!data.result) {
    throw new Error(`Tron broadcast rejected: ${data.message ?? JSON.stringify(data)}`);
  }

  return { txId: data.txid ?? "unknown", network: nodeUrl };
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function parseSignedTx(signedTxHex: string): unknown {
  try {
    return JSON.parse(signedTxHex);
  } catch {
    // Already raw hex — wrap in the standard Tron broadcast envelope
    return { raw_data_hex: signedTxHex };
  }
}
