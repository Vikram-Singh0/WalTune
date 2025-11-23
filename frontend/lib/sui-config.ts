import { getFullnodeUrl } from "@mysten/sui/client";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    devnet: {
      url: getFullnodeUrl("devnet"),
    },
    testnet: {
      url: getFullnodeUrl("testnet"),
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
    },
  });

export { networkConfig, useNetworkVariable, useNetworkVariables };

// Deployed Contract Addresses (Sui Testnet)
export const PACKAGE_ID =
  process.env.NEXT_PUBLIC_PACKAGE_ID ||
  "0x5e49fc9853d27dff034b58f0dbbed0a6f53ce10c77a19cc157fcc1b0163024f1";
export const ARTIST_REGISTRY_ID =
  process.env.NEXT_PUBLIC_ARTIST_REGISTRY_ID ||
  "0xd8014d276dc53243e75da359c0b2d0348d0178c219851ce15a5539a65d18fb31";
export const SONG_REGISTRY_ID =
  process.env.NEXT_PUBLIC_SONG_REGISTRY_ID ||
  "0x582682f484e8a8a0ec83ffc63d2c1215eb196e3d7db879254b97ab9181069da5";

// Walrus Configuration (Aggregator only - for streaming blobs)
// Note: Uploads are done using Walrus SDK (see lib/walrus-utils.ts)
export const WALRUS_AGGREGATOR_URL =
  process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL ||
  "https://aggregator.walrus-testnet.walrus.space";

// Helper to get Walrus stream URL from blob ID
export function getWalrusStreamUrl(blobId: string): string {
  return `${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`;
}
