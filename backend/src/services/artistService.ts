import { Artist } from "../types/index.js";

/**
 * In-memory artist store (will be replaced with Sui smart contract)
 */
class ArtistStore {
  private artists: Map<string, Artist> = new Map();
  private walletToArtist: Map<string, string> = new Map();

  /**
   * Register a new artist
   */
  registerArtist(artist: Artist): void {
    this.artists.set(artist.id, artist);
    this.walletToArtist.set(artist.walletAddress, artist.id);
  }

  /**
   * Get artist by ID
   */
  getArtist(artistId: string): Artist | undefined {
    return this.artists.get(artistId);
  }

  /**
   * Get artist by wallet address
   */
  getArtistByWallet(walletAddress: string): Artist | undefined {
    const artistId = this.walletToArtist.get(walletAddress);
    return artistId ? this.artists.get(artistId) : undefined;
  }

  /**
   * Check if wallet is registered
   */
  isWalletRegistered(walletAddress: string): boolean {
    return this.walletToArtist.has(walletAddress);
  }

  /**
   * Get all artists
   */
  getAllArtists(): Artist[] {
    return Array.from(this.artists.values());
  }

  /**
   * Update artist profile
   */
  updateArtist(artistId: string, updates: Partial<Artist>): boolean {
    const artist = this.artists.get(artistId);
    if (!artist) return false;

    const updated = { ...artist, ...updates };
    this.artists.set(artistId, updated);
    return true;
  }
}

// Singleton instance
export const artistStore = new ArtistStore();
