/**
 * Walrus Upload Utilities
 * Using Walrus SDK with wallet integration (HTTP upload not available on testnet)
 */

import { WalrusClient, WalrusFile } from "@mysten/walrus";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import type { Signer } from "@mysten/sui/cryptography";

/**
 * Upload file to Walrus using SDK with user's wallet
 * Note: HTTP upload endpoints are not available on testnet, so we must use SDK
 * 
 * @param file File to upload
 * @param signer User's wallet signer
 * @param suiClient Sui client instance (optional, will create if not provided)
 * @returns Blob ID
 */
export async function uploadFileToWalrus(
  file: File,
  signer: Signer,
  suiClient?: SuiClient
): Promise<{ blobId: string }> {
  console.log(`📤 Uploading ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) to Walrus...`);

  try {
    // Always create a fresh SuiClient with explicit RPC URL to avoid undefined URL issues
    // The client from useSuiClient() might have an undefined URL
    console.log("🔧 Creating SuiClient with testnet RPC...");
    const rpcUrl = process.env.NEXT_PUBLIC_SUI_RPC_URL || getFullnodeUrl("testnet");
    console.log(`   Using RPC: ${rpcUrl}`);
    
    const client = new SuiClient({
      url: rpcUrl,
    });

    // Read file as Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Create Walrus client
    console.log("🔧 Initializing Walrus client...");
    const walrusClient = new WalrusClient({
      client: client,
      network: "testnet",
    });

    // Create WalrusFile
    const walrusFile = WalrusFile.from({
      contents: bytes,
      identifier: file.name,
      tags: {
        contentType: file.type || "audio/mpeg",
        originalName: file.name,
      },
    });

    console.log("🔐 Uploading with your wallet (you'll need to approve the transaction)...");

    // Upload using user's wallet as signer
    const results = await walrusClient.writeFiles({
      files: [walrusFile],
      signer,
      epochs: 5,
      deletable: false,
    });

    // writeFiles returns an array of results
    if (!results || results.length === 0 || !results[0]?.blobId) {
      throw new Error("No blob ID returned from Walrus");
    }

    const blobId = results[0].blobId;
    console.log(`✅ Upload successful! Blob ID: ${blobId}`);
    return { blobId };
  } catch (error: any) {
    console.error('❌ Walrus upload failed:', error);
    
    // Provide more descriptive error messages
    let errorMessage = 'Walrus upload failed';
    if (error.message) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    // Check for specific error conditions
    if (errorMessage.includes('404') || errorMessage.includes('Unexpected status code: 404')) {
      errorMessage = 'Sui RPC error (404). This usually means:\n' +
        '1. The Sui testnet RPC endpoint is having issues\n' +
        '2. The Walrus SDK is trying to access objects that don\'t exist\n' +
        '3. Network configuration mismatch\n\n' +
        'Try:\n' +
        '- Check your Sui network connection\n' +
        '- Ensure you\'re on Sui testnet\n' +
        '- Wait a moment and try again (RPC might be temporarily unavailable)';
    } else if (errorMessage.includes('balance') || errorMessage.includes('insufficient')) {
      errorMessage = 'Insufficient balance. You need:\n' +
        '1. SUI tokens (for gas fees)\n' +
        '2. WAL tokens (for storage fees)\n\n' +
        'Get tokens from: https://docs.wal.app/usage/setup.html';
    } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    } else if (errorMessage.includes('signature') || errorMessage.includes('sign')) {
      errorMessage = 'Transaction signature failed. Please approve the transaction in your wallet.';
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Get Walrus aggregator URL for streaming
 */
export function getWalrusAggregatorUrl(
  blobId: string,
  network: 'mainnet' | 'testnet' = 'testnet'
): string {
  const aggregatorUrl =
    network === 'testnet'
      ? 'https://aggregator.walrus-testnet.walrus.space'
      : 'https://aggregator.walrus.space';

  return `${aggregatorUrl}/v1/${blobId}`;
}
