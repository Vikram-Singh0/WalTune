import { Song } from "@/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const api = {
  // Artist endpoints
  async registerArtist(data: {
    walletAddress: string;
    name: string;
    bio?: string;
  }) {
    const response = await fetch(`${API_URL}/api/artist/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async getArtistByWallet(walletAddress: string) {
    const response = await fetch(`${API_URL}/api/artist/${walletAddress}`);
    return response.json();
  },

  async getAllArtists() {
    const response = await fetch(`${API_URL}/api/artist/list/all`);
    return response.json();
  },

  // Song endpoints
  async uploadSong(formData: FormData) {
    const response = await fetch(`${API_URL}/api/song/upload`, {
      method: "POST",
      body: formData,
    });
    return response.json();
  },

  async getAllSongs() {
    const response = await fetch(`${API_URL}/api/song/all`);
    return response.json();
  },

  async getSongById(id: string) {
    const response = await fetch(`${API_URL}/api/song/${id}`);
    return response.json();
  },

  async recordPlay(id: string) {
    const response = await fetch(`${API_URL}/api/song/play/${id}`, {
      method: "POST",
    });
    return response.json();
  },

  async getSongsByArtist(artistId: string) {
    const response = await fetch(`${API_URL}/api/song/artist/${artistId}`);
    return response.json();
  },

  // Play credits endpoints
  async getPlayCredits(userSuiAddress: string) {
    const response = await fetch(
      `${API_URL}/api/play-credits?userSuiAddress=${encodeURIComponent(userSuiAddress)}`
    );
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || `HTTP ${response.status}` };
    }
    return data;
  },

  async purchasePlayCredits(
    userSuiAddress: string,
    numberOfPlays: number,
    amountInSui: number,
    transactionDigest: string,
    paymentPayload?: any
  ) {
    const response = await fetch(`${API_URL}/api/play-credits/purchase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userSuiAddress,
        numberOfPlays,
        amountInSui,
        transactionDigest,
        paymentPayload,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || `HTTP ${response.status}` };
    }
    return data;
  },
};
