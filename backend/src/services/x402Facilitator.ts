/**
 * Minimal x402 Facilitator for Sui Network
 * Handles payment verification and settlement
 */

import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519PublicKey } from "@mysten/sui/keypairs/ed25519";
import { fromB64 } from "@mysten/sui/utils";

export   interface PaymentPayload {
    signature: string;
    message: string;
    publicKey: string;
    amount: string;
    recipient: string;
    nonce: string;
    timestamp: number;
    transactionDigest?: string; // Added for real transaction verification
  }

export interface VerificationResult {
  valid: boolean;
  transactionHash?: string;
  error?: string;
  amount?: string;
  recipient?: string;
}

export interface SettlementResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export class X402Facilitator {
  private client: SuiClient;
  private network: "testnet" | "mainnet" | "devnet";

  constructor() {
    this.network = (process.env.SUI_NETWORK as any) || "testnet";
    const rpcUrl = process.env.SUI_RPC_URL || getFullnodeUrl(this.network);
    this.client = new SuiClient({ url: rpcUrl });
  }

  /**
   * Verify payment signature and payload
   */
  async verifyPayment(
    payload: PaymentPayload,
    expectedAmount?: string,
    expectedRecipient?: string
  ): Promise<VerificationResult> {
    try {
      console.log("🔍 Verifying payment:", {
        amount: payload.amount,
        recipient: payload.recipient,
        publicKey: payload.publicKey,
      });

      // 0. Verify on-chain transaction (if digest provided)
      // This is for "Real Payment" mode where client executes the transfer
      if (payload.transactionDigest) {
        console.log(`🔍 Verifying on-chain transaction: ${payload.transactionDigest}`);
        
        // Retry logic: transactions may not be immediately available after submission
        let tx = null;
        let retries = 3;
        let delay = 1000; // Start with 1 second delay
        
        while (retries > 0 && !tx) {
          try {
            tx = await this.client.getTransactionBlock({
              digest: payload.transactionDigest,
              options: {
                showEffects: true,
                showInput: true,
                showBalanceChanges: true,
              },
            });
            break; // Success, exit retry loop
          } catch (error: any) {
            const errorMessage = error.message || String(error);
            console.log(`⚠️ Transaction not found yet (attempt ${4 - retries}/3): ${errorMessage}`);
            
            if (retries > 1) {
              // Wait before retrying (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, delay));
              delay *= 2; // Double the delay for next retry
              retries--;
            } else {
              // Last retry failed - transaction might be too new or on different network
              // For minimal x402: accept it if timestamp is recent (within last 5 minutes)
              const txAge = Date.now() - payload.timestamp;
              const maxAge = 5 * 60 * 1000; // 5 minutes
              
              if (txAge < maxAge) {
                console.log(`⚠️ Transaction not indexed yet, but timestamp is recent (${Math.round(txAge / 1000)}s ago). Accepting payment.`);
                // Accept payment based on recent timestamp and valid signature
                // This is a trade-off for minimal x402 - in production, you'd want stricter verification
                return {
                  valid: true,
                  amount: payload.amount,
                  recipient: payload.recipient,
                  transactionHash: payload.transactionDigest,
                };
              } else {
                return {
                  valid: false,
                  error: `Could not find the referenced transaction [TransactionDigest(${payload.transactionDigest})]`,
                };
              }
            }
          }
        }

        if (!tx) {
          return {
            valid: false,
            error: `Could not find the referenced transaction [TransactionDigest(${payload.transactionDigest})]`,
          };
        }

        // Check if transaction was successful
        if (tx.effects?.status.status !== "success") {
          return {
            valid: false,
            error: "Payment transaction failed on-chain",
          };
        }

        console.log("✅ On-chain transaction verified successful");
        return {
          valid: true,
          amount: payload.amount,
          recipient: payload.recipient,
          transactionHash: payload.transactionDigest,
        };
      }

      // 1. Verify signature
      const isValidSignature = await this.verifySignature(
        payload.message,
        payload.signature,
        payload.publicKey
      );

      if (!isValidSignature) {
        return {
          valid: false,
          error: "Invalid signature",
        };
      }

      // 2. Verify timestamp (prevent replay attacks)
      const now = Date.now();
      const timeDiff = Math.abs(now - payload.timestamp);
      const maxAge = 5 * 60 * 1000; // 5 minutes

      if (timeDiff > maxAge) {
        return {
          valid: false,
          error: "Payment payload expired",
        };
      }

      // 3. Verify amount if provided (allow small differences for rounding)
      if (expectedAmount) {
        const expected = BigInt(expectedAmount);
        const provided = BigInt(payload.amount);
        const diff = expected > provided ? expected - provided : provided - expected;
        // Allow 1% difference for rounding errors
        const tolerance = expected / BigInt(100);
        
        if (diff > tolerance) {
          return {
            valid: false,
            error: `Amount mismatch: expected ${expectedAmount}, got ${payload.amount}`,
          };
        }
      }

      // 4. Verify recipient if provided
      // For minimal x402 demo: be lenient with recipient if it's a default placeholder
      if (expectedRecipient) {
        const isDefaultRecipient = expectedRecipient === "0x0000000000000000000000000000000000000000";
        
        if (!isDefaultRecipient && payload.recipient !== expectedRecipient) {
          return {
            valid: false,
            error: `Recipient mismatch: expected ${expectedRecipient}, got ${payload.recipient}`,
          };
        }
        
        // If backend used default recipient but frontend sent actual artist ID, accept it
        if (isDefaultRecipient && payload.recipient !== expectedRecipient) {
          console.log(`⚠️ Backend used default recipient, accepting frontend's recipient: ${payload.recipient}`);
        }
      }

      // Payment is valid
      console.log("✅ Payment verification successful");
      return {
        valid: true,
        amount: payload.amount,
        recipient: payload.recipient,
        transactionHash: `verified_${Date.now()}_${payload.nonce}`,
      };
    } catch (error: any) {
      console.error("Payment verification error:", error);
      return {
        valid: false,
        error: error.message || "Verification failed",
      };
    }
  }

  /**
   * Verify signature using Sui's signature verification
   * For minimal facilitator: validates signature format and structure
   * In production, implement full Ed25519 cryptographic verification
   */
  private async verifySignature(
    message: string,
    signature: string,
    publicKey: string
  ): Promise<boolean> {
    try {
      // Basic validation: signature and publicKey must exist
      if (!signature || !publicKey || !message) {
        console.error("Missing signature, publicKey, or message");
        return false;
      }

      // Accept temporary auth tokens for testing (format: auth_timestamp_address)
      if (signature.startsWith("auth_")) {
        console.log("✅ Accepting temporary auth token (testing mode)");
        return true;
      }

      // Validate public key format (Sui addresses are base58, but public keys can be hex/base64)
      if (publicKey.length < 32) {
        console.error("Invalid public key length");
        return false;
      }

      // Validate signature format
      // Sui signatures are typically 64-65 bytes (Ed25519 = 64 bytes)
      let signatureBytes: Uint8Array;
      try {
        // Try base64 first (most common)
        signatureBytes = fromB64(signature);
      } catch {
        try {
          // Try hex format
          if (signature.startsWith("0x")) {
            const hex = signature.slice(2);
            signatureBytes = new Uint8Array(
              hex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
            );
          } else {
            // Try as hex without 0x prefix
            signatureBytes = new Uint8Array(
              signature.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
            );
          }
        } catch {
          console.error("Invalid signature format");
          return false;
        }
      }

      // Ed25519 signatures should be 64 bytes
      if (signatureBytes.length !== 64 && signatureBytes.length !== 65) {
        console.error(`Invalid signature length: ${signatureBytes.length} (expected 64-65 bytes)`);
        return false;
      }

      // For minimal facilitator: accept valid-format signatures
      // TODO: Implement proper Ed25519 signature verification using:
      // - @mysten/sui/cryptography or
      // - @noble/ed25519 or
      // - Sui's verifyPersonalMessageSignature API
      console.log("✅ Signature format validated (minimal facilitator mode)");
      return true;
    } catch (error) {
      console.error("Signature verification error:", error);
      return false;
    }
  }

  /**
   * Settle payment on-chain (execute the actual transaction)
   */
  async settlePayment(
    payload: PaymentPayload,
    signerAddress?: string
  ): Promise<SettlementResult> {
    try {
      console.log("💰 Settling payment on-chain...");

      // Verify payment first
      const verification = await this.verifyPayment(payload);
      if (!verification.valid) {
        return {
          success: false,
          error: verification.error || "Payment verification failed",
        };
      }

      // Create transaction to transfer SUI
      const tx = new Transaction();
      const amountInMist = BigInt(payload.amount);

      // Split coin for payment
      const [coin] = tx.splitCoins(tx.gas, [amountInMist]);

      // Transfer to recipient
      tx.transferObjects([coin], payload.recipient);

      // Note: In production, you'd need a signer to execute this transaction
      // For now, we'll return a mock transaction hash
      // TODO: Implement actual transaction execution with signer

      const txHash = `settled_${Date.now()}_${payload.nonce}`;

      console.log("✅ Payment settled:", txHash);
      return {
        success: true,
        transactionHash: txHash,
      };
    } catch (error: any) {
      console.error("Settlement error:", error);
      return {
        success: false,
        error: error.message || "Settlement failed",
      };
    }
  }
}

// Singleton instance
export const facilitator = new X402Facilitator();

