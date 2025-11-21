"use client";

/**
 * Example Dashboard with Full Sui Integration
 * This shows how to integrate Sui blockchain transactions for artist registration and song upload
 * Copy patterns from here to update your actual dashboard/page.tsx
 */

import { useState, useEffect } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { useRouter } from "next/navigation";
import {
  createRegisterArtistTx,
  createRegisterSongTx,
} from "@/lib/sui-transactions";
import { WALRUS_PUBLISHER_URL } from "@/lib/sui-config";

export default function ExampleDashboardWithSui() {
  const account = useCurrentAccount();
  const router = useRouter();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const client = useSuiClient();

  const [artistName, setArtistName] = useState("");
  const [bio, setBio] = useState("");
  const [uploading, setUploading] = useState(false);

  // ===== ARTIST REGISTRATION WITH SUI =====
  const handleRegisterArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    try {
      // Create Sui transaction
      const tx = createRegisterArtistTx({
        name: artistName,
        bio: bio || "",
      });

      // Sign and execute transaction
      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log("✅ Artist registered on Sui blockchain:", result);
            alert("Artist registered successfully!");

            // The transaction creates an Artist object owned by your wallet
            // You can query it using client.getOwnedObjects()
          },
          onError: (error) => {
            console.error("❌ Artist registration failed:", error);
            alert("Registration failed: " + error.message);
          },
        }
      );
    } catch (error) {
      console.error("Transaction creation failed:", error);
      alert("Failed to create transaction");
    }
  };

  // ===== SONG UPLOAD WITH WALRUS + SUI =====
  const handleUploadSong = async (
    file: File,
    metadata: {
      title: string;
      pricePerPlay: number;
      duration: number;
      genre: string;
    }
  ) => {
    if (!account) return;

    setUploading(true);
    try {
      // Step 1: Upload audio file to Walrus
      console.log("📤 Uploading to Walrus...");
      const formData = new FormData();
      formData.append("file", file);

      const walrusResponse = await fetch(`${WALRUS_PUBLISHER_URL}/v1/store`, {
        method: "PUT",
        body: file,
      });

      if (!walrusResponse.ok) {
        throw new Error("Walrus upload failed");
      }

      const walrusData = await walrusResponse.json();
      const blobId =
        walrusData.newlyCreated?.blobObject?.blobId ||
        walrusData.alreadyCertified?.blobId;

      if (!blobId) {
        throw new Error("No blob ID returned from Walrus");
      }

      console.log("✅ Uploaded to Walrus, blob ID:", blobId);

      // Step 2: Register song on Sui blockchain with Walrus blob ID
      console.log("📝 Registering song on Sui blockchain...");
      const tx = createRegisterSongTx({
        title: metadata.title,
        artistId: account.address,
        artistName: artistName, // You'd get this from artist state
        walrusBlobId: blobId, // Link to Walrus storage
        pricePerPlay: metadata.pricePerPlay,
        duration: metadata.duration,
        genre: metadata.genre,
        coverImage: "",
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log("✅ Song registered on Sui blockchain:", result);
            alert("Song uploaded successfully!");

            // The song is now:
            // 1. Stored on Walrus (audio file)
            // 2. Registered on Sui (metadata + blob ID)
            // 3. Can be streamed at: https://aggregator.walrus-testnet.walrus.space/v1/{blobId}
          },
          onError: (error) => {
            console.error("❌ Song registration failed:", error);
            alert("Failed to register song on blockchain");
          },
        }
      );
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed: " + error);
    } finally {
      setUploading(false);
    }
  };

  // ===== QUERY ARTIST FROM BLOCKCHAIN =====
  const queryArtistObjects = async () => {
    if (!account) return;

    try {
      const ownedObjects = await client.getOwnedObjects({
        owner: account.address,
        options: {
          showType: true,
          showContent: true,
        },
      });

      // Filter for Artist objects
      const artistObjects = ownedObjects.data.filter((obj) =>
        obj.data?.type?.includes("::artist::Artist")
      );

      console.log("Artist objects owned by wallet:", artistObjects);
      return artistObjects;
    } catch (error) {
      console.error("Failed to query artist objects:", error);
    }
  };

  // ===== QUERY SONGS FROM BLOCKCHAIN =====
  const querySongObjects = async () => {
    if (!account) return;

    try {
      const ownedObjects = await client.getOwnedObjects({
        owner: account.address,
        options: {
          showType: true,
          showContent: true,
        },
      });

      // Filter for Song objects
      const songObjects = ownedObjects.data.filter((obj) =>
        obj.data?.type?.includes("::song_registry::Song")
      );

      console.log("Song objects owned by wallet:", songObjects);

      // Parse song data
      const songs = songObjects
        .map((obj) => {
          const content = obj.data?.content as any;
          if (content?.fields) {
            return {
              id: obj.data?.objectId,
              title: content.fields.title,
              walrusBlobId: content.fields.walrus_blob_id,
              pricePerPlay: content.fields.price_per_play / 1_000_000_000, // Convert MIST to SUI
              duration: content.fields.duration,
              genre: content.fields.genre,
              totalPlays: content.fields.total_plays,
              artistName: content.fields.artist_name,
            };
          }
          return null;
        })
        .filter(Boolean);

      return songs;
    } catch (error) {
      console.error("Failed to query song objects:", error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Example: Sui Integration</h1>

      {/* Artist Registration */}
      <div className="mb-12 p-6 bg-gray-900 rounded-lg">
        <h2 className="text-xl font-bold mb-4">
          1. Register Artist (On-chain)
        </h2>
        <form onSubmit={handleRegisterArtist} className="space-y-4">
          <input
            type="text"
            placeholder="Artist Name"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            className="w-full p-3 bg-black text-white rounded"
          />
          <textarea
            placeholder="Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full p-3 bg-black text-white rounded"
          />
          <button
            type="submit"
            disabled={!account}
            className="px-6 py-3 bg-green-500 text-black rounded font-bold disabled:opacity-50"
          >
            Register Artist on Sui
          </button>
        </form>
      </div>

      {/* Query Functions */}
      <div className="mb-12 p-6 bg-gray-900 rounded-lg">
        <h2 className="text-xl font-bold mb-4">2. Query Blockchain Data</h2>
        <div className="space-y-4">
          <button
            onClick={queryArtistObjects}
            className="px-6 py-3 bg-blue-500 text-white rounded font-bold"
          >
            Query My Artist Objects
          </button>
          <button
            onClick={querySongObjects}
            className="px-6 py-3 bg-purple-500 text-white rounded font-bold ml-4"
          >
            Query My Songs
          </button>
        </div>
        <p className="text-sm text-gray-400 mt-4">
          Check browser console for results
        </p>
      </div>

      {/* Upload Instructions */}
      <div className="p-6 bg-gray-900 rounded-lg">
        <h2 className="text-xl font-bold mb-4">3. Upload Song Flow</h2>
        <pre className="text-xs bg-black p-4 rounded overflow-x-auto">
          {`// Full upload flow:
const file = /* File from input */;
await handleUploadSong(file, {
  title: "My Song",
  pricePerPlay: 0.01,
  duration: 180,
  genre: "Rock"
});

// This will:
// 1. Upload audio to Walrus
// 2. Get blob ID
// 3. Register on Sui with blob ID
// 4. Song can be streamed from Walrus`}
        </pre>
      </div>
    </div>
  );
}
