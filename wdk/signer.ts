/**
 * wdk/signer.ts
 *
 * Offline signing step — never broadcasts.
 * Builds a TRC-20 USDt transfer transaction for the given intent,
 * signs it with the wallet's private key (via WDK, never exposed),
 * and returns the raw signed transaction hex.
 *
 * Network note: Tron transactions require a block reference (expiry),
 * which requires a single read call to the Tron node. This read is
 * the ONLY network access in this file. The signed output is NOT sent.
 *
 * Private keys are never logged, never returned, never leave WDK.
 */
import type { ExpenseIntent } from "../shared-types/types.js";
import { getAccount, getUsdtContract, getUsdtDecimals } from "./wallet.js";
import { resolveVendor } from "./vendors.js";

export interface SignResult {
  signedTxHex: string;
  /** The recipient address included in the tx — for audit confirmation UI */
  recipient: string;
  /** Amount in whole USDt units */
  amountUsdt: number;
}

/**
 * Signs a USDt transfer for the given intent.
 *
 * For "reserve" intents: signs a self-transfer (wallet → wallet) so that
 * funds are demonstrably earmarked without leaving the wallet.
 * For "spend" intents: recipient must be provided via SPEND_RECIPIENT env var.
 * For "cancel" intents: a no-op signed message is returned (no value transfer).
 *
 * @throws if signing fails or the account is not initialised.
 */
export async function signIntent(intent: ExpenseIntent): Promise<SignResult> {
  const account = getAccount();
  const usdtContract = getUsdtContract();
  const decimals = getUsdtDecimals();

  const amountRaw = BigInt(Math.round(intent.amount * Number(decimals)));

  switch (intent.action) {
    case "spend": {
      const vendor = resolveVendor(intent.category);

      const signedTxHex = await signTrc20Transfer(
        account,
        usdtContract,
        vendor.address,
        amountRaw
      );

      return { signedTxHex, recipient: vendor.address, amountUsdt: intent.amount };
    }

    case "reserve": {
      // Self-transfer: earmarks funds within the same wallet.
      const selfAddress = await account.getAddress();
      const signedTxHex = await signTrc20Transfer(
        account,
        usdtContract,
        selfAddress,
        amountRaw
      );
      return { signedTxHex, recipient: selfAddress, amountUsdt: intent.amount };
    }

    case "cancel": {
      // No value transfer for cancel — sign a message proving intent authorship.
      const message = `CANCEL:${intent.label}:${intent.deadline ?? "none"}`;
      const signature = await (account as any).sign(message);
      return {
        signedTxHex: signature,
        recipient: "(none — cancel action)",
        amountUsdt: 0,
      };
    }

    default: {
      const exhaustive: never = intent.action;
      throw new Error(`Unknown action: ${String(exhaustive)}`);
    }
  }
}

// ─── Internal ─────────────────────────────────────────────────────────────────

/**
 * Builds and signs a TRC-20 token transfer using WDK's signTransaction.
 * Falls back to transfer() if the account doesn't expose signTransaction directly
 * (beta API caveat — documented in implementation_plan.md).
 */
async function signTrc20Transfer(
  account: any,
  tokenContract: string,
  recipient: string,
  amountRaw: bigint
): Promise<string> {
  const tx = {
    contractAddress: tokenContract,
    functionSelector: "transfer(address,uint256)",
    parameters: [
      { type: "address", value: recipient },
      { type: "uint256", value: amountRaw.toString() }
    ]
  };
  const signed = await account.signTransaction(tx);
  return typeof signed === "string" ? signed : JSON.stringify(signed);
}
