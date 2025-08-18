# Nadilo - Crypto Clash Game

A blockchain-based fighting game integrated with Monad Games ID for cross-app authentication and leaderboards.

## 🎮 Features

- **Cross-app Authentication**: Login with Monad Games ID
- **Blockchain Integration**: Score submissions to Monad Testnet
- **Real-time Leaderboards**: Both local and blockchain-based
- **Seamless User Experience**: Shared wallets and usernames across apps

## 🔧 Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Your Privy App ID (you need to create your own Privy app)
VITE_PRIVY_APP_ID=your_privy_app_id_here

# Monad Games ID App ID (don't change this)
VITE_MONAD_GAMES_ID=cmd8euall0037le0my79qpz42

# For backend/server functionality (optional)
# WALLET_PRIVATE_KEY=your_private_key_for_server_transactions
```

### 2. Privy Dashboard Configuration

**Important**: You need to create your own Privy app and configure it for cross-app authentication.

1. **Create a Privy App**:
   - Go to [Privy Dashboard](https://dashboard.privy.io/)
   - Create a new app
   - Copy your App ID to `VITE_PRIVY_APP_ID`

2. **Configure Cross-App Authentication**:
   - In your Privy Dashboard, navigate to **Global Wallets** → **Integrations**
   - Find **Monad Games ID** in the list
   - Enable the integration by clicking the toggle

3. **Set up Your App as Provider** (Optional):
   - Go to **Global Wallets** → **My app**
   - Enable "Make my wallet available for other apps to integrate"
   - Upload a square logo (180x180px recommended)

### 3. Installation

```bash
npm install
```

### 4. Development

```bash
npm run dev
```

### 5. Build & Deploy

```bash
npm run build
```

For Vercel deployment, make sure to set the environment variables in your Vercel project settings.

## 🔗 Integration with Monad Games ID

This app is configured to work with [Monad Games ID](https://monad-games-id-site.vercel.app/) for cross-app authentication. Users who register with Monad Games ID can:

- Use their existing username across all integrated games
- Share their embedded wallet across apps
- Maintain a unified gaming identity

## 🎯 Game Contracts

- **Game Address**: `0x5b84Dc548e45cC4f1498b95C000C748c1c953f64`
- **Leaderboard Contract**: `0xceCBFF203C8B6044F52CE23D914A1bfD997541A4`
- **Network**: Monad Testnet (Chain ID: 10143)

## 🚀 Features

### Authentication Flow
1. User clicks "Sign In with Monad Games ID"
2. Privy checks for existing cross-app account from Monad Games ID
3. If found, user gets their existing wallet and username
4. If not found, user needs to register at Monad Games ID first

### Game Features
- Real-time combat system
- Score submission to blockchain
- Local and blockchain leaderboards
- Address management and synchronization

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Authentication**: Privy with cross-app support
- **Blockchain**: Monad Testnet
- **Web3**: Viem for blockchain interactions
- **Styling**: CSS with custom components

## 📝 API Integration

The app integrates with Monad Games ID API:
- `GET /api/check-wallet?wallet=<address>` - Check if wallet has registered username
- Returns user data and registration status

## 🔍 Troubleshooting

### Common Issues

1. **"No Monad Games ID linked"**:
   - Check that cross-app integration is enabled in Privy Dashboard
   - Ensure user has registered with Monad Games ID first

2. **Environment variables not loading**:
   - Make sure `.env.local` exists in root directory
   - Verify variable names start with `VITE_`
   - Restart development server after changes

3. **Cross-app authentication not working**:
   - Verify `VITE_PRIVY_APP_ID` is your app's ID (not Monad Games ID's)
   - Check Privy Dashboard integrations are enabled
   - Ensure loginMethodsAndOrder includes the correct cross-app ID

## 📞 Support

For issues with:
- **Monad Games ID**: Visit [https://monad-games-id-site.vercel.app/](https://monad-games-id-site.vercel.app/)
- **Privy Integration**: Check [Privy Documentation](https://docs.privy.io/wallets/global-wallets/)
- **Game Issues**: Create an issue in this repository
