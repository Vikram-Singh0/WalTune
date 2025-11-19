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
  walrusCID: string;
  pricePerPlay: number; // in SUI tokens
  duration: number; // in seconds
  genre?: string;
  coverImage?: string;
  uploadedAt: number;
  totalPlays: number;
}

// Upload Types
export interface UploadResponse {
  success: boolean;
  walrusCID?: string;
  blobId?: string;
  error?: string;
}

// Walrus Types
export interface WalrusUploadResult {
  newlyCreated?: {
    blobObject: {
      id: string;
      storedEpoch: number;
      blobId: string;
      size: number;
      erasureCodeType: string;
      certifiedEpoch: number;
      storage: {
        id: string;
        startEpoch: number;
        endEpoch: number;
        storageSize: number;
      };
    };
    encodedSize: number;
    cost: number;
  };
  alreadyCertified?: {
    blobId: string;
    event: {
      txDigest: string;
      eventSeq: string;
    };
    endEpoch: number;
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
