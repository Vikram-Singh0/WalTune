// Artist Types
export interface Artist {
  id: string;
  walletAddress: string;
  name: string;
  bio?: string;
  profileImage?: string;
  createdAt: number;
}

// Song Types
export interface Song {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  walrusBlobId: string; // Walrus storage blob ID
  pricePerPlay: number;
  duration: number;
  genre?: string;
  coverImage?: string;
  uploadedAt: number;
  totalPlays: number;
  streamUrl?: string; // Computed from walrusBlobId
}

// Sui Transaction Types
export interface SuiSongData {
  title: string;
  artistId: string;
  artistName: string;
  walrusBlobId: string;
  pricePerPlay: number;
  duration: number;
  genre: string;
  coverImage: string;
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
