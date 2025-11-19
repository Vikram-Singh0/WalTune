import { FastifyRequest, FastifyReply } from "fastify";
import { MultipartFile } from "@fastify/multipart";
import { uploadAudio, getAudioStreamUrl } from "../walrus/uploadAudio.js";
import { metadataStore } from "../walrus/metadataHandler.js";
import { artistStore } from "../services/artistService.js";
import { Song, ApiResponse } from "../types/index.js";

interface UploadSongBody {
  title: string;
  artistWallet: string;
  pricePerPlay: string;
  duration: string;
  genre?: string;
  coverImage?: string;
}

export class SongController {
  /**
   * Upload a new song
   * POST /api/song/upload
   */
  async upload(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse<Song>> {
    try {
      const data = await request.file();

      if (!data) {
        reply.code(400);
        return {
          success: false,
          error: "No audio file provided",
        };
      }

      // Get form fields
      const fields = data.fields as any;
      const title = fields.title?.value;
      const artistWallet = fields.artistWallet?.value;
      const pricePerPlay = parseFloat(fields.pricePerPlay?.value || "0");
      const duration = parseInt(fields.duration?.value || "0", 10);
      const genre = fields.genre?.value;
      const coverImage = fields.coverImage?.value;

      // Validate required fields
      if (!title || !artistWallet) {
        reply.code(400);
        return {
          success: false,
          error: "Title and artist wallet are required",
        };
      }

      // Verify artist exists
      const artist = artistStore.getArtistByWallet(artistWallet);
      if (!artist) {
        reply.code(404);
        return {
          success: false,
          error: "Artist not found. Please register first.",
        };
      }

      // Convert stream to buffer
      const buffer = await data.toBuffer();

      // Upload to Walrus
      const uploadResult = await uploadAudio(buffer, data.filename);

      if (!uploadResult.success || !uploadResult.blobId) {
        reply.code(500);
        return {
          success: false,
          error: uploadResult.error || "Failed to upload to Walrus",
        };
      }

      // Create song metadata
      const song: Song = {
        id: `song_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        artistId: artist.id,
        artistName: artist.name,
        walrusCID: uploadResult.blobId,
        pricePerPlay,
        duration,
        genre,
        coverImage,
        uploadedAt: Date.now(),
        totalPlays: 0,
      };

      // TODO: Replace in-memory storage with Sui blockchain
      // Proper flow: Upload to Walrus (get blobId) → Store metadata + blobId on Sui
      // Current MVP: Using in-memory storage until smart contracts are deployed
      // See: backend/src/sui/suiService.ts for blockchain integration skeleton
      metadataStore.storeSong(song);

      reply.code(201);
      return {
        success: true,
        data: song,
        message: "Song uploaded successfully",
      };
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return {
        success: false,
        error: "Failed to upload song",
      };
    }
  }

  /**
   * Get all songs
   * GET /api/song/all
   */
  async getAll(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse<Song[]>> {
    try {
      const songs = metadataStore.getAllSongs();

      // Add streaming URLs
      const songsWithUrls = songs.map((song) => ({
        ...song,
        streamUrl: getAudioStreamUrl(song.walrusCID),
      }));

      return {
        success: true,
        data: songsWithUrls,
      };
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return {
        success: false,
        error: "Failed to fetch songs",
      };
    }
  }

  /**
   * Get song by ID
   * GET /api/song/:id
   */
  async getById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<ApiResponse<Song & { streamUrl: string }>> {
    try {
      const { id } = request.params;

      const song = metadataStore.getSong(id);

      if (!song) {
        reply.code(404);
        return {
          success: false,
          error: "Song not found",
        };
      }

      return {
        success: true,
        data: {
          ...song,
          streamUrl: getAudioStreamUrl(song.walrusCID),
        },
      };
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return {
        success: false,
        error: "Failed to fetch song",
      };
    }
  }

  /**
   * Record a song play
   * POST /api/song/play/:id
   */
  async play(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<ApiResponse> {
    try {
      const { id } = request.params;

      const song = metadataStore.getSong(id);

      if (!song) {
        reply.code(404);
        return {
          success: false,
          error: "Song not found",
        };
      }

      // Increment play count
      metadataStore.incrementPlayCount(id);

      // TODO: Trigger micropayment via x402 (future integration)

      return {
        success: true,
        message: "Play recorded",
        data: {
          songId: id,
          pricePerPlay: song.pricePerPlay,
        },
      };
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return {
        success: false,
        error: "Failed to record play",
      };
    }
  }

  /**
   * Get songs by artist
   * GET /api/song/artist/:artistId
   */
  async getByArtist(
    request: FastifyRequest<{ Params: { artistId: string } }>,
    reply: FastifyReply
  ): Promise<ApiResponse<Song[]>> {
    try {
      const { artistId } = request.params;

      const songs = metadataStore.getSongsByArtist(artistId);

      const songsWithUrls = songs.map((song) => ({
        ...song,
        streamUrl: getAudioStreamUrl(song.walrusCID),
      }));

      return {
        success: true,
        data: songsWithUrls,
      };
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return {
        success: false,
        error: "Failed to fetch artist songs",
      };
    }
  }
}

export const songController = new SongController();
