<div align="center">

<img src="docs/banner.svg" alt="AeroShield Banner" width="100%">

<br/>

<img src="docs/logo.svg" alt="AeroShield Logo" width="120">

# AeroShield

### 🛡️ AI-Augmented Parametric Travel Insurance on Flare Network ✈️

[![Built on Flare](https://img.shields.io/badge/Built%20on-Flare%20Network-ff6b35?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTMgM0w0IDEzaDdsMi0xMHoiIGZpbGw9IndoaXRlIi8+PHBhdGggZD0iTTExIDIxbDktMTBoLTdsLTIgMTB6IiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==)](https://flare.network/)
[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Gemini%20AI-4285f4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)](CONTRIBUTING.md)

<p align="center">
  <strong>🚀 Instant • 🤖 AI-Powered • 🔗 Trustless • 💰 Fair</strong>
</p>

<p align="center">
  AeroShield is a revolutionary decentralized flight insurance platform that combines the power of Flare Network's Data Connector (FDC), FTSO price oracles, and Google Gemini AI to deliver instant, transparent, and automatic claim payouts for flight delays and cancellations.
</p>

<br/>

[📖 Documentation](docs/README.md) • [🚀 Quick Start](QUICKSTART.md) • [🐛 Report Bug](https://github.com/aeroshield/issues) • [✨ Request Feature](https://github.com/aeroshield/issues)

---

</div>

## 🌟 Key Features

### ✨ AI-Powered Risk Assessment
- **Gemini AI Integration**: Real-time flight delay prediction using historical data, weather patterns, and route analysis
- **Dynamic Premium Pricing**: AI-calculated premiums based on individual flight risk profiles
- **Smart Coverage Recommendations**: Personalized coverage suggestions based on travel patterns

### ⚡ Instant Parametric Payouts
- **No Claims Process**: Automatic payout triggers when flight delays/cancellations are verified
- **FDC Integration**: Trustless flight data attestation through Flare Data Connector
- **Multi-Tier Coverage**: Configurable payouts for 1h, 2h, 4h+ delays and cancellations

### 🔗 Flare Network Native
- **FTSO Price Feeds**: Real-time currency conversion using Flare's decentralized oracle
- **Smart Accounts**: Gasless transactions for seamless user experience
- **ERC-721 Policies**: Each policy minted as an NFT for transparency and tradability

### 💰 DeFi Liquidity Pool
- **Yield Generation**: Liquidity providers earn premiums from policy underwriting
- **Transparent Reserves**: On-chain reserve management with real-time utilization metrics
- **Community Governance**: Pool parameters adjustable through governance

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │  Clerk   │  │  Wagmi   │  │  React   │  │   Framer Motion      │ │
│  │   Auth   │  │  /Viem   │  │  Query   │  │   Animations         │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        BACKEND (FastAPI)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐  │
│  │   AI/Gemini  │  │  Blockchain  │  │      Insurance Logic      │  │
│  │   Service    │  │   Services   │  │  - Claims Engine          │  │
│  │              │  │  - FDC       │  │  - Pool Manager           │  │
│  │  - Risk      │  │  - FTSO      │  │  - Premium Calculator     │  │
│  │  - Predict   │  │  - Smart Acc │  │                           │  │
│  └──────────────┘  └──────────────┘  └───────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SMART CONTRACTS (Solidity)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐  │
│  │ InsurancePool│  │PolicyManager │  │     ClaimProcessor        │  │
│  │              │  │   (ERC-721)  │  │                           │  │
│  │  - Deposits  │  │  - Mint      │  │  - FDC Attestation        │  │
│  │  - Reserves  │  │  - Activate  │  │  - Auto Payout            │  │
│  │  - Payouts   │  │  - Transfer  │  │  - Batch Process          │  │
│  └──────────────┘  └──────────────┘  └───────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FLARE NETWORK                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐  │
│  │     FDC      │  │    FTSO      │  │     Smart Accounts        │  │
│  │ Flight Data  │  │ Price Feeds  │  │   Gasless Transactions    │  │
│  └──────────────┘  └──────────────┘  └───────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.12+
- UV package manager
- Docker (optional)
- PostgreSQL (Neon recommended)
- Redis

### Backend Setup

```bash
cd backend

# Install dependencies with UV
uv sync

# Copy environment file
cp .env.example .env

# Configure your environment variables
# - DATABASE_URL (Neon PostgreSQL)
# - CLERK_SECRET_KEY
# - GEMINI_API_KEY
# - FLARE_RPC_URL

# Run database migrations
uv run alembic upgrade head

# Start the server
uv run uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Configure your environment variables
# - NEXT_PUBLIC_API_URL
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# - CLERK_SECRET_KEY

# Run development server
npm run dev
```

### Smart Contracts Setup

```bash
cd contracts

# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to Coston2 testnet
npm run deploy:coston2
```

## 📁 Project Structure

```
aeroshield/
├── backend/                    # FastAPI Backend
│   ├── main.py                # Application entry point
│   ├── core/                  # Core configurations
│   │   ├── config.py         # Environment settings
│   │   ├── database.py       # SQLAlchemy async setup
│   │   ├── security.py       # Clerk JWT verification
│   │   └── redis.py          # Cache management
│   ├── models/               # SQLAlchemy models
│   ├── schemas/              # Pydantic schemas
│   ├── services/             # Business logic
│   │   ├── ai/              # Gemini AI services
│   │   ├── blockchain/      # Flare integration
│   │   └── insurance/       # Policy management
│   └── api/v1/              # API routes
│
├── frontend/                  # Next.js Frontend
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   ├── lib/             # Utilities & hooks
│   │   └── hooks/           # Custom hooks
│   └── public/              # Static assets
│
├── contracts/                # Solidity Smart Contracts
│   ├── core/                # Main contracts
│   │   ├── InsurancePool.sol
│   │   ├── PolicyManager.sol
│   │   └── ClaimProcessor.sol
│   ├── interfaces/          # Contract interfaces
│   ├── libraries/           # Shared libraries
│   ├── mocks/              # Test mocks
│   └── scripts/            # Deployment scripts
│
└── docs/                    # Documentation
```

## 🔧 Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host/db

# Authentication
CLERK_SECRET_KEY=sk_test_xxx
CLERK_PUBLISHABLE_KEY=pk_test_xxx

# AI
GEMINI_API_KEY=your_gemini_key

# Blockchain
FLARE_RPC_URL=https://coston2-api.flare.network/ext/C/rpc
FDC_CONTRACT_ADDRESS=0x...
FTSO_CONTRACT_ADDRESS=0x...
PRIVATE_KEY=your_private_key

# Redis
REDIS_URL=redis://localhost:6379
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=xxx
NEXT_PUBLIC_FLARE_RPC_URL=https://coston2-api.flare.network/ext/C/rpc
```

### Contracts (.env)

```env
PRIVATE_KEY=your_deployer_private_key
COSTON2_RPC_URL=https://coston2-api.flare.network/ext/C/rpc
FLARESCAN_API_KEY=your_api_key
```

## 📊 API Endpoints

### Authentication
- `GET /api/v1/users/me` - Get current user
- `POST /api/v1/users/register` - Register user

### Policies
- `POST /api/v1/policies/quote` - Get insurance quote
- `POST /api/v1/policies/create` - Create policy
- `GET /api/v1/policies` - List user policies
- `GET /api/v1/policies/{id}` - Get policy details

### Claims
- `POST /api/v1/claims/create` - Submit claim
- `GET /api/v1/claims` - List user claims
- `POST /api/v1/claims/{id}/verify` - Verify via FDC

### AI
- `POST /api/v1/ai/predict-delay` - Predict flight delay
- `POST /api/v1/ai/calculate-premium` - AI premium calculation

### Blockchain
- `POST /api/v1/blockchain/fdc/request` - Request FDC attestation
- `GET /api/v1/blockchain/ftso/prices` - Get FTSO prices

## 🧪 Testing

### Backend Tests

```bash
cd backend
uv run pytest -v
```

### Frontend Tests

```bash
cd frontend
npm run test
```

### Contract Tests

```bash
cd contracts
npm run test
npm run test:coverage
```

## 🚢 Deployment

### Docker Deployment

```bash
# Build and run all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Vercel (Frontend)

```bash
cd frontend
vercel --prod
```

### Railway (Backend)

```bash
cd backend
railway up
```

### Smart Contracts

```bash
cd contracts
# Deploy to Coston2 testnet
npm run deploy:coston2

# Deploy to Flare mainnet
npm run deploy:flare

# Verify contracts
npm run verify -- --network coston2 <CONTRACT_ADDRESS>
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## � Smart Contract Details

### Deployed Contracts

AeroShield's smart contracts are deployed on the **Flare Network Coston2 Testnet**.

| Contract | Description | Solidity Version |
|----------|-------------|------------------|
| **InsurancePool** | Liquidity pool for underwriting policies, managing LP deposits, premium collection, and claim payouts | ^0.8.20 |
| **PolicyManager** | ERC-721 NFT-based policy management with FDC integration for automatic claim triggers | ^0.8.20 |
| **ClaimProcessor** | Automated claim processing with batch operations and FDC attestation verification | ^0.8.20 |
| **FTSOv2Consumer** | FTSO v2 price feed integration for real-time USD/FLR conversions | ^0.8.20 |
| **FDCFlightVerifier** | Flight data verification using Flare Data Connector attestations | ^0.8.20 |

### Contract Addresses

#### Coston2 Testnet (Chain ID: 114)

| Contract | Address |
|----------|---------|
| InsurancePool | `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9` |
| PolicyManager | `0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9` |
| ClaimProcessor | `0x5FC8d32690cc91D4c39d9d3abcBD16989F875707` |
| MockUSDC | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |

#### Flare System Contracts (Coston2)

| Contract | Address |
|----------|---------|
| ContractRegistry | `0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019` |
| FDCHub | `0x1c78A073E3BD2aCa4cc327d55FB0cD4f0549B55b` |

### Block Explorer

- **Coston2 Explorer**: [https://coston2-explorer.flare.network/](https://coston2-explorer.flare.network/)
- **View InsurancePool**: [https://coston2-explorer.flare.network/address/0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9](https://coston2-explorer.flare.network/address/0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9)
- **View PolicyManager**: [https://coston2-explorer.flare.network/address/0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9](https://coston2-explorer.flare.network/address/0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9)
- **View ClaimProcessor**: [https://coston2-explorer.flare.network/address/0x5FC8d32690cc91D4c39d9d3abcBD16989F875707](https://coston2-explorer.flare.network/address/0x5FC8d32690cc91D4c39d9d3abcBD16989F875707)

### FTSO v2 Supported Price Feeds

| Pair | Feed ID |
|------|---------|
| FLR/USD | `0x01464c522f55534400000000000000000000000000` |
| BTC/USD | `0x014254432f55534400000000000000000000000000` |
| ETH/USD | `0x014554482f55534400000000000000000000000000` |
| USDC/USD | `0x01555344432f555344000000000000000000000000` |
| USDT/USD | `0x01555344542f555344000000000000000000000000` |

### Access Control Roles

| Role | Purpose |
|------|---------|
| `DEFAULT_ADMIN_ROLE` | Full admin access |
| `POLICY_MANAGER_ROLE` | Create/manage policies |
| `OPERATOR_ROLE` | Process claims, verify data |
| `PROCESSOR_ROLE` | Automated claim processing |

### Testnet Resources

- **Coston2 Faucet**: [https://faucet.flare.network/coston2](https://faucet.flare.network/coston2)
- **RPC URL**: `https://coston2-api.flare.network/ext/C/rpc`
- **Chain ID**: `114`

## ❓ Frequently Asked Questions (FAQs)

*"Insurance that pays before you leave the gate."*

### 🔹 1. How does AeroShield actually work?

Imagine you buy a ₹60 "delay cover" for your flight DEL → BOM.  
➡️ If the flight is delayed **2+ hours**, AeroShield **automatically sends ₹1,000 to your wallet in <5 minutes** — no forms, no calls.

✅ **Simple 4-step flow**:
1. **Before your flight**, you pay a small amount (e.g., ₹50) to insure against delays (e.g., >2 hours).
2. If your flight *is* delayed, **Flare's FDC (Data Connector)** checks a trusted flight API (like FlightStats) and **proves it on-chain** — no human needed.
3. Once verified, the **smart contract instantly pays you** (e.g., ₹1,000) — usually in **under 5 minutes**.
4. Money comes from a **shared pool** funded by all users' premiums (like a community safety net).

> 🔍 *Think of it like a vending machine*: Insert coin (premium) → machine checks reality (FDC) → if condition met → dispenses reward (payout). No forms. No calls.

---

### 🔹 2. Do I need crypto or a wallet to use it?

**No!** You can use your **XRP Ledger (XRPL) address** directly — like your email.
- Just send a small XRP payment (e.g., ₹50 worth) with a note: *"Cover flight 6E-542"*.
- AeroShield reads that note → creates your policy.
- Payout comes to the same address — **no gas, no app, no signup needed**.

Think of it like UPI: you use your VPA → money moves. Here, you use your XRPL address → insurance works.

| Step | What You Do | Tech Behind It |
|------|-------------|----------------|
| 1. Sign up | Use phone/Gmail (via **Clerk**) | No wallet needed yet |
| 2. Buy policy | Pay via **UPI → USDT** (via partner wallet) | On-ramp built-in |
| 3. Claim | Done automatically — money goes to your wallet | Or to UPI if linked |
| ✨ Bonus | Use your **XRPL address** → get **gasless transactions** on Flare | Thanks to **Flare Smart Accounts** |

> 🇮🇳 A Delhi freelancer can buy coverage in 30 seconds — no "crypto jargon", no MetaMask popups.

---

### 🔹 3. Where does the payout money come from?

From a **shared pool**, funded by *everyone who buys cover*.
- 100 people pay ₹60 → ₹6,000 goes into the pool.
- Only ~20–25 flights get delayed (based on real data) → 20–25 people get ₹1,000 each.
- The rest of the money stays in the pool → used for next week's payouts.

✅ **Three safety layers** keep payouts reliable:

| Source | How It Works |
|--------|--------------|
| **1. Premium Pool** | Everyone who buys coverage adds to a shared fund. Most payouts come from here. |
| **2. Collateral Backing** | Liquidity providers lock in extra funds (e.g., USDT, FXRP) as backup — verified by Flare's **FAssets + FTSO**. |
| **3. Smart Pricing (AI)** | **Gemini-powered AI** adjusts premiums based on real risk (e.g., monsoon season = slightly higher price). This keeps the pool healthy. |

> 📊 **Example**: 1,000 users × ₹60 = ₹60,000 in pool. Avg. delay rate = 20% → 200 claims × ₹300 = ₹60,000 → **Break-even & sustainable**.

---

### 🔹 4. What if too many flights are delayed (e.g., monsoon)? Will the pool run out?

Great question! We prevent this in 3 ways:

1️⃣ **Smart pricing**: AI adjusts premiums — high-risk days (e.g., heavy rain) cost a little more.  
2️⃣ **Collateral backup**: Trusted partners lock extra money (e.g., USDT, FXRP) as safety net — watched by Flare's **FTSO** (price oracle).  
3️⃣ **Payout limits**: Max ₹1,500 per flight → keeps pool sustainable.

✅ **Yes — by design**:
- **Over-collateralization**: The pool is always backed by **≥150% collateral** (e.g., ₹1.5L collateral for ₹1L coverage).
- **Payout caps**: Max ₹2,000 per flight → avoids runaway claims.
- **Rebalancing**: If risk rises, AI **automatically raises premiums** for new policies.
- **FAssets help**: XRP community can deposit **FXRP** as low-volatility collateral.

> 🔐 This is **more secure than traditional insurers**, who often *don't* pre-fund claims.

---

### 🔹 5. How do I (or anyone) make profit from this?

✅ **Three ways to earn** — fair, transparent, open to all:

| Role | How You Profit |
|------|----------------|
| **🛡️ User (Traveler)** | Profit = **Time + peace of mind**. Get compensated *fast* instead of losing income. |
| **💧 Liquidity Provider (LP)** | Deposit stablecoins/FAssets into the pool → earn **yield + fees** (e.g., 5–10% APY), like in Aave or Compound. |
| **🤖 Agent / Operator** | Run an FDC attestation node or help verify data → earn **FLR rewards** (like FTSO providers). |

> 💡 Bonus: Early LPs can get **AeroShield tokens** (future airdrop) for bootstrapping the pool.

---

### 🔹 6. How does AeroShield make money?

We take a tiny **5–10% fee** on every premium (e.g., ₹3 on a ₹60 policy).  
This covers:
- API costs (flight data)
- Blockchain fees
- AI (Gemini)
- Team & growth

💡 *No hidden fees. No commissions. No denial tricks.*

If the pool has extra money (e.g., fewer delays), we may:
- Lower future premiums
- Share profits with liquidity providers
- Add new covers (trains, buses, events)

---

### 🔹 7. Is my money safe? Can someone cheat the system?

✅ **Yes, it's safe** — and here's why:
- All money is in a **public smart contract** (anyone can check).
- Payouts only happen if **Flare's FDC proves** the delay is real — no fake data.
- If someone tries to lie (e.g., fake flight number), the proof fails → no payout.

It's more transparent than your bank statement. 🔍

---

### 🔹 8. How is this different from normal travel insurance?

| Traditional Insurance | AeroShield |
|-----------------------|------------|
| ❌ "We'll review your claim" (takes weeks) | ✅ **Auto-paid in minutes** — code doesn't lie |
| ❌ Denials common ("fine print") | ✅ **Transparent rules** — if API says "delayed ≥2h", you get paid |
| ❌ Middlemen (agents, call centers) | ✅ **Direct peer-to-pool** — lower cost, higher trust |
| ❌ No real-time pricing | ✅ **AI adjusts price fairly** — safer flights = cheaper cover |

> 🎯 **Bottom line**: AeroShield is *software*, not bureaucracy.

---

### 🔹 9. Who benefits most from AeroShield?

| User | Benefit |
|------|---------|
| 🧑‍💼 **Freelancers / Gig workers** | Missed meeting = lost income. ₹1,000 in 5 mins = rebook & stay on track. |
| 👨‍👩‍👧 **Families traveling** | Unexpected delay = hotel/food costs. Instant cash = peace of mind. |
| 🌐 **Crypto/XRP users** | Use your XRPL address — no new wallet, no gas. |
| 📱 **App partners (MakeMyTrip, etc.)** | Offer as add-on → earn referral fees + delight users. |

---

### 🔹 10. Is this live? Can I try it?

✅ **Yes — on Flare Coston2 Testnet** (free to use):
- Test with fake FLR (faucet available)
- Simulate flight delays → see auto-payout
- Demo AI prediction ("6E-542: 78% delay chance")

➡️ **After hackathon**: Launch on **Flare Mainnet** → accept real USDT/FXRP → partner with travel apps.

---

### 🔹 11. What's next? Will it cover trains or buses?

**Yes!** Phase 2:
- 🚆 **Indian Railways delay cover** (using NTES API + FDC)
- 🚌 **RedBus/IntrCity delays**
- 🌾 **Farmers**: Get paid if drought hits (satellite + weather data)

We start with flights — but AeroShield is really a **platform for real-world event insurance**.

---

## 🙏 Acknowledgments

- [Flare Network](https://flare.network/) - For FDC and FTSO infrastructure
- [Google Gemini](https://deepmind.google/technologies/gemini/) - AI prediction capabilities
- [OpenZeppelin](https://openzeppelin.com/) - Smart contract security standards
- [Clerk](https://clerk.dev/) - Authentication infrastructure

## 📞 Contact

- Website: [aeroshield.io](https://aeroshield.io)
- Twitter: [@AeroShieldDeFi](https://twitter.com/AeroShieldDeFi)
- Discord: [AeroShield Community](https://discord.gg/aeroshield)

---

<div align="center">

<img src="docs/logo.svg" alt="AeroShield" width="60">

**Built with ❤️ for the Flare Network Hackathon**

<sub>© 2025 AeroShield. All rights reserved.</sub>

</div>
