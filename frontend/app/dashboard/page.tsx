"use client";

import { useState, useEffect } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { api } from "@/lib/api";
import { Artist, Song } from "@/types";
import {
  createRegisterArtistTx,
  createRegisterSongTx,
} from "@/lib/sui-transactions";
import { getWalrusStreamUrl, PACKAGE_ID } from "@/lib/sui-config";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic2,
  Upload,
  Music,
  PlayCircle,
  Wallet,
  Loader2,
  Plus,
  X,
  FileAudio,
  DollarSign,
  Music2,
  User,
} from "lucide-react";

export default function DashboardPage() {
  const account = useCurrentAccount();
  const router = useRouter();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const client = useSuiClient();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Registration form
  const [showRegister, setShowRegister] = useState(false);
  const [artistName, setArtistName] = useState("");
  const [bio, setBio] = useState("");

  // Upload form
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    file: null as File | null,
    pricePerPlay: "0.01",
    duration: 0,
    genre: "",
  });

  useEffect(() => {
    if (!account) {
      router.push("/");
      return;
    }
    checkArtist();
  }, [account, router]);

  const checkArtist = async () => {
    if (!account) return;

    try {
      // Query artist objects owned by wallet from Sui blockchain
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

      if (artistObjects.length > 0) {
        const artistObj = artistObjects[0];
        const content = artistObj.data?.content as any;

        if (content?.fields) {
          setArtist({
            id: artistObj.data?.objectId || "",
            walletAddress: account.address,
            name: content.fields.name,
            bio: content.fields.bio || "",
            createdAt: Number(content.fields.created_at) || 0,
          });
          loadSongs();
        } else {
          setShowRegister(true);
        }
      } else {
        setShowRegister(true);
      }
    } catch (error) {
      console.error("Failed to check artist:", error);
      setShowRegister(true);
    } finally {
      setLoading(false);
    }
  };

  const loadSongs = async () => {
    if (!account) return;

    try {
      console.log("🔍 Loading songs from Sui blockchain events...");
      console.log("📦 Using Package ID:", PACKAGE_ID);
      console.log("👤 Artist address:", account.address);

      // Query SongRegistered events to get all songs by this artist
      const events = await client.queryEvents({
        query: {
          MoveEventType: `${PACKAGE_ID}::song_registry::SongRegistered`,
        },
        limit: 50,
        order: "descending",
      });

      console.log("📝 Found total events:", events.data.length);

      // Filter for songs by this artist
      const artistSongIds = events.data
        .map((event: any) => event.parsedJson)
        .filter((fields: any) => fields && fields.artist_id === account.address)
        .map((fields: any) => fields.song_id);

      console.log("🎵 Found", artistSongIds.length, "songs by this artist");

      // Fetch actual Song objects to get current play counts
      const parsedSongs: Song[] = [];
      for (const songId of artistSongIds) {
        try {
          const songObject = await client.getObject({
            id: songId,
            options: {
              showContent: true,
              showType: true,
            },
          });

          const content = songObject.data?.content as any;
          if (content?.fields) {
            parsedSongs.push({
              id: songId,
              title: content.fields.title,
              artistId: content.fields.artist_id,
              artistName: content.fields.artist_name,
              walrusBlobId: content.fields.walrus_blob_id,
              pricePerPlay: Number(content.fields.price_per_play) / 1_000_000_000,
              duration: Number(content.fields.duration),
              genre: content.fields.genre || "Unknown",
              coverImage: content.fields.cover_image || "",
              totalPlays: Number(content.fields.total_plays) || 0, // ✅ Now fetching actual play count
              uploadedAt: Number(content.fields.uploaded_at) || 0,
              streamUrl: getWalrusStreamUrl(content.fields.walrus_blob_id),
            });
          }
        } catch (err) {
          console.error(`Failed to fetch song ${songId}:`, err);
        }
      }

      setSongs(parsedSongs);
      console.log("✅ Loaded your songs with play counts:", parsedSongs);
    } catch (error) {
      console.error("Failed to load songs:", error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    try {
      console.log("🔐 Creating artist registration transaction...");

      // Create Sui blockchain transaction
      const tx = createRegisterArtistTx({
        name: artistName,
        bio: bio || "",
      });

      // Sign and execute transaction
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log("✅ Artist registered on Sui blockchain:", result);
            alert("Artist registered successfully on blockchain!");
            setShowRegister(false);
            // Refresh to load artist data
            checkArtist();
          },
          onError: (error) => {
            console.error("❌ Registration failed:", error);
            alert("Registration failed: " + error.message);
          },
        }
      );
    } catch (error) {
      console.error("Transaction creation failed:", error);
      alert("Failed to create transaction");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".mp3")) {
        alert("Only MP3 files are supported");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        alert("File size must be less than 50MB");
        return;
      }

      // Get audio duration
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.onloadedmetadata = () => {
        setUploadForm({
          ...uploadForm,
          file,
          duration: Math.floor(audio.duration),
        });
        URL.revokeObjectURL(audio.src);
      };
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !artist || !uploadForm.file) return;

    setUploading(true);
    try {
      console.log("📤 Step 1: Uploading audio to Walrus...");
      console.log(
        "File size:",
        (uploadForm.file.size / 1024 / 1024).toFixed(2),
        "MB"
      );

      // Step 1: Upload audio file to Walrus using SDK
      // Dynamically import to avoid SSR issues with WASM
      const { uploadFileToWalrus } = await import("@/lib/walrus-utils");

      const { blobId } = await uploadFileToWalrus(
        uploadForm.file,
        undefined, // No wallet needed - HTTP method is used
        5 // Store for 5 epochs
      );

      if (!blobId) {
        throw new Error("No blob ID returned from Walrus");
      }

      console.log("✅ Uploaded to Walrus, blob ID:", blobId);
      console.log("🔐 Step 2: Registering song on Sui blockchain...");

      // Step 2: Register song metadata on Sui blockchain with Walrus blob ID
      const tx = createRegisterSongTx({
        title: uploadForm.title,
        artistId: account.address,
        artistName: artist.name,
        walrusBlobId: blobId, // Link to Walrus storage
        pricePerPlay: parseFloat(uploadForm.pricePerPlay),
        duration: uploadForm.duration,
        genre: uploadForm.genre || "Unknown",
        coverImage: "",
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log("✅ Song registered on Sui blockchain:", result);
            console.log("🎵 Stream URL:", getWalrusStreamUrl(blobId));
            alert(
              "Song uploaded successfully! Audio on Walrus, metadata on Sui."
            );
            setShowUpload(false);
            setUploadForm({
              title: "",
              file: null,
              pricePerPlay: "0.01",
              duration: 0,
              genre: "",
            });
            // Refresh songs list
            loadSongs();
          },
          onError: (error) => {
            console.error("❌ Song registration failed:", error);
            alert("Failed to register song on blockchain: " + error.message);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-12 h-12 text-[#4ade80] animate-spin" />
        </div>
      </div>
    );
  }

  // Registration Form
  if (showRegister) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <Navbar />
        <main className="container mx-auto px-4 pt-32 pb-12 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-xl"
          >
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-[#4ade80]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mic2 className="w-10 h-10 text-[#4ade80]" />
              </div>
              <h1 className="text-3xl font-bold mb-3">Become an Artist</h1>
              <p className="text-gray-400">
                Register to start uploading your music to WalTune
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Artist Name *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    required
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#4ade80]/50 focus:ring-1 focus:ring-[#4ade80]/50 transition-all"
                    placeholder="Your artist name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bio (Optional)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#4ade80]/50 focus:ring-1 focus:ring-[#4ade80]/50 transition-all resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-black py-4 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Register as Artist
              </button>
            </form>
          </motion.div>
        </main>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />

      <main className="container mx-auto px-6 pt-32 pb-16">
        {/* Artist Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-linear-to-r from-[#4ade80]/10 to-blue-500/10 border border-white/10 rounded-3xl p-8 mb-12 relative overflow-hidden"
        >
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 bg-[#4ade80]/20 rounded-full flex items-center justify-center border border-[#4ade80]/30">
              <Mic2 className="w-12 h-12 text-[#4ade80]" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold mb-2">{artist?.name}</h1>
              {artist?.bio && (
                <p className="text-gray-400 mb-4 max-w-2xl">{artist.bio}</p>
              )}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400 font-mono">
                <Wallet className="w-3 h-3" />
                {account?.address.slice(0, 6)}...{account?.address.slice(-4)}
              </div>
            </div>
            <button
              onClick={() => setShowUpload(true)}
              className="bg-[#4ade80] hover:bg-[#22c55e] text-black px-8 py-3 rounded-full font-bold transition-all hover:scale-105 flex items-center gap-2 shadow-lg shadow-[#4ade80]/20"
            >
              <Plus className="w-5 h-5" /> Upload Song
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            {
              label: "Total Songs",
              value: songs.length,
              icon: <Music className="w-6 h-6 text-blue-400" />,
              color: "bg-blue-500/10",
            },
            {
              label: "Total Plays",
              value: songs.reduce((acc, song) => acc + song.totalPlays, 0),
              icon: <PlayCircle className="w-6 h-6 text-[#4ade80]" />,
              color: "bg-[#4ade80]/10",
            },
            {
              label: "Total Earnings (SUI)",
              value: songs
                .reduce(
                  (acc, song) => acc + song.totalPlays * song.pricePerPlay,
                  0
                )
                .toFixed(4),
              icon: <DollarSign className="w-6 h-6 text-purple-400" />,
              color: "bg-purple-500/10",
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
            >
              <div
                className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mb-4`}
              >
                {stat.icon}
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Songs List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-8"
        >
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <Music2 className="w-6 h-6 text-[#4ade80]" /> My Songs
          </h2>

          {songs.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Music className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">No songs yet</h3>
              <p className="text-gray-500 mb-8">
                Upload your first song to start earning
              </p>
              <button
                onClick={() => setShowUpload(true)}
                className="text-[#4ade80] hover:text-[#22c55e] font-medium hover:underline"
              >
                Upload now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {songs.map((song, i) => (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-6 p-4 bg-black/20 border border-white/5 rounded-xl hover:bg-white/5 hover:border-white/10 transition-all group"
                >
                  <div className="w-16 h-16 bg-linear-to-br from-gray-800 to-black rounded-lg flex items-center justify-center shrink-0 border border-white/10 group-hover:border-[#4ade80]/30 transition-colors">
                    <Music className="w-8 h-8 text-gray-500 group-hover:text-[#4ade80] transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate mb-1">
                      {song.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">
                        {song.genre || "Unknown Genre"}
                      </span>
                      <span>•</span>
                      <span>
                        {Math.floor(song.duration / 60)}:
                        {(song.duration % 60).toString().padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-8">
                    <div>
                      <div className="font-bold text-[#4ade80]">
                        {song.pricePerPlay} SUI
                      </div>
                      <div className="text-xs text-gray-500">per play</div>
                    </div>
                    <div className="text-right min-w-20">
                      <div className="font-bold text-white">
                        {song.totalPlays}
                      </div>
                      <div className="text-xs text-gray-500">plays</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpload(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <Upload className="w-6 h-6 text-[#4ade80]" /> Upload New
                    Song
                  </h2>
                  <button
                    onClick={() => setShowUpload(false)}
                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleUpload} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Song Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={uploadForm.title}
                      onChange={(e) =>
                        setUploadForm({ ...uploadForm, title: e.target.value })
                      }
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#4ade80]/50 focus:ring-1 focus:ring-[#4ade80]/50 transition-all"
                      placeholder="Enter song title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Audio File (MP3, max 50MB) *
                    </label>
                    <div className="relative group">
                      <input
                        type="file"
                        required
                        accept=".mp3"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="bg-black/40 border border-dashed border-white/20 rounded-xl p-8 text-center group-hover:border-[#4ade80]/50 transition-colors">
                        {uploadForm.file ? (
                          <div className="flex items-center justify-center gap-3 text-[#4ade80]">
                            <FileAudio className="w-6 h-6" />
                            <span className="font-medium">
                              {uploadForm.file.name}
                            </span>
                            <span className="text-sm text-gray-500">
                              (
                              {Math.round(
                                (uploadForm.file.size / 1024 / 1024) * 100
                              ) / 100}{" "}
                              MB)
                            </span>
                          </div>
                        ) : (
                          <div className="text-gray-400">
                            <Upload className="w-8 h-8 mx-auto mb-3 text-gray-600 group-hover:text-[#4ade80] transition-colors" />
                            <p className="font-medium">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              MP3 files only
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Price per Play (SUI) *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="number"
                          required
                          step="0.001"
                          min="0"
                          value={uploadForm.pricePerPlay}
                          onChange={(e) =>
                            setUploadForm({
                              ...uploadForm,
                              pricePerPlay: e.target.value,
                            })
                          }
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#4ade80]/50 focus:ring-1 focus:ring-[#4ade80]/50 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Genre (Optional)
                      </label>
                      <input
                        type="text"
                        value={uploadForm.genre}
                        onChange={(e) =>
                          setUploadForm({
                            ...uploadForm,
                            genre: e.target.value,
                          })
                        }
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#4ade80]/50 focus:ring-1 focus:ring-[#4ade80]/50 transition-all"
                        placeholder="e.g., Pop, Rock"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={uploading || !uploadForm.file}
                    className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-black py-4 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {uploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />{" "}
                        Uploading...
                      </span>
                    ) : (
                      "Upload Song"
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
