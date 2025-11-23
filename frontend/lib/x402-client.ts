/**
 * x402 Client for Sui Network
 * Handles seamless micropayments for music streaming
 */

import { useCurrentAccount, useSignAndExecuteTransaction, useSignMessage } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { SuiClient } from "@mysten/sui/client";
import { createPayForPlayTx } from "./sui-transactions";
import { api } from "./api";

export interface PaymentInstruction {
  amount: string; // Amount in MIST
  currency: string;
  recipient: string;
  network: string;
  facilitator: string;
}

export interface PaymentAuthorization {
  signature: string;
  message: string;
  publicKey: string;
  amount: string;
  recipient: string;
  nonce: string;
  timestamp: number;
  expiresAt: number; // Unix timestamp
  maxAmount?: string; // Maximum amount authorized (for "up to" scheme)
  transactionDigest?: string; // The actual transaction hash on-chain
}

export interface PlayCreditsInfo {
  remainingPlays: number;
  totalPurchased: number;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY_PREFIX = "x402_auth_";
const AUTHORIZATION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate nonce for payment
 */
function generateNonce(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create payment authorization message
 * User signs this once to authorize automatic payments
 */
export function createAuthorizationMessage(
  recipient: string,
  maxAmount: string, // Maximum total amount in MIST
  expiresAt: number
): string {
  return JSON.stringify({
    type: "x402_payment_authorization",
    recipient,
    maxAmount,
    expiresAt,
    network: "sui-testnet",
    timestamp: Date.now(),
  });
}

/**
 * Create payment payload for a specific payment
 */
export function createPaymentPayload(
  authorization: PaymentAuthorization,
  amount: string, // Amount in MIST for this specific payment
  recipient: string
): PaymentAuthorization {
  return {
    ...authorization,
    amount,
    recipient,
    nonce: generateNonce(),
    timestamp: Date.now(),
  };
}

/**
 * Store authorization in localStorage
 */
export function storeAuthorization(
  recipient: string,
  authorization: PaymentAuthorization
) {
  const key = `${STORAGE_KEY_PREFIX}${recipient}`;
  localStorage.setItem(key, JSON.stringify(authorization));
}

/**
 * Get stored authorization for recipient
 */
export function getStoredAuthorization(
  recipient: string
): PaymentAuthorization | null {
  const key = `${STORAGE_KEY_PREFIX}${recipient}`;
  const stored = localStorage.getItem(key);

  if (!stored) {
    return null;
  }

  try {
    const auth = JSON.parse(stored) as PaymentAuthorization;

    // Check if expired
    if (auth.expiresAt && Date.now() > auth.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    return auth;
  } catch (error) {
    console.error("Failed to parse stored authorization:", error);
    return null;
  }
}

/**
 * Clear authorization for recipient
 */
export function clearAuthorization(recipient: string) {
  const key = `${STORAGE_KEY_PREFIX}${recipient}`;
  localStorage.removeItem(key);
}

/**
 * Request payment authorization from user
 * This is a one-time signature that allows automatic payments
 */
export async function requestAuthorization(
  account: any,
  signMessage: (message: Uint8Array) => Promise<string>,
  recipient: string,
  maxAmountInSui: number = 1.0 // Default: authorize up to 1 SUI
): Promise<PaymentAuthorization | null> {
  try {
    const expiresAt = Date.now() + AUTHORIZATION_DURATION;
    const maxAmountInMist = Math.floor(maxAmountInSui * 1_000_000_000).toString();

    const message = createAuthorizationMessage(recipient, maxAmountInMist, expiresAt);

    // Sign message (convert string to Uint8Array for Sui)
    const messageBytes = new TextEncoder().encode(message);
    const signature = await signMessage(messageBytes);

    const authorization: PaymentAuthorization = {
      signature,
      message,
      publicKey: account.address,
      amount: "0", // Will be set per payment
      recipient,
      nonce: generateNonce(),
      timestamp: Date.now(),
      expiresAt,
      maxAmount: maxAmountInMist,
    };

    // Store authorization
    storeAuthorization(recipient, authorization);

    return authorization;
  } catch (error) {
    console.error("Authorization request failed:", error);
    return null;
  }
}

/**
 * Execute a real payment transaction on-chain
 */
export async function executePaymentTransaction(
  signAndExecuteTransaction: any,
  songId: string,
  amountInSui: number,
  recipient: string
): Promise<string> {
  const tx = new Transaction();
  const amountInMist = Math.floor(amountInSui * 1_000_000_000);

  // Create a Coin<SUI> with the specific amount
  const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)]);

  // Transfer it to the recipient
  tx.transferObjects([coin], tx.pure.address(recipient));

  return new Promise((resolve, reject) => {
    signAndExecuteTransaction(
      {
        transaction: tx,
      },
      {
        onSuccess: (result: any) => {
          console.log("Payment transaction successful:", result);
          resolve(result.digest);
        },
        onError: (error: any) => {
          console.error("Payment transaction failed:", error);
          reject(error);
        },
      }
    );
  });
}

/**
 * Make payment using stored authorization (or execute new transaction)
 */
export async function makePayment(
  authorization: PaymentAuthorization,
  amountInSui: number,
  recipient: string,
  signAndExecuteTransaction?: any, // Optional: if provided, will execute real tx
  songId?: string // Optional: needed for real tx
): Promise<PaymentAuthorization> {
  const amountInMist = Math.floor(amountInSui * 1_000_000_000).toString();

  let transactionDigest = "";

  // If signAndExecuteTransaction is provided, execute real on-chain payment
  if (signAndExecuteTransaction && songId) {
    try {
      console.log(`💸 Executing real payment of ${amountInSui} SUI to ${recipient}...`);
      transactionDigest = await executePaymentTransaction(
        signAndExecuteTransaction,
        songId,
        amountInSui,
        recipient
      );
      console.log(`✅ Payment executed. Digest: ${transactionDigest}`);
    } catch (error) {
      console.error("Failed to execute payment transaction:", error);
      throw error;
    }
  }

  // Create payment payload with the transaction digest
  const payload = createPaymentPayload(authorization, amountInMist, recipient);
  if (transactionDigest) {
    payload.transactionDigest = transactionDigest;
  }
  return payload;
}

/**
 * Create play credits payment payload
 */
export function createPlayCreditsPaymentPayload(
  userSuiAddress: string
): any {
  return {
    playCredits: true,
    userSuiAddress,
    nonce: generateNonce(),
    timestamp: Date.now(),
    // These fields are required by PaymentPayload interface but not used for play credits
    signature: "play_credits_payment",
    message: `play_credits_payment_${userSuiAddress}`,
    publicKey: userSuiAddress,
    amount: "0", // Not used for play credits
    recipient: "0x0000000000000000000000000000000000000000", // Not used for play credits
  };
}

/**
 * Request resource with x402 payment (using play credits)
 */
export async function requestWithPayment<T>(
  url: string,
  authorization: PaymentAuthorization | null,
  amountInSui: number,
  recipient: string,
  options: RequestInit = {},
  userSuiAddress?: string // Optional: if provided, use play credits
): Promise<T> {
  // First attempt without payment
  let response = await fetch(url, options);

  // If 402 Payment Required, handle payment
  if (response.status === 402) {
    const paymentData = await response.json();

    // Use play credits if userSuiAddress is provided
    if (userSuiAddress) {
      try {
        // Create play credits payment payload
        const paymentPayload = createPlayCreditsPaymentPayload(userSuiAddress);

        // Retry request with play credits payment header
        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            "X-PAYMENT": JSON.stringify(paymentPayload),
          },
        });

        if (response.status === 402) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Insufficient play credits");
        }

        if (!response.ok) {
          throw new Error(`Request failed: ${response.statusText}`);
        }

        return response.json() as T;
      } catch (error: any) {
        // Re-throw error - no fallback, play credits are required
        console.error("Play credits payment failed:", error);
        throw error;
      }
    } else {
      // Regular payment flow (fallback)
      if (!authorization) {
        throw new Error("PAYMENT_AUTHORIZATION_REQUIRED");
      }

      // Create payment payload
      const paymentPayload = await makePayment(
        authorization,
        amountInSui,
        recipient
      );

      // Retry request with payment header
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          "X-PAYMENT": JSON.stringify(paymentPayload),
        },
      });

      if (response.status === 402) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Payment verification failed");
      }
    }
  }

  if (!response.ok) {
    throw new Error(`Request failed: ${response.statusText}`);
  }

  return response.json() as T;
}

/**
 * Get stream URL with payment (using play credits)
 */
export async function getStreamUrlWithPayment(
  apiUrl: string,
  songId: string,
  authorization: PaymentAuthorization | null,
  amountInSui: number,
  recipient: string,
  userSuiAddress?: string, // Optional: if provided, use play credits
  walrusBlobId?: string // Optional: Walrus blob ID for streaming
): Promise<string> {
  // Build stream URL with optional walrusBlobId query parameter
  let streamUrl = `${apiUrl}/api/song/stream/${songId}`;
  if (walrusBlobId) {
    streamUrl += `?walrusBlobId=${encodeURIComponent(walrusBlobId)}`;
  }

  // Use play credits if userSuiAddress is provided
  if (userSuiAddress) {
    try {
      // Create play credits payment payload
      const paymentPayload = createPlayCreditsPaymentPayload(userSuiAddress);

      // Request with play credits payment
      let response = await fetch(streamUrl, {
        method: "GET",
        headers: {
          "X-PAYMENT": JSON.stringify(paymentPayload),
        },
      });

      // Handle 402 Payment Required
      if (response.status === 402) {
        let paymentData;
        try {
          paymentData = await response.json();
        } catch (e) {
          // If response is not JSON, use default message
          paymentData = { message: "Payment required" };
        }
        throw new Error(paymentData.message || "Insufficient play credits");
      }

      // Handle other non-ok responses
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: `Server error: ${response.status} ${response.statusText}` };
        }
        throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
      }

      // Handle successful response
      const data = await response.json();
      if (data.redirect) {
        return data.redirect;
      }

      throw new Error("Invalid response from server: missing redirect URL");
    } catch (error: any) {
      // Re-throw error - no fallback, play credits are required
      console.error("Play credits payment failed:", error);
      throw error;
    }
  }

  // Play credits are required - throw error if not provided
  throw new Error("Play credits are required. Please connect your wallet and purchase credits.");
}

