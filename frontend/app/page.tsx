"use client";

import { Header } from "@/components/Header";
import { useCurrentAccount } from "@mysten/dapp-kit";
import Link from "next/link";

export default function Home() {
  const account = useCurrentAccount();

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 to-blue-50">
      <Header />

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold text-gray-900">
              Decentralized Music Streaming
            </h2>
            <p className="text-xl text-gray-600">
              Pay-per-play music platform powered by Walrus storage and Sui
              blockchain
            </p>
          </div>

          {account ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
              <div className="text-left space-y-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  Welcome! 👋
                </h3>
                <p className="text-gray-600">
                  Your wallet is connected:{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                    {account.address.slice(0, 10)}...{account.address.slice(-8)}
                  </code>
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Link
                  href="/dashboard"
                  className="border-2 border-purple-200 rounded-xl p-6 hover:border-purple-400 transition-colors cursor-pointer"
                >
                  <div className="text-4xl mb-3">🎤</div>
                  <h4 className="font-bold text-lg mb-2">Artist Dashboard</h4>
                  <p className="text-gray-600 text-sm">
                    Upload songs, set prices, and track earnings
                  </p>
                </Link>

                <Link
                  href="/explore"
                  className="border-2 border-blue-200 rounded-xl p-6 hover:border-blue-400 transition-colors cursor-pointer"
                >
                  <div className="text-4xl mb-3">🎧</div>
                  <h4 className="font-bold text-lg mb-2">Explore Music</h4>
                  <p className="text-gray-600 text-sm">
                    Discover and stream decentralized music
                  </p>
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-12 space-y-6">
              <div className="text-6xl">🔒</div>
              <h3 className="text-2xl font-bold text-gray-900">
                Connect Your Wallet
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Connect your Sui wallet to start uploading music as an artist or
                exploring songs as a listener
              </p>
            </div>
          )}

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 pt-12">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="text-3xl mb-3">💰</div>
              <h4 className="font-bold mb-2">Fair Payments</h4>
              <p className="text-gray-600 text-sm">
                Artists earn directly with real-time micropayments
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="text-3xl mb-3">🌐</div>
              <h4 className="font-bold mb-2">Decentralized Storage</h4>
              <p className="text-gray-600 text-sm">
                Music stored on Walrus, secured forever
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="text-3xl mb-3">⚡</div>
              <h4 className="font-bold mb-2">No Subscriptions</h4>
              <p className="text-gray-600 text-sm">
                Pay only for what you listen to
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600 text-sm">
          <p>
            Built with Walrus + Sui Blockchain | Walrus Haulout Hackathon 2024
          </p>
        </div>
      </footer>
    </div>
  );
}
