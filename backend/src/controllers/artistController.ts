import { FastifyRequest, FastifyReply } from "fastify";
import { artistStore } from "../services/artistService.js";
import { Artist, ApiResponse } from "../types/index.js";

interface RegisterArtistBody {
  walletAddress: string;
  name: string;
  bio?: string;
  profileImage?: string;
}

export class ArtistController {
  /**
   * Register a new artist
   * POST /api/artist/register
   */
  async register(
    request: FastifyRequest<{ Body: RegisterArtistBody }>,
    reply: FastifyReply
  ): Promise<ApiResponse<Artist>> {
    try {
      const { walletAddress, name, bio, profileImage } = request.body;

      // Validate required fields
      if (!walletAddress || !name) {
        reply.code(400);
        return {
          success: false,
          error: "Wallet address and name are required",
        };
      }

      // Check if wallet is already registered
      if (artistStore.isWalletRegistered(walletAddress)) {
        reply.code(409);
        return {
          success: false,
          error: "Wallet address already registered",
        };
      }

      // Create artist
      const artist: Artist = {
        id: `artist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        walletAddress,
        name,
        bio,
        profileImage,
        createdAt: Date.now(),
      };

      artistStore.registerArtist(artist);

      reply.code(201);
      return {
        success: true,
        data: artist,
        message: "Artist registered successfully",
      };
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return {
        success: false,
        error: "Failed to register artist",
      };
    }
  }

  /**
   * Get artist by wallet address
   * GET /api/artist/:walletAddress
   */
  async getByWallet(
    request: FastifyRequest<{ Params: { walletAddress: string } }>,
    reply: FastifyReply
  ): Promise<ApiResponse<Artist>> {
    try {
      const { walletAddress } = request.params;

      const artist = artistStore.getArtistByWallet(walletAddress);

      if (!artist) {
        reply.code(404);
        return {
          success: false,
          error: "Artist not found",
        };
      }

      return {
        success: true,
        data: artist,
      };
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return {
        success: false,
        error: "Failed to fetch artist",
      };
    }
  }

  /**
   * Get all artists
   * GET /api/artist/all
   */
  async getAll(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<ApiResponse<Artist[]>> {
    try {
      const artists = artistStore.getAllArtists();

      return {
        success: true,
        data: artists,
      };
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return {
        success: false,
        error: "Failed to fetch artists",
      };
    }
  }
}

export const artistController = new ArtistController();
