import { FastifyInstance } from "fastify";
import { songController } from "../controllers/songController.js";
import { x402Middleware, requirePayment, X402Request } from "../middleware/x402Middleware.js";
import { suiService } from "../sui/suiService.js";

export default async function songRoutes(fastify: FastifyInstance) {
  // Upload a new song
  fastify.post("/upload", songController.upload.bind(songController));

  // Get all songs
  fastify.get("/all", songController.getAll.bind(songController));

  // Get songs by artist (must come before /:id)
  fastify.get(
    "/artist/:artistId",
    songController.getByArtist.bind(songController)
  );

  // Stream song with x402 payment gate (MUST come before /:id route)
  // This endpoint ALWAYS requires payment - returns 402 if no payment header
  fastify.get(
    "/stream/:id",
    async (request: X402Request, reply) => {
      const { id } = request.params as { id: string };
      const { walrusBlobId: fallbackBlobId } = request.query as { walrusBlobId?: string };

      console.log(`🎵 Stream request for song ID: ${id}`);

      try {
        // Get song metadata from blockchain
        console.log(`🔍 Looking up song metadata for ID: ${id}`);
        let song = await suiService.getSongMetadata(id);
        
        // If song not found as object, try to get it from events (fallback)
        if (!song) {
          console.warn(`⚠️ Song not found as object, trying to find in events...`);
          const allSongs = await suiService.getAllSongs();
          song = allSongs.find((s: any) => {
            // Match by full ID or check if ID starts with the provided ID (for partial matches)
            return s.id === id || s.id?.toLowerCase().startsWith(id.toLowerCase());
          });
          
          if (song) {
            console.log(`✅ Found song in events: ${song.title}`);
            console.log(`   Song ID: ${song.id}`);
            console.log(`   Walrus Blob ID: ${song.walrusCID || song.walrusBlobId || song.walrus_blob_id}`);
          } else {
            console.warn(`⚠️ Song not found in events either. Searched ID: ${id}`);
            console.log(`   Available song IDs (first 3):`, allSongs.slice(0, 3).map((s: any) => s.id));
          }
        }
        
        // Determine payment amount and recipient
        let pricePerPlay = 0.01; // Default price
        let recipient = ""; // Will be set from song
        let walrusBlobId = "";
        
        if (song) {
          pricePerPlay = song.pricePerPlay || 0.01;
          recipient = song.artistId || song.artist_id || "";
          // Try multiple possible field names for walrus blob ID
          walrusBlobId = song.walrusCID || song.walrusBlobId || song.walrus_blob_id || song.walrusBlobId || "";
          
          console.log(`✅ Song found: ${song.title}`);
          console.log(`   Price: ${pricePerPlay} SUI`);
          console.log(`   Artist ID: ${recipient}`);
          console.log(`   Walrus Blob ID: ${walrusBlobId}`);
          console.log(`   Song object keys:`, Object.keys(song));
          
          // If no recipient found, use a placeholder (for x402 demo)
          if (!recipient) {
            console.warn(`⚠️ Song found but no artist ID, using placeholder`);
            recipient = "0x0000000000000000000000000000000000000000";
          }
        } else {
          console.warn(`⚠️ Song not found, using default values for x402 demo`);
          // Use defaults so x402 flow still works
          recipient = "0x0000000000000000000000000000000000000000";
        }

        // ALWAYS require payment (x402) - even if song not found
        // This ensures x402 flow always works for demonstration
        requirePayment(request, pricePerPlay, recipient, id);

        // Apply x402 middleware (will return 402 if no payment header)
        await x402Middleware(request, reply);

        // If middleware sent 402 response, we're done
        if (reply.sent) {
          console.log(`💰 Payment required (402) for song: ${id}`);
          return;
        }

        // Payment verified - return the Walrus stream URL
        // Use song's blob ID or fallback from request
        const finalBlobId = walrusBlobId || fallbackBlobId;
        
        // Only return 404 if song not found AND no blob ID available
        if (!song && !finalBlobId) {
          console.error(`❌ Payment verified but song not found and no blob ID: ${id}`);
          return reply.code(404).send({
            error: "Song not found",
            message: "Payment verified but song not found in blockchain and no blob ID provided.",
            songId: id,
          });
        }
        
        if (!finalBlobId) {
          console.error(`❌ Song found but no Walrus blob ID: ${id}`);
          console.error(`   Song object:`, JSON.stringify(song, null, 2));
          return reply.code(500).send({
            error: "Stream unavailable",
            message: "Song found but Walrus blob ID missing.",
            songId: id,
            songTitle: song?.title,
          });
        }

        // Record play on blockchain (async, don't block response)
        if (song) {
          suiService.recordPlay(id).then(() => {
            console.log(`✅ Play recorded on blockchain for song: ${id}`);
          }).catch((err: any) => {
            console.error(`⚠️ Failed to record play on blockchain:`, err);
          });
        }

        console.log(`✅ Payment verified, returning stream URL`);
        const walrusAggregatorUrl =
          process.env.WALRUS_AGGREGATOR_URL ||
          "https://aggregator.walrus-testnet.walrus.space";
        const streamUrl = `${walrusAggregatorUrl}/v1/blobs/${finalBlobId}`;

        // Return the stream URL (payment already verified via x402)
        return reply.send({ 
          redirect: streamUrl,
          message: "Payment verified. Stream URL provided."
        });
      } catch (error: any) {
        console.error("❌ Stream error:", error);
        return reply.code(500).send({
          error: "Failed to stream song",
          message: error.message,
        });
      }
    }
  );

  // Record a song play (with payment verification)
  fastify.post(
    "/play/:id",
    async (request: X402Request, reply) => {
      const { id } = request.params as { id: string };

      try {
        // Get song metadata
        const song = await suiService.getSongMetadata(id);
        if (!song) {
          return reply.code(404).send({ error: "Song not found" });
        }

        // Require payment
        requirePayment(request, song.pricePerPlay, song.artistId, id);

        // Apply x402 middleware
        await x402Middleware(request, reply);

        // If payment verified, record play
        if (!reply.sent && (request as any).x402Verified) {
          // Record play on blockchain
          await songController.play(request as any, reply);
        }
      } catch (error: any) {
        console.error("Play error:", error);
        return reply.code(500).send({
          error: "Failed to record play",
          message: error.message,
        });
      }
    }
  );

  // Get song by ID (must be last to avoid matching /stream/:id or /artist/:id)
  fastify.get("/:id", songController.getById.bind(songController));
}
