import { walrus } from "@mysten/walrus";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { WalrusUploadResult } from "../types/index.js";
import axios from "axios";
import FormData from "form-data";

export class WalrusClient {
  private publisherUrl: string;
  private aggregatorUrl: string;
  private epochs: number;

  constructor() {
    this.publisherUrl =
      process.env.WALRUS_PUBLISHER_URL ||
      "https://publisher.walrus-testnet.walrus.space";
    this.aggregatorUrl =
      process.env.WALRUS_AGGREGATOR_URL ||
      "https://aggregator.walrus-testnet.walrus.space";
    this.epochs = parseInt(process.env.WALRUS_EPOCHS || "5", 10);
  }

  /**
   * Upload audio file to Walrus using HTTP publisher endpoint
   * This is the recommended approach for backend uploads without needing a wallet
   * @param buffer Audio file buffer
   * @param filename Original filename
   * @returns Walrus upload result with blob ID
   */
  async uploadAudio(
    buffer: Buffer,
    filename: string
  ): Promise<WalrusUploadResult> {
    try {
      console.log(
        `📤 Uploading ${filename} to Walrus (${buffer.length} bytes)`
      );

      // Try multiple publisher endpoints (in case one is down)
      const publisherUrls = [
        this.publisherUrl,
        "https://publisher-devnet.walrus.space",
        "https://wal-publisher-testnet.staketab.org",
      ];

      let lastError: Error | null = null;

      for (const publisherUrl of publisherUrls) {
        try {
          console.log(`🔄 Trying publisher: ${publisherUrl}`);
          
          const response = await axios.put(
            `${publisherUrl}/v1/store?epochs=${this.epochs}`,
            buffer,
            {
              headers: {
                "Content-Type": "application/octet-stream",
              },
              maxBodyLength: Infinity,
              maxContentLength: Infinity,
              timeout: 30000, // 30 seconds
            }
          );

          console.log("✅ Walrus upload successful via:", publisherUrl);
          return response.data as WalrusUploadResult;
        } catch (error) {
          lastError = error as Error;
          console.warn(`⚠️ Failed with ${publisherUrl}:`, (error as Error).message);
          continue; // Try next endpoint
        }
      }

      // All endpoints failed - throw the last error
      throw lastError || new Error("All Walrus publisher endpoints failed");
    } catch (error) {
      console.error("❌ Walrus upload failed:", error);
      
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message;
        throw new Error(`Walrus publisher upload failed: ${errorMsg}`);
      }
      
      throw new Error(
        `Walrus upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get audio URL from Walrus blob ID
   * @param blobId Walrus blob ID
   * @returns Public URL to stream audio
   */
  getAudioUrl(blobId: string): string {
    return `${this.aggregatorUrl}/v1/${blobId}`;
  }

  /**
   * Check if blob exists in Walrus
   * @param blobId Walrus blob ID
   * @returns Boolean indicating if blob exists
   */
  async checkBlobExists(blobId: string): Promise<boolean> {
    try {
      const response = await fetch(this.getAudioUrl(blobId), {
        method: "HEAD",
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get blob metadata
   * @param blobId Walrus blob ID
   * @returns Blob metadata including size and content type
   */
  async getBlobMetadata(
    blobId: string
  ): Promise<{ size: number; contentType: string }> {
    try {
      const response = await fetch(this.getAudioUrl(blobId), {
        method: "HEAD",
      });
      return {
        size: parseInt(response.headers.get("content-length") || "0", 10),
        contentType: response.headers.get("content-type") || "audio/mpeg",
      };
    } catch (error) {
      throw new Error(`Failed to get blob metadata: ${error}`);
    }
  }
}

// Singleton instance
export const walrusClient = new WalrusClient();
