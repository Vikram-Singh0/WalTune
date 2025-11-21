import { walrusClient } from "./walrusClient.js";
import { UploadResponse } from "../types/index.js";

/**
 * Note: Uploads are now handled directly from frontend using Walrus SDK
 * This function is deprecated and kept for backward compatibility only
 * 
 * For new implementations, use frontend/lib/walrus-utils.ts
 */
export async function uploadAudio(
  buffer: Buffer,
  filename: string
): Promise<UploadResponse> {
  console.warn(
    "⚠️  uploadAudio is deprecated. Use Walrus SDK from frontend instead."
  );
  return {
    success: false,
    error:
      "Backend upload deprecated. Please use Walrus SDK from frontend with user wallet.",
  };
}

/**
 * Verify audio exists in Walrus
 * @param blobId Walrus blob ID
 * @returns Boolean indicating if audio exists
 */
export async function verifyAudioExists(blobId: string): Promise<boolean> {
  try {
    return await walrusClient.checkBlobExists(blobId);
  } catch {
    return false;
  }
}

/**
 * Get audio stream URL
 * @param blobId Walrus blob ID
 * @returns Public URL to stream audio
 */
export function getAudioStreamUrl(blobId: string): string {
  return walrusClient.getAudioUrl(blobId);
}
