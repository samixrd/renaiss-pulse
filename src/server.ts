import express from "express";
import type { Request, Response } from "express";
import { parseIntent } from "../qvac/parser.js";
import {
  initWallet,
  getAddress,
  getBalance,
  validateIntent,
  signIntent,
  broadcastSigned,
  createPending,
  getPending,
  attachSignedTx,
  deletePending,
} from "../wdk/index.js";
import { resolveVendor } from "../wdk/vendors.js";

const app = express();
app.use(express.json());

const PORT = process.env.PORT ?? 3001;

// ─── Startup ──────────────────────────────────────────────────────────────────

async function start() {
  try {
    await initWallet();
  } catch (err) {
    console.error("[server] Failed to initialise wallet:", err);
    console.warn(
      "[server] Continuing without wallet — /api/wallet/* and signing routes will return 503."
    );
  }

  app.listen(PORT, () => {
    console.log(`[renaiss-pulse] Backend listening on http://localhost:${PORT}`);
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/health
 */
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * GET /api/wallet/address
 * Returns the wallet's public Tron T-address. Safe to expose.
 */
app.get("/api/wallet/address", (_req: Request, res: Response) => {
  try {
    res.json({ address: getAddress() });
  } catch (err) {
    res.status(503).json({ error: walletError(err) });
  }
});

/**
 * GET /api/wallet/balance
 * Returns the wallet's USDt balance.
 */
app.get("/api/wallet/balance", async (_req: Request, res: Response) => {
  try {
    const balance = await getBalance();
    res.json({ balance, currency: "USDt" });
  } catch (err) {
    res.status(503).json({ error: walletError(err) });
  }
});

/**
 * POST /api/intent
 * Body: { text: string }
 *
 * Step 1 of 3: parses natural language → validates → creates a pending entry.
 * Does NOT sign. Does NOT touch keys.
 *
 * Response 202: { intent: ExpenseIntent, pendingId: string, expiresAt: string }
 */
app.post("/api/intent", async (req: Request, res: Response) => {
  const { text } = req.body as { text?: string };

  if (!text || typeof text !== "string" || text.trim() === "") {
    res.status(400).json({ error: "Missing or empty `text` field in request body." });
    return;
  }

  // 1. Parse via QVAC (local on-device LLM)
  let intent;
  try {
    intent = await parseIntent(text.trim());
  } catch (err) {
    res.status(422).json({ error: `NL parse failed: ${toMessage(err)}` });
    return;
  }

  // 2. Validate (balance, spend limits, duplicates)
  const validation = await validateIntent(intent);
  if (!validation.ok) {
    res.status(409).json({ error: validation.reason, intent });
    return;
  }

  // 3. Store pending — no signing yet
  const pendingId = createPending(intent);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const vendorLabel = intent.action === "spend" ? resolveVendor(intent.category).label : undefined;

  res.status(202).json({
    intent,
    pendingId,
    expiresAt,
    vendorLabel,
    message: `Intent validated. POST /api/confirm/${pendingId} to sign.`,
  });
});

/**
 * POST /api/confirm/:id
 *
 * Step 2 of 3: explicit manual confirmation — signs the pending intent locally.
 * No auto-sign. No broadcast. Network access only to fetch Tron block reference.
 *
 * Response 200: { signedTxHex: string, intent: ExpenseIntent, recipient: string }
 */
app.post("/api/confirm/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  const entry = getPending(id);
  if (!entry) {
    res.status(404).json({ error: `Pending intent not found or expired: ${id}` });
    return;
  }

  if (entry.signedTxHex !== null) {
    res.status(409).json({
      error: "This intent has already been signed. Use POST /api/broadcast/:id to broadcast.",
    });
    return;
  }

  // Re-validate at sign time (balance may have changed since Step 1)
  const validation = await validateIntent(entry.intent, id);
  if (!validation.ok) {
    res.status(409).json({ error: `Re-validation failed at sign time: ${validation.reason}` });
    return;
  }

  // Sign locally — does NOT broadcast
  let signResult;
  try {
    signResult = await signIntent(entry.intent);
  } catch (err) {
    res.status(500).json({ error: `Signing failed: ${toMessage(err)}` });
    return;
  }

  attachSignedTx(id, signResult.signedTxHex);

  const vendorLabel = entry.intent.action === "spend" ? resolveVendor(entry.intent.category).label : undefined;

  res.json({
    intent: entry.intent,
    signedTxHex: signResult.signedTxHex,
    recipient: signResult.recipient,
    amountUsdt: signResult.amountUsdt,
    vendorLabel,
    message: `Transaction signed. POST /api/broadcast/${id} to submit to network.`,
  });
});

/**
 * POST /api/broadcast/:id
 *
 * Step 3 of 3: submits the signed transaction to the Tron network.
 * This is the ONLY route that makes an outbound network call to Tron.
 *
 * Response 200: { txId: string, network: string }
 */
app.post("/api/broadcast/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  const entry = getPending(id);
  if (!entry) {
    res.status(404).json({ error: `Pending entry not found or expired: ${id}` });
    return;
  }

  if (!entry.signedTxHex) {
    res.status(409).json({
      error: `Intent has not been signed yet. POST /api/confirm/${id} first.`,
    });
    return;
  }

  let result;
  try {
    result = await broadcastSigned(entry.signedTxHex);
  } catch (err) {
    res.status(502).json({ error: `Broadcast failed: ${toMessage(err)}` });
    return;
  }

  deletePending(id);

  res.json({
    txId: result.txId,
    network: result.network,
    intent: entry.intent,
    message: "Transaction submitted to network.",
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function walletError(err: unknown): string {
  return `Wallet not available: ${toMessage(err)}`;
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

start().catch((err) => {
  console.error("[server] Fatal startup error:", err);
  process.exit(1);
});
