/**
 * scripts/test-e2e-spend-nile.mjs
 *
 * Runs the complete end-to-end WDK "spend" flow on Nile testnet:
 * 1. POST /api/intent with { "text": "Pay 20 USDt for league fees" }
 * 2. POST /api/confirm/:id to sign offline
 * 3. POST /api/broadcast/:id to broadcast to Nile
 * 4. GET /api/wallet/balance to check new balance (should drop by 20 USDt)
 */

const API_BASE = "http://localhost:3001";

async function run() {
  console.log("=== End-to-End Nile Spend Test Flow ===");

  // --- Step 0: Get Initial Balance ---
  console.log("\n[Step 0] Fetching initial balance...");
  const balRes0 = await fetch(`${API_BASE}/api/wallet/balance`);
  const balData0 = await balRes0.json();
  console.log("Initial Balance:", JSON.stringify(balData0, null, 2));

  // --- Step 1: Parse and Validate Intent ---
  console.log("\n[Step 1] Sending spend intent command...");
  const intentRes = await fetch(`${API_BASE}/api/intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "Pay 20 USDt for league fees" }),
  });
  if (!intentRes.ok) {
    throw new Error(`Intent parsing failed: ${await intentRes.text()}`);
  }
  const intentData = await intentRes.json();
  console.log("Intent Response:", JSON.stringify(intentData, null, 2));
  const { pendingId } = intentData;

  // --- Step 2: Confirm and Sign ---
  console.log(`\n[Step 2] Confirming pendingId: ${pendingId} (signing)...`);
  const confirmRes = await fetch(`${API_BASE}/api/confirm/${pendingId}`, {
    method: "POST",
  });
  if (!confirmRes.ok) {
    throw new Error(`Confirmation failed: ${await confirmRes.text()}`);
  }
  const confirmData = await confirmRes.json();
  console.log("Confirm Response (Offline Signed):", JSON.stringify(confirmData, null, 2));

  // --- Step 3: Broadcast ---
  console.log(`\n[Step 3] Broadcasting transaction for pendingId: ${pendingId}...`);
  const broadcastRes = await fetch(`${API_BASE}/api/broadcast/${pendingId}`, {
    method: "POST",
  });
  if (!broadcastRes.ok) {
    throw new Error(`Broadcast failed: ${await broadcastRes.text()}`);
  }
  const broadcastData = await broadcastRes.json();
  console.log("Broadcast Response:", JSON.stringify(broadcastData, null, 2));
  const { txId } = broadcastData;

  // --- Step 4: Verify Balance Drop ---
  console.log("\n[Step 4] Querying post-transaction balance...");
  const balRes1 = await fetch(`${API_BASE}/api/wallet/balance`);
  const balData1 = await balRes1.json();
  console.log("Post-transaction Balance:", JSON.stringify(balData1, null, 2));

  console.log("\n=== Spend Flow Verification Success ===");
  console.log(`Nile TronScan Link: https://nile.tronscan.org/#/transaction/${txId}`);
}

run().catch((err) => {
  console.error("\n[E2E ERROR] Spend Flow failed:", err.message);
  process.exit(1);
});
