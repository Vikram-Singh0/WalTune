# WalTune Frontend Deployment Guide (Vercel)

## Environment Variables for Vercel

Add these environment variables in your Vercel project settings:

### Required Environment Variables

```env
# Backend API URL (your deployed Render backend)
NEXT_PUBLIC_API_URL=https://waltune.onrender.com

# Sui Network Configuration
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io:443

# Sui Contract Addresses (Testnet)
NEXT_PUBLIC_PACKAGE_ID=0x5e49fc9853d27dff034b58f0dbbed0a6f53ce10c77a19cc157fcc1b0163024f1
NEXT_PUBLIC_ARTIST_REGISTRY_ID=0xd8014d276dc53243e75da359c0b2d0348d0178c219851ce15a5539a65d18fb31
NEXT_PUBLIC_SONG_REGISTRY_ID=0x582682f484e8a8a0ec83ffc63d2c1215eb196e3d7db879254b97ab9181069da5

# Walrus Configuration (for streaming audio blobs)
NEXT_PUBLIC_WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
```

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository (WalTune)
4. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
5. Add all environment variables listed above in the "Environment Variables" section
6. Click "Deploy"

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

3. Login to Vercel:
   ```bash
   vercel login
   ```

4. Deploy:
   ```bash
   vercel
   ```

5. Follow the prompts and add environment variables when asked, or add them later via the dashboard.

### Option 3: Add Environment Variables via CLI

After deploying, you can add environment variables using:

```bash
vercel env add NEXT_PUBLIC_API_URL
# Enter value: https://waltune.onrender.com

vercel env add NEXT_PUBLIC_SUI_NETWORK
# Enter value: testnet

vercel env add NEXT_PUBLIC_SUI_RPC_URL
# Enter value: https://fullnode.testnet.sui.io:443

vercel env add NEXT_PUBLIC_PACKAGE_ID
# Enter value: 0x5e49fc9853d27dff034b58f0dbbed0a6f53ce10c77a19cc157fcc1b0163024f1

vercel env add NEXT_PUBLIC_ARTIST_REGISTRY_ID
# Enter value: 0xd8014d276dc53243e75da359c0b2d0348d0178c219851ce15a5539a65d18fb31

vercel env add NEXT_PUBLIC_SONG_REGISTRY_ID
# Enter value: 0x582682f484e8a8a0ec83ffc63d2c1215eb196e3d7db879254b97ab9181069da5

vercel env add NEXT_PUBLIC_WALRUS_AGGREGATOR_URL
# Enter value: https://aggregator.walrus-testnet.walrus.space
```

Then redeploy:
```bash
vercel --prod
```

## Post-Deployment

After deployment:

1. ✅ Your frontend will be available at: `https://your-project.vercel.app`
2. ✅ Verify that the app can connect to your backend at `https://waltune.onrender.com`
3. ✅ Test artist registration and song upload functionality
4. ✅ Ensure Sui wallet connection works properly

## Important Notes

- All environment variables starting with `NEXT_PUBLIC_` are exposed to the browser
- These are safe to expose as they're contract addresses and public URLs
- No private keys or secrets should be added to frontend environment variables
- If you update environment variables, you need to redeploy for changes to take effect

## Troubleshooting

### Backend Connection Issues
If the frontend can't connect to the backend:
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check that your Render backend is running
- Ensure CORS is configured in your backend to allow requests from your Vercel domain

### Contract Interaction Issues
- Verify all contract addresses are correct
- Ensure you're connected to Sui Testnet in your wallet
- Check that the contracts are deployed and accessible

### Build Failures
- Check that all dependencies are listed in `package.json`
- Verify Node.js version compatibility (Next.js typically requires Node 18+)
- Review build logs in Vercel dashboard for specific errors
