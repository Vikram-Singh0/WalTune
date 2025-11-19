"use client";

import { useState, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { api } from "@/lib/api";
import { Artist, Song } from "@/types";

export default function DashboardPage() {
  const account = useCurrentAccount();
  const router = useRouter();
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
      const response = await api.getArtistByWallet(account.address);
      if (response.success && response.data) {
        setArtist(response.data);
        loadSongs(response.data.id);
      } else {
        setShowRegister(true);
      }
    } catch (error) {
      setShowRegister(true);
    } finally {
      setLoading(false);
    }
  };

  const loadSongs = async (artistId: string) => {
    try {
      const response = await api.getSongsByArtist(artistId);
      if (response.success && response.data) {
        setSongs(response.data);
      }
    } catch (error) {
      console.error("Failed to load songs:", error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    try {
      const response = await api.registerArtist({
        walletAddress: account.address,
        name: artistName,
        bio: bio || undefined,
      });

      if (response.success && response.data) {
        setArtist(response.data);
        setShowRegister(false);
      } else {
        alert("Registration failed: " + response.error);
      }
    } catch (error) {
      alert("Registration failed");
      console.error(error);
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
      const formData = new FormData();
      formData.append("file", uploadForm.file);
      formData.append("title", uploadForm.title);
      formData.append("artistWallet", account.address);
      formData.append("pricePerPlay", uploadForm.pricePerPlay);
      formData.append("duration", uploadForm.duration.toString());
      if (uploadForm.genre) formData.append("genre", uploadForm.genre);

      const response = await api.uploadSong(formData);

      if (response.success && response.data) {
        alert("Song uploaded successfully!");
        setSongs([response.data, ...songs]);
        setShowUpload(false);
        setUploadForm({
          title: "",
          file: null,
          pricePerPlay: "0.01",
          duration: 0,
          genre: "",
        });
      } else {
        alert("Upload failed: " + response.error);
      }
    } catch (error) {
      alert("Upload failed");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Registration Form
  if (showRegister) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎤</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Become an Artist
              </h1>
              <p className="text-gray-600">
                Register to start uploading your music
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Artist Name *
                </label>
                <input
                  type="text"
                  required
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Your artist name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio (Optional)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Register as Artist
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Artist Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center text-4xl">
              🎤
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {artist?.name}
              </h1>
              {artist?.bio && (
                <p className="text-gray-600 mt-1">{artist.bio}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Wallet: {account?.address.slice(0, 10)}...
                {account?.address.slice(-8)}
              </p>
            </div>
            <button
              onClick={() => setShowUpload(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              + Upload Song
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">🎵</div>
            <div className="text-3xl font-bold text-gray-900">
              {songs.length}
            </div>
            <div className="text-gray-600">Total Songs</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">👁️</div>
            <div className="text-3xl font-bold text-gray-900">
              {songs.reduce((acc, song) => acc + song.totalPlays, 0)}
            </div>
            <div className="text-gray-600">Total Plays</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-3xl font-bold text-gray-900">
              {songs
                .reduce(
                  (acc, song) => acc + song.totalPlays * song.pricePerPlay,
                  0
                )
                .toFixed(4)}
            </div>
            <div className="text-gray-600">Total Earnings (SUI)</div>
          </div>
        </div>

        {/* Songs List */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Songs</h2>

          {songs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎵</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No songs yet
              </h3>
              <p className="text-gray-600 mb-6">
                Upload your first song to get started
              </p>
              <button
                onClick={() => setShowUpload(true)}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Upload Song
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {songs.map((song) => (
                <div
                  key={song.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
                >
                  <div className="w-16 h-16 bg-purple-100 rounded flex items-center justify-center shrink-0">
                    <span className="text-2xl">🎵</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {song.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {song.genre || "No genre"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-purple-600">
                      {song.pricePerPlay} SUI
                    </div>
                    <div className="text-sm text-gray-600">
                      {song.totalPlays} plays
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Upload New Song
                </h2>
                <button
                  onClick={() => setShowUpload(false)}
                  className="text-gray-400 hover:text-gray-600"
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

              <form onSubmit={handleUpload} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Song Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadForm.title}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, title: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter song title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Audio File (MP3, max 50MB) *
                  </label>
                  <input
                    type="file"
                    required
                    accept=".mp3"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {uploadForm.file && (
                    <p className="text-sm text-gray-600 mt-2">
                      {uploadForm.file.name} (
                      {Math.round((uploadForm.file.size / 1024 / 1024) * 100) /
                        100}{" "}
                      MB)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per Play (SUI) *
                  </label>
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Genre (Optional)
                  </label>
                  <input
                    type="text"
                    value={uploadForm.genre}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, genre: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Pop, Rock, Jazz"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading || !uploadForm.file}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? "Uploading..." : "Upload Song"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
