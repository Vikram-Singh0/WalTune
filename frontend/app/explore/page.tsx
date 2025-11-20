"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { SongCard } from "@/components/SongCard";
import { MusicPlayer } from "@/components/MusicPlayer";
import { Song } from "@/types";
import { api } from "@/lib/api";

export default function ExplorePage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState<string>("all");

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    try {
      const response = await api.getAllSongs();
      if (response.success && response.data) {
        setSongs(response.data);
      }
    } catch (error) {
      console.error("Failed to load songs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = async (song: Song) => {
    setCurrentSong(song);
    // Record play
    try {
      await api.recordPlay(song.id);
    } catch (error) {
      console.error("Failed to record play:", error);
    }
  };

  const filteredSongs = songs.filter((song) => {
    const matchesSearch =
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artistName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = genreFilter === "all" || song.genre === genreFilter;
    return matchesSearch && matchesGenre;
  });

  const genres = [
    "all",
    ...new Set(songs.filter((s) => s.genre).map((s) => s.genre)),
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />

      <main className="container mx-auto px-6 pt-32 pb-16">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4">
            Explore Music
          </h1>
          <p className="text-gray-400 text-lg">
            Discover decentralized music from artists worldwide
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 p-6 mb-12">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search songs or artists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-3 pl-12 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#4ade80] focus:border-transparent text-white placeholder-gray-500"
                />
                <svg
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Genre Filter */}
            <div className="md:w-64">
              <select
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                className="w-full px-6 py-3 bg-black/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#4ade80] focus:border-transparent text-white appearance-none cursor-pointer"
              >
                {genres.map((genre) => (
                  <option key={genre} value={genre} className="bg-[#1a1a1a]">
                    {genre === "all" ? "All Genres" : genre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Songs Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#4ade80] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-gray-400">Loading songs...</p>
            </div>
          </div>
        ) : filteredSongs.length === 0 ? (
          <div className="text-center py-32 bg-[#1a1a1a] rounded-3xl border border-white/5">
            <div className="text-6xl mb-6">🎵</div>
            <h3 className="text-2xl font-bold text-white mb-3">
              No songs found
            </h3>
            <p className="text-gray-400">
              {searchQuery || genreFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Be the first to upload a song!"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {filteredSongs.map((song) => (
                <SongCard key={song.id} song={song} onPlay={handlePlay} />
              ))}
            </div>

            <div className="text-center mt-12 text-gray-500">
              Showing {filteredSongs.length} of {songs.length} songs
            </div>
          </>
        )}
      </main>

      {/* Music Player */}
      {currentSong && (
        <MusicPlayer song={currentSong} onClose={() => setCurrentSong(null)} />
      )}
    </div>
  );
}
