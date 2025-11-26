/**
 * Walrus Upload Utilities
 * Helper functions for uploading files to Walrus storage
 * Uses HTTP publisher endpoint (primary) with SDK fallback (like SafeKey)
 */

import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { WalrusClient, WalrusFile } from "@mysten/walrus";

/**
 * Initialize Walrus client (for SDK fallback only)
 */
export function createWalrusClient(
  network: "mainnet" | "testnet" = "testnet"
): WalrusClient {
  const suiClient = new SuiClient({
    url: getFullnodeUrl(network),
  });

  return new WalrusClient({
    suiClient,
    network,
  });
}

/**
 * Upload a file to Walrus using HTTP publisher endpoint (preferred method)
 * Falls back to SDK if publisher URL not configured
 * @param file File to upload
 * @param walletKeypair Optional - only needed for SDK fallback
 * @param epochs Number of epochs to store (default 5)
 * @returns Object with blobId and transaction digest
 */
export async function uploadFileToWalrus(
  file: File,
  walletKeypair?: any,
  epochs: number = 5
): Promise<{ blobId: string; txDigest?: string }> {
  // Read file as Uint8Array
  const arrayBuffer = await file.arrayBuffer();
  const blob = new Uint8Array(arrayBuffer);

  console.log(`📤 Uploading ${blob.length} bytes to Walrus...`);
  console.log(`   File: ${file.name}, Epochs: ${epochs}`);

  // PRIMARY METHOD: Use HTTP publisher endpoint (faster, no WASM)
  const publisherUrl =
    process.env.NEXT_PUBLIC_WALRUS_PUBLISHER_URL ||
    "https://publisher.walrus-testnet.walrus.space";

  console.log("[Walrus] Publisher URL:", publisherUrl);

  if (publisherUrl) {
    try {
      const url = `${publisherUrl}/v1/blobs?epochs=${epochs}`;
      console.log("[Walrus] Using HTTP publisher endpoint:", url);

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/octet-stream",
        },
        body: new Blob([blob]),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(
          `Publisher returned ${response.status} ${response.statusText}: ${text}`
        );
      }

      const json = await response.json();
      console.log(
        "[Walrus] Publisher response:",
        JSON.stringify(json, null, 2)
      );

      // Walrus can return different response structures:
      // 1. newlyCreated: { blobObject: { blobId: string, ... } }
      // 2. alreadyCertified: { blobId: string, ... }
      let blobId: string | undefined;

      if (json.newlyCreated?.blobObject?.blobId) {
        blobId = json.newlyCreated.blobObject.blobId;
      } else if (json.alreadyCertified?.blobId) {
        blobId = json.alreadyCertified.blobId;
      } else if (json.blobId) {
        // Some versions might return blobId directly
        blobId = json.blobId;
      }

      if (!blobId) {
        throw new Error(
          `No blob ID returned from publisher: ${JSON.stringify(json)}`
        );
      }

      // Ensure blob ID is a string
      blobId = String(blobId);
      console.log(`✅ Upload successful via HTTP publisher!`);
      console.log(`   Blob ID: ${blobId}`);

      return {
        blobId,
        txDigest: json?.newlyCreated?.blobObject?.id || undefined,
      };
    } catch (error) {
      console.error("[Walrus] HTTP publisher upload failed:", error);
      console.log("[Walrus] Attempting SDK fallback...");
      // Fall through to SDK method
    }
  } else {
    console.warn("[Walrus] No publisher URL configured, will use SDK method");
  }

  // FALLBACK METHOD: Use Walrus SDK (requires signer and WAL tokens)
  if (!walletKeypair) {
    throw new Error(
      "Walrus upload failed: No publisher URL configured and no wallet keypair provided for SDK fallback. " +
        "Please set NEXT_PUBLIC_WALRUS_PUBLISHER_URL in your environment."
    );
  }

  console.log(
    "[Walrus] Using SDK fallback method (requires wallet signing)..."
  );
  const walrusClient = createWalrusClient("testnet");

  // The signer needs sufficient SUI for transactions and WAL tokens for storage
  const result = await walrusClient.writeBlob({
    blob,
    deletable: true,
    epochs,
    signer: walletKeypair,
  });

  console.log(
    `✅ Upload successful via SDK! Blob ID:`,
    result.blobId.substring(0, 32) + "..."
  );

  return {
    blobId: result.blobId,
    txDigest: result.blobObject.id.id,
  };
}

/**
 * Upload multiple files as a Walrus File (with metadata)
 * Better for files that need metadata/tagging
 */
export async function uploadFilesWithMetadata(
  files: Array<{
    file: File;
    identifier: string;
    tags?: Record<string, string>;
  }>,
  walletKeypair: any,
  epochs: number = 5
): Promise<{ blobId: string; files: any[] }> {
  const walrusClient = createWalrusClient("testnet");

  // Convert to WalrusFile format
  const walrusFiles = await Promise.all(
    files.map(async ({ file, identifier, tags }) => {
      const arrayBuffer = await file.arrayBuffer();
      const contents = new Uint8Array(arrayBuffer);

      return WalrusFile.from({
        contents,
        identifier,
        tags: tags || {
          "content-type": file.type,
          "file-name": file.name,
        },
      });
    })
  );

  // Write files to Walrus
  const results = await walrusClient.writeFiles({
    files: walrusFiles,
    epochs,
    deletable: true,
    signer: walletKeypair,
  });

  return {
    blobId: results[0].blobId,
    files: results,
  };
}

/**
 * Read/verify a blob from Walrus
 * Uses HTTP aggregator endpoint (primary) with SDK fallback
 */
export async function readBlobFromWalrus(blobId: string): Promise<Uint8Array> {
  console.log("[Walrus] Retrieving blob:", blobId.substring(0, 32) + "...");

  // PRIMARY METHOD: Use HTTP aggregator endpoint (faster, no WASM)
  const aggregatorUrl = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL;

  if (aggregatorUrl) {
    try {
      const url = `${aggregatorUrl}/v1/blobs/${blobId}`;
      console.log("[Walrus] Using HTTP aggregator:", url);

      const response = await fetch(url, { method: "GET" });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(
          `Aggregator returned ${response.status} ${response.statusText}: ${text}`
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Uint8Array(arrayBuffer);

      console.log(
        "[Walrus] ✅ Blob retrieved via HTTP, size:",
        blob.length,
        "bytes"
      );
      return blob;
    } catch (error) {
      console.error("[Walrus] HTTP aggregator retrieval failed:", error);
      console.log("[Walrus] Attempting SDK fallback...");
      // Fall through to SDK method
    }
  }

  // FALLBACK METHOD: Use Walrus SDK
  console.log("[Walrus] Using SDK fallback for retrieval...");
  const walrusClient = createWalrusClient("testnet");
  const blob = await walrusClient.readBlob({ blobId });

  console.log(
    "[Walrus] ✅ Blob retrieved via SDK, size:",
    blob.length,
    "bytes"
  );
  return blob;
}

/**
 * Get Walrus aggregator URL for streaming
 */
export function getWalrusAggregatorUrl(
  blobId: string,
  network: "mainnet" | "testnet" = "testnet"
): string {
  const aggregatorUrl =
    network === "testnet"
      ? "https://aggregator.walrus-testnet.walrus.space"
      : "https://aggregator.walrus.space";

  return `${aggregatorUrl}/v1/${blobId}`;
}
