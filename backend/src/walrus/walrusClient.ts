export class WalrusClient {
  private aggregatorUrl: string;
  private publisherUrls: string[];
  private readonly uploadTimeout = 60000; // 60 seconds
  private readonly maxRetries = 3;

  constructor() {
    this.aggregatorUrl =
      process.env.WALRUS_AGGREGATOR_URL ||
      "https://aggregator.walrus-testnet.walrus.space";
    
    // Try multiple publisher endpoints (upload relay may not be available)
    const customPublisher = process.env.WALRUS_PUBLISHER_URL;
    const customRelay = process.env.WALRUS_UPLOAD_RELAY_URL;
    
    this.publisherUrls = [
      // Try custom publisher first if set
      customPublisher,
      // Try alternative publishers (from test file)
      "https://publisher.walrus-testnet.walrus.space",
      "https://wal-publisher-testnet.staketab.org",
      // Try upload relay as last resort
      customRelay || "https://upload-relay.testnet.walrus.space",
    ].filter(Boolean);
  }

  /**
   * Upload file to Walrus using HTTP publisher with retry logic
   * @param buffer File buffer
   * @param filename Original filename
   * @returns Blob ID
   */
  async uploadFile(buffer: Buffer, filename: string): Promise<string> {
    const fileSizeMB = (buffer.length / 1024 / 1024).toFixed(2);
    console.log(`📤 Uploading ${filename} (${fileSizeMB} MB) to Walrus...`);

    let lastError: Error | null = null;

    // Try each publisher endpoint
    for (const publisherUrl of this.publisherUrls) {
      console.log(`   Trying publisher: ${publisherUrl}`);

      // Retry logic for each endpoint
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          if (attempt > 1) {
            console.log(`   Retry attempt ${attempt}/${this.maxRetries}...`);
            // Exponential backoff: 1s, 2s, 4s
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
          }

          const blobId = await this.attemptUpload(publisherUrl, buffer, filename);
          console.log(`✅ Uploaded to Walrus: ${blobId}`);
          return blobId;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.error(`   Attempt ${attempt} failed: ${lastError.message}`);
          
          // If it's a client error (4xx), don't retry
          if (error instanceof Error && error.message.includes('HTTP 4')) {
            throw lastError;
          }
        }
      }
    }

    // All attempts failed
    const errorMessage = lastError?.message || "Unknown error";
    console.error(`❌ All upload attempts failed. Last error: ${errorMessage}`);
    
    // Provide helpful error message
    if (errorMessage.includes('404')) {
      throw new Error(
        `HTTP upload to Walrus is not available. All endpoints returned 404.\n\n` +
        `This means the Walrus HTTP publisher endpoints are not enabled on testnet.\n\n` +
        `SOLUTION: You need to use the Walrus SDK with wallet signing instead.\n` +
        `The frontend should use @mysten/walrus SDK with the user's wallet to upload files.\n\n` +
        `See: https://docs.wal.app/usage/client-cli.html for more information.`
      );
    }
    
    throw new Error(`Failed to upload to Walrus after ${this.maxRetries} retries on ${this.publisherUrls.length} endpoints: ${errorMessage}`);
  }

  /**
   * Attempt a single upload to a publisher endpoint
   * @param publisherUrl Publisher endpoint URL
   * @param buffer File buffer
   * @param filename Original filename
   * @returns Blob ID
   */
  private async attemptUpload(
    publisherUrl: string,
    buffer: Buffer,
    filename: string
  ): Promise<string> {
    // Try different methods and endpoints
    const isUploadRelay = publisherUrl.includes("upload-relay");
    
    // Try both PUT and POST with different endpoint formats
    const endpoints = [
      // Standard publisher endpoint (PUT)
      { url: `${publisherUrl}/v1/store?epochs=5`, method: "PUT" },
      // Alternative formats
      { url: `${publisherUrl}/store?epochs=5`, method: "PUT" },
      // Upload relay formats (POST)
      { url: `${publisherUrl}/v1/upload?epochs=5`, method: "POST" },
      { url: `${publisherUrl}/upload?epochs=5`, method: "POST" },
    ];
    
    let lastError: Error | null = null;
    
    for (const endpoint of endpoints) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.uploadTimeout);
      
      try {
        console.log(`   Trying ${endpoint.method} ${endpoint.url}`);
        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers: {
            "Content-Type": "application/octet-stream",
          },
          body: buffer,
          signal: controller.signal,
        });

        clearTimeout(timeout);

          if (!response.ok) {
            let errorText = "";
            try {
              errorText = await response.text();
            } catch {
              errorText = `HTTP ${response.status} ${response.statusText}`;
            }
            
            // If 404, try next endpoint
            if (response.status === 404 && endpoints.length > 1) {
              console.log(`   Endpoint returned 404, trying next...`);
              lastError = new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
              clearTimeout(timeout);
              continue;
            }
            
            // Provide more specific error messages
            if (response.status === 404) {
              throw new Error(`HTTP ${response.status}: Upload endpoint not available. Tried: ${endpoints.join(', ')}`);
            } else if (response.status === 413) {
              throw new Error(`HTTP ${response.status}: File too large. Maximum size exceeded.`);
            } else if (response.status >= 500) {
              throw new Error(`HTTP ${response.status}: Server error. Please try again later.`);
            } else {
              throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
            }
          }

          let result: any;
          try {
            result = await response.json();
          } catch (parseError) {
            throw new Error("Invalid JSON response from upload endpoint");
          }

          // Validate response structure - handle different response formats
          const blobId = result.newlyCreated?.blobObject?.blobId || 
                         result.alreadyCertified?.blobId ||
                         result.blobId ||
                         result.id; // Some endpoints may use 'id'

          if (!blobId || typeof blobId !== 'string') {
            console.error("Invalid response structure:", JSON.stringify(result, null, 2));
            throw new Error("No blob ID in response. Response: " + JSON.stringify(result).substring(0, 300));
          }

          return blobId;
        } catch (error) {
          clearTimeout(timeout);
          
          // Handle timeout errors
          if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`Upload timeout after ${this.uploadTimeout / 1000} seconds`);
          }
          
          // If this is the last endpoint, throw the error
          if (endpoints.indexOf(endpoint) === endpoints.length - 1) {
            throw error;
          }
          // Otherwise, continue to next endpoint
          lastError = error instanceof Error ? error : new Error(String(error));
          console.log(`   Endpoint failed, trying next...`);
        }
      }
      
      // If we get here, all endpoints failed
      throw lastError || new Error("All upload endpoints failed");
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
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(this.getAudioUrl(blobId), {
        method: "HEAD",
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      return response.ok;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn(`Timeout checking blob existence: ${blobId}`);
      }
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
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(this.getAudioUrl(blobId), {
        method: "HEAD",
        signal: controller.signal,
      });
      
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Blob not found or not accessible`);
      }

      return {
        size: parseInt(response.headers.get("content-length") || "0", 10),
        contentType: response.headers.get("content-type") || "audio/mpeg",
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Timeout getting blob metadata for ${blobId}`);
      }
      throw new Error(`Failed to get blob metadata: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Singleton instance
export const walrusClient = new WalrusClient();
