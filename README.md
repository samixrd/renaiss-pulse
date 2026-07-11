# Renaiss Pulse ⚽

> What if you had a wallet that's AI-native, privacy-first, secure, fully
> local, and open source? Renaiss Pulse is a self-custodial USDt wallet
> for football expenses — reserve or spend money by talking to it, with
> the AI running entirely on your own device and your own keys never
> leaving your machine.

**Football-themed USDt savings assistant** for the [Tether Developers Cup](https://dorahacks.io/hackathon/tether-developers-cup/detail) hackathon — QVAC + WDK tracks.

Users set aside USDt for recurring or event-based football expenses (match tickets, league fees, travel to away games, club merch) via **natural-language commands** powered by on-device LLM inference (QVAC) and Tether's Wallet Development Kit (WDK).

---

## Architecture

| Directory        | Track | Purpose                                       |
|------------------|-------|-----------------------------------------------|
| `qvac/`          | QVAC  | On-device LLM inference (llamacpp)            |
| `wdk/`           | WDK   | Wallet Development Kit / USDt integration     |
| `shared-types/`  | —     | Shared TypeScript type definitions            |
| `web/`           | —     | Vite React frontend dashboard and command UI |

### The QVAC/WDK Boundary
To maintain absolute security and user privacy, Renaiss Pulse enforces a strict separation of concerns between its AI and wallet layers:
- **QVAC** runs local LLM inference on-device. It only ever processes raw natural language prompts and translates them into structured JSON intents. It has zero network access and absolutely no access to private key material.
- **WDK (Wallet Development Kit)** is the only module permitted to interact with cryptographic keys, sign transactions offline, or broadcast payloads to the network. It solely operates on the structured JSON output from QVAC, ensuring that your keys never leak to the model or third-party APIs.

**Tech Specs:**
- **Model**: `Llama-3.2-1B-Instruct-Q4_0` (~737MB), running locally via llamacpp. Highly optimized to run on standard consumer hardware (8GB RAM, no dedicated GPU required).
- **Network**: Tron Nile Testnet (TRC-20 USDT).

---

## On-Device AI Performance

| Metric | Value |
|---|---|
| Model | Llama-3.2-1B-Instruct-Q4_0 (737MB, quantized) |
| Model load time | 11.57s (cache hit) |
| Time to first token | 3.07s |
| Tokens/sec | 13.18 |
| Host process memory | ~105MB |
| GPU required | No — runs fully on CPU/integrated GPU |

This demonstrates QVAC running a genuinely useful 1B-parameter model on entry-level hardware with no dedicated GPU, proving on-device AI doesn't require expensive equipment.

---

## Security & Self-Custody

- **Local Key Generation & Storage**: Private keys are generated locally via a 12-word BIP-39 mnemonic, printed once during `wallet:setup` for manual backup, then stored only as an AES-256-GCM encrypted seed (never plaintext) in `.env`.
- **Manual Confirmations Only**: Every transaction requires explicit manual confirmation—there is no auto-sign path anywhere in the codebase.
- **Pre-Sign Safeguards**: Hard validation rules (sufficient balance, per-category spend limits, duplicate detection) run before a user ever sees a signing prompt.
- **Action Semantics**: Reserve actions are self-transfers that earmark funds without moving them off-wallet; spend actions transfer to a labeled recipient (currently mock vendor addresses for demo purposes—production would route to real merchant addresses).

---

## Setup

Follow these steps to configure and run the application locally:

1. **Prerequisites**: Ensure you have Node.js (LTS version) and npm installed.
2. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd renaiss-pulse
   ```
3. **Install Dependencies**: Run `npm install` in the root folder, then run the installer in the frontend directory:
   ```bash
   npm install
   cd web && npm install && cd ..
   ```
4. **Environment Variables**: Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
5. **Set Up Wallet**: Generate your local encrypted wallet seed by running:
   ```bash
   npm run wallet:setup
   ```
   *Note: This will output a 12-word mnemonic seed once. Back it up securely. The password and encrypted seed are written to `.env`. Never commit your `.env` file to version control.*
6. **Fund Your Wallet**: Get free test tokens on the [Tron Nile Faucet](https://nileex.io/join/getJoinPage). Note that you need both **TRX** (for energy/fees) and **USDT** (to test transactions).
7. **Start Backend**: Run the Express server in the root directory:
   ```bash
   npm run dev
   ```
   *(This starts the backend on `http://localhost:3001`)*
8. **Start Frontend**: Open a separate terminal, navigate to `web/` and run the development server:
   ```bash
   cd web
   npm run dev
   ```
   *(This starts the frontend dashboard on `http://localhost:5173`)*
9. **Open the Dashboard**: Navigate to `http://localhost:5173` in your browser.

---

## Demo Video

[Link will be added here]

---

## Tether Developers Cup

Built for the QVAC and WDK tracks. See [track requirements](https://dorahacks.io/hackathon/tether-developers-cup/detail).

---

## Notes

- **Mock Vendor System**: For demonstration purposes, this system uses a mapped list of mock football-related merchants (e.g. ticket office, club store, travel partner) dynamically selected from the QVAC intent category. A real production setup would resolve these to actual public merchant addresses.
- **Reserve Earmarking**: Reserves are implemented as self-transfers that securely earmark funds within the user's wallet without moving them off-wallet.
- **Testnet Only**: All actions in this codebase are designed to run on the Tron Nile Testnet and hold no real-world monetary value.

---

## License

[MIT](./LICENSE)
