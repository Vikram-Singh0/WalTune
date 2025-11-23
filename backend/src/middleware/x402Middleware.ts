import { FastifyRequest, FastifyReply } from "fastify";
import {
  verifyPayment,
  generatePaymentInstruction,
  PaymentPayload,
} from "../services/x402Service.js";
import { playCreditsService } from "../services/playCreditsService.js";

/**
 * x402 Middleware
 * Intercepts requests and enforces payment before serving resources
 */

export interface X402Request extends FastifyRequest {
  x402?: {
    paymentRequired: boolean;
    amount: number;
    recipient: string;
    songId?: string;
  };
}

/**
 * Extract payment payload from X-PAYMENT header
 */
function extractPaymentHeader(request: FastifyRequest): PaymentPayload | null {
  const paymentHeader = request.headers["x-payment"];
  if (!paymentHeader || typeof paymentHeader !== "string") {
    return null;
  }

  try {
    return JSON.parse(paymentHeader) as PaymentPayload;
  } catch (error) {
    return null;
  }
}

/**
 * x402 Middleware - Checks for payment before serving resource
 */
export async function x402Middleware(
  request: X402Request,
  reply: FastifyReply
) {
  // Skip if payment not required
  if (!request.x402?.paymentRequired) {
    return;
  }

  const { amount, recipient, songId } = request.x402;

  // Check for payment in header
  const paymentPayload = extractPaymentHeader(request);

  if (!paymentPayload) {
    // No payment provided - return 402 Payment Required
    const instruction = generatePaymentInstruction(amount, recipient);

    reply.code(402).send({
      error: "Payment Required",
      message: "Payment required to access this resource",
      payment: {
        amount: instruction.amount,
        currency: instruction.currency,
        recipient: instruction.recipient,
        network: instruction.network,
        facilitator: instruction.facilitator,
      },
      // Include song metadata for client
      resource: {
        songId,
        type: "audio_stream",
      },
    });
    return;
  }

  // Check if this is a play credits payment
  if (paymentPayload.playCredits && paymentPayload.userSuiAddress) {
    console.log(`Processing play credits payment for user: ${paymentPayload.userSuiAddress}`);
    
    // Check if user has available play credits
    const hasCredits = await playCreditsService.hasCredits(
      paymentPayload.userSuiAddress
    );

    if (!hasCredits) {
      console.error(`No play credits available for user: ${paymentPayload.userSuiAddress}`);
      reply.code(402).send({
        error: "Insufficient Play Credits",
        message: "You don't have any play credits. Please purchase credits to play songs.",
        payment: {
          amount: Math.floor(amount * 1_000_000_000).toString(),
          currency: "SUI",
          recipient,
          network: `sui-${process.env.SUI_NETWORK || "testnet"}`,
        },
        requiresCredits: true,
      });
      return;
    }

    // Use one play credit
    const useResult = await playCreditsService.useCredit(
      paymentPayload.userSuiAddress
    );

    if (!useResult.success) {
      reply.code(402).send({
        error: "Failed to Use Credit",
        message: useResult.error || "Failed to deduct play credit",
        payment: {
          amount: Math.floor(amount * 1_000_000_000).toString(),
          currency: "SUI",
          recipient,
          network: `sui-${process.env.SUI_NETWORK || "testnet"}`,
        },
      });
      return;
    }

    // Credit used successfully
    (request as any).x402Verified = {
      valid: true,
      amount,
      recipient,
      paymentMethod: "play_credits",
      remainingPlays: useResult.remainingPlays,
    };
    return;
  }

  // Regular payment verification (existing flow)
  const amountInMist = Math.floor(amount * 1_000_000_000).toString();
  const verification = await verifyPayment(
    paymentPayload,
    amountInMist,
    recipient
  );

  if (!verification.valid) {
    reply.code(402).send({
      error: "Payment Verification Failed",
      message: verification.error || "Invalid payment",
      payment: {
        amount: amountInMist,
        currency: "SUI",
        recipient,
        network: `sui-${process.env.SUI_NETWORK || "testnet"}`,
      },
    });
    return;
  }

  // Payment verified - attach verification info to request
  (request as any).x402Verified = {
    valid: true,
    transactionHash: verification.transactionHash,
    amount,
    recipient,
    paymentMethod: "direct_payment",
  };
}

/**
 * Helper to mark request as requiring payment
 */
export function requirePayment(
  request: X402Request,
  amount: number,
  recipient: string,
  songId?: string
) {
  request.x402 = {
    paymentRequired: true,
    amount,
    recipient,
    songId,
  };
}

