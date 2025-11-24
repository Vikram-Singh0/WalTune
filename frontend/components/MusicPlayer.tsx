"use client";

import { useState, useRef, useEffect } from "react";
import { Song } from "@/types";
import { getWalrusStreamUrl } from "@/lib/sui-config";
import {
  useCurrentAccount,
} from "@mysten/dapp-kit";
import {
  getStreamUrlWithPayment,
} from "@/lib/x402-client";
import { api } from "@/lib/api";
import { Loader2, AlertCircle, Wallet } from "lucide-react";

interface MusicPlayerProps {
  song: Song;
  onClose: () => void;
}

export function MusicPlayer({ song, onClose }: MusicPlayerProps) {
  const account = useCurrentAccount();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "authorizing" | "paying" | "paid" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const paymentInProgressRef = useRef(false); // Prevent duplicate payment executions

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Initialize payment authorization and stream URL
  useEffect(() => {
    // Always use backend endpoint (protected by x402)
    // Even without wallet, backend will handle it
    if (account?.address) {
      initializePayment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.address, song.id]);

  const initializePayment = async () => {
    if (!account) {
      setPaymentStatus("error");
      setErrorMessage("Please connect your wallet to play music");
      return;
    }
    
    // Prevent duplicate payment executions
    if (paymentInProgressRef.current) {
      console.log("⏸️ Payment already in progress, skipping...");
      return;
    }

    try {
      paymentInProgressRef.current = true;
      setPaymentStatus("paying");

      // Use play credits system
      console.log("💳 Using play credits for payment");
      
      // Use play credits payment
      const streamUrl = await getStreamUrlWithPayment(
        API_URL,
        song.id,
        null, // No authorization needed for play credits
        song.pricePerPlay,
        song.artistId,
        account.address, // Pass user address for play credits
        song.walrusBlobId // Pass Walrus blob ID for streaming
      );
      
      console.log("✅ Payment verified via play credits, stream URL:", streamUrl);
      setStreamUrl(streamUrl);
      setPaymentStatus("paid");

      // Play count is now recorded automatically by the backend when payment is verified
      console.log("✅ Play will be recorded on blockchain by backend middleware");
    } catch (error: any) {
      console.error("Payment initialization error:", error);
      setPaymentStatus("error");
      const errorMsg = error.message || "Payment required to stream this song.";
      // Check if it's a credits issue
      if (errorMsg.includes("credits") || errorMsg.includes("Insufficient")) {
        setErrorMessage("You don't have enough play credits. Please purchase credits to play songs.");
      } else {
        setErrorMessage(errorMsg);
      }
      setStreamUrl(null);
    } finally {
      paymentInProgressRef.current = false;
    }
  };


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !streamUrl) return;

    // Only auto-play if payment is successful
    if (paymentStatus !== "paid" && paymentStatus !== "idle") {
      return;
    }

    console.log("[MusicPlayer] Loading audio from:", streamUrl);

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleError = (e: Event) => {
      console.error("[MusicPlayer] Audio error:", e);
      console.error("[MusicPlayer] Audio error details:", audio.error);
      setIsPlaying(false);
    };
    const handleCanPlay = () => {
      console.log("[MusicPlayer] Audio can play, duration:", audio.duration);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", () => setIsPlaying(false));
    audio.addEventListener("error", handleError);
    audio.addEventListener("canplay", handleCanPlay);

    // Auto play when stream URL is ready
    if (paymentStatus === "paid") {
    audio
      .play()
      .then(() => {
        console.log("[MusicPlayer] Playing audio");
        setIsPlaying(true);
      })
      .catch((err) => {
        console.error("[MusicPlayer] Failed to play:", err);
        setIsPlaying(false);
      });
    }

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", () => setIsPlaying(false));
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [streamUrl, paymentStatus]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-white/10 shadow-2xl z-50 text-white">
      <audio
        ref={audioRef}
        src={streamUrl || undefined}
        crossOrigin="anonymous"
        preload="metadata"
      />

      <div className="container mx-auto px-4 py-4">
        {/* Payment Status Indicator */}
        {account && paymentStatus !== "paid" && paymentStatus !== "idle" && (
          <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
            {paymentStatus === "authorizing" && (
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Loader2 className="w-4 h-4 animate-spin text-[#4ade80]" />
                <span>Authorizing payment...</span>
              </div>
            )}
            {paymentStatus === "paying" && (
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Loader2 className="w-4 h-4 animate-spin text-[#4ade80]" />
                <span>Processing payment ({song.pricePerPlay} SUI)...</span>
              </div>
            )}
            {paymentStatus === "error" && (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-yellow-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>
                    {errorMessage || "Payment authorization not supported. Streaming without payment."}
                  </span>
                </div>
                <button
                  onClick={initializePayment}
                  className="text-xs px-3 py-1 bg-[#4ade80] text-black rounded-full hover:bg-[#22c55e] transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        )}

        {/* Payment Info */}
        {account && paymentStatus === "paid" && (
          <div className="mb-2 text-xs text-gray-500 text-center">
            {streamUrl?.includes("walrus") 
              ? `Streaming from Walrus • Payment via play credits`
              : "Loading stream..."}
          </div>
        )}
        {/* Progress Bar */}
        <div className="mb-4 group">
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#4ade80] hover:h-2 transition-all"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-6">
          {/* Song Info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-14 h-14 bg-gray-800 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-white/10">
              {song.coverImage ? (
                <img
                  src={song.coverImage}
                  alt={song.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl">🎵</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm truncate text-white">
                {song.title}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {song.artistName}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6">
            <button className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07l-1.41-1.41a3 3 0 000-4.24l1.41-1.41z" />
              </svg>
            </button>

            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-[#4ade80] text-black flex items-center justify-center hover:bg-[#22c55e] transition-all hover:scale-105 shadow-[0_0_15px_rgba(74,222,128,0.4)] shrink-0"
            >
              {isPlaying ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 ml-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>

            {/* Volume */}
            <div className="hidden sm:flex items-center gap-2 group/vol">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#4ade80]"
              />
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors shrink-0 ml-4"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
