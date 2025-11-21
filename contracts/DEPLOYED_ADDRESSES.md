# WalTune Smart Contract Addresses (Sui Testnet)

## 📦 Package Information

- **Package ID**: `0xdfbb5fec49706467dab0d239f74a0e490a8f90f7d9f4bb2a64059dc29be850d6`
- **Network**: Sui Testnet
- **Transaction Digest**: `2P83ipFZmDNS1hHiMexJcXjEW85aJstNoDojz6CqP3Lh`
- **Deployment Date**: November 21, 2025

## 🎵 Contract Addresses

### Artist Registry (Shared Object)

- **Object ID**: `0x36bb71fd7bb43f70421d8f05c9113bc47dcdf62411848e7fd964e91257c1dc20`
- **Type**: Shared Object
- **Purpose**: Manages artist registrations

### Song Registry (Shared Object)

- **Object ID**: `0xb88ec5c9e4646e3ad004b0a7e249efa22f19b49c3fb5c1f4061484bc83fb2187`
- **Type**: Shared Object
- **Purpose**: Manages song registrations and makes all songs publicly accessible

## 🔍 Explorer Links

- **Package**: https://testnet.suivision.xyz/package/0xdfbb5fec49706467dab0d239f74a0e490a8f90f7d9f4bb2a64059dc29be850d6
- **Artist Registry**: https://testnet.suivision.xyz/object/0x36bb71fd7bb43f70421d8f05c9113bc47dcdf62411848e7fd964e91257c1dc20
- **Song Registry**: https://testnet.suivision.xyz/object/0xb88ec5c9e4646e3ad004b0a7e249efa22f19b49c3fb5c1f4061484bc83fb2187

## ✨ Key Changes in This Deployment

1. **Songs are now publicly accessible** - Changed from `transfer::transfer()` to `transfer::share_object()` in `song_registry.move`
2. All uploaded songs are visible to everyone (like Spotify), not just the artist who uploaded them
3. Backend integrated with Walrus SDK for reliable audio uploads
4. Backend queries blockchain events to fetch all songs

## Frontend Configuration

Update your frontend `.env` file with:

```env
NEXT_PUBLIC_PACKAGE_ID=0xdfbb5fec49706467dab0d239f74a0e490a8f90f7d9f4bb2a64059dc29be850d6
NEXT_PUBLIC_ARTIST_REGISTRY_ID=0x36bb71fd7bb43f70421d8f05c9113bc47dcdf62411848e7fd964e91257c1dc20
NEXT_PUBLIC_SONG_REGISTRY_ID=0xb88ec5c9e4646e3ad004b0a7e249efa22f19b49c3fb5c1f4061484bc83fb2187
NEXT_PUBLIC_NETWORK=testnet
```

## Gas Cost

- Total gas used: ~28.37 SUI (28,369,880 MIST)
- Storage cost: 28.35 SUI
- Computation cost: 1 SUI
