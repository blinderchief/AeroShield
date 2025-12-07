# AeroShield - Complete Project Structure

## 📁 Project Overview

AeroShield is an AI-augmented parametric travel insurance platform built on Flare Network.

```
aeroshield/
├── backend/                    # FastAPI Backend
│   ├── main.py                 # Application entry point
│   ├── pyproject.toml          # Python dependencies
│   ├── Dockerfile              # Container config
│   ├── alembic.ini             # Migrations config
│   ├── alembic/                # Database migrations
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   │       └── 001_initial.py
│   ├── api/                    # API routes
│   │   ├── __init__.py
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── ai.py
│   │       ├── claims.py
│   │       ├── fdc.py
│   │       ├── ftso.py
│   │       ├── health.py
│   │       ├── policies.py
│   │       ├── pool.py
│   │       └── users.py
│   ├── core/                   # Core utilities
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── exceptions.py
│   │   ├── logging.py
│   │   ├── redis.py
│   │   └── security.py
│   ├── models/                 # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── ai_prediction.py
│   │   ├── claim.py
│   │   ├── fdc_event.py
│   │   ├── policy.py
│   │   ├── pool.py
│   │   └── user.py
│   ├── schemas/                # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── ai_prediction.py
│   │   ├── base.py
│   │   ├── claim.py
│   │   ├── fdc.py
│   │   ├── policy.py
│   │   ├── pool.py
│   │   └── user.py
│   ├── services/               # Business logic
│   │   ├── __init__.py
│   │   ├── ai/
│   │   │   ├── __init__.py
│   │   │   ├── gemini_agent.py
│   │   │   └── risk_scoring.py
│   │   ├── blockchain/
│   │   │   ├── __init__.py
│   │   │   ├── fdc_client.py
│   │   │   ├── ftso_client.py
│   │   │   └── smart_account.py
│   │   └── insurance/
│   │       ├── __init__.py
│   │       ├── claims_engine.py
│   │       └── pool_manager.py
│   └── tests/                  # Backend tests
│       ├── conftest.py
│       ├── test_api.py
│       └── test_services.py
│
├── frontend/                   # Next.js Frontend
│   ├── package.json
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── postcss.config.mjs
│   ├── components.json
│   ├── Dockerfile
│   ├── jest.config.js
│   ├── jest.setup.ts
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   ├── globals.css
│       │   ├── sign-in/[[...sign-in]]/page.tsx
│       │   ├── sign-up/[[...sign-up]]/page.tsx
│       │   └── dashboard/
│       │       ├── layout.tsx
│       │       ├── page.tsx
│       │       ├── buy/page.tsx
│       │       ├── claims/page.tsx
│       │       ├── policies/page.tsx
│       │       └── settings/page.tsx
│       ├── components/
│       │   ├── error-boundary.tsx
│       │   ├── loading.tsx
│       │   ├── providers.tsx
│       │   ├── toast.tsx
│       │   └── ui/
│       │       ├── badge.tsx
│       │       ├── button.tsx
│       │       ├── card.tsx
│       │       ├── dialog.tsx
│       │       ├── input.tsx
│       │       └── select.tsx
│       ├── hooks/
│       │   ├── index.ts
│       │   ├── useApi.ts
│       │   └── useContracts.ts
│       ├── lib/
│       │   ├── api.ts
│       │   ├── store.ts
│       │   ├── utils.ts
│       │   └── wagmi.ts
│       └── __tests__/
│           ├── components.test.tsx
│           └── pages.test.tsx
│
├── contracts/                  # Solidity Smart Contracts
│   ├── package.json
│   ├── hardhat.config.ts
│   ├── .env.example
│   ├── contracts/
│   │   ├── core/
│   │   │   ├── ClaimProcessor.sol
│   │   │   ├── InsurancePool.sol
│   │   │   └── PolicyManager.sol
│   │   ├── interfaces/
│   │   │   └── IFlareDataConnector.sol
│   │   ├── libraries/
│   │   │   └── FlightDataLib.sol
│   │   └── mocks/
│   │       ├── MockFDC.sol
│   │       └── MockTokens.sol
│   ├── scripts/
│   │   └── deploy.ts
│   └── test/
│       └── AeroShield.test.ts
│
├── docs/                       # Documentation
│   └── README.md
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml           # GitHub Actions
│
├── docker-compose.yml          # Docker orchestration
├── README.md                   # Project overview
├── prd.md                      # Product requirements
└── A Strategic Blueprint...md  # Hackathon blueprint
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.12+
- Docker & Docker Compose
- Git

### Environment Setup

1. **Clone & Install**
```bash
git clone <repo-url>
cd aeroshield

# Backend
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -e ".[dev]"

# Frontend
cd ../frontend
npm install

# Contracts
cd ../contracts
npm install
```

2. **Configure Environment**
```bash
# Copy all .env.example files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
cp contracts/.env.example contracts/.env

# Edit each file with your credentials
```

3. **Start Development**
```bash
# Using Docker (recommended)
docker-compose up -d

# Or manually:
# Terminal 1 - Backend
cd backend && uvicorn main:app --reload

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### Deploy Contracts
```bash
cd contracts
npx hardhat compile
npx hardhat run scripts/deploy.ts --network coston2
```

## 📊 Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| UI Components | shadcn/ui, Framer Motion, Lucide Icons |
| State | TanStack Query, Zustand |
| Web3 | wagmi, viem, ethers.js |
| Auth | Clerk |
| Backend | FastAPI, Python 3.12 |
| Database | Neon PostgreSQL, SQLAlchemy Async |
| Cache | Redis |
| AI | Google Gemini |
| Blockchain | Flare Network, Solidity 0.8.20, Hardhat |
| Deploy | Docker, Vercel, Railway |

## 🔗 Key Features

1. **AI Risk Assessment** - Gemini-powered flight delay prediction
2. **Parametric Policies** - ERC721 NFT policies with tiered payouts
3. **FDC Verification** - Flare Data Connector for trustless claims
4. **FTSO Integration** - Real-time price feeds for fair valuations
5. **Liquidity Pool** - LP tokens with yield generation
6. **Automatic Payouts** - Smart contract claim processing

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/policies/my-policies` | Get user's policies |
| POST | `/api/v1/policies` | Create new policy |
| GET | `/api/v1/claims/my-claims` | Get user's claims |
| POST | `/api/v1/claims` | File a claim |
| GET | `/api/v1/pool/stats` | Get pool statistics |
| POST | `/api/v1/ai/predict-delay` | Get delay prediction |
| GET | `/api/v1/ftso/prices` | Get FTSO prices |

## 🎯 Hackathon Checklist

- [x] Full-stack implementation
- [x] Flare FDC integration
- [x] FTSO price feeds
- [x] AI risk assessment
- [x] Smart contracts (Pool, Policy, Claims)
- [x] Modern UI with animations
- [x] Wallet integration
- [x] Docker deployment
- [x] CI/CD pipeline
- [x] Comprehensive tests
- [x] Documentation

**Good luck with the hackathon! 🚀**
