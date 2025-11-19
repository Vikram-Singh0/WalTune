# WalTune Frontend

Modern Next.js frontend for WalTune - decentralized music streaming platform.

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Configuration

1. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

2. Environment variables are already set for local development:

```env
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io:443
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build

```bash
npm run build
npm start
```

## 🏗 Project Structure

```
frontend/
├── app/                  # Next.js App Router
│   ├── layout.tsx       # Root layout with Providers
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles
├── components/          # React components
│   └── WalletConnect.tsx
├── lib/                 # Utilities
│   ├── providers.tsx    # Sui & React Query providers
│   ├── sui-config.ts    # Sui network configuration
│   └── api.ts           # API client
├── types/               # TypeScript types
│   └── index.ts
└── hooks/               # Custom React hooks
```

## 🔌 Features

- **Sui Wallet Integration** - Connect with any Sui wallet
- **Wallet Authentication** - Wallet-only authentication flow
- **API Client** - Ready-to-use API functions for backend
- **Type Safety** - Full TypeScript support
- **Tailwind CSS** - Modern styling with Tailwind v4
- **React Query** - Efficient data fetching and caching

## 🎨 Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- @mysten/dapp-kit (Sui wallet integration)
- @tanstack/react-query
- Zustand (state management)

## 📱 Pages

- **Home** - Landing page with wallet connect ✅
- **Explore** - Browse all songs (Coming Soon)
- **Artist Dashboard** - Upload & manage songs (Coming Soon)
- **Player** - Music playback interface (Coming Soon)
- **Profile** - User/Artist profile (Coming Soon)

## 🔐 Wallet Support

Supports all Sui-compatible wallets through @mysten/dapp-kit:

- Sui Wallet
- Ethos Wallet
- Suiet
- Martian Wallet
- And more...

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 📄 License

MIT
