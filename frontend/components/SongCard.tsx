"use client";

import { Song } from "@/types";

interface SongCardProps {
  song: Song;
  onPlay: (song: Song) => void;
}

export function SongCard({ song, onPlay }: SongCardProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer border border-white/5 hover:border-[#4ade80]/50">
      <div className="relative aspect-square bg-gradient-to-br from-gray-800 to-gray-900">
        {song.coverImage ? (
          <img
            src={song.coverImage}
            alt={song.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-700">
            <span className="text-6xl">🎵</span>
          </div>
        )}

        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay(song);
            }}
            className="w-16 h-16 rounded-full bg-[#4ade80] text-black flex items-center justify-center hover:bg-[#22c55e] transition-all transform hover:scale-110 shadow-[0_0_20px_rgba(74,222,128,0.5)]"
          >
            <svg
              className="w-8 h-8 ml-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-bold text-lg mb-1 truncate text-white" title={song.title}>
          {song.title}
        </h3>
        <p
          className="text-gray-400 text-sm mb-3 truncate"
          title={song.artistName}
        >
          {song.artistName}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500 border-t border-white/10 pt-3">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fillRule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
            {song.totalPlays} plays
          </span>
          <span className="font-bold text-[#4ade80] bg-[#4ade80]/10 px-2 py-1 rounded-full">
            {song.pricePerPlay} SUI
          </span>
        </div>

        {song.genre && (
          <div className="mt-3">
            <span className="inline-block px-2.5 py-1 bg-white/5 text-gray-300 text-xs rounded-full border border-white/10">
              {song.genre}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
