/**
 * scripts/wallet-setup.mjs
 *
 * Generates a fresh BIP-39 mnemonic and encrypts it with AES-256-GCM + scrypt
 * using @tetherto/wdk-utils. Outputs the values needed for .env.
 *
 * Usage:
 *   node scripts/wallet-setup.mjs
 *
 * The script writes WALLET_ENCRYPTED_SEED and WALLET_PASSWORD directly into
 * the .env file in the project root. It also prints the raw mnemonic ONCE
 * to stdout so you can back it up securely offline.
 *
 * ⚠  The mnemonic is your only recovery mechanism. Write it down and store it
 *    in a secure offline location before proceeding.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ENV_PATH = path.join(ROOT, ".env");

// ─── Import WDK utils ────────────────────────────────────────────────────────

const { encrypt } = await import("@tetherto/wdk-utils");

// ─── BIP-39 wordlist (built-in entropy → mnemonic) ───────────────────────────
// We generate 128 bits of entropy → 12-word mnemonic following BIP-39 spec.

const { default: bip39 } = await import("bip39").catch(() => ({ default: null }));

let mnemonic;
if (bip39) {
  mnemonic = bip39.generateMnemonic(128);
} else {
  // bip39 not installed — fall back to Node crypto for entropy, build mnemonic manually
  // (this path imports the wordlist bundled with @tetherto/wdk-utils if available)
  try {
    const { generateMnemonic } = await import("@tetherto/wdk-utils");
    mnemonic = generateMnemonic(128);
  } catch {
    // Absolute fallback: use crypto.randomBytes to produce a strong seed directly.
    // Note: not a proper BIP-39 mnemonic in this path — use only if bip39 is unavailable.
    console.error(
      "[wallet-setup] WARNING: Neither bip39 nor wdk-utils.generateMnemonic is available.\n" +
      "Install bip39: npm install bip39\n" +
      "Then re-run this script."
    );
    process.exit(1);
  }
}

// ─── Generate a strong random password (32 hex bytes = 64 chars) ─────────────

const password = crypto.randomBytes(32).toString("hex");

// ─── Encrypt ─────────────────────────────────────────────────────────────────

console.log("\n[wallet-setup] Encrypting mnemonic with AES-256-GCM + scrypt …");
const encryptedSeed = await encrypt(mnemonic, password);
const encryptedStr = typeof encryptedSeed === "string"
  ? encryptedSeed
  : JSON.stringify(encryptedSeed);

// ─── Write to .env ────────────────────────────────────────────────────────────

let envContent = "";
if (fs.existsSync(ENV_PATH)) {
  envContent = fs.readFileSync(ENV_PATH, "utf8");
}

function setEnvVar(content, key, value) {
  const regex = new RegExp(`^${key}=.*$`, "m");
  const line = `${key}=${value}`;
  return regex.test(content) ? content.replace(regex, line) : `${content}\n${line}`;
}

envContent = setEnvVar(envContent, "WALLET_ENCRYPTED_SEED", encryptedStr);
envContent = setEnvVar(envContent, "WALLET_PASSWORD", password);

fs.writeFileSync(ENV_PATH, envContent, "utf8");

// ─── Output ───────────────────────────────────────────────────────────────────

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║             WALLET SETUP COMPLETE — READ CAREFULLY          ║");
console.log("╚══════════════════════════════════════════════════════════════╝");
console.log("\n⚠  YOUR MNEMONIC (back this up securely — shown only once):");
console.log("─".repeat(64));
console.log(`   ${mnemonic}`);
console.log("─".repeat(64));
console.log("\n✅  WALLET_ENCRYPTED_SEED and WALLET_PASSWORD written to .env");
console.log("✅  The raw mnemonic is NOT stored anywhere in this project.\n");
console.log("Next steps:");
console.log("  1. Write down the mnemonic above and store it offline safely.");
console.log("  2. Run `npm run dev:backend` to start the server.");
console.log("  3. GET /api/wallet/address to see your Tron address.");
console.log("  4. Fund it on Shasta testnet at https://www.trongrid.io/shasta\n");
