# 🎯 WalTune Smart Contracts

Sui Move smart contracts for decentralized music streaming.

## 📦 Contracts

### 1. **artist.move**

- Artist registration and profile management
- Track total songs and earnings
- On-chain artist identity

### 2. **song_registry.move**

- Store song metadata on-chain
- **Critical**: Links Walrus blob IDs to song data
- Play count tracking
- Song ownership and pricing

### 3. **payment.move**

- Handle micropayments per play
- Transfer SUI from listener to artist
- Future: Revenue splitting, x402 integration

## 🏗 Architecture

```
Walrus (Off-chain)          Sui Blockchain (On-chain)
─────────────────          ──────────────────────────
[Audio Files]      ←──→    [Song Metadata + blobId]
  50MB MP3                      Small structured data
  Permanent storage             Smart contract state
  Content-addressed             Transparent & immutable
```

## 🚀 Deployment

### Prerequisites

```bash
# Install Sui CLI
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui

# Check installation
sui --version
```

### Build Contracts

```bash
cd contracts
sui move build
```

### Deploy to Testnet

```bash
sui client publish --gas-budget 100000000
```

### After Deployment

1. Note the Package ID
2. Note the ArtistRegistry object ID
3. Note the SongRegistry object ID
4. Update `backend/src/sui/suiService.ts` with these IDs

## 📝 Contract Flow

### Artist Registration

```
1. Call artist::register(name, bio)
2. Creates Artist object
3. Stores in ArtistRegistry
4. Returns artist_id
```

### Song Upload

```
1. Upload MP3 to Walrus → get blobId
2. Call song_registry::register_song(
     title, artist_id, walrus_blob_id, price, ...
   )
3. Creates Song object with blobId stored on-chain
4. Links to artist in registry
```

### Song Playback

```
1. Query Song object by ID
2. Read walrus_blob_id from on-chain data
3. Construct Walrus URL: {aggregator}/v1/{blobId}
4. Stream audio from Walrus
5. Call payment::pay_for_play() to send micropayment
```

## 🔗 Data Stored On-Chain

### Artist Object

- Wallet address
- Name, bio
- Total songs count
- Total earnings

### Song Object

- Title, artist info
- **Walrus blob ID** ✅
- Price per play
- Duration, genre
- Play count
- Upload timestamp

## 💰 Payment Flow

```
Listener plays song
  ↓
Calls payment::pay_for_play()
  ↓
Deducts SUI from listener
  ↓
Increments song play count
  ↓
Transfers SUI to artist
  ↓
Emits play event
```

## 🧪 Testing

```bash
# Run tests
sui move test

# Test specific module
sui move test --filter artist
```

## 📚 Learn More

- [Sui Move Documentation](https://docs.sui.io/build/move)
- [Sui Examples](https://github.com/MystenLabs/sui/tree/main/examples)
- [Move Book](https://move-language.github.io/move/)

## ⚠️ Status

**Current**: Smart contracts written, not yet deployed
**Next**: Deploy to testnet and integrate with backend
