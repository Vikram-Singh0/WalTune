import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";

export class WalrusClient {
  private aggregatorUrl: string;

  constructor() {
    this.aggregatorUrl =
      process.env.WALRUS_AGGREGATOR_URL ||
      "https://aggregator.walrus-testnet.walrus.space";
  }

  /**
   * Note: File uploads should be done from frontend using Walrus SDK
   * This backend service is only for helper functions like getting URLs
   */

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
