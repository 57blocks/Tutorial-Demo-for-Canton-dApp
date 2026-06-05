# Loop Wallet

A dark-themed web wallet and CLI toolkit for the [Loop](https://five-north.com) protocol — view holdings, manage credential offers, accept token transfers, and send assets with gas estimation.

## Project Layout

```
loop-wallet-test/
├── src/index.ts          # Server-side CLI script (holds, contracts)
├── .env.example          # Env template for the CLI script
├── .env                  # Secrets: PRIVATE_KEY, PARTY_ID (gitignored)
├── frontend/             # React web wallet dApp
└── package.json          # Root: CLI script deps
```

**Two runtimes, one project:**
- **Root** — A Node.js CLI script that connects to Loop via the server-side SDK, authenticates with an Ed25519 keypair, and dumps holdings/contracts to stdout.
- **`frontend/`** — A React SPA wallet dApp that connects via the browser SDK for interactive use.

---

## CLI Script (root)

The script at `src/index.ts` uses `@fivenorth/loop-sdk/server` to authenticate programmatically and query the ledger.

### Setup

Copy the env template and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `PRIVATE_KEY` | Hex-encoded Ed25519 key (64-char seed or 128-char full key) |
| `PARTY_ID` | Your party ID on the Canton ledger |
| `NETWORK` | `local`, `devnet`, or `mainnet` (default: `local`) |
| `WALLET_URL` | Optional override |
| `API_URL` | Optional override |

### Run

```bash
npm install
npm start          # runs: tsx src/index.ts
```

Outputs holdings, active holding contracts, and credential contracts to the console.

---

## Frontend (web wallet)

A React + TypeScript + Vite dApp for interactive wallet operations.

### Features

- **Wallet Connect** — Connect via the Loop browser SDK with auto-reconnect
- **Holdings Dashboard** — View all token balances with token icons and locked/unlocked breakdown
- **Credential Offers** — Accept or reject incoming credential offers with full details (claims, issuer, raw contract data)
- **Transfer Holdings** — Accept or reject incoming token transfers with context-aware transaction submission
- **Send Transfers** — Initiate token transfers with recipient lookup, amount input, expiry scheduling (presets + custom date picker), optional memo, and gas estimation
- **Expired Transfer Recovery** — Banner notification for expired outgoing transfers with one-click or bulk withdraw
- **Party ID Copy** — One-click copy of your on-chain identity

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript 6 |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 |
| Animation | Motion (Framer Motion) |
| Icons | Lucide React |
| SDK | [@fivenorth/loop-sdk](https://www.npmjs.com/package/@fivenorth/loop-sdk) |
| Protocol | Daml (generated types via `dpm codegen-js`) |

### Environment

Create a `.env` file in `frontend/`:

```env
VITE_REGISTRY_URL=https://your-registry-url
```

### Commands

```bash
cd frontend
npm install
npm run dev        # start dev server with HMR
npm run build      # production build (tsc + vite)
npm run preview    # preview production build
npm run codegen    # regenerate Daml TypeScript bindings
npm run lint       # run ESLint
```

### Code Generation

If Daml models change, regenerate TypeScript bindings:

```bash
npm run codegen    # dpm codegen-js ../daml/*.dar -o src/generated/daml
```

### Project Structure

```
frontend/
├── src/
│   ├── main.tsx              # App entry point
│   ├── App.tsx               # Root component with tab routing
│   ├── index.css             # Global styles + CSS custom properties
│   ├── context/
│   │   └── LoopContext.tsx   # Loop SDK provider (connect, holdings, transfers, gas)
│   ├── components/
│   │   ├── Header.tsx        # App header with wallet connect/disconnect
│   │   ├── Holdings.tsx      # Token balances grid
│   │   ├── CredentialOffers.tsx  # Pending credential & transfer review
│   │   ├── TransferForm.tsx  # Send transfers with expiry & gas estimation
│   │   ├── ExpiredTransferBanner.tsx  # Withdraw expired transfers
│   │   └── WalletLoading.tsx # Full-screen loading overlay
│   ├── lib/
│   │   └── utils.ts          # Utility helpers (cn)
│   └── generated/            # Daml codegen output
│       └── daml/             # Generated TypeScript bindings
├── components/ui/smoothui/   # Reusable UI primitives
│   ├── smooth-button/        # Gradient & outline button variants
│   ├── basic-modal/          # Animated modal with backdrop
│   └── basic-toast/          # Toast notification (success/error/warning/info)
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### Design System

CSS custom properties in `src/index.css` for a consistent dark theme:

| Token | Purpose |
|---|---|
| `--color-background` | Page background (`#1A1A2E`) |
| `--color-foreground` | Primary text (`#F1F1F6`) |
| `--color-foreground-dim` | Secondary text (`#C4C4CE`) |
| `--color-muted-foreground` | Tertiary text (`#C0C0CC`) |
| `--color-accent` | Indigo accent (`#6366F1`) |
| `--color-surface` | Card/panel backgrounds (frosted glass) |
| `--color-success` / `--color-warning` / `--color-destructive` | Semantic colors |

Reusable glass-morphism classes: `.glass`, `.glass-raised`.

---

## License

Private
