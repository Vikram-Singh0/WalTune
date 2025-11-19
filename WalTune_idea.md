# 📀 **Project Specification: Decentralized Music Streaming with Walrus + Sui + x402**

**Track:** Data Economy & Marketplaces — Walrus Haulout Hackathon
**Name:** _WalTune_

---

# 🚀 **1. Problem Overview**

Current platforms like Spotify and Apple Music use a centralized subscription model where:

- Artists earn **less than ₹0.10 per stream**
- Payments are delayed (30–90 days)
- Platforms take **30–45% cuts**
- Artists have no transparency or ownership
- Their music lives on centralized servers with no proof of authenticity

Creators lose control. Listeners overpay. Middlemen dominate.

---

# 🎧 **2. Solution Summary**

**A decentralized, pay-per-play music streaming platform using:**

- **Walrus** → decentralized audio + metadata storage
- **Sui Move Contracts** → artist identity, song registry, micropayment rules
- **x402 Protocol** → real-time micropayments directly from listener → artist
- **Next.js frontend** → a clean, modern music player UX

The model is simple:

> **Listeners preload balance → play any song → tiny fee auto-sent to artist → artist earns instantly.**

No subscription.
No intermediaries.
No revenue cuts.
Just fair, transparent, real-time creator monetization.

---

# 🧩 **3. Core Features**

### 🎤 **Artist Features**

- Register as an artist (on-chain identity)
- Upload songs (audio stored on Walrus)
- Set per-play cost (e.g., ₹0.05 per play)
- View real-time earnings from x402 micropayments

### 🎧 **Listener Features**

- Preload wallet balance
- Play songs (micropayment triggers every time song plays)
- Transparent history of plays + payments

### 🛠 **Platform Features**

- Smart contracts for identity + registry + payment routing
- Fully decentralized audio storage
- Trustless micropayments
- Modern UI music player

---

# 🏗 **4. Architecture Overview**

```
                        ┌─────────────────────────┐
                        │        FRONTEND         │
                        │    Next.js + Sui SDK    │
                        └───────────┬─────────────┘
                                    │
                       Play Song / Upload / Pay
                                    │
                        ┌───────────▼─────────────┐
                        │        BACKEND          │
                        │ Node.js + TS + Walrus   │
                        └───────┬───────┬────────┘
                                │       │
                          Walrus SDK   x402 Microservice
                                │       │
   ┌────────────────────────────┘       └───────────────────────────┐
   │                                                                 │
┌──▼───────────┐                                                ┌────▼───────────┐
│ WALRUS       │                                                │ x402 PAYMENT  │
│ Storage      │<────────────── Audio Uploads ─────────────────>│  CHANNEL      │
└──▲───────────┘                                                └────▲───────────┘
   │                                                                 │
   │                    On-chain Metadata & Payment Rules            │
   │                                                                 │
┌──┴──────────────┐                                        ┌────────┴──────────┐
│  SUI CONTRACTS  │<───────────── Sui Move ───────────────>│   User Wallets    │
│ Artist / Song   │                                        │ Listener / Artist │
└──────────────────┘                                        └───────────────────┘
```

---

# 🔧 **5. Tech Stack**

### **Blockchain**

- Sui blockchain
- Move smart contracts
- Sui SDK (TypeScript)
- Sui Wallet Adapter

### **Storage**

- Walrus decentralized storage
- Seal for proof
- Nautilus for retrieval
- Walrus SDK

### **Payments**

- x402 micropayment protocol
- Real-time “per play” fee deduction
- Streaming payments

### **Backend**

- Node.js (TypeScript)
- Fastify or Express
- Walrus client
- Sui client
- Microservice for x402 payment logic

### **Frontend**

- Next.js 15
- Tailwind CSS
- Shadcn UI
- Zustand / React Query
- Web Audio API

---

# 📦 **6. Detailed Project Structure**

```
root/
│
├── contracts/
│    ├── Artist.move
│    ├── SongRegistry.move
│    ├── PaymentRouter.move
│    └── Wallet.move
│
├── backend/
│    ├── src/
│    │   ├── routes/
│    │   ├── controllers/
│    │   ├── services/
│    │   ├── walrus/
│    │   ├── x402/
│    │   └── sui/
│    └── index.ts
│
├── storage/
│    ├── walrusClient.ts
│    ├── uploadAudio.ts
│    ├── metadataHandler.ts
│
├── frontend/
│    ├── app/
│    ├── components/
│    ├── hooks/
│    ├── styles/
│
├── scripts/
│    └── deploy_contracts.sh
│
└── README.md
```

---

# 📜 **7. Smart Contract Design (Move)**

### **1. Artist.move**

- Create artist profile
- Store artist address
- Manage artist metadata

### **2. SongRegistry.move**

- Store song metadata:

  - CID from Walrus
  - title
  - artist
  - price-per-play

- Map: SongID → metadata

### **3. Wallet.move**

- Listener deposits
- Balance increases/decreases
- Withdraw for artists

### **4. PaymentRouter.move**

- On “play event”
- Deduct fee from listener
- Route micropayment to artist
- Log event

---

# 🔗 **8. Backend Responsibilities**

### **Walrus Integration**

- Receive uploaded audio
- Convert to buffer
- Upload via Walrus SDK
- Return Walrus CID
- Validate file

### **x402 Payment Flow**

- Open payment channel
- Deduct micropayments
- Close channel when song stops
- Log payments

### **API Routes**

```
POST /artist/register
POST /song/upload
GET  /song/all
POST /song/play
POST /payment/micropay
```

---

# 🎨 **9. Frontend Screens**

### ✔️ **Artist Dashboard**

- Upload songs
- Set per-play fee
- See earnings

### ✔️ **Listener UI**

- Explore songs
- Wallet top-up
- Play songs
- Payments shown in real-time

### ✔️ **Music Player**

- Play / Pause
- Track progress
- Trigger micropayments every X seconds

---

# 🔄 **10. Flow: Upload + Play + Pay**

```
Artist Uploads Song →
 Walrus stores audio →
 CID returned →
 Store CID + metadata on Sui →
 Song appears on frontend →
 Listener clicks Play →
 Backend meters playback →
 x402 deducts micropayments →
 Sui contract updates earnings →
 Artist earns instantly
```

---

# 🎯 **11. MVP Goals**

### **Must-Have**

- Upload song → store on Walrus
- Register song on Sui
- Play song from Walrus
- Real-time micropayments
- Artist dashboard

### **Nice-to-Have**

- AI genre tagging
- Duplicate detection
- Recommendation feed

---
