"use client";

import { Song } from "@/types";

interface SongCardProps {
  song: Song;
  onPlay: (song: Song) => void;
}

export function SongCard({ song, onPlay }: SongCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer">
      <div className="relative aspect-square bg-linear-to-br from-purple-100 to-blue-100">
        {song.coverImage ? (
          <img
            src={song.coverImage}
            alt={song.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl">🎵</span>
          </div>
        )}

        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={() => onPlay(song)}
            className="w-16 h-16 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition-colors transform hover:scale-110"
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

      <div className="p-4">
        <h3 className="font-bold text-lg mb-1 truncate" title={song.title}>
          {song.title}
        </h3>
        <p
          className="text-gray-600 text-sm mb-2 truncate"
          title={song.artistName}
        >
          {song.artistName}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fillRule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
            {song.totalPlays}
          </span>
          <span className="font-semibold text-purple-600">
            {song.pricePerPlay} SUI
          </span>
        </div>

        {song.genre && (
          <div className="mt-2">
            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              {song.genre}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
