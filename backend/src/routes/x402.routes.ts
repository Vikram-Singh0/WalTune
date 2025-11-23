/**
 * x402 Facilitator Routes
 * Provides /verify and /settle endpoints for x402 payments
 */

import { FastifyInstance } from "fastify";
import { facilitator } from "../services/x402Facilitator.js";

export default async function x402Routes(fastify: FastifyInstance) {
  /**
   * Verify payment
   * POST /verify
   */
  fastify.post("/verify", async (request, reply) => {
    try {
      const payload = request.body as any;

      // Extract expected values from query params or body
      const expectedAmount = (request.query as any)?.expectedAmount;
      const expectedRecipient = (request.query as any)?.expectedRecipient;

      const result = await facilitator.verifyPayment(
        payload,
        expectedAmount,
        expectedRecipient
      );

      if (result.valid) {
        return reply.send({
          valid: true,
          transactionHash: result.transactionHash,
          amount: result.amount,
          recipient: result.recipient,
        });
      } else {
        reply.code(400);
        return reply.send({
          valid: false,
          error: result.error,
        });
      }
    } catch (error: any) {
      reply.code(500);
      return reply.send({
        valid: false,
        error: error.message || "Verification failed",
      });
    }
  });

  /**
   * Settle payment (execute on-chain transaction)
   * POST /settle
   */
  fastify.post("/settle", async (request, reply) => {
    try {
      const payload = request.body as any;
      const signerAddress = (request.query as any)?.signerAddress;

      const result = await facilitator.settlePayment(payload, signerAddress);

      if (result.success) {
        return reply.send({
          success: true,
          transactionHash: result.transactionHash,
        });
      } else {
        reply.code(400);
        return reply.send({
          success: false,
          error: result.error,
        });
      }
    } catch (error: any) {
      reply.code(500);
      return reply.send({
        success: false,
        error: error.message || "Settlement failed",
      });
    }
  });

  /**
   * Health check
   * GET /health
   */
  fastify.get("/health", async (request, reply) => {
    return reply.send({
      status: "ok",
      service: "x402-facilitator",
      network: process.env.SUI_NETWORK || "testnet",
      timestamp: new Date().toISOString(),
    });
  });
}

