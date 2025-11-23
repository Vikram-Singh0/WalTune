import axios from "axios";

/**
 * x402 Payment Service for Sui Network
 * Integrates with BlockEden.xyz x402 facilitator
 */

export interface PaymentInstruction {
  amount: string; // Amount in MIST (1 SUI = 1,000,000,000 MIST)
  currency: string; // "SUI" or token address
  recipient: string; // Artist wallet address
  network: string; // "sui-testnet" or "sui-mainnet"
  facilitator: string; // Facilitator URL
}

export interface PaymentPayload {
  signature: string;
  message: string;
  publicKey: string;
  amount: string;
  recipient: string;
  nonce: string;
  timestamp: number;
  transactionDigest?: string;
  // Play credits payment fields
  playCredits?: boolean;
  userSuiAddress?: string; // User's main Sui address (for play credits lookup)
}

export interface PaymentVerification {
  valid: boolean;
  transactionHash?: string;
  error?: string;
}

// Use local facilitator by default, fallback to external
const X402_FACILITATOR_URL =
  process.env.X402_FACILITATOR_URL ||
  "http://localhost:3001/x402"; // Local facilitator (same server)

const SUI_NETWORK = process.env.SUI_NETWORK || "testnet";

// For testing: Use mock verification if facilitator is unavailable
const USE_MOCK_VERIFICATION = process.env.X402_USE_MOCK === "true" || false;

/**
 * Generate payment instruction for a song play
 */
export function generatePaymentInstruction(
  amountInSui: number,
  recipientAddress: string
): PaymentInstruction {
  // Convert SUI to MIST (1 SUI = 1,000,000,000 MIST)
  const amountInMist = Math.floor(amountInSui * 1_000_000_000).toString();

  return {
    amount: amountInMist,
    currency: "SUI",
    recipient: recipientAddress,
    network: `sui-${SUI_NETWORK}`,
    facilitator: X402_FACILITATOR_URL,
  };
}

/**
 * Verify payment via x402 facilitator
 */
export async function verifyPayment(
  paymentPayload: PaymentPayload,
  expectedAmount: string,
  expectedRecipient: string
): Promise<PaymentVerification> {
  // Mock verification for testing (when facilitator is unavailable)
  if (USE_MOCK_VERIFICATION) {
    console.log("🧪 Using mock payment verification (testing mode)");
    
    // Basic validation: check that payment payload exists and has required fields
    if (!paymentPayload.signature || !paymentPayload.message) {
      return {
        valid: false,
        error: "Invalid payment payload",
      };
    }

    // Check amount matches
    if (paymentPayload.amount !== expectedAmount) {
      return {
        valid: false,
        error: `Amount mismatch: expected ${expectedAmount}, got ${paymentPayload.amount}`,
      };
    }

    // Check recipient matches
    if (paymentPayload.recipient !== expectedRecipient) {
      return {
        valid: false,
        error: `Recipient mismatch: expected ${expectedRecipient}, got ${paymentPayload.recipient}`,
      };
    }

    // Mock successful verification
    return {
      valid: true,
      transactionHash: `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  // Real facilitator verification
  try {
    console.log("🔍 Verifying payment with facilitator:", {
      payloadAmount: paymentPayload.amount,
      expectedAmount,
      payloadRecipient: paymentPayload.recipient,
      expectedRecipient,
    });

    // Pass expected values as query params so facilitator can validate them
    const verifyUrl = new URL(`${X402_FACILITATOR_URL}/verify`);
    if (expectedAmount) verifyUrl.searchParams.set("expectedAmount", expectedAmount);
    if (expectedRecipient) verifyUrl.searchParams.set("expectedRecipient", expectedRecipient);

    const response = await axios.post(
      verifyUrl.toString(),
      {
        ...paymentPayload,
        network: `sui-${SUI_NETWORK}`,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 second timeout
      }
    );

    console.log("✅ Facilitator response:", response.data);

    // Facilitator already validates amount/recipient, so trust its response
    if (response.status === 200 && response.data.valid) {
      return {
        valid: true,
        transactionHash: response.data.transactionHash,
      };
    }

    return {
      valid: false,
      error: response.data.error || "Payment verification failed",
    };
  } catch (error: any) {
    console.error("x402 verification error:", error);
    
    // If facilitator is unavailable, fall back to mock verification
    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED" || error.message?.includes("ENOTFOUND")) {
      console.warn("⚠️ Facilitator unavailable, using mock verification");
      
      // Basic validation
      if (!paymentPayload.signature || !paymentPayload.message) {
        return {
          valid: false,
          error: "Invalid payment payload",
        };
      }

      // Check amount matches
      if (paymentPayload.amount !== expectedAmount) {
        return {
          valid: false,
          error: `Amount mismatch: expected ${expectedAmount}, got ${paymentPayload.amount}`,
        };
      }

      // Check recipient matches
      if (paymentPayload.recipient !== expectedRecipient) {
        return {
          valid: false,
          error: `Recipient mismatch: expected ${expectedRecipient}, got ${paymentPayload.recipient}`,
        };
      }

      // Mock successful verification
      console.log("✅ Mock payment verification successful");
      return {
        valid: true,
        transactionHash: `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    }
    
    return {
      valid: false,
      error: error.response?.data?.error || error.message || "Verification failed",
    };
  }
}

/**
 * Settle payment (optional - for batch settlements)
 */
export async function settlePayment(
  paymentPayload: PaymentPayload
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    const response = await axios.post(
      `${X402_FACILITATOR_URL}/settle`,
      {
        ...paymentPayload,
        network: `sui-${SUI_NETWORK}`,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    if (response.status === 200) {
      return {
        success: true,
        transactionHash: response.data.transactionHash,
      };
    }

    return {
      success: false,
      error: response.data.error || "Settlement failed",
    };
  } catch (error: any) {
    console.error("x402 settlement error:", error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || "Settlement failed",
    };
  }
}

