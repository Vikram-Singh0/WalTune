import { walrusClient } from "./walrusClient.js";
import { UploadResponse } from "../types/index.js";

/**
 * Upload audio file to Walrus storage
 * @param buffer Audio file buffer
 * @param filename Original filename
 * @returns Upload response with Walrus CID and blob ID
 */
export async function uploadAudio(
  buffer: Buffer,
  filename: string
): Promise<UploadResponse> {
  try {
    // Validate file type (MP3)
    if (!filename.toLowerCase().endsWith(".mp3")) {
      return {
        success: false,
        error: "Only MP3 files are supported",
      };
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (buffer.length > maxSize) {
      return {
        success: false,
        error: "File size exceeds 50MB limit",
      };
    }

    // Upload to Walrus
    const result = await walrusClient.uploadAudio(buffer, filename);

    // Extract blob ID from response
    const blobId =
      result.newlyCreated?.blobObject.blobId || result.alreadyCertified?.blobId;

    if (!blobId) {
      return {
        success: false,
        error: "Failed to get blob ID from Walrus",
      };
    }

    return {
      success: true,
      walrusCID: walrusClient.getAudioUrl(blobId),
      blobId,
    };
  } catch (error) {
    console.error("Audio upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown upload error",
    };
  }
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
