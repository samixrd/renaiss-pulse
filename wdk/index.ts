/**
 * wdk/index.ts — Public exports for the WDK layer.
 *
 * Deliberately does NOT export getAccount() — that is internal to wdk/wallet.ts
 * and wdk/signer.ts only. Private key material never escapes this module boundary.
 */
export { initWallet, getAddress, getBalance } from "./wallet.js";
export { validateIntent } from "./validation.js";
export type { ValidationResult } from "./validation.js";
export { signIntent } from "./signer.js";
export type { SignResult } from "./signer.js";
export { broadcastSigned } from "./broadcaster.js";
export type { BroadcastResult } from "./broadcaster.js";
export {
  createPending,
  getPending,
  attachSignedTx,
  deletePending,
} from "./store.js";
export type { PendingEntry } from "./store.js";
