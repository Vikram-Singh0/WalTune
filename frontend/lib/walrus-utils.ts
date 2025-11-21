/**
 * Walrus Upload Utilities
 * Helper functions for uploading files to Walrus storage using the SDK
 */

import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { WalrusClient, WalrusFile } from '@mysten/walrus';

/**
 * Initialize Walrus client
 */
export function createWalrusClient(network: 'mainnet' | 'testnet' = 'testnet'): WalrusClient {
  const suiClient = new SuiClient({
    url: getFullnodeUrl(network),
  });

  return new WalrusClient({
    suiClient,
    network,
  });
}

/**
 * Upload a file to Walrus using the SDK
 * This requires the user to have WAL tokens for storage fees
 * @param file File to upload
 * @param walletKeypair Keypair from the user's wallet (use with dApp kit)
 * @param epochs Number of epochs to store (default 5)
 * @returns Object with blobId and transaction digest
 */
export async function uploadFileToWalrus(
  file: File,
  walletKeypair: any, // Signer from @mysten/dapp-kit
  epochs: number = 5
): Promise<{ blobId: string; txDigest?: string }> {
  const walrusClient = createWalrusClient('testnet');

  // Read file as Uint8Array
  const arrayBuffer = await file.arrayBuffer();
  const blob = new Uint8Array(arrayBuffer);

  console.log(`📤 Uploading ${blob.length} bytes to Walrus...`);
  console.log(`   Epochs: ${epochs}`);
  
  // Upload to Walrus
  const result = await walrusClient.writeBlob({
    blob,
    deletable: true,
    epochs,
    signer: walletKeypair,
  });

  console.log(`✅ Upload successful! Blob ID: ${result.blobId}`);

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
  files: Array<{ file: File; identifier: string; tags?: Record<string, string> }>,
  walletKeypair: any,
  epochs: number = 5
): Promise<{ blobId: string; files: any[] }> {
  const walrusClient = createWalrusClient('testnet');

  // Convert to WalrusFile format
  const walrusFiles = await Promise.all(
    files.map(async ({ file, identifier, tags }) => {
      const arrayBuffer = await file.arrayBuffer();
      const contents = new Uint8Array(arrayBuffer);
      
      return WalrusFile.from({
        contents,
        identifier,
        tags: tags || {
          'content-type': file.type,
          'file-name': file.name,
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
 */
export async function readBlobFromWalrus(blobId: string): Promise<Uint8Array> {
  const walrusClient = createWalrusClient('testnet');
  return await walrusClient.readBlob({ blobId });
}

/**
 * Get Walrus aggregator URL for streaming
 */
export function getWalrusAggregatorUrl(blobId: string, network: 'mainnet' | 'testnet' = 'testnet'): string {
  const aggregatorUrl = network === 'testnet'
    ? 'https://aggregator.walrus-testnet.walrus.space'
    : 'https://aggregator.walrus.space';
  
  return `${aggregatorUrl}/v1/${blobId}`;
}
