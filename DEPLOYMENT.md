# 🚀 Quick Deployment Guide

## Step 1: Get Testnet SUI Tokens

Visit: https://faucet.sui.io/?address=0xb8675a17fca689548abfe0a1633879a6cbc3aaf5938bb1a0ece2b855311e5b30

Click "Request" and wait ~30 seconds.

Verify:

```powershell
sui client gas
```

You should see at least 1 SUI coin.

---

## Step 2: Deploy Smart Contracts

**Correct Command** (note: two dashes before gas-budget):

```powershell
cd contracts
sui client publish --gas-budget 100000000
```

**Common Mistake**:

```powershell
# ❌ WRONG (single dash)
sui client publish -gas-budget 100000000

# ✅ CORRECT (double dash)
sui client publish --gas-budget 100000000
```

---

## Step 3: Save Deployment Output

The output will look like this:

```
Transaction Digest: 5X7...abc
╭──────────────────────────────────────────────────────────────╮
│ Transaction Effects                                          │
├──────────────────────────────────────────────────────────────┤
│ Status : Success                                             │
╰──────────────────────────────────────────────────────────────╯

╭──────────────────────────────────────────────────────────────╮
│ Created Objects                                              │
├──────────────────────────────────────────────────────────────┤
│ ID: 0xabc123...def                                           │
│ Owner: Shared                                                │
│ Type: 0xPACKAGE_ID::artist::ArtistRegistry                   │
├──────────────────────────────────────────────────────────────┤
│ ID: 0x456789...ghi                                           │
│ Owner: Shared                                                │
│ Type: 0xPACKAGE_ID::song_registry::SongRegistry              │
╰──────────────────────────────────────────────────────────────╯

╭──────────────────────────────────────────────────────────────╮
│ Published Objects                                            │
├──────────────────────────────────────────────────────────────┤
│ PackageID: 0xPACKAGE_ID                                      │
│ Version: 1                                                   │
╰──────────────────────────────────────────────────────────────╯
```

**Save these 3 values**:

1. **Package ID**: `0xPACKAGE_ID` (from Published Objects section)
2. **ArtistRegistry ID**: `0xabc123...def` (first Created Object with type `artist::ArtistRegistry`)
3. **SongRegistry ID**: `0x456789...ghi` (second Created Object with type `song_registry::SongRegistry`)

---

## Step 4: Update Backend

Open: `backend/src/sui/suiService.ts`

Find the constructor and update:

```typescript
constructor() {
  this.suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

  // Paste your actual IDs here:
  this.setContractIds(
    '0xYOUR_PACKAGE_ID_FROM_STEP_3',
    '0xYOUR_ARTIST_REGISTRY_ID_FROM_STEP_3',
    '0xYOUR_SONG_REGISTRY_ID_FROM_STEP_3'
  );
}
```

---

## Step 5: Update .env

Create/update `backend/.env`:

```env
PORT=3001
SUI_NETWORK=testnet
SUI_PACKAGE_ID=0xYOUR_PACKAGE_ID
SUI_ARTIST_REGISTRY_ID=0xYOUR_ARTIST_REGISTRY_ID
SUI_SONG_REGISTRY_ID=0xYOUR_SONG_REGISTRY_ID

# Add these once you get Walrus access:
WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
```

---

## Verification

Check your deployment on Sui Explorer:
https://suiscan.xyz/testnet/object/YOUR_PACKAGE_ID

---

## Troubleshooting

### Error: "Insufficient gas"

- Run: `sui client gas` to check balance
- Get more tokens: https://faucet.sui.io/

### Error: "invalid flag: -gas-budget"

- Use double dash: `--gas-budget` not `-gas-budget`

### Error: "Cannot find module"

- Make sure you're in the `contracts` folder
- Run: `sui move build` first to verify contracts compile
