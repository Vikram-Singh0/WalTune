import axios, { AxiosInstance } from "axios";
import FormData from "form-data";
import { WalrusUploadResult } from "../types/index.js";

export class WalrusClient {
  private publisherUrl: string;
  private aggregatorUrl: string;
  private epochs: number;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.publisherUrl =
      process.env.WALRUS_PUBLISHER_URL ||
      "https://publisher.walrus-testnet.walrus.space";
    this.aggregatorUrl =
      process.env.WALRUS_AGGREGATOR_URL ||
      "https://aggregator.walrus-testnet.walrus.space";
    this.epochs = parseInt(process.env.WALRUS_EPOCHS || "5", 10);

    this.axiosInstance = axios.create({
      timeout: 60000, // 60 seconds for large file uploads
    });
  }

  /**
   * Upload audio file to Walrus
   * @param buffer Audio file buffer
   * @param filename Original filename
   * @returns Walrus upload result with blob ID and CID
   */
  async uploadAudio(
    buffer: Buffer,
    filename: string
  ): Promise<WalrusUploadResult> {
    try {
      const formData = new FormData();
      formData.append("file", buffer, {
        filename,
        contentType: "audio/mpeg",
      });

      const response = await this.axiosInstance.put(
        `${this.publisherUrl}/v1/store?epochs=${this.epochs}`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }
      );

      return response.data as WalrusUploadResult;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Walrus upload failed: ${
            error.response?.data?.message || error.message
          }`
        );
      }
      throw error;
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
      const response = await this.axiosInstance.head(this.getAudioUrl(blobId));
      return response.status === 200;
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
      const response = await this.axiosInstance.head(this.getAudioUrl(blobId));
      return {
        size: parseInt(response.headers["content-length"] || "0", 10),
        contentType: response.headers["content-type"] || "audio/mpeg",
      };
    } catch (error) {
      throw new Error(`Failed to get blob metadata: ${error}`);
    }
  }
}

// Singleton instance
export const walrusClient = new WalrusClient();
