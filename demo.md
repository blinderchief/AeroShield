# 🎬 AeroShield User Demo

A complete walkthrough of AeroShield from a user's perspective.

---

## **Step 1: Landing Page**

When you first visit AeroShield, you see a stunning landing page with:

- **Hero Section**: "Flight delayed? Get paid instantly." - The value proposition is immediately clear
- **Key Stats**: $2.4M+ TVL, <3 min average payout, 98.5% AI accuracy
- **Live Preview Card**: Shows a sample policy for flight 6E-542 DEL→BOM with AI Risk assessment
- **Tech Stack**: Powered by Flare Network, Google Gemini AI, OpenZeppelin, ERC-721

**User Action**: Click "Get Started" or "Protect Your Flight" to begin

---

## **Step 2: Sign In / Sign Up**

Users can sign in using Clerk authentication:
- Email/Password
- Google OAuth
- Other social providers

After signing in, users are redirected to the dashboard.

---

## **Step 3: Dashboard Overview**

The dashboard shows:
- **Welcome message**: "Welcome back, [Name]! 👋"
- **Stats Cards**:
  - Active Policies count
  - Total Coverage amount (₹)
  - Pool TVL ($2.4M)
  - Average Payout time (<3min)
- **Your Policies**: List of active flight protections
- **AI Insights Sidebar**:
  - Weather alerts ("Monsoon activity detected in DEL")
  - Route insights ("DEL-BOM has 23% higher delays during evening")
  - Good news updates

**User Action**: Click "Protect New Flight" to buy insurance

---

## **Step 4: Buy Policy - Enter Flight Details**

A 3-step wizard guides the user:

**Step 1 of 3: Flight Details**
- **Airline**: Select from IndiGo (6E), Air India (AI), Vistara (UK), SpiceJet (SG), etc.
- **Flight Number**: Enter the flight number (e.g., "542")
- **Departure Airport**: DEL, BOM, BLR, HYD, MAA, CCU, GOI, PNQ
- **Arrival Airport**: Select destination
- **Departure Date & Time**: Pick your flight time
- **Arrival Date & Time**: Pick expected arrival
- **Coverage Amount**: Slider from ₹1,000 to ₹20,000
- **Delay Threshold**: 1 hour, 2 hours, 3 hours, or 4 hours

**Example Input**:
```
Airline: 6E - IndiGo
Flight: 542
From: DEL - Delhi
To: BOM - Mumbai  
Date: Dec 10, 2025, 10:00 AM
Coverage: ₹5,000
Threshold: 2 hours
```

**User Action**: Click "Get AI Quote"

---

## **Step 5: AI Risk Assessment (Step 2 of 3)**

The Gemini AI analyzes your flight and returns:

- **Delay Probability**: 72% (High Risk) - shown with color coding
- **Coverage**: ₹5,000 for 2h+ delay
- **Premium**: ₹65 (AI-calculated based on risk)

**AI Insights**:
- 🌧️ **Weather Analysis**: "Heavy monsoon expected at DEL, increased turbulence likely"
- 📊 **Historical Analysis**: "This route has 23% higher delays in evening slots"

**Risk Factors Breakdown**:
| Factor | Impact Score | Type |
|--------|--------------|------|
| Weather | 85% | Negative |
| Historical Performance | 65% | Negative |
| Airport Congestion | 45% | Negative |
| Aircraft Turnaround | 30% | Neutral |

**User Action**: Click "Pay ₹65 & Protect"

---

## **Step 6: Success! (Step 3 of 3)**

🎉 **"You're Protected!"**

- Confirmation message: "Your flight is now covered"
- Policy NFT is minted on Flare Network
- Options: "View Dashboard" or "Protect Another Flight"

---

## **Step 7: View My Policies**

Users can manage all their policies:

- **Stats Overview**:
  - Total Policies
  - Active Coverage
  - Total Premiums Paid
  - Active Policies count

- **Search & Filter**: Find policies by flight number, filter by status (Active, Triggered, Claimed, Expired)

- **Policy Cards** show:
  - Flight number (6E-542)
  - Status badge (Active ✅)
  - Route (DEL → BOM)
  - Departure time
  - Coverage amount (₹5,000)
  - Premium paid (₹65)
  - Payout tiers (1h: 25%, 2h: 50%, 4h+: 75%, Cancellation: 100%)

**User Action**: Click the eye icon to see full policy details

---

## **Step 8: Claims Page**

If a flight is delayed beyond the threshold:

**Stats Cards**:
- Total Claims
- Pending claims
- Approved claims
- Total Payouts received

**Submit New Claim**:
1. Click "Submit New Claim"
2. Select an eligible policy (after flight arrival time)
3. Click "Submit Claim"
4. AI-powered FDC verification automatically checks flight status

**Claim Status Flow**:
| Status | Description |
|--------|-------------|
| ⏳ Pending | Submitted, awaiting verification |
| 🔄 Processing | FDC verifying flight data |
| ✅ Approved | Delay confirmed |
| 💰 Paid | Payout sent to wallet |

**No paperwork required!** The Flare Data Connector automatically verifies the delay from official flight data sources.

---

## **Step 9: Wallet Management**

**Connect Your Wallet**:
- Click "Connect Wallet" (RainbowKit integration)
- Supports MetaMask, WalletConnect, Coinbase Wallet
- Connect to Flare Coston2 Testnet (Chain ID: 114)

**Once Connected**:
- **Wallet Address**: 0x1234...abcd (with copy & explorer link)
- **Native Balance**: C2FLR tokens
- **USDC Balance**: Stablecoin holdings
- **Total Claims Received**: Sum of all payouts

**Transaction History**:
- Premium payments (outgoing)
- Claim payouts (incoming)
- Deposits/withdrawals

**Network Info**:
| Property | Value |
|----------|-------|
| Network | Flare Coston2 Testnet |
| Chain ID | 114 |
| RPC | https://coston2-api.flare.network/ext/C/rpc |
| Explorer | https://coston2-explorer.flare.network |

---

## **Step 10: Settings**

User can manage:
- **Profile Information**: Name, email, avatar
- **Wallet Settings**: Connected Flare address, XRPL address
- **Notification Preferences**: Email alerts for claims, policy status
- **Security**: Two-factor authentication

---

## 📱 Complete User Journey Summary

```
┌─────────────────────────────────────────────────────────────────┐
│  1. DISCOVER         │  Landing page, learn about AeroShield   │
├─────────────────────────────────────────────────────────────────┤
│  2. SIGN UP          │  Quick auth via Clerk (Google/Email)    │
├─────────────────────────────────────────────────────────────────┤
│  3. CONNECT WALLET   │  Link MetaMask to Flare Coston2         │
├─────────────────────────────────────────────────────────────────┤
│  4. BUY POLICY       │  Enter flight → AI quote → Pay ₹65      │
├─────────────────────────────────────────────────────────────────┤
│  5. TRAVEL           │  Policy monitors your flight            │
├─────────────────────────────────────────────────────────────────┤
│  6. FLIGHT DELAYED?  │  FDC auto-detects & verifies delay      │
├─────────────────────────────────────────────────────────────────┤
│  7. AUTO PAYOUT      │  ₹2,500 sent to wallet in <3 minutes!   │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key User Benefits

1. **No Claims Process** - Automatic detection & payout
2. **AI-Powered Pricing** - Fair premiums based on actual risk
3. **Transparent** - All policies are NFTs on blockchain
4. **Instant Payouts** - Money in wallet within minutes
5. **Gasless** - No need to pay gas fees (Smart Accounts)

---

## 🔗 Quick Links

| Page | URL |
|------|-----|
| Homepage | http://localhost:3000 |
| Sign In | http://localhost:3000/sign-in |
| Dashboard | http://localhost:3000/dashboard |
| Buy Policy | http://localhost:3000/dashboard/buy |
| My Policies | http://localhost:3000/dashboard/policies |
| Claims | http://localhost:3000/dashboard/claims |
| Wallet | http://localhost:3000/dashboard/wallet |
| Settings | http://localhost:3000/dashboard/settings |
| API Docs | http://localhost:8000/docs |

---

The entire experience is designed to be seamless - from discovering AeroShield to receiving your payout when your flight is delayed! 🛡️✈️
