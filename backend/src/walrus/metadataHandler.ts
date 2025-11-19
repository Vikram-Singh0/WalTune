import { Song } from "../types/index.js";

/**
 * ⚠️ TEMPORARY IN-MEMORY STORAGE
 *
 * This is a temporary solution for MVP. The proper architecture is:
 *
 * CURRENT (MVP):
 *   Audio → Walrus (get blobId) → In-Memory Storage (this file)
 *
 * TARGET (Production):
 *   Audio → Walrus (get blobId) → Sui Blockchain Smart Contracts
 *
 * Once Sui smart contracts are deployed:
 *   - Artist.move: Store artist data on-chain
 *   - SongRegistry.move: Store song metadata + blobId on-chain
 *   - PaymentRouter.move: Handle micropayments on-chain
 *
 * See: backend/src/sui/suiService.ts for blockchain integration
 * See: SUI_INTEGRATION_PLAN.md for architecture details
 */
class MetadataStore {
  private songs: Map<string, Song> = new Map();
  private artistSongs: Map<string, string[]> = new Map();

  /**
   * Store song metadata
   */
  storeSong(song: Song): void {
    this.songs.set(song.id, song);

    // Index by artist
    const artistSongs = this.artistSongs.get(song.artistId) || [];
    artistSongs.push(song.id);
    this.artistSongs.set(song.artistId, artistSongs);
  }

  /**
   * Get song by ID
   */
  getSong(songId: string): Song | undefined {
    return this.songs.get(songId);
  }

  /**
   * Get all songs
   */
  getAllSongs(): Song[] {
    return Array.from(this.songs.values()).sort(
      (a, b) => b.uploadedAt - a.uploadedAt
    );
  }

  /**
   * Get songs by artist
   */
  getSongsByArtist(artistId: string): Song[] {
    const songIds = this.artistSongs.get(artistId) || [];
    return songIds
      .map((id) => this.songs.get(id))
      .filter((song): song is Song => song !== undefined)
      .sort((a, b) => b.uploadedAt - a.uploadedAt);
  }

  /**
   * Update song play count
   */
  incrementPlayCount(songId: string): void {
    const song = this.songs.get(songId);
    if (song) {
      song.totalPlays++;
      this.songs.set(songId, song);
    }
  }

  /**
   * Search songs by title or artist name
   */
  searchSongs(query: string): Song[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.songs.values())
      .filter(
        (song) =>
          song.title.toLowerCase().includes(lowerQuery) ||
          song.artistName.toLowerCase().includes(lowerQuery)
      )
      .sort((a, b) => b.uploadedAt - a.uploadedAt);
  }

  /**
   * Delete song
   */
  deleteSong(songId: string): boolean {
    const song = this.songs.get(songId);
    if (!song) return false;

    this.songs.delete(songId);

    // Remove from artist index
    const artistSongs = this.artistSongs.get(song.artistId) || [];
    const filtered = artistSongs.filter((id) => id !== songId);
    this.artistSongs.set(song.artistId, filtered);

    return true;
  }
}

// Singleton instance
export const metadataStore = new MetadataStore();
