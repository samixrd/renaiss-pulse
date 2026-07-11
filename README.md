# Renaiss Pulse ⚽

**Football-themed USDt savings assistant** for the [Tether Developers Cup](https://developers.tether.io/) hackathon — QVAC + WDK tracks.

Users set aside USDt for recurring or event-based football expenses (match tickets, league fees, travel to away games, club merch) via **natural-language commands** powered by on-device LLM inference (QVAC) and Tether's Wallet Development Kit (WDK).

---

## Architecture

| Directory        | Track | Purpose                                       |
|------------------|-------|-----------------------------------------------|
| `qvac/`          | QVAC  | On-device LLM inference (llamacpp)            |
| `wdk/`           | WDK   | Wallet Development Kit / USDt integration     |
| `shared-types/`  | —     | Shared TypeScript type definitions            |
| `app/`           | —     | Expo screens, navigation, UI components       |

> **Platform note:** QVAC requires a physical mobile device — no emulator support (llamacpp limitation). Development runs on a laptop dev server; a physical iPhone connects via Expo Go over the same WiFi.

---

## Setup

> 🚧 **Coming soon** — will be filled in as the project progresses.

```bash
# Quick start (placeholder)
git clone <repo-url>
cd renaiss-pulse
cp .env.example .env
npm install
npx expo start
```

---

## Tech Stack

- **Runtime:** Expo SDK 54 (React Native, TypeScript)
- **On-device AI:** QVAC / llamacpp
- **Wallet:** Tether WDK (self-custodial)
- **Currency:** USDt

---

## License

[MIT](./LICENSE)
