# Minimal x402 Implementation for Sui Network

This document describes our custom minimal x402 payment protocol implementation for the Sui network.

## Architecture

```
┌─────────────┐
│  Frontend   │
│  (Next.js)  │
└──────┬──────┘
       │ HTTP Request
       │ X-PAYMENT header
       ▼
┌─────────────┐
│   Backend   │
│  (Fastify)  │
│             │
│ ┌─────────┐ │
│ │x402     │ │
│ │Middleware│ │
│ └────┬────┘ │
│      │      │
│      ▼      │
│ ┌─────────┐ │
│ │x402     │ │
│ │Facilitator││
│ └─────────┘ │
└─────────────┘
```

## Flow

1. **Client Request**: Frontend requests resource (e.g., `/api/song/stream/:id`)
2. **402 Response**: Backend returns `402 Payment Required` with payment instructions
3. **Payment Header**: Frontend creates payment payload and retries with `X-PAYMENT` header
4. **Verification**: Backend calls facilitator `/verify` endpoint
5. **Success**: If valid, backend returns resource (stream URL)

## Components

### 1. x402 Middleware (`backend/src/middleware/x402Middleware.ts`)

- Intercepts requests requiring payment
- Extracts `X-PAYMENT` header
- Calls facilitator for verification
- Returns `402` if payment invalid/missing

### 2. x402 Facilitator (`backend/src/services/x402Facilitator.ts`)

- Validates payment signatures
- Checks timestamp (prevents replay attacks)
- Verifies amount and recipient match
- Returns verification result

### 3. Facilitator Routes (`backend/src/routes/x402.routes.ts`)

- `POST /x402/verify` - Verify payment signatures
- `POST /x402/settle` - Execute on-chain payments (optional)
- `GET /x402/health` - Health check

## Payment Payload Format

```typescript
{
  signature: string;      // Auth signature (temporary: "auth_timestamp_address")
  message: string;        // Authorization message JSON
  publicKey: string;      // Wallet address
  amount: string;         // Amount in MIST (1 SUI = 1,000,000,000 MIST)
  recipient: string;       // Artist wallet address
  nonce: string;          // Unique nonce
  timestamp: number;       // Unix timestamp in milliseconds
}
```

## Endpoints

### Protected Resource
```
GET /api/song/stream/:id
Headers: X-PAYMENT: <base64-encoded-payment-payload>
Response: 402 Payment Required | 200 OK with stream URL
```

### Facilitator
```
POST /x402/verify
Query Params:
  - expectedAmount (optional): Expected amount in MIST
  - expectedRecipient (optional): Expected recipient address
Body: PaymentPayload
Response: { valid: boolean, transactionHash?: string, error?: string }
```

## Testing

The facilitator accepts temporary auth tokens for testing:
- Format: `auth_<timestamp>_<address>`
- No cryptographic verification required
- Validates format and structure only

## Production Considerations

1. **Signature Verification**: Implement full Ed25519 signature verification
2. **On-Chain Settlement**: Execute actual Sui transactions for payments
3. **Rate Limiting**: Prevent abuse
4. **Caching**: Cache verification results
5. **Monitoring**: Track payment success/failure rates

## Environment Variables

```env
# Facilitator URL (local by default)
X402_FACILITATOR_URL=http://localhost:3001/x402

# Use mock verification (for testing)
X402_USE_MOCK=false

# Sui Network
SUI_NETWORK=testnet
```

