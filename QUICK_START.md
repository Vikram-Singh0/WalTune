# 🚀 WalTune - Quick Start (2 Minutes)

## ✅ What's Ready

Your decentralized music platform is **fully functional**:

- Smart contracts deployed on Sui Devnet
- Frontend integrated with blockchain
- Walrus storage for audio files
- Everything works!

---

## 🎯 Start Using It NOW

### 1. Start the App (30 seconds)

```bash
cd frontend
npm install  # First time only
npm run dev
```

Open http://localhost:3000

### 2. Setup Wallet (1 minute)

- Install [Sui Wallet](https://chrome.google.com/webstore/detail/sui-wallet) extension
- Create wallet or import existing
- **Switch to Devnet** in wallet settings
- Get free test SUI: Click the faucet button in wallet

### 3. Register & Upload (30 seconds)

- Click "Connect Wallet" on site
- Approve connection
- Enter artist name → Sign transaction
- Click "Upload Song" → Select MP3 → Sign transaction
- Done! 🎉

---

## 🎵 What Happens

**Artist Registration:**

```
You sign → Sui blockchain creates Artist object → Owned by your wallet
```

**Song Upload:**

```
MP3 file → Walrus storage (get blob ID)
→ You sign → Sui blockchain stores metadata + blob ID
→ Song can be streamed!
```

**Playing Songs:**

```
Query Sui → Get blob ID → Stream from Walrus → Play music!
```

---

## 🔍 Verify It's Working

### Browser Console (F12)

Look for:

```
✅ Artist registered on Sui blockchain
📤 Uploading audio to Walrus...
✅ Uploaded to Walrus, blob ID: ...
✅ Song registered on Sui blockchain
```

### Sui Explorer

Your transactions: https://suiscan.xyz/devnet/account/YOUR_WALLET_ADDRESS

### Test Streaming

After upload, console shows:

```
🎵 Stream URL: https://aggregator.walrus-testnet.walrus.space/v1/BLOB_ID
```

Open that URL → Audio plays directly!

---

## ⚠️ Common Issues

**"Transaction failed"**
→ Make sure wallet is on Devnet (not Testnet/Mainnet)

**"No gas"**
→ Use wallet faucet or run: `sui client faucet`

**"Walrus upload slow"**
→ Normal! Takes 10-30 seconds. Be patient.

**"No songs showing"**
→ Wait for transaction confirmation, then refresh

---

## 📚 More Info

- **Full Testing Guide**: `TESTING_GUIDE.md`
- **Technical Details**: `CURRENT_STATUS.md`
- **Contract Info**: `contracts/DEPLOYED_ADDRESSES.md`
- **Integration Guide**: `frontend/INTEGRATION_GUIDE.md`

---

## 🎉 That's It!

You now have a working decentralized music platform:

- ✅ No centralized servers
- ✅ Music stored on Walrus
- ✅ Metadata on Sui blockchain
- ✅ Artists own their content
- ✅ Transparent payments ready

**Start uploading your music! 🎵**
