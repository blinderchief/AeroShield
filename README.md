# AeroShield 🛡️✈️

## AI-Augmented Parametric Travel Insurance on Flare Network

AeroShield is a revolutionary decentralized flight insurance platform that combines the power of Flare Network's Data Connector (FDC), FTSO price oracles, and Google Gemini AI to deliver instant, transparent, and automatic claim payouts for flight delays and cancellations.

![AeroShield Banner](docs/banner.png)

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

Built with ❤️ for the Flare Network Hackathon
