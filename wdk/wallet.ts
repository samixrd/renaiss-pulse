/**
 * wdk/wallet.ts
 *
 * Wallet lifecycle: init, address, balance.
 * Private keys NEVER leave this module.
 * - No key material is logged.
 * - wdk.dispose() is called in all finally blocks.
 */
import WDK from "@tetherto/wdk";
import WalletManagerTron from "@tetherto/wdk-wallet-tron";
import { decrypt } from "@tetherto/wdk-utils";
import { TRON_USDT_CONTRACT } from "./limits.js";

// ─── Constants ───────────────────────────────────────────────────────────────

const TRON_CHAIN_ID = process.env.TRON_CHAIN_ID ?? "2494104990"; // Shasta testnet
const USDT_CONTRACT =
  TRON_CHAIN_ID === "728126428"
    ? TRON_USDT_CONTRACT.mainnet
    : TRON_USDT_CONTRACT.shasta;

// USDt uses 6 decimal places on Tron
const USDT_DECIMALS = 1_000_000n;

// ─── Module-level singleton ───────────────────────────────────────────────────

let _wdk: InstanceType<typeof WDK> | null = null;
let _account: Awaited<ReturnType<InstanceType<typeof WDK>["getAccount"]>> | null = null;
let _address: string | null = null;

// ─── Init ─────────────────────────────────────────────────────────────────────

/**
 * Called once at server startup.
 * Reads WALLET_ENCRYPTED_SEED + WALLET_PASSWORD from env,
 * decrypts the seed with AES-256-GCM, and derives the Tron account at index 0.
 *
 * Both env vars are required. The server will not start without them.
 */
export async function initWallet(): Promise<void> {
  const seed = await resolveSeed();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wdkInstance = (new WDK(seed) as any).registerWallet("tron", WalletManagerTron, {
    chainId: TRON_CHAIN_ID,
    provider: process.env.TRON_NODE_URL ?? "https://api.shasta.trongrid.io",
  });
  _wdk = wdkInstance;
  _account = await _wdk!.getAccount("tron", 0);
  _address = await _account.getAddress();

  console.log(`[wdk] Wallet initialised. Tron address: ${_address}`);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getAddress(): string {
  assertInitialised();
  return _address!;
}

/**
 * Returns the USDt balance of the wallet in whole USDt units (as a number).
 * The on-chain value is expressed in the smallest unit (6 decimals).
 */
export async function getBalance(): Promise<number> {
  assertInitialised();
  // WalletAccount.getBalance() returns native TRX balance.
  // For TRC-20 USDt we use transfer's underlying token query instead.
  // We call a low-level balanceOf via the account's provider.
  const rawBalance: bigint = await (_account as any).getTokenBalance(USDT_CONTRACT);
  return Number(rawBalance) / Number(USDT_DECIMALS);
}

/**
 * Returns the internal account object for use by signer.ts ONLY.
 * Must not be exported from wdk/index.ts.
 */
export function getAccount(): Awaited<ReturnType<InstanceType<typeof WDK>["getAccount"]>> {
  assertInitialised();
  return _account!;
}

export function getUsdtContract(): string {
  return USDT_CONTRACT;
}

export function getUsdtDecimals(): bigint {
  return USDT_DECIMALS;
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function assertInitialised(): void {
  if (!_wdk || !_account || !_address) {
    throw new Error("[wdk] Wallet not initialised. Call initWallet() at server startup.");
  }
}

/**
 * Decrypts the wallet seed from WALLET_ENCRYPTED_SEED + WALLET_PASSWORD.
 * These are the only accepted source of the seed — there is no plaintext fallback.
 * AES-256-GCM + scrypt via @tetherto/wdk-utils.
 */
async function resolveSeed(): Promise<string> {
  const encryptedSeed = process.env.WALLET_ENCRYPTED_SEED;
  const password = process.env.WALLET_PASSWORD;

  if (!encryptedSeed || !password) {
    throw new Error(
      "[wdk] WALLET_ENCRYPTED_SEED and WALLET_PASSWORD must both be set. " +
        "Run `npm run wallet:setup` to generate an encrypted seed."
    );
  }

  try {
    const parsedPayload = JSON.parse(encryptedSeed);
    // decrypt() is synchronous and returns a string
    return (decrypt as any)(parsedPayload, password) as string;
  } catch (err) {
    throw new Error(`[wdk] Failed to parse/decrypt WALLET_ENCRYPTED_SEED: ${err instanceof Error ? err.message : String(err)}`);
  }
}
