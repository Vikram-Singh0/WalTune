# WalTune Backend

Decentralized music streaming backend powered by Walrus storage and Sui blockchain.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Walrus testnet access

### Installation

```bash
npm install
```

### Configuration

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Update environment variables:

```env
PORT=3001
WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
WALRUS_EPOCHS=5
SUI_NETWORK=testnet
FRONTEND_URL=http://localhost:3000
```

### Development

```bash
npm run dev
```

Server will start at `http://localhost:3001`

### Production Build

```bash
npm run build
npm start
```

## 📡 API Endpoints

### Artist Routes (`/api/artist`)

#### Register Artist

```http
POST /api/artist/register
Content-Type: application/json

{
  "walletAddress": "0x...",
  "name": "Artist Name",
  "bio": "Artist bio (optional)",
  "profileImage": "image_url (optional)"
}
```

#### Get Artist by Wallet

```http
GET /api/artist/:walletAddress
```

#### Get All Artists

```http
GET /api/artist/list/all
```

### Song Routes (`/api/song`)

#### Upload Song

```http
POST /api/song/upload
Content-Type: multipart/form-data

Fields:
- file: MP3 audio file (max 50MB)
- title: Song title
- artistWallet: Artist wallet address
- pricePerPlay: Price per play (in SUI)
- duration: Song duration in seconds
- genre: Music genre (optional)
- coverImage: Cover image URL (optional)
```

#### Get All Songs

```http
GET /api/song/all
```

#### Get Song by ID

```http
GET /api/song/:id
```

#### Record Song Play

```http
POST /api/song/play/:id
```

#### Get Songs by Artist

```http
GET /api/song/artist/:artistId
```

## 🏗 Architecture

```
backend/
├── src/
│   ├── controllers/       # Request handlers
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic
│   ├── walrus/          # Walrus storage integration
│   ├── sui/             # Sui blockchain integration
│   ├── types/           # TypeScript type definitions
│   └── index.ts         # Server entry point
├── .env.example         # Environment template
└── tsconfig.json        # TypeScript config
```

## 🔧 Tech Stack

- **Fastify** - Fast web framework
- **TypeScript** - Type safety
- **Walrus** - Decentralized storage
- **Sui SDK** - Blockchain integration
- **Axios** - HTTP client
- **Form-Data** - Multipart uploads

## 📝 Notes

- Currently using in-memory storage for metadata (will be replaced with Sui smart contracts)
- x402 payment integration is planned for future releases
- Only MP3 format is supported for audio uploads
- Maximum file size: 50MB per upload

## 🔐 Security

- Wallet-based authentication
- File type and size validation
- CORS protection
- Rate limiting (to be implemented)

## 🧪 Testing

```bash
npm test
```

## 📄 License

MIT
