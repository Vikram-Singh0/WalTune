# 🎯 WalTune Project Checklist

**Last Updated**: November 20, 2025

---

## ✅ COMPLETED TASKS

### 1. Backend Setup ✅

- [x] Fastify server with TypeScript
- [x] ES Modules configuration
- [x] Port 3001, CORS enabled
- [x] Multipart file upload support
- [x] 8 API endpoints (artist + song routes)
- [x] Walrus client integration code
- [x] Temporary in-memory storage
- [x] Sui service skeleton created

**Files**: `backend/src/index.ts`, `controllers/`, `routes/`, `services/`, `walrus/`, `sui/`

### 2. Frontend Setup ✅

- [x] Next.js 16 + React 19 + Tailwind v4
- [x] Port 3000
- [x] 3 pages: Home, Explore, Dashboard
- [x] 4 components: Header, WalletConnect, MusicPlayer, SongCard
- [x] Sui wallet integration (@mysten/dapp-kit)
- [x] API client functions

**Files**: `frontend/app/`, `frontend/components/`, `frontend/lib/`

### 3. Smart Contracts ✅

- [x] `artist.move` - Artist registry
- [x] `song_registry.move` - Song metadata + walrus_blob_id
- [x] `payment.move` - Micropayments
- [x] `Move.toml` - Package configuration
- [x] Contracts built successfully (`sui move build`)

**Files**: `contracts/*.move`

### 4. Sui CLI Setup ✅

- [x] Installed via winget (v1.61.1)
- [x] Configured testnet RPC: `https://fullnode.testnet.sui.io:443`
- [x] Generated address: `0xb8675a17fca689548abfe0a1633879a6cbc3aaf5938bb1a0ece2b855311e5b30`
- [x] Alias: `eloquent-labradorite`

---

## ⏳ PENDING TASKS

### Phase 1: Get Required Credentials

#### Task 1.1: Get Testnet SUI Tokens 💰

**Status**: Not Started
**Action**:

1. Visit: https://faucet.sui.io/?address=0xb8675a17fca689548abfe0a1633879a6cbc3aaf5938bb1a0ece2b855311e5b30
2. Click "Request" button
3. Wait for tokens (usually instant)
4. Verify: `sui client gas`

**Needed For**: Contract deployment (gas fees)

---

#### Task 1.2: Get Walrus Testnet Access 🐋

**Status**: Not Started
**Action**:

1. Visit Walrus documentation/testnet sign-up
2. Request testnet access
3. Obtain credentials:
   - `WALRUS_PUBLISHER_URL` (for uploads)
   - `WALRUS_AGGREGATOR_URL` (for downloads/streaming)

**Where to Add**: `backend/.env`

**Documentation**: Check Walrus docs for current testnet registration process

---

### Phase 2: Deploy & Configure

#### Task 2.1: Deploy Smart Contracts to Sui Testnet 📝

**Status**: Not Started (Ready to deploy after getting SUI tokens)

**Command**:

```powershell
cd contracts
sui client publish --gas-budget 100000000
```

**Save These Values From Output**:

```
📦 Package ID: 0x... (the main package identifier)
🏛️ ArtistRegistry Object ID: 0x... (shared object for artist registry)
🎵 SongRegistry Object ID: 0x... (shared object for song registry)
```

**Example Output to Look For**:

```
Created Objects:
- ID: 0xabc123... , Owner: Shared
  ├─ Type: 0xpackage::artist::ArtistRegistry

- ID: 0xdef456... , Owner: Shared
  ├─ Type: 0xpackage::song_registry::SongRegistry
```

---

#### Task 2.2: Update Backend with Contract IDs 🔧

**Status**: Not Started (depends on Task 2.1)

**File**: `backend/src/sui/suiService.ts`

**Action**:

1. Open `suiService.ts`
2. Call `setContractIds()` in constructor:

```typescript
constructor() {
  this.suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

  // Add these lines with YOUR deployed contract IDs:
  this.setContractIds(
    '0xYOUR_PACKAGE_ID',
    '0xYOUR_ARTIST_REGISTRY_ID',
    '0xYOUR_SONG_REGISTRY_ID'
  );
}
```

3. Remove placeholder `throw new Error()` from methods
4. Implement actual blockchain transactions

---

#### Task 2.3: Add Walrus Credentials to .env 🔐

**Status**: Not Started (depends on Task 1.2)

**File**: `backend/.env`

**Create/Update with**:

```env
# Server
PORT=3001

# Walrus Testnet Credentials
WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space

# Sui Network
SUI_NETWORK=testnet
SUI_PACKAGE_ID=0xYOUR_PACKAGE_ID
SUI_ARTIST_REGISTRY_ID=0xYOUR_ARTIST_REGISTRY_ID
SUI_SONG_REGISTRY_ID=0xYOUR_SONG_REGISTRY_ID

# Optional
NODE_ENV=development
```

**⚠️ Note**: Replace URLs with actual testnet endpoints from Walrus documentation

---

### Phase 3: Test & Migrate

#### Task 3.1: Test Song Upload with Walrus ✅

**Status**: Not Started (depends on Task 2.3)

**Test Flow**:

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Connect Sui wallet in browser
4. Go to Dashboard → Register as artist
5. Upload an MP3 file
6. Check backend logs for Walrus blobId
7. Verify song appears in Explore page
8. Test playback

**Success Criteria**:

- No errors in upload
- BlobId returned from Walrus
- Audio plays in MusicPlayer

---

#### Task 3.2: Migrate to Blockchain Storage 🔗

**Status**: Not Started (depends on Tasks 2.2 and 3.1)

**Files to Modify**:

**1. `backend/src/controllers/songController.ts`**

```typescript
// Current (line ~65):
await metadataStore.storeSong(songData);

// Change to:
await suiService.storeSongMetadata({
  title: songData.title,
  artistId: songData.artistId,
  artistName: songData.artistName,
  walrusBlobId: blobId, // ✅ Critical: Link to Walrus
  pricePerPlay: songData.pricePerPlay,
  duration: songData.duration,
  genre: songData.genre,
  coverImage: songData.coverImage,
});
```

**2. `backend/src/routes/song.routes.ts`**
Update `GET /api/song` to query from blockchain instead of in-memory

---

#### Task 3.3: Implement On-Chain Play Recording 💳

**Status**: Not Started

**File**: `backend/src/controllers/songController.ts`

**Update `play()` method**:

```typescript
async play(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const { id } = request.params;

  // Get song from blockchain
  const song = await suiService.getSongMetadata(id);

  // Record play on-chain (increments count + handles payment)
  await suiService.recordPlay(id, listenerAddress);

  return reply.send({ success: true, song });
}
```

---

#### Task 3.4: Full End-to-End Testing 🧪

**Status**: Not Started (final verification)

**Test Scenario**:

1. Artist registers (on-chain)
2. Artist uploads song → Walrus stores MP3, blockchain stores metadata
3. Listener browses Explore page → Queries blockchain
4. Listener plays song → Walrus streams audio, blockchain records play
5. Payment transferred to artist
6. Check artist earnings on Dashboard

**Verify**:

- Song appears immediately after upload
- Play count increments on blockchain
- Artist balance increases (check with `sui client gas`)

---

## 📋 REQUIRED ENVIRONMENT VARIABLES

### Backend (`backend/.env`)

| Variable                 | Description              | Where to Get                     | Status                |
| ------------------------ | ------------------------ | -------------------------------- | --------------------- |
| `PORT`                   | Backend server port      | `3001` (default)                 | ✅ Set                |
| `WALRUS_PUBLISHER_URL`   | Walrus upload endpoint   | Walrus testnet docs              | ❌ Pending            |
| `WALRUS_AGGREGATOR_URL`  | Walrus download endpoint | Walrus testnet docs              | ❌ Pending            |
| `SUI_NETWORK`            | Sui network name         | `testnet`                        | ✅ Can set now        |
| `SUI_PACKAGE_ID`         | Deployed Move package ID | From `sui client publish` output | ❌ Pending deployment |
| `SUI_ARTIST_REGISTRY_ID` | ArtistRegistry object ID | From `sui client publish` output | ❌ Pending deployment |
| `SUI_SONG_REGISTRY_ID`   | SongRegistry object ID   | From `sui client publish` output | ❌ Pending deployment |

### Frontend (`frontend/.env.local`)

| Variable                  | Description          | Where to Get            | Status                  |
| ------------------------- | -------------------- | ----------------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL`     | Backend API endpoint | `http://localhost:3001` | ✅ Hardcoded in api.ts  |
| `NEXT_PUBLIC_SUI_NETWORK` | Sui network          | `testnet`               | ✅ Set in sui-config.ts |

---

## 🔗 IMPORTANT LINKS & RESOURCES

### Sui Resources

- **Testnet Faucet**: https://faucet.sui.io/
- **Sui Explorer**: https://suiscan.xyz/testnet (view your transactions)
- **Sui Wallet**: https://chrome.google.com/webstore (search "Sui Wallet")
- **Sui Docs**: https://docs.sui.io/

### Walrus Resources

- **Walrus Docs**: https://docs.walrus.site/ (check for testnet access)
- **GitHub**: https://github.com/MystenLabs/walrus-docs

### Your Sui Addresses

- **CLI Address**: `0xb8675a17fca689548abfe0a1633879a6cbc3aaf5938bb1a0ece2b855311e5b30`
- **Alias**: `eloquent-labradorite`
- **Check Balance**: `sui client gas`
- **Check Transactions**: `sui client tx-history`

---

## 🚀 QUICK START COMMANDS

### Start Development Servers

```powershell
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Deploy Contracts (after getting SUI tokens)

```powershell
cd contracts
sui client publish --gas-budget 100000000
```

### Check Sui CLI Status

```powershell
sui client active-address
sui client envs
sui client gas
```

---

## 📊 PROJECT PROGRESS

**Overall**: 55% Complete

- ✅ Backend Infrastructure: 100%
- ✅ Frontend Infrastructure: 100%
- ✅ Smart Contracts Written: 100%
- ✅ Sui CLI Setup: 100%
- ⏳ Contract Deployment: 0%
- ⏳ Walrus Integration: 50% (code ready, credentials pending)
- ⏳ Blockchain Storage Migration: 0%
- ⏳ End-to-End Testing: 0%

---

## ⚡ IMMEDIATE NEXT STEPS (Priority Order)

1. **Get SUI tokens** from faucet (5 minutes)
2. **Deploy contracts** to testnet (2 minutes)
3. **Update backend** with contract IDs (5 minutes)
4. **Get Walrus credentials** (time varies - check docs)
5. **Test upload flow** (10 minutes)
6. **Migrate to blockchain** (1-2 hours)
7. **Full E2E testing** (30 minutes)

---

## 📝 NOTES

- **Architecture**: Audio files in Walrus (blobId) → Metadata on Sui blockchain
- **Current State**: MVP with in-memory storage (temporary)
- **Target State**: Full blockchain integration with micropayments
- **Git**: Not using git per user preference

**Need Help?**

- Check `SUI_INTEGRATION_PLAN.md` for detailed architecture
- Check `contracts/README.md` for contract specifications
- Check `PROJECT_STATUS.md` for development notes
