# 🔗 Sui Blockchain Integration Plan

## Current Architecture

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌──────────────┐
│   Backend   │─────▶│   Walrus     │
│   (API)     │      │  (Storage)   │
└──────┬──────┘      └──────────────┘
       │                    │
       ▼                    │
┌─────────────┐            │
│  In-Memory  │◀───────────┘
│   Storage   │         blobId
└─────────────┘
```

## Target Architecture (Blockchain-based)

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌──────────────┐
│   Backend   │─────▶│   Walrus     │
│   (API)     │      │  (Storage)   │
└──────┬──────┘      └──────┬───────┘
       │                    │
       │                blobId
       │                    │
       ▼                    ▼
┌─────────────────────────────────┐
│     Sui Blockchain               │
│  ┌─────────────────────────┐   │
│  │  Artist Registry        │   │
│  │  - Artist ID            │   │
│  │  - Wallet Address       │   │
│  │  - Name, Bio            │   │
│  └─────────────────────────┘   │
│                                  │
│  ┌─────────────────────────┐   │
│  │  Song Registry          │   │
│  │  - Song ID              │   │
│  │  - Title, Artist ID     │   │
│  │  - Walrus Blob ID ✅    │
│  │  - Price per Play       │   │
│  │  - Total Plays          │   │
│  │  - Duration, Genre      │   │
│  └─────────────────────────┘   │
│                                  │
│  ┌─────────────────────────┐   │
│  │  Payment Router         │   │
│  │  - Micropayments        │   │
│  │  - Earnings Tracking    │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

---

## 📋 Smart Contracts Needed

### 1. **Artist.move** - Artist Registry

```move
module waltune::artist {
    use sui::object::{Self, UID};
    use sui::tx_context::TxContext;
    use std::string::String;

    struct Artist has key, store {
        id: UID,
        wallet_address: address,
        name: String,
        bio: String,
        created_at: u64,
    }

    struct ArtistRegistry has key {
        id: UID,
        artists: Table<address, ID>, // wallet -> artist_id
    }

    public fun register(
        registry: &mut ArtistRegistry,
        name: String,
        bio: String,
        ctx: &mut TxContext
    ): Artist { ... }

    public fun get_artist(
        registry: &ArtistRegistry,
        wallet: address
    ): &Artist { ... }
}
```

### 2. **SongRegistry.move** - Song Metadata Storage

```move
module waltune::song_registry {
    use sui::object::{Self, UID, ID};
    use std::string::String;

    struct Song has key, store {
        id: UID,
        title: String,
        artist_id: ID,
        walrus_blob_id: String,  // ✅ Critical field!
        price_per_play: u64,
        duration: u64,
        genre: String,
        total_plays: u64,
        uploaded_at: u64,
    }

    struct SongRegistry has key {
        id: UID,
        songs: Table<ID, Song>,
    }

    public fun register_song(
        registry: &mut SongRegistry,
        title: String,
        artist_id: ID,
        walrus_blob_id: String,  // Store Walrus blobId on-chain
        price_per_play: u64,
        duration: u64,
        genre: String,
        ctx: &mut TxContext
    ): ID { ... }

    public fun get_song(
        registry: &SongRegistry,
        song_id: ID
    ): &Song { ... }

    public fun increment_play_count(
        registry: &mut SongRegistry,
        song_id: ID
    ) { ... }
}
```

### 3. **PaymentRouter.move** - Micropayments

```move
module waltune::payment {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;

    public fun pay_for_play(
        song_id: ID,
        payment: Coin<SUI>,
        artist_address: address,
        ctx: &mut TxContext
    ) {
        // Transfer payment to artist
        // Record play event
        // Update earnings
    }
}
```

---

## 🔄 Correct Data Flow

### Upload Flow:

```
1. User uploads MP3 via frontend
2. Backend receives file
3. Backend → Walrus: Upload audio file
4. Walrus → Backend: Returns blobId
5. Backend → Sui Blockchain: Store metadata + blobId
6. Sui → Backend: Returns transaction digest + songId
7. Backend → Frontend: Upload complete
```

### Playback Flow:

```
1. User clicks play on song
2. Frontend → Backend: Request song data
3. Backend → Sui: Query song metadata (including blobId)
4. Sui → Backend: Returns metadata with blobId
5. Backend constructs Walrus URL: aggregator/v1/{blobId}
6. Backend → Frontend: Returns stream URL
7. Frontend plays audio from Walrus URL
```

---

## 📦 Implementation Status

| Component         | Status     | Notes             |
| ----------------- | ---------- | ----------------- |
| Walrus Upload     | ✅ Ready   | Needs credentials |
| In-Memory Storage | ✅ Working | Temporary         |
| Sui Service       | ✅ Created | Skeleton ready    |
| Smart Contracts   | ⏳ Needed  | Not deployed      |
| On-Chain Storage  | ⏳ Pending | After contracts   |

---

## 🚀 Next Steps to Enable Blockchain Storage

### Phase 1: Write Smart Contracts

1. Create `contracts/sources/artist.move`
2. Create `contracts/sources/song_registry.move`
3. Create `contracts/sources/payment.move`

### Phase 2: Deploy to Sui Testnet

```bash
cd contracts
sui move build
sui client publish --gas-budget 100000000
```

### Phase 3: Update Backend

1. Set contract package IDs in `suiService.ts`
2. Replace `metadataStore` calls with `suiService` calls
3. Update API endpoints to use blockchain

### Phase 4: Test Full Flow

1. Upload song → Walrus (get blobId)
2. Store metadata → Sui (with blobId)
3. Query metadata → Sui (get blobId)
4. Stream audio → Walrus (using blobId)

---

## 💡 Why This Architecture?

### Walrus (Decentralized Storage):

- ✅ Store large audio files (50MB)
- ✅ Permanent, decentralized storage
- ✅ Content-addressable (blobId)
- ✅ Fast CDN-like delivery

### Sui Blockchain (Metadata & Logic):

- ✅ Store song metadata (small data)
- ✅ Link to Walrus via blobId
- ✅ Handle payments & ownership
- ✅ Transparent & immutable records
- ✅ Smart contract logic for payments

### Benefits:

- 🎯 Separation of concerns
- 🎯 Scalable (large files off-chain)
- 🎯 Transparent (metadata on-chain)
- 🎯 Decentralized (both layers)
- 🎯 Efficient (right tool for right job)

---

## 📝 Summary

**You are 100% correct!** The proper architecture is:

```
Audio Files → Walrus Storage (get blobId)
Metadata + blobId → Sui Blockchain (smart contracts)
```

Currently using **in-memory storage** as a temporary MVP solution until smart contracts are deployed. The `suiService.ts` module is ready to integrate once contracts are live!
