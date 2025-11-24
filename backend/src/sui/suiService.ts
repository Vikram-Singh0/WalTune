import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromBase64 } from "@mysten/sui/utils";
import { config } from "../config/env.js";

/**
 * Sui Client for interacting with the blockchain
 * This stores song metadata on-chain after audio is uploaded to Walrus
 */
export class SuiService {
  private client: SuiClient;
  private network: "testnet" | "mainnet";
  private packageId: string;
  private artistRegistryId: string;
  private songRegistryId: string;

  constructor() {
    this.network = config.SUI_NETWORK as "testnet" | "mainnet";
    const rpcUrl = config.SUI_RPC_URL || getFullnodeUrl(this.network);
    this.client = new SuiClient({ url: rpcUrl });

    // Load from configuration
    this.packageId = config.PACKAGE_ID;
    this.artistRegistryId = config.ARTIST_REGISTRY_ID;
    this.songRegistryId = config.SONG_REGISTRY_ID;

    // Debug: Log what we're loading
    console.log("🔧 SuiService Configuration:");
    console.log("   PACKAGE_ID:", this.packageId || "❌ NOT SET");
    console.log("   ARTIST_REGISTRY_ID:", this.artistRegistryId || "❌ NOT SET");
    console.log("   SONG_REGISTRY_ID:", this.songRegistryId || "❌ NOT SET");
    console.log("   SUI_NETWORK:", this.network);
    console.log("   SUI_RPC_URL:", rpcUrl);

    if (!this.packageId || !this.artistRegistryId || !this.songRegistryId) {
      console.warn("⚠️ Sui contract addresses not configured in .env");
    }
  }

  /**
   * Register artist on Sui blockchain
   */
  async registerArtist(params: {
    walletAddress: string;
    name: string;
    bio?: string;
  }): Promise<{
    success: boolean;
    artistId?: string;
    txDigest?: string;
    error?: string;
  }> {
    try {
      if (!this.packageId || !this.artistRegistryId) {
        throw new Error("Smart contracts not configured. Check .env file.");
      }

      console.log("⛓️ Registering artist on Sui blockchain...");

      // Note: This requires the artist to sign the transaction
      // For now, return pending until we implement wallet signing
      return {
        success: false,
        error:
          "Artist registration requires wallet signature. Use frontend to register.",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Store song metadata on Sui blockchain
   * This should be called AFTER uploading audio to Walrus
   */
  async storeSongMetadata(params: {
    title: string;
    artistId: string;
    artistName: string;
    walrusBlobId: string;
    pricePerPlay: number;
    duration: number;
    genre?: string;
    coverImage?: string;
    signerAddress: string; // The wallet address that will sign this transaction
  }): Promise<{
    success: boolean;
    songId?: string;
    txDigest?: string;
    error?: string;
  }> {
    try {
      if (!this.packageId || !this.songRegistryId) {
        throw new Error("Smart contracts not configured. Check .env file.");
      }

      console.log("⛓️ Creating transaction to register song on Sui...");

      // Create transaction to call register_song
      const tx = new Transaction();

      tx.moveCall({
        target: `${this.packageId}::song_registry::register_song`,
        arguments: [
          tx.object(this.songRegistryId),
          tx.pure.string(params.title),
          tx.pure.address(params.artistId),
          tx.pure.string(params.artistName),
          tx.pure.string(params.walrusBlobId),
          tx.pure.u64(Math.floor(params.pricePerPlay * 1000000000)), // Convert to MIST
          tx.pure.u64(params.duration),
          tx.pure.string(params.genre || ""),
          tx.pure.string(params.coverImage || ""),
        ],
      });

      // For backend, we can't sign transactions
      // Return the transaction for frontend to sign
      const txBytes = await tx.build({ client: this.client });

      return {
        success: false,
        error:
          "Transaction built. Frontend must sign and execute this transaction.",
      };
    } catch (error) {
      console.error(
        "❌ Failed to create song registration transaction:",
        error
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get all songs from blockchain by querying SongRegistered events
   */
  async getAllSongs(): Promise<any[]> {
    try {
      if (!this.packageId) {
        console.warn("⚠️ Smart contracts not configured");
        return [];
      }

      console.log("⛓️ Querying all songs from Sui blockchain...");

      // Query SongRegistered events
      const events = await this.client.queryEvents({
        query: {
          MoveEventType: `${this.packageId}::song_registry::SongRegistered`,
        },
        limit: 50,
        order: "descending",
      });

      console.log(`✅ Found ${events.data.length} songs on blockchain`);

      return events.data.map((event) => {
        const fields = event.parsedJson as any;
        return {
          id: fields.song_id,
          title: fields.title,
          artistId: fields.artist_id,
          artistName: fields.artist_name,
          walrusCID: fields.walrus_blob_id,
          pricePerPlay: fields.price_per_play / 1000000000, // Convert from MIST
          duration: fields.duration,
          genre: fields.genre,
          uploadedAt: fields.uploaded_at,
          totalPlays: 0, // Would need to query the song object for this
        };
      });
    } catch (error) {
      console.error("❌ Failed to get songs from blockchain:", error);
      return [];
    }
  }

  /**
   * Get song metadata from Sui blockchain
   */
  async getSongMetadata(songId: string): Promise<any> {
    try {
      if (!this.packageId) {
        throw new Error("Smart contracts not configured");
      }

      console.log(`⛓️ Querying song ${songId} from blockchain...`);

      // Query the song object directly
      const result = await this.client.getObject({
        id: songId,
        options: {
          showContent: true,
          showOwner: true,
        },
      });

      if (
        !result.data?.content ||
        result.data.content.dataType !== "moveObject"
      ) {
        return null;
      }

      const fields = result.data.content.fields as any;

      return {
        id: songId,
        title: fields.title,
        artistId: fields.artist_id,
        artistName: fields.artist_name,
        walrusCID: fields.walrus_blob_id,
        pricePerPlay: fields.price_per_play / 1000000000,
        duration: fields.duration,
        genre: fields.genre,
        coverImage: fields.cover_image,
        uploadedAt: fields.uploaded_at,
        totalPlays: fields.total_plays,
      };
    } catch (error) {
      console.error("Failed to get song metadata:", error);
      return null;
    }
  }

  /**
   * Get artist's total earnings from blockchain
   */
  async getArtistEarnings(artistId: string): Promise<number> {
    try {
      if (!this.packageId) {
        return 0;
      }

      // TODO: Query blockchain for artist earnings
      return 0;
    } catch (error) {
      console.error("Failed to get earnings:", error);
      return 0;
    }
  }

  /**
   * Record a play on the blockchain
   * This increments the totalPlays counter on the Song object
   */
  async recordPlay(songId: string): Promise<{
    success: boolean;
    txDigest?: string;
    error?: string;
  }> {
    try {
      if (!this.packageId) {
        throw new Error("Smart contracts not configured");
      }

      console.log(`⛓️ Recording play for song ${songId} on blockchain...`);

      // Get backend keypair from configuration
      const privateKeyBase64 = config.BACKEND_PRIVATE_KEY;
      if (!privateKeyBase64) {
        throw new Error("BACKEND_PRIVATE_KEY not configured in .env");
      }

      // Decode from Base64 and remove the first byte (flag byte)
      const privateKeyBytes = fromBase64(privateKeyBase64);
      // Sui keys include a 1-byte flag at the start, we need to remove it
      const secretKey = privateKeyBytes.slice(1);
      const keypair = Ed25519Keypair.fromSecretKey(secretKey);

      // Create transaction to record play
      const tx = new Transaction();

      tx.moveCall({
        target: `${this.packageId}::song_registry::record_play`,
        arguments: [tx.object(songId)],
      });

      // Sign and execute transaction
      const result = await this.client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: {
          showEffects: true,
        },
      });

      if (result.effects?.status?.status === "success") {
        console.log(`✅ Play recorded on blockchain. Tx: ${result.digest}`);
        return {
          success: true,
          txDigest: result.digest,
        };
      } else {
        throw new Error(`Transaction failed: ${result.effects?.status?.error}`);
      }
    } catch (error) {
      console.error("Failed to record play:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Singleton instance
export const suiService = new SuiService();
