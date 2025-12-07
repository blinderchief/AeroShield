# 🚀 AeroShield Quick Start Guide

Get AeroShield running in under 10 minutes!

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **Git**
- **Wallet** with Coston2 testnet FLR ([Get test FLR](https://faucet.flare.network/coston2))

## Step 1: Clone & Setup

```bash
# Clone the repository
git clone https://github.com/your-repo/aeroshield.git
cd aeroshield
```

## Step 2: Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -e ".[dev]"

# Copy environment file
cp .env.example .env
# Edit .env with your settings

# Run database migrations
alembic upgrade head

# Start backend server
uvicorn main:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`

## Step 3: Smart Contracts Setup

```bash
cd ../contracts

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your private key

# Compile contracts
npm run compile

# Deploy to Coston2 testnet
npm run deploy:coston2

# Sync addresses to frontend
npm run sync-frontend
```

## Step 4: Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
# Edit .env.local with your settings

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Step 5: Configure Services

### Clerk Authentication
1. Create account at [clerk.com](https://clerk.com)
2. Create new application
3. Add keys to `frontend/.env.local`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

### WalletConnect
1. Create project at [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Add to `frontend/.env.local`:
   ```
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
   ```

### Google Gemini AI (Optional)
1. Get API key from [makersuite.google.com](https://makersuite.google.com)
2. Add to `backend/.env`:
   ```
   GEMINI_API_KEY=your_api_key
   ```

## Quick Commands Reference

### Backend
```bash
# Start server
uvicorn main:app --reload

# Run tests
pytest

# Run with workers
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Smart Contracts
```bash
# Compile
npm run compile

# Test
npm run test

# Deploy to Coston2
npm run deploy:coston2

# Get FTSO prices
npm run ftso:prices

# Listen to events
npm run listen
```

### Frontend
```bash
# Development
npm run dev

# Build
npm run build

# Test
npm run test

# Lint
npm run lint
```

## Network Information

### Coston2 Testnet
- **Chain ID**: 114
- **RPC**: https://coston2-api.flare.network/ext/C/rpc
- **Explorer**: https://coston2-explorer.flare.network
- **Faucet**: https://faucet.flare.network/coston2

### Flare Mainnet
- **Chain ID**: 14
- **RPC**: https://flare-api.flare.network/ext/C/rpc
- **Explorer**: https://flare-explorer.flare.network

## Troubleshooting

### Backend won't start
- Ensure virtual environment is activated
- Check Python version: `python --version` (need 3.10+)
- Verify all environment variables are set

### Contracts won't compile
- Run `npm install` in contracts folder
- Check Node version: `node --version` (need 18+)
- Try `npm run clean` then `npm run compile`

### Frontend errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall: `rm -rf node_modules && npm install`
- Check all environment variables in `.env.local`

### Wallet not connecting
- Ensure MetaMask/wallet is installed
- Add Coston2 network to wallet
- Get test FLR from faucet

## Next Steps

1. **Deploy contracts** to Coston2 testnet
2. **Get test FLR** from the faucet
3. **Purchase a test policy** through the dashboard
4. **Monitor flight data** via FDC integration
5. **Submit claims** for delayed/cancelled flights

## Resources

- [Flare Developer Docs](https://dev.flare.network/)
- [FDC Documentation](https://dev.flare.network/fdc/overview)
- [FTSO v2 Documentation](https://dev.flare.network/ftso/overview)
- [API Documentation](http://localhost:8000/docs)

---

**Need help?** Open an issue or join our Discord!
