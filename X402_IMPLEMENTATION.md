# x402 Payment Integration Guide

## Overview

WalTune now supports seamless micropayments using the x402 protocol on Sui network. Users sign a one-time authorization, and payments are automatically deducted for each song play.

## Architecture

```
Frontend (MusicPlayer)
  ↓ Requests stream with payment
Backend (/api/song/stream/:id)
  ↓ Checks X-PAYMENT header
x402 Middleware
  ↓ Verifies payment
BlockEden x402 Facilitator
  ↓ Returns verification
Backend returns Walrus stream URL
  ↓
Audio plays seamlessly
```

## Key Components

### Backend

1. **`backend/src/services/x402Service.ts`**
   - Payment instruction generation
   - Payment verification via facilitator
   - Payment settlement

2. **`backend/src/middleware/x402Middleware.ts`**
   - HTTP 402 Payment Required responses
   - Payment header extraction
   - Payment verification

3. **`backend/src/routes/song.routes.ts`**
   - `/api/song/stream/:id` - Payment-gated streaming
   - `/api/song/play/:id` - Payment-gated play recording

### Frontend

1. **`frontend/lib/x402-client.ts`**
   - Authorization management
   - Payment payload creation
   - Seamless payment requests

2. **`frontend/components/MusicPlayer.tsx`**
   - Integrated payment flow
   - One-time authorization
   - Automatic payments

## Environment Variables

### Backend (.env)
```env
X402_FACILITATOR_URL=https://x402-facilitator.blockeden.xyz
SUI_NETWORK=testnet
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
```

## User Flow

1. **First Play:**
   - User clicks play
   - Wallet prompts for authorization signature
   - User signs (authorizes up to 1 SUI)
   - Authorization stored in localStorage (24h expiry)
   - Payment processed automatically
   - Song streams

2. **Subsequent Plays:**
   - User clicks play
   - Authorization found in localStorage
   - Payment processed automatically (no signature needed)
   - Song streams immediately

3. **Authorization Expiry:**
   - After 24 hours, authorization expires
   - User prompted to re-authorize
   - Process repeats from step 1

## Testing

1. Start backend:
   ```bash
   cd backend
   npm run dev
   ```

2. Start frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Test flow:
   - Connect Sui wallet
   - Navigate to Explore page
   - Click play on any song
   - Approve authorization (one-time)
   - Song should play automatically
   - Play another song (should work without approval)

## Payment Details

- **Authorization Limit:** 1 SUI (configurable in `x402-client.ts`)
- **Authorization Duration:** 24 hours
- **Payment Per Play:** Set by artist (default 0.01 SUI)
- **Network:** Sui Testnet
- **Facilitator:** BlockEden.xyz

## Troubleshooting

### Payment Verification Fails
- Check `X402_FACILITATOR_URL` in backend `.env`
- Verify facilitator is accessible
- Check network connectivity

### Authorization Not Working
- Check browser localStorage
- Verify wallet connection
- Check console for errors

### Stream Not Loading
- Verify Walrus blob ID is correct
- Check `WALRUS_AGGREGATOR_URL` configuration
- Verify payment was successful

## API Endpoints

### GET `/api/song/stream/:id`
Returns Walrus stream URL after payment verification.

**Headers:**
- `X-PAYMENT`: JSON payment payload (required)

**Response:**
```json
{
  "redirect": "https://aggregator.walrus-testnet.walrus.space/v1/blobs/{blobId}"
}
```

**Error (402 Payment Required):**
```json
{
  "error": "Payment Required",
  "payment": {
    "amount": "10000000",
    "currency": "SUI",
    "recipient": "0x...",
    "network": "sui-testnet",
    "facilitator": "https://x402-facilitator.blockeden.xyz"
  }
}
```

## Security Considerations

1. **Authorization Limits:** Users authorize up to 1 SUI max
2. **Expiry:** Authorizations expire after 24 hours
3. **Verification:** All payments verified via facilitator
4. **Storage:** Authorizations stored locally (not on server)

## Future Enhancements

- [ ] Support for "up to" payment scheme
- [ ] Batch payment settlements
- [ ] Payment history tracking
- [ ] Authorization revocation
- [ ] Multi-token support (USDC, etc.)

