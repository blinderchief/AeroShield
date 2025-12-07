# AeroShield Smart Contracts

Parametric Flight Insurance Smart Contracts built on Flare Network, leveraging FDC (Flare Data Connector) and FTSO v2 for real-world data integration.

## 🏗️ Architecture

```
contracts/
├── core/                        # Core insurance contracts
│   ├── InsurancePool.sol        # Liquidity pool for underwriting
│   ├── PolicyManager.sol        # Policy creation & management
│   ├── ClaimProcessor.sol       # Claims processing & payouts
│   ├── FTSOv2Consumer.sol       # FTSO v2 price feed integration
│   └── FDCFlightVerifier.sol    # FDC flight data verification
├── interfaces/                  # Contract interfaces
│   └── IFlightDataOracle.sol    # Flight data oracle interface
├── mocks/                       # Test mock contracts
│   ├── MockUSDC.sol             # Mock USDC token
│   └── MockFDC.sol              # Mock FDC for local testing
├── scripts/                     # Deployment & utility scripts
│   ├── deploy.ts                # Main deployment script
│   ├── deployFlareContracts.ts  # Flare-specific contracts
│   ├── interactFTSO.ts          # FTSO price feed interaction
│   └── fdc/                     # FDC attestation scripts
│       ├── prepareAttestation.ts
│       ├── submitAttestation.ts
│       └── verifyAttestation.ts
└── test/                        # Contract test suite
    └── AeroShield.test.ts
```

## 🌐 Flare Network Integration

### FTSO v2 (Flare Time Series Oracle)

Used for real-time price feeds to calculate dynamic insurance premiums:

```solidity
// Get FLR/USD price
(uint256 value, int8 decimals, uint64 timestamp) = ftsoConsumer.getFeedValue(FLR_USD_FEED_ID);
```

**Supported Feed IDs:**
| Pair | Feed ID |
|------|---------|
| FLR/USD | `0x01464c522f55534400000000000000000000000000` |
| BTC/USD | `0x014254432f55534400000000000000000000000000` |
| ETH/USD | `0x014554482f55534400000000000000000000000000` |
| USDC/USD | `0x01555344432f555344000000000000000000000000` |

### FDC (Flare Data Connector)

Used to bring external flight data on-chain through cryptographic attestation:

1. **Prepare Attestation** - Format request for FDC verifier
2. **Submit to FDCHub** - Request attestation on-chain
3. **Retrieve Proof** - Get proof from DA Layer after voting round
4. **Verify On-Chain** - Verify proof in FDCFlightVerifier contract

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- A wallet with Coston2 testnet FLR (get from [Coston2 Faucet](https://faucet.flare.network/coston2))

### Installation

```bash
cd contracts
npm install
```

### Configuration

1. Copy environment template:
```bash
cp .env.example .env
```

2. Configure `.env`:
```env
PRIVATE_KEY=your_private_key_without_0x_prefix
COSTON2_RPC_URL=https://coston2-api.flare.network/ext/C/rpc
FDC_VERIFIER_API_KEY=your_verifier_api_key
```

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm run test
```

### Deploy to Coston2 Testnet

```bash
# Deploy all contracts
npm run deploy:coston2

# Deploy only Flare-specific contracts
npm run deploy:flare-contracts
```

### Verify Contracts

```bash
npx hardhat verify --network coston2 <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## 📊 FTSO Price Feed Usage

After deployment, interact with FTSO v2 prices:

```bash
npm run ftso:prices
```

Example output:
```
💹 FTSO v2 PRICE FEEDS
============================================================
FLR/USD       $0.018234 | Updated: 1/15/2024, 10:30:00 AM
BTC/USD      $42156.789 | Updated: 1/15/2024, 10:30:00 AM
ETH/USD       $2534.567 | Updated: 1/15/2024, 10:30:00 AM
============================================================
```

## 🔄 FDC Attestation Workflow

### 1. Prepare Attestation Request

```bash
npm run fdc:prepare
```

This creates a properly formatted EVMTransaction attestation request.

### 2. Submit to FDCHub

```bash
npm run fdc:submit
```

Submits the attestation request to FDCHub contract (requires 1 FLR fee).

### 3. Verify Attestation

```bash
npm run fdc:verify
```

After the voting round (90-180 seconds), retrieves and verifies the proof.

## 📋 Contract Addresses

### Coston2 Testnet (Chain ID: 114)

| Contract | Address |
|----------|---------|
| ContractRegistry | `0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019` |
| FDCHub | `0x1c78A073E3BD2aCa4cc327d55FB0cD4f0549B55b` |

*Deployed contract addresses are saved in `deployments/` directory*

### Flare Mainnet (Chain ID: 14)

| Contract | Address |
|----------|---------|
| ContractRegistry | `0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019` |
| FDCHub | `0x1c78A073E3BD2aCa4cc327d55FB0cD4f0549B55b` |

## 🔐 Access Control

The contracts use OpenZeppelin's AccessControl:

| Role | Purpose |
|------|---------|
| `DEFAULT_ADMIN_ROLE` | Full admin access |
| `POLICY_MANAGER_ROLE` | Create/manage policies |
| `OPERATOR_ROLE` | Process claims, verify data |
| `PROCESSOR_ROLE` | Automated claim processing |

## 🧪 Testing

### Local Testing (Hardhat Network)

```bash
# Start local node
npm run node

# Deploy to local
npm run deploy:local

# Run tests
npm run test
```

### Test Coverage

```bash
npm run test:coverage
```

## 📚 Resources

- [Flare Developer Docs](https://dev.flare.network/)
- [FDC Documentation](https://dev.flare.network/fdc/overview)
- [FTSO v2 Documentation](https://dev.flare.network/ftso/overview)
- [Flare Network Getting Started](https://dev.flare.network/network/getting-started)
- [Coston2 Explorer](https://coston2-explorer.flare.network/)
- [Coston2 Faucet](https://faucet.flare.network/coston2)

## 🛠️ Development

### Gas Optimization

Contracts use:
- Solidity optimizer (200 runs)
- `viaIR` compilation
- Efficient storage patterns

### Security Considerations

- All external calls use checks-effects-interactions pattern
- Reentrancy guards on state-changing functions
- Access control on privileged functions
- Proper input validation

## 📄 License

MIT License - see [LICENSE](../LICENSE)
