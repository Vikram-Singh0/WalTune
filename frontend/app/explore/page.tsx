"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
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
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Explore Music
          </h1>
          <p className="text-gray-600">
            Discover decentralized music from artists worldwide
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search songs or artists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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
            <div className="md:w-48">
              <select
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {genres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre === "all" ? "All Genres" : genre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Songs Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading songs...</p>
            </div>
          </div>
        ) : filteredSongs.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎵</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No songs found
            </h3>
            <p className="text-gray-600">
              {searchQuery || genreFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Be the first to upload a song!"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredSongs.map((song) => (
                <SongCard key={song.id} song={song} onPlay={handlePlay} />
              ))}
            </div>

            <div className="text-center mt-8 text-gray-600">
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
