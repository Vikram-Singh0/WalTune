# Frontend Integration Guide

## ✅ What's Been Updated

### 1. **Configuration Files**

- ✅ `lib/sui-config.ts` - Added devnet, contract addresses, and Walrus helpers
- ✅ `lib/providers.tsx` - Changed default network to devnet
- ✅ `types/index.ts` - Updated Song type to use `walrusBlobId`
- ✅ `.env.local` - Added all contract addresses

### 2. **New Files Created**

- ✅ `lib/sui-transactions.ts` - Utility functions for Sui blockchain interactions

### 3. **Components Updated**

- ✅ `components/MusicPlayer.tsx` - Now streams from Walrus using blob ID

---

## 🔧 How to Integrate Sui Transactions

### **Artist Registration (Dashboard)**

Replace the backend API call with Sui transaction:

```typescript
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { createRegisterArtistTx } from "@/lib/sui-transactions";

const { mutate: signAndExecute } = useSignAndExecuteTransaction();
const client = useSuiClient();

const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!account) return;

  // Create Sui transaction
  const tx = createRegisterArtistTx({
    name: artistName,
    bio: bio || "",
  });

  // Sign and execute
  signAndExecute(
    {
      transaction: tx,
    },
    {
      onSuccess: (result) => {
        console.log("Artist registered on Sui:", result);
        alert("Artist registered successfully!");
        // Optionally: save to backend for faster queries
        api.registerArtist({
          walletAddress: account.address,
          name: artistName,
          bio: bio,
        });
      },
      onError: (error) => {
        console.error("Registration failed:", error);
        alert("Registration failed");
      },
    }
  );
};
```

### **Song Upload Flow**

1. **Upload audio to Walrus** (backend)
2. **Register song on Sui** (frontend with blob ID)

```typescript
import { createRegisterSongTx } from "@/lib/sui-transactions";

const handleUpload = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!account || !artist || !uploadForm.file) return;

  setUploading(true);
  try {
    // Step 1: Upload to Walrus via backend
    const formData = new FormData();
    formData.append("file", uploadForm.file);

    const uploadResponse = await fetch(
      "http://localhost:3001/api/walrus/upload",
      {
        method: "POST",
        body: formData,
      }
    );
    const uploadData = await uploadResponse.json();

    if (!uploadData.success || !uploadData.blobId) {
      throw new Error("Walrus upload failed");
    }

    // Step 2: Register song on Sui with blob ID
    const tx = createRegisterSongTx({
      title: uploadForm.title,
      artistId: account.address,
      artistName: artist.name,
      walrusBlobId: uploadData.blobId, // ✅ Walrus blob ID
      pricePerPlay: parseFloat(uploadForm.pricePerPlay),
      duration: uploadForm.duration,
      genre: uploadForm.genre || "Unknown",
      coverImage: "",
    });

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (result) => {
          console.log("Song registered on Sui:", result);
          alert("Song uploaded successfully!");

          // Optionally: save to backend for indexing
          api.uploadSong({
            ...uploadData,
            title: uploadForm.title,
            artistWallet: account.address,
          });
        },
        onError: (error) => {
          console.error("Song registration failed:", error);
          alert("Failed to register song on blockchain");
        },
      }
    );
  } catch (error) {
    console.error("Upload failed:", error);
    alert("Upload failed");
  } finally {
    setUploading(false);
  }
};
```

### **Playing Songs**

Songs are automatically streamed from Walrus using the `walrusBlobId`:

```typescript
// In MusicPlayer component
const streamUrl = getWalrusStreamUrl(song.walrusBlobId);
// Returns: https://aggregator.walrus-testnet.walrus.space/v1/{blobId}
```

To record plays on-chain:

```typescript
import { createRecordPlayTx } from "@/lib/sui-transactions";

const handlePlay = async (song: Song) => {
  setCurrentSong(song);

  // Record play on Sui blockchain
  const tx = createRecordPlayTx(song.id); // song.id should be the Sui object ID

  signAndExecute(
    { transaction: tx },
    {
      onSuccess: () => console.log("Play recorded on blockchain"),
      onError: (err) => console.error("Failed to record play:", err),
    }
  );
};
```

---

## 📁 Backend Updates Needed

### **Walrus Upload Endpoint**

Create `backend/src/routes/walrus.routes.ts`:

```typescript
import express from "express";
import multer from "multer";
import { uploadToWalrus } from "../walrus/uploadAudio";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "No file provided" });
    }

    const result = await uploadToWalrus(req.file.buffer);

    res.json({
      success: true,
      blobId: result.blobId,
      size: result.size,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
```

Register in `backend/src/index.ts`:

```typescript
import walrusRoutes from "./routes/walrus.routes";
app.use("/api/walrus", walrusRoutes);
```

---

## 🧪 Testing Checklist

### Frontend

- [ ] Connect wallet (Sui Wallet or Suiet)
- [ ] Switch to Devnet in wallet
- [ ] Register as artist (signs Sui transaction)
- [ ] Upload song (Walrus + Sui transaction)
- [ ] Play song (streams from Walrus)
- [ ] See songs list with play counts

### Backend

- [ ] Start backend: `cd backend && npm run dev`
- [ ] Walrus upload endpoint works
- [ ] Returns valid blob ID

### Blockchain

- [ ] View artist registry: https://suiscan.xyz/devnet/object/0xd6b00f125d789ec8934ee89fb779785aad04a4d3be5416780c28afced9474ff9
- [ ] View song registry: https://suiscan.xyz/devnet/object/0x6a013d09fe6ecf0bc9b3f63359e8435dff21b19105b06ddf700340f3b1fa423a
- [ ] Check your transactions on Sui Explorer

---

## 🚀 Quick Start

1. **Start Backend**

```bash
cd backend
npm install
npm run dev
```

2. **Start Frontend**

```bash
cd frontend
npm install
npm run dev
```

3. **Setup Wallet**

- Install Sui Wallet extension
- Switch to Devnet
- Get test SUI: `sui client faucet`

4. **Test Flow**

- Go to http://localhost:3000
- Connect wallet
- Register as artist
- Upload a song
- Browse and play songs

---

## 🔍 Debugging

### "Transaction failed"

- Check you're on Devnet in your wallet
- Verify gas balance: `sui client gas`
- Check contract addresses in `.env.local`

### "Song won't play"

- Check browser console for Walrus URL
- Verify blob ID is valid
- Test Walrus directly: `https://aggregator.walrus-testnet.walrus.space/v1/{blobId}`

### "Can't register artist"

- Ensure wallet is connected
- Check transaction in Sui Explorer
- Verify ARTIST_REGISTRY_ID is correct

---

## 📚 Resources

- Sui Devnet Explorer: https://suiscan.xyz/devnet
- Walrus Docs: https://docs.walrus.site
- Your Contracts: See `contracts/DEPLOYED_ADDRESSES.md`
