"use client";

import { useState, useEffect } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { api } from "@/lib/api";
import {
  Loader2,
  Music,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

interface PlayCreditsInfo {
  remainingPlays: number;
  totalPurchased: number;
  createdAt: string;
  updatedAt: string;
}

export function PlayCredits() {
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [credits, setCredits] = useState<PlayCreditsInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [numberOfPlays, setNumberOfPlays] = useState("10");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentRecipient, setPaymentRecipient] = useState<string>("");

  // Default price per play (can be made configurable)
  const PRICE_PER_PLAY = 0.01; // 0.01 SUI per play

  // Load backend wallet address and credits when account is available
  useEffect(() => {
    if (account?.address) {
      loadConfig();
      loadCredits();
    } else {
      setCredits(null);
    }
  }, [account?.address]);

  const loadConfig = async () => {
    try {
      const result = await api.getPublicConfig();
      if (result.success && result.config?.backendWalletAddress) {
        setPaymentRecipient(result.config.backendWalletAddress);
        console.log(
          "💰 Platform treasury address:",
          result.config.backendWalletAddress
        );
      } else {
        console.error("Failed to load backend wallet address");
      }
    } catch (err: any) {
      console.error("Error loading config:", err);
    }
  };

  const loadCredits = async () => {
    if (!account?.address) return;

    setLoading(true);
    setError(null);
    try {
      const result = await api.getPlayCredits(account.address);

      if (result.success && result.credits) {
        setCredits(result.credits);
      } else {
        setError(result.error || "Failed to load play credits");
      }
    } catch (err: any) {
      console.error("Error loading credits:", err);
      const errorMessage = err.message || "Failed to load play credits";
      if (
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("NetworkError")
      ) {
        setError(
          "Cannot connect to backend server. Please ensure it's running on http://localhost:3001"
        );
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!account?.address || refreshing) return;

    setRefreshing(true);
    setError(null);

    try {
      await loadCredits();
      setSuccess("Credits refreshed");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error refreshing credits:", err);
      setError(err.message || "Failed to refresh credits");
    } finally {
      setRefreshing(false);
    }
  };

  const handlePurchase = async () => {
    if (!account?.address) return;

    if (
      !paymentRecipient ||
      paymentRecipient === "0x0000000000000000000000000000000000000000"
    ) {
      setError(
        "Backend wallet address not configured. Please contact support."
      );
      return;
    }

    const plays = parseInt(numberOfPlays);
    if (isNaN(plays) || plays <= 0) {
      setError("Please enter a valid number of plays");
      return;
    }

    const totalAmount = plays * PRICE_PER_PLAY;

    setPurchasing(true);
    setError(null);
    setSuccess(null);

    try {
      // Create payment transaction
      const tx = new Transaction();
      const amountInMist = Math.floor(totalAmount * 1_000_000_000);

      // Split coin from gas
      const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)]);

      // Transfer to backend wallet (platform treasury)
      tx.transferObjects([coin], tx.pure.address(paymentRecipient));

      // Sign and execute transaction
      await new Promise<void>((resolve, reject) => {
        signAndExecuteTransaction(
          {
            transaction: tx,
          },
          {
            onSuccess: async (result: any) => {
              console.log("Purchase transaction successful:", result.digest);
              console.log(
                `💰 ${totalAmount} SUI sent to platform treasury: ${paymentRecipient}`
              );

              // Record purchase on backend
              try {
                const purchaseResult = await api.purchasePlayCredits(
                  account.address,
                  plays,
                  totalAmount,
                  result.digest
                );

                if (purchaseResult.success) {
                  setSuccess(`Successfully purchased ${plays} plays!`);
                  setNumberOfPlays("10");
                  await loadCredits();
                } else {
                  throw new Error(
                    purchaseResult.error || "Failed to record purchase"
                  );
                }
              } catch (purchaseError: any) {
                console.error("Failed to record purchase:", purchaseError);
                // Transaction succeeded but backend recording failed
                // Still show success but warn user
                setSuccess(
                  `Transaction successful but failed to update credits. Please refresh.`
                );
                setError("Please refresh your credits manually.");
              }

              resolve();
            },
            onError: (error: any) => {
              console.error("Purchase transaction failed:", error);
              reject(error);
            },
          }
        );
      });
    } catch (err: any) {
      console.error("Error purchasing credits:", err);
      setError(err.message || "Failed to purchase play credits");
    } finally {
      setPurchasing(false);
    }
  };

  if (!account) {
    return null;
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-[#4ade80]" />
          <h3 className="text-white font-semibold">Play Credits</h3>
        </div>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {credits ? (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Remaining Plays:</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold text-lg">
                  {credits.remainingPlays}
                </span>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
                  title="Refresh credits"
                >
                  {refreshing ? (
                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Total Purchased:</span>
              <span className="text-white">{credits.totalPurchased}</span>
            </div>
            {credits.remainingPlays === 0 && (
              <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-400">
                <AlertCircle className="w-3 h-3" />
                <span>
                  No credits remaining. Purchase more to continue listening.
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/10 space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Purchase Plays ({PRICE_PER_PLAY} SUI per play)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={numberOfPlays}
                  onChange={(e) => setNumberOfPlays(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4ade80]"
                  placeholder="10"
                  disabled={purchasing}
                />
                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="px-4 py-2 bg-[#4ade80] text-black rounded-lg font-medium hover:bg-[#22c55e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Purchasing...</span>
                    </>
                  ) : (
                    `Buy (${(
                      parseFloat(numberOfPlays) * PRICE_PER_PLAY
                    ).toFixed(4)} SUI)`
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-400 text-sm">
            {loading ? "Loading credits..." : "No credits found"}
          </p>
        </div>
      )}
    </div>
  );
}
