## 📚 Overview

**chETHGPT** is a _pay‑per‑request_ dApp that lets users fund a micro‑payment channel with ETH, spend balance on every question.

Built with **Scaffold‑ETH 2** plus route handlers that proxy OpenAI and store signed vouchers in MongoDB Atlas.

---

## 🛠 Requirements

- **Node ≥ 18.18**
- **Yarn** (v1 or v3+)
- **Git**
- **Hardhat** (`yarn add --dev hardhat`)
- Optional: **MongoDB CLI** for local testing

---

## 🚀 Quick Start (Local)

```bash
git clone https://github.com/wildanvin/chETHgpt
cd chETHGPT
yarn install
```

1. **Run a local chain**

   ```bash
   yarn chain       # hardhat node on :8545
   ```

2. **Deploy contracts**

   ```bash
   yarn deploy      # deploys Streamer.sol to localnet
   ```

3. **Populate .env**

   ```dotenv
   # .env.local
   OPENAI_API_KEY=sk‑xxxx           # server‑only
   MONGODB_URI=mongodb+srv://.../dev
   ```

4. **Start the Next app**

   ```bash
   yarn start       # http://localhost:3000
   ```

---

## ✨ How it Works

1. **Open Channel** – user calls `fundChannel()` (0.01 ETH) ➜ insert DB doc.
2. **Ask Question** – front‑end signs voucher, stores in DB, balance decrements.
3. **Provider Withdraws** – signatures page lists... well, signatures ➜ `withdrawEarnings`.
4. **Challenge / Defund** – user calls `challengeChannel()` ➜ 30 s ➜ `defundChannel()` to reclaim deposit.

---
