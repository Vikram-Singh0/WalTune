# ⚠️ Contract Deployment Issue - Known Bug

**Status**: Blocked by Sui CLI version mismatch  
**Date**: November 20, 2025

## Problem

Attempting to deploy contracts results in panic error:

```
thread 'main' panicked at move-bytecode-utils\src\lib.rs:29:17:
Duplicate module found: 0x00...0b::bridge
```

## Root Cause

- **Sui CLI Version**: 1.61.1-edfb00f26f1e-dirty
- **Testnet Version**: 1.61.0
- Version mismatch causing duplicate module detection in Bridge framework

## What We Tried

1. ✅ Removed explicit `sui = "0x2"` from Move.toml
2. ✅ Removed Sui dependency (letting it auto-add)
3. ✅ Changed edition from `2024` to `2024.beta`
4. ✅ Cleaned build directory
5. ✅ Used `--skip-dependency-verification` flag
6. ❌ All attempts result in same panic error

## Workaround Options

### Option A: Wait for Version Alignment (Recommended)

Wait 1-2 days for either:

- Testnet to upgrade to 1.61.1, OR
- Sui to release hotfix for 1.61.1 CLI

**Monitor**:

- https://github.com/MystenLabs/sui/releases
- Sui Discord #testnet channel

### Option B: Test with Mock IDs (Continue Development)

While waiting, you can:

1. **Use placeholder contract IDs in backend**:

```typescript
// backend/src/sui/suiService.ts
this.setContractIds(
  "0x0000000000000000000000000000000000000000000000000000000000000000", // mock
  "0x0000000000000000000000000000000000000000000000000000000000000001", // mock
  "0x0000000000000000000000000000000000000000000000000000000000000002" // mock
);
```

2. **Test frontend/backend integration** with in-memory storage
3. **Get Walrus credentials** and test audio upload/playback
4. **Build out UI/UX features**
5. Deploy contracts once version issue is resolved

### Option C: Use Devnet (May Work)

Devnet might have different version:

```powershell
sui client new-env --alias devnet --rpc https://fullnode.devnet.sui.io:443
sui client switch --env devnet
sui client faucet  # Get devnet SUI
sui client publish --gas-budget 100000000
```

### Option D: Build from Matching Source

Build Sui CLI v1.61.0 from source (30+ minutes):

```powershell
git clone https://github.com/MystenLabs/sui.git
cd sui
git checkout testnet  # or specific v1.61.0 tag
cargo build --release --bin sui
```

## Current Setup Status

✅ **Ready to Deploy**:

- Contracts build successfully (`sui move build` works)
- 1 SUI available for gas
- Move.toml properly configured
- All code ready

🔴 **Blocked By**:

- CLI/Testnet version mismatch bug

## Recommended Next Steps

1. **Continue with Walrus setup** (independent of Sui deployment)
2. **Test frontend/backend** with mock data
3. **Check Sui GitHub/Discord** for version updates
4. **Try devnet deployment** as temporary alternative
5. **Deploy to testnet** once versions align (likely within 48 hours)

## Files Ready

- ✅ `contracts/artist.move`
- ✅ `contracts/song_registry.move`
- ✅ `contracts/payment.move`
- ✅ `contracts/Move.toml` (optimized configuration)
- ✅ Sui CLI configured and connected to testnet
- ✅ 1 SUI available for gas fees

**Will update this file once deployment succeeds.**

---

## Quick Deploy Command (When Ready)

```powershell
cd contracts
sui client publish --gas-budget 100000000
```

Save the output:

- Package ID
- ArtistRegistry object ID
- SongRegistry object ID
