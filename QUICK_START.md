# 🚀 Quick Start Guide

Get WalTune running in 3 steps!

## Step 1: Backend Setup (2 minutes)

```bash
# Navigate to backend
cd backend

# Copy environment file
cp .env.example .env

# Install dependencies (already done)
# npm install

# Start the server
npm run dev
```

✅ Backend should now be running on http://localhost:3001

Test it: Open http://localhost:3001/health in your browser
You should see: `{"status":"ok","timestamp":"..."}`

## Step 2: Frontend Setup (1 minute)

```bash
# In a new terminal, navigate to frontend
cd frontend

# Environment already configured in .env.local
# Dependencies already installed

# Start the development server
npm run dev
```

✅ Frontend should now be running on http://localhost:3000

## Step 3: Test the App (5 minutes)

### Install Sui Wallet (if not already)

1. Install [Sui Wallet Extension](https://chrome.google.com/webstore/detail/sui-wallet) for Chrome
2. Create or import a wallet
3. Get testnet SUI from [Sui Faucet](https://discord.gg/sui) (Discord)

### Test the Flow

1. Open http://localhost:3000
2. Click "Connect Wallet"
3. Select your Sui wallet and connect
4. Navigate to "Artist Dashboard"
5. Register as an artist
6. Try uploading a song (MP3 file)

## 📝 Note About Walrus

Currently, song uploads will fail because Walrus testnet credentials are not configured.

To enable uploads:

1. Get Walrus testnet access
2. Update `backend/.env` with your credentials:
   ```env
   WALRUS_PUBLISHER_URL=your_publisher_url
   WALRUS_AGGREGATOR_URL=your_aggregator_url
   ```
3. Restart the backend

## 🎯 What Works Without Walrus

✅ All UI pages and navigation
✅ Wallet connection
✅ Artist registration
✅ Browse interface
✅ Music player UI (with test data)

## 🔥 What Needs Walrus

⏳ Actual song file upload
⏳ Actual song playback

## 🎉 You're Ready!

Explore the UI, connect your wallet, and register as an artist. When you get Walrus credentials, you'll be able to upload and stream real songs!

---

**Questions?** Check `PROJECT_STATUS.md` or `SETUP_COMPLETE.md` for detailed documentation.
