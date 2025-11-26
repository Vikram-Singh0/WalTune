import { FastifyInstance } from "fastify";
import { config } from "../config/env.js";

/**
 * Config routes - Public configuration endpoints
 */
export default async function configRoutes(fastify: FastifyInstance) {
  /**
   * Get public configuration
   * Returns non-sensitive config values needed by the frontend
   */
  fastify.get("/public", async (request, reply) => {
    return {
      success: true,
      config: {
        backendWalletAddress: config.BACKEND_WALLET_ADDRESS,
        suiNetwork: config.SUI_NETWORK,
      },
    };
  });
}
