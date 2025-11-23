import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { playCreditsService } from "../services/playCreditsService.js";
import { verifyPayment } from "../services/x402Service.js";

interface PurchaseCreditsBody {
  userSuiAddress: string;
  numberOfPlays: number;
  amountInSui: number;
  transactionDigest: string;
  paymentPayload?: any; // Optional payment verification payload
}

interface GetCreditsQuery {
  userSuiAddress: string;
}

export default async function playCreditsRoutes(fastify: FastifyInstance) {
  /**
   * Get play credits for a user
   * GET /api/play-credits?userSuiAddress=0x...
   */
  fastify.get(
    "/",
    async (
      request: FastifyRequest<{ Querystring: GetCreditsQuery }>,
      reply
    ) => {
      try {
        const { userSuiAddress } = request.query;

        if (!userSuiAddress) {
          reply.code(400);
          return {
            success: false,
            error: "userSuiAddress query parameter is required",
          };
        }

        let credits;
        try {
          credits = await playCreditsService.getOrCreateCredits(
            userSuiAddress
          );
        } catch (error: any) {
          console.error("Database error:", error);
          reply.code(500);
          return {
            success: false,
            error: error.message || "Database error. Please ensure the migration has been run.",
            details: error.message?.includes("not initialized") 
              ? "Run the SQL migration: backend/migrations/create_play_credits_tables.sql"
              : undefined,
          };
        }

        if (!credits) {
          reply.code(500);
          return {
            success: false,
            error: "Failed to get or create credits",
          };
        }

        return {
          success: true,
          credits: {
            remainingPlays: credits.remainingPlays,
            totalPurchased: credits.totalPurchased,
            createdAt: credits.createdAt,
            updatedAt: credits.updatedAt,
          },
        };
      } catch (error: any) {
        console.error("Error getting credits:", error);
        reply.code(500);
        return {
          success: false,
          error: error.message || "Failed to get credits",
        };
      }
    }
  );

  /**
   * Purchase play credits
   * POST /api/play-credits/purchase
   */
  fastify.post(
    "/purchase",
    async (
      request: FastifyRequest<{ Body: PurchaseCreditsBody }>,
      reply
    ) => {
      try {
        const {
          userSuiAddress,
          numberOfPlays,
          amountInSui,
          transactionDigest,
          paymentPayload,
        } = request.body;

        if (!userSuiAddress || !numberOfPlays || !amountInSui || !transactionDigest) {
          reply.code(400);
          return {
            success: false,
            error: "userSuiAddress, numberOfPlays, amountInSui, and transactionDigest are required",
          };
        }

        if (numberOfPlays <= 0) {
          reply.code(400);
          return {
            success: false,
            error: "numberOfPlays must be greater than 0",
          };
        }

        if (amountInSui <= 0) {
          reply.code(400);
          return {
            success: false,
            error: "amountInSui must be greater than 0",
          };
        }

        // Optional: Verify payment if paymentPayload is provided
        if (paymentPayload) {
          // Extract recipient from payment payload or use a default
          const recipient = paymentPayload.recipient || "0x0000000000000000000000000000000000000000";
          const amountInMist = Math.floor(amountInSui * 1_000_000_000).toString();
          
          const verification = await verifyPayment(
            paymentPayload,
            amountInMist,
            recipient
          );

          if (!verification.valid) {
            reply.code(402);
            return {
              success: false,
              error: verification.error || "Payment verification failed",
            };
          }
        }

        // Record the purchase
        const result = await playCreditsService.purchaseCredits(
          userSuiAddress,
          numberOfPlays,
          amountInSui,
          transactionDigest
        );

        if (!result.success) {
          reply.code(400);
          return {
            success: false,
            error: result.error,
          };
        }

        return {
          success: true,
          credits: {
            remainingPlays: result.credits!.remainingPlays,
            totalPurchased: result.credits!.totalPurchased,
          },
        };
      } catch (error: any) {
        console.error("Error purchasing credits:", error);
        reply.code(500);
        return {
          success: false,
          error: error.message || "Failed to purchase credits",
        };
      }
    }
  );
}

